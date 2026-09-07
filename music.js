const audio = document.getElementById("background-audio");
const toggle = document.getElementById("music-play");
const icon = document.getElementById("music-icon");
const status = document.getElementById("music-status");
const randomFraction =
  crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
let requested = false,
  positioned = false,
  fadingIn = false,
  fadeId = 0,
  actionId = 0;
audio.volume = 0;
function sync() {
  icon.textContent = requested ? "Ⅱ" : "▶";
  toggle.setAttribute("aria-pressed", String(requested));
  toggle.setAttribute(
    "aria-label",
    requested ? "Pause background music" : "Play background music",
  );
  toggle.title = requested
    ? "Pause music · fades out"
    : "Play music · fades in to 50%";
}
function fadeTo(target, duration, complete = () => {}) {
  cancelAnimationFrame(fadeId);
  const from = audio.volume,
    started = performance.now();
  function step(now) {
    const progress = Math.min(1, (now - started) / duration);
    const eased = progress * progress * (3 - 2 * progress);
    audio.volume = Math.max(0, Math.min(1, from + (target - from) * eased));
    if (progress < 1) fadeId = requestAnimationFrame(step);
    else complete();
  }
  fadeId = requestAnimationFrame(step);
}
function fadeInWhenReady() {
  if (!requested || !positioned || audio.paused || audio.seeking || fadingIn)
    return;
  fadingIn = true;
  status.textContent = "Music playing";
  fadeTo(0.5, 1600);
}
audio.addEventListener("loadedmetadata", () => {
  if (positioned || !Number.isFinite(audio.duration)) return;
  // One random point per page load, leaving space before the playlist ends.
  audio.currentTime = randomFraction * Math.max(0, audio.duration - 20);
  positioned = true;
});
audio.addEventListener("seeked", fadeInWhenReady);
audio.addEventListener("playing", fadeInWhenReady);
toggle.addEventListener("click", async () => {
  const action = ++actionId;
  requested = !requested;
  fadingIn = false;
  sync();
  if (!requested) {
    status.textContent = "Fading music out";
    fadeTo(0, 850, () => {
      if (requested) return;
      audio.pause();
      status.textContent = "Music paused";
    });
    return;
  }
  cancelAnimationFrame(fadeId);
  status.textContent = "Loading music";
  try {
    // Keep play inside the click handler for browser playback permission.
    await audio.play();
    if (action === actionId) fadeInWhenReady();
  } catch (error) {
    if (action !== actionId || error.name === "AbortError") return;
    requested = false;
    audio.volume = 0;
    status.textContent = "Unable to play music. Press Play to retry.";
    sync();
  }
});
audio.addEventListener("error", () => {
  cancelAnimationFrame(fadeId);
  requested = false;
  fadingIn = false;
  audio.volume = 0;
  status.textContent = "Audio could not load. Refresh or try again.";
  sync();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && !requested) {
    cancelAnimationFrame(fadeId);
    audio.volume = 0;
    audio.pause();
  }
});
sync();
