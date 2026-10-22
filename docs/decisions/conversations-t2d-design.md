---
document_id: PPO-CONV-T2D-DESIGN
title: Conversations T2d local Claude adapter
date: 2026-10-22
owner: Dean Fiedler
status: Implemented for review; Codex working for Dean; independent review and acceptance pending
versioning: git
---

# Conversations T2d local Claude adapter

Dean authorised this bounded contribution on 22 October 2026: implement T2d independently from current main, with the official SDK and mocked transport proof, leaving one draft PR for review. No real credential inspection, live provider request, T2e evaluation, deployment, migration, capability or grant is authorised.

Governing records: [T2 scope](conversations-t2-scope.md) T2-1–T2-12/W1–W9; [T2b design](conversations-t2b-design.md) P1–P4; [T2b contract](../contracts/conversations-t2b.md); [assistant direction](ppo-assistant-direction.md) A1/A2; [specification](../blueprints/ppo-assistant-specification.md) §§6/8; [dependency gates](ADR-0056-dependency-update-and-audit-gates.md); [cross-model review](cross-model-review.md).

## Verified starting point

Dedicated branch `codex/conversations-t2d-claude`, cut from `origin/main` `002af00e4e19e9aa0d12f83d36199bebe6572a1b`. T2b #642 and integration #659 are merged. Migration 0110 and seed 110 are reused. T2c #660 remains draft at `79092a4d245c4817ebec3968a0ea8fcedc1d215b`; no review submission or comment was visible at claim time. Its code and branch are untouched. T2d depends on T2b; T2e depends on T2c and T2d.

Open PRs #660, #662 and #663 were inspected; no T2d claim, issue, branch or worktree was found. Nursery #662 claims ADR-0060; T2d will use ADR-0061. At claim time #663 was unmerged. It subsequently merged, and T2d integrated main `ab2142d12cce947483c8425c16e640e37f06e90e`: source fragments/entries are retained and generated status/index views stay under ignored `tmp/documentation/`. Shared landing pages are unchanged in this PR.

## Test-first implementation sequence

1. Write ADR-0061 before installing the exact SDK. Verify official model, structured-output, pricing, transport, error, usage and logging sources. Compare the thin SDK adapter with raw HTTP.
2. Add failing unit tests using a dummy credential and injected transport through the actual SDK. Block provider networking in every automated proof. Cover guards before credential access, explicit selection, projection, schema, errors/refusals, usage, aborts, retries, logging and request bounds.
3. Implement the adapter and narrow factory/configuration/pricing/runner integration. Retain existing authority, reservation and worker paths. No endpoint or production mock switch.
4. Add persisted synthetic service → queued turn → worker/SDK mocked transport → validated answer/citations → settled ledger proof, including replay/concurrency/reload and privacy regressions.
5. Validate serially with an owned PostgreSQL 16 cluster, current checks and full CI. Record failed attempts and current-main comparisons. Update operator guidance, contract, test evidence, document register entries and status fragment.
6. Fetch and merge current main before every push; never rebase or force-push. Keep draft, no auto-merge. Independent different-model review is required before Dean merges; self-inspection does not satisfy it.

Expected files: new Claude adapter and tests under `src/assistant/adapters/` and `tests/`; narrow `model.ts`, `config.ts`, `pricing.ts`, `turns.ts` and factory changes as proved necessary; exact SDK package/lockfile; ADR, this record, contract/operator/evidence documentation, document-register CSV entry and status fragment with current generated indexes. No UI redesign is expected.

## Evidence boundaries

Mocked SDK transport proves request/response handling. Persisted integration proves PPO's real service, runner and ledger lifecycle. Neither proves model quality or a live API request. T2e, business acceptance, visual review and production readiness remain separate.

## Implementation checkpoint

[ADR-0061](ADR-0061-local-claude-adapter.md) was written before the real exact-version SDK installation. The bounded adapter, pricing and provider preflight hook are implemented; the existing service/runner/ledger proof uses the actual SDK with injected mocked transport. See the [evidence record](../testing/evidence/conversations-t2d/README.md) for checks, failed attempts and remaining review gates. The later T2c check found Claude’s review at 79092a4d and one Low R8 enumerable-digest finding. T2c’s separate correction at 6ed76b12 uses a server-held HMAC key and awaits independent follow-up. The inspected correction changes no adapter interface; this contribution does not edit #660 or claim its review.
