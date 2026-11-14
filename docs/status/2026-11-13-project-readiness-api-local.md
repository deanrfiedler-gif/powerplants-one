---
title: PJ-07 native readiness API implemented and verified locally
date: 2026-11-13
---

Codex completed the first authorised PJ-07 / BC-06 source-read increment on `codex/project-readiness-api`, based on main `bdcdd347fcb29c3806cd23d1e85be03f972b6628`. [Claim PR #948](https://github.com/deanrfiedler-gif/powerplants-one/pull/948) remains distinct from local implementation publication. The [native evidence contract](../contracts/project-delivery-readiness.md) covers `GET /api/v1/projects/{id}/readiness`: exact Project-bound Engineering, material demand and specialist evidence, current native authority, source owners/versions/hashes and bounded counts. It reports observed blockers/risks and missing/partial/unavailable evidence; full-project assessment and release authority are always false.

[Execution evidence](../testing/evidence/project-readiness/README.md): `npm run check` passed with 1,451 units and production build; five native DB cases plus the later Promise case passed unmocked; all six then-existing DB cases passed separately with the explicitly test-only quotation renderer; compiled HTTP and a real PostgreSQL restart/new-process read passed. Final lint/TypeScript and documentation checks are recorded there. Chrome was unavailable, so real-renderer and browser suites remain for CI. No migration, grant, seed, dependency or UI was added; existing native authority and all parent IDs are preserved.

The implementation was retained locally because the three-build limit still applies while the existing backend PRs have unfinished CI. This is no merge-ready, independent-review, Figma, operational or deployment acceptance. Dean owns merges. The next publication action is a current-main integration and push after a slot becomes available or Dean permits an exception; then full CI and one Claude review.

<!-- decision-index -->
[PJ-07 source-backed readiness API](../decisions/project-readiness-api.md) — Authorised backend scope; native evidence projection with explicit non-release boundary.
