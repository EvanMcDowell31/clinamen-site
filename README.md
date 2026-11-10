# CLI ’n’ Amen co.

The website of Clinamen, marketed as **CLI ’n’ Amen co.**: automations, websites and software for owner-run small businesses across the United States. One static page, no build step.

- Address: https://clinamenco.com/ (live since 10 November 2026, HTTPS enforced)
- The old preview address, https://evanmcdowell31.github.io/clinamen-site/, redirects there.
- The page lives in `docs/`; GitHub Pages serves it from `docs/` on `main`.

| Phone | Desktop |
| --- | --- |
| ![Phone, first view](review/home-phone.png) | ![Desktop, first view](review/home-desktop.png) |

More in `review/`: every section at phone and desktop width, dark mode, and both full pages.

## What’s on the page

1. **The hero.** “AI for your business, one chore at a time.” Beside it, a window in which atoms fall in straight lines until one leans a little near the top and sets off a cascade across the whole window: a tiny swerve, a huge impact (Lucretius’ *clinamen*). Its caption: cheap · fast · good, ~~pick two~~, all three. A pause button in the window’s title bar stops the motion, and it never starts under “reduce motion”.
2. **The old rule.** Cheap, fast and good, pick two, and why agents broke it: a three-way Venn diagram split by a lightning-bolt crack with the swerving atom at the centre, three cards with the claims the firm can keep, and a table of published prices against the firm’s (an agency’s pilot, website builders, a first project, retainers, consultants’ hourly rates).
3. **What we do.** Three service lines, each with its price: Automations (the six typical fixes), Websites (one page on the client’s own domain, no monthly fee, with this site as proof, then “Sites we’ve made”: briandominguezvoice.com, live, and two demos made on spec, Bolivar Coffee and Elevate Smoke, Vape & CBD, each labelled Demo, with a line saying the businesses took no part) and Software (Canopy, the checkout for market stalls and food trucks that is in development, and custom builds that pay into the client’s own Square or Stripe account).
4. **The math on one chore.** Three hours a week is 150 hours a year, $6,000 at $40 an hour, and a small calculator for the visitor’s own numbers (50 working weeks; payback in weeks at both prices).
5. **Pricing.** Quick Check (free), One Fix or one website, Sprint and Care, with the founding prices, the money-back term (a rubber stamp), the founding-price limit and the referral credit, as the firm’s 90-day marketing plan proposes them.
6. **How it works.** Three steps; the founder checks everything.
7. **Products.** Three cards, each opening its own page (below): Irie, Canopy and a social media tool.
8. **The founder.** The photo, an at-a-glance card, and the proof: Irie, the agentic tooling and launches at a large retailer (not named on the page), the small-builder software at Ressio, and links to LinkedIn, GitHub, the personal site and Irie.
9. **Who it’s for**, including markets and food trucks, the free nonprofit fixes, and regulated data scoped in writing.
10. **Why Clinamen:** a dictionary entry, Fig. 1 (the small lean and the different landing), and how to say the name.
11. **Your data.**
12. **Questions:** fifteen that owners ask (cost, what AI can take on, timing, money back, data, where we work, Care, software, nonprofits, the name), each opening in place; then the closing booking band. The footer says where the firm is, who owns the pictures, how visits are counted, and where AI assistants should look.

The look: Fraunces for headings, JetBrains Mono for the CLI half of the wordmark, labels and prices, the system sans for text. Teal for actions, amber for the swerving atom, and a darker amber for small labels so they stay readable. Light and dark follow the visitor’s setting, and the round switch beside Book in the header overrides it; the choice is kept in their browser. Both fonts are served from `docs/fonts/` under the SIL Open Font License, with the license files alongside, so the page loads nothing from other servers; its one request out is GoatCounter’s visit count.

## The product pages

Each product has its own page in `docs/products/<name>/index.html`, served at `/products/<name>/`. They share the home page’s `style.css` and `site.js` (the light and dark switch), and copy its header and footer, so a change to the header or the footer is made in all four files. Each page has its own title, description, canonical address, Open Graph tags and JSON-LD, a footer date, and a Markdown twin written by `tools/agent.mjs`.

- **Irie** (`products/irie/`): open source, version 1.0. What it is, who it’s for, how it works, why people use it, the one-line install, and how the firm uses it. The screenshot, `docs/img/irie-ai-coding-agents-mac-app.webp`, is Irie’s own `docs/media/irie-mac.png` (Apache-2.0, filmed with stand-in agents), credited in the footer. Its JSON-LD reuses the home page’s `#irie` node.
- **Canopy** (`products/canopy/`): in development, farmers markets first: what works today in testing, what comes next, what is planned. Card and wallet payments land in the vendor’s own Square account, and Canopy never holds money. It names no price, which isn’t set. The phones are sketches, labelled so, with a made-up stall.
- **A social media tool** (`products/social/`): in early development: what it does, how it works and where it stands.

## Editing it

- **Prices and terms:** the `pricing` section of `docs/index.html` (one `.price` block per offer, the three notes), the `.line-price` lines under “What we do”, the comparison table under “The old rule”, the FAQ answers (`#faq`), the meta description in `<head>` (“from $195”), the calculator’s two prices in `docs/site.js`, and the offers in the JSON-LD block in `<head>`. Then run `node tools/shoot.mjs --text`: it fails, and says where, if the JSON-LD, the descriptions, the FAQ or `site.js` name a price the page doesn’t show.
- **Colours:** the tokens at the top of `docs/style.css`. The dark set is written twice, once for the system setting and once for the header switch: change both.
- **Email and booking link:** search `docs/` for `hello@clinamenco.com` and `calendly`. hello@ is a free Porkbun forward to the firm's Proton inbox, clinamenco@protonmail.com.
- **The photo:** `docs/img/evan-mcdowell.jpg`, a 520-pixel square JPEG.
- **The date:** when the content changes, change the footer’s `<time datetime>` and the JSON-LD’s `dateModified` together (the check compares them); the sitemap’s `lastmod` follows the footer.
- **Pictures, screenshots and the files for agents:** `node tools/shoot.mjs` (Node 22 or newer, about 3 minutes). In order, it draws the Venn diagram and Fig. 1 from `tools/figures.html` into `docs/img` as WebP, light and dark (edit the drawings there); the icons, `docs/favicon.ico` and the logo `docs/img/cli-n-amen-co-logo.png`; the review screenshots, the share card (`docs/img/ai-for-your-business-one-chore-at-a-time.png`), the app icon and the phone proof (`docs/img/small-business-website-on-a-phone.webp`); then the files for search engines and AI agents, with their checks (`tools/agent.mjs`, below). `node tools/shoot.mjs --text` does only that last step, in seconds. It drives Playwright’s cached headless Chromium shell over the DevTools protocol (`tools/cdp.mjs`); nothing is installed and no window is shown. `?still` on the page stops the animation, `?og` draws the share card, `?icon` the icon.
- **A new page:** add it to `pages` in `tools/cdp.mjs`. The accessibility check, the screenshots, the sitemap, `llms.txt` and the Markdown twins then include it.
- **Sites we’ve made:** the three pictures are `docs/img/*-website-*.webp`, 720 × 450 WebP of each site’s first screen at 1440 × 900 (`cwebp -q 80 -resize 720 450`). A demo is labelled Demo, links to its draft, and the note under the cards says the businesses took no part.
- **Before publishing:** `node tools/a11y.mjs`, the accessibility check below. It checks every page (`--page irie` checks one), prints what fails and exits 1.

## Accessibility

The page aims at WCAG 2.2 AA. `node tools/a11y.mjs` runs axe-core 4.10 (the WCAG 2.2 A and AA rules and best practice) in light and dark, at desktop, phone and 320 px widths, then the checks axe can’t make: nothing scrolls sideways; a keyboard walk, Tab and then Shift+Tab, in which every stop shows the focus ring and sits clear of the sticky header; the hero’s pause button; reduced motion; and WCAG’s text-spacing test. The first run fetches axe-core from jsDelivr into `~/Library/Caches/clinamen-site` and checks its hash.

What the page does for it, so a change keeps it:

- **Colour.** Small amber text uses `--amber-text` (4.7:1 on the paper in light mode); `--amber` stays for graphics. The edges of the calculator’s fields and of outline buttons use `--edge` (3:1). Check any new colour against both themes’ paper and card.
- **Focus.** A ring of the page’s own on `:focus-visible`: teal, light on the closing band, amber in the hero window. `scroll-padding-top` on `html` keeps focus and anchors below the sticky header.
- **Motion.** The hero window’s pause button stops the animation and the choice is kept for the next visit; under “reduce motion” nothing moves and the button hides.
- **Screen readers.** The calculator’s result is a status message, updated once typing pauses. `.sr-only` text completes the header’s “Book” link on phones, says “Not … but” around the struck “pick two”, names the pause button, and respells the IPA. Lists styled without bullets carry `role="list"`, which Safari needs to keep them lists. The price table has column and row headers. The Latin words carry `lang="la"`.
- **Still to check by hand** after a big change: VoiceOver on an iPhone and on a Mac (rotor headings, the calculator’s announcement, the pause button), and 200% zoom.

## Search and AI agents

What the page does so that search engines and AI assistants find it, understand it and can act on it:

- **For Google.** A title and description written for the search “AI automation for small business”; `max-image-preview:large`, so results may show large pictures; and one JSON-LD graph in `<head>`: the site’s name (`WebSite`, which Google shows above results from the domain’s home page), the firm (`ProfessionalService`, with its logo, Marietta, Georgia, the United States as its area, contact and booking), the founder (`Person`, with his profiles), Irie, the three services, and every offer with its founding and standard price (`priceValidUntil` 2027-01-31). The FAQ is `FAQPage` microdata on the questions themselves, so its markup can’t drift from them. All of it passes https://validator.schema.org/ with no errors or warnings.
- **For Google Images.** The Venn diagram and Fig. 1 are pictures (search engines don’t index inline SVG), drawn from `tools/figures.html`, with file names that say what they show, alt text, captions, and dark versions through `<picture>`. Every picture is in `docs/sitemap.xml`, which is an image sitemap. The JSON-LD gives the firm’s own pictures a creator, a credit, a copyright notice and a license page (`#pictures` in the footer: write to us), which makes them eligible for Google Images’ “Licensable” badge. The logo (512 px) and `favicon.ico` (16, 32 and 48 px) are what Google shows beside the site in results.
- **For AI assistants.** `docs/robots.txt` names the AI search crawlers and assistants (OpenAI, Anthropic, Perplexity, Google, Apple, Amazon, Meta, DuckDuckGo, Mistral and Common Crawl) and lets them all in. `docs/llms.txt` is a short guide with the offers, prices, terms and the product pages; `docs/index.html.md`, linked from the page as `rel="alternate"`, is the whole page as Markdown, and each product page has its own `index.html.md` beside it; `docs/llms-full.txt` is the home page and then each product page. `tools/agent.mjs` writes them all, and the sitemap, from the pages themselves, so they always agree with them.
- **For agents in the browser.** `docs/site.js` offers three read-only tools through WebMCP (`document.modelContext`), the standard Chrome is trialling: `list_services_and_prices`, `answer_question` (from the FAQ) and `get_booking_link`. The calculator form is a tool too, `estimate_time_and_money_saved`, by its `toolname` attributes. Where WebMCP is missing they do nothing; real visitors’ Chrome gets them once the page carries an origin-trial token (see the checklist). `tools/agent.mjs` calls each one against a stand-in for the API.
- **Visits.** GoatCounter counts them, without cookies or personal data, at https://clinamenco.goatcounter.com once that account exists. Its Campaigns and Referrers lists show `utm_source` and `utm_campaign` from links in social posts. `docs/count.js` is its script (ISC license), served from the site.
- **Bing and the others.** `sh tools/indexnow.sh` tells the IndexNow search engines (Bing, Yandex, Seznam, Naver and Yep) that the page changed; Bing’s index also feeds ChatGPT search and Copilot. The key is the 32-character `.txt` file in `docs/`. Google doesn’t take IndexNow: it reads the sitemap.

## Go-live checklist

1. **DNS at Porkbun: done on 10 November 2026.** The parking records (an ALIAS on `@` and a wildcard CNAME `*`, both to `uixie.porkbun.com`) are gone. The MX, SPF and `_acme-challenge` records for Porkbun’s email forwarding stay. These records point the domain at GitHub Pages:

   | Type | Host | Answer |
   | --- | --- | --- |
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | AAAA | @ | 2606:50c0:8000::153 |
   | AAAA | @ | 2606:50c0:8001::153 |
   | AAAA | @ | 2606:50c0:8002::153 |
   | AAAA | @ | 2606:50c0:8003::153 |
   | CNAME | www | evanmcdowell31.github.io |

2. **The custom domain on GitHub Pages: done on 10 November 2026.** `docs/CNAME` holds `clinamenco.com`; never delete it. The certificate covers clinamenco.com and www.clinamenco.com and GitHub renews it. HTTPS is enforced, and http, www and the github.io address all redirect to https://clinamenco.com/. Still worth doing: verify the domain in the owner’s GitHub settings (Pages, Add a domain, then the TXT record it gives) so no other account can claim it.
3. **Search engines.** Once clinamenco.com serves the site: in Google Search Console, add a Domain property for clinamenco.com, verified by the TXT record it gives (at Porkbun, alongside the records above), and submit `https://clinamenco.com/sitemap.xml`. Bing Webmaster Tools can import the property from Search Console. Then run `sh tools/indexnow.sh`, and again after each change.
4. **GoatCounter.** Sign up at https://www.goatcounter.com/signup with the code `clinamenco` (free for a small business; no cookies). The page already sends its counts there.
5. **Prices.** The page shows the plan’s proposed prices and the founding-price limit (31 January 2027 or the first 10 paying clients). Note that Sprint ($1,450; $990 founding) costs more than three One Fixes ($1,170; $585 founding); the page explains the extras (documentation, training, before-and-after timing). Confirm or change before marketing starts.
6. **Data page.** Three practices are not yet specific on purpose: where job files are stored, what the AI provider keeps, and how many days after handover copies are deleted. Add them once settled.
7. **Canopy.** The page says it is in development and invites markets and vendors to write in. Update the line when a pilot runs.
8. **A postal address** is needed for marketing email (CAN-SPAM), not for the page.
9. **A phone number**, if you want calls: many owners call before they book. It goes in the footer and the closing band.
10. **Email at the domain: done on 10 November 2026.** hello@clinamenco.com forwards to clinamenco@protonmail.com through Porkbun’s free email forwarding, tested, and every page shows hello@. Replies still go out from the Proton address; sending as hello@ needs Proton’s custom-domain feature, a paid plan.
11. **A Google Business Profile**, if clients are met in person: for searches such as “AI consultant near me”, it counts more than anything on the page. A service-area business can hide its street address.
12. **Social profiles.** Once the firm’s LinkedIn, Instagram, Threads, X and TikTok profiles exist, add each URL to the firm’s `sameAs` list in the JSON-LD, and `<meta name="twitter:site" content="@…">` for X.
13. **Optional: WebMCP for every Chrome visitor.** Register clinamenco.com for Chrome’s WebMCP origin trial at https://developer.chrome.com/origintrials/ and put the token in `<head>` as `<meta http-equiv="origin-trial" content="…">`.
14. **Optional: reuse of the figures.** They are all rights reserved, and the footer asks people to write. Putting the Venn diagram and Fig. 1 under CC BY 4.0 would let anyone reuse them with a credit and a link back.

## Sources

- Lucretius, *De rerum natura* II.216–293, the swerve of atoms, in the Perseus Digital Library: https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.02.0130
- Wikipedia, “Clinamen”: the pronunciation /klaɪˈneɪmən/, the derivation from *clinare* and the plural *clinamina*: https://en.wikipedia.org/wiki/Clinamen
- GitHub Docs, “Managing a custom domain for your GitHub Pages site”: the A, AAAA and CNAME records above: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- Fraunces, by Undercase Type, and JetBrains Mono, by JetBrains, both under the SIL Open Font License 1.1 (`docs/fonts/*/OFL.txt`), fetched from Google Fonts.
- The offers, prices and wording follow the firm’s 90-day marketing plan (private).
- The published prices in “What this costs elsewhere”, as the plan found them on 9 November 2026: an AI automation agency’s pilot and plans, https://samautomates.vercel.app/pricing; US AI consultants’ hourly rates and advisory retainers, https://www.leanware.co/insights/how-much-does-an-ai-consultant-cost; a first AI project for a firm under 10 people, https://www.lilachbullock.com/ai-consultant-cost-small-business/. Website builders: Squarespace’s plans, $19 to $99 a month billed annually, read on 10 November 2026 at https://www.squarespace.com/pricing. Check them again before quoting them anywhere else.
- Google Search Central, on images (`<img>` rather than CSS or inline SVG, alt text, file names, image sitemaps, preferred images), https://developers.google.com/search/docs/appearance/google-images; image license metadata and the Licensable badge, https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata; site names, https://developers.google.com/search/docs/appearance/site-names. Read on 10 November 2026.
- The llms.txt proposal, its format and the `.md` twin of a page: https://llmstxt.org/
- WebMCP: Chrome for Developers, https://developer.chrome.com/docs/ai/webmcp, its imperative API, https://developer.chrome.com/docs/ai/webmcp/imperative-api, declarative API, https://developer.chrome.com/docs/ai/webmcp/declarative-api, and best practices, https://developer.chrome.com/docs/ai/webmcp/best-practices; the W3C Web Machine Learning Community Group’s explainer, https://github.com/webmachinelearning/webmcp. The origin trial runs to Chrome 162.
- AI crawlers’ names, from their makers’ pages as gathered in https://depra.ai/ai-crawlers (OpenAI, https://platform.openai.com/docs/bots; Perplexity, https://docs.perplexity.ai/guides/bots; Mistral, https://docs.mistral.ai/robots/), November 2026.
- GoatCounter: its terms (free for small and medium businesses), https://goatcounter.com/terms, and campaigns (`utm_campaign`, `utm_source`), https://www.goatcounter.com/help/campaigns. `docs/count.js` is https://github.com/arp242/goatcounter/blob/master/public/count.js, under the ISC license.
- IndexNow, the shared protocol and its endpoint: https://www.indexnow.org/
- W3C, Web Content Accessibility Guidelines (WCAG) 2.2, the standard the page aims at: https://www.w3.org/TR/WCAG22/
- axe-core 4.10.2 by Deque Systems, under the Mozilla Public License 2.0: https://github.com/dequelabs/axe-core. `tools/a11y.mjs` fetches it at run time; it is not kept in this repository.
- Scott O’Hara, “‘Fixing’ Lists”, on why lists styled without bullets carry `role="list"`: https://www.scottohara.me/blog/2019/01/12/lists-and-safari.html
- The founder’s facts come from his public site, https://evanmcdowell31.github.io/, and his résumé; Irie’s release from https://github.com/irie-people/irie/releases. Canopy’s description is from its own README (private repository, in development).
