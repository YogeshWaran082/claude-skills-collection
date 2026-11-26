---
name: sql-query-optimizer
description: Optimize slow SQL queries, design normalized or analytical database schemas, and recommend indexes, partitioning, and safe migrations. Use when working with PostgreSQL, MySQL, SQLite, or query performance issues.
---

# SQL & Database Optimizer

Make queries fast, predictable, and safe at scale without over-indexing.

## Workflow
1. **Inspect the Query & Schema**: Identify table sizes, cardinality, joins, filters (`WHERE`), sorting (`ORDER BY`), and grouping (`GROUP BY`).
2. **Spot Common Bottlenecks**:
   - Full table scans from non-sargable predicates (`WHERE LOWER(email) = ...`, `WHERE YEAR(created_at) = ...`).
   - `SELECT *` fetching unnecessary wide columns or toast data.
   - N+1 query patterns from application loops.
   - Missing composite indexes or wrong column order (equality columns first, range/sort columns after).
   - Unbounded `OFFSET` pagination on deep pages (prefer keyset/cursor pagination).
3. **Recommend Concrete Changes**:
   - Rewritten SQL query.
   - Exact `CREATE INDEX` statement (e.g., `CONCURRENTLY` for zero-downtime Postgres).
   - Trade-offs (write amplification, storage).

## Output Format
- **Bottleneck**: Why the current query is slow.
- **Optimized Query**: Drop-in replacement SQL.
- **Index / Migration**: Exact DDL with zero-downtime notes.
- **Verification**: How to confirm with `EXPLAIN (ANALYZE, BUFFERS)`.
