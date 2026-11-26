const REPO_URL = "https://github.com/YogeshWaran082/claude-skills-collection";

const state = {
  skills: [],
  categories: [],
  tab: "directory", // directory | install | community
  activeCategory: "ALL",
  searchQuery: "",
  selectedSkill: null,
};

const els = {
  heroSection: document.getElementById("heroSection"),
  heroCountBadge: document.getElementById("heroCountBadge"),
  viewContent: document.getElementById("viewContent"),
  searchInput: document.getElementById("searchInput"),
  modalBackdrop: document.getElementById("skillModalBackdrop"),
  modalCategory: document.getElementById("modalSkillCategory"),
  modalTitle: document.getElementById("modalSkillTitle"),
  modalDesc: document.getElementById("modalSkillDesc"),
  modalContent: document.getElementById("modalSkillContent"),
  modalMeta: document.getElementById("modalSkillMeta"),
  openGithubLink: document.getElementById("openGithubLink"),
  toast: document.getElementById("toast"),
  themeLabel: document.getElementById("themeLabel"),
};

function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => els.toast.classList.remove("show"), 2200);
}

async function copyText(text, label = "Copied to clipboard") {
  try {
    await navigator.clipboard.writeText(text);
    showToast(label);
  } catch {
    showToast("Copy failed — select manually");
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toggleTheme() {
  const html = document.documentElement;
  const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", next);
  els.themeLabel.textContent = next === "dark" ? "Dark Glass" : "Light Glass";
  localStorage.setItem("skilllab-theme", next);
}

function initTheme() {
  const saved = localStorage.getItem("skilllab-theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
  els.themeLabel.textContent = saved === "dark" ? "Dark Glass" : "Light Glass";
}

function getFilteredSkills() {
  const q = state.searchQuery.trim().toLowerCase();
  return state.skills.filter((s) => {
    if (state.activeCategory !== "ALL" && s.category !== state.activeCategory) {
      return false;
    }
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  });
}

function renderDirectory() {
  const list = getFilteredSkills();

  els.viewContent.innerHTML = `
    <div class="filter-bar">
      <button class="filter-pill ${state.activeCategory === "ALL" ? "active" : ""}" data-cat="ALL">
        All (${state.skills.length})
      </button>
      ${state.categories
        .map(
          (c) => `
        <button class="filter-pill ${state.activeCategory === c.name ? "active" : ""}" data-cat="${escapeHtml(c.name)}">
          ${escapeHtml(c.name)} (${c.count})
        </button>`
        )
        .join("")}
    </div>

    <div class="directory-panel">
      <div class="directory-header">
        <span>Skills Directory (${list.length})</span>
        <span>Click any skill to inspect or copy CLI</span>
      </div>
      ${
        list.length
          ? list
              .map(
                (s, idx) => `
        <div class="skill-row" data-skill-id="${escapeHtml(s.id)}">
          <div class="row-rank">#${idx + 1}</div>
          <div class="row-title-wrap">
            <div class="row-name">${escapeHtml(s.name)}</div>
            <div class="row-path">
              <span class="cat-badge">${escapeHtml(s.category)}</span>
              <span class="row-lines">${s.lines} lines</span>
            </div>
          </div>
          <div class="row-desc">${escapeHtml(s.description || "Claude skill instructions.")}</div>
          <div class="row-actions">
            <button class="row-btn primary inspect-btn" data-id="${escapeHtml(s.id)}">Inspect</button>
            <button class="row-btn copy-cli-btn" data-id="${escapeHtml(s.id)}">Copy CLI</button>
          </div>
        </div>`
              )
              .join("")
          : `<div style="padding:28px;text-align:center;color:var(--text-secondary)">No matching skills found.</div>`
      }
    </div>
  `;

  els.viewContent.querySelectorAll(".filter-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      state.activeCategory = pill.dataset.cat;
      render();
    });
  });

  els.viewContent.querySelectorAll(".skill-row").forEach((row) => {
    row.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      openSkillModal(row.dataset.skillId);
    });
  });

  els.viewContent.querySelectorAll(".inspect-btn").forEach((btn) => {
    btn.addEventListener("click", () => openSkillModal(btn.dataset.id));
  });

  els.viewContent.querySelectorAll(".copy-cli-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const s = state.skills.find((x) => x.id === btn.dataset.id);
      if (!s) return;
      const cmd = `mkdir -p ~/.claude/skills/${s.name} && curl -fsSL https://raw.githubusercontent.com/YogeshWaran082/claude-skills-collection/main/${s.path} -o ~/.claude/skills/${s.name}/SKILL.md`;
      copyText(cmd, `Copied CLI install for ${s.name}`);
    });
  });
}

function renderInstall() {
  els.viewContent.innerHTML = `
    <div class="panel-grid">
      <div class="panel-card">
        <h3>Claude Code CLI (Global / Project)</h3>
        <p>Install all ${state.skills.length} skills into <code>~/.claude/skills/</code> or your current project's <code>.claude/skills/</code>.</p>
        <pre class="code-block">git clone ${REPO_URL}.git
cd claude-skills-collection && chmod +x install.sh
./install.sh claude
# Or project-only:
./install.sh claude-local</pre>
        <button class="glass-btn primary copy-block-btn">Copy Commands</button>
      </div>

      <div class="panel-card">
        <h3>Antigravity / Gemini / Codex / Cursor</h3>
        <p>Install all skills or a single category folder into your preferred terminal coding agent.</p>
        <pre class="code-block">./install.sh gemini
./install.sh codex
./install.sh cursor
# Single category only:
./install.sh claude designing</pre>
        <button class="glass-btn primary copy-block-btn">Copy Commands</button>
      </div>

      <div class="panel-card">
        <h3>Claude.ai, ChatGPT &amp; Gemini Web</h3>
        <p>Use any <code>*-SKILL.md</code> file inside web or desktop chat apps:</p>
        <pre class="code-block">1. Claude.ai: Projects → Project Knowledge (or Settings → Skills)
2. ChatGPT: Custom GPTs / Projects → Knowledge
3. Gemini: Gem Manager → Instructions / Knowledge</pre>
      </div>

      <div class="panel-card">
        <h3>Connectors &amp; Tool Prerequisites</h3>
        <p>Optional tools for integration, browser testing, office docs, and media skills:</p>
        <pre class="code-block">gh auth login
npm i -D @playwright/test
pip install python-docx pdfplumber pypdf python-pptx openpyxl pillow</pre>
        <button class="glass-btn primary copy-block-btn">Copy Commands</button>
      </div>
    </div>
  `;

  els.viewContent.querySelectorAll(".copy-block-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const code = btn.previousElementSibling?.textContent || "";
      copyText(code, "Copied setup commands");
    });
  });
}

function renderCommunity() {
  const repos = [
    {
      name: "ComposioHQ / awesome-claude-skills",
      desc: "1,000+ practical skills and app integrations (Slack, Google Calendar, MCP builder, invoice organizer, webapp testing).",
      url: "https://github.com/ComposioHQ/awesome-claude-skills",
    },
    {
      name: "alirezarezvani / claude-skills",
      desc: "410+ skills for engineering, security, marketing, finance, Jira/Confluence, and project management.",
      url: "https://github.com/alirezarezvani/claude-skills",
    },
    {
      name: "quemsah / awesome-claude-plugins",
      desc: "Top-starred Claude Code plugins directory curated by the community.",
      url: "https://github.com/quemsah/awesome-claude-plugins",
    },
    {
      name: "GitHub Topic: claude-skills",
      desc: "Live index of open-source Claude skill repositories across GitHub.",
      url: "https://github.com/topics/claude-skills",
    },
  ];

  els.viewContent.innerHTML = `
    <div class="panel-grid">
      ${repos
        .map(
          (r) => `
        <div class="panel-card">
          <h3>${escapeHtml(r.name)}</h3>
          <p>${escapeHtml(r.desc)}</p>
          <div>
            <a class="glass-btn primary" href="${r.url}" target="_blank" rel="noopener">Open Repository ↗</a>
          </div>
        </div>`
        )
        .join("")}
    </div>
  `;
}

function openSkillModal(skillId) {
  const s = state.skills.find((x) => x.id === skillId);
  if (!s) return;
  state.selectedSkill = s;
  els.modalCategory.textContent = s.category;
  els.modalTitle.textContent = s.name;
  els.modalDesc.textContent = s.description;
  els.modalContent.textContent = s.content;
  els.modalMeta.textContent = `${s.path} • ${s.lines} lines`;
  els.openGithubLink.href = `${REPO_URL}/blob/main/${s.path}`;
  els.modalBackdrop.classList.add("open");
  els.modalBackdrop.setAttribute("aria-hidden", "false");
}

function closeSkillModal() {
  els.modalBackdrop.classList.remove("open");
  els.modalBackdrop.setAttribute("aria-hidden", "true");
}

function render() {
  document.querySelectorAll(".nav-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.tab === state.tab);
  });
  els.heroSection.style.display = state.tab === "directory" ? "block" : "none";

  if (state.tab === "directory") renderDirectory();
  else if (state.tab === "install") renderInstall();
  else if (state.tab === "community") renderCommunity();
}

async function init() {
  initTheme();

  try {
    const res = await fetch("skills.json");
    state.skills = await res.json();
  } catch {
    els.viewContent.innerHTML = `<div class="panel-card"><h3>Failed to load skills.json</h3><p>Serve this folder over HTTP or GitHub Pages.</p></div>`;
    return;
  }

  const counts = {};
  for (const s of state.skills) {
    counts[s.category] = (counts[s.category] || 0) + 1;
  }
  state.categories = Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }));

  els.heroCountBadge.textContent = `${state.skills.length} Skills • ${state.categories.length} Categories`;

  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      state.tab = tab.dataset.tab;
      render();
    });
  });

  document.getElementById("brandHomeLink").addEventListener("click", (e) => {
    e.preventDefault();
    state.tab = "directory";
    state.activeCategory = "ALL";
    render();
  });

  els.searchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    state.tab = "directory";
    render();
  });

  document.getElementById("copyHeroCliBtn").addEventListener("click", () => {
    const cmd = document.getElementById("heroCliCmd").textContent;
    copyText(cmd, "Copied full install command");
  });

  document.getElementById("themeToggleBtn").addEventListener("click", toggleTheme);

  document.getElementById("modalCloseBtn").addEventListener("click", closeSkillModal);
  els.modalBackdrop.addEventListener("click", (e) => {
    if (e.target === els.modalBackdrop) closeSkillModal();
  });
  document.getElementById("copyRawBtn").addEventListener("click", () => {
    if (state.selectedSkill) copyText(state.selectedSkill.content, `Copied ${state.selectedSkill.name}-SKILL.md`);
  });
  document.getElementById("copyCliBtn").addEventListener("click", () => {
    if (!state.selectedSkill) return;
    const s = state.selectedSkill;
    const cmd = `mkdir -p ~/.claude/skills/${s.name} && curl -fsSL https://raw.githubusercontent.com/YogeshWaran082/claude-skills-collection/main/${s.path} -o ~/.claude/skills/${s.name}/SKILL.md`;
    copyText(cmd, `Copied CLI install for ${s.name}`);
  });

  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      state.tab = "directory";
      render();
      els.searchInput.focus();
    } else if (e.key === "Escape") {
      closeSkillModal();
    }
  });

  render();
}

init();
