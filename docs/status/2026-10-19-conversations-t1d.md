---
title: Conversations T1d record-page lists, inbox asks and My Work asks
date: 2026-10-19
---

Dean started T1d of Conversations on 19 October 2026: "Yes, start T1c-3 (context panel) and T1d (record-page lists, notifications, My Work, reply-by reminders) as two parallel sessions with their own worktrees and PRs." It is being built on branch `claude/conversations-t1d-2baa2b` from the [T1d design](../decisions/conversations-t1d-design.md): a Conversations section on deal and project pages (count, list, Open in Conversations and New thread, shown only to people who can read the threads), asks and mentions in the notification inbox under the Mentions category (projected from the audit log, checked against current access, no message prose, not counted on the bell), and the asks waiting on the viewer in My Work. Reply-by reminders are not built: their scheduling options are in the [reminder proposal](../decisions/conversations-reply-by-reminders.md), waiting for Dean's decision. No migration, seed, capability or parent ID changes; nothing is deployed to the hosted demo. CI, Dean's visual review and production readiness are separate.

<!-- decision-index -->
[Conversations T1d design](../decisions/conversations-t1d-design.md) (PPO-CONV-T1D-DESIGN) records how the record-page lists, inbox notices and My Work asks are built, and the departures for Dean's review; the [reminder proposal](../decisions/conversations-reply-by-reminders.md) (PPO-CONV-REMINDERS-PROP) sets out the reply-by scheduling options for his decision.
