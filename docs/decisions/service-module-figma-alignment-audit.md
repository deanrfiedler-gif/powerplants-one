---
document_id: PPO-SERVICE-FIGMA-ALIGNMENT-AUDIT
date: 2026-11-12
owner: Dean Fiedler
status: Audit findings, 2026-11-12; Dean's decisions on Q1 to Q13 recorded 2026-11-13 (all accepted as recommended); no design is changed by this record; decision support only; no application code, route, migration, permission, integration or deployment; every record shown is synthetic
source_commit: 707b21cce42393433b90fbfa84a9aa850834db13
versioning: git
---

# Service module Figma file — alignment audit

**Owner:** Dean Fiedler · **Date:** 12 November 2026, decisions 13 November 2026 · **Status:** audit findings; Dean decided Q1 to Q13 on 13 November 2026 (section 9), and section 10 holds the alignment batch with those decisions applied. This record changes no design, accepts nothing and amends no other record. Corrections it identifies in other records are findings, to be made in their own changes.

On 12 November 2026 Dean asked for the Figma file of the Service module UI to be audited. He sent the file and the PPO - Library file, the cross-file alignment audit prompt and the read-only UI/UX V3 conformance audit of 10 November 2026. The cross-file prompt was applied to the one file asked for: the Service file was read in full and checked against the accepted Shell, the Library, its own record and the other module records. Dean's standing instruction applied: "If you need any decisions from me, just proceed however you believe is the most professional and advanced approach." The audit was therefore read-only in Figma (the prompt's default), and every authority conflict is listed in section 5 for Dean rather than resolved.

Four statements stay separate: what was audited (sections 1, 2 and 6); what is misaligned (sections 3 and 4); what only Dean can decide (section 5); and what this audit did not change (section 8).

## 1. Scope and sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Service module (proposal)" ([PPO-SERVICE-REFINED-FIGMA-PROP](service-module-refined-ui-proposal.md)), as it stood on 12 November 2026; no named version is saved | The file audited: 17 scope pages, 288 sheets, 17 notes cards, the four Read me cards and the Shell and kit page |
| Private Figma file "PPO - Shell (accepted)", named version "Shell refined concept — accepted · record header toolbar" (10 November 2026) | Comparison base: the accepted components section, the collapsed strip, the record header toolbar and the workspace menus page; rules R1 to R125 through [the rules export](../design/development/systems/shell-refined-concept-rules.md) |
| Private Figma file "PPO - Library" (unpublished, no named version) and its records `library-*.md`, including [drawer widths](library-drawer-widths.md) | Controls, Phone and States component inventories and the PPO colour, layout and control variables |
| The module records for Customer portal, My Work, Settings, Reporting, Supply, Engineering, Projects, Finance, Sales, Estimating and Shared records (`docs/decisions/*-refined-ui-proposal.md`) | The cross-file facts and handovers the Service file must agree with |
| Addendum A1 (record header toolbar), A2 (reference form) and A3 (persona and story reconciliation) | **Not supplied to this session and not in the repository.** A1 was read through rules R116 to R125; A2 through [readable reference namespaces](readable-reference-namespaces.md); A3 only through the citations of A3.2, A3.4 to A3.9 and A3.11 in other records. A3.1, A3.3, A3.10, A3.12 and A3.13 are cited nowhere, so facts only they fix were not tested |
| `db/migrations/0112-service-request-statements.sql`, [figma-named-version-build-handoff.md](figma-named-version-build-handoff.md), [design-to-build standard](../standards/design-to-build-standard.md) | Build facts and governance rules |

The files' links and keys are not recorded ([ADR-0050](ADR-0050-font-awesome-light-icons.md), [ADR-0053](ADR-0053-figma-page-design.md)). Node IDs are those the Service record already uses.

## 2. Method

The checks were those of the cross-file prompt's section 4: structure (ST1 to ST5), shell conformance (SH1 to SH7), components and tokens (CT1 to CT5), content conventions (CV1 to CV8), people and facts (FA1 to FA7), handovers and ownership (HO1 to HO3), states and accessibility (RA1 to RA3) and governance (GV1 to GV4). EX1 applies to the Customer portal file only.

- **Extraction.** One read-only script per scope page returned compact results without changing anything: sections, sheet positions and labels, shell instances and their main components, chip words and tones, unbound fills, fonts and sizes, children outside sheet bounds, hidden layers, and text scans (dates, revisions, references, pronouns, earlier fixtures, money, forbidden and US-spelling words). A second pass recorded the size of every non-shell text, the panels, dialogs, scrims and redrawn look-alikes of shell parts. Eleven targeted reads pulled exact text for the facts the other records share. Two sheets were rendered to confirm findings (MJ09 and AD01).
- **Comparison.** The local shell copies were compared item by item with the accepted Shell components, the docked and flyout Service menus with the accepted workspace menus page, and the variables with the Library values. Ten contrast pairs were computed from the file's own variable values.
- **Analysis.** Done locally over the extracted results. The record's sheet inventory was read back: 288 of 288 node IDs resolve, with matching codes and sizes.
- **Calls.** 57 Figma tool calls in all, against a seat limit of 200 a day shared with other sessions. No page timed out and nothing stopped early.

## 3. Results

**43 findings: 1 Blocker, 22 Major, 17 Minor, 3 Polish.** 31 belong to the Service file, 9 need Dean's decision first, 2 belong to the Shell or Library and the repository record, and 1 to the Service and Supply files together. The file is structurally sound. Its page template, grid, inventory, sheet labels in all but 12 cases, shell instances, top bar, right strip tabs, collapsed strip, docked menu nesting, panels, contrast, spelling, money and earlier-fixture hygiene all pass. The misalignments are concentrated in five places:

1. Cross-file facts and handovers that drifted after other files moved on. The portal record of 12 November in particular is later than the Service file.
2. The policy editors, which the Settings file also draws.
3. Words and forms that the shared conventions fix: revisions, pronouns, tones and dates.
4. Accessibility details on the phone and the focus ring.
5. Shell parts redrawn instead of instanced.

**Matrix summary** (74 rows in `alignment-matrix.csv`):

| Result | Rows |
|---|---|
| Pass | 25 |
| Fail | 38 |
| Partial or gap | 3 |
| Question for Dean | 2 |
| Not checked | 4 |
| Not applicable | 2 |

The Fail rows break down as:

| Check family | Fail rows |
|---|---|
| FA1, one row per fact | 8 |
| HO1, one row per pair | 10 |
| Rule checks | 20 |

## 4. Findings

### 4.1 Blocker and Majors

| ID | Sev | Check | Where (sheets, node IDs) | Found → expected | Fix owner |
|---|---|---|---|---|---|
| SVA-001 | Blocker | HO2 | Administration · AD01 `106:941`, AD02, AD04, AD08 | Service draws its own editors: scheduling policy v6 in force and v7 proposed; preparation policy v3 → v4; reference families. The Settings record has the scheduling policy v1 in force, v2 published Thu 5 Nov 09:40 and v3 proposed; the preparation policy is seed only; references are edited in Settings. One file must own each editor | Dean, then the non-owning file |
| SVA-002 | Major | FA2 | Warranty WR01 to WR06a (WR08a, WR08b earlier frames) | "Serial SYN-SN-250314" as the current warranty motor serial, while WO05 records 250314 as transposed and corrected to SYN-SN-250318 (A3.9, SYN-DQF-000047) | Service file |
| SVA-003 | Major | FA1 | My jobs MJ01 to MJ03, MJ11, MJ22a; Schedule PL01, PL02; Field team FT02, FT05 | Casey Ward's morning reads Coastal Herbs with the pack acknowledged; A3.8 (My Work record) reads Woodhaven pump service at 09:30 with the pack to acknowledge | Dean (A3 sections), then Service or My Work |
| SVA-004 | Major | FA1/HO1 | Appointment AP01, AP01t, AP01p, AP03; My jobs MJ03 | "Parts ready", kit issued 08:30 and Ready to dispatch at 11:20, against Supply's parts not ready for SYN-WO-000062. The file also routes a depot kit stop at 11:40 | Dean, then Service by default |
| SVA-005 | Major | FA1 | Service review RV01, RV07 `78:3226`, RV01t, RV01p | SYN-RPT-000039 "Returned to technician" at 09:00, against an issued newer revision (portal, A3.11) and a re-issue recovery at 09:05 (Settings) | Service file |
| SVA-006 | Major | HO1 | Service review RV08 to RV12b, RV10p | The r01 response is recorded in person or by link, with no portal route. The portal has Owen Dunne responding at 10:42, one response per revision | Service file (Dean to confirm) |
| SVA-007 | Major | HO1 | Service review RV05, RV06, RV08 | The release to the portal (Jordan Kim, 09:10 and 09:12, withdrawable) is not drawn. Outgoing goes to EC-04 only | Service file |
| SVA-008 | Major | HO1 | RV22 `83:8132`; AG03b, AG05 | The commissioning handover lacks the screen drive 3 exclusion and the receiver; SYN-CMS-000011 (waiting since Fri 30 Oct) is absent | Service file |
| SVA-009 | Major | HO1 | Work orders WO01 `49:941`, WO12 | Finance's credit hold on SYN-WO-000047 is not shown | Service file |
| SVA-010 | Major | FA1 | Warranty WR09 | "MYOB has not confirmed it" where A3 fixes "Sent · awaiting confirmation" | Service file |
| SVA-011 | Major | FA1/HO2 | Warranty WR01, WR04, WR06a, WR06b | SYN-RTN-000017 is the M-4 motor here and a two-channel unit in Supply; MA-07 and SC-08 both own supplier claims | Dean, then Service or Supply |
| SVA-012 | Major | FA1 | WO01, WO12, TL11, PL12 | Block C on Mon 16 and Tue 17 Nov 08:00 to 16:00, against Projects' commissioning Wed 18 Nov and shutdown window 07:00 to 15:00 | Dean, then Service or Projects |
| SVA-013 | Major | FA7 | AP02, JP14b, RV07, TL12; labels FT05, TL09; Work orders and Inspections notes | Gendered pronouns for synthetic people ("for him", "her reading", "her timer", "Casey Ward sees her appointments") | Service file; this record's source record lines 197 and 279 |
| SVA-014 | Major | CV6 | All pages (e.g. AP01, FT03, MJ17a, RV18, RV21, IN04, MP08, MP10) | 84 single-digit revisions (r1, r2) and 34 "rev N" forms, against A2's r01 | Service file; record A8 |
| SVA-015 | Major | SH3 | AD01 to AD10, AD02b | The right strip is on all 11 settings sheets; R13/Q8 says settings pages omit it | Service file |
| SVA-016 | Major | CT3 | Card headers, dialog and sheet titles, KPI figures | 559 texts at 15 px, 43 at 18 px, 22 at 22 px, 10 at 28 px and 4 phone texts at 10 px, against the accepted scale 11/12/13/14/16/20. The record says "Roboto 11 to 20 px" | Service file; record section 4 |
| SVA-017 | Major | RA3 | MJ06 `27:2403`, MJ08, MJ09 `27:2706`, MJ10, IN08, WO16p; icon buttons SR14p, JP14a, IN03, IC06c | Phone record tabs 38 px high and icon buttons 40 × 40, against the 44 px phone minimum (P8) and the Library's 48 px tab | Service file |
| SVA-018 | Major | RA3 | ST01 and every drawn focus state | "focus is a 2 px green-deep ring inside" (3.57:1), against Shell R85: 2 px text/link with a 2 px offset (7.10:1) | Service file; record section 6 |
| SVA-019 | Major | CT4 | All pages | Ten state words carry two or three tones (Submitted Info 8 / Success 7; Issued Info 11 / Neutral 2; Confirmed, Open, Reviewed, Pending, Waiting, Not saved, Unknown, Review) | Service file |
| SVA-020 | Major | SH1 | RV12a, RV12b and 75 other "Notice" frames; MJ19d | Page-level banners and a toast are redrawn frames. Shell / Banner and Shell / Toast are not copied into Shell and kit | Service file |
| SVA-021 | Major | HO1 | SR01 `52:941`, SR02, SR09 | "Portal" is shown as an ordinary request channel. Migration 0112 has no such channel and the record does not mark it proposed | Service file; record |
| SVA-022 | Major | HO1 | Service requests and Work orders | Projects' Service receiving handover (PJ-09, named receiver, as at Wed 4 Nov) has no receiving side | Service file |
| SVA-023 | Major | FA6 | The rail on 211 sheets (component `16:1097`) | My Work pill "4" for every signed-in person; A3.8 gives Ravi Kumar 8 | Service file |

### 4.2 Minors and Polish, by check

| Check | Findings |
|---|---|
| HO1 | SVA-024: the renewal handover is an Activity in Service and a lead or opportunity in Sales X20 (Dean and Sales) |
| FA4 | SVA-025: every tablet top bar shows "RK" while its desktop twin signs in Jordan Kim or Riley Tran (RV01t, TL02t, IC01t, IN04t) |
| FA5 | SVA-026: MJ13b, MJ18a, MJ18b, IN09d, PS04, PS08, PS10 and RV12a show events after 09:00 with no time in the label |
| CV4 | SVA-027: 183 year-less date-times such as "Wed 4 Nov 16:05"; AG12c "Mon 4 Jan" with no year |
| ST3 | SVA-028: 12 labels omit "Page —" (MJ08 to MJ20b, IN02b, IC06b). SVA-041 (Polish): IN06 off the grid at x 510 |
| CT2 | SVA-029: 30 unbound fills or strokes; every scrim is unbound navy at 32 % |
| CT5 | SVA-030: dialogs at 560, 600, 620, 640, 660 and 680 px, against the Library's 560 and 720 (at Library adoption) |
| CV1 | SVA-031: the ST01 register standard omits density |
| CV7 | SVA-032: the chip "Withheld · needs incident.sensitive" shows a capability key |
| HO3 | SVA-033: the customer-facing RV09 reads "technician Casey Ward" and shows a sha256 hash, against the portal's "Name, service team" |
| FA3 | SVA-034: instrument and certificate tags not in the six-digit form; CMS not catalogued; INS used three ways across files (Dean) |
| GV1 | SVA-035: the link Dean sent reads "PPO - Service module", while the Read me header and record read "(proposal)" (Dean to confirm) |
| SH4 | SVA-036: the docked menu does not mark Time & labour review, Site readiness review or INSIGHTS as proposed; the flyout does |
| SH6 | SVA-037: toolbar state variants used with other meanings (RV15, RV18 to RV22). Already recorded as R1; for the Shell and Library owner |
| FA1 | SVA-038: three titles for SYN-WO-000041 (Service and Supply). SVA-039: KPI-01 weekly here, monthly in Reporting (Dean and Reporting) |
| Record | SVA-040: the Service record says "Sales lead" for Hand to Sales (the file draws an Activity) and PJ-01 for Critical defects (Projects uses PJ-09); it also repeats the type, focus, revision and pronoun errors above |
| ST2, CT1 | SVA-042 (Polish): the Flows and notes sections have 100 px top padding. SVA-043 (Polish): the local phone header component's default text is Sales' "Deals / All open deals · 38" |

### 4.3 Known items from the prompt that touch Service, confirmed or closed

| Prompt item | Result |
|---|---|
| 5 (shared records menu) | Not applicable to Service |
| 6 (recurring checks) | No recurring-checks item appears in the Service file |
| 7 (drawer widths) | Raised as Q7; the Service file follows the Shell's 432 px |
| 8 (Ravi's "Contact Owen Dunne" item at 09:00) | Not drawn in Service and not found in any record |
| 9 ("Portal" request channel) | Confirmed as SVA-021 |
| 13 (gendered pronouns) | Confirmed as SVA-013 |
| 15 (Shell's stale labels) | Confirmed for the Shell owner: the workspace-menus header `101:8554` still reads "Proposal · awaiting Dean's acceptance", and the Service flyout Recent rows still carry "Riverbend pump service", `SYN-SR-000212` and "Priya Nair" |
| Collapsed strip | The prompt's "80 px" is the component set's frame. The accepted strip is 12 px, and the Service copy matches it |

## 5. Authority conflicts and questions for Dean

The recommendations below are as given on 12 November 2026. Dean accepted all of them on 13 November 2026; section 9 records the decisions and what each changes.

| # | Question | Recommendation |
|---|---|---|
| Q1 | Who owns the scheduling, preparation and numbering editors: Settings or Service (SVA-001)? | Settings owns the editors. Service keeps Policy impact and shows the published version read-only |
| Q2 | Casey Ward's morning: A3.8 or the Service dataset (SVA-003)? | A3.8, unless the A3 Service section says otherwise |
| Q3 | Is SYN-WO-000062's kit ready at 08:30 (SVA-004)? | Supply's value, because Supply owns the signal |
| Q4 | What is SYN-RTN-000017, and who owns supplier claims (SVA-011)? | A3's returns list decides. Supply SC-08 owns the claim and MA-07 shows it |
| Q5 | Block C dates and customer name (SVA-012)? | Projects' dates and Shared records' "Northbank Farm" |
| Q6 | The Shell status pill says "Syncing"; the Service brief bans sync words on technician phones. Which applies? | The ban, for technician phones, using the Library's Phone / Status line words. Amend the pill at the Shell's next named version |
| Q7 | Drawers: the Shell's 432 + 48 px, or the Library's 360/480/640/800? | Keep 432 until the Library publishes, then align with the Shell decision |
| Q8 | Avatar initials: 10 px (Sales kit) or 11 px (Library)? | 11 px at Library adoption |
| Q9 | Goodwill limit: proposed (Service) or "Published v1" (Finance)? | Proposed, until Dean accepts it |
| Q10 | KPI-01: weekly extract or monthly definition? | Reporting's definition decides |
| Q11 | Reference families: instrument tags, CMS, INS? | Instrument tags stay asset tags; register CMS; INS for inspections only |
| Q12 | SYN-RPT-000040 response: through the portal at 10:42, or recorded in person? | The portal at 10:42; the in-person route is refused once a response exists |
| Q13 | Renewal handover object: Activity or lead? | Sales X20 |

## 6. Not checked and limits

- **Addendum A3** was not available, so the ledger is reconstructed from citations. A3.1, A3.3, A3.10, A3.12 and A3.13 could not be tested, and the 12 November amendment could not be checked.
- **Not checked in the file:**
  - one-line register cells and the absence of a second search box (CV2), where the file's own audit card reports a pass;
  - register footers and counts (CV3);
  - Block C's AEST labels;
  - the SYN-MEG-002 date;
  - the docked menu's worklist counts against the registers;
  - the Service to Documents and messages pair (no record on `main`) and the My Work items (the My Work file was not read).
- **Read through records only:** the other module files. Their facts were taken from their records, not their Figma pages.
- **Limits of the method:** the text scans test patterns and named facts and do not prove every row value. Two sheets were rendered; the rest were read as text and structure. No prototype, keyboard, screen reader, 200 % zoom or device review was done.

## 7. Next steps

1. Dean answers Q1 to Q13; Q1 first, because it decides whether AD02, AD04 and AD08 stay in the Service file.
2. The Service file's next build session applies "Alignment batch · PPO - Service module (proposal)". The batch is the paste-ready brief sent with this audit, in the order A (decisions), B (Majors), C (Minors), D (Polish). Each item names its node IDs, expected text and proving check.
3. Dean then saves a named version of the Service file. None is saved yet; the record proposes "PPO - Service module (proposal) · 11 November 2026", and after the batch a name such as "· alignment batch 1" would pin the aligned state.
4. Other files fix their own items in their own sessions:
   - Projects: the change-request reference form;
   - Reporting: page names, scope IDs and the October ranges;
   - Shell: the stale header, the flyout Recent rows, "Rev 02" and the status pill wording;
   - Finance: the goodwill chip;
   - Shared records: the technician bar and the serial confirmation.
   The Shell is accepted, so it needs a new named version.
5. The Service record's corrections (SVA-040) and the A2 reference-family proposals go in their own reviewed changes.

## 8. What this audit did not change

No Figma file was edited, moved, renamed, commented on or versioned. No other record, design register entry, code, route, migration, permission, capability, seed or integration was changed. This record and its status fragment are the only repository changes.

## 9. Dean's decisions — 13 November 2026

On 13 November 2026 Dean answered the questions of section 5 with "accept all". Each recommendation is now his decision. The table records what each decision changes and in which file; the alignment batch in section 10 applies the Service file's part. The decisions settle authority between the files. They accept no design, and they do not change any other record: each file makes its own change in its own session.

| # | Decision | What changes, and where | Findings |
|---|---|---|---|
| Q1 | Settings owns the scheduling-policy, preparation-policy and record-reference editors. Service keeps Policy impact (PL-04) and shows the published versions read-only | **Service:** AD02, AD04 and AD08 become read-only views of what Settings publishes, with "Edit in Settings"; the Service v3/v4 and v6/v7 histories and their publish flow go. **Settings:** it draws a preparation-policy editor, since it shows that policy today as "Seed only · no editor". AD03 and AD05 to AD10 stay in Service, because the Settings record says every module publishes its own policy families | SVA-001 |
| Q2 | A3.8 governs Casey Ward's morning: the Woodhaven pump service at 09:30 and the Hillview pack still to acknowledge at 09:00 | **Service:** redraws the morning and makes the acknowledgement a labelled later frame; the pack becomes a held criterion of the dispatch gate. To revisit only if the A3 Service section, once supplied, deliberately says otherwise | SVA-003 |
| Q3 | Supply's parts-ready signal is the source of truth | **Service:** holds dispatch for SYN-APT-000083 on parts as well as the isolation approval; the 08:30 kit load goes and the 11:40 depot stop stays as the collection | SVA-004 |
| Q4 | Supply (SC-08) owns supplier claims; A3's returns list decides what each return is | **Service:** the Warranty pages show claims read-only. Until the A3 text is supplied, returns are numbered as Supply numbers them, so the M-4 motor return is SYN-RTN-000018. **Supply:** confirms the numbering against A3 | SVA-011 |
| Q5 | Projects' Block C dates and the Shared records customer name apply | **Service:** fits its Block C work inside the shutdown, Mon 16 to Wed 18 Nov, 07:00 to 15:00 AEST, with commissioning on Wed 18 Nov, and renames the customer "Northbank Farm". **Finance:** renames the customer | SVA-012 |
| Q6 | The ban on sync words holds on technician phones, using the Library's phone status words | **Service:** maps its connection words to Out of date, Offline and Reconnecting at Library adoption. **Shell:** changes the status pill's "Syncing" at its next named version | — |
| Q7 | Panels stay 432 px until the Library publishes | **Shell and Library:** decide at publication whether a 480 px drawer covers the strip. No change now | — |
| Q8 | Avatar initials are 11 px at Library adoption | No change now; the 10 px initials are excluded from SVA-016 | SVA-016 |
| Q9 | The goodwill limit stays proposed until Dean accepts it | **Finance:** its chip reads "Proposed", not "Published v1". No Service change | — |
| Q10 | Reporting's definition decides the KPI-01 period | **Service:** shows the period Reporting defines (monthly). A weekly view stays only if Reporting adds a period parameter | SVA-039 |
| Q11 | Instrument and certificate tags are asset tags outside A2. CMS is registered for commissioning handovers. INS means inspections only | **Service:** confirms SYN-FM2-40962 is an external serial. **Engineering:** moves its instrument tag SYN-INS-003 to another family. **Repository:** adds CMS to PPO-STD-001 in its own change | SVA-034 |
| Q12 | Owen Dunne's portal response at 10:42 is the response for SYN-RPT-000040 r01 | **Service:** draws the portal route; the in-person record is refused once a response exists | SVA-006 |
| Q13 | Service hands Sales a renewal brief, and Sales X20 decides between a lead and an opportunity | **Service:** AG10a to AG10c send a renewal brief and create no Activity. **Sales:** confirms X20 takes the brief | SVA-024 |

**File name (SVA-035), resolved 13 November 2026.** Dean confirmed that the file is named "PPO - Service module". Sections 1 to 8 keep the name the file's Read me carried on 12 November ("PPO - Service module (proposal)"). The batch in section 10 renames the Read me header, and the Service record changes its references in its next change.

**Still open.** Addendum A3 (and A1, A2) has not yet been supplied. Q2 and Q4 are applied as decided until it arrives.

**Source of the decisions.** Dean's reply "accept all" in the working session of 13 November 2026, to the list of questions and recommendations in section 5.

## 10. Alignment batch · PPO - Service module, as decided

Paste this into the next build session for the Service file. It comes from the read-only alignment audit of 12 November 2026 (PPO-SERVICE-FIGMA-ALIGNMENT-AUDIT) with Dean's decisions of 13 November 2026 applied (Q1 to Q13, all accepted as recommended). Every person, record, value and date is synthetic. Use names or they/them for people, Australian English, and dates as "Thu 5 Nov 2026". Never record a Figma link or file key in the repository.

**How to work the batch.** Claim the file with an early draft PR (CONTRIBUTING.md, parallel work). Apply the items in the order given: Blocker, then Majors, Minors and Polish. Each item gives the node IDs, the rule, the expected text or property and the check that proves it fixed; run that check after each item and record it in the Service record. Keep the page template, grid and label format. Do not edit other module files: their items are listed at the end for their own sessions. Where a decision depends on the A3 text that is not yet in the repository (Q2, Q4), apply the decision as written and note the dependency.

### Still open (do not block the batch)

- Addendum A3 (and A1, A2) text: requested from Dean; Q2 and Q4 are applied as decided until it arrives.

### Items for this file, in order

#### SVA-001 · Blocker · HO2 · decided Q1
- **Where:** Administration · SV (11:20) · AD01 106:941; AD02; AD04; AD08
- **Rule:** One owner per page; a page drawn by two files must be an instance or a labelled preview (Audit prompt §4.6 HO2, §5.4; Settings record SET:55, SET:85-95, SET:88, SET:91)
- **Expected:** AD02 (preparation policy), AD04 (scheduling policy) and AD08 (reference families) are read-only views of what Settings publishes, with "Edit in Settings" for people who hold the capability; Policy impact (PL-04) stays in Service
- **Found:** Service draws its own editors: AD04 "Scheduling policy · v7" (v6 in force since Mon 2 Nov, v7 proposed, travel buffer 20 → 25 min); AD02 "Preparation policy · v4" (v3 in force); AD08 "Reference families used by Service". The Settings record has the scheduling policy v1 in force, v2 published by Jordan Kim at 09:40, v3 proposed by Taylor Quinn; the preparation policy "Seed only · no editor"; references edited in Settings
- **Do:** Turn AD02, AD04 and AD08 into read-only views: show the in-force version and date exactly as the Settings sheets SH04 to SH14 show them (scheduling policy v1 in force, v2 published Thu 5 Nov 09:40; record references as SH14; preparation policy "Seed only" until Settings draws its editor). Remove the Service propose, review and publish flow for these three families and their v3/v4 and v6/v7 histories, and update AD01 (rows read "Edited in Settings"; recent-changes lines), the Policy impact sheets and every sheet citing "policy P-02". Keep AD03 and AD05 to AD10: Settings says every module publishes its own families
- **Proves it fixed:** AD02, AD04 and AD08 contain no editor or publish command; their versions and dates equal the Settings sheets
- **Owner:** Service file; Settings file adds the preparation-policy editor

#### SVA-002 · Major · FA2
- **Where:** Warranty · MA-06 · MA-07 (11:17) · WR01, WR02, WR03, WR04, WR05, WR06a (and WR08a, WR08b as earlier frames)
- **Rule:** Earlier fixtures that A3 corrects must not appear as current facts (Addendum A3.9 as recorded in shared-records-refined-ui-proposal.md:370 (A15); this file WO05)
- **Expected:** The removed Hillview M-4 motor carries the A3.9 serial; SYN-SN-250314 appears only as the transposed value corrected by SYN-DQF-000047
- **Found:** "Serial SYN-SN-250314 · from SYN-WO-000040 Tue 13 Oct · supplier SYN Drive Systems" as the current warranty motor serial at Thu 5 Nov 09:00, while WO05 in the same file says 250314 was "the transposed" number, corrected to SYN-SN-250318 on Wed 4 Nov 09:14 by Sasha Cole
- **Do:** Replace the serial on the warranty sheets with the serial A3.9 assigns to the removed M-4 motor (SYN-AST-000311) and keep 250314 only on frames dated before Wed 4 Nov 09:14 with "(before correction)"
- **Proves it fixed:** A text search of the file finds SYN-SN-250314 only on WO05 and on frames dated before Wed 4 Nov 09:14

#### SVA-003 · Major · FA1 · decided Q2
- **Where:** My jobs (11:12); Schedule (11:6); Field team (11:8) · MJ01, MJ02, MJ14a, MJ22a, MJ22t, MJ24a; MJ01-MJ03, MJ11; PL01, PL02, FT02, FT05
- **Rule:** One truth for shared people facts (A3.8 My Work queues) (Addendum A3.8 as recorded in my-work-refined-ui-proposal.md:278)
- **Expected:** Casey Ward at Thu 5 Nov 09:00: Woodhaven pump service at 09:30, Hillview 13:00 to 16:00, the Hillview pack still to acknowledge (A3.8)
- **Found:** Service routes Casey through "Coastal Herbs · Rainwater tanks / Rainwater pump service" (SYN-APT-000081) and shows "Pack r02 acknowledged" (acknowledged Wed 4 Nov 12:05 and 12:30)
- **Do:** Redraw her 09:30 visit as the Woodhaven Nursery pump service; move the Coastal Herbs Rainwater pump service (SYN-APT-000081) to another technician or day, or remove it, keeping travel times consistent; show the Hillview pack as "To acknowledge" at 09:00 and draw the acknowledgement as a labelled later frame; add "pack acknowledged" as a held criterion of the dispatch gate until then (AP01, AP03, MJ03). Sheets: PL01, PL02, FT02, FT05, MJ01 to MJ03, MJ11, MJ14a, MJ22a, MJ22t, MJ24a, AP01, AP03. Revisit only if the A3 Service section, once supplied, deliberately says otherwise
- **Proves it fixed:** The My Work file and MJ01/MJ22a name the same 09:30 visit and the same pack state

#### SVA-004 · Major · FA1 / HO1 · decided Q3
- **Where:** Appointment detail (11:7); My jobs (11:12) · AP01, AP01t, AP01p, AP02, AP03, MJ03, MJ11
- **Rule:** Parts readiness comes from the owning module (Supply SC-10) and the same visit reads the same in both files (supply-module-refined-ui-proposal.md:484, :526; this record A17)
- **Expected:** Parts readiness for SYN-APT-000083 as Supply records it: not ready at 09:00; dispatch held on parts and on the isolation approval
- **Found:** Service: "Parts ready", "Kit SYN-KIT-000033 issued to van 1 at 08:30 · from linked demands", dispatch held only for the isolation approval and "Ready to dispatch · checked 11:20"; the same file routes Casey through a depot kit stop at 11:40 (A17)
- **Do:** Remove "Kit SYN-KIT-000033 issued to van 1 at 08:30" and "Parts ready" from the 09:00 frames; hold dispatch on two criteria (parts per Supply; isolation approval); show Ready to dispatch only when both are met, at the time the Supply file gives for its ready signal (if it gives none before 13:00, the visit stays held); keep the 11:40 depot kit stop as the collection after that signal
- **Proves it fixed:** Supply SS sheets and AP01/AP03/MJ03 show the same parts state and time

#### SVA-005 · Major · FA1
- **Where:** Service review (11:10) · RV01, RV01t, RV01p, RV07 78:3226
- **Rule:** One truth for a shared record's revision and state (customer-portal-refined-ui-proposal.md:159 (A3.11, 12 Nov); settings-module-refined-ui-proposal.md:206, :350)
- **Expected:** SYN-RPT-000039 at Thu 5 Nov 09:00 as A3.11 fixes it: issued, with a newer issued revision visible to Owen Reilly (portal); a re-issue recovery at 09:05 (Settings)
- **Found:** Service shows SYN-RPT-000039 "Returned to technician" (returned Thu 29 Oct 11:40 by Riley Tran), "Completed pending review", on the register and record
- **Do:** Redraw RV07 as an earlier frame (Thu 29 Oct) and show the 09:00 register row in its issued state with the current revision
- **Proves it fixed:** RV01 row, the portal report sheet and the Settings recovery row show the same revision and state

#### SVA-006 · Major · HO1 · decided Q12
- **Where:** Service review (11:10) · RV08-RV12b, RV10p; notes card 84:9083
- **Rule:** Sender and receiver show the same route, revision and time for a customer response (customer-portal-refined-ui-proposal.md:71, :164-166, :345)
- **Expected:** Owen Dunne responds to SYN-RPT-000040 r01 through the portal at 10:42; one immutable response per revision; staff see the same response
- **Found:** Service records the r01 response in person or by link (RV09 present, RV10/RV10p record, RV12a "save not confirmed" at 09:12) and lists only "responses by link"; no portal route is drawn
- **Do:** Draw the portal response at 10:42 (Owen Dunne, through the portal) as the response for r01, as a labelled later frame; keep the in-person record (RV09, RV10, RV10p) as an alternative that is refused once a response exists, with the refusal drawn
- **Proves it fixed:** RV08/RV10 and the portal response sheet show one response for r01 with the same time and channel

#### SVA-007 · Major · HO1
- **Where:** Service review (11:10) · RV05, RV06, RV08, notes card 84:9083
- **Rule:** Every handover the receiver shows is drawn on the sending side (customer-portal-refined-ui-proposal.md:71, :266, :274, :277)
- **Expected:** Jordan Kim releases issued reports to the portal audience (09:10 and 09:12) and can withdraw a release
- **Found:** Service hands the issued revision only to Customer messages (EC-04); no Release to portal action, owner or state appears
- **Do:** Add "Release to portal" (owner Jordan Kim) with its state and withdraw action under Outputs on issued reports, consistent with the Outputs "Customer page" entry (R119)
- **Proves it fixed:** RV08 Outputs menu and the portal release sheet name the same report, revision, person and time

#### SVA-008 · Major · HO1
- **Where:** Service review (11:10) · RV22 83:8132; Service agreements AG03b, AG05
- **Rule:** Sending and receiving files show the same handover contents (engineering-module-refined-ui-proposal.md:312, :315)
- **Expected:** SYN-CMS-000012 as released: a staged area that excludes screen drive 3, with its receiver; SYN-CMS-000011 waiting on Service since Fri 30 Oct
- **Found:** RV22 lists Training, Manual, BackupReference and WarrantyMaintenance with no screen drive 3 exclusion and no receiver; SYN-CMS-000011 appears nowhere in the file
- **Do:** Add the exclusion and the named receiver to RV22 and show SYN-CMS-000011 in the handovers waiting list
- **Proves it fixed:** Engineering CM12/CM13 and Service RV22 read the same scope, exclusion and receiver

#### SVA-009 · Major · HO1
- **Where:** Work orders (11:5) · WO01 49:941, WO12
- **Rule:** A Finance hold shows on the operational record in the operational side's words (finance-module-refined-ui-proposal.md:172, :179)
- **Expected:** SYN-WO-000047 (Block C) shows the Finance credit hold
- **Found:** WO01 and WO12 show SYN-WO-000047 with no hold
- **Do:** Add the Finance hold chip and its reason line to the WO-000047 row and record header
- **Proves it fixed:** Finance CA sheets and Service WO12 show the same hold and date

#### SVA-010 · Major · FA1
- **Where:** Warranty (11:17) · WR09, WR06b
- **Rule:** A3 fixes the wording of the Westgate credit-note request; send states are Prepared, Sent, Posted, Unknown, Refused (Addendum A3 as recorded in finance-module-refined-ui-proposal.md:448; settings-module-refined-ui-proposal.md:44, :378)
- **Expected:** "Sent · awaiting confirmation"
- **Found:** WR09: "The credit note request was sent to MYOB on Wed 4 Nov and MYOB has not confirmed it" (record: "MYOB send not confirmed")
- **Do:** Use the chip "Sent · awaiting confirmation" and keep the sentence as its explanation
- **Proves it fixed:** WR09 chip text equals the Finance sheet chip text

#### SVA-011 · Major · FA1 / HO2 · decided Q4
- **Where:** Warranty (11:17) · WR01, WR04, WR06a, WR06b
- **Rule:** One identity per return; one owner for supplier claims (supply-module-refined-ui-proposal.md:64, :272, :273; reporting record :472 (A3))
- **Expected:** Supply SC-08 owns supplier claims; the Warranty pages show them read-only; returns are numbered as Supply numbers them unless A3's returns list says otherwise
- **Found:** Service: "SYN-RTN-000017 · motor M-4", bench result "winding failure"; Supply: RTN-000017 is a two-channel unit SYN-SN-260037 and the M-4 motor return is SYN-RTN-000018; both MA-07 and SC-08 claim supplier claims
- **Do:** Make WR06a and WR06b read-only views of the Supply claims with "Open in Returns and claims"; remove claim editing from MA-07; renumber the M-4 motor return to SYN-RTN-000018 and leave SYN-RTN-000017 to the two-channel unit (SYN-SN-260037), as the Supply record numbers them, pending the A3 text
- **Proves it fixed:** WR04/WR06a cite the same return reference as Supply for the motor, and no Service sheet edits a supplier claim
- **Owner:** Service file; Supply confirms numbering against A3

#### SVA-012 · Major · FA1 · decided Q5
- **Where:** Work orders (11:5); Time and labour review (11:11); Schedule (11:6) · WO01, WO12, TL11, PL12
- **Rule:** One truth for shared dates (projects-module-refined-ui-proposal.md:154, :157, :375; this record A34)
- **Expected:** Block C work inside the customer shutdown Mon 16 to Wed 18 Nov, 07:00 to 15:00 AEST, with commissioning Wed 18 Nov (Projects); the customer is "Northbank Farm" (Shared records)
- **Found:** Service books the Block C multi-day job Mon 16 and Tue 17 Nov 08:00-16:00 "following Engineering" (Engineering gives no dates)
- **Do:** Re-time the Block C visits to fit 07:00 to 15:00 AEST within Mon 16 to Wed 18 Nov and align the commissioning support to Wed 18 Nov (TL11, PL12, WO01, WO12); rename "SYN Northbank Nursery" to "Northbank Farm" on every sheet
- **Proves it fixed:** Projects programme and Service sheets show the same days and hours; the customer name matches Shared records
- **Owner:** Service file; Finance renames the customer

#### SVA-013 · Major · FA7
- **Where:** Appointment detail; Job packs; Service review; Time and labour review; Field team; notes cards · AP02, JP14b, RV07, TL12; labels FT05, TL09; notes cards on Work orders and Inspections
- **Rule:** No gendered pronoun for any synthetic person (Dean's standing instruction 4; audit prompt §4.5 FA7)
- **Expected:** Names or they/them
- **Found:** "you cannot record it for him" (AP02); "her reading" (RV07); "her finish", "her timer", "Only Kim can set when she …" (TL12); JP14b (sentence starting "You returned pack r01 …"); labels "Casey Ward sees her appointments" (FT05) and "her reply waiting to send" (TL09); notes "Ravi cannot: he drafted it"
- **Do:** Rewrite each with the name or they/them
- **Proves it fixed:** A whole-word search for he/she/him/his/her/hers finds nothing on any sheet, label or notes card
- **Owner:** Service file; Repository (record lines 197 and 279 copy the two labels)

#### SVA-014 · Major · CV6
- **Where:** All pages · e.g. AP01, AP02, FT03, JP03, JP04, JP06a, MJ11, MJ17a, MJ17b, MJ18a, IN04, RV11, RV12b, RV18, RV19, RV21, MP08, MP10, SYN-MPL-000031 to 000038
- **Rule:** References in the A2 short form with two-digit revisions (Addendum A2; audit prompt §4.4 CV6)
- **Expected:** r01, r02, r03 …
- **Found:** 84 single-digit revision tokens (r1, r2, r3: "LO-GH4-02 r2", "Hillview induction r2", "Evidence pack r1", "attendance r2", "SYN-MPL-000031 r2") and 34 word forms ("rev 4", "revision 4", "rev 1", labels "rev 3 → rev 4")
- **Do:** Rewrite every revision as rNN; keep "rev" only in quoted earlier text
- **Proves it fixed:** A search for \br\d\b and "rev N" finds nothing
- **Owner:** Service file; Repository (record A8 repeats "induction r2, heights r3 … rev 4")

#### SVA-015 · Major · SH3
- **Where:** Administration · SV (11:20) · AD01 106:941 to AD10, AD02b (11 sheets)
- **Rule:** Settings pages omit the right strip; content runs to the screen edge (Shell rules R13 and Q8 (accepted 8 Nov 2026))
- **Expected:** No right strip on settings sheets
- **Found:** All 11 Administration sheets carry Shell / Right rail · collapsed (confirmed on the AD01 render)
- **Do:** Remove the strip and extend content to x 1440
- **Proves it fixed:** The AD sheets contain no Right rail instance
- **Owner:** Service file (unless the Blocker decision moves these pages to Settings)

#### SVA-016 · Major · CT3
- **Where:** All pages · Card headers (e.g. RV02-RV14, TL02-TL06, MJ22b); dialog and sheet titles (RV06, RV21, TL07a, IC05, MP09, PS10, AD03, FL01, MJ06, MJ08); KPI figures (IS01, PL09, PL12)
- **Rule:** Text sizes from the accepted shell scale (Shell rule C6 (Roboto 11/12/13/14/16/20, accepted); Library text styles add 28 and 40)
- **Expected:** Sizes 11, 12, 13, 14, 16, 20 (28 only once the Library is adopted)
- **Found:** 559 texts at 15 px, 43 at 18 px, 22 at 22 px, 10 at 28 px (timer figures), 4 phone texts at 10 px ("No entry"); the record states "Roboto 11 to 20 px"; the 294 avatar initials at 10 px are excluded (Q8: 11 px at Library adoption)
- **Do:** Map 15 → 14 or 16, 18 → 16 or 20, 22 → 20, keep 28 only for the timer pending the Library, 10 → 11
- **Proves it fixed:** A size histogram of non-shell text shows only scale sizes (avatar initials aside, see Q8)
- **Owner:** Service file; Repository (record section 4)

#### SVA-017 · Major · RA3
- **Where:** My jobs; Inspections; Work orders; Service requests; Job packs; Incidents · MJ06 27:2403, MJ08, MJ09 27:2706, MJ10, IN08, WO16p; close/back buttons SR14p, JP14a, MJ06-MJ10, IN03, IC06c
- **Rule:** Phone targets at least 44 px (48 px options on technician sheets) (Phone header amendment P8 (accepted); Library tab 48 px and Touch 44 px; this record section 4 (48 px options))
- **Expected:** Record tabs and icon buttons at least 44 px high on phones
- **Found:** Record tabs (Work, Capture, Pack, Finish; Readings, Evidence, Retests, Outcome; Details, Scope, Visits, History) 38 px high; close and back buttons 40 × 40 (confirmed on the MJ09 render)
- **Do:** Make phone record tabs 48 px and icon buttons 44 px, or draw their 44 px hit areas
- **Proves it fixed:** No interactive element under 44 px on any phone sheet

#### SVA-018 · Major · RA3
- **Where:** Interaction states (11:19) · ST01; every focus state drawn in the file
- **Rule:** Focus ring: 2 px text/link with a 2 px offset; not green (Shell rule R85 (accepted); Library D1)
- **Expected:** 2 px text/link ring (7.10:1 on white)
- **Found:** ST01: "focus is a 2 px green-deep ring inside" (3.57:1); the record section 6 states the same
- **Do:** Change the focus ring to text/link, 2 px, 2 px offset, on ST01 and every drawn focus state
- **Proves it fixed:** ST01 states text/link and no green ring is drawn
- **Owner:** Service file; Repository (record section 6)

#### SVA-019 · Major · CT4
- **Where:** All pages · see chips.json (word → tone counts)
- **Rule:** One meaning per tone; the same state word has one tone (Library C2 (owner-decided 10-11 Nov); this record P1)
- **Expected:** One tone per word across the file
- **Found:** Submitted Info 8 / Success 7; Issued Info 11 / Neutral 2 ("Issued r01" Neutral 12); Confirmed Success 6 / Neutral 4; Open Warning 7 / Neutral 2; Reviewed Success 4 / Warning 1; Pending Info 3 / Warning 1; Waiting Warning 4 / Neutral 2 / Info 1; Not saved Grey / Warning; Unknown Grey / Neutral; Review Neutral / Info
- **Do:** Fix one tone per word (recommended: Submitted Info, Issued Neutral, Confirmed Success, Open Neutral, Reviewed Success, Pending Info, Waiting Info, Not saved Warning, Unknown Grey) and apply it everywhere
- **Proves it fixed:** chips.json shows one tone per word

#### SVA-020 · Major · SH1
- **Where:** Service review; Interaction states; My jobs; others · RV12a, RV12b and 75 other "Notice ·" frames; MJ19d "Undo toast"
- **Rule:** Shell parts are instances of local copies of the accepted components (Shell components Banner (Tone Info|Warning|Danger|Neutral) and Toast; rules R71 (banner 40 px at the top of the content region; toast 360 px))
- **Expected:** Page-level state banners and toasts as Shell / Banner and Shell / Toast instances
- **Found:** 77 redrawn "Notice" frames (page-level ones 984 × 76 px) and one redrawn 358 × 80 undo toast; neither component is copied into Shell and kit
- **Do:** Copy Shell / Banner and Shell / Toast into Shell and kit, instance them for page-level banners and toasts, and keep in-dialog notices local until the Library publishes
- **Proves it fixed:** Page-level banners are Banner instances, 40 px high

#### SVA-021 · Major · HO1 / build
- **Where:** Service requests (11:4) · SR01 52:941, SR02, SR09; notes card 53:6032
- **Rule:** A design may depart from the build only when its record says so (db/migrations/0112-service-request-statements.sql line 8; customer-portal-refined-ui-proposal.md:358)
- **Expected:** Portal shown as a proposed channel
- **Found:** "Portal" appears as an ordinary channel (channel filter, SR09 "Door interlock trips the potting line · Portal · Ben Carter"); migration 0112 allows Phone, Email, Manual, PlannedMaintenance, Other; the Service record does not mark it proposed
- **Do:** Label the channel "Portal · proposed" on the sheets and record it as a departure
- **Proves it fixed:** The record lists the channel as a proposed departure and the chip says so
- **Owner:** Service file; Repository

#### SVA-022 · Major · HO1
- **Where:** Service requests (11:4); Work orders (11:5) · notes cards 53:6032, 51:7865
- **Rule:** Every handover the sender shows is received (projects-module-refined-ui-proposal.md:62, :286, :293)
- **Expected:** Service receiving (PJ-09): a named receiver works the receiving checklist, requested as at Wed 4 Nov
- **Found:** No PJ-09 incoming is drawn or listed in Service
- **Do:** Draw the receiving item (where it lands, who receives) or record that Projects' receiving is out of scope
- **Proves it fixed:** The Projects receiving sheet and a Service sheet name the same receiver and date

#### SVA-023 · Major · FA6
- **Where:** All desktop and tablet pages · Shell / Rail · collapsed on 211 sheets (local component 16:1097)
- **Rule:** Each person's My Work count equals A3.8's per-person total (Addendum A3.8 as recorded in my-work-refined-ui-proposal.md:343; Shell rule Q22 (worklist counts only))
- **Expected:** Ravi Kumar's My Work pill reads 8 (overdue 2 + due today 6); other personas per A3.8, or no figure where A3.8 records none
- **Found:** The rail pill reads "4" on every sheet for every signed-in person (Ravi Kumar 129 sheets, Jordan Kim 29, Riley Tran 18, Dean Fiedler 4, Lee Nakamura 4 …): the Shell component's stand-in was never set
- **Do:** Override the pill per signed-in person from A3.8 (Ravi Kumar 8); where A3.8 gives no total, confirm the figure with the My Work file first
- **Proves it fixed:** Rail pill equals the My Work file's pill for the same person

#### SVA-024 · Minor · HO1 · decided Q13
- **Where:** Service agreements (11:15) · AG10a-AG10c (renewal review)
- **Rule:** Sender and receiver use the same handover object (sales-module-refined-ui-proposal.md:309 (X20); this record line 389)
- **Expected:** Service hands Sales a renewal brief; Sales X20 decides whether it becomes a lead or an opportunity
- **Found:** Service sends the renewal as a relationship Activity to the deal owner; Sales X20 checks for an open opportunity and otherwise creates a lead
- **Do:** Change AG10a to AG10c so the renewal handover is "Send renewal brief to Sales" and creates no Activity; show the brief's contents and the Sales receipt state
- **Proves it fixed:** AG10a to AG10c and Sales X20 name the same object
- **Owner:** Service file; Sales confirms X20 takes the brief

#### SVA-025 · Minor · FA4
- **Where:** Service review; Time and labour review; Incidents; Inspections · RV01/RV01t, TL02/TL02t, IC01/IC01t, IN04/IN04t
- **Rule:** A sheet and its tablet twin show the same signed-in person (Read me header (signed in as Ravi Kumar unless a sheet names another))
- **Expected:** Same person on desktop and tablet
- **Found:** Every tablet top bar shows "RK" while the desktop twin signs in Jordan Kim or Riley Tran
- **Do:** Set the 1024 top bar initials to match the desktop sheet
- **Proves it fixed:** Desktop and tablet twins show the same initials

#### SVA-026 · Minor · FA5
- **Where:** My jobs; Inspections; Interaction states; Service review · MJ13b, MJ18a, MJ18b, IN09d, PS04, PS08, PS10, RV12a
- **Rule:** Events after 09:00 are labelled later frames (Audit prompt §4.5 FA5; this file's own practice (MJ08, MJ09 labels carry the time))
- **Expected:** The label states the frame time
- **Found:** Times after 09:00 shown (15:56, 10:08, 10:05-10:15, 09:55, 09:14, 09:06, 09:12) with no time in the label
- **Do:** Add the frame time to each label
- **Proves it fixed:** Each listed label carries its time

#### SVA-027 · Minor · CV4
- **Where:** All pages · 183 occurrences
- **Rule:** Dates "Thu 5 Nov 2026" and "Thu 5 Nov 2026, 09:00" where time matters (Audit prompt §4.4 CV4; this record section 4)
- **Expected:** Full form, or a stated rule for the short form inside lists
- **Found:** "Wed 4 Nov 16:05" (no year, no comma) 183 times; "Mon 4 Jan" with no year on AG12c (2027 implied)
- **Do:** Use the full form in sentences and headers; allow the short form only in dense cells under a list-level "as at" with the year
- **Proves it fixed:** No year-less date outside a dated list

#### SVA-028 · Minor · ST3
- **Where:** My jobs; Inspections; Incidents · MJ08, MJ09, MJ10, MJ16, MJ16b, MJ19a-MJ19d, MJ20b, IN02b, IC06b
- **Rule:** Label format CODE · Page — state (scope ID) [source] (Read me page template card 117:66494)
- **Expected:** Page name and an em dash before the state
- **Found:** 12 labels omit "Page —" (e.g. "MJ08 · Add a photo after taking it, 15:01 (FI-01, FI-02) [FI-01 851:725]")
- **Do:** Insert the page name ("Visit —", "Inspection capture —", "Report an incident —")
- **Proves it fixed:** All 288 labels match the format

#### SVA-029 · Minor · CT2
- **Where:** Several · 25 scrims; JP05-JP14a, MJ06-MJ20b, RV03, RV09, WO06, PL05, AP02, TL07a, IN03, IC05, IC06c, MP09, PS10, AD03
- **Rule:** Fills and strokes bound to PPO colour variables (Audit prompt §4.3 CT2)
- **Expected:** All bound
- **Found:** 30 unbound literal fills or strokes outside shell copies (every scrim is an unbound navy at 32 %)
- **Do:** Bind the scrim to brand/navy at 32 % and bind the rest
- **Proves it fixed:** Unbound count 0

#### SVA-030 · Minor · CT5
- **Where:** Dialogs on 11 pages · RV06 640, RV21 680, TL07a 560, IC05 640, MP09 640, PS10 620, AD03 680, WO06 620, PL05 620, AP02 660, JP05 600, JP06a 640, JP06b 600, JP10 620, JP11 640
- **Rule:** Dialog widths from the Library tokens (library-audit A7 and library-controls (dialog/standard 560, dialog/wide 720; owner-decided, Library unpublished))
- **Expected:** 560 or 720
- **Found:** Six widths between 560 and 680
- **Do:** Snap each dialog to 560 or 720 at Library adoption
- **Proves it fixed:** Dialog widths are 560 or 720 only
- **Owner:** Service file (when the Library is adopted)

#### SVA-031 · Minor · CV1
- **Where:** Interaction states (11:19) · ST01
- **Rule:** The app-wide register standard on ST01 includes density (Audit prompt §4.4 CV1)
- **Expected:** Column reorder and resize, density, sorting, inline edit, address lookup
- **Found:** ST01 covers reorder and resize (64 to 640 px), sorting, inline edit and address lookup; density appears only as a setting on AD09
- **Do:** Add the density control and its two modes to ST01
- **Proves it fixed:** ST01 shows density

#### SVA-032 · Minor · CV7
- **Where:** Incidents (11:14) and others · chip "Withheld · needs incident.sensitive"
- **Rule:** Plain words; no capability keys in UI text (Audit prompt §4.4; Library S4 (words with every state))
- **Expected:** e.g. "Withheld · incident reviewers only"
- **Found:** A capability key in a chip
- **Do:** Replace the key with words
- **Proves it fixed:** No dotted capability key in any text

#### SVA-033 · Minor · HO3
- **Where:** Service review (11:10) · RV09 80:3544
- **Rule:** Customer-facing views follow the portal's exposure words (customer-portal-refined-ui-proposal.md:319, :391, :430 (A3.11))
- **Expected:** Staff as "Name, service team"; no internal hash
- **Found:** RV09 (shown to the customer) reads "technician Casey Ward" and "sha256 4e1a…9c07"
- **Do:** Use "Casey Ward, service team" and drop the hash from the customer-facing view (keep it on the staff view)
- **Proves it fixed:** RV09 text passes the portal exposure scan

#### SVA-034 · Minor · FA3 · decided Q11
- **Where:** Several · SYN-TMR-002, SYN-PRS-001, SYN-FLO-001, SYN-CLP-004, SYN-CLP-006, SYN-MEG-002, SYN-CERT-0417, SYN-FM2-40962; SYN-CMS-; SYN-INS-
- **Rule:** References in the A2 short form; one family per kind (Addendum A2; readable-reference-namespaces.md; PPO-STD-001 §10.2)
- **Expected:** Instrument and certificate tags are asset tags outside A2; CMS is registered for commissioning handovers; INS means inspections only
- **Found:** Instrument and certificate tags use 3- or 4-digit numbers (A3 itself uses SYN-MEG-002); CMS is used by Service, Engineering and Shared records but proposed nowhere; INS means inspections here, an instrument tag in Engineering (SYN-INS-003) and is deliberately absent in Shared records
- **Do:** Keep the instrument tags (SYN-CLP-, SYN-MEG-, SYN-PRS-, SYN-FLO-, SYN-TMR-) and SYN-CERT-0417 as they are; confirm SYN-FM2-40962 is an external serial, otherwise write it as SYN-SN-; keep SYN-INS- for inspections. Engineering moves its instrument tag SYN-INS-003 to another family; CMS goes to PPO-STD-001 in its own change
- **Proves it fixed:** No Service change beyond SYN-FM2-40962; the families list in PPO-STD-001 includes CMS
- **Owner:** Service file; Engineering; Repository (PPO-STD-001)

#### SVA-035 · Minor · GV1 · decided name
- **Where:** Read me (0:1) · 117:66487
- **Rule:** File name agrees across Figma, the Read me header and the record (Audit prompt §4.8 GV1)
- **Expected:** One name for the file: "PPO - Service module" (confirmed by Dean, 13 Nov 2026)
- **Found:** The link Dean sent on 12 Nov reads "PPO - Service module"; the Read me header and record say "PPO - Service module (proposal)"
- **Do:** Change the Read me header card 117:66487 and every in-file mention of "PPO - Service module (proposal)" to "PPO - Service module"; the Service record changes its references in its next change, and the named version to propose becomes "PPO - Service module · alignment batch 1"
- **Proves it fixed:** A text search of the file finds the name only as "PPO - Service module"
- **Owner:** Service file; Repository (the Service record, in its next change)

#### SVA-036 · Minor · SH4
- **Where:** All coordinator pages · Shell / Workspace menu · docked · Service operations 18:3530
- **Rule:** Proposed pages carry "proposed" until they have routes (This record P4 (proposed); R110 (menus show only ready pages))
- **Expected:** Time & labour review, Site readiness review and the INSIGHTS group marked proposed in the docked menu
- **Found:** The flyout marks Time & labour review "proposed"; the docked menu does not
- **Do:** Add "proposed" to the docked rows
- **Proves it fixed:** Docked and flyout agree

#### SVA-038 · Minor · FA1
- **Where:** Work orders (11:5) · WO01, WO13, WO14, WO01t, WO15p
- **Rule:** One wording per record across files (supply-module-refined-ui-proposal.md:95; this record A41)
- **Expected:** One title for SYN-WO-000041
- **Found:** Service "EC/pH sensor pair replacement"; Supply "Riverbend EC sensor replacement"; A41 "EC/pH sensor replacement"
- **Do:** Agree one title and use it in both files and the Shell Recent row
- **Proves it fixed:** Titles match
- **Owner:** Service and Supply

#### SVA-039 · Minor · FA1 · decided Q10
- **Where:** Insights (11:18) · IS01, IS03, IS01t
- **Rule:** Reporting owns measure definitions (reporting-module-refined-ui-proposal.md:391; this record A37)
- **Expected:** KPI-01 over the period Reporting's definition sets (monthly in the Reporting record); a weekly view only if Reporting adds a period parameter
- **Found:** Service shows KPI-01 for "this week, Mon 2 to Sun 8 Nov"; Reporting reports it monthly
- **Do:** Show KPI-01 on IS01, IS03 and IS01t for the period Reporting defines (October, as Reporting reports it, or the month to date if the definition allows it); remove "this week" unless Reporting adds a period parameter
- **Proves it fixed:** IS01 and the Reporting RP-04 sheet show KPI-01 for the same period

#### SVA-041 · Polish · ST3
- **Where:** Inspections (11:13) · IN06 55:2362
- **Rule:** Desktop sheets at x 60, 1660, 3260 (Page template card)
- **Expected:** x 60/1660/3260
- **Found:** IN06 at x 510 in Dialogs and panels (after a phone at 60)
- **Do:** Move IN06 to its own row at x 60
- **Proves it fixed:** Grid check clean

#### SVA-042 · Polish · ST2
- **Where:** All 17 scope pages · Flows and notes sections
- **Rule:** Sections fitted with 60 px padding (Page template card)
- **Expected:** 60 px
- **Found:** Notes card sits 100 px below the section top (sheets sit at 100 with labels at 74 elsewhere)
- **Do:** Refit the notes sections
- **Proves it fixed:** Padding 60 (74 with a label)

#### SVA-043 · Polish · CT1
- **Where:** Shell and kit (11:21) · Phone / Header · compact 14:91
- **Rule:** Component defaults carry this file's story (Audit prompt §4.3)
- **Expected:** Service default text
- **Found:** Default text "Deals / All open deals · 38" from Sales
- **Do:** Set a Service default
- **Proves it fixed:** Default text reads a Service page

### Decision-driven changes with no finding of their own

- **Q6, at Library adoption:** map the technician connection words to the Library's Phone / Status line kinds (Out of date, Offline, Reconnecting), keeping the times; no "sync" word anywhere.
- **Q7:** panels stay 432 px until the Library publishes; then align with the Shell's drawer decision.
- **Q8, at Library adoption:** avatar initials 11 px.
- **Q9:** the goodwill limit stays "proposed" on WR08a and AD06; no change.

### Not for this file's session

- **Settings:** draw a preparation-policy editor (today "Seed only · no editor"), since Settings owns it (Q1); keep the scheduling-policy and record-references editors.
- **Supply:** owns supplier claims (Q4); confirm the numbering of SYN-RTN-000017 and 000018 against A3 when it is supplied.
- **Finance:** the goodwill chip reads "Proposed", not "Published v1" (Q9); rename "SYN Northbank Nursery" to "Northbank Farm" (Q5).
- **Sales:** X20 accepts a renewal brief from Service (Q13).
- **Reporting:** keep KPI-01 monthly, or add a period parameter if weekly extracts are wanted (Q10). Also link to "Schedule", not "Service planner"; findings are SV-07 and packs SV-05; SYN-APT-000079 and SYN-RPT-000040 are November; occurrences are SYN-MOC-000118 to 000126; Lakeside is the one Expiring agreement.
- **Engineering:** move the instrument tag SYN-INS-003 to another family (Q11).
- **Projects:** write change requests in the A2 short form (SYN-SCR-000019, not "SCR-nn"); Noah Patel is a "departed recipient" in Projects but approves at 11:20 in Service (to confirm).
- **Shared records:** confirm which motor carries SYN-SN-250318; confirm the technician phone bar against this file.
- **Shell (accepted, so a new named version):** the status pill state "Syncing" (Q6); the Service flyout Recent rows ("Riverbend pump service", SYN-SR-000212, "Priya Nair"); the workspace-menus header 101:8554 still "Proposal"; "Rev 02" on the phone record header; the drawer and strip decision at Library publication (Q7).
- **Library:** a neutral state set for the record header toolbar (SVA-037, recorded R1).
- **Repository:** register CMS in PPO-STD-001 (Q11); correct the Service record (SVA-040) and its ownership statements changed by Q1, Q4 and Q13.

### When the batch is applied

The file is a proposal, so the batch itself needs no named version. Ask Dean to save one once it is applied, for example "PPO - Service module · alignment batch 1", and cite it in the record. Any later change needs a new named version. Update the record's sheet inventory if a node ID changes, and run `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`.
