---
title: Customer 360 workspace read batching
date: 2026-11-05
---

[PR #863](https://github.com/deanrfiedler-gif/powerplants-one/pull/863) batches the Customer 360 native readers and reuses exact scoped capability checks within one request. Native authority, first-100 candidate windows, DTO ordering, error semantics and the final root recheck are retained. The implementation is a Codex decision under the standing order; no merge or deployment is performed.

The [Customer 360 delivery chapter](../delivery/cs-native-completion-handover.md#customer-360-read-batching--5-november-2026) describes the design. The [execution record](../testing/evidence/customer-360-read/README.md) links the frozen per-row oracle, synthetic multi-principal equivalence proof, diagnostics cap test and pending measurements/checks. Setup reports PostgreSQL ready and the browser unavailable. Browser suites are **not run here; left to GitHub CI**. Full validation, ready-head CI and Claude’s one review remain pending.
