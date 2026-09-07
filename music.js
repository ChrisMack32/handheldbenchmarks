const launch = document.getElementById("music-launch");
const panel = document.getElementById("music-panel");
const toggle = document.getElementById("music-play");
const slider = document.getElementById("music-volume");
const status = document.getElementById("music-status");
let player,
  ready = false,
  apiPromise,
  generation = 0;
function loadAPI() {
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timer = setTimeout(() => {
      script.remove();
      apiPromise = null;
      reject(new Error("timeout"));
    }, 15000);
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timer);
      resolve();
    };
    script.onerror = () => {
      clearTimeout(timer);
      script.remove();
      apiPromise = null;
      reject(new Error("network"));
    };
    script.src = "https://www.youtube.com/iframe_api";
    document.head.append(script);
  });
  return apiPromise;
}
function closeMusic() {
  generation++;
  player?.destroy();
  player = undefined;
  ready = false;
  document.getElementById("music-mount").innerHTML =
    '<div id="youtube-music"></div>';
  panel.hidden = true;
  launch.hidden = false;
  launch.setAttribute("aria-expanded", "false");
  launch.focus();
}
launch.addEventListener("click", async () => {
  const run = ++generation;
  panel.hidden = false;
  launch.hidden = true;
  launch.setAttribute("aria-expanded", "true");
  toggle.disabled = true;
  slider.disabled = true;
  slider.value = 25;
  document.getElementById("music-volume-value").value = "25%";
  status.textContent = "Connecting to YouTube…";
  document.getElementById("music-close").focus();
  try {
    await loadAPI();
    if (run !== generation) return;
    player = new window.YT.Player("youtube-music", {
      width: "100%",
      height: "200",
      videoId: "wdKbdiubuaA",
      playerVars: {
        playsinline: 1,
        origin: location.origin,
        loop: 1,
        playlist: "wdKbdiubuaA",
      },
      events: {
        onReady(event) {
          if (run !== generation) return;
          ready = true;
          event.target.setVolume(25);
          toggle.disabled = false;
          slider.disabled = false;
          event.target.getIframe().title =
            "WULFF DEN x Chilled beats to relax and study to";
          status.textContent = "Ready · press Play if playback does not start.";
          if (!document.hidden) event.target.playVideo();
        },
        onStateChange(event) {
          if (run !== generation) return;
          const playing = event.data === 1;
          toggle.textContent = playing ? "Ⅱ Pause" : "▶ Play";
          toggle.setAttribute(
            "aria-label",
            playing ? "Pause background music" : "Play background music",
          );
          if (event.data === 1)
            status.textContent = "Now playing · Wulff Den chilled beats";
          else if (event.data === 2) status.textContent = "Music paused";
          else if (event.data === 3) status.textContent = "Buffering…";
        },
        onAutoplayBlocked() {
          status.textContent = "Press Play to start the music.";
        },
        onError() {
          if (run !== generation) return;
          status.textContent =
            "YouTube cannot play this here. Try the YouTube link below.";
          toggle.disabled = true;
        },
      },
    });
  } catch {
    if (run === generation)
      status.textContent =
        "Could not reach YouTube. Close and reopen to retry.";
  }
});
toggle.addEventListener("click", () => {
  if (!ready) return;
  player.getPlayerState() === 1 ? player.pauseVideo() : player.playVideo();
});
slider.addEventListener("input", () => {
  document.getElementById("music-volume-value").value = `${slider.value}%`;
  if (ready) {
    player.setVolume(Number(slider.value));
    if (Number(slider.value)) player.unMute();
  }
});
document.getElementById("music-close").addEventListener("click", closeMusic);
panel.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMusic();
    event.stopPropagation();
  }
});
// Keep the embed visible during playback; do not continue in a background tab.
document.addEventListener("visibilitychange", () => {
  if (document.hidden && ready) player.pauseVideo();
});
