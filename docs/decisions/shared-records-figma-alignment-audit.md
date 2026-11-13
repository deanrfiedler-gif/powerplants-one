---
document_id: PPO-SHARED-RECORDS-FIGMA-ALIGNMENT-AUDIT
date: 2026-11-13
owner: Dean Fiedler
status: Audit findings, 2026-11-13; no design is changed and nothing is accepted by this record
source_commit: 707b21cce42393433b90fbfa84a9aa850834db13
versioning: git
---

# Customers, sites and equipment Figma file — alignment audit

**Owner:** Dean Fiedler · **Date:** 13 November 2026 · **Status:** Decision support. This record lists where the private Figma file "PPO - Customers, Sites & Equipment module" does not align with the accepted shell, the shared addenda, the PPO - Library, its own recorded rules and the other module files. It changes no design, accepts nothing and edits no other record. Each correction belongs to the file's next build session, through the alignment batch in section 7.

On 13 November 2026 Dean asked for the Figma file of the Customers, Sites & Equipment module UI to be audited, with the cross-file alignment audit prompt and the UI/UX V3 conformance audit of 10 November as background, and the PPO - Library available for reference. The cross-file prompt's checks were applied to this one file; its standing instruction to proceed on the most professional approach was followed, so its section 9 defaults were taken (read-only in Figma; the file audited as it stands; every finding briefed). Figma links and file keys are not recorded here (ADR-0050, ADR-0053); frames are named by the node IDs the [proposal record](shared-records-refined-ui-proposal.md) already uses.

## 1. Scope and sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Customers, Sites & Equipment module", state of 13 November 2026, no named version (proposal) | Audited: 20 pages, 200 sheets on 15 pages, the four Read me cards and the Shell and kit page |
| Private Figma file "PPO - Shell (accepted)", named version "Shell refined concept — accepted · record header toolbar" (10 November 2026) | Authority: the Components section, the record header toolbar set, the collapsed strip set and the Workspace menus page; [rules R1 to R125](../design/development/systems/shell-refined-concept-rules.md) |
| Private Figma file "PPO - Library" (unpublished), the Play page and its variables | Reference: drawer and dialog widths, the save-outcome pattern; [drawer widths decision](library-drawer-widths.md) (PPO-LIBRARY-DRAWER-WIDTHS-DEC) |
| [Proposal record](shared-records-refined-ui-proposal.md) (PPO-SHARED-RECORDS-REFINED-FIGMA-PROP) and its five status fragments | The file's own rules, inventory, assumptions and audit |
| [Sales](sales-module-refined-ui-proposal.md), [Service](service-module-refined-ui-proposal.md), [Supply](supply-module-refined-ui-proposal.md), [Engineering](engineering-module-refined-ui-proposal.md) and [Settings](settings-module-refined-ui-proposal.md) records; [named-version handoff](figma-named-version-build-handoff.md) | Cross-file facts and handovers; Sales A5 dialog and panel widths |
| Addenda A1 and A2 as the Shell rules and records state them; Addendum A3 as the Service, Settings and Customer portal records cite it and the audit prompt quotes it | A3 itself was not supplied to the session; facts taken from it are marked as cited |

## 2. Method

- **Read-only.** Nineteen scripted reads of the module file (one more was cut off by a dropped connection), two of the Shell file and one of the Library. Nothing in any Figma file was edited, moved, renamed, commented on or versioned.
- **Extraction.** One read per scope page walked every section and sheet: bounds, labels, every visible text with its font family and size, the main component of every instance (with its variant), chip tones, unbound paints, panel and dialog frames, and children outside a sheet. Rule checks ran in the same read: weekday and story-clock tests on every dated text, ISO and undated forms, pronouns, US spellings, forbidden words, earlier fixtures, reference families and revision forms, zones and places, people and their roles.
- **Analysis.** Node IDs were compared with the record's inventory by script; the nine contrast pairs of the file's proof were recomputed from their hex values; cross-file facts were compared with the module records. Visual renders were not taken (see section 6).
- **Checks applied.** ST1 to ST5, SH1 to SH7, CT1 to CT5, CV1 to CV8, FA1 to FA7, HO1 to HO3, RA1 to RA3 and GV1 to GV4 of the cross-file prompt; EX1 is not applicable to this file.

## 3. Results

The file is structurally sound and well governed: every one of the 200 sheets sits in its section, carries one label 26 px above it, is an instance-built page on the accepted shell, binds every colour except the dialog scrim to the PPO colour variables, uses Roboto only, and matches the record's inventory node for node. Text is clean: no wrong weekday, no ISO date outside a file name, no gendered pronoun, no US spelling, no earlier fixture in use, and the forbidden words appear only inside the rules that forbid them. The contrast proof recomputes exactly.

The departures cluster in five places: the proposed Shared records docked menu, the phone and Stakeholders record headers, revision forms, chip tones and panel widths, plus three facts that differ from the Service file or Addendum A3.

| Severity | Count | Findings |
|---|---|---|
| Blocker | 0 | — |
| Major | 10 | AF-001 to AF-010 |
| Minor | 9 | AF-011 to AF-019 |
| Polish | 5 | AF-020 to AF-024 (two for the Shell file) |

Alignment matrix in summary: of the 43 checks, 26 pass, 12 fail, 4 are not applicable and 1 is not checked (FA6, My Work queues). The 12 that fail are SH3, SH4, SH6, SH7, CT3, CT4, CV6, FA1, FA4, FA5, HO1 and RA3; every structure (ST) and governance (GV) check passes. Of the 20 fact and handover rows, 12 pass, 5 fail and 3 are not checked because the Products, Sales and Customer portal files were not opened.

## 4. Findings

### 4.1 Majors

| ID | Check | Where (node IDs) | Rule | Found | Fix owner |
|---|---|---|---|---|---|
| AF-001 | SH4 | Proposed docked menu `16:1719` and every record sheet using it | Shell R34, Q22; the accepted Engineering docked menu shows views without counts | Record totals on view rows (All organisations 58, Prospects 6, Without a current site 4, Inactive 3; Site surveys Reviewed 10); not among the recorded departures | This file |
| AF-002 | SH6 | PH01 `40:4030`, PH02 `57:2754`, PH05 `24:2651`, PH05-320 `24:2797`, PH06-bay4 `63:3354`, PH07 `29:3694`, PH07-320 `29:3844`, PH15 `34:4032`, PH19 `75:2412` | R116, R124; phone record header `170:10215` (copy `10:317`) | No phone sheet uses the phone record header and sticky bar; PH01 and PH15 have no header; the others use the compact page header with page-made buttons | This file |
| AF-003 | SH6 | SK01 `42:8` to SK08 `113:336`, TB04 `48:2053`, TB05 `48:2573` | R116; CS-03 is a tabbed record | An own breadcrumb frame and no record header instance (from the instance inventory; to confirm by render) | This file |
| AF-004 | FA1 | TI01 `75:8`, TI03 `75:1047`, TB17 `140:2`, PH19 `75:2412` | A3 as the Service record cites it: SYN-CLP-004 expired Sat 31 Oct | SYN-FLO-001 is the one expired instrument; SYN-CLP-004 is absent (SYN-MEG-002 and SYN-CLP-006 agree) | Dean, then this file |
| AF-005 | FA1 | PH-MV1 `37:2977`, PH16 `34:4135`, PH20 `34:4243`, MV03 `36:1372` | One time per event; Service MJ10 "motor M-2 replaced … 14:55" | Scanned 15:16, history 15:12, effective 15:20, applied 15:40 | Dean, then both files |
| AF-006 | FA1 | SI06A `23:2237`, OR08 `39:2310`, TB02 `40:3785`, X05 `114:3673` | A3 as quoted: Mallee Fresh in ACDT | Mildura VIC on Melbourne time (the record's filler, A18) | Dean, then this file |
| AF-007 | CV6 | OR01, TB01, SU01 to SU03, DV01, TB10, DV09-review, DV09-refused, EQ01, EQ02, EQ05, BK01 to BK05, BL01, BL02, BL04, MV05B, FA06, FA10, PS11 and notes cards | Addendum A2 two-digit revisions | r1 to r7 throughout, beside r02 and r03 elsewhere in the same file | This file |
| AF-008 | CT4 | ST01-1 `77:8` against the Sites, Organisations, Bulletins and Facilities sheets | One tone per meaning | Booked, Not booked, Open, Closed and Recorded take different tones on different pages; Unknown takes two tones on ST01-1 itself | This file |
| AF-009 | RA3 | ST01-4 `78:933`; proposal record section 6 | R85: focus ring 2 px text/link | The proof gives the focus ring as brand/green-deep at 3.57:1 (not rendered) | This file |
| AF-010 | SH3 | 432 px: six panels; 480 px: fourteen; 520 px: SU07 `68:2496`, AR09 `28:2743`; 400 px: X01 `114:878`, X02 `114:1503` | Shell R45 and Sales A5 against the Library drawer widths | Four widths, two of which match no authority | Dean (Q2), then this file |

### 4.2 Minors and polish, by check

- **SH3 (AF-011):** three dialogs are wider than 720 px (PE06 760, DV07 860, FA06 880).
- **SH7 (AF-012):** the proposal record and the Read me card name the Shell file without its named version (repository record correction, in its own change).
- **FA5 (AF-013):** fifteen sheets show events after the 09:00 story clock, or on Thu 12 Nov, without a later time in their label; four phone sheets show 15:12 to 15:52 events under a 09:00 status bar.
- **FA4 (AF-014):** 21 sheets are signed in as someone other than Sasha Cole without naming the person in the label; the roles themselves agree with the other files.
- **CT3 (AF-015):** 18 px dialog titles and 15 px tile and phone text sit outside the C6 scale; the Shell's own dialog component was not checked.
- **SH4 (AF-016):** the shared-records settings show More as the current rail item while the record places them under Settings.
- **CT5 (AF-017):** no Outcome unknown save state, against the Library's Play pattern (advisory until the Library is adopted).
- **FA3 and FA2 (AF-018, AF-019):** nine type-prefixed instrument tag families, and the seed assets in the legacy `SYN-PPO-AST-` form; both follow the dataset and the build, so they are questions for Dean.
- **Polish (AF-020 to AF-024):** quotation-state variant names used as layouts (Shell owner); eight empty sections without a "Not drawn" note; three phone state sheets on desktop columns; a stale Read me layer name; the Shell's Workspace menus header still reading "Proposal" (Shell owner).

### 4.3 Items closed by this audit

- The brief's "80 px collapsed strip" is the width of the accepted component set's frame; the strip itself is 12 px (R30), as the file draws it.
- `SYN-INC-000009` on SI06 and AR01 to AR03 is the Service field incident, not an operational incident (`SYN-OPI-`).
- No gendered pronoun reached the file (prompt item 13).

## 5. Authority conflicts and questions for Dean

1. **Drawer widths (authority conflict).** Shell R45 and the accepted Sales A5 set a 432 px panel; the Library decision of 11 November 2026 sets 360, 480, 640 and 800 px and lists module files to align at their next change. Recommendation: the later owner decision, with the Shell record stating how R45 is updated.
2. **Docked-menu counts.** Record totals on view rows (as drawn) or worklist counts only (R34, Q22). Recommendation: worklist counts only.
3. **Expired instrument on Sat 31 Oct:** SYN-FLO-001 (this file) or SYN-CLP-004 (Service, A3). Recommendation: A3.
4. **M-2 replacement time:** 15:16 to 15:20 (this file) or 14:55 (Service). Recommendation: fix it once in A3; if silent, the Service time.
5. **Mallee Fresh location and zone.** Recommendation: A3 (ACDT, as quoted).
6. **Seed assets `SYN-PPO-AST-000002` and `000003`.** Recommendation: the short form with the legacy form beside it, as sites show.
7. **Instrument tags and A2.** Recommendation: record the tags as an A2 exemption, since A3 already uses them.
8. **Focus ring colour.** Recommendation: text/link, as R85 states.
9. **Place of the shared-records settings.** Recommendation: Settings › Shared records with Settings current on the rail.
10. **Phone record header.** Recommendation: adopt R124's phone header and sticky bar on every phone record sheet.

## 6. Not checked and limits

- **No renders.** The Figma connection dropped several times during the session; the planned renders of SK01 (AF-003) and the ST01-2 focus states (AF-009) and the check of the Shell's dialog title size (AF-015) were not done, so those findings are marked plausible. Overlap on the canvas was judged from the extracted coordinates, not by a fresh overlap script.
- **Other files not opened.** The Sales, Products, Customer portal, My Work and Settings files were compared through their repository records only; the Products lifecycle, Customer portal and My Work handovers and the Settings Business policies register are not checked.
- **Addendum A3 not supplied.** Facts are taken from the records that cite it; a cited value may be stale if A3 changed after those records.
- **Not measured:** 48 px phone targets and 16 px phone inputs; register cells taller than one line (the file's own script reports none).
- The audit is design evidence only. It is not a build, a review of the built application, an accessibility conformance result or Dean's acceptance.

## 7. Next steps

1. Dean answers the questions in section 5.
2. The file's next build session applies the alignment batch (22 items covering the 24 findings, Majors first, each with its node IDs, rule, expected value and the check that proves it fixed), then updates the [proposal record](shared-records-refined-ui-proposal.md) and adds a status fragment.
3. The proposal record's section 1 cites the Shell's named version (AF-012), in that change.
4. The Shell file's owner renames the record header variants by layout, updates the Workspace menus header and answers the type-scale question (AF-015, AF-020, AF-024) under a new named version.
5. Dean accepts the file and saves its first named version; the design register and page guidance follow in their own change.

Boundary: no Figma file, application code, route, migration, permission, register or other record is changed by this record. Every record, person, value and date in the file is synthetic. All 78 parent requirement IDs are unchanged.
