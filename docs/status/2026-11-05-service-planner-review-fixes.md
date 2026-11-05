---
title: Service planner review findings and main integration
date: 2026-11-05
---

[PR #808](https://github.com/deanrfiedler-gif/powerplants-one/pull/808) addresses the seven findings in [Claude's completed review](https://github.com/deanrfiedler-gif/powerplants-one/pull/808#issuecomment-6653519724). Only confirmation of those findings is requested; no second full review or PR merge.

The demo journey follows D2/D4's **Unassigned demand → To plan** rename and uses the tray controls on desktop and phone. F13 reads and asserts its layout probe before any Scheduling menu click. D5's site-readiness warning appears only when preparation applies and either proposed instant changes; native P4 authority stays on the server. The historical loading-assertion authorisation is attributed to [Claude's rule-5 decision](https://github.com/deanrfiedler-gif/powerplants-one/pull/808#issuecomment-6649906346).

Claude's finding-6 decision under the standing order limits **On hold** and **Needs attention** dispatch holds to unstarted Confirmed visits. A Proposed visit remains a hatched proposal even when its stored `dispatch_hold` is true. No booking, confirmation or dispatch rule changes. The weekly read still evaluates the native dispatch gate per eligible visit; the contract and [evidence](../testing/evidence/service-planner-build/README.md) record this measured cost as a known limit. Verbatim reasons can name crew members; structured recipient records remain omitted.

Merge-only commit `9b1ae0fcb8625db131e3e5403f43d4063e6c3921` has parents `7c0e5f195343decbc5af56551cd26258e52f7689` and `9c956b1b93c2cfed9e3aa1237927b537f8dc3d88`. The merge was clean and both stable patch IDs are `91f31d4f92a75dea0b062a43e976c333fb5b319a`. Guides: main's count 367 + 0. Register: main's count 393 + 0. Every unrelated entry retains main's bytes; no whitespace-only PR entry edits were carried.

The [build evidence](../testing/evidence/service-planner-build/README.md) and PR completion comment distinguish local checks, service limits and new-head CI. The demo workflow did not run on reviewed head `7c0e5f19` because no changed path matched its filter. Editing the demo test now matches that filter. PL-01 remains a tier 1 journey awaiting its ADR-0067 stage 3b redraw; functional proof does not grant visual or owner acceptance.

The first review-fix head (`83daf1df`) exposed a browser-fixture omission: positive D5 cases selected a legacy policy-v1 visit without SITE_READINESS. Their browser read projections now explicitly supply applicable preparation, preserving every positive assertion and all four widths; the null-preparation case remains separate. This is a Codex fixture correction under the standing order, with no persistent seed, policy, booking or grant change. The final completion comment records the replacement head’s CI results.
