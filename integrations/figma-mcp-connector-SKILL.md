---
name: figma-mcp-connector
description: Connect to Figma via MCP to inspect frames, extract design tokens (colors, typography, spacing, radii), download assets, and translate designs into pixel-perfect React/HTML/CSS code. Use when working directly with Figma URLs or MCP.
---

# Figma MCP Connector & Design-to-Code

Bridge live Figma files and production frontend code using Figma MCP tools.

## Workflow
1. **Fetch Node & Context**: Read the target Figma file/node ID via MCP (`get_figma_data` / `get_design_context`) and capture a reference screenshot if available.
2. **Extract Design Tokens**: Pull exact hex/RGBA colors, font families, sizes, weights, line-heights, spacing, border radii, and shadows into CSS variables or Tailwind theme tokens.
3. **Map Components**: Reuse existing codebase components before creating new ones; preserve responsive auto-layout (`flex` / `grid`, `gap`, `padding`) rather than absolute positioning.
4. **Verify Visual Parity**: Compare rendered browser output against the Figma frame at desktop and mobile breakpoints and fix any spacing, font, or alignment drift.
