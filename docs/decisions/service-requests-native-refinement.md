# Service requests native refinement (SV-01, SV-02) — proposed design

<!-- versioning: git; committed history is authoritative -->

**Status:** Proposed design. On 23 September 2026 Dean accepted every recommendation in this record (see [Owner decision](#owner-decision-23-september-2026)). D1, D2, D5 and D6 stand. D3 follows the sequenced path: a native increment for the three existing states, with the lifecycle extension drafted as proposed [ADR-0043](ADR-0043-service-request-lifecycle.md). D4 is advisory. Dean's visual review of the board has not yet been recorded, so the board is not an accepted baseline. This record changes no application code, migration, permission, guide article or accepted UI baseline.
**Owner:** Dean Fiedler.
**Raised:** 23 September 2026.
**Covers:** `scope:SV-01` Service desk and triage worklist (`/service/tickets`) and `scope:SV-02` Request detail and communication timeline (`/service/tickets/[id]`).

## Why this page

A register audit on 23 September 2026 at `main` `5499df4` looked for the next page not yet refined. It took the twelve r06 "D · Dedicated refinement" items in retained build-rank order and treated a page as refined when its working design contract had moved past the imported template and its build was merged. CS-01, CS-02, CS-04 and CS-05 are refined. FI-01 is in progress in PR #292. SV-04 (rank 3) has no linked design reference, and FI-07 (rank 7) has no reference or standalone route. SV-01 (rank 56) was the first remaining P1 page with a delivered design ([Service Cases & Triage r02](service-cases-workspace-design.md)) and no native refinement. It is also the first step of the PP-01 service journey, which the [design workspace handover](../delivery/development-workspace-handover.md) names as the priority. SV-02 shares the same reference and is refined with it.

The audit also found register gaps, which are recorded here and not corrected by this record:

- `scope:CS-05` still reads `unbuilt` with a template contract, although Facilities is native under ADR-0037.
- `PPO-Scheduling-and-Appointments-Workspace-r01.html` is cited nowhere outside `docs/reference/ui/service/`, and `scope:SV-04` has no reference.
- `scope:AD-07` is marked `refine`, but no `/admin/audit` route exists.

## Sources

| Source | Identity | Authority |
|---|---|---|
| Service Cases & Triage r02 | [`docs/reference/ui/service-cases/PPO-Service-Cases-and-Triage-Workspace-r02.html`](../reference/ui/service-cases/PPO-Service-Cases-and-Triage-Workspace-r02.html), SHA-256 `23e92f96f495690e5670d664ac09e1063b8f9473679c39d7fa77b1e13d18fa5f` | Standalone design delivered for review; native visual/device acceptance pending. The copy Dean attached on 23 September 2026 is byte-identical |
| Dean's r02 desktop captures | Two browser screenshots at 1920 px width, attached to the design session on 23 September 2026; not retained in the repository | Observation of the r02 register at desktop width |
| Refinement design board | Private claude.ai design canvas "Page Refinement Audit", page "SV-01/02 Service requests", version 8: twenty-four frames of the module interior (thirteen at version 7). The shell is a separate module and is not drawn | Proposed composition prepared on Dean's instructions (see [Delegation](#delegation) and [Owner decision](#owner-decision-23-september-2026)). Not an accepted baseline |
| Board images r01 | [`docs/reference/ui/service-cases/native-refinement-r01/`](../reference/ui/service-cases/native-refinement-r01/README.md): thirteen PNG renders of canvas version 7, with sizes and SHA-256 in its README | Proposed design images for paired review. Not application captures |
| Board images r02 | [`docs/reference/ui/service-cases/native-refinement-r02/`](../reference/ui/service-cases/native-refinement-r02/README.md): twelve PNG renders of canvas version 8, namely frames 14–24 and a corrected frame 8. Its README indexes all twenty-four frames and the set holding each current image | As r01. Frame 8 supersedes r01's; the other r01 images stay current |
| House register pattern | [EN-07 r03 desktop mockup](../reference/ui/engineering-changes/PPO-EN-07-Engineering-Change-Impact-Review-Desktop-UI-Mockup-r03.png); the EN-06 materials register table rules in `src/app/styles/engineering-materials.css` (`em-table`, `em-chip`) | Owner-refined register composition: 43 px grey sentence-case headers with column separators, 5 px status chips, a navy inset marker on the selected row, a pagination footer and a docked inspector |
| Host shell | `src/components/product-navigation.tsx`, `src/shell/module-workspaces.ts`, `src/shell/navigation.ts`; Job Pack I3 captures at 1440 × 960 and 390 × 844 | The shell's geometry (76 px rail, 64 px header), its Service tab row, and the rule that a registered module workspace with `navigation: "workspace"` hides that row |
| Native intake | `src/components/intake-screens.tsx`, `src/service/intake.ts`, [ADR-0008](ADR-0008-p03-customer-intake.md), [ADR-0009](ADR-0009-p04-work-scope-readiness.md) | Existing P03 commands move a Ticket only between New, NeedsInformation and Triaged. P04 links work orders to tickets and requires linked tickets to be Triaged before authorisation |
| Ticket lifecycle | Migration `0001-foundation.sql` status check; the `TicketState` enum in the [service data dictionary](../contracts/service-data-dictionary.md); [BP-07](../blueprints/BP-07-service-operations.md) §6 TR-15; API-C23 in the [service API](../contracts/service-api.md#3-command-catalogue) | The schema and dictionary already hold Active, Waiting, Resolved, Closed and Cancelled. TR-15 and API-C23 define the later transitions logically. No physical command reaches them yet |
| Vocabulary | [PPO-STD-001 §4.2](../standards/naming-conventions.md) | "Service request" is the preferred plain-language term; `Ticket` remains the data-contract entity |

Fixture: r02's synthetic Willowbank Horticulture and Fernbank Flower Farm records at its fixed time, 10:00 am Tuesday 15 September 2026 (Australia/Melbourne). Frame 5 adds one new fictional call, from Priya Shah at 10:05 am, to show the duplicate check; it is not an r02 record. No real customer, person or operational record is used.

## Delegation

Dean's instructions in the design session on 23 September 2026, in order:

1. "Generate the design board for this module now. Carry out any refinements and/or improvements as required."
2. On whether to draw the shell: "We haven't included them in the other designs, as the shell is a module in itself." The frames therefore show the module interior only.
3. "I am happy for you to proceed however you believe is the most professional. You can make any refinements and changes that you believe will make the design look as professional as possible. Also, I think you should refine the list view. It can even be a table that scrolls horizontally if need."

The third instruction delegates presentation choices. Under it, the recommendations for D1, D2, D5 and D6 were applied. It was not treated as authority for D3, which needs lifecycle commands and a migration, or D4, which is a closure rule. Dean settled both in his decision below.

## Owner decision, 23 September 2026

Asked which decisions were needed from him, Dean was given the open decisions, the delegated choices, the assumptions and the next steps, each with a recommendation. He replied:

> "I'm happy for you to proceed however you believe is the most professional. I will accept all of your recommendations so the design for this module is as professional as possible."

That reply settles the following:

| Item | Recommendation accepted |
|---|---|
| D1, D2, D5, D6 | Confirmed as applied |
| D3 | Sequenced path. First, a native increment presents the refined register and record for the three states the application already moves a request through (New, NeedsInformation, Triaged). In parallel, the lifecycle extension is drafted as [ADR-0043](ADR-0043-service-request-lifecycle.md), **proposed**, for Dean's review. No migration is written until he accepts it. Frames 8 (Work & visits) and 10 (Resolution & review) need that extension before they can be built |
| D4 | Advisory. Missing site and equipment is a closure warning, not a guard |
| D7 | No bulk selection in the table until a bulk command is specified |
| D8 | A follow-up call about an open request is recorded on that request as a customer statement (*Reported symptom* basis). It never changes that request's priority, owner or stage |
| Fixture | The fictional Priya Shah call at 10:05 am stays in frame 5 (and is reused in frame 18, drawn afterwards) |
| Next steps | Mark PR #294 ready for review and watch it; draw the missing layouts; correct the register gaps in a separate pull request |

**What it does not settle.** The reply accepts recommendations. It does not record that Dean has looked at the frames, so it is not recorded as his visual review. The board becomes an accepted baseline only when that review is recorded with its screen and device scope ([conformance standard, Baseline treatment](../standards/html-module-conformance.md#baseline-treatment)). Nor does it accept ADR-0043, which stays proposed until he reviews it.

**One sequencing change.** The recommendation was to draw the missing layouts after his review. They were drawn straight away instead, so that one review covers the whole set; see [Board frames](#board-frames).

## Conformance declaration

| Field | Declaration |
|---|---|
| Scope identity | `SV-01` and `SV-02`, r06 state D, P1, reviewer Service coordinator. r02 declares coverage of SC-04, SVC-01, SVC-02 and SVC-06; the r06 SV family lists SVC-01, SVC-02, SVC-03, SVC-05, SVC-10, SVC-11 and SVC-12. No parent ID is added or changed. Increment: presentation refinement for native integration of r02 |
| Page type | SV-01: **Register / worklist**, with Board and List as two presentations of one collection. The List preview uses the **Work queue + persistent detail** variant. SV-02: **Record detail** with tabs. Triage: **Form / guided workflow**, docked right on desktop and full screen on a phone |
| Reused components | Host, not drawn: `application-shell`, which supplies the rail, breadcrumb, global search, quick add and account. Drawn: `sales-board` cards, which r02 already derived from Deals r35; the house register table (`sales-table`, with the EN-06/EN-07 register rules above); `drawer` for the preview panel; `tabs`; `fields`; `validation`; `status`; `buttons`; `mobile-form` |
| Source authority | See Sources, Delegation and Owner decision. r02 is a delivered design, not an accepted baseline. The refinements are proposals. D1–D8 are accepted by Dean; his visual review is pending |
| Incoming handover | Permitted Ticket records at their current version, with customer, site, facility and equipment context from the CS pages (`CS-04` dependency). Registers and record pages read only what the actor may see; no source is modified by viewing or preview |
| Outgoing handover | Triage produces an owned action and a customer-update commitment on the request. Work & visits hands on to Work orders (`SV-03`) and Schedule (`SV-04`, `PL-01`); the request never creates a booking. A Finance referral stays with Finance. Resolution review produces Resolved; closure needs a customer contact recorded after that review. Nothing is sent to a customer |
| Exceptions and recovery | A stale revision refuses the save and keeps entries (r02 rule retained). Cancelling a drag keeps the original lane. Drawn states: empty lane, overdue commitments, missing site and equipment, unknown values in the table, a validation error summary, a possible duplicate at capture, and the register states sheet (loading, no open requests, no matches, could not load, read only, changed while moving). Not drawn: denied access to a single record and a revoked preview |
| Departures | R1–R17 below, all proposed |
| Application integration (proposed) | Canonical routes `/service/tickets` (layout `full-bleed`) and `/service/tickets/[id]` (layout `padded`), registered in `moduleWorkspaces` with `navigation: "workspace"` like CS-05 and PJ-09 (D6, applied under delegation). The shell owns navigation and viewport height; the module owns its interior. Scroll owners: the board surface, the table scroller (both axes) and the record body |
| Verification | Board frames authored as module interiors: 1364 × 896 (a 1440 × 960 window less the 76 px rail and 64 px header) and 390 × 716 (a 390 × 844 phone less the 64 px header and 64 px bottom navigation). The phone triage dialog covers the full 390 × 844 viewport. Every frame was rendered in Chromium at 1 CSS px per image px, inspected, and checked for content overflowing its box; the audit below records what that found. The renders are retained as board images r01. No native comparison exists; no device, zoom or screen-reader review is claimed. Repository checks are listed in the pull request |

## Refinements (proposed departures from r02)

| # | r02 | Proposed | Reason |
|---|---|---|---|
| R1 | Own masthead, "Interactive preview" pill, information button and Service Manager role switch | Module interior only. The shell, a separate module, supplies navigation, the breadcrumb that carries the page identity, search and account; it is not drawn. Page information comes from the shell icon and the role from the signed-in identity | Conformance: the shell owns navigation, branding, search and user context |
| R2 | One tab strip mixes the register with record views; a selected-case header sits above the register | `/service/tickets` is the register. `/service/tickets/[id]` owns Overview, Triage & actions, Work & visits, Evidence & updates and Resolution & review | Register and record are separate page types and routes |
| R3 | Title band, six 78 px queue tiles and a two-row filter card before the board | A 60 px toolbar and a 52 px queue row. The toolbar holds Board/List, the scope menu, search, Filters (owner, priority, customer, site, equipment and category), Columns in List, Saved views and *Log a request*. The queue row holds the six queue toggles with counts, the visible count and *Sort*. The lanes start 112 px into the module, 176 px from the top of a 1440 × 960 window | In Dean's 1920 px captures the lane headings began about 740 px down the page and the first cards were cut off by the window edge. Equipment is now a filter, as r06 SV-01 requires |
| R4 | Six fixed lanes (seven with Closed); Resolved clipped at 1920 px | Empty lanes collapse to 56 px, stay drop targets and expand on drag-over | No sideways scroll at 1440 px (D2) |
| R5 | Flag button and priority flag duplicated; truncated attention chips; duplicate avatars when owner and actor are the same; tick icon on "Manager decision required" | One priority signal; chips wrap; an overdue action is stated once, in the next-action block; the owner appears once, in the footer; a warning icon where someone must act and a tick only for a completed positive state | Status meaning must not depend on truncated text or contradict its icon. Matches the EN-06 chip rule |
| R6 | "Log a case" and "Open selected case" both primary | "Log a request" is the only primary action on the register; *Open request* is the primary action in the preview panel. Opening is by title; the eye button or a row selection opens the preview | One primary action per surface; the conformance rule places snapshots in a right-side panel |
| R7 | Absolute due times ("Due 15 Sept, 10:30 am") | Recorded commitments also read relative to now ("in 30 min", "1 h overdue") | Faster triage. These are recorded commitments, not an invented service level (r06 SV-01) |
| R8 | Related cases in a lower section of the workspace | A possible recurrence (same equipment, earlier request) appears as a notice at the top of the record, with Compare and Link as related | TKT-000201 repeats TKT-000205, which closed with the cause not established |
| R9 | Triage form fields in one sequence | Grouped: response decision, impact and backup, owned next action, customer commitment. The cancel label states that the request stays in New | Same fields and rules; clearer order and outcome |
| R10 | Resolution review in a separate tab body | The evidence's scope limit and the closure checks appear before the Accept and Return buttons | The reviewer decides with the limits visible |
| R11 | Below 1024 px, List with a note | Phone: list only, queue chips, filters in a sheet, sticky record actions, full-screen triage form with an error summary | `mobile-form` component; 16 px inputs and 44 px targets |
| R12 | "Case" throughout | "Service request" in labels; `SYN-PPO-TKT` references and the `Ticket` entity unchanged | PPO-STD-001 §4.2 and the live navigation label (D1) |
| R13 | A five-column table inside a rounded card: case and customer, status and priority, owner, next update, open actions | The house register table. Eighteen columns, 3,364 px wide, scroll horizontally behind a pinned *Request* column that casts an edge shadow once scrolled; a right-edge shadow shows there are more columns. Times and linked work use two-line cells. Each column is described in the SV-01 contract. Grey 43 px sentence-case headers, 62 px rows, unknown values stated in amber words, a *Columns* control, *Sort*, and a footer with the count and *1–5 of 5* pagination. Selecting a row docks a 420 px preview panel beside the table | r02's table combined unlike facts in single cells and left out equipment, affected areas, linked work, route and category, which r06 SV-01 asks the register to show. A horizontally scrolling table carries them without truncation, and matches the owner-refined EN-06/EN-07 registers |
| R14 | *Log a case* opens a form with no duplicate check | *Log a request* (frame 5) checks the customer, site, equipment and areas as the call is recorded. A matching open request offers *Add as a customer statement on TKT-000201*, which does not change that request's priority, owner or stage; earlier requests on the same equipment are listed. The check is a prompt, not a block | SV-01 task 1 is to capture a request without duplicating an existing one |
| R15 | Work and visits listed inside the workspace, with the request stage alongside | *Work & visits* (frame 8) keeps the request stage, work-order state and visit state apart and names who owns each. A completed visit is shown as such, and a notice states that it does not resolve the request | r06 SV-01/SV-02 check: a visit outcome cannot hide unresolved work; request state stays distinct from work-order and appointment state |
| R16 | Evidence and communications in separate lists | *Evidence & updates* (frame 9) is the communication timeline. Each entry is labelled by basis (customer statement, verified finding, customer contact, action, decision), filters by type, and an *Evidence basis* panel counts the five r02 bases | SV-02 is the request detail and communication timeline; r06 asks for customer statements to stay separate from verified findings |
| R17 | Empty panel copy only | A register states sheet (frame 6): loading, no open requests, no matches (with the hidden count), could not load, read only, and changed while moving | r06 asks for review against a normal, a missing-source and an interrupted or returned case |
| R18 | Not in r02 | **Native increment** (frame 14): the board for the three states the application moves a request through today. Cards show the recorded next action, an owned clarification with its due time, triage blockers from the existing gate, and linked work orders in their own state. Later lanes arrive with [ADR-0043](ADR-0043-service-request-lifecycle.md) | D3, accepted: the refined register can ship before the lifecycle extension without showing stages the record does not hold |
| R19 | Below 1024 px, List with a note | **At 1024 × 768** (frames 16 and 17):<br>• Register: *Saved views* move into the scope menu, *Columns* and *Sort* become icon buttons, and the queue uses short labels. The preview overlays the table rather than docking beside it.<br>• Record: the title wraps beside the actions and *Update details* moves into *More*. The progress strip keeps only the current step's note. The customer update becomes a strip above the main column, and the aside cards stack below | A docked 420 px preview would leave a 528 px table. The customer commitment must not fall below the fold |
| R20 | Not in r02 | **At 320 px** (frames 23 and 24): *Filters* becomes an icon button, queue chips scroll, titles and chips wrap, and both sticky actions stay visible | The smallest supported phone width keeps the primary action and its alternative |
| R21 | Triage and actions in one card inside the workspace | **Triage & actions** (frame 15):<br>• the response decision, with unknown impact and backup in amber;<br>• owned actions, each with its own responsible person, due time, state and *Record outcome*;<br>• clarifications.<br>*Review response* is disabled while the request waits, and its reason is shown | r02 rule: the response cannot change while a waiting dependency is open |
| R22 | Not in r02 | **Phone** capture, filters, no matches, work and evidence (frames 18–22) follow the desktop rules:<br>• the duplicate check is a sticky notice above *Create request*;<br>• filters open full screen, with the scope choice first;<br>• scrolled tab strips fade at their edges | `mobile-form`; 48 px fields and 16 px text |

Notices use an even border without a coloured edge rule, consistent with the [notice accent rule departure](notice-accent-rule-departure.md). That record is also still proposed.

## Board frames

Images: [board images r01](../reference/ui/service-cases/native-refinement-r01/README.md) for frames 1–7 and 9–13, and [board images r02](../reference/ui/service-cases/native-refinement-r02/README.md) for frames 8 and 14–24.

| Frame | Module interior | State shown | Image |
|---|---|---|---|
| 1. Register · board | 1364 × 896 | Manager view, open scope, five requests, two empty lanes collapsed | `01-register-board.png` |
| 2. Register · list, scrolled right | 1364 × 896 | Scrolled past the triage columns; *Request* pinned with its edge shadow; two-line time cells, overdue in the danger tone | `02-register-list-scrolled.png` |
| 3. Register · list with preview | 1364 × 896 | Scroll position zero; TKT-000202 selected; the preview shows two overdue commitments | `03-register-list-preview.png` |
| 4. Triage from the board | 1364 × 896 | Drag New → Triaged opens the docked form; the board is unchanged behind it | `04-register-triage.png` |
| 5. Log a request | 1364 × 896 | A second call about the same pump; the duplicate check finds TKT-000201 and the earlier TKT-000205 | `05-log-request.png` |
| 6. Register states | 1364 × 896 | Loading, no open requests, no matches, could not load, read only, changed while moving | `06-register-states.png` |
| 7. Request overview | 1364 × 896 | TKT-000201, New, Urgent; recurrence notice; update due in 30 min | `07-request-overview.png` |
| 8. Work & visits | 1364 × 896 | TKT-000203, Waiting for parts; work order in progress; visit completed | r02 `08-request-work-visits.png` (corrected; see A9) |
| 9. Evidence & updates | 1364 × 896 | TKT-000206 timeline of five entries, newest first; evidence basis counts and gaps | `09-request-evidence.png` |
| 10. Resolution review | 1364 × 896 | TKT-000206; proposed resolution, cited evidence, closure checks | `10-request-resolution.png` |
| 11. Phone register | 390 × 716 | List only, queue toggles with counts | `11-phone-register.png` |
| 12. Phone request overview | 390 × 716 | TKT-000201 with sticky actions | `12-phone-request.png` |
| 13. Phone triage form | 390 × 844, full-screen dialog | Validation state: response route missing | `13-phone-triage.png` |
| 14. Native increment · board | 1364 × 896 | The three existing states. TKT-000204 stays New because it has no site; TKT-000206 is left out | r02 `14-native-register-board.png` |
| 15. Triage & actions | 1364 × 896 | TKT-000203 waiting; response decision, one open action, no clarification | r02 `15-request-triage-actions.png` |
| 16. Register list at 1024 × 768 | 948 × 704 | TKT-000202 preview overlays the table | r02 `16-register-list-1024.png` |
| 17. Request overview at 1024 × 768 | 948 × 704 | TKT-000201; customer update strip; aside cards below | r02 `17-request-overview-1024.png` |
| 18. Phone · log a request | 390 × 716 | Scrolled to location; the match notice sits above *Create request* | r02 `18-phone-log-request.png` |
| 19. Phone · filters | 390 × 844, full-screen dialog | Scope, priority, owner, customer, site, equipment and category | r02 `19-phone-filters.png` |
| 20. Phone · no matches | 390 × 716 | Two filters hide all five requests | r02 `20-phone-no-matches.png` |
| 21. Phone · Work & visits | 390 × 716 | TKT-000203 | r02 `21-phone-work-visits.png` |
| 22. Phone · Evidence & updates | 390 × 716 | TKT-000206 timeline | r02 `22-phone-evidence.png` |
| 23. 320 px · register | 320 × 440 | Icon *Filters*; scrolling queue | r02 `23-narrow-register-320.png` |
| 24. 320 px · request overview | 320 × 440 | Chips wrap; both sticky actions visible | r02 `24-narrow-request-320.png` |

## Design audit

On Dean's request of 23 September 2026 ("Carry out an audit on it, then apply an[y] improvements that you believe are beneficial for the design"), every frame was rendered and inspected.

| # | Finding | Severity | Resolution |
|---|---|---|---|
| A1 | Phone register: the flex column shrank the queue row, so its toggles showed as empty boxes | High | Toolbar, queue and status rows no longer shrink; the list scrolls below them. Toggles now carry the desktop count badges |
| A2 | List: action due, customer update and linked work overflowed their columns in four cells per frame | High | Two-line cells: time then relative time, reference then its own state |
| A3 | Resolution review: *Return for correction* and *Accept and mark resolved* wrapped to two lines | Medium | The explanation sits above; the buttons never wrap |
| A4 | Board cards: due lines broke inside phrases ("· in / 30 min") | Medium | Action owner on one line; time and relative time on the next, each kept whole |
| A5 | List: a chip cut at the scroll edge read as a defect; nothing showed there were more columns | Medium | Right-edge shadow on the scroller; frame 2 now shows the scrolled state with the pinned column's shadow |
| A6 | Mixed label styles: uppercase eyebrows beside sentence-case headings | Low | Sentence case throughout: 13 px medium field labels and 15–17 px headings |
| A7 | The owner's role wrapped mid-phrase in *Accountability* | Low | Name and role on separate lines |
| A8 | Coverage: no frame showed SV-02's communication timeline, work and visit separation, capture with a duplicate check, or register states | High | Frames 5, 6, 8 and 9 added (R14–R17) |

Also changed: the board's work-order chip names its own state (*WO-000503 · in progress*); the invoice card's green *On track* became a neutral *Referred to Finance*, because a tick marks only a completed state; the record frames share one header, card and label style.

### Second round, after the owner decision

After Dean's decision the eleven missing layouts were drawn (frames 14–24, R18–R22). Every frame was rendered and inspected as before, and the renders were checked for overflowing content. That round found:

| # | Finding | Severity | Resolution |
|---|---|---|---|
| A9 | Frame 8 offered *Request information* while TKT-000203 waits. r02's model refuses a clarification in that state | Medium | Replaced by *Update waiting reason*. Frame 15 states the rule. Frame 8 is reissued in r02 |
| A10 | P03 triage requires a known site, so the invoice query (no site) cannot be triaged in the application today | Medium, a contract gap | Frame 14 shows it as New with its blocker. Raised as Q6 in ADR-0043 |
| A11 | First renders of the 1024 × 768 record header and the 320 px record overflowed; a phone field and the filter sheet were cut mid-control | Low | Header actions sit beside the wrapping title, the 320 px frame takes its true size, and the fields end cleanly |
| A12 | Cancellation (BP-07 §6) appeared on no frame | Low | Named in the accessible label of the *More* menu on frames 8, 15 and 17. The open menu and its dialog wait for ADR-0043 |

Still not drawn:
- denied access to a single record;
- a closed record with its retained history, and a returned resolution;
- phone Resolution & review;
- the *Cancel request* and *Record outcome* dialogs;
- phone versions of the other register states. They follow frame 6's content in the phone layout of frame 20.

## Decisions

All eight were accepted by Dean on 23 September 2026 (see [Owner decision](#owner-decision-23-september-2026)).

| # | Question | Decision | Reason |
|---|---|---|---|
| D1 | Use "Service request" in place of "Service case" throughout the module? | Yes | It is the adopted vocabulary and the live navigation label; a second term for the same Ticket would need an explicit mapping |
| D2 | Collapse empty lanes, or keep six fixed-width lanes? | Collapse | It removes horizontal scrolling at 1440 px while keeping every stage visible and droppable. Reconsider if the visual or device review finds collapsed lanes hard to target |
| D3 | Active, Waiting, Resolved and Closed have no physical command yet. How are they introduced? | Sequenced: native increment for the three existing states first; lifecycle extension drafted as proposed [ADR-0043](ADR-0043-service-request-lifecycle.md) | Stage changes are a data contract, not a presentation choice. The schema already holds the state values, so the extension adds commands, guards and fields rather than new states. Frames 8 and 10 wait for it |
| D4 | Should "Site and equipment not recorded" block closure? | No: advisory | Organisation-level requests such as the invoice query legitimately have no site; a guard would need a category rule first |
| D5 | Where does Include closed live? | In the scope filter | Closed is a retention view, not an attention queue |
| D6 | Register SV-01 and SV-02 as module workspaces with `navigation: "workspace"`, which hides the shell's Service tab row? | Yes | This follows every module workspace registered so far: the CS record pages, Facilities, Acceptance, Deals, the estimate wizard, fertigation and specialist configurations. The rail carries the same Service destinations. The cost is that the tab row shows on the other Service pages but not these two until they are refined. If the row is kept, the interior is 44 px shorter on desktop and 48 px on a phone |
| D7 | Does the register need bulk selection? | Not until a bulk command is specified | Neither r02 nor the native contract has a bulk command. Checkboxes with nothing to act on would suggest a capability that does not exist |
| D8 | How is a follow-up call about an open request recorded? | As a customer statement on that request, with the *Reported symptom* basis | It keeps one request per issue and uses r02's evidence model. It never changes that request's priority, owner or stage |

## Known, assumed and uncertain

- **Known:**
  - r02's bytes, model rules and fixture;
  - the live Service navigation labels and rail order;
  - the native P03 commands, and the P03 known-site triage gate;
  - the eight TicketState values already in the schema and dictionary;
  - the PPO-STD-001 vocabulary;
  - r06 SV-01/SV-02 scope text and checks;
  - the EN-06/EN-07 register rules;
  - Dean's decision of 23 September 2026, quoted above.
- **Assumed:**
  - the Job Pack I3 captures represent the current shell geometry;
  - the default visible column set is all eighteen columns, and the *Columns* control can hide any column but *Request*;
  - a 320 × 568 phone is the smallest supported window;
  - 1200 px is the width below which the register switches to its compact toolbar and overlay preview. The frames show 1024 × 768; the switch point is proposed, not measured.
- **Uncertain:**
  - whether collapsed lane targets pass the visual and device review;
  - how the duplicate check ranks several partial matches; frames 5 and 18 show one strong match only;
  - which of the eighteen columns the native increment can fill before ADR-0043. Commitment, waiting and evidence columns have no native source yet.

## Next steps

1. **Visual review.** Dean reviews the complete board: frames 1–24, desktop, 1024 × 768 and phone. Record his words, the date, and the screen and device scope, or the changes he asks for. Until then, the page register keeps *Desktop/mobile visual review pending*.
2. **Lifecycle extension.** Dean reviews proposed [ADR-0043](ADR-0043-service-request-lifecycle.md) and its questions Q1–Q7. Only after he accepts it are the migration and commands built, with the registry and upgrade proofs `AGENTS.md` requires.
3. **Native increment.** Build the three-state register (frame 14) and the record header, progress strip, Overview and triage form under the [application integration gate](../standards/html-module-conformance.md#application-integration-gate), following the [build plan](../delivery/service-requests-integration-build-plan.md): I1 read model, I2 register, I3 record, I4 capture, I5 conformance proof. Update the guides, captures and review records only from actual evidence. I1 merged as #298. I2 (the register) was delivered for review on 24 September 2026, with eleven native adaptations (A1–A11) listed in the build plan for the visual review in step 1.
4. **Image sets.** Board images r01 and r02 are retained unchanged. A changed frame is issued in a successor set; r02's source bytes stay unchanged.

## Related

- [Service Cases & Triage design and handover](service-cases-workspace-design.md) (r01 and r02).
- Working contracts: [`scope-sv-01.md`](../design/development/pages/scope-sv-01.md), [`scope-sv-02.md`](../design/development/pages/scope-sv-02.md), [`route-service-tickets.md`](../design/development/pages/route-service-tickets.md), [`route-service-tickets-id.md`](../design/development/pages/route-service-tickets-id.md).
- [BP-07 Service operations](../blueprints/BP-07-service-operations.md), [ADR-0008](ADR-0008-p03-customer-intake.md).
