---
document_id: PPO-ES02-DISCOVERY-REGISTER-FIGMA-DEC
date: 2026-10-18
owner: Dean Fiedler
status: Owner-accepted design; list-read fields, native implementation and UI baseline acceptance separate
source_commit: 4296429bb96b70c982d5e87201e83ed8f9e5fb22
versioning: git
---

# Discovery register design — owner decision

On 18 October 2026 Dean asked: "Start designing and building the Discovery UI page in Figma that is used in the estimation module in the Powerplants One app." The rail's Estimation wizard opens `/estimating/discovery`, which had no Figma design. The built page is an unstyled list titled "Scope and options" (`DiscoveryList` in `src/components/discovery-screens.tsx`), one card per workspace listing every option.

Claude drew the page from these sources:
- the [ES-02 Estimation Wizard design](es02-wizard-figma-design.md), accepted 12 October 2026, which the register opens;
- [ADR-0035](ADR-0035-es02-structured-discovery.md) structured discovery: saved `scope_readiness` values and the `LegacyManual` revision kind;
- the built list read `listDiscoveryWorkspaces` in `src/estimating/discovery-workspaces.ts`;
- the accepted [Intake & workload](intake-workload-design.md) page, whose saved estimates the story follows;
- copies of the accepted Sites CS-04 register, the Field team PL-02 large snapshot, the Intake & workload window note and the accepted wizard's rail. No accepted frame or main component was edited.

Before deciding, Dean asked: "Give the Discovery register an audit and polish before I decide." He then accepted it: "I accept the Discovery register ES-02 design with your recommendations, including D1–D7 and Q1–Q4." That adopts D1–D7 as drawn and the recommended answers to Q1–Q4. Dean then asked for the named version: "Yes, save the named version "Discovery register — Pipedrive pattern, accepted" in the Figma desktop app." The design reference is that named version.

Scope:
- `route:/estimating/discovery` "Discovery register", under `scope:ES-02` "Estimation Wizard · discovery, alternatives & revisions".
- Parent requirements PPO-010 and EST-01–EST-09 under ADR-0035. No parent requirement ID is added or renamed; all 78 remain.
- Capabilities are unchanged: the register reads with `estimating.read`, and New discovery workspace needs `estimating.edit`.

This is a design decision. It authorises none of the following:
- application code, including restyling the built "Scope and options" list;
- a change to `listDiscoveryWorkspaces` or any other read, a migration or a data model change;
- a route, permission or capability;
- an amendment to ADR-0035 or the ES-02 wizard decision;
- deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the Discovery register in Figma | User decision, 18 October 2026 | Dean's request quoted above |
| Audit and polish before acceptance | User decision, 18 October 2026 | Quoted above. Section 6 |
| Departures D1–D7 | Accepted as drawn, 18 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Rows | Resolved as recommended | One row per workspace, showing its selected option. Alternatives are in the snapshot. One row per option, as built, would repeat the opportunity and invite summing alternatives |
| Q2 Estimator | Resolved as recommended | The workspace owner is shown as "Estimator", and My workspaces filters on it. If no owner is recorded, the last person to save discovery is shown as "Last saved by" instead |
| Q3 Phone title | Resolved as recommended | At 320 the page keeps the rail label "Estimation wizard" with an ellipsis; the selected tab names the page. There is no phone-only title |
| Q4 Next | Resolved as recommended | Draw Create discovery workspace (`/estimating/discovery/new`) next, then Discovery costing (`/estimating/discovery/[id]/costing`). Both are registered routes with no Figma design |
| Accept the design | User decision, 18 October 2026 | Quoted above |
| Named Figma version | User decision, 18 October 2026 | "Yes, save the named version "Discovery register — Pipedrive pattern, accepted" in the Figma desktop app." Saved in the Figma desktop app by a Claude session on Dean's yes and seen in version history at about 18:24 AEST as Dean Fiedler's entry. Afterwards only the page header's Status and Named version fields were updated; no frame changed |
| Opportunity number format | User decision, 18 October 2026, after acceptance | "Yes, correct the Discovery register frames to SYN-PPO-OPP- numbers and refresh the captures." The frames were corrected and the captures remade (section 6) |
| Proposed list-read fields | Build work, not confirmed data | Section 5 |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053), at the named version "Discovery register — Pipedrive pattern, accepted" |
| Page | "Discovery register · ES-02" `1400:345306`, before Estimation Wizard `383:2`. The page header `1400:345307` holds the conformance declaration; the notes card `1402:350109` is in Flows and notes. File index row "Row / Discovery register · ES-02" `1414:357730`, after Intake & workload and before Estimation Wizard |
| Desktop 1440 × 900 | Register, All workspaces `1400:345640`; Northbank snapshot `1400:352346` |
| Tablet 1024 | Register with the side menu collapsed `1400:355129` |
| Phone 390 and 320 | All workspaces list at 390 `1400:354630` and 320 `1400:354952` |
| States | Phone 390: loading `1400:355914`; no matching workspaces `1400:356040`; could not load `1400:356154`. Desktop 1440: no workspaces yet `1402:3944`; view only, no create permission `1402:4539` |
| Page parts | Section "Parts (proposal)" `1400:345375`: Discovery grid header `1400:345376` and Discovery grid row `1400:345440` (row set). They stay on the page, as the Sites and People parts do |
| Flow | "Discovery register — desktop (proposal)", starting at `1400:345640`: the Northbank row opens the snapshot and Close returns |
| Story | Synthetic, as at Tue 13 Oct 2026 09:00, signed in as Dean Fiedler. Eight workspaces. Northbank (SYN-PPO-OPP-000326) matches the accepted wizard: alternatives A Base scope (selected), B Reduced scope and C Staged delivery; A r03 saved 20 Sep 2026, Incomplete with two systems to confirm; estimate v04 AUD 58,400.00 costed on r02. Northbank's number is SYN-PPO-OPP-000326, the app's synthetic display number format (section 6). Titles, customers and estimate versions follow Intake & workload's saved estimates |
| Retained captures | [Discovery register design r01](../reference/ui/estimating/discovery-register-figma-design-r01/README.md): eight icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md), as on the page header.

| Field | Declaration |
|---|---|
| Scope identity | `scope:ES-02` Estimation Wizard; route `/estimating/discovery` (register entry `route:/estimating/discovery` "Discovery register"); parents PPO-010, EST-01–EST-09 (ADR-0035); capabilities unchanged |
| Page type (r20) | Register or worklist with a large snapshot (Pipedrive pattern). One scroll owner, the grid; the snapshot scrolls on its own |
| Reused components | Shell v2 rail (Estimation wizard current), the top bar with the Conversations action (proposed amendment), v2 Menu item, heading, strip and edge, Grid header cell, Grid / Cell, Checkbox cell, Row actions cell, Tag, Button, and the snapshot layout from PL-02. New, proposed, on this page: Discovery grid header, Discovery grid row and Discovery phone row |
| Incoming handovers | The CR-02 accepted Sales brief (`sales_handover`) and eligible opportunities without a workspace feed New discovery workspace; Intake & workload links here. Read-only on this page |
| Outgoing handovers | Opens `/estimating/discovery/[id]` (the accepted wizard) and `/estimating/discovery/new`; Open estimate goes to the saved manual estimate. It never edits discovery, never costs, and never prices or issues a quotation |
| Source authority | ADR-0035; [es02-wizard-figma-design.md](es02-wizard-figma-design.md) (accepted 12 October); Intake & workload (accepted); the Sites CS-04 and Field team PL-02 register patterns; `listDiscoveryWorkspaces` in `src/estimating/discovery-workspaces.ts` |
| Proposed departures | The list read gains customer, estimator, last changed and cost-basis state (today it returns number, title and options only); the heading "Scope and options" becomes the rail label; D1–D7 in section 4, accepted |
| Status | Owner-accepted design, 18 October 2026 |
| Decision record | This file |
| Named version | "Discovery register — Pipedrive pattern, accepted", saved 18 October 2026 |

## 4. What the design shows

### Register

- **Grid:** one row per workspace (one per opportunity), most recently changed first (D1, Q1). Title (bold), Customer, Readiness and Cost basis fill the first view at 1440 and 1024; Selected option, Opportunity, Latest revision, Options, Estimator and Last changed follow when scrolled.
- **Toolbar:** New discovery workspace (primary), Estimator and Customer filters, the count with its read time ("8 workspaces · as at Tue 13 Oct, 09:00"), and two toolbar actions. A footnote says the register holds up to 100 permitted workspaces, one row per opportunity, and that Complete discovery approves no price and issues no quotation.
- **Side menu:** All workspaces and My workspaces; Readiness (Not recorded, Incomplete, Complete, Legacy manual basis); Costing (Ready for costing, Latest not costed); Options (With alternatives), each with a count (D3).
- **Snapshot:** selecting a row opens the large snapshot (D5).

### Phone

- **List:** labelled rows with the title and changed date; the number, customer and selected option letter; and a readiness and cost-basis line with an icon. At 320 the second line carries the number and customer only, and a long customer name ends in an ellipsis (D7).
- **States:** loading; no matching workspaces, which names the filters that produce it (Incomplete, Estimator: Jordan Kim, 0 of 2); could not load, with no list or counts and a Retry loading action.

### Desktop states

- **No workspaces yet:** every view counts 0. The empty register says a workspace starts from an accepted Sales brief or an eligible opportunity without one, and that each opportunity has one workspace holding its alternatives and revisions. It offers Open Intake; New discovery workspace stays in the toolbar.
- **View only:** New discovery workspace is hidden without `estimating.edit` (D6). The count reads "8 workspaces · view only", and the footnote says every permitted workspace opens read-only and that creating one needs estimating edit permission.

### Departures, accepted

| ID | Departure | Built page |
|---|---|---|
| D1 | Register as a grid. One row per workspace, most recently changed first. Title (bold, the row's identity, as on Deals and Sites), customer, scope readiness and cost basis fill the first view at 1440 and 1024; selected option, opportunity number, latest discovery revision, options, estimator and last changed follow when scrolled | One card per workspace listing every option |
| D2 | Page identity. The breadcrumb carries the rail label "Estimation wizard" (register pattern, no visible heading) | The heading "Scope and options" and a back link to Intake & workload, which the rail replaces |
| D3 | Views. All workspaces and My workspaces. Readiness: Not recorded, Incomplete, Complete (the saved `scope_readiness` values) and Legacy manual basis (the `LegacyManual` revision kind). Costing: Ready for costing (the selected option's latest revision is Complete and has no estimate on it) and Latest not costed (the newest saved revision has no estimate, but an earlier one does). Options: With alternatives (more than one option, archived included). Views may overlap | No views |
| D4 | Status in words. Tags: Complete (success), Incomplete (warning), Not recorded and Legacy manual (neutral). Green means Complete scope readiness only, never priced or approved (wizard decision Q9). Cost basis names the estimate version and the revision it was costed on, for example "v04 on r02 · r03 not costed" | Each option's label, Selected basis or Alternative, state, revision and readiness as plain text |
| D5 | Snapshot (PL-02 pattern). The selected basis with its latest saved revision, readiness and systems; the cost basis with the saved estimate and a warning when newer discovery is not costed; Alternatives and Revisions tabs; recent activity. Footer: Open estimate and Open workspace. Read-only | No snapshot; the title links to the workspace |
| D6 | Create. "New discovery workspace" (primary) goes to the existing `/estimating/discovery/new` and is hidden without `estimating.edit` (view-only state). The register never creates, edits, costs or prices in place | A New discovery workspace button beside the heading |
| D7 | Phone. Labelled list rows: title and changed date; number, customer and selected option; a readiness and cost-basis line with an icon. A row opens the accepted wizard phone frames, so there is no phone snapshot. Estimation wizard is the selected tab. Page guide moves into the identity menu at 390 as well as 320 so the title fits | The same card list at every width |

## 5. Not decided and not drawn

- **Building the page.** The built `/estimating/discovery` keeps the "Scope and options" card list. The build order is not decided.
- **Proposed list-read fields.** `listDiscoveryWorkspaces` returns today, per workspace: the id and version, the opportunity id, title and display number, the selected option, and each current option's label, state, revision and `scope_readiness`, for up to 100 workspaces most recently updated first. The register also needs:
  - customer;
  - estimator (the workspace owner, or "Last saved by" under Q2);
  - last changed;
  - a cost-basis summary: the latest estimate version and the discovery revision it used.

  These are proposed read fields for a build, not confirmed data. Whether a workspace owner is recorded is to be confirmed before build (Q2). The view counts in D3 also depend on these fields.
- **Not drawn:**
  - Create discovery workspace and Discovery costing (Q4: next);
  - bulk actions (the checkbox column follows the shared grid; none are proposed);
  - column settings;
  - denied rows;
  - 200% zoom;
  - the snapshot's Revisions tab at full size, desktop loading and error states, and hover states.
- **The Conversations action** is part of the proposed top-bar shell amendment.
- **Data in the frames:** the workspaces, opportunities, customers, estimates and people are synthetic. They are not operational records.

## 6. Audit and polish

At Dean's request Claude checked every frame for fonts (Roboto only), text left over from the cloned Sites and Field team frames, measured truncation, the Conversations action on every top bar, rail and tab selection, and prototype links.

- **Changed:**
  - Title moved to the first column in bold and Cost basis brought into the first view, so no title, customer or cost basis is cut off at 1440 or 1024.
  - 32 checkbox links were copied with the grid; the row link that jumped to Intake & workload was removed.
  - The inherited SV-06 and CS-04 flow starts were replaced by one flow, "Discovery register — desktop (proposal)": the Northbank row opens the snapshot, and Close returns.
  - The no-matches phone state shows the filters that produce it (Incomplete, Estimator: Jordan Kim, 0 of 2), and its "as at" time matches 09:00.
  - Phone 320 second lines carry the number and customer only.
  - Shade screen is v2 on r01 with r02 ready to cost, matching its saved estimate v2 on Intake & workload. Latest not costed counts 3.
- **Remaining by design:** at 320 the page title and the longest workspace title end in an ellipsis (Q3).

The audit is recorded on the notes card `1402:350109`.

### Correction after acceptance

Another Claude session, drawing Create discovery workspace, found that the frames showed opportunity numbers as `OPP-000326`, while `display_number` in the app and its tests, and the accepted Sales briefs page, use `SYN-PPO-OPP-…`. Dean decided: "Yes, correct the Discovery register frames to SYN-PPO-OPP- numbers and refresh the captures." Claude then:
- replaced all 53 numbers on the page (grid cells, phone rows, the snapshot subtitle and the notes card's story) and renamed the 48 grid rows;
- widened the Opportunity column from 110 to 170 px in the Discovery grid header, all three row variants and the five grids (1649 to 1709 px), so the number is not cut off;
- made each phone 390 second line the number, customer and selected option letter, dropping the option name or option count, which no longer fitted;
- let the snapshot subtitle wrap to a second line, keeping "Dean Fiedler" together;
- remade the eight captures from the corrected frames.

At 320 the second lines keep the number and customer, and "SYN Greenhouse Demonstration" ends in an ellipsis, as Q3 accepts for the 320 title. The notes card records the correction. The named version predates the correction (section 7).

## 7. Verification

- Claude checked the frames with screenshots taken inside Figma during the drawing and the audit.
- The eight captures are copies of the corrected frames on the "Captures (icon-free)" page, from y = 228,000. Prototype links were removed from 112 layers, and each of the 344 Font Awesome icon instances was swapped for `Icon/placeholder`. Three scans followed:
  - no Font Awesome instance was left; the only visible vectors outside a placeholder or the logo are the four timeline dots in the snapshot's recent activity;
  - none of 697 visible texts had a stored colour that differed from its bound variable;
  - no copy carries a prototype link or a flow starting point.
- The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder. The hashes are in the [captures README](../reference/ui/estimating/discovery-register-figma-design-r01/README.md).
- After the named version was saved, the page header's Decision record field and the notes card's Accepted paragraph were updated to point at this lock-in.
- The frames were then changed by the number correction in section 6, so the named version "Discovery register — Pipedrive pattern, accepted" shows the earlier `OPP-` numbers. The captures show the corrected frames. A later named version for the corrected frames is saved only on Dean's yes.
- The page has one prototype flow. Claude did not play it in Present mode.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
