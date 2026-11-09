---
document_id: PPO-ESTIMATING-REFINED-FIGMA-PROP
date: 2026-11-09
owner: Dean Fiedler
status: Proposal, 9 November 2026, awaiting Dean Fiedler's acceptance of A1–A18; two directions he gave the same day are recorded in section 10; no named version saved yet; not an implementation baseline; no application code, route, read model, migration, permission, capability, grant, seed or deployment; every record shown is synthetic
source_commit: 0d1959f7363ef3434fefa4434904724b9e4af78a
versioning: git
---

# Estimating module refined UI pages — proposal

**Owner:** Dean Fiedler · **Date:** 9 November 2026 · **Status:** Proposal awaiting acceptance. Sections 1 to 8 are the proposal record; section 9 holds the audit made before hand-back; section 10 records the two directions Dean gave on 9 November 2026 and what was drawn from them. Later sections will record acceptance, drawn batches and named versions as the [Sales record](sales-module-refined-ui-proposal.md) does.

On 9 November 2026 Dean asked for the complete refined UI page set of the Estimating module to be drawn in a brand-new private Figma file, "PPO - Estimating module (proposal)", inside the accepted shell and to at least the standard of the Sales module file, using the accepted "PPO - Shell" file as the source of truth for the chrome and the Design file's Estimating pages as content reference only. His brief fixed ten decisions: the module is named Estimating; quotations are an output of Estimating and exist in Sales as simple quotations; four specialised workbenches (Screens, Fertigation, Automation, Control) share a generic template; Excel estimates import to lines and keep the workbook as evidence; review and approval gates are rule-based and explained; customer e-mail and page tracking are built in; customisation publishes from drafts with impact shown; one register standard applies to the whole application (reorder, resize, inline edit with a change reason, address lookup); the docked workspace menu can collapse; and the synthetic story stands at Thursday 5 November 2026, 09:00, signed in as Priya Nair, estimator. He gave the same four rules as for Sales: one line of data per register cell even if the table scrolls sideways, no second search bar in the content area, pages as professional as the shell, and otherwise full creative control, with everything undecided decided by the designer and recorded for him.

This record is a **proposal**. It describes what was drawn, the rules applied, the assumptions made and the questions Dean has to decide. It changes no code, test, migration, seed, permission or route. Acceptance of the design will not make the drawn pages an implementation baseline: source presence, visual review of built pages, functional proof and deployment stay separate.

## 1. Sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Shell (accepted)", named version "Shell refined concept — accepted" (8 November 2026), pages "Shell refined · desktop shell and menus" and "Workspace menus · flyout and docked" | Chrome and geometry: 48 px top bar, 80 px collapsed rail, 48 px right strip, content from x 80 to 1392, 280 px docked workspace menu, the accepted 12 px collapsed strip, navy selection bar, white canvas. The shell components, the Estimating flyout and docked menu and the 101 icon components were copied into the new file under the same names so instances can be swapped to the published library later |
| Private Figma file "PPO - Sales module (accepted)", named version "PPO - Sales module (accepted) · batch 2 · N13" | The standard to match: its header, index and audit cards, kit components (chip, button, avatar, checkbox, filter chip, tab, KPI tile), derived tablet and phone chrome, helper library and verification routines were carried into the new file and extended for Estimating |
| Private Figma file "PPO - Design", Estimating pages (Intake, Estimate detail, Sales briefs and Brief page, Discovery register and Create discovery, Wizard, Discovery costing, Fertigation and Automation configurators, Excel import, CPQ 1–6, Screen workbench, Cost sources, Quotations and Quotation detail, Release, Customer page and Customer response, Conversion, Reviews and Estimate review, ES-09 outcomes, ES-10 reference cases, Rules studio with states S1–S14) and shared components | Content reference only: page content, states and vocabulary, redrawn inside the refined shell |
| [Configuration rule sets](ADR-0066-configuration-rule-sets.md), the [estimating configurator model](estimating-configurator-model.md), the estimate detail, estimate review, cost-source, quotation, release, customer-response, conversion (ES-07), outcome (ES-09) and reference-case (ES-10) decision records under `docs/decisions/`, and the Excel-import decisions | Decisions carried into the pages: immutable versions and revisions, three review kinds with Reviewed as the only positive outcome, the three-person rule on quotation approval, Issue separate from Send, tracking visible to the sender only, conversion as the receiving owner's decision, reason codes name causes never people |
| [Shell refined concept design](shell-refined-concept-design.md) and its [rules R1–R115](../design/development/systems/shell-refined-concept-rules.md) | Shell behaviour: nested page views in the docked menu, overlay drawer, selection bar, dialog pattern, one navy primary per view |
| `src/shell/navigation.ts` | The Estimating rail order and destinations; it still names the workspace "Estimating & quotation" and the intake item "Sales briefs" |
| [PPO-STD-001](../standards/naming-conventions.md), [HTML module conformance](../standards/html-module-conformance.md), [design-to-build standard](../standards/design-to-build-standard.md) | Naming, the conformance declaration of section 2, tokens and the separation of acceptance from shipped values |
| [Figma named-version build handoff](figma-named-version-build-handoff.md) | Why a named version is needed before any build and why the file's link is not recorded here |

The new file's link and key are not recorded in this public repository (ADR-0050, ADR-0053). Node IDs are recorded so each sheet can be opened from the file. Node IDs beginning `21:` are the section frames; a sheet's node is the 1440 × 900 frame (1440 × hug for the full-length customer page, 1024 × 768 for tablet, 390 × 844 or 320 × 844 for phone).

## 2. Conformance declaration

| Field | Declaration |
|---|---|
| Scope identity | The Estimating workspace: `route:/estimating` (Pulse and workload, ES-01), `route:/estimating/intake` (Sales briefs, CR-02), `route:/estimating/discovery` (ES-02), `route:/estimating/cpq`, `route:/estimating/configurations` (ES-08, ES-02), `route:/estimating/rules` (ES-02, ES-03), `route:/estimating/cost-sources` (ES-03), `route:/estimating/estimates/[id]`, `route:/estimating/reviews` (ES-04, ES-05), `route:/estimating/quotes` (ES-05, ES-06, ES-07), `route:/quote/[token]` (customer page, ES-05), `route:/estimating/outcomes` (ES-09), `route:/estimating/reference-cases` (ES-10), the Estimating extracts of RP-02 and `route:/settings/estimating`. No parent requirement ID is added or renamed; all 78 remain |
| Page types (r20) | Register / worklist (E01–E04, E06, B01, W01, K01, C00, R01, CO01, T lines and sources tabs, V01, Q01, Q02, O01, O08, AD07); Overview / dashboard (E05, I01–I03, AD01); Record detail (B02, B04, B05, B08, B10, T01–T08, T16, V02–V04, V06, Q03, Q13–Q15, Q17–Q18, Q20, Q25–Q28, O02–O07, O09, O11–O12, R02–R05, R07, R13–R14, CO02–CO04); Form / guided workflow (W02–W09, W13, T09–T13, Q04, Q10–Q11, Q21–Q24, R06, R08–R09, R15, AD02, AD04–AD06, AD08); Workbench (CT01, CS, CF, CA, CC 01–11, K02–K09, K12–K15, W14); Review / comparison (B09, W10–W11, K09, R10–R12, R16, V05, V07–V11, Q05, Q09, Q16, Q19, CO05–CO06, O10); Customer-facing document page (QP01–QP08); Decision dialogs and side panels (X01–X42); States (PS01–PS10, X43, ST01); Tablet and phone (TB01–TB16, PH01–PH12) |
| Reused components | Copies of the accepted shell: Shell / Top bar, Shell / Rail · collapsed, Shell / Right rail · collapsed, Shell / Workspace menu · docked (Estimating), Shell / Workspace menu · collapsed strip; 101 icon components (Lucide stand-ins for Font Awesome Light, as in the shell file); the "PPO colour" variable collection (66 variables, same names and values as the shell file). Estimating kit copied from the Sales file: Chip, Button, Avatar, Checkbox, Filter chip, Tab, KPI tile. Derived chrome: tablet top bar, phone header with page-name and view text properties, status bar, Estimating phone tab bar as a variant set. New component family on CT01: Segment, Field, Context fact, Definition row, Result row, Decision row, Change row, Save bar, Rule strip, Field inspector, Working panel |
| Source authority | The decisions in section 1 and Dean's 9 November direction. The fixture is synthetic: as at Thursday 5 November 2026, 09:00, signed in as Priya Nair unless a sheet names another person (Marcus Tan reviewer, Jordan Blake approver, Sam Whitfield rule-set reviewer, Kim Patel engineering owner, Lee Nakamura observer, Tom Reid and Dean Fiedler in Sales, Robin Hale receiving) |
| Incoming handover | The Estimating rail and docked menu; global search; notification and My Work links to a record; the Sales brief handed over from Sales (CR-02); the customer's quotation link (`/quote/[token]`). Arriving creates no business record |
| Outgoing handover | Sales brief decisions back to Sales; quotation revisions to the customer page and e-mail; accepted quotations to Supply demands through the four-step conversion (ES-07, Q21–Q24, ending at the receiving owner's freeze); outcome lessons to reference cases (ES-10); rule-set versions to the workbenches. Nothing drawn creates an order, project, work order, stock movement, booking or ERP or Finance transaction |
| Exceptions and recovery | Ten page states on PS01–PS10 (loading permitted evidence, true-empty, filtered-empty, could not load, denied or not found, stale or newer version, partial source, outcome unknown with recovery, read only, provisional values in use); send outcome unknown on Q12; issue held on Q09; stale proposal on each workbench 08 sheet; expired source on CO06; over-100-lines block on T15. A count that cannot be read shows a dash, never zero |
| Departures | Section 5 (A1–A18) |
| Verification | Section 6 and the audit in section 9 |

## 3. Sheet inventory

Sheets are 1440 × 900 desktop frames unless stated. Node IDs are those of the sheet frame in the new file; the section node follows each heading. Sheet labels on the canvas read `CODE · Page — state (scope) [source]`.

### 3.1 E · Estimating Pulse and workload (section `21:351`)

| Code | Sheet | Route or scope | Type | Node |
|---|---|---|---|---|
| E01 | Intake & workload — Mine, grouped by who acts next, nine estimates | `route:/estimating` | Register | `22:241` |
| E02 | Intake & workload — with the Estimating docked menu (14 pages) | same | Register | `22:986` |
| E03 | Intake & workload — collapsed docked menu (12 px strip) | same | Register | `22:1855` |
| E04 | Intake & workload — row selected, snapshot panel with checks and next step | same | Register and panel | `22:2602` |
| E05 | Estimating Pulse — day start, Focus for today ranked by rule (N-E4) | `route:/estimating/pulse` | Overview | `24:1954` |
| E06 | Saved estimates — register with version, checks and last change | `route:/estimating/estimates` | Register | `23:1850` |

### 3.2 B · Sales briefs, Estimating side (section `21:352`)

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

### 3.3 W · Estimation wizard and discovery (section `21:353`)

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

### 3.4 K · Configure & price, CPQ (section `21:354`)

| Code | Sheet | Route or scope | Type | Node |
|---|---|---|---|---|
| K01 | Configurations register | `route:/estimating/cpq` | Register | `32:7929` |
| K02 | Configure — preview current, "Why this line?" entry (N-E2) | `route:/estimating/cpq/[id]` | Workbench | `32:8533` |
| K03 | Configure — blocked, drive units exceed the shared controller | same | Workbench | `32:8987` |
| K04 | Solution overview — systems, shared controller, coverage | same | Workbench | `32:9442` |
| K05 | Materials & labour grouped by system | same | Workbench | `32:9875` |
| K06 | "Why this line?" panel — rule, inputs, source and basis hash (N-E2) | same | Panel | `32:10438` |
| K07 | Pricing — cost to proposed sell, margin and markup side by side, price state | same | Workbench | `32:10916` |
| K08 | Requires approval explained (illustrative gates, A7) | same | Workbench | `33:9494` |
| K09 | Compare current against saved evaluation 2, what-if note (N-E7, proposal) | same | Comparison | `33:9866` |
| K10 | Use in estimate — confirm the exact evaluation and version | same | Decision | `33:10344` |
| K11 | Used in estimate — v05 created | same | Workbench | `33:10731` |
| K12 | Receive an incoming workbench proposal | same | Workbench | `33:11138` |
| K13 | Manual product or one-off line | same | Workbench | `33:11576` |
| K14 | Express replacement estimate | same | Workbench | `33:12021` |
| K15 | Resolve pricing readiness | same | Workbench | `33:12447` |

### 3.5 C · Specialised configurator workbenches (section `21:355`)

Each workbench family has the same eleven sheets: 01 Overview with the context strip; 02 Inputs grouped as the workbench asks them; 03 Discipline view; 04 Calculation trace open; 05 Parts & working; 06 Conflicts and Resolve a conflict; 07 Compare & save; 08 Use in estimate and the stale proposal after a basis change; 09 Run history and definition review; 10 collapsed docked menu; 11 the bypass path ("Enter lines manually instead"). Route `route:/estimating/configurations/[id]`.

| Code | Sheet | Type | Node |
|---|---|---|---|
| C00 | Workbench registry — disciplines, rule-set version in use, provisional flags, last runs | Register | `40:23026` |
| CT01 | Generic workbench template with the component family (teal component annotations are documentation) | Template | `40:23707` |
| CS01–CS09 | Screens workbench 01–09 (discipline view: drawings with the field inspector) | Workbench | `39:12062` · `39:12541` · `39:13007` · `39:13550` · `39:14038` · `39:15252` · `39:15695` · `39:16179` · `39:16624` |
| CS10, CS11 | Screens collapsed menu; Screens bypass | Workbench | `39:14771` · `39:17080` |
| CF01–CF09 | Fertigation workbench 01–09 (growing areas, water and hydraulics, recipes and dosing, controls and I/O) | Workbench | `39:17508` · `39:18016` · `39:18542` · `39:19103` · `39:19618` · `39:20742` · `39:21210` · `39:21727` · `39:22195` |
| CF10, CF11 | Fertigation collapsed menu; Fertigation bypass | Workbench | `39:20232` · `39:22695` |
| CA01–CA09 | Automation workbench 01–09 (production scenarios, process and equipment, line capacity, layout) | Workbench | `39:23148` · `39:23646` · `39:24147` · `39:24691` · `39:25199` · `39:26391` · `39:26853` · `39:27297` · `39:27759` |
| CA10, CA11 | Automation collapsed menu; Automation bypass | Workbench | `39:25891` · `39:28206` |
| CC01–CC09 | Control workbench 01–09 (I/O schedule and relay modules derived from fertigation and automation outputs, A4) | Workbench | `39:28657` · `39:29171` · `39:29664` · `39:30275` · `39:30776` · `39:31842` · `39:32301` · `39:32778` · `39:33253` |
| CC10, CC11 | Control collapsed menu; Control bypass | Workbench | `39:31326` · `39:33702` |

### 3.6 R · Rules studio (section `21:356`)

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

### 3.7 CO · Cost sources (section `21:357`)

| Code | Sheet | Route or scope | Type | Node |
|---|---|---|---|---|
| CO01 | Register — kind, supplier or basis, validity, bound lines, state | `route:/estimating/cost-sources` | Register | `54:27458` |
| CO02 | Source record — supplier quote with validity and attachment | `route:/estimating/cost-sources/[id]` | Record | `54:28168` |
| CO03 | Labour rate card revision | same | Record | `54:28624` |
| CO04 | FX and landed-cost bases, dated | same | Record | `54:29044` |
| CO05 | Compare source costs for an estimate | `route:/estimating/estimates/[id]/sources` | Comparison | `54:29429` |
| CO06 | Expired or stale source flagged on estimates — rebind flow | same | Comparison | `54:29925` |

### 3.8 T · Estimates (section `21:358`)

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

### 3.9 V · Reviews & approvals (section `21:359`)

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

### 3.10 Q · Quotations (section `21:360`)

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

### 3.11 QP · Customer-facing quotation page (section `21:361`)

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

### 3.12 O · Outcomes and reference cases (section `21:362`)

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

### 3.13 I · Insights (section `21:363`)

| Code | Sheet | Node |
|---|---|---|
| I01 | Estimating workload and cycle time — counts with their rules | `69:43196` |
| I02 | Hit rate by family; quotation ageing and response | `69:43529` |
| I03 | Estimate-to-actual variance and rule-set coverage | `69:43901` |

### 3.14 X · Dialogs and panels (section `21:364`)

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

### 3.15 PS · Page states (section `21:365`)

| Code | State | Node |
|---|---|---|
| PS01–PS05 | Loading permitted evidence; true-empty; filtered-empty; could not load; denied or not found | `75:52676` · `75:52989` · `75:53253` · `75:53520` · `75:53791` |
| PS06–PS10 | Stale, newer version saved by someone else; partial source; outcome unknown with recovery; read only; provisional values in use | `75:54004` · `75:54276` · `75:54594` · `75:54854` · `75:55122` |

### 3.16 ST · Interaction states and accessibility (section `21:366`)

| Code | Sheet | Node |
|---|---|---|
| ST01 | Register row states, column header states, inline edit cell states, address lookup states, button kinds × states, chip tone ramp with meanings, checkbox states, keyboard order, tabular figures and the contrast proof table computed from the PPO colour variables (1440 × 3498) | `76:54660` |

### 3.17 TB · Tablet 1024 × 768 (section `21:367`)

| Code | Sheet | Node |
|---|---|---|
| TB01–TB08 | E01, E05, B02, W04, K02, K07, CS01, CF01 | `77:54797` · `77:55174` · `77:55466` · `77:55748` · `77:56077` · `77:56398` · `77:56735` · `77:57081` |
| TB09–TB16 | CA01, CC01, R02, R10, T01, V07, Q03, Q13 | `78:56502` · `78:56856` · `78:57196` · `78:57572` · `78:57880` · `78:58210` · `78:58461` · `78:58777` |

### 3.18 PH · Phone 390 × 844 and 320 × 844 (section `21:368`)

| Code | Sheet | Node |
|---|---|---|
| PH01–PH06 | E05 Pulse with Focus for today (and the N-E10 proposal note); E01 workload; B04 answer or resolve; V05 review decision; V07 approve with confirmations (issue not offered); Q03 quotation summary with customer views | `79:58148` · `79:58279` · `79:58427` · `79:58537` · `79:58648` · `79:58769` |
| PH07–PH12 | Q17 record response after a call; CS05 parts summary; R10 reference case results; O02 outcome summary; QP03 customer page; E01 at 320 × 844 | `79:58902` · `79:59022` · `79:59166` · `79:59277` · `79:59395` · `79:59517` |

### 3.19 AD · Administration and customisation (section `21:369`)

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

The three canvas cards are the page header (`16:222`), the sheet index and notes (`16:226`) and the audit card (`16:238`). The helper library, workbench template and configurations and the overflow guard are hidden text nodes in the kit section (`19:222`, `20:222`, `37:11291`, `38:11291`, `38:11292`, `50:23661`) so later sessions can continue with the same functions.

## 4. Rules applied

- **One line per cell.** Register cells never wrap: text truncates with an ellipsis at the cell width, the table scrolls sideways under a horizontal scrollbar, and the selection column, the first column and the row menu stay frozen. Record pages, cards and dialogs may wrap.
- **No second search.** No search box appears in the content area of any page, including the lines grids of Q27 and Q28. The shell's search (Ctrl K) finds records, pages and help; Find stays in the flyout and docked menus; grids filter with a chip.
- **Shell geometry and tokens.** Every sheet instances the copied top bar, rail, right strip and, where shown, the docked menu or the 12 px collapsed strip; content runs from x 80 (or 92) to 1392 with 24 px gutters; Roboto 11 to 20 px; every colour bound to the "PPO colour" variables; the dialog scrim is a plain 32 % navy paint.
- **Register standard.** Every register shows view tiles with counts under the title, filter chips, a footer with the count rule and a pager; column reorder and resize, inline edit with a change reason and address lookup are drawn once on ST01 and assumed everywhere (A6).
- **Counts state their rule.** Every count names what it counts; counts are never added together; a count that cannot be read shows a dash; unavailable or restricted sources are never zero.
- **Explicit gates and immutable records.** Estimate versions, discovery revisions, rule-set versions and quotation revisions are immutable and saved with a reason; Reviewed is the only positive review outcome; the preparer never approves; Issue and Send are separate decisions; tracking is visible to the sender, owner and deal owner only; a conversion is the receiving owner's decision and corrections append.
- **Rules before AI.** Focus for today, anomaly bands, gate explanations and follow-up suggestions are rule-based and explained; every AI feature (N-E1, N-E5, N-E6, N-E9) is grounded in the record, labelled as a summary or suggestion, reviewed before anything is saved and never writes to a record.
- **Dates, currency and story.** Dates read "Thu 5 Nov 2026" and "Thu 5 Nov 2026, 09:12", with weekdays true to the real calendar; ISO dates appear only inside imported file names; amounts are AUD excluding GST with GST shown separately where a total is customer-facing; every record, person and value is synthetic and carries a SYN- reference.

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

## 6. Verification

Every section was rendered and read from sample sheets after each build and after every repair (E, B, W, K, C, R, CO, T, V, Q, QP, O, I, X, PS, ST, TB, PH and AD). The verification routines ran before this record:

- **Structural pass** over all 283 sheets: no direct child outside its frame except the two intentional first-screen clips of the phone customer page (QP03, PH11); no register cell taller than one line; Roboto the only font family (27,812 texts, mixed-weight segments allowed); a label on every sheet with its code.
- **Position audit:** every sheet inside its section, no sheet, label, card or section overlap, nothing loose on the page; the three cards sit above the first section.
- **Story scan:** 112 SYN- references reconciled to one truth per record; two placeholder-suffixed IDs renamed (Mallee Fresh Produce is SYN-OPP-000296 and SYN-PPO-EST-000296; the Bairnsdale configuration is SYN-PPO-CPQ-000284).
- **Date scan:** 1,037 dated texts; weekday labels corrected against the real calendar (A14); ISO dates only inside three imported file names; no slash dates; every amount in A$.
- **Fill scan:** 99,095 nodes; the only solid fills not bound to a variable are the 62 dialog scrims, by design.
- **Contrast:** every text colour pair in the PPO colour variables computed and tabled on ST01; two pairs measure below 4.5:1 and are recorded as refinements R1 and R2 in section 9.
- **Repository checks** run for this change: `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`.

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
| Q7 | Customer-page branding, acknowledgement wording and accessibility statement? | Neutral synthetic wording; belongs to D-024, Branding, templates, issue/signature policy and accessibility (Open) |
| Q8 | Hosting of the customer quotation page and the tracking of views? | Drawn as the sender-only view model of ES-05; belongs to D-022, Architecture, hosting and integration platform (Partially resolved) |

## 8. Boundary and next steps

This record authorises nothing in the application: no code, route, read model, migration, permission, capability, grant, seed or deployment. Next steps once Dean decides: he saves a named Figma version (recommended title "PPO - Estimating module (accepted)") and the version is recorded here; the page guidance in `docs/design/development/pages/` and the design register are updated for each route with exact sheet references in their own reviewed change; the Sales file receives its follow-ups (the collapsed docked menu, the register standard, the labelled Actions menu, the record stepper and Reports menu, the New simple quotation form and the Q28 layout as Sales's own page); and the build is planned against the current application pages, keeping source presence, visual review, functional proof and deployment separate.

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
