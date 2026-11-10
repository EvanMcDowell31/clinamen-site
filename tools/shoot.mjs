// Renders the review screenshots, the share card (docs/og.png) and the app icon
// (docs/apple-touch-icon.png) with Playwright's cached headless Chromium shell,
// over the DevTools protocol. Nothing is installed and no window is shown.
// Usage: node tools/shoot.mjs            (HEADLESS_SHELL=/path overrides the browser)
import { spawn } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const page = "file://" + join(root, "docs/index.html");

function findShell() {
  if (process.env.HEADLESS_SHELL) return process.env.HEADLESS_SHELL;
  const cache = join(homedir(), "Library/Caches/ms-playwright");
  const dir = readdirSync(cache).filter((n) => n.startsWith("chromium_headless_shell-")).sort().pop();
  if (!dir) throw new Error("no headless shell in " + cache + "; run: npx playwright install chromium-headless-shell");
  return join(cache, dir, "chrome-mac", "headless_shell");
}

const phone = { w: 390, h: 844, dpr: 2, mobile: true };
const shots = [
  { out: "review/home-desktop.png", w: 1440, h: 900, q: "?still" },
  { out: "review/home-desktop-dark.png", w: 1440, h: 900, q: "?still", dark: true },
  { out: "review/home-phone.png", ...phone, q: "?still" },
  { out: "review/three-desktop.png", w: 1440, h: 900, q: "?still#three" },
  { out: "review/three-phone.png", ...phone, q: "?still#three" },
  { out: "review/compare-phone.png", ...phone, q: "?still#compare" },
  { out: "review/offers-phone.png", ...phone, q: "?still#offers" },
  { out: "review/terms-desktop.png", w: 1440, h: 900, q: "?still#terms" },
  { out: "review/owner-desktop.png", w: 1440, h: 900, q: "?still#owner" },
  { out: "review/owner-phone.png", ...phone, q: "?still#owner" },
  { out: "review/name-desktop.png", w: 1440, h: 900, q: "?still#name" },
  { out: "review/full-desktop.png", w: 1440, h: 900, q: "?still", full: true },
  { out: "review/full-phone.png", ...phone, q: "?still", full: true },
  { out: "review/full-phone-dark.png", ...phone, q: "?still", full: true, dark: true },
  { out: "docs/og.png", w: 1200, h: 630, q: "?still&og" },
  { out: "docs/apple-touch-icon.png", w: 180, h: 180, q: "?still&icon" },
];

const profile = mkdtempSync(join(tmpdir(), "clinamen-shoot-"));
const chrome = spawn(findShell(), [
  "--headless", "--hide-scrollbars", "--remote-debugging-port=0", "--user-data-dir=" + profile, "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
const killer = setTimeout(() => { chrome.kill("SIGKILL"); console.error("timed out"); process.exit(1); }, 120000);

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
const send = (method, params = {}, sessionId) => new Promise((ok, fail) => {
  const id = ++nextId;
  pending.set(id, { ok, fail });
  ws.send(JSON.stringify({ id, method, params, sessionId }));
});
const next = (method, sessionId) => new Promise((ok) => waiters.push({ method, sessionId, ok }));

for (const s of shots) {
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Page.enable", {}, sessionId);
  await send("Emulation.setDeviceMetricsOverride", {
    width: s.w, height: s.h, deviceScaleFactor: s.dpr || 1, mobile: !!s.mobile,
  }, sessionId);
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-color-scheme", value: s.dark ? "dark" : "light" }],
  }, sessionId);
  const loaded = next("Page.loadEventFired", sessionId);
  await send("Page.navigate", { url: page + s.q }, sessionId);
  await loaded;
  // Wait for the fonts, then scroll to the anchor if there is one.
  await send("Runtime.evaluate", {
    awaitPromise: true,
    expression: `document.fonts.ready.then(() => new Promise((r) => setTimeout(r, 400))).then(() => {
      if (location.hash) document.querySelector(location.hash).scrollIntoView();
    })`,
  }, sessionId);
  const opts = { format: "png" };
  if (s.full) {
    const m = await send("Page.getLayoutMetrics", {}, sessionId);
    opts.captureBeyondViewport = true;
    opts.clip = { x: 0, y: 0, width: s.w, height: Math.ceil(m.cssContentSize.height), scale: 1 };
  }
  const { data } = await send("Page.captureScreenshot", opts, sessionId);
  writeFileSync(join(root, s.out), Buffer.from(data, "base64"));
  await send("Target.closeTarget", { targetId });
  console.log("wrote", s.out);
}

clearTimeout(killer);
ws.close();
const gone = new Promise((ok) => chrome.once("exit", ok));
chrome.kill();
await gone;
try { rmSync(profile, { recursive: true, force: true }); } catch { /* the browser may still be letting go */ }
