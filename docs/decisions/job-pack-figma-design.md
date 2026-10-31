---
document_id: PPO-SVC-JOB-PACK-FIGMA-DESIGN-DEC
date: 2026-10-12
owner: Dean Fiedler
status: Owner-accepted design; read additions, native implementation, shell rollout and UI baseline acceptance separate
source_commit: 4a286d388fad17a3d443718eb25c87bf0bcac346
versioning: git
---

# Job pack design (Figma) — owner decision

On 11 October 2026 Dean asked for the Job Pack page to be designed in Figma: "This will be a very important page in the Powerplants One app, so it need to be very detailed and professional." Claude drew the Job packs register and the job pack record page on the pattern Dean accepted for [Reviews & approvals](estimate-reviews-design.md) and [Work orders](work-orders-design.md), using the shared record layout accepted for the lead record page (recorded in pull request #428, not yet merged).

On 12 October Dean asked whether Claude was satisfied with the design or thought it could be improved. Claude gave its assessment and six recommendations (A–F in section 1), and Dean replied "Proceed." Claude carried them out, then Dean accepted the result: "Proceed with your recommendations". The design reference is the named Figma version "Job pack — Pipedrive pattern, accepted".

This record supplements the [Job Pack design decision](job-pack-design.md), which holds the accepted r02 and r03 designs, decisions D1–D10 and the application integration. The r03 reference bytes are unchanged, and r03 stays the built baseline until a build implements this design.

Scope:

- Service destination `packs`, routes `/service/packs`, `/service/packs/[id]` and `/service/packs/new`.
- Register entries `route:/service/packs`, `route:/service/packs/[id]` and `route:/service/packs/new`.
- Scope `SV-05` / SC-06; requirements SVC-03, SVC-06 and OUT-09.

No parent requirement ID is added or renamed. This is a design decision. It authorises no application code, read model, route change, migration, permission, capability or deployment. It changes nothing in the pack snapshot, the OUT-09 template, the pack commands or server permission filtering.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the Job Pack page next | User decision, 11 October 2026 | "I would like to start building the Job Pack UI page now. This will be a very important page in the Powerplants One app, so it need to be very detailed and professional." |
| Reuse the accepted pattern | Prior user decisions | The [Reviews & approvals](estimate-reviews-design.md) shell, grid and record windows; the [Work orders](work-orders-design.md) grouped Service rail; the shared record layout of the lead record page (pull request #428) |
| Expand and improve the first version | User decision, 12 October 2026 | Dean asked: "Are you satisfied with the design of the Job Pack UI page, or do you think it could be expanded, improved, and made more professional?" Claude answered that it was a sound first version but not finished, and recommended A–F (below). Dean: "Proceed." |
| Accept the design and its recommendations | User decision, 12 October 2026 | "Proceed with your recommendations". Every recommendation on the notes card is adopted, and each open question takes its recommended answer |
| Earlier Job Pack decisions | Prior user decisions | D1–D5 ("Proceed based on your professional recommendations", 20 September 2026) and D6–D10 ("I adopt D6 (option A), D7, D8 (option A), D9 and D10 (all four items)", 23 September 2026) stand. D8-A is changed only by J3 below |
| R1 Register as a grid with the G-09 columns | Claude's recommendation, adopted | The build report's G-09 asks the register to show state, revision, visit, dispatch and acknowledgement progress |
| R2 Shared record layout with views and contents in the secondary menu | Claude's recommendation, adopted | The record has sub-pages (Job pack, Preparation, Revision history), which the shared layout allows a secondary menu for |
| R3 and A A "Dispatch held until" bar, readiness shown once, collapsible status panel | Claude's recommendations, adopted | BP-07 §8: dispatch needs a current issued pack, every required crew acknowledgement and current readiness clearance. The first version showed readiness five times and gave the pack only 572 px |
| R4 and B One primary header action by state; decisions in dialogs | Claude's recommendations, adopted | Check, Return, Queue exact output and Withdraw each take a reason and apply to one exact revision (TR-04 to TR-07, ADR-0011) |
| R5 Print preview as an icon button | Claude's recommendation, adopted | Keeps the header to one row at 1440 px with the menus open; its accessible name stays "Print preview" |
| R6 A single shell breadcrumb | Claude's recommendation, adopted | Replaces the in-module breadcrumb kept by D8-A, ending the recorded double-breadcrumb exception |
| R7 Contents markers | Claude's recommendation, adopted | An amber count for criteria needing attention, an amber dot for a changed source, a blue dot for an unsaved edit and a red count for a validation error |
| R8, R9 Save with a reason; field-level revision history | Claude's recommendations, adopted | DP-2: every save is a new immutable revision. The r03 change record asked for a per-event reason with field-level changes |
| R10 and C The technician sees the whole pack on the phone | Claude's recommendations, adopted | Technicians read the pack in the field. Their view shows only the current issue, without staff links or readiness detail (build report §4.1–4.2) |
| D A full source-changed screen | Claude's recommendation, adopted | `checkPack` and `requestIssue` refuse with StaleSource when a checked source changed. D2 and I4: resolve with a successor revision and a reason, via "Review changed sources" and "Refresh saved sources" |
| E Phone tabs, page states and day grouping | Claude's recommendations, adopted | Section 3, States shown |
| F Click-through in Present mode | Claude's recommendation, carried out | Section 7 |
| R11 Job packs stays under More on the phone | Claude's recommendation, adopted | Work orders holds the fifth Service tab (work orders decision, W8) |
| R12 Selection actions limited to Open in sequence and Export list | Claude's recommendation, adopted | Pack decisions stay one pack and one revision at a time |
| Q1 Keep "Visits without a pack" | Recommended answer adopted: keep | Needs a new read (section 5) |
| Q2 Job packs as a phone tab | Recommended answer adopted: no | R11 |
| Q3 Issued header action | Recommended answer adopted: "Open exact issued document" | "Prepare successor revision" is under "…" |
| Q4 Print preview | Recommended answer adopted: an icon button | R5 |
| Q5 May the preparer check their own revision? | Not decided | No pack rule exists today; the ES-04 own-estimate rule covers estimates only. Recommended: decide before the build |
| Q6 Remember the collapsed status panel per person | Recommended answer adopted: yes | A per-viewer display preference, not business data |
| Building the pages or the shell | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Job pack — Pipedrive pattern, accepted". The file's link is not recorded in this public repository, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Accepted page | "Job pack · SV-05" `272:2` (formerly "Job pack (accepted)"; renamed on 25 October 2026 by the [Figma file audit](../design/figma-file-audit/figma-file-audit-2026-10-24.md), R1). Notes card `311:9244` lists the frames, rules, components, handovers, decisions, recommendations, departures and open questions |
| Register frames | Desktop `272:2038`; two rows selected `295:47432`; phone list `272:2542` |
| Record page frames | Job pack view, Draft r02 `280:2678`; status panel collapsed `301:45810`; Preparation `288:3252`; Record preparation change `289:3660`; Revision history `290:4052`; Check `303:6353`; Return `303:6480`; Checked r03 `303:5318`; Queue exact output `303:6602`; Issued r03 `291:4320`; Withdraw `303:6853`; Source changed `306:8133`; Preparation reviewing changed sources `306:16129` |
| Phone frames | Coordinator Pack `272:42429`, Readiness `307:9341`, History `307:9533`; technician pack `294:4878`, confirm `304:48130`, acknowledged `304:48274` |
| States board | Section `296:4851` |
| Page components | Job pack grid row `275:42624` and header `275:42670`; list row (phone) `275:42685`; Section head `275:2578`; Fact `275:2595`; Note `275:2597`; Callout `275:2601`; Criterion row `275:2655`; Stage heading `275:2657`; Disclosure `275:2660`; Crew row `275:2698`; Record row `275:2706`; Document row `275:2708`; History row `275:2716`; List item `275:2735`; Form field `287:3282`; Select row `287:3304`; Status strip `301:4783`; Decision dialog `302:5359` |
| Shared parts | The Shell v2 parts and the Service rail of the work orders decision; the shared record parts of the lead record page (Record / Header, Readiness bar, Check item, Banner, Field, Section heading, History item); Tag and Button. Eighteen Font Awesome icons were added to the Components page from Dean's Kit: Light `print`, `link`, `clock-rotate-left`, `circle-minus`, `file-lines`, `pen`, `arrows-rotate`, `user-check`, `arrow-up-right-from-square`, `paper-plane`, `eye`, `download`, `camera`, `arrow-left`, `box-check`, `list-ol` and `hourglass-half`, and Solid `folder-open` for the selected rail item |
| Prototype | Flows "Job packs — desktop", "Job packs — phone", "Job pack — technician phone" and "Job pack — source changed". New Prototype switches `statusrail/open` and `statusrail/collapsed`; the existing switches are reused |
| Retained captures | [Job pack design r01](../reference/ui/service/job-pack-design-r01/README.md): seven icon-free capture boards holding 24 states, with hashes and frame offsets. These are the repository reference for this decision |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | The existing destination `packs` ("Job packs") in the Service operations rail, group Requests and scheduling (`src/shell/navigation.ts`), requiring `pack.read`. Routes `/service/packs`, `/service/packs/[id]` and `/service/packs/new`; scope `scope:SV-05` (job-pack preparation and issue follow-through) and SC-06; requirements SVC-03, SVC-06 and OUT-09 |
| Page type (r20) | `/service/packs`: Register / worklist, with a record window and a multi-select panel. `/service/packs/[id]`: Record detail with a guided form (Preparation), a history view and decision dialogs. `/service/packs/new`: the Preparation view for the first revision. Phone: list rows, a coordinator record page with Pack, Readiness and History tabs, and the technician's recipient view |
| Reused components | Section 2, Shared parts. Page-specific components are listed in section 2 |
| Source authority | [ADR-0011](ADR-0011-p06-controlled-job-packs.md); [BP-07 §8](../blueprints/BP-07-service-operations.md#8-readiness-and-job-pack-specification); the [Job Pack design decision](job-pack-design.md) (D1–D10); the [application integration](job-pack-integration.md) (DP-1–DP-22); [ADR-0029](ADR-0029-hosted-pack-reviewer-profile.md). Labels come from `src/documents/pack-view.ts` (statusPresentation, the nine section titles and the note labels) and the eight criteria of readiness policy `SYN-PPO-P04` v1. Fixture: synthetic `SYN-PPO-PACK`, `SYN-PPO-WO`, `SYN-PPO-APT`, `SYN-PPO-AST`, `SYN-PPO-TKT` and `SYN-PPO-RPT` references, customers, sites, people and dates |
| Incoming handover | Schedule (a confirmed appointment; "Visits without a pack" leads to `/service/packs/new`). The Field team and appointment drawer (JobPackEntry, "Open job pack"). The work order's authorised scope revision. My jobs for the technician |
| Outgoing handover | The appointment, where readiness is assessed (D4). The work order. The equipment record (staff only). The exact issued document. The server print preview of the saved revision (D3, OUT-09). My jobs, where evidence is recorded. A service-owner contact activity on review or withdrawal (ADR-0011). No readiness is assessed on the pack page |
| States shown | Register: rows grouped by visit day, every state label, a two-row selection, loading, filtered-empty and empty. Record page: Draft r02 with readiness needing attention, the status panel collapsed, Preparation with an edited field and a validation error, the save-reason dialog, Revision history after r03 is saved, Check, Return, Checked r03, Queue exact output, Issued r03 awaiting one acknowledgement, Withdraw, source changed, Preparation reviewing changed sources, failed load, not available, saving, save not confirmed and the expanded exact text. Phone: the list, the coordinator's three tabs, and the technician's pack, confirmation and acknowledged state. The states board shows every staff state with its notice, four technician states, the empty register and the save warning for a pack with a current issue |
| Departures | Section 4 |
| Verification | Section 7 |

## 4. Display rules and departures

### Register

| Column | Shows |
|---|---|
| Job pack | Display number and current revision |
| Visit | Appointment start date and time. Default sort, earliest first, with rows grouped Earlier, Tomorrow, Later this week and Next week |
| Job | The verified approved-scope summary (D7) |
| State | The app's statusPresentation label: Draft · not issued, Successor draft · not issued, Returned for preparation, Checked · not issued, Output in preparation, Output recovery needed, Source changed · successor needed, Issued, Review required, Withdrawn |
| Readiness | "n of m satisfied" from the recorded criteria; amber when any criterion is unsatisfied |
| Crew acknowledged | "a of n" for the current issue; "Not requested" before issue; "Fresh issue needed" after a review |
| Dispatch | Held or Clear, from the server's dispatch hold |
| Customer, Site, Technicians, Prepared by, Updated | As recorded |

Menu views: All job packs and Prepared by me. A State group: Drafts, Returned, Checked, Issued, Withdrawn. A Needs attention group: Readiness not satisfied, Review required, Not yet acknowledged, Output recovery needed. A Next 7 days group: Visits without a pack, Dispatch held. The rail badge counts the Needs attention items. All counts are neutral.

### Record page

- **Header.** It shows one primary action, chosen by state and permission:

  | State | Primary action |
  |---|---|
  | Draft | Check this revision (`pack.check`) |
  | Returned | Prepare revision |
  | Checked · not issued | Queue exact output for issue (`pack.issue`; the Hosted Pack Reviewer sees none) |
  | Output in preparation | None (Refresh pack status in the notice) |
  | Output recovery needed | Process or recover original output |
  | Source changed | Review changed sources |
  | Issued | Open exact issued document |
  | Review required | Prepare successor revision |
  | Withdrawn | None |

  Everything else sits under "…", including Return preparation, Prepare successor revision, Print preview, Record simulated sending, Withdraw current issue, Open appointment and Open work order.
- **Dispatch bar.** Its title is "Dispatch held until" while any of its three conditions is open, and "Ready for dispatch" when all are met. The conditions are Pack issued, Crew acknowledged and Readiness (BP-07 §8). The bar summarises recorded facts; it decides nothing.
- **Notices.** A notice appears only when it gives a reason or an action that the tag, the bar and the header do not already show: a return reason, output recovery, changed sources, review required or withdrawal.
- **Status panel.** It holds Pack readiness (grouped by stage, D9), Crew acknowledgement, Pack record and Output and distribution, and collapses to a 48 px strip. The secondary menu holds the three views and the nine sections. With both collapsed the pack is about 1,090 px wide.

### Departures

The Reviews & approvals departures D1–D9 and the Work orders Service rail (W1) apply unchanged. These are the departures from the built r03 page and today's register:

| ID | Departure | r03 and today's pages |
|---|---|---|
| J1 | The v2 shell, with Job packs selected in the grouped Service rail | The adopted shell |
| J2 | The register is a grid with the columns above, grouped by visit day, with menu views and a record window | A card list with no columns or filters |
| J3 | One breadcrumb, in the shell top bar: "Service / Job packs / SYN-PPO-PACK-000052" | The D8-A in-module breadcrumb beside the shell breadcrumb |
| J4 | The views (Job pack, Preparation, Revision history) and the nine-section contents move into the secondary menu | Tabs under the header and a contents rail inside the page |
| J5 | Decisions move from the readiness card to the header, "…" and decision dialogs | Check, Return, Queue output and Withdraw buttons in the right-hand rail |
| J6 | The "Dispatch held until" bar replaces routine state notices; notices remain for reasons and actions | A state notice in every state |
| J7 | Print preview is an icon button with that accessible name | A labelled header button |
| J8 | The status panel collapses to a strip | A right rail that scrolls with the page (DP-12) |
| J9 | Phone: the coordinator gets Pack, Readiness and History tabs. The technician gets "Your visit" and "Bring and collect" cards, the whole pack, and a confirmation sheet for "Acknowledge this exact issue" | A single stacked column |
| J10 | The source-changed screen lists each changed source with its checked and current versions and the sections it affects. Preparation shows a before-and-now comparison inside each affected section | A notice with drift lines and "Review changed sources" |

Unchanged: the r03 reference bytes, the D6 exact-text rule (the "Exact text as it will be issued" disclosure stays on every section), the D7 title rule, the D9 readiness grouping and every pack command.

## 5. Not decided

- **Building the pages.**
  - The register needs list-read additions: revision, visit, readiness counts, acknowledgement counts, dispatch hold, technicians and preparer. Today's list returns the display number, status and appointment reference.
  - "Visits without a pack" needs a read of confirmed appointments without a pack.
  - The source-changed screen needs each changed source mapped to the sections that cite it. `basis_drift` gives the drift today.
  - Remembering the collapsed status panel is a per-person display preference.
  - Reading keeps `pack.read` and the existing recipient filtering. No new capability is proposed.
- **Q5.** Whether the preparer may check their own revision. Decide before the build.
- **Rolling out the shell.** As for Reviews & approvals, the adopted Shell page and the app stay as built until a shell implementation is planned and recorded.
- **Not drawn yet:**
  - phones at 320 px;
  - a phone layout for Preparation;
  - the register's column-settings menu;
  - the full Returned and Withdrawn screens (they are on the states board);
  - the printed output, which stays the frozen OUT-09 template.

## 6. Consequences

- No application code, read model, route, migration, permission or capability changes. No page, scope or parent requirement ID changes; all 78 parent IDs remain.
- The three Job pack register entries link this design and its captures. Their visual status stays "Needs review": the app does not yet match the design.
- When the pages are built, they are compared with these captures and the Figma frames at the same viewports, following ADR-0053 rule 7. Build increments keep the integration constraints of the Job Pack design decision: no change to the pack snapshot, the OUT-09 template, the commands or server permission filtering.
- A later change to this design receives a new named version and a new capture revision folder; these bytes stay unchanged.

## 7. Verification

- Claude checked every frame with screenshots taken inside Figma, and audited the page: no overlapping frames, every frame labelled, and no prototype link to another page.
- On 12 October Claude clicked through all four flows in Present mode, using the Figma desktop app with Dean's permission:
  - The register row opens the record window, which opens the record page.
  - The status panel collapses and re-opens, and the contents scroll to their sections.
  - Preparation → save reason → Revision history → Check → Checked → Queue output → Issued; "…" → Withdraw → Cancel.
  - The phone list opens the pack, with its Readiness and History tabs and Back.
  - The technician's acknowledgement goes through confirmation to the acknowledged state.
  - Source changed opens Preparation in review.
  - One defect was found and fixed: the "…" button on the Checked screen overflowed.
  - The breadcrumb link sits under Figma's own viewer toolbar in Present mode, so it was checked structurally instead.
- The seven capture boards are copies of the accepted frames with every Font Awesome icon swapped for `Icon/placeholder`. A check after the swap found no Font Awesome instance left in any board. Each image was inspected. The hashes and frame offsets are in the [captures README](../reference/ui/service/job-pack-design-r01/README.md).
- `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py`, `node scripts/design-baseline-check.mjs` and `npm run studio:check` were run on this change.
- Nothing is built, so there is no application or device evidence. This record implies no visual review of the application and no UI baseline.

## 8. Amendment A06 — field readiness gate (16 October 2026)

On 16 October 2026 Dean accepted the field readiness gate with the other five items of the UX benchmark's Decision brief: "I am happy to proceed with all six based on your recommendations." The [UX benchmark decisions](ux-benchmark-decisions-2026-10-16.md) record (PPO-UXB-DEC-01, decision 4) holds the decision; the [field readiness gate record](field-readiness-gate-proposal.md) holds the rules R1 to R11 and the answers to Q1 to Q7. Amendment A06 brings that gate into this design: the technician accepts or returns the exact issue with a reason that tasks the preparer, a Parts criterion joins the Dispatch stage, and a not-yet-opened marker shows on the pack. Sections 1 to 7 describe the design as first accepted; where A06 differs, A06 governs.

| Item | Classification | Evidence |
|---|---|---|
| Accept or Return the issue with a reason; Parts at dispatch; the "not opened" marker | User decision, 16 October 2026 | Quoted above; A06 in the [amendment register](../design/research/ux-benchmark/amendment-items.csv) |
| The technician's word is "Return", not "Decline" | User decision, 16 October 2026 | PPO-UXB-DEC-01 decision 4 |
| Frames A1, rules and departures A1-D1 to A1-D4 | Claude's proposal, accepted by the same decision | The field readiness gate record, sections 2 and 4 |
| Named Figma version | **Waiting for Dean's explicit yes** | "Field readiness gate — accepted" is saved only on that yes; the [captures README](../reference/ui/service/field-readiness-gate-r01/README.md) records the save when it happens |

**Design reference.** Page "Job pack · SV-05" `272:2` (formerly "Job pack (accepted)"), section "A1 · Field readiness gate" `958:9304`. Phone technician, issued r03, Acknowledge or Return `958:9305`; Return with reason sheet `958:9426`; r03 returned `958:9559`; coordinator Readiness tab, Draft r04 `958:9680`. Desktop: Issued r03 returned by the technician, with the preparer's task `963:9993`; checker Return dialog that tasks the preparer `963:10213`; Record customer site readiness dialog `963:10299`. Notes card `966:11510`. The ladder of UXB-10 is drawn on exemplar E7, page "UX benchmark exemplars" `986:47`, frames `1008:5137` and `1009:5923`. No accepted frame or component was edited: the A1 frames are clones with instance overrides. Icon-free captures: [field readiness gate r01](../reference/ui/service/field-readiness-gate-r01/README.md), images 01 to 07, 11 and 12.

| ID | Departure from sections 1 to 7 | Accepted design before A06 |
|---|---|---|
| A1-D1 | The technician's phone footer holds the document button, Return and "Acknowledge r03" (shortened to fit) | Document button and "Acknowledge this exact issue". The app's "I have read and acknowledge this exact pack" is unchanged |
| A1-D2 | The Dispatch stage lists the Parts criterion, and later site readiness, beside "Current site and isolation controls" | One Dispatch criterion |
| A1-D3 | A state label, "Returned by technician", with "Prepare revision r04" as the primary action and a notice carrying the return | No such state |
| A1-D4 | Parts lines carry live readiness from Supply Chain beside the issued text | Issued text only |

**Built in the first increment.** The build follows the field readiness gate record, section 10:
- the Return sheet with the six reasons and a required note, beside the unchanged acknowledgement (A1-D1);
- "Returned by technician" with "Prepare revision rNN" as the primary action, a notice quoting each return and a "No change needed" answer (A1-D3, Q2);
- the derived Parts criterion in the Dispatch group, with its words from Supply Chain (A1-D2);
- live parts readiness beside section 07, labelled as not part of the issued pack (A1-D4);
- "Not yet opened" on each crew row whose recipient has no Opened or Downloaded fact for the current issue and has not responded (the A06 marker). Opening stays a distribution fact, never an acknowledgement.

**Built differently, and why.**
- The Return sheet names "the preparer", not the preparer's name, because the pack read does not give recipients the name of who prepared a revision.
- The photo on a return (R3, optional) is not built. A technician's photo today needs a started attendance (`field_attachments`), and the evening-before return has none. It follows with the offline return.
- Live parts readiness sits as a panel under section 07 rather than as a suffix on each line of a "Bring and collect" card, because the built page keeps the nine issued sections rather than the phone cards of J9.
- The not-yet-opened marker is on the pack page only. UXB-09 also places it on the planner; that follows with the next increment.

**Not decided.** Q5 of this design (whether the preparer may check their own revision) is unaffected. Customer site readiness (P4), the issue lead time (P5) and the ladder (UXB-10) are accepted but not built; see the field readiness gate record, section 10.

**Verification.** The A1 frames were checked by screenshot when drawn on 16 October; Present mode was not run. The capture copies are recorded in the captures README. The application build's checks are in its pull request.
