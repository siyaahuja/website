/*
  The actual puzzle: 25 unicorns, 5 racetracks, find the fastest 3 in the
  minimum number of races. This does NOT walk the player through the
  solution. They can race any group of 2 to 5 unicorns they like, as many
  times as they like, and everything they've learned stays visible in the
  race history so they can work out the logic themselves. Submitting the
  wrong top 3 pops a "try again" Miss Piggy; submitting the right 3, in the
  right order, pops a "you win" Miss Piggy.

  Reuses unicornSVG()/renderPixelSVG() from unicorn-sprite.js and the
  hair/face rows of PIGGY_BODY from piggy-sprite.js so the result popups
  look like the same pig in a different outfit.
*/

const PUZZLE_EXTRA_PALETTE = Object.assign({}, PIGGY_PALETTE, {
  R: "#b47fe0", // try-again robe
  F: "#fff2fa", // robe fur trim
  X: "#1a0f16", // sunglasses band
  K: "#1a1a22", // win coat
  T: "#d99a4e"  // glam glove
});

const TRY_AGAIN_FRAME = PIGGY_BODY.slice(0, 7).concat([
  "RRRRRRRRRR",
  "FRRRRRRRRF",
  "RFRRRRRRFR"
]);

const WIN_FRAME = [
  PIGGY_BODY[0], PIGGY_BODY[1], PIGGY_BODY[2],
  "HSSSSSSSSH",
  "SXXXXXXXXS",
  PIGGY_BODY[5], PIGGY_BODY[6],
  "SKKKKKKKKS",
  "KKKKKKKKKK",
  "KTKKKKKKTK"
];

let pzUnicorns = [];
let pzRaceHistory = [];     // [{ n, ids: [finish order] }]
let pzSelected = [];        // ordered array of currently selected unicorn ids
let pzEliminated = new Set(); // player's own scratch-pad, purely visual
let pzRaceCount = 0;
let pzSolved = false;

function pzGenerateUnicorns() {
  const speeds = Array.from({ length: 25 }, (_, i) => i + 1);
  for (let i = speeds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [speeds[i], speeds[j]] = [speeds[j], speeds[i]];
  }
  return speeds.map((speed, i) => ({ id: i + 1, speed, group: Math.floor(i / 5) }));
}

function pzResetState() {
  pzUnicorns = pzGenerateUnicorns();
  pzRaceHistory = [];
  pzSelected = [];
  pzEliminated = new Set();
  pzRaceCount = 0;
  pzSolved = false;
}

function pzTrueTop3() {
  return pzUnicorns.slice().sort((a, b) => a.speed - b.speed).slice(0, 3).map((h) => h.id);
}

function pzUnicornIconHTML(unicorn) {
  const pickIndex = pzSelected.indexOf(unicorn.id);
  const selected = pickIndex !== -1;
  const eliminated = pzEliminated.has(unicorn.id);

  const classes = ["unicorn-icon", "selectable"];
  if (selected) classes.push("selected");
  if (eliminated) classes.push("eliminated");

  return `
    <div class="${classes.join(" ")}" data-id="${unicorn.id}">
      ${unicornSVG()}
      <span class="unicorn-num">${unicorn.id}</span>
      ${selected ? `<span class="unicorn-pick">${pickIndex + 1}</span>` : ""}
      <button type="button" class="unicorn-elim-toggle" data-elim-id="${unicorn.id}" title="mark eliminated">✕</button>
    </div>
  `;
}

const PZ_POSITION_NAMES = ["winner", "second", "third", "fourth", "fifth"];

function pzHistUnicorns(race) {
  return race.ids
    .map((id, i) => {
      const pos = Math.min(i + 1, 5);
      return `
        <div class="hist-unicorn pos-${pos}">
          ${unicornSVG()}
          <span class="hist-unicorn-pos">${PZ_POSITION_NAMES[i] || pos + "th"}</span>
          <span class="hist-unicorn-num">${id}</span>
        </div>
      `;
    })
    .join("");
}

function pzRenderBoard() {
  const board = document.getElementById("puzzle-board");
  if (!board) return;

  let html = `<div class="puzzle-grid">`;
  pzUnicorns.forEach((h) => {
    html += pzUnicornIconHTML(h);
  });
  html += `</div>`;

  html += `<div class="puzzle-history"><div class="puzzle-history-title">race history</div>`;
  if (pzRaceHistory.length === 0) {
    html += `<p class="puzzle-history-empty">nothing raced yet. select 2 to 5 unicorns above and run your first race.</p>`;
  } else {
    pzRaceHistory
      .slice()
      .reverse()
      .forEach((race) => {
        html += `
          <div class="puzzle-history-row">
            <span class="puzzle-history-n">race ${race.n}</span>
            <div class="hist-unicorns">${pzHistUnicorns(race)}</div>
          </div>
        `;
      });
  }
  html += `</div>`;

  board.innerHTML = html;

  board.querySelectorAll(".unicorn-icon.selectable").forEach((el) => {
    el.addEventListener("click", () => pzToggleSelect(Number(el.dataset.id)));
  });

  board.querySelectorAll(".unicorn-elim-toggle").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      pzToggleEliminate(Number(btn.dataset.elimId));
    });
  });
}

function pzRenderControls() {
  const el = document.getElementById("puzzle-controls");
  if (!el) return;

  if (pzSolved) {
    el.innerHTML = `
      <div class="puzzle-race-count">races run: ${pzRaceCount}</div>
      <p class="puzzle-instruction">solved. the fastest 3, in order, are marked on the grid.</p>
      <button id="puzzle-play-again-inline" class="pixel-btn">play again</button>
    `;
    document.getElementById("puzzle-play-again-inline").addEventListener("click", pzOpen);
    return;
  }

  const n = pzSelected.length;
  el.innerHTML = `
    <div class="puzzle-race-count">races run: ${pzRaceCount}. try to use as few as possible.</div>
    <p class="puzzle-instruction">
      click any unicorns to build a race (2 to 5 at a time). the small ✕ on each one marks
      it as eliminated from contention, just for your own tracking. once you've worked out
      the fastest 3, select exactly those 3 in order and submit your answer.
    </p>
    <div class="puzzle-actions">
      <button id="puzzle-run-custom" class="pixel-btn" ${n >= 2 && n <= 5 ? "" : "disabled"}>
        ${checkeredFlagSVG()} run race with selected (${n})
      </button>
      <button id="puzzle-submit-answer" class="pixel-btn" ${n === 3 ? "" : "disabled"}>
        submit as fastest 3 (${n}/3)
      </button>
      <button id="puzzle-clear" class="pixel-btn" ${n > 0 ? "" : "disabled"}>clear selection</button>
    </div>
  `;

  const runBtn = document.getElementById("puzzle-run-custom");
  const submitBtn = document.getElementById("puzzle-submit-answer");
  const clearBtn = document.getElementById("puzzle-clear");
  if (runBtn) runBtn.addEventListener("click", pzRunCustomRace);
  if (submitBtn) submitBtn.addEventListener("click", pzSubmitAnswer);
  if (clearBtn) clearBtn.addEventListener("click", pzClearSelection);
}

function pzToggleEliminate(id) {
  if (pzEliminated.has(id)) pzEliminated.delete(id);
  else pzEliminated.add(id);
  pzRenderBoard();
  pzRenderControls();
}

function pzToggleSelect(id) {
  const idx = pzSelected.indexOf(id);
  if (idx !== -1) {
    pzSelected.splice(idx, 1);
  } else if (pzSelected.length < 5) {
    pzSelected.push(id);
  }
  pzRenderBoard();
  pzRenderControls();
}

function pzClearSelection() {
  pzSelected = [];
  pzRenderBoard();
  pzRenderControls();
}

function pzRunCustomRace() {
  if (pzSelected.length < 2 || pzSelected.length > 5) return;
  const chosen = pzUnicorns
    .filter((h) => pzSelected.includes(h.id))
    .slice()
    .sort((a, b) => a.speed - b.speed);
  pzRaceCount++;
  pzRaceHistory.push({ n: pzRaceCount, ids: chosen.map((h) => h.id) });
  pzSelected = [];
  pzRenderBoard();
  pzRenderControls();
}

function pzSubmitAnswer() {
  if (pzSelected.length !== 3) return;
  const guess = pzSelected.slice();
  const truth = pzTrueTop3();
  const correct = guess.length === truth.length && guess.every((id, i) => id === truth[i]);

  if (!correct) {
    pzShowResult("lose");
    return;
  }

  pzSolved = true;
  pzShowResult("win");
  pzRenderBoard();
  pzRenderControls();
}

function pzShowResult(kind) {
  const overlay = document.getElementById("puzzle-result-overlay");
  const content = document.getElementById("puzzle-result-content");
  if (!overlay || !content) return;

  const frame = kind === "win" ? WIN_FRAME : TRY_AGAIN_FRAME;
  const svg = renderPixelSVG(frame, PUZZLE_EXTRA_PALETTE);
  const message = kind === "win" ? "you win!" : "try again";
  const btnLabel = kind === "win" ? "play again" : "back to the grid";

  content.innerHTML = `
    <div class="result-piggy">${svg}</div>
    <div class="result-text">${message}</div>
    <button id="puzzle-result-btn" class="pixel-btn">${btnLabel}</button>
  `;

  overlay.classList.remove("hidden");

  document.getElementById("puzzle-result-btn").addEventListener("click", () => {
    overlay.classList.add("hidden");
    if (kind === "lose") {
      pzSelected = [];
      pzRenderBoard();
      pzRenderControls();
    } else {
      pzOpen();
    }
  });

  if (kind === "win" && window.spawnConfetti) {
    const rect = overlay.getBoundingClientRect();
    spawnConfetti(rect.left + rect.width / 2, rect.top + rect.height * 0.35);
  }
}

function pzOpen() {
  pzResetState();
  document.getElementById("puzzle-result-overlay").classList.add("hidden");
  pzRenderBoard();
  pzRenderControls();
  document.getElementById("puzzle-overlay").classList.remove("hidden");
}

function pzClose() {
  document.getElementById("puzzle-overlay").classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("puzzle-overlay");
  const closeBtn = document.getElementById("puzzle-close");
  if (closeBtn) closeBtn.addEventListener("click", pzClose);
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) pzClose();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") pzClose();
  });
});

window.openPuzzle = pzOpen;
