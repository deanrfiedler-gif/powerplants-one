---
document_id: PPO-CONV-T1D-DESIGN
title: Conversations T1d design
date: 2026-10-19
owner: Dean Fiedler
status: T1d started by Dean on 19 October 2026; record-page lists, inbox notices and My Work asks built from the accepted T1 design with the implementation choices in section 3 for Dean's review in the pull request; reply-by reminders proposed in PPO-CONV-REMINDERS-PROP and not built
versioning: git
---

# Conversations T1d design

This record sets out how slice T1d of the [Conversations T1 scope](conversations-t1-scope.md) (PPO-CONV-T1-SCOPE, section 4) is built: a deal's and a project's Conversations section, asks in the notification inbox and asks in My Work. It sits beside the [T1c design](conversations-t1c-design.md) (PPO-CONV-T1C-DESIGN), whose T1c-3 context panel was built in parallel. The reply-by reminder needs a scheduling decision first; its options are in the separate [reminder proposal](conversations-reply-by-reminders.md) (PPO-CONV-REMINDERS-PROP), and nothing schedules a reminder yet.

## 1. Dean's words

Quoted as written, 19 October 2026:

1. "Yes, start T1c-3 (context panel) and T1d (record-page lists, notifications, My Work, reply-by reminders) as two parallel sessions with their own worktrees and PRs."

The brief that started this session added: build the three surfaces regardless; before building any scheduler, write a short proposal with options and an ADR draft if a new technology or service is involved, and stop for Dean's decision.

## 2. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| T1d is built now, in its own pull request | User decision | Quote 1 |
| A record's page shows a thread count and list to people who can read the threads (Q4) | User decision, T1 scope | T1 scope sections 3 and 8; frame 1244:286531 |
| Asks appear in the notification inbox under the existing Mentions category and in My Work | User decision, T1 scope | T1 scope section 3 |
| Notices are an audit-log projection, checked against current access, with no message prose (T1-7); no email (T1-8) | User decision, T1 rules | T1 scope section 5 |
| Ask and mention events count on the Conversations icon only, not on the bell (D7) | User decision, accepted design | Proposal section 14, D7 |
| How each surface is placed and what it shows (section 3) | Claude's implementation choices within the accepted design; Dean's review is in the pull request | Section 3 and the departures in section 4 |
| How the reply-by reminder is scheduled | Open, waiting for Dean | [Reminder proposal](conversations-reply-by-reminders.md) |

## 3. What T1d builds

### 3.1 The record page's Conversations section

- **Who sees it (Q4, T1-1).** The section reads `GET /api/v1/conversations?anchor_type=…&anchor_id=…`, which lists every thread on that record the viewer can read, whether or not they take part, and now also says whether the viewer may read and post on that record. A viewer without `conversation.read` there sees no section, not an empty one; a viewer who can read but not post sees the list without New thread.
- **Heading and count.** "Conversations" with the number of threads, and a chevron that collapses the list, as the accepted `Record / Section heading`.
- **Rows.** The accepted thread row: a state dot, the title (bold when the viewer takes part and has not read the newest message), then state, people and time ("Waiting on you · SYN Sales receiver, SYN Company A coordinator · 10:12"). Up to three people are named, then "+N". The first five threads show, newest first, with "Show all N" for the rest. A row opens `/conversations/{id}`.
- **Actions.** "Open in Conversations" opens the record's thread that is waiting on the viewer, else its newest. "New thread" opens `/conversations?new=1&record={type}:{id}`, which pre-fills About (T1c design 5.5).
- **Empty.** "Ask a colleague about this deal (project). The question stays on the deal (project) and is tracked until they reply." with New thread, as drawn.
- **States.** Loading shows a one-line status; a failed read shows the error notice with Retry. The section re-reads on focus, every 30 seconds while visible and after any Conversations command.
- **Placement.** On a deal, a panel in the Overview tab after "Next customer action" and "Customer objective". On a project, whose page is the full-height schedule, a "Conversations" control with the count in the row beside Change history, Baselines and Sales handovers, opening the same section in a dialog (section 4).

### 3.2 Asks and mentions in the notification inbox

- **Source.** The T1b projection (`projectConversationNotices`): each mention, ask and recorded deadline step for the recipient, from the audit log, with the event, thread and sequence only. The inbox projects it when the viewer holds `conversation.read`.
- **Access.** Every conversation notice is filtered by the recipient's present right to read its thread (T1-1) before the bounded window and the counts, and again when a notice is opened or its state changed. A notice for a thread the viewer can no longer read is neither listed nor counted.
- **What it shows.** The thread's current title and record, the reason ("Asked you a question", "Mentioned you", "Reply-by reminder", "No reply by the reply-by date") and who posted, read from the source at display time. No message text or ask question is shown or stored in the notice (T1-7). "Open conversation" opens the thread.
- **Mentions category.** Each notice carries its category. The inbox toolbar gains a Category filter (All, Owned work, Mentions), kept in saved views.
- **Not on the bell (D7).** The bell panel and its unread count show Owned work only. The inbox shows a separate "unread mentions" count beside the existing counts, which are unchanged.
- **Personal state.** Read, unread, archive and restore work as for Activity notices, checked against the thread's access. A conversation notice is never required work: archiving it does not close an ask, which stays in My Work and in the Waiting on you filter until answered or marked "No answer needed".

### 3.3 Asks waiting on the viewer in My Work

- **Panel.** A "Waiting on you" panel on the overview, beside Waiting on others, listing the open asks addressed to the viewer on threads they can read: the question, the thread and record, who asked and when, and the reply-by date, marked overdue once it has passed (Brisbane day). The count covers every such ask; three show on desktop and two on a phone, with "View all" opening Conversations.
- **Scope.** Asks are personal, so the panel shows in "My work" only, like calendar meetings, and follows the company filter by the record's company. "Everyone I can see" does not show other people's asks.
- **Action.** Reply opens the thread. My Work does not close an ask; the reply or "No answer needed" in the thread does.
- **Layout.** The panel joins the customisable panel order (a saved layout gains it at the end) and can be hidden like the others.

## 4. Changes to the accepted design

| Item | Change | Status |
|---|---|---|
| Record-page section with threads | Shows "New thread" beside "Open in Conversations", because any reader with the post right may start another thread (U1); the frame draws Open in Conversations only | Claude's choice; for Dean's review |
| Record-page heading | Shows the thread count beside "Conversations"; the frame carries the count in its annotation only | Claude's choice; for Dean's review |
| Project page placement | A section-row control with the count, opening the section in a dialog, because the schedule fills the page | Claude's choice; for Dean's review |
| Inbox Category filter and unread mentions count | Added to the accepted My Work Updates layout | Claude's choice; not drawn |
| My Work "Waiting on you" panel | Added to the accepted My Work overview | Claude's choice; not drawn |

None of these is drawn in Figma. If Dean accepts them, they are drawn on the Conversations and My Work pages before the T1 captures.

## 5. Testing and verification

- **Unit:** the record-section model (count, preferred thread, shown rows, people line) and the notice labels.
- **Database:** inbox notices for an ask and a mention, filtered by current access and excluded from the bell's count; archive of a conversation notice; the My Work asks panel and its company filter; the anchored list's read and post flags.
- **HTTP:** the anchored list's access flags, the inbox with conversation notices, and their detail read, with sign-in required.
- **Browser, desktop and phone:** the deal and project sections with threads and empty; New thread pre-filled from a record; an ask in the inbox under Mentions and absent from the bell; the ask in My Work; no horizontal scroll at 320 px.
- **Register:** the deal and project record routes, `/work/updates` and `/work` updated with the section, notices and panel; the guides; `npm run studio:check`.

## 6. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | PPO-AI-THREADS-PROP, step T1, slice T1d. No parent requirement ID is added or renamed; all 78 parent IDs remain |
| Page type (r20) | No new page. A section on the deal and project record pages; a filter and notice kind on My Work Updates; a panel on the My Work overview |
| Reused components | `Record / Section heading` and `Conversations / Thread row (proposed)` from the accepted frame; shared `Button`, `ErrorNotice`, `usePlatformResource`; My Work `mw-panel`, `PanelState`, `WorkDialog` |
| Source authority | The T1b service and its access rules; the audit log for notices |
| Incoming handovers | A deal or project page to its threads and to New thread; a notice and a My Work ask to their thread |
| Outgoing handovers | `/conversations/{id}` and `/conversations?new=1&record={type}:{id}` |
| Departures | Section 4 |

## 7. What this record does not do

It does not schedule reply-by reminders, add email, push or any delivery channel (T1-8), add a migration, seed, capability or route, change who may read or post, or change the T1c-3 context panel. It does not deploy anything to the hosted demo. Code delivery, Dean's visual review and production readiness stay separate.
