/*
  Click anywhere that isn't a milestone (or a link/button) and get a burst
  of pink + silver confetti, plus an unmistakable pixel fart cloud that
  puffs out from the side of the piggy cursor. Milestone clicks call
  e.stopPropagation() in maze.js so they never reach this listener.
*/

const CONFETTI_COLORS = [
  "#ff2d95", "#ff8fce", "#ffb3dd", "#c4187a",
  "#e8e8e8", "#cfcfcf", "#ffffff"
];

function spawnConfetti(x, y, opts) {
  const count = (opts && opts.count) || 22;
  const minDist = (opts && opts.minDist) || 55;
  const maxDist = (opts && opts.maxDist) || 90;
  const life = (opts && opts.life) || 850;
  const sizeBoost = (opts && opts.sizeBoost) || 0;

  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";

    const angle = Math.random() * Math.PI * 2;
    const dist = minDist + Math.random() * (maxDist - minDist);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 25;
    const rot = `${Math.random() * 720 - 360}deg`;
    const size = 5 + sizeBoost + Math.random() * (5 + sizeBoost);
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];

    el.style.setProperty("--start-x", `${x}px`);
    el.style.setProperty("--start-y", `${y}px`);
    el.style.setProperty("--dx", `${dx}px`);
    el.style.setProperty("--dy", `${dy}px`);
    el.style.setProperty("--rot", rot);
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.background = color;
    el.style.borderRadius = Math.random() > 0.5 ? "50%" : "1px";
    el.style.animationDuration = `${life}ms`;

    document.body.appendChild(el);
    setTimeout(() => el.remove(), life);
  }
}

// A much bigger, multi-wave burst for the maze's finish line.
function spawnConfettiBomb(x, y) {
  const waves = [0, 110, 220];
  waves.forEach((delay, i) => {
    setTimeout(() => {
      const jitterX = x + (Math.random() * 120 - 60);
      spawnConfetti(jitterX, y, { count: 45, minDist: 90, maxDist: 220, life: 1100, sizeBoost: 3 });
    }, delay);
  });
}
window.spawnConfettiBomb = spawnConfettiBomb;

const FART_CLOUD_GRID = [
  ".CCCC.",
  "CCCCCC",
  ".CCCC."
];

function fartCloudSVG(puffClass) {
  let rects = "";
  FART_CLOUD_GRID.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === ".") return;
      rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="#eceaf0"/>`;
    });
  });
  return (
    `<svg class="${puffClass}" viewBox="0 0 6 3" shape-rendering="crispEdges" ` +
    `xmlns="http://www.w3.org/2000/svg">${rects}</svg>`
  );
}

// Spawns from the REAR side of the pig (opposite whichever way she's
// facing) so it visibly comes out of her, not out of thin air at the
// click point.
function spawnFart(fallbackX, fallbackY) {
  const state = window.PIGGY_STATE;
  const facing = state ? state.facing : 1;
  const px = state ? state.x : fallbackX;
  const py = state ? state.y : fallbackY;

  const x = px - facing * 30;
  const y = py + 14;

  const el = document.createElement("div");
  el.className = "fart-burst";
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.innerHTML = `
    <div class="fart-cloud">
      ${fartCloudSVG("puff-1")}
      ${fartCloudSVG("puff-2")}
      ${fartCloudSVG("puff-3")}
    </div>
    <div class="fart-text">pfft!</div>
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1050);

  if (window.triggerPiggyFart) window.triggerPiggyFart();
}

function shouldTriggerBurst(target) {
  return !target.closest("#card-close, a, button, #maze-mode-btn");
}

document.addEventListener("click", (e) => {
  if (!shouldTriggerBurst(e.target)) return;
  spawnConfetti(e.clientX, e.clientY);
  spawnFart(e.clientX, e.clientY);
});
