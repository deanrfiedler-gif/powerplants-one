---
title: People register query-performance follow-up claimed
date: 2026-11-10
---

[CLAIMED by Codex] Dean authorised the next independent backend task in chat on 10 November 2026: the bounded People register follow-up in the [visibility-plan audit](../testing/evidence/visibility-plan-audit/README.md#proposed-follow-ups--no-fixes-implemented). Branch `codex/people-register-candidate-cost` starts from main `c248355e0`; no implementation is included in this claim.

My Work #887 is merged. B3 #883 and Projects register #889 are the two implemented open Codex builds; B4 #893 is claim-only and waits for B3. The third slot is available. No open pull request changes `src/shared/people-register.ts`. The shared audit chapter will receive a separate People section after the existing My Work section, preserving historical, Deals, My Work and pending Projects evidence.

Scope: only the People reader and directly necessary test helpers. Preserve person/company/site/organisation visibility, affiliations and their dates, notices, correction/history restrictions, fields, counts, options, filters, sorts and signed cursors. No frontend, other reader, migration, index, permission/grant, dependency, workflow, timeout or planner-setting changes. B3/B4 and Projects review work remain independent.

Proof planned: freeze the complete original reader before editing; test explicit identities and exclusions, populated notice/correction branches, decisive visibility cases and cursor boundaries against raw and public outputs. Reproduce native fixtures at volumes 30/45 without ANALYZE or planner changes, traverse every EXPLAIN node, and preserve the reported-visible-population denominator of 31/46 (bounds 310/460). The fixed query must pass and the frozen baseline fail the same bound. Loop, buffer and timing results remain separate.

Implementation, measured improvement, application checks and independent Claude review are not yet complete. No merge, deployment or production readiness is claimed.
