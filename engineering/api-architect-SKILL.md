---
name: api-architect
description: Design clean, consistent REST or GraphQL APIs, including resource modeling, request/response schemas, validation, pagination, auth, and OpenAPI specs. Use when designing new endpoints or refactoring API contracts.
---

# API Architect

Design predictable, developer-friendly APIs that are easy to evolve without breaking clients.

## Design Standards
- **Resources & Naming**: Plural nouns (`/users`, `/orders/{id}/items`), kebab-case or snake_case consistently, standard HTTP verbs (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
- **Status Codes**: `200`/`201`/`204` for success; `400`/`422` for validation; `401`/`403` for auth; `404` for missing; `409` for conflicts; `429` for rate limits.
- **Consistent Error Envelope**:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Human-readable summary",
      "details": [{ "field": "email", "issue": "Invalid format" }],
      "request_id": "req_123"
    }
  }
  ```
- **Pagination & Filtering**: Cursor-based pagination for large/live datasets; explicit `limit`, `cursor`, `sort`, and filter params.
- **Idempotency & Versioning**: Support `Idempotency-Key` on critical `POST` mutations; version via URL prefix (`/v1/...`) or header when breaking changes are unavoidable.

## Output
Provide endpoint table, request/response JSON examples, error cases, and an OpenAPI 3.1 snippet when requested.
