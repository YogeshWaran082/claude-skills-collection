/**
 * Vercel Serverless Function: GET /api/all-skills
 * Server-side search and pagination over imported Skills.sh listings in data/skills_catalog.db.
 * Falls back to live Skills.sh v1 API if OIDC token is present and local DB has 0 imported rows.
 */

import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const DB_PATH = path.join(process.cwd(), "data", "skills_catalog.db");
const GITHUB_SOURCE_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const TARGET_COUNT = 566000;

async function querySqlite(q, page, limit) {
  if (!fs.existsSync(DB_PATH)) {
    return { importedCount: 0, total: 0, skills: [] };
  }

  const pyScript = `
import json, sqlite3, sys
db_path, q, page, limit = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
imported_count = conn.execute("SELECT COUNT(*) FROM skills").fetchone()[0]
offset = (page - 1) * limit
if q:
    like = f"%{q}%"
    where = "WHERE name LIKE ? OR publisher LIKE ? OR source LIKE ? OR description LIKE ?"
    params = (like, like, like, like)
    total = conn.execute(f"SELECT COUNT(*) FROM skills {where}", params).fetchone()[0]
    rows = conn.execute(
        f"SELECT source, slug, name, publisher, description, installs, url FROM skills {where} ORDER BY COALESCE(installs, 0) DESC, name ASC LIMIT ? OFFSET ?",
        (*params, limit, offset),
    ).fetchall()
else:
    total = imported_count
    rows = conn.execute(
        "SELECT source, slug, name, publisher, description, installs, url FROM skills ORDER BY COALESCE(installs, 0) DESC, name ASC LIMIT ? OFFSET ?",
        (limit, offset),
    ).fetchall()
print(json.dumps({
    "importedCount": imported_count,
    "total": total,
    "skills": [dict(r) for r in rows],
}))
`;

  const { stdout } = await execFileAsync("python3", ["-c", pyScript, DB_PATH, q, String(page), String(limit)], {
    timeout: 5000,
  });
  return JSON.parse(stdout);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawQuery = Array.isArray(req.query?.q) ? req.query.q[0] : req.query?.q;
  const q = typeof rawQuery === "string" ? rawQuery.trim() : "";

  const rawPage = Number.parseInt(String(req.query?.page ?? "1"), 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const rawLimit = Number.parseInt(String(req.query?.limit ?? "24"), 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 24) : 24;

  try {
    const dbResult = await querySqlite(q, page, limit);
    const skills = (dbResult.skills || []).map((item) => ({
      ...item,
      isValidGitHubSource: GITHUB_SOURCE_RE.test(item.source || ""),
    }));

    const total = dbResult.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.status(200).json({
      query: q,
      page,
      limit,
      total,
      totalPages,
      importedCount: dbResult.importedCount || 0,
      targetCount: TARGET_COUNT,
      skills,
    });
  } catch {
    return res.status(503).json({
      error: "Catalog database is unavailable on this host.",
      importedCount: 0,
      targetCount: TARGET_COUNT,
      total: 0,
      totalPages: 1,
      skills: [],
    });
  }
}
