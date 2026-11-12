---
document_id: PPO-ESTIMATING-REFINED-FIGMA-PROP
date: 2026-11-10
owner: Dean Fiedler
status: Accepted by Dean Fiedler on 10 November 2026 on the recommendations recorded in section 12 (A1–A24 and Q1–Q12 decided); re-aligned 9 and 10 November 2026 to his prompt version 4 and addendum A2 (section 11); two directions he gave on 9 November are recorded in section 10; Design ready check run by an independent session and its corrections made, the lock-in done except the named version, and the accepted audit batch drawn (section 12); the named version "PPO - Estimating module (accepted)" saved by Dean Fiedler on 10 November 2026; not an implementation baseline; no application code, route, read model, migration, permission, capability, grant, seed or deployment; every record shown is synthetic; an alignment batch from the independent review of 12 November 2026 (PPO-ESTIMATING-REVIEW-PROP) was drawn the same day and is recorded in section 13; it is an amendment that needs Dean's acceptance and a new named version, so the build source stays "PPO - Estimating module (accepted)" until then
source_commit: 900daa9d0929c12251226c4a7ff02cce247ad9f9
versioning: git
---

# Estimating module refined UI pages — proposal

**Owner:** Dean Fiedler · **Date:** 9 November 2026, re-aligned 10 November 2026 · **Status:** Accepted on 10 November 2026 (section 12); checked, corrected and locked in the same day; the named version "PPO - Estimating module (accepted)" was saved by Dean Fiedler on 10 November 2026. Sections 1 to 8 are the proposal record as it stands after the re-alignment; section 9 holds the audit made before the first hand-back; section 10 records the two directions Dean gave on 9 November 2026 and what was drawn from them; section 11 records the re-alignment to his prompt version 4 and addendum A2; section 12 records his acceptance, the decisions adopted, the Design ready check, the lock-in and the audit batch drawn from it. Later sections will record acceptance, drawn batches and named versions as the [Sales record](sales-module-refined-ui-proposal.md) does. Section 13 records the alignment batch of 12 November 2026, which awaits acceptance and a new named version.

On 9 November 2026 Dean asked for the complete refined UI page set of the Estimating module to be drawn in a brand-new private Figma file, "PPO - Estimating module (proposal)", inside the accepted shell and to at least the standard of the Sales module file, using the accepted "PPO - Shell" file as the source of truth for the chrome and the Design file's Estimating pages as content reference only. His brief fixed ten decisions: the module is named Estimating; quotations are an output of Estimating and exist in Sales as simple quotations; four specialised workbenches (Screens, Fertigation, Automation, Control) share a generic template; Excel estimates import to lines and keep the workbook as evidence; review and approval gates are rule-based and explained; customer e-mail and page tracking are built in; customisation publishes from drafts with impact shown; one register standard applies to the whole application (reorder, resize, inline edit with a change reason, address lookup); the docked workspace menu can collapse; and the synthetic story stands at Thursday 5 November 2026, 09:00, signed in as Priya Nair, estimator. He gave the same four rules as for Sales: one line of data per register cell even if the table scrolls sideways, no second search bar in the content area, pages as professional as the shell, and otherwise full creative control, with everything undecided decided by the designer and recorded for him.

Later on 9 November Dean issued version 4 of the prompt and addendum A2. Version 4 binds a page template (one Figma page per scope between an — Accepted — and a — Proposals — separator, six sections per page), makes the synthetic dataset of its section 9 the truth for every sheet, adds the drill-through list I04 and the New Express workspace dialog X44, sets the tablet top bar zones to 332 / 360 / 332, gives the seven gate sentences and template Quotation r04 with six section keys, and asks for the persona × capability matrix and the interface matrix to seed this record. Addendum A2 confirms the short reference form of [readable reference namespaces](readable-reference-namespaces.md) (SYN-EST-000312, SYN-QUO-000214 r02, SYN-OPP-000312, SYN-DEM-000103, SYN-PRJ-000190; revisions two-digit) and withdraws the long D12 form, the "reconcile short forms" follow-up and question Q7. The file was restructured and every sheet re-aligned on 9 and 10 November; section 11 lists the changes and the re-verification.

This record was a **proposal** until 10 November 2026 and is now the **accepted design record** of section 12. It describes what was drawn, the rules applied, the assumptions made and the questions Dean has to decide. It changes no code, test, migration, seed, permission or route. Acceptance of the design will not make the drawn pages an implementation baseline: source presence, visual review of built pages, functional proof and deployment stay separate.

## 1. Sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Shell (accepted)", named version "Shell refined concept — accepted" (8 November 2026), pages "Shell refined · desktop shell and menus" and "Workspace menus · flyout and docked" | Chrome and geometry: 48 px top bar, 80 px collapsed rail, 48 px right strip, content from x 80 to 1392, 280 px docked workspace menu, the accepted 12 px collapsed strip, navy selection bar, white canvas. The shell components, the Estimating flyout and docked menu and the 101 icon components were copied into the new file under the same names so instances can be swapped to the published library later |
| Private Figma file "PPO - Sales module (accepted)", named version "PPO - Sales module (accepted) · batch 2 · N13" | The standard to match: its header, index and audit cards, kit components (chip, button, avatar, checkbox, filter chip, tab, KPI tile), derived tablet and phone chrome, helper library and verification routines were carried into the new file and extended for Estimating |
| Private Figma file "PPO - Design", Estimating pages (Intake, Estimate detail, Sales briefs and Brief page, Discovery register and Create discovery, Wizard, Discovery costing, Fertigation and Automation configurators, Excel import, CPQ 1–6, Screen workbench, Cost sources, Quotations and Quotation detail, Release, Customer page and Customer response, Conversion, Reviews and Estimate review, ES-09 outcomes, ES-10 reference cases, Rules studio with states S1–S14) and shared components | Content reference only: page content, states and vocabulary, redrawn inside the refined shell |
| [Configuration rule sets](ADR-0066-configuration-rule-sets.md), the [estimating configurator model](estimating-configurator-model.md), the estimate detail, estimate review, cost-source, quotation, release, customer-response, conversion (ES-07), outcome (ES-09) and reference-case (ES-10) decision records under `docs/decisions/`, and the Excel-import decisions | Decisions carried into the pages: immutable versions and revisions, three review kinds with Reviewed as the only positive outcome, the three-person rule on quotation approval, Issue separate from Send, tracking visible to the sender only, conversion as the receiving owner's decision, reason codes name causes never people |
| Dean's prompt version 4 (9 November 2026) and addendum A2 (not repository documents) | Page template D11 (section 6.7), the synthetic dataset of section 9 (9.1 deals and estimates, 9.3 Riverbend v03 lines, 9.4 Glasshouse Valley Farms evaluation 2, 9.5 Hillview reviews, 9.6 tracking timeline, 9.7 quotation register, 9.8 and 9.16 rule sets, 9.9 cost sources, 9.10 Excel import, 9.11 conversion items, 9.12 outcome review, 9.13 counts, 9.14 quotation document, 9.15 workbench datasets, 9.17 gate sentences, 9.18 alternatives, 9.19 version change set), the persona × capability matrix 4.2 and the interface matrix 5.15; A2 the reference form |
| [Readable reference namespaces](readable-reference-namespaces.md) (PPO-REFERENCE-NAMESPACES-DEC) | The short reference form drawn on every sheet: SYN-EST-, SYN-QUO-, SYN-OPP-, SYN-DISC-, SYN-CPQ-, SYN-DEM-, SYN-PRJ- with two-digit revisions; the Design pages' SYN-PPO- forms are legacy examples (A20) |
| [Shell refined concept design](shell-refined-concept-design.md) and its [rules R1–R115](../design/development/systems/shell-refined-concept-rules.md) | Shell behaviour: nested page views in the docked menu, overlay drawer, selection bar, dialog pattern, one navy primary per view |
| `src/shell/navigation.ts` | The Estimating rail order and destinations; it still names the workspace "Estimating & quotation" and the intake item "Sales briefs" |
| [PPO-STD-001](../standards/naming-conventions.md), [HTML module conformance](../standards/html-module-conformance.md), [design-to-build standard](../standards/design-to-build-standard.md) | Naming, the conformance declaration of section 2, tokens and the separation of acceptance from shipped values |
| [Figma named-version build handoff](figma-named-version-build-handoff.md) | Why a named version is needed before any build and why the file's link is not recorded here |

The new file's link and key are not recorded in this public repository (ADR-0050, ADR-0053). Node IDs are recorded so each sheet can be opened from the file. Node IDs beginning `120:` are the section frames of the page template (section 11.2); a sheet's node is the 1440 × 900 frame (1440 × hug for the full-length customer page, 1024 × 768 for tablet, 390 × 844 or 320 × 844 for phone).

## 2. Conformance declaration

| Field | Declaration |
|---|---|
| Scope identity | The Estimating workspace: `route:/estimating` (Pulse and workload, ES-01), `route:/estimating/intake` (Sales briefs, CR-02), `route:/estimating/discovery` (ES-02), `route:/estimating/cpq`, `route:/estimating/configurations` (ES-08, ES-02), `route:/estimating/rules` (ES-02, ES-03), `route:/estimating/cost-sources` (ES-03), `route:/estimating/estimates/[id]`, `route:/estimating/reviews` (ES-04, ES-05), `route:/estimating/quotes` (ES-05, ES-06, ES-07), `route:/quote/[token]` (customer page, ES-05), `route:/estimating/outcomes` (ES-09), `route:/estimating/reference-cases` (ES-10), the Estimating extracts of RP-02 and `route:/settings/estimating`. No parent requirement ID is added or renamed; all 78 remain |
| Page types (r20) | Register / worklist (E01–E04, E06, B01, W01, K01, C00, R01, CO01, T lines and sources tabs, V01, Q01, Q02, O01, O08, I04, AD07); Overview / dashboard (E05, I01–I03, AD01); Record detail (B02, B04, B05, B08, B10, T01–T08, T16, V02–V04, V06, Q03, Q13–Q15, Q17–Q18, Q20, Q25–Q28, O02–O07, O09, O11–O12, R02–R05, R07, R13–R14, CO02–CO04); Form / guided workflow (W02–W09, W13, T09–T13, Q04, Q10–Q11, Q21–Q24, R06, R08–R09, R15, AD02, AD04–AD06, AD08); Workbench (CT01, CS, CF, CA, CC 01–11, K02–K09, K12–K15, W14); Review / comparison (B09, W10–W11, K09, R10–R12, R16, V05, V07–V11, Q05, Q09, Q16, Q19, CO05–CO06, O10); Customer-facing document page (QP01–QP08); Decision dialogs and side panels (X01–X42, X44); States (PS01–PS10, X43, ST01); Tablet and phone (TB01–TB16, PH01–PH12) |
| Reused components | Copies of the accepted shell: Shell / Top bar, Shell / Rail · collapsed, Shell / Right rail · collapsed, Shell / Workspace menu · docked (Estimating), Shell / Workspace menu · collapsed strip; 101 icon components (Lucide stand-ins for Font Awesome Light, as in the shell file); the "PPO colour" variable collection (66 variables, same names and values as the shell file). Estimating kit copied from the Sales file: Chip, Button, Avatar, Checkbox, Filter chip, Tab, KPI tile. Derived chrome: tablet top bar with zones 332 / 360 / 332, phone header with page-name and view text properties, status bar, Estimating phone tab bar as a variant set. New component family on CT01: Segment, Field, Context fact, Definition row, Result row, Decision row, Change row, Save bar, Rule strip, Field inspector, Working panel |
| Source authority | The decisions in section 1 and Dean's 9 November direction. The fixture is the synthetic dataset of the prompt's section 9 (the truth for every sheet, Q8): as at Thursday 5 November 2026, 09:00, signed in as Priya Nair unless a sheet names another person (Marcus Tan reviewer, Jordan Blake approver, Sam Whitfield rule-set reviewer, Kim Patel engineering owner, Lee Nakamura observer, Tom Reid and Dean Fiedler in Sales, Robin Hale receiving) |
| Incoming handover | The Estimating rail and docked menu; global search; notification and My Work links to a record; the Sales brief handed over from Sales (CR-02); the customer's quotation link (`/quote/[token]`). Arriving creates no business record |
| Outgoing handover | Sales brief decisions back to Sales; quotation revisions to the customer page and e-mail; accepted quotations to Supply demands through the four-step conversion (ES-07, Q21–Q24, ending at the receiving owner's freeze); outcome lessons to reference cases (ES-10); rule-set versions to the workbenches. Nothing drawn creates an order, project, work order, stock movement, booking or ERP or Finance transaction |
| Exceptions and recovery | Ten page states on PS01–PS10 (loading permitted evidence, true-empty, filtered-empty, could not load, denied or not found, stale or newer version, partial source, outcome unknown with recovery, read only, provisional values in use); send outcome unknown on Q12; issue held on Q09; stale proposal on each workbench 08 sheet; expired source on CO06; over-100-lines block on T15. A count that cannot be read shows a dash, never zero |
| Departures | Section 5 (A1–A24) |
| Verification | Section 6, the audit in section 9 and the re-verification of 10 November in section 11 |

## 3. Sheet inventory

Sheets are 1440 × 900 desktop frames unless stated. Node IDs are those of the sheet frame in the new file; each heading names the page of the page template and the node of its Desktop section. The dialogs, states, tablet and phone sheets of a scope sit in that page's other sections; section 11.2 lists every section node. Sheet labels on the canvas read `CODE · Page — state (scope) [source]`.

### 3.1 E · Estimating Pulse and workload (page "Workload and Pulse · ES-01" · Desktop section `120:61155`)

| Code | Sheet | Route or scope | Type | Node |
|---|---|---|---|---|
| E01 | Intake & workload — Mine, grouped by who acts next, nine estimates | `route:/estimating` | Register | `22:241` |
| E02 | Intake & workload — with the Estimating docked menu (14 pages) | same | Register | `22:986` |
| E03 | Intake & workload — collapsed docked menu (12 px strip) | same | Register | `22:1855` |
| E04 | Intake & workload — row selected, snapshot panel with checks and next step | same | Register and panel | `22:2602` |
| E05 | Estimating Pulse — day start, Focus for today ranked by rule (N-E4) | `route:/estimating/pulse` | Overview | `24:1954` |
| E06 | Saved estimates — register with version, checks and last change | `route:/estimating/estimates` | Register | `23:1850` |

### 3.2 B · Sales briefs, Estimating side (page "Sales briefs · CR-02" · Desktop section `120:61161`)

| Code | Sheet | Route or scope | Type | Node |
|---|---|---|---|---|
| B01 | Briefs worklist grouped by state | `route:/estimating/intake` | Register | `26:1947` |
| B02 | Brief record — Submitted, deciding, nine checks and fingerprint | `route:/estimating/intake/[id]` | Record | `26:2551` |
| B03 | Clarify — question and answer-needed-by (panel) | same | Form | `26:2996` |
| B04 | Clarification answered — Resolve (Questions tab) | same | Record | `26:3495` |
| B05 | Source changed since submission — Accept blocked | same | Record | `26:3970` |
| B06 | Return with reasons as owned items (dialog) | same | Decision | `26:4427` |
| B07 | Accept r1 against the reviewed fingerprint (dialog) | same | Decision | `26:4957` |
| B08 | Accepted — link to an existing workspace or create a discovery | same | Record | `26:5437` |
| B09 | Successor r2 received, compared with the frozen r1 (drawn at Friday 6 November 2026, 10:20, A13) | same | Comparison | `26:5861` |
| B10 | Brief History grouped by day | same | Record | `26:6320` |

### 3.3 W · Estimation wizard and discovery (page "Estimation wizard and discovery · ES-02" · Desktop section `120:61167`)

| Code | Sheet | Route or scope | Type | Node |
|---|---|---|---|---|
| W01 | Discovery register | `route:/estimating/discovery` | Register | `28:4231` |
| W02 | Create discovery workspace — choose the opportunity | same | Form | `28:4757` |
| W03 | Review and create (dialog) | same | Decision | `28:5071` |
| W04 | Wizard — Configuration, navigation open | `route:/estimating/discovery/[id]` | Guided workflow | `28:5429` |
| W05 | Wizard — Configuration, navigation collapsed | same | Guided workflow | `28:5954` |
| W06 | Wizard — Requirements | same | Guided workflow | `29:5341` |
| W07 | Wizard — Scope & delivery | same | Guided workflow | `29:5862` |
| W08 | Wizard — Pricing, read from CPQ, no editing here | same | Guided workflow | `29:6389` |
| W09 | Wizard — Review, Import Excel estimate as the secondary action | same | Guided workflow | `29:6955` |
| W10 | Alternatives A to J and Compare alternatives | same | Comparison | `29:7394` |
| W11 | Revisions and saved revision comparison | same | Comparison | `30:6548` |
| W12 | Evidence side panel (480 px, A10) | same | Panel | `30:6916` |
| W13 | Add system — family then category, route to workbench or CPQ | same | Form | `30:7390` |
| W14 | Discovery costing — cost lines from r02, review and adopt | same | Workbench | `30:7848` |
| W15 | Not ready to cost | same | State | `30:8302` |
| W16 | Discovery changed while costing | same | State | `30:8606` |

### 3.4 K · Configure & price, CPQ (page "Configure & price · CPQ" · Desktop section `120:61173`)

| Code | Sheet | Route or scope | Type | Node |
|---|---|---|---|---|
| K01 | Configurations register | `route:/estimating/cpq` | Register | `136:2` |
| K02 | Configure — preview of evaluation 2: Glasshouse Valley Farms systems and options with Calculated, Yours and Effective; "Why this line?" entry (N-E2) | `route:/estimating/cpq/[id]` | Workbench | `136:671` |
| K03 | Configure — blocked: drive units exceed the shared controller capacity, in words (9.15 CS conflict) | same | Workbench | `136:1159` |
| K04 | Solution overview — systems, shared controller, coverage | same | Workbench | `136:1588` |
| K05 | Materials & labour — the ten lines of dataset 9.4 grouped by system, one origin per line | same | Workbench | `136:2056` |
| K06 | "Why this line?" panel for Dosing channels — rule set, inputs, Calculated 6, Yours 6, Effective 6, source and basis hash (N-E2) | same | Panel | `136:2781` |
| K07 | Pricing — cost to proposed sell per line; totals cost A$291,880.00, sell A$398,200.00, margin 26.7 % and markup 36.4 % side by side; price state Complete | same | Workbench | `136:3356` |
| K08 | Requires approval explained — Tamar Valley Greens evaluation 4, margin 17.0 % below the 20.0 % target, gate sentence G1 (9.17, A7) | same | Workbench | `137:14` |
| K09 | Compare current (evaluation 3, unsaved, for v06) against saved evaluation 2 — per-line deltas and the what-if note (N-E7, proposal) | same | Comparison | `137:460` |
| K10 | Use in estimate — confirm the exact evaluation 2 and the new version v05 (Thu 29 Oct 2026) | same | Decision | `137:931` |
| K11 | Used in estimate — evaluation 2 adopted as SYN-EST-000287 v05, read only; r01 issued from v05 | same | Workbench | `137:1315` |
| K12 | Receive the incoming Screens workbench proposal for Hillview — fabric SLS-10 Ultra unmapped, which blocks Use until mapped to its published variant (CM5, CM6, CM8) | same | Workbench | `137:1735` |
| K13 | Manual product or one-off line — Riverbend line 10, Glasshouse 2 reticulation allowance (CM4) | same | Workbench | `137:2157` |
| K14 | Express workspace — Barossa SYN-EST-000344 v01, discovery "Skipped · Express" with its reason, origin Express (A19) | same | Workbench | `137:2617` |
| K15 | Resolve pricing readiness — missing rate, withdrawn variant (gate G6) and stale source listed with their fixes (Barossa v03) | same | Workbench | `137:3064` |

### 3.5 C · Specialised configurator workbenches (page "Workbenches · ES-08 · ES-02" · Desktop section `120:61179`)

Each workbench family has the same eleven sheets: 01 Overview with the context strip; 02 Inputs grouped as the workbench asks them; 03 Discipline view; 04 Calculation trace open; 05 Parts & working; 06 Conflicts and Resolve a conflict; 07 Compare & save; 08 Use in estimate and the stale proposal after a basis change; 09 Run history and definition review; 10 collapsed docked menu; 11 the bypass path ("Enter lines manually instead"). Route `route:/estimating/configurations/[id]`.

| Code | Sheet | Type | Node |
|---|---|---|---|
| C00 | Workbench registry — disciplines, rule-set version in use, provisional flags, last runs | Register | `40:23026` |
| CT01 | Generic workbench template with the component family (teal component annotations are documentation); the family and the template v4 are hidden text nodes on the Shell and kit page | Template | `40:23707` |
| CS01–CS09 | Screens workbench 01–09 for Hillview per dataset 9.15 CS: 16 spans × 12.8 m, 58 m drive lines, torque 380 Nm → M-2, 32 motors, 4 delay units, 48 couplings, 12,116 m² fabric, 4 controllers; evaluation 2 saved Tue 3 Nov 2026, 11:20 (71aa…0c3e); drawings with the field inspector; fabric unmapped at receipt (K12) | Workbench | `148:13658` · `148:14172` · `148:14626` · `148:15739` · `153:13888` · `148:16896` · `148:17357` · `148:17855` · `148:18321` |
| CS10, CS11 | Screens collapsed menu; Screens bypass | Workbench | `148:15223` · `148:18783` |
| CF01–CF09 | Fertigation workbench 01–09 for Riverbend per dataset 9.15 CF: 4 zones (4,200 m²), peak zone flow 3,600 L/h, pump duty 120 L/min at 4 bar → P-2, 4 dosing channels (provisional), 4 EC/pH sets, 16 zone valves, 4 misting valves, 24 % headroom; water-source conflict resolved bore primary (Option 1); evaluation 2 saved Tue 3 Nov 2026, 16:30 (2d90…be37) priced as v03 lines 1 to 5 | Workbench | `148:19233` · `148:20313` · `151:13911` · `148:21548` · `153:14483` · `148:22701` · `148:23177` · `148:23682` · `148:24163` |
| CF10, CF11 | Fertigation collapsed menu; Fertigation bypass | Workbench | `148:19772` · `148:24643` |
| CA01–CA09 | Automation workbench 01–09 for Yarra Microgreens per dataset 9.15 CA: S1 1,800 and S2 2,400 trays/h, gross 2,500 trays/h, 0.236 m/s, stacker Standard 2.0 fails S2 and the 280 mm tray so Plus is selected (a score never cancels a failure), 2 conveyors, 3 drives, 12 photo-eyes, 16 A against 32 A; evaluation 2 saved Wed 21 Oct 2026, 10:30 (5e71…c09d) used in v03 | Workbench | `151:14605` · `151:15657` · `151:16142` · `151:16739` · `153:15061` · `151:17873` · `151:18343` · `151:18834` · `151:19304` |
| CA10, CA11 | Automation collapsed menu; Automation bypass | Workbench | `151:15130` · `151:19778` |
| CC01–CC09 | Control workbench 01–09 for Riverbend per dataset 9.15 CC (chained from Fertigation evaluation 2, Automation panel empty): 28 digital outputs → 5 DOR6 modules, 12 analogue inputs → 2 cards, 1 digital input card, enclosure 600 × 800 after the 600 × 600 conflict; evaluation 1 saved Tue 3 Nov 2026, 17:10 (55a0…1f2c) priced as v03 line 6; enclosure and cards inside line 1 (A4, A21) | Workbench | `148:30780` · `148:31830` · `148:32322` · `148:32967` · `153:15633` · `148:34000` · `148:34465` · `148:34912` · `148:35378` |
| CC10, CC11 | Control collapsed menu; Control bypass | Workbench | `148:31304` · `148:35828` |

### 3.6 R · Rules studio (page "Rules studio · ES-02 · ES-03" · Desktop section `120:61185`)

| Code | Sheet | Route or scope | Type | Node |
|---|---|---|---|---|
| R01 | Rule sets register — families, versions, provisional | `route:/estimating/rules` | Register | `51:23661` |
| R02 | Rule set Overview — draft v3, failing reference case, blocking coverage findings | `route:/estimating/rules/[id]` | Record | `51:24360` |
| R03 | Inputs | same | Record | `51:24863` |
| R04 | Derived values with the dependency map | same | Record | `51:25458` |
| R05 | Lookup tables | same | Record | `51:26021` |
| R06 | Lookup table Excel import — review value by value (N-E5 proposal note) | same | Form | `51:26571` |
| R07 | Parts | same | Record | `51:27092` |
| R08 | Rule editor — table-driven rule (motor selection by torque) | same | Form | `51:27696` |
| R09 | Rule editor — threshold rule (delay units over 50 m) | same | Form | `52:25632` |
| R10 | Reference cases — line by line against the workbook | same | Comparison | `52:26132` |
| R11 | Coverage — accept a finding with a reason | same | Comparison | `52:26696` |
| R12 | Changes in plain English with the reviewer decision panel | same | Comparison | `52:27180` |
| R13 | Published version read only and the Priva fertigation provisional set | same | Record | `52:27690` |
| R14 | Chained rule sets — fertigation feeding control | same | Record | `52:28153` |
| R15 | Export a table to Excel | same | Form | `52:28640` |
| R16 | States S1 to S14 of the Design file in this shell | same | States | `52:29080` |

### 3.7 CO · Cost sources (page "Cost sources · ES-03" · Desktop section `120:61191`)

| Code | Sheet | Route or scope | Type | Node |
|---|---|---|---|---|
| CO01 | Register — kind, supplier or basis, validity, bound lines, state | `route:/estimating/cost-sources` | Register | `54:27458` |
| CO02 | Source record — supplier quote with validity and attachment | `route:/estimating/cost-sources/[id]` | Record | `54:28168` |
| CO03 | Labour rate card revision | same | Record | `54:28624` |
| CO04 | FX and landed-cost bases, dated | same | Record | `54:29044` |
| CO05 | Compare source costs for an estimate | `route:/estimating/estimates/[id]/sources` | Comparison | `54:29429` |
| CO06 | Expired or stale source flagged on estimates — rebind flow | same | Comparison | `54:29925` |

### 3.8 T · Estimates (page "Estimate record · ES-01" · Desktop section `120:61197`)

| Code | Sheet | Route or scope | Type | Node |
|---|---|---|---|---|
| T01 | Estimate record — Summary with the five-fact checks bar and Catch me up (N-E1) | `route:/estimating/estimates/[id]` | Record | `55:28879` |
| T02 | Lines — origin per line, Allowance flag, Calculated, Yours, Effective; anomaly band chip (N-E3) | same | Record | `55:29287` |
| T03 | Sources — bound sources and stale flags | same | Record | `55:29866` |
| T04 | Versions — immutable v01…, predecessor, reason, compare | same | Record | `55:30306` |
| T05 | Review tab — three kinds with fingerprints | same | Record | `55:30755` |
| T06 | Quotations tab — revisions, stages, origin | same | Record | `55:31201` |
| T07 | Import evidence | same | Record | `55:31622` |
| T08 | History | same | Record | `55:32042` |
| T09 | Excel import 1 — Choose workbook (attach-only option) | same | Guided workflow | `56:30630` |
| T10 | Excel import 2 — Review blocked (unmapped parts) | same | Guided workflow | `56:30968` |
| T11 | Excel import 2 — Review ready | same | Guided workflow | `56:31418` |
| T12 | Excel import 3 — Confirm and save | same | Guided workflow | `56:31863` |
| T13 | Excel import 4 — Saved | same | Guided workflow | `56:32187` |
| T14 | Compare a revised workbook | same | Comparison | `56:32508` |
| T15 | Over 100 lines blocked | same | State | `56:32883` |
| T16 | Observer view — amounts and margin withheld | same | Record | `56:33223` |

### 3.9 V · Reviews & approvals (page "Reviews & approvals · ES-04 · ES-05" · Desktop section `120:61203`)

| Code | Sheet | Route or scope | Type | Node |
|---|---|---|---|---|
| V01 | Queue grouped by kind and urgency | `route:/estimating/reviews` | Register | `57:32290` |
| V02 | Estimate review record — Technical | `route:/estimating/reviews/[id]` | Record | `57:32960` |
| V03 | Completeness | same | Record | `57:33348` |
| V04 | Source & price with pricing exceptions "Policy not configured" | same | Record | `57:33726` |
| V05 | Decision — Reviewed or Returned with Required and Advisory findings (N-E9 proposal note) | same | Decision | `57:34155` |
| V06 | Resubmitted — an unchanged fingerprint keeps a decision | same | Record | `57:34549` |
| V07 | Quotation approval — approver view with the exact output preview | same | Review | `58:33719` |
| V08 | Preparer blocked from approving (three-person rule) | same | Review | `58:34132` |
| V09 | Returned with reason | same | Review | `58:34556` |
| V10 | Re-approval after a change (Glasshouse Valley r1) | same | Review | `58:34982` |
| V11 | Gate explanations — margin below floor, value threshold, provisional values, stale sources | same | Review | `58:35393` |

### 3.10 Q · Quotations (page "Quotations · ES-05 · ES-06 · ES-07" · Desktop section `120:61209`)

| Code | Sheet | Route or scope | Type | Node |
|---|---|---|---|---|
| Q01 | Register with derived stage and origin (Estimate, Simple quotation from Sales, Express) | `route:/estimating/quotes` | Register | `59:34761` |
| Q02 | Register opened from Sales ("Follow up") and from Estimating ("Prepared by me") | same | Register | `59:35569` |
| Q03 | Quotation detail — Document tab, issued and viewed; Reports menu drawn open (A17) | `route:/estimating/quotes/[id]` | Record | `59:35995` |
| Q04 | Release — Source & output, appendices chosen | same | Form | `59:36385` |
| Q05 | Exact output preview before approval | same | Review | `59:36773` |
| Q06 | Approval (approver) | same | Decision | `59:37118` |
| Q07 | Issue register with recheck | same | Form | `59:37497` |
| Q08 | Issued | same | Record | `59:37868` |
| Q09 | Issue held — recipient changed, basis changed | same | State | `59:38229` |
| Q10 | Send composer — link only, tracking notice | same | Form | `59:38608` |
| Q11 | Send composer — PDF attached with its warning | same | Form | `59:39008` |
| Q12 | Sent, and Send outcome unknown | same | State | `59:39412` |
| Q13 | Customer views tab — events and time per section (N-E8 follow-up suggestions) | same | Record | `59:39777` |
| Q14 | Customer views — tracking off (privacy gate) | same | Record | `59:40177` |
| Q15 | Response tab — Clarification recorded | same | Record | `59:40525` |
| Q16 | Negotiation hold and successor r3 prepared | same | Comparison | `59:40880` |
| Q17 | Accepted with evidence | same | Record | `59:41275` |
| Q18 | Declined with reason | same | Record | `59:41651` |
| Q19 | Correct a response | same | Decision | `60:38601` |
| Q20 | Revisions compared by section | same | Comparison | `60:39001` |
| Q21 | Conversion 1 — Receive | `route:/estimating/quotes/[id]/conversion` | Guided workflow | `60:39409` |
| Q22 | Conversion 2 — Resolve items | same | Guided workflow | `60:39790` |
| Q23 | Conversion 3 — Review and freeze | same | Guided workflow | `60:40280` |
| Q24 | Conversion 4 — Converted to Supply demands | same | Guided workflow | `60:40734` |
| Q25 | Simple quotation prepared in Sales, as seen from Estimating | same | Record | `60:41183` |
| Q26 | History grouped by day | same | Record | `60:41584` |
| Q27 | Lines tab of an estimate-backed quotation — summary band and read-only lines (section 10, A18) | same | Record | `111:61161` |
| Q28 | Simple quotation — Sales draft with editable lines, as Tom Reid before approval (section 10, A18) | Sales path | Record | `111:61798` |

### 3.11 QP · Customer-facing quotation page (page "Customer quotation page · ES-05" · Desktop section `120:61215`)

| Code | Sheet | Type | Node |
|---|---|---|---|
| QP01 | Desktop, issued r2, full length (1440 × 1792), no app shell | Customer page | `61:40300` |
| QP02 | Section markers and active time annotated (what the sender sees) | Customer page | `61:40457` |
| QP03 | Phone 390, first screen with the fixed Download PDF bar | Customer page | `61:40657` |
| QP04 | Phone full length (390 × 2060) | Customer page | `61:40782` |
| QP05 | Link withdrawn | State | `61:40907` |
| QP06 | Replaced — the r1 link opened after r2 | State | `61:40933` |
| QP07 | Validity ended, still readable | State | `61:40961` |
| QP08 | Older quotation without section markers | Customer page | `61:41096` |

### 3.12 O · Outcomes and reference cases (page "Outcomes and reference cases · ES-09 · ES-10" · Desktop section `120:61221`)

| Code | Sheet | Route or scope | Type | Node |
|---|---|---|---|---|
| O01 | Outcomes register | `route:/estimating/outcomes` | Register | `66:40383` |
| O02 | Outcome record — Overview | `route:/estimating/outcomes/[id]` | Record | `66:40994` |
| O03 | Basis tab — declare the comparison basis | same | Record | `66:41425` |
| O04 | Comparison with line drill-down (480 px panel, A10) | same | Comparison | `66:41850` |
| O05 | Sources with the possible-duplicate block | same | Record | `66:42394` |
| O06 | Review — conclude | same | Decision | `66:42817` |
| O07 | Lessons — prepare the ES-10 handover | same | Record | `68:41807` |
| O08 | Reference cases register | `route:/estimating/reference-cases` | Register | `68:42201` |
| O09 | Case detail | `route:/estimating/reference-cases/[id]` | Record | `68:42867` |
| O10 | Comparison across eligible jobs with the calibrated band (N-E3) | same | Comparison | `68:43256` |
| O11 | Calibration proposal with a preview on one estimate | same | Record | `68:43648` |
| O12 | Independent review — adoption unavailable | same | Record | `68:44007` |

### 3.13 I · Insights (page "Insights · RP-02" · Desktop section `120:61227`)

| Code | Sheet | Node |
|---|---|---|
| I01 | Estimating workload and cycle time — counts with their rules | `69:43196` |
| I02 | Hit rate by family; quotation ageing and response | `69:43529` |
| I03 | Estimate-to-actual variance by line kind (SYN-EAR-0004) and rule-set coverage | `69:43901` |
| I04 | Drill-through list — from the count "Awaiting review · 3" on I01 to its three rows (Hillview v05, Glasshouse Valley Farms v06, Sunline stage 2 v01), register standard | `171:664` |

### 3.14 X · Dialogs and panels (Dialogs and panels section of each host page; see section 11.2)

| Code | Dialog or panel | Node |
|---|---|---|
| X01–X05 | New discovery; Add system; Save discovery revision; Unsaved changes; Route to workbench | `72:43791` · `72:44156` · `72:44503` · `72:44814` · `72:45145` |
| X06–X10 | Use in estimate (exact evaluation); Resolve a conflict; Accept a coverage finding with reason; Submit rule set for review; Publish rule set version with impact | `72:45460` · `72:45772` · `72:46095` · `72:46405` · `72:46738` |
| X11–X15 | Import lookup table from Excel; Export to Excel; Import Excel estimate (attach-only toggle); Over 100 lines; Request review | `72:47070` · `72:47416` · `72:47724` · `72:48052` · `72:48349` |
| X16–X20 | Return with findings; Record review decision; Prepare quotation revision; Approve with confirmations; Return approval with reason | `72:48682` · `72:49010` · `72:49322` · `72:49644` · `72:49960` |
| X21–X25 | Issue recheck; Withdraw link; Send quotation composer; Record customer response (Accepted with evidence, Declined, Clarification, Negotiation); Correct a response | `72:50265` · `74:48063` · `74:48380` · `74:48731` · `74:49079` |
| X26–X30 | Prepare successor revision; Prepare for conversion; Receive, Hold or Return conversion; Resolve one-off item; Freeze plan | `74:49429` · `74:49768` · `74:50102` · `74:50439` · `74:50767` |
| X31–X35 | New simple quotation (Sales path); Reassign workload; Delegate approval; Reopen declined quotation; Columns | `74:51125` · `74:51449` · `74:51787` · `74:52118` · `74:52479` |
| X36–X40 | Filters; Export register; Address lookup; Inline edit change reason; Export (quotations by stage) | `74:52854` · `74:53176` · `74:53502` · `74:53966` · `74:54335` |
| X41–X43 | Save view; Notification preference; Collapsed docked menu (state, not a dialog) | `74:54692` · `74:55064` · `74:55443` |
| X44 | New Express workspace — a like-for-like catalogue job skips discovery with a reason; discovery "Skipped · Express", origin Express (A19) | `171:5341` |

### 3.15 PS · Page states (States section of each host page; see section 11.2)

| Code | State | Node |
|---|---|---|
| PS01–PS05 | Loading permitted evidence; true-empty; filtered-empty; could not load; denied or not found | `75:52676` · `75:52989` · `75:53253` · `75:53520` · `75:53791` |
| PS06–PS10 | Stale, newer version saved by someone else; partial source; outcome unknown with recovery; read only; provisional values in use | `75:54004` · `75:54276` · `75:54594` · `75:54854` · `75:55122` |

### 3.16 ST · Interaction states and accessibility (page "Interaction states · ES" · Desktop section `120:61233`)

| Code | Sheet | Node |
|---|---|---|
| ST01 | Register row states, column header states, inline edit cell states, address lookup states, button kinds × states, chip tone ramp with meanings, checkbox states, keyboard order, tabular figures and the contrast proof table computed from the PPO colour variables (1440 × 3498) | `76:54660` |

### 3.17 TB · Tablet 1024 × 768 (Tablet 1024 section of each host page; see section 11.2)

| Code | Sheet | Node |
|---|---|---|
| TB01–TB08 | E01, E05, B02, W04, K02, K07, CS01, CF01 | `77:54797` · `77:55174` · `77:55466` · `77:55748` · `77:56077` · `77:56398` · `77:56735` · `77:57081` |
| TB09–TB16 | CA01, CC01, R02, R10, T01, V07, Q03, Q13 | `78:56502` · `78:56856` · `78:57196` · `78:57572` · `78:57880` · `78:58210` · `78:58461` · `78:58777` |

### 3.18 PH · Phone 390 × 844 and 320 × 844 (Phone 390 and 320 section of each host page; see section 11.2)

| Code | Sheet | Node |
|---|---|---|
| PH01–PH06 | E05 Pulse with Focus for today (and the N-E10 proposal note); E01 workload; B04 answer or resolve; V05 review decision; V07 approve with confirmations (issue not offered); Q03 quotation summary with customer views | `79:58148` · `79:58279` · `79:58427` · `79:58537` · `79:58648` · `79:58769` |
| PH07–PH12 | Q17 record response after a call; CS05 parts summary; R10 reference case results; O02 outcome summary; QP03 customer page; E01 at 320 × 844 | `79:58902` · `79:59022` · `79:59166` · `79:59277` · `79:59395` · `79:59517` |

### 3.19 AD · Administration and customisation (page "Administration · ES" · Desktop section `120:61239`)

| Code | Sheet | Route or scope | Type | Node |
|---|---|---|---|---|
| AD01 | Estimating settings hub — what can be changed, by whom, at which scope; recent changes; duty holders | `route:/settings/estimating` | Overview | `80:58966` |
| AD02 | Review gates and thresholds — draft and publish with impact (illustrative values, A7) | same | Form | `80:59387` |
| AD03 | Publish gates version (dialog over AD02) | same | Decision | `80:59808` |
| AD04 | Numbering and validity terms | same | Form | `80:60169` |
| AD05 | Quotation templates and terms (DK-06 link) | same | Form | `80:60547` |
| AD06 | Cost-source rules — validity, FX basis, landed-cost method | same | Form | `80:60901` |
| AD07 | Workbench registry and rule-set families | same | Register | `80:61206` |
| AD08 | Notifications, saved views, columns and record layout | same | Form | `80:61598` |

The four Read me cards are the page header (`16:222`), the sheet index and notes (`16:226`), the audit card (`16:238`) and the page template card (`123:3909`). The helper library (v3, reading the kit from the Shell and kit page), the workbench template v4, the two workbench configuration sets (A: CS and CF; B: CA and CC, per dataset 9.15) and the overflow guard are hidden text nodes on the Shell and kit page (`19:222`, `20:222`, `37:11291`, `38:11291`, `38:11292`, `50:23661`) so later sessions can continue with the same functions.

## 4. Rules applied

- **One line per cell.** Register cells never wrap: text truncates with an ellipsis at the cell width, the table scrolls sideways under a horizontal scrollbar, and the selection column, the first column and the row menu stay frozen. Record pages, cards and dialogs may wrap.
- **No second search.** No search box appears in the content area of any page, including the lines grids of Q27 and Q28. The shell's search (Ctrl K) finds records, pages and help; Find stays in the flyout and docked menus; grids filter with a chip.
- **Shell geometry and tokens.** Every sheet instances the copied top bar, rail, right strip and, where shown, the docked menu or the 12 px collapsed strip; content runs from x 80 (or 92) to 1392 with 24 px gutters; Roboto 11 to 20 px; every colour bound to the "PPO colour" variables; the dialog scrim is a plain 32 % navy paint.
- **Register standard.** Every register shows view tiles with counts under the title, filter chips, a footer with the count rule and a pager; column reorder and resize, inline edit with a change reason and address lookup are drawn once on ST01 and assumed everywhere (A6).
- **Counts state their rule.** Every count names what it counts; counts are never added together; a count that cannot be read shows a dash; unavailable or restricted sources are never zero.
- **Explicit gates and immutable records.** Estimate versions, discovery revisions, rule-set versions and quotation revisions are immutable and saved with a reason; Reviewed is the only positive review outcome; the preparer never approves; Issue and Send are separate decisions; tracking is visible to the sender, owner and deal owner only; a conversion is the receiving owner's decision and corrections append.
- **Rules before AI.** Focus for today, anomaly bands, gate explanations and follow-up suggestions are rule-based and explained; every AI feature (N-E1, N-E5, N-E6, N-E9) is grounded in the record, labelled as a summary or suggestion, reviewed before anything is saved and never writes to a record.
- **Dates, currency and story.** Dates read "Thu 5 Nov 2026" and "Thu 5 Nov 2026, 09:12", with weekdays true to the real calendar; ISO dates appear only inside imported file names; amounts are AUD excluding GST with GST shown separately where a total is customer-facing (Q9: yes, both totals on the document); every record, person and value is synthetic and carries a SYN- reference.
- **Reference form.** Every reference takes the short form of [readable reference namespaces](readable-reference-namespaces.md) (PPO-REFERENCE-NAMESPACES-DEC), as addendum A2 confirms: SYN-EST-000312, SYN-QUO-000214 r02, SYN-OPP-000312, SYN-DISC-000312 r02, SYN-CPQ-000312, SYN-DEM-000103, SYN-PRJ-000190; revisions and versions are two-digit (r01, v03). The Sales file's short forms were already correct; the Design pages' SYN-PPO- forms are legacy examples cited in section 5 (A20) and not drawn.
- **Dataset is the truth.** The prompt's section 9 dataset decides every count, line, date and reference on every sheet (Q8). Where a Design page, an earlier build or the sheet inventory disagrees with it, the dataset is drawn and the difference is recorded (A21–A24, Q11, Q12). Totals were recomputed from the dataset lines (9.3: cost A$94,270.00, sell A$129,500.00, margin 27.2 %, markup 37.4 %; 9.4: A$291,880.00 and A$398,200.00; 9.12: A$54,950.00 against A$58,800.00; 9.14: A$129,500.00, GST A$12,950.00, A$142,450.00).
- **Page template.** One Figma page per scope between the — Accepted — and — Proposals — separators, six sections per page (Desktop 1440 · Dialogs and panels · States · Tablet 1024 · Phone 390 and 320 · Flows and notes) stacked with 360 px gaps and refitted with 60 px padding; desktop sheets on a 1600 × 1060 slot grid, tablets at 1084 px pitch, phones at 450 px; every sheet carries a `Label · CODE` text above it. Page names carry no status (PPO-STD-001 13.2): acceptance moves a whole page above the separator.
- **Gate sentences.** The seven gates read in words with the current values (dataset 9.17) on V04, V07, V08, V11, K08, E05 and AD02: "Margin 17.0 % is below the 20.0 % target. Approval needs a reason." (G1), "Discount 12.5 % exceeds the 10.0 % limit…" (G2), "Value A$398,200.00 exceeds A$100,000.00. A commercial approver must approve." (G3), "Lines 1 and 2 use provisional values from Priva fertigation…" (G4), "Source SQ-2026-114 expires Fri 13 Nov 2026, before the quotation validity ends. Rebind or re-price before issue." (G5), "Variant Climate computer CC-200 rev 4 was withdrawn Fri 30 Oct 2026…" (G6) and "You prepared this revision, so you cannot approve it. Jordan Blake can." (G7); where no policy version exists a gate reads "Policy not configured".

## 5. Assumptions and proposed departures

Each item is for Dean's decision; the recommendation is what the file shows.

| ID | Assumption or departure | Recommendation |
|---|---|---|
| A1 | The module is named Estimating on every sheet; `src/shell/navigation.ts`, BP-04 and the Shell file still say "Estimating & quotation" | Draw "Estimating"; carry the rename into code, BP-04 and the Shell file in a separate change |
| A2 | The shell's accepted 12 px collapsed strip is drawn as the collapsed docked menu (E03, X43, the 10 sheets of each workbench family); the 56 px icon strip with per-user persistence (D9) is proposed as a shell departure, not drawn as accepted | Keep the accepted strip; decide the icon strip in the Shell file |
| A3 | The Estimating phone tab bar has five labelled tabs (My Work, Estimates, Reviews, Quotations, More), consistent with Sales; the Reviews & approvals design (D8) accepted an icon-only bar | Labelled tabs; record the mismatch |
| A4 | The Control workbench is derived from the Priva control rule set chained from fertigation and automation outputs (I/O schedule, DOR6 relay modules); no earlier design page exists | Keep, labelled proposed, until the Control rule set is defined |
| A5 | Simple quotations from Sales share the quotation register, numbering series and release flow; gates apply by value only unless a rule set is involved | Keep |
| A6 | The register standard (reorder, resize, inline edit with reason, address lookup, frozen first column and row menu) is drawn for Estimating and proposed for every module | Adopt application-wide |
| A7 | Jordan Blake holds the approval duty; gates read "Policy not configured" with illustrative values (20 % target margin, 15 % floor, A$100,000 value gate) on AD02, V11 and K08 | Keep as illustrative until D-010 names the policy |
| A8 | Lucide icons stand in for Font Awesome Light; the shell components are local copies of the accepted file | Swap both on publication of the shell library |
| A9 | The synthetic story continues the Sales file's (Riverbend Growers SYN-OPP-000312 and SYN-PPO-EST-000312 v03, Hillview Growers 000301 v05, Barossa Nursery 000209, Westgate Flowers 000223, Glasshouse Valley 000221, Yarra Microgreens 000205, Hillcrest Tomatoes 000198 …) as at Thursday 5 November 2026, 09:00 | Align with the accepted module stories when each page is next touched |
| A10 | Record side panels are 480 px where the content needs the width (O04, K06, W12), a declared departure from the 432 px drawer (ES-09 D8) | Keep |
| A11 | An Estimating tab-bar variant set and phone-header text properties were added to the derived chrome; the teal "Component ·" and "Proposal ·" notes on CT01, QP02, R06, B04, V05 and PH01 are documentation, not UI | Keep |
| A12 | Docked menu labels follow the Shell file; `navigation.ts` names the intake item "Sales briefs" and the file follows it | Keep |
| A13 | B09 (successor r2 received) is drawn at Friday 6 November 2026, 10:20, the one sheet after the story time, and its label says "later the same week" | Keep |
| A14 | Where the build had a weekday label one day early against the real 2026 calendar, the date moved to the business day the label named (31 October became Friday 30 October, 27 October became Monday 26 October, 3 November became Monday 2 November and so on); 476 texts changed, none left mislabelled | Keep |
| A15 | The title-row overflow "···" is replaced by a labelled "Actions ▾" menu on every page (146 title rows), a shell departure to carry into the Shell and Sales files | Adopt as a shell refinement (Dean, 9 November: proceed) |
| A16 | Record pages carry a previous / next stepper scoped to the list the user came from ("2 of 9 · Mine", "1 of 14 · All open", "1 of 4 · Waiting for me" …) as a compact control at the right of the breadcrumb row (74 records); first and last are not offered | Adopt (Dean, 9 November: proceed) |
| A17 | Estimate, quotation and outcome records carry a "Reports ▾" menu of their read-only outputs (30 records; drawn open on Q03). Back, undo, "+", a duplicate icon and a combined "Issue & send" were considered and left out: the breadcrumb and the global "+" already exist, revisions are immutable, and Issue and Send stay separate gated decisions | Adopt (Dean, 9 November: proceed) |
| A18 | The quotation record adopts Dean's quoting-screen layout on Q27 and Q28: a summary band (Customer · Quotation · Totals with GST shown separately), a lines grid (Item, Description, Qty, Unit, Unit price, Discount, Line total), a supplier lead-time warning row and tabs including Conversations. Lines are editable only on a simple-quotation draft (Sales path, Q28); on an estimate-backed quotation they are read only (Q27). Left out: a "Search lines" box, "Autosaved · every change kept" and the header icon row | Adopt as drawn; the Sales-side page is a Sales-file follow-up (G1) |
| A19 | Express workspace (K14, K15, X44): a like-for-like catalogue job skips the wizard with a recorded reason; the discovery reads "Skipped · Express", the estimate and quotation carry origin Express, lines come from published Product Variants and Manual entries only; review and release gates are unchanged (dataset 9.1, Barossa SYN-EST-000344 v01) | Keep; the reason is kept on the estimate and shown to the reviewer |
| A20 | Legacy examples: the Design file's Estimating pages carry the long forms SYN-PPO-EST-000312, SYN-PPO-QUO-000214, SYN-PPO-OPP-000312 and SYN-PPO-PRJ-000190; addendum A2 withdraws that form, so the file draws SYN-EST-000312, SYN-QUO-000214 r02, SYN-OPP-000312 and SYN-PRJ-000190 and this record cites the long forms only here | Keep the short form (PPO-REFERENCE-NAMESPACES-DEC) |
| A21 | Riverbend: the Fertigation workbench proposes a pump skid P-2 and the Control workbench an enclosure and three I/O cards that have no line of their own in dataset 9.3; they are shown as priced inside line 1, the controller package, as 9.15 CC states for the enclosure and cards; only the DOR6 modules are a separate line (6) | Keep; the trace on CC04 and the parts note on CF05 say so |
| A22 | The motor selection lookup table keeps the three class rows of dataset 9.16 (0–200 Nm M-1, 200–400 M-2, 400–450 M-3); the Tue 3 Nov import of 9.8 "12 rows, 11 accepted, 1 rejected" is drawn as 12 workbook rows read, of which eight were unchanged, two changed, one new (400–450 M-3) and one rejected as a duplicate range | Keep; reconcile the two counts if the table is meant to have twelve rows |
| A23 | Calibration (O08–O12, V01, I03) is drawn as hours per dosing zone (42 h → 49 h, median of 5 eligible cases, Kim Patel's proposal SYN-CAL-0003 of Fri 30 Oct 2026, Sam Whitfield's independent review pending, adoption unavailable, preview on Riverbend v03 line 7 180 h → 196 h, A$17,100.00 → A$18,620.00) in place of the earlier × 1.08 factor; per-case hours (Hillcrest 44 → 50, Mallee 40 → 48, Coastal Herbs 42 → 47, Tamar 44 → 50, Lakeside 42 → 49) are synthetic | Keep |
| A24 | Screens: dataset 9.15 CS resolves the controller conflict with 4 controllers after the per-span motor count doubled; the sheet inventory row x06 said 2, and the dataset wins. Evaluation 1 (Mon 26 Oct 2026) → evaluation 2 (Tue 3 Nov 2026, 11:20) is drawn as saved with no unsaved change, so Compare & save compares the two saved evaluations | Keep |
| A25 | Register scroll affordance: the last data column scrolls under the frozen actions column; an inner shadow on the scroll region's left edge, a drop shadow from the frozen actions column and the horizontal scrollbar show it on every register (register standard, A6) | Keep (Design ready DR-1) |
| A26 | accent/estimating-ink darkened from #1f8a7e to #156e64 in this file's PPO colour collection (5.29 : 1 on accent/estimating-surface, 6.1 : 1 on white); the library takes the value on publication and the other module accents are to be checked the same way | Keep (R1, DR-20) |
| A27 | Tablet 1024: the derived top bar hides the account name as the accepted shell does at that width, and the rails hide Favourites at 768 px so More clears the Settings group; the Shell file decides the tablet rail rule | Keep until the Shell file decides (DR-5) |
| A28 | surface/scrim, brand/navy at 32 % alpha, added to the PPO colour collection and bound on every dialog scrim; a library follow-up. Every colour variable carries the CSS code syntax `--ppo-<group>-<name>` | Keep (DR-9, DR-11) |
| A29 | Text styles: ten PPO/… styles (Caption 11 to Display 24, Roboto Regular and Medium with the helper's line heights) were created at lock-in and not applied; the sheets' type was set directly from the same ramp; the styles are applied when the shell library publishes and the components are swapped (A8). Tabular figures cannot be set through the plugin API and come with the text styles | Keep (DR-10, R5) |
| A30 | Prototype flows: Figma flows stay within one page, so the main journey is one flow per scope page (fourteen starting points named "Main journey · <page>"; Interaction states has none), each hotspot a named button or the sheet itself, with the hand-offs between pages written on the Flows and notes card | Keep (G5, DR-21) |
| A31 | Desktop-first scope: seven pages have no phone sheet and six no tablet sheet by decision; each Flows and notes card now states how the page adapts and which shared page states apply (PS01–PS05 for registers, PS06–PS10 for records, PS11–PS13 for workbenches); X45 shows the validation state a required reason shares across X16, X17 and X20 | Keep (DR-14, DR-15) |
| A32 | Pointer targets: a register checkbox's target is its 40 × 36 cell (the 44 px row on the phone); status chips are not interactive; the customer page's section chips are 28 px anchors; every phone action is 44 px high. The hand-drawn parts named like controls (Button ·, Filter ·, Field ·, Pager, Badge, Tile) become library components at stage 3 of the standard | Keep (DR-13, DR-16, DR-17, DR-18) |
| A33 | Documentation: handovers, permissions, keyboard order and open questions stay on the Flows and notes cards and ST01 rather than Figma annotations; Ready for dev cannot be set through the plugin API, so the named version alone marks acceptance; the customer page's bracketed sender details and issue date are merge fields filled at issue (D-024) and now read "set at issue" | Keep (DR-19, DR-25, standard section 2 step 4) |

**Amendment — 10 November 2026.** The mismatch recorded in A3 and Q4 is resolved in favour of labelled tabs: Dean adopted a visible label on every phone tab bar, superseding the icon-only bar of Reviews & approvals D8 ([phone tab bar decision](phone-tab-bar-labels-and-rail-colours.md)).

Capability assumptions (prompt 4.2, marked † on the sheets where a duty decides what is offered): Priya Nair holds estimating.author, cpq.author and quotation.prepare; Marcus Tan estimating.review (and prepared Tamar's r02, so he is never offered its approval, G7); Jordan Blake quotation.approve; Sam Whitfield cpq.review (independent of Kim Patel, who authors rule sets as the engineering owner); Dean Fiedler quotation.issue and the deals he owns; Sasha Clarke and Tom Reid record customer responses on their deals; Robin Hale supply.coordinate receives conversions; Lee Nakamura holds estimating.read only (T16); cpq.publish is not yet assigned (DEC-CCE-06), so Publish reads unavailable on X10 and AD07. Where the matrix names no duty for an action, the sheet shows the action unavailable with its reason rather than hiding it.

## 6. Verification

Every section was rendered and read from sample sheets after each build and after every repair (E, B, W, K, C, R, CO, T, V, Q, QP, O, I, X, PS, ST, TB, PH and AD). The verification routines ran before this record:

- **Structural pass** over all 283 sheets: no direct child outside its frame except the two intentional first-screen clips of the phone customer page (QP03, PH11); no register cell taller than one line; Roboto the only font family (27,812 texts, mixed-weight segments allowed); a label on every sheet with its code.
- **Position audit:** every sheet inside its section, no sheet, label, card or section overlap, nothing loose on the page; the three cards sit above the first section.
- **Story scan:** 112 SYN- references reconciled to one truth per record; two placeholder-suffixed IDs renamed (Mallee Fresh Produce is SYN-OPP-000296 and SYN-PPO-EST-000296; the Bairnsdale configuration is SYN-PPO-CPQ-000284).
- **Date scan:** 1,037 dated texts; weekday labels corrected against the real calendar (A14); ISO dates only inside three imported file names; no slash dates; every amount in A$.
- **Fill scan:** 99,095 nodes; the only solid fills not bound to a variable are the 62 dialog scrims, by design.
- **Contrast:** every text colour pair in the PPO colour variables computed and tabled on ST01; two pairs measure below 4.5:1 and are recorded as refinements R1 and R2 in section 9.
- **Repository checks** run for this change: `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`.

Re-verification after the re-alignment (10 November 2026, section 11): renders re-read on every re-textured page (W08, K05, K07, CS01, CS03, CS05, CF03, CF08, CA03, CC03, CC06, R10, CO01, T01, T02, Q01, O04, QP01); weekday scan over 1,203 dated texts, none mislabelled; position audit over the fifteen pages, 285 sheets, no overlap, every sheet on its slot grid (QP06–QP08 pitched by the full-length QP01 and QP02) and every sheet labelled; residual scan for pre-v4 story terms (old product names, superseded counts, long reference forms, old dates) 136 hits reduced to none unintended; the overflow guard re-run over every re-textured section; story totals recomputed from the dataset lines. Repository checks run again for this change.

Limits: this is a visual proposal. No prototype links, keyboard testing, screen-reader behaviour or comparison with the built application were done. The weekday correction kept each date's business day; a few events in one story may now sit closer together than first written.

## 7. Not drawn and open questions

Not drawn: prototype links; tablet and phone variants of the dialogs beyond TB01–TB16 and PH01–PH12; the Sales-side brief authoring and the New simple quotation form as Sales sees them (Sales file); the Supply demands pages after conversion (Q24 ends at the handover); the Projects and Service receiving decisions; the Finance side of outcome reviews (invoice matching); the print layout of the quotation document (DK-06 owns it); Rules studio diffs of lookup tables between versions; denied and offline states for the workbenches beyond PS05 and PS08.

Open questions for Dean, with the defaults drawn:

| # | Question | Drawn default |
|---|---|---|
| Q1 | Carry the "Estimating" rename into code, BP-04 and the Shell file in a separate change, and let this file say "Estimating" now? | Yes to both (A1) |
| Q2 | Who approves quotations, and what are the real thresholds for margin floor, discount limit and value? | Jordan Blake; "Policy not configured" with illustrative values (A7); belongs to D-010, Route, pricing, contract and variation authority policies (Open) |
| Q3 | Scope of the Control workbench, which has no earlier design? | Priva control derived from fertigation and automation outputs, labelled proposed (A4); belongs with D-009, Costing formulas, Screen Systems and questionnaire rules (Open) |
| Q4 | Five labelled phone tabs or the icon-only bar accepted in Reviews & approvals D8? | Five labelled tabs (A3) |
| Q5 | Do simple quotations from Sales share the numbering series and gates? | Same series; gates by value only unless a rule set is involved (A5) |
| Q6 | Collapsed docked menu width and behaviour? | The accepted 12 px strip; the 56 px icon strip proposed in the Shell file (A2) |
| Q7 | Withdrawn by addendum A2 (the short reference form is confirmed; no reconciliation of the Sales file's short forms is needed) | — |
| Q8 | Where a Design page and the prompt's section 9 dataset disagree, which wins? | Section 9 wins; the Design form is cited as a legacy example (A20, A24) |
| Q9 | GST on the customer document? | Yes: total excluding GST, GST and total including GST on QP01–QP04 and Q05 (dataset 9.14) |
| Q10 | Weekday policy where the dataset's weekday label is one day early against the real 2026 calendar? | Keep the business day the label names (A14: 31 Oct → Fri 30 Oct, 27 Oct → Mon 26 Oct, 3 Nov → Mon 2 Nov …); the alternative is to keep the day number and change the weekday |
| Q11 | The delay-unit rule: dataset 9.15 CS derives 4 delay units under Screen systems v2 while 9.8 and 9.16 place the threshold rule in the v4 draft and make its absence fail the v3 case | Both drawn as given (CS04 under v2, R09 as the v4 editor, R10 as the failing v3 line); reconcile |
| Q12 | The v3 change list (9.16) declares 2 motors per span for pinion drive and couplings as shafts plus motors, while the reference-case run (9.8) still produces 2 motors and 4 couplings | Both drawn as given; the reviewer's note on R12 asks the author to confirm the drive-type condition |

Also open and referenced on the sheets: D-009 (costing formulas, screen systems and questionnaire rules), D-010 (financial thresholds and approval values), D-022 (hosting of the customer page and tracking of views, drawn as the sender-only view model of ES-05), D-024 (branding, templates, issue and signature policy and accessibility; the customer page shows neutral synthetic wording and no accept or sign button); fertigation question Q8; ADR-0066 questions Q4, Q9 and Q11; and the specialist screen systems' open engineering ranges (span width above 12.8 m, torque above 450 Nm, findings F1 and F2).

## 8. Boundary and next steps

This record authorises nothing in the application: no code, route, read model, migration, permission, capability, grant, seed or deployment. Dean accepted on 10 November 2026 and saved the named version "PPO - Estimating module (accepted)" (section 12). Next: the page guidance in `docs/design/development/pages/` and the design register are updated for each route with exact sheet references in their own reviewed change; the Sales file receives its follow-ups (the collapsed docked menu, the register standard, the labelled Actions menu, the record stepper and Reports menu, the New simple quotation form and the Q28 layout as Sales's own page); and the build is planned against the current application pages, keeping source presence, visual review, functional proof and deployment separate.

## 9. Audit — 9 November 2026

Before hand-back every section was re-rendered and read against the design-critique framework (first impression, usability, hierarchy, consistency, accessibility), and a journey-by-journey coverage matrix was built. Corrections were made in the file; the rest is for Dean's decision.

### 9.1 Corrections made during the audit

| ID | Correction |
|---|---|
| C1 | Two record IDs carried a placeholder "b" suffix from the build; renamed to SYN-OPP-000296 / SYN-PPO-EST-000296 (Mallee Fresh Produce, 12 texts on E01–E04, E06 and Q01) and SYN-PPO-CPQ-000284 (K01) |
| C2 | Weekday labels one day early against the real 2026 calendar on 42 of 56 distinct dates; the dates moved to the business day named (476 texts; A14) |
| C3 | QP01 and QP02 frames lengthened to 1792 px to hold the full customer page |
| C4 | Four empty frames left on the page by earlier builds removed |
| C5 | The CO03 rates memo date carries its weekday (Tuesday 1 December 2026) |
| C6 | I01–I03 chart bars rebound from navy to the Estimating accent, one hue for data (19 bars) |
| C7 | X43 strip tooltip and annotation moved clear of the title and filters |
| C8 | AD01 "What can be changed" rows fit their card (title 200 px on one line, duty 180 px) |
| C9 | N-E1 and N-E3 were missing after the scan: Catch me up added on T01, B02 and Q03 with a summary strip on T01; anomaly-band chips added on T02 and O10 |
| C10 | After the header additions of section 10 every title row was checked against its width; 22 long titles truncate on one line where the row is full |

### 9.2 Coverage matrix

| Journey | Drawn | Not drawn |
|---|---|---|
| Intake and workload | E01–E06, PH02, PH12, TB01, PS01 (Mine, docked, collapsed, selected, loading) | — |
| Sales brief acceptance | B01–B10, X16, X17, PH03, TB03 (Submitted, Clarification, Answered, Source changed, Return, Accept, Accepted, Successor r2, History) | Sales-side authoring (Sales file) |
| Discovery and wizard | W01–W16, X01–X05, TB04 | — |
| Configure & price | K01–K15, X06, TB05, TB06 | — |
| Specialised workbenches | C00, CT01, CS/CF/CA/CC 01–11, X07, TB07–TB10, PH08 | Denied and offline states beyond PS05 and PS08 |
| Rules studio | R01–R16, X08–X12, TB11, TB12, PH09 | Lookup-table diff between versions |
| Cost sources | CO01–CO06 | — |
| Estimates and Excel import | T01–T16, X13, X14, TB13, PS06 | — |
| Reviews and approvals | V01–V11, X15–X20, PH04, PH05, TB14 | — |
| Quotations | Q01–Q28, X21–X33, TB15, TB16, PH06, PH07 | Print and PDF layout (DK-06); Supply demands after conversion |
| Customer page | QP01–QP08, PH11 | — |
| Outcomes and reference cases | O01–O12, PH10 | Finance side (invoice match, billability) |
| Insights | I01–I03 | — |
| Administration | AD01–AD08, X34–X42 | — |
| States and accessibility | PS01–PS10, ST01, X43 | Prototype links; dialog tablet and phone variants |

### 9.3 Refinements (R)

| ID | Refinement |
|---|---|
| R1 | The Estimating accent chip (accent ink on accent surface) measures 3.65:1; use 14 px medium text or a darker ink before the chip carries 12 px text |
| R2 | The CS03 span label, white on brand green-deep, measures 3.57:1; use ink on a light band |
| R3 | Stage-bar chips drop their dates when the bar is tight (Q21 shows "Prepared Fri 2…") |
| R4 | Register sub-lines and footers cut to one clause, with the rule text in the information-icon popover the shell already has (E01, Q01, V01, I01) |
| R5 | Tabular figures and the frozen-edge shadow (drawn on ST01) applied to every register |
| R6 | Workbench context strip: the rule-set version chip takes the provisional tone when a provisional value is in use (Fertigation, Control) |
| R7 | CPQ pricing: the policy chip sits beside margin and markup on K07 as it does on T01 |
| R8 | One KPI tile across E05, I01–I03 and O01 |
| R9 | A legend for the section markers on QP02 only; none on the customer-visible page |
| R10 | The Reviews queue's rule-set group shows family and version chips as the estimate groups show kinds |

### 9.4 Gaps to draw (G)

| ID | Gap |
|---|---|
| G1 | New simple quotation as Sales sees it, the Q28 layout as Sales's own page and the Sales-side brief authoring (Sales file) |
| G2 | Tablet and phone variants of the dialogs (confirm, return with reason, record response) |
| G3 | The Supply demands page after conversion step 4 |
| G4 | The Finance side of outcome reviews (invoice match, billability), with Finance |
| G5 | Prototype links for the main journeys |
| G6 | Workbench denied, offline and partial-source states beyond PS05 and PS08 |
| G7 | Rules studio lookup-table diff between versions and the import of a whole rule set |
| G8 | Print and PDF layout of the quotation document (DK-06) |

### 9.5 New features (N-E)

Rules first; AI only where it adds value, grounded in the record's own data, labelled as a summary or suggestion, reviewed before anything is saved and never writing to a record.

| ID | Feature | Status |
|---|---|---|
| N-E1 | Catch me up: a summary of an estimate, brief or quotation with the suggested next step and its rule | Integrated: T01 (summary strip), B02, Q03 |
| N-E2 | Why this line and why this price: trace from sell to cost sources, rule sets, workbench run and margin basis | Integrated: K02, K06, K07 |
| N-E3 | Anomaly flags against the calibrated band of reference cases, rule-based and explained | Integrated: T02, O10 |
| N-E4 | Focus for today on the Estimating Pulse, ranked by rule | Integrated: E05, PH01, TB02 |
| N-E5 | Suggested rule-set draft from an imported workbook, reviewed by an engineer | Proposed, note on R06 |
| N-E6 | Draft answer to a clarification from the record's evidence | Proposed, note on B04 |
| N-E7 | What-if: alternatives compared with margin sensitivity to a source change | Proposed, note on K09 |
| N-E8 | Follow-up suggestions after customer views | Integrated as a suggestion row on Q13 |
| N-E9 | Explain this finding in plain English | Proposed, note on V05 |
| N-E10 | Phone dictation of site measurements into workbench inputs (later) | Proposed, note on PH01 |

### 9.6 Polish (P)

| ID | Polish |
|---|---|
| P1 | Equalise view-tile widths on E01 and Q01 |
| P2 | Right-align the value labels on I01 bars to one column |
| P3 | Place "About this page" at the same x on every page head |
| P4 | Chip casing: sentence case everywhere |
| P5 | Footer text one clause (Q01, V01) |
| P6 | Icon size 16 px in every row menu |
| P7 | Balance the empty area under short tablet registers (TB01) |
| P8 | Trim long sheet labels so the code and page name read before the ellipsis |

### 9.7 Recommended order

1. Dean decides A1–A18 and Q1–Q8, then saves a named version (suggested "PPO - Estimating module (accepted)").
2. R1 and R2 (contrast) and R4 (sub-lines) across the file.
3. G1 in the Sales file with the collapsed menu, register standard, labelled Actions menu, record stepper and Reports menu follow-ups.
4. R3, R5–R10 and P1–P8 in one polish pass.
5. G2, G6 and G3.
6. N-E5–N-E10 as design proposals with their rules written first.
7. G4, G5, G7 and G8 as the contracts land.

The page guidance in `docs/design/development/pages/` follows in its own reviewed change after acceptance.

## 10. Direction received on 9 November 2026

**Header elements.** Dean showed a record header from his quoting screen (back, undo, add, duplicate, first/previous/next/last, "Actions ▾", "Reports ▾", "Issue & send") and asked whether the elements belonged on the UI pages. The recommendation was to adopt the previous/next record stepper scoped to the list the user came from, a labelled Actions menu as a shell refinement, and a Reports menu on records with outputs; and to leave out the back arrow (the breadcrumb already does it), undo (versions and revisions are immutable; a short "Saved · Undo" toast belongs to inline edit), "+" (the global "+" and the registers' New exist), the duplicate icon (an Actions item for estimates; revisions come from Prepare successor revision) and the combined "Issue & send" (Issue and Send are separate gated decisions, and a Draft's only primary is Submit for approval). Dean answered that he was happy to proceed on the recommendations. Drawn: A15 (146 title rows), A16 (74 records, with the stepper moved into the breadcrumb row so titles keep their width), A17 (30 records, the menu open on Q03).

**Quoting record screen.** Dean also liked a quoting record screen (Customer, Quotation and Totals cards; Lines tab with Add line and Add from catalogue, a lines grid with a lead-time warning row, totals with GST, tabs including Conversations, a "Search lines" box, "Autosaved 2 min ago · every change kept") and asked whether it could be used in the Estimating file. Assessment: yes for the summary band, the lines grid, the warning row, the totals with GST shown separately and the tabs; no for the search box (no second search), the autosave wording (drafts save as versions and r1 is fixed at Submit) and the header icon row (the right strip holds those functions). Lines are editable only where the quotation is the source of its own lines, the simple quotation prepared in Sales; an estimate-backed quotation shows the estimate's lines read only. Drawn: Q27 (SYN-QUO-000214 r2, Riverbend Growers, Estimating view, read-only lines, two Unknown lines kept out of the totals) and Q28 (SYN-QUO-000223 r1, Westgate Flowers, as Tom Reid in Sales on Friday 30 October 2026 at 10:20 before approval, editable lines summing to A$54,200 excluding GST with freight, GST A$5,420 and total A$59,620), recorded as A18. The Sales-side page itself remains a Sales-file follow-up (G1).


## 11. Re-alignment to prompt version 4 and addendum A2 — 9 and 10 November 2026

### 11.1 What changed

| Area | Change |
|---|---|
| File structure (D11) | Nineteen flat sections became the page template: Read me (four cards), — Accepted — and — Proposals — separators, fifteen scope pages each with six sections, then Shell and kit (shell components, icons, kit, derived chrome, hidden helper nodes) and Scratch. All 283 sheets moved with their labels and kept their node IDs except where rebuilt below. A Flows and notes card closes each scope page |
| Reference form (A2) | 809 texts swept from the long SYN-PPO- form to the short form; quotation revisions two-digit on the quotation-bearing pages (briefs keep r1 / r2); 160 fingerprints in the `xxxx…xxxx` form |
| Workload and Pulse | E01–E04 rebuilt on the nine estimates of dataset 9.13 grouped by who acts next (Barossa v03 Returned, Express 000344, Hillview v05 blocked by sources, Glasshouse Valley Farms v06, Sunline 000340 v01, Riverbend r02 and Tamar r02 approvals, Yarra and Mallee Fresh receiving); E06 thirteen estimates; E05 Pulse counts per 9.13 |
| Sales briefs | B01 rebuilt; Coastal Herbs r1 8 of 9 with the SMS clarification (Tom Reid); Northern Leaf r1 6 of 9 returned with three owned items (Sasha Clarke, source changed Wed 4 Nov); Riverbend r1 9 of 9 accepted Tue 3 Nov 2026, 10:12 against `7f3a…c21e` |
| Estimation wizard | Riverbend discovery r02: alternatives A (A$129,500.00) and B ("Not yet costed", "Not comparable") per 9.18; W08 reads Configure & price evaluation 2 (saved Wed 4 Nov 2026, 09:40) with the ten lines of 9.3; W14 and W16 adopt into v03 at cost A$94,270.00 |
| Configure & price | K01–K15 rebuilt on Glasshouse Valley Farms evaluation 2 (9.4; adopted as SYN-EST-000287 v05, r01 issued Fri 30 Oct 2026, 11:05, negotiation Wed 4 Nov 2026, 14:05, r02 from the v06 draft), K12 the Hillview Screens receipt with the fabric unmapped, K13 Riverbend line 10, K14 the Express workspace, K15 Barossa readiness (gate G6); X44 New Express workspace added |
| Workbenches | CS, CF, CA and CC rebuilt from the v4 configurations per 9.15 (new node IDs in 3.5); C00 registry and CT01 re-textured; TB07–TB10 and PH08 follow |
| Rules studio | Families per 9.8 (Screen systems v2 published, v3 draft blocked by F1 and F2 with the failing case SYN-REF-000031, v4 draft; Priva fertigation provisional; Priva control provisional; Automation lines v1); the Pump stations family removed; R03 inputs, R04 derived values, R05 and R06 the motor table with the Tue 3 Nov import, R08 and R09 as 9.16 words them, R10 the five case lines, R11 F1, F2 and the accepted F3, R12 the five changes and the reviewer sentence, R14 the chained outputs (28 DO, 12 AI → 5 DOR6) |
| Cost sources | The six sources of 9.9 (SYN Metro Aluminium's SQ-2026-114 expiring Fri 13 Nov 2026 on six Hillview v05 lines, Priva price list Oct 2026 to Thu 31 Dec, rate card r2026-07 at A$95.00 / A$140.00 and A$120.00 / A$180.00, freight table r3, FX USD/AUD 0.64 dated Mon 2 Nov, landed-cost method); CO05 compares Hillview v05; CO06 rebinds SQ-2026-114 to its successor and saves v06 (gate G5) |
| Estimate record | Riverbend v03 Reviewed Wed 4 Nov 2026 with r02 awaiting approval on the checks bar; T01 systems Fertigation A$71,300, Misting A$8,400, Control A$3,000, Reticulation A$13,740, labour and freight A$33,060; T02 the ten lines of 9.3; T04 versions v01 Mon 26 Oct, v02 Wed 28 Oct, v03 Wed 4 Nov with the 9.19 comparison; T05 fingerprints `c9f1…2a7e`; the Excel import (T07, T09–T15, X13, X14) moved to the Hillview workbook of 9.10 (37 rows, 31 ready, 4 unmapped, 2 blank, r03 compare, 112-row refusal) |
| Reviews & approvals | Hillview reviews per 9.5 (v04 Technical `a91c…4d07` Returned Mon 2 Nov 2026, 15:30 for the span count; Completeness `b227…9e51` kept; v05 Technical `c4e8…11af` pending; Source & price `d05b…73c9` with G5 and G1); V01 queue 3 / 2 / 2 / 1 with the calibration review; the seven gate sentences on V04, V07–V09 and V11; V10 the Glasshouse Valley Farms recipient change (re-approval manifest `e7a1…0c3d`) |
| Quotations | Q01 the fourteen open quotations of 9.7; Q03, Q07 and Q08 Riverbend r01 issued by Dean Fri 30 Oct 2026, 16:20 (`9a30…2c1e`) and viewed Mon 2 Nov 2026, 09:40; Q04 and Q05 r02 prepared Wed 4 Nov 2026, 15:30 with the 9.14 document; Q13 and TB16 the Glasshouse Valley Farms timeline of 9.6; Q15 and Q16 Owen Reilly's clarification and negotiation recorded by Sasha; Q17 and Q19 Yarra's acceptance recorded by Dean with PO YM-PO-2031; Q18 Northern Leaf declined Fri 9 Oct 2026 ("budget deferred"); Q20 the six section keys; Q21–Q23 the conversion items of 9.11 (SYN-DEM-000103 and 000104); Q27 the 9.3 lines |
| Customer page | The 9.14 document on QP01–QP04 and PH11: header, summary, numbered scope, Options 1 and 2, pricing grouped as Equipment, Installation, Commissioning, Freight and Allowance with GST, exclusions and assumptions, terms, the sender's contact placeholders; sections in template order; QP02 active times 1:00 / 2:00 / 0:20 / 1:40 / 0:30 / 0:30; QP05–QP07 notice wording |
| Outcomes | SYN-EAR-0004 Lakeside Orchids CO2 dosing stage 1 per 9.12 (concluded Fri 23 Oct 2026 by Marcus Tan; variance +A$3,850.00, +7.0 %); O01 register with SYN-EAR-0006 collecting and SYN-EAR-0007 planned; O08–O12 the calibration of A23 |
| Insights | I02 hit rate 5 of 12 by family; I03 variance by line kind for SYN-EAR-0004 and coverage per 9.8; I04 added |
| Interaction states and administration | ST01 values from the dataset and a chip card for workbench result rows and CPQ line states; AD02 the seven gates; AD05 template r04 with six keys and FN-02 terms; AD07 registry per 9.8 |
| Shell and kit | Tablet top bar zones 332 / 360 / 332 on the derived component (all fifteen tablets); labelled Actions ▾ and the breadcrumb stepper built into the workbench template |

### 11.2 Section nodes

| Page | Desktop | Dialogs and panels | States | Tablet | Phone | Flows and notes |
|---|---|---|---|---|---|---|
| Workload and Pulse · ES-01 | `120:61155` | `120:61156` (X35) | `120:61157` (PS01–PS05) | `120:61158` (TB01, TB02) | `120:61159` (PH01, PH02, PH12) | `120:61160` |
| Sales briefs · CR-02 | `120:61161` | `120:61162` | `120:61163` | `120:61164` (TB03) | `120:61165` (PH03) | `120:61166` |
| Estimation wizard and discovery · ES-02 | `120:61167` | `120:61168` (X01–X05) | `120:61169` | `120:61170` (TB04) | `120:61171` | `120:61172` |
| Configure & price · CPQ | `120:61173` | `120:61174` (X06, X44) | `120:61175` (PS10) | `120:61176` (TB05, TB06) | `120:61177` | `120:61178` |
| Workbenches · ES-08 · ES-02 | `120:61179` | `120:61180` (X07) | `120:61181` | `120:61182` (TB07–TB10) | `120:61183` (PH08) | `120:61184` |
| Rules studio · ES-02 · ES-03 | `120:61185` | `120:61186` (X08–X12) | `120:61187` (PS09) | `120:61188` (TB11, TB12) | `120:61189` (PH09) | `120:61190` |
| Cost sources · ES-03 | `120:61191` | `120:61192` | `120:61193` | `120:61194` | `120:61195` | `120:61196` |
| Estimate record · ES-01 | `120:61197` | `120:61198` (X13, X14) | `120:61199` (PS06, PS07) | `120:61200` (TB13) | `120:61201` | `120:61202` |
| Reviews & approvals · ES-04 · ES-05 | `120:61203` | `120:61204` (X15–X17, X36) | `120:61205` | `120:61206` (TB14) | `120:61207` (PH04, PH05) | `120:61208` |
| Quotations · ES-05 · ES-06 · ES-07 | `120:61209` | `120:61210` (X18–X34, X37) | `120:61211` (X43, PS08) | `120:61212` (TB15, TB16) | `120:61213` (PH06, PH07) | `120:61214` |
| Customer quotation page · ES-05 | `120:61215` | `120:61216` | `120:61217` | `120:61218` | `120:61219` (QP03, QP04, PH11) | `120:61220` |
| Outcomes and reference cases · ES-09 · ES-10 | `120:61221` | `120:61222` | `120:61223` | `120:61224` | `120:61225` (PH10) | `120:61226` |
| Insights · RP-02 | `120:61227` | `120:61228` | `120:61229` | `120:61230` | `120:61231` | `120:61232` |
| Interaction states · ES | `120:61233` | `120:61234` (X38–X42) | `120:61235` | `120:61236` | `120:61237` | `120:61238` |
| Administration · ES | `120:61239` | `120:61240` | `120:61241` | `120:61242` | `120:61243` | `120:61244` |

Sheet count after the re-alignment: 285 (283 plus I04 and X44). The Read me cards were rewritten for the same scope (sheet index with page, section and node per sheet; A1–A24 and the capability assumptions; Q1–Q12; the audit status).

### 11.3 Hand-back

The named version remains Dean's to save once he decides A1–A24 and Q1–Q12 (suggested title "PPO - Estimating module (accepted)"); any later design change needs a new named version. This section changes nothing in the application and no parent requirement ID.

## 12. Acceptance — 10 November 2026

Asked on 10 November 2026 for professional recommendations on every decision still open, and given them, Dean answered: "I am happy for you to proceed based on all of your professional recommendations. If you still need answers from me, let me know which ones." Those words are his acceptance of the design and of the decisions in 12.1. Under the [design-to-build standard](../standards/design-to-build-standard.md) the acceptance is checked by a session other than the drawing one (12.2), locked in with the named version and the Ready for dev marks (12.3), and followed by the batch he accepted in the same words (12.4).

### 12.1 Decisions adopted

Assumptions and departures of section 5:

| Items | Decision |
|---|---|
| A5, A9, A10, A11, A12, A13, A14, A19, A20, A21, A23, A24 | Accepted as drawn |
| A1, A6, A8, A15, A16, A17, A18 | Accepted, each with a carry-forward outside this file: A1 renames the module in `src/shell/navigation.ts`, BP-04 and the Shell file as a build change of its own; A6 and A15 to A17 are shell refinements to land in the Shell file and then the Sales file; A8 waits for the shell library to publish; A18's Sales-side page is G1 in the Sales file |
| A4, A7, A22 | Accepted as labelled: A4 stays "proposed" until D-009 defines the control rule set; A7 keeps illustrative gate values until D-010 names the policy; A22 keeps three class rows and reads the twelve-row import as workbook rows |
| A2 | Accepted as drawn for this file (the accepted 12 px strip). The 56 px icon strip with per-user persistence is to be decided in the Shell file, because a 12 px strip has no affordance and fails the 24 px pointer-target rule of the standard's Design ready checklist, and then carried into Sales and Estimating together |
| A3 | Accepted: five labelled tabs; the icon-only phone bar accepted in Reviews & approvals D8 is recorded as superseded for phones, so one phone bar pattern applies across the application |
| Capability assumptions | Accepted. `cpq.publish` is recommended for the independent reviewer duty with an author-cannot-publish rule, to be recorded in DEC-CCE-06; until then Publish reads unavailable on X10 and AD07 |

Questions of section 7:

| # | Decision |
|---|---|
| Q1 | Yes to both; the rename is a build change of its own |
| Q2 | Illustrative values stay in the design; the real approver and thresholds are decided in D-010 as a duty, not a person, and the design shows whatever the policy says wherever a gate reads it |
| Q3 | The Control workbench stays as proposed and is built last of the four |
| Q4 | Five labelled tabs (A3) |
| Q5 | One numbering series; gates by value only unless a rule set is involved (A5) |
| Q6 | The icon strip, decided in the Shell file first (A2) |
| Q7 | Withdrawn by addendum A2 |
| Q8 | Section 9 wins |
| Q9 | GST shown separately, with the total excluding GST and the total including GST |
| Q10 | Keep the business day the label names (A14) |
| Q11 | Reading adopted: Screen systems v2 derives delay units by a fixed count rule; v3 broke that derivation in its drive rework; v4 restores it as the length-threshold rule. One basis line on CS04 changes to say so; R09 and R10 stand |
| Q12 | Resolved from dataset 9.8 without a decision: SYN-REF-000031 is "Pinion drive, two spans", so the rule the v3 change list declares (2 motors per span for pinion drive, couplings as shafts plus motors) gives the 4 motors and 6 couplings the case expects, and the run's 2 and 4 show the declared change is not effective in v3. The reviewer's note on R12 asking the author to confirm the drive-type condition is the right finding and stands |

Audit order of 9.7, as adopted with two changes: refinements R1 to R10 and polish P1 to P8 are drawn as one pass, because each touches every sheet and one pass means one verification run; and G5, prototype links for the main journey, is pulled into that pass because the standard's Design ready checklist requires the main journey to play in Present mode. G2, G6 and G3 are drawn now; G4, G7 and G8 wait for their contracts; N-E5, N-E7 and N-E9 are drawn as proposals with their rules written first; N-E6 is deferred until a review-before-send policy exists, and N-E10 as a later platform capability; G1 and the other Sales items go to one Sales-file prompt. One named version, "PPO - Estimating module (accepted)", was saved by Dean Fiedler on 10 November 2026 after the batch, so a single version pins the accepted state including the contrast corrections R1 and R2.

### 12.2 Design ready check

A session that had not drawn the file ran the standard's Design ready checklist on 10 November 2026, read-only: all fifteen scope pages, all 90 sections and 300 frames walked programmatically (about 118,000 nodes), 29 renders read, seven contrast pairs computed independently (5.14 to 14.37 : 1, agreeing with ST01). Its report is kept with the session notes, not in the repository, because it names the file. Before correction the checklist read 1 pass (contrast), 5 partly, 4 fail (variables and text styles, clipping and overlap, pointer targets, Present mode) and 1 not checkable (drag, sticky and repeated steps, which need a prototype); 29 findings, 11 corrections, 12 questions and 5 notes.

The corrections were made the same day, before lock-in:

| Finding | What changed |
|---|---|
| DR-1 the last register column clipped under the sticky actions column on 8 of 9 registers | Scroll affordance on all 29 register tables (A25) |
| DR-2 chip groups over the meaning text on the ST01 card | The chip groups wrap in a 300 px column |
| DR-3 customer pricing rows without an item label | The Freight to site row rebuilt and the stray row removed on QP01, QP02, QP07 and QP08. The first attempt also removed the Exclusions, Terms and Options sections and the phone footer card on seven sheets; they were rebuilt from the dataset text (9.14) and the renders re-read |
| DR-4 T01 title row and checks strip overflow | Title one line at 300 px; the checks note truncates |
| DR-5 tablet top bar clipped the name; the rail's bottom group covered More | A27 |
| DR-6 C00 toolbar and card titles | Toolbar reduced to the view switcher, Workbench and State filters, Add filter, Group and Sort; card titles are the family names |
| DR-7 AD01 clipped chip and truncated navigation | Navigation labels 200 px; row columns 180 and 150 px |
| DR-8 contradictory counts | CO01 title 6 with "1 expiring Fri 13 Nov"; V01 title and All open 8 |
| DR-9 scrims on a raw colour | A28 |
| DR-10 no text styles; DR-11 no CSS names | A29, A28 |
| DR-12 derived chrome not labelled Proposed | The four derived components renamed "· Proposed" with a Status description |
| DR-18 phone buttons 40 px | Seventeen phone buttons at 44 px (A32) |
| DR-21 no prototype | A30: fourteen flows |
| DR-22 titles and breadcrumbs | TB01 and PH12 read "Intake & workload"; I01 to I03 read Estimating › Insights › page name |
| DR-24 X35 hosted on the Quotations register; X15 truncated carry-over | X35 re-hosted on a clone of the Workload register content; the X15 text wraps |
| DR-26 KPI captions truncated | Twelve KPI labels split into label and meta (T01, K07, the wizard and insight tiles) |
| DR-27, DR-29 | The fifteen Flows and notes cards carry a FLOWS label; the Read me audit card says what its position audit measured |

The questions were decided under Dean's standing order and recorded as A25 to A33. The notes (DR-23 row-edge bars explained on ST01, DR-28 raw paints inside the shell copies inherited from the accepted file) stand as recorded in A8 and on ST01.

### 12.3 Lock-in

The fifteen scope pages moved above the — Proposals — separator with their names and node IDs unchanged, as the standard's section 4 requires. The CS04 basis line reads the adopted Q11 rule ("2 delay units per drive line (one at each end) · v2 count rule. The length threshold (over 50 m) is the v4 draft rule, R09; its absence fails the v3 case on R10"). Two hidden helper text nodes were added beside the library on Shell and kit, holding the refinement pass and the flow routines, so a later session can continue. Ready for dev marks could not be set through the plugin API (A33). Dean saved the named version "PPO - Estimating module (accepted)" of the file "PPO - Estimating module (proposal)" on 10 November 2026, after the batch of 12.4 was drawn and verified. Under [Build from the named Figma version](figma-named-version-build-handoff.md) that version pins the accepted state of every sheet the Read me index and sections 11.2 and 12.4 list by node ID; the build reads it and never the live file. Any later design change needs a new named version.

### 12.4 Drawn after the acceptance

**One pass over all fifteen pages** (refinements and polish). Sub-lines fill the row so "About this page" sits at one x on every page head (P3), and the long ones are cut to one clause (R4: E01, Q01, V01, I01 and twelve others); footers one clause on Q01 and V01 (P5); 46 stage bars drop the time, then the weekday, when the chip is tight (R3: 171 dates shortened, 19 hidden); E01 view tiles fill like Q01's (P1); the TB01 table fills to the footer (P7); row-menu icons 16 px (P6); chip casing scanned, two fixed (P4); 41 sheet labels trimmed to read the code and page before the ellipsis (P8); K07 carries the "Policy not configured" chip beside margin and markup (R7); the V01 rule-set group shows family and version chips (R10); the ST01 contrast row reads 5.29 : 1 (R1). Verified rather than changed: the CF and CC rule-set chips already took the provisional tone (R6); no text in CS03 sits white on brand/green-deep, so the ST01 3.57 : 1 row is a UI-only pair (R2); the KPI tile is one component across E05 and I01 to I03 and O01 has none by design (R8); the legend sits on QP02 only (R9). Tabular figures (R5) come with the text styles (A29).

**New sheets:**

| Sheet | Node | Page · section |
|---|---|---|
| TB17 Approve with confirmations, tablet | `215:10825` | Quotations · Tablet |
| TB18 Return approval with reason, tablet | `215:11076` | Quotations · Tablet |
| TB19 Record customer response · Accepted, tablet | `215:11316` | Quotations · Tablet |
| PH13 Return approval with reason, phone bottom sheet | `215:11587` | Quotations · Phone |
| Q29 Conversion result after step 4 (dataset 9.11; plan frozen Thu 5 Nov 2026, 10:05, one of the sheets after the story time, A13) | `215:11643` | Quotations · Desktop |
| X45 Return approval with reason, validation state | `215:12165` | Quotations · Dialogs |
| PS11 Workbench denied | `215:26295` | Workbenches · States |
| PS12 Workbench offline | `215:26661` | Workbenches · States |
| PS13 Workbench partial source | `215:27091` | Workbenches · States |
| R17 Proposed · suggested rule-set draft from an imported workbook (N-E5) | `217:5608` | Rules studio · Desktop |
| K16 Proposed · what-if with margin sensitivity to a source change (N-E7) | `218:4610` | Configure & price · Desktop |
| V12 Proposed · explain this finding in plain English (N-E9) | `218:8733` | Reviews & approvals · Desktop |

The sheet count is 297 (285 plus these twelve); the Read me index lists every sheet with its node. G2's phone variants of the approve and record-response dialogs already existed as PH05 and PH07. G1 and the other Sales items wait for a Sales-file prompt; G4, G7 and G8 wait for their contracts; N-E6 and N-E10 are deferred (12.1).

**Verification after the batch.** Position audit on all fifteen pages: no loose node, no sheet outside its section, no sheet overlap, no section overlap, no unlabelled sheet; the only children beyond a sheet's bounds are the QP03, QP04 and PH11 page columns, clipped to the first screen by design. Renders re-read: E01, T01, C00, TB01, Q29, PH13, PS12, K16, R17, V12, X45, AD01, QP01, QP03, X35, TB17 and the ST01 chip card; three follow-up trims came from them (the C00 toolbar, the Q29 title, the K16 state column). Not re-run: the full weekday and story scans (the new sheets' dates were written from the dataset), the overflow guard (the pass touched text widths, not sheet bounds), and the contrast table beyond the two changed rows.

## 13. Alignment batch — 12 November 2026

The [independent review](estimating-module-independent-review.md) (PPO-ESTIMATING-REVIEW-PROP) found 36 items, ER-01 to ER-36, and asked nine questions. Dean decided them on its recommendations ("proceed on your recommendations"; review section 9). The session that wrote the review drew the batch the same day in the file, now named "PPO - Estimating module", after claiming it in a draft pull request. **The batch is an amendment to the accepted design:** nothing in it is accepted until Dean accepts it, and the build keeps reading the named version "PPO - Estimating module (accepted)" until he saves a new one.

### 13.1 What changed

| Area | Change |
|---|---|
| Facts (ER-01 to ER-13) | Riverbend estimate v03 reads Reviewed on T01 to T06, T08, T16, TB13 and the dialog hosts, with cost A$94,270, margin 27.2 %, markup 37.4 %, ten lines and none Unknown, checks 4 of 5 with "10 of 10 · 2 provisional"; the issued r01 document on Q08 matches Q03 (fingerprint 9a30…2c1e, an Options row added); revision 01 offers Option 1 and revision 02 adds Option 2 (dataset 9.14 and Q20); payment 30 days from invoice; site Lindenow VIC; Q27 carries no Unknown lines; O04 reads +A$3,850 · +7.0 %; TB01, PH02 and PH12 rebuilt from E01's nine estimates in four groups; X19 sits on the Riverbend r02 quotation signed in as Jordan Blake; Kim Patel replaced by Sam Jordan (82 texts, Q-B; provisional until checked against addendum A3); pronouns removed; the Sales briefs badge reads 3 and V01's "Waiting for me" reads 0 for Priya Nair; ST01's accent row reads #156e64, AA text |
| Record header (ER-14 to ER-17) | 119 record headers restructured in the order of Shell rules R116 to R125: breadcrumb; title with one state chip and the star; sub-line; a toolbar row with previous and next "n of N in view", secondary chips, Actions, Outputs and one state-driven primary last. "Reports" renamed Outputs on 34 records, and Q03's open menu holds Download PDF, Print, Issued document, Customer page and Export lines. Catch me up leaves the title row (the T01 strip stays). Primaries follow Q-A and R117: "Issue & send r01" on Q07, Q09 and X21; "Record response" on issued quotations, with Prepare revision and Plan follow-up moved into Actions; on Q27 the preparer sees "Approve…" unavailable with "You prepared this revision, so you cannot approve it. Jordan Blake can."; X19 shows Return and Approve… to Jordan Blake; V07 has Return and Approve r02 in its toolbar |
| Widths and layout (ER-18, ER-20, ER-21) | Thirteen overlay drawers widened from 432 to 480 px (Q-G); docked workbench and summary panels keep their width. Cell widths re-balanced on 46 tables so that only the longest columns truncate, with an ellipsis; clipped single-line texts end in an ellipsis; the V07 to V10 gate sentences shortened; AD02's redundant Published column removed; T10's Lines read rows realigned to their headers (synthetic workbook keys M-2, GB-1, DS-58 added) and the H-02 flag removed; Map to Variant and Mark One-off moved to the unmapped-parts notice |
| Accessibility and finish (ER-22 to ER-26, ER-31 to ER-36) | Phone buttons 44 px; 21 phone input texts 16 px; CS03's primary label and selected span pass contrast; W02's unavailable-option reasons readable; due dates no longer use colour alone; 24 px avatar initials and CS03's dimensions 11 px; the KPI tile value uses PPO/Page title 20 Medium; T02 and Q27 name the flagged rows; E05's focus lines drop the inline rule text; duplicate controls removed (Q08, Q20, AD02, the wizard stepper beside an open step menu); 21 labelled Columns buttons removed beside the column icon; designer notes removed from O04 and the customer page sheets (QP02 keeps its legend); the Read me and kit no longer say "proposal", and 13 kit components carry a Status line |
| Conventions (ER-27 to ER-30) | 563 revisions and versions in two digits (Q-C; r2026-07 and supplier references unchanged); organisations SYN-ORG- with Riverbend Growers SYN-ORG-000142 (Q-I; provisional until checked against addendum A3); SYN-REF-, SYN-CAL- and SYN-EAR- in six digits (SYN-SRC- keeps the four digits the code uses); "ex GST" on staff pages; AEDT on 14 register footers; 47 stage bars with day-and-month dates and "Not yet" on future stages; one chip tone per word for Unknown, Allowance, Manual, Awaiting review, Incomplete and Not saved |
| Validity (Q-D) | Issued r01 documents read "Valid until Sun 29 Nov 2026"; unissued documents "set at issue · 30 days"; AD04 shows 30 days from issue as illustrative until D-010 and D-024. The Expired stage is not part of the amendment: it is drawn as proposal Q30 |
| Rail (Q-F) | Settings is the current rail item on AD01 to AD08 (item fill, bar, label weight and colour moved from Estimating) |

### 13.2 New sheets

| Sheet | Node | Page · section | Status |
|---|---|---|---|
| QP09 Customer quotation page redrawn as a document: summary, numbered scope, options, pricing with totals and GST, exclusions and assumptions, terms, supplier footer, and a summary aside with the total, validity, download and what happens next; "What changed since revision 01" (N-E13) | `306:76` | Customer quotation page · Desktop | Proposed (Q-E) |
| QP13 QP09 with options to choose and written acceptance that creates a response for staff to confirm (N-E15, N-E16) | `307:82` | Customer quotation page · Desktop | Proposed; waits on D-024 |
| QP10 Customer page, tablet 1024 | `308:94` | Customer quotation page · Tablet | Proposed (Q-H) |
| QP11 Customer page, phone 390, first screen with the fixed download bar | `308:317` | Customer quotation page · Phone | Proposed (Q-H) |
| QP12 Customer page, phone 320 | `308:555` | Customer quotation page · Phone | Proposed (Q-H) |
| PH14 Estimate summary, phone 390, read only, sticky Actions and Open quotation r02 | `311:4557` | Estimate record · Phone | Proposed (Q-H) |
| CO07 Source change watch on SQ-2026-114 (N-E11) | `312:1499` | Cost sources · Desktop | Proposed |
| W17 Similar delivered jobs in the evidence panel, preview only (N-E12) | `312:6870` | Estimation wizard and discovery · Desktop | Proposed |
| Q30 Expired stage after the validity date, a later frame of Q03 on Mon 30 Nov 2026, with Prepare successor revision | `320:12058` | Quotations · Desktop | Proposed; waits on D-010 and D-024 (Q-D) |

The sheet count is 306. The Read me cards list the new sheets with their nodes and summarise the batch.

### 13.3 Assumptions added

| ID | Assumption | Recommendation |
|---|---|---|
| A34 | The record header is drawn as local frames in the order of R116 to R125, not as instances of the Shell's Shell / Record header · toolbar, which is not published as a library; the swap follows the library publication with the other shell copies (A8) | Keep until the library publishes |
| A35 | Customer documents use the new text styles "PPO/Document 14 · Proposed" and "PPO/Document 14 Medium · Proposed" (Roboto 14/22), because the staff ramp's Body 13 is small for a customer document | Move to PPO - Library if accepted |
| A36 | The Shell's record toolbar draws its primary in green while this file keeps one navy primary per view; the Shell file's own primary colour decision, in review elsewhere, decides whether record primaries change colour | Keep navy until the Shell decides |
| A37 | The 30-day validity is illustrative until D-010 and D-024 decide the policy; the Expired stage is a proposal (Q30), not part of the amendment | Keep |

A17 is superseded where it kept Issue and Send as separate primaries (Q-A); Issue and Send remain two recorded decisions. A10's 480 px side panels now match the library's drawer widths.

### 13.4 Carried forward, outside this file

- **Shell file:** the Estimating menu entries for Pulse, Saved estimates and Insights (Q-F); the tablet rail rule (A27); the 56 px collapsed strip (A2); the record primary colour (A36).
- **Sales file:** two-digit brief revisions (Q-C) and SYN-ORG- organisation references (Q-I), with its open record-header batch.
- **PPO - Library:** the proposed document text styles (A35); the kit components named "Sales / …"; applying the text styles (A29); the drawer component.
- **Elsewhere:** the print layout of the quotation document (DK-06); D-024 for QP13.

### 13.5 Verification and limits

Checked: every scope page walked after the batch (305 sheets at the time, 30,363 texts; Q30 and the rail change followed Dean's comment and were checked by render): no loose node, no sheet or section overlap, every sheet labelled, Roboto only, no unbound paint outside instances, every weekday true to the 2026 calendar, and no Kim Patel, one-digit revision, "Reports" button, SYN-CO- reference, gendered pronoun or retired figure left. Renders read after the change: T01, T02, T10, Q03, Q27, V07, X19, K07, AD02, W04, CS03, E04, CO07, W17, PH14, QP09 to QP13.

Not done: a Design ready check of the changed sheets by a session other than this one; most of the sheets touched by the scripted passes were not re-read by eye; the prototype flows are not extended to the new sheets; Ready for dev marks cannot be set through the plugin API; the per-route page guidance in `docs/design/development/pages/`. Partly done: ER-26 (the 10 px texts inside the Shell copies belong to the Shell file), ER-32 (some KPI captions still truncate) and ER-34 (register tables still stop short of the page foot).

Also open: the check of Sam Jordan and the SYN-ORG- references against addendum A3 (review section 9). Next: the A3 check, the independent Design ready check, then Dean's acceptance and the new named version, after which this record names that version as the build source.

