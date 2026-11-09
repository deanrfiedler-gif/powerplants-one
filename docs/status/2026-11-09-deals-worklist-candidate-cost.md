---
title: Deals worklist candidate visibility fences
date: 2026-11-09
---

[Draft PR #880](https://github.com/deanrfiedler-gif/powerplants-one/pull/880) fences the Deals worklist's cheap joins, opportunity visibility and next-action visibility before projecting action-owner names, history and edit rights. Unavailable actions remain null without removing their deals. The matching row shape, stamp and cursor behaviour are preserved against a frozen main reader.

The [audit follow-up evidence](../testing/evidence/visibility-plan-audit/README.md#deals-candidate-fences--9-november-2026) records 111 passing equivalence tests and the discriminating never-analysed plan proof at 30/45 native candidates. Maximum loops fall from 1,110/2,340 to 30/45, giving 1.500× growth; every node meets the 10× bound. Shared hits and single-run timings are recorded separately. No planner setting, ANALYZE, migration, index, grant, capability, dependency or timeout changes are introduced.

Cloud setup reports PostgreSQL ready and browser tooling unavailable. Browser suites remain for GitHub CI. Claude's one review of the draft head and full-suite results on the ready head remain outstanding; this records code and synthetic proof, not business acceptance, production readiness or a merge.
