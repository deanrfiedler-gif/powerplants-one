---
title: Pull request flow limits adopted
date: 2026-11-02
---

Dean adopted Claude's recommendations on the open triage questions on 2 November 2026: at most three page builds marked ready at a time, no new page builds until the backlog drains, lock-ins as drafts with one ready batch, and historical Discovery revisions to stay readable in a later increment. The [decision record](../decisions/pull-request-flow-limits.md) holds the detail.

Seven pull requests were closed on that decision, with their branches kept: #698, #727, #732, #739, #725, #712 and #807. #814 and #809 close later, and #818 stays open until it is refreshed and reviewed.

Nothing enforces these limits automatically. No application code, test, migration, permission, CI workflow or branch protection changes.

<!-- decision-index -->
[Pull request flow limits](../decisions/pull-request-flow-limits.md) (PPO-PR-FLOW-LIMITS-DEC) records the limits on ready page builds, lock-in batching and the direction for historical Discovery reads.
