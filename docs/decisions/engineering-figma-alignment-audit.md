---
document_id: PPO-ENGINEERING-FIGMA-ALIGNMENT-AUDIT
date: 2026-11-13
owner: Dean Fiedler
status: Audit findings, 2026-11-13 (read-only); Dean's answers of the same day and the Engineering alignment batch they authorised are recorded in section 8; nothing is accepted by this record; no application code, route, migration, permission or integration; every record shown is synthetic
source_commit: bdcdd347fcb29c3806cd23d1e85be03f972b6628
versioning: git
---

# Engineering module Figma alignment audit

**Owner:** Dean Fiedler · **Date:** 13 November 2026 · **Status:** Audit findings. The audit itself edited, moved, renamed, commented on or versioned nothing in any Figma file, and delivered its fixes as one alignment batch (Appendix A). Dean then adopted the recommendations, and the batch's Engineering items were applied to the Engineering file only; section 8 records what changed.

On 13 November 2026 Dean asked for an audit of the Engineering module's Figma page set. Dean supplied the cross-file alignment audit prompt and the V3 read-only conformance audit of 10 November 2026 as supporting material, and made the PPO - Library file available for reference. This record applies the prompt's checks (its section 4) to one file, "PPO - Engineering module", recorded in [PPO-ENGINEERING-REFINED-FIGMA-PROP](engineering-module-refined-ui-proposal.md). Under Dean's standing instruction, the prompt's questions took their defaults: read-only, findings of every severity, and the Library read for reference only.

Four statements stay separate:

- what was audited (sections 1, 2 and 6);
- what is misaligned (sections 3 and 4);
- what only Dean can decide (section 5);
- what this audit did not change: no Figma file, no other record, no code. Section 8 records the batch Dean then authorised, applied to the Engineering file and its record only.

## 1. Scope and sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Engineering module" (the record and Read me still say "(proposal)"; AF-028), no named version saved | Audited in full: Read me, 12 scope pages, 193 sheets, 12 notes cards, the Shell and kit page, both separators and Scratch |
| Private Figma file "PPO - Shell (accepted)": named versions of 8, 10 and 12 November 2026, and the navy primary of its record's section 13 (awaiting a named version) | Authority for the top bar, rail, right rail, collapsed strip `29:3119`, record header toolbar `170:10178` and phone bar `170:10215`, the Engineering flyout and docked menu on the workspace menus page `101:8553`, the icon set and the colour variables |
| Private Figma file "PPO - Library" (not published) | Page list, Controls, Phone, Record and States component names, variable collections |
| "PPO - Customers, Sites & Equipment module": EQ10 `32:3133`, SU02 `67:765`, TI01 `75:8` · "PPO - Service module": RV22 `83:8132` · "PPO - Supply module": MD02 `33:2187` · "PPO - Settings module": GL04 `133:1727` | Handover and ownership pairs, one sheet each |
| [Shell rules R1 to R125](../design/development/systems/shell-refined-concept-rules.md); [Shell record](shell-refined-concept-design.md) sections 11 to 13; [Shell independent review](shell-independent-review.md); [named-version build handoff](figma-named-version-build-handoff.md); [Library drawer widths](library-drawer-widths.md); [readable reference namespaces](readable-reference-namespaces.md) | Rules applied |
| [Cross-file alignment audit](figma-cross-file-alignment-audit.md) (both passes) and the [Supply audit](supply-figma-alignment-audit.md); the Settings, Shared records, Service, Projects, Reporting, My Work and Documents and messages records on `main` | Earlier findings re-tested; Addendum A3 facts as those records apply them; Dean's decided questions (AC-24, Q-B, Q-C) |
| V3 read-only conformance audit, 10 November 2026 (supplied by Dean, not in the repository) | Cross-reference for Engineering (UXA-17, ENG-A1 to ENG-A4, REQ-ENG-001 to 010) |

Addenda A1, A2 and A3 were not supplied as text in this session. A1 is read as Shell rules R116 to R125, A2 as the short reference form with two-digit revisions and six-digit numbers, and A3 through the records above that cite it. Figma links and file keys are not recorded ([ADR-0050](ADR-0050-font-awesome-light-icons.md), [ADR-0053](ADR-0053-figma-page-design.md)). Node IDs are those the owning records already cite.

## 2. Method

- **Extraction.** A read-only script ran on each scope page. It walked every section and sheet and returned only exceptions and compact counts:
  - section order, gaps and padding; sheet grid positions;
  - label text, position, width and truncation; children outside a sheet;
  - shell instances and their main components, frames named like shell parts, and the signed-in person in the top bar;
  - unbound paints, font families and sizes, chip words and tones;
  - every visible text node, tested for earlier fixtures, gendered pronouns, weekday and date pairs, dates without the year, ISO dates, zones, money, revision labels, reference families, watched words, US spellings, events after the story clock and count wording.
- **Follow-ups.** Context reads on Commissioning, Change review, Insights and Design basis. Kit copies compared with the Shell (toolbar primaries, phone bar, icons, top bar and right-rail parts, flyout text). All 205 inventory node IDs resolved against the record. One sheet each was read in the Service, Customers, Sites & Equipment, Supply and Settings files, and component names in the Library.
- **Analysis.** The findings are held in one data file that generates the register, the matrix and the batch. Contrast was computed with the WCAG 2.x formula.
- **Budget.** 30 Figma calls (1 session, 22 in this file, 7 in the other files and the Shell, 1 in the Library). None failed or timed out, and nothing was changed. No screenshot was needed, because every finding rests on text or a property.

Severity follows the prompt:

- **Blocker:** an accepted file departs from a decided rule, a customer sheet exposes an internal fact, a record carries a Figma link, or two files own one page with different content.
- **Major:** a shared fact, component, tone, family or handover differs; a shell part is redrawn; an unrecorded shell departure.
- **Minor:** a convention drifts without changing meaning.
- **Polish:** spacing, truncation and naming tidiness.

The Engineering file is a proposal, so no finding is a Blocker. Three findings carry Major as a judgement the prompt does not spell out, as the Supply audit did: AF-002 (a wrong instrument on a test result), AF-007 (Dean's pronoun instruction) and AF-010 (phone targets below the file's own 48 px rule).

## 3. Results

**Headline.** The file is structurally sound and fully traceable:

- every sheet and notes card sits on the template grid with a matching one-line label;
- nothing is loose or outside its sheet;
- all 205 recorded node IDs resolve to the same codes, and the Read me index lists each;
- Roboto is the only family;
- no weekday-date pair is wrong, and no US spelling, money figure, earlier fixture or Kim Patel appears;
- the shell is instanced throughout, with the seven top-bar actions and six right-rail tabs in the accepted order, and the docked menu and flyout match the accepted Engineering menus.

The misalignments sit in four places:

1. **Facts other files hold.** The October T06 check is counted in Q3. Test instruments differ from the Equipment register. A survey reference uses a family that does not exist, and its number belongs to another site's survey. SYN-OPP-000301 is unresolved.
2. **Handovers.** The CP-4 as-built handover is "not requested" here but received in Service and Equipment. Supply reads materials r04 as released where Engineering issued R3.
3. **Shell drift.** The toolbar copy keeps the green primary Dean replaced with navy, and phone targets are below 48 px. Some of this the Shell owns.
4. **Conventions.** Revision labels, zones, tones, labels and pronouns.

| Severity | Count | Engineering file | Other module files | Shell | Dean first | Repository |
|---|---|---|---|---|---|---|
| Major | 11 | 7 | 1 (AF-003) | 1 (AF-032) | 2 (AF-004, AF-006) | 0 |
| Minor | 17 | 13 | 1 (AF-012, then Engineering) | 1 (AF-033) | 1 (AF-023) | 1 (AF-026) |
| Polish | 6 | 5 | 0 | 1 (AF-034) | 0 | 0 |
| **Total** | **34** | **25** | **2** | **3** | **3** | **1** |

AF-001 and AF-009 also need Dean's word (Q6, Q4) but are counted under the Engineering file, which applies them. AF-007 also corrects one record row.

Alignment matrix in summary (`Pass`, `Fail`, `Not checked`, `Not applicable`; the full matrix has 55 rows):

| Area | Checks |
|---|---|
| Structure | ST1, ST2, ST4, ST5 Pass; ST3 Fail (labels omit the signed-in person) |
| Shell | SH2, SH5 Pass; SH1, SH3, SH4, SH6, SH7 Fail |
| Components and tokens | CT1, CT2, CT3, CT4 Fail; CT5 Not applicable |
| Conventions | CV1, CV3, CV5, CV7, CV8 Pass; CV2 Not checked; CV4, CV6 Fail |
| People and story | FA2 Pass; FA1, FA3, FA4, FA5, FA6, FA7 Fail |
| Handovers | PJ-09 and PJ-06 pairs Pass; Supply (two pairs), Service, Equipment (two pairs), Site surveys, Reporting and Sales pairs Fail; My Work, Customer messages and Products Not checked; HO2 Fail; HO3 Not applicable |
| Accessibility | RA1 Pass; RA2, RA3 Fail |
| Governance | GV2, GV4 Pass; GV1 Fail; GV3 Not applicable |
| Customer exposure | EX1 Not applicable |

Earlier findings re-tested. The cross-file audit numbers its findings separately; each of its Engineering items still stands and is carried here under this record's number:

- **Cross-file AF-030, pronouns:** 15 strings (here AF-007).
- **Cross-file AF-031, single-digit revisions:** 21 lower-case, plus 190 upper-case R-labels this pass adds (here AF-011).
- **Cross-file AF-032, dates without the year:** about 371 (here AF-015).
- **Cross-file AF-033, SYN-OPP-000301:** open (here AF-006).
- **Cross-file AF-034, unbound paints:** 18 (here AF-021).
- **Cross-file AF-035, labels:** they omit the signed-in person (here AF-019).
- **Cross-file AF-001, toolbar contrast:** the copy is unchanged, while the Shell has moved to navy (here AF-008).
- **Second pass AF-092, AF-143, AF-147, AF-148 and AF-160:** here AF-014, AF-017, AF-029, AF-024 and AF-025.

Two second-pass Polish items are not repeated. AF-164 is the Read me page name "Read me · PPO - Engineering". AF-091 counts full-length sheets in their own row as grid drift, which this audit treats as the file's own template rule. The record's own audit items C1, R1, R2 and R4 remain open, and R3, P1, P2 and G1 to G5 were not re-tested.

## 4. Findings

The Majors and every Engineering-owned item are given in full in Appendix A, with the node IDs, the expected text and the check that proves each fixed.

| ID | Severity | Check | Finding | Fix owner |
|---|---|---|---|---|
| AF-001 | Major | FA1, HO1 | Insights counts the T06 check recorded Thu 15 Oct 2026 in Q3 (IS01 KPI-11 "11 of 12", IS03 rows dated 15 and 16 Oct under "Q3 2026"); Reporting does the same | Engineering, with Reporting (Q6) |
| AF-002 | Major | FA1, HO1 | Motor-current results cite insulation testers SYN-MEG-001 and -002 with validity the Equipment register does not hold; EQ-09 records T06 on clamp meter SYN-CLP-006 and the instrument that expired Sat 31 Oct as flow meter SYN-FLO-001 | Engineering |
| AF-003 | Major | HO1 | SYN-CMS-000012: here the release is blocked and the handover "Not requested"; Service RV22 shows it requested and received, Equipment EQ10 shows it issued and accepted; obligation words and the configuration identity differ | Service; Customers, Sites & Equipment (Q8) |
| AF-004 | Major | HO1 | Supply MD02 reads "EN-06 released materials r04 · Released · r04 is current"; Engineering issued SYN-MAT-000031 R3 and holds R4 as a draft blocked by the unmapped SV-20 spare | Dean (Q2), then Supply or Engineering |
| AF-005 | Major | FA1, FA3 | Block C sources cite "SYN-SVY-000031"; surveys are SYN-SRV- (owner-adopted), and SYN-SRV-000031 is a Glasshouse 4 survey in the owning file | Engineering |
| AF-006 | Major | FA1 | SYN-OPP-000301 names a Hillview Glasshouse 5 basis here and Mallee Fresh Produce in the accepted Sales file (cross-file AC-08) | Dean (Q3), then Engineering |
| AF-007 | Major | FA7 | 15 gendered pronouns on 10 sheets and one notes card; one more in record A13 | Engineering; Repository |
| AF-008 | Major | SH1, RA2 | The local toolbar keeps the primary on brand/green-deep (3.57:1) where the Shell now binds brand/navy (14.37:1) | Engineering |
| AF-009 | Major | HO2 | Engineering versions its own "Reference families v1" (AD01, AD08) while the Settings registry GL04 owns the families and renames Engineering's instrument families | Dean (Q4), then Engineering |
| AF-010 | Major | RA3 | Phone controls drawn here are 30 to 44 px (header and back buttons 40, footers 44, view chip 30) | Engineering |
| AF-011 | Minor | CV6 | Materials revisions "R1" to "R4" (190 occurrences), "r1" to "r3" line revisions and "Sales brief r1", against A2's r01 | Engineering (Q5) |
| AF-012 | Minor | CV6, FA3 | Instrument references have three digits; INS and CAL clash with Service inspections and Estimating calibration proposals | Customers, Sites & Equipment, then Engineering |
| AF-013 | Minor | FA1 | CR02 says the Fri 16 Oct rework "passed at 2.1 A"; four other sheets give the passing retest on Mon 19 Oct | Engineering |
| AF-014 | Minor | FA5 | Eleven sheets show events after 09:00 (09:01 to 09:20) with no later-moment label | Engineering |
| AF-015 | Minor | CV4 | About 371 dates without the year; as-at lines and history lists state no zone | Engineering (Q7) |
| AF-016 | Minor | SH6 | Twelve no-action toolbars do not read "Read only" (R117). Corrected in section 8: TR06's primary is not blank | Engineering |
| AF-017 | Minor | SH4 | Administration sheets show Engineering current on the rail; AC-24 decided Settings | Engineering |
| AF-018 | Minor | FA6, SH4 | The rail reads "My Work 4" (Dean Fiedler's count) whoever is signed in | Engineering |
| AF-019 | Minor | FA4, ST3 | 79 of 83 sheets signed in as someone other than Sam Jordan do not name the person in the label | Engineering |
| AF-020 | Minor | CT4 | Eight words carry two tones (Unchanged, Not acknowledged, Received, To confirm, Not saved, Sent, Required, Retest/Test pending) | Engineering |
| AF-021 | Minor | CT2 | 18 unbound paints (ST01 overlays, five scrims, a divider); accent/estimating-ink #1f8a7e against the Shell's #156e64 | Engineering |
| AF-022 | Minor | CT3 | 15, 17, 18 and 22 px text outside the C6 scale on phone sheets and KPI tiles | Engineering |
| AF-023 | Minor | SH3 | Panels 432 px against the Library's 480 and 360 px; CR08's panel 560 px | Dean (Q1) |
| AF-024 | Minor | CT1, CT5 | Kit under Sales names, local phone chrome, frames for panels and dialogs, 12 icons beyond the Shell's 101 | Engineering, at Library adoption |
| AF-025 | Minor | SH7, GV1 | Kit, Read me and record cite the 8 November Shell, not the 10 and 12 November named versions; the Shell now has component sets this file copied as single components | Engineering |
| AF-026 | Minor | GV1, FA3 | Record corrections: Shell version, A13 pronoun, A11 and A17 families | Repository |
| AF-027 | Polish | SH4 | The flyout's Recent rows keep the kind word before a SYN- reference (R114) | Engineering |
| AF-028 | Polish | GV1 | Read me and record say "(proposal)"; the shared link names the file "PPO - Engineering module" | Engineering; Repository |
| AF-029 | Polish | CT1 | Toolbar primary layers are all "Button · Primary"; the Shell names them by wording | Engineering |
| AF-030 | Polish | CV | PK05's trace uses a Success chip reading "Not so" | Engineering |
| AF-031 | Polish | CV4 | Insights notes use long-form dates | Engineering |
| AF-032 | Major | RA3, SH6 | The Shell's phone toolbar has 32 px controls and a ⋮ beside Actions (R118); the copy inherits them | Shell |
| AF-033 | Minor | CT1 | Toolbar variants are named for quotation states, so Engineering picks them by look | Shell |
| AF-034 | Polish | SH4 | The Shell's Engineering flyout uses "SYN-PKG-000031" and "Mornington commissioning" | Shell |

The facts that differ, with both values and both places (ledger difference):

| Fact | Engineering | Other file or record |
|---|---|---|
| Quarter of the T06 check | Counted in Q3 2026 (IS01, IS03) | Recorded Thu 15 Oct 2026 (CM03), so Q4; Reporting DP07 also counts it in Q3 |
| T06 passing retest | Mon 19 Oct, 09:10 (CM03, CM04, CR10) | "The rework on Fri 16 Oct passed at 2.1 A" (CR02, same file) |
| SYN-MEG-002 | Motor-current instrument, calibrated to Fri 29 Jan 2027 | Insulation tester, valid to Fri 30 Apr 2027 (EQ-09 TI01) |
| SYN-MEG-001 | Calibration expired Sat 31 Oct 2026 (CM07, record A17) | Insulation tester, valid to Mon 1 Feb 2027 (TI01) |
| T06 instrument | SYN-MEG- (IS03) | Clamp meter SYN-CLP-006, Thu 15 Oct (TI01) |
| Instrument that expired Sat 31 Oct | SYN-MEG-001 | Flow meter SYN-FLO-001 (TI01) |
| Insulation tester family | SYN-INS-003 | SYN-MEG- (Supply, Service; Settings GL04: "INS in Engineering → MEG") |
| SYN-CAL- | Instrument SYN-CAL-002 | Estimating calibration proposal; GL04: "Instrument in Engineering → INST" |
| Block C survey | SYN-SVY-000031 | SYN-SRV-000031 is "Bay 3–4 irrigation as-found", Glasshouse 4 (SU02) |
| SYN-CMS-000012 handover at 09:00 | Release blocked; handover "Not requested" (CM10, CM12) | "Requested to Service … as received, before acceptance" (RV22); "arrives … Issued by Alex Morgan", Accepted (EQ10) |
| Obligation names | Backup reference; Warranty and maintenance | BackupReference; WarrantyMaintenance (RV22) |
| CP-4 configuration | Controller configuration v1.4 (CM08, CM12) | Intended configuration r1, loaded Mon 12 Oct (EQ10) |
| Release behind SYN-DEM-000094 | SYN-MAT-000031 R3 issued; R4 blocked draft | "EN-06 r04 · Released · r04 is current" (MD02) |
| SYN-OPP-000301 | Hillview Glasshouse 5 basis | Mallee Fresh Produce irrigation pump station (Sales) and three other deals |
| Reference families | Engineering "Reference families v1" (AD01, AD08) | Settings registry GL04 |

Agreed across files:

- **The change:** SYN-ECR-000014, owned by Alex Lee: version 2 of Mon 2 Nov 2026, 15:40, the K3 contactor from 18 A to 25 A, with SYN-IMP-000031 read by Supply SC-09. The Supply file's differing source line is its own finding.
- **The CP-4 handover:** SYN-BKP-000019; SYN-AGR-000031 r03 Proposed, awaiting Avery Lin's Finance approval; Alex Morgan as issuer, Ravi Kumar as Service receiver and Sasha Cole as Equipment receiver; Noah Patel as the Hillview contact for training.
- **Glasshouse 4:** Hillview Growers, SYN-PRJ-000024, with project manager Jamie Rossi.
- **Block C:** SYN-PRJ-000027, SYN Northbank Nursery, with Sam Okafor; SYN-SUB-000011 is the electrical subcontract, received by Robin Hale; SYN-DEM-000094 is the SV-20 demand.
- **People:** Sam Jordan is the one engineering owner, and Kim Patel appears nowhere.

**Read against the V3 conformance audit.** These findings are evidence for its Engineering items, not a conformance claim:

- AF-004 and AF-003 are concrete instances of UXA-17 and cross-module scenarios XJ-05 and XJ-06: a release revision and a handover state that differ between sender and receiver.
- AF-002 bears on REQ-ENG-006: the source instrument behind a result must be the instrument of record.
- AF-010 and AF-032 bear on the touch-target part of ENG-A4 and REQ-A11Y.
- The file's own gaps G2 (200 % zoom) and G5 (keyboard walk-through) remain open against ENG-A4.

## 5. Authority conflicts and questions for Dean

| # | Question | Readings | Recommendation |
|---|---|---|---|
| Q1 | Drawer width for Engineering's form, filter and column panels (AF-023) | Shell R45 and R67: a 432 px panel beside the 48 px tab column, 480 px in all. Library decision of 11 November: `drawer/standard` 480 px, `drawer/narrow` 360 px for filters and columns | As the Supply audit asked: confirm whether 480 px is the panel or the panel with its tab column. Until then keep 432 px; CR08 joins whichever scale is chosen |
| Q2 | Which SYN-MAT-000031 revision is released and feeds the Block C demand (AF-004) | Engineering (record A16, departing from its brief): R3 issued Fri 23 Oct 2026, R4 a draft blocked by the unmapped SV-20 spare and FC-2 enclosure. Supply, following the brief: r04 released and current | Keep Engineering's state. The release gate is Engineering's, it is drawn across MT03, MT10 and X17, and Supply shows the very SV-20 spares line that blocks R4 as approved demand. Supply reads origin r03 and holds the spares line until r04 is issued |
| Q3 | SYN-OPP-000301 (AF-006; cross-file AC-08) | Accepted Sales: Mallee Fresh Produce irrigation pump station. Engineering: the Hillview Glasshouse 5 basis | Keep the accepted Sales fixture; give the Glasshouse 5 basis its own opportunity reference from A3 or the Sales file, and change the Engineering rows and record A14 together |
| Q4 | Who owns reference families (AF-009, AF-012) | Settings registry GL04 (Global configuration; its acceptance is in open pull request 942). Engineering's own "Reference families v1" on AD01 and AD08 | Settings owns the registry; AD08 becomes a read-only view filtered to Engineering, with a link. Instrument families and numbers come from EQ-09 as the registry fixes them (MEG for insulation testers, INST for Engineering's calibrators) |
| Q5 | Revision notation in Engineering (AF-011) | A2: two-digit r01. The file uses letters for drawings and design bases (AD06 "revision letters"), R1 to R4 for materials and r01 to r03 for test bases | Use r0n for materials releases and line content revisions. Keep letters for drawings and design bases as a recorded A2 exception (native CAD title blocks carry letters), noted in AD06 and PPO-STD-001 |
| Q6 | Quarter of the T06 check (AF-001; AC-10) | Engineering and Reporting count it in Q3. The recorded date, Thu 15 Oct 2026, is Q4 | As AC-10 recommends: keep the October date, rebuild the Q3 cohort without it, and fix Engineering's extract with Reporting's DP07 |
| Q7 | The year on dates (AF-015; AC-27; the file's R1) | The brief requires the year; about 371 Engineering dates omit it | As AC-27 recommends: the short form in registers and timelines within the story year; the year on headers, documents, customer sheets and as-at lines |
| Q8 | The moment of the CP-4 as-built handover (AF-003) | Engineering at 09:00: release blocked, handover not requested. Service RV22 and Equipment EQ10: issued, requested and arrived | Keep Engineering's 09:00 state, which is the sender's and is drawn across CM10 to CM13, and label RV22 and EQ10 as later moments |

## 6. Not checked and limits

- **Addenda.** A1 to A3 were not supplied as text. A3 facts come from the records that cite it, so an A3 fact no record repeats was not tested, Sam Jordan's A3.8 total among them.
- **Other files.** Only six sheets in four other module files were read. The My Work file (the blockers and reviews Engineering contributes), Documents and messages (SYN-ISS-000017 to Noah Patel), Estimating (SYN-QUO-000177 r02 for Woodhaven) and Projects (PJ-01 request; PJ-09 read from the cross-file extract) were not re-read. Products has no link. Rows 11 to 14 of the EQ-09 register were not read, so SYN-INS-003, SYN-ROT-001 and SYN-CAL-002 may exist there.
- **Visual and interactive.** CV2 (one line per cell) relies on the file's scripted pass of 10 November. Contrast was spot-checked on five text pairs and one edge. Phone input sizes, the focus ring, keyboard order and alternative text were not measured. No prototype, keyboard, screen-reader, zoom or device review was made.
- **Shell in flight.** Pull request 946 is applying the Shell's alignment batch 1 now, so the Shell components compared here may change before the next Engineering session. The navy primary awaits Dean's named version.
- **Rail current item.** AF-017 rests on the record's A19 and the cross-file AF-143; the rail fills were not re-read in this pass.
- **Version history.** Not readable through the tools; no named version of the Engineering file has been recorded.

## 7. Next steps

Steps 2, 3 and 6 were taken on 13 November 2026 for the Engineering file and its record (section 8). Steps 1, 4 and 5 remain.

1. Dean saves a named version of the Engineering file as it stands (for example "PPO - Engineering module (proposal) · 10 November 2026"), so the batch is a difference from a pinned state.
2. Dean answers Q1 to Q8.
3. The next Engineering build session applies Appendix A in order, re-runs the structural pass and the text scans, and asks Dean to save a new named version.
4. The Service and Customers, Sites & Equipment files take AF-003 (and AF-012 for EQ-09) into their next batches. The Supply file takes AF-004 once Q2 is answered.
5. The Shell's owner takes AF-032, AF-033 and AF-034 under a new Shell named version, alongside pull request 946.
6. Repository corrections, each in its own later change: the Engineering record's sources (latest Shell named version), A1 (file name), A11 and A17 (families), A13 (pronoun), and the assumptions Q2, Q4 and Q5 settle.

## 8. Dean's answers and the batch applied — 13 November 2026

Dean replied the same day: "I am happy to proceed based on your recommendations." This record reads that reply as two things:

- an answer to Q1 to Q8, each as section 5 recommends;
- authority to apply the Engineering items of Appendix A to the Engineering file.

The session that wrote this audit applied them. No other Figma file was edited: not the Shell (pull request 946 is changing it), Supply, Service, Customers, Sites & Equipment or Settings. No named version was saved before the batch. Figma's version history holds the earlier state, and a named version that pins the aligned state is now Dean's to save.

### 8.1 Decisions

| # | Decision, as recommended | Where it lands |
|---|---|---|
| Q1 | Panels stay 432 px until the Shell's and the Library's widths are reconciled | No change; AF-023 stays open, CR08 included |
| Q2 | Engineering's state stands: SYN-MAT-000031 r03 issued Fri 23 Oct 2026; r04 a draft blocked by the unmapped SV-20 spare and FC-2 enclosure | Supply's batch: MD02 reads origin r03 and holds the spares line |
| Q3 | The accepted Sales file keeps SYN-OPP-000301 for Mallee Fresh Produce | The Hillview Glasshouse 5 basis reads SYN-OPP-000344, a synthetic number no record uses |
| Q4 | The Settings registry owns the reference families | AD08 is a read-only view of it. Instruments follow its families: INS becomes MEG, and Engineering's CAL becomes INST |
| Q5 | Two-digit revisions for materials releases, line content and test bases | Letters stay for drawings and design bases. PPO-STD-001 section 7 already preserves the CAD engineering scheme, and AD06 now records the rule |
| Q6 | Checks recorded in October count in Q4 2026 | Engineering shows KPI-11 for Q4 2026 to date; Reporting's batch rebuilds its Q3 cohort |
| Q7 | The short form stays in registers and timelines within the story year; headers and as-at lines carry the year and zone | Applied in this file |
| Q8 | Engineering's 09:00 state stands: release blocked, handover not requested | The Service and Customers, Sites & Equipment batches label RV22 and EQ10 as later moments |

### 8.2 Applied in the Engineering file

| Finding | What changed |
|---|---|
| AF-001 | KPI-11 now reads "Q4 2026 to date" on IS01's header, card rule and tile, IS03's subtitle and footer, TB16's header and card title, and PH19's header. REP-06 stays Q3 2026 beside Q2, and the page's period tabs are unchanged |
| AF-002 | Instruments now follow the EQ-09 register. Motor current (T04 to T07 and the T06 retest) is on clamp meter SYN-CLP-006, "valid then · expired Sat 31 Oct", and CM07's Tue 3 Nov retest on it is the flagged one. Insulation (T02) and continuity (T12) are on SYN-MEG-002, valid to Fri 30 Apr 2027. T01's multimeter SYN-MUL-004 is valid to Wed 30 Jun 2027, and T10's calibrator is SYN-INST-002. The change covers CM03, CM04, CM07, CM14, TB14, PH15, IS03, ST01, the notes and the Read me |
| AF-005 | 13 citations now read SYN-SRV-000025, the Block C plant room as-found survey in the Site surveys register. Five "obs. 15" became "obs. 14", because that survey has 14 observations |
| AF-006 | 16 references now read SYN-OPP-000344; the Read me's A14 note records the settlement |
| AF-007 | All 15 gendered pronouns were rewritten with the name or "they/their", and the Read me's A13 now names Sam Jordan |
| AF-008 | The five toolbar primaries now use brand/navy, and 16 drawn primary buttons followed (11 on phone sheets, 5 on ST01). ST03's text row now reads brand/navy at 14.37:1, and its note closes C1. The edge row (brand/green-deep on white, 3.57:1 against the 3:1 rule) stays as it was |
| AF-009 | AD01 reads "Read from Settings". AD08 now reads "Read only · from Settings › Numbering families", with its sub-line and label changed to match. Its SUB row became SYN-MEG- (insulation tester, EQ-09), a SYN-SN- row was added, and the count is 15 |
| AF-010 | The local phone header's buttons are 48 × 48. 37 drawn phone controls are now 48 px high: back and close buttons, form footers, and the PH02 and PH03 view chips. Nine form footers moved up 4 px, and their content areas lost 4 px, to stay inside the sheet |
| AF-011 | 204 R-revision labels in texts and labels became r01 to r04, as did sheet names. The 21 lower-case r1 to r3 labels became r01 to r03 |
| AF-013 | CR02 now reads "The rework was done on Fri 16 Oct and the retest passed at 2.1 A on Mon 19 Oct" |
| AF-014 | Eighteen times moved inside the story clock: PS09 08:51 and 08:52; PS10 08:44; PS05 and PS06 08:47 and 08:51; DR12b 08:54; PH08 08:50; and Robin Hale's acknowledgement 08:59 on TR04, TR09, TR11, TB08 and PH11 |
| AF-015 | "AEDT" was added to 36 as-at lines, and the IS01 and TB16 headers were rewritten with it. Four toolbar sub-line dates gained the year |
| AF-016 | Twelve no-action toolbars now start "Read only ·" with the reason and date |
| AF-017 | Settings is now current on the rail of all eleven administration sheets: tile fill, label, icon and the 3 px left marker moved from Engineering |
| AF-018 | The rail's My Work count is hidden on 167 sheets not signed in as Dean Fiedler. A3.8's per-person totals were not available, so no count is shown rather than a wrong one. Dean's sheets keep 4 |
| AF-019 | 79 labels now end "[signed in as Name]"; the other four already named the person |
| AF-020 | Not acknowledged, Retest pending and To confirm are now Warning; Not saved is Danger; Received and Sent are Success. The verification chip reads "Verification required". The 16 bound-source chips that read "Unchanged" in Success now read "Current", so "Unchanged" stays Grey for differences |
| AF-021 | 18 paints are bound (overlays, scrims and a divider), and accent/estimating-ink is #156e64 |
| AF-022 | Text at 15 px became 16 px (PH01, PH02, PH03, PH15). The phone header title went from 17 to 16 px, PH01's count from 18 to 20 px, and the KPI tile value (component) and PH19's figures from 22 to 20 px |
| AF-025 | The kit section and the Read me cite the Shell's named versions of 8, 10 and 12 November 2026, and the navy primary |
| AF-027 | The flyout's five Recent rows start with the reference |
| AF-028 | The Read me title is "PPO - Engineering module (proposal, drawn 10 November 2026; alignment batch 13 November 2026)" |
| AF-030 | PK05's four "Not so" chips read "No change" |
| AF-031 | The Insights notes date the acceptance "Sun 1 Nov 2026" |

### 8.3 Not applied, and why

- **AF-003:** for the Service file and the Customers, Sites & Equipment file (Q8).
- **AF-004:** for the Supply file (Q2).
- **AF-012:** the six-digit instrument numbers wait for the EQ-09 register to change first. The families are already aligned.
- **AF-023:** no change, under Q1.
- **AF-024:** waits for Library adoption.
- **AF-025 and AF-029:** re-copying the Shell's component sets waits for the Shell's next named version.
- **AF-032 to AF-034:** for the Shell's owner.
- **AF-026:** applied in this change to the [Engineering record](engineering-module-refined-ui-proposal.md), section 11.

For the Customers, Sites & Equipment batch: EQ-09's "last use" for SYN-CLP-006 (Thu 15 Oct) should follow the Engineering file. The meter is now used through Mon 19 Oct and for the flagged retest on Tue 3 Nov.

### 8.4 Correction to this audit

AF-016 first said TR06's primary was blank. It reads "Complete review", disabled with its reason as R117 requires. The extraction had cut the toolbar text at 120 characters. The item is corrected above.

### 8.5 Verification

The audit scans were re-run across all 12 scope pages after the batch. They found:

- no gendered pronoun;
- no SYN-SVY-, SYN-OPP-000301, SYN-INS-, SYN-CAL- or SYN-MEG-001;
- no single-digit revision label;
- no time after 09:00 on Thu 5 Nov 2026;
- no as-at line without its zone;
- no unbound solid paint outside instances;
- no direct child outside its sheet;
- every label at y − 26, the sheet's width and one line, truncated;
- every sheet not signed in as Sam Jordan naming its person;
- no phone control under 48 px outside the Shell's phone toolbar;
- no drawn primary on brand/green-deep;
- one tone per chip word within each of the two scans (pages 7:4 to 7:9, and 7:10 to 7:15);
- Settings current on all eleven administration sheets.

Text outside the C6 scale is now only the 22 px titles of the notes cards, which are annotation.

Seven screenshots were checked for clipping and overlap: PH02, PH06, AD01, AD08, TR02, IS01 and CM03. The first round found three faults, each fixed and re-shot:

- TR02's "Source unchanged" was clipped, so the chips now read "Current";
- IS01's period tabs had been relabelled, so they were restored and the period stated on the KPI-11 card instead;
- ST03's edge row had been changed, so it was restored.

The batch took about 57 Figma calls. Three stopped on an instance sublayer that the edits had replaced and were re-run. Every rule matches only its before-state, so a re-run changes nothing twice.

### 8.6 Named version

The file is still a proposal, and nothing is accepted by this record. Dean is asked to save a named version that pins the aligned state, for example "PPO - Engineering module (proposal) · alignment batch 13 November 2026".

## Appendix A · Alignment batch · PPO - Engineering module

From the read-only alignment audit of 13 November 2026 (this record). Apply in this order. Node IDs are in this file unless another file is named; most are sheet frames, and the rest are text nodes or components. Change nothing else.

Before you start:

- Ask Dean to save a named version of the file as it stands, so this batch is a difference from a pinned state.
- Settle Q1 to Q8 of the record first where an item depends on them.
- Re-copy the Shell parts only from a named Shell version (pull request 946 is changing them now).

### AF-001 · Major · FA1, HO1

- **Where:** Insights · RP-03 · 54:8, 54:933, 55:984, 55:1234
- **Rule:** Story ledger: T06 was recorded Thu 15 Oct 2026 (CM03, record A11); Q3 is Wed 1 Jul to Wed 30 Sep 2026; cross-file question AC-10
- **Found:** IS01 reads "Q3 2026 (Wed 1 Jul to Wed 30 Sep)" and counts KPI-11 "Control panels 92 % · 11 of 12 · T06 SM-3 against" and "Screen drives 78 % · 7 of 9"; the IS03 drill-through lists rows recorded Thu 15 Oct 2026 and Fri 16 Oct 2026 under "Q3 2026 · 7 of 9 passed first time"; TB16 and PH19 repeat the figures
- **Expected:** Tests recorded in October fall in Q4 2026. The Q3 cohort holds only checks recorded 1 Jul to 30 Sep, or the extract shows Q4 to date; Engineering and Reporting read the same ledger
- **Do:** Rebuild the KPI-11 cohort, numerators and denominators by recorded date (or relabel the period Q4 2026 to date), then repeat the figures on IS01, IS03, TB16 and PH19
- **Proved fixed when:** No row recorded after Wed 30 Sep 2026 is counted under a Q3 label, and IS01, IS03, TB16, PH19 and the Reporting DP07 cohort give the same counts
- **Owner note:** Engineering, with Reporting (Dean, AC-10)

### AF-002 · Major · FA1, HO1

- **Where:** Commissioning and as-built · EN-08; Insights · RP-03 · 49:1367, 52:2629 (text 52:3345), 52:5384, 51:2480, 54:933; Customers, Sites & Equipment file TI01 75:8
- **Rule:** Engineering's own incoming handover: calibrated instruments come from EQ-09, which Customers, Sites & Equipment owns; results carry the instrument and its calibration (record section 4, Results)
- **Found:** Motor-current readings cite insulation testers: CM04 "Pass: 2.1 A is within ≤ 2.4 A, and SYN-MEG-002 is calibrated to Fri 29 Jan 2027"; IS03 gives T04 on SYN-MEG-001 and T05 on SYN-MEG-002; CM07 flags SYN-MEG-001 as expired (record A17: Sat 31 Oct 2026). The EQ-09 register shows SYN-MEG-002 and SYN-MEG-001 as insulation testers valid to Fri 30 Apr 2027 and Mon 1 Feb 2027, T06 motor current measured with clamp meter SYN-CLP-006 on Thu 15 Oct, and flow meter SYN-FLO-001 as the instrument that expired Sat 31 Oct. SYN-INS-003, SYN-ROT-001 and SYN-CAL-002 are not in the ten EQ-09 rows read
- **Expected:** Every result row names an EQ-09 instrument whose kind suits the measurement (current on a clamp meter or multimeter, insulation resistance on an insulation tester), with the validity EQ-09 records. CM07's flagged retest uses an instrument EQ-09 shows lapsed on Tue 3 Nov
- **Do:** Take instrument identity, kind and validity for CM03, CM04, CM07, CM14, IS03, PH15 and PH16 from the EQ-09 register; agree the CM07 instrument with the Customers, Sites & Equipment file
- **Proved fixed when:** Each instrument reference on EN-08 and IS03 resolves to an EQ-09 row with the same kind and validity
- **Owner note:** Engineering (Customers, Sites & Equipment confirms the CM07 instrument)

### AF-004 · Major · HO1

- **Where:** Materials and substitutions · EN-06 · 40:651, 40:1266, 43:4298, 42:4248; Supply file MD02 33:2187
- **Rule:** HO1 Engineering's released materials to Supply's material demand; record A16 (R3 issued Fri 23 Oct 2026; R4 is a blocked draft)
- **Found:** Supply MD02 reads "Origin EN-06 r04" and "EN-06 released materials r04 · Released · No · r04 is current" for SYN-DEM-000094 (solenoid valve SV-20: zone valves and commissioning spares). Engineering issued SYN-MAT-000031 R3 on Fri 23 Oct 2026 and holds R4 as a draft whose release is blocked by two unmapped lines, one of them "SV-20 spare"
- **Expected:** One released revision feeds the demand in both files. The SV-20 commissioning-spares line waits for the revision that carries it
- **Do:** After Dean answers Q2: either Supply reads origin "SYN-MAT-000031 r03" and holds the spares line until r04 is issued, or Engineering draws r04 issued and the unmapped lines resolved
- **Proved fixed when:** MD02's origin and MT02/MT03's release state name the same revision and state
- **Owner note:** Dean (Q2), then Supply or Engineering

### AF-005 · Major · FA1, FA3

- **Where:** Design basis and interfaces · EN-02 · 26:1105 (texts 26:1592, 26:1618), 26:1675 (texts 26:2148, 26:2192); Customers, Sites & Equipment file SU02 67:765
- **Rule:** PPO-REFERENCE-NAMESPACES-DEC (owner-adopted 20 Oct 2026): surveys are SYN-SRV-; one family per kind (FA3)
- **Found:** Block C rev B requirements and assumptions cite "SYN-SVY-000031 obs. 7", "obs. 12", "obs. 15" and "obs. 3" (12 strings). SVY is not a family; in the owning Site surveys file SYN-SRV-000031 is "Bay 3–4 irrigation as-found" at Glasshouse 4 (Hillview Growers), handed to Estimating
- **Expected:** Block C sources cite the Block C survey under its SYN-SRV- reference as the Site surveys file records it
- **Do:** Replace every SYN-SVY-000031 with the Block C survey's SYN-SRV- reference (confirm the number with the Customers, Sites & Equipment file) and keep the observation numbers
- **Proved fixed when:** No "SYN-SVY-" text remains and the cited survey's site is Block C in both files
- **Owner note:** Engineering (Customers, Sites & Equipment confirms the number)

### AF-006 · Major · FA1

- **Where:** Engineering workload and Pulse · EN-01 · 17:8, 17:935, 17:1900, 18:1200 and the other register sheets (16 strings)
- **Rule:** One reference, one record across files (FA1); cross-file AF-033 and question AC-08, open
- **Found:** SYN-OPP-000301 is the sold opportunity behind a Hillview Glasshouse 5 package (record A14); the accepted Sales file uses it for Mallee Fresh Produce's irrigation pump station, and the cross-file audit found five deals under it in six files
- **Expected:** One opportunity identity per reference, as Dean settles AC-08
- **Do:** After Dean answers Q3, renumber the Engineering opportunity reference on every register row and the record A14 together
- **Proved fixed when:** SYN-OPP-000301 means the same deal in Sales and Engineering
- **Owner note:** Dean (Q3), then Engineering

### AF-007 · Major · FA7

- **Where:** EN-01, EN-02, EN-05, EN-06, EN-08, Administration · 20:9117; 28:2654, 28:4173, 28:4633; 36:2165, 36:2166, 37:3860, 37:3861, 37:4091; 43:6083; 52:6184; 59:1064, 60:2461, 60:2584; notes 69:2849
- **Rule:** Dean's standing instruction 4: names or they/them for synthetic people, never gendered pronouns
- **Found:** 15 strings on 10 sheets and one notes card: "she is the assigned reviewer" (X09); "She wrote section 4" (DB11, DB13, X10); "in his My Work", "His acknowledgement form", "from his own account" (TR09, TR11); "in his My Work" (MT13); "In his Reviews & handovers" (CM16a); "a release she reviewed" (AD04, X22, Administration notes). The record repeats one ("he did not author", A13)
- **Expected:** No gendered pronoun for a synthetic person in any sheet, label, card or record row
- **Do:** Rewrite with the name or they/their, for example "Casey Quinn is the assigned reviewer on both packages" and "It shows in their My Work"
- **Proved fixed when:** A whole-word scan for he, she, him, her, his and hers finds none in the file, and none for a synthetic person in the record
- **Owner note:** Engineering; Repository (A13)

### AF-008 · Major · SH1, RA2

- **Where:** Shell and kit; every record sheet · 14:528 (five variants) and 121 desktop and tablet toolbar instances
- **Rule:** Dean's decision of 12 Nov 2026 (Shell review Q-B; Shell record section 13): the primary action uses brand/navy; white on navy 14.37:1
- **Found:** The local Shell / Record header · toolbar binds every primary to brand/green-deep: white 14 px Medium on #3d9a37 is 3.57:1. The accepted Shell component 170:10178 now binds brand/navy
- **Expected:** Primary fills bound to brand/navy in every variant of the local copy, and so in the 121 toolbar instances on record sheets
- **Do:** Re-copy the toolbar set from the Shell once Dean saves the navy named version (or rebind the five primary fills to brand/navy now)
- **Proved fixed when:** No toolbar primary in the file is bound to brand/green-deep, and ST03's contrast row for the primary reads Meets

### AF-009 · Major · HO2

- **Where:** Administration · EN · 59:8 (text 59:378), 60:1452 (text 60:1672); Settings file GL04 133:1727
- **Rule:** HO2 one owner per page; Settings record A59: the numbering registry is Global configuration, owned by Settings
- **Found:** Engineering publishes its own "Reference families v1" (AD01) and draws the families on AD08. The Settings registry GL04 lists the same families with different values: it renames Engineering's instrument families ("CAL … Instrument in Engineering → INST"; "INS in Engineering → MEG; INS stays the Service inspection")
- **Expected:** One owner. AD08 reads the Settings registry, filtered to Engineering's families, and links to GL04; Engineering versions no reference families of its own
- **Do:** After Dean answers Q4, turn AD08 into a read-only view of GL04 with a link, remove "Reference families v1" from AD01, and adopt GL04's instrument families
- **Proved fixed when:** No Engineering sheet offers to change or version a reference family, and AD08's list equals GL04's Engineering rows
- **Owner note:** Dean (Q4), then Engineering

### AF-010 · Major · RA3

- **Where:** Phone sheets on every scope page · 21:7202, 21:7381, 21:7570, 29:6419, 33:4192, 33:4253, 35:4881, 39:4823, 39:4886, 43:6908, 47:4954, 47:5006, 53:6240, 53:6395, 53:6453, 55:1234
- **Rule:** RA3: 48 px targets on phones; the file's own rule "48 px options"
- **Found:** Controls this file draws are below 48 px: header icon buttons 40 × 40 (search, filter and more in Phone / Header · compact), back buttons 40 × 40, form footers 44 px high (Cancel 69 × 44, primaries 275 to 299 × 44), and the view chip "View · Author actions" 116 × 30 on PH02 and PH03
- **Expected:** Every phone control at least 48 px high, or with a 48 px hit area
- **Do:** Raise footers to 48 px, give header and back buttons a 48 × 48 hit area, and make the view chip 48 px high
- **Proved fixed when:** No control on a phone sheet is shorter than 48 px without a 48 px hit-area frame

### AF-011 · Minor · CV6

- **Where:** EN-06, EN-07, EN-01, EN-02 and others · 40:8, 40:651 (texts 40:1117 to 40:1265), 26:1105 (26:1553), 29:5610 (29:5947), and 190 R-labels
- **Rule:** Addendum A2: two-digit revisions r01
- **Found:** Materials revisions are written R1 to R4 (190 occurrences, for example "SYN-MAT-000031 R3 · Block C fertigation materials"); line content revisions read r1 to r3 on MT02 (19); "Sales brief r1" on DB03 and TB03 (2). Supply already writes the same release as "r04"
- **Expected:** "SYN-MAT-000031 r03", "r01" for line content revisions and "Sales brief r01"
- **Do:** Rewrite R and r labels in the two-digit form; keep drawing and design-basis letters only if Dean confirms them (Q5)
- **Proved fixed when:** A scan finds no single-digit R or r revision label

### AF-012 · Minor · CV6, FA3

- **Where:** Commissioning and as-built · EN-08 · 49:1367 (texts 49:1780 to 49:1980), 52:2629, 52:5384
- **Rule:** PPO-REFERENCE-NAMESPACES-DEC: six digits minimum; FA3 one family per kind
- **Found:** Instruments read SYN-MEG-001, SYN-MEG-002, SYN-MUL-004, SYN-INS-003, SYN-ROT-001 and SYN-CAL-002: three digits, INS also the Service inspection family and CAL also Estimating's calibration proposal. The EQ-09 register also uses three digits
- **Expected:** Instrument references in six digits under the families the registry fixes (GL04 proposes INST for Engineering's CAL and MEG for its INS)
- **Do:** Apply the family and number form Customers, Sites & Equipment adopts for EQ-09 (after Q4)
- **Proved fixed when:** Instrument references match EQ-09 character for character
- **Owner note:** Customers, Sites & Equipment, then Engineering

### AF-013 · Minor · FA1

- **Where:** Change review · EN-07 · 44:657 (text 44:1056)
- **Rule:** Record D7: one CP-4 timeline on every sheet that touches it
- **Found:** CR02 says "The rework on Fri 16 Oct passed at 2.1 A"; CM03, CM04, CR10 and the EN-08 notes say Kim Taylor fixed the gearbox on Fri 16 Oct (SYN-WO-000058) and the retest passed at 2.1 A on Mon 19 Oct 2026, 09:10
- **Expected:** "The rework was done on Fri 16 Oct and the retest passed at 2.1 A on Mon 19 Oct"
- **Do:** Correct the CR02 sentence
- **Proved fixed when:** Every CP-4 T06 retest date reads Mon 19 Oct

### AF-014 · Minor · FA5

- **Where:** EN-01, EN-02, EN-03, EN-05 · 21:5783, 25:2499, 29:4948, 29:5266, 33:3040, 33:4253, 36:883, 36:1736, 37:3685, 39:4495, 39:4886
- **Rule:** FA5: the story stands at Thu 5 Nov 2026, 09:00 AEDT; a later event is a labelled later frame
- **Found:** Events after 09:00 on sheets whose labels name no later moment: PS09 09:01 and 09:02; PS10 access ended 09:14; PS05 and PS06 saves at 09:07 and 09:11; DR12b request at 09:14; PH08 "Checked Thu 5 Nov 2026, 09:20 by Kim Taylor"; "Acknowledged 09:02" on TR04, TR09, TR11, TB08 and PH11
- **Expected:** Each label says "(a later moment, Thu 5 Nov 2026, 09:14)" or the times move inside the story clock (for example Robin Hale's acknowledgement at 08:59)
- **Do:** Add the moment to the eleven labels, or move the acknowledgement before 09:00 across the five SYN-ISS-000017 sheets
- **Proved fixed when:** Every sheet that shows a time after 09:00 on Thu 5 Nov names that moment in its label

### AF-015 · Minor · CV4

- **Where:** File-wide · for example 17:8, 31:8, 34:994, 36:8, 40:8, 57:556
- **Rule:** CV4: "Thu 5 Nov 2026" with the year; the zone once per list; cross-file question AC-27 and the file's own R1
- **Found:** About 371 date occurrences omit the year in cells, timelines and sentences; as-at lines and history lists state no zone ("14 packages · as at Thu 5 Nov 2026, 09:00" on WL01; DR01, TQ07, MT01, TR01, ST02). Only IS01 and the notes cards say AEDT
- **Expected:** The year where Dean's answer to Q7 requires it, and "AEDT" once on each as-at line or list
- **Do:** Append "AEDT" to every as-at line; apply the year rule once Dean decides AC-27
- **Proved fixed when:** Each register footer and history list states its zone once
- **Owner note:** Engineering (Dean, Q7)

### AF-016 · Minor · SH6

- **Where:** Technical reviews and issues · EN-05; Design basis · EN-02 · 36:455, 36:883, 37:1257, 37:1669, 37:2074, 37:2469, 37:3267, 39:4148, 36:1736, 37:3685, 39:4495, 29:6320
- **Rule:** R117: a state with no action reads "Read only" with its reason and date
- **Found:** No-action primaries read "Reviewed · issued as SYN-ISS-000017" (TR02, TR04, TR03a, X15, X16, TR03b, TR08, TB07), "Delivered to every recipient · acknowledging is the recipient's" (TR09, TR11), "Acknowledging is the recipient's" (TB08) and "Nothing for you to confirm" (PH05). PS08 and DR12a already write "Read only · …". (Corrected in section 8: the first version of this item also called TR06's primary blank; it reads "Complete review", disabled with its reason.)
- **Expected:** For example "Read only · issued as SYN-ISS-000017, Thu 5 Nov 2026, 08:55"
- **Do:** Start each no-action primary with "Read only", keep the reason and add the date
- **Proved fixed when:** Every no-action toolbar reads "Read only"

### AF-017 · Minor · SH4

- **Where:** Administration · EN · 59:8, 59:434, 59:746, 59:1065, 60:799, 60:1144, 60:1452, 60:1787, 60:2085, 60:2332, 60:2592
- **Rule:** AC-24, decided for Estimating and to be applied to every module: Settings is the current rail item on administration sheets
- **Found:** The administration sheets show Engineering current on the rail (record A19, audit R2; cross-file AF-143)
- **Expected:** Settings current on the rail on all eleven sheets
- **Do:** Set the rail's current item to Settings on the Administration page
- **Proved fixed when:** The eleven sheets mark Settings current

### AF-018 · Minor · FA6, SH4

- **Where:** File-wide · 13:123 and every Shell / Rail · collapsed instance
- **Rule:** FA6: each person's counts follow A3.8
- **Found:** The rail reads "My Work 4", the Shell's count for Dean Fiedler, on every sheet whoever is signed in (10 people on desktop sheets)
- **Expected:** The signed-in person's A3.8 total, or no count until it is set
- **Do:** Override the rail count per persona from A3.8
- **Proved fixed when:** Rail counts match A3.8 per persona

### AF-019 · Minor · FA4, ST3

- **Where:** Ten scope pages · for example 31:598 to 33:3363 (Riley Chen), 36:8 (Casey Quinn), 46:2650 (Jamie Rossi), 59:8 to 60:2592 (Dean Fiedler, Taylor Quinn), 25:1540, 25:1903 (Lee Nakamura)
- **Rule:** ST3 label form "CODE · Page — state (scope ID) [signed in as …]"
- **Found:** 79 of the 83 desktop sheets signed in as someone other than Sam Jordan do not name that person in the label (MT09, CR05, CR06 and AD02 do); the file's rule names the actor in the header only
- **Expected:** Each such label names the signed-in person, kept to one line
- **Do:** Append "[signed in as Name]" (or replace the [source] note where the line is full)
- **Proved fixed when:** Every label of a sheet not signed in as Sam Jordan names the person

### AF-020 · Minor · CT4

- **Where:** File-wide · status chips (Sales / Status chip 11:22)
- **Rule:** CT4: one tone per state word
- **Found:** Unchanged is Success 16 times and Grey 9; Not acknowledged Info (WL06) and Warning (TR09, TR11, TB08); Received Success and Neutral; To confirm Warning and Neutral; Not saved Danger and Neutral (PS10); Sent Info but "Sent 08:56" Success; Required Danger (finding severity) and Warning (verification); Retest pending Info against Test pending Warning
- **Expected:** One tone per word, taken from ST01, and one table across files (AC-26)
- **Do:** Apply ST01's tone to each word and split words that carry two meanings
- **Proved fixed when:** A chip scan lists one tone per word

### AF-021 · Minor · CT2

- **Where:** EN-01, Interaction states, Administration · 58:832 to 58:931 (12), 20:8230, 20:9043, 21:6628, 60:2272, 60:2522, 18:1980
- **Rule:** CT2: paints bound to the PPO colour variables
- **Found:** 18 unbound paints: 12 hover and pressed overlays on ST01 (#242a37 at 8 % and 16 %), 5 dialog scrims (#242a37 at 32 %) and 1 divider (#ffffff at 24 %). The file's accent/estimating-ink is #1f8a7e (3.65:1 on its surface); the Shell's is #156e64 (5.29:1)
- **Expected:** Overlays and scrims bound to a variable; accent/estimating-ink equal to the Shell's value
- **Do:** Bind the 18 paints (a scrim token at Library adoption, as Shell SR-21 proposes) and set accent/estimating-ink to #156e64
- **Proved fixed when:** A paint scan finds no unbound solid paint outside annotation, and the variable values equal the Shell's

### AF-022 · Minor · CT3

- **Where:** EN-01, EN-08, Insights · 21:7202, 53:6240, 14:556, 18:2577, 54:8, 55:984, 55:1234
- **Rule:** Shell C6: Roboto 11/12/13/14/16/20; 10 px only for badge numerals and avatar initials (Shell review Q-C)
- **Found:** 15 px phone card titles and test rows (PH01, PH15), a 17 px title in the local Phone / Header · compact, an 18 px count (PH01) and 22 px KPI values from the Sales KPI tile (WL06, IS01, TB16, PH19). 10 px appears only in avatar initials and badge counts
- **Expected:** Sizes on the C6 scale (16 px for phone titles and rows, 20 px for KPI values) or a recorded exception
- **Do:** Move the 15, 17 and 18 px texts to 16 px and the KPI values to 20 px, or record the KPI tile as an exception with the Sales kit
- **Proved fixed when:** A size histogram shows only 10 (badges and initials), 11, 12, 13, 14, 16 and 20 px outside annotation

### AF-023 · Minor · SH3

- **Where:** Dialogs and panels on every scope page · for example 18:3000, 20:5682, 20:6541, 46:3057
- **Rule:** Shell R45 and R67: a 432 px panel plus the 48 px tab column; Library drawer decision (11 Nov 2026): drawer/standard 480 px, drawer/narrow 360 px for filters and columns
- **Found:** Form, filter and column panels are 432 px; CR08's "Panel · Confirm handovers" is 560 px, neither width
- **Expected:** The width Dean confirms (Q1); CR08 on the same scale
- **Do:** Change nothing until Q1 is answered; then apply one width table, CR08 included
- **Proved fixed when:** Every panel matches the agreed width table
- **Owner note:** Dean (Q1)

### AF-024 · Minor · CT1, CT5

- **Where:** Shell and kit · 11:2, 8:2, 13:7
- **Rule:** CT1 shared component names; CT5 the Library as the shared home
- **Found:** The kit keeps the Sales names (Sales / Status chip, Button, Avatar, Checkbox, Filter chip, Tab, KPI tile); phone chrome is local (Phone / Header · compact, Phone / Tab bar · Engineering, Phone / Status bar); panels and dialogs are frames; 12 icons beyond the Shell's 101 (circle, circle-x, circle-alert, circle-dot, arrow-right, arrow-up-right, upload, link, camera, hash, flag, git-compare). The Library has Controls / Chip, Button, Avatar, Checkbox, Filter chip, Tab, Dialog, Drawer, Phone / Header, Tab bar, Status line, Sheet and Action bar
- **Expected:** Library components once Dean adopts the Library; the extra icons added to the Shell or Library set
- **Do:** Map each local part to its Library component at adoption and propose the 12 icons to the Shell owner
- **Proved fixed when:** No Sales / or local Phone / names remain after adoption
- **Owner note:** Engineering, at Library adoption

### AF-025 · Minor · SH7, GV1

- **Where:** Shell and kit; Read me · 13:6, 78:2
- **Rule:** Named-version build handoff rule 5: cite the latest named version
- **Found:** The kit section and Read me cite "PPO - Shell, accepted 8 November 2026; record header toolbar accepted 9 November 2026". The Shell's later named versions are 10 Nov (record header toolbar) and 12 Nov (primary action contrast), and the navy primary awaits its named version. The Shell now holds component sets (Top bar with a Width property, Workspace flyout, Workspace menu · docked, Rail · expanded, Right drawer · open) where this file copied single components
- **Expected:** The kit section, Read me and record cite the Shell's latest named version, and the copies follow its component sets
- **Do:** After Dean saves the next Shell named version, re-copy the top bar, flyout, docked menu and toolbar sets and cite that version
- **Proved fixed when:** The kit section names the latest Shell named version

### AF-027 · Polish · SH4

- **Where:** Shell and kit · 13:1142
- **Rule:** R114: Recent rows drop the kind word when a SYN- reference states the type
- **Found:** Recent rows read "Package SYN-ENG-000714 · 12 min", "Drawing SYN-DWG-000318 · 1 h", "Technical query SYN-TQ-000018 · 2 h", "Change SYN-ECR-000014 · Yesterday", "Commissioning SYN-CMS-000012 · Yesterday"
- **Expected:** "SYN-ENG-000714 · 12 min" and so on
- **Do:** Drop the kind word from the five rows
- **Proved fixed when:** Recent second lines start with the reference

### AF-028 · Polish · GV1

- **Where:** Read me · 78:2
- **Rule:** Record the name Figma shows
- **Found:** The Read me header and record A1 say "PPO - Engineering module (proposal)"; Dean's link of 13 Nov names the file "PPO - Engineering module"
- **Expected:** The header and record use the current name
- **Do:** Confirm the name and align the header and record
- **Proved fixed when:** Names agree
- **Owner note:** Engineering; Repository

### AF-029 · Polish · CT1

- **Where:** Shell and kit · 14:528
- **Rule:** SH1: local copies equal the Shell components
- **Found:** The local toolbar names every primary layer "Button · Primary"; the Shell names them by wording ("Button · Submit for approval", "Approve…", "Issue & send", "Record response")
- **Expected:** Layer names as the Shell's
- **Do:** Resolved by the re-copy in AF-025
- **Proved fixed when:** Layer names match

### AF-030 · Polish · CV

- **Where:** Engineering package · EN-01 · 25:1103 (chips I25:1513;11:7, I25:1521;11:7, I25:1529;11:7)
- **Rule:** Chips carry clear words (ST01)
- **Found:** PK05's "what would un-release it" trace uses a Success chip reading "Not so" (four times)
- **Expected:** A plain state word, such as "No change"
- **Do:** Replace the chip word
- **Proved fixed when:** No "Not so" chip remains

### AF-031 · Polish · CV4

- **Where:** Insights · RP-03 notes · 68:1251, 68:1272
- **Rule:** Dates as "Sun 1 Nov 2026"
- **Found:** Notes write "accepted 1 November 2026"
- **Expected:** "accepted Sun 1 Nov 2026"
- **Do:** Use the short date style
- **Proved fixed when:** No long-form date in notes
### Not for this file

- **AF-003:** the Service file labels RV22 as a later moment and copies the four obligation names and descriptions from CM12. The Customers, Sites & Equipment file labels EQ10 as a later moment and agrees one configuration identity with CM08. Both follow Dean's answer to Q8.
- **AF-004:** if Dean answers Q2 as recommended, the Supply file changes MD02's origin to r03 and this file changes nothing.
- **AF-012:** the Customers, Sites & Equipment file fixes the EQ-09 family and number form first. This file then follows it, as its item above says.
- **AF-026, and the record row in AF-007:** repository corrections, in their own change.
- **AF-032, AF-033 and AF-034:** the Shell file's owner, under a new Shell named version, alongside pull request 946.

### After the batch

- Re-run the structural pass (sections, grid, labels, overlap, children inside sheets) and the text scans (people, references, revisions, instruments, pronouns, zones, tones, story clock).
- Update the repository record in its own change. The sheet inventory is unchanged unless sheets are added; correct the sources, A1, A11, A13 and A17, and the assumptions Q2, Q4 and Q5 settle.
- This file is a proposal, so no acceptance is affected. Ask Dean to save a new named version that pins the aligned state.
