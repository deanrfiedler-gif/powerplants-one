---
title: Migration test ripple decision proposed
date: 2026-10-24
---

The [independent migration test expectations paper](../decisions/migration-test-expectations.md) is **Proposed: owner decision required** in [draft PR #692](https://github.com/deanrfiedler-gif/powerplants-one/pull/692), owned by Codex for Dean.

At main 79bef1d32f42cd2dcdbf04ce0f30a4374199db2e, the requested 117 search returns 80 lines in 65 test files. Paginated PR history gives 72 test files for #673 and 67 for #689, with 66 shared. The paper supplies commands, fixed source heads, classification tables and a bounded 12-landing-PR cost sample. It recommends D: an independently maintained current migration history and consistency check, retaining original ledgers and deliberate historical case additions; seed/grant consolidation is deferred.

Only the paper, this fragment and a document-register entry change. No tests, scripts, database, application, workflows, AGENTS.md or shared landing pages change. A later conversion requires Dean's decision, a quiet window without open migration PRs, full equivalence evidence and application CI. Claude review remains pending; no adoption, implementation, business acceptance or production readiness is claimed. Validation and head-specific review disposition are recorded in the draft PR.

<!-- decision-index -->

- [Independent migration test expectations](../decisions/migration-test-expectations.md): proposed independent current history and preserved upgrade evidence, with staged quiet-window conversion; owner decision required.
