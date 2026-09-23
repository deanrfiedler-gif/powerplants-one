# Service requests native refinement (SV-01, SV-02) — proposed design

<!-- versioning: git; committed history is authoritative -->

**Status:** Proposed design. Presentation decisions D1, D2, D5 and D6 are applied under Dean's delegation of 23 September 2026 (see [Delegation](#delegation)); D3 and D4 remain open. The board is not an accepted baseline and has no recorded owner visual review. No application code, contract, migration, permission, guide article or accepted UI baseline is changed by this record.
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
| Refinement design board | Private claude.ai design canvas "Page Refinement Audit", page "SV-01/02 Service requests": nine frames of the module interior. The shell is a separate module and is not drawn | Proposed composition prepared on Dean's instructions (see [Delegation](#delegation)). Not an accepted baseline |
| House register pattern | [EN-07 r03 desktop mockup](../reference/ui/engineering-changes/PPO-EN-07-Engineering-Change-Impact-Review-Desktop-UI-Mockup-r03.png); the EN-06 materials register table rules in `src/app/styles/engineering-materials.css` (`em-table`, `em-chip`) | Owner-refined register composition: 43 px grey sentence-case headers with column separators, 5 px status chips, a navy inset marker on the selected row, a pagination footer and a docked inspector |
| Host shell | `src/components/product-navigation.tsx`, `src/shell/module-workspaces.ts`, `src/shell/navigation.ts`; Job Pack I3 captures at 1440 × 960 and 390 × 844 | The shell's geometry (76 px rail, 64 px header), its Service tab row, and the rule that a registered module workspace with `navigation: "workspace"` hides that row |
| Native intake | `src/components/intake-screens.tsx`, [ADR-0008](ADR-0008-p03-customer-intake.md) | Existing P03 contract: Ticket states New, NeedsInformation and Triaged |
| Vocabulary | [PPO-STD-001 §4.2](../standards/naming-conventions.md) | "Service request" is the preferred plain-language term; `Ticket` remains the data-contract entity |

Fixture: r02's synthetic Willowbank Horticulture and Fernbank Flower Farm records at its fixed time, 10:00 am Tuesday 15 September 2026 (Australia/Melbourne). No real customer, person or operational record is used.

## Delegation

Dean's instructions in the design session on 23 September 2026, in order:

1. "Generate the design board for this module now. Carry out any refinements and/or improvements as required."
2. On whether to draw the shell: "We haven't included them in the other designs, as the shell is a module in itself." The frames therefore show the module interior only.
3. "I am happy for you to proceed however you believe is the most professional. You can make any refinements and changes that you believe will make the design look as professional as possible. Also, I think you should refine the list view. It can even be a table that scrolls horizontally if need."

The third instruction delegates presentation choices. Under it, the recommendations for D1, D2, D5 and D6 are applied. It is not treated as authority for D3, which needs a data contract and migration, or D4, which is a closure rule. It also does not stand in for Dean's own visual review of the board, which is still pending.

## Conformance declaration

| Field | Declaration |
|---|---|
| Scope identity | `SV-01` and `SV-02`, r06 state D, P1, reviewer Service coordinator. r02 declares coverage of SC-04, SVC-01, SVC-02 and SVC-06; the r06 SV family lists SVC-01, SVC-02, SVC-03, SVC-05, SVC-10, SVC-11 and SVC-12. No parent ID is added or changed. Increment: presentation refinement for native integration of r02 |
| Page type | SV-01: **Register / worklist**, with Board and List as two presentations of one collection. The List preview uses the **Work queue + persistent detail** variant. SV-02: **Record detail** with tabs. Triage: **Form / guided workflow**, docked right on desktop and full screen on a phone |
| Reused components | Host, not drawn: `application-shell`, which supplies the rail, breadcrumb, global search, quick add and account. Drawn: `sales-board` cards, which r02 already derived from Deals r35; the house register table (`sales-table`, with the EN-06/EN-07 register rules above); `drawer` for the preview panel; `tabs`; `fields`; `validation`; `status`; `buttons`; `mobile-form` |
| Source authority | See Sources and Delegation. r02 is a delivered design, not an accepted baseline. The refinements are proposals; D1, D2, D5 and D6 are applied under delegation |
| Incoming handover | Permitted Ticket records at their current version, with customer, site, facility and equipment context from the CS pages (`CS-04` dependency). Registers and record pages read only what the actor may see; no source is modified by viewing or preview |
| Outgoing handover | Triage produces an owned action and a customer-update commitment on the request. Work & visits hands on to Work orders (`SV-03`) and Schedule (`SV-04`, `PL-01`); the request never creates a booking. A Finance referral stays with Finance. Resolution review produces Resolved; closure needs a customer contact recorded after that review. Nothing is sent to a customer |
| Exceptions and recovery | A stale revision refuses the save and keeps entries (r02 rule retained). Cancelling a drag keeps the original lane. Drawn states: empty lane, overdue commitments, missing site and equipment, unknown values in the table, a validation error summary. Not drawn: loading, denied, filtered-empty and a revoked preview |
| Departures | R1–R13 below, all proposed |
| Application integration (proposed) | Canonical routes `/service/tickets` (layout `full-bleed`) and `/service/tickets/[id]` (layout `padded`), registered in `moduleWorkspaces` with `navigation: "workspace"` like CS-05 and PJ-09 (D6, applied under delegation). The shell owns navigation and viewport height; the module owns its interior. Scroll owners: the board surface, the table scroller (both axes) and the record body |
| Verification | Board frames authored as module interiors: 1364 × 896 (a 1440 × 960 window less the 76 px rail and 64 px header) and 390 × 716 (a 390 × 844 phone less the 64 px header and 64 px bottom navigation). The phone triage dialog covers the full 390 × 844 viewport. The generated register frames were checked for balanced markup only. The frames were not rendered or inspected in a browser in this session; no native comparison exists; no device, zoom or screen-reader review is claimed. Repository checks are listed in the pull request |

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
| R13 | A five-column table inside a rounded card: case and customer, status and priority, owner, next update, open actions | The house register table. Eighteen columns, 3,364 px wide, scroll horizontally behind a sticky *Request* column. Each column is described in the SV-01 contract. Grey 43 px sentence-case headers, 62 px rows, unknown values stated in amber words, a *Columns* control, *Sort*, and a footer with the count and *1–5 of 5* pagination. Selecting a row docks a 420 px preview panel beside the table | r02's table combined unlike facts in single cells and left out equipment, affected areas, linked work, route and category, which r06 SV-01 asks the register to show. A horizontally scrolling table carries them without truncation, and matches the owner-refined EN-06/EN-07 registers |

Notices use an even border without a coloured edge rule, consistent with the [notice accent rule departure](notice-accent-rule-departure.md). That record is also still proposed.

## Board frames

| Frame | Module interior | State shown |
|---|---|---|
| 1. Register · board | 1364 × 896 | Manager view, open scope, five requests, two empty lanes collapsed |
| 2. Register · list | 1364 × 896 | The full table at scroll position zero; *Action owner* is partly visible to show the horizontal scroll |
| 3. Register · list with preview | 1364 × 896 | TKT-000202 selected; the preview shows two overdue commitments |
| 4. Triage from the board | 1364 × 896 | Drag New → Triaged opens the docked form; the board is unchanged behind it |
| 5. Request overview | 1364 × 896 | TKT-000201, New, Urgent; recurrence notice; update due in 30 min |
| 6. Resolution review | 1364 × 896 | TKT-000206; proposed resolution, cited evidence, closure checks |
| 7. Phone register | 390 × 716 | List only, queue chips |
| 8. Phone request overview | 390 × 716 | TKT-000201 with sticky actions |
| 9. Phone triage form | 390 × 844, full-screen dialog | Validation state: response route missing |

No repository image of these frames exists yet. The missing images are recorded in the page contracts.

## Decisions

| # | Question | Status | Recommendation and reason |
|---|---|---|---|
| D1 | Use "Service request" in place of "Service case" throughout the module? | Applied under delegation | Yes. It is the adopted vocabulary and the live navigation label; a second term for the same Ticket would need an explicit mapping |
| D2 | Collapse empty lanes, or keep six fixed-width lanes? | Applied under delegation | Collapse. It removes horizontal scrolling at 1440 px while keeping every stage visible and droppable. Reconsider if owner review finds collapsed lanes hard to target |
| D3 | Active, Waiting, Resolved and Closed go beyond the native P03 states. How are they authorised? | **Open** | Not a presentation choice. Sequence a separate SC-04 extension contract, with an ADR and migration, before native build. Until then a native increment can deliver the refined register for the three existing states only |
| D4 | Should "Site and equipment not recorded" block closure? | **Open** | Keep it advisory. Organisation-level requests such as the invoice query legitimately have no site; a guard would need a category rule first |
| D5 | Where does Include closed live? | Applied under delegation | In the scope filter. Closed is a retention view, not an attention queue |
| D6 | Register SV-01 and SV-02 as module workspaces with `navigation: "workspace"`, which hides the shell's Service tab row? | Applied under delegation | Yes, following every module workspace registered so far: the CS record pages, Facilities, Acceptance, Deals, the estimate wizard, fertigation and specialist configurations. The rail carries the same Service destinations. The cost is that the tab row shows on the other Service pages but not these two until they are refined. If the row is kept, the interior is 44 px shorter on desktop and 48 px on a phone |

## Known, assumed and uncertain

- **Known:** r02's bytes, model rules and fixture; the live Service navigation labels and rail order; native P03 states; the PPO-STD-001 vocabulary; r06 SV-01/SV-02 scope text and checks; the EN-06/EN-07 register rules.
- **Assumed:** the Job Pack I3 captures represent the current shell geometry; the default visible column set is all eighteen columns, with the *Columns* control able to hide any but *Request*.
- **Uncertain:**
  - whether collapsed lane targets meet owner and device review;
  - whether the horizontal scroll is discoverable enough without a visible edge shadow on the sticky column;
  - exact behaviour at 1024 × 768 and 320 px, which is not drawn;
  - whether bulk selection is needed. No bulk command exists in r02 or P03, so the table has no selection checkboxes, unlike EN-07.

## Next steps

1. Dean reviews the board. Record his review, or any change he asks for, here with the date and his words.
2. Retain the board as a reference with captures at the drawn viewports, or issue an r03 HTML successor. Preserve r02's bytes.
3. For D3, prepare the SC-04 extension contract and ADR before any migration. Settle D4 with it.
4. Build natively under the [application integration gate](../standards/html-module-conformance.md#application-integration-gate), then update the page guides, captures and review records from actual evidence.

## Related

- [Service Cases & Triage design and handover](service-cases-workspace-design.md) (r01 and r02).
- Working contracts: [`scope-sv-01.md`](../design/development/pages/scope-sv-01.md), [`scope-sv-02.md`](../design/development/pages/scope-sv-02.md), [`route-service-tickets.md`](../design/development/pages/route-service-tickets.md), [`route-service-tickets-id.md`](../design/development/pages/route-service-tickets-id.md).
- [BP-07 Service operations](../blueprints/BP-07-service-operations.md), [ADR-0008](ADR-0008-p03-customer-intake.md).
