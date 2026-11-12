---
document_id: PPO-FINANCE-FIGMA-ALIGNMENT-AUDIT
date: 2026-11-12
owner: Dean Fiedler
status: Audit findings, 2026-11-12; no design is changed and nothing is accepted by this record; read-only in Figma; no application code, route, migration, permission, integration or deployment
versioning: git
---

# Finance module Figma file — alignment audit

**Owner:** Dean Fiedler · **Date:** 12 November 2026 · **Status:** Audit findings. Decision support only: no Figma file was edited, commented on or versioned, no other record was changed, and nothing here accepts a design.

On 12 November 2026 Dean asked for the Finance module's Figma file to be audited, with the cross-file alignment audit prompt and the V3 read-only conformance audit of 10 November 2026 as supporting documents, and with "PPO - Library" available for reference. The cross-file prompt's method (its sections 4 and 5) was applied to the one file. Dean's standing instruction applies: "If you need any decisions from me, just proceed however you believe is the most professional and advanced approach." The prompt's questions were taken on their defaults: read-only in Figma, the Library read directly because its link was supplied, and every finding in the brief.

## 1. Scope and sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Finance module (proposal)" (Read me header; see AF-022 on the name), no named version | The audited file: Read me, two separators, ten scope pages, Shell and kit, Scratch |
| Private Figma file "PPO - Shell (accepted)", named versions "Shell refined concept — accepted" (8 November 2026) and "Shell refined concept — accepted · record header toolbar" (10 November 2026) | Authority: rules R1 to R125 ([export](../design/development/systems/shell-refined-concept-rules.md)), the docked Finance menu frame `103:16880`, sheet W `66:6462` |
| Private Figma file "PPO - Library" (not published) | Comparison base: the "PPO colour" and "PPO layout" variables, 13 text styles, the Controls, Record and Phone components; [drawer widths](library-drawer-widths.md) (PPO-LIBRARY-DRAWER-WIDTHS-DEC) |
| [Finance module refined UI proposal](finance-module-refined-ui-proposal.md) (PPO-FINANCE-REFINED-FIGMA-PROP) | The file's own rules, inventory with node IDs, assumptions A1 to A18 and audit |
| Sibling records: [My Work](my-work-refined-ui-proposal.md), [Projects](projects-module-refined-ui-proposal.md), [Supply](supply-module-refined-ui-proposal.md), [Service](service-module-refined-ui-proposal.md), [Reporting](reporting-module-refined-ui-proposal.md), [Engineering](engineering-module-refined-ui-proposal.md), [Estimating](estimating-module-refined-ui-proposal.md), [Customer portal](customer-portal-refined-ui-proposal.md), [Shared records](shared-records-refined-ui-proposal.md) | The fact ledger and handover pairs, where those records state what Addendum A3 sets |
| [Shell refined concept design](shell-refined-concept-design.md), [named-version build handoff](figma-named-version-build-handoff.md), [Finance handoff contract](../contracts/finance-handoff.md) | Named versions; revision wording |

Addenda A1, A2 and A3 were not attached to this session. A1 was read through rules R116 to R125; A2 through the readable-reference namespaces decision and the Finance file's own AD09 sheet; A3 through the alignment prompt's earlier-fixture list and the sibling records that cite it. Findings that only A3's text can settle are marked *plausible*.

Figma links and file keys are not recorded here (ADR-0050, ADR-0053). Node IDs are those of the Finance file unless a row names another file.

## 2. Method

- **Checks:** the prompt's sections 4.1 to 4.8 (ST, SH, CT, CV, FA, HO, RA, GV); EX does not apply (no customer sheet).
- **Extraction:** one read-only script per group of pages returned structure (sections, gaps, padding, grid positions, labels, overlaps, children outside bounds), shell instances per sheet, the signed-in account on each top bar, record-header texts and variants, font families and off-scale sizes, bound and literal paints, chip label and tone pairs, every `SYN-` reference, every person name, and regular-expression scans (earlier fixtures, reference families, revision forms, ISO dates, bare dollars, gendered pronouns, US spellings, forbidden control words, weekday against the 2026 calendar). Targeted reads followed for disputed facts, panel and dialog widths, phone bars, Library variables and components, the Shell's docked Finance menu and sheet W.
- **Calls:** 15 read-only Figma calls (Finance 11, Library 3, Shell 1), well inside the budget; no timeout.
- **Read:** all 15 pages; 222 of 222 sheets, the ten notes cards and the four Read me cards.
- **Not read:** the sibling module Figma files (their records were used); "PPO - Design".

## 3. Results

The file is structurally sound and close to the accepted shell: every page follows the template, nothing overlaps or sits loose, every recorded node ID resolves, Roboto is the only family, about 38,500 paints are bound to the colour variables, the top bar and right strip match C5 and R66, the desktop record header follows R116 to R125 with state-driven primaries and named reasons, and no control posts, pays or resends. The misalignments are in shared facts and conventions: a reference family that clashes with Supply, gendered pronouns, the My Work count, the redrawn phone record header, the tablet right strip, chip tones and one persona's role.

| Severity | Findings |
|---|---|
| Blocker | 0 |
| Major | 9 |
| Minor | 14 |
| Polish | 7 |
| **Total** | **30** (25 confirmed, 5 plausible) |

Alignment matrix, 49 rows against this file: 16 Pass, 27 Fail, 3 Not checked (CV2 cell wrapping not re-measured; the Service and Settings handovers, whose files were not opened) and 3 Not applicable (HO3, GV3, EX1).

## 4. Findings

### 4.1 Major (in full)

| ID | Check | Where (node IDs) | Rule and source | Found → expected | Fix owner |
|---|---|---|---|---|---|
| AF-001 | FA2, FA3 | CA06 `32:11445` and four more, CA10 `35:20023`, HO16 `14:1033`, CL10 `33:31097`, X22 `38:21660`, X26 `38:22096`, CO01 `29:4945`, CO02 `33:15448`, CO07 `38:20391`, CO11 `38:21065`, IS02 `30:13426`, AD09 `35:13229` | A3: a Finance dispute is `SYN-DPT-`; `SYN-DSP-` is Supply's dispatch family (Supply DL02 to DL05) | Dispute `SYN-DSP-000003` on six pages while CL03 and CL08 use `SYN-DSP-000058` for the Supply delivery; AD09 itself flags the clash → `SYN-DPT-000003`, AD09 lists `SYN-DPT-` | Finance file; this repository's Finance record A5 later |
| AF-002 | FA7 | HO04 `26:3309`, EX11 `39:8823`, EX notes `57:12108`, PP04 `33:32192`, PP05 `33:32652` and `33:32744`, PP11 `37:13569`, PP notes `54:18927`, CO notes `69:6326`, MD02 `29:11904`, MD06c `38:18991`, AD12 `33:21331`, AD notes `39:6461` | Names or they/them for synthetic people | 13 gendered pronouns → names or they/them | Finance file |
| AF-003 | FA6 | The rail on every desktop sheet | A3.8 as the My Work record states it: Avery Lin's pill is 3 | Pill 4 on every sheet whoever is signed in → 3 for Avery Lin, the A3.8 value for each other persona | Finance file |
| AF-004 | SH1, SH6 | 14 phone sheets: PH-HO02 `33:23542`, PH-HO04 `33:23470`, CA12 `51:15550`, CA12-320 `51:15674`, PH-EX02 `55:18899`, CL14 `60:5079`, CL14b `60:5239`, PH-PP02 `52:17918`, PH-PP09 `51:5164`, PH-CO12W `65:24724`, PH-CO08 `65:24846`, PH-MD12a `57:7372`, PH-MD12b `56:17920`, PH-MD12b-320 `56:18042` | R116, R124: the accepted phone header component | A frame named "Record header · phone" → an instance of the local phone component `11:403` with the sticky bar | Finance file |
| AF-005 | SH3, RA1 | All 15 tablet sheets (TB-HO01 `33:22442` … AD01T `37:19275`) | R75 and the accepted sheet W, which keeps the 48 px right rail at 1024 | No right strip; A14 calls the tablet shell derived → add the strip, or Dean accepts A14 as a departure | Finance file (or Dean) |
| AF-006 | CT4 | Status chips on every page | "One tone per chip meaning" (the record's own section 4) | Approved Success 21 / Neutral 4; Submitted Warning 14 / Info 1; Open Warning 12 / Neutral 7 / Danger 1; Proposed Warning 4 / Info 3; Prepared Neutral 2 / Info 1; Raised in MYOB, Reviewed, Closed, Scheduled, Current, Pending also split → one tone per word | Finance file |
| AF-007 | FA4 | PP02 `33:17307`, PP04 `33:31762`, PP15 `46:13345` | A3.8 via My Work OV10: Jamie Rossi is project manager of Glasshouse 4 | "coordinator" on FN-03, "project manager" on CL02 `30:12135` and CA21 `39:16538` → project manager throughout | Finance file |
| AF-008 | RA2 | ST01g `38:10183`; the accepted record header primary | WCAG 1.4.3 and 1.4.11; the record's R1 to R3 | 3.57:1 on the primary, 2.96:1 and 1.30:1 on two edges; the Library holds the same values → Dean decides; the Shell changes under a new named version | Dean (Shell owner), then Library |
| AF-009 | SH3 | 24 side panels at x 960, w 432 (HO03 `26:2240`, X06 `30:5089`, X07 `30:5700` …) | Shell R45 and R98 against the Library drawer-widths decision | Authority conflict (question Q1) | Dean |

### 4.2 Minor and Polish (summarised by check)

- **CT3 (AF-010, AF-011):** dialogs at 520, 600, 620 and 640 px against the Library's 560 and 720 (X09 at 520 is below the Sales A5 minimum); off-scale text at 10, 15, 18, 22, 24 and 28 px, mostly 18 px dialog titles, and no text styles in the file.
- **SH6 and CT1 (AF-012, AF-015):** record header variants are quotation states reused for their button layout, so the variant property misnames Finance states; every record header shows Outputs, including read-only settings policies, where R119 omits it (plausible).
- **SH1 (AF-013):** docked Finance menus are frames on about 31 sheets because neither the Shell nor the Library has a docked-menu component; content matches the Shell's frame `103:16880`.
- **CV3 and SH4 (AF-014):** the nested view "Reconciled" carries a count, against Q22's worklist counts only.
- **CV4 (AF-016):** five dates in 2027 have no year ("Fri 1 Jan", "Wed 13 Jan", "Wed 6 Jan").
- **FA5 (AF-017):** the Customer accounts register stands at 10:45 with no note; A12 covers only the handoff page.
- **CV6 (AF-018, plausible):** handoff and claim successors read `v1`, `v2` beside other records' `r02`; the handoff contract calls them revisions (question Q3).
- **ST3 (AF-019):** 124 of 221 labels have no closing bracket; those that do hold a route (question Q2).
- **FA1 and FA4 (AF-020, AF-021, plausible):** Kai Morgan appears in no sibling record or A3.8 list; Jordan Hale appears in a Projects role and as a measure owner.
- **GV1 (AF-022, plausible):** the link supplied on 12 November 2026 names the file "PPO - Finance module", not "(proposal)".
- **SH7 (AF-023):** the Finance record cites the 8 November named version, not the 10 November one.
- **Polish (AF-024 to AF-030):** Insights tablet and phone labels read IS01 and IS02 instead of TB-IS01 and PH-IS02; bare "$" on an Insights notes card; "Hand-off" on M01 against "handoff" elsewhere; Flows and notes sections with 100 px top padding; two literal specimen shadows; the Sales kit names against the Library's Controls names (Minor); the handoffs notes card recorded without its node ID.

Confirmed alignments worth keeping: invoice `SYN-INV-000431` (A$50,492.50 excl. GST, A$55,541.75 incl. GST) agrees with the Customer portal record; KPI-10 (38 %, 3 of 8) and KPI-12 (36 %, 4 of 11) agree with the Supply record; Glasshouse 4 retention (5 %, cap A$10,630.00) and Block C's claims without retention agree with the Projects record; `SYN-SUB-` is used correctly for subcontract packages; the colour variables equal the Library's 66 of 66; grid rows 40, headers 36, details column 380, phone header 56 and tab bar 64 equal the Library's layout variables.

## 5. Authority conflicts and questions for Dean

| # | Question | Recommendation |
|---|---|---|
| Q1 | Drawer widths: Shell R45 and R98 (432 px panel plus the 48 px tab column) or the Library's 360, 480, 640 and 800 px? | The Library widths, the later owner decision, once its record says whether 480 includes the tab column |
| Q2 | Label bracket: the page template's `[source]` or the alignment prompt's `[signed in as …]`? | `[route · signed in as Name]` |
| Q3 | Does A2's `r01` form cover handoff and claim successors? | Yes for handoffs and claims; measures and policies keep `v1`, `v2` as versions |
| Q4 | Contrast of the accepted primary | #2f7d2a (5.14:1) for the primary fill, in the Shell under a new named version, then the Library |
| Q5 | Tablet right strip | Follow the accepted sheet W |
| Q6 | Record header variants for non-quotation records | Layout variants in the next Shell named version |
| Q7 | Kai Morgan and Jordan Hale | Confirm against A3; recast if absent |
| Q8 | The file's name | Dean names it; the file and record follow |

## 6. Not checked and limits

- Addenda A1, A2 and A3 were not supplied; A3-dependent facts are marked plausible.
- The sibling module Figma files were not opened, so tone consistency across files (CT4) and the words of each handover were compared only with their records.
- Cell wrapping (CV2) was not re-measured; the record's own audit reports it passing.
- Prototype links, motion and keyboard behaviour cannot be read from static frames.
- Named versions cannot be listed through the Figma tools; the Shell's were taken from its record.

## 7. Next steps

1. Dean answers Q1 to Q8 (the defaults above apply if not).
2. The Finance file's next build session applies the alignment batch (Majors AF-001 to AF-007 first, then the Minors and Polish), re-running the extraction checks named in each item. No named version is needed: the file is a proposal.
3. The Shell owner takes AF-008 and Q6 into a new Shell named version; the Library adds a docked-menu component and a Sales-to-Controls name map (AF-013, AF-029).
4. Repository corrections, each in its own later change: the Finance record's A5 (dispute family), A12 (story clock), A14 (tablet strip), section 1 (the 10 November Shell named version) and the handoffs notes card node ID.

This record changes no other record, no design register entry, no code, test, migration, seed, permission, route or integration. All 78 parent requirement IDs remain.
