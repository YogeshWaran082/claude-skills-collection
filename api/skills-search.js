/**
 * Vercel Serverless Function: GET /api/skills-search
 * Proxies live skill discovery queries to https://skills.sh/api/v1/skills/search
 * authenticated with the Vercel OIDC token (never exposed to client or logs).
 */

const SKILLS_SH_SEARCH_URL = "https://skills.sh/api/v1/skills/search";
const GITHUB_SOURCE_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

function normalizeSkill(item) {
  const slug = String(item?.slug || item?.skillId || item?.id || item?.name || "").trim();
  const name = String(item?.name || slug || "Unnamed Skill").trim();
  const source = String(item?.source || item?.repo || item?.repository || "").trim();
  const rawInstalls = item?.installs ?? item?.installCount ?? item?.downloads ?? null;
  const installs = typeof rawInstalls === "number" && Number.isFinite(rawInstalls) ? rawInstalls : null;
  const isValidGitHubSource = GITHUB_SOURCE_RE.test(source);
  const directUrl =
    typeof item?.url === "string" && item.url.startsWith("https://")
      ? item.url
      : isValidGitHubSource && slug
        ? `https://www.skills.sh/${source}/${encodeURIComponent(slug)}`
        : `https://www.skills.sh/?q=${encodeURIComponent(name)}`;

  return {
    name,
    slug,
    source: source || "unknown",
    isValidGitHubSource,
    installs,
    description: typeof item?.description === "string" ? item.description.trim() : "",
    url: directUrl,
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawQuery = Array.isArray(req.query?.q) ? req.query.q[0] : req.query?.q;
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";
  if (query.length < 2) {
    return res.status(400).json({ error: "Query must be at least 2 characters." });
  }

  const rawLimit = Number.parseInt(String(req.query?.limit ?? "24"), 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 24) : 24;

  const headerToken = req.headers?.["x-vercel-oidc-token"];
  const oidcToken =
    (typeof headerToken === "string" ? headerToken.trim() : "") ||
    (typeof process.env.VERCEL_OIDC_TOKEN === "string" ? process.env.VERCEL_OIDC_TOKEN.trim() : "");

  if (!oidcToken) {
    return res.status(503).json({
      error: "Skills.sh live search is unavailable (Vercel OIDC token not configured).",
      code: "oidc_unavailable",
    });
  }

  const upstreamUrl = new URL(SKILLS_SH_SEARCH_URL);
  upstreamUrl.searchParams.set("q", query);
  upstreamUrl.searchParams.set("limit", String(limit));

  try {
    const upstreamRes = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${oidcToken}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!upstreamRes.ok) {
      const status = upstreamRes.status === 401 || upstreamRes.status === 403 ? 503 : 502;
      return res.status(status).json({
        error: "Skills.sh live search is temporarily unavailable.",
        code: "upstream_error",
      });
    }

    const payload = await upstreamRes.json();
    const rawItems = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.skills)
        ? payload.skills
        : Array.isArray(payload?.results)
          ? payload.results
          : [];

    const skills = rawItems.slice(0, limit).map(normalizeSkill);
    const verifiedTotal =
      typeof payload?.total === "number" && Number.isFinite(payload.total) ? payload.total : null;

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({
      query,
      limit,
      total: verifiedTotal,
      skills,
    });
  } catch {
    return res.status(502).json({
      error: "Unable to reach Skills.sh live search right now.",
      code: "upstream_unreachable",
    });
  }
}
