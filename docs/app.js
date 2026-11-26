const REPO_URL = "https://github.com/YogeshWaran082/claude-skills-collection";

const state = {
  skills: [],
  categories: [],
  view: "dashboard", // dashboard | all | folder | install | community
  activeCategory: null,
  searchQuery: "",
  folderQuery: "",
  selectedSkill: null,
};

const els = {
  folderTree: document.getElementById("folderTree"),
  workspaceContent: document.getElementById("workspaceContent"),
  breadcrumb: document.getElementById("breadcrumb"),
  globalSearchInput: document.getElementById("globalSearchInput"),
  folderFilterInput: document.getElementById("folderFilterInput"),
  sidebar: document.getElementById("sidebar"),
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

function setActiveNav() {
  document.querySelectorAll(".nav-item[data-view], .rail-btn[data-view]").forEach((btn) => {
    const match = btn.dataset.view === state.view && !state.activeCategory;
    btn.classList.toggle("active", match);
  });
  document.querySelectorAll(".folder-item").forEach((btn) => {
    btn.classList.toggle("active", state.view === "folder" && btn.dataset.category === state.activeCategory);
  });
}

function updateBreadcrumb() {
  let current = "Dashboard";
  if (state.view === "all") current = "All Skills";
  else if (state.view === "folder" && state.activeCategory) current = `Folders › ${state.activeCategory}`;
  else if (state.view === "install") current = "Install & CLI";
  else if (state.view === "community") current = "Community Repos";

  els.breadcrumb.innerHTML = `
    <span class="crumb-root">Skill Lab 2.0</span>
    <span class="crumb-sep">›</span>
    <span class="crumb-current">${escapeHtml(current)}</span>
  `;
}

function renderFolderTree() {
  const q = state.folderQuery.trim().toLowerCase();
  const filtered = state.categories.filter((c) => c.name.toLowerCase().includes(q));
  els.folderTree.innerHTML = filtered
    .map(
      (cat) => `
      <button class="folder-item ${state.view === "folder" && state.activeCategory === cat.name ? "active" : ""}" data-category="${escapeHtml(cat.name)}">
        <span class="folder-name">${escapeHtml(cat.name)}</span>
        <span class="pill-count">${cat.count}</span>
      </button>`
    )
    .join("");

  els.folderTree.querySelectorAll(".folder-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.view = "folder";
      state.activeCategory = btn.dataset.category;
      render();
    });
  });
}

function getFilteredSkills() {
  const q = state.searchQuery.trim().toLowerCase();
  return state.skills.filter((s) => {
    if (state.view === "folder" && state.activeCategory && s.category !== state.activeCategory) {
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

function renderSkillCards(list) {
  if (!list.length) {
    return `<div class="panel-card"><h3>No matching skills</h3><p>Try a different keyword or clear your search filter.</p></div>`;
  }
  return `
    <div class="skills-grid">
      ${list
        .map(
          (s) => `
        <article class="skill-card" data-skill-id="${escapeHtml(s.id)}">
          <div>
            <div class="skill-card-top">
              <span class="cat-tag">${escapeHtml(s.category)}</span>
              <span class="skill-lines">${s.lines} lines</span>
            </div>
            <h3 class="skill-name" style="margin-top:10px">${escapeHtml(s.name)}</h3>
            <p class="skill-desc">${escapeHtml(s.description || "Claude skill instructions.")}</p>
          </div>
          <div class="skill-card-actions">
            <button class="action-btn primary inspect-btn" data-id="${escapeHtml(s.id)}">Inspect</button>
            <button class="action-btn copy-cli-btn" data-id="${escapeHtml(s.id)}">Copy CLI</button>
            <button class="action-btn copy-raw-btn" data-id="${escapeHtml(s.id)}">Copy Prompt</button>
          </div>
        </article>`
        )
        .join("")}
    </div>
  `;
}

function attachCardEvents() {
  els.workspaceContent.querySelectorAll(".skill-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      openSkillModal(card.dataset.skillId);
    });
  });
  els.workspaceContent.querySelectorAll(".inspect-btn").forEach((btn) => {
    btn.addEventListener("click", () => openSkillModal(btn.dataset.id));
  });
  els.workspaceContent.querySelectorAll(".copy-cli-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const s = state.skills.find((x) => x.id === btn.dataset.id);
      if (!s) return;
      const cmd = `mkdir -p ~/.claude/skills/${s.name} && curl -fsSL https://raw.githubusercontent.com/YogeshWaran082/claude-skills-collection/main/${s.path} -o ~/.claude/skills/${s.name}/SKILL.md`;
      copyText(cmd, `Copied CLI install for ${s.name}`);
    });
  });
  els.workspaceContent.querySelectorAll(".copy-raw-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const s = state.skills.find((x) => x.id === btn.dataset.id);
      if (s) copyText(s.content, `Copied ${s.name}-SKILL.md`);
    });
  });
}

function renderDashboard() {
  const q = state.searchQuery.trim();
  const list = getFilteredSkills();
  const featured = q ? list : list.slice(0, 12);
  const installAllCmd = `git clone ${REPO_URL}.git && cd claude-skills-collection && chmod +x install.sh && ./install.sh claude`;

  els.workspaceContent.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Skill Lab 2.0</h1>
        <p class="page-subtitle">Explore, inspect, and install ${state.skills.length} curated Claude skills across ${state.categories.length} folders.</p>
      </div>
      <button class="action-btn primary" id="dashViewAllBtn">Browse All ${state.skills.length} Skills →</button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Skills</div>
        <div class="stat-value-row">
          <span class="stat-value">${state.skills.length}</span>
          <span class="stat-badge">Active</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Category Folders</div>
        <div class="stat-value-row">
          <span class="stat-value">${state.categories.length}</span>
          <span class="stat-badge">Organized</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Supported Agents</div>
        <div class="stat-value-row">
          <span class="stat-value">5+</span>
          <span class="stat-badge">CLI &amp; Chat</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Community Packs</div>
        <div class="stat-value-row">
          <span class="stat-value">4</span>
          <span class="stat-badge">Linked</span>
        </div>
      </div>
    </div>

    <div class="cli-banner">
      <code class="cli-code">${escapeHtml(installAllCmd)}</code>
      <button class="action-btn primary" id="copyMainCliBtn">Copy One-Line Install</button>
    </div>

    <div class="page-header" style="margin-bottom:14px">
      <div>
        <h2 style="font-size:17px;font-weight:600">${q ? `Search Results (${list.length})` : "Featured Skills"}</h2>
      </div>
    </div>

    ${renderSkillCards(featured)}
  `;

  document.getElementById("dashViewAllBtn")?.addEventListener("click", () => {
    state.view = "all";
    state.activeCategory = null;
    render();
  });
  document.getElementById("copyMainCliBtn")?.addEventListener("click", () => {
    copyText(installAllCmd, "Copied full install command");
  });
  attachCardEvents();
}

function renderSkillsView() {
  const list = getFilteredSkills();
  const title = state.view === "folder" && state.activeCategory ? state.activeCategory : "All Skills";

  els.workspaceContent.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">${escapeHtml(title)}</h1>
        <p class="page-subtitle">Showing ${list.length} skill${list.length === 1 ? "" : "s"}${state.searchQuery ? ` matching "${escapeHtml(state.searchQuery)}"` : ""}.</p>
      </div>
    </div>

    <div class="filter-bar">
      <button class="filter-pill ${state.view === "all" ? "active" : ""}" data-cat="ALL">All (${state.skills.length})</button>
      ${state.categories
        .map(
          (c) => `
        <button class="filter-pill ${state.view === "folder" && state.activeCategory === c.name ? "active" : ""}" data-cat="${escapeHtml(c.name)}">
          ${escapeHtml(c.name)} (${c.count})
        </button>`
        )
        .join("")}
    </div>

    ${renderSkillCards(list)}
  `;

  els.workspaceContent.querySelectorAll(".filter-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      if (pill.dataset.cat === "ALL") {
        state.view = "all";
        state.activeCategory = null;
      } else {
        state.view = "folder";
        state.activeCategory = pill.dataset.cat;
      }
      render();
    });
  });
  attachCardEvents();
}

function renderInstallView() {
  els.workspaceContent.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Install &amp; CLI Setup</h1>
        <p class="page-subtitle">Install all ${state.skills.length} skills or any category folder across terminal agents and chat apps.</p>
      </div>
    </div>

    <div class="panel-grid">
      <div class="panel-card">
        <h3>Claude Code CLI (Global / Project)</h3>
        <p>Install every skill into <code>~/.claude/skills/</code> or your current project's <code>.claude/skills/</code>.</p>
        <pre class="code-block">git clone ${REPO_URL}.git
cd claude-skills-collection && chmod +x install.sh
./install.sh claude
# Or project-only:
./install.sh claude-local</pre>
        <button class="action-btn primary copy-block-btn">Copy Commands</button>
      </div>

      <div class="panel-card">
        <h3>Antigravity / Gemini / Codex / Cursor</h3>
        <p>Target other terminal coding agents or install a single category folder (e.g., <code>designing</code>).</p>
        <pre class="code-block">./install.sh gemini
./install.sh codex
./install.sh cursor
# Single category only:
./install.sh claude designing</pre>
        <button class="action-btn primary copy-block-btn">Copy Commands</button>
      </div>

      <div class="panel-card">
        <h3>Claude.ai, ChatGPT &amp; Gemini Web</h3>
        <p>Use any <code>*-SKILL.md</code> file inside web/desktop chat apps without a terminal:</p>
        <pre class="code-block">1. Open Claude.ai → Projects → Project Knowledge (or Settings → Skills)
2. Upload any *-SKILL.md file (or paste into Instructions)
3. ChatGPT: Custom GPTs / Projects → Knowledge
4. Gemini: Gem Manager → Instructions / Knowledge</pre>
      </div>

      <div class="panel-card">
        <h3>Connectors &amp; Tool Prerequisites</h3>
        <p>Optional tools for integration, browser testing, office docs, and media skills:</p>
        <pre class="code-block"># GitHub &amp; Playwright
gh auth login
npm i -D @playwright/test

# Office &amp; Media Python deps
pip install python-docx pdfplumber pypdf python-pptx openpyxl pillow</pre>
        <button class="action-btn primary copy-block-btn">Copy Commands</button>
      </div>
    </div>
  `;

  els.workspaceContent.querySelectorAll(".copy-block-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const code = btn.previousElementSibling?.textContent || "";
      copyText(code, "Copied setup commands");
    });
  });
}

function renderCommunityView() {
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

  els.workspaceContent.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Community Repositories</h1>
        <p class="page-subtitle">Upstream open-source skill packs and plugin directories integrated with Skill Lab 2.0.</p>
      </div>
    </div>

    <div class="panel-grid">
      ${repos
        .map(
          (r) => `
        <div class="panel-card">
          <h3>${escapeHtml(r.name)}</h3>
          <p>${escapeHtml(r.desc)}</p>
          <div>
            <a class="action-btn primary" href="${r.url}" target="_blank" rel="noopener">Open Repository ↗</a>
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
  setActiveNav();
  updateBreadcrumb();
  renderFolderTree();

  if (state.view === "dashboard") renderDashboard();
  else if (state.view === "all" || state.view === "folder") renderSkillsView();
  else if (state.view === "install") renderInstallView();
  else if (state.view === "community") renderCommunityView();
}

async function init() {
  initTheme();

  try {
    const res = await fetch("skills.json");
    state.skills = await res.json();
  } catch (err) {
    els.workspaceContent.innerHTML = `<div class="panel-card"><h3>Failed to load skills.json</h3><p>Serve this folder over HTTP (e.g. <code>python3 -m http.server</code> or GitHub Pages).</p></div>`;
    return;
  }

  const counts = {};
  for (const s of state.skills) {
    counts[s.category] = (counts[s.category] || 0) + 1;
  }
  state.categories = Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }));

  document.getElementById("countTotalSide").textContent = state.skills.length;
  document.getElementById("countAllSide").textContent = state.skills.length;
  document.getElementById("countFoldersSide").textContent = state.categories.length;

  // Navigation listeners
  document.querySelectorAll(".nav-item[data-view], .rail-btn[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.view = btn.dataset.view;
      state.activeCategory = null;
      render();
    });
  });

  els.globalSearchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    if (state.view === "install" || state.view === "community") {
      state.view = "all";
    }
    render();
  });

  els.folderFilterInput.addEventListener("input", (e) => {
    state.folderQuery = e.target.value;
    renderFolderTree();
  });

  document.getElementById("themeToggleRail").addEventListener("click", toggleTheme);
  document.getElementById("themeToggleTop").addEventListener("click", toggleTheme);

  document.getElementById("sidebarToggleBtn").addEventListener("click", () => {
    els.sidebar.classList.toggle("collapsed");
  });
  document.getElementById("mobileMenuBtn").addEventListener("click", () => {
    els.sidebar.classList.toggle("collapsed");
  });

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
      els.globalSearchInput.focus();
    } else if (e.key === "Escape") {
      closeSkillModal();
    }
  });

  render();
}

init();
