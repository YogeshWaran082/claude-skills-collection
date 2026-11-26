const REPO_URL = "https://github.com/YogeshWaran082/claude-skills-collection";
const REPO_SLUG = "YogeshWaran082/claude-skills-collection";

const state = {
  skills: [],
  categories: [],
  tab: "directory", // directory | npm | install | community
  activeCategory: "ALL",
  searchQuery: "",
  sortBy: "name", // name | category | lines_desc | lines_asc
  savedIds: new Set(JSON.parse(localStorage.getItem("skilllab-saved") || "[]")),
  selectedSkill: null,
  npmBuilder: {
    agent: "claude",
    scope: "global",
    target: "ALL",
  },
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

function toggleSaveSkill(skillId) {
  if (state.savedIds.has(skillId)) {
    state.savedIds.delete(skillId);
    showToast("Removed from Saved");
  } else {
    state.savedIds.add(skillId);
    showToast("Saved skill");
  }
  localStorage.setItem("skilllab-saved", JSON.stringify([...state.savedIds]));
  render();
}

function getFilteredSkills() {
  const q = state.searchQuery.trim().toLowerCase();
  const filtered = state.skills.filter((s) => {
    if (state.activeCategory === "SAVED" && !state.savedIds.has(s.id)) return false;
    else if (state.activeCategory !== "ALL" && state.activeCategory !== "SAVED" && s.category !== state.activeCategory) {
      return false;
    }
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  });

  return filtered.sort((a, b) => {
    if (state.sortBy === "category") return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
    if (state.sortBy === "lines_desc") return b.lines - a.lines;
    if (state.sortBy === "lines_asc") return a.lines - b.lines;
    return a.name.localeCompare(b.name);
  });
}

function renderDirectory() {
  const list = getFilteredSkills();

  els.viewContent.innerHTML = `
    <div class="directory-toolbar">
      <div class="filter-bar" style="margin-bottom:0">
        <button class="filter-pill ${state.activeCategory === "ALL" ? "active" : ""}" data-cat="ALL">
          All (${state.skills.length})
        </button>
        <button class="filter-pill ${state.activeCategory === "SAVED" ? "active" : ""}" data-cat="SAVED">
          ★ Saved (${state.savedIds.size})
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

      <div class="toolbar-controls">
        ${
          state.savedIds.size
            ? `<button class="glass-btn" id="copySavedCliBtn">Copy Saved CLI (${state.savedIds.size})</button>`
            : ""
        }
        <select class="glass-select" id="sortSelect" aria-label="Sort skills">
          <option value="name" ${state.sortBy === "name" ? "selected" : ""}>Sort: Name (A–Z)</option>
          <option value="category" ${state.sortBy === "category" ? "selected" : ""}>Sort: Category</option>
          <option value="lines_desc" ${state.sortBy === "lines_desc" ? "selected" : ""}>Sort: Most Detailed</option>
          <option value="lines_asc" ${state.sortBy === "lines_asc" ? "selected" : ""}>Sort: Shortest</option>
        </select>
      </div>
    </div>

    <div class="directory-panel">
      <div class="directory-header">
        <span>Skills Directory (${list.length})</span>
        <span>Click any skill to inspect, star, or copy CLI</span>
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
            <button class="star-btn ${state.savedIds.has(s.id) ? "starred" : ""}" data-star-id="${escapeHtml(s.id)}" title="Save skill">
              ${state.savedIds.has(s.id) ? "★" : "☆"}
            </button>
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

  document.getElementById("sortSelect")?.addEventListener("change", (e) => {
    state.sortBy = e.target.value;
    render();
  });

  document.getElementById("copySavedCliBtn")?.addEventListener("click", () => {
    const cmds = [...state.savedIds]
      .map((id) => state.skills.find((s) => s.id === id))
      .filter(Boolean)
      .map(
        (s) =>
          `mkdir -p ~/.claude/skills/${s.name} && curl -fsSL https://raw.githubusercontent.com/${REPO_SLUG}/main/${s.path} -o ~/.claude/skills/${s.name}/SKILL.md`
      )
      .join("\n");
    copyText(cmds, `Copied CLI commands for ${state.savedIds.size} saved skills`);
  });

  els.viewContent.querySelectorAll(".skill-row").forEach((row) => {
    row.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      openSkillModal(row.dataset.skillId);
    });
  });

  els.viewContent.querySelectorAll(".star-btn").forEach((btn) => {
    btn.addEventListener("click", () => toggleSaveSkill(btn.dataset.starId));
  });

  els.viewContent.querySelectorAll(".inspect-btn").forEach((btn) => {
    btn.addEventListener("click", () => openSkillModal(btn.dataset.id));
  });

  els.viewContent.querySelectorAll(".copy-cli-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const s = state.skills.find((x) => x.id === btn.dataset.id);
      if (!s) return;
      const cmd = `mkdir -p ~/.claude/skills/${s.name} && curl -fsSL https://raw.githubusercontent.com/${REPO_SLUG}/main/${s.path} -o ~/.claude/skills/${s.name}/SKILL.md`;
      copyText(cmd, `Copied CLI install for ${s.name}`);
    });
  });
}

function getBuilderCommands() {
  const { agent, scope, target } = state.npmBuilder;
  const agentFlag = agent === "claude" ? "claude-code" : agent;
  const installTarget = scope === "project" && agent === "claude" ? "claude-local" : agent;

  let npxCmd = `npx skills add ${REPO_SLUG} -a ${agentFlag}`;
  let scriptCmd = `git clone ${REPO_URL}.git && cd claude-skills-collection && ./install.sh ${installTarget}`;
  let curlCmd = `# Select a specific skill above for a single-file curl command`;

  if (target.startsWith("cat:")) {
    const cat = target.slice(4);
    npxCmd = `npx skills add ${REPO_SLUG} -a ${agentFlag} # category: ${cat}`;
    scriptCmd = `git clone ${REPO_URL}.git && cd claude-skills-collection && ./install.sh ${installTarget} ${cat}`;
  } else if (target.startsWith("skill:")) {
    const skillId = target.slice(6);
    const s = state.skills.find((x) => x.id === skillId);
    if (s) {
      npxCmd = `npx skills add ${REPO_SLUG} --skill ${s.name} -a ${agentFlag}`;
      const dirMap = {
        claude: scope === "project" ? ".claude/skills" : "~/.claude/skills",
        gemini: "~/.gemini/antigravity/skills",
        codex: "~/.codex/skills",
        cursor: ".cursor/rules",
      };
      const dest = dirMap[agent] || "~/.claude/skills";
      if (agent === "cursor") {
        curlCmd = `mkdir -p ${dest} && curl -fsSL https://raw.githubusercontent.com/${REPO_SLUG}/main/${s.path} -o ${dest}/${s.name}.mdc`;
      } else {
        curlCmd = `mkdir -p ${dest}/${s.name} && curl -fsSL https://raw.githubusercontent.com/${REPO_SLUG}/main/${s.path} -o ${dest}/${s.name}/SKILL.md`;
      }
    }
  }

  return { npxCmd, scriptCmd, curlCmd };
}

function renderNpmPage() {
  const { agent, scope, target } = state.npmBuilder;
  const { npxCmd, scriptCmd, curlCmd } = getBuilderCommands();

  els.viewContent.innerHTML = `
    <div class="builder-card">
      <h2 style="font-size:20px;font-weight:700">npm / npx Skills Command Builder</h2>
      <p style="font-size:13.5px;color:var(--text-secondary);margin-top:4px">
        Build ready-to-run <code>npx skills</code>, <code>install.sh</code>, or single-file <code>curl</code> commands for your agent.
      </p>

      <div class="builder-grid">
        <div class="builder-field">
          <label for="builderAgent">Target Agent</label>
          <select id="builderAgent">
            <option value="claude" ${agent === "claude" ? "selected" : ""}>Claude Code</option>
            <option value="gemini" ${agent === "gemini" ? "selected" : ""}>Antigravity / Gemini</option>
            <option value="codex" ${agent === "codex" ? "selected" : ""}>OpenAI Codex CLI</option>
            <option value="cursor" ${agent === "cursor" ? "selected" : ""}>Cursor (.cursor/rules)</option>
          </select>
        </div>

        <div class="builder-field">
          <label for="builderScope">Install Scope</label>
          <select id="builderScope">
            <option value="global" ${scope === "global" ? "selected" : ""}>Global (~/.claude / ~/.gemini)</option>
            <option value="project" ${scope === "project" ? "selected" : ""}>Project Local (./.claude)</option>
          </select>
        </div>

        <div class="builder-field">
          <label for="builderTarget">Skill or Category</label>
          <select id="builderTarget">
            <option value="ALL" ${target === "ALL" ? "selected" : ""}>All ${state.skills.length} Skills</option>
            <optgroup label="Categories (${state.categories.length})">
              ${state.categories
                .map((c) => `<option value="cat:${escapeHtml(c.name)}" ${target === `cat:${c.name}` ? "selected" : ""}>Folder: ${escapeHtml(c.name)} (${c.count})</option>`)
                .join("")}
            </optgroup>
            <optgroup label="Individual Skills (${state.skills.length})">
              ${state.skills
                .map((s) => `<option value="skill:${escapeHtml(s.id)}" ${target === `skill:${s.id}` ? "selected" : ""}>${escapeHtml(s.name)} (${escapeHtml(s.category)})</option>`)
                .join("")}
            </optgroup>
          </select>
        </div>
      </div>

      <div style="margin-top:10px">
        <div style="font-size:12px;font-weight:600;color:var(--text-secondary)">1. Via npm / npx skills CLI</div>
        <div class="cmd-output-row">
          <code id="outNpx">${escapeHtml(npxCmd)}</code>
          <button class="row-btn primary" data-copy-target="outNpx">Copy</button>
        </div>
      </div>

      <div style="margin-top:12px">
        <div style="font-size:12px;font-weight:600;color:var(--text-secondary)">2. Via Repo Installer (install.sh)</div>
        <div class="cmd-output-row">
          <code id="outScript">${escapeHtml(scriptCmd)}</code>
          <button class="row-btn primary" data-copy-target="outScript">Copy</button>
        </div>
      </div>

      <div style="margin-top:12px">
        <div style="font-size:12px;font-weight:600;color:var(--text-secondary)">3. Direct Single-Skill curl</div>
        <div class="cmd-output-row">
          <code id="outCurl">${escapeHtml(curlCmd)}</code>
          <button class="row-btn primary" data-copy-target="outCurl">Copy</button>
        </div>
      </div>
    </div>

    <div class="panel-grid">
      <div class="panel-card">
        <h3>Useful npx skills Commands</h3>
        <p>Search, install, list, and run skills on the fly with the open <code>skills</code> npm CLI:</p>
        <pre class="code-block">npx skills find design
npx skills add ${REPO_SLUG}
npx skills list
npx skills use ${REPO_SLUG}@code-reviewer</pre>
        <button class="glass-btn primary copy-block-btn">Copy Commands</button>
      </div>

      <div class="panel-card">
        <h3>Requirements</h3>
        <p>Make sure Node.js 18+ (for <code>npx</code>) or Git + Bash (for <code>install.sh</code>) is installed:</p>
        <pre class="code-block">node -v   # v18+ recommended
npm -v    # comes with Node.js
git --version</pre>
        <button class="glass-btn primary copy-block-btn">Copy Check</button>
      </div>
    </div>
  `;

  document.getElementById("builderAgent").addEventListener("change", (e) => {
    state.npmBuilder.agent = e.target.value;
    renderNpmPage();
  });
  document.getElementById("builderScope").addEventListener("change", (e) => {
    state.npmBuilder.scope = e.target.value;
    renderNpmPage();
  });
  document.getElementById("builderTarget").addEventListener("change", (e) => {
    state.npmBuilder.target = e.target.value;
    renderNpmPage();
  });

  els.viewContent.querySelectorAll("[data-copy-target]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const code = document.getElementById(btn.dataset.copyTarget)?.textContent || "";
      copyText(code, "Copied command");
    });
  });

  els.viewContent.querySelectorAll(".copy-block-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const code = btn.previousElementSibling?.textContent || "";
      copyText(code, "Copied commands");
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

function downloadSelectedSkill() {
  if (!state.selectedSkill) return;
  const s = state.selectedSkill;
  const blob = new Blob([s.content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = s.filename || `${s.name}-SKILL.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast(`Downloaded ${a.download}`);
}

function render() {
  document.querySelectorAll(".nav-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.tab === state.tab);
  });
  els.heroSection.style.display = state.tab === "directory" ? "block" : "none";

  if (state.tab === "directory") renderDirectory();
  else if (state.tab === "npm") renderNpmPage();
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

  document.querySelectorAll("[data-footer-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.tab = btn.dataset.footerTab;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  document.getElementById("footerNotifyForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("footerEmailInput");
    if (input.value.trim()) {
      showToast(`Subscribed ${input.value.trim()} for Skill Lab 2.0 updates`);
      input.value = "";
    }
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
    const cmd = `mkdir -p ~/.claude/skills/${s.name} && curl -fsSL https://raw.githubusercontent.com/${REPO_SLUG}/main/${s.path} -o ~/.claude/skills/${s.name}/SKILL.md`;
    copyText(cmd, `Copied CLI install for ${s.name}`);
  });
  document.getElementById("downloadSkillBtn").addEventListener("click", downloadSelectedSkill);

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
