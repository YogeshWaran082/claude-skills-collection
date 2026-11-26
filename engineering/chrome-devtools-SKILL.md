---
name: chrome-devtools
description: Debug live web pages using Chrome DevTools workflows—DOM/CSS inspection, Console errors, Network waterfall/CORS/headers, Performance flamegraphs, and Lighthouse/Core Web Vitals. Use when diagnosing frontend or browser issues.
---

# Chrome DevTools Debugging

Diagnose layout, network, console, and performance issues systematically in Chrome DevTools.

## Diagnostic Workflow
1. **Console**: Check uncaught exceptions, React/framework hydration warnings, and CSP violations first.
2. **Network**: Filter by `Fetch/XHR`; inspect status codes, request/response payloads, CORS headers, caching (`Cache-Control`), and waterfall bottlenecks.
3. **Elements & Styles**: Inspect computed box model, flex/grid overlays, specificity overrides, and `z-index` stacking contexts.
4. **Performance & Core Web Vitals**: Profile LCP, INP, and CLS; spot long main-thread tasks (>50ms), layout shifts, and unoptimized images/bundles.
5. **Application**: Inspect `localStorage`, `sessionStorage`, cookies, and Service Worker cache state.
