---
name: security-guidance
description: Provide practical secure-coding guidance covering OWASP Top 10, authentication, authorization, input validation, secrets management, and dependency hygiene. Use when writing or auditing security-sensitive code.
---

# Security Guidance

Prevent vulnerabilities by applying defense-in-depth at every layer.

## Checklist
- **Injection**: Use parameterized queries/ORMs for SQL; escape/sanitize untrusted HTML; avoid shell interpolation (`exec` over `shell=True`).
- **Auth & Access Control**: Enforce authorization on every server-side endpoint and object ID (prevent IDOR); use short-lived tokens and `HttpOnly; Secure; SameSite` cookies.
- **Secrets & Config**: Never commit API keys, tokens, or `.env` files; load secrets from environment/secret managers and redact them from logs.
- **SSRF & File Uploads**: Validate URLs against allowlists (block private/link-local IPs); check file MIME/size and store uploads outside web roots.
- **Dependencies**: Pin versions, audit regularly (`npm audit` / `pip-audit`), and minimize unnecessary packages.
