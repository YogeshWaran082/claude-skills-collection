/**
 * Vercel Serverless Function: GET /api/skill-zip?source=<owner/repo>&slug=<slug>
 * Generates a single-skill ZIP archive for Claude normal chat when license permits redistribution.
 */

import { buildZipBuffer, isSafeRelativePath, loadSkillPackage } from "./_skill-source.js";

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
    const pkg = await loadSkillPackage(source, slug, { includeFileBuffers: true });
    if (!pkg.canRedistribute) {
      return res.status(403).json({
        error: "Redistribution permission is unclear or restricted for this license. Use Open Original instead.",
        license: pkg.license,
      });
    }

    const entries = [];
    let hasLicenseFile = false;

    for (const file of pkg.files) {
      if (!isSafeRelativePath(file.relativePath)) continue;
      if (/^(LICENSE|LICENSE\.md|LICENSE\.txt|COPYING|NOTICE)$/i.test(file.relativePath)) {
        hasLicenseFile = true;
      }
      entries.push({
        name: `${pkg.slug}/${file.relativePath}`,
        buffer: file.buffer,
      });
    }

    if (!hasLicenseFile) {
      const notice = [
        `Skill: ${pkg.name}`,
        `Source: https://github.com/${pkg.source}`,
        `Revision: ${pkg.revision}`,
        `Detected License: ${pkg.license}`,
        `Original URL: ${pkg.originalUrl}`,
      ].join("\n") + "\n";
      entries.push({
        name: `${pkg.slug}/LICENSE-NOTICE.txt`,
        buffer: Buffer.from(notice, "utf8"),
      });
    }

    const zipBuffer = buildZipBuffer(entries);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${pkg.slug}-skill.zip"`);
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).send(zipBuffer);
  } catch (err) {
    const status = err?.status || 502;
    return res.status(status).json({ error: err?.message || "Unable to generate skill ZIP." });
  }
}
