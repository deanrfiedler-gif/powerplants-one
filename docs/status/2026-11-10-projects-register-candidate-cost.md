---
title: Projects register query-performance follow-up claimed
date: 2026-11-10
---

Codex claims the bounded Projects register follow-up from the [visibility plan audit](../testing/evidence/visibility-plan-audit/README.md) on `codex/projects-register-candidate-cost`, cut from main `446a76c524dee5f798b68c4b8e30248ea2b8fd92`. Dean authorised this scope in chat. This is a claim-only draft: application implementation has not started.

At the initial live check, all three Codex build slots remained occupied by [B2 #881](https://github.com/deanrfiedler-gif/powerplants-one/pull/881), [B3 #883](https://github.com/deanrfiedler-gif/powerplants-one/pull/883) and [My Work #887](https://github.com/deanrfiedler-gif/powerplants-one/pull/887). B2 has Claude's no-defects review; B3 has unresolved findings; #887 is still draft. This session does not take over their branches or reviews. The next step is read-only investigation, disposable synthetic baseline reproduction at volumes 30 and 45 without ANALYZE or planner changes, and a concrete implementation/proof handover. Implementation waits for a build slot.

Expected implementation paths are `src/projects/register.ts`, `tests/database/projects-register-equivalence.test.ts`, `tests/database/projects-register-candidate-plan.test.ts`, `tests/helpers/projects-register-main.ts`, `tests/helpers/projects-register-plan.ts`, the existing audit chapter, its dated Projects measurement JSON and this fragment. The audit chapter overlaps #887 and must be sequenced with its owner, preserving its evidence. No helper outside those paths is currently proposed for editing; expand the claim before changing one.

The complete original reader will be frozen before edits, with the exact baseline recorded and import relocation verified. Any changed SQL builder must also be frozen so the oracle cannot reach edited code. Proof must compare raw rows and public outputs, assert explicit identities/counts/exclusions and cursor boundaries, and retain the audit's reported-visible-population denominator (bounds 300 and 450). The cheap-join fence is a hypothesis to measure, not an accepted implementation.

No application change, performance improvement, independent review, business acceptance, merge, deployment or production readiness is claimed.
