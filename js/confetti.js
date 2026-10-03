/*
  Click anywhere that isn't a milestone (or a link/button) and get a small
  burst of silver, white and blue confetti. Milestone clicks call
  e.stopPropagation() in maze.js so they never reach this listener.
*/

const CONFETTI_COLORS = [
  "#ffffff", "#eaf2ff", "#c9d2de", "#9aa5b4",
  "#7fd3ff", "#bfe8ff", "#2f80ed"
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

function shouldTriggerBurst(target) {
  return !target.closest("#card-close, a, button, #maze-mode-btn");
}

document.addEventListener("click", (e) => {
  if (!shouldTriggerBurst(e.target)) return;
  spawnConfetti(e.clientX, e.clientY);
});
