// Screenshot modes (?still stops the motion, ?og draws the share card, ?icon the app icon),
// and the small calculator in "The math on one chore". The page works without any of it.
(() => {
  const q = new URLSearchParams(location.search);
  const root = document.documentElement;
  if (q.has("still")) root.classList.add("still");
  if (q.has("og")) document.body.classList.add("og");
  if (q.has("icon")) document.body.classList.add("icon");

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
  hours.addEventListener("input", update);
  rate.addEventListener("input", update);
  form.addEventListener("submit", (e) => { e.preventDefault(); update(); });
})();
