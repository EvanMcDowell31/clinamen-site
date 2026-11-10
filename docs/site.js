// Screenshot modes (?still stops the motion, ?og draws the share card, ?icon the app icon,
// ?theme=light or dark), the hero's pause button, the light and dark switch in the header,
// the small calculator in "The math on one chore", and, at the end, tools for AI agents in
// the browser (WebMCP). The page works without any of it.
(() => {
  const q = new URLSearchParams(location.search);
  const root = document.documentElement;
  if (q.has("still")) root.classList.add("still");
  if (q.has("og")) document.body.classList.add("og");
  if (q.has("icon")) document.body.classList.add("icon");

  // Pause stops the hero's motion (WCAG 2.2.2), and the choice is kept for the next
  // visit. Under "reduce motion" nothing moves, so the stylesheet hides the button.
  const pause = document.querySelector(".term-pause");
  if (pause) {
    const word = pause.querySelector(".tp-word");
    const set = (paused, keep) => {
      root.classList.toggle("paused", paused);
      word.textContent = paused ? "play" : "pause";
      if (keep) try { localStorage.setItem("motion", paused ? "paused" : "on"); } catch { /* private mode */ }
    };
    let kept = null;
    try { kept = localStorage.getItem("motion"); } catch { /* private mode */ }
    set(kept === "paused", false);
    pause.hidden = false;
    pause.addEventListener("click", () => set(!root.classList.contains("paused"), true));
  }

  // The switch: a choice is kept in localStorage, and the inline script in <head> applies it
  // before the page paints. With no choice, the system setting rules. ?theme= sets one
  // for a screenshot without keeping it.
  const pick = q.get("theme");
  if (pick === "light" || pick === "dark") root.dataset.theme = pick;
  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    const isDark = () => (root.dataset.theme ? root.dataset.theme === "dark" : system.matches);
    const sync = () => {
      const next = isDark() ? "light" : "dark";
      toggle.setAttribute("aria-label", "Switch to " + next + " theme");
      toggle.title = "Switch to " + next + " theme";
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
        m.content = isDark() ? "#131211" : "#f6f1e8";
      });
    };
    toggle.hidden = false;
    sync();
    toggle.addEventListener("click", () => {
      root.dataset.theme = isDark() ? "light" : "dark";
      try { localStorage.setItem("theme", root.dataset.theme); } catch (e) { /* storage blocked: still switches */ }
      sync();
    });
    if (system.addEventListener) system.addEventListener("change", sync);
  }

  const hours = document.getElementById("hours");
  const rate = document.getElementById("rate");
  const out = document.getElementById("math-out");
  const form = document.getElementById("calc");
  if (!hours || !rate || !out || !form) return;
  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
  const weeks = (price, perWeek) => {
    const w = Math.ceil(price / perWeek);
    return w <= 1 ? "the first week" : "about " + w + " weeks";
  };
  const update = () => {
    const h = Math.max(0, parseFloat(hours.value) || 0);
    const r = Math.max(0, parseFloat(rate.value) || 0);
    const perYear = h * 50;
    const value = perYear * r;
    if (!h || !r) {
      out.innerHTML = "Put in the hours and what your hour is worth.";
      return;
    }
    const perWeek = h * r;
    out.innerHTML = "<b>" + Math.round(perYear).toLocaleString("en-US") + " hours and " + money(value) + " a year.</b> One Fix at $195 pays back in " + weeks(195, perWeek) + "; at $390, " + weeks(390, perWeek) + ".";
  };
  let typing;
  const soon = () => { clearTimeout(typing); typing = setTimeout(update, 250); };
  hours.addEventListener("input", soon);
  rate.addEventListener("input", soon);
  hours.addEventListener("change", update);
  rate.addEventListener("change", update);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    update();
    // An AI agent in the browser can fill and send this form as a tool (WebMCP); it gets the answer back.
    if (e.agentInvoked && typeof e.respondWith === "function") e.respondWith(Promise.resolve(out.textContent));
  });
})();

// The figures are <picture>s whose dark source follows the system's setting. When the visitor
// picks a theme with the header switch, they follow that choice instead.
(() => {
  const root = document.documentElement;
  const sources = [...document.querySelectorAll('picture source[media*="prefers-color-scheme: dark"]')];
  if (!sources.length) return;
  const system = sources[0].media;
  const sync = () => {
    const t = root.dataset.theme;
    for (const s of sources) s.media = t === "dark" ? "all" : t === "light" ? "not all" : system;
  };
  sync();
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
})();

// Tools for AI agents in the browser (WebMCP, in Chrome's origin trial; nothing happens anywhere else).
// They read the page, so what an agent hears always matches what a visitor sees.
(() => {
  const mc = document.modelContext || navigator.modelContext;
  if (!mc || typeof mc.registerTool !== "function") return;
  const all = (s) => [...document.querySelectorAll(s)];
  const text = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");
  // A price is a row of spans, such as "$195", "founding price" and "standard $390".
  const price = (el) => (el ? [...el.children].map(text).filter(Boolean).join(" · ") || text(el) : "");
  const book = (document.querySelector('a[href*="calendly.com"]') || {}).href || "";
  const email = ((document.querySelector('a[href^="mailto:"]') || {}).href || "").replace("mailto:", "");
  const page = (document.querySelector('link[rel="canonical"]') || location).href.split("#")[0];
  const offers = () => all("#pricing .offer-cards > li").map((li) => ({
    name: text(li.querySelector("h3")),
    price: price(li.querySelector(".price")),
    includes: text(li.querySelector(".price ~ p")),
  }));
  const terms = () => all("#terms > div").map((d) => text(d.querySelector("h3")) + ": " + text(d.querySelector("p")));
  const answers = () => all("#faq details").map((d) => ({ q: text(d.querySelector("summary")), a: text(d.querySelector(".a")) }));
  const words = (s) => s.toLowerCase().match(/[a-z0-9]+/g) || [];
  const common = new Set("a an and are as at be but by can do does for from get how i if in is it its me my of on or our so that the this to us we what when where who why will with you your".split(" "));
  const tools = [
    {
      name: "list_services_and_prices",
      description: "Lists what CLI ’n’ Amen co. (Clinamen) does for small businesses: each offer with its price and what it includes, and the terms (founding prices, money back, referrals).",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true },
      execute: async () => JSON.stringify({ offers: offers(), terms: terms(), book, email, page }),
    },
    {
      name: "answer_question",
      description: "Answers a question about CLI ’n’ Amen co. (Clinamen), such as cost, timing, data, who does the work or where it works, with the answers published on this page.",
      inputSchema: {
        type: "object",
        properties: { question: { type: "string", description: "The question, in the visitor's own words" } },
        required: ["question"],
      },
      annotations: { readOnlyHint: true },
      execute: async ({ question } = {}) => {
        const want = words(String(question || "")).filter((w) => !common.has(w));
        const best = answers()
          .map((f) => ({ ...f, score: want.reduce((n, w) => n + (words(f.q).includes(w) ? 3 : 0) + (words(f.a).includes(w) ? 1 : 0), 0) }))
          .filter((f) => f.score > 0)
          .sort((a, b) => b.score - a.score);
        const top = best.length ? best[0].score : 0;
        best.splice(1, Infinity, ...best.slice(1, 2).filter((f) => f.score >= top * 0.8));
        if (!best.length) return "This page has no answer to that. The founder answers at " + email + ", or in a free Quick Check: " + book;
        return best.map((f) => f.q + "\n" + f.a).join("\n\n") + "\n\nAll the answers: " + page + "#faq";
      },
    },
    {
      name: "get_booking_link",
      description: "Gives the link to book a free 30-minute Quick Check with the founder, what the Quick Check is, and the email address for questions.",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true },
      execute: async () => JSON.stringify({ book, email, quickCheck: offers()[0] }),
    },
  ];
  for (const tool of tools) {
    try { Promise.resolve(mc.registerTool(tool)).catch(() => {}); } catch (e) { /* an older shape of the API */ }
  }
})();
