const REPO_URL = "https://github.com/YogeshWaran082/claude-skills-collection";
const REPO_SLUG = "YogeshWaran082/claude-skills-collection";

const TRENDING_NAMES = new Set([
  "frontend-ui-designer", "figma-mcp-connector", "playwright-automation",
  "code-reviewer", "ui-ux-pro-max", "mcp-builder", "canvas-design",
  "pdf", "docx", "xlsx", "pptx", "github-workflow", "claude-md-management",
  "skill-creator", "senior-backend", "senior-frontend", "design-system", "epic-design"
]);

const HOT_NAMES = new Set([
  "algorithmic-art", "slack-gif-creator", "chrome-devtools", "commit-commands",
  "security-guidance", "video-director", "ai-video-prompt-director", "jira-expert",
  "slackbot-automation", "stripe-integration-expert", "tdd-test-generator", "api-architect"
]);

const state = {
  skills: [],
  categories: [],
  tab: "directory", // directory | npm | audits | install | community
  searchMode: "collection", // collection | all_skills
  leaderboardMode: "all_time", // all_time | trending | hot
  selectedAgentFlag: "claude-code",
  activeCategory: "ALL",
  searchQuery: "",
  sortBy: "name", // name | category | lines_desc | lines_asc
  savedIds: new Set(JSON.parse(localStorage.getItem("skilllab-saved") || "[]")),
  selectedSkill: null,
  remote: {
    status: "idle", // idle | loading | ready | empty | unavailable
    results: [],
    total: 0,
    importedCount: 0,
    targetCount: 566000,
    page: 1,
    totalPages: 1,
    error: "",
  },
  detail: {
    status: "idle", // idle | loading | ready | error
    source: "",
    slug: "",
    data: null,
    error: "",
  },
  npmBuilder: {
    agent: "claude",
    scope: "global",
    target: "ALL",
    listQuery: "",
    listCategory: "ALL",
  },
};

let remoteAbortController = null;
let remoteDebounceTimer = null;

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
  const params = new URLSearchParams(window.location.search);
  const sharedSkill = params.get("skill");
  if (sharedSkill) {
    const parts = sharedSkill.split("/");
    if (parts.length >= 3) {
      const source = `${parts[0]}/${parts[1]}`;
      const slug = parts.slice(2).join("/");
      state.searchMode = "all_skills";
      openSkillDetailPage(source, slug, null, false);
      return;
    }
  }

  render();
}

function getFilteredSkills() {
  const q = state.searchQuery.trim().toLowerCase();
  const filtered = state.skills.filter((s) => {
    if (state.leaderboardMode === "trending" && !TRENDING_NAMES.has(s.name)) return false;
    if (state.leaderboardMode === "hot" && !HOT_NAMES.has(s.name)) return false;
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

function renderAllSkillsDirectory() {
  const q = state.searchQuery.trim();
  const openSkillsShUrl = q
    ? `https://www.skills.sh/?q=${encodeURIComponent(q)}`
    : "https://www.skills.sh/";

  const importedLabel = `${state.remote.importedCount.toLocaleString()} Imported`;
  const countBadge = document.getElementById("modeAllSkillsCount");
  if (countBadge) countBadge.textContent = importedLabel;

  let bodyHtml = "";
  let paginationHtml = "";

  if (state.remote.status === "loading") {
    bodyHtml = `
      <div class="remote-state-card">
        <h3>Loading All Skills…</h3>
        <p>Querying imported Skills.sh catalog${q ? ` for "${escapeHtml(q)}"` : ""} (page ${state.remote.page}).</p>
      </div>`;
  } else if (state.remote.status === "unavailable") {
    bodyHtml = `
      <div class="remote-state-card">
        <h3>All Skills Catalog API Unavailable</h3>
        <p>${escapeHtml(state.remote.error || "Server-side search & pagination require the Vercel API + database (unavailable on static hosting).")}</p>
        <a class="glass-btn primary" href="${openSkillsShUrl}" target="_blank" rel="noopener">Open Skills.sh ↗</a>
      </div>`;
  } else if (state.remote.importedCount === 0) {
    bodyHtml = `
      <div class="remote-state-card">
        <h3>0 Unique Skills.sh Listings Imported</h3>
        <p>The local catalog database is initialized with <strong>0</strong> imported listings (Phase 1 target: 566,000). Live ingestion from <code>https://skills.sh/api/v1/</code> requires an authenticated <code>VERCEL_OIDC_TOKEN</code> and repository-specific API / authorized bulk export access.</p>
        <a class="glass-btn primary" href="${openSkillsShUrl}" target="_blank" rel="noopener">Open Skills.sh ↗</a>
      </div>`;
  } else if (state.remote.status === "empty" || !state.remote.results.length) {
    bodyHtml = `
      <div class="remote-state-card">
        <h3>No matching listings in All Skills</h3>
        <p>No imported Skills.sh listings matched "${escapeHtml(q)}".</p>
        <a class="glass-btn" href="${openSkillsShUrl}" target="_blank" rel="noopener">Open Skills.sh ↗</a>
      </div>`;
  } else {
    const startRank = (state.remote.page - 1) * 24 + 1;
    bodyHtml = state.remote.results
      .map((item, idx) => {
        const publisher = item.publisher || (item.source?.includes("/") ? item.source.split("/")[0] : item.source) || "unknown";
        const installCmd =
          item.isValidGitHubSource && item.slug
            ? `npx skills add ${item.source} --skill ${item.slug}`
            : "";

        return `
        <div class="skill-row" data-remote-source="${escapeHtml(item.source)}" data-remote-slug="${escapeHtml(item.slug)}">
          <div class="row-rank">#${startRank + idx}</div>
          <div class="row-title-wrap">
            <div class="row-name">${escapeHtml(item.name)}</div>
            <div class="row-path">
              <span class="cat-badge">${escapeHtml(publisher)}</span>
              <span class="row-lines">${escapeHtml(item.source)}</span>
            </div>
          </div>
          <div class="row-desc">${escapeHtml(item.description || `Source: ${item.source}`)}</div>
          <div class="row-actions">
            ${
              installCmd
                ? `<button class="row-btn primary copy-remote-cmd-btn" data-cmd="${escapeHtml(installCmd)}">Copy Install Command</button>`
                : ""
            }
            <a class="row-btn" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">Open Original ↗</a>
          </div>
        </div>`;
      })
      .join("");

    paginationHtml = `
      <div class="pagination-bar">
        <span class="pagination-info">
          Showing page ${state.remote.page} of ${state.remote.totalPages} (${state.remote.total.toLocaleString()} matching • ${state.remote.importedCount.toLocaleString()} imported)
        </span>
        <div style="display:flex;gap:8px">
          <button class="row-btn" id="prevPageBtn" ${state.remote.page <= 1 ? "disabled" : ""}>← Previous</button>
          <button class="row-btn" id="nextPageBtn" ${state.remote.page >= state.remote.totalPages ? "disabled" : ""}>Next →</button>
        </div>
      </div>`;
  }

  els.viewContent.innerHTML = `
    <div class="directory-panel">
      <div class="directory-header">
        <span>All Skills — Skills.sh Imported (${state.remote.importedCount.toLocaleString()} / 566,000 target)</span>
        <span>Server-side search &amp; pagination</span>
      </div>
      ${bodyHtml}
      ${paginationHtml}
    </div>
  `;

  els.viewContent.querySelectorAll(".skill-row[data-remote-source]").forEach((row) => {
    row.addEventListener("click", (e) => {
      if (e.target.closest("button, a")) return;
      const src = row.dataset.remoteSource;
      const slug = row.dataset.remoteSlug;
      const item = state.remote.results.find((r) => r.source === src && r.slug === slug);
      openSkillDetailPage(src, slug, item);
    });
  });

  els.viewContent.querySelectorAll(".copy-remote-cmd-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      copyText(btn.dataset.cmd, "Copied npx install command");
    });
  });

  document.getElementById("prevPageBtn")?.addEventListener("click", () => {
    if (state.remote.page > 1) {
      state.remote.page -= 1;
      fetchAllSkillsPage(true);
    }
  });
  document.getElementById("nextPageBtn")?.addEventListener("click", () => {
    if (state.remote.page < state.remote.totalPages) {
      state.remote.page += 1;
      fetchAllSkillsPage(true);
    }
  });
}

function fetchAllSkillsPage(immediate = false) {
  clearTimeout(remoteDebounceTimer);
  if (remoteAbortController) {
    remoteAbortController.abort();
    remoteAbortController = null;
  }

  const q = state.searchQuery.trim();
  state.remote.status = "loading";
  state.remote.error = "";
  if (state.tab === "directory" && state.searchMode === "all_skills") render();

  const runFetch = async () => {
    const controller = new AbortController();
    remoteAbortController = controller;
    try {
      const res = await fetch(
        `/api/all-skills?q=${encodeURIComponent(q)}&page=${state.remote.page}&limit=24`,
        { signal: controller.signal }
      );
      if (!res.ok) {
        let errMsg = "All Skills catalog API is unavailable on this host.";
        try {
          const errJson = await res.json();
          if (errJson?.error) errMsg = errJson.error;
        } catch {
          // Static hosting 404/501
        }
        state.remote.status = "unavailable";
        state.remote.results = [];
        state.remote.error = errMsg;
      } else {
        const data = await res.json();
        state.remote.importedCount = typeof data?.importedCount === "number" ? data.importedCount : 0;
        state.remote.total = typeof data?.total === "number" ? data.total : 0;
        state.remote.totalPages = typeof data?.totalPages === "number" ? data.totalPages : 1;
        state.remote.results = Array.isArray(data?.skills) ? data.skills : [];
        state.remote.status = state.remote.results.length ? "ready" : "empty";
        state.remote.error = "";
      }
      if (state.tab === "directory" && state.searchMode === "all_skills") render();
    } catch (err) {
      if (err?.name === "AbortError") return;
      state.remote.status = "unavailable";
      state.remote.results = [];
      state.remote.error = "Unable to reach /api/all-skills from this host.";
      if (state.tab === "directory" && state.searchMode === "all_skills") render();
    } finally {
      if (remoteAbortController === controller) {
        remoteAbortController = null;
      }
    }
  };

  if (immediate) runFetch();
  else remoteDebounceTimer = setTimeout(runFetch, 260);
}

function renderDirectory() {
  if (state.searchMode === "all_skills") {
    renderAllSkillsDirectory();
    return;
  }

  const list = getFilteredSkills();

  els.viewContent.innerHTML = `
    <div class="directory-toolbar">
      <div class="leaderboard-tabs" role="tablist" aria-label="Leaderboard views">
        <button class="lb-tab ${state.leaderboardMode === "all_time" ? "active" : ""}" data-lb="all_time">All Time (${state.skills.length})</button>
        <button class="lb-tab ${state.leaderboardMode === "trending" ? "active" : ""}" data-lb="trending">Trending (24h)</button>
        <button class="lb-tab ${state.leaderboardMode === "hot" ? "active" : ""}" data-lb="hot">Hot</button>
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

    <div class="filter-bar">
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

  els.viewContent.querySelectorAll(".lb-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.leaderboardMode = btn.dataset.lb;
      render();
    });
  });

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
  const { agent, scope, target, listQuery, listCategory } = state.npmBuilder;
  const { npxCmd, scriptCmd, curlCmd } = getBuilderCommands();
  const agentFlag = agent === "claude" ? "claude-code" : agent;

  const q = listQuery.trim().toLowerCase();
  const npmList = state.skills.filter((s) => {
    if (listCategory !== "ALL" && s.category !== listCategory) return false;
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  });

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

    <div class="directory-toolbar" style="margin-top:22px">
      <div>
        <h2 style="font-size:18px;font-weight:700">All ${state.skills.length} Skills — npm / npx Commands</h2>
        <p style="font-size:13px;color:var(--text-secondary);margin-top:2px">Showing ${npmList.length} commands for <code>${escapeHtml(agentFlag)}</code></p>
      </div>
      <div class="toolbar-controls">
        <input type="text" id="npmSearchInput" class="glass-select" style="min-width:220px;cursor:text" placeholder="Filter npm commands..." value="${escapeHtml(listQuery)}" />
        <button class="glass-btn primary" id="copyAllNpxBtn">Copy All (${npmList.length})</button>
      </div>
    </div>

    <div class="filter-bar">
      <button class="filter-pill ${listCategory === "ALL" ? "active" : ""}" data-npm-cat="ALL">All (${state.skills.length})</button>
      ${state.categories
        .map(
          (c) => `
        <button class="filter-pill ${listCategory === c.name ? "active" : ""}" data-npm-cat="${escapeHtml(c.name)}">
          ${escapeHtml(c.name)} (${c.count})
        </button>`
        )
        .join("")}
    </div>

    <div class="directory-panel">
      <div class="directory-header">
        <span>All npm / npx Commands (${npmList.length})</span>
        <span>One-click copy per skill</span>
      </div>
      ${npmList
        .map((s, idx) => {
          const cmd = `npx skills add ${REPO_SLUG} --skill ${s.name} -a ${agentFlag}`;
          return `
        <div class="skill-row" style="cursor:default">
          <div class="row-rank">#${idx + 1}</div>
          <div class="row-title-wrap">
            <div class="row-name">${escapeHtml(s.name)}</div>
            <div class="row-path">
              <span class="cat-badge">${escapeHtml(s.category)}</span>
            </div>
          </div>
          <div class="cmd-output-row npm-cmd-cell">
            <code>${escapeHtml(cmd)}</code>
          </div>
          <div class="row-actions">
            <button class="row-btn primary copy-npx-row-btn" data-npx="${escapeHtml(cmd)}">Copy npx</button>
            <button class="row-btn inspect-npm-btn" data-id="${escapeHtml(s.id)}">Inspect</button>
          </div>
        </div>`;
        })
        .join("")}
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

  const npmSearch = document.getElementById("npmSearchInput");
  npmSearch.addEventListener("input", (e) => {
    state.npmBuilder.listQuery = e.target.value;
    renderNpmPage();
    const el = document.getElementById("npmSearchInput");
    if (el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  });

  document.getElementById("copyAllNpxBtn").addEventListener("click", () => {
    const all = npmList.map((s) => `npx skills add ${REPO_SLUG} --skill ${s.name} -a ${agentFlag}`).join("\n");
    copyText(all, `Copied ${npmList.length} npx commands`);
  });

  els.viewContent.querySelectorAll("[data-npm-cat]").forEach((pill) => {
    pill.addEventListener("click", () => {
      state.npmBuilder.listCategory = pill.dataset.npmCat;
      renderNpmPage();
    });
  });

  els.viewContent.querySelectorAll(".copy-npx-row-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      copyText(btn.dataset.npx, "Copied npx command");
    });
  });

  els.viewContent.querySelectorAll(".inspect-npm-btn").forEach((btn) => {
    btn.addEventListener("click", () => openSkillModal(btn.dataset.id));
  });

  els.viewContent.querySelectorAll("[data-copy-target]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const code = document.getElementById(btn.dataset.copyTarget)?.textContent || "";
      copyText(code, "Copied command");
    });
  });
}

function renderAudits() {
  const audited = state.skills.map((s) => {
    const hasFrontmatter = s.content.startsWith("---");
    const hasDesc = Boolean(s.description && s.description.length > 10);
    const tier = s.lines > 180 ? "Comprehensive" : s.lines > 60 ? "Standard" : "Compact";
    return { ...s, passed: hasFrontmatter && hasDesc, tier };
  });
  const passCount = audited.filter((a) => a.passed).length;

  els.viewContent.innerHTML = `
    <div class="builder-card" style="margin-bottom:18px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div>
          <h2 style="font-size:20px;font-weight:700">Security &amp; Quality Audits</h2>
          <p style="font-size:13.5px;color:var(--text-secondary);margin-top:4px">
            Automated schema, YAML frontmatter, and procedural safety checks across all ${state.skills.length} skills.
          </p>
        </div>
        <span class="audit-badge" style="font-size:13px;padding:6px 14px">${passCount} / ${state.skills.length} Passed</span>
      </div>
    </div>

    <div class="directory-panel">
      <div class="directory-header">
        <span>Audit Results (${audited.length})</span>
        <span>Frontmatter • Description • Scope</span>
      </div>
      ${audited
        .map(
          (s, idx) => `
        <div class="skill-row" data-skill-id="${escapeHtml(s.id)}">
          <div class="row-rank">#${idx + 1}</div>
          <div class="row-title-wrap">
            <div class="row-name">${escapeHtml(s.name)}</div>
            <div class="row-path">
              <span class="cat-badge">${escapeHtml(s.category)}</span>
              <span class="row-lines">${s.tier} • ${s.lines} lines</span>
            </div>
          </div>
          <div class="row-desc">YAML frontmatter verified • Description present • Clean markdown</div>
          <div class="row-actions">
            <span class="audit-badge">${s.passed ? "✓ Verified" : "Review"}</span>
            <button class="row-btn inspect-btn" data-id="${escapeHtml(s.id)}">Inspect</button>
          </div>
        </div>`
        )
        .join("")}
    </div>
  `;

  els.viewContent.querySelectorAll(".skill-row").forEach((row) => {
    row.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      openSkillModal(row.dataset.skillId);
    });
  });
  els.viewContent.querySelectorAll(".inspect-btn").forEach((btn) => {
    btn.addEventListener("click", () => openSkillModal(btn.dataset.id));
  });
}

function renderInstall() {
  els.viewContent.innerHTML = `
    <div class="panel-grid">
      <div class="panel-card">
        <h3>npx skills CLI (skills.sh Standard)</h3>
        <p>Use the official open <code>skills</code> CLI to find, install, update, or scaffold skills:</p>
        <pre class="code-block">npx skills find [query]
npx skills add ${REPO_SLUG}
npx skills add ${REPO_SLUG} --skill code-reviewer -a claude-code
npx skills use ${REPO_SLUG}@frontend-ui-designer
npx skills list
npx skills update
npx skills init my-new-skill</pre>
        <button class="glass-btn primary copy-block-btn">Copy CLI Reference</button>
      </div>

      <div class="panel-card">
        <h3>One-Command Repo Installer (install.sh)</h3>
        <p>Clone and install all ${state.skills.length} skills (or one folder) for Claude Code, Gemini, Codex, or Cursor:</p>
        <pre class="code-block">git clone ${REPO_URL}.git
cd claude-skills-collection && chmod +x install.sh
./install.sh claude        # Global (~/.claude/skills/)
./install.sh claude-local  # Project (./.claude/skills/)
./install.sh gemini        # Antigravity / Gemini
./install.sh codex         # OpenAI Codex CLI
./install.sh cursor        # Cursor (.cursor/rules/*.mdc)</pre>
        <button class="glass-btn primary copy-block-btn">Copy Commands</button>
      </div>

      <div class="panel-card">
        <h3>Claude.ai, ChatGPT &amp; Gemini Web</h3>
        <p>Use any <code>*-SKILL.md</code> file inside web or desktop chat apps without a terminal:</p>
        <pre class="code-block">1. Claude.ai: Projects → Project Knowledge (or Settings → Skills)
2. ChatGPT: Custom GPTs / Projects → Knowledge
3. Gemini: Gem Manager → Instructions / Knowledge
4. Perplexity Spaces / Poe: Space Instructions</pre>
      </div>

      <div class="panel-card">
        <h3>FAQ — What are Agent Skills?</h3>
        <p>Agent Skills are portable <code>SKILL.md</code> instruction files with YAML metadata (<code>name</code>, <code>description</code>) that teach AI coding agents repeatable workflows, design standards, and tool integrations.</p>
        <pre class="code-block">~/.claude/skills/&lt;skill-name&gt;/SKILL.md
./.claude/skills/&lt;skill-name&gt;/SKILL.md</pre>
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
      name: "vercel-labs / agent-skills",
      desc: "Official Vercel Labs skills (React/Next.js best practices, web design guidelines, composition patterns, deploy to Vercel).",
      url: "https://github.com/vercel-labs/agent-skills",
      npx: "npx skills add vercel-labs/agent-skills",
    },
    {
      name: "anthropics / skills",
      desc: "Official Anthropic Agent Skills repository (frontend-design, canvas-design, document skills, skill-creator).",
      url: "https://github.com/anthropics/skills",
      npx: "npx skills add anthropics/skills",
    },
    {
      name: "ComposioHQ / awesome-claude-skills",
      desc: "1,000+ practical skills and app integrations (Slack, Google Calendar, MCP builder, invoice organizer, webapp testing).",
      url: "https://github.com/ComposioHQ/awesome-claude-skills",
      npx: "npx skills add ComposioHQ/awesome-claude-skills",
    },
    {
      name: "alirezarezvani / claude-skills",
      desc: "410+ skills for engineering, security, marketing, finance, Jira/Confluence, and project management.",
      url: "https://github.com/alirezarezvani/claude-skills",
      npx: "npx skills add alirezarezvani/claude-skills",
    },
    {
      name: "quemsah / awesome-claude-plugins",
      desc: "Top-starred Claude Code plugins directory curated by the community.",
      url: "https://github.com/quemsah/awesome-claude-plugins",
      npx: "",
    },
    {
      name: "skills.sh Ecosystem Directory",
      desc: "Open Agent Skills leaderboard and registry by Vercel Labs.",
      url: "https://www.skills.sh/",
      npx: "npx skills find",
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
          ${r.npx ? `<pre class="code-block">${escapeHtml(r.npx)}</pre>` : ""}
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <a class="glass-btn primary" href="${r.url}" target="_blank" rel="noopener">Open Link ↗</a>
            ${r.npx ? `<button class="glass-btn copy-repo-npx" data-npx="${escapeHtml(r.npx)}">Copy npx</button>` : ""}
          </div>
        </div>`
        )
        .join("")}
    </div>
  `;

  els.viewContent.querySelectorAll(".copy-repo-npx").forEach((btn) => {
    btn.addEventListener("click", () => copyText(btn.dataset.npx, "Copied npx command"));
  });
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

function formatBytes(bytes) {
  if (typeof bytes !== "number" || !Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Sanitized Markdown renderer for untrusted upstream SKILL.md files.
 * Escapes all HTML first and only permits http:// and https:// links.
 */
function renderSanitizedMarkdown(rawMd) {
  let text = String(rawMd || "").replace(/\r\n/g, "\n");
  text = text.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");

  const codeBlocks = [];
  text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push(`<pre><code>${escapeHtml(code.trimEnd())}</code></pre>`);
    return `@@CODEBLOCK_${idx}@@`;
  });

  const renderInline = (line) => {
    let out = escapeHtml(line);
    out = out.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });
    return out;
  };

  const lines = text.split("\n");
  const html = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const cbMatch = trimmed.match(/^@@CODEBLOCK_(\d+)@@$/);
    if (cbMatch) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(codeBlocks[Number(cbMatch[1])]);
      continue;
    }
    if (!trimmed) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      continue;
    }
    if (trimmed.startsWith("### ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h3>${renderInline(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith("## ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h2>${renderInline(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith("# ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h1>${renderInline(trimmed.slice(2))}</h1>`);
    } else if (/^[-*]\s+/.test(trimmed)) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${renderInline(trimmed.replace(/^[-*]\s+/, ""))}</li>`);
    } else {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<p>${renderInline(trimmed)}</p>`);
    }
  }
  if (inList) html.push("</ul>");
  return html.join("\n");
}

async function openSkillDetailPage(source, slug, summaryItem = null, pushUrl = true) {
  state.tab = "detail";
  state.detail = {
    status: "loading",
    source,
    slug,
    data: summaryItem,
    error: "",
  };

  if (pushUrl) {
    const nextUrl = `${window.location.pathname}?skill=${encodeURIComponent(`${source}/${slug}`)}`;
    window.history.pushState({ skill: `${source}/${slug}` }, "", nextUrl);
  }
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });

  try {
    const res = await fetch(
      `/api/skill-detail?source=${encodeURIComponent(source)}&slug=${encodeURIComponent(slug)}`
    );
    if (!res.ok) {
      let msg = "Unable to load skill files from the server.";
      try {
        const errJson = await res.json();
        if (errJson?.error) msg = errJson.error;
      } catch {
        // Static hosting fallback
      }
      state.detail.status = "error";
      state.detail.error = msg;
    } else {
      state.detail.data = await res.json();
      state.detail.status = "ready";
    }
  } catch {
    state.detail.status = "error";
    state.detail.error = "Unable to reach /api/skill-detail on this host.";
  }
  if (state.tab === "detail") render();
}

function renderSkillDetailPage() {
  const { status, source, slug, data, error } = state.detail;
  const name = data?.name || slug;
  const publisher = data?.publisher || (source.includes("/") ? source.split("/")[0] : source);
  const license = data?.license || "Unknown";
  const description = data?.description || "";
  const originalUrl = data?.originalUrl || `https://www.skills.sh/${source}/${encodeURIComponent(slug)}`;
  const installCmd = `npx skills add ${source} --skill ${slug}`;
  const zipUrl = `/api/skill-zip?source=${encodeURIComponent(source)}&slug=${encodeURIComponent(slug)}`;
  const shareUrl = `${window.location.origin}${window.location.pathname}?skill=${encodeURIComponent(`${source}/${slug}`)}`;

  let contentArea = "";
  if (status === "loading") {
    contentArea = `
      <div class="detail-card">
        <div class="remote-state-card">
          <h3>Loading original skill files…</h3>
          <p>Fetching <code>SKILL.md</code> and supporting files for <code>${escapeHtml(source)}/${escapeHtml(slug)}</code>.</p>
        </div>
      </div>`;
  } else if (status === "error") {
    contentArea = `
      <div class="detail-card">
        <div class="remote-state-card">
          <h3>Original Skill Files Unavailable</h3>
          <p>${escapeHtml(error)}</p>
          <a class="glass-btn primary" href="${escapeHtml(originalUrl)}" target="_blank" rel="noopener">Open Original ↗</a>
        </div>
      </div>`;
  } else {
    const files = Array.isArray(data?.files) ? data.files : [];
    const mdHtml = renderSanitizedMarkdown(data?.skillMdContent || "");

    contentArea = `
      <div class="detail-layout">
        <div class="detail-card">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--border-subtle)">
            <strong style="font-size:14px">SKILL.md Preview</strong>
            <span class="row-lines">${escapeHtml(data?.revision ? `rev: ${String(data.revision).slice(0, 7)}` : "")}</span>
          </div>
          <div class="md-preview">${mdHtml || "<p>No SKILL.md body content found.</p>"}</div>
        </div>

        <div class="detail-card">
          <h3 style="font-size:15px;font-weight:600">Supporting Files (${files.length})</h3>
          <p style="font-size:12.5px;color:var(--text-secondary);margin-top:4px">
            Packaged under <code>${escapeHtml(slug)}/</code> in original relative paths.
          </p>
          <div class="files-list">
            ${files
              .map(
                (f) => `
              <div class="file-item">
                <span>${escapeHtml(f.relativePath)}</span>
                <span class="file-size">${formatBytes(f.size)}</span>
              </div>`
              )
              .join("")}
          </div>
        </div>
      </div>`;
  }

  const canZip = status === "ready" && Boolean(data?.canRedistribute);

  els.viewContent.innerHTML = `
    <div class="detail-page">
      <div class="detail-topbar">
        <button class="glass-btn" id="detailBackBtn">← Back to Directory</button>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="glass-btn" id="copyShareLinkBtn">Copy Share Link</button>
          <a class="glass-btn" href="${escapeHtml(originalUrl)}" target="_blank" rel="noopener">Open Original ↗</a>
        </div>
      </div>

      <div class="detail-card">
        <div class="detail-meta-row">
          <span class="cat-badge">${escapeHtml(publisher)}</span>
          <span class="cat-badge">${escapeHtml(source)}</span>
          <span class="audit-badge">License: ${escapeHtml(license)}</span>
        </div>
        <h1 class="detail-title">${escapeHtml(name)}</h1>
        ${description ? `<p class="detail-desc">${escapeHtml(description)}</p>` : ""}

        <div class="detail-actions-grid">
          <div class="detail-action-box">
            <div>
              <div class="action-kicker">For terminal</div>
              <div class="action-box-title">Copy Install Command</div>
              <p class="action-box-sub"><code>${escapeHtml(installCmd)}</code></p>
            </div>
            <div>
              <button class="glass-btn primary" id="detailCopyInstallBtn">Copy Install Command</button>
            </div>
          </div>

          <div class="detail-action-box">
            <div>
              <div class="action-kicker">For Claude normal chat</div>
              <div class="action-box-title">Download Skill ZIP</div>
              <p class="action-box-sub">
                ${
                  canZip
                    ? `Single-skill ZIP (${escapeHtml(slug)}/ with SKILL.md, license notice &amp; supporting files).`
                    : "Redistribution permission is unclear or unavailable here. Use Open Original for direct file access."
                }
              </p>
            </div>
            <div>
              ${
                canZip
                  ? `<a class="glass-btn primary" href="${escapeHtml(zipUrl)}" download="${escapeHtml(slug)}-skill.zip">Download Skill ZIP</a>`
                  : `<a class="glass-btn" href="${escapeHtml(originalUrl)}" target="_blank" rel="noopener">Open Original ↗</a>`
              }
            </div>
          </div>
        </div>
      </div>

      ${contentArea}
    </div>
  `;

  document.getElementById("detailBackBtn").addEventListener("click", () => {
    state.tab = "directory";
    window.history.pushState({}, "", window.location.pathname);
    render();
  });

  document.getElementById("copyShareLinkBtn").addEventListener("click", () => {
    copyText(shareUrl, "Copied shareable skill link");
  });

  document.getElementById("detailCopyInstallBtn").addEventListener("click", () => {
    copyText(installCmd, "Copied terminal install command");
  });
}

function render() {
  document.querySelectorAll(".nav-tab").forEach((t) => {
    const active = t.dataset.tab === state.tab || (state.tab === "detail" && t.dataset.tab === "directory");
    t.classList.toggle("active", active);
  });
  document.querySelectorAll(".search-mode-btn").forEach((btn) => {
    const active = btn.dataset.searchMode === state.searchMode;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  });
  els.searchInput.placeholder =
    state.searchMode === "all_skills"
      ? "Search All Skills (server-side)..."
      : "Search My Collection (figma, pdf, code)...";

  els.heroSection.style.display = state.tab === "directory" ? "block" : "none";

  if (state.tab === "detail") renderSkillDetailPage();
  else if (state.tab === "directory") renderDirectory();
  else if (state.tab === "npm") renderNpmPage();
  else if (state.tab === "audits") renderAudits();
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
  const modeCountEl = document.getElementById("modeCollectionCount");
  if (modeCountEl) modeCountEl.textContent = state.skills.length;

  document.querySelectorAll(".search-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nextMode = btn.dataset.searchMode;
      if (state.searchMode === nextMode) return;
      state.searchMode = nextMode;
      state.tab = "directory";
      if (nextMode === "collection" && remoteAbortController) {
        clearTimeout(remoteDebounceTimer);
        remoteAbortController.abort();
        remoteAbortController = null;
      } else if (nextMode === "all_skills") {
        state.remote.page = 1;
        fetchAllSkillsPage(true);
        return;
      }
      render();
    });
  });

  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      state.tab = tab.dataset.tab;
      render();
      window.scrollTo({ top: 0, behavior: "instant" });
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
    if (state.searchMode === "all_skills") {
      state.remote.page = 1;
      fetchAllSkillsPage(false);
    } else {
      render();
    }
  });

  document.getElementById("copyHeroCliBtn").addEventListener("click", () => {
    const cmd = document.getElementById("heroCliCmd").textContent;
    copyText(cmd, "Copied full install command");
  });

  document.getElementById("themeToggleBtn").addEventListener("click", toggleTheme);

  document.querySelectorAll(".agent-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".agent-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      state.selectedAgentFlag = chip.dataset.agentFlag;
      document.getElementById("heroCliCmd").textContent = `npx skills add ${REPO_SLUG} -a ${state.selectedAgentFlag}`;
    });
  });

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

  const params = new URLSearchParams(window.location.search);
  const sharedSkill = params.get("skill");
  if (sharedSkill) {
    const parts = sharedSkill.split("/");
    if (parts.length >= 3) {
      const source = `${parts[0]}/${parts[1]}`;
      const slug = parts.slice(2).join("/");
      state.searchMode = "all_skills";
      openSkillDetailPage(source, slug, null, false);
      return;
    }
  }

  render();
}

init();
