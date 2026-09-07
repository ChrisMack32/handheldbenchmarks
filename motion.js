// Progressive enhancement: content stays visible if animation is unavailable.
const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
const root = document.documentElement;
const button = document.getElementById("motion-toggle");
let paused = false;
try {
  paused = localStorage.getItem("wd-motion-paused") === "true";
} catch {
  /* Storage is optional. */
}

function syncMotion() {
  const reduced = preference.matches;
  root.dataset.motion = reduced || paused ? "off" : "on";
  button.disabled = reduced;
  button.textContent = reduced
    ? "Motion reduced"
    : paused
      ? "Resume motion"
      : "Pause motion";
  button.setAttribute(
    "aria-label",
    reduced
      ? "Motion reduced by your system preference"
      : paused
        ? "Resume decorative motion"
        : "Pause decorative motion",
  );
  button.setAttribute("aria-pressed", String(paused || reduced));
}
button.addEventListener("click", () => {
  paused = !paused;
  try {
    localStorage.setItem("wd-motion-paused", String(paused));
  } catch {
    /* Storage is optional. */
  }
  syncMotion();
});
preference.addEventListener("change", syncMotion);
syncMotion();

// Stop ambient animation when the artwork is offscreen or the page is hidden.
const art = document.querySelector(".den-art");
let artVisible = true;
function syncActivity() {
  root.classList.toggle("page-idle", document.hidden);
  art.classList.toggle("motion-idle", document.hidden || !artVisible);
}
document.addEventListener("visibilitychange", syncActivity);
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([entry]) => {
    artVisible = entry.isIntersecting;
    syncActivity();
  }).observe(art);
  const entrance = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        if (root.dataset.motion === "on")
          entry.target.classList.add("motion-enter");
        entrance.unobserve(entry.target);
      }
    },
    { threshold: 0.12 },
  );
  const observed = new WeakSet();
  function observeSections() {
    document
      .querySelectorAll(
        ".hero-copy, .den-art, .filters, .winner, .summary > *, .chart-card, .bar-row, .method-note, .footer-top, .footer-wordmark",
      )
      .forEach((el) => {
        if (observed.has(el)) return;
        observed.add(el);
        entrance.observe(el);
      });
  }
  observeSections();
  new MutationObserver(observeSections).observe(
    document.getElementById("results"),
    { childList: true, subtree: true },
  );
}
syncActivity();
