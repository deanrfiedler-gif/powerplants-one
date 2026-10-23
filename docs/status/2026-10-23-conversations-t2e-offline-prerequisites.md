---
title: Conversations T2e offline prerequisites in draft
date: 2026-10-23
---

Dean authorised offline prerequisites in a dedicated worktree and draft PR, using mocked transport only, with no credentials or live calls and no merge. Codex owns [PR #679](https://github.com/deanrfiedler-gif/powerplants-one/pull/679). T2c #660 and T2d #664 are merged; that is repository delivery, not funded evaluation or business acceptance.

The [T2e plan](../decisions/conversations-t2e-evaluation.md) defines a proposed nine-call calibration, 108-turn main matrix, scoring, US$5 aggregate/US$1.65 calibration caps and explicit owner gates. Draft code binds approved evidence/message IDs and execution commit, checks run caps against the existing ledger across all months, retains Unknown, gates main on accepted calibration, adds safe usage measurements and W5 comparison model configurations, and suppresses changed-source or stopped evaluation answers. SDK/Sonnet pins and accepted T2c UI remain unchanged. No schema, dependency, grant, capability or endpoint is added.

[Offline evidence](../testing/evidence/conversations-t2e/README.md) separates simulated, actual-SDK mocked transport and persisted integration. Live quality/latency/overhead remains unmeasured. Different-model review is required for the calculation/security controls and is pending; the PR stays draft and unmerged. Fixture instances, exact execution revision, cost, billing/credit/backstops, synthetic-only region/retention and private key delivery need later confirmation. No credentials inspected and no live provider calls made.

<!-- decision-index -->
[T2e prerequisites and evaluation proposal](../decisions/conversations-t2e-evaluation.md) (PPO-CONV-T2E-EVALUATION) records the bounded plan and outstanding gates; it grants no live-run authority.
