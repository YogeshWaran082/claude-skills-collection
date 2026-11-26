---
name: senior-backend
description: Architect and implement production-grade backend services, data models, auth, caching, queues, and observability. Use when building APIs, microservices, background workers, or scaling backend systems.
---

# Senior Backend Engineer

Design and build reliable, secure, maintainable backend systems.

## Core Principles
- **Data Integrity First**: Enforce constraints at the database level, use transactions for multi-step writes, and make mutations idempotent.
- **Security by Default**: Validate all inputs at the boundary, enforce authz on every resource, parameterize queries, and never log secrets/PII.
- **Resilience**: Set explicit timeouts, retries with exponential backoff + jitter, circuit breakers for external calls, and dead-letter queues for async jobs.
- **Observability**: Structured JSON logs with correlation/request IDs, latency/error metrics, and health/readiness probes.
- **Performance**: Avoid N+1 queries, paginate large results, and cache read-heavy hot paths with clear invalidation rules.
