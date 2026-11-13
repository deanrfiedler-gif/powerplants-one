---
title: PJ-07 source-backed readiness API claimed
date: 2026-11-13
---

Dean instructed “Proceed with that work” after the recommendation to implement the first PJ-07 backend increment: a permission-scoped readiness API with exact native evidence, responsible owners, explicit missing/stale/unavailable sources, and connected regression proof. Codex owns `codex/project-readiness-api`, cut from main `bdcdd347fcb29c3806cd23d1e85be03f972b6628`.

This initial claim starts with the source/authority contract. Expected paths: new `src/projects/readiness/` read/model files, `src/app/api/v1/projects/[id]/readiness/route.ts`, focused unit/database/HTTP proofs, the Projects contract and handover, backend delivery reconciliation, decision/status/evidence records. No migration, grant, dependency, UI, release command or external adapter is planned. Existing PRs #905, #932 and #945 retain their owners; the three-build limit applies before pushing another implementation.

The implementation scope is authorised by the current instruction. It does not accept the proposed Projects Figma design, recover the missing historical PJ-07 r02 source, or establish operational release rules. Source modules retain their release, stock, booking and financial authority. This fragment records a claim only, not delivered code or verification.
