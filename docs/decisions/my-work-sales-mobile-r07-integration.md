---
document_id: PPO-MYWORK-MOBILE-INT
revision: r01
date: 2026-09-20
owner: Dean Fiedler
status: Implemented on a local branch for owner review; device acceptance, visual acceptance, business acceptance and the accepted UI baseline register remain separate
source_commit: e6492a7f75632957633bf765f007b12137c0d6fb
---

# My Work on a phone: application integration of mobile r07

**Scope:** SC-01 My Work (`/work`) at phone width, under adopted F06 and the personal part of F04. **Authority:** on 20 September 2026 Dean supplied the mobile build report r02 (`PPO-MYWORK-SALES-MOBILE-BUILD`), the mockup board *My Work · Mobile r07* and the VS Code implementation prompt r02, and instructed that the accepted design be built in the application, verified locally and handed over without deploying, pushing or merging. The brief makes routine design and engineering decisions the implementer's and asks for an honest record. This is that record. It extends [the Sales Overview integration record](my-work-sales-overview-integration.md) (`PPO-MYWORK-INT`), whose decisions D1–D15 still hold; where the two differ at phone width, this one governs.

This is a change to a synthetic prototype. Nothing here is a production claim, a business acceptance, evidence of a connected weather, mail, map or text-extraction provider, or a result from a physical phone.

## 1. References and what each was used for

| Reference | Location | Used for |
|---|---|---|
| Mobile build report r02 | Supplied in the conversation; **not in the repository** | Behaviour, scope, the two refinements over the raster, acceptance criteria M01–M20 |
| Mockup board r07 (one PNG, three panels) | Supplied in the conversation; **not in the repository** | Composition of the personal overview, the expanded agenda and the Create sheet. Inspected as an image |
| Theme style board r22 | `docs/reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html` | Tokens, already declared on `#ppo-my-work` by `my-work.css`; no second palette was added |
| My Work & Action Centre r01 | `docs/reference/ui/my-work/` | The six views and their source-owned boundaries |
| Current application | `src/`, `db/` at `e6492a7f` | Every route, permission, command and capability named below |

## 2. Decisions

| # | Decision | Evidence and effect |
|---|---|---|
| M1 | **One route, two presentations, chosen in the browser.** `/work` renders the desktop overview above 780px and the r07 overview at or below it, the shell's own phone breakpoint. Until the browser has answered, neither is painted. | A server guess would paint the desktop toolbar on a phone before hydration. Both presentations use the same reads, dialogs and commands; the desktop component is unchanged apart from honouring a Customise request from the menu. |
| M2 | **The weekly agenda is its own read**, `GET /api/v1/work/agenda?day=`. A day holds every permitted active activity whose anchor (an appointment's start, else its deadline) falls on that Brisbane day; the count covers the whole scope, not the rows returned. | The overview read answers "overdue" and "due today", which are different questions. A deadline that passed this morning is on today's agenda **and** overdue, so the two counts are never added. Today is requested without a date, so the server's own day answers across midnight. Completed work on the day is counted separately and said, never listed as outstanding. |
| M3 | **"By" marks a deadline, a bare time a booked appointment, "Any time" a date-only task.** The agenda's time column uses the 24-hour clock of r07 ("9:30", "14:30"). | Pure rules in `work-view.ts`, unit-tested against the report's Monday. The rest of the application, including the detail sheet, uses the 12-hour clock ("2:30 pm"); the agenda column follows the accepted raster. **Open for Dean:** one clock everywhere. |
| M4 | **"Next" is the existing rule**: the first appointment that has not reached its planned end, shown only on today's agenda. | `nextScheduleId`, unchanged. A deadline is never "Next". |
| M5 | **Needs attention lists what is raised, in a fixed priority**: overdue activities, reviews awaiting the reader's decision, opportunities without a next activity, activities needing a date. The first three raised are shown; "View all" opens My actions. A category that could not be read says so and is never a zero. | Different units are never summed. Reviews are labelled "awaits your decision", not "due today": the sources record no review due date (D10). Undated work that does not fit the three rows is reachable through View all, and the list says how many categories it left out. |
| M6 | **Both opportunity entries open one queue**, a sheet over `GET /api/v1/work/gaps`, which is `listPlanningGaps` at a larger window under the same owner scope. Plan activity closes the sheet and opens the existing plan dialog. | The overview read returns a three-item preview, too few for a queue. The rule is still D3's (`next_action_state = 'Needed'`). The sheet links on to Opportunities with the same filter and owner. |
| M7 | **Rows open details; actions live in the detail sheet.** The existing drawer, full-screen on a phone, now offers **Complete** (was "Record outcome") and **Set date** for an undated activity, and states the time zone. | One target per row, no checkbox, no repeated buttons. The commands are the existing `complete` and `update`. |
| M8 | **Create is a menu built from what the shell already says this identity may create.** Opportunity, Lead, Contact and Organisation are the shell's permission-filtered quick actions and open their canonical routes; Activity opens the existing plan dialog (or `/work/new` without Sales access). An option the identity cannot use is absent; the order of the rest never changes. | No create route was invented and no permission is bypassed. With another agenda day in view, Activity starts on that day as a date-only value and the form says so. |
| M9 | **The floating control belongs to the module frame, not the page.** The frame already ends above the bottom bar and the safe area. The page keeps 88px at its end and 96px of scroll padding, and row actions sit at the leading edge. | The last record scrolls completely above the control; a focused or linked-to control is never brought to rest beneath it; "Follow up" can never be under it. See departure MP-1 for what a floating control still does mid-scroll. |
| M10 | **The Sales phone bar is five icon-only cells**: My Work, Opportunities (`/sales/opportunities`), Activities (`/calendar` on today's Brisbane day), Contacts (`/people`), More. Other workspaces keep their labelled bar. | "Activities" has no route of its own; the Calendar page is the application's one broader activity view (activities due by day, and meetings). The More button's accessible name changes from "Menu" to "More" for every workspace: its visible text was already "More", and a phone now has a second menu in the header. |
| M11 | **A workspace that mounts its own menu gets a one-row phone header**: menu, title, search, page guide, account. The rule is keyed to the header's menu slot, so only My Work is affected. | This also lifts shell drift SD-1 **for My Work**: the older three-column grid no longer pushes search and the page guide onto a second row there. Every other page keeps the header it has; SD-1 remains open for them. The in-page "Show menu" bar is removed from all six views. |
| M12 | **Weather preferences are per-person presentation in the browser** (shown or hidden, last place chosen), beside the existing layout preference (D8). | No server preference store exists. They hold no forecast and imply no provider. |

## 3. Capability status

Status words as the report asks: *connected*, *UI-ready, unconfigured*, *deferred*, *blocked by a named missing contract*.

| Capability | Status | What exists, and what the page does |
|---|---|---|
| **Emails** | **Connected to the synthetic mailbox; unread count blocked.** | `/email` is the private synthetic mailbox (`email.read`). The tile opens it, or says "No access". **No unread badge is shown to anyone**: `ppo.email_messages` records no read state, so no authoritative count exists. No real mailbox is connected; the Gmail schema of ADR-0021 has no application code. |
| **Weather** | **UI-ready, unconfigured.** | `GET /api/v1/work/weather` defines the contract (`src/activities/work-weather.ts`) and answers `not_configured`; the card says "Weather is not connected". Available, stale, unavailable, failed and hidden states, the forecast sheet, manual location and on-request device location are built and proved against a stubbed read. **Missing:** a provider adapter, which needs its own ADR (credentials, cost, attribution, caching), and a saved workspace location. The r07 Brisbane values exist only in `tests/helpers/my-work.ts`. |
| **Map** | **Deferred**, as the brief asks. | No map, geocoding or directions provider exists. `ppo.sites` has address and coordinate columns that no form populates; organisations and people have no address. The tile opens an explanation and the Sites, Organisations and Contacts lists. **Missing:** address capture, a geocoder, a map provider, and a permission-scoped location read. |
| **Business-card scanning** | **Blocked by a missing contract.** | No text extraction, camera capture or image intake for contacts exists; the only upload path is PNG field evidence bound to an open attendance, immutable and undeletable. The option says so, captures nothing and offers the canonical contact form. **Missing:** an extraction service, an image intake with a retention rule, and duplicate matching for people (the application matches organisations only, and deliberately does not merge people by name or email). |

## 4. Departures from mockup r07 and report r02

| # | Departure | Reason |
|---|---|---|
| MP-1 | A floating control still passes over the trailing edge of whatever is beneath it mid-scroll ("View all", "View day", a row's chevron). | Inherent to r07's floating plus. Rows are whole-row targets, row actions are at the leading edge, the end of the page clears it, and focus never rests beneath it (M9). Keeping the trailing edge permanently clear would mean a 72px empty column or shelf, which r07 does not show. |
| MP-2 | No "1 review due today" row in the Sales scenario. | D10: only Service reports and Finance handoffs record a review, and only for a reader who may decide them. The row appears for such a reader. |
| MP-3 | No email badge; weather shows "not connected", not Brisbane 23°. | Section 3. |
| MP-4 | "Follow up" is left-aligned under the card text, not at the right. Due-today follow-ups are neutral, not red. | The report's two refinements over the raster. |
| MP-5 | Waiting cards name the requester as the source describes them; the scenario's requests are Service requests. | D9: Sales has no waiting-request entity. |
| MP-6 | "Organisation — Customer, supplier or other organisation" opens a form whose only relationship field is status (Prospect, Active, Inactive). | Any organisation can be recorded, but no supplier or multi-role field exists. M13's "non-customer relationships" is met only as far as Prospect. **Open for Dean.** |
| MP-7 | The header is 64px with the account avatar's existing name ("Change identity" locally). Secondary guide access was not moved into the menu. | Existing shell height and controls are preserved; all five controls fit at 320px with 44px targets. |
| MP-8 | Leads left the Sales phone bar. It is a Quick Action and is found through More's search. | r07's five cells. The Deals and Leads tab row stays hidden on phones as before. |
| MP-9 | The phone overview has no filter toolbar. A saved or pinned view's criteria still apply and are stated, with "Show my work" to clear them; filters and saved views remain in My actions, and Customise overview is in the My Work menu. | r07 removes the toolbar; the report forbids removing access to work. |
| MP-10 | At 768px wide a tablet gets the phone presentation. | 780px is the shell's existing phone breakpoint, where its bottom bar appears. |

## 5. Acceptance criteria

| ID | Result | Evidence |
|---|---|---|
| M01 | Met | Phone journey 1; captures 10, 11 |
| M02 | Met for identity, date, context and every weather state; weather itself is unconfigured | Journeys 1, 8 |
| M03 | Met; Map opens its deferred state, Emails says "No access" without `email.read` | Journeys 1, 9 |
| M04 | Met | Journey 1 |
| M05 | Met | Journeys 1, 8; captures 15, 16 |
| M06 | Met | Journeys 1, 6, 7 |
| M07 | Met | Journeys 1, 2 |
| M08 | Met against relative dates in the browser, and against the report's Monday in `tests/unit/work-view.test.ts` | Journey 1; unit tests |
| M09 | Met; each change re-read after a reload or through the API | Journeys 4, 5, 6 |
| M10 | Met | Journey 7 |
| M11 | Met | Journey 3; capture 13 |
| M12 | Honest absence; no review or duplicate flow exists to test | Journey 3; section 3 |
| M13 | Canonical forms reused; non-customer relationships only as far as Prospect (MP-6) | Journey 3 |
| M14 | Reviews open the source record (D10), unchanged. Notifications do not exist (D12) | Earlier record |
| M15 | Met for the identities tried (scenario owner, observer, coordinator); other departments' bars and pages unchanged | Journey 9; shell, CRM and intake specs |
| M16 | Met for loading, empty day, all-clear, partial, failed, denied, offline notice and save recovery (existing dialogs) | Journeys 2, 8, 9 |
| M17 | Met at 320, 360, 390, 430, 667×375 and 768, with MP-1 stated | Journey 9; captures 12, 20, 24, 25 |
| M18 | Met | Journey 1 computed styles |
| M19 | Met in browser emulation. **No physical iOS or Android device was used** | Journeys 1, 3, 9 |
| M20 | Met | `my-work.spec.ts` 10 of 10 on desktop; captures 22, 23 |

## 6. Verification on 20 September 2026 (local, Windows, dev server on 127.0.0.1:3000)

| Check | Result |
|---|---|
| `npx eslint .` | No errors. One pre-existing warning in `shell-controls.tsx`, untouched here |
| TypeScript, scoped config (the full config runs out of heap on this machine) | Clean |
| `npm run test:unit` | 127 pass, 4 fail: the known Windows-only path and file-mode cases (`document-store` ×2, `recovery`, `warm-routes`). `work-view.test.ts` passes, 7 of 7, including the two new agenda tests |
| `tests/browser/my-work-mobile.spec.ts` | **9 of 9 on mobile-chromium** (390×844, touch), against the real application and PostgreSQL; the scenario is built through the ordinary API |
| `tests/browser/my-work.spec.ts` | **10 of 10 on desktop-chromium.** Now skipped on the phone project, where the mobile spec takes over |
| `shell.spec.ts`; `crm-i2` CA-13 and r08 shell; `mobile-crm` organisation and menu; `intake` P03 My Work case | Pass on both projects. The `intake` "unavailable and empty queues" case fails at its last line on both, on a fixed customer name left by earlier runs in the persistent development database; its My Work steps pass. Known, and unrelated |
| Shell and Deals component proofs (`playwright.crm-ui.config.ts`: `crm-board`, `desktop-shell`, `crm-r38`) | 15 pass, 18 skipped by project |
| Sizes inspected | 320×640, 360×780, 390×844, 430×932, 667×375 landscape, 768×1024, 1280×800, 1440×900. No sideways page scroll at any. Long unbroken names wrap at 320. In a 390×420 viewport, standing in for an open keyboard, the form's Save stays in view and inputs are 16px |
| Specs changed only by the More button's name (`quality.spec.ts`, `tests/demo/ui.spec.ts`) | **Edited, not run**: the first fails locally at the planner for unrelated reasons, the second targets the hosted demo |
| `next build`, the compiled-application job, `test:http`, `test:db` | **Not run**: the dev server holds the working tree, and this machine has no test database. No migration was added |

Screenshots are in the git-ignored `verification-evidence/my-work-mobile-r07/`.

## 7. What remains open

1. **Owner decisions:** one clock format (M3); an organisation role or supplier field (MP-6); whether the trailing edge should be kept clear of the floating control at a cost in width (MP-1); a weather provider and its ADR; address capture and a map provider; an extraction service for card scanning.
2. **Device acceptance:** safe-area insets, the real on-screen keyboard, Android Back and text enlargement were exercised only as far as desktop Chrome's phone emulation allows.
3. **UI baseline register:** as before, My Work is not registered; the r02 report and r07 image are not in the repository.
4. **Not claimed:** a connected inbox, live weather, a map, card scanning, notifications, offline capture, production readiness, or business acceptance of any scenario.
