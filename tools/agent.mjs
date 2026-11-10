// Writes the files for AI agents and search engines from the page itself, so they never drift from it:
//   docs/index.html.md   the whole page as Markdown (llmstxt.org's convention: a page's text twin at URL + .md)
//   docs/llms-full.txt   the same text, under the name AI tools look for
//   docs/llms.txt        a short guide for AI agents: what the firm is, the offers and prices, where to look
//   docs/sitemap.xml     the page and every picture on it (Google's image sitemap)
// Then it checks what the page repeats elsewhere: the JSON-LD parses; every price in the JSON-LD, the
// meta descriptions, the FAQ and site.js is one the page shows; every picture has alt text, a size and
// a file behind it; the dates agree; and the tools site.js gives AI agents in the browser (WebMCP)
// register and answer, tried against a stand-in for the browser's API. A failed check stops with the list.
// Usage: node tools/agent.mjs   (node tools/shoot.mjs runs it as its last step)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { launch, pageUrl, root } from "./cdp.mjs";

// Runs inside the page. It must not use anything from this module's scope.
function extract() {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const base = $('link[rel="canonical"]').href;
  const abs = (h) => (/^(https?:|mailto:|tel:)/.test(h) ? h : new URL(h, base).href);
  const css = (el) => getComputedStyle(el);
  const shown = (el) => !el.closest('[aria-hidden="true"], [hidden], script, style, template, noscript, .skip') && css(el).display !== "none";
  const flexy = (el) => el.nodeType === 1 && /flex|grid/.test(css(el).display);
  const tidy = (s) => (s || "").replace(/[ \t ]+/g, " ").replace(/ *\n */g, "\n").replace(/ +([,.;:!?])/g, "$1").trim();
  const brandText = (el) => [...el.children].map((e) => e.textContent.trim()).filter(Boolean).join(" ");
  $$("details").forEach((d) => { d.open = true; });

  // Inline content to Markdown: links, bold, italics, strikes, code; flex and grid rows joined with " · ".
  function inline(node) {
    const parts = [];
    for (const c of node.childNodes) {
      if (c.nodeType === 3) { parts.push(c.textContent); continue; }
      if (c.nodeType !== 1 || !shown(c)) continue;
      const t = c.tagName.toUpperCase();
      if (["SVG", "INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(t)) continue;
      const inner = () => (c.classList.contains("brand") || c.classList.contains("brand-inline") ? brandText(c) : tidy(inline(c)));
      let s;
      if (t === "A") {
        const x = inner(), h = c.getAttribute("href") || "";
        s = !x ? "" : (h && h !== "#top" ? `[${x}](${abs(h)})` : x);
      } else if (t === "B" || t === "STRONG") { const x = inner(); s = x ? `**${x}**` : ""; }
      else if (t === "I" || t === "EM" || t === "CITE") { const x = inner(); s = x ? `*${x}*` : ""; }
      else if (t === "S" || t === "DEL") { const x = inner(); s = x ? `~~${x}~~` : ""; }
      else if (t === "CODE") s = "`" + c.textContent.trim() + "`";
      else if (t === "BR") s = "\n";
      else if (t === "IMG") s = c.alt ? `![${c.alt}](${abs(c.getAttribute("src"))})` : "";
      else s = inner();
      const block = css(c).display !== "inline";
      // A block inside a paragraph is a second line of it, such as a standard price under a founding one.
      if (block && node.tagName === "P" && s.trim() && tidy(parts.join(""))) s = " · " + s;
      if (!flexy(node) && (block || /\bb-(cli|n|amen|co)\b/.test(c.className))) s = " " + s + " ";
      parts.push(s);
    }
    if (flexy(node)) return parts.map(tidy).filter(Boolean).join(" · ");
    return parts.join("");
  }
  const text = (el) => (el ? tidy(inline(el)) : "");

  const out = [];
  let kicker = "", label = "";
  function walk(el) {
    for (const c of el.children) {
      if (!shown(c)) continue;
      const t = c.tagName.toUpperCase();
      if (c.classList.contains("kicker")) { kicker = text(c); continue; }
      if (c.classList.contains("lbl")) { label = text(c); continue; }
      if (c.classList.contains("headword")) {
        const part = (k) => text($("." + k, c));
        const ipa = $(".ipa [aria-hidden]", c), say = $(".ipa .sr-only", c);
        const sound = [ipa && ipa.textContent.trim(), say && `(${text(say).replace(/^pronounced /, "")})`].filter(Boolean).join(" ") || part("ipa");
        out.push([`**${part("hw")}** ${sound}`, part("pos") && `*${part("pos")}*`, part("pl")].filter(Boolean).join(", "));
        continue;
      }
      if (c.classList.contains("sayit")) {
        out.push(`**${text($(".label", c))}:** ${brandText($(".brand-inline", c))}. ${text($(".gloss", c))}`);
        continue;
      }
      if (/^H[1-6]$/.test(t)) {
        let h = text(c);
        if (kicker && (t === "H1" || t === "H2")) h = kicker.replace(/[.:]$/, "") + ": " + h;
        if (label && (t === "H3" || t === "H4")) h = label + ": " + h;
        kicker = label = "";
        out.push("#".repeat(t === "H1" ? 2 : +t[1]) + " " + h);
      } else if (t === "P" || t === "OUTPUT") { const x = text(c); if (x) out.push(x); }
      else if (t === "UL" || t === "OL") list(c, t === "OL");
      else if (t === "DL") dl(c);
      else if (t === "TABLE") table(c);
      else if (t === "BLOCKQUOTE") quote(c);
      else if (t === "FIGURE") figure(c);
      else if (t === "DETAILS") details(c);
      else if (t === "FORM") form(c);
      else if (t !== "SVG" && t !== "PICTURE" && t !== "IMG") walk(c);
    }
  }
  function item(li) {
    const kids = [...li.children].filter((c) => shown(c) && c.tagName.toUpperCase() !== "SVG");
    if (!kids.some((c) => /^(H\d|P|DIV)$/i.test(c.tagName))) return text(li);
    const head = [], body = [];
    for (const c of kids) {
      if (c.tagName.toUpperCase() === "CODE") continue; // step numbers: the list is numbered already
      const x = text(c);
      if (!x) continue;
      if (/^H\d$/i.test(c.tagName) || c.classList.contains("lbl")) head.push(x); else body.push(x);
    }
    let h = head.join(": ");
    if (h && !/[.!?]$/.test(h)) h += ".";
    return (h ? `**${h}** ` : "") + body.join(" ");
  }
  function list(ul, ordered) {
    const items = [...ul.children].filter(shown);
    if (ul.classList.contains("offer-cards")) {
      for (const li of items) {
        out.push("### " + text($("h3", li)));
        const lines = [];
        for (const c of li.children) {
          if (!shown(c) || c.matches("h3")) continue;
          const x = text(c);
          if (!x) continue;
          if (c.matches(".tag")) lines.push(`*${x}*`);
          else if (c.tagName === "A") lines.push(`[${x}](${abs(c.getAttribute("href"))})`);
          else lines.push(x);
        }
        out.push(lines.join("\n\n"));
      }
      return;
    }
    out.push(items.map((li, i) => (ordered ? `${i + 1}. ` : "- ") + item(li)).join("\n"));
  }
  function dl(d) {
    const rows = [];
    let dt = "";
    for (const c of d.children) {
      if (!shown(c)) continue;
      if (c.tagName === "DT") dt = text(c);
      else if (c.tagName === "DD") rows.push([dt, text(c)]);
    }
    if (rows.every(([, dd]) => dd.length < 140)) out.push(rows.map(([a, b]) => `- **${a}:** ${b}`).join("\n"));
    else for (const [a, b] of rows) out.push(`**${a}.** ${b}`);
  }
  function table(tb) {
    const cap = $("caption", tb);
    if (cap && text(cap)) out.push(`**${text(cap)}**`);
    const rows = $$("tr", tb).map((tr) => [...tr.children].map((td) => text(td).replace(/\|/g, "\\|")));
    if (!rows.length) return;
    const [head, ...body] = rows;
    out.push([
      "| " + head.join(" | ") + " |",
      "| " + head.map(() => "---").join(" | ") + " |",
      ...body.map((r) => "| " + r.join(" | ") + " |"),
    ].join("\n"));
  }
  function quote(q) {
    const cite = $("cite", q);
    const said = tidy([...q.childNodes].filter((n) => n !== cite).map((n) => (n.nodeType === 3 ? n.textContent : (n.nodeType === 1 && shown(n) ? inline(n) : ""))).join(""));
    out.push("> " + said + (cite ? "\n>\n> — " + tidy(cite.textContent) : ""));
  }
  function figure(f) {
    const imgs = $$("img", f).filter((i) => shown(i) && i.alt);
    for (const i of imgs) out.push(`![${i.alt}](${abs(i.getAttribute("src"))})`);
    for (const d of $$("dl", f)) if (shown(d)) dl(d);
    const cap = $("figcaption", f);
    if (imgs.length && cap && shown(cap)) out.push(`*${text(cap)}*`);
  }
  function details(d) {
    const sum = $("summary", d);
    out.push("### " + text(sum));
    for (const c of d.children) {
      if (c === sum || !shown(c)) continue;
      const before = out.length;
      walk(c);
      if (out.length === before) { const x = text(c); if (x) out.push(x); }
    }
  }
  function form(f) {
    const rows = $$("label", f).map((l) => {
      const i = $("input", l) || (l.htmlFor && document.getElementById(l.htmlFor));
      return `- ${text(l)}: ${i ? i.value : ""}`;
    });
    if (rows.length) out.push(rows.join("\n"));
    for (const p of $$("p, output", f)) { const x = text(p); if (x) out.push(x); }
  }

  walk($("main"));
  const body = out.splice(0);
  for (const p of $$(".foot p")) { if (!$(".brand", p)) { const x = text(p); if (x) out.push(x); } }
  const foot = out.splice(0);

  // The facts the short guide leads with, all read from the page.
  const meta = (n) => ($(`meta[name="${n}"]`) || $(`meta[property="${n}"]`) || {}).content || "";
  const siteName = meta("og:site_name");
  const ld = $$('script[type="application/ld+json"]').map((s) => s.textContent);
  let org = "";
  try { for (const block of ld) for (const n of [].concat(JSON.parse(block)["@graph"] || JSON.parse(block))) if (/Organization|Service|Business/.test(n["@type"]) && n.name) org = org || n.name; } catch { /* the checks report it */ }
  const title = org && org !== siteName ? `${siteName} (${org})` : siteName;
  const booking = ($('a[href*="calendly.com"]') || {}).href || "";
  const email = (($('a[href^="mailto:"]') || {}).href || "").replace("mailto:", "");
  const updated = ($(".foot time[datetime]") || {}).dateTime || "";
  const glance = {};
  $$(".glance dt").forEach((dt) => { glance[text(dt)] = text(dt.nextElementSibling); });
  const offers = $$("#pricing .offer-cards > li").map((li) => ({
    name: text($("h3", li)), price: text($(".price", li)), what: text($(".price ~ p", li)),
  }));
  const terms = $$("#terms > div").map((d) => ({ h: text($("h3", d)), p: text($("p", d)) }));
  const sections = $$("main > section[id]").map((s) => ({ id: s.id, kicker: text($(".kicker", s)), h: text($("h1, h2", s)) }));
  const links = $$(".plinks a").map((a) => ({ name: text(a), href: a.href }));
  const hero = $(".hero");
  const founder = (glance.Founder || "").split(",")[0];
  const note = (href) => {
    const h = new URL(href).hostname;
    if (/linkedin\.com$/.test(h)) return `${founder} on LinkedIn`;
    if (h === "github.com") return `${founder}'s code`;
    if (/irie/.test(href)) return "the founder's open-source platform that runs the agents";
    if (/github\.io$/.test(h)) return `${founder}'s own site`;
    return "";
  };

  const md = [
    `# ${title}`,
    `> ${meta("description")}`,
    [`- Website: ${base}`, booking && `- Book a free Quick Check: ${booking}`, email && `- Email: ${email}`, updated && `- Updated: ${updated}`].filter(Boolean).join("\n"),
    ...body,
    "---",
    ...foot,
  ].join("\n\n") + "\n";

  const llms = [
    `# ${title}`,
    `> ${meta("description")}`,
    [text($(".lede", hero)), text($(".fine", hero))].filter(Boolean).join(" "),
    [
      booking && `- Book a free 30-minute Quick Check: ${booking}`,
      email && `- Email: ${email}` + (glance.Replies ? ` (replies ${glance.Replies.replace(/^Within/, "within")})` : ""),
      glance.Founder && `- Founder: ${glance.Founder}`,
      "- Offers and prices:",
      ...offers.map((o) => `  - **${o.name}:** ${o.price}. ${o.what}`),
      ...terms.map((t) => `- **${t.h}:** ${t.p}`),
    ].filter(Boolean).join("\n"),
    "## The page",
    [
      `- [The whole page as Markdown](${base}index.html.md): every section, with the prices, terms and answers to common questions`,
      ...sections.map((s) => `- [${s.kicker || s.h}](${base}#${s.id})${s.kicker ? ": " + s.h : ""}`),
    ].join("\n"),
    "## Optional",
    links.map((l) => `- [${l.name}](${l.href})` + (note(l.href) ? ": " + note(l.href) : "")).join("\n"),
  ].join("\n\n") + "\n";

  // What the checks need.
  const priceText = $$("#pricing, #whatdo").map((s) => s.textContent).join(" ");
  const main = $("main");
  const faq = $("#faq");
  let notFaq = "";
  const tw = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
  for (let n = tw.nextNode(); n; n = tw.nextNode()) if (!faq || !faq.contains(n)) notFaq += n.textContent + " ";
  const cardNums = $$("#pricing .price, #whatdo .line-price").map((p) => p.textContent).join(" ");
  const oneFix = ($("#pricing .offer-cards > li.lead .price") || {}).textContent || "";
  const imgs = $$("img").filter((i) => !i.closest(".ogcard, .iconcard")).map((i) => ({
    src: i.getAttribute("src"), alt: i.getAttribute("alt"), width: i.getAttribute("width"), height: i.getAttribute("height"),
    sources: $$("source", i.parentElement.tagName === "PICTURE" ? i.parentElement : document.createElement("x")).map((s) => s.getAttribute("srcset")),
  }));
  const faqItems = faq ? $$("details", faq).map((d) => ({ name: !!$('[itemprop="name"]', d), text: !!$('[itemprop="text"]', d) })) : [];

  return {
    base, md, llms, ld, updated, imgs, faqItems,
    description: meta("description"), ogDescription: meta("og:description"), ogImage: meta("og:image"),
    priceText, notFaq, faqText: faq ? faq.textContent : "", cardNums, oneFix,
    allText: main.textContent,
  };
}

const money = (s) => [...String(s).matchAll(/\$\s?(\d[\d,]*)/g)].map((m) => Number(m[1].replace(/,/g, "")));
const local = (base, url) => (url.startsWith(base) ? join(root, "docs", decodeURI(url.slice(base.length).split(/[?#]/)[0])) : null);

function ldPrices(node, acc = new Set()) {
  if (Array.isArray(node)) node.forEach((n) => ldPrices(n, acc));
  else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (k === "price") acc.add(Number(v));
      else ldPrices(v, acc);
    }
  }
  return acc;
}
function ldNodes(node, acc = []) {
  if (Array.isArray(node)) node.forEach((n) => ldNodes(n, acc));
  else if (node && typeof node === "object") { acc.push(node); Object.values(node).forEach((v) => ldNodes(v, acc)); }
  return acc;
}

// Loads site.js again under a stand-in for WebMCP's document.modelContext, then calls each tool,
// and sends the calculator form as an agent would.
async function tryAgentTools(browser) {
  const tab = await browser.open(pageUrl + "?still", { w: 1440, h: 900 });
  const r = await tab.evaluate(`(async () => {
    const tools = [];
    Object.defineProperty(document, "modelContext", { configurable: true, value: { registerTool: (t) => { tools.push(t); } } });
    await new Promise((ok, fail) => {
      const s = document.createElement("script");
      s.src = "site.js?again"; s.onload = ok; s.onerror = () => fail(new Error("site.js did not load"));
      document.head.append(s);
    });
    const t = Object.fromEntries(tools.map((x) => [x.name, x]));
    const call = async (name, args) => (t[name] ? String(await t[name].execute(args)) : "");
    const form = document.getElementById("calc");
    let reply = null;
    const e = new SubmitEvent("submit", { cancelable: true });
    Object.defineProperty(e, "agentInvoked", { value: true });
    e.respondWith = (p) => { reply = p; };
    form.dispatchEvent(e);
    return {
      names: tools.map((x) => x.name),
      readOnly: tools.every((x) => x.annotations && x.annotations.readOnlyHint === true),
      prices: await call("list_services_and_prices", {}),
      website: await call("answer_question", { question: "How much does a website cost?" }),
      nothing: await call("answer_question", { question: "zzz qqq" }),
      booking: await call("get_booking_link", {}),
      form: form.getAttribute("toolname") && form.getAttribute("tooldescription") ? [...form.querySelectorAll("input")].map((i) => i.name) : [],
      calc: reply ? String(await reply) : "",
    };
  })()`);
  await tab.close();
  const problems = [];
  const want = ["list_services_and_prices", "answer_question", "get_booking_link"];
  for (const n of want) if (!r.names.includes(n)) problems.push(`WebMCP: site.js registers no ${n} tool`);
  if (!r.readOnly) problems.push("WebMCP: a tool lacks annotations.readOnlyHint: true");
  if (!/\$195/.test(r.prices) || !/calendly\.com/.test(r.prices)) problems.push("WebMCP: list_services_and_prices gave no prices or booking link");
  if (!/website/i.test(r.website) || !/\$/.test(r.website)) problems.push("WebMCP: answer_question had no price for a website: " + r.website.slice(0, 120));
  if (!/protonmail|calendly/.test(r.nothing)) problems.push("WebMCP: answer_question gave no way to ask when the page has no answer");
  if (!/calendly\.com/.test(r.booking)) problems.push("WebMCP: get_booking_link gave no booking link");
  if (r.form.length < 2 || r.form.some((n) => !n)) problems.push("WebMCP: the calculator form needs toolname, tooldescription and a name on each input");
  if (!/hours/.test(r.calc)) problems.push("WebMCP: the calculator form gave an agent no answer");
  return problems;
}

export async function writeAgentFiles(browser) {
  const page = await browser.open(pageUrl + "?still", { w: 1440, h: 900 });
  const x = await page.evaluate(`(${extract.toString()})()`);
  await page.close();

  const problems = await tryAgentTools(browser);
  const graph = [];
  for (const block of x.ld) {
    try { graph.push(JSON.parse(block)); } catch (e) { problems.push("JSON-LD does not parse: " + e.message); }
  }
  const nodes = ldNodes(graph);
  const shownPrices = new Set([0, ...money(x.priceText)]);
  const ld = ldPrices(graph);
  for (const p of ld) if (!shownPrices.has(p)) problems.push(`JSON-LD has the price $${p}, which #pricing and #whatdo don't show`);
  for (const p of money(x.cardNums)) if (!ld.has(p)) problems.push(`the page shows $${p} in a price, but the JSON-LD has no such price`);
  const anywhere = new Set(money(x.allText));
  for (const [what, s] of [["meta description", x.description], ["og:description", x.ogDescription]]) {
    for (const p of money(s)) if (!anywhere.has(p)) problems.push(`the ${what} says $${p}, which the page doesn't`);
  }
  const outsideFaq = new Set(money(x.notFaq));
  for (const p of money(x.faqText)) if (!outsideFaq.has(p)) problems.push(`the FAQ says $${p}, which no other part of the page says`);
  if (!x.faqItems.length) problems.push("no questions in #faq");
  x.faqItems.forEach((q, i) => { if (!q.name || !q.text) problems.push(`FAQ question ${i + 1} lacks itemprop="name" or itemprop="text"`); });
  const fix = new Set(money(x.oneFix));
  const siteJs = readFileSync(join(root, "docs/site.js"), "utf8");
  for (const p of [...money(siteJs), ...[...siteJs.matchAll(/weeks\((\d+)/g)].map((m) => Number(m[1]))]) {
    if (!fix.has(p)) problems.push(`docs/site.js uses ${p}, which isn't a One Fix price on the page`);
  }

  const pictures = new Set();
  for (const i of x.imgs) {
    if (!i.alt) problems.push(`<img src="${i.src}"> has no alt text`);
    if (!i.width || !i.height) problems.push(`<img src="${i.src}"> has no width and height`);
    for (const f of [i.src, ...i.sources]) if (f && !existsSync(join(root, "docs", f))) problems.push(`docs/${f} is missing`);
    pictures.add(new URL(i.src, x.base).href);
  }
  for (const n of nodes) {
    if (n["@type"] !== "ImageObject" || !n.contentUrl) continue;
    const f = local(x.base, n.contentUrl);
    if (f && !existsSync(f)) problems.push(`the JSON-LD names ${n.contentUrl}, but ${f} is missing`);
    if (f) pictures.add(n.contentUrl);
  }
  const og = local(x.base, x.ogImage);
  if (!og || !existsSync(og)) problems.push(`og:image ${x.ogImage} has no file behind it`);
  else pictures.add(x.ogImage);
  const page2 = nodes.find((n) => [].concat(n["@type"]).includes("WebPage"));
  if (!x.updated) problems.push('the footer has no <time datetime="…"> for the date the page changed');
  else if (page2 && page2.dateModified !== x.updated) problems.push(`the footer says updated ${x.updated}, the JSON-LD's dateModified ${page2.dateModified}`);

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${x.base}</loc>
    <lastmod>${x.updated}</lastmod>
${[...pictures].sort().map((u) => `    <image:image><image:loc>${u}</image:loc></image:image>`).join("\n")}
  </url>
</urlset>
`;
  writeFileSync(join(root, "docs/index.html.md"), x.md);
  writeFileSync(join(root, "docs/llms-full.txt"), x.md);
  writeFileSync(join(root, "docs/llms.txt"), x.llms);
  writeFileSync(join(root, "docs/sitemap.xml"), sitemap);
  console.log(`wrote docs/index.html.md and docs/llms-full.txt (${Math.round(x.md.length / 1024)} KB), docs/llms.txt, docs/sitemap.xml (${pictures.size} pictures)`);
  if (problems.length) throw new Error("checks failed:\n- " + problems.join("\n- "));
  console.log("checks passed: prices, pictures, dates, WebMCP tools");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const browser = await launch();
  let failed = false;
  try { await writeAgentFiles(browser); } catch (e) { console.error(e.message); failed = true; }
  await browser.close();
  process.exit(failed ? 1 : 0);
}
