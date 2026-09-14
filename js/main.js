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

  content.innerHTML = `
    <h3>${data.title}</h3>
    <div class="card-tagline">${data.tagline}</div>
    <p class="card-desc">${data.description}</p>
    <div class="card-tags">${tags}</div>
    ${link}
  `;

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
