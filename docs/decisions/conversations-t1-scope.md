---
document_id: PPO-CONV-T1-SCOPE
title: Conversations T1 scope, people-only threads
date: 2026-10-17
owner: Dean Fiedler
status: Scope proposed for Dean's review; shell amendment accepted by Dean; no application code, migration, capability or route authorised by this record
versioning: git
---

# Conversations T1 scope, people-only threads

This record scopes build step T1 of the [AI and internal communications threads decision](ai-communications-threads-proposal.md) (PPO-AI-THREADS-PROP, section 9): threads between people, without AI. It splits T1 into four reviewable pull requests, records Dean's acceptance of the top-bar Conversations action, and lists what the Figma design still lacks before the page is built. It authorises no code. Each later slice follows `AGENTS.md` in its own pull request.

## 1. Dean's words

Quoted as written, 17 October 2026:

1. "Yes, start T1 (threads between people, no AI). Check the Figma design status first and design the T1 scope with me before writing any code."
2. "Yes, accept the top-bar Conversations icon and badge shell amendment as part of T1, per your recommendation. Then continue scoping T1."
3. "Proceed on that basis." Given after the four-slice plan in section 4 was presented.

## 2. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| T1 starts now, with no AI | User decision | Quote 1 |
| The Conversations action moves to the top bar, left of the information icon, with a badge, and the rail entry is removed | User decision, design accepted earlier the same day, shell amendment accepted in T1 | Quote 2; [Conversations design r01](../reference/ui/my-work/conversations-r01/README.md); proposal section 14, rules D1, D2 and D7 |
| Four slices, T1a to T1d | Claude's recommendation, adopted | Quote 3 |
| Everything in sections 3 and 5 | Proposed design, for review | This record |
| The shared `Shell / Top bar` and `Shell / Phone header` Figma components are changed | Not yet done | Section 6 |

## 3. What T1 contains

**In T1** (proposal sections 3 and 4, without Carl, voice, branches and sharing):
- **Threads on deals and projects only** (Q3). Every thread is about one record (S2). A record has a main thread; a person with the right to post can start more.
- **Immutable messages from people.** A message is never edited or deleted in T1. A correction is a new message.
- **`@person` asks.** Tagging a person with a question creates a tracked ask with an owner, the question and an optional reply-by date. It closes when the person replies in the thread or marks "No answer needed"; reading does not close it. N7 applies: one reminder at the reply-by date, then the asker is told, with no escalation chain.
- **`#` record links.** Stored as record type and ID, drawn for each reader from that reader's own access.
- **Context panel without Carl.** Record, Files and documents, Contacts, Related records and This thread. Pins and exclusions are not built, because only Carl reads them (S5, T2).
- **Sidebar filters Waiting on you and Mentions.** The Needs approval and Carl working filters, "Catch me up", "Make a task", "Pin as decision" and "Watch" are not in T1.
- **Thread state.** Waiting on you, or resolved. Resolving is by the thread's creator or a participant with the post right.
- **The badge** (D7) counts conversations with something new for the viewer: a mention, an ask, or a reply in a thread they are in. Cards waiting for approval join it at T7.
- **Notifications and My Work.** An ask appears in the person's notification inbox under the existing `Mentions` category, which has no producer yet, and in My Work.
- **A record's page shows a thread count and list** to people who can read the threads (Q4).
- **Desktop and phone**, as accepted. Retention is until the synthetic reset (Q8).

**Not in T1, and not to appear in the T1 page:** Carl or any agent name (so the naming agreement C2 is not touched), `@Carl`, "Draft with Carl", the microphone and driving mode, branches and summaries, record sharing, proposal cards, watches, playbooks and autonomy levels. The composer, the sidebar and the context panel hide these rather than showing them disabled.

## 4. Slices

| Slice | Content | Output |
|---|---|---|
| T1a | The frames the design lacked (section 6, drawn as proposals); this scope record; register and STATUS rows | Documentation pull request |
| T1b | Migration and service: threads, participants, immutable messages, mentions, asks, record links; capabilities and the access-review chain; access rules; database tests. No UI | Pull request |
| T1c | `/conversations` on desktop and phone: sidebar, thread, composer with `@` and `#` pickers, context panel; the top-bar icon and badge on every page and the phone header; design register entry | Pull request |
| T1d | Thread count and list on deal and project pages; asks into the notification inbox and My Work | Pull request |

## 5. Proposed T1 rules

These are proposals for Dean to accept or change. They are not verified operating rules.

| ID | Rule |
|---|---|
| T1-1 | **Who can read a thread:** a person who can read the anchor record and holds the new read capability. A deal thread needs `crm.opportunity.read`; a project thread needs `project.read`. A participant who later loses access to the record loses the thread, with no stored copy of the record's content |
| T1-2 | **Who can post:** a person who can read the thread and holds the new post capability. Both capabilities are proposed names, `conversation.read` and `conversation.post`, and need Dean's mapping to roles at T1b |
| T1-3 | **Tagging is limited to people who can already read the record.** The `@` picker lists only them. Sharing a record with someone who cannot open it is T6, so T1 offers no way around the rule |
| T1-4 | **A `#` link to a record the reader cannot open** reads "A record you can't open", with no title. The "Request access" action arrives with T6, because it depends on the AD-01 sharing decision |
| T1-5 | **Messages are plain text with `@` and `#` tokens.** No formatting, attachments or files in T1. Files and documents appear only in the context panel, from the record's links |
| T1-6 | **Every write is a typed command** with a permission check and an audit event, as the rest of PPO. Identity, company and record keys are explicit; the build reads the live schema, not the sketch in section 14 of the proposal |
| T1-7 | **Notifications are a projection** from the audit log, as `projectActivityNotices` does, with the recipient's current visibility checked, and no message prose copied into the notice |
| T1-8 | **No email in T1.** In-app only; email waits for D-025 and SH-03 delivery rules (N14) |
| T1-9 | **Synthetic data only.** Fixtures use synthetic people, deals and projects; nothing from a real thread, customer or Teams export is used |

## 6. Frames drawn in T1a

The accepted design (Figma file "PPO - Design", page "Conversations", node 1141:49) lacked the frames below. On 17 October 2026 Claude drew them as proposals in a new section on the same page, "T1 · people-only threads and missing frames (proposal, 17 Oct 2026)" (node 1244:3422). They reuse the accepted components and edit copies of the accepted frames; no accepted frame or component changed. Dean has not yet accepted them, and no named version covers them.

| Frame | Node | Shows |
|---|---|---|
| Desktop 1440 · Thread view, Sam, people only | 1244:3423 | The accepted thread view without Carl, drafts, branches, sharing, the microphone and the Needs approval and Carl working filters. Participants are people; the context panel has no Carl pins |
| Desktop 1440 · Empty, no conversations yet | 1244:285681 | The page with no threads, the context panel closed and no badge |
| Desktop 1440 · Loading | 1244:286085 | Skeleton rows in the sidebar and the thread |
| Dialog · New thread | 1244:286267 | Record picker, first message with the composer, and the note that a tagged question becomes a tracked ask |
| State · `@` person picker and `#` record picker | 1244:286385 | People who can open the record, and deals and projects the sender can open |
| State · Record links for each reader, no sharing | 1244:286460 | A reader who can open the record, and one who sees "A record you can't open" with no action (T1-4) |
| State · Record page, Conversations section | 1244:286531 | A deal with two conversations, and a project with none |
| Tablet 1024 · Thread view | 1244:286582 | Rail collapsed, the context panel behind a Context button |
| Phone 390 · Thread list and Thread | 1244:285233, 1244:285266 | The accepted phone frames without Carl |
| Phone 320 · Thread list and Thread | 1244:285524, 1244:285578 | The same at 320 px |
| Notes | 1244:287075 | Scope, removals, departures and what is still not drawn |

**Proposed departures,** for Dean's decision with the frames:
- At 320 px the phone header drops its side padding to 4 px and its title steps down to 18 px so "Conversations" stays whole, and the page guide moves into the identity menu. The Context button is icon-only.
- At 1024 px the builder icon moves into the identity menu, as already proposed for phones (D2), and the search drops its shortcut hint, so the top bar fits.

**Still not drawn:** the Context panel as a drawer on tablet and as a sheet at 320 px, the reply-by date picker, the Resolve confirmation, and loading and empty states on phone.

The shared `Shell / Top bar` and `Shell / Phone header` Figma components gain the Conversations action at the T1c lock-in, after Dean confirms the frames, so that every accepted page changes in one reviewed step. The third named version already shows the action on the Conversations frames only.

## 7. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | PPO-AI-THREADS-PROP, step T1. No parent requirement ID is added or renamed; all 78 parent IDs remain |
| Page type (r20) | Application page with a three-region workspace (sidebar, thread, context panel); the Figma page was started from Template · App page |
| Reused components | Those listed in proposal section 14, plus the eleven `Conversations / *` components on the Components page |
| Source authority | The deal and project records and their access rules; the audit log for notifications |
| Incoming handovers | Deal and project records link to their threads (T1d); notifications and My Work link to asks |
| Outgoing handovers | A `#` link opens the record; a context-panel item opens in its owning system |
| Departures | The top-bar Conversations action, a shell amendment accepted by Dean in quote 2 |

## 8. Open questions for Dean

| ID | Question | Recommended answer |
|---|---|---|
| U1 | Who may start a thread: any reader with the post capability, or the record owner only | Any reader with the post capability, because the reason for the page is that colleagues ask each other |
| U2 | May a person retract their own message | No in T1. Messages are immutable and a correction is a new message; retraction needs a retention and audit decision |
| U3 | Which roles hold `conversation.read` and `conversation.post` | Every role that holds the record's read capability, mapped at T1b through the access-review chain |
| U4 | Is a participant who is not tagged but posts added automatically | Yes, with the role participant, so the thread appears in their sidebar |

## 9. What this record does not do

It authorises no application code, migration, seed, capability, route or deployment, and no number is reserved for a migration or a capability. It does not accept the sections 5 and 8 proposals, the new frames, or the change to the shared Figma components. It does not decide A1 (the provider), the AD-01 sharing record, the speech provider, the driving policy or Carl's agreement to the name; none of them blocks T1.
