/* card overlay: expands a milestone into its project details */

function openMilestoneCard(data) {
  const overlay = document.getElementById("card-overlay");
  const content = document.getElementById("card-content");
  if (!overlay || !content) return;

  const tags = (data.tags || [])
    .map((t) => `<span class="tag">${t}</span>`)
    .join("");

  const link = data.link
    ? `<a class="card-link" href="${data.link}" target="_blank" rel="noopener">check it out →</a>`
    : "";

  const stickers = (data.images || [])
    .map((src) => `<img class="card-sticker" src="${src}" alt="${data.title} sticker">`)
    .join("");

  const hasTabs = Array.isArray(data.tabs) && data.tabs.length > 0;

  const body = hasTabs
    ? `
      <div class="card-tabs" role="tablist">
        ${data.tabs
          .map(
            (t, i) =>
              `<button class="card-tab${i === 0 ? " active" : ""}" data-tab-btn="${i}" role="tab">${t.label}</button>`
          )
          .join("")}
      </div>
      ${data.tabs
        .map(
          (t, i) =>
            `<div class="card-tab-panel" data-tab-panel="${i}" role="tabpanel" ${i === 0 ? "" : "hidden"}>${t.html}</div>`
        )
        .join("")}
    `
    : `<p class="card-desc">${data.description || ""}</p>`;

  content.innerHTML = `
    <h3>${data.title}</h3>
    <div class="card-tagline">${data.tagline}</div>
    ${body}
    ${stickers ? `<div class="card-stickers">${stickers}</div>` : ""}
    ${hasTabs ? "" : `<div class="card-tags">${tags}</div>`}
    ${link}
  `;

  if (hasTabs) {
    const btns = content.querySelectorAll(".card-tab");
    const panels = content.querySelectorAll(".card-tab-panel");
    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = btn.dataset.tabBtn;
        btns.forEach((b) => b.classList.toggle("active", b === btn));
        panels.forEach((p) => {
          p.hidden = p.dataset.tabPanel !== idx;
        });
      });
    });
  }

  overlay.classList.remove("hidden");
}

function closeMilestoneCard() {
  const overlay = document.getElementById("card-overlay");
  if (overlay) overlay.classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("card-overlay");
  const closeBtn = document.getElementById("card-close");

  if (closeBtn) closeBtn.addEventListener("click", closeMilestoneCard);
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeMilestoneCard();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMilestoneCard();
  });
});
