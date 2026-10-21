---
title: Chrome 156 compatibility repair for PR #630
date: 2026-10-21
---

Dean authorised repairing the shared browser-version mismatch that blocked PR #630 before its application checks. The [browser maintenance record](../decisions/browser-runtime-maintenance.md) extends the existing ADR-0022 range to Chrome 156 from `156.0.8078.47`, the exact stable package observed in CI. Earlier major floors, earlier-build rejection and future-major rejection remain. Boundary regression cases accompany the change; actual Chrome 156 rendering and browser proof belong to the final commit's CI results on the PR.

No package dependency, installer, launch flag, permission, migration or deployment changes. The Discovery register remains pending owner visual review; passing runtime assurance is separate from business acceptance.
