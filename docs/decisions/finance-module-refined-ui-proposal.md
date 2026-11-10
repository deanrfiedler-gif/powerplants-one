---
document_id: PPO-FINANCE-REFINED-FIGMA-PROP
date: 2026-11-10
owner: Dean Fiedler
status: Proposal drawn, 10 November 2026 (222 sheets on ten scope pages and the Shell and kit page, audited; section 9); design acceptance is Dean's and has not been given; no named version yet; not an implementation baseline; no application code, route, read model, migration, permission, capability, grant, seed, integration or deployment; every record, amount and MYOB figure shown is synthetic
source_commit: ceaa98c4595bc404384bc413307a9bfbe2af22cb
versioning: git
---

# Finance module refined UI pages — proposal

**Owner:** Dean Fiedler · **Date:** 10 November 2026 · **Status:** Proposal drawn and audited, 10 November 2026; not accepted. Sections 1 to 8 are the proposal record and section 9 the audit; later sections will record acceptance, audit follow-ups, drawn batches and named versions as the Sales record does.

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

42 sheets and the Flows and notes card.

### Customer accounts · FN-02

| code | sheet name | section | node id | r20 page type |
|---|---|---|---|---|
| CA01 | Customer accounts — register, All accounts by ageing band, full length | Desktop 1440 | 26:3843 | Register/worklist |
| CA01b | Customer accounts — register, All accounts by owner, right-hand columns on the collapsed strip, full length | Desktop 1440 | 26:4944 | Register/worklist |
| CA02 | Customer account Hillview Growers — Invoices tab, unapplied receipt, full length | Desktop 1440 | 29:1755 | Record detail |
| CA03 | Customer account Hillview Growers — Payments & applications, proposal waiting for MYOB | Desktop 1440 | 32:10169 | Record detail |
| CA04 | Customer account SYN Northbank Nursery — Invoices tab, credit hold from MYOB, Finance review to do | Desktop 1440 | 32:10666 | Record detail |
| CA06 | Customer account Goulburn Orchards — Disputes tab, SYN-DSP-000003 owned | Desktop 1440 | 32:11199 | Record detail |
| CA07 | Customer account SYN Northbank Nursery — Needs Finance review from a credit hold, Cleared recorded, Related work tab | Desktop 1440 | 33:25202 | Record detail (banner) |
| CA13a | Customer account Hillview Growers — Related work tab | Desktop 1440 | 33:25700 | Record detail |
| CA13b | Customer account Hillview Growers — Contacts tab, accounts contacts from People | Desktop 1440 | 33:26280 | Record detail |
| CA05 | Propose payment application — panel on Hillview Growers, Priya Raman, Wed 4 Nov 2026 09:40 | Dialogs and panels | 35:19142 | Form (panel) |
| CA10 | Record dispute — panel on Goulburn Orchards with the dispute-summary suggestion (N-N5) | Dialogs and panels | 35:19641 | Form (panel) |
| CA08 | Prepare statement or reminder — panel on SYN Isolation Nursery with the reminder wording suggestion (N-N10) | Dialogs and panels | 35:20113 | Form (panel) |
| CA15 | Withdraw application — dialog on Hillview Growers, Priya Raman as proposer | Dialogs and panels | 36:17401 | Dialog |
| CA16 | Resolve dispute — panel on Goulburn Orchards, conceded amount becomes a credit note through FN-01 | Dialogs and panels | 36:17905 | Form (panel) |
| CA17 | Approve statement — dialog on Hillview Growers, the account owner approves | Dialogs and panels | 36:18362 | Dialog |
| CA18 | Address lookup — panel on an accounts contact's postal address | Dialogs and panels | 36:18820 | Form (panel) |
| CA09a | State — application proposed, not yet applied in MYOB (S7), Hillview Growers | States | 38:7950 | State |
| CA09b | State — application Differs from the proposal, a later read Fri 6 Nov 2026 06:00 (illustration) | States | 38:8381 | State |
| CA11 | State — SYN Greenhill Berries, Not mapped everywhere, contributes nothing | States | 38:8814 | State |
| CA14a | State — MYOB read out of date (S5), last complete read shown, Hillview Growers | States | 38:9218 | State |
| CA14b | State — no Finance access (S4), Ravi Kumar opens the Northbank account from SYN-WO-000047 | States | 39:15291 | State |
| CA19 | State — loading permitted evidence, no figures shown, register | States | 39:15523 | State |
| CA20 | State — filtered-empty, filters restated, register | States | 39:16192 | State |
| CA21 | State — denied or not found, Jamie Rossi opens another customer's account | States | 39:16538 | State |
| TB-CA01 | Customer accounts — register, All accounts by ageing band, tablet 1024 | Tablet 1024 | 48:9097 | Register/worklist |
| TB-CA02 | Customer account Hillview Growers — Invoices tab, unapplied receipt, full length, tablet 1024 | Tablet 1024 | 50:16043 | Record detail |
| PH-CA01 | Customer accounts — list, All accounts by ageing band, phone 390 | Phone 390 and 320 | 51:15400 | Register/worklist |
| CA12 | Account summary Hillview Growers — Dean Fiedler as Sales, phone 390, full length | Phone 390 and 320 | 51:15550 | Record detail |
| CA12-320 | Account summary Hillview Growers — Dean Fiedler as Sales, phone 320, full length | Phone 390 and 320 | 51:15674 | Record detail |
| NOTES | Customer accounts · flows and notes card | Flows and notes | 56:13284 | Notes |

29 sheets and the Flows and notes card.

### Finance exceptions · FN-01 · FN-02

| code | sheet name | section | node id | r20 page type |
|---|---|---|---|---|
| EX01 | Exceptions — worklist, All open, by type, full length | Desktop 1440 | 29:12160 | Register/worklist |
| EX02 | Exception SYN-EXC-000031 — difference record, line comparison, Requested | Desktop 1440 | 36:10617 | Review/comparison |
| EX03 | Exception SYN-EXC-000031 — evidence supplied, awaiting verification | Desktop 1440 | 36:11085 | Record detail |
| EX04 | Exception SYN-EXC-000031 — verified and resolved, correction through new handoffs | Desktop 1440 | 36:11611 | Record detail |
| EX05 | Exception SYN-EXC-000034 — unknown outcome, lookup found SYN-INV-000442, no retry | Desktop 1440 | 38:13348 | Record detail |
| EX06 | Exception SYN-EXC-000033 — needs Finance review, credit hold on new work order SYN-WO-000047 | Desktop 1440 | 38:13729 | Record detail |
| EX08 | Exceptions — worklist by owner, Avery Lin first, Type replaces Owner | Desktop 1440 | 37:1995 | Register/worklist |
| EX11 | Supply evidence — panel on SYN-EXC-000031, Priya Raman's view | Dialogs and panels | 39:8333 | Form (panel) |
| EX12 | Verify exception — dialog on SYN-EXC-000031, the reconciler is never the supplier | Dialogs and panels | 39:8872 | Dialog |
| EX13 | Record Finance review — panel on SYN-EXC-000033, Cleared or Hold with a reason | Dialogs and panels | 39:9481 | Form (panel) |
| EX14 | Look up in MYOB — dialog on SYN-EXC-000034, same key FH-000039-v1, nothing sent, Priya Raman's view | Dialogs and panels | 50:9236 | Dialog |
| EX15 | Request correction — panel on SYN-EXC-000031, Reversal requested through two new handoffs | Dialogs and panels | 50:9700 | Form (panel) |
| EX07 | Exception SYN-EXC-000033 — Hold recorded and shown on work order SYN-WO-000047, the operational side's words | States | 46:8114 | Record detail (state) |
| EX09a | Exception SYN-EXC-000031 — Verify refused, the verifier is the supplier, Dean Fiedler's view (S6) | States | 46:8536 | State |
| EX09b | Exception SYN-EXC-000031 — stale evidence older than its source, Verify off (S7) | States | 47:7512 | State |
| EX09c | Exception SYN-EXC-000031 — MYOB read out of date, verification paused (S5) | States | 47:8040 | State |
| EX10 | Exceptions — true-empty worklist, counts 0 and never amounts | States | 49:3551 | State (register) |
| TB-EX01 | Exceptions — worklist, All open by type, tablet 1024, full length | Tablet 1024 | 52:4246 | Register/worklist |
| PH-EX01 | Exceptions — summary of open exceptions by type, counts only, phone 390 | Phone 390 and 320 | 55:10659 | Register/worklist (summary) |
| PH-EX02 | Exception SYN-EXC-000031 — difference record on the phone, line comparison, Requested, full length | Phone 390 and 320 | 55:18899 | Record detail |
| NOTES | Finance exceptions · flows and notes card | Flows and notes | 57:12071 | Notes |

20 sheets and the Flows and notes card.

### Claims and obligations · FN-04

| code | sheet name | section | node id | r20 page type |
|---|---|---|---|---|
| CL01 | Claims & obligations — register, All claims | Desktop 1440 | 29:337 | Register/worklist |
| CL02 | Claim record SYN-CLM-000016 — Claim lines, Due · held, full length | Desktop 1440 | 30:11826 | Record detail |
| CL03 | Claim record SYN-CLM-000016 — Evidence, Due · held | Desktop 1440 | 33:13135 | Record detail |
| CL04 | Claim record SYN-CLM-000015 — Customer response and payments, Certified by customer | Desktop 1440 | 33:13582 | Record detail |
| CL06 | Claim record SYN-CLM-000012 — Review, Raised in MYOB | Desktop 1440 | 33:14051 | Record detail |
| CL07 | Claim record SYN-CLM-000013 — Claim lines, Scheduled · due at practical completion | Desktop 1440 | 33:30217 | Record detail |
| CL10 | Claim record SYN-CLM-000014 — Customer response, Disputed, line comparison | Desktop 1440 | 33:30719 | Review/comparison |
| CL12 | Claims & obligations — register, Obligations due, read only | Desktop 1440 | 33:31141 | Register/worklist |
| CL11 | Retention ledger — Glasshouse 4 contract, details collapsed to the strip, full length | Desktop 1440 | 35:7924 | Record detail |
| CL08 | Prepare claim — panel, Priya Raman's view, evidence check names the missing items | Dialogs and panels | 37:4847 | Form (panel) |
| CL09a | Approve claim — dialog, Jamie Rossi's view, Glasshouse 4 claim 3 shown as at Thu 15 Oct 2026 | Dialogs and panels | 38:2741 | Dialog |
| CL09b | Record customer certification — panel, Boiler room claim 3, shown as at Tue 3 Nov 2026 | Dialogs and panels | 37:5331 | Form (panel) |
| X22 | Submit claim for review — dialog, Priya Raman's view, Boiler room claim 4, gate fails | Dialogs and panels | 38:21236 | Dialog |
| X24 | Return claim — dialog, Jamie Rossi's view, Glasshouse 4 claim 3 shown as at Thu 15 Oct 2026 | Dialogs and panels | 38:3232 | Dialog |
| X26 | Record difference — dialog, Boiler room claim 3, shown as at Tue 3 Nov 2026 | Dialogs and panels | 38:21716 | Dialog |
| X27 | Record payment schedule date — dialog, Glasshouse 4 claim 3, dates only | Dialogs and panels | 38:3687 | Dialog |
| CL05 | Condition holds a line — state, Jamie Rossi states the condition holds claim 4, as at Tue 3 Nov 2026 (S5) | States | 39:25341 | State |
| CL13a | Variation approved after the claim was prepared — state, a successor claim line, never an edit (S7) | States | 39:25778 | State |
| CL13b | MYOB send not confirmed — state, Hillcrest claim 1 reads "not confirmed", never resent, as at Fri 30 Oct 2026 (S8) | States | 39:26197 | State |
| TB-CL01 | Claims & obligations — register, All claims by stage, tablet 1024 | Tablet 1024 | 58:9180 | Register/worklist |
| TB-CL02 | Claim record SYN-CLM-000016 — Claim lines, Due · held, full length, tablet 1024 | Tablet 1024 | 59:4872 | Record detail |
| CL14 | Claim summary SYN-CLM-000015 — Jamie Rossi, Ready for review, as at Thu 15 Oct 2026, phone 390, full length | Phone 390 and 320 | 60:5079 | Record detail |
| CL14b | Approve claim — bottom sheet, Jamie Rossi approves with a reason, as at Thu 15 Oct 2026, phone 390 | Phone 390 and 320 | 60:5239 | Form (phone sheet) |
| NOTES | Claims and obligations · flows and notes card | Flows and notes | 62:5131 | Notes |

23 sheets and the Flows and notes card.

### Project financial performance · FN-03

| code | sheet name | section | node id | r20 page type |
|---|---|---|---|---|
| PP01 | Project financial performance — register, Active projects | Desktop 1440 | 30:8213 | Register/worklist |
| PP03a | Glasshouse 4 SYN-PRJ-000024 — Cost tab | Desktop 1440 | 32:12209 | Record detail |
| PP03b | Glasshouse 4 SYN-PRJ-000024 — Revenue & billing tab, details collapsed | Desktop 1440 | 33:16819 | Record detail |
| PP02 | Glasshouse 4 SYN-PRJ-000024 — Overview, October review Submitted (full length) | Desktop 1440 | 33:17307 | Record detail |
| PP04 | Glasshouse 4 SYN-PRJ-000024 — Reviews tab, October review Submitted by Jamie Rossi | Desktop 1440 | 33:31762 | Record detail |
| PP06 | Glasshouse 4 SYN-PRJ-000024 — Differences tab, one needs an owner | Desktop 1440 | 35:1537 | Record detail |
| PP09 | Glasshouse 4 SYN-PRJ-000024 — Reporting basis menu open, Measure definitions link | Desktop 1440 | 37:12124 | Record detail |
| PP10 | Glasshouse 4 SYN-PRJ-000024 — Overview with the details column collapsed to a strip | Desktop 1440 | 37:12664 | Record detail |
| PP11 | Rainwater capture SYN-PRJ-000033 — Overview, periods differ | Desktop 1440 | 37:13139 | Record detail |
| PP05 | Review forecast — dialog, accept or return with a note | Dialogs and panels | 33:32222 | Dialog |
| PP15 | Submit monthly review — panel, October 2026 review, Jamie Rossi as coordinator, as at Mon 2 Nov 2026, 16:38 | Dialogs and panels | 46:13345 | Form (panel) |
| PP06b | Assign an owner — panel on the Differences tab | Dialogs and panels | 35:2005 | Form (panel) |
| PP16 | Explain a difference — panel, Jamie Rossi’s view as owner | Dialogs and panels | 35:2533 | Form (panel) |
| PP07 | Boiler room SYN-PRJ-000036 — MYOB cost Partial, account BRC-07 unmapped (S6) | States | 38:25062 | Record detail (state) |
| PP08a | Water treatment plant SYN-PRJ-000038 — no approved basis, contract values only (S7) | States | 38:25548 | Record detail (state) |
| PP08b | Potting machine SYN-PRJ-000041 — basis Submitted, not approved, contract values only (S7) | States | 38:25947 | Record detail (state) |
| PP12 | Glasshouse 4 screen controls SYN-PRJ-000014 — definitions pending, contract values only (S4) | States | 39:20333 | Record detail (state) |
| PP13 | Glasshouse 4 SYN-PRJ-000024 — viewer Lee Nakamura, margin and restricted context withheld (S-26) | States | 39:20743 | Record detail (state) |
| PP14 | Project record — denied reads as not found, Lee Nakamura (S-26) | States | 39:21220 | State |
| TB-PP01 | Project financial performance — register, Active projects, tablet 1024 | Tablet 1024 | 48:14118 | Register/worklist |
| TB-PP02 | Glasshouse 4 SYN-PRJ-000024 — Overview, October review Submitted, tablet 1024, full length, details below | Tablet 1024 | 50:4802 | Record detail |
| PH-PP01 | Project performance — list, Active projects, phone 390 | Phone 390 and 320 | 51:5021 | Register/worklist |
| PH-PP09 | Reporting basis — bottom sheet on the Glasshouse 4 record, phone 390 | Phone 390 and 320 | 51:5164 | Form (bottom sheet) |
| PH-PP02 | Glasshouse 4 SYN-PRJ-000024 — record, accept or return the October review on the phone, full length | Phone 390 and 320 | 52:17918 | Record detail |
| NOTES | Project financial performance · flows and notes card | Flows and notes | 54:18906 | Notes |

24 sheets and the Flows and notes card.

### Cash outlook · FN-05

| code | sheet name | section | node id | r20 page type |
|---|---|---|---|---|
| CO01 | Overview, Base scenario, 13 weeks, menu collapsed (full length, h 2635) | Desktop 1440 | 29:4272 | Overview/dashboard |
| CO02 | All expected lines, grouped by week (full length) | Desktop 1440 | 33:14997 | Register |
| CO03 | Week detail, W5 · 30 Nov to 6 Dec, weakest week | Desktop 1440 | 33:26742 | Work queue + detail |
| CO04 | By project, nine projects and service | Desktop 1440 | 33:32835 | Register |
| CO05 | Scenario comparison, SYN-SCN-000003 Block C PC slips four weeks | Desktop 1440 | 35:9362 | Review/comparison |
| CO07 | Assumptions and gaps worklist, 6 open | Desktop 1440 | 38:20084 | Register/worklist |
| CO11 | Waiting for me, Avery Lin (moved to 1660,5969) | Desktop 1440 | 38:20680 | Register |
| CO09 | Project outlook, Glasshouse 4 SYN-PRJ-000024 | Desktop 1440 | 51:17356 | Record detail |
| CO10a | Source reads, five sources as at 06:00 (docked menu, Sources view) | Desktop 1440 | 54:12530 | Record detail |
| CO10b | Actuals from MYOB, receipts and payments W−4 to W1 | Desktop 1440 | 55:18120 | Record detail |
| CO06a | New scenario panel, Glasshouse 4 stage 2 slips two weeks | Dialogs and panels | 56:18164 | Form (panel) |
| CO06b | Change an assumption panel, SYN-SCN-000003 with rationale (v2) | Dialogs and panels | 56:18649 | Form (panel) |
| CO08a | Confirm an expected date panel, N-N6 suggestion from six paid invoices (SYN-INV-000452) | Dialogs and panels | 58:12309 | Form (panel) |
| CO14 | Resolve a gap panel, SYN-INV-000356 Northbank missing date | Dialogs and panels | 58:13073 | Form (panel) |
| CO15 | Weekly cash bridge panel, proposed · FN-05 R9 (N-N12) | Dialogs and panels | 59:9123 | Proposal panel |
| CO13-S5 | MYOB out of date, last complete read named | States | 59:9728 | Overview (state) |
| CO13-S6 | Assumption stale, Hillcrest claim 2 unconfirmed for 14 days | States | 59:10147 | Record detail (state) |
| CO13-S7 | Scenario out of date after PJ-02 moved | States | 61:3889 | Review/comparison (state) |
| CO13-S8 | Customer not mapped, SYN Greenhill Berries 30-day assumption | States | 61:4275 | Record detail (state) |
| CO13-S9 | Form validation, a change needs a reason | States | 62:9522 | Form (panel, state) |
| CO13-S10 | Saving a changed expected date | States | 62:10624 | Form (panel, state) |
| CO13-S11 | Save not confirmed, Check receipt and Retry | States | 62:11078 | Form (panel, state) |
| CO13-S12 | Date conflict, first saved wins and the second person chooses | States | 63:5099 | Form (panel, state) |
| CO13-S13 | Project manager's own-project view, Kai Morgan | States | 63:5834 | Register (state) |
| TB-CO01 | Overview, Base scenario, tablet (full length, h 2206) | Tablet 1024 | 64:25747 | Overview/dashboard |
| TB-CO02 | All expected lines grouped by week, tablet | Tablet 1024 | 64:26582 | Register |
| PH-CO12 | Summary of the next four weeks, phone 390 (full length, h 1607) | Phone 390 and 320 | 64:27560 | Overview/dashboard |
| PH-CO12W | Week detail, W3 · 16 to 22 Nov, phone 390 | Phone 390 and 320 | 65:24724 | Work queue + detail |
| PH-CO08 | Confirm an expected date, Kai Morgan, Hillcrest materials on site, Waiting to send (16 px inputs, 48 px sticky actions) | Phone 390 and 320 | 65:24846 | Form |
| PH-CO12-320 | Summary of the next four weeks at 320 | Phone 390 and 320 | 64:27767 | Overview/dashboard |
| PH-CO07 | Assumptions and gaps, 6 open, phone (full length, h 1122) | Phone 390 and 320 | 65:24957 | Register/worklist |
| NOTES | Cash outlook · flows and notes card | Flows and notes | 69:6308 | Notes |

31 sheets and the Flows and notes card.

### Measure definitions and reconciliation · FN-06

| code | sheet name | section | node id | r20 page type |
|---|---|---|---|---|
| MD01 | Measure definitions — register, All measures | Desktop 1440 | 28:4220 | Register/worklist |
| MD02 | Measure FD-05 Actual cost — Definition tab, v1 Published, v2 In review (full length) | Desktop 1440 | 29:11545 | Record detail |
| MD03a | Measure FD-05 Actual cost — Sources tab, MYOB accounts and cost codes read only | Desktop 1440 | 30:10533 | Record detail |
| MD03b | Measure FD-05 Actual cost — Used on tab, the fields that read it | Desktop 1440 | 30:11087 | Record detail |
| MD04 | Measure FD-05 Actual cost — Versions tab, compare v1 Published and v2 In review (full length) | Desktop 1440 | 33:1105 | Review/comparison |
| MD05 | Measure FD-05 Actual cost — v2 Impact preview, nine projects, current (full length) | Desktop 1440 | 33:21492 | Record detail |
| MD07 | Reconciliation — October 2026 monthly reconciliation, one difference owned (full length) | Desktop 1440 | 33:34765 | Review/comparison |
| MD06a | Propose new version — panel, FD-05 v2 drafted by Avery Lin, as at Mon 2 Nov 2026, 14:18 | Dialogs and panels | 35:15983 | Form (panel) |
| MD06b | Approve and publish — panel, FD-05 v2, Dean Fiedler’s view, preview current | Dialogs and panels | 35:16411 | Form (panel) |
| MD08 | Resolve difference — panel, Block C labour SYN-DIF-000019, as at Thu 5 Nov 2026, 09:10 | Dialogs and panels | 36:7724 | Form (panel) |
| MD09 | Close October — dialog, refused while a difference has no owner, as at Thu 5 Nov 2026, 09:05 | Dialogs and panels | 36:8399 | Dialog |
| MD13 | Map account — dialog, BRC-07, a link to Mappings AD-05, nothing is mapped here | Dialogs and panels | 36:9055 | Dialog |
| MD10 | Measure D-01 Earned value — Definition pending, FN-03 shows indicative (S5) | States | 38:17253 | Record detail (state) |
| MD11a | Measure FD-05 Actual cost — account BRC-07 not mapped, totals read Not complete (S7) | States | 38:17648 | Record detail (state) |
| MD11b | Measure FD-05 Actual cost — impact preview out of date, Dean Fiedler’s view, Fri 6 Nov 2026, 08:15 (S8) | States | 38:18108 | Record detail (state) |
| MD06c | Measure FD-05 Actual cost — the proposer’s own Approve refused, Avery Lin (S9) | States | 38:18571 | Record detail (state) |
| MD01-TB | Measure definitions — register, All measures, tablet 1024 | Tablet 1024 | 39:30597 | Register/worklist |
| MD07-TB | Reconciliation — October 2026 monthly reconciliation, tablet 1024, full length | Tablet 1024 | 39:31298 | Review/comparison |
| PH-MD12b | Reconciliation — October 2026 summary, Close for the closer only, phone 390, full length | Phone 390 and 320 | 56:17920 | Review/comparison |
| PH-MD12b-320 | Reconciliation — October 2026 summary, phone 320, full length | Phone 390 and 320 | 56:18042 | Review/comparison |
| PH-MD12a | Measure D-02 Over/under billed — definition, read only, opened from FN-03 “What does this mean?”, phone 390, full length | Phone 390 and 320 | 57:7372 | Record detail |
| NOTES | Measure definitions and reconciliation · flows and notes card | Flows and notes | 58:18272 | Notes |

21 sheets and the Flows and notes card.

### Insights · RP-05

| code | sheet name | section | node id | r20 page type |
|---|---|---|---|---|
| IS01 | Supply & Finance trust — Finance view, October 2026 (full length) | Desktop 1440 | 29:2864 | Overview / dashboard |
| IS02 | Finance Pulse — day start, Focus for today (proposed · N-N1) | Desktop 1440 | 30:13087 | Overview / dashboard |
| IS03 | KPI-12 drill-through — four failed or unresolved items | Desktop 1440 | 30:13708 | Register / worklist |
| TB-IS01 | Supply & Finance trust — Finance view, tablet (full length) | Tablet 1024 | 29:3631 | Overview / dashboard |
| PH-IS02 | Finance Pulse — day start, phone (full length) | Phone 390 and 320 | 30:13505 | Overview / dashboard |
| NOTES | Insights · RP-05 · flows and notes | Flows and notes | 33:2721 | Notes |

5 sheets and the Flows and notes card.

### Interaction states · FN

| code | sheet name | section | node id | r20 page type |
|---|---|---|---|---|
| ST01a | Register row and column header states | Desktop 1440 | 35:13626 | Specification (specimen) |
| ST01b | Inline edit cell states | Desktop 1440 | 35:13962 | Specification (specimen) |
| ST01c | Address lookup states | Desktop 1440 | 36:19329 | Specification (specimen) |
| ST01d | State chips, send states and basis tags | Desktop 1440 | 36:19478 | Specification (specimen) |
| ST01e | Amount cells, ageing bands and checks bar | Desktop 1440 | 36:19823 | Specification (specimen) |
| ST01f | Buttons, selection controls and keyboard order | Desktop 1440 | 38:9841 | Specification (specimen) |
| ST01g | Contrast proof (full length) | Desktop 1440 | 38:10183 | Specification (specimen) |
| NOTES | Interaction states · FN · flows and notes | Flows and notes | 39:10385 | Notes |

7 sheets and the Flows and notes card.

### Administration · FN

| code | sheet name | section | node id | r20 page type |
|---|---|---|---|---|
| AD01 | Finance settings — hub: what can be changed, by whom, at which scope; recent changes | Desktop 1440 | 30:7562 | Overview / dashboard |
| AD02 | Ageing bands and disputed and on-hold amounts — v3 Proposed, Dean Fiedler reviews | Desktop 1440 | 33:18821 | Form / guided workflow |
| AD02b | Ageing bands — v3 Proposed, the proposer cannot review | Desktop 1440 | 33:19274 | Form / guided workflow |
| AD04 | Reminder and statement policy — Published v1 | Desktop 1440 | 33:33453 | Form / guided workflow |
| AD05 | Expected-date rules and cash horizon — Draft v2 | Desktop 1440 | 33:33899 | Form / guided workflow |
| AD06 | Independence rules, goodwill limit and the Finance manager role — Published v1 | Desktop 1440 | 33:34373 | Form / guided workflow |
| AD07 | Claim numbering, retention display, statutory timing dates — Published v1 | Desktop 1440 | 35:12102 | Form / guided workflow |
| AD08 | Rate card version, company and currency, exception types and owners | Desktop 1440 | 35:12536 | Form / guided workflow |
| AD09 | Numbering and templates — reference families and proposed additions | Desktop 1440 | 35:12973 | Record detail (read only) |
| AD10 | Notifications and nudges, saved views, columns, density and record layout | Desktop 1440 | 36:4238 | Form / guided workflow |
| AD03 | Publish version — ageing policy v3, the accounts and lines affected | Dialogs and panels | 33:19726 | Dialog |
| AD11 | Review version — ageing policy v3, Dean Fiedler | Dialogs and panels | 33:20292 | Dialog |
| AD12 | Propose change — panel with the reason | Dialogs and panels | 33:20821 | Form (panel) |
| AD13 | Columns — panel on the settings register | Dialogs and panels | 37:17227 | Panel |
| AD14 | Filters — panel on the settings register | Dialogs and panels | 37:18031 | Panel |
| AD15 | Export register — permitted scope and basis | Dialogs and panels | 37:18544 | Dialog |
| AD16 | Ageing policy — read only for a viewer (Lee Nakamura) | States | 36:4691 | State |
| AD17 | Reminder and statement policy — stale draft | States | 36:5065 | State |
| AD01T | Finance settings — hub on the tablet | Tablet 1024 | 37:19275 | Overview / dashboard |
| NOTES | Administration · flows and notes | Flows and notes | 39:6400 | Notes |

19 sheets and the Flows and notes card.

### Shell and kit · Finance workspace menus

| code | sheet name | section | node id | r20 page type |
|---|---|---|---|---|
| M01 | Workspace flyout · Finance — the accepted Shell flyout open over Finance handoffs, Recent rows in this file’s story | Finance workspace menus (Shell and kit page) | 44:220 | Navigation (flyout) |

The Shell and kit page also holds the local component copies (Shell components, Finance kit, Shell icons, tablet and phone chrome) and the hidden build-time helper text.

Total: 222 sheets (221 on the ten scope pages and M01), plus a Flows and notes card on each scope page. Read me holds the header, page template, sheet index and audit cards.
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
| A14 | Tablet sheets show the rail and the 12 px strip without the right rail; a record's details column becomes a tab or moves below the cards; on the 768 px tablet the rail drops its two dividers and Expand navigation so every item fits without clipping | The tablet shell beyond the accepted 1024 top bar is derived |
| A15 | Addenda A1 (shared record toolbar) and A2 (reference form) were not attached to the session; their content was taken from rules R116 to R125 with the accepted component, and from the readable reference namespaces decision | The repository holds both decisions |
| A16 | The accepted Workspace flyout · Finance is redrawn once (M01, Shell and kit page) with its Recent rows in this file's story: Goulburn Orchards · Hand-off SYN-FH-000044; Hillview Growers · Customer account; Materials on site claim · SYN-CLM-000012; October 2026 reconciliation | Brief 2.2 ("Draw these menus"); the Shell's FH-0042, CL-0011 and "Exceptions · October" rows are stand-ins |
| A17 | Where the brief's own arithmetic does not reproduce, the sheets keep the figure its lines produce: Glasshouse 4 value to date after M4 is A$191,340.00 (the brief's inventory says A$201,340.00; this claim stays A$40,394.00); the scenario cumulative at W11 is +A$269,007.02 (the brief says +A$268,691.02) | Every total reconciles to the cent; both are questions for Dean (section 9.8) |
| A18 | SYN Barossa Nursery is left out of Customer accounts so the dataset's 13 accounts and 12 mapped hold; sheets shown at another time (approval flows as at Thu 15 Oct; EX07 Hold as the alternative to the recorded Cleared) say so in their sub-line | Dataset counts and the duty rules cannot all be shown at 09:00 on Thu 5 Nov |

Stale register notes left untouched, as the brief directs: every Finance route in the design register is "Needs review"; `scope-fn-04.md` notes no exact image or HTML reference; the register has no page-type field; Finance exceptions has no register entry. The design register and page guidance follow in their own change.

## 6. Verification

Done on 10 November 2026, in the Figma file:

- Every sheet was rendered while it was drawn and inspected; key sheets (HO01, HO02, HO13, CO01, CO02, IS01, IS02, AD02, ST01g, M01, the Read me cards) were rendered again after the last fixes.
- Structure and position on every page: six sections in one column with 360 px gaps, no overlap at any level, a label on every sheet, no register or grid cell on a second line, Roboto only, nothing loose; the separator pages and Scratch are empty.
- Truncation: no amount text cut on any sheet; no Flows and notes text cut. Column alignment: header and data cells of every grid and register column share one width.
- Arithmetic: every summed total recomputed from its rows to the cent on every page, no mismatch remaining; non-sum total rows checked by hand. Each page's Flows and notes card lists its numbers that reconcile.
- Authority and duties: no Post, Pay, Mark paid, Resend or Edit invoice control on any sheet; lookup only on an unknown outcome; each duty refusal drawn; "A$0.00" only where a complete read or computed value is truly zero.
- Contrast: 60 text and edge pairs computed from the colour variables (ST01g), 56 pass and 4 fail (section 9.3, R1 to R3).

Repository checks for this change: `python3 scripts/build_status.py --check`, `python3 scripts/check_foundation.py` and `python3 scripts/check_naming.py`.

Limits: the "PPO - Design" Finance pages were not re-read in this session (the brief's summaries were used; that file's Finance handoffs page had timed out three times while the brief was prepared); no sibling module file other than Sales and the Shell was opened, so the Service, Supply, Projects and Estimating facts follow the brief and Addendum A3 rather than those files; the pages were drawn partly by parallel build agents working to one brief and helper library, and their sheets were checked by the same scans.

## 7. Not drawn and open questions

Not drawn: MYOB itself; Integrations (AD-04) and Mappings & reconciliation (AD-05); the Service, Projects, Supply, Sales and Estimating pages that hand to Finance; Customer messages (EC-04); the customer portal (CP-06); the Reporting pages RP-05 and RP-06 as report pages; Document library pages; My Work; Reviews & handovers; tablet and phone variants of most dialogs; prototype links; any application code, route, migration, permission or integration.

Open questions carried with the repository's own numbers, none resolved here: D-017 (definitions, signs, effective dates, tolerances); FD-02, FD-03 (ageing bands and the treatment of disputed and on-hold amounts) and FD-04, to be set by Finance; the MYOB adapter under EI-7 and EI-9; FN-02 Q1 to Q6; FN-04 Q1 to Q8 (statutory payment-claim timing is recorded as dates only); FN-06 Q1 to Q6 (including whether the month's closer may own a difference: drawn as yes, the second-person rule applies to publishing); FN-05 R5 and R9 to R12 (the weekly cash bridge is a proposal sheet); the goodwill limit (MA-06 Q2); AT-31 is not claimed.

## 8. Boundary and next steps

Design only. Nothing here authorises a business transaction, production integration, customer communication or migration; no code, route, read model, migration, permission, capability, grant, seed or deployment was created. Next steps: Dean's review of the audit and the assumptions; a named version saved by Dean once he accepts (any later design change needs a new one); the design register and per-route page guidance in their own reviewed change; alignment of the Shell file's Recent-row stand-ins with the reference families; Service and Supply follow-ups where Addendum A3 corrected their stories (supplier claims renumbered to `SYN-SCL-`, the Westgate credit-note request reading Sent · awaiting confirmation).

## 9. Audit — 10 November 2026

The audit follows section 11.5 of the brief. It was run over the whole file after the last page was drawn: every sheet was rendered at least once while it was drawn and the key sheets again at the end; the scans below ran on every page.

### 9.1 Checks run over the whole file

| Check | Result |
|---|---|
| Structure and position | Every page: six sections stacked in one column with 360 px gaps; no sheet, label or section overlaps at any level; every sheet has its one-line label at y − 26; nothing loose on any page; the separator pages and Scratch are empty |
| Fonts | Roboto is the only font family on every page |
| One-line cells | No register or grid cell text runs to a second line |
| Truncation | No amount text is cut on any sheet; no text in any Flows and notes card is cut (after the corrections in 9.2) |
| Column alignment | Header and data cells of every grid and register column have one width (after the corrections in 9.2) |
| Arithmetic | Every grid total that is a sum was recomputed from its rows to the cent on every page; no mismatch remains. Rows styled as totals that are not sums (a difference, a running balance, a step-by-step derivation) were checked by hand and are correct |
| Authority | No button anywhere reads Post, Pay, Mark paid, Resend, Send again, Retry send or Edit invoice; "Look up in MYOB" is the only action on an unknown outcome; every correction runs through a new handoff. "A$0.00" appears only where a complete read or a computed value is truly zero (for example no approved changes on Glasshouse 4, previous claims on a first claim, a week with no expected lines); missing or stale figures read in words |
| Duties | The reviewer is never the preparer, the reconciler never the evidence supplier, the claim approver never the preparer, the measure and settings approver never the proposer: each refusal is drawn (HO04, PS10, EX09a, MD06c, AD02b) |
| Contrast | 60 text and edge pairs computed from the colour variables on ST01g: 56 pass, 4 fail (R1 to R3 below) |
| Story | References, names, dates and amounts follow section 9 of the brief and Addendum A3; cross-page facts were aligned where they differed (9.2) |

### 9.2 Corrections made during the build and the audit (C)

- C1 HO13: amount cells were cut in the approved-against-posted and correction grids; widened.
- C2 HO12: the main column ran past the 900 px frame; the banner was shortened.
- C3 Phone buttons drew 32 px tall; the helper now keeps the height, and phone buttons are 48 px.
- C4 Phone tab bar: "Customer accounts" was cut at 390 px and overflowed at 320 px; the labels now centre, tighten slightly and fit.
- C5 Tablet rail: at 768 px the rail clipped "More"; on tablet the rail now drops its dividers and Expand navigation so every item fits (A14).
- C6 The lookup time for SYN-FH-000039 differed between X02 (09:24) and the Exceptions page (11:05); aligned to 11:05.
- C7 PP07 dated account BRC-07's first posting Thu 29 Oct against Tue 3 Nov on the Measures sheets; aligned to Tue 3 Nov.
- C8 CA17: a memo amount sat in the amount column above a total it did not add to; moved into the line text.
- C9 Grid columns: 78 header or data cells on Finance handoffs, Customer accounts, Cash outlook and the Read me index hugged their content instead of keeping the column width, so headers did not line up with their data; all set to the column width.
- C10 Flows and notes cards: cut text in the Finance handoffs and Administration cards; widened or wrapped.
- C11 A scrim sweep recoloured a text node on the Customer accounts notes card; restored.
- C12 CO07: two gap owners disagreed with CO11 and the capability matrix (Morgan Lee, Dean Fiedler as Sales); now Avery Lin and Priya Raman.

### 9.3 Refinements (R)

- R1 **Contrast of the record header primary.** White on brand/green-deep (#3d9a37) is 3.57:1, below 4.5:1 for its 14 px Medium label. The button is the accepted Shell component (Addendum A1), so it is not changed here. Proposal for the Shell owner: a darker action green for the primary fill only, such as #33852e (4.63:1) or #2f7d2a (5.14:1); the focus ring would gain too.
- R2 line/control on surface/hover is 2.96:1, just below 3:1 for a control edge on a hovered row: darken line/control to about #7a8698 (3.29:1 on hover, 3.69:1 on white).
- R3 line/strong is 1.30:1 on white as the filter chip and panel edge. The chip's label identifies it, so WCAG 1.4.11 is met, but an inactive filter chip would read better with a line/control edge.
- R4 The rail's My Work count stays 4 (Avery Lin's) on sheets signed in as another persona (Priya Raman, Jamie Rossi, Kai Morgan, Dean Fiedler, Lee Nakamura, Robin Hale). The shell copy has one count; per-persona counts belong in the build.
- R5 On records opened at an Evidence tab (EX03, EX09a to EX09c) the activity card starts at the bottom of the 900 px frame; a full-length variant would show it.
- R6 The stored helper's colour function ignores opacity on a colour variable; scrims are drawn with literal navy at 32 % and that is the only literal fill outside the shell copies and chart ramps.

### 9.4 Gaps (G)

- G1 Tablet and phone variants of most dialogs (the phone approve sheets for a handoff and a claim and the phone date confirmation are drawn).
- G2 Prototype links.
- G3 The "PPO - Design" Finance pages were not re-read in this session; content follows the brief's summaries. A side-by-side check against the accepted FN-03, FN-05, Finance exceptions and RP-05 pages is recommended before build.
- G4 A closed-project view register on FN-03 (the closed project's kept review appears on PP12).
- G5 FN-05 R10 to R12 are noted, not drawn.

### 9.5 New and innovative features (N-N1 to N-N12)

All twelve are drawn; none approves, posts, reconciles, publishes or sends.

| ID | Where |
|---|---|
| N-N1 Finance Pulse | IS02, PH-IS02 (proposed) |
| N-N2 Why this figure | HO02, CO01, PP02, MD07 |
| N-N3 Disposition pre-fill | HO03 |
| N-N4 Send-state watch | HO12, EX05 |
| N-N5 Dispute summary | CA10 |
| N-N6 Payment-date suggestion | CO08a |
| N-N7 Claim evidence check | CL08 |
| N-N8 Review pre-fill | PP04, PP15 |
| N-N9 Impact-preview narrative | MD05 |
| N-N10 Reminder wording | CA08 |
| N-N11 Difference cause suggestion | MD08 |
| N-N12 Weekly cash bridge | CO15 (proposed · FN-05 R9) |

### 9.6 Professional polish (P)

- P1 Roboto's default figures are equal width, so amounts align; no OpenType feature is set in the file.
- P2 The record header breadcrumb carries at most three crumbs (component limit), so deep records show Finance › page › record.
- P3 Where a story sheet is shown at another time (approval flows as at Thu 15 Oct; EX07 Hold as the alternative to Cleared), the sheet says so in its sub-line.

### 9.7 Scenario coverage

| Scenario | Sheets |
|---|---|
| S-01 day start | HO01, IS02 |
| S-02 handoff control loop | HO02 to HO08, PH-HO02, PH-HO04 |
| S-03 project-linked | HO09 |
| S-04 agreement charge returned | HO07, HO10 |
| S-05 outcome unknown | HO12, X02, EX05, EX14 |
| S-06 posted differs | HO13, X03, X04, EX02 to EX04, EX15 |
| S-07 review line blocks approval | HO14 (A13) |
| S-08 payment application | CA03, CA05, CA09a, CA09b, CA15 |
| S-09 dispute | CA06, CA10, CA16 |
| S-10 credit hold review | CA04, CA07, EX06, EX07, EX13 |
| S-11 reminder and statement | CA08, CA17 |
| S-12 not mapped | CA11, CO13-S8 |
| S-13 account manager on the phone | CA12, CA12-320 |
| S-14 claim held | CL02 to CL05 |
| S-15 Block C claims | CL06, CL07 |
| S-16 disputed claim, retention, obligations | CL10, CL11, CL12 |
| S-17 monthly review | PP02 to PP06, PP15, PP16 |
| S-18 incomplete sources | PP07, PP08a, PP08b |
| S-19 cash overview | CO01 to CO04 |
| S-20 scenario | CO05, CO06a, CO06b, CO13-S7 |
| S-21 assumptions and gaps | CO07, CO14, PH-CO07, PH-CO08 |
| S-22 measure version | MD02 to MD06c |
| S-23 October reconciliation | MD07 to MD09 |
| S-24 exceptions worklist | EX01, EX08 |
| S-25 trust extract | IS01, IS03 |
| S-26 viewer | PP13, PP14, PS11 |
| S-27 concurrent date confirmation | CO13-S11, CO13-S12 |
| S-28 MYOB read failed | PS07, CO13-S5, EX09c, CA14a |
| S-29 ageing policy | AD02, AD02b, AD03, AD11 |
| S-30 columns, inline edit, collapsed strip | X07, X09, HO16, CO01 |

### 9.8 Questions for Dean

- Q-A1 R1: raise the darker action green with the Shell owner?
- Q-A2 May a project manager accept or return a monthly review on the phone (drawn: yes, as review)?
- Q-A3 May the closer close the month on the phone (the brief's MD12 asks for it; D12 keeps reconcile work on desktop; drawn for the closer only)?
- Q-A4 Who verifies an exception when both Avery Lin and Dean Fiedler supplied evidence?
- Q-A5 Should a Finance-review Hold carry a review date?
- Q-A6 Glasshouse 4 claim 4: the brief's inventory says value to date A$201,340.00, but M1 to M4 sum to A$191,340.00; the sheets use A$191,340.00 and this claim stays A$40,394.00.
- Q-A7 The brief's scenario cumulative at W11 reads +A$268,691.02; the running sum is +A$269,007.02, which the sheets use.
- Q-A8 SYN Barossa Nursery is left out of the accounts so the dataset's 13 accounts and 12 mapped hold.

### 9.9 Recommended order

1. R1 with the Shell owner (accessibility of an accepted component). 2. Q-A2 and Q-A3 (phone authority). 3. Q-A6 and Q-A7 confirm the two arithmetic corrections. 4. R2 and R3 token changes, through the design-to-build standard. 5. G3 side-by-side check against the accepted Design pages. 6. G1 dialog variants on tablet and phone. 7. R4 and R5 in the build. 8. G2 prototype links if a clickable review is wanted.
