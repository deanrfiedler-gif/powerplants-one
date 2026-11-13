---
title: Claim evidence HTTP review finding corrected
date: 2026-11-13
---

[PR #932](https://github.com/deanrfiedler-gif/powerplants-one/pull/932) fixes Claude's sole finding D1: the HTTP proof now requires the `private` and `no-store` cache directives independently of their serialization order. All protected-byte, hash, PDF-size, CSP and access-refusal assertions remain. No application behavior changes. The C1 test fixes and current main are integrated; both connected claim-output assertions remain.

The [execution chapter](../testing/evidence/claim-finance-evidence/README.md#review-correction-and-real-renderer-verification--13-november-2026) separates Claude's completed real-renderer review at `4a11488e` from this correction's compiled HTTP and connected results. Only targeted D1 confirmation and current-head CI remain for this correction; C1's new test findings are handled separately. The existing ready state is preserved. Dean owns merges; nothing is merged or deployed.
