---
document_id: PPO-CONV-T1C-DESIGN
title: Conversations T1c design
date: 2026-10-18
owner: Dean Fiedler
status: T1c split and the T1c-1 design accepted by Dean on 18 October 2026; implementation plan written; no application code written
versioning: git
---

# Conversations T1c design

This record designs build step T1c of the [Conversations T1 scope](conversations-t1-scope.md) (PPO-CONV-T1-SCOPE): the `/conversations` page for people-only threads. It splits T1c into three pull requests and sets out the design of the first, T1c-1. T1b ([PR #568](https://github.com/deanrfiedler-gif/powerplants-one/pull/568), migration 0108 and seed 108) supplies the service in `src/conversations/`; it has no HTTP routes and no read for the context panel.

Dean accepted this record on 18 October 2026 (quote 8). T1c-1 is built from its [implementation plan](../superpowers/plans/2026-10-18-conversations-t1c-1.md). Each slice follows `AGENTS.md` in its own pull request.

## 1. Dean's words

Quoted as written, 18 October 2026:

1. "Start T1c here: check #567's merged tree first, then design the T1c build with me before writing code."
2. "Split T1c into three PRs as you recommend: T1c-1 routes and the page core, T1c-2 the top-bar icon and badge with the lock-in, T1c-3 the context panel."
3. "Use the explicit ask row: tagging shows an Ask toggle with a short question and optional reply-by, off by default. Correct the dialog wording too."
4. "Derive the title from the first sentence of the message, capped at 80 characters, shown with an Edit link before starting."
5. "Approach 1 and section 1 look right. Go on to section 2."
6. "Section 2 looks right. Go on to section 3."
7. "Section 3 and the title rule look right. Write the T1c-1 design to docs/decisions/conversations-t1c-design.md for my review."
8. "I've reviewed docs/decisions/conversations-t1c-design.md and approve it. Write the T1c-1 implementation plan."

## 2. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| T1c is three pull requests, T1c-1 to T1c-3 (section 3) | Claude's recommendation, adopted | Quote 2 |
| A tagged person becomes a tracked ask only through an explicit Ask switch, off by default (section 5.4) | User decision | Quote 3 |
| The New thread dialog's hint is corrected (section 7) | User decision | Quote 3 |
| The thread title is derived from the message, with Edit (section 5.5) | User decision | Quote 4 |
| The derived title drops `#` record links (section 5.5) | Claude's recommendation, adopted | Quote 7 |
| Approach 1 and the routes and files (sections 4 and 5.1 to 5.2) | Claude's recommendation, adopted | Quote 5 |
| Screens and states (section 5.3 and 5.6) | Claude's recommendation, adopted | Quote 6 |
| Data flow, errors and testing (sections 5.7, 5.8 and 6) | Claude's recommendation, adopted | Quote 7 |
| This written record | User decision, accepted after review | Quote 8 |

## 3. The three slices

| Slice | Content | Depends on |
|---|---|---|
| T1c-1 | HTTP routes for the T1b service; `/conversations` and `/conversations/[id]` on desktop, tablet and phone: sidebar, thread view, ask cards, composer with the `@` and `#` pickers and ask rows, New thread dialog, empty, loading and error states; route metadata; design register entries and guide; unit, route and browser tests | T1b (merged) |
| T1c-2 | The top-bar Conversations action and badge on every page and in the phone header (D1, D2, D7), with the badge read route; the 320 and 1024 header departures accepted in the T1 scope; the change to the shared `Shell / Top bar` and `Shell / Phone header` Figma components; the icon-free captures of the accepted T1 frames (the lock-in) | T1c-1 |
| T1c-3 | The context panel (Record, Files and documents, Contacts, Related records, This thread), with a new context read for deals and projects drawn from each viewer's own access (S5) | T1c-1 |

Until T1c-2 lands, `/conversations` is reachable by its address only. There is no temporary menu entry.

## 4. Approach

T1c-1 follows the pattern the other PPO modules use. Alternatives considered:

| Approach | Outcome |
|---|---|
| API routes under `/api/v1/conversations` using `readRoute` and `commandRoute` (`src/shared/http.ts`); separate list and thread pages; reads through `usePlatformResource`; sends through `useRecoverableCommand` | **Adopted** (quote 5). Phones get a real Back from a thread to the list, notification and record links can address a thread, and a retried send replays the same operation instead of posting twice |
| One page that keeps the thread in `?thread=` | Not adopted. Simpler routing, but weaker phone Back and no stable thread address for T1d's links |
| Server components with server actions | Not adopted. No PPO module uses them |

## 5. T1c-1 design

### 5.1 Routes

All under `/api/v1`. Static segments (`asks`, `people`, `records`) take precedence over `[id]`.

| Method and path | Service call |
|---|---|
| `GET /conversations` | `listThreads` (filter, optional anchor, limit) |
| `POST /conversations` | `startThread` |
| `GET /conversations/[id]` | `readThread` |
| `POST /conversations/[id]/messages` | `postMessage` |
| `POST /conversations/[id]/read` | `markRead` |
| `POST /conversations/[id]/resolve` | `resolveThread` |
| `POST /conversations/[id]/reopen` | `reopenThread` |
| `POST /conversations/asks/[id]/no-answer-needed` | `closeAsk` |
| `GET /conversations/people` | `mentionablePeople` (the `@` picker) |
| `GET /conversations/records` | `linkableRecords` (the `#` picker and the dialog's About field) |

The badge read (`conversationBadge`) gets its route in T1c-2. `recordAskDeadline` gets none in T1c: the reply-by reminder needs a scheduler, which is T1d's decision.

### 5.2 Pages and components

- `src/app/(business)/conversations/layout.tsx` holds the sidebar, so it stays in place while the thread changes; `page.tsx` is the list; `[id]/page.tsx` is the thread.
- On desktop, `/conversations` opens the top thread, preferring one waiting on the viewer. On a phone it shows the list.
- Components live in `src/conversations/components/`: the workspace layout, sidebar, thread view, message, ask card, composer (with pickers and ask rows) and New thread dialog.
- Two pure modules hold the logic that is easy to get wrong, with unit tests: converting what was typed into the stored `@{n}`/`#{n}` body with its mention and ask lists, and deriving the title.
- Route metadata in `src/shell/navigation.ts` gives the breadcrumb and tab title "Conversations". There is no rail entry.
- Styling uses the shared tokens and controls; any exception is recorded in the page contract.

### 5.3 Screens

The accepted T1 frames ("Conversations T1 — people-only threads, accepted"; [T1 scope section 6](conversations-t1-scope.md#6-frames-drawn-in-t1a)) are the reference, without the context panel (T1c-3) and the top-bar action (T1c-2).

- **Sidebar** (280 px on desktop; the whole list page on a phone): New thread; Search threads, which filters the loaded threads by title or record on the device, because T1b has no server search; the filters Waiting on you and Mentions with counts; threads grouped under their record heading. Each row shows the title (bold when unread), state and people, and time. Rows use the drawn states Waiting on you (amber) and Resolved (green); an open thread with nothing waiting shows a grey "Open" without a dot, which the frames do not draw.
- **Thread header:** title, participant initials and state tag; the record link with "Main thread · started by Alex, 09:58"; Resolve, or Reopen once resolved, shown only to the thread's creator and its participants (the T1b rule). The "…" menu is hidden: T1 has nothing for it.
- **Messages:** avatar, name, role and time. `@Name` is drawn in link blue. A `#` link uses the record-link control, drawn from the reader's own access; a record the reader cannot open shows "A record you can't open" with no title and no action (T1-4).
- **Ask cards,** under the message that made them. The person asked sees "Waiting on you · {question} · reply by {date}" and "No answer needed". Everyone else sees "Waiting on {name} · {question}". Closed asks are muted: "Answered by {name}" or "No answer needed".
- **Read position:** when a participant opens a thread whose newest message is beyond their read position, the page marks it read up to that message. `markRead` refuses a reader who is not a participant (`NotAParticipant`), so the page calls it only for participants.

### 5.4 Composer and asks

- The `@` and `#` buttons, or typing `@` or `#`, open the pickers. The `@` picker lists only people who can read the record (T1-3); the `#` picker lists deals and projects the sender can open.
- A picked person or record is inserted as visible text and tracked as a mention. Deleting the visible text removes the mention and, for a person, their ask row.
- Each tagged person gets an ask row: an "Ask {name}" switch, off by default; when on, a required short question (up to 500 characters) and an optional reply-by date. T1b takes both at send time and has no later command to add a reply-by date.
- Send, or Ctrl+Enter, converts the text to the stored `@{n}`/`#{n}` body with its mentions and asks (T1-5), at most 20 mentions and 10 asks.
- On a resolved thread the composer is replaced by "Reopen this conversation to reply". A reader without the post capability sees "You can read this conversation but not post in it."

### 5.5 New thread and its title

- **About:** the record picker. Opening the dialog with `?record={type}:{id}` pre-fills it, for T1d's record pages.
- **Message:** the composer, with ask rows.
- **Title:** shown as "Title: {derived title}" with an Edit link that turns it into a field before starting. It is derived from the message's first sentence, capped at 80 characters at a word boundary. `@` mentions keep the person's name. `#` record links are dropped, because a thread title is shown to everyone in the thread and a linked record's number or title must not reach readers who cannot open that record (T1-4).
- **Hint,** corrected (section 7): "Switch on Ask for anyone you're asking a question; you can add a reply-by date."
- Cancel and Start thread. On success the page moves to the new thread's address.

### 5.6 States and widths

- **States:** loading skeleton and the empty page as drawn; a read error shows the error notice with Retry; a thread the viewer cannot open, or that does not exist, says only "This conversation isn't available to you", the same in both cases.
- **Widths:** 1440 shows sidebar and thread; 1024 shows the collapsed rail, sidebar and thread; 390 and 320 show the list, then the thread full screen with Back. The 320 and 1024 header changes are shell work in T1c-2.
- **Accessibility:** the sidebar is a navigation list with the current thread marked; the message list announces new messages politely to screen readers; the pickers are keyboard-driven lists; the Ask control is a switch.

### 5.7 Data flow

- The sidebar reads up to 100 threads the viewer takes part in; the filters and their counts are computed on the device from that list.
- The sidebar and the open thread re-read every 30 seconds while visible, when the window regains focus, and after any command the viewer sends. There are no live pushes in T1.
- Every command carries its own operation ID through `useRecoverableCommand`; a retry after a dropped connection replays the same operation. After a command the thread and sidebar re-read.
- Nothing is cached across sign-ins: the shell's existing session-lock handling clears it.

### 5.8 Errors

| Case | What the viewer sees |
|---|---|
| Invalid input | The message next to the field: composer, ask question or reply-by date |
| No access, or no such thread | "This conversation isn't available to you", identical in both cases |
| Thread resolved meanwhile, version conflict, or ask already closed | The thread re-reads, with a one-line explanation |
| Network failure on send | The text and tags are kept, with Retry; nothing is lost |
| A picker fails to load | Error and Retry inside the picker; the message can still be sent without tags |

## 6. Testing and verification

- **Unit:** converting typed text to the stored body and back; the mention and ask limits; removing a tag removes its ask; title derivation (first sentence, 80-character cap at a word boundary, `#` links dropped).
- **Routes,** through the existing HTTP proof harness: every route requires sign-in; a first send answers 201 and a replay 200; an unreadable thread is indistinguishable from a missing one.
- **Browser,** at desktop and phone widths with the seeded synthetic users: start a thread with an ask; the asked person replies and the ask closes; No answer needed; resolve and reopen; a link to a record the reader cannot open; no horizontal scroll at 320 px.
- **Register:** `npm run studio:sync` for the two routes; page contracts citing the accepted frames and named version; the guide; `npm run studio:check`.
- **Local limits:** typecheck and lint locally as far as Windows allows; CI is the authority for the database and browser suites. Any failure is confirmed against unmodified `main` before it is attributed to this change.

## 7. Changes to the accepted design

| Item | Change | Status |
|---|---|---|
| New thread dialog hint | "Tagging a person with a question creates a tracked ask. You can set a reply-by date after you send." becomes "Switch on Ask for anyone you're asking a question; you can add a reply-by date." The old wording promised a command T1b does not have | Decided by Dean (quote 3). Corrected on the Figma frame 1244:286305 on 18 October 2026, after the named version |
| Derived title line with Edit in the New thread dialog | Added | Decided by Dean (quote 4); not drawn |
| Ask rows under the composer | Added | Decided by Dean (quote 3); not drawn |
| Grey "Open" state on a sidebar row | Added | Adopted with section 2 (quote 6); not drawn |

The undrawn items are drawn on the Conversations page before the T1c-2 captures, so the retained captures match the build.

## 8. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | PPO-AI-THREADS-PROP, step T1, slice T1c-1. No parent requirement ID is added or renamed; all 78 parent IDs remain |
| Page type (r20) | Application page with a sidebar and a thread; the context panel joins in T1c-3 |
| Reused components | Shared shell, `PageHeader`, `ErrorNotice`, `RecordLink`, the record-link and thread-row patterns from the Figma Components page, shared buttons and fields |
| Source authority | The T1b service and its access rules; the deal and project records for record links |
| Incoming handovers | A thread address from T1d's notices and record pages; `?record=` for New thread |
| Outgoing handovers | A `#` link or the record link opens the deal or project |
| Departures | Section 7 |

## 9. What this record does not do

It authorises T1c-1 only, built from its implementation plan. It does not change the shared shell, add the top-bar action or badge, build the context panel, add record-page lists, notifications, My Work or reminders, or decide how the reply-by reminder is scheduled. It does not decide A1 (the provider), the AD-01 sharing record, the speech provider, the driving policy or Carl's agreement to the name; none of them blocks T1c.
