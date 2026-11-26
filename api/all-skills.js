/**
 * Vercel Serverless Function: GET /api/all-skills
 * Pure Node.js (sql.js) server-side search and pagination over data/skills_catalog.db.
 */

import fs from "node:fs";
import path from "node:path";
import initSqlJs from "sql.js";

const DB_PATH = path.join(process.cwd(), "data", "skills_catalog.db");
const GITHUB_SOURCE_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const TARGET_COUNT = 566000;

let sqlPromise = null;
function getSql() {
  if (!sqlPromise) {
    sqlPromise = initSqlJs();
  }
  return sqlPromise;
}

async function querySqlite(q, page, limit) {
  if (!fs.existsSync(DB_PATH)) {
    return { importedCount: 0, total: 0, skills: [] };
  }

  const SQL = await getSql();
  const fileBuffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(fileBuffer);

  try {
    const countRes = db.exec("SELECT COUNT(*) FROM skills");
    const importedCount = countRes[0]?.values?.[0]?.[0] ?? 0;
    const offset = (page - 1) * limit;

    let total = importedCount;
    let rows = [];

    if (q) {
      const like = `%${q}%`;
      const totalStmt = db.prepare(
        "SELECT COUNT(*) AS cnt FROM skills WHERE name LIKE ? OR publisher LIKE ? OR source LIKE ? OR description LIKE ?"
      );
      totalStmt.bind([like, like, like, like]);
      if (totalStmt.step()) {
        total = totalStmt.getAsObject().cnt ?? 0;
      }
      totalStmt.free();

      const stmt = db.prepare(
        "SELECT source, slug, name, publisher, description, installs, url FROM skills WHERE name LIKE ? OR publisher LIKE ? OR source LIKE ? OR description LIKE ? ORDER BY COALESCE(installs, 0) DESC, name ASC LIMIT ? OFFSET ?"
      );
      stmt.bind([like, like, like, like, limit, offset]);
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
    } else {
      const stmt = db.prepare(
        "SELECT source, slug, name, publisher, description, installs, url FROM skills ORDER BY COALESCE(installs, 0) DESC, name ASC LIMIT ? OFFSET ?"
      );
      stmt.bind([limit, offset]);
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
    }

    return { importedCount, total, skills: rows };
  } finally {
    db.close();
  }
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
  } catch (err) {
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
