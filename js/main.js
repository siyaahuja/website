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
    : data.html || `<p class="card-desc">${data.description || ""}</p>`;

  content.innerHTML = `
    <h3>${data.title}</h3>
    <div class="card-tagline">${data.tagline}</div>
    ${body}
    ${stickers ? `<div class="card-stickers">${stickers}</div>` : ""}
    ${hasTabs || !tags ? "" : `<div class="card-tags">${tags}</div>`}
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

/* spec table: name, current job, education (filled from js/profile.js) */
function specValue(main, sub) {
  if (!main) return `<span class="spec-todo">to fill in</span>`;
  return `<span class="spec-main">${main}</span>${sub ? `<span class="spec-sub">${sub}</span>` : ""}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const spec = document.getElementById("spec");
  if (!spec || typeof PROFILE === "undefined") return;

  const { now, education } = PROFILE;
  // the "now" and "studied" rows open their stop on the maze
  const stop = (type) => MILESTONES.findIndex((m) => m.type === type);
  const rows = [
    ["name", specValue(PROFILE.name)],
    ["now", stop("career"), specValue(
      now.role && now.company ? `${now.role} @ ${now.company}` : now.role || now.company,
      now.since
    )],
    ["studied", stop("education"), specValue(
      education.degree,
      [education.school, education.years].filter(Boolean).join(" · ")
    )]
  ];
  spec.innerHTML = rows
    .map((row) => {
      const [k, idx, v] = row.length === 3 ? row : [row[0], -1, row[1]];
      if (idx < 0) return `<div class="spec-row"><dt class="mono">${k}</dt><dd>${v}</dd></div>`;
      return `
        <div class="spec-row spec-link" role="button" tabindex="0" data-open="${idx}"
             data-target='[data-milestone="${idx}"]'>
          <dt class="mono">${k}</dt><dd>${v}</dd><span class="spec-arrow">→</span>
        </div>`;
    })
    .join("");

  spec.querySelectorAll(".spec-link").forEach((row) => {
    const open = () => openMilestoneCard(MILESTONES[Number(row.dataset.open)]);
    row.addEventListener("click", open);
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });
});

/* component list: every milestone, plus the horse race puzzle at the end.
   data-target points at the matching thing on the maze, so blueprint.js
   can draw a leader line to it on hover. */
document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("project-list");
  if (!list) return;

  const icons = { telephone: () => photoIcon("telephone", "") };
  const items = MILESTONES.map((m, i) => ({
    kind: m.kind,
    title: m.title,
    tagline: m.tagline,
    icon: icons[m.type] ? icons[m.type]() : "★",
    target: `[data-milestone="${i}"]`,
    open: () => openMilestoneCard(m)
  })).filter((item) => item.kind !== "about");
  items.push({
    title: "horse race puzzle",
    tagline: "25 horses, 5 tracks. find the fastest 3",
    icon: photoIcon("puzzle", ""),
    target: "#maze-goal",
    open: () => window.openPuzzle && openPuzzle()
  });

  items.forEach((item, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <button class="project" type="button" data-target='${item.target}'>
        <span class="project-num">${String(i + 1).padStart(2, "0")}</span>
        <span class="project-icon">${item.icon}</span>
        <span class="project-text">
          <span class="project-title">${item.title}</span>
          <span class="project-tagline">${item.tagline}</span>
        </span>
        <span class="project-arrow">→</span>
      </button>
    `;
    li.querySelector("button").addEventListener("click", item.open);
    list.appendChild(li);
  });
});
