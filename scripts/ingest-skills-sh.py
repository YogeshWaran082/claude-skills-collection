#!/usr/bin/env python3
"""
Resumable Skills.sh ingestion script for Skill Lab 2.0.
Stores deduplicated listings in SQLite (data/skills_catalog.db) keyed by (source, slug).

Usage:
  VERCEL_OIDC_TOKEN=<token> python3 scripts/ingest-skills-sh.py --init-only
  VERCEL_OIDC_TOKEN=<token> python3 scripts/ingest-skills-sh.py --leaderboard --max-rows 100000
  VERCEL_OIDC_TOKEN=<token> python3 scripts/ingest-skills-sh.py --repos-file data/seed-repos.txt
"""

import argparse
import datetime
import json
import os
import sqlite3
import sys
import urllib.error
import urllib.parse
import urllib.request

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "skills_catalog.db")
API_BASE = "https://skills.sh/api/v1"


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS skills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,
            slug TEXT NOT NULL,
            name TEXT NOT NULL,
            publisher TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            installs INTEGER,
            url TEXT NOT NULL,
            imported_at TEXT NOT NULL,
            UNIQUE(source, slug)
        );

        CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);
        CREATE INDEX IF NOT EXISTS idx_skills_publisher ON skills(publisher);
        CREATE INDEX IF NOT EXISTS idx_skills_source ON skills(source);
        CREATE INDEX IF NOT EXISTS idx_skills_installs ON skills(installs DESC);

        CREATE TABLE IF NOT EXISTS ingest_checkpoints (
            feed_key TEXT PRIMARY KEY,
            offset_pos INTEGER NOT NULL DEFAULT 0,
            cursor TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'in_progress',
            imported_count INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL
        );
        """
    )
    conn.commit()


def fetch_json(url: str, token: str) -> dict:
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "User-Agent": "SkillLab-2.0-Ingestor/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def upsert_skills(conn: sqlite3.Connection, items: list[dict]) -> int:
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    rows = []
    for item in items:
        source = str(item.get("source") or item.get("repo") or item.get("repository") or "").strip()
        slug = str(item.get("slug") or item.get("skillId") or item.get("id") or item.get("name") or "").strip()
        if not source or not slug:
            continue
        name = str(item.get("name") or slug).strip()
        publisher = str(item.get("publisher") or (source.split("/")[0] if "/" in source else source)).strip()
        description = str(item.get("description") or "").strip()
        raw_installs = item.get("installs") if item.get("installs") is not None else item.get("installCount")
        installs = int(raw_installs) if isinstance(raw_installs, (int, float)) else None
        url = str(item.get("url") or f"https://www.skills.sh/{source}/{urllib.parse.quote(slug)}")
        rows.append((source, slug, name, publisher, description, installs, url, now))

    if not rows:
        return 0

    conn.executemany(
        """
        INSERT INTO skills (source, slug, name, publisher, description, installs, url, imported_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(source, slug) DO UPDATE SET
            name = excluded.name,
            publisher = excluded.publisher,
            description = CASE WHEN excluded.description != '' THEN excluded.description ELSE skills.description END,
            installs = COALESCE(excluded.installs, skills.installs),
            url = excluded.url,
            imported_at = excluded.imported_at
        """,
        rows,
    )
    conn.commit()
    return len(rows)


def update_checkpoint(conn: sqlite3.Connection, feed_key: str, offset_pos: int, status: str, count: int) -> None:
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    conn.execute(
        """
        INSERT INTO ingest_checkpoints (feed_key, offset_pos, status, imported_count, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(feed_key) DO UPDATE SET
            offset_pos = excluded.offset_pos,
            status = excluded.status,
            imported_count = excluded.imported_count,
            updated_at = excluded.updated_at
        """,
        (feed_key, offset_pos, status, count, now),
    )
    conn.commit()


def ingest_leaderboard(conn: sqlite3.Connection, token: str, max_rows: int = 100000, batch_size: int = 100) -> None:
    feed_key = "leaderboard:global"
    row = conn.execute("SELECT offset_pos, status, imported_count FROM ingest_checkpoints WHERE feed_key = ?", (feed_key,)).fetchone()
    offset = row[0] if row else 0
    total_imported = row[2] if row else 0

    while offset < max_rows:
        url = f"{API_BASE}/skills?limit={batch_size}&offset={offset}"
        try:
            payload = fetch_json(url, token)
        except urllib.error.HTTPError as e:
            if e.code in (401, 403):
                update_checkpoint(conn, feed_key, offset, "auth_required", total_imported)
                print(f"Authentication required ({e.code}) at offset {offset}. Provide a valid VERCEL_OIDC_TOKEN.", file=sys.stderr)
                sys.exit(2)
            raise

        items = payload.get("skills") or payload.get("results") or (payload if isinstance(payload, list) else [])
        if not items:
            update_checkpoint(conn, feed_key, offset, "completed", total_imported)
            break

        inserted = upsert_skills(conn, items)
        offset += len(items)
        total_imported += inserted
        update_checkpoint(conn, feed_key, offset, "in_progress", total_imported)
        print(f"[leaderboard] offset={offset} total_processed={total_imported}")

        if len(items) < batch_size:
            update_checkpoint(conn, feed_key, offset, "completed", total_imported)
            break


def ingest_repos(conn: sqlite3.Connection, token: str, repos_file: str) -> None:
    with open(repos_file, "r", encoding="utf-8") as fh:
        repos = [line.strip() for line in fh if line.strip() and not line.strip().startswith("#")]

    for repo in repos:
        feed_key = f"repo:{repo}"
        row = conn.execute("SELECT status FROM ingest_checkpoints WHERE feed_key = ?", (feed_key,)).fetchone()
        if row and row[0] == "completed":
            print(f"[repo] skipping already-completed {repo}")
            continue

        encoded = urllib.parse.quote(repo, safe="/")
        url = f"{API_BASE}/repos/{encoded}/skills"
        try:
            payload = fetch_json(url, token)
        except urllib.error.HTTPError as e:
            if e.code in (401, 403):
                update_checkpoint(conn, feed_key, 0, "auth_required", 0)
                print(f"Authentication required ({e.code}) for {repo}. Provide a valid VERCEL_OIDC_TOKEN.", file=sys.stderr)
                sys.exit(2)
            print(f"[repo] {repo} returned HTTP {e.code}, skipping", file=sys.stderr)
            continue

        items = payload.get("skills") or payload.get("results") or (payload if isinstance(payload, list) else [])
        inserted = upsert_skills(conn, items)
        update_checkpoint(conn, feed_key, inserted, "completed", inserted)
        print(f"[repo] {repo}: synced {inserted} skills")


def main() -> None:
    parser = argparse.ArgumentParser(description="Resumable Skills.sh catalog ingestor")
    parser.add_argument("--init-only", action="store_true", help="Initialize SQLite database schema and exit")
    parser.add_argument("--leaderboard", action="store_true", help="Ingest global leaderboard (up to 100,000 rows)")
    parser.add_argument("--max-rows", type=int, default=100000)
    parser.add_argument("--repos-file", type=str, help="Path to newline-separated owner/repo list")
    args = parser.parse_args()

    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    init_db(conn)

    if args.init_only:
        count = conn.execute("SELECT COUNT(*) FROM skills").fetchone()[0]
        print(f"Initialized {DB_PATH}. Unique skills imported: {count}")
        return

    token = os.environ.get("VERCEL_OIDC_TOKEN", "").strip()
    if not token:
        count = conn.execute("SELECT COUNT(*) FROM skills").fetchone()[0]
        print(
            f"VERCEL_OIDC_TOKEN is not set. Database initialized at {DB_PATH} (unique skills: {count}).\n"
            "Set VERCEL_OIDC_TOKEN to run live ingestion from https://skills.sh/api/v1/.",
            file=sys.stderr,
        )
        sys.exit(2)

    if args.leaderboard:
        ingest_leaderboard(conn, token, max_rows=args.max_rows)
    if args.repos_file:
        ingest_repos(conn, token, args.repos_file)

    total = conn.execute("SELECT COUNT(*) FROM skills").fetchone()[0]
    print(f"Done. Total unique skills in catalog: {total}")


if __name__ == "__main__":
    main()
