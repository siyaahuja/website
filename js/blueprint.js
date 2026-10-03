/*
  The interactive blueprint layer:
  - sizes the sheet frame that draws itself around the page
  - "decodes" the title on load
  - crosshair guides, ruler markers and the x/y readout follow the mouse
  - hovering a component draws a leader line to its spot on the maze
*/

document.addEventListener("DOMContentLoaded", () => {
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- sheet frame ---------- */
  const frame = document.getElementById("sheet-frame");
  function sizeFrame() {
    if (!frame) return;
    const w = window.innerWidth - 16;
    const h = window.innerHeight - 16;
    frame.setAttribute("viewBox", `0 0 ${w} ${h}`);
    const outer = frame.querySelector(".frame-outer");
    const inner = frame.querySelector(".frame-inner");
    outer.setAttribute("width", w);
    outer.setAttribute("height", h);
    inner.setAttribute("width", Math.max(0, w - 12));
    inner.setAttribute("height", Math.max(0, h - 12));
  }
  sizeFrame();
  window.addEventListener("resize", sizeFrame);

  /* ---------- title decode ---------- */
  const title = document.getElementById("title");
  if (title && !calm) {
    const finalText = title.textContent;
    const glyphs = "#/\\\\_+=<>01xy";
    const start = performance.now() + 350;
    const perChar = 45;
    function tick(now) {
      const settled = Math.max(0, Math.floor((now - start) / perChar));
      if (settled >= finalText.length) {
        title.textContent = finalText;
        return;
      }
      const done = finalText.slice(0, settled);
      const rest = Array.from(finalText.slice(settled), (ch) =>
        ch === " " ? " " : glyphs[Math.floor(Math.random() * glyphs.length)]
      ).join("");
      title.innerHTML = `${done}<span class="scramble">${rest}</span>`;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- crosshair, rulers, coordinates ---------- */
  const gx = document.querySelector(".guide-x");
  const gy = document.querySelector(".guide-y");
  const coords = document.getElementById("coords");
  const body = document.querySelector(".drawing-body");
  const rx = document.querySelector(".ruler-x .ruler-mark");
  const ry = document.querySelector(".ruler-y .ruler-mark");
  const rulerX = document.querySelector(".ruler-x");
  const rulerY = document.querySelector(".ruler-y");

  if (finePointer) {
    document.body.classList.add("guides-on");
    window.addEventListener("mousemove", (e) => {
      gx.style.transform = `translateY(${e.clientY}px)`;
      gy.style.transform = `translateX(${e.clientX}px)`;
      if (coords) {
        const pad = (n) => String(Math.round(n)).padStart(4, "0");
        coords.textContent = `x ${pad(e.clientX)} · y ${pad(e.clientY)}`;
      }
      if (body && rulerX && rulerY) {
        const bx = rulerX.getBoundingClientRect();
        const by = rulerY.getBoundingClientRect();
        const inside = e.clientX >= bx.left && e.clientX <= bx.right &&
                       e.clientY >= by.top && e.clientY <= by.bottom;
        body.classList.toggle("tracking", inside);
        rx.style.left = `${e.clientX - bx.left}px`;
        ry.style.top = `${e.clientY - by.top}px`;
      }
    });
    document.addEventListener("mouseleave", () => document.body.classList.remove("guides-on"));
    document.addEventListener("mouseenter", () => document.body.classList.add("guides-on"));
  }

  /* ---------- leader lines: component row → spot on the maze ---------- */
  const leader = document.getElementById("leader");
  const path = leader && leader.querySelector("path");
  const dot = leader && leader.querySelector("circle");
  let linked = null;

  function clearLeader() {
    if (!path) return;
    path.classList.remove("on");
    dot.classList.remove("on");
    path.setAttribute("d", "");
    if (linked) linked.forEach((el) => el.classList.remove("is-linked"));
    linked = null;
  }

  function drawLeader(row) {
    const target = document.querySelector(row.dataset.target);
    if (!target || !path) return;
    const a = row.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const x1 = a.right;
    const y1 = a.top + a.height / 2;
    const x2 = b.left + b.width / 2;
    const y2 = b.top + b.height / 2;
    // elbow route: out to the right, then a 45° jog, then straight in
    const midX = x1 + Math.max(24, (x2 - x1) * 0.35);
    const jog = Math.min(Math.abs(y2 - y1), Math.abs(x2 - midX) * 0.6);
    const dirY = y2 > y1 ? 1 : -1;
    const d = `M${x1},${y1} H${midX} L${midX + jog},${y1 + jog * dirY} V${y2} H${x2}`;
    path.setAttribute("d", d);
    dot.setAttribute("cx", x2);
    dot.setAttribute("cy", y2);
    // restart the draw animation
    path.classList.remove("on");
    void path.getBoundingClientRect();
    path.classList.add("on");
    dot.classList.add("on");
    linked = [row, target];
    linked.forEach((el) => el.classList.add("is-linked"));
  }

  // component rows and the linked spec rows (now / studied) both get one
  [
    [document.getElementById("project-list"), ".project"],
    [document.getElementById("spec"), ".spec-link"]
  ].forEach(([container, selector]) => {
    if (!container || !finePointer || window.innerWidth <= 760) return;
    container.addEventListener("mouseover", (e) => {
      const row = e.target.closest(selector);
      if (!row) {
        clearLeader();
        return;
      }
      if (!linked || linked[0] !== row) {
        clearLeader();
        drawLeader(row);
      }
    });
    container.addEventListener("mouseleave", clearLeader);
  });
  window.addEventListener("resize", clearLeader);
});
