---
title: Conversations T2d local Claude adapter
date: 2026-10-22
---

[T2d draft #664](https://github.com/deanrfiedler-gif/powerplants-one/pull/664), owned by Codex working for Dean, adds the local server Claude adapter behind the existing assistant worker and budget lifecycle. Official SDK 1.1.0 and Sonnet 5.5's fixed snapshot are pinned under [ADR-0062](../decisions/ADR-0062-local-claude-adapter.md). Carl remains off by default; selection is explicit, transport is restricted, SDK retries/logging/telemetry are off, and no fallback occurs. No migration/grant/capability or T2c UI work is included.

The [evidence](../testing/evidence/conversations-t2d/README.md) records real persisted service/worker/ledger integration using the actual SDK with mocked transport, including replay and concurrent-worker protection. The exact-head validation ledger and required CI results are recorded on the draft PR; the evidence source distinguishes completed mocked proof from subsequent full-suite execution. No real key was inspected and no live provider request was made. T2e, independent different-model review, Dean's acceptance and production readiness remain separate. The lockfile change can invalidate DK-06 managed publication fingerprints; normal republication remains separately controlled.

<!-- decision-index -->
[Local Claude adapter](../decisions/ADR-0062-local-claude-adapter.md) (ADR-0062) and [T2d plan](../decisions/conversations-t2d-design.md) (PPO-CONV-T2D-DESIGN): exact official SDK/model, guarded transport, usage/error mapping and test-first mocked integration; no paid evaluation or acceptance claim.
