/*
  Outside maze mode, the unicorn puzzle floats around the page in a soap
  bubble, bouncing off the edges of the screen (below the header). Click
  it to play. In maze mode it's hidden — the unicorn waits at the maze's
  finish line instead (see maze.js). Paused while the puzzle is open.
*/

const BUBBLE_SIZE = 84;
const BUBBLE_SPEED = 70; // px per second

let bubbleX = 0;
let bubbleY = 0;
let bubbleVX = 0;
let bubbleVY = 0;
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

function bubblePaused() {
  const puzzle = document.getElementById("puzzle-overlay");
  return (
    document.body.classList.contains("maze-active") ||
    (puzzle && !puzzle.classList.contains("hidden"))
  );
}

function stepBubble(t) {
  const el = document.getElementById("puzzle-bubble");
  const dt = bubbleLastT ? Math.min(0.05, (t - bubbleLastT) / 1000) : 0;
  bubbleLastT = t;

  if (el && !bubblePaused() && !el.matches(":hover")) {
    const b = bubbleBounds();
    bubbleX += bubbleVX * dt;
    bubbleY += bubbleVY * dt;

    if (bubbleX <= b.minX) { bubbleX = b.minX; bubbleVX = Math.abs(bubbleVX); }
    if (bubbleX >= b.maxX) { bubbleX = b.maxX; bubbleVX = -Math.abs(bubbleVX); }
    if (bubbleY <= b.minY) { bubbleY = b.minY; bubbleVY = Math.abs(bubbleVY); }
    if (bubbleY >= b.maxY) { bubbleY = b.maxY; bubbleVY = -Math.abs(bubbleVY); }

    el.style.transform = `translate(${bubbleX}px, ${bubbleY}px)`;
  }

  requestAnimationFrame(stepBubble);
}

document.addEventListener("DOMContentLoaded", () => {
  const el = document.createElement("button");
  el.id = "puzzle-bubble";
  el.type = "button";
  el.setAttribute("aria-label", "play my favourite puzzle");
  el.innerHTML = `
    <span class="bubble-unicorn">${unicornSVG()}</span>
    <span class="bubble-tooltip">my favourite puzzle</span>
  `;
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    if (window.spawnConfetti) spawnConfetti(e.clientX, e.clientY);
    openPuzzle();
  });
  document.body.appendChild(el);

  const b = bubbleBounds();
  bubbleX = b.minX + Math.random() * (b.maxX - b.minX);
  bubbleY = b.minY + Math.random() * (b.maxY - b.minY);
  const angle = Math.random() * Math.PI * 2;
  bubbleVX = Math.cos(angle) * BUBBLE_SPEED;
  bubbleVY = Math.sin(angle) * BUBBLE_SPEED;
  el.style.transform = `translate(${bubbleX}px, ${bubbleY}px)`;

  // reduced motion: the bubble just sits in the corner
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.style.transform = `translate(${b.maxX - 16}px, ${b.maxY - 16}px)`;
    return;
  }
  requestAnimationFrame(stepBubble);
});
