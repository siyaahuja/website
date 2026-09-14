/*
  "siya's space" flashes in the hero, then as you scroll it glides
  continuously (not a timer, not a crossfade) from centred-and-huge to
  small-and-docked in the header's top-left corner, with the header bar
  and maze-mode button fading in in lockstep. Everything is driven by a
  single scroll-progress value recalculated on every animation frame.
*/

document.addEventListener("DOMContentLoaded", () => {
  const hero = document.getElementById("hero");
  const brand = document.getElementById("brand");
  const title = brand ? brand.querySelector(".brat-title") : null;
  const header = document.getElementById("site-header");
  if (!hero || !brand || !title || !header) return;

  const HEADER_LEFT_PX = 18; // matches #site-header's 1.1rem padding
  const BIG_FONT_MAX = 80; // px, matches the old clamp(2.2rem, 9vw, 5rem)
  const BIG_FONT_MIN = 35.2;
  const SMALL_FONT_MAX = 18.4; // px, matches clamp(0.85rem, 2vw, 1.15rem)
  const SMALL_FONT_MIN = 13.6;

  let heroHeight = hero.offsetHeight;
  let headerHeight = header.offsetHeight || 64;

  function measure() {
    heroHeight = hero.offsetHeight;
    headerHeight = header.offsetHeight || 64;
  }

  function clampedVw(minPx, vwFactor, maxPx) {
    const val = window.innerWidth * vwFactor;
    return Math.min(Math.max(val, minPx), maxPx);
  }

  function update() {
    const scrollRange = Math.max(heroHeight * 0.65, 1);
    const progress = Math.min(1, Math.max(0, window.scrollY / scrollRange));

    const vh = window.innerHeight;
    const vw = window.innerWidth;

    const startTop = vh / 2;
    const startLeft = vw / 2;
    const endTop = headerHeight / 2;
    const endLeft = HEADER_LEFT_PX;

    const top = startTop + (endTop - startTop) * progress;
    const left = startLeft + (endLeft - startLeft) * progress;
    const xPercent = -50 + 50 * progress; // -50% (centred) -> 0% (left-aligned)

    brand.style.top = `${top}px`;
    brand.style.left = `${left}px`;
    brand.style.transform = `translate(${xPercent}%, -50%)`;

    const bigFont = clampedVw(BIG_FONT_MIN, 0.09, BIG_FONT_MAX);
    const smallFont = clampedVw(SMALL_FONT_MIN, 0.02, SMALL_FONT_MAX);
    title.style.fontSize = `${bigFont + (smallFont - bigFont) * progress}px`;

    brand.classList.toggle("chip", progress > 0.85);

    header.style.opacity = String(progress);
    header.style.transform = `translateY(${-100 * (1 - progress)}%)`;
    header.style.pointerEvents = progress > 0.6 ? "auto" : "none";
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    measure();
    update();
  });

  measure();
  update();
});
