---
document_id: PPO-SUPPLY-FIGMA-ALIGNMENT-AUDIT
date: 2026-11-13
owner: Dean Fiedler
status: Audit findings, 2026-11-13; no design is changed and nothing is accepted by this record; read-only in Figma; no application code, route, migration, permission or integration; every record shown is synthetic
source_commit: 707b21cce42393433b90fbfa84a9aa850834db13
versioning: git
---

# Supply module Figma alignment audit

**Owner:** Dean Fiedler · **Date:** 13 November 2026 · **Status:** Audit findings. Nothing in any Figma file was edited, moved, renamed, commented on or versioned. The fixes are delivered as one alignment batch (Appendix A) for the next Supply build session to apply.

On 13 November 2026 Dean asked for an audit of the Supply module's Figma page set, with the cross-file alignment audit prompt and the V3 read-only conformance audit of 10 November 2026 as supporting material, and the PPO - Library file available for reference. This record applies that prompt's checks (its section 4) to one file, "PPO - Supply module (proposal)", recorded in [PPO-SUPPLY-REFINED-FIGMA-PROP](supply-module-refined-ui-proposal.md). Dean's standing instruction applied: proceed on the most professional defaults, so the prompt's questions were answered by their defaults (read-only; findings of every severity; Library read for reference only).

Four statements stay separate: what was audited (sections 1, 2 and 6), what is misaligned (sections 3 and 4), what only Dean can decide (section 5), and what this audit did not change (no Figma file, no other record, no code).

## 1. Scope and sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Supply module (proposal)" (the link Dean shared names it "PPO - Supply module"; AF-027), no named version saved | Audited in full: Read me, 15 scope pages, 233 sheets, 15 notes cards, the Shell and kit page, both separators and Scratch |
| Private Figma file "PPO - Shell (accepted)", named version "Shell refined concept — accepted · record header toolbar" (10 November 2026) | Authority: the Supply chain flyout and docked menus on the workspace menus page, the top bar, rail, right strip, collapsed strip and record header components, compared with the Supply file's copies |
| Private Figma file "PPO - Engineering module (proposal)", sheet CR02 (SYN-ECR-000014) | One handover pair |
| Private Figma file "PPO - Customer portal module", sheet QA06 (Block C orders and deliveries) | One handover pair |
| Private Figma file "PPO - Library" (not published) | Page list, Controls components and variable collections, for component names and drawer widths |
| [Shell rules R1 to R125](../design/development/systems/shell-refined-concept-rules.md); [named-version build handoff](figma-named-version-build-handoff.md); [Library drawer widths](library-drawer-widths.md); [Sales module record](sales-module-refined-ui-proposal.md) A5; [Inventory design](inventory-figma-design.md) R4 | Rules applied |
| The Engineering, Finance, Projects, Reporting, Customer portal, Shared records, My Work, Service and Settings refined-UI records on `main` | Addendum A3 facts as those records apply them |
| `src/supply/navigation.ts` | The Returns page's own views (R108) |

Addenda A1, A2 and A3 were not supplied as text in this session. A1 is read as Shell rules R116 to R125, A2 as the short reference form with two-digit revisions, and A3 through the records above that cite it. Figma links and file keys are not recorded ([ADR-0050](ADR-0050-font-awesome-light-icons.md), [ADR-0053](ADR-0053-figma-page-design.md)); node IDs are the Supply record's own.

## 2. Method

- **Extraction.** One read-only script per scope page walked each section and sheet and returned only exceptions: section order, gaps and padding; sheet grid positions; label text, width and line count; overlaps at section level; children outside a sheet; shell instances and their main components; unbound paints; font families and sizes; status-chip words and tones; and every visible text node tested for earlier fixtures, gendered pronouns, ISO and numeric dates, wrong weekday-date pairs, zones, money, short references, revision labels, watched words, US spellings, events after the story clock and count wording. The fifteen pages ran in five calls.
- **Follow-ups.** Record-header toolbar text on 12 record sheets; the header, sticky bar and buttons of 21 phone sheets; the signed-in person on every sheet; the labels of later-moment sheets; the Block C dispatch text; unbound paints located by node; component fingerprints in both files; a pixel comparison of the top bar and rail against the Shell; one screenshot of PH07.
- **Analysis.** Node IDs compared with the record's inventory by script; facts compared with the Engineering and portal sheets and the records above; findings held in one data file that generates the register, the matrix and the batch.
- **Budget.** 27 Figma calls (three extractions were refused for returning more than 48 KB and re-run in compact form; nothing was changed). No call timed out.

Severity follows the prompt: Blocker (an accepted file departs, a customer sheet exposes an internal fact, a record carries a Figma link, or two files own one page), Major (a shared fact, component, tone, family or handover differs; a shell part is redrawn; an unrecorded shell departure), Minor (a convention drifts without changing meaning), Polish. The Supply file is a proposal, so no finding is a Blocker.

## 3. Results

**Headline.** The file's structure is sound and fully traceable: all 233 sheets and 15 notes cards sit on the template grid with matching labels, no overlap and nothing loose, and every node ID in the record resolves to the same sheet code. Colour binding is near complete (17 unbound paints of about 38,000), Roboto is the only family, no weekday-date pair is wrong, no US spelling was found, and the desktop shell is entirely instanced, with the docked menu and flyout matching the accepted Shell word for word. The misalignments sit in four places: people and facts shared with other files, phone record pages, convention drift (tones, zones, revisions, labels), and citation of the Shell's latest version.

| Severity | Count | Supply file | Shell | Dean |
|---|---|---|---|---|
| Major | 8 | 8 | 0 | 0 |
| Minor | 17 | 15 | 1 (AF-023, with Supply) | 1 (AF-025) |
| Polish | 6 | 4 | 2 | 0 |
| **Total** | **31** | **27** | **3** | **1** |

Alignment matrix in summary (`Pass`, `Fail`, `Not checked`, `Not applicable`):

| Area | Checks |
|---|---|
| Structure | ST1 to ST5 Pass |
| Shell | SH2, SH4, SH5 Pass; SH3 Pass with an authority conflict; SH1, SH6, SH7 Fail |
| Components and tokens | CT3 Pass; CT1, CT2, CT4, CT5 Fail |
| Conventions | CV1, CV7, CV8 Pass; CV5 Pass, partly checked; CV2 Not checked; CV3, CV4, CV6 Fail |
| People and story | FA2, FA3, FA4, FA5, FA7 Fail; FA6 Not checked |
| Handovers | Projects to Supply Pass; Engineering, Customer portal, Reporting and Finance pairs Fail; Documents & messages, Estimating, My Work, Service and Products pairs Not checked; HO2 Pass, partly checked; HO3 Fail |
| Accessibility | RA1 Pass; RA2 Not checked; RA3 Fail |
| Governance | GV2, GV4 Pass; GV1 Fail; GV3 Not applicable |
| Customer exposure | EX1 Not applicable |

## 4. Findings

The eight Majors are given in full in Appendix A, with the node IDs, the expected text and the check that proves each fixed.

| ID | Severity | Check | Finding | Fix owner |
|---|---|---|---|---|
| AF-001 | Major | FA2 | Kim Patel, who does not exist under A3, is named about 30 times (engineer, asked checker, change author, two signed-in sheets, the Read me persona list) | Supply |
| AF-002 | Major | FA3 | Supplier claims use SYN-CLM- (the progress-claim family); A3 and the Finance file use SYN-SCL-, and Finance has SYN-SCL-000320 "Submitted Tue 3 Nov" where Supply has SYN-CLM-000320 "Open" | Supply |
| AF-003 | Major | HO1 | SYN-DSP-000061 differs from the portal: sent Wed 4 Nov against Mon 2 Nov; kits Mon 9 Nov against Wed 11 Nov; delay notice waiting at 09:12 against sent at 09:14; no zone against AEST | Supply (Q3) |
| AF-004 | Major | HO1 | The SYN-ECR-000014 source line differs from the Engineering sheet: Kim Patel against Alex Lee; "v2" against "Version 2"; "×2" not on the Engineering sheet | Supply |
| AF-005 | Major | HO1 | Robin Hale's Finance-trust sections read "Restricted"; the Reporting record (A3.7) reads "Withheld" for no figures and no counts (checked through the record only) | Supply |
| AF-006 | Major | SH1, SH6 | Phone record pages PH07, PH14, PH16 draw their header and sticky bar as frames instead of instancing the copied phone toolbar component, which no sheet uses | Supply |
| AF-007 | Major | FA7 | Gendered pronouns on IS04, RC04, MC08 and the RT11 label, and in this file's record rows RT11, IS04 and A10 | Supply; Repository |
| AF-008 | Major | RA3 | Phone sticky-bar and header buttons are 32 to 34 px high on 14 sheets, against 48 px phone targets | Supply |
| AF-009 | Minor | CT4 | Twelve state words carry more than one tone (Unknown, Open, Late, Sent, Received, Proposed, Incoming, Held, Short 1, Picking, Acknowledged, Expected) | Supply (Q5) |
| AF-010 | Minor | SH7, GV1 | The kit section, ST01 and the record cite the toolbar as a proposal with rules R1 to R10, not the 10 November named version and R116 to R125 | Supply; Repository |
| AF-011 | Minor | FA5 | DL10 (09:12), MC05 (09:20), MC09 (Fri 6 Nov) and an ST01 example (Fri 13 Nov) show later events without a later-moment label | Supply |
| AF-012 | Minor | FA4, ST3 | 34 sheets show another signed-in person without naming them in the label; the Read me says they are named | Supply |
| AF-013 | Minor | FA6, SH4 | The rail reads "My Work 4" (the Shell's count for Dean Fiedler) on every sheet whoever is signed in | Supply |
| AF-014 | Minor | CV4 | Only four sheets state a zone; Block C times state none | Supply |
| AF-015 | Minor | CV6 | Revision labels "r1", "revision 5", "v2" and "reversal R1" instead of two-digit "r01" | Supply |
| AF-016 | Minor | CV6, FA3 | MYOB order numbers are bare ("PO-004871") while other MYOB documents read back as SYN-, and PO serves both the PPO record and the MYOB document | Supply (Q4) |
| AF-017 | Minor | CV6 | Inventory items use SYN-ITEM-DP25 and similar codes, outside A2 and assumption A12 | Supply (Q4) |
| AF-018 | Minor | CV3 | IV01 footer "84 shown · limit 100 · 184 items in all" claims a total on a bounded read | Supply |
| AF-019 | Minor | CT2 | 14 dialog scrims and 3 badge fills are unbound | Supply |
| AF-020 | Minor | Dialogs | X06 and AS01 are 520 px dialogs, below the accepted 560 to 720 px; the Page template card says 520 | Supply |
| AF-021 | Minor | SH6 | Phone headers carry a ⋮ menu; R118 requires a labelled Actions menu | Supply |
| AF-022 | Minor | SH6 | No-action toolbars on PU04, IV03, DL08 and MS03 do not start with "Read only" (R117) | Supply |
| AF-023 | Minor | CT1 | Toolbar variants named for quotation states are chosen by look (Draft on an At-risk demand; Closed on a Partly-received order) | Shell, then Supply |
| AF-024 | Minor | CT1, CT5 | Kit under Sales names and local phone chrome; panels and dialogs drawn as frames where the Library has Controls / Drawer and Controls / Dialog | Supply, at Library adoption |
| AF-025 | Minor | SH3 | Form panels are 432 px (Shell R45, R67); the Library decision sets 360, 480, 640 and 800 px | Dean (Q1) |
| AF-026 | Polish | SH4 | No Returns sheet shows the docked menu with the page's own views nested (R108 names Returns) | Supply |
| AF-027 | Polish | GV1 | The Read me header and record say "(proposal)"; the shared link names the file "PPO - Supply module" | Supply; Repository |
| AF-028 | Polish | SH1, CT5 | Shell copies are rebuilt with fewer layers; pixel comparison shows no visible difference | Supply, at Library adoption |
| AF-029 | Polish | CV4 | Notes prose uses long-form dates | Supply |
| AF-030 | Polish | GV1 | The Shell's workspace-menus header still reads "Proposal, 8 November 2026" | Shell |
| AF-031 | Polish | CV6 | The Shell flyout's Recent rows ("PO-000318", "SH-0091", "RA-0007") are not in A2 form | Shell |

The facts that differ, with both values and both places, are listed below (ledger difference).

| Fact | Supply | Other file or record |
|---|---|---|
| Owner of SYN-ECR-000014 | Kim Patel | Alex Lee (Engineering CR02) |
| Version wording | v2 | Version 2, Mon 2 Nov 2026, 15:40 (Engineering) |
| SYN-DSP-000061 first part sent | Wed 4 Nov | Mon 2 Nov 2026 (portal QA06) |
| Kits' new date | Mon 9 Nov | Wed 11 Nov 2026 (portal) |
| Delay notice | Prepared 09:12, waiting for Morgan Lee | Told by email at 09:14 (portal) |
| Block C zone | None | AEST (portal) |
| Supplier claim family | SYN-CLM- | SYN-SCL- (Finance) |
| Claim …-000320 | Carton damage, Open | To SYN Drive Systems, Submitted Tue 3 Nov (Finance) |
| Robin Hale's Finance-trust state | Restricted | Withheld (Reporting) |

Agreed across files: SYNC-4471-3102, 14 items and 6 kits for SYN-DSP-000061; Sam Okafor at Block C; SYN-IMP-000031 as the Supply review Engineering names; Glasshouse 4 (SYN-PRJ-000024) belongs to Hillview Growers; Block C is SYN-PRJ-000027; Robin Hale's REP-09, KPI-10 and REP-10 with Avery Lin; Mei Tran; Hillview in Melbourne time. Earlier Design-page references (SYN-PPO-, DP25-88412, SYN-SHP-000007) appear only in notes that name them as earlier.

## 5. Authority conflicts and questions for Dean

| # | Question | Readings | Recommendation |
|---|---|---|---|
| Q1 | Drawer width for Supply's form, filter and column panels (AF-025) | Shell R45 and R67: a 432 px panel beside the 48 px tab column, 480 px in all. Library decision of 11 November: `drawer/standard` 480 px, `drawer/narrow` 360 px for filters and columns | The Library decision is later and owner-made, but it reads R98's 480 px as the panel. Confirm whether 480 px is the panel or the panel with its tab column; until then keep 432 px and change nothing |
| Q2 | Who replaces Kim Patel (AF-001) | Change owner: Alex Lee, as the Engineering file draws SYN-ECR-000014. Independent configuration checker for the controller (KC04 to KC06, KC08, MS04): A3's engineer, not found in the records read | Alex Lee for the change; for the checker, the engineer A3 names, or Sam Jordan (the Engineering file's signed-in engineer) if A3 names none |
| Q3 | Which Block C dates are the truth (AF-003) | Portal QA06 (12 November record, applies A3.11): sent Mon 2 Nov, kits Wed 11 Nov, told by email at 09:14. Supply (10 November): Wed 4 Nov, Mon 9 Nov, notice waiting | Align Supply to the portal and A3.11, and draw DL10 as a labelled later moment in which the notice is sent at 09:14 by the named sender |
| Q4 | Reference form for MYOB order numbers and inventory items (AF-016, AF-017) | Bare "PO-004871" beside SYN-PR-, SYN-MI-, SYN-TR-; SYN-ITEM- codes | Read every MYOB document back in one SYN- form with a type that does not reuse the PPO record's type, and take item identity from the Products catalogue (A3.13); record both in the file's assumptions |
| Q5 | Tones shared across files (AF-009) | Supply draws MYOB "Sent" as Info, because Posted is the final state; the prompt's example has "Sent" as Success | Keep Sent as Info for the five-state MYOB ledger and Success only for final states; split "Unknown" (quantity, Grey) from "Outcome unknown" (send state, Warning); fix the table once in the Library |

Also for Dean, without a recommendation to change: "SYN Priva distributor" and the Shell's "Priva pumps" Recent row use a real manufacturer's name inside synthetic data.

## 6. Not checked and limits

- **Addenda.** A1 to A3 were not supplied as text; A3 facts come from records that cite it, so an A3 fact no record repeats was not tested (for example Robin Hale's A3.8 My Work total and the people list: Lee Nguyen, Ella Novak and Casey Ng appear in no other record).
- **Other files.** Documents & messages (M1, M2), Estimating (quotation conversion), My Work, Service (Casey Ward's day), Products, Settings (ownership of the Supply settings pages) and the Reporting file itself were not read. Only one Engineering sheet and one portal sheet were read.
- **Visual and interactive.** CV2 (one line per cell) and RA2 (contrast) rely on the file's own audit of 10 November; one sheet was screenshotted; no prototype, keyboard, screen-reader or zoom review.
- **Version history.** Not readable through the tools; no named version of the Supply file has been recorded.
- **GST basis.** Not verified on Finance-reader credit and order-value columns.

## 7. Next steps

1. Dean saves the named version "Supply module · refined UI pages — proposal (10 November 2026)", so the batch is a difference from a pinned state.
2. Dean answers Q1 to Q5.
3. The next Supply build session applies Appendix A in order, re-runs the structural pass and text scans, and asks Dean to save a new named version.
4. Repository corrections, each its own later change: the Supply record's pronoun rows (RT11, IS04, A10), sources and A5 (toolbar accepted 9 November, named version 10 November), A1 (file name) and the assumptions Q4 settles.
5. The Shell's owner: structural toolbar variant names (AF-023), the stale workspace-menus header (AF-030) and the Recent references (AF-031), under a new Shell named version.
6. A cross-file audit of the other module files, using the prompt in full, to close the Not-checked pairs.

## Appendix A · Alignment batch · PPO - Supply module (proposal)

From the read-only alignment audit of 13 November 2026 (this record). Apply in this order. Node IDs are in this file unless another file is named; most are sheet frames, and the rest are named (section, component or layer). Change nothing else.

Before you start: ask Dean to save the named version "Supply module · refined UI pages — proposal (10 November 2026)" so this batch is a difference from a pinned state. Settle Q1 to Q5 of the record first where an item depends on them.

### AF-001 · Major · FA2

- **Where:** Read me; Material demand · SC-01; Kitting and controllers · CX-02; Material change impact · SC-09 · 76:517, 33:2187, 35:5188, 35:6297, 43:1075, 43:2025, 43:2465, 43:2974, 43:4152, 51:1028, 51:1545, 51:2882, 51:3976, 51:4403, 51:4863, 51:5668
- **Rule:** Addendum A3 earlier-fixture list (audit prompt FA2): Kim Patel does not exist
- **Found:** Kim Patel named about 30 times: the engineer on MS01, MS04 (signed in), MD02; the asked checker on KC02, KC04, KC05, KC06 (signed in), KC08; the source author on MC02, MC04, MC05, MC08, MC09, MC10, PH16; the Read me header persona list
- **Expected:** No sheet, label or card names Kim Patel. The change owner of SYN-ECR-000014 reads Alex Lee, as the Engineering file draws it (CR02 44:657: "Raised Mon 2 Nov 2026 by Alex Lee"); the independent configuration checker is the engineer A3 names
- **Do:** Replace every "Kim Patel" (and the KP avatar and top-bar name on MS04 and KC06) with the A3 person for that role: Alex Lee as SYN-ECR-000014 owner; the configuration checker as Dean confirms (Q2)
- **Proved fixed when:** A text scan of all 15 scope pages and the Read me finds no "Kim Patel" and no "KP" avatar

### AF-002 · Major · FA3

- **Where:** Receiving · SC-04; Returns and claims · SC-08; Insights · RP-05 · 22:1312, 24:1014, 24:1483, 26:2920, 49:1015, 49:1420, 49:2299, 50:1673, 50:3127, 50:3503, 50:3879, 50:4292, 50:4693, 58:517, 58:2483, 58:3279, 58:3977, 58:4745, 30:6330
- **Rule:** A3 reference families (as the Finance and Projects records apply them): supplier claims are SYN-SCL-; SYN-CLM- is the progress-claim family
- **Found:** Supplier claims drawn as SYN-CLM-000305, 000311, 000318, 000319, 000320; SYN-CLM-000320 is a carton-damage claim on SYN-RCT-000081 shown "Open", while the Finance record has SYN-SCL-000320 to SYN Drive Systems "Submitted Tue 3 Nov"
- **Expected:** Supplier claims read SYN-SCL-000305, -000311, -000318, -000319, -000320. SYN-SCL-000320 tells the same story as the Finance file (claim to SYN Drive Systems, Submitted Tue 3 Nov) or the difference is resolved with Finance
- **Do:** Renumber every supplier claim from SYN-CLM- to SYN-SCL- with the same number, and reconcile SYN-SCL-000320 subject and state with the Finance file
- **Proved fixed when:** No "SYN-CLM-" text remains in the Supply file; SYN-SCL-000320 reads the same in both files

### AF-003 · Major · HO1

- **Where:** Dispatch and delivery · SC-06 · SC-07 · 46:2322, 47:4425, 47:4014, 47:5636, 47:6469 (portal file QA06 28:1886)
- **Rule:** HO1: the sending file shows what the receiving file shows it receives (same record, date, words, time); A3.11 portal story; CV4 site zone (Block C, AEST)
- **Found:** Supply: the valves and trays "left us on Wed 4 Nov" (X17 draft; DL12 "as it stood Wed 4 Nov 2026, 14:31"); kits moved "from Fri 6 Nov to Mon 9 Nov" (DL10, X17, PH14); the delay notice "prepared at 09:12; it waits in Customer messages for Morgan Lee to send" (DL10); no zone on any Block C time. Agreed: SYNC-4471-3102, 14 items, 6 kits, no proof of delivery yet
- **Expected:** SYN-DSP-000061 agrees with the Customer portal sheet QA06: first part sent Mon 2 Nov 2026; the 6 kits now expected Wed 11 Nov 2026; the customer was told by email at 09:14; times at Block C stated in AEST
- **Do:** Align DL07, DL10, DL12, X17 and PH14 to the portal dates and notice time, mark DL10 as a later moment, and state AEST once on each Block C sheet
- **Proved fixed when:** The dates, the 09:14 notice and the zone read the same on DL07, DL10, X17, PH14 and portal QA06

### AF-004 · Major · HO1

- **Where:** Material demand · SC-01; Material change impact · SC-09 · 35:5188, 51:1028, 51:1545, 51:2882, 51:3976, 51:4403, 51:4863, 51:5314, 51:5668 (Engineering file CR02 44:657)
- **Rule:** HO1 Engineering change review to Supply material change impact; Addendum A2 revision form
- **Found:** "Source SYN-ECR-000014 v2 · Kim Patel · Contactor 18 A → 25 A ×2 · Opened Tue 3 Nov 2026, 14:10"; MC09 draws a later "v3 · 25 A → 32 A ×2"; the quantity ×2 does not appear on the Engineering sheet
- **Expected:** The source line of SYN-IMP-000031 repeats the Engineering record: SYN-ECR-000014, version 2 of Mon 2 Nov 2026, 15:40, owner Alex Lee, K3 contactor for screen drive 3, 18 A to 25 A, with the quantity Engineering states
- **Do:** Rewrite the source line on the nine sheets from the Engineering record (owner, version wording, scope, quantity) and keep MC09 as a labelled later moment
- **Proved fixed when:** The source line on MC02 and CR02 carry the same owner, version, scope and quantity

### AF-005 · Major · HO1

- **Where:** Insights · RP-05; Returns and claims · SC-08 · 58:3279, 50:4292
- **Rule:** A3.7 as the Reporting record applies it: Robin Hale reads Finance trust as "Withheld" (no figures, no counts); "Counted" is the other restricted state
- **Found:** IS04 label and sheet: "sections she may not read show Restricted and no figures, not even counts"; the record (A10) says RT13 and IS04 show "Restricted"
- **Expected:** IS04 (and RT13 where it shows the same state) uses the word "Withheld" for sections Robin Hale may not read
- **Do:** Use "Withheld" for the no-figures, no-counts state on IS04 and RT13 and in the ST01 chip legend if listed
- **Proved fixed when:** The same state reads "Withheld" in Supply and in the Reporting file

### AF-006 · Major · SH1, SH6

- **Where:** Purchasing · SC-02; Dispatch and delivery · SC-06 · SC-07; Material change impact · SC-09 · 37:8046, 47:6469, 51:5668 (local component 18:1042; Shell 170:10215)
- **Rule:** R116, R124: the phone record page uses the accepted component Shell / Record header · toolbar · phone with the sticky bar (Actions and the primary); SH1 shell parts are instances
- **Found:** A drawn FRAME "Phone / Record header" (390 × 48: back arrow, title, star, ⋮) and a drawn FRAME "Sticky action bar" (390 × 58). The copied component 18:1042 is not used on any sheet; the record says the phone variant was adopted
- **Expected:** PH07 (SYN-REQ-000040), PH14 (SYN-DSP-000061) and PH16 (SYN-IMP-000031) use instances of the copied component 18:1042: title with state, "n of N" or revision line, labelled Actions and one primary
- **Do:** Replace the drawn header and sticky bar on the three phone record pages with instances of 18:1042, overriding text only
- **Proved fixed when:** Each of the three sheets contains an INSTANCE of Shell / Record header · toolbar · phone and no FRAME named "Phone / Record header"

### AF-007 · Major · FA7

- **Where:** Insights · RP-05; Receiving · SC-04; Material change impact · SC-09; Returns and claims · SC-08 · 58:3279, 24:1014, 51:3976, 50:3879
- **Rule:** Dean's standing instruction 4: names or they/them for people, never gendered pronouns
- **Found:** IS04 sheet "on her own claims" and label "sections she may not read"; RC04 "Casey Ng cannot: she recorded the quarantine"; MC08 "He has not acknowledged … his My Work … speak to him"; RT11 label "amounts on her own claim". Repository record rows RT11 and IS04 and assumption A10 carry "her"/"she"
- **Expected:** No gendered pronoun for a synthetic person in any sheet, label or record row
- **Do:** Rewrite with the name or "they/their" (for example "Casey Ng cannot: Casey Ng recorded the quarantine"; "They have not acknowledged … their My Work")
- **Proved fixed when:** A whole-word scan for he, she, him, her, his, hers finds none in the Supply file or in the Supply record (quotations of the defect in the audit record excepted)

### AF-008 · Major · RA3

- **Where:** Every scope page with phone forms and records · 30:6211, 37:8046, 41:7534, 43:5362, 45:5229, 45:5341, 47:6369, 47:6469, 50:5042, 51:5668, 53:5417, 53:5536, 67:5551, 69:5401
- **Rule:** RA3: 48 px targets on phones; the file's own rule "48 px options"
- **Found:** Sticky-bar buttons 32 to 34 px high (PH07 "Return…" 74 × 32, "Approve" 240 × 32; PH14 "Actions" 91 × 32; PH01 "Save count" 250 × 34); header back and ⋮ buttons 32 × 32 on 14 phone sheets
- **Expected:** Sticky-bar buttons and header icon buttons are at least 48 px high (or show a 48 px hit area)
- **Do:** Raise phone sticky-bar buttons to 48 px (bar 64 px with 8 px padding) and give header icon buttons a 48 × 48 hit area
- **Proved fixed when:** No button on a phone sheet is shorter than 48 px, or each carries a 48 px hit-area frame

### AF-009 · Minor · CT4

- **Where:** File-wide · status chips on every page (Sales / Status chip)
- **Rule:** CT4: one tone per state word
- **Found:** Twelve words carry two or three tones: Unknown Grey (quantities) and Warning (send state); Open Neutral and Warning; Late Danger and Warning; Sent Info and Success; Received Success and Neutral; Proposed Info and Warning; Incoming Warning and Info; Held Neutral, Warning and Tint; Short 1 Warning and Danger; Picking Info and Neutral; Acknowledged Neutral and Success; Expected Neutral and Warning (ST01 itself shows Expected as Warning)
- **Expected:** Each word has one tone in the file (and across files)
- **Do:** Fix one tone per word from ST01 and apply it; give the two meanings of Unknown two words ("Unknown" quantity, "Outcome unknown" send state)
- **Proved fixed when:** A chip scan lists one tone per word

### AF-010 · Minor · SH7, GV1

- **Where:** Shell and kit; Interaction states · SC · 18:775, 63:517
- **Rule:** Named-version build handoff rule 5; Shell named version "Shell refined concept — accepted · record header toolbar" (10 Nov 2026); toolbar rules R116 to R125
- **Found:** Kit section label "Record header toolbar (copied from PPO - Shell, proposal …)"; ST01 "shared toolbar, rules R1 to R10"; record sources cite the 8 November version and A5 calls the toolbar a proposal
- **Expected:** The kit section, ST01 and the record cite the 10 November named version and rules R116 to R125
- **Do:** Relabel the kit section and ST01 text; correct the record sources and A5 in a later change
- **Proved fixed when:** No "proposal" or "R1 to R10" wording remains for the toolbar

### AF-011 · Minor · FA5

- **Where:** Dispatch and delivery; Material change impact; Interaction states · 47:4425, 51:2882, 51:4403, 63:517
- **Rule:** FA5: the story stands at Thu 5 Nov 2026, 09:00 AEDT; a later event is a labelled later frame
- **Found:** DL10 shows the notice prepared at 09:12; MC05 shows "PPO allocation released · Thu 5 Nov 2026, 09:20"; MC09 is "as at Fri 6 Nov"; ST01 shows "Morgan Lee saved Fri 13 Nov at 09:02"; none of their labels says so
- **Expected:** Labels say "(as it stood …)" or "(a later moment, …)" as WB08, KC09, BT09 and DL12 already do
- **Do:** Add the moment to each label (or move the ST01 example inside the story clock)
- **Proved fixed when:** Every sheet showing a time after 09:00 on Thu 5 Nov names that moment in its label

### AF-012 · Minor · FA4, ST3

- **Where:** Ten scope pages · 34:3246, 35:6297, 36:1176, 37:3860, 37:4719, 37:6472, 28:3930, 28:5476, 59:2140, 58:2483, 58:3977, 40:2728, 41:5742, 41:2391, 41:5258, 41:3051, 41:3660, 41:4175, 41:4719, 41:6742, 43:1509, 43:2974, 45:1015, 45:3393, 45:3984, 45:2474, 47:2942, 50:1673, 49:1015, 69:1636, 69:2023, 69:2475, 69:3316, 69:3802
- **Rule:** ST3 label "… [signed in as …]"; the file's Read me: a sheet drawn for another person names them in its label
- **Found:** 34 sheets show another person in the top bar without naming them in the label (for example MD05 Morgan Lee, MS04 and KC06 Kim Patel, PU12 and RT12 Avery Lin, X07 and X09 Quinn Avery, PS06 Jordan Blake, RS01 and X15 Casey Ng, PS03 Lee Nakamura, WB05 and AD07 Drew Collins, X10 and WBS1 Jesse Moore); only PU03, SS06, IS01, IS04 and PH23 name the person
- **Expected:** Every sheet whose top bar shows someone other than Robin Hale names that person in its label
- **Do:** Append "[signed in as Name]" to the 34 labels, keeping each label to one line
- **Proved fixed when:** Every label of a non-Robin sheet contains "signed in as"

### AF-013 · Minor · FA6, SH4

- **Where:** File-wide · 17:153 and every Shell / Rail · collapsed instance
- **Rule:** FA6: each person's counts follow A3.8
- **Found:** The rail reads "My Work 4" on every sheet, the Shell's default for Dean Fiedler, whoever is signed in (Robin Hale, Quinn Avery, Drew Collins, Jesse Moore, Avery Lin and others)
- **Expected:** The rail My Work count is the signed-in person's A3.8 total
- **Do:** Override the rail count per persona from A3.8 (or show no count on persona sheets until set)
- **Proved fixed when:** Rail counts match A3.8 per persona

### AF-014 · Minor · CV4

- **Where:** File-wide; Block C sheets · 22:524, 36:523, 38:523, 46:523; Block C: 46:2322, 47:4425, 47:4014, 47:6469
- **Rule:** CV4: the zone once per list; a site's own zone where it applies (Block C AEST)
- **Found:** A zone appears on four sheets only (IS01, X20, IV03, IV05: AEDT); no register or record list with times states one; Block C times carry none
- **Expected:** Registers and records with times state "AEDT" once; Block C times state "AEST"
- **Do:** Add "Times in AEDT" (or "AEST at Block C") to each list header or as-at line
- **Proved fixed when:** Each list with times shows its zone once

### AF-015 · Minor · CV6

- **Where:** Purchasing; Workshop builds; Material change impact; Receiving; Administration · 36:3436, 37:3195, 51:1545, 40:1156, 40:1708, 41:2391, 41:3660, 41:7167, 69:1636, 26:1977
- **Rule:** Addendum A2: two-digit revisions r01
- **Found:** "Order revision r1", "revision r1", "Revision r1 · Sent"; "WI-FDU-4 revision 5"; "SYN-ECR-000014 v2"; "reversal R1"
- **Expected:** "Order revision r01", "WI-FDU-4 r05" (as the same header already writes "EN-06 r04")
- **Do:** Rewrite revision labels in the two-digit form; keep "version" only for settings versions
- **Proved fixed when:** No r1-style or "revision N" label remains

### AF-016 · Minor · CV6, FA3

- **Where:** Purchasing · SC-02 · 36:1848, 36:2675, 36:3063, 36:3436, 37:7701, 37:3860
- **Rule:** One family per kind; MYOB documents read back in the SYN- form (Finance file practice)
- **Found:** "MYOB purchase order PO-004871" (bare), while MYOB receipts, issues, transfers and dockets read back as SYN-PR-, SYN-MI-, SYN-TR-, SYN-DKT-; the PO type is used for both SYN-PO-000220 (PPO) and PO-004871 (MYOB)
- **Expected:** MYOB purchase order numbers are written in the read-back form the other MYOB documents use, without sharing the PO type with the PPO order record
- **Do:** Apply the form Dean chooses and record it in the assumptions
- **Proved fixed when:** All MYOB documents on Purchasing sheets share one read-back form

### AF-017 · Minor · CV6

- **Where:** Inventory · SC-05 · 31:2152, 31:2592, 32:2648, 32:3039, 32:3384, 32:4680
- **Rule:** Addendum A2 short form; product identity from the Products catalogue (A3.13)
- **Found:** SYN-ITEM-DP25, SYN-ITEM-K25, SYN-ITEM-CTB01, SYN-ITEM-CC8 (not covered by assumption A12)
- **Expected:** Item references in the A2 form, or a recorded exception linked to the Products reference
- **Do:** Use the Products catalogue reference for each item or record the item-code exception in A12
- **Proved fixed when:** Every inventory item reference is A2-form or a recorded exception

### AF-018 · Minor · CV3

- **Where:** Inventory · SC-05 · 31:557
- **Rule:** CV3: a bounded read states "N shown · limit 100" and claims no total (accepted Inventory R4)
- **Found:** "84 shown · limit 100 · 184 items in all · observed Thu 5 Nov 2026"
- **Expected:** "84 shown · limit 100 · observed Thu 5 Nov 2026, 07:30 AEDT"
- **Do:** Remove "184 items in all" unless the read is complete, in which case drop "limit 100"
- **Proved fixed when:** IV01 footer claims no total beside a limit

### AF-019 · Minor · CT2

- **Where:** Six scope pages · scrims on 34:6683, 34:7455, 37:4719, 37:6728, 26:6293, 53:3975, 67:2557, 67:3178, 67:3781, 67:4385, 69:2834, 69:3316, 69:3802, 69:4679; badges 37:2341, 37:5707, 37:6912
- **Rule:** CT2: fills bound to the PPO colour variables
- **Found:** 17 unbound paints: 14 dialog scrims #242a37 at 32 %, 3 white badge fills; every other paint (about 38,000) is bound
- **Expected:** Scrim and badge fills bound to variables (navy scrim at 32 % paint opacity)
- **Do:** Bind the scrim to the PPO colour variable holding the navy (or a scrim token from the Library) and the badges to the white surface variable
- **Proved fixed when:** A paint scan of the 15 scope pages finds no unbound solid paint outside section chrome

### AF-020 · Minor · SH (dialogs)

- **Where:** Material demand · SC-01; Administration · 34:7455, 69:3802, 76:686
- **Rule:** Accepted Sales A5, retained by the Library drawer-widths decision: dialogs 560 to 720 px
- **Found:** X06 and AS01 dialogs 520 px; the Page template card states "dialogs 520 to 720"
- **Expected:** Dialogs 560 to 720 px; the Page template card says the same
- **Do:** Widen the two dialogs to 560 px and correct the Page template card
- **Proved fixed when:** No dialog narrower than 560 px

### AF-021 · Minor · SH6

- **Where:** Phone sheets · the 14 phone sheets of AF-008
- **Rule:** R118: Actions is a labelled menu, never an ellipsis
- **Found:** Every drawn phone header carries a ⋮ (more-v) button; PH14 has both ⋮ and Actions
- **Expected:** Phone headers carry no ⋮ menu; secondary decisions sit in the labelled Actions of the sticky bar
- **Do:** Remove the ⋮ when the component replaces the header (AF-006); on form sheets use the accepted phone sheet header without ⋮
- **Proved fixed when:** No more-v button on a phone sheet

### AF-022 · Minor · SH6

- **Where:** Purchasing; Inventory; Dispatch; Material demand · 36:1848, 31:2152, 46:2727, 35:5923
- **Rule:** R117: a state with no action reads "Read only" with its reason and date
- **Found:** "Receipts are recorded in Receiving" (PU04); "Observations only · Record observation is in Actions" (IV03); "Custody transferred · continues in Service stock custody" (DL08); "Ready for the stated material scope" (MS03)
- **Expected:** For example "Read only · receipts are recorded in Receiving" (DL02 already writes "· read only")
- **Do:** Start each no-action primary with "Read only" and keep the reason
- **Proved fixed when:** Every no-action toolbar reads "Read only"

### AF-024 · Minor · CT1, CT5

- **Where:** Shell and kit · 16:2 (Supply kit); Library Controls page
- **Rule:** CT1 component names; CT5 Library as the shared home
- **Found:** Kit under Sales names (Sales / Status chip, Button, Avatar, Checkbox, Filter chip, Tab, KPI tile; recorded as R6); phone chrome as local Phone / Header · compact, Phone / Tab bar · Supply, Phone / Status bar; panels and dialogs drawn as frames, not Controls / Drawer or Controls / Dialog
- **Expected:** Kit components under the Library names (Controls / Chip, Button, Avatar, Checkbox, Filter chip, Tab, Dialog, Drawer) once the Library is adopted
- **Do:** Map each local part to its Library component when Dean adopts the Library
- **Proved fixed when:** No Sales / or local Phone / names remain after adoption

### AF-026 · Polish · SH4

- **Where:** Returns and claims · SC-08 · 49:523
- **Rule:** R108: a page with its own views (Returns is named) shows them nested in the docked menu while current
- **Found:** No Returns & claims sheet shows the docked menu
- **Expected:** One Returns sheet with the docked menu and its views nested
- **Do:** Add the docked menu to RT01 with the six views nested
- **Proved fixed when:** RT01 shows nested views

### AF-027 · Polish · GV1

- **Where:** Read me · 76:517
- **Rule:** Record the name Figma shows
- **Found:** The link Dean shared on 13 Nov reads "PPO - Supply module"; the Read me header and record A1 read "PPO - Supply module (proposal)"
- **Expected:** The Read me header and record use the file's current name
- **Do:** Confirm the current name and align the header and record
- **Proved fixed when:** Names agree

### AF-028 · Polish · SH1, CT5

- **Where:** Shell and kit · 17:61, 17:153, 17:177, 18:1015, 18:1042
- **Rule:** SH1: local copies of the accepted components
- **Found:** Copies are rebuilt, not duplicated: 41 layers against 58 (top bar), 46 against 91 (rail), 14 against 23 (right strip), 189 against 239 (record header set), 19 against 26 (phone header). A pixel comparison of the top bar and rail shows no visible difference apart from anti-aliasing and the intended current workspace
- **Expected:** Copies identical to the Shell components
- **Do:** None needed now; replace with Library or Shell components at adoption
- **Proved fixed when:** Instances point to the shared components

### AF-029 · Polish · CV4

- **Where:** Notes cards · notes cards, e.g. 35:9231
- **Rule:** Dates as "Thu 5 Nov 2026"
- **Found:** Notes cite record dates as "23 October 2026", "31 October 2026"
- **Expected:** Short date style in notes
- **Do:** Use "Fri 23 Oct 2026" style
- **Proved fixed when:** No long-form date in notes

### Not for this file

- AF-025 drawer widths: wait for Dean (Q1).
- AF-023 record header variant names, AF-030 and AF-031: the Shell file's owner, under a new Shell named version.

### After the batch

- Re-run the structural pass (sections, grid, labels, overlap, children inside sheets) and the text scans (people, references, revisions, pronouns, zones, tones).
- Update the repository record (sheet inventory unchanged unless sheets are added; assumptions A1, A5, A10, A12; the pronoun rows) in its own change.
- This file is a proposal, so no acceptance is affected; ask Dean to save a new named version that pins the aligned state.
