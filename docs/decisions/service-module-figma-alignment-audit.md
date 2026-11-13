---
document_id: PPO-SERVICE-FIGMA-ALIGNMENT-AUDIT
date: 2026-11-12
owner: Dean Fiedler
status: Audit findings, 2026-11-12; no design is changed and nothing is accepted by this record; decision support only; no application code, route, migration, permission, integration or deployment; every record shown is synthetic
source_commit: 707b21cce42393433b90fbfa84a9aa850834db13
versioning: git
---

# Service module Figma file — alignment audit

**Owner:** Dean Fiedler · **Date:** 12 November 2026 · **Status:** audit findings for Dean's decision. This record changes no design, accepts nothing and amends no other record. Corrections it identifies in other records are findings, to be made in their own changes.

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

Recommendations are given; nothing is decided by this record.

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
