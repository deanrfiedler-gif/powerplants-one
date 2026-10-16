---
document_id: PPO-PJ05-COMMERCIAL-FIGMA-DEC
date: 2026-10-16
owner: Dean Fiedler
status: Owner-accepted design; native implementation, the backend reads it implies (G1–G8) and UI baseline acceptance separate
source_commit: 1552cfbb8efd6cea17438c2af18ba0effa4fc278
versioning: git
---

# Contract obligations, notices and variations design — owner decision

On 16 October 2026 Dean asked for the next UI page to be designed in Figma and expected PJ-05 "Contract obligations, notices and variations" (`/projects/commercial`). The evidence held:
- the [PJ-05 backend](project-commercial-controls.md) had merged as PR #493 on 14 October 2026;
- there was no app route, Figma page, File index row, open pull request, UI branch or other session for it;
- the register entry read "unbuilt".

PJ-04 RAID was the runner-up, equally unbuilt but no more blocked.

Claude drew the page in Figma. Dean then asked for an audit and professional polish so that "all the elements (tables, etc.) and features align with the styles that we have used for the other UI pages". Claude aligned the record sections, tables, grid headers, breadcrumbs and notes, and added the variation History view.

Dean accepted the result: "I accept the PJ-05 Contract obligations, notices and variations design with your recommendations and recommended answers to Q1–Q8. Lock it in under ADR-0053." The design reference is the named Figma version "Contract obligations, notices and variations — accepted".

Scope:
- `scope:PJ-05` "Contract obligations, notices and variations" at `/projects/commercial`, with records at `/projects/[id]/commercial/[entry]` (proposed) and a Commercial view on `/projects/[id]`.
- Parent scope as recorded in the [commercial contract](../contracts/project-commercial-controls.md): PRJ-01, PRJ-05 and PRJ-08, with FIN-05 to FIN-08 for the [Finance definitions](../contracts/project-commercial-finance-definitions.md). No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design PJ-05 next | User decision, 16 October 2026 | Dean named PJ-05 and asked for the evidence to be checked against main, open PRs, other sessions and the File index |
| Audit and polish against the accepted pages | User decision, 16 October 2026 | "give it an audit and professional polish to ensure all the elements (tables, etc.) and features align with the styles that we have used for the other UI pages that we have built in Figma" |
| Accept the design, its recommendations and the recommended answers | User decision, 16 October 2026 | "I accept the PJ-05 Contract obligations, notices and variations design with your recommendations and recommended answers to Q1–Q8. Lock it in under ADR-0053." R1–R10 are adopted |
| R1 One project at a time | Claude's recommendation, adopted | The Projects menu item "Variations & obligations" opens `/projects/commercial` with a project picker, because the commercial read takes one project (`/api/v1/projects/:id/commercial`). Records open at `/projects/[id]/commercial/[entry]`. The project record gains a Commercial view, which its [decision](project-record-page-design.md) anticipated ("Each would add a view tab when built") |
| R2 Five views | Claude's recommendation, adopted | Variations (default), Obligations, Notices and Commercial basis, plus Value breakdown for Finance readers. Grids are grouped by state with the fixed Select and Settings columns of the accepted registers |
| R3 Control values strip | Claude's recommendation, adopted | On Variations and Value breakdown only, from the PJ05-FD08 read. Requested and priced are never added together. An unknown amount shows "Not complete" with the known subtotal. The adjusted value shows Held when a source changed |
| R4 Records on the shared record layout | Claude's recommendation, adopted | Variation, obligation, notice and basis records with a facts bar, a details column and view tabs. The amounts card keeps Requested, Priced and Approved apart |
| R5 Decisions in a dialog | Claude's recommendation, adopted | A centred dialog (a bottom sheet on phones) bound to the exact version, with Approve, Reject or Dispute and a preview of the control values. Approve records the priced amount; amounts can't be edited there |
| R6 Create in side panels | Claude's recommendation, adopted | New variation (requested-unknown and not-priced toggles), Record a notice (never later than now; corrects only the latest record in a chain) and Propose basis (three exact sources and the server-calculated original value) |
| R7 Obligation rules | Claude's recommendation, adopted | Overdue means open and dated before today in site time, a display rule only. Mark satisfied needs evidence and every linked Activity Completed or Cancelled. A waiver goes to an independent reviewer |
| R8 Notices are evidence | Claude's recommendation, adopted | Never sent, and no delivery claim. A correction reads "Corrects an earlier record"; the earlier record moves to Corrected |
| R9 Phone | Claude's recommendation, adopted | List rows under a compact values card; a record with Details, Overview, Activities and History; decisions in a bottom sheet; Variations sits under More in the phone tab bar |
| R10 Names, not identifiers | Claude's recommendation, adopted | People by name, never UUIDs, hashes or operation IDs on screen |
| Q1 Menu label | Resolved as recommended | Keep "Variations & obligations" from `src/shell/navigation.ts`; records and the File index keep the scope title |
| Q2 One project or a cross-project queue | Resolved as recommended | One project now; a cross-project read for reviewers later (G1) |
| Q3 Who sees the Commercial view | Resolved as recommended | Anyone with `project.commercial.read`; hidden otherwise (state S14) |
| Q4 My Work items | Resolved as recommended | Yes, later, as attention items for the owner or reviewer; not drawn |
| Q5 Project record tab overflow | Resolved as recommended | Fold later views into a "More" tab once PJ-04, PJ-06, PJ-07 and PJ-08 no longer fit |
| Q6 Group order | Resolved as recommended | Waiting for decision, Open, Disputed, Approved, Closed; newest change first within a group |
| Q7 Decision preview without Finance access | Resolved as recommended | Not shown; the dialog says the values update after approval |
| Q8 Notices list | Resolved as recommended | Show "Recorded by"; the owner stays on the record |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Contract obligations, notices and variations — accepted". The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Contract obligations, notices and variations · PJ-05" `933:11285`, under "— Projects —" `626:12`, after Project record page `345:2`. Header `933:11286` holds the conformance declaration. Notes cards `952:5684` (story, numbers, R1–R10, Q1–Q8) and `952:5697` (not drawn, G1–G8, display rules, prototype, polish). File index row `969:54` |
| Desktop 1440 | Section `933:11331`: Variations `936:365`, preview panel open `938:238131`, variation record Overview `939:6572` and History `968:244841`, decision dialog `939:238603`, basis record `941:1737`, project record Commercial view `943:240356`, Obligations `942:1963`, obligation record `945:3990`, Mark satisfied blocked by an open Activity `945:241114`, Notices `942:2817`, Record a notice panel `944:240911`, New variation panel `943:2880`, Value breakdown `942:240319` |
| Tablet 1024 | Section `933:11335`: Variations `945:241483`, variation record `945:241696` |
| Phone 390 and 320 | Section `933:11339`: Variations `947:5023`, variation record `947:242268`, decision sheet `947:242586`, Variations at 320 `947:242735` |
| States | Section `933:11346`: S1 no approved basis yet, S2 propose the basis, S3 basis submitted by you, S4 source changed (held), S5 no Finance access, S6 records hidden by access, S7 you submitted it, S8 newer version while deciding, S9 couldn't confirm then recovered, S10 closed project, S11 unknown, zero and credit amounts, S12 future notice refused, S13 loading, S14 no commercial access |
| Flows | "PJ-05 — desktop decision", "PJ-05 — desktop records", "PJ-05 — project record", "PJ-05 — tablet" and "PJ-05 — phone"; 82 links, all on the page. Claude could not run Present mode through the connector, so the links were set but not clicked through |
| Page components (proposed) | Section `952:5731`: Commercial / Variation, Obligation, Notice and Breakdown grid headers and rows (`935:47`/`935:213`, `935:214`/`935:357`, `935:358`/`935:483`, `935:484`/`935:587`), Commercial / Control values `936:364` (Current, Held, No Finance access), Commercial / Amounts card `939:6559`, Commercial list row (phone) `947:5002`, Commercial / Values card (phone) `947:5017` |
| Library additions | `Icon/file-plus-minus` `934:79` and `Icon/solid/file-plus-minus` `934:85`, the icon `nav-variations` maps to in `src/components/font-awesome-icons.ts`. Rail · Projects `209:515` gained the item "Variations & obligations", shown only where its boolean "Variations & obligations (proposed)" is on; it is off by default, so accepted pages are unchanged |
| Cloned and shared parts | The accepted Template management register, preview panel, record, create panel and review dialog (`796:322`, `797:725`, `803:1944`, `806:3109`, `808:3812`); the Projects register phone list `209:457`; the Project record Overview `345:5185`, phone Overview `355:2281`, History section `365:3700` and Files table `351:2158`. Shell, grid and record parts as in section 3 |
| Retained captures | [Contract obligations, notices and variations design r01](../reference/ui/projects/project-commercial-design-r01/README.md): twenty-one icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:PJ-05` at `/projects/commercial`; records `/projects/[id]/commercial/[entry]` (proposed); a Commercial view on `/projects/[id]`. Parent scope PRJ-01, PRJ-05 and PRJ-08 with FIN-05 to FIN-08, unchanged. Capabilities unchanged: `project.commercial.read`, `project.commercial.prepare` and `project.commercial.review`; the control values also need `finance.read` and `shared.finance.read` |
| Page type (r20) | Register / worklist (Variations, Obligations, Notices, Commercial basis, Value breakdown); Record detail on the shared record layout (variation, obligation, notice, basis); Form / guided workflow in side panels (propose basis, new variation, record a notice); Review / decision dialogs. Phone: list and record with tabs and bottom sheets |
| Reused components | Rail · Projects, Shell / Top bar, v2 Menu item and Menu heading, Grid / Header cell, Cell, Checkbox cell and Row actions cell, My Work / Group row, Record / Header, Readiness bar and Check item, Field, Section heading, View tab, Filter chip, Banner and History item, Tag, Button, Project record / Details column and Key dates strip, Shell / Phone header and v2 / Tab bar (phone). New, proposed page components are in section 2 |
| Source authority | [Commercial controls contract](../contracts/project-commercial-controls.md), [Finance definitions](../contracts/project-commercial-finance-definitions.md) and [decision](project-commercial-controls.md); `src/projects/commercial/model.ts`, `reads.ts`, `commands.ts`, `sources.ts`, `context.ts` and `validation.ts` (migration 0101); the accepted [Project record](project-record-page-design.md), Template management and [My jobs](my-jobs-figma-design.md) designs and the Deal record table style. Fixture: synthetic project, quotation, document, people, dates and amounts |
| Incoming handovers | Read-only: the project and its coordinator; the received Won Sales handover; the issued, reported-Accepted quotation revision (ES-05); the Reviewed contract document revision (DK-01, DK-02); the project's Activities. Entry from the project record's Commercial view or the Projects menu |
| Outgoing handovers | Approved, pending and disputed values to the synthetic Finance read (PJ05-FD08 version 1); links to existing Activities. Never: send a notice or message, change a quotation, schedule, forecast, booking, invoice, claim or MYOB, or let someone decide their own proposal |
| States shown | Section 2, S1–S14 |
| Departures | Section 4 |

## 4. Display rules and departures

### Story and numbers

Synthetic, AUD excluding GST. Project SYN-PPO-PRJ-000027 "Block C fertigation upgrade", coordinator Morgan Lee, reviewer Jordan Hale, today Monday 12 October 2026, 10:42 AEST.

| Measure | Value | How it reconciles |
|---|---|---|
| Original value | $186,400.00 | Quotation SYN-PPO-QUO-000174 r02, contract rev B Schedule 1, approved 4 Sep |
| Approved changes | +$10,850.00 | +$12,480.00 − $1,150.00 − $480.00 (a signed adjustment of the first) |
| Adjusted value | $197,250.00 | $186,400.00 + $10,850.00 |
| Pending · priced | $6,920.00 | "Relocate controller to plant room", Submitted |
| Pending · requested | Not complete | $7,400.00 known and one unknown amount, so no total |
| Disputed | $3,260.00 | Priced; requested $4,200.00 |
| Not counted | Rejected and withdrawn | Listed in the breakdown, never in a total |
| After approving the controller variation | +$17,770.00 and $204,170.00 | The decision dialog's preview |

### Rules

- **Amounts** show two decimals and a minus sign for credits. Unknown is never shown as $0.00; an explicit $0.00 is a reviewed zero.
- **Source status** Current or Changed comes from each record's `source_status`; Held totals come from the Finance read.
- **Overdue** is computed on the page from `due_date` and site time. "Waiver requested" is an obligation in Submitted.
- **Counts and groups** are shown only when the whole list is loaded (no next cursor, completeness not Partial).
- **Breadcrumbs** read "Projects / Variations & obligations / Variation" (or Obligation, Commercial basis), because records have no display number yet (G3).
- **The Commercial view** shows the PJ-05 control values. It is separate from the read-only MYOB summary that the project record decision keeps as a one-line placeholder until a MYOB read exists (its Q3).

| ID | Departure | Today |
|---|---|---|
| V1 | The rail item "Variations & obligations" becomes available | `readiness: "unavailable"` in `src/shell/navigation.ts` |
| V2 | A Commercial view on the project record, after Baselines | Not built; listed as a later tab in the project record decision |
| V3 | People's names on screen | The read returns `owner_id` and `recorded_by` only (G2) |
| V4 | Group rows with counts, ordered as Q6 | The read pages in ID order with no counts (G4) |
| V5 | A decision preview of the control values | No server preview (G8) |

## 5. Not decided

- **Building the page.** No route, page or command control exists. A build follows its own decision and pull request.
- **Backend work the design implies.**
  - G1 A cross-project read for a reviewer queue.
  - G2 Names for owners, authors and reviewers in the projection, or the existing people read.
  - G3 Human-readable record numbers.
  - G4 Counts and an order by latest change.
  - G5 The stored reason in reads; History shows notes until then.
  - G6 Notice links to obligations and variations, typed notice kinds and attachments (later work in the contract).
  - G7 Basis pickers listing received handovers, accepted quotations and reviewed documents for the project.
  - G8 A server preview of the control values after a decision, or drop the preview.
- **Not drawn yet:**
  - the notice record page and History for the basis, obligation and notice records;
  - the basis Sources tab and every Activities tab;
  - Withdraw, Revise, Reopen and Request waiver dialogs, which reuse the decision dialog;
  - the signed adjustment flow;
  - tablet and phone versions of Obligations, Notices, Basis and Value breakdown, and a 320 record;
  - My Work items (Q4) and any offline use; commercial records are online only.

## 6. Consequences

- No application code, read model, route, migration, permission or capability changes; all 78 parent IDs remain.
- The `scope:PJ-05` entry links this design and its captures, and the `route:/projects/[id]` entry gains the Commercial view capture. Their visual status is unchanged.
- The [project record page decision](project-record-page-design.md) stays as accepted; its later-tabs list now points here for PJ-05.
- A later change receives a new named version and a new capture revision folder; these bytes stay unchanged.

## 7. Verification

- Claude checked every frame with screenshots taken inside Figma, then audited the page twice. The second audit, after the polish pass, found in 2,194 visible texts none clipped, none without a PPO text style and none whose stored colour differed from its bound variable. The only unbound colour is the dialog scrim tint inherited from the accepted Template management dialogs. No frames overlap and no prototype link leaves the page.
- The polish pass aligned record sections (16 px heading, 8 px to content, 24 px apart), in-record tables (12 px cell gap, a flexible first column, status tags, 28 px row actions, a foot note), the sorted-column marker, breadcrumbs and the notes cards with the accepted Project record, Deal record, Template management and My jobs pages, and added the variation History view.
- The twenty-one captures are copies on the "Captures (icon-free)" page with 564 Font Awesome instances swapped for `Icon/placeholder`; a scan after the swap found none left, and 2,175 visible texts showed no stored-colour mismatch. They were exported at scale 1 with the Figma connector and downloaded. The [captures README](../reference/ui/projects/project-commercial-design-r01/README.md) holds the hashes.
- Nothing is built, so there is no application or device evidence. This record implies no visual review of the application and no UI baseline.
