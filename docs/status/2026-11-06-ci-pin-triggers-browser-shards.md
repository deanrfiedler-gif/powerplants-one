---
title: Contacts pin trigger coverage and retained browser shards
date: 2026-11-06
---

[PR #864](https://github.com/deanrfiedler-gif/powerplants-one/pull/864) adds the eleven missing Contacts source-pin trigger paths plus the two external font-comparison sources and distributes both retained browser projects over two native Playwright shards each. The [CI lane design record](../decisions/ci-retained-suite-isolation.md#contacts-pin-triggers-and-retained-browser-shards--6-november-2026) records the two gaps, linked #863 evidence, main run 42118249392 timings, lane/condition/check-name inventories and the full pinned-source trigger audit. This is an agent decision under the standing order. Dean merges this workflow PR.

The four focused facilities/CRM/restart steps remain once in desktop shard 1; every shard retains its warm-up dependency, isolated disposable database, serial execution, diagnostics and uniquely named artifacts. Existing check names and all deadlines remain unchanged. Native discovery partitions each browser project's 810 tests as 407 + 403; repeated warm-ups are counted separately. CI passed/skipped equivalence is still required, and final head/run evidence is recorded on the PR rather than inferred from discovery.

The audit reports uncovered pinned sources in the Access Review, Document library, Output distribution, Template management and Sales-to-Delivery Handover workflows; those workflows are outside this PR's authorised paths and remain unchanged. Branch protection could not be read (REST Forbidden; connector HTTP 403), so its current required set is unknown. The planner pin itself remains unchanged here and its refresh belongs to #863.

Local foundation, prototype, naming, status, Studio, migration numbering, 44 documentation unit tests and actionlint 1.7.7 passed. Parsed workflow preservation, native selection partitioning and aggregate refusal checks passed. `npm run check` passed with network access: 1,417 unit tests and the production build. The first restricted run’s ten failing unit files reproduced on clean main with socket/subprocess EPERM and passed on the full network-enabled rerun. Contacts still reports `src/scheduling/planner.ts: 2ceec2496318… -> af9030fd7e6c…`; this reproduces on clean main and is pre-existing on main, fixed by #863.

Cloud setup succeeded with PostgreSQL ready and the browser unavailable. Local browser suites are **not run here; left to GitHub CI**. Local validation, ready-head CI and Claude's one independent review are separate gates; the PR completion comment records their actual outcomes. No merge, deployment, application/test change or owner acceptance is claimed.

<!-- decision-index -->
[Retained Application assurance isolation](../decisions/ci-retained-suite-isolation.md#contacts-pin-triggers-and-retained-browser-shards--6-november-2026) records the agent decision, trigger audit and browser shard layout.
