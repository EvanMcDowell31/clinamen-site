// Screenshot modes (?still stops the motion, ?og draws the share card, ?icon the app icon),
// and nothing else: the page needs no script to work.
(() => {
  const q = new URLSearchParams(location.search);
  const root = document.documentElement;
  if (q.has("still")) root.classList.add("still");
  if (q.has("og")) document.body.classList.add("og");
  if (q.has("icon")) document.body.classList.add("icon");
})();
