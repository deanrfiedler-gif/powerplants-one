---
title: Access & readiness CS-06 build investigation
date: 2026-10-20
---

Dean requested the native implementation of the accepted Access & readiness design at `/sites/[id]/readiness`. This session claims the page on `codex/cs06-access-readiness`, in its dedicated worktree from current main `971ac350`. The [accepted decision](../decisions/access-readiness-figma-design.md), live Figma notes and File index agree on CS-06 and D1–D7/Q1–Q4. The design reference is "PPO - Design", named version "Access & readiness — accepted"; page `1400:346423`, notes `1400:347414`.

Preflight found an implementation prerequisite behind D4: the existing readiness command supports preparation, evidence review and acknowledgement, but not the requirement draft/submission/independent-review lifecycle that preserves an approved revision while a successor is edited. Current preparation and Field readiness read the mutable content. Read-only inspection of the local live schema confirmed the single readiness content record and generic retained snapshots/events. A snapshot-based solution may avoid a migration, but still changes source selection used by Field readiness. The owner has been asked whether to include that prerequisite or explicitly gate revision editing in this page increment, under this task's scope and migration stop rules.

No runtime code, schema, permission, capability or dependency has changed. P4, work-window weekdays and the Conversations action remain outside this build. Implementation, browser comparison, owner visual review and deployment are pending; the accepted Figma design is not evidence that the native page has passed review.
