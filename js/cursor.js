/*
  A plain polished-silver arrow cursor. It replaces the system cursor on
  mouse/trackpad devices only, tips forward over anything clickable and
  presses in on click.
*/

document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("cursor");
  if (!el || !window.matchMedia("(pointer: fine)").matches) return;

  el.innerHTML = cursorSVG();
  document.body.classList.add("cursor-active");

  const clickable = "a, button, .project, .spec-link, .milestone, #maze-goal, .horse-icon.selectable, .card-tab";

  window.addEventListener("mousemove", (e) => {
    el.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    el.classList.toggle("pointing", !!e.target.closest(clickable));
    el.classList.remove("away");
  });
  window.addEventListener("mousedown", () => el.classList.add("pressed"));
  window.addEventListener("mouseup", () => el.classList.remove("pressed"));
  document.addEventListener("mouseleave", () => el.classList.add("away"));
});
