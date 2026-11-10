# CLI ’n’ Amen co.

The website of Clinamen, marketed as **CLI ’n’ Amen co.**: automations, websites and software for owner-run small businesses across the United States. One static page, no build step.

- Address: https://clinamenco.com (once the DNS below points here)
- Preview: https://evanmcdowell31.github.io/clinamen-site/
- The page lives in `docs/`; GitHub Pages serves it from `docs/` on `main`.

| Phone | Desktop |
| --- | --- |
| ![Phone, first view](review/home-phone.png) | ![Desktop, first view](review/home-desktop.png) |

More in `review/`: every section at phone and desktop width, dark mode, and both full pages.

## What’s on the page

1. **The hero.** “AI for your business, one chore at a time.” Beside it, a window in which atoms fall in straight lines until one leans a little near the top and sets off a cascade across the whole window: a tiny swerve, a huge impact (Lucretius’ *clinamen*). Its caption: cheap · fast · good, ~~pick two~~, all three. A pause button in the window’s title bar stops the motion, and it never starts under “reduce motion”.
2. **The old rule.** Cheap, fast and good, pick two, and why agents broke it: a three-way Venn diagram split by a lightning-bolt crack with the swerving atom at the centre, three cards with the claims the firm can keep, and a table of published prices against the firm’s (an agency’s pilot, website builders, a first project, retainers, consultants’ hourly rates).
3. **What we do.** Three service lines, each with its price: Automations (the six typical fixes), Websites (one page on the client’s own domain, no monthly fee, with this site and briandominguezvoice.com as proof) and Software (Canopy, the checkout for market stalls and food trucks that is in development, and custom builds that pay into the client’s own Square or Stripe account).
4. **The math on one chore.** Three hours a week is 150 hours a year, $6,000 at $40 an hour, and a small calculator for the visitor’s own numbers (50 working weeks; payback in weeks at both prices).
5. **Pricing.** Quick Check (free), One Fix or one website, Sprint and Care, with the founding prices, the money-back term (a rubber stamp), the founding-price limit and the referral credit, as the firm’s 90-day marketing plan proposes them.
6. **How it works.** Three steps; the founder checks everything.
7. **The founder.** The photo, an at-a-glance card, and the proof: Irie, the agentic tooling and launches at a large retailer (not named on the page), the small-builder software at Ressio, and links to LinkedIn, GitHub, the personal site and Irie.
8. **Who it’s for**, including markets and food trucks, the free nonprofit fixes, and regulated data scoped in writing.
9. **Why Clinamen:** a dictionary entry, Fig. 1 (the small lean and the different landing), and how to say the name.
10. **Your data**, and the closing booking band.

The look: Fraunces for headings, JetBrains Mono for the CLI half of the wordmark, labels and prices, the system sans for text. Teal for actions, amber for the swerving atom, and a darker amber for small labels so they stay readable. Light and dark follow the visitor’s setting. Both fonts are served from `docs/fonts/` under the SIL Open Font License, with the license files alongside, so the page loads nothing from other servers.

## Editing it

- **Prices and terms:** the `pricing` section of `docs/index.html` (one `.price` block per offer, the three notes), the `.line-price` lines under “What we do”, the comparison table under “The old rule”, the calculator’s two prices in `docs/site.js`, and the JSON-LD block in `<head>`.
- **Email and booking link:** search `docs/index.html` for `protonmail` and `calendly`.
- **The photo:** `docs/evan.jpg`, a 520-pixel square JPEG.
- **Screenshots, the share card (`docs/og.png`), the icon and the “this site on a phone” proof (`docs/proof-phone.png`, copied from `review/home-phone.png`):** `node tools/shoot.mjs` (Node 22 or newer). It drives Playwright’s cached headless Chromium shell over the DevTools protocol (`tools/cdp.mjs`); nothing is installed and no window is shown. `?still` on the page stops the animation, `?og` draws the share card, `?icon` the icon.
- **Before publishing:** `node tools/a11y.mjs`, the accessibility check below. It prints what fails and exits 1.

## Accessibility

The page aims at WCAG 2.2 AA. `node tools/a11y.mjs` runs axe-core 4.10 (the WCAG 2.2 A and AA rules and best practice) in light and dark, at desktop, phone and 320 px widths, then the checks axe can’t make: nothing scrolls sideways; a keyboard walk, Tab and then Shift+Tab, in which every stop shows the focus ring and sits clear of the sticky header; the hero’s pause button; reduced motion; and WCAG’s text-spacing test. The first run fetches axe-core from jsDelivr into `~/Library/Caches/clinamen-site` and checks its hash.

What the page does for it, so a change keeps it:

- **Colour.** Small amber text uses `--amber-text` (4.7:1 on the paper in light mode); `--amber` stays for graphics. The edges of the calculator’s fields and of outline buttons use `--edge` (3:1). Check any new colour against both themes’ paper and card.
- **Focus.** A ring of the page’s own on `:focus-visible`: teal, light on the closing band, amber in the hero window. `scroll-padding-top` on `html` keeps focus and anchors below the sticky header.
- **Motion.** The hero window’s pause button stops the animation and the choice is kept for the next visit; under “reduce motion” nothing moves and the button hides.
- **Screen readers.** The calculator’s result is a status message, updated once typing pauses. `.sr-only` text completes the header’s “Book” link on phones, says “Not … but” around the struck “pick two”, names the pause button, and respells the IPA. Lists styled without bullets carry `role="list"`, which Safari needs to keep them lists. The price table has column and row headers. The Latin words carry `lang="la"`.
- **Still to check by hand** after a big change: VoiceOver on an iPhone and on a Mac (rotor headings, the calculator’s announcement, the pause button), and 200% zoom.

## Go-live checklist

1. **DNS at Porkbun.** Delete the parking records (the ALIAS on `@` and the CNAME on `www`) and add:

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

2. **The custom domain on GitHub Pages.** Add `docs/CNAME` holding `clinamenco.com`, set the domain in the repository’s Pages settings, wait for the certificate, then turn on “Enforce HTTPS”. `www.clinamenco.com` then redirects to the apex.
3. **Prices.** The page shows the plan’s proposed prices and the founding-price limit (31 January 2027 or the first 10 paying clients). Note that Sprint ($1,450; $990 founding) costs more than three One Fixes ($1,170; $585 founding); the page explains the extras (documentation, training, before-and-after timing). Confirm or change before marketing starts.
4. **Data page.** Three practices are not yet specific on purpose: where job files are stored, what the AI provider keeps, and how many days after handover copies are deleted. Add them once settled.
5. **Canopy.** The page says it is in development and invites markets and vendors to write in. Update the line when a pilot runs.
6. **A postal address** is needed for marketing email (CAN-SPAM), not for the page.
7. **A phone number**, if you want calls: many owners call before they book. It goes in the footer and the closing band.
8. **Email at the domain**, such as hello@clinamenco.com, if wanted: Proton Mail’s custom-domain feature, or Porkbun’s free email forwarding.
9. **A Google Business Profile**, if clients are met in person.

## Sources

- Lucretius, *De rerum natura* II.216–293, the swerve of atoms, in the Perseus Digital Library: https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.02.0130
- Wikipedia, “Clinamen”: the pronunciation /klaɪˈneɪmən/, the derivation from *clinare* and the plural *clinamina*: https://en.wikipedia.org/wiki/Clinamen
- GitHub Docs, “Managing a custom domain for your GitHub Pages site”: the A, AAAA and CNAME records above: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- Fraunces, by Undercase Type, and JetBrains Mono, by JetBrains, both under the SIL Open Font License 1.1 (`docs/fonts/*/OFL.txt`), fetched from Google Fonts.
- The offers, prices and wording follow the firm’s 90-day marketing plan (private).
- The published prices in “What this costs elsewhere”, as the plan found them on 9 November 2026: an AI automation agency’s pilot and plans, https://samautomates.vercel.app/pricing; US AI consultants’ hourly rates and advisory retainers, https://www.leanware.co/insights/how-much-does-an-ai-consultant-cost; a first AI project for a firm under 10 people, https://www.lilachbullock.com/ai-consultant-cost-small-business/. Website builders: Squarespace’s plans, $19 to $99 a month billed annually, read on 10 November 2026 at https://www.squarespace.com/pricing. Check them again before quoting them anywhere else.
- W3C, Web Content Accessibility Guidelines (WCAG) 2.2, the standard the page aims at: https://www.w3.org/TR/WCAG22/
- axe-core 4.10.2 by Deque Systems, under the Mozilla Public License 2.0: https://github.com/dequelabs/axe-core. `tools/a11y.mjs` fetches it at run time; it is not kept in this repository.
- Scott O’Hara, “‘Fixing’ Lists”, on why lists styled without bullets carry `role="list"`: https://www.scottohara.me/blog/2019/01/12/lists-and-safari.html
- The founder’s facts come from his public site, https://evanmcdowell31.github.io/, and his résumé; Irie’s release from https://github.com/irie-people/irie/releases. Canopy’s description is from its own README (private repository, in development).
