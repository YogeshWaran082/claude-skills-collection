---
name: xlsx
description: Create, analyze, and format Excel (.xlsx) workbooks with dynamic formulas, clean number formatting, conditional formatting, and summary tabs. Use when building spreadsheets, models, or data exports.
---

# Excel (.xlsx) Spreadsheet Specialist

Build accurate, auditable, formula-driven spreadsheets.

## Standards
- **Formulas Over Hardcoding**: Always use Excel formulas (`SUM`, `SUMIFS`, `XLOOKUP`, `INDEX/MATCH`, `IFERROR`) for calculated cells—never hardcode derived totals.
- **Formatting**: Explicit number formats (`$#,##0`, `0.0%`, `YYYY-MM-DD`), bold/shaded headers, frozen top row, and auto-adjusted column widths with padding.
- **Structure**: Separate **Inputs/Assumptions**, **Data**, and **Summary/Dashboard** tabs; clearly color-code hardcoded inputs vs. formulas.
- **Verification**: Check for `#REF!`, `#DIV/0!`, `#VALUE!`, or `#NAME?` errors after building.
