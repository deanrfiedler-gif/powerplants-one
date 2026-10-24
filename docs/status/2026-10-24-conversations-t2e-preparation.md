---
title: Conversations T2e synthetic case preparation
date: 2026-10-24
---

Dean authorised the remaining offline T2e test preparation in a dedicated worktree and draft PR. Codex owns branch `codex/conversations-t2e-preparation`, based on current main after #679. The claim covers a reproducible synthetic case builder, catalogue and instance validation, review inventory and focused offline proofs. Shared edits are limited to the [evaluation plan](../decisions/conversations-t2e-evaluation.md), [operator chapter](../delivery/conversations-t2d-local-adapter.md), [contract](../contracts/conversations-t2b.md) and [evidence chapter](../testing/evidence/conversations-t2e/README.md).

[Draft PR #686](https://github.com/deanrfiedler-gif/powerplants-one/pull/686) now contains preparation, read-only export and verification tooling. The full 117-instance persisted proof passed at `670e32fb`, including gold/source and excluded-sentinel checks, per-model request fitting, read-only/reopen proof, tamper/source-drift rejection and a preserved corrected export. Local unit checks passed 2/2; that head's documentation, development-register and merged-tree/typecheck CI passed. Earlier setup/fixture failures and local timezone-query timeouts remain recorded in the evidence chapter; no existing guard was relaxed.

The final review package is proposed synthetic material. Human gold/rubric review, exact execution binding and all live-run gates remain open. No credentials inspected, live provider calls, paid evaluation, worker execution, merge or deployment. No production schema, grant/seed, capability, dependency, accounting, model pin or UI change. The isolated test-only participant access fixture is documented separately from production permissions.
