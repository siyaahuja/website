/*
  EDIT ME — add more stops here later. Stops whose type has a metal icon
  (telephone, career, education — see MILESTONE_ICONS in maze.js) get that
  icon on the maze; everything else is a numbered marker.
  kind: "about" stops are linked from the spec table instead of the
  components list.
  The horse race puzzle isn't a stop: it waits at the maze's finish line in
  maze mode (see maze.js).
*/

const MILESTONES = [
  {
    type: "telephone",
    title: "telephone directory",
    tagline: "a real rotary phone wired into claude",
    status: "building",
    tabs: [
      {
        label: "the vibe",
        html: `
          <ol class="phone-steps">
            <li class="phone-step">
              <div class="phone-step-icons">
                <span class="step-icon">${photoIcon("telephone", "")}</span>
                <span class="step-arrow">→</span>
                <span class="step-icon printer-stack">
                  <span class="step-icon-sticker">${stickerSVG()}</span>
                  <span class="step-icon-printer">${printerSVG()}</span>
                </span>
              </div>
              <p>dial 126 and tell it what sticker you want. claude decides
                whether that's a poem or a picture, and it prints right
                there.</p>
            </li>
            <li class="phone-step">
              <div class="phone-step-icons">
                <span class="step-icon">${photoIcon("telephone", "")}</span>
                <span class="step-arrow">→</span>
                <span class="step-icon">${speakerSVG()}</span>
                <span class="eq-bars"><span></span><span></span><span></span></span>
              </div>
              <p>dial 121 and ask for a song or a playlist. my speaker
                builds a spotify playlist for it and starts playing.</p>
            </li>
          </ol>
        `
      },
      {
        label: "the tech",
        html: `
          <p class="card-desc">built from a real rotary telephone → a
            grandstream ATA (turns the phone line into audio in and out) →
            a raspberry pi running the switchboard → a brother QL label
            printer for stickers.</p>
          <ul class="card-tech-list">
            <li><code>switchboard.py</code> records ~6s of audio off the
              line once you dial, then hands it to <code>whisper.cpp</code>
              (the ggml-base.en model) for fully local speech-to-text — no
              cloud round-trip just to hear what you said.</li>
            <li>the transcript gets routed by service code. <code>126</code>
              → <code>print.py</code>: claude reads the request, decides
              text or image, generates it, and the brother QL prints it as
              a sticker on the spot.</li>
            <li><code>121</code> → <code>vibe.py</code>: claude turns the
              request into a spotify search/playlist and playback starts on
              my speaker.</li>
            <li>next up: wiring the actual rotary dial in as the service
              selector — right now the service number still gets typed in
              by hand.</li>
          </ul>
          <div class="card-tags">
            ${["raspberry pi", "grandstream ata", "whisper.cpp", "claude", "spotify", "label printer"]
              .map((t) => `<span class="tag">${t}</span>`)
              .join("")}
          </div>
        `
      }
    ],
    images: []
  },
  {
    type: "career",
    kind: "about",
    title: "getground",
    tagline: "special projects",
    html: careerDossierHTML(
      "working on lots of super cool top secret special projects at one of the uk's fastest growing companies"
    )
  },
  {
    type: "education",
    kind: "about",
    title: "ucl",
    tagline: "BASc Arts and Sciences",
    html: educationMapHTML(["economics", "maths", "computer science", "law", "psychology"])
  }
];

/* career card: a classified file. words type in, redaction bars sweep
   across, then a "top secret" stamp lands. */
function careerDossierHTML(text) {
  const words = text
    .split(" ")
    .map((w, i) => `<span style="--i:${i}">${w}</span>`)
    .join(" ");
  return `
    <div class="dossier">
      <div class="dossier-meta mono"><span>file no. gg-001</span><span>clearance: siya only</span></div>
      <p class="dossier-text">${words}</p>
      <div class="redacted" aria-hidden="true">
        <span style="--w:94%;--i:0"></span>
        <span style="--w:72%;--i:1"></span>
        <span style="--w:86%;--i:2"></span>
        <span style="--w:48%;--i:3"></span>
      </div>
      <div class="stamp mono" aria-hidden="true">top secret</div>
    </div>
  `;
}

/* education card: "i studied" in the middle, one node per subject drawn
   out around it like a blueprint diagram */
function educationMapHTML(subjects) {
  const W = 460;
  const H = 330;
  const cx = W / 2;
  const cy = H / 2 + 5;
  const rx = 160;
  const ry = 118;
  const boxW = (label) => label.length * 8.2 + 30;

  const nodes = subjects.map((label, i) => {
    const a = -Math.PI / 2 + (i / subjects.length) * Math.PI * 2;
    return { label, i, x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry, w: boxW(label) };
  });

  const edges = nodes
    .map((n) => `<path class="edu-edge" pathLength="1" style="--i:${n.i}" d="M${cx},${cy} L${n.x.toFixed(1)},${n.y.toFixed(1)}"/>`)
    .join("");

  const boxes = nodes
    .map((n) => `
      <g class="edu-node" style="--i:${n.i}">
        <rect x="${(n.x - n.w / 2).toFixed(1)}" y="${(n.y - 17).toFixed(1)}" width="${n.w.toFixed(1)}" height="34"/>
        <text class="edu-num" x="${(n.x - n.w / 2 + 4).toFixed(1)}" y="${(n.y - 22).toFixed(1)}">${String(n.i + 1).padStart(2, "0")}</text>
        <text class="edu-label" x="${n.x.toFixed(1)}" y="${n.y.toFixed(1)}">${n.label}</text>
      </g>`)
    .join("");

  return `
    <svg class="edu-map" viewBox="0 0 ${W} ${H}" role="img" aria-label="i studied ${subjects.join(", ")}">
      <ellipse class="edu-orbit" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>
      ${edges}
      <g class="edu-centre">
        <rect x="${cx - 62}" y="${cy - 22}" width="124" height="44" rx="10"/>
        <text x="${cx}" y="${cy}">i studied</text>
      </g>
      ${boxes}
    </svg>
  `;
}
