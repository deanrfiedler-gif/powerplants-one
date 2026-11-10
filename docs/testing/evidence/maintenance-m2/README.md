# Maintenance M2 backend evidence

Scope: PPO-MAINTENANCE-TS02-DEC M-R3, following M1 and B4. [PR #904](https://github.com/deanrfiedler-gif/powerplants-one/pull/904). Synthetic local source delivery only; no merge, deployment or business acceptance.

The new source-local helper reads the current scope assessment after existing Finance authority. Project links take precedence. Covered plus an agreement reference yields a NonBillable default; missing/disputed coverage does not. Explicit Billable decisions require a reason. Existing B4 checks remain at submission, approval and begin processing. No schema, grant, dependency or UI change.

## Verification boundary

Cloud setup succeeded with Node 24.21.0, npm 11.19.0 and PostgreSQL 16.15. The explicit browser probe fails: `/opt/google/chrome/chrome` is absent. Commands that require documents therefore use the existing opt-in `project-claims-synthetic-renderer.mjs`, enabled only on `ppo_synthetic_test`. These are command/persistence proofs, not rendered PDF or browser evidence. Normal rendered suites remain for CI.

Tests cover native Covered references and all non-default coverage states, missing reference, protected-source refusal, native draft reassessment without rewriting historical coverage, project precedence/persisted reasons and original-operation replay. Existing B4 regressions cover changed links at all three boundaries, revised drafts and no-posting reconciliation. A policy unit case proves the reason requirement for Billable exceptions. These proofs do not execute a complete agreement-covered service attendance or TS-02 acceptance.

Initial new-suite run: six passed and one test expected the wrong validation error code (`ValidationFailed` instead of the existing `InvalidData`). The assertion was corrected; validation behavior was unchanged. Final results are recorded below after execution.
