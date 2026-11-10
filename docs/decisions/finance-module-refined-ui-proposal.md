---
document_id: PPO-FINANCE-REFINED-FIGMA-PROP
date: 2026-11-10
owner: Dean Fiedler
status: Proposal in progress (draft pull request claim, 10 November 2026); design acceptance is Dean's and has not been given; not an implementation baseline; no application code, route, read model, migration, permission, capability, grant, seed, integration or deployment; every record, amount and MYOB figure shown is synthetic
source_commit: ceaa98c4595bc404384bc413307a9bfbe2af22cb
versioning: git
---

# Finance module refined UI pages — proposal

**Owner:** Dean Fiedler · **Date:** 10 November 2026 · **Status:** Proposal in progress. Sections 1 to 8 are the proposal record; later sections will record acceptance, audit follow-ups, drawn batches and named versions as the Sales record does.

On 10 November 2026 Dean asked for the complete, refined UI page set for the Finance workspace of Powerplants One to be designed in a new, empty private Figma file, "PPO - Finance module (proposal)", composed inside the accepted shell and organised with the page template adopted for the Sales file. The brief ("Design the Finance module UI pages for Powerplants One in Figma", followed by Addendum A3 · Persona and story reconciliation as amended on 10 November 2026) fixes the mission, thirteen decisions (D1 to D13), the personas and capability matrix, thirty scenarios (S-01 to S-30), the lifecycles, the global design rules, a minimum sheet inventory and a synthetic dataset that reconciles to the cent. His standing instruction applies: "If you need any decisions from me, just proceed however you believe is the most professional and advanced approach." The brief's ten questions (Q1 to Q10) were therefore taken on their stated defaults.

Finance is the review-and-control layer over MYOB, the book of record. The pages never post, pay, resend, edit a posted document, mark an invoice paid, invent a document number or send a customer a statement; every figure states its basis (excluding or including GST) and the MYOB read it came from; a figure that cannot be stated reads in words, never as zero.

This record is a **proposal**. It describes what was drawn, the rules applied, the assumptions made and the questions Dean has to decide. It changes no code, test, migration, seed, permission, route or integration. Acceptance of the design would not make the drawn pages an implementation baseline: source presence, visual review of built pages, functional proof and deployment stay separate, as do code delivery status (none in this task), design acceptance (Dean's), production readiness (not inferred) and integration with MYOB, Customer messages or any ERP (none exists, none authorised).

## 1. Sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Finance module (proposal)" (new, empty on 10 November 2026; no named version yet) | The target. Pages: Read me, — Accepted —, — Proposals —, ten scope pages, Shell and kit, Scratch. Every scope page sits under — Proposals — until Dean accepts it |
| Private Figma file "PPO - Shell (accepted)", pages "Shell refined · desktop shell and menus" and "Workspace menus · flyout and docked (accepted 8 November 2026)"; named version "Shell refined concept — accepted" plus the record header toolbar accepted 9 November 2026 | Source of truth for the chrome: 48 px top bar, 80 px collapsed rail, 48 px right strip, content from x 80 to 1392, the 280 px docked Finance menu (frame `103:16880`), the collapsed menu strip (component set `29:3119`, sheet K `29:3122`), the record header toolbar (component set `170:10178`, phone component `170:10215`; rules R116 to R125) |
| Private Figma file "PPO - Sales module (accepted)", named version "PPO - Sales module (accepted) · batch 2 · N13" | Page template, kit component names and measurements, tablet and phone chrome, the build-time helper library, the "PPO colour" variable names (66) |
| Private Figma file "PPO - Design", Finance and Reporting pages (FN-01 to FN-06, Finance exceptions, RP-05) | Frozen reference for content, rules and stories. Four pages are accepted (FN-03, FN-05, Finance exceptions, RP-05); FN-01, FN-02, FN-04 and FN-06 are proposals of 23 October whose rules live on their notes cards. Their shell is not the one copied. This session did not re-read those pages; the brief's summary of each page's decisions was used (section 6, limits) |
| [PPO workspace and MYOB as book of record](ppo-workspace-myob-book-of-record.md) (PPO-ERP-OPERATING-MODEL-DEC; EI-1 to EI-10) | MYOB owns the ledger, receivables, payables, tax and cost; finished events only; approve before posting, correct by reversal; visible sync states; unknown outcomes are looked up |
| [BP-01 master blueprint](../blueprints/BP-01-master-blueprint.md) section 15 (FIN-01 to FIN-08; FD-01 to FD-10; BR-01, BR-14, BR-16, BR-19 to BR-21, BR-24; D-017) and [BP-07 service operations](../blueprints/BP-07-service-operations.md) (SR-11, SR-13 to SR-15, TR-14) | Parent requirements, the definition register, the four quantities, no blind repeat, stale or incomplete data is never a verified zero |
| [ADR-0016 P10 Finance handoff](ADR-0016-p10-finance-handoff.md), [Finance handoff contract](../contracts/finance-handoff.md), [Finance workspace design](finance-workspace-design.md) | Handoff states, four duties, synthetic modes, "missing values render Unavailable or Unknown, never numeric zero" |
| [Project financial performance](project-financial-performance-figma-design.md), [Cash outlook](cash-outlook-figma-design.md), [Finance exceptions](finance-exceptions-figma-design.md), [Supply & Finance trust](supply-finance-trust-figma-design.md), [Report definitions](report-definitions-figma-design.md), [Quotations & account](quotations-account-figma-design.md) | Accepted page decisions carried into the refined pages |
| [Same-name Finance mapping](same-name-finance-mapping.md), [Report and Finance download access](report-finance-download-access.md), [Project delivery billing](project-delivery-billing.md), [Project commercial controls](project-commercial-controls.md), [Project commercial design](project-commercial-figma-design.md), [Project commercial Finance definitions](../contracts/project-commercial-finance-definitions.md), [Time & labour review](time-labour-review-figma-design.md), [Maintenance and service TS-02 decisions](maintenance-service-ts02-decisions.md), [Navigation architecture board](navigation-architecture-board.md), [MYOB integration blueprint](../contracts/myob-integration-blueprint.md) | Mapping by key never by name, claim schedules and `ProjectClaim`, project-linked and agreement-covered lines Non-billable, hours without rates on Service, no payment gateway |
| [Shell refined concept design](shell-refined-concept-design.md) and its [rules R1–R125](../design/development/systems/shell-refined-concept-rules.md) | Shell behaviour; the record header toolbar rules R116 to R125 (the brief's Addendum A1, which was not attached to the session) |
| [Readable reference namespaces](readable-reference-namespaces.md), [PPO-STD-001](../standards/naming-conventions.md) | Reference form (the brief's Addendum A2, which was not attached to the session) |
| [Sales](sales-module-refined-ui-proposal.md), [Estimating](estimating-module-refined-ui-proposal.md) and [Projects](projects-module-refined-ui-proposal.md) module records | The record structure mirrored here; the sibling stories as amended by Addendum A3 |
| [HTML module conformance](../standards/html-module-conformance.md), [design-to-build standard](../standards/design-to-build-standard.md), [ADR-0067](ADR-0067-design-to-build-operating-model.md), [Figma named version build handoff](figma-named-version-build-handoff.md), [ADR-0050](ADR-0050-font-awesome-light-icons.md), [ADR-0053](ADR-0053-figma-page-design.md) | Declaration fields, tiers, named versions, icons, no Figma links in the repository |
| `src/shell/navigation.ts`, `src/platform/permissions.ts` | Finance rail destinations and the capabilities that exist in code |

The file's link and key are not recorded in this public repository (ADR-0050, ADR-0053). Node IDs are recorded so each sheet can be opened from the file.

## 2. Conformance declaration

| Field | Declaration |
|---|---|
| Scope identity | The Finance workspace: scope:FN-01 Finance handoffs (`/finance/handoffs`, `[id]`, `new`), scope:FN-02 Customer accounts (`/finance/accounts`, `/customers/[id]/account`), Finance exceptions (FN-01 · FN-02), scope:FN-04 Claims & obligations, scope:FN-03 Project financial performance, scope:FN-05 Cash outlook, scope:FN-06 Measure definitions and Reconciliation (two rail items over one scope), the Finance extract of scope:RP-05 Supply & Finance trust, and Finance settings. Parents FIN-01 to FIN-08 as section 15 of BP-01 maps them. No parent requirement ID is added or renamed; all 78 remain |
| Page types (r20) | Register / worklist (registers and worklists); Record detail (handoff, account, exception, claim, project, measure records); Review / comparison (approved against posted, version compare, Base against scenario, claim against certification, monthly reconciliation); Overview / dashboard (Cash outlook overview, Insights, Finance Pulse); Work queue + persistent detail (week detail); Form / guided workflow (create form, right-side panels, centred dialogs); states. Section 3 gives the type per sheet |
| Reused components | Local copies, same names as the accepted files so instances can be swapped to the published library later: Shell / Top bar, Shell / Rail · collapsed, Shell / Right rail · collapsed, Shell / Workspace menu · collapsed strip, Shell / Record header · toolbar and its phone component, Shell / Top bar · 1024, Phone / Header, Phone / Status bar, a Finance phone tab bar; the docked Finance menu drawn per sheet as the Shell draws it; 101 icon components; the "PPO colour" collection (66 variables); the kit under its Sales names (Status chip, Button, Avatar, Checkbox, Filter chip, Tab, KPI tile) |
| Source authority | Dean's brief of 10 November 2026 and Addendum A3; the accepted decisions in section 1; the fixture is synthetic: as at Thursday 5 November 2026, 09:00 AEDT, signed in as Finance lead Avery Lin, MYOB read Thursday 5 November 06:00 Complete for Powerplants AU. Proposed compositions and prototype rules are labelled proposed; D-017 stays open |
| Incoming handover | See the per-scope table below. Arriving on a page creates no business record; opening a form neither saves nor posts |
| Outgoing handover | See the per-scope table below. The only outbound events are finished events sent once from their own pages with a unique key and a visible send state; nothing drawn posts, pays, resends or edits a MYOB document or sends a customer message |
| Exceptions and recovery | Drawn: loading (no figures), true-empty (counts, never amounts), filtered-empty, could not load, denied or not found, no Finance access, stale, partial source (MYOB read Partial or Failed), outcome unknown with lookup only, read only, bulk partial failure, permission changed while open, returned, refused approvals and publishes, not mapped |
| Departures | Section 5 |
| Verification | Section 6 |

Per scope: what Finance receives (read only unless stated), what it sends, and where authority stays.

| Scope | Receives | Sends | Authority |
|---|---|---|---|
| FN-01 Finance handoffs | Approved report entries and reviewed hours without rates (SV-06, FI-01); the agreement charge basis (MA-02); warranty and goodwill decisions (MA-06); approved claims as `ProjectClaim` (FN-04) | Rates, dispositions, approval, one finished event to MYOB through AD-04, the observed outcome and the reconciliation | FN-01 owns the handoff and its reconciliation; Service owns the work; MYOB owns the posting. Recorded, approved, billable and posted are four quantities; prepare, review, process and reconcile are four duties (BR-16, ADR-0016) |
| FN-02 Customer accounts | Balances, documents, applications, terms, credit limit and credit hold read from MYOB with company, currency, read time and completeness; a customer's invoice query (CP-02) | Payment-application proposals, disputes, statements and reminders as hand-overs to Customer messages (EC-04); the account summary in words for account managers and the customer portal (CP-06) | FN-02 reads the account and owns disputes and proposals; EC-04 owns sending; AD-05 owns mapping; MYOB owns the balance |
| Finance exceptions | Differences, unknown outcomes, credit-hold reviews, unapplied payments, failed or refused sends | Evidence, verification, the Finance review (Cleared or Hold), corrections through new handoffs | Owners keep the records; the reconciler is never the evidence supplier; amounts keep their source basis and are never totalled |
| FN-04 Claims & obligations | The claims schedule, approved variations and obligations (PJ-05); acceptance and conditions (PJ-09); evidence (EN-08, SC-06) | The prepared claim, the approved claim as a `ProjectClaim` handoff, the certification record | FN-04 owns the claim; PJ-05 owns the schedule and variations; PJ-09 owns acceptance; the approver is never the preparer |
| FN-03 Project financial performance | Control values (PJ-05), cost by category from MYOB through the FN-06 map, monthly reviews submitted by the coordinator | Reviews accepted or returned; margin and over/under billed to Finance readers | FN-03 owns the review; MYOB owns cost; this page sends nothing |
| FN-05 Cash outlook | MYOB receipts and payments; open invoices, scheduled claims, approved handoffs, open orders and supplier promises (FN-01, FN-02, FN-04, SC-02) | Scenarios, assumptions, gap resolutions, expected-date confirmations requested from line owners | FN-05 owns the outlook and scenarios; every line's source owns its date; the net is never a bank balance |
| FN-06 Measure definitions and Reconciliation | MYOB accounts, cost codes and ledger balances (read only); mappings (AD-05) | Published measure versions; the monthly reconciliation, its differences and the month close | FN-06 owns what a measure means and its reconciliation; AD-05 reconciles records sent against records posted; the proposer never approves |
| RP-05 extract · Insights | Adopted definitions, the send ledger, supplier claims and credits | KPI-10, KPI-12, KPI-13 (withheld), KPI-14 and REP-09 to REP-11 with their rules; the proposed Finance Pulse | Reporting owns the report pages; expected credits are "not cash" |
| Finance settings | The rate card version (ES-03, read only), reference families, templates (DK-06) | Policy versions: proposed, reviewed by a second person, published with the impact stated | Finance proposes; a second person reviews; nothing is confirmed by Finance yet (FD-03, D-017) |

Every scope states: MYOB is the book of record and PPO the review layer (EI-1 to EI-10); every amount states its basis and a missing value is never zero (BR-20, BR-21, SR-15); outbound events are finished events sent once with a visible state and an unknown outcome is looked up (EI-3, EI-5, BR-19).

## 3. Sheet inventory

Codes are the brief's area prefixes. Node IDs are in the file "PPO - Finance module (proposal)". Types are r20 page types.

<!-- INVENTORY:START -->
### Finance handoffs · FN-01

| code | sheet name | section | node id | r20 page type |
|---|---|---|---|---|
| HO01 | Finance handoffs — register, Needs me | Desktop 1440 | 14:12 | Register/worklist |
| HO16 | Finance handoffs — register, All open by customer, menu collapsed to the strip | Desktop 1440 | 14:696 | Register/worklist |
| HO02 | Handoff record SYN-FH-000044 — Review tab, Ready for review | Desktop 1440 | 18:831 | Record detail |
| HO06 | Handoff record SYN-FH-000044 — Outcome tab, Reconciled · Matched | Desktop 1440 | 22:828 | Record detail |
| HO07 | Handoff record SYN-FH-000045 — returned v1, new draft v2 | Desktop 1440 | 22:1293 | Record detail |
| HO08 | Handoff record SYN-FH-000044 — Sources tab, exact versions and allocation holds | Desktop 1440 | 22:1745 | Record detail |
| HO09 | Handoff record SYN-FH-000043 — project-linked, No posting required | Desktop 1440 | 24:1540 | Record detail |
| HO12 | Handoff record SYN-FH-000039 — Outcome unknown, look up in MYOB only | Desktop 1440 | 24:1960 | Record detail |
| HO13 | Handoff record SYN-FH-000040 — Reconciliation required | Desktop 1440 | 24:2393 | Record detail |
| HO03 | Set a disposition — panel | Dialogs and panels | 26:2240 | Form (panel) |
| HO04 | Approve handoff — dialog | Dialogs and panels | 26:2789 | Dialog |
| HO05 | Awaiting MYOB — Record processing outcome panel (Priya Raman) | Dialogs and panels | 26:3315 | Form (panel) |
| HO10 | Prepare handoff — AgreementCharge panel (Priya Raman) | Dialogs and panels | 28:2958 | Form (panel) |
| HO11 | New Finance handoff — shared create form (Priya Raman) | Dialogs and panels | 28:3537 | Form |
| HO15 | Issue supporting evidence — dialog | Dialogs and panels | 28:3879 | Dialog |
| X01 | Return handoff — dialog | Dialogs and panels | 29:8907 | Dialog |
| X02 | Look up in MYOB — dialog | Dialogs and panels | 29:9396 | Dialog |
| X03 | Record reconciliation — panel (Matched, No posting required) | Dialogs and panels | 29:9837 | Form (panel) |
| X04 | Request correction — panel | Dialogs and panels | 29:10302 | Form (panel) |
| X05 | Cancel handoff — refused | Dialogs and panels | 29:10763 | Dialog (state) |
| X06 | Filters — panel | Dialogs and panels | 30:5089 | Panel |
| X07 | Columns — panel | Dialogs and panels | 30:5700 | Panel |
| X08 | Export register — dialog | Dialogs and panels | 30:6415 | Dialog |
| X09 | Inline edit — change reason | Dialogs and panels | 30:6992 | Dialog |
| HO14 | Handoff record SYN-FH-000048 — Goodwill review lines cannot be approved | States | 32:5913 | Record detail (state) |
| PS01 | Loading permitted evidence, no figures | States | 32:6326 | State |
| PS02 | True-empty, counts 0 | States | 32:6726 | State |
| PS03 | Filtered-empty, filters restated | States | 32:7103 | State |
| PS04 | Could not load | States | 32:7472 | State |
| PS05 | Denied or not found | States | 32:7829 | State |
| PS06 | No Finance access (Robin Hale) | States | 32:8102 | State |
| PS07 | Partial source, MYOB read Failed at 06:00 | States | 33:10178 | State |
| PS08 | Stale, newer version saved by someone else | States | 33:11230 | State |
| PS09 | Bulk action partial failure | States | 33:10715 | State |
| PS10 | Permission changed while open | States | 33:11699 | State |
| PS11 | Read only, viewer Lee Nakamura, restricted context withheld | States | 33:12163 | State |
| TB-HO01 | Register, Needs me, tablet 1024 | Tablet 1024 | 33:22442 | Register/worklist |
| TB-HO02 | Handoff record, tablet 1024 | Tablet 1024 | 33:22838 | Record detail |
| PH-HO01 | List, Needs me, phone 390 | Phone 390 and 320 | 33:23252 | Register/worklist |
| PH-HO01-320 | List, Needs me, phone 320 | Phone 390 and 320 | 33:23368 | Register/worklist |
| PH-HO04 | Approve handoff — bottom sheet | Phone 390 and 320 | 33:23470 | Form |
| PH-HO02 | Handoff record, review on the phone (full length) | Phone 390 and 320 | 33:23542 | Record detail |
| NOTES | Finance handoffs · flows and notes card | Flows and notes | (card in section 14:7) | Notes |

43 rows.

### Customer accounts · FN-02

In progress: inventory not yet recorded.

### Finance exceptions · FN-01 · FN-02

In progress: inventory not yet recorded.

### Claims and obligations · FN-04

In progress: inventory not yet recorded.

### Project financial performance · FN-03

In progress: inventory not yet recorded.

### Cash outlook · FN-05

In progress: inventory not yet recorded.

### Measure definitions and reconciliation · FN-06

In progress: inventory not yet recorded.

### Insights · RP-05

In progress: inventory not yet recorded.

### Interaction states · FN

In progress: inventory not yet recorded.

### Administration · FN

In progress: inventory not yet recorded.

Total recorded: 43 rows.
<!-- INVENTORY:END -->

## 4. Rules applied

- **Shell and layout (brief 6.1, D9).** 48 px top bar with global search, 80 px collapsed rail, 48 px right strip, content x 80 to 1392; the 280 px docked Finance menu with page views nested under the current page (R108) or the accepted collapsed strip; right-side panels 432 px at x 960 without a scrim; dialogs 520 to 720 px with a navy scrim at 32 %; page header with breadcrumb from "Finance ›", one-row title with count chip and actions, one-clause sub-line and "About this page"; a company filter and the MYOB read line wherever MYOB figures show.
- **Record header toolbar (R116 to R125).** Every record opens with the accepted record header as an instance of the copied component: breadcrumb, title with state chip and favourite star, sub-line, navigate-in-view, Actions, Outputs and one state-driven primary; a person who cannot act sees the primary disabled with the reason naming who can; a state with no action reads "Read only" with its reason. The scope's checks bar and a signals strip in words sit below it.
- **Content (brief 6.2, D2 to D5).** One line per register cell with sideways scrolling; no second search box in the content area; amounts as `A$12,345.67`, right-aligned, with the basis on every total and in amount column headers; words (Not complete, Not calculated, Not reviewed, Not applicable, Unknown, Unavailable, Not yet approved, Not sent) where a figure cannot be stated; send states in five words (Prepared, Sent, Posted, Unknown, Refused); one tone per chip meaning; dates as "Thu 5 Nov 2026"; the three cash bases as a word, a pattern and a tag.
- **Authority (D2, D3).** No Post, Pay, Resend, Mark paid or Edit invoice control on any sheet; "Look up in MYOB" is the only action on an unknown outcome; corrections run through new handoffs; the reviewer is never the preparer, the reconciler never the evidence supplier, the claim approver never the preparer, the measure approver never the proposer; Warranty review and Goodwill review lines are never approvable.
- **Register standard and interaction states (brief 6.3, 6.6).** Column reorder, resize, inline edit with a change reason for governed fields, never-editable MYOB cells, address lookup, focus rings, keyboard order and a contrast table computed from the colour variables are specified on the Interaction states page.
- **Page template (brief 6.7, D11).** One page per scope area; six sections per page (Desktop 1440, Dialogs and panels, States, Tablet 1024, Phone 390 and 320, Flows and notes) stacked in one column with 360 px gaps; every sheet has a one-line label above it reading `CODE · Page — state (scope ID) [source]`.
- **Phone (D12).** The code's default bar: My Work, Finance handoffs, Customer accounts, More. Phones review, approve, confirm and read; they never propose, publish, process or reconcile.

## 5. Assumptions and proposed departures

Each scope page's "Flows and notes" card carries its own numbered assumptions (A-HO, A-CA, A-EX, A-CL, A-PP, A-CO, A-MD, A-IS, A-ST, A-AD). The file-wide ones:

| # | Assumption or departure | Why |
|---|---|---|
| A1 | The file is named "PPO - Finance module (proposal)"; the design-to-build standard names the domain file "PPO - Finance & Commercial" | The file name is Dean's; both are recorded, nothing is changed |
| A2 | Page titles are the accepted Shell's rail labels (Finance handoffs, Customer accounts, Exceptions, Claims & obligations, Project financial performance, Cash outlook, Reconciliation, Measure definitions, Supply & Finance trust); the code's "Project performance" reads "Project financial performance", and FN-06 is two rail items over one scope | D1; the FN-06 proposal's single "Measures & reconciliation" label is an earlier fixture. A departure for the design register to pick up in its own change |
| A3 | **The collapsed docked menu is the accepted 12 px strip with 1300 px of content**, not "80 px with 1232 px of content" as the brief states | The accepted Shell sheet K places the strip at x 80 to 92 and the content at x 92 to 1392; 80 px is the width of the component set's frame. The Shell is the source of truth |
| A4 | The shell chrome, kit and icons are rebuilt as local components from the accepted files' serialised measurements, tokens and default texts, under the same names; icons are regenerated from the same Lucide glyphs (stand-ins for Font Awesome Light, ADR-0050), with element counts checked against the Sales copies; the logo mark is a 32 px raster | The accepted files are not a published library, so components cannot be imported by key; a later swap to the published library is by name. The rail copy shows Finance as the current workspace |
| A5 | References use the readable namespaces: `SYN-FH-`, `SYN-EXC-`, `SYN-DIF-`, `SYN-DSP-`, `SYN-PAP-`, `SYN-CLM-` (progress claims), `SYN-SCN-`, and MYOB documents as read back `SYN-INV-`, `SYN-CRN-`, `SYN-PMT-`, `SYN-BIL-`, customer keys `SYN-C-`; supplier claims are `SYN-SCL-` | D6, Q4, Q6. EXC, DIF, DSP, PAP, CLM, SCN, INV, CRN, PMT, BIL and C are proposed additions to the type catalogue of PPO-STD-001; the exceptions page's `SYN-AR-` numbers and the Shell's `FH-0042` and `CL-0011` Recent rows are earlier fixtures |
| A6 | Side forms are 432 px panels; the Finance proposals drew 480 px | Brief 6.1 and the accepted drawer width (R98) |
| A7 | Send states are the five words Prepared, Sent, Posted, Unknown, Refused, mapped to EI-5's waiting, sent, posted, needs attention and failed | Q5; the same words as the Supply and Service files |
| A8 | Glasshouse 4 belongs to Hillview Growers with the Projects file's basis A$212,600.00 excl. GST and a five-milestone schedule; Block C carries the Projects file's commercial record and three claims with no retention (bank guarantee O-02) | D7, Q3, Q10, Addendum A3. The Design pages' A$248,900.00, eight milestones and "SYN Riverbend Growers" are earlier fixtures; this also settles the Cash outlook record's Q9 to Q11 for this file |
| A9 | Signed in as Avery Lin (Finance lead); Priya Raman prepares and processes; Dean Fiedler is the second approver; capabilities for claims, measures, month close, scenarios, gap resolution and the account summary are drawn as proposed and exist nowhere in code | Q2, Q7; brief 4.2 marks them † |
| A10 | Ageing bands, reminder timing, expected-date rules, goodwill limits and send-state watch thresholds are drawn as settings versions or rules labelled "proposed · Finance to confirm" | Q8, D8; FD-03 and D-017 stay open |
| A11 | The Finance Pulse (day start) and the Finance extract of Supply & Finance trust are drawn on an Insights page; the Pulse is a proposal | N-N1, brief section 7 |
| A12 | The handoff walk-through uses its own clock (SYN-FH-000044: Ready for review 09:52, Approved 10:02, Sent 10:04, Processed by receipt 10:31, Reconciled 10:40); registers on that page are as at 09:55 | The brief's story time is 09:00 while its scenario S-02 runs to 10:40 |
| A13 | Where the brief disagrees with itself, its dataset (section 9) wins: SYN-FH-000048 is the Westgate Flowers repair with Goodwill review lines (scenario S-07 names a Hillview warranty line); the handoff register shows 10 open handoffs as 11 rows because SYN-FH-000045 lists v1 Returned and v2 Draft (the inventory line says "11 open") | Section 9 is stated to be the truth for the file |
| A14 | Tablet sheets show the rail and the 12 px strip without the right rail; a record's details column becomes a tab | The tablet shell beyond the accepted 1024 top bar is derived |
| A15 | Addenda A1 (shared record toolbar) and A2 (reference form) were not attached to the session; their content was taken from rules R116 to R125 with the accepted component, and from the readable reference namespaces decision | The repository holds both decisions |

Stale register notes left untouched, as the brief directs: every Finance route in the design register is "Needs review"; `scope-fn-04.md` notes no exact image or HTML reference; the register has no page-type field; Finance exceptions has no register entry. The design register and page guidance follow in their own change.

## 6. Verification

To be completed when the last batch is drawn. Recorded so far (10 November 2026): the Finance handoffs page (42 sheets) was rendered sheet by sheet and inspected; a structural and position pass found no overlap at any level, a label on every sheet, no wrapped register cell, Roboto as the only font family and nothing loose; the totals shown were recomputed from their lines. Limits: the "PPO - Design" Finance pages were not re-read in this session (the brief's summaries were used, and the Finance handoffs page of that file had timed out three times while the brief was prepared), and no sibling module file other than Sales was opened.

## 7. Not drawn and open questions

Not drawn: MYOB itself; Integrations (AD-04) and Mappings & reconciliation (AD-05); the Service, Projects, Supply, Sales and Estimating pages that hand to Finance; Customer messages (EC-04); the customer portal (CP-06); the Reporting pages RP-05 and RP-06 as report pages; Document library pages; My Work; Reviews & handovers; the workspace flyout menu (the Shell's own surface; the docked menu and the collapsed strip are drawn on the sheets); prototype links; any application code, route, migration, permission or integration.

Open questions carried with the repository's own numbers, none resolved here: D-017 (definitions, signs, effective dates, tolerances); FD-02, FD-03 (ageing bands and the treatment of disputed and on-hold amounts) and FD-04, to be set by Finance; the MYOB adapter under EI-7 and EI-9; FN-02 Q1 to Q6; FN-04 Q1 to Q8 (statutory payment-claim timing is recorded as dates only); FN-06 Q1 to Q6 (including whether the month's closer may own a difference: drawn as yes, the second-person rule applies to publishing); FN-05 R5 and R9 to R12 (the weekly cash bridge is a proposal sheet); the goodwill limit (MA-06 Q2); AT-31 is not claimed.

## 8. Boundary and next steps

Design only. Nothing here authorises a business transaction, production integration, customer communication or migration; no code, route, read model, migration, permission, capability, grant, seed or deployment was created. Next steps: Dean's review of the audit and the assumptions; a named version saved by Dean once he accepts (any later design change needs a new one); the design register and per-route page guidance in their own reviewed change; alignment of the Shell file's Recent-row stand-ins with the reference families; Service and Supply follow-ups where Addendum A3 corrected their stories (supplier claims renumbered to `SYN-SCL-`, the Westgate credit-note request reading Sent · awaiting confirmation).
