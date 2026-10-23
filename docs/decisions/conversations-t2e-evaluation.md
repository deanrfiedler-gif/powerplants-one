---
document_id: PPO-CONV-T2E-EVALUATION
title: Conversations T2e evaluation prerequisites and plan
date: 2026-10-23
owner: Dean Fiedler
status: Offline prerequisites authorised; draft implementation; no live run or cost approved
versioning: git
---

# Conversations T2e evaluation prerequisites and plan

Dean authorised the offline prerequisites on 23 October 2026: "Proceed with the offline prerequisites for T2e in a dedicated worktree and draft PR. Use mocked transport only; do not inspect credentials or make live API calls. Leave the PR unmerged for review."

Codex owns this contribution, based on main d3ccc0b79f8182fb1cd1498196f4aa2564818c0a. T2c #660 and T2d #664 are merged. The [T2 scope](conversations-t2-scope.md), [T2b contract](../contracts/conversations-t2b.md), [ADR-0062](ADR-0062-local-claude-adapter.md) and accepted A1/A2 remain governing. All existing parent IDs remain unchanged.

## Claimed offline scope

- A bounded evaluation manifest and aggregate reservation-first cap using the existing ledger and immutable audit evidence; no new service or UI endpoint.
- Safe usage and fitting measurements, with no raw request, response, error or credential logging.
- Model-specific mocked SDK proofs for the accepted W5 Sonnet, Haiku and Opus comparison, without changing the SDK pin or introducing fallback.
- Synthetic fixture/oracle definitions, deterministic negative proofs and a staged costed evaluation plan.
- Explicit disposition of refusal-contract and source-freshness gaps, preserving accepted T2c UI decisions.

Expected paths: src/assistant/, tests/unit/assistant*, tests/database/assistant*, tests/helpers/assistant*, this record, the existing T2b contract and T2d operator chapter, a new T2e evidence chapter, document-register entry CSV and status fragment. No protected landing page, dependency, workflow, UI, capability or grant change is claimed. If a schema change proves necessary, reserve its number before writing it and declare it on the draft PR first.

## Authority boundary

The proposed T2E-P1 live plan has nine calibration turns and 108 evaluation turns (12 cases × three repeats × three models), a proposed US$5 aggregate cap and US$1.65 calibration sub-cap. These are planning values, not spending permission. Fixtures, execution commit, billing owner, available credit, remaining PPO budget, provider backstops, synthetic-only region/retention acceptance and private credential delivery require later confirmation. No approval manifest will be issued by this offline contribution.

Keep Carl off by default, six calls / 48,000 input / 8,000 inclusive output tokens / 60 seconds per turn, the US$30 UTC-month ceiling, local-synthetic / loopback / synthetic identity / non-production guards, credit-only use and no fallback. Use human message → queued turn → existing document worker/runner → validated persisted answer/citations → ledger lifecycle.

## Review and evidence

Different-model review is required before merge for new calculation/security controls. No independent review is claimed. The draft PR remains unmerged for Dean's review. Simulated, actual-SDK mocked transport, persisted integration and live results are distinct evidence classes. No live evaluation has occurred here.
