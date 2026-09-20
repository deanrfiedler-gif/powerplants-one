---
document_id: PPO-MYWORK-INT
revision: r01
date: 2026-09-20
owner: Dean Fiedler
status: Implemented on a branch for owner review; visual acceptance, business acceptance and the accepted UI baseline register remain separate
source_commit: 39b4bb9f52f06c927fb940f6372ede0d1cae24e7
---

# My Work Sales Overview: application integration

**Scope:** SC-01 My Work (`/work`), under adopted F06 and the personal part of F04. **Authority:** on 20 September 2026 Dean supplied design report r03, mockups r06 (expanded and collapsed) and the implementation brief (prompt r03), and instructed that the working page be built in the application, carried through local verification and handed over. The brief makes routine design and engineering decisions the implementer's and asks for a short record of each material one. This is that record.

This is a change to a synthetic prototype. Nothing here is a production claim, a business acceptance, or evidence that an external calendar, mail or ERP integration exists.

## 1. References and what each was used for

| Reference | Location | Used for |
|---|---|---|
| Design report r03 (`PPO-My-Work-Sales-UI-Design-Report-r03.md`) | Supplied in the conversation; **not in the repository** | Controls, entity meanings, count definitions, the 19 acceptance scenarios |
| Mockups r06, expanded and collapsed (two PNG files) | Supplied in the conversation; **not in the repository** | Composition, emphasis and both menu states. Inspected as images, not read from captions |
| Theme style board r22 | `docs/reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html` | Exact tokens, radii, button and focus treatment |
| My Work & Action Centre r01 HTML and report | `docs/reference/ui/my-work/` | The six-view model and its source-owned boundaries |
| Current application | `src/`, `db/` at `39b4bb9f` | Every contract, permission and workflow below |

The r03 report and the r06 images are not committed: the brief says their local copies are not authorised for publication. A consequence is recorded in section 7.

## 2. Decisions

| # | Decision | Evidence and effect |
|---|---|---|
| D1 | **Six views as routes under one shell.** `/work` Overview, `/work/actions`, `/work/reviews`, `/work/waiting`, `/work/team`, `/work/updates`, in a route group that gives them one secondary menu and one scroll surface. `/work/new` and `/work/:id` keep the ordinary page frame and their existing behaviour. | The shell had no secondary menu. The header gains one empty mount (`#header-menu`) and a view name beside "My Work"; nothing else in the shell changes. The earlier horizontal selector is not reintroduced. |
| D2 | **One overdue instant per activity.** Migration 0028 adds `activity_type`, `starts_at` and `due_date_only`. `due_at` stays the instant after which the activity is overdue: a deadline, the last instant of the local due day, or an appointment's planned end. | The activity contract had only a due instant, so "Starts at", a duration and a date-only task could not be shown truthfully. Storing the planned end in `due_at` gives the report's proposed appointment threshold **without editing any existing read**: every `due_at < now` query already means the right thing. All three fields are optional inputs; a payload written before 0028 stores and reads exactly as before. |
| D3 | **"No next activity" uses the existing source rule**, not the report's proposed one. A gap is an open opportunity whose designated next action is finished, which is `next_action_state = 'Needed'` and the Deals worklist's own "No next activity" view. | Report r03 proposes that an overdue or undated designated action should also count as a gap, and says the rule "remains a business decision". The application already applies one rule on Deals and Leads; a second rule on My Work would make the same opportunity a gap on one screen and not on another. Nothing reads as hidden: an overdue designated action is in Overdue, an undated one is under Date needed. The pointer `next_activity_id` is never changed by a read. **Open for Dean:** adopt the proposed rule everywhere, or keep this one. |
| D4 | **Counts are whole-scope aggregates computed on the server** at one observation instant shared by every panel; the list is a bounded preview (8, overdue first, then due time, identifier as tie breaker) with "View all". | The old list sorted one identifier-ordered page in the browser. `listWork` orders and pages on the server with a keyset. A preview shorter than its total says so. |
| D5 | **Outcome presets are words, not a new status.** "No answer", "Spoke with the contact" and similar start the outcome text. Completing calls the existing `complete` command and nothing else. | Outcome choices by activity type are an open business decision in r03. The command contract is unchanged; no stage moves, no quotation is issued, no lead converts. |
| D6 | **The optional next activity is a second command**, never bundled. For a lead or opportunity the owner plans through the existing `next-action` command (which sets `next_activity_id` under the parent's version); otherwise a linked follow-up is created. If completion succeeds and the next step fails, the dialog says exactly that, keeps the entries and retries only the next step. | Preserves both activity and parent concurrency rules, and the report's partial-success requirement. |
| D7 | **Saved views are personal, server-stored criteria** in `ppo.work_view_preferences`, one versioned document per person, after `ppo.crm_directory_preferences`. Create, use, rename, duplicate, pin and retire are supported; "Today's focus" is a built-in name for the defaults, not a stored record. | No saved-view capability existed for My Work. Team-shared views are **not offered**: the application has no team concept to share with. No shared URLs and no default-view persistence are invented. |
| D8 | **Layout preferences stay in the browser, per person**: menu state, panel order and visibility under `ppo.work.layout.v1:<workspace>:<actor>`. | The application has no server preference store; per-person browser keys are its established pattern (Leads columns, project layout). They change layout only. |
| D9 | **"Waiting on others" projects what a source already records**: Service requests awaiting information (respondent, the date the information was asked for, the owned follow-up and its next date) and Engineering packages with a recorded blocker. Follow up reschedules the owned follow-up with a note; it sends nothing and clears nothing. | No waiting-request entity exists, and Sales has none at all. A request leaves the list when its owned follow-up closes; the request itself stays with Service, whose triage has its own requirements. |
| D10 | **"Reviews & handovers" lists only modules that record a review**: Service reports awaiting review and Finance handoffs ready for review, for a reader who holds the review permission. Opening one decides nothing. | Estimating has no review state (`estimates.state` is `Draft` only) and Engineering records no submissions, so the r06 "estimate review" notice cannot be real yet. It is absent rather than imitated. |
| D11 | **Team queue requires `activity.edit`**, the capability its actions need, on the read as well as the menu. There is no "Owner needed": `activities.owner_id` is `NOT NULL`. | No team grant exists. Every row is still scoped by the reader's grants; the counts are described as obligations, not capacity. |
| D12 | **Updates is an honest "not connected".** The application records no notifications, so there is no read state, digest or quiet hours to offer. | Matches the header bell's existing statement. Required work never depended on a notification. |
| D13 | **Department context is presentation only.** The Sales badge is the existing shell preview workspace; Sales panels appear when the reader holds CRM read capability. | Selecting a workspace never changed permissions and still does not. |
| D14 | **Time zone is the documented application zone**, Australia/Brisbane, labelled where shown. | There is no per-user time zone setting; the calendar already uses this zone. |
| D15 | **A reason is still collected for a reschedule.** | The `update` command requires one and keeps it in the history; removing validation to match a mockup was ruled out by the brief. Completion and planning use the established fixed truthful reasons. |

## 3. Capability matrix

Status words: *existing* (reused unchanged), *implemented* (added in this change), *blocked* (needs a source contract or a business decision that does not exist), *n/a*.

| Requirement | Source and read | Write command | Permission | Status | Verified by |
|---|---|---|---|---|---|
| Overview counts: overdue, due today | `readWorkOverview` → `GET /api/v1/work/overview` | — | `activity.read` + row scope | implemented | browser test 1; MW-DB03 (authored) |
| Waiting on others (count, panel, view) | `listWorkWaiting` over tickets and Engineering | `activities/:id/update` on the owned follow-up | source read caps + `activity.edit` | implemented for Service and Engineering; **blocked for Sales** (no entity) | browser test 8 |
| No next activity (count, panel) | `listPlanningGaps` (`src/crm/planning-gaps.ts`) | `crm/opportunities/:id/next-action` | `crm.opportunity.read`; plan needs edit + ownership | implemented on the source rule (D3) | browser tests 4, 6; MW-DB04 (authored) |
| Activity list, grouping, sort, type filter | overview preview; `listWork` → `/work/actions` | — | `activity.read` | implemented | browser test 1; SC-01 state probe |
| Activity details and history | `readActivity` (existing) + `activityHistory` → `activities/:id/history` | — | activity visibility | implemented | browser tests 2, 5 |
| Contact methods in details | primary person of the linked lead or opportunity | none; `tel:` and `mailto:` links only | parent visibility | implemented; **Open quotation and Join meeting blocked** (no such link on an activity) | inspection |
| Complete with outcome | — | `activities/:id/complete` (existing) | owner + `activity.edit` | existing, new dialog | browser tests 3, 4 |
| Optional next activity | `work/parents` | `next-action` or `POST activities` (existing) | as each command | implemented (D6) | browser test 3 |
| Reschedule, set a date, change owner | `work/conflicts` | `activities/:id/update` (extended, D2) | `activity.edit` | implemented | browser tests 5, 7; MW-DB02 (authored) |
| Appointment conflicts | `readWorkConflicts`, PPO appointments the reader can see | — | `activity.read` | implemented; **external calendar blocked** (none connected) | HTTP probe |
| Attendee notification | — | — | — | **blocked**: activities have no attendees and no calendar is connected. The UI says so on every change | inspection |
| Create or plan an activity | `work/parents`, `selectors/owners` | `next-action` (leads, opportunities); `/work/new` for other records | as each command | implemented | browser test 6 |
| Today's schedule | overview; synthetic calendar meetings shown separately | — | `activity.read`; meetings also `email.read` | implemented; meetings are never merged with an activity by title or time | browser tests 1, 2, 5 |
| Date-needed notice | overview | `update` | `activity.edit` | implemented | browser test 7 |
| Review notice and badge | `listWorkReviews` | source module only | `report.review` or `finance.review` | implemented for those two; **estimate review blocked** (D10) | inspection as coordinator |
| My actions | `listWork` | row actions above | `activity.read` | implemented | intake spec; SC-01 state probe |
| Reviews & handovers | `readWorkReviews` | source module only | as above | implemented (D10) | screenshot |
| Blocked & waiting | `readWorkWaiting` | follow-up only | as above | implemented (D9) | screenshot |
| Team queue | `listWork(team)` → `/work/team` | `update` | `activity.edit` | implemented (D11); Owner needed n/a | browser test 10; MW-DB05 (authored) |
| Updates & preferences | — | browser layout preferences | — | notifications **blocked** (D12); preferences implemented | screenshot |
| Saved views and pinned views | `work/views` | `POST work/views` | `activity.read` | implemented, personal only (D7) | browser test 9; MW-DB06 (authored) |
| Customise | browser preference | — | — | implemented: panel order and visibility, reset; notices cannot be hidden | inspection |
| Menu: header control, edge handle, memory, overlay | `MyWorkShell` | — | — | implemented | browser test 1, both projects |
| Global search, quick add, Ctrl K | existing shell | — | — | existing, unchanged | shell spec |
| Offline | — | — | — | n/a: My Work is an online page and makes no local-save claim | — |

## 4. Departures from mockups r06

| # | Departure | Reason |
|---|---|---|
| DP-1 | A waiting request's chase due **today** also appears in the due-today list. | The chase is a real owned activity. The verification scenario chases on later days so that two overdue plus four today still make six. |
| DP-2 | No "1 review due today" notice in the Sales scenario. | D10. The notice appears when a Service report or Finance handoff awaits the reader. |
| DP-3 | Waiting cards show the requester as the source describes them, and the date the information was requested. | The source records no respondent role and no separate "waiting since". |
| DP-4 | Header is the shell's 64px, not the mockup's 58px; the footer shows the real refresh time and the owner scope, not a design revision. | Existing shell height is preserved; the brief rules out a hard-coded revision or time. |
| DP-5 | "Customise", "Filters" and the overflow are real and therefore smaller than a full design might suggest. | Only supported preferences are offered. |
| DP-6 | The greeting uses the synthetic identity's distinguishing word ("Coordinator"). | Identities are named "SYN …". A real name greets by first name. |
| DP-7 | Below 1200px the menu overlays; below 1320px the supporting panels move under the list; below 1100px the strip becomes two by two. | Chosen from content width, so titles are never squeezed. |

## 5. Shell drift found, not fixed here

*Later note, 20 September 2026:* the phone presentation of mobile r07 gives My Work a one-row phone header and removes its in-page menu bar, so SD-1 no longer affects My Work; it remains open for every other page. See [the mobile r07 record](my-work-sales-mobile-r07-integration.md), which also governs wherever this record describes `/work` at phone width (DP-7, the phone menu trigger).

**SD-1.** At phone width with the local identity strip present, a global rule makes the header a three-column grid and the search and page-guide buttons wrap onto a second row over the top of **every** page (visible on Customers as well). It predates this change. My Work keeps its phone menu trigger clear of that row in exactly that case; the shell rule itself is left for a separate correction, as the brief asks.

## 6. Verification on 20 September 2026 (local, Windows, dev server on 127.0.0.1:3000)

| Check | Result |
|---|---|
| `npx eslint .` | Clean for the repository. The only reports are in git-ignored `tmp/` scratch files |
| TypeScript, scoped config (the full config runs out of heap on this machine) | Clean |
| `npm run test:unit` | 125 pass, 4 fail. The four are the known Windows-only path and file-mode cases (`document-store` ×2, `recovery`, `warm-routes`), unrelated. The new `work-view.test.ts` passes (5) |
| `tests/browser/my-work.spec.ts` | **10 of 10 pass on desktop-chromium and on mobile-chromium** (20 in the final run), against the real application and PostgreSQL. The scenario is rebuilt by `scripts/my-work-scenario.ts` through the ordinary API for the "SYN Company B coordinator" identity, which owns no other work, so the counts reconcile exactly |
| Updated `shell`, `crm-i2` (CA-13) and both `intake` P03 My Work cases | Pass on both projects. On a second local run the P03 "unavailable and empty queues" case fails at its last line, which expects exactly one customer with a fixed name and finds the ones earlier runs left in the persistent development database; its My Work steps pass, and a fresh database has no such leftovers |
| `quality-states.spec.ts` | **Not runnable locally**: its own fixture fails on a fixed-date crew booking before any screen. Its SC-01 row was run as a temporary copy of the same steps against `/work/actions`: loaded, loading, failed, empty and denied all pass. CI is the first full run |
| Shell and Deals component proofs (`playwright.crm-ui.config.ts`) | 25 pass. 9 `login.spec.ts` cases fail **in this working tree only**: its files are CRLF, the login page hashes its inline style for its CSP, and the browser normalises the line endings. The same spec passes on an unmodified `main` checked out fresh; this branch does not touch `src/login` |
| HTTP refusal probe | Six invalid schedules refused with field errors; a pre-0028 update that would end an appointment before its start refused and the record unchanged; a stale saved-view version refused |
| `tests/database/my-work.test.ts` (six cases) and the nine amended migration assertions | **Authored, not executed**: this machine has no `ppo_synthetic_test` database and the role cannot create one. CI is the first run |
| `next build`, the compiled-application browser job, `test:http` | **Not run**: the dev server holds the working tree |
| Migration 0028 | Applied to the local `ppo_synthetic` database. Additive; no reset, no reseed |
| Contrast, computed from the rendered token values (WCAG relative luminance) | Title `#242a37` on white 14.37:1; secondary `#596779` on white 5.77:1; muted `#667181` on white 4.95:1 and on the `#f5f6f8` page 4.58:1; link `#355b80` 7.10:1; overdue `#993b2a` on `#fff1ed` 6.32:1; tag `#526078` on `#edf0f5` 5.57:1; white on the navy button 14.37:1; warning text on the notice tint 6.39:1; focus ring `#365d8b` 6.78:1 on white (3:1 needed). Every text pair meets 4.5:1; muted text on the page background has the least margin. No assistive-technology certification is claimed |

Screenshots are in the git-ignored `verification-evidence/my-work-sales-r06/`: before, both menu states at 1672×941, 1920×1080 and 1440×900, 1024×768 with and without the overlay, phone, the outcome and reschedule dialogs, the detail drawer and the other five views.

## 7. What remains open

1. **Owner decisions:** the next-activity rule (D3); outcome choices by activity type (D5); whether Sales needs its own waiting-request record (D9); an estimate review source (D10); team grants and shared views (D7, D11).
2. **UI baseline register:** My Work is **not** registered in `ui-baselines.json` or the module-workspace registry. The register requires retained, hashed design sources, a component proof and a compiled proof, and the r06 sources are not in the repository. Registering needs Dean's decision to retain them.
3. **Not claimed:** notifications, external calendar updates, attendee notification, message sending, offline capture, team capacity, production readiness, or business acceptance of any scenario.
4. **Hosted demo:** `scripts/demo-upgrade.ts` carries the reviewed note for 0028. No hosted upgrade has been run.
