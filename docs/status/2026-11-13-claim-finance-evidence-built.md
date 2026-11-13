---
title: Claim-specific Finance evidence implemented for review
date: 2026-11-13
---

Codex implemented [PR #932](https://github.com/deanrfiedler-gif/powerplants-one/pull/932), one level above [C1 #905](https://github.com/deanrfiedler-gif/powerplants-one/pull/905). ProjectClaim and AgreementCharge now use a fixed internal OUT-14 format through the existing Finance jobs, immutable private storage and scoped original downloads. Exact monetary entitlements, review/reconciliation/source evidence and original receipts are retained. Historical source recovery keeps current authority; template/policy and permission changes prevent release. No schema, seed, grant, new technology or legacy renderer bytes changed.

The [execution chapter](../testing/evidence/claim-finance-evidence/README.md) separates 1,455 passing unit tests and completed application build, five focused PostgreSQL cases, unmocked request guards and compiled HTTP, three existing WorkOrder regressions, the connected AUD 135,090 project/AUD 4,800 agreement/no-posting maintenance component, and actual PostgreSQL restart persistence. Renderer-dependent local checks explicitly use synthetic bytes; supported Chrome and real-PDF proof are unavailable locally. No full manual TS-01/TS-02 or visual acceptance is claimed.

C1 is integrated with current main at `af06b798df8d972b97359e04a6b73d9df639bcac` without changing application, migration or test bytes. Its earlier `f828ac3e` checks finished with 81 successes and one intentional manual-only skip; final integration CI and outstanding Claude confirmation remain separate gates. #932 remains a draft for its independent Claude review and real-renderer verification. Dean owns merges. No deployment or real ERP/customer action occurred.
