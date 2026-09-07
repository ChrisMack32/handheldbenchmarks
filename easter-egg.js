const display = document.querySelector(".wolf-display");
const image = display.querySelector("img");
const original = image.getAttribute("src");
const surprises = ["assets/easter-egg-1.jpg", "assets/easter-egg-2.jpg"];
let timer;

// Load the small images ahead of time so the timed reveal is immediate.
for (const src of surprises) {
  const preload = new Image();
  preload.src = src;
}

function reset() {
  clearTimeout(timer);
  image.src = original;
  display.classList.remove("easter-egg");
}

display.addEventListener("pointerenter", (event) => {
  if (event.pointerType === "touch") return;
  reset();
  timer = setTimeout(() => {
    display.classList.add("easter-egg");
    image.src = surprises[0];
    // Ten more seconds hovering over the first reveal unlocks the second.
    timer = setTimeout(() => {
      image.src = surprises[1];
    }, 10000);
  }, 3000);
});
display.addEventListener("pointerleave", reset);
display.addEventListener("pointercancel", reset);
window.addEventListener("blur", reset);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) reset();
});
