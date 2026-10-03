/*
  Builds the road as a real procedurally-generated maze (recursive
  backtracker → a perfect maze, all straight lines / right angles, no
  loops) that fills the entire stage. Drawn on canvas so only the wall
  pixels are painted — everything else stays transparent, so the dotted
  page background shows straight through.

  "maze mode" turns on a keyboard-controlled ball bearing that
  walks the corridors for real, blocked by walls, via arrow keys / WASD.
*/

const MAZE_WALL_FILL = "#eaf2ff"; // blueprint linework
const MAZE_DRAW_MS = 1400; // how long the plan takes to "draw itself" the first time
const MAZE_CELL_TARGET = 64;

let mazeGrid = [];
let mazeCols = 0;
let mazeRows = 0;
let mazeCellW = 0;
let mazeCellH = 0;
let mazeMilestoneCells = [];
let mazeActive = false;
let mazeCurrentCell = { r: 0, c: 0 };
let mazeKeydownBound = false;
let mazeDrawnOnce = false;
let mazeDrawRaf = 0;
let mazeTrail = [];

function generateMaze(cols, rows) {
  const cells = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({ visited: false, walls: { top: true, right: true, bottom: true, left: true } });
    }
    cells.push(row);
  }

  const dirs = [
    { dr: -1, dc: 0, self: "top", opp: "bottom" },
    { dr: 0, dc: 1, self: "right", opp: "left" },
    { dr: 1, dc: 0, self: "bottom", opp: "top" },
    { dr: 0, dc: -1, self: "left", opp: "right" }
  ];

  const stack = [{ r: 0, c: 0 }];
  cells[0][0].visited = true;

  while (stack.length) {
    const cur = stack[stack.length - 1];
    const options = dirs
      .map((d) => ({ ...d, r: cur.r + d.dr, c: cur.c + d.dc }))
      .filter((n) => n.r >= 0 && n.r < rows && n.c >= 0 && n.c < cols && !cells[n.r][n.c].visited);

    if (options.length === 0) {
      stack.pop();
      continue;
    }

    const pick = options[Math.floor(Math.random() * options.length)];
    cells[cur.r][cur.c].walls[pick.self] = false;
    cells[pick.r][pick.c].walls[pick.opp] = false;
    cells[pick.r][pick.c].visited = true;
    stack.push({ r: pick.r, c: pick.c });
  }

  return cells;
}

// distance (in steps) of every cell from the start, so the walls can be
// drawn outward from the entrance like a pen tracing the plan
function mazeDistances() {
  const dist = mazeGrid.map((row) => row.map(() => Infinity));
  const queue = [{ r: 0, c: 0 }];
  dist[0][0] = 0;
  const steps = [
    { dr: -1, dc: 0, wall: "top" },
    { dr: 1, dc: 0, wall: "bottom" },
    { dr: 0, dc: -1, wall: "left" },
    { dr: 0, dc: 1, wall: "right" }
  ];
  while (queue.length) {
    const { r, c } = queue.shift();
    steps.forEach(({ dr, dc, wall }) => {
      const nr = r + dr;
      const nc = c + dc;
      if (mazeGrid[r][c].walls[wall] || nr < 0 || nr >= mazeRows || nc < 0 || nc >= mazeCols) return;
      if (dist[nr][nc] !== Infinity) return;
      dist[nr][nc] = dist[r][c] + 1;
      queue.push({ r: nr, c: nc });
    });
  }
  return dist;
}

function drawMaze(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const cssW = mazeCols * mazeCellW;
  const cssH = mazeRows * mazeCellH;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const wallT = 1.6;
  const dist = mazeDistances();
  const walls = [];
  function addWall(x1, y1, x2, y2, r, c) {
    walls.push({ x1, y1, x2, y2, d: dist[r][c] });
  }

  for (let r = 0; r < mazeRows; r++) {
    for (let c = 0; c < mazeCols; c++) {
      const cell = mazeGrid[r][c];
      const x = c * mazeCellW;
      const y = r * mazeCellH;
      if (cell.walls.top) addWall(x, y, x + mazeCellW, y, r, c);
      if (cell.walls.left) addWall(x, y, x, y + mazeCellH, r, c);
      if (r === mazeRows - 1 && cell.walls.bottom) addWall(x, y + mazeCellH, x + mazeCellW, y + mazeCellH, r, c);
      if (c === mazeCols - 1 && cell.walls.right) addWall(x + mazeCellW, y, x + mazeCellW, y + mazeCellH, r, c);
    }
  }
  walls.sort((a, b) => a.d - b.d);
  const maxD = walls.length ? walls[walls.length - 1].d : 1;

  // walls sit half a stroke inside the canvas so the outer edge isn't clipped
  const pad = wallT / 2;
  function paint(progress) {
    ctx.clearRect(0, 0, cssW, cssH);

    // faint centre dots on every cell, like a drafting grid
    ctx.fillStyle = "rgba(234, 242, 255, 0.16)";
    for (let r = 0; r < mazeRows; r++) {
      for (let c = 0; c < mazeCols; c++) {
        ctx.fillRect(c * mazeCellW + mazeCellW / 2 - 1, r * mazeCellH + mazeCellH / 2 - 1, 2, 2);
      }
    }

    ctx.strokeStyle = MAZE_WALL_FILL;
    ctx.lineWidth = wallT;
    ctx.lineCap = "square";
    ctx.beginPath();
    const front = progress * (maxD + 4);
    walls.forEach((w) => {
      // each wall grows from its start point once the "pen" reaches it
      const t = Math.min(1, Math.max(0, (front - w.d) / 4));
      if (t <= 0) return;
      const x1 = Math.min(cssW - pad, Math.max(pad, w.x1));
      const y1 = Math.min(cssH - pad, Math.max(pad, w.y1));
      const x2 = Math.min(cssW - pad, Math.max(pad, w.x2));
      const y2 = Math.min(cssH - pad, Math.max(pad, w.y2));
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t);
    });
    ctx.stroke();
  }

  cancelAnimationFrame(mazeDrawRaf);
  const animate = !mazeDrawnOnce && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  mazeDrawnOnce = true;
  if (!animate) {
    paint(1);
    return;
  }
  const start = performance.now() + 500; // let the page frame start drawing first
  function frame(now) {
    const p = Math.min(1, Math.max(0, (now - start) / MAZE_DRAW_MS));
    // ease-out so the pen slows as it reaches the far corner
    paint(1 - Math.pow(1 - p, 3));
    if (p < 1) mazeDrawRaf = requestAnimationFrame(frame);
  }
  mazeDrawRaf = requestAnimationFrame(frame);
}

function cellCenter(r, c) {
  return { x: c * mazeCellW + mazeCellW / 2, y: r * mazeCellH + mazeCellH / 2 };
}

function pickMilestoneCells(n) {
  const cells = [];
  for (let i = 0; i < n; i++) {
    const rowFrac = (i + 1) / (n + 1);
    const r = Math.min(mazeRows - 1, Math.max(0, Math.round(rowFrac * (mazeRows - 1))));
    const cFrac = i % 2 === 0 ? 0.22 : 0.78;
    const c = Math.min(mazeCols - 1, Math.max(0, Math.round(mazeCols * cFrac)));
    cells.push({ r, c });
  }
  return cells;
}

const MILESTONE_ICONS = {
  telephone: () => photoIcon("telephone", "rotary telephone dial"),
  career: () => photoIcon("work", "laptop"),
  education: () => photoIcon("education", "folder")
};

function placeMilestones() {
  const milestonesEl = document.getElementById("milestones");
  milestonesEl.innerHTML = "";
  mazeMilestoneCells = pickMilestoneCells(MILESTONES.length);

  MILESTONES.forEach((data, i) => {
    const cell = mazeMilestoneCells[i];
    const pos = cellCenter(cell.r, cell.c);
    const side = data.side || (cell.c < mazeCols / 2 ? "left" : "right");

    const el = document.createElement("div");
    el.dataset.milestone = i;
    el.style.left = `${pos.x}px`;
    el.style.top = `${pos.y}px`;

    const icon = MILESTONE_ICONS[data.type];
    if (icon) {
      el.className = `milestone icon-milestone ${data.type}-milestone`;
      el.innerHTML = `
        <div class="milestone-marker icon-marker ${data.type}-marker">${icon()}</div>
        <div class="milestone-tooltip">${data.title}</div>
      `;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        openMilestoneCard(data);
      });
      milestonesEl.appendChild(el);
      return;
    }

    el.className = `milestone side-${side}`;
    el.dataset.status = data.status || "done";

    el.innerHTML = `
      <div class="milestone-marker">${String(i + 1).padStart(2, "0")}</div>
      <div class="milestone-label">${data.title}</div>
    `;

    el.addEventListener("click", (e) => {
      e.stopPropagation();
      openMilestoneCard(data);
    });
    milestonesEl.appendChild(el);
  });
}

function placeMazeEndpoints() {
  const startEl = document.getElementById("maze-start");
  const goalEl = document.getElementById("maze-goal");
  if (!startEl || !goalEl) return;

  const startPos = cellCenter(0, 0);
  startEl.style.left = `${startPos.x}px`;
  startEl.style.top = `${startPos.y}px`;
  startEl.innerHTML = checkeredFlagSVG();

  const goalPos = cellCenter(mazeRows - 1, mazeCols - 1);
  goalEl.style.left = `${goalPos.x}px`;
  goalEl.style.top = `${goalPos.y}px`;
  // the horse race puzzle sits at the end of the maze: always visible and
  // clickable, and rolling the ball bearing onto it in maze mode opens it too
  goalEl.innerHTML = photoIcon("puzzle", "click here key");
  goalEl.onclick = (e) => {
    e.stopPropagation();
    openPuzzle();
  };
}

function buildMaze() {
  const wrap = document.getElementById("road-wrap");
  const canvas = document.getElementById("maze-canvas");
  if (!wrap || !canvas) return;

  const stageW = wrap.clientWidth;
  const stageH = wrap.clientHeight;
  // nothing to do if the panel hasn't changed size (e.g. the late "load" pass)
  if (mazeGrid.length && stageW === buildMaze.lastW && stageH === buildMaze.lastH) return;
  buildMaze.lastW = stageW;
  buildMaze.lastH = stageH;

  mazeCols = Math.max(8, Math.floor(stageW / MAZE_CELL_TARGET));
  mazeRows = Math.max(6, Math.floor(stageH / MAZE_CELL_TARGET));
  mazeCellW = stageW / mazeCols;
  mazeCellH = stageH / mazeRows;

  mazeGrid = generateMaze(mazeCols, mazeRows);
  drawMaze(canvas);
  placeMilestones();
  placeMazeEndpoints();

  if (mazeActive) deactivateMazeMode();
}

/* ---------- maze mode: keyboard-controlled ball bearing ---------- */

const MAZE_DIRS = {
  ArrowUp: { dr: -1, dc: 0, wall: "top" },
  w: { dr: -1, dc: 0, wall: "top" },
  W: { dr: -1, dc: 0, wall: "top" },
  ArrowDown: { dr: 1, dc: 0, wall: "bottom" },
  s: { dr: 1, dc: 0, wall: "bottom" },
  S: { dr: 1, dc: 0, wall: "bottom" },
  ArrowLeft: { dr: 0, dc: -1, wall: "left" },
  a: { dr: 0, dc: -1, wall: "left" },
  A: { dr: 0, dc: -1, wall: "left" },
  ArrowRight: { dr: 0, dc: 1, wall: "right" },
  d: { dr: 0, dc: 1, wall: "right" },
  D: { dr: 0, dc: 1, wall: "right" }
};

function drawMazeTrail() {
  const line = document.querySelector("#maze-trail polyline");
  if (!line) return;
  line.setAttribute("points", mazeTrail.map(({ r, c }) => {
    const p = cellCenter(r, c);
    return `${p.x},${p.y}`;
  }).join(" "));
}

function placeMazeWalkerAt(r, c) {
  const el = document.getElementById("maze-walker");
  const pos = cellCenter(r, c);
  el.style.left = `${pos.x}px`;
  el.style.top = `${pos.y}px`;
}

function checkMazeMilestoneHit(r, c) {
  const idx = mazeMilestoneCells.findIndex((cell) => cell.r === r && cell.c === c);
  if (idx === -1) return;
  const pos = cellCenter(r, c);
  const wrap = document.getElementById("road-wrap");
  const rect = wrap.getBoundingClientRect();
  if (window.spawnConfetti) spawnConfetti(rect.left + pos.x, rect.top + pos.y);

  openMilestoneCard(MILESTONES[idx]);
}

function handleMazeKeydown(e) {
  if (!mazeActive) return;
  const move = MAZE_DIRS[e.key];
  if (!move) return;
  e.preventDefault();

  const { r, c } = mazeCurrentCell;
  const cell = mazeGrid[r] && mazeGrid[r][c];
  if (!cell || cell.walls[move.wall]) return;

  const nr = r + move.dr;
  const nc = c + move.dc;
  if (nr < 0 || nr >= mazeRows || nc < 0 || nc >= mazeCols) return;

  mazeCurrentCell = { r: nr, c: nc };
  placeMazeWalkerAt(nr, nc);
  // stepping back onto the previous cell rewinds the trail instead of doubling it
  const prev = mazeTrail[mazeTrail.length - 2];
  if (prev && prev.r === nr && prev.c === nc) mazeTrail.pop();
  else mazeTrail.push({ r: nr, c: nc });
  drawMazeTrail();

  // spin the ball in the direction of travel
  const el = document.getElementById("maze-walker");
  const spin = (Number(el.dataset.spin) || 0) + (move.dc || move.dr) * 90;
  el.dataset.spin = spin;
  el.style.transform = `rotate(${spin}deg)`;

  checkMazeMilestoneHit(nr, nc);
  checkMazeGoalReached(nr, nc);
}

function checkMazeGoalReached(r, c) {
  if (r !== mazeRows - 1 || c !== mazeCols - 1) return;
  const pos = cellCenter(r, c);
  const wrap = document.getElementById("road-wrap");
  const rect = wrap.getBoundingClientRect();
  if (window.spawnConfettiBomb) spawnConfettiBomb(rect.left + pos.x, rect.top + pos.y);
  // let the confetti land, then hand over the prize
  setTimeout(() => {
    if (mazeActive && window.openPuzzle) openPuzzle();
  }, 700);
}

function activateMazeMode() {
  mazeActive = true;
  mazeCurrentCell = { r: 0, c: 0 };
  mazeTrail = [{ r: 0, c: 0 }];
  drawMazeTrail();

  const el = document.getElementById("maze-walker");
  el.hidden = false;
  el.innerHTML = ballBearingSVG();
  placeMazeWalkerAt(0, 0);

  const startEl = document.getElementById("maze-start");
  if (startEl) startEl.hidden = false;

  const btn = document.getElementById("maze-mode-btn");
  btn.textContent = "exit maze mode";
  btn.classList.add("active");

  if (!mazeKeydownBound) {
    window.addEventListener("keydown", handleMazeKeydown);
    mazeKeydownBound = true;
  }
}

function deactivateMazeMode() {
  mazeActive = false;
  mazeTrail = [];
  drawMazeTrail();

  const el = document.getElementById("maze-walker");
  if (el) el.hidden = true;

  const startEl = document.getElementById("maze-start");
  if (startEl) startEl.hidden = true;

  const btn = document.getElementById("maze-mode-btn");
  if (btn) {
    btn.textContent = "maze mode";
    btn.classList.remove("active");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  buildMaze();
  const btn = document.getElementById("maze-mode-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      if (mazeActive) deactivateMazeMode();
      else activateMazeMode();
    });
  }
});

// the panel's final size can settle after web fonts load, so rebuild then
window.addEventListener("load", buildMaze);

let mazeResizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(mazeResizeTimer);
  mazeResizeTimer = setTimeout(buildMaze, 150);
});
