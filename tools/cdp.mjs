// A headless Chromium over the DevTools protocol, with nothing installed: Playwright's
// cached headless shell, which lays out phone widths faithfully. No window is shown.
// shoot.mjs and a11y.mjs share it. HEADLESS_SHELL=/path overrides the browser.
import { spawn } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const pageUrl = "file://" + join(root, "docs/index.html");
// Every page of the site, for the checks, the screenshots and the files for AI agents. A new page goes
// here: its file under docs/ and the path it is served at.
export const pages = [
  { name: "home", file: "docs/index.html", path: "", url: pageUrl },
  ...["irie", "canopy", "social"].map((slug) => ({
    name: slug, file: `docs/products/${slug}/index.html`, path: `products/${slug}/`,
    url: "file://" + join(root, "docs/products", slug, "index.html"),
  })),
];

function findShell() {
  if (process.env.HEADLESS_SHELL) return process.env.HEADLESS_SHELL;
  const cache = join(homedir(), "Library/Caches/ms-playwright");
  const dir = readdirSync(cache).filter((n) => n.startsWith("chromium_headless_shell-")).sort().pop();
  if (!dir) throw new Error("no headless shell in " + cache + "; run: npx playwright install chromium-headless-shell");
  return join(cache, dir, "chrome-mac", "headless_shell");
}

// Starts the browser. open(url, view) loads url in a new tab at the view's size,
// { w, h, dpr, mobile, dark, reducedMotion }, and waits for the fonts. Any one call
// that takes longer than `timeout` ms fails, so a hung browser can't stall the run;
// the browser goes when the script exits, however it exits.
export async function launch({ timeout = 60000 } = {}) {
  const profile = mkdtempSync(join(tmpdir(), "clinamen-cdp-"));
  const chrome = spawn(findShell(), [
    "--headless", "--hide-scrollbars", "--remote-debugging-port=0", "--user-data-dir=" + profile, "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });
  process.on("exit", () => chrome.kill("SIGKILL"));
  const limit = (what, promise) => new Promise((ok, fail) => {
    const t = setTimeout(() => fail(new Error(`${what} took over ${timeout / 1000} s`)), timeout);
    promise.then((v) => { clearTimeout(t); ok(v); }, (e) => { clearTimeout(t); fail(e); });
  });

  const wsUrl = await new Promise((ok, fail) => {
    let buf = "";
    const t = setTimeout(() => fail(new Error("the browser printed no DevTools address")), 20000);
    chrome.stderr.on("data", (d) => {
      buf += d;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) { clearTimeout(t); ok(m[1]); }
    });
  });

  const ws = new WebSocket(wsUrl);
  await new Promise((ok) => ws.addEventListener("open", ok, { once: true }));
  let nextId = 0;
  const pending = new Map();
  const waiters = [];
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { ok, fail } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? fail(new Error(msg.error.message)) : ok(msg.result);
      return;
    }
    for (const w of [...waiters]) if (w.method === msg.method && w.sessionId === msg.sessionId) {
      waiters.splice(waiters.indexOf(w), 1);
      w.ok(msg.params);
    }
  });
  const send = (method, params = {}, sessionId) => limit(method, new Promise((ok, fail) => {
    const id = ++nextId;
    pending.set(id, { ok, fail });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  }));
  const next = (method, sessionId) => limit(method, new Promise((ok) => waiters.push({ method, sessionId, ok })));

  async function open(url, view) {
    const { targetId } = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
    const tab = {
      send: (method, params) => send(method, params, sessionId),
      async evaluate(expression) {
        const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, sessionId);
        if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
        return r.result.value;
      },
      close: () => send("Target.closeTarget", { targetId }),
    };
    await tab.send("Page.enable");
    await tab.send("Emulation.setDeviceMetricsOverride", {
      width: view.w, height: view.h, deviceScaleFactor: view.dpr || 1, mobile: !!view.mobile,
    });
    await tab.send("Emulation.setEmulatedMedia", {
      features: [
        { name: "prefers-color-scheme", value: view.dark ? "dark" : "light" },
        { name: "prefers-reduced-motion", value: view.reducedMotion ? "reduce" : "no-preference" },
      ],
    });
    const loaded = next("Page.loadEventFired", sessionId);
    await tab.send("Page.navigate", { url });
    await loaded;
    await tab.evaluate("document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 400)))");
    return tab;
  }

  async function close() {
    ws.close();
    const gone = new Promise((ok) => chrome.once("exit", ok));
    chrome.kill();
    await gone;
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* the browser may still be letting go */ }
  }

  return { open, close };
}
