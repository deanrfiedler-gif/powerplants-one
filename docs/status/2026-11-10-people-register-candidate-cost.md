---
title: People register affiliation query fence
date: 2026-11-10
---

[PR #897](https://github.com/deanrfiedler-gif/powerplants-one/pull/897), owned by Codex on `codex/people-register-candidate-cost`, implements the next bounded backend follow-up Dean authorised in chat. The [audit chapter](../testing/evidence/visibility-plan-audit/README.md#people-register-affiliation-fence--10-november-2026) and [measurement record](../testing/evidence/visibility-plan-audit/2026-11-10-people-register-candidate-cost.json) retain the proof. The complete original People reader was frozen at `c248355e0b570bcf0a027000a123b7790a27f194`; imported builders remain unchanged.

At claim time, My Work #887 was merged, B3 #883 and Projects #889 occupied two implemented build slots, and B4 #893 was claim-only. This task claimed the third slot before implementation. B3 subsequently merged as `ceaa98c45`; integration and final checks are in progress. The shared audit addition follows My Work, preserving all earlier evidence; coordination with #889 is recorded on that PR.

Only `src/shared/people-register.ts` changes production code: materialise the existing relationship/permitted-person/organisation joins and affiliation date conditions before the unchanged permission predicates. Composite rows preserve the original aliases without regex rewriting. Person/company/site visibility, counts, fields, notices, history, options, filters, sorts and signed cursors stay unchanged. No frontend, other reader, migration, index, grant, dependency, workflow, timeout or planner-setting change is included.

Initial paired native fixtures at 30/45 report visible totals 31/46 and bounds 310/460. Maximum loops fall **576 → 35** and **1,182 → 50**; shared hits **5,118 → 2,323** and **9,849 → 4,083**; warm execution observations **10.902 → 4.787 ms** and **11.614 → 8.380 ms**. All recursive fixed-plan nodes pass; both frozen-reader plans fail. These are separate loop, buffer and timing observations, not latency distributions or production-load acceptance. Final measurements will be refreshed after current-main integration.

The new four semantic tests compare raw/public outputs to the frozen reader, with explicit ID/count/filter/sort/cursor ledgers and real permission exclusions. Only independent `observed_at` timestamps are excluded from equality; each is checked against database clock samples and its exact public projection. Current/expired/future affiliations, latest notices, correction history, multi-company and site-only restrictions, optional links and parent-deletion refusal are covered. Constraints remain enabled.

Validation is in progress. Browser tooling is unavailable in cloud setup, and `npm run browser:check` confirms missing Chrome. Local browser suites are not run and remain for CI. Independent Claude review and final-head full CI are required. This work does not take over B3/B4, Projects or My Work; no merge, deployment or production readiness is claimed.
