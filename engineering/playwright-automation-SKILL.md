---
name: playwright-automation
description: Write reliable Playwright end-to-end tests, browser automation scripts, visual screenshot checks, and trace debugging. Use when testing web apps, verifying user flows, or automating browser tasks.
---

# Playwright Browser Automation & E2E Testing

Write fast, flake-free Playwright tests using user-facing locators and web-first assertions.

## Best Practices
- **Resilient Locators**: Prefer `getByRole`, `getByLabel`, `getByPlaceholder`, and `getByText` (or `data-testid`) over brittle CSS/XPath selectors.
- **Auto-Waiting Assertions**: Use `await expect(locator).toBeVisible()` instead of arbitrary `page.waitForTimeout(...)`.
- **Isolation**: Each test starts with a clean `BrowserContext` / storage state; mock external third-party APIs when deterministic tests are needed.
- **Debugging**: Capture screenshots (`page.screenshot()`), traces (`trace: 'on-first-retry'`), and console/network errors on failure.
