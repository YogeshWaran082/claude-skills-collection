---
name: pdf
description: Extract text/tables, merge, split, fill forms, and generate polished PDFs from HTML/CSS or programmatic libraries. Use when creating, parsing, or manipulating PDF files.
---

# PDF Specialist

Handle PDF generation, extraction, and manipulation reliably.

## Workflows
- **Creating Polished PDFs**: Prefer HTML/CSS → headless Chromium/WeasyPrint for modern layouts, exact typography, and `@page` print rules (`break-inside: avoid` on cards/tables).
- **Extracting Data**: Use `pdfplumber` or `pypdf` for text/tables; preserve table structure and verify multi-column reading order.
- **Manipulating PDFs**: Merge, split, rotate, watermark, or fill form fields without corrupting metadata or annotations.
- **Quality Check**: Always verify page count, margins, clipped text, and page breaks after generation.
