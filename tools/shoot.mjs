// Renders the review screenshots, the share card (docs/og.png) and the app icon
// (docs/apple-touch-icon.png) in the headless browser of tools/cdp.mjs.
// Usage: node tools/shoot.mjs            (HEADLESS_SHELL=/path overrides the browser)
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { launch, pageUrl, root } from "./cdp.mjs";

const phone = { w: 390, h: 844, dpr: 2, mobile: true };
const shots = [
  { out: "review/home-desktop.png", w: 1440, h: 900, q: "?still" },
  { out: "review/home-desktop-dark.png", w: 1440, h: 900, q: "?still", dark: true },
  { out: "review/home-phone.png", ...phone, q: "?still" },
  { out: "review/three-desktop.png", w: 1440, h: 900, q: "?still#three" },
  { out: "review/three-phone.png", ...phone, q: "?still#three" },
  { out: "review/compare-phone.png", ...phone, q: "?still#compare" },
  { out: "review/whatdo-desktop.png", w: 1440, h: 900, q: "?still#whatdo" },
  { out: "review/whatdo-phone.png", ...phone, q: "?still#whatdo" },
  { out: "review/software-desktop.png", w: 1440, h: 900, q: "?still#software" },
  { out: "review/software-phone.png", ...phone, q: "?still#software" },
  { out: "review/math-desktop.png", w: 1440, h: 900, q: "?still#math" },
  { out: "review/math-phone.png", ...phone, q: "?still#math" },
  { out: "review/pricing-phone.png", ...phone, q: "?still#pricing" },
  { out: "review/terms-desktop.png", w: 1440, h: 900, q: "?still#terms" },
  { out: "review/owner-desktop.png", w: 1440, h: 900, q: "?still#owner" },
  { out: "review/owner-phone.png", ...phone, q: "?still#owner" },
  { out: "review/who-phone.png", ...phone, q: "?still#who" },
  { out: "review/name-desktop.png", w: 1440, h: 900, q: "?still#name" },
  { out: "review/full-desktop.png", w: 1440, h: 900, q: "?still", full: true },
  { out: "review/full-phone.png", ...phone, q: "?still", full: true },
  { out: "review/full-phone-dark.png", ...phone, q: "?still", full: true, dark: true },
  { out: "docs/og.png", w: 1200, h: 630, q: "?still&og" },
  { out: "docs/apple-touch-icon.png", w: 180, h: 180, q: "?still&icon" },
];

const browser = await launch();
for (const s of shots) {
  const tab = await browser.open(pageUrl + s.q, s);
  await tab.evaluate("location.hash && document.querySelector(location.hash).scrollIntoView()");
  const opts = { format: "png" };
  if (s.full) {
    const m = await tab.send("Page.getLayoutMetrics");
    opts.captureBeyondViewport = true;
    opts.clip = { x: 0, y: 0, width: s.w, height: Math.ceil(m.cssContentSize.height), scale: 1 };
  }
  const { data } = await tab.send("Page.captureScreenshot", opts);
  writeFileSync(join(root, s.out), Buffer.from(data, "base64"));
  await tab.close();
  console.log("wrote", s.out);
}
await browser.close();
