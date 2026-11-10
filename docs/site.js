// Screenshot modes (?still stops the motion, ?og draws the share card, ?icon the app icon),
// the hero's pause button, and the small calculator in "The math on one chore".
// The page works without any of it.
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
  form.addEventListener("submit", (e) => { e.preventDefault(); update(); });
})();
