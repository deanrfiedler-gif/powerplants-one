# Conversations T1c-1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give people a working `/conversations` page for people-only threads on deals and projects, built on the merged T1b service.

**Architecture:** Thin API routes wrap the T1b service with the shared `readRoute`/`commandRoute` helpers. Client components under `src/conversations/components/` read through `usePlatformResource` and send through `useRecoverableCommand`. Two pure modules (`composition.ts`, `title.ts`) hold the text-to-token and title logic so it is unit tested apart from React.

**Tech Stack:** Next.js App Router (`src/app`), React client components, TypeScript, `node:test` unit and HTTP tests, Playwright browser tests against the compiled build.

**Spec:** `docs/decisions/conversations-t1c-design.md` (PPO-CONV-T1C-DESIGN, accepted by Dean on 18 October 2026). Read with `docs/decisions/conversations-t1-scope.md` (rules T1-1 to T1-9) and the T1b service in `src/conversations/`.

## Global Constraints

- People-only: no Carl, agent, AI, microphone, draft, branch, watch, share or proposal UI anywhere (T1 scope section 3).
- No rail entry and no top-bar action; `/conversations` is reachable by address only until T1c-2.
- No context panel (T1c-3), record-page lists, notifications, My Work or reminders (T1d). No route for `conversationBadge` or `recordAskDeadline`.
- No new npm dependency, migration, seed, grant or capability. Hosted demo testers hold no conversation grants (seed 108 comment); T1c-1 adds none.
- Limits from T1b: body 4,000 characters; ask question 500; title 200 (the derived title is capped at 80); at most 20 mentions and 10 asks per message; list `limit` 1 to 200, sidebar uses 100.
- Every command body carries `operation_id`, `schema_version: 1` and a non-empty `reason`. Fixed reasons: "Start a conversation", "Post a message", "Mark conversation read", "Resolve conversation", "Reopen conversation", "No answer needed".
- Stored body tokens are `@{n}` and `#{n}` (`src/conversations/validation.ts`); names and record titles are never stored in a body (T1-5).
- Exact copy: "This conversation isn't available to you"; "Reopen this conversation to reply"; "You can read this conversation but not post in it."; "Switch on Ask for anyone you're asking a question; you can add a reply-by date."; "A record you can't open"; "No answer needed".
- Australian English; dates through the shell's `en-AU` formatting; shared tokens and controls from `src/components/ui/` and `business-ui.tsx`.
- Follow `AGENTS.md`: design register in the same PR, `npm run studio:check`, and confirm any failure against unmodified `main` before attributing it.

## Review Focus

- A user types the characters `@{1}` or `#{2}` themselves: expect a local field message, not a server 400 about token numbering (test in Task 1).
- The same person is tagged twice in one message: expect one ask row for that person and both tags drawn as their name (test in Task 1).
- The 30-second re-read lands while someone is typing: expect the draft, tags and ask rows to survive the reload (test in Task 5).
- Access is withdrawn between two reads of an open thread: expect the unavailable message and no stale messages left on screen (test in Task 4).
- A long thread title and a long record name at 320 px: expect truncation with no horizontal scroll (test in Task 3).

---

### Task 1: Composition and title modules

**Files:**
- Create: `src/conversations/composition.ts`, `src/conversations/title.ts`
- Test: `tests/unit/conversations-composition.test.ts`

**Interfaces:**
- Consumes: `AnchorType`, `MentionInput`, `AskInput`, `maxMentions`, `maxAsks` from `src/conversations/model.ts`.
- Produces (`composition.ts`):
  - `type DraftMention = { key: string; kind: "Person"; person_id: string; display_name: string } | { key: string; kind: "Record"; record_type: AnchorType; record_id: string; label: string }` (`label` is "{display_number} · {title}")
  - `type DraftAsk = { person_id: string; on: boolean; question: string; reply_by: string | null }`
  - `type Draft = { text: string; mentions: DraftMention[]; asks: DraftAsk[] }`; `emptyDraft(): Draft`
  - `visibleToken(m: DraftMention): string` returns `@{display_name}` or `#{label}`
  - `insertMention(d: Draft, m: DraftMention, caret: number): { draft: Draft; caret: number }` inserts the token plus one space at the caret; a person mention adds a `DraftAsk` (off) only if that person has none
  - `reconcile(d: Draft): Draft` keeps a mention only while the text holds as many copies of its token as there are mentions sharing it; drops an ask whose person has no mention left
  - `toMessageInput(d: Draft): { ok: true; body: string; mentions: MentionInput[]; asks: AskInput[] } | { ok: false; field: "body" | "asks"; message: string }`
  - `type DrawnMention = { ordinal: number; kind: "Person"; person_id: string; display_name: string } | { ordinal: number; kind: "Record"; can_open: true; record_type: AnchorType; record_id: string; display_number: string; title: string } | { ordinal: number; kind: "Record"; can_open: false }`, the shapes `readThread` builds (it types them as `unknown[]`); `type Segment = { kind: "text"; text: string } | { kind: "person"; name: string } | { kind: "record"; mention: DrawnMention }`; `segments(body: string, mentions: DrawnMention[]): Segment[]`
- Produces (`title.ts`): `deriveTitle(d: Draft, anchorNumber: string): string`

- [ ] **Step 1: Write the failing tests** in `tests/unit/conversations-composition.test.ts` (`node:test`, `assert/strict`, as `tests/unit/conversations.test.ts` does):
  - `toMessageInput turns tags into ordered tokens`: draft text `@Sam see #OPP-0142 · Green Valley Nursery today` with a Person (Sam) then a Record mention gives body `@{1} see #{2} today`, mentions ordinals 1 (Person) and 2 (Record).
  - `ordinals follow the text, not the order tags were picked`: picking the record first but placing it after the person still numbers the person 1.
  - `an ask is sent only when switched on, against the person's first ordinal`: two asks, one `on: false`; result has one `AskInput` with `ordinal: 1`, `question` trimmed, `reply_by: "2026-10-30"`.
  - `an ask switched on without a question is a local error`: `{ ok: false, field: "asks" }`.
  - `typed reserved patterns are refused locally`: text containing `@{1}` with no mentions gives `{ ok: false, field: "body", message: "Remove @{1}: that pattern is reserved for tags." }` (and `#{2}` likewise).
  - `the same person tagged twice keeps one ask row`: `insertMention` twice for Sam leaves one `DraftAsk`; `toMessageInput` gives two Person mentions and at most one ask.
  - `deleting a tag's text removes the mention and its ask`: `reconcile` after removing `@Sam` from the text leaves no Sam mention or ask.
  - `limits are enforced locally`: 21 mentions gives `field: "body"`; 11 asks on gives `field: "asks"`.
  - `segments draws names and record mentions`: `segments("@{1} see #{2}", [...])` gives person `Sam`, text ` see `, record segment carrying the drawn mention (including `can_open: false` unchanged).
  - `deriveTitle takes the first sentence without record links`: `@Sam where is #OPP-0142 · Green Valley Nursery at? Customer asked.` gives `Sam where is at?`.
  - `deriveTitle caps at 80 characters on a word boundary`: a 120-character first sentence gives a result of length ≤ 80 ending in `…`, cut after a whole word.
  - `deriveTitle falls back when nothing is left`: text of only a record link gives `Conversation on OPP-0142`.

- [ ] **Step 2: Run them to see them fail**
  Run: `node --import tsx --test tests/unit/conversations-composition.test.ts`
  Expected: FAIL, modules not found.

- [ ] **Step 3: Implement both modules** with the signatures above. `toMessageInput` replaces, for each mention in order of first appearance, the first unconsumed copy of its token; refuse locally before building anything if the user's own text matches `/[@#]\{\d+\}/`. `deriveTitle`: remove record tokens, turn `@Name` into `Name`, collapse spaces, take text up to and including the first `.`, `?` or `!` followed by a space or the end (or the first line break), trim; if longer than 80, cut at the last space within 79 characters and append `…`; if empty, `Conversation on {anchorNumber}`.

- [ ] **Step 4: Run the tests to see them pass**
  Run: `node --import tsx --test tests/unit/conversations-composition.test.ts`
  Expected: PASS, all tests.

- [ ] **Step 5: Commit**
  `git add src/conversations/composition.ts src/conversations/title.ts tests/unit/conversations-composition.test.ts && git commit -m "feat(conversations): composition and derived-title modules for T1c-1"`

### Task 2: HTTP routes

**Files:**
- Create under `src/app/api/v1/conversations/`: `route.ts`, `[id]/route.ts`, `[id]/messages/route.ts`, `[id]/read/route.ts`, `[id]/resolve/route.ts`, `[id]/reopen/route.ts`, `asks/[id]/no-answer-needed/route.ts`, `people/route.ts`, `records/route.ts`
- Modify: `src/components/business-ui.tsx` (`RecordLink`: add `Project: "projects"`)
- Test: `tests/http/conversations.test.ts`

**Interfaces:**
- Consumes: T1b `listThreads`, `readThread`, `startThread`, `postMessage`, `markRead`, `resolveThread`, `reopenThread`, `closeAsk`, `mentionablePeople`, `linkableRecords`; `readRoute`, `commandRoute` from `src/shared/http.ts`.
- Produces: the endpoints in spec section 5.1, each a one-line route as `src/app/api/v1/activities/route.ts` and `[id]/complete/route.ts` are. `POST /conversations` uses `commandRoute(..., true)`; every other command `commandRoute(..., false)`. Every route file exports `dynamic = "force-dynamic"` where it has a `GET`.

- [ ] **Step 1: Write the failing HTTP test** `tests/http/conversations.test.ts`, using the `login`/`call` helpers pattern from `tests/http/equipment.test.ts`. Profiles: `coordinator` starts threads; `other-workspace` is the outsider. The second reader is found, not assumed: sign in as `crm-receiver` and `observer` (the login reply carries `actor_id`), and use the first whose `actor_id` appears in `GET conversations/people` for the chosen record. If neither does, fail with a message naming the record; that is a fixture defect to report, not a skip.
  - `T1c-1 routes require a session`: `GET conversations` without a cookie is 401.
  - `start, read, post and replay`: pick a record from `GET conversations/records`, a person from `GET conversations/people?anchor_type=…&anchor_id=…`; `POST conversations` answers 201 with a receipt whose `record_id` is the thread; the same body again answers 200 with the same receipt; `GET conversations/{id}` returns the message with mention `{ kind: "Person" }`; `POST conversations/{id}/messages` answers 201.
  - `resolve, reopen and the version rule`: resolve with `expected_version: 1` is 200; posting is then 409 with code `ThreadResolved`; reopen with the new version is 200.
  - `an unreadable thread looks like a missing one`: `GET conversations/{id}` as `other-workspace` and `GET conversations/{randomUUID()}` as `coordinator` give the same status and the same error code.
  - `mark read refuses a non-participant`: the second reader, not tagged in the thread, gets 409 `NotAParticipant` from `POST conversations/{id}/read`; the creator's read advances and a replay answers 200.

- [ ] **Step 2: Run it to see it fail**
  Run: `npm run build` once, then `npm run serve:compiled` in another terminal, then `node --env-file=.env.local --import tsx --test tests/http/conversations.test.ts`
  Expected: FAIL with 404 for every route.

- [ ] **Step 3: Create the route files and the `RecordLink` entry.**

- [ ] **Step 4: Rebuild, restart the server and run the test**
  Expected: PASS. Also run `npm run typecheck` and `npm run lint`: no errors.

- [ ] **Step 5: Commit**
  `git commit -m "feat(conversations): HTTP routes for the T1b service"`

### Task 3: Route metadata, workspace and sidebar

**Files:**
- Modify: `src/conversations/reads.ts` (export the existing `ThreadSummary` type; no behaviour change)
- Modify: `src/shell/navigation.ts` (beside the `/search` case: `matchesPath(path, "/conversations")` returns `{ ...destination("work"), id: "conversations", label: "Conversations", href: "/conversations" }`)
- Create: `src/app/(business)/conversations/layout.tsx`, `src/app/(business)/conversations/page.tsx`, `src/conversations/components/conversations-workspace.tsx`, `src/conversations/components/thread-sidebar.tsx`, `src/conversations/sidebar-model.ts`, `src/conversations/components/conversations.css`
- Test: `tests/unit/conversations-sidebar.test.ts`, `tests/browser/conversations.spec.ts`

**Interfaces:**
- Consumes: `GET /api/v1/conversations?filter=All&limit=100` (`{ items: ThreadSummary[]; count }`), `usePlatformResource`, `PageHeader`, `ErrorNotice`.
- Produces:
  - `sidebar-model.ts`: `groupByRecord(items: ThreadSummary[]): { key: string; heading: string; threads: ThreadSummary[] }[]` (heading `"{DEAL|PROJECT} {display_number} · {title}"`, groups ordered by their newest thread); `filterCounts(items): { waiting: number; mentions: number }`; `applyFilter(items, filter: "All" | "WaitingOnYou" | "Mentions", search: string)`; `rowState(t): "Waiting on you" | "Resolved" | "Open"`; `preferredThread(items): string | null` (first with `waiting_on_you > 0`, else first)
  - `ConversationsWorkspace({ children })`: two regions; below 768 px shows the list at `/conversations` and only the thread at `/conversations/[id]`
  - a window event `ppo-conversations-changed` that makes the sidebar re-read

- [ ] **Step 1: Write the failing unit tests** for `groupByRecord`, `filterCounts`, `applyFilter` (search matches title or record number, case-insensitive), `rowState` (Open when `waiting_on_you` is 0 and state `Open`) and `preferredThread`.

- [ ] **Step 2: Write the failing browser tests** in `tests/browser/conversations.spec.ts`:
  - `T1c-1 empty page`: a profile with no threads sees "Start a conversation about a deal or project" and New thread.
  - `T1c-1 sidebar groups and filters`: after a thread is created through the API in `beforeAll`, the sidebar shows its record heading and row; Waiting on you shows the count; Search narrows the list.
  - `T1c-1 no rail item is current and no horizontal scroll at 320 px`: on `/conversations`, no rail link has `aria-current`; at 320 × 844 with a 200-character title thread, `document.documentElement.scrollWidth <= 320`.
  - `T1c-1 sidebar is a navigation list`: the sidebar is `getByRole("navigation", { name: "Conversations" })` and the open thread's row has `aria-current="page"`.
  - `T1c-1 tablet keeps sidebar and thread`: at 1024 × 768 both the sidebar and the thread title are visible.

- [ ] **Step 3: Run them to see them fail**
  Run: `node --import tsx --test tests/unit/conversations-sidebar.test.ts` and `npx playwright test --config=playwright.compiled.config.ts tests/browser/conversations.spec.ts` after `npm run build`.
  Expected: FAIL.

- [ ] **Step 4: Implement** the metadata, layout, list page and sidebar per spec sections 5.2, 5.3 (Sidebar) and 5.6, with the 30-second re-read while `document.visibilityState === "visible"`, re-read on focus and on `ppo-conversations-changed`. On desktop the list page replaces itself with `preferredThread`'s address; on phone it stays. Loading shows the drawn skeleton; read errors show `ErrorNotice` with Retry.

- [ ] **Step 5: Run unit and browser tests to see them pass**, plus `npm run typecheck` and `npm run lint`.

- [ ] **Step 6: Commit**
  `git commit -m "feat(conversations): workspace, sidebar and route metadata"`

### Task 4: Thread view and ask cards

**Files:**
- Create: `src/app/(business)/conversations/[id]/page.tsx`, `src/conversations/components/thread-view.tsx`, `src/conversations/components/message.tsx`, `src/conversations/components/ask-card.tsx`, `src/conversations/ask-model.ts`
- Test: `tests/unit/conversations-asks.test.ts`, `tests/browser/conversations.spec.ts` (add)

**Interfaces:**
- Consumes: `GET /api/v1/conversations/[id]`; `segments` (Task 1); `RecordIdentity` from `src/shell/record-identity.tsx` (reference = anchor `display_number`, title = thread title); `RecordLink`; the command routes (Task 2) through `useRecoverableCommand` with `transport: api`.
- Produces: `ask-model.ts` `askText(ask, viewerId): { lead: string; detail: string; canDecline: boolean; closed: boolean }` with these outputs:
  - asked person, open: lead "Waiting on you · {question}", detail "reply by {d MMM}" when set, `canDecline: true`
  - anyone else, open: lead "Waiting on {asked_name} · {question}"
  - `Answered`: "Answered by {asked_name}"; `NoAnswerNeeded`: "No answer needed"; both `closed: true`

- [ ] **Step 1: Write the failing unit tests** for `askText` covering each case above.

- [ ] **Step 2: Write the failing browser tests:**
  - `T1c-1 thread shows messages, tags and an ask`: `@Name` renders as a name; a record link the reader can open is a link to `/crm/opportunities/{id}` or `/projects/{id}`; the asked user sees "Waiting on you · …" and "No answer needed".
  - `T1c-1 the asked person's reply closes the ask`: signing in as the asked profile and posting through the API, then reloading, shows "Answered by …".
  - `T1c-1 resolve and reopen`: Resolve replaces the composer with "Reopen this conversation to reply"; Reopen restores it.
  - `T1c-1 a link the reader cannot open`: a message with a `#` link to a record the second profile cannot open shows "A record you can't open" with no link.
  - `T1c-1 access withdrawn between reads` (Review Focus): route-intercept the next thread read to answer the unavailable error; the page shows "This conversation isn't available to you" and no message text remains.
  - `T1c-1 new messages are announced politely`: the message list has `role="log"` and `aria-live="polite"`.

- [ ] **Step 3: Run them to see them fail** (commands as Task 3). Expected: FAIL.

- [ ] **Step 4: Implement** the thread page per spec 5.3 (header, messages, ask cards, read position) and 5.8. Mark read only when the viewer appears in `participants` and the newest `sequence` exceeds their `last_read_sequence`. Show Resolve or Reopen only to the creator and participants. On 409 `VersionConflict`, `ThreadResolved` or `AskClosed`, re-read and show one line. A 403 or 404 read shows the unavailable copy and clears the thread. Dispatch `ppo-conversations-changed` after each accepted command.

- [ ] **Step 5: Run the tests to see them pass**, plus typecheck and lint.

- [ ] **Step 6: Commit**
  `git commit -m "feat(conversations): thread view, ask cards and resolve"`

### Task 5: Composer, pickers and New thread

**Files:**
- Create: `src/conversations/composer-mode.ts`, `src/conversations/components/composer.tsx`, `src/conversations/components/mention-picker.tsx`, `src/conversations/components/ask-rows.tsx`, `src/conversations/components/new-thread-dialog.tsx`
- Modify: `thread-view.tsx` (mount the composer), `thread-sidebar.tsx` and the empty page (open the dialog)
- Test: `tests/unit/conversations-composer.test.ts`, `tests/browser/conversations.spec.ts` (add)

**Interfaces:**
- Consumes: `Draft`, `insertMention`, `reconcile`, `toMessageInput`, `deriveTitle` (Task 1); `GET conversations/people`, `GET conversations/records`; `POST conversations` and `POST conversations/[id]/messages` through `useRecoverableCommand` (New thread passes `acceptsReceipt` because the server allocates the thread ID, then navigates to `/conversations/{receipt.record_id}`).
- Produces: `Composer({ anchor, threadId?, onDraftChange? })`, `NewThreadDialog({ initialRecord? })`. `/conversations?new=1&record={type}:{id}` opens the dialog with About filled (for T1d).
- Produces: `src/conversations/composer-mode.ts` `composerMode(state: "Open" | "Resolved", lastSendError: { status?: number } | null): "post" | "resolved" | "read-only"`. The client is not sent the viewer's capabilities, and seed 108 always grants read and post together, so read-only is detected from a 403 on send rather than predicted.

- [ ] **Step 1: Write the failing tests.** Unit, in `tests/unit/conversations-composer.test.ts`: `composerMode` gives `resolved` for a resolved thread, `read-only` after a 403, `post` otherwise. Browser:
  - `T1c-1 New thread with an ask`: open New thread, pick a record in About, type a sentence, tag a person with `@`, switch on "Ask {name}", enter a question and a reply-by date; the dialog shows "Title: {derived}" with Edit and the hint copy; Start thread lands on the new thread showing the ask card.
  - `T1c-1 the @ picker lists only people who can read the record`: the second profile appears; a profile without read access does not.
  - `T1c-1 the draft survives a re-read` (Review Focus): type text and a tag, fire a `focus` event to force a re-read, and the text, tag and ask row are unchanged.
  - `T1c-1 a failed send keeps the message`: route-abort the next `POST …/messages`; the text stays with Retry; Retry posts it once.
  - `T1c-1 pickers and the Ask switch are accessible`: the open picker is a `listbox` whose options move with the arrow keys and pick with Enter; the Ask control is a `switch` that starts unchecked.
  - `T1c-1 a picker failure still lets you send`: route-abort `GET conversations/people`; the picker shows an error with Retry, and the message still posts without tags.

- [ ] **Step 2: Run them to see them fail.** Expected: FAIL.

- [ ] **Step 3: Implement** the composer per spec 5.4 (keyboard-driven pickers as listboxes, Ask as a switch, Ctrl+Enter sends, local errors from `toMessageInput` shown next to the field), the dialog per 5.5 with the exact hint copy, and keep the draft in component state outside the read resource.

- [ ] **Step 4: Run all T1c-1 unit and browser tests to see them pass** at both Playwright projects (`desktop-chromium`, `mobile-chromium`), plus typecheck and lint.

- [ ] **Step 5: Commit**
  `git commit -m "feat(conversations): composer, pickers, ask rows and New thread"`

### Task 6: Design register, guide and status

**Files:**
- Modify: `docs/design/development/register.json`, `docs/design/development/guides.json` (through `npm run studio:sync`)
- Create or complete: `docs/design/development/pages/route-conversations.md`, `docs/design/development/pages/route-conversations-id.md`
- Modify: `docs/STATUS.md`, `docs/decisions/conversations-t1c-design.md` (status line: T1c-1 built, PR number)

**Interfaces:**
- Consumes: the two routes from Tasks 3 to 5; the accepted frames (PPO - Design, page Conversations, section 1244:3422, named version "Conversations T1 — people-only threads, accepted").
- Produces: register entries with the existing scope ID PPO-AI-THREADS-PROP; desktop and mobile contracts naming each frame's node ID; review state left pending (no fingerprint copied).

- [ ] **Step 1: Run `npm run studio:sync`** and confirm it adds two draft entries and stub pages.
- [ ] **Step 2: Replace the stubs** with purpose, tasks, fields, states, handovers and desktop/mobile contracts from spec sections 5.3 to 5.6; record the missing captures (made at the T1c-2 lock-in) explicitly; write the guide's thirteen sections for the two routes, keeping planned behaviour (top-bar entry, context panel) marked as planned.
- [ ] **Step 3: Run the checks**
  Run: `npm run studio:check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py`, `npm run test:unit`
  Expected: no errors (the four known Windows unit failures, document-store ×2, recovery and warm-routes, are confirmed against unmodified `main` and listed in the PR, not fixed here).
- [ ] **Step 4: Commit and open the pull request** as a draft from the worktree, listing what ran locally, what only CI ran, and that nothing in T1c-2, T1c-3 or T1d is included.
  `git commit -m "docs(design): register and guide for /conversations"`
