---
document_id: PPO-ES01-ESTIMATE-DETAIL-FIGMA-DEC
date: 2026-10-30
owner: Dean Fiedler
status: Owner-accepted design, 30 October 2026; native implementation and UI baseline acceptance separate
source_commit: fa15714324b1dcb939355666023272e0a4ffb0f3
versioning: git
---

# Estimate detail and Create estimate design — owner decision

Both pages are built (`EstimateDetail` and `NewEstimate` in `src/components/estimating-screens.tsx`; register entries `route:/estimating/estimates/[id]` and `route:/estimating/new`, both "refine"), but neither had a Figma design. Every estimating page links to them, and the [Excel import design](excel-import-figma-design.md) left "the estimate record page with its Import evidence section (Q3)" undrawn.

On 23 October 2026 Dean asked Claude to design both in Figma as a proposal. He set the page's place under his [estimating model](estimating-configurator-model.md): it is the record of the adopted estimate versions, not where prices are edited, and price changes go back to CPQ. Claude drew the page and summarised it with the recommended answers. On 30 October 2026, asked "Do you accept the Estimate detail design with the recommended answers?", Dean answered: "Accept and lock in". That adopts departures D1–D16 and the recommended answers to Q1–Q8.

Scope:
- Register entries `route:/estimating/estimates/[id]` and `route:/estimating/new`, both within `scope:ES-01`. The routes are unchanged.
- Parent requirements EST-03, EST-04 and CRM-05. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission or capability. In particular, the running page keeps its editable cost workbook and its manual cost lines until a separate change replaces them, under build steps CM11 B1 and B6 of the estimating model.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design both pages as a proposal | User decision, 23 October 2026 | Dean's brief: "Your task is to design and build the Estimate detail page (/estimating/estimates/[id]) and the Create estimate page (/estimating/new) in Figma as a proposal for my review." |
| The page records adopted versions; prices stay in CPQ | User direction, 23 October 2026, applying CM3 and CM6 | The same brief: "It is not where prices are edited: price changes go back to CPQ, and the page says so." |
| A changed source never silently refreshes | User direction, 23 October 2026 | The same brief, point 3 |
| Departures D1–D16 | Accepted as recommended, 30 October 2026 | Dean's "Accept and lock in", quoted above. Section 4 |
| Q1 Show a margin | Resolved as recommended | Yes, to estimating roles only. [CPQ](cpq-figma-design.md) already shows gross margin and markup side by side with formulas, and [Quotation detail](quotation-detail-figma-design.md) Q4 says estimators see cost and margin on the estimate. Illustrative, with no target, floor or threshold, and never on the quotation |
| Q2 Who may adopt a new version | Resolved as recommended | The estimate owner, through CPQ Use of one exact evaluation, or through an Excel import. Reviewers never adopt, and an author, owner or submitter never reviews their own version. Another estimator adopts only after ownership is reassigned |
| Q3 Whether Create estimate exists under the hub model | Resolved as recommended | Yes, as a search-first entry that never duplicates: it opens an existing estimate or workspace, and otherwise offers Express (CM2) or a guarded Start discovery. The Wizard stays the main route |
| Q4 Which tab opens first | Resolved as recommended | Summary. Review opens first when the current version is Returned or waits on you as reviewer, and Sources when the source changed since adoption. The tab is kept in the link, as on Quotation detail |
| Q5 Version numbers in the story | Resolved as recommended | The brief asked for version 2 after a CPQ re-run, but the accepted CPQ page fixes v04 → v05 from evaluation 3. The accepted numbers stay: v05 after the re-run, Returned; v06 with the override, Reviewed |
| Q6 Differences on other pages | Resolved as recommended | Section 5. This page follows CPQ and Excel import. The others are corrected when each page next changes, with Dean's yes |
| Q7 Origin of Excel-imported lines | Resolved as recommended | Manual, with the workbook as the source, until a backend contract decides ([Excel import](excel-import-figma-design.md) Q2) |
| Q8 Alternatives never adopted | Resolved as recommended | Shown as Not estimated, with a route to the Wizard, so a missing price is visible rather than absent |
| Building the pages | Not decided | Section 6 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, page "Estimate detail · ES-01" `2244:733125` (after Intake & workload `128:8845`). The named version is "Estimate detail — shared record layout, accepted", saved on 31 October 2026. The file's link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Desktop 1440 | Summary, v06 reviewed, full length `2245:743026` (flow start "Estimate — desktop"); Lines by origin with an override `2245:759010`; Versions comparing v05 with v06 `2245:759996`; Review tab waiting `2245:771050`; Quotations tab `2245:771748`; Import evidence `2245:792955`; Sources tab, source changed since adoption `2245:793754`; Create estimate search first `2248:772149` (flow start "Create estimate — desktop"); Create estimate form `2248:772634`; Created `2248:773127` |
| Tablet and phone | Tablet 1024 `2259:2850`; phone 390 summary `2263:772339` (flow start "Estimate — phone") and read-only lines `2263:772600`; phone 320 summary `2263:772859` and read-only lines `2263:773120` |
| States | Loading `2259:3466`, could not load `2259:3789`, no access reading as not found `2259:4123`, stale version on save `2262:9525`, uncertain save `2262:9942`, no estimate yet for the opportunity `2262:10243` |
| Notes card | `2267:8570`: the story, D1–D16 with their basis, Q1–Q8, kept rules and what is not drawn |
| Shared parts | Record / Header, View tab, Field, Section heading, Banner and Filter chip; Grid / Header cell and Cell; Tag; Button; Quotation detail / Lifecycle step (as the checks bar) and Linked chain row; the Estimating rail with Intake & workload selected; the top bar with the Conversations action (badge 3); Shell / Phone header · compact. No new component was made: cards, inputs and search results are page-local layers |
| Prototype | Flows "Estimate — desktop", "Create estimate — desktop" and "Estimate — phone". The brief named the first and third; the second was added so the create journey can be played from its own start |
| Retained captures | [Estimate detail design r01](../reference/ui/estimating/estimate-detail-design-r01/README.md): 21 icon-free PNGs at exact frame size, with hashes. The capture copies are `2771:428051`–`2771:434352` on the Captures page, from y = 480,000; the File index row is `2771:412662` |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `route:/estimating/estimates/[id]` and `route:/estimating/new`, within `scope:ES-01`. Related: ES-02 Estimation wizard and discovery, ES-03 CPQ and cost sources, ES-04 review, ES-05 quotation. Parent requirements EST-03, EST-04 and CRM-05, unchanged |
| Page type (r20) | Estimate detail: Record detail, with Review / comparison (Versions) and Document & evidence workspace (Sources, Import evidence). Create estimate: Form / guided workflow. Phone: one record page with the compact record header and a sticky action bar |
| Reused components | Section 2, shared parts |
| Incoming handover | The Saved estimates view of Intake & workload; the Discovery register and Estimation wizard; CPQ "Open estimate vN" after Use; Reviews & approvals; Quotation detail's linked chain; Excel import "Open estimate v1"; the Deal record's Estimates & quotations tab; `/estimating/new` from Intake (V2) and Saved estimates. Opening either page decides nothing |
| Outgoing handover | CPQ (Open in CPQ, Edit in CPQ); `/estimating/estimates/[id]/sources`; `/estimating/estimates/[id]/review` (ES-04); ES-05 preparation (Prepare quotation) and Quotation detail; the Estimation wizard; Create discovery workspace (Start discovery, guarded); cost source records; Excel import |
| States shown | Section 2 |
| Departures | Section 4 |
| Verification | Section 7 |

## 4. What the design shows

The story is synthetic, and all values are illustrative AUD excluding tax. SYN-EST-000148 "Northbank climate & irrigation upgrade" belongs to SYN-OPP-000326 at SYN Northbank Nursery, Caboolture site, with estimator Dean Fiedler, Alternative A — Base scope and CPQ configuration SYN-CPQ-000014.

From the accepted CPQ page: v04 at 58,400.00 (evaluation 2) and v05 at 60,971.31 (evaluation 3, release R4, 12 October at 09:42), and quotation SYN-QUO-0094.

Drawn here:
- The v05 Technical review was Returned on 13 October, because the cable run was 140 m against the surveyed 150 m.
- v06 at 61,069.81 came from evaluation 4 on 14 October, with one reasoned override: Cable brackets 40, calculated 35, which is the CPQ page's own adjustment.
- v06 was Reviewed on 15 October at 10:30, and SYN-QUO-0094 r2 was prepared at 14:05.
- A cost source and a workbench run changed on Monday 19 October.

Import evidence uses the accepted Excel import story (SYN-PPO-EST-000318, workbook SYN-WB-0412). Create estimate uses SYN-PPO-OPP-000019 from Sales briefs and creates SYN-EST-000149.

### Departures, accepted

| ID | Departure | Basis |
|---|---|---|
| D1 | The page becomes the record of adopted versions. Lines and prices are read only, and Open in CPQ or Edit in CPQ routes every change to CPQ. Today the page embeds the editable scope-and-cost workbook (`EstimateEditor`) and saves versions there | The brief; estimating model CM3 and CM6 |
| D2 | A checks bar of five facts: Scope complete, Costs sourced, Lines resolved (unmapped and one-off), Reviewed (ES-04) and Quoted. Each reads Done, Now, Not yet or Attention in words, with its fact | The brief; Quotation detail D2; CM8 |
| D3 | The primary action follows state: Submit for review (draft, not submitted); Open review (submitted, waiting); Open in CPQ (Returned, source changed, or no lines yet); Prepare quotation (Reviewed, with no quotation for this version; it opens ES-05 preparation, which today is the inline `PrepareDraft`); Open quotation (prepared) | The brief; ES-04 rules; Quotation detail D3 |
| D4 | Tabs: Summary, Lines, Sources, Versions, Review, Quotations, Import evidence (only for estimates from an Excel import) and History. Counts are neutral. Today one long page links to `/sources` and `/review` and uses disclosures | The brief; the shared record layout |
| D5 | Summary: totals as adopted (sell, plus internal cost, gross margin and markup with formulas); alternatives, with those not adopted reading Not estimated, never zero; totals by system and origin; what changed from the previous version; and scope as adopted | CPQ display rules, D6 and D13; Quotation detail Q4 |
| D6 | Create estimate searches first and opens an existing estimate or workspace. Otherwise it offers Express estimate (Direct CPQ, CM2) or Start discovery, guarded by an accepted Sales brief (V2). Manual cost lines and proposal totals leave the form for CPQ (CM3, B6). Unknown values stay explicit (Site to be confirmed, Unknown) | The page contract; CM2; the Discovery register and [Create discovery workspace](create-discovery-workspace-figma-design.md) |
| D7 | Source changed since adoption: when a cost source revision or workbench run changes after adoption, the version keeps its values, the tag, banner and checks say so, and the page points to CPQ. Nothing refreshes, and the quotation stays exact | The brief, point 3; CM6; [Cost sources](cost-sources-design.md) |
| D8 | Lines: a read-only grid grouped by system, with full-width group bands. Each line shows its origin (Rule, Workbench, Manual, Variant, One-off). An override shows calculated, yours and effective with its reason. An unmapped part never reaches a version and is shown with the waiting CPQ evaluation | CM3, CM4, CM6 and CM8; the CPQ three-quantity rule |
| D9 | Versions: every version with how it was made, its review and quotation, and a comparison of any two (measures and changed lines). The `version_id` link state is kept | The brief; today's "Saved versions and change reasons" |
| D10 | Review: the ES-04 state of each review kind for the current version, carried-forward decisions, earlier Returned reviews with findings, and Open review | [ES-04 native review](estimating-review-native.md); [Reviews & approvals](estimate-reviews-design.md) |
| D11 | Quotations: revisions made from this estimate with their exact source version, linking to Quotation detail. Today this is "Quotation revision history" | The brief; [quotation release](quotation-release-native.md) |
| D12 | Import evidence: each import with its workbook revision, file and hash, confirmations, comparison decisions and replaced prices, and how the versions came about | Excel import Q3 |
| D13 | A linked-records chain in the details column: Deal, Discovery, CPQ, Estimate and Quotation, each with its status in words | Quotation detail D13 |
| D14 | Tablet: rail collapsed, details column 300 px, Quotations and History under More. Phone: compact record header, a content-first summary with checks and review state, section links, read-only lines as list rows, and sticky 48 px actions | [Phone header amendment](phone-header-amendment.md) P1–P9; Quotation detail D11 |
| D15 | The page sits under Intake & workload (the Saved estimates view), and the breadcrumb reads "Saved estimates / reference" for every estimating role | [Intake & workload](intake-workload-design.md) |
| D16 | New references SYN-EST-000148 and SYN-EST-000149. Invented here: the v05 review history, evaluation 4 and v06, line amounts inside the CPQ group totals, cost sources SYN-SRC-000052 to 000056, ES-08 run R02 and dates after 12 October. No existing reference is renamed | [Readable reference namespaces](readable-reference-namespaces.md) |

## 5. Differences on other pages, not edited

Q6 leaves these as they are. Each is corrected when its page next changes, with Dean's yes.

- SYN-OPP-000326 is also the Deal record's "Potting machine and take-off".
- SYN-QUO-0094 is "Greenhouse fertigation upgrade" on the Quotations register, but Northbank's quotation on the CPQ page.
- The Discovery register (13 October) still shows v04, after CPQ created v05 on 12 October.
- SYN-PPO-OPP-000331 is the Riverbend estimate on Excel import, but another opportunity on the Discovery register.
- The estimating workflow sections drawn on 21 and 22 October carry their own Northbank values (for example estimate v04 at evaluation 4). They are not the accepted CPQ story, and this page does not follow them.

## 6. Not decided and not drawn

- **Building the pages.** The design depends on CPQ line origins and Manual lines (CM11 B1), retiring manual costing into CPQ (B6, which also removes the workbook and the form's cost lines), the Express workspace (CM2, B3) and the workbench parts proposal (B2). The checks bar, the Source changed marker and the by-system totals need reads that do not exist today. Each needs its own authorisation and pull request; no capability is proposed here.
- **Not drawn:** History tab content; the Sources tab with no change; the Riverbend Summary; the `/sources` and `/review` destination pages, which are linked and not redrawn; Create estimate at tablet and phone sizes; 200% zoom.
- **Not checked:** keyboard order, focus return and screen-reader behaviour.

## 7. Verification

- A scripted check found no overlapping frame and nothing outside its section. A measured check of every one-line text against its own width and its clipping parents, run at lock-in on 30 October, flagged only the phone Lines filter chips, which scroll by design, and two file names in the Imports grid, whose column was then widened.
- Looking at the captures at lock-in found four defects that the 23 October check had missed. All were fixed on the page and its capture copies before the final export, so the accepted page differs from what Dean last saw in these respects only: about 400 px of empty space at the foot of the Summary frame (now 1842 px); 16 px clipped at the foot of the form frame (now 1539 px); clipped result text on the Create estimate search frames, which now wraps; and a cut-off "Import" column header, with the record header's origin line shortened on the Import evidence frames.
- The prototype has 37 links on the page and none pointing to another page. It was not played in Present mode.
- The 21 captures are copies of the accepted frames with every Font Awesome icon swapped for `Icon/placeholder`; a check after the swap found no icon instance left. They were exported at scale 1 with the Figma connector. Hashes are in the [captures README](../reference/ui/estimating/estimate-detail-design-r01/README.md).
- Claude saved the named Figma version "Estimate detail — shared record layout, accepted" in the desktop app on 31 October 2026, on Dean's "Yes, save it", and saw it at the top of the version history.
- Nothing new is built, so there is no application or device evidence. This record implies no visual review of the application and no UI baseline.
