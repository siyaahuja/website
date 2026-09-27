/*
  Outside maze mode the maze is hidden and the page's things float around
  in soap bubbles instead, bouncing off the screen edges (below the header)
  and off each other. Click one to open it. In maze mode the bubbles hide:
  the telephone becomes a stop in the maze and the unicorn puzzle waits at
  the finish line (see maze.js). Paused while any overlay is open.
*/

const BUBBLE_SIZE = 84;
const BUBBLE_SPEED = 70; // px per second

function bubbleItems() {
  const telephone = MILESTONES.find((m) => m.type === "telephone");
  const items = [
    { svg: unicornSVG(), label: "my favourite puzzle", open: () => openPuzzle() }
  ];
  if (telephone) {
    items.push({ svg: telephoneSVG(), label: telephone.title, open: () => openMilestoneCard(telephone) });
  }
  return items;
}

let bubbles = [];
let bubbleLastT = 0;

function bubbleBounds() {
  const headerH = document.getElementById("site-header")?.offsetHeight || 0;
  return {
    minX: 0,
    minY: headerH,
    maxX: Math.max(0, window.innerWidth - BUBBLE_SIZE),
    maxY: Math.max(headerH, window.innerHeight - BUBBLE_SIZE)
  };
}

function bubblesPaused() {
  if (document.body.classList.contains("maze-active")) return true;
  return ["puzzle-overlay", "card-overlay"].some((id) => {
    const el = document.getElementById(id);
    return el && !el.classList.contains("hidden");
  });
}

function bounceBubblesApart(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0 || dist >= BUBBLE_SIZE) return;

  // push them apart so they don't overlap
  const nx = dx / dist;
  const ny = dy / dist;
  const push = (BUBBLE_SIZE - dist) / 2;
  a.x -= nx * push; a.y -= ny * push;
  b.x += nx * push; b.y += ny * push;

  // equal-mass elastic bounce: swap velocity along the line between them
  const va = a.vx * nx + a.vy * ny;
  const vb = b.vx * nx + b.vy * ny;
  if (va - vb <= 0) return; // already moving apart
  a.vx += (vb - va) * nx; a.vy += (vb - va) * ny;
  b.vx += (va - vb) * nx; b.vy += (va - vb) * ny;
}

function stepBubbles(t) {
  const dt = bubbleLastT ? Math.min(0.05, (t - bubbleLastT) / 1000) : 0;
  bubbleLastT = t;

  if (!bubblesPaused()) {
    const b = bubbleBounds();
    const moving = bubbles.filter((bub) => !bub.el.matches(":hover"));

    moving.forEach((bub) => {
      bub.x += bub.vx * dt;
      bub.y += bub.vy * dt;
      if (bub.x <= b.minX) { bub.x = b.minX; bub.vx = Math.abs(bub.vx); }
      if (bub.x >= b.maxX) { bub.x = b.maxX; bub.vx = -Math.abs(bub.vx); }
      if (bub.y <= b.minY) { bub.y = b.minY; bub.vy = Math.abs(bub.vy); }
      if (bub.y >= b.maxY) { bub.y = b.maxY; bub.vy = -Math.abs(bub.vy); }
    });

    for (let i = 0; i < moving.length; i++) {
      for (let j = i + 1; j < moving.length; j++) bounceBubblesApart(moving[i], moving[j]);
    }

    bubbles.forEach((bub) => {
      bub.el.style.transform = `translate(${bub.x}px, ${bub.y}px)`;
    });
  }

  requestAnimationFrame(stepBubbles);
}

document.addEventListener("DOMContentLoaded", () => {
  const b = bubbleBounds();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const items = bubbleItems();
  bubbles = items.map((item, i) => {
    const el = document.createElement("button");
    el.className = "float-bubble";
    el.type = "button";
    el.setAttribute("aria-label", item.label);
    el.innerHTML = `
      <span class="bubble-icon">${item.svg}</span>
      <span class="bubble-tooltip">${item.label}</span>
    `;
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      if (window.spawnConfetti) spawnConfetti(e.clientX, e.clientY);
      item.open();
    });
    document.body.appendChild(el);

    // each bubble starts somewhere in its own vertical slice so they don't begin stacked
    const sliceW = (b.maxX - b.minX) / items.length;
    const x = reducedMotion
      ? b.maxX - 16 - i * (BUBBLE_SIZE + 12)
      : b.minX + sliceW * (i + Math.random());
    const y = reducedMotion ? b.maxY - 16 : b.minY + Math.random() * (b.maxY - b.minY);
    const angle = Math.random() * Math.PI * 2;
    el.style.transform = `translate(${x}px, ${y}px)`;
    return { el, x, y, vx: Math.cos(angle) * BUBBLE_SPEED, vy: Math.sin(angle) * BUBBLE_SPEED };
  });

  // reduced motion: the bubbles just sit in the corner
  if (!reducedMotion) requestAnimationFrame(stepBubbles);
});
