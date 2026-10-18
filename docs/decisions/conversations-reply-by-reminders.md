---
document_id: PPO-CONV-REMINDERS-PROP
title: Conversations reply-by reminders, scheduling proposal
date: 2026-10-19
owner: Dean Fiedler
status: Proposal for Dean's decision; nothing schedules a reminder yet; no code, service, dependency, migration or route authorised by this record
versioning: git
---

# Conversations reply-by reminders, scheduling proposal

Rule N7 of the [Conversations T1 scope](conversations-t1-scope.md) (PPO-CONV-T1-SCOPE, section 3) says an ask with a reply-by date gets one reminder at that date, and then the asker is told, with no escalation chain. T1b built the command for it: `recordAskDeadline` in `src/conversations/commands.ts` records the step Remind on or after the reply-by date and the step TellAsker after it, once each, in that order; the notice projection turns the steps into a "Reply-by reminder" notice for the asked person and an "AskOverdue" notice for the asker. Nothing calls the command yet. This record sets out how it could be called and asks Dean to choose. It is part of slice T1d ([T1d design](conversations-t1d-design.md)), which was told to propose before building any scheduler.

## 1. What any option must keep

- **One reminder, then the asker, no chain** (N7). The command already refuses a second reminder, refuses TellAsker before the reminder, and refuses a step that is not yet due or an ask that is closed.
- **In-app only** (T1-8). The reminder is a notice in the inbox under Mentions and the ask shows overdue in My Work. No email, push or SMS until D-025 and SH-03 delivery rules exist (N14).
- **The day is Brisbane's**, as the command's own `today` already uses.
- **Notices stay a projection with no message prose** (T1-7), and access is checked when they are read.

## 2. Options

| | A. Check when someone opens PPO | B. Background job | C. A now, B with email |
|---|---|---|---|
| How | When the asked person or the asker reads the Conversations badge (the top bar, on every page), the server records any step now due on their own open asks, through `recordAskDeadline` with an operation ID derived from the ask and step, so two sessions converge on one step | A scheduled process, for example every 15 minutes or at 08:00 Brisbane, finds due asks and records the steps as a system actor | Build A now; add B when an external channel (email) needs a clock-driven sender |
| When the reminder appears | The first time on or after the reply-by date that either person opens any page | At the job's next run, whether or not anyone is signed in | As A, then as B |
| What the recipient notices | The same: an in-app notice is only seen when they open PPO, and opening PPO records the step | The same, unless email is added | The same |
| New technology, service or deployment | None. One read-path call and a short query that finds nothing on most page views | A scheduler: a cron or hosted job beside the existing document worker, its monitoring and a system principal allowed to record steps (the command now accepts only the asker or the asked). Needs an ADR and a hosted deployment change, which is Dean's operation | None now; B's ADR later |
| Who the audit names | The person whose page view recorded the step | A system actor | As A, then B |
| Weak point | If neither person opens PPO, no step is recorded; but then neither would see an in-app notice anyway. The reminder and the "tell the asker" step can land together if the first open is the day after the reply-by date | Infrastructure to run and watch for a feature whose only channel is in-app | Two mechanisms over time |

A check on the My Work or Conversations page only, rather than on the badge, was considered and set aside: an asker who never opens those pages would never be told.

## 3. Recommendation

**C: build A now, and add B only when email delivery is decided.** With in-app notices only, a clock-driven job changes nothing a person can see, but it adds a service, an ADR and a hosted deployment. A uses the command, the projection and the badge read that already exist, and A's operation IDs and the command's refusals keep the single-reminder rule even if B is added later.

If Dean chooses A or C, T1d builds it in its pull request: the step check on the badge read, database proofs for each step and its order, and an HTTP proof that a replayed or concurrent check records nothing twice. If Dean chooses B, an ADR on the scheduler and a system actor comes first, and nothing is built until it is accepted.

## 4. What this record does not do

It authorises no code, scheduler, service, dependency, migration, capability, route or deployment. It does not change N7, T1-7 or T1-8.
