/**
 * Vercel Serverless Function: GET /api/skill-detail?source=<owner/repo>&slug=<slug>
 * Fetches original SKILL.md and supporting file list on demand, cached by source revision.
 */

import { loadSkillPackage } from "./_skill-source.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const source = String(Array.isArray(req.query?.source) ? req.query.source[0] : req.query?.source || "").trim();
  const slug = String(Array.isArray(req.query?.slug) ? req.query.slug[0] : req.query?.slug || "").trim();

  if (!source || !slug) {
    return res.status(400).json({ error: "Missing required query parameters: source and slug." });
  }

  try {
    const pkg = await loadSkillPackage(source, slug, { includeFileBuffers: false });
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({
      name: pkg.name,
      publisher: pkg.publisher,
      description: pkg.description,
      source: pkg.source,
      slug: pkg.slug,
      revision: pkg.revision,
      license: pkg.license,
      canRedistribute: pkg.canRedistribute,
      originalUrl: pkg.originalUrl,
      githubUrl: pkg.githubUrl,
      skillMdContent: pkg.skillMdContent,
      files: pkg.files.map((f) => ({ relativePath: f.relativePath, size: f.size })),
      totalBytes: pkg.totalBytes,
    });
  } catch (err) {
    const status = err?.status || 502;
    return res.status(status).json({ error: err?.message || "Unable to load skill details." });
  }
}
