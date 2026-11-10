// The site's accessibility check; run it before each publish. It checks every page, the
// home page and each product page under docs/products/. axe-core checks WCAG 2.2
// A and AA plus best practice, in both colour schemes, at desktop, phone and 320 px
// widths. Then come the checks axe can't make: no sideways scrolling, a keyboard walk
// in which every stop shows our focus ring clear of the sticky header, the hero's
// pause button, reduced motion, and WCAG's text-spacing test.
// Usage: node tools/a11y.mjs [--page NAME] [--json FILE]   prints what fails and exits 1 on
// any failure. --page checks one page: home, irie, canopy or social.
// The first run fetches axe-core from jsDelivr into ~/Library/Caches/clinamen-site
// and checks it against the hash below.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { launch, pages as allPages } from "./cdp.mjs";

const AXE = { version: "4.10.2", sha256: "b511cd9dec01c76f4b2ad1723b66b6db37d4c2eb4ed199076e1829d9ee7b75e3" };
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

async function axeSource() {
  const dir = join(homedir(), "Library/Caches/clinamen-site");
  const file = join(dir, `axe-${AXE.version}.min.js`);
  if (!existsSync(file)) {
    const res = await fetch(`https://cdn.jsdelivr.net/npm/axe-core@${AXE.version}/axe.min.js`);
    if (!res.ok) throw new Error("could not fetch axe-core: HTTP " + res.status);
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  const src = readFileSync(file);
  const sum = createHash("sha256").update(src).digest("hex");
  if (sum !== AXE.sha256) throw new Error(`${file} has sha256 ${sum}, not ${AXE.sha256}: delete it and run again`);
  return src.toString();
}

const phone = { w: 390, h: 844, dpr: 2, mobile: true };
const views = [
  { name: "desktop", w: 1280, h: 800 },
  { name: "desktop dark", w: 1280, h: 800, dark: true },
  { name: "phone", ...phone },
  { name: "phone dark", ...phone, dark: true },
  { name: "320px", w: 320, h: 640, mobile: true },
];

const only = process.argv.indexOf("--page");
const pages = only > 0 ? allPages.filter((p) => p.name === process.argv[only + 1]) : allPages;
if (!pages.length) throw new Error(`no page called ${process.argv[only + 1]}: try ${allPages.map((p) => p.name).join(", ")}`);

// Page-side helpers: withHelpers(expr) evaluates expr where they are in scope.
const HELPERS = `
  const describe = (el) => {
    let s = el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + [...el.classList].map((c) => "." + c).join("");
    const text = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\\s+/g, " ");
    return text ? s + ' "' + text.slice(0, 40) + '"' : s;
  };
  const overflowing = () => {
    const vw = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth <= vw) return [];
    return [...document.querySelectorAll("body *")].filter((el) => {
      if (el.closest("[hidden], .skip, svg")) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && (r.right > vw + 1 || r.left < -1);
    }).map(describe).slice(0, 6);
  };
`;
const withHelpers = (expr) => `(() => { ${HELPERS} return (${expr}); })()`;

// Where focus is after a key press, once any scroll it set off has settled.
const LOOK = withHelpers(`new Promise((done) => {
  let y = -1;
  const settle = () => (scrollY === y ? done(look()) : ((y = scrollY), setTimeout(settle, 80)));
  const look = () => {
    const el = document.activeElement;
    if (!el || el === document.body || el === document.documentElement) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const header = document.querySelector("header");
    const points = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 2, r.top + 2], [r.right - 2, r.top + 2],
      [r.left + 2, r.bottom - 2], [r.right - 2, r.bottom - 2]];
    const hidden = points.filter(([x, z]) => {
      const hit = document.elementFromPoint(x, z);
      return !hit || (header && header.contains(hit) && !header.contains(el));
    }).length;
    return {
      what: describe(el),
      key: el.outerHTML.slice(0, 120) + "@" + [...document.querySelectorAll("*")].indexOf(el),
      size: r.width > 0 && r.height > 0,
      ring: cs.outlineStyle !== "none" && cs.outlineStyle !== "auto" && parseFloat(cs.outlineWidth) >= 2,
      hidden, // of 5 points, how many the sticky header covers or the viewport cuts off
    };
  };
  settle();
})`);

const failures = [];
const reviews = new Map(); // axe's "needs review" results: rule -> views
const fail = (view, what) => failures.push(`${view}: ${what}`);
const report = { views: {} };

const axe = await axeSource();
const browser = await launch();
for (const page of pages) for (const each of views) {
  const view = { ...each, name: `${page.name} ${each.name}` };
  const tab = await browser.open(page.url, view);
  const out = (report.views[view.name] = {});

  // axe-core
  await tab.evaluate(axe);
  const res = await tab.evaluate(`axe.run(document, {
    runOnly: { type: "tag", values: ${JSON.stringify(TAGS)} }, resultTypes: ["violations", "incomplete"],
  }).then((r) => {
    const brief = (list) => list.map((v) => ({ id: v.id, impact: v.impact, help: v.help,
      nodes: v.nodes.map((n) => ({ target: n.target.join(" "), summary: n.failureSummary })) }));
    return { violations: brief(r.violations), incomplete: brief(r.incomplete) };
  })`);
  out.axe = res;
  for (const v of res.violations) {
    const where = v.nodes.map((n) => n.target);
    fail(view.name, `axe ${v.id} (${v.impact}): ${v.help}: ${where.slice(0, 5).join(", ")}${where.length > 5 ? `, and ${where.length - 5} more` : ""}`);
  }
  for (const v of res.incomplete) reviews.set(v.id, [...(reviews.get(v.id) || []), view.name]);

  // Reflow: nothing wider than the screen.
  const wide = await tab.evaluate(withHelpers("overflowing()"));
  if (wide.length) fail(view.name, "the page scrolls sideways: " + wide.join(", "));

  // The keyboard walk: Tab from the top to the end, then Shift+Tab back, each stop with
  // our focus ring and clear of the sticky header (WCAG 2.4.7, 2.4.11). Smooth
  // scrolling is off for the walk, so each stop is measured where it comes to rest.
  await tab.send("Emulation.setFocusEmulationEnabled", { enabled: true });
  const padded = await tab.evaluate(`(() => {
    const header = document.querySelector("header");
    const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    return !header || getComputedStyle(header).position !== "sticky" || pad >= header.offsetHeight + 4;
  })()`);
  if (!padded) fail(view.name, "the sticky header is taller than html's scroll-padding-top, so focus can land under it");
  await tab.evaluate(`document.head.insertAdjacentHTML("beforeend", "<style id=walk>html { scroll-behavior: auto !important; }</style>");
    document.activeElement?.blur(); scrollTo(0, 0)`);
  const walks = (out.keyboard = { forward: [], back: [] });
  for (const [dir, modifiers] of [["forward", 0], ["back", 8]]) {
    const stops = walks[dir];
    for (let i = 0; i < 150; i++) {
      for (const type of ["keyDown", "keyUp"]) {
        await tab.send("Input.dispatchKeyEvent", { type, modifiers, key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
      }
      const stop = await tab.evaluate(LOOK);
      if (!stop || stops.some((s) => s.key === stop.key)) break;
      stops.push(stop);
      const where = `${stop.what}${dir === "back" ? " (Shift+Tab)" : ""}`;
      if (!stop.size) fail(view.name, `focus lands on something with no size: ${where}`);
      if (!stop.ring && dir === "forward") fail(view.name, `no focus ring of our own on ${where}`);
      if (stop.hidden === 5) fail(view.name, `focus is hidden (under the header or off screen): ${where}`);
    }
  }
  if (walks.forward.length < 5) fail(view.name, `the keyboard walk found only ${walks.forward.length} stops`);
  if (walks.back.length !== walks.forward.length) {
    fail(view.name, `Tab found ${walks.forward.length} stops but Shift+Tab ${walks.back.length}`);
  }
  await tab.evaluate("document.getElementById('walk').remove()");

  // The hero's motion: a pause button that stops it (WCAG 2.2.2).
  const motion = await tab.evaluate(`(() => {
    const running = () => document.getAnimations().filter((a) => a.playState === "running").length;
    const button = document.querySelector(".term-pause");
    const before = running();
    if (!button || button.hidden || !button.offsetWidth) return { before, button: false };
    button.click();
    const paused = running();
    const label = button.getAttribute("aria-label") || button.textContent;
    button.click();
    return { before, button: true, paused, label, again: running() };
  })()`);
  out.motion = motion;
  if (motion.before && !motion.button) fail(view.name, `${motion.before} animations run and there is no pause button`);
  if (motion.button && motion.paused) fail(view.name, `${motion.paused} animations still run after pause`);
  if (motion.button && !/play/i.test(motion.label)) fail(view.name, `the pause button doesn't offer play once paused (it says "${motion.label}")`);
  if (motion.button && motion.again !== motion.before) fail(view.name, "play didn't start the motion again");

  // Text spacing (WCAG 1.4.12): nothing clipped, nothing wider than the screen.
  const spaced = await tab.evaluate(withHelpers(`new Promise((done) => {
    const style = document.createElement("style");
    style.textContent = "* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }";
    document.head.append(style);
    requestAnimationFrame(() => setTimeout(() => {
      const clipped = [...document.querySelectorAll("body *")].filter((el) => {
        if (el.closest("[hidden], svg, .skip")) return false;
        const cs = getComputedStyle(el);
        if (cs.overflowX === "visible" && cs.overflowY === "visible") return false;
        if (el.clientWidth <= 1 && el.clientHeight <= 1) return false; // text for screen readers only
        return el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1;
      }).map(describe);
      const wide = overflowing();
      style.remove();
      done({ clipped, wide });
    }, 50));
  })`));
  if (spaced.clipped.length) fail(view.name, "text spacing clips " + spaced.clipped.join(", "));
  if (spaced.wide.length) fail(view.name, "text spacing makes the page scroll sideways: " + spaced.wide.join(", "));
  await tab.close();
}

// Reduced motion: nothing moves, nothing scrolls smoothly.
for (const page of pages) {
  const tab = await browser.open(page.url, { ...views[0], reducedMotion: true });
  const still = await tab.evaluate(`({
    running: document.getAnimations().filter((a) => a.playState === "running").length,
    scroll: getComputedStyle(document.documentElement).scrollBehavior,
  })`);
  (report.reducedMotion ||= {})[page.name] = still;
  if (still.running) fail(`${page.name} reduced motion`, `${still.running} animations still run`);
  if (still.scroll !== "auto") fail(`${page.name} reduced motion`, "scrolling is still smooth");
  await tab.close();
}
await browser.close();

const json = process.argv.indexOf("--json");
if (json > 0) writeFileSync(process.argv[json + 1], JSON.stringify(report, null, 2));
for (const [id, where] of reviews) console.log(`review: axe could not decide ${id} (${where.join(", ")})`);
if (failures.length) {
  console.log(failures.map((f) => "FAIL " + f).join("\n"));
  console.log(`${failures.length} failures`);
  process.exit(1);
}
console.log(`pass: axe (WCAG 2.2 AA), reflow, keyboard, motion and text spacing in ${views.length} views of ${pages.length} page${pages.length === 1 ? "" : "s"}`);
