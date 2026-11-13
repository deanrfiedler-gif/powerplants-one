---
document_id: PPO-MYWORK-FIGMA-ALIGNMENT-AUDIT
date: 2026-11-13
owner: Dean Fiedler
status: Audit findings, 2026-11-13; no design is changed and nothing is accepted by this record; decision support only; no application code, route, migration, permission, integration or deployment; every record shown is synthetic
source_commit: 707b21cce42393433b90fbfa84a9aa850834db13
versioning: git
---

# My Work module Figma file — alignment audit

**Owner:** Dean Fiedler · **Date:** 13 November 2026 · **Status:** audit findings for Dean's decision. This record changes no design, accepts nothing and amends no other record. Corrections it identifies in other records are findings, to be made in their own changes.

On 13 November 2026 Dean asked for the Figma file of the My Work module UI to be audited. Dean sent the file with the PPO - Library file, the cross-file alignment audit prompt and the read-only UI/UX V3 conformance audit of 10 November 2026. The cross-file prompt was applied to the one file asked for: the My Work file was read in full and checked against the accepted Shell, the Library, its own record ([PPO-MYWORK-REFINED-FIGMA-PROP](my-work-refined-ui-proposal.md)) and the other module records. My Work is where every module's work items arrive, so the receiving side of each handover was checked as well. Dean's standing instruction applied: "If you need any decisions from me, just proceed however you believe is the most professional and advanced approach." The audit was therefore read-only in Figma (the prompt's default), and every authority conflict is listed in section 5 for Dean rather than resolved.

The cross-file audit (PPO-FIGMA-ALIGNMENT-AUDIT, open as pull request 925) already holds 20 findings for this file. This audit re-tests each of them against the file as it stands (section 4.3), and settles most of the cells that record left Not checked for My Work.

Four statements stay separate: what was audited (sections 1, 2 and 6); what is misaligned (sections 3 and 4); what only Dean can decide (section 5); and what this audit did not change (section 8).

## 1. Scope and sources

| Source | Use |
|---|---|
| Private Figma file "PPO - My Work module" ([PPO-MYWORK-REFINED-FIGMA-PROP](my-work-refined-ui-proposal.md)), as it stood on 13 November 2026; no named version is saved | The file audited: 16 pages (Read me, two separators, eleven scope pages, Shell and kit, Scratch), 139 sheets and boards, 11 notes cards and the four Read me cards. No build session was active: no open pull request touches the file and its record last changed on 12 November 2026 |
| Private Figma file "PPO - Shell (accepted)", named version "Shell refined concept — accepted · record header toolbar" (10 November 2026) | Comparison base: the accepted components section `7:2767`, the docked My Work sheet `101:9606` on the workspace menus page, and rules R1 to R125 through [the rules export](../design/development/systems/shell-refined-concept-rules.md) |
| Private Figma file "PPO - Library" (unpublished, no named version) and its records `library-*.md`, including [drawer widths](library-drawer-widths.md) and the Phone and Controls records | The PPO colour, layout and control-size variables; drawer, dialog, phone action and focus-ring rules |
| The other module records (`docs/decisions/*-refined-ui-proposal.md` on `main`, with the newer Documents and messages, Products and Settings copies on their open branches) | The facts and handovers My Work receives |
| The cross-file alignment audit record on its open branch (pull request 925) | The 20 earlier findings for this file, re-tested here |
| Addendum A1 (record header toolbar), A2 (reference form) and A3 (persona and story reconciliation) | **Not supplied to this session and not in the repository.** A1 was read through rules R116 to R125, A2 through its citations (revisions and versions two-digit), and A3 only through the citations of A3.2 and A3.4 to A3.13 in other records |
| [Named-version build handoff](figma-named-version-build-handoff.md), [page template alignment](figma-page-template-alignment.md), [design-to-build standard](../standards/design-to-build-standard.md) | Governance rules |

The files' links and keys are not recorded ([ADR-0050](ADR-0050-font-awesome-light-icons.md), [ADR-0053](ADR-0053-figma-page-design.md)). Node IDs are those of the My Work file, which its record already cites, and the Shell node IDs its record already cites.

## 2. Method

The checks were those of the cross-file prompt's section 4: structure (ST1 to ST5), shell conformance (SH1 to SH7), components and tokens (CT1 to CT5), content conventions (CV1 to CV8), people and facts (FA1 to FA7), handovers and ownership (HO1 to HO3), states and accessibility (RA1 to RA3) and governance (GV1 to GV4). EX1 applies to the Customer portal file only.

- **Extraction.** One read-only script per scope page returned compact results and changed nothing. It covered:
  - sections, sheet positions and labels, overlaps and children outside sheet bounds;
  - every top-level instance and its main component, with the position, size and text of each Shell instance;
  - chip words and tones, button labels, unbound fills and strokes, fonts and sizes;
  - phone targets and inputs, and frames named like Shell parts;
  - text scans: pronouns, revisions, dates and weekdays, zones, money, references, people, earlier fixtures, forbidden and US-spelling words.

  Six targeted reads followed: the Read me cards, the Shell and kit inventory and variables, the AC05 toolbar's fills, the search scrims, three persona panels, and the badge and focus-ring paints.
- **Comparison.** The local top bar, rail, right strip, collapsed strip and phone record header were compared layer by layer with the accepted Shell components; the docked My Work menu with the accepted Docked · My Work sheet. The 66 colour variables were compared with the Library's, and contrast pairs were computed from the variable values.
- **Ledger.** The facts My Work receives were collected from the other module records into a ledger and tested against the file's text. The facts that differ and those that agree are in the ledger difference sent with this audit.
- **Inventory.** The record's 139 sheet node IDs were read back from the file: all resolve, with matching codes and sizes except AD08.
- **Calls.** 26 Figma tool calls in all; one failed on a script error and was rerun. No page timed out and nothing stopped early.

## 3. Results

**38 findings: 0 Blocker, 16 Major, 16 Minor, 6 Polish.** 28 belong to the My Work file, 7 need Dean's decision first, 2 belong to other files first (the Shell's primary colour, and the Finance and Service persona pills) and 1 to the repository record. No finding is a Blocker: the file is a proposal, it shows no customer sheet, and no record carries a link or key.

The file is structurally sound. Every one of the 139 recorded node IDs resolves. The page template, section order and gaps are in place. Every local Shell copy that was compared matches its accepted component: the top bar, rail, right strip, docked menu, collapsed strip and phone record header are exact copies, and the persona counts are internally consistent. So are the colour variables, spelling, forbidden-control hygiene and the reference families. The misalignments sit in five places:

1. Facts My Work receives from Service, Projects, Estimating, Finance and the portal that drifted after those files moved on (MWA-002 to MWA-009, MWA-021).
2. Shell parts drawn as frames rather than instances: banners and phone headers (MWA-010).
3. Three unrecorded departures from accepted Shell rules: the right strip on the settings sheets, a scrim behind the search dropdown and a green focus ring (MWA-011 to MWA-013).
4. Accessibility and type: the toolbar primary's contrast, 32 px phone actions and off-scale text sizes (MWA-001, MWA-014, MWA-015).
5. Shared conventions: revisions, pronouns, weekdays, tones and dates.

**Matrix summary** (52 rows; full table below and in `alignment-matrix.csv`): 15 Pass, 29 Fail, 4 Not applicable, 4 Not checked.

| Check | Result | Findings or reason |
|---|---|---|
| ST1 | Fail | MWA-038 (Polish); order passes: Read me, empty — Accepted — and — Proposals —, eleven scope pages in rail order below Proposals, Shell and kit, Scratch |
| ST2 | Fail | MWA-032 (section order and 360 px gaps pass on every page) |
| ST3 | Fail | MWA-029, MWA-033; label form [source] against the audit's [signed in as …] is Q9 |
| ST4 | Fail | MWA-029, MWA-034; no loose nodes; no other overlap; no direct child outside a sheet |
| ST5 | Fail | MWA-037; four Read me cards; the index lists all 139 sheet IDs and 11 notes cards, and every one resolves |
| SH1 | Fail | MWA-010 |
| SH2 | Pass | Local top bar matches the accepted component row for row: New, Assistant, Calendar, Conversations, Page guide, Notifications, Account; no Help button |
| SH3 | Fail | MWA-011; six tabs match the accepted strip; 432 px panels follow R45 and R98 (drawer widths are Q8) |
| SH4 | Pass | Local docked My Work menu matches the accepted Docked · My Work sheet (groups, links, badges, footer); Reviews 4 against the stand-in 3 is recorded; R108 is MWA-027 |
| SH5 | Pass | The 12 px collapsed strip is the accepted component and is used where the menu is collapsed (wording fix in MWA-030) |
| SH6 | Fail | MWA-001, MWA-035 (AC05 uses the accepted toolbar; PH04 uses the phone toolbar) |
| SH7 | Fail | MWA-030 (no named version cited) |
| CT1 | Fail | MWA-026 |
| CT2 | Fail | MWA-025 |
| CT3 | Fail | MWA-015 (Roboto only passes) |
| CT4 | Fail | MWA-024; cross-file tones are AF-140 |
| CT5 | Not applicable | Only local copies; the Library is not published. Its 66 PPO colour variables match the file's name for name and value for value; dialogs 560 and 720 px match; the 480 px drawer is Q8 |
| CV1 | Not checked | ST01c holds the register standard; not re-read rule by rule |
| CV2 | Not checked | One-line cells and the single search box were not re-tested; the record's own structural pass reports them |
| CV3 | Pass | Sampled: every count states its rule; "No access" and a dash for unreadable sources; "8 in your permitted scope; all shown"; "1+" on the outage |
| CV4 | Fail | MWA-020, MWA-023; zones: AEDT for Melbourne and Hillview, Australia/Brisbane for Block C |
| CV5 | Fail | MWA-031; US$30 appears only as the assistant budget |
| CV6 | Fail | MWA-018, MWA-019 |
| CV7 | Pass | No Approve, Complete, Close, Resolve, Answer or Send control among 52 button labels; state words appear only as source states |
| CV8 | Pass | No US spelling found in any text |
| FA1 | Fail | MWA-003, MWA-004, MWA-005, MWA-006, MWA-007, MWA-008, MWA-021; facts that agree are in the ledger difference |
| FA2 | Fail | MWA-009; no Kim Patel, Alex Nguyen, Sasha Cole, Jordan Hale, Grace Holt, Noah Clarke, Mei Tan, Priya Nair or SYN-PPO-, SYN-DSP-, SYN-CLM- on any sheet |
| FA3 | Pass | 38 families; each also appears in another record; SYN-REL- (releases), SYN-EXC- (Finance exceptions), SYN-SUB- (subcontract), SYN-SCL- and SYN-OPI- are used as their families define |
| FA4 | Pass | Top-bar initials match each persona sheet: RK, AL, AM, JR, JP, LN, NU; Dean elsewhere |
| FA5 | Fail | MWA-002, MWA-022 |
| FA6 | Fail | MWA-002, MWA-016; the file's own counts match its record for every persona |
| FA7 | Fail | MWA-017 |
| HO1 Service → My Work | Fail | MWA-002, MWA-003, MWA-004, MWA-005 |
| HO1 Projects → My Work | Fail | MWA-008, MWA-009 |
| HO1 Estimating → My Work | Fail | MWA-007 (SYN-QUO-000214 r02 · Riverbend agrees) |
| HO1 Finance → My Work | Fail | MWA-016, MWA-021 |
| HO1 Customer portal → My Work | Fail | MWA-002; Ravi's three portal requests not checked |
| HO1 Reporting → My Work | Pass | REP-02 v1 returned Wed 28 Oct and resubmitted Tue 3 Nov 11:40; KPI-15 for Avery Lin to adopt; SYN-EXP-000052 with its Fri 6 Nov 17:10 nudge |
| HO1 Engineering → My Work | Pass | Alex Morgan's queue: Drew Collins accepted, Quinn Avery declined, Robin Hale pending (EN CR09); SYN-AST-000214 CP-4 panel |
| HO1 Settings → My Work | Pass | SYN-REL-000005 and SYN-OPI-000008 Mitigated 07:30; the Preferences tab hands off (NU07) |
| HO1 Shared records → My Work | Not checked | No shared-record item was traced |
| HO1 Documents and messages → My Work | Not checked | Its record is on an unmerged branch and no My Work sheet signs in its senders |
| HO2 | Fail | MWA-028; Search and Conversations drawn here as recorded shell destinations |
| HO3 | Not applicable | My Work draws no customer preview |
| RA1 | Pass | States, tablet, phone and 320 px variants as the record lists |
| RA2 | Fail | MWA-001; spot checks pass: text/secondary on surface/workspace 5.33, text/link on navy-tint 6.09, status/warning on its surface 6.00, status/danger 6.32, line/control on white 3.32; badges navy or neutral on white |
| RA3 | Fail | MWA-013, MWA-014; phone input values are 16 px |
| GV1 | Pass | Read me header, page position and record agree on proposal; header date in MWA-036 |
| GV2 | Pass | No Figma link or file key for My Work in any record or status fragment on main |
| GV3 | Not applicable | Not accepted; no named version saved |
| GV4 | Pass | 139 of 139 recorded node IDs resolve with matching codes; sizes match except AD08 (in MWA-030) |
| EX1 | Not applicable | Customer portal only |

## 4. Findings

### 4.1 Majors

| ID | Check | Where (sheets, node IDs) | Found → expected | Fix owner |
|---|---|---|---|---|
| MWA-001 | RA2, SH6 | AC05 56:1293 (toolbar instance 56:1472); kit set 24:408; Read me audit card 85:2406 | "Record outcome" is white on brand/green-deep, 3.57:1. Record section 9 C6, section 11 and the Read me audit card say no My Work sheet places text on that fill → Primary text at or above 4.5:1 (navy primary once the Shell saves the version that carries Q-B); the record and audit card describe AC05 truthfully | Shell, then My Work; Repository for the record text |
| MWA-002 | FA6, HO1, FA5 | OV07 50:805 (Today's focus) | "Agree a due date with Sam Whitlock · SYN-RPT-000040 Goulburn Orchards report response · Date needed · After the customer response was not Accepted". That response is a 10:42 event, and Sam Whitlock is named in no other record. No Owen Dunne text in the file (confirms AF-053) → Ravi Kumar's Today item at 09:00 reads "Contact Owen Dunne about the report questions" | My Work |
| MWA-003 | FA1, HO1 | OV07 50:805, TB09 52:4636 | "Prepare work for the overdue maintenance occurrence · SYN-MOC-000118 · Northbank Farm Block C quarterly check" (confirms AF-134) → SYN-MOC-000118 · Mallee Fresh climate computer, Glasshouse 2 (or a different, free MOC reference for a Block C check) | My Work |
| MWA-004 | FA1 | OV07 50:805, OV10 50:2599, TB09 52:4636, PH06 52:5238, PH06-320 52:5625, PH07 76:3131, PH07b 83:3020, PH07c 83:3128, PH07b-320 100:3272, SR02a 73:451, SR03 73:1389, SR05 73:2261, SR05b 73:2504, PH10 73:3218, PH11 73:3301, NU05 71:1128 | "motor M-2" / "motor M-2 replacement" on 16 sheets. Service MJ10 also says M-2, so Service disagrees with itself → The Hillview Glasshouse 4 motor on SYN-WO-000062 is M-4 | Dean (Q3), then My Work and Service |
| MWA-005 | FA1, HO1 | PH06 52:5238, PH06-320 52:5625, PH17 52:5791 | My Work: SYN Woodhaven Nursery pump service 09:30; Hillview motor replacement 13:00 to 16:00 held for isolation approval; acknowledge SYN-PACK-000071 r02 by 12:00; kit SYN-KIT-000033 issued to van 1 at 08:30. Service: Coastal Herbs then Hillview 12:58 to 15:56, pack r02 acknowledged Wed 4 Nov; Supply: parts not ready (same conflict as SVA-003 and SVA-004) → One morning for Casey Ward in both files | Dean (Q2), then the file that disagrees |
| MWA-006 | FA1, HO1 | SR03 73:1389, SR05 73:2261, SR05b 73:2504, PH11 73:3301, PH11-320 73:3441 | "SYN-PRJ-000014 · Glasshouse 4 irrigation stage 1" (A21 calls the title synthetic, but the reference is already used). Shared records OR03 gives a third scope (confirms AF-133) → SYN-PRJ-000014 · Glasshouse 4 screen controls (closed), or a free project reference for the irrigation result | My Work (and Shared records) |
| MWA-007 | FA1, HO1 | RH03 64:1385 | "SYN-QUO-000221 r01 · Westgate Flowers" (confirms AF-132) → SYN-QUO-000223 r01 · Westgate Flowers (Tom Reid, Fri 30 Oct), or SYN-QUO-000221 r01 · Glasshouse Valley Farms | My Work |
| MWA-008 | FA1, HO1 | OV01 49:8, OV03 49:796, AC01 56:8, AC05 56:1293, CL01 76:8, NU01 71:8, SR01 73:8, CV09 74:1538 | My Work shows the deal open with Dean's "Send revised proposal · stage 2 lighting" 2 days overdue; Projects shows it won and handed over (AF-131). Within My Work the deal is named three ways ("Sunline Hydroponics LED propagation lighting", "Sunline Hydroponics", "Sunline LED lighting"), and the record lists the "LED propagation lighting" deal as a replaced earlier fixture → One state for SYN-OPP-000318 at 09:00 and one deal name in every file | Dean (Q1), then Projects; My Work for the name |
| MWA-009 | FA2 | OV10 50:2599 (text 50:3135), BW03 65:527 (text 65:938), notes card 65:2342 (text 65:2352) | "Jamie Ellis · decision on V-03" (A$8,450.00) in Jamie Rossi's queue and Waiting on others → The current decision-maker for variation V-03 (Ben Carter if V-03 is Woodhaven's potting-machine variation) | Dean (Q4) and Projects, then My Work |
| MWA-010 | SH1 | At least 44 page banners in 21 banner rows (for example OV01 49:381, OV04 51:3962, AC02 57:1513, NU04b 71:3301, CL05a 76:2532, AD01 82:841, RH-S2 64:2950); 23 phone headers (for example PH01 52:5026, PH02 62:5594, PH05 64:3524, PH16 66:2198); Shell and kit page 2:15 | Banners and phone headers are redrawn frames. Shell / Banner, Toast, Dialog, Page state, Modal · Keyboard shortcuts, Offline queue and Selection bar are not copied into Shell and kit, and the copied Phone / Header · compact is never used → Page banners as instances of Shell / Banner (and toasts of Shell / Toast); phone headers as instances of Phone / Header · compact 44:437 or its variants | My Work |
| MWA-011 | SH3 | AD01 82:552, AD02 82:987, AD03 82:1515, AD04 82:1908, AD05 82:2262, AD06 82:2602, AD07 82:3064, AD08 82:3386 | Shell / Right rail · collapsed at x 1392 on all eight settings sheets; the record notes only the Overview's omission → No right strip on the My Work settings hub; content runs to the screen edge | My Work |
| MWA-012 | SH (R44), CT2 | SR01 73:8 (scrim 73:336), SR02a 73:451 (73:779), SR02b 73:938 (73:1266) | "Scrim · light", 1440 × 852 at 12 % of #242938, under the dropdown on all three sheets. #242938 is not a PPO colour → The search dropdown over the live page with no scrim | My Work |
| MWA-013 | RA3 (R85) | ST01d 80:810 (note text in the hover, pressed and focus specimen) | "focus the 2 px brand/green-deep ring inside", applied to the cell, radio and search-listbox focus specimens → Focus drawn as a 2 px text/link ring with a 2 px offset | My Work |
| MWA-014 | RA3 | PH01 52:5016 (Log 52:5012, Reply 52:5014), PH01-320 52:5421, PH06 52:5238 (Log 52:5236), PH06-320 52:5625, PH08 65:2157 (Reply 65:2271, Follow up 65:2243, 65:2254), PH14 65:2280 (Reply 65:2331), PH16 66:2188 (Open My Work 66:2248) | Sales / Button instances at 32 px high on 7 phone sheets → Row and page actions on phones at least 44 px high | My Work |
| MWA-015 | CT3 | Heaviest on the Overview page (15 px × 52, 22 px × 19, 24 px × 60) and Calls to log (24 px × 40) | 357 of the file's 9,163 own text nodes are off the scale: 15 px × 108, 17 px × 27, 18 px × 51, 22 px × 41, 24 px × 130 (summary-cell figures, dialog and sheet titles). Roboto is the only family (pass) → Text sizes from the Shell scale | My Work |
| MWA-016 | HO1, FA6 | Finance record R4; the Service persona sheets' rail (SVA-023); My Work OV08 50:1470, OV07 50:805 | Finance keeps "the rail's My Work count stays 4 (Avery Lin's)"; Service shows 4 for every signed-in person → Avery Lin's pill 3 and Ravi Kumar's pill 8 wherever those people are signed in | Finance and Service |

### 4.2 Minors and Polish

| ID | Severity | Check | Where | Found | Fix owner |
|---|---|---|---|---|---|
| MWA-017 | Minor | FA7 | AC05 56:1293 (text 56:1588 "her call"); CL07 81:2894 (81:2925 "her contact card"); Calls to log notes card 83:3473 (83:3477, 83:3480 "his choice", 83:3483, 83:3495); CV06b label 74:1297 ("a record he cannot open") | Seven gendered pronouns for synthetic people, five of them beyond AF-052's two; the record's CV06b row repeats "he" | My Work; Repository for the record row |
| MWA-018 | Minor | CV6 | AC02 57:1126 (57:1470), AC02-F 57:1524 (57:1876), CV01 74:8, CV04b 75:3008, TB07 75:3433, SR02a 73:451, SR03 73:1389, SR04 73:1900, OV09 50:2041; definition versions on RH01 63:8, RH06 63:1952, OV01 49:8, OV08 50:1470, SR01 73:8, CL01 76:8 | 225 single-digit forms: "proposal (r2)", "baseline r2", "configuration r2", "r2 · K3 contactor", "REP-02 v1", "KPI-15 v1", "KPI-06 v1", "FD-05 v2", "REP-01 v2", "KPI-11 v2", "SYN-FH-000045 v2" (confirms AF-051) | My Work (record and definition versions after Reporting and Settings; Q6) |
| MWA-019 | Minor | CV6, FA3 | RH05 63:1598 (text 63:1871) | "SYN-OPP-000301b · won deal A$86,400.00" | My Work |
| MWA-020 | Minor | CV4 | RH05 63:1598 (63:1933) and the RH page's "Mon 10 Nov" entries | "Mon 3 Nov 2026" and "Mon 3 Nov" (4) and "Mon 10 Nov" (2). 3 and 10 November 2026 are Tuesdays (confirms AF-109) | My Work |
| MWA-021 | Minor | FA1 | OV08 50:1470 (SYN-INV-000356); OV07 50:805, CV01 74:8, CV06 74:987 (Block C) | "Prepare the October statement for SYN Northbank Nursery · SYN-INV-000356 · 83 days overdue" beside "Northbank Farm Block C" elsewhere in the file | Dean (Q5) and Finance, then My Work |
| MWA-022 | Minor | FA5 | CV01 74:8, PH12 75:3682, TB07 75:3433 (Carl answered 09:02); AC02-F 57:1524 (connection lost 09:07); RH02 64:2202 (re-read 09:06); NU04b 71:3057 (access changed 09:05) | Events from 09:02 to 09:07 are drawn as already happened, with no time in the label (CV04b's label names CV01's 09:02 answer) | My Work |
| MWA-023 | Minor | CV4 | All pages | 768 of 846 dates omit the year, mostly in due and age phrases inside lists whose header gives "Thu 5 Nov 2026 · as at 09:00 AEDT" (AF-110) | Dean (Q7) |
| MWA-024 | Minor | CT4 | Sales / Status chip instances reading "To log" and "Open" | "To log" is Warning 18 times and Info 5 times; "Open" is Neutral 7 times and Warning once. Cross-file tones are AF-140 | My Work (Library owner for the tone table) |
| MWA-025 | Minor | CT2 | ST01e 80:1041 swatches and specimens; ST01d 80:810 hover and pressed overlays; ST01b 78:1407 badges; CL01 76:8 and CL06 81:2431 annotations; navy scrims on 16 dialog sheets (for example AC02 57:1453, CL02 76:1016) | 125 unbound paints; scrims are literal #242a37 at 32 %; there is no surface/scrim variable in the 66 (AF-055, AF-139) | My Work; Shell or Library for the scrim variable |
| MWA-026 | Minor | CT1 | 17:39, 18:71, 16:21, 14:49, 14:17, 22:227, 22:308, 26:336, 25:311, 83:2900, 83:2905 | Local names differ (Search dropdown · recent and results, Notifications popover, Notifications popover · empty, Incoming call card, Right drawer · Activity and Conversations). Two copies bake Dean's counts into their names and are reused for other personas. Icon/play and Icon/trash-2 extend the icon set (A42, AF-148) | My Work (Library owner for the icons) |
| MWA-027 | Minor | SH4 (R108) | RH01 63:8 to RH-S3 64:3000 | Six views in a 208 px in-page menu while the docked menu is closed (record A11) | Dean (Q10) |
| MWA-028 | Minor | HO2 | AD07 82:3064 | AD07 restates the organisation-wide US$30 budget, the Simulated provider and Carl's defaults | My Work (Dean Q11) |
| MWA-029 | Minor | ST3, ST4 | RH04 63:1295, label 63:1296, RH03 64:1385 | Label at y 2194, inside RH03 (y 1160 to 2688) and 654 px above RH04 (confirms AF-054) | My Work |
| MWA-030 | Minor | Repository | Sections 1, 2, 3, 4, 5, 6, 9 and 11 | No Shell named version is cited although AC05 and PH04 use the toolbar; section 4 and the Read me page-template card 85:2447 say "the 80 px strip"; the inventory gives AD08 as 1440 × 901; C6 and section 11 say no sheet uses the failing pair; the CV06b row says "he"; section 5 calls the "LED propagation lighting" deal replaced; section 4 claims 44 px phone targets | Repository (and the Read me card in the file) |
| MWA-031 | Minor | CV5 | OV01 49:8, OV06 51:2501, SR01 73:8, SR03 73:1389, CL01 76:8, NU01 71:8, RH05 63:1598, OV10 50:2599, BW03 65:527, OV08 50:1470 | A$54,800.00, A$96,200.00, A$86,400.00, A$8,450.00 and A$380.00 / A$268.00 carry no basis | My Work |
| MWA-032 | Polish | ST2 | Every Flows and notes section; Team queue Dialogs and panels 66:3 | Flows and notes sections have 100 px top padding; Team queue's Dialogs and panels has 492 px bottom padding (AF-112) | My Work |
| MWA-033 | Polish | ST3 | PH06-320 52:5625 (x 1340), PH17 52:5791 (x 1720), TB04 65:1877 | Two phones off the pitch; TB04 reads "TB04 · Blocked & waiting at 1024 (SH-02) [Shell R87]" | My Work |
| MWA-034 | Polish | ST4 (record C4) | CL01 to CL05a (docked menu 1186 px), SR05 and SR05b (strip 1512), NU03, X11, NU04a (988), TQ02 (1284), CV05 to CV08b (1192), AD08 (853) | Cloned full-length chrome is still clipped under 900 px sheets | My Work |
| MWA-035 | Polish | SH6 | AC05 56:1293 (instance 56:1472 inside wrap 57:1125) | Resized to 1264 px and inset 24 px inside a 1312 px wrap; its primary layer is still named "Button · Submit for approval" (A8) | My Work |
| MWA-036 | Polish | GV1 | Header card 85:2291 | "Drawn 10 and 11 November 2026", although TB11 and PH07b-320 were drawn on 12 November | My Work |
| MWA-037 | Minor | ST5 | Sheet index card 85:2322 | The index lists all 139 sheets and 11 notes cards with node IDs, but no page node IDs (confirms AF-153) | My Work |
| MWA-038 | Polish | ST1 | Pages 0:1 and 2:15 | "Read me · PPO - My Work" and "Shell and kit · local copies until PPO - Library" (AF-164); order and separators pass | My Work |

### 4.3 Earlier findings for this file, re-tested

| Cross-file finding | Result here |
|---|---|
| AF-001 toolbar primary contrast | Confirmed for AC05 (MWA-001). Dean has since decided (Q-B on pull request 931) that primaries return to brand/navy; the file waits for the Shell's next named version |
| AF-051 single-digit revisions | Confirmed and wider: 225 forms, not 69 (MWA-018) |
| AF-052 pronouns | Confirmed and wider: seven, not two (MWA-017) |
| AF-053 Ravi's report-questions item | Confirmed, with a story-clock breach (MWA-002) |
| AF-054 RH04 label | Confirmed (MWA-029) |
| AF-055 literal paints | Confirmed: 125 (MWA-025) |
| AF-109, AF-110 dates | Confirmed (MWA-020, MWA-023) |
| AF-111 label form | Raised as Q9; two labels lack a state (MWA-033) |
| AF-112 section layout | Confirmed (MWA-032) |
| AF-131 to AF-134 shared references | All four confirmed (MWA-008, MWA-007, MWA-006, MWA-003) |
| AF-139 colour collections | My Work holds the decided 66 variables, identical to the Library's; there is no scrim variable (MWA-025) |
| AF-140 chip tones | Two in-file drifts (MWA-024); the cross-file tone table stays with AF-140 |
| AF-148 icon set | Confirmed: Icon/play and Icon/trash-2 (MWA-026) |
| AF-153 page IDs in the Read me | Confirmed (MWA-037) |
| AF-160 Shell version citation | Confirmed (MWA-030) |
| AF-164 page names | Confirmed (MWA-038) |

### 4.4 Known items from the prompt that touch My Work

| Prompt item | Result |
|---|---|
| 6 (recurring checks) | Closed: no recurring-checks item in the My Work file or its docked menu |
| 7 (drawer widths) | Q8; the file follows the Shell's 432 + 48 px |
| 8 (Ravi's "Contact Owen Dunne" item at 09:00) | Confirmed missing (MWA-002) |
| 10 (assistant settings) | AD07 agrees with the Settings facts (Simulated provider, US$30) but restates them (MWA-028) |
| 13 (gendered pronouns) | Confirmed (MWA-017) |
| 14 (SYN-QUO-000214) | Agrees: RH03 shows r02 for Riverbend Growers |
| 15 (Shell stale labels) | Confirmed for the Shell owner: the workspace-menus page header still reads "Proposal · awaiting Dean's acceptance"; the local Shell components keep the Shell's sample text (Priya Nair, SYN-OPP-000309) as their default text, which no My Work sheet shows |

## 5. Authority conflicts and questions for Dean

Recommendations are given; nothing is decided by this record.

| # | Question | Recommendation |
|---|---|---|
| Q1 | SYN-OPP-000318 at 09:00: Dean's open task (A3.8, Reporting) or won and handed over (Projects)? (MWA-008) | A3.8; Projects gives its won-deal handover another reference |
| Q2 | Casey Ward's morning: My Work's A3.8 day or the Service dataset? (MWA-005) | A3.8, unless A3's Service section says otherwise; Supply's readiness signal decides the kit |
| Q3 | The Hillview motor on SYN-WO-000062: M-2 or M-4? (MWA-004) | M-4, as A3.9 fixes it |
| Q4 | Who decides variation V-03? (MWA-009) | The A3 person (Ben Carter if V-03 is Woodhaven's); Projects corrects PJ-05 first |
| Q5 | The Block C customer's name, and SYN-INV-000356's age (MWA-021) | Northbank Farm; no age until the invoice has a date |
| Q6 | Definition versions: v1 or v01? (MWA-018) | Two digits, changed in Reporting and Settings first |
| Q7 | Where may a date omit its year? (MWA-023) | Only in due and age phrases under a dated list header |
| Q8 | Drawers: the Shell's 432 + 48 px, or the Library's 480 px? | Keep 432 + 48 until the Library publishes and the Shell's next named version reconciles them |
| Q9 | Sheet labels: the file's [source] form, or [signed in as …] on every sheet? | The file's form; the Read me names Dean as the default signed-in person |
| Q10 | Reviews & handovers' views: in-page menu (A11) or nested in the docked menu (R108)? (MWA-027) | Accept A11 as a recorded exception |
| Q11 | Who draws the organisation-wide assistant settings? (MWA-028) | Settings; AD07 links to them read-only |
| Q12 | Phone actions: 44 px (Shell R87) or 48 px (Library)? (MWA-014) | 44 px minimum for row actions now; 48 px main actions at Library adoption |

## 6. Not checked and limits

- **Addendum A3** was not available. The ledger is reconstructed from other records' citations. A3.8's per-person totals were taken from the My Work record, which says it applied them; they could not be tested against A3 itself, and the 12 November amendment could not be checked.
- **Not checked in the file:**
  - the register standard on ST01c, rule by rule (CV1);
  - one-line cells and the single search box (CV2), which the file's own audit card reports as passing;
  - Ravi Kumar's three portal requests;
  - the Shared records and Documents and messages handovers.
- **Read through records only:** the other module files. Their facts were taken from their records, not their Figma pages.
- **Limits of the method:**
  - The scans test patterns and named facts and do not prove every row value.
  - Two pages exceeded the extractor's 30-item list of frames named like Shell parts, so the banner count is a minimum.
  - No sheet was rendered: findings rest on node properties and text. No prototype, keyboard, screen reader, zoom or device review was done.

## 7. Next steps

1. Dean answers Q1 to Q12. Q1 to Q5 come first, because they decide which file changes the shared facts.
2. The My Work file's next build session applies "Alignment batch · PPO - My Work module", the paste-ready brief sent with this audit. Its order is: A, Dean's items; B, the Shell-dependent item; C, Majors; D, Minors; E, Polish. Each item names its node IDs, the expected text or property and the check that proves it.
3. The Shell file saves its next named version with the brand/navy primary (Q-B). My Work then re-copies the record header toolbar (MWA-001).
4. Other files fix their own items in their own sessions:
   - Finance and Service: the persona pills (MWA-016);
   - Projects: SYN-OPP-000318 and V-03 once Dean answers;
   - Service: the M-2 and M-4 motor in MJ10;
   - Shared records: SYN-PRJ-000014's scope;
   - the Shell owner: the stale workspace-menus header and the sample text in its components.
5. The My Work record's corrections (MWA-030) go in their own reviewed change.
6. Dean may then save a named version of the My Work file, for example "PPO - My Work module · alignment batch 1".

## 8. What this audit did not change

No Figma file was edited, moved, renamed, commented on or versioned. No other record, design register entry, code, route, migration, permission, capability, seed or integration was changed. This record and its status fragment are the only repository changes; all 78 parent requirement IDs remain.
