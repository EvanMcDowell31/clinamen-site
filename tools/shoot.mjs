// Renders everything the page and its reviewers need, in the headless browser of tools/cdp.mjs.
// Nothing is installed and no window is shown. In order:
//   1. the two figures in tools/figures.html, light and dark, as WebP in docs/img (search engines index
//      pictures, not inline SVG);
//   2. the icons from docs/favicon.svg: docs/favicon.ico (16, 32 and 48 px) and the logo for search
//      results, docs/img/cli-n-amen-co-logo.png (512 px);
//   3. the review screenshots, the share card, the app icon and "this site on a phone";
//   4. the files for AI agents and search engines, with their checks (tools/agent.mjs).
// Usage: node tools/shoot.mjs           all of it (about 2 minutes)
//        node tools/shoot.mjs --text    only step 4 (seconds)
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { launch, pageUrl, root } from "./cdp.mjs";
import { writeAgentFiles } from "./agent.mjs";

const fileUrl = (p) => pathToFileURL(join(root, p)).href;
const textOnly = process.argv.includes("--text");

const figures = [
  { sel: "#venn", out: "docs/img/cheap-fast-good-venn-diagram-pick-three.webp", dpr: 3 },
  { sel: "#venn", out: "docs/img/cheap-fast-good-venn-diagram-pick-three-dark.webp", dpr: 3, dark: true },
  { sel: "#fig1", out: "docs/img/clinamen-swerve-diagram.webp", dpr: 4 },
  { sel: "#fig1", out: "docs/img/clinamen-swerve-diagram-dark.webp", dpr: 4, dark: true },
];

const phone = { w: 390, h: 844, dpr: 2, mobile: true };
const shots = [
  { out: "review/home-desktop.png", w: 1440, h: 900, q: "?still" },
  { out: "review/home-desktop-dark.png", w: 1440, h: 900, q: "?still", dark: true },
  { out: "review/home-phone.png", ...phone, q: "?still" },
  { out: "review/home-phone-dark-chosen.png", ...phone, q: "?still&theme=dark" },
  { out: "review/home-desktop-light-chosen.png", w: 1440, h: 900, q: "?still&theme=light", dark: true },
  { out: "review/three-desktop.png", w: 1440, h: 900, q: "?still#three" },
  { out: "review/three-phone.png", ...phone, q: "?still#three" },
  { out: "review/three-phone-dark.png", ...phone, q: "?still#three", dark: true },
  { out: "review/three-phone-dark-chosen.png", ...phone, q: "?still&theme=dark#three" },
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
  { out: "review/name-phone-dark.png", ...phone, q: "?still#name", dark: true },
  { out: "review/faq-desktop.png", w: 1440, h: 900, q: "?still#faq" },
  { out: "review/faq-phone.png", ...phone, q: "?still#faq" },
  { out: "review/foot-desktop.png", w: 1440, h: 900, q: "?still#book" },
  { out: "review/nav-tablet.png", w: 820, h: 300, q: "?still" },
  { out: "review/full-desktop.png", w: 1440, h: 900, q: "?still", full: true },
  { out: "review/full-phone.png", ...phone, q: "?still", full: true },
  { out: "review/full-phone-dark.png", ...phone, q: "?still", full: true, dark: true },
  { out: "docs/img/ai-for-your-business-one-chore-at-a-time.png", w: 1200, h: 630, q: "?still&og" },
  { out: "docs/apple-touch-icon.png", w: 180, h: 180, q: "?still&icon" },
  { out: "docs/img/small-business-website-on-a-phone.webp", ...phone, q: "?still", webp: 80 },
];

// An .ico file that holds PNGs, which every browser since 2009 reads.
function ico(pngs) {
  const head = Buffer.alloc(6);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(pngs.length, 4);
  const dir = Buffer.alloc(16 * pngs.length);
  let offset = head.length + dir.length;
  pngs.forEach(({ size, png }, i) => {
    const o = 16 * i;
    dir.writeUInt8(size % 256, o);
    dir.writeUInt8(size % 256, o + 1);
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(png.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += png.length;
  });
  return Buffer.concat([head, dir, ...pngs.map((p) => p.png)]);
}

const shoot = async (tab, opts) => Buffer.from((await tab.send("Page.captureScreenshot", opts)).data, "base64");
const save = (out, buf) => { writeFileSync(join(root, out), buf); console.log("wrote", out); };

const browser = await launch();
let failed = false;
try {
  if (!textOnly) {
    mkdirSync(join(root, "docs/img"), { recursive: true });

    for (const f of figures) {
      const tab = await browser.open(fileUrl("tools/figures.html"), { w: 900, h: 700, dpr: f.dpr, dark: f.dark });
      await tab.send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
      await tab.evaluate("document.body.style.background = 'transparent'");
      const clip = await tab.evaluate(`(() => { const r = document.querySelector(${JSON.stringify(f.sel)}).getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height, scale: 1 }; })()`);
      save(f.out, await shoot(tab, { format: "webp", quality: 92, clip, captureBeyondViewport: true }));
      await tab.close();
    }

    const icon = async (size) => {
      const tab = await browser.open(fileUrl("docs/favicon.svg"), { w: size, h: size });
      await tab.send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
      const png = await shoot(tab, { format: "png" });
      await tab.close();
      return { size, png };
    };
    save("docs/favicon.ico", ico([await icon(16), await icon(32), await icon(48)]));
    save("docs/img/cli-n-amen-co-logo.png", (await icon(512)).png);

    for (const s of shots) {
      const tab = await browser.open(pageUrl + s.q, s);
      await tab.evaluate("location.hash && document.querySelector(location.hash).scrollIntoView()");
      const opts = s.webp ? { format: "webp", quality: s.webp } : { format: "png" };
      if (s.full) {
        const m = await tab.send("Page.getLayoutMetrics");
        opts.captureBeyondViewport = true;
        opts.clip = { x: 0, y: 0, width: s.w, height: Math.ceil(m.cssContentSize.height), scale: 1 };
      }
      save(s.out, await shoot(tab, opts));
      await tab.close();
    }
  }
  await writeAgentFiles(browser);
} catch (e) {
  console.error(e.message);
  failed = true;
}
await browser.close();
process.exit(failed ? 1 : 0);
