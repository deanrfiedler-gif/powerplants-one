# BP-03 I1 — Owned opportunity and qualification follow-up

**Revision:** r01 · **Date:** 6 September 2026 · **Owner:** Dean Fiedler · **Status:** In progress; not verified or merged.

Implementation issue [#39](https://github.com/deanrfiedler-gif/powerplants-one/issues/39) is linked to discovery parent [#9](https://github.com/deanrfiedler-gif/powerplants-one/issues/9), which remains open. [ADR-0015](../decisions/ADR-0015-crm-i1-owned-opportunities.md) records the bounded implementation choices. Actual final publication identities will be recorded externally on #39; this file does not claim its own future SHA.

Starting main was `ddc1a3cce769e011939e621d8d5f176542f48f8c`, tree `d6d374ec30c620276e402d6a15f5adbc4d25bf02`. [Discovery publication](https://github.com/deanrfiedler-gif/powerplants-one/issues/9#issuecomment-5557062585) was verified. P09 #36 / draft #37 remained active at `9931e3c4501e7aa4d44140066b882b8985ba2a61`; it is not counted as delivered. An independent local clone at that exact main/tree and `feature/crm-i1-owned-opportunities` preserve all unrelated worktrees. Migration 0010/ADR-0015 are reserved after P09 0009/ADR-0014; accepted ordering must be reconciled before merge.

The current implementation adds typed opportunity/config/event persistence, Internal Activity links, three scoped CRM capabilities, guarded create/qualify/next-action commands, current-permission receipts and online responsive screens. No completed implementation, runtime checks or business acceptance is claimed yet. Local Python foundation/prototype/naming checks passed before this in-progress handover; exact local runtime pins are unavailable (Node 24.19.0/npm 11.9.0 versus 24.20.0/11.19.0), so pinned disposable CI is the runtime evidence environment.

Remaining: actual database/HTTP/browser/restart/upgrade/reseed verification, visual inspection, current P09/main reconciliation, complete handover/traceability and I2 starter, review/check assessment, normal expected-head merge and actual merged-main verification. D-013/D-025/full AT-25 and account parity remain unresolved. No operational Pipedrive read expansion/mutation/import, integration, communication, Finance, hosting or access-setting change.

## First disposable CI disposition

Head `2da09aa2f2b5f5e5312a203315aa888e03f2ece0`, tree `3d018bb89e0e771259c5f59a1a25ea8aa1ad921c`: documentation run 34018514075 and CRM design run 34018514058 passed. Application run 34018514060 attempt 1 failed at TypeScript before database/HTTP/browser execution: six implicit-any callbacks resulted from the untyped opportunity context projection. Added an explicit Opportunity row and typed context projection; rerun pending. No runtime acceptance is claimed for this head.
