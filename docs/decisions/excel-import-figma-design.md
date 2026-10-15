---
document_id: PPO-010-EXCEL-FIGMA-DEC
date: 2026-10-15
owner: Dean Fiedler
status: Owner-accepted design; native implementation, Wizard launch action and UI baseline acceptance separate
source_commit: cfd465f20787e321df9e80244b3df7aed307b6b2
versioning: git
---

# Excel estimate import design — owner decision

On 14 October 2026 Claude audited the repository and the Figma file for the next page to design. It recommended the Excel estimate import because its backend had merged with no user interface at all: validated upload and review, durable first save, revised-workbook comparison, quotation continuation, 500-line capacity, reviewed source pricing, reviewed FX and landed-cost allocation (PRs #484 to #489 and the earlier review and persistence increments). The app had no import route, and the only design was the 15 September standalone HTML preview, drawn before Figma, before Shell v2 and before most of that backend. Dean replied: "Proceed with the next page." Claude drew the page in Figma with synthetic data, using the accepted [Estimation Wizard](es02-wizard-figma-design.md) as its pattern. On 15 October Dean accepted it: "Proceed with your recommendations." The design reference is the named Figma version "Excel import, Products and Inventory — accepted", which also covers the [Products](products-figma-design.md) and [Inventory](inventory-figma-design.md) designs accepted the same day.

This record retains his decisions, the design reference and its icon-free captures, the conformance declaration, the display rules, the departures and what remains open.

Scope: register entry `scope:excel-import` under PPO-010 and BC-04, with the application destination `/estimating/import` named in its [design record](../design/development/pages/scope-excel-import.md). It has no ES scope ID, and none is invented. Parent requirements EST-02 to EST-05, EST-07, EST-08, DOC-01 and DOC-02 and the acceptance checks XI-01 to XI-08 keep their scope and open acceptance. No parent requirement ID is added or renamed. This is a design decision. It authorises no application code, route, migration, permission, capability or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the Excel import next | User decision, 14 October 2026 | Claude's audit ranked it first: the most design-blocked backend, no route or UI, the last undesigned Estimating scope, and the workflow where estimates enter PPO. The Document Library (DK-01/DK-02) was the runner-up. Dean: "Proceed with the next page" |
| Build on the Estimation Wizard pattern | Claude's recommendation, adopted | The import starts from a Wizard workspace (the API is `/api/v1/estimating/workspaces/{id}/excel-import/...`), so it reuses the Wizard's shell, context header, step cards, findings by effect, summary panel and action bar |
| Accept the design and its recommendations | User decision, 15 October 2026 | "Proceed with your recommendations." Every recommendation on the notes card is adopted and each open question takes its recommended answer (the rows below) |
| R1 Launch from the Wizard and the estimate, not from a rail item | Claude's recommendation, adopted | Import needs an exact Draft workspace, option and Complete discovery revision, so it is a contextual action. The breadcrumb reads "Estimating & quotation / Estimation wizard / Excel import" and Estimation wizard stays selected in the rail |
| R2 Corrections happen in Excel | Claude's recommendation, adopted | The backend accepts no caller-supplied lines or adjustments. Review names the sheet, table and row to correct, and the user uploads the corrected workbook |
| R3 Re-import warns when it replaces reviewed source prices | Claude's recommendation, adopted | Re-importing after source pricing replaces the priced costs with workbook costs and drops their bindings ([revision contract](../contracts/excel-import-revision.md), managed source-binding disposition). The comparison lists each replaced price and links to pricing again |
| R4 Phone supports review and saving | Claude's recommendation, adopted | Every line stays reachable through "Show all lines". Comparing many lines side by side is a larger-screen task |
| Q1 Wizard launch action | Resolved by "Proceed" | "Import Excel estimate" is a secondary action in the Wizard's Review Actions, beside Open manual estimate, available when discovery is Complete and no estimate exists |
| Q2 In-PPO reasoned adjustments | Resolved by "Proceed" | Not designed until a backend contract exists. The specification's eligible-field adjustment (section 4, step 5) stays a future option |
| Q3 Import history | Resolved by "Proceed" | It belongs in an Import evidence section on the estimate record, designed with that page |
| Building the pages | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Excel import, Products and Inventory — accepted". The file's link is not recorded in this public repository, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Page | "Excel estimate import" `711:38`, in the Estimating & quotation group after the Priva Fertigation workbench. Its header holds the conformance declaration; its notes card `725:2053` lists the scope, rules, recommendations, answers and what is not drawn |
| Accepted frames | Desktop: 1 Choose workbook `712:268`; 2 Review, blocked `713:438`; 2 Review, ready `714:616`; 3 Confirm and save `716:799`; 4 Saved `717:991`; Compare revised workbook `719:1167`; Price from reviewed sources `720:1349`; Prepare Draft quotation `721:1529`. Tablet: Review `721:167612`. Phone: Review `723:10503`, Saved `724:1939`, 320 px blocked `724:2078`. States board `725:1978` |
| Page components | Excel confirmation row `715:810` (Checked, Unchecked; Title and Description properties) and Excel decision row `718:1194` (None, Keep, Remove; Line and Detail properties) |
| Shared parts | From the Estimation Wizard page `383:2`: Wizard / Context header `385:168`, Wizard / Step `383:33`, Wizard / Working-copy bar `385:165` and the Wizard / Summary panel `385:13` (detached and adapted as the Import summary). From Shell v2 and the Components page: the Estimating rail, Shell / Top bar, Tag, Button, Grid / Checkbox, Record / Banner and Record / Filter chip |
| Retained captures | [Excel import design r01](../reference/ui/estimating/excel-import-figma-r01/README.md): thirteen icon-free PNGs at exact frame size, with hashes. These are the repository reference for this decision |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | Register entry `scope:excel-import`, PPO-010 / BC-04, proposed route `/estimating/import` opened from a Wizard workspace and an imported estimate. Requirements EST-02 to EST-05, EST-07, EST-08, DOC-01 and DOC-02; checks XI-01 to XI-08. Capabilities unchanged: estimating read and edit for import, quotation prepare and read for the Draft step |
| Page type (r20) | Form / guided workflow (Workbook, Review, Confirm and save, Saved), with Review / comparison for a revised workbook, reviewed source pricing and the Draft quotation continuation |
| Reused components | Section 2. New page components: Excel confirmation row and Excel decision row |
| Source authority | [Specification](../contracts/excel-estimate-import.md), [review](../contracts/excel-import-review.md), [first save](../contracts/excel-import-persistence.md), [revision](../contracts/excel-import-revision.md), [quotation](../contracts/excel-import-quotation.md), [capacity](../contracts/excel-import-capacity.md), [source pricing](../contracts/excel-import-source-pricing.md), [reviewed FX](../contracts/excel-import-reviewed-fx.md) and [landed costs](../contracts/excel-import-landed-costs.md). Fixture: a synthetic Riverbend propagation irrigation workspace, workbook `SYN-WB-0412`, people, sources and amounts |
| Incoming handover | From the Estimation Wizard: the exact Draft workspace, selected Active option and Complete discovery revision (the basis hash). From an imported estimate: its exact saved version, for re-import, pricing or the Draft quotation. Workbook values never select a record; references must be exact native IDs |
| Outgoing handover | A native estimate version with the original workbook and review evidence; a priced successor with reviewed Cost Source bindings; one native Draft quotation revision through the existing render path. It never issues a quotation, approves a price, changes scope, posts to MYOB or writes to SharePoint |
| States shown | Choose workbook; review blocked and ready; confirm and save; saved; revised-workbook comparison with decisions; pricing; Draft quotation; tablet review; phone review, saved and blocked. The states board covers reading, a refused file, over 500 lines, workspace changed, comparison required, save result unknown, access changed, original unavailable and a missing decision |
| Departures | Section 4 |
| Verification | Section 7 |

## 4. Display rules and departures

### Workflow

- **Four step cards** run every workflow: Workbook, Review, Confirm and save, Saved for the first import, and the same shape for comparison, pricing and the Draft. Nothing is saved before the confirm step, and the action bar says so.
- **Findings by effect** use the Wizard's groups: Prevents saving (errors that block), Confirm before saving (source warnings) and Informational. Every finding names the sheet, table and row PPO read. Missing or duplicate line keys are never guessed.
- **Totals are PPO's own calculation.** An incomplete amount shows Unknown, with no partial sum. The workbook's PPO_Control totals are compared to the cent, never trusted.
- **Confirmations are explicit rows**, kept under the user's name: Source calculation, Scope, Reconciliation and Source warnings for a first save or re-import; Comparison reviewed and Charges not already included for pricing; Customer wording, Include and print and Reconciliation for the Draft.
- **Comparison** counts Added, Changed, Unchanged, Not in workbook and PPO-only lines. Each omitted line needs Keep or Remove, and Continue stays unavailable until every decision is made. Reviewed prices that the workbook replaces are listed with their sources.
- **Pricing** shows each source revision and tier, the original foreign price and recorded rate for an FX source, each landed charge with its evidence, and the allocation to every line to the cent. Sell prices do not change.
- **Draft quotation** reconciles estimate sell, workbook included sell, the user's choices for kept lines and the Draft total. Kept lines without a workbook proposal need an explicit choice. The customer preview shows only customer-safe content.

### Departures

| ID | Departure | Earlier design or app |
|---|---|---|
| X1 | The accepted Wizard layout replaces the September r01 HTML preview layout | The [r01 preview](../blueprints/excel-estimate-import.html): three steps, a context strip and a summary panel, with browser-memory demo saves |
| X2 | No in-PPO line adjustments; corrections are made in Excel and uploaded again | The specification allows reasoned adjustments to eligible fields; the backend implements none |
| X3 | Import is a contextual action from the Wizard and the estimate, not a rail item | Not applicable; no app page exists |
| X4 | The phone supports review and saving, with every line reachable, but no side-by-side comparison of many lines | Not applicable |
| X5 | Comparison, pricing and the Draft reuse the four-step shell and Import summary panel | Not applicable |

The synthetic amounts reconcile across versions: v1 import (cost AUD 61,240.50, sell AUD 84,915.00), v2 priced (cost AUD 61,285.70), v3 with a PPO-only line, v4 re-import (cost AUD 61,320.50, sell AUD 85,305.00) and a Draft total of AUD 84,155.00. They are illustrative, not operational prices or policies.

## 5. Not decided

- **Building the pages.** The route, the Wizard's Review action (Q1) and the estimate-record actions need implementation against the merged APIs. The Wizard action adds to the accepted Wizard design; it is recorded here, not drawn on the Wizard page.
- **Still open:** native FX authoring and review controls for Cost Sources are not implemented (reviewed FX contract); operational workbook compatibility has not been assessed, because no redacted departmental workbook has been supplied.
- **Not drawn yet:** pricing steps 1 and 2 (the line and source picker and the charge entry form), the full line list, the estimate record page with its Import evidence section (Q3), and prototype links.

## 6. Consequences

- No application code, route, migration, permission or capability changes. No scope or parent requirement ID changes; all 78 parent IDs remain.
- The [Excel import register entry](../design/development/pages/scope-excel-import.md) now links this design and its captures. Its visual status stays "Needs review": nothing is built.
- When the pages are built, they are compared with these captures and the Figma frames at the same viewports, following ADR-0053 rule 7.
- A later change to this design receives a new named version and a new capture revision folder; these bytes stay unchanged.

## 7. Verification

- Claude checked every frame with screenshots taken inside Figma while drawing, and recomputed the synthetic amounts so that every total reconciles. Claude cannot run Present mode through the connector, so no click-through was exercised.
- The thirteen captures are copies of the accepted frames with every Font Awesome icon instance swapped for `Icon/placeholder`. A scan after the swap found no Font Awesome instance left, and a second scan found no text whose stored colour differed from its bound variable or matched its background. They were exported at scale 1 with the Figma connector, and each image was inspected. The hashes are in the [captures README](../reference/ui/estimating/excel-import-figma-r01/README.md).
- `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py`, `node scripts/design-baseline-check.mjs` and `npm run studio:check` were run on this change.
- Nothing is built, so there is no application or device evidence. This record implies no visual review of the application and no UI baseline.
