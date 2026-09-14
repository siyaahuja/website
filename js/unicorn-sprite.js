/*
  Pixel-art unicorn (10x10 grid, same crisp-rect SVG technique and front-
  facing bust layout as the piggy cursor sprite, so the two read as an
  obvious matched pair): pointed horn front and centre, two eyes, and a
  two-tone pink/purple mane framing the face either side.
  Unicorns are told apart by a number badge, not colour.
*/

const UNICORN_PALETTE = {
  M: "#fbf4ff", // face
  P: "#ec1cae", // mane, pink half
  U: "#8b3fd6", // mane, purple half
  N: "#ffd66b", // horn
  D: "#6b5b73", // nose shading
  E: "#1a0f16"  // eyes
};

const UNICORN_GRID = [
  "....N.....",
  "...NNN....",
  "..PPPUUU..",
  ".PPPPUUUU.",
  "PPPPPUUUUU",
  "PMMMMMMMMU",
  "MME.MM.EMM",
  "MMMMDDMMMM",
  "MMMMDDMMMM",
  ".MMMMMMMM."
];

function renderPixelSVG(grid, palette) {
  const cols = grid[0].length;
  const rows = grid.length;
  let rects = "";
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const key = grid[y][x];
      if (key === ".") continue;
      const color = palette[key];
      if (!color) continue;
      rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`;
    }
  }
  return (
    `<svg viewBox="0 0 ${cols} ${rows}" shape-rendering="crispEdges" ` +
    `xmlns="http://www.w3.org/2000/svg">${rects}</svg>`
  );
}

function unicornSVG() {
  return renderPixelSVG(UNICORN_GRID, UNICORN_PALETTE);
}

function checkeredFlagSVG() {
  let rects = "";
  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 6; x++) {
      const color = (x + y) % 2 === 0 ? "#1a0f16" : "#ffffff";
      rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`;
    }
  }
  return (
    `<svg viewBox="0 0 6 6" shape-rendering="crispEdges" ` +
    `xmlns="http://www.w3.org/2000/svg">${rects}</svg>`
  );
}
