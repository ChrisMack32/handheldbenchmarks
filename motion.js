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
  document
    .querySelectorAll(".hero-copy, .den-art, .method-note, .footer-top")
    .forEach((el) => entrance.observe(el));
}
syncActivity();
