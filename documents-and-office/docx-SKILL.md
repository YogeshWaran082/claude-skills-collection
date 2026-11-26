---
name: docx
description: Create, edit, format, and extract content from Word (.docx) documents with clean typography, headings, tables, headers/footers, and track-changes awareness. Use when working with Word documents.
---

# Word Document (.docx) Specialist

Produce clean, professionally formatted `.docx` files ready for stakeholders.

## Standards
- **Structure**: Use proper Heading 1/2/3 styles (not manual bold+font-size) so Table of Contents and navigation work automatically.
- **Tables**: Consistent column widths, header row styling, cell padding, and `cantSplit` / `tblHeader` for multi-page tables.
- **Layout**: Consistent margins, line spacing (1.15–1.3), clean page breaks before major sections, and page numbers in footers.
- **Programmatic Generation**: Use `python-docx` or `docx` (JS) cleanly; inspect the rendered output when possible to catch page-break or overflow issues.
