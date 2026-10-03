/*
  Rugged cast-steel vector sprites: the horse (a chess knight) used in the
  puzzle, the ball bearing you steer in maze mode, the cursor, and the
  step icons in the telephone card. The four main icons (telephone dial,
  laptop, fur folder, ctrl key) are cut-out photos; see photoIcon() below.

  The 3D look comes from one SVG filter (#chrome): each shape's outline is
  blurred into a short, hard bevel, lit, pushed through a cold steel tone
  curve, and roughed up with a faint scratched grain.
  Every piece is drawn twice: a darker copy nudged down-right for its
  thickness, then the face on top. All shapes live on a 48-unit grid so
  the one filter suits them all.
*/

function chromeFilter(id, region) {
  return `<filter id="${id}" ${region} color-interpolation-filters="sRGB">
        <!-- a narrow blur = a short, hard bevel: flat faces, chiselled edges -->
        <feGaussianBlur in="SourceAlpha" stdDeviation="1.1" result="height"/>
        <feDiffuseLighting in="height" surfaceScale="5" diffuseConstant="1.2" lighting-color="#fff" result="diffuse">
          <feDistantLight azimuth="225" elevation="35"/>
        </feDiffuseLighting>
        <!-- the steel curve: hard light and dark bands, cold and a bit raw -->
        <feComponentTransfer in="diffuse" result="steel">
          <feFuncR type="table" tableValues="0.04 0.18 0.70 0.32 0.82 0.92"/>
          <feFuncG type="table" tableValues="0.05 0.19 0.72 0.34 0.84 0.94"/>
          <feFuncB type="table" tableValues="0.07 0.22 0.76 0.38 0.88 0.97"/>
        </feComponentTransfer>
        <feBlend in="steel" in2="SourceGraphic" mode="multiply" result="tinted"/>
        <feSpecularLighting in="height" surfaceScale="5" specularConstant="0.7" specularExponent="16" lighting-color="#fff" result="spec">
          <feDistantLight azimuth="225" elevation="50"/>
        </feSpecularLighting>
        <feComposite in="tinted" in2="spec" operator="arithmetic" k2="1" k3="0.6" result="lit"/>
        <!-- scratched grain: stretched noise, mixed in faintly -->
        <feTurbulence type="fractalNoise" baseFrequency="1.4 0.12" numOctaves="2" seed="7" result="noise"/>
        <feColorMatrix in="noise" type="saturate" values="0" result="grain"/>
        <feComposite in="lit" in2="grain" operator="arithmetic" k2="1" k3="0.16" k4="-0.08" result="rough"/>
        <feComposite in="rough" in2="SourceAlpha" operator="in"/>
      </filter>`;
}

(function injectChromeDefs() {
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  defs.setAttribute("aria-hidden", "true");
  defs.setAttribute("width", "0");
  defs.setAttribute("height", "0");
  defs.style.position = "absolute";
  defs.innerHTML = `
    <defs>
      <!-- #chrome: region in grid units (not % of the shape) so thin straight
           tubes still render. #chrome-plate: same look, sized to the shape,
           for one-off plates like the centre of the education diagram. -->
      ${chromeFilter("chrome", 'filterUnits="userSpaceOnUse" x="-12" y="-12" width="72" height="72"')}
      ${chromeFilter("chrome-plate", 'x="-15%" y="-25%" width="130%" height="150%"')}
      <!-- faces carry a dark reflection band, like chrome mirroring a horizon -->
      <linearGradient id="chrome-face" x1="0.1" y1="0" x2="0.9" y2="1">
        <stop offset="0" stop-color="#f2f5f8"/>
        <stop offset="0.38" stop-color="#cfd5dc"/>
        <stop offset="0.5" stop-color="#5b646f"/>
        <stop offset="0.6" stop-color="#a7b0ba"/>
        <stop offset="1" stop-color="#dfe4e9"/>
      </linearGradient>
      <linearGradient id="chrome-side" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#6b737e"/>
        <stop offset="1" stop-color="#22282f"/>
      </linearGradient>
      <linearGradient id="chrome-blue" x1="0.1" y1="0" x2="0.9" y2="1">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset="0.3" stop-color="#d6ebff"/>
        <stop offset="0.52" stop-color="#3f73b8"/>
        <stop offset="0.66" stop-color="#a9cdf5"/>
        <stop offset="1" stop-color="#eef6ff"/>
      </linearGradient>
      <linearGradient id="chrome-blue-side" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#6f95c4"/>
        <stop offset="1" stop-color="#1f3d6b"/>
      </linearGradient>
    </defs>`;
  document.body.prepend(defs);
})();

function chromeSVG(inner, viewBox = "0 0 48 48") {
  return `<svg class="chrome" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

/*
  One chrome piece. `attrs` is the shape's geometry (e.g. 'd="..."'),
  `round` thickens it with a bevel-jointed outline so corners come out
  chamfered, and `depth` is how far the darker thickness copy sits behind.
*/
function chromePart(tag, attrs, { round = 0, depth = 1.3, finish = "silver" } = {}) {
  const face = finish === "blue" ? "url(#chrome-blue)" : "url(#chrome-face)";
  const side = finish === "blue" ? "url(#chrome-blue-side)" : "url(#chrome-side)";
  const shape = (paint) =>
    `<${tag} ${attrs} fill="${paint}"` +
    (round ? ` stroke="${paint}" stroke-width="${round}" stroke-linejoin="bevel"` : "") +
    ` filter="url(#chrome)"/>`;
  return `<g transform="translate(${depth * 0.8} ${depth})">${shape(side)}</g>${shape(face)}`;
}

// a stroked tube (handles, cables, handsets): same treatment, no fill.
// solid paints here, because a gradient on a perfectly straight line has
// a zero-width box and doesn't render at all
function chromeTube(d, width, { depth = 1.2 } = {}) {
  const face = "#d3d9df";
  const side = "#3a414a";
  const tube = (paint) =>
    `<path d="${d}" fill="none" stroke="${paint}" stroke-width="${width}" stroke-linecap="square" stroke-linejoin="bevel" filter="url(#chrome)"/>`;
  return `<g transform="translate(${depth * 0.8} ${depth})">${tube(side)}</g>${tube(face)}`;
}

/* ---------- horse: a cast-steel chess knight ---------- */
function horseSVG(finish) {
  const opts = { finish: finish === "chrome" ? "blue" : "silver" };
  return chromeSVG(`
    ${chromePart("path", `d="M16 37 C16 31 19 28 18 24.5 L12.5 26.5 C9 27.5 6.5 24.8 7.8 21.8
         L15 11.5 L15.6 6 L19.8 9.6 C28 9.2 33.4 16 32.6 25 C32.2 30 31 34 31.6 37 Z"`, { round: 1.5, ...opts })}
    ${chromePart("rect", 'x="10" y="37.5" width="27" height="6"', { round: 1.5, depth: 1, ...opts })}
  `);
}

/* ---------- ball bearing ---------- */
function ballBearingSVG() {
  return chromeSVG(chromePart("circle", 'cx="23" cy="23" r="17"', { depth: 1.4 }));
}

/* ---------- cursor: the chrome arrow ---------- */
function cursorSVG() {
  return chromeSVG(chromePart("path", 'd="M8 6 V37 L16.2 29.6 L21.8 41.6 L27 39.2 L21.6 27.6 H32.8 Z"', { round: 3, depth: 1.8 }));
}

/* ---------- start flag (maze start + race button) ---------- */
function checkeredFlagSVG() {
  let checks = "";
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 4; x++) {
      if ((x + y) % 2 === 0) {
        checks += `<rect x="${13 + x * 6.5}" y="${8 + y * 6}" width="6.5" height="6" fill="#1b222c" opacity="0.85"/>`;
      }
    }
  }
  return chromeSVG(`
    ${chromeTube("M10 6 V44", 4)}
    ${chromePart("rect", 'x="13" y="8" width="26" height="18" rx="1.5"', { round: 1.5, depth: 1 })}
    ${checks}
  `);
}

/* ---------- step icons: label printer, sticker, speaker ---------- */
function printerSVG() {
  return chromeSVG(`
    ${chromePart("rect", 'x="5" y="11" width="38" height="28"', { round: 2 })}
    <rect x="11" y="20" width="26" height="3.5" rx="1.75" fill="#1b222c"/>
    <circle cx="35" cy="32" r="2" fill="#7fd3ff"/>
  `);
}

function stickerSVG() {
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="20" rx="4" fill="#ffffff"/>
    <path d="M12 18 C6 14 5.5 10.5 7.5 8.6 C9.2 7 11.2 7.8 12 9.4 C12.8 7.8 14.8 7 16.5 8.6 C18.5 10.5 18 14 12 18 Z" fill="#2f80ed"/>
  </svg>`;
}

function speakerSVG() {
  return chromeSVG(`
    ${chromePart("rect", 'x="9" y="4" width="30" height="40"', { round: 2 })}
    ${chromePart("path", 'fill-rule="evenodd" d="M33.5 26 A9.5 9.5 0 1 0 33.5 26.01 Z M27.5 26 A3.5 3.5 0 1 0 27.5 26.01 Z"', { depth: 0.9 })}
  `);
}

/* ---------- photo icons: cut-out images in assets/icons ---------- */
function photoIcon(name, alt) {
  return `<img class="photo-icon" src="assets/icons/${name}.png" alt="${alt}" draggable="false">`;
}
