/*
  Builds the road as a real procedurally-generated maze (recursive
  backtracker → a perfect maze, all straight lines / right angles, no
  loops) that fills the entire stage. Drawn on canvas so only the wall
  pixels are painted — everything else stays transparent, so the dotted
  page background shows straight through.

  "maze mode" turns the piggy into a keyboard-controlled character that
  walks the corridors for real, blocked by walls, via arrow keys / WASD.
*/

const MAZE_WALL_COLOR = "#93125f";
const MAZE_WALL_FILL = "#ec1cae";
const MAZE_WALL_HIGHLIGHT = "#e8e8f2";
const MAZE_CELL_TARGET = 70;

let mazeGrid = [];
let mazeCols = 0;
let mazeRows = 0;
let mazeCellW = 0;
let mazeCellH = 0;
let mazeMilestoneCells = [];
let mazeActive = false;
let mazeCurrentCell = { r: 0, c: 0 };
let mazeKeydownBound = false;

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
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, cssW, cssH);

  const wallT = Math.max(8, Math.min(mazeCellW, mazeCellH) * 0.26);
  const inset = Math.max(1, wallT * 0.22);
  const shine = Math.max(1, wallT * 0.14);

  function wallRect(x, y, w, h) {
    ctx.fillStyle = MAZE_WALL_COLOR;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = MAZE_WALL_FILL;
    ctx.fillRect(x + inset, y + inset, Math.max(0, w - inset * 2), Math.max(0, h - inset * 2));
    // slim metallic bevel highlight along the top for a bit of chrome kitsch
    ctx.fillStyle = MAZE_WALL_HIGHLIGHT;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(x + inset, y + inset, Math.max(0, w - inset * 2), Math.min(shine, Math.max(0, h - inset * 2)));
    ctx.globalAlpha = 1;
  }

  for (let r = 0; r < mazeRows; r++) {
    for (let c = 0; c < mazeCols; c++) {
      const cell = mazeGrid[r][c];
      const x = c * mazeCellW;
      const y = r * mazeCellH;
      if (cell.walls.top) wallRect(x - wallT / 2, y - wallT / 2, mazeCellW + wallT, wallT);
      if (cell.walls.left) wallRect(x - wallT / 2, y - wallT / 2, wallT, mazeCellH + wallT);
      if (r === mazeRows - 1 && cell.walls.bottom) {
        wallRect(x - wallT / 2, y + mazeCellH - wallT / 2, mazeCellW + wallT, wallT);
      }
      if (c === mazeCols - 1 && cell.walls.right) {
        wallRect(x + mazeCellW - wallT / 2, y - wallT / 2, wallT, mazeCellH + wallT);
      }
    }
  }
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

function placeMilestones() {
  const milestonesEl = document.getElementById("milestones");
  milestonesEl.innerHTML = "";
  mazeMilestoneCells = pickMilestoneCells(MILESTONES.length);

  MILESTONES.forEach((data, i) => {
    const cell = mazeMilestoneCells[i];
    const pos = cellCenter(cell.r, cell.c);
    const side = data.side || (cell.c < mazeCols / 2 ? "left" : "right");

    const el = document.createElement("div");
    el.style.left = `${pos.x}px`;
    el.style.top = `${pos.y}px`;

    if (data.type === "telephone") {
      el.className = "milestone icon-milestone telephone-milestone";
      el.innerHTML = `
        <div class="milestone-marker telephone-marker">${telephoneSVG()}</div>
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

    const icon = data.status === "building" ? "★" : data.status === "next" ? "?" : "✓";
    el.innerHTML = `
      <div class="milestone-marker">${icon}</div>
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
  // the unicorn puzzle is the prize at the end of the maze
  goalEl.innerHTML = unicornSVG();
}

function buildMaze() {
  const wrap = document.getElementById("road-wrap");
  const canvas = document.getElementById("maze-canvas");
  if (!wrap || !canvas) return;

  const stageW = wrap.clientWidth;
  const stageH = wrap.clientHeight;

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

/* ---------- maze mode: keyboard-controlled pig ---------- */

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

function placeMazePiggyAt(r, c) {
  const el = document.getElementById("maze-piggy");
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
  placeMazePiggyAt(nr, nc);

  const el = document.getElementById("maze-piggy");
  if (move.dc !== 0) el.style.setProperty("--maze-facing", move.dc > 0 ? "1" : "-1");
  el.style.transform = `scaleX(var(--maze-facing, 1))`;

  el.innerHTML = renderPiggySVG(PIGGY_FRAME_B);
  setTimeout(() => {
    if (mazeActive) el.innerHTML = renderPiggySVG(PIGGY_FRAME_A);
  }, 140);

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

  const el = document.getElementById("maze-piggy");
  el.hidden = false;
  el.innerHTML = renderPiggySVG(PIGGY_FRAME_A);
  placeMazePiggyAt(0, 0);

  const startEl = document.getElementById("maze-start");
  const goalEl = document.getElementById("maze-goal");
  if (startEl) startEl.hidden = false;
  if (goalEl) goalEl.hidden = false;

  const cursor = document.getElementById("piggy-cursor");
  if (cursor) cursor.classList.add("hidden");
  document.body.classList.remove("piggy-cursor-active");

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

  const el = document.getElementById("maze-piggy");
  if (el) el.hidden = true;

  const startEl = document.getElementById("maze-start");
  const goalEl = document.getElementById("maze-goal");
  if (startEl) startEl.hidden = true;
  if (goalEl) goalEl.hidden = true;

  const cursor = document.getElementById("piggy-cursor");
  if (cursor) cursor.classList.remove("hidden");
  if (window.matchMedia("(pointer: fine)").matches) {
    document.body.classList.add("piggy-cursor-active");
  }

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

let mazeResizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(mazeResizeTimer);
  mazeResizeTimer = setTimeout(buildMaze, 150);
});
