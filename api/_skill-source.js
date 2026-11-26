/**
 * Shared server-side helper for Phase 2 skill detail & ZIP packaging.
 * - Validates GitHub owner/repo & slug
 * - Caches repository tree + license by source revision SHA
 * - Enforces safe relative paths, file count cap, and total byte cap
 * - Builds standard ZIP archives with Node built-in zlib (no external deps)
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

export const GITHUB_SOURCE_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
export const SLUG_RE = /^[A-Za-z0-9_.-]+$/;
export const MAX_FILES = 30;
export const MAX_TOTAL_BYTES = 5 * 1024 * 1024; // 5 MB

const PERMISSIVE_LICENSES = new Set([
  "MIT",
  "APACHE-2.0",
  "BSD-2-CLAUSE",
  "BSD-3-CLAUSE",
  "ISC",
  "MPL-2.0",
  "CC0-1.0",
  "UNLICENSE",
]);

// In-memory cache keyed by `${source}@${revision}`
const revisionCache = new Map();

export function isPermissiveLicense(spdx) {
  if (!spdx || typeof spdx !== "string") return false;
  return PERMISSIVE_LICENSES.has(spdx.trim().toUpperCase());
}

export function isSafeRelativePath(relPath) {
  if (typeof relPath !== "string" || !relPath || relPath.includes("\0")) return false;
  if (relPath.startsWith("/") || relPath.startsWith("\\") || relPath.includes("\\")) return false;
  const segments = relPath.split("/");
  return segments.every((seg) => seg && seg !== "." && seg !== "..");
}

export function extractFrontmatterMeta(markdown) {
  const match = String(markdown || "").match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const fm = match[1];
  const nameMatch = fm.match(/^name:\s*["']?([^\n"']+)["']?/m);
  const descMatch = fm.match(/^description:\s*["']?([^\n"']+)["']?/m);
  const licMatch = fm.match(/^license:\s*["']?([^\n"']+)["']?/m);
  return {
    name: nameMatch ? nameMatch[1].trim() : "",
    description: descMatch ? descMatch[1].trim() : "",
    license: licMatch ? licMatch[1].trim() : "",
  };
}

function githubHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "SkillLab-2.0",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function fetchGitHubJson(url) {
  const res = await fetch(url, { headers: githubHeaders(), signal: AbortSignal.timeout(10000) });
  if (!res.ok) {
    const err = new Error(`GitHub API ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function fetchGitHubBuffer(url) {
  const res = await fetch(url, { headers: { "User-Agent": "SkillLab-2.0" }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) {
    const err = new Error(`Raw fetch ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return Buffer.from(await res.arrayBuffer());
}

function readLocalRepoSkill(slug) {
  const root = process.cwd();
  const categories = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory());
  for (const dir of categories) {
    const candidate = path.join(root, dir.name, `${slug}-SKILL.md`);
    if (fs.existsSync(candidate)) {
      const content = fs.readFileSync(candidate);
      const fm = extractFrontmatterMeta(content.toString("utf8"));
      return {
        revision: "local-main",
        license: fm.license || "MIT",
        licenseFile: null,
        skillMdPath: `${dir.name}/${slug}-SKILL.md`,
        skillMdContent: content.toString("utf8"),
        files: [
          {
            relativePath: "SKILL.md",
            size: content.length,
            buffer: content,
          },
        ],
      };
    }
  }
  return null;
}

export async function loadSkillPackage(source, slug, { includeFileBuffers = false } = {}) {
  if (!GITHUB_SOURCE_RE.test(source) || !SLUG_RE.test(slug) || source.includes("..") || slug.includes("..")) {
    const err = new Error("Invalid source repository or skill slug.");
    err.status = 400;
    throw err;
  }

  let repoMeta;
  let treeData;
  let licenseSpdx = "";
  let licenseFileEntry = null;

  try {
    repoMeta = await fetchGitHubJson(`https://api.github.com/repos/${source}`);
    const branch = repoMeta.default_branch || "main";
    licenseSpdx = repoMeta.license?.spdx_id && repoMeta.license.spdx_id !== "NOASSERTION"
      ? repoMeta.license.spdx_id
      : "";

    const branchInfo = await fetchGitHubJson(`https://api.github.com/repos/${source}/branches/${encodeURIComponent(branch)}`);
    const revisionSha = branchInfo?.commit?.sha || branch;
    const cacheKey = `${source}@${revisionSha}`;

    if (revisionCache.has(cacheKey)) {
      treeData = revisionCache.get(cacheKey);
    } else {
      treeData = await fetchGitHubJson(`https://api.github.com/repos/${source}/git/trees/${revisionSha}?recursive=1`);
      revisionCache.set(cacheKey, treeData);
    }

    const blobs = (treeData.tree || []).filter((n) => n.type === "blob" && isSafeRelativePath(n.path));
    licenseFileEntry = blobs.find((b) => /^(LICENSE|LICENSE\.md|LICENSE\.txt|COPYING|NOTICE)$/i.test(b.path)) || null;

    // Locate SKILL.md for this slug:
    // 1) <slug>/SKILL.md or **/<slug>/SKILL.md
    // 2) **/<slug>-SKILL.md
    // 3) Root SKILL.md if single-skill repo matching slug
    let skillMdNode =
      blobs.find((b) => b.path === `${slug}/SKILL.md`) ||
      blobs.find((b) => b.path.endsWith(`/${slug}/SKILL.md`)) ||
      blobs.find((b) => b.path === `${slug}-SKILL.md` || b.path.endsWith(`/${slug}-SKILL.md`)) ||
      blobs.find((b) => b.path === "SKILL.md");

    if (!skillMdNode) {
      const err = new Error(`SKILL.md not found for "${slug}" in ${source}.`);
      err.status = 404;
      throw err;
    }

    const baseDir = skillMdNode.path.includes("/") ? skillMdNode.path.slice(0, skillMdNode.path.lastIndexOf("/") + 1) : "";
    const isNamedFile = skillMdNode.path.endsWith(`${slug}-SKILL.md`);

    let candidateNodes = isNamedFile
      ? [skillMdNode]
      : blobs.filter((b) => (baseDir ? b.path.startsWith(baseDir) : !b.path.includes("/")));

    if (candidateNodes.length > MAX_FILES) {
      candidateNodes = candidateNodes.slice(0, MAX_FILES);
    }

    const skillMdBuf = await fetchGitHubBuffer(
      `https://raw.githubusercontent.com/${source}/${revisionSha}/${skillMdNode.path}`
    );
    const skillMdText = skillMdBuf.toString("utf8");
    const fm = extractFrontmatterMeta(skillMdText);
    const effectiveLicense = licenseSpdx || fm.license || "";

    const files = [];
    let totalBytes = 0;

    for (const node of candidateNodes) {
      let rel = baseDir ? node.path.slice(baseDir.length) : node.path;
      if (isNamedFile && node.path === skillMdNode.path) {
        rel = "SKILL.md";
      }
      if (!isSafeRelativePath(rel)) continue;

      const estimatedSize = node.size || 0;
      if (totalBytes + estimatedSize > MAX_TOTAL_BYTES) {
        const err = new Error("Skill package exceeds maximum allowed size (5 MB).");
        err.status = 413;
        throw err;
      }

      if (includeFileBuffers) {
        const buf = node.path === skillMdNode.path
          ? skillMdBuf
          : await fetchGitHubBuffer(`https://raw.githubusercontent.com/${source}/${revisionSha}/${node.path}`);
        totalBytes += buf.length;
        if (totalBytes > MAX_TOTAL_BYTES) {
          const err = new Error("Skill package exceeds maximum allowed size (5 MB).");
          err.status = 413;
          throw err;
        }
        files.push({ relativePath: rel, size: buf.length, buffer: buf });
      } else {
        totalBytes += estimatedSize;
        files.push({ relativePath: rel, size: estimatedSize });
      }
    }

    // Include root LICENSE / NOTICE if not already in skill folder
    if (includeFileBuffers && licenseFileEntry && !files.some((f) => f.relativePath === licenseFileEntry.path)) {
      const licBuf = await fetchGitHubBuffer(
        `https://raw.githubusercontent.com/${source}/${revisionSha}/${licenseFileEntry.path}`
      );
      if (totalBytes + licBuf.length <= MAX_TOTAL_BYTES && files.length < MAX_FILES) {
        totalBytes += licBuf.length;
        files.push({ relativePath: licenseFileEntry.path, size: licBuf.length, buffer: licBuf });
      }
    }

    return {
      source,
      slug,
      revision: revisionSha,
      name: fm.name || slug,
      publisher: source.split("/")[0],
      description: fm.description || "",
      license: effectiveLicense || "Unknown",
      canRedistribute: isPermissiveLicense(effectiveLicense),
      originalUrl: `https://www.skills.sh/${source}/${encodeURIComponent(slug)}`,
      githubUrl: `https://github.com/${source}/blob/${revisionSha}/${skillMdNode.path}`,
      skillMdContent: skillMdText,
      files,
      totalBytes,
    };
  } catch (err) {
    // Local fallback when inspecting own repository offline/rate-limited
    if (source === "YogeshWaran082/claude-skills-collection") {
      const local = readLocalRepoSkill(slug);
      if (local) {
        const fm = extractFrontmatterMeta(local.skillMdContent);
        return {
          source,
          slug,
          revision: local.revision,
          name: fm.name || slug,
          publisher: "YogeshWaran082",
          description: fm.description || "",
          license: local.license || "MIT",
          canRedistribute: isPermissiveLicense(local.license || "MIT"),
          originalUrl: `https://github.com/${source}/blob/main/${local.skillMdPath}`,
          githubUrl: `https://github.com/${source}/blob/main/${local.skillMdPath}`,
          skillMdContent: local.skillMdContent,
          files: local.files,
          totalBytes: local.files.reduce((acc, f) => acc + f.size, 0),
        };
      }
    }
    throw err;
  }
}

// CRC32 table for standard ZIP generation
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Builds a valid ZIP archive buffer with top-level folder `<slug>/`.
 * entries: Array<{ name: string, buffer: Buffer }>
 */
export function buildZipBuffer(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, "utf8");
    const rawBuf = entry.buffer;
    const compressed = zlib.deflateRawSync(rawBuf);
    const crc = crc32(rawBuf);

    // Local file header (30 bytes + name)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0x0800, 6); // UTF-8 flag
    localHeader.writeUInt16LE(8, 8); // deflate
    localHeader.writeUInt16LE(0, 10); // mod time
    localHeader.writeUInt16LE(0x5421, 12); // mod date
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(rawBuf.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuf, compressed);

    // Central directory header (46 bytes + name)
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0x5421, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(rawBuf.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const centralSize = centralParts.reduce((acc, b) => acc + b.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, eocd]);
}
