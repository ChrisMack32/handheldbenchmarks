const audio = document.getElementById("background-audio");
const toggle = document.getElementById("music-play");
const slider = document.getElementById("music-volume");
const seek = document.getElementById("music-seek");
const status = document.getElementById("music-status");
const player = document.getElementById("soundtrack");
audio.volume = 0.5;
const clock = (seconds) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
function sync() {
  const playing = !audio.paused;
  player.classList.toggle("is-playing", playing);
  toggle.textContent = playing ? "Ⅱ Pause" : "▶ Play music";
  toggle.setAttribute(
    "aria-label",
    playing ? "Pause background music" : "Play background music",
  );
  toggle.setAttribute("aria-pressed", String(playing));
}
toggle.addEventListener("click", async () => {
  if (!audio.paused) {
    audio.pause();
    return;
  }
  status.textContent = "Loading the soundtrack…";
  try {
    await audio.play();
  } catch (error) {
    if (error.name !== "AbortError")
      status.textContent = "Unable to play. Press Play to retry.";
  }
});
audio.addEventListener("playing", () => {
  status.textContent = "Now playing · loops automatically";
  sync();
});
audio.addEventListener("pause", () => {
  status.textContent = "Paused · pick up where you left off";
  sync();
});
audio.addEventListener("waiting", () => {
  status.textContent = "Buffering…";
});
audio.addEventListener("error", () => {
  status.textContent = "Audio could not load. Refresh or try again.";
  sync();
});
audio.addEventListener("loadedmetadata", () => {
  seek.disabled = false;
  seek.max = audio.duration;
  document.getElementById("music-duration").textContent = clock(audio.duration);
});
audio.addEventListener("timeupdate", () => {
  seek.value = audio.currentTime;
  document.getElementById("music-time").textContent = clock(audio.currentTime);
  seek.setAttribute("aria-valuetext", clock(audio.currentTime));
});
seek.addEventListener("input", () => {
  if (Number.isFinite(audio.duration)) audio.currentTime = Number(seek.value);
});
slider.addEventListener("input", () => {
  audio.volume = Number(slider.value) / 100;
  document.getElementById("music-volume-value").value = `${slider.value}%`;
});
sync();
