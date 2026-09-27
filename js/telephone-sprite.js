/*
  Pixel-art old-timey rotary telephone (11x13 grid, same crisp-rect SVG
  technique as the unicorn sprite via renderPixelSVG): cream handset
  resting in its cradle on top of a cream trapezoid body with a rotary
  dial (finger holes) on the front.
*/

const TELEPHONE_PALETTE = {
  E: "#1a0f16", // outline
  C: "#f3e8c9", // cream body / handset
  D: "#d8c49c", // dial ring, tan shading
  K: "#2a1a12"  // dial finger holes
};

const TELEPHONE_GRID = [
  ".EEE...EEE.",
  ".ECECCCECE.",
  ".EEEEEEEEE.",
  "..EE...EE..",
  "..EEEEEEE..",
  "..ECCCCCE..",
  ".ECEDDDECE.",
  ".ECEKDKECE.",
  ".ECEDKDECE.",
  ".ECEDDDECE.",
  "ECCCCCCCCCE",
  "ECCCCCCCCCE",
  "EEEEEEEEEEE"
];

function telephoneSVG() {
  return renderPixelSVG(TELEPHONE_GRID, TELEPHONE_PALETTE);
}

/* ---------- step icons: label printer + sticker ---------- */

const PRINTER_PALETTE = {
  E: "#1a0f16", // outline
  S: "#dcdce6", // body, silver
  K: "#2a1a12"  // output slot
};

const PRINTER_GRID = [
  "EEEEEEEE",
  "ESSSSSSE",
  "ESSSSSSE",
  "EKKKKKKE",
  "ESSSSSSE",
  "ESSSSSSE",
  "ESSSSSSE",
  "EEEEEEEE"
];

function printerSVG() {
  return renderPixelSVG(PRINTER_GRID, PRINTER_PALETTE);
}

const STICKER_PALETTE = {
  E: "#1a0f16", // outline
  C: "#fff2fa", // sticker paper
  P: "#ec1cae"  // printed heart
};

const STICKER_GRID = [
  ".EEEE.",
  "ECCCCE",
  "ECPPCE",
  "ECPPCE",
  "ECCCCE",
  ".EEEE."
];

function stickerSVG() {
  return renderPixelSVG(STICKER_GRID, STICKER_PALETTE);
}

/* ---------- step icon: speaker ---------- */

const SPEAKER_PALETTE = {
  E: "#1a0f16", // outline
  S: "#9797a8", // body, silver-dark
  C: "#dcdce6"  // cone
};

const SPEAKER_GRID = [
  "EEEEEEEE",
  "ESSSSSSE",
  "ES.CC.SE",
  "ESC..CSE",
  "ES.CC.SE",
  "ESSSSSSE",
  "ESSSSSSE",
  "EEEEEEEE"
];

function speakerSVG() {
  return renderPixelSVG(SPEAKER_GRID, SPEAKER_PALETTE);
}
