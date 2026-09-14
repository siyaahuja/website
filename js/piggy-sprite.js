/*
  Pixel-art Miss Piggy, drawn as a 10x12 grid of colored pixels (no image
  assets — pure SVG rects so it stays crisp at any scale).

  Two frames give the walk cycle: legs together (A) vs legs apart (B).
  This module renders the sprite into #piggy-cursor and makes it follow
  the mouse like a custom animated cursor. It also exposes the sprite's
  live position/facing as window.PIGGY_STATE (used by confetti.js to spawn
  the fart from the pig's side) and window.triggerPiggyFart() to play a
  little recoil shake without touching the position transform.
*/

const PIGGY_PALETTE = {
  H: "#f2c14e", // hair
  S: "#ffc2e0", // skin
  D: "#ff6fb8", // snout / shading
  E: "#1a0f16", // eyes
  B: "#ff2d95", // body / leotard
  G: "#ffffff", // gloves + leg warmers
  F: "#1a0f16"  // feet
};

const PIGGY_BODY = [
  "..HHHHHH..",
  ".HHHHHHHH.",
  "HHHHHHHHHH",
  "HSSSSSSSSH",
  "SSE.SS.ESS",
  "SSSSDDSSSS",
  "SSSSDDSSSS",
  "SBBBBBBBBS",
  "BBBBBBBBBB",
  "BGBBBBBBGB"
];

const PIGGY_FRAME_A = PIGGY_BODY.concat([
  "..GG..GG..",
  "..FF..FF.."
]);

const PIGGY_FRAME_B = PIGGY_BODY.concat([
  ".GG....GG.",
  ".FF....FF."
]);

function renderPiggySVG(grid) {
  const cols = grid[0].length;
  const rows = grid.length;
  let rects = "";
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const key = grid[y][x];
      if (key === ".") continue;
      const color = PIGGY_PALETTE[key];
      rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`;
    }
  }
  return (
    `<svg viewBox="0 0 ${cols} ${rows}" shape-rendering="crispEdges" ` +
    `xmlns="http://www.w3.org/2000/svg">${rects}</svg>`
  );
}

window.PIGGY_STATE = { x: window.innerWidth / 2, y: window.innerHeight / 2, facing: 1 };

window.triggerPiggyFart = function triggerPiggyFart() {
  const visual = document.querySelector("#piggy-cursor .piggy-visual");
  if (!visual) return;
  visual.classList.remove("piggy-fart");
  // eslint-disable-next-line no-unused-expressions
  visual.offsetWidth; // restart animation if it's already mid-shake
  visual.classList.add("piggy-fart");
  setTimeout(() => visual.classList.remove("piggy-fart"), 320);
};

function initPiggyCursor() {
  const el = document.getElementById("piggy-cursor");
  if (!el) return;

  // Touch / coarse-pointer devices don't get a custom cursor.
  if (!window.matchMedia("(pointer: fine)").matches) return;

  document.body.classList.add("piggy-cursor-active");

  const frameA = renderPiggySVG(PIGGY_FRAME_A);
  const frameB = renderPiggySVG(PIGGY_FRAME_B);
  el.innerHTML = `<div class="piggy-visual">${frameA}</div>`;
  const visual = el.querySelector(".piggy-visual");

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let lastX = mouseX;
  let lastMoveTime = 0;
  let facing = 1; // 1 = right, -1 = left
  let walkFrame = false;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    const dx = mouseX - lastX;
    if (Math.abs(dx) > 1) {
      facing = dx > 0 ? 1 : -1;
      lastX = mouseX;
      lastMoveTime = performance.now();
    }
    el.style.transform =
      `translate(${mouseX}px, ${mouseY}px) scaleX(${facing})`;
    window.PIGGY_STATE.x = mouseX;
    window.PIGGY_STATE.y = mouseY;
    window.PIGGY_STATE.facing = facing;
  });

  window.addEventListener("mousedown", () => {
    el.classList.add("piggy-jump");
  });
  window.addEventListener("mouseup", () => {
    el.classList.remove("piggy-jump");
  });

  // walk cycle: alternate frames while the mouse is actively moving,
  // settle back to the standing frame when it stops.
  setInterval(() => {
    const moving = performance.now() - lastMoveTime < 180;
    if (moving) {
      walkFrame = !walkFrame;
      visual.innerHTML = walkFrame ? frameB : frameA;
    } else if (walkFrame) {
      walkFrame = false;
      visual.innerHTML = frameA;
    }
  }, 130);
}

document.addEventListener("DOMContentLoaded", initPiggyCursor);
