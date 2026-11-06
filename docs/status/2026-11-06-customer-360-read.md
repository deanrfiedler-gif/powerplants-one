---
title: Customer 360 workspace read batching
date: 2026-11-06
---

[PR #863](https://github.com/deanrfiedler-gif/powerplants-one/pull/863) batches the Customer 360 native readers and reuses exact scoped capability checks within one request. Native authority, first-100 candidate windows, DTO ordering, error semantics and the final root recheck are retained. The implementation is a Codex decision under the standing order; no PR merge or deployment is performed.

The representative compiled workspace read fell from **1,627 to 85 statements**, with wall time **2,108.193 → 979.687 ms**. Summed PostgreSQL duration was **881.969 → 1,052.922 ms**. A larger fixture exercising candidate and revision limits fell from **5,530 to 96 statements**, with wall time **10,204.571 → 4,591.567 ms** and summed database duration **4,685.485 → 6,240.492 ms**. These are single warmed samples on unchanged synthetic business data with both servers and PostgreSQL pinned to one CPU. Summed query durations can overlap; they are not database CPU measurements.

The [Customer 360 delivery chapter](../delivery/cs-native-completion-handover.md#customer-360-read-batching--6-november-2026) describes the design. The [execution record](../testing/evidence/customer-360-read/README.md) retains the raw-DTO and JSON equality proof, final source hashes, same-data measurements and individual main-comparison results. The final full check passed all 1,420 unit tests and the production build; both equality tests and 14 existing Customer 360 database cases passed. The selected 205-case regression run passed 159 cases; all 46 failed cases also failed on clean main. Two additional aftercare rendering failures also reproduced on main.

Setup reports PostgreSQL ready and the browser unavailable. Local browser suites are **not run here; left to GitHub CI**. Ready-head CI and Claude’s one independent review are separate evidence; consult the PR handover for their current results.
