---
title: Agreement charge C1 CI failure follow-up
date: 2026-11-12
---

[PR #905](https://github.com/deanrfiedler-gif/powerplants-one/pull/905) corrects a missing inherited warm-up dependency in the demo browser configuration. Its demo test directory hid the setup file, leaving the first invited-actor planner read exposed to cold route compilation. Discovery now includes the existing warm-up and all six original UI cases, without changing assertions or deadlines. No application or migration changes are made.

At incoming head `330b76292`, Application assurance also failed one ordinary desktop planner drag case; equivalent compiled desktop/mobile cases passed. A bounded failed-jobs retry was requested, not represented as a root-cause fix. All database shards, HTTP and Finance jobs passed. Compiled C1-2 browser cases actually passed on desktop and mobile. [Execution evidence](../testing/evidence/agreement-charge-c1/README.md#ci-follow-up--12-november-2026) records exact jobs, retained failure evidence and commands.

Local application checks passed Studio, lint, TypeScript, 1,452 units and production build; documentation checks and 44 documentation tests passed. Required Chrome remains absent locally. The correction's push supersedes the still-running incoming-head retry; replacement final-head browser CI and Claude's confirmation of the prior review fixes remain merge dependencies. No full connected scenarios, operational acceptance, merge or deployment is claimed.
