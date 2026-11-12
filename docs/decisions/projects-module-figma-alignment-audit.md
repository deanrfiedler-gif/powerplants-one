---
document_id: PPO-PROJECTS-FIGMA-ALIGNMENT-AUDIT
date: 2026-11-12
owner: Dean Fiedler
status: Audit findings, 2026-11-12; no design is changed and nothing is accepted by this record
source_commit: 707b21cce42393433b90fbfa84a9aa850834db13
versioning: git
---

# Projects module Figma file — alignment audit

**Owner:** Dean Fiedler · **Date:** 12 November 2026 · **Status:** decision support. It records a read-only audit of the Figma file "PPO - Projects module" against the accepted Shell, the PPO - Library, the file's own record and the cross-file facts. No Figma file, application code, route, migration, permission, design register or other record is changed. Every record, person, value and date in the file is synthetic.

On 12 November 2026 Dean asked for the Projects module Figma page to be audited, attaching the cross-file alignment audit brief and the V3 read-only conformance audit of 10 November 2026, and pointing to PPO - Library as a reference. This record applies the brief's checks to the one file in depth. It builds on the cross-file alignment audit (PPO-FIGMA-ALIGNMENT-AUDIT, `docs/decisions/figma-cross-file-alignment-audit.md`, open as pull requests 920 and 925 and not on `main` when this record was written): each of its Projects findings is confirmed, widened or left open here by its `AF-` number, and this audit's own findings are numbered `PJA-`.

## 1. Scope and sources

| Source | Use |
|---|---|
| Figma file "PPO - Projects module" (the name in the link Dean supplied on 12 November 2026; the Read me and the [proposal record](projects-module-refined-ui-proposal.md) call it "PPO - Projects module (proposal)") | Audited: 19 pages, 14 scope pages, 248 frames (234 sheets and 14 notes cards), Shell and kit, variables |
| Figma file "PPO - Shell (accepted)", named version "Shell refined concept — accepted · record header toolbar" (10 November 2026) | Authority: rules R1 to R125 ([export](../design/development/systems/shell-refined-concept-rules.md)), the collapsed strip `29:3119`, the record header `170:10178` and phone `170:10215`, the Projects flyout and docked menus on page `101:8553` |
| Figma file "PPO - Library" (Status: Proposed · not published), with its records ([drawer widths](library-drawer-widths.md), [record](library-record.md) and the others under `docs/decisions/library-*.md`) | Reference: Controls and Record components, the "PPO colour", "PPO layout" and "Gantt colour" variables |
| [Projects module refined UI proposal](projects-module-refined-ui-proposal.md) (PPO-PROJECTS-REFINED-FIGMA-PROP) | The file's own rules, inventory with node IDs, departures A1 to A92 |
| Module records on `main` and the cross-file audit | Addendum A3 as those records quote it. **Addenda A1, A2 and A3 themselves were not supplied**; the fact ledger is a reconstruction from the brief's FA2 list and those quotations |
| V3 read-only conformance audit, 10 November 2026 (attached by Dean; repository code, not Figma) | Its Projects items (§6.3) are mapped to the design in section 3 |

The Figma files are named, never linked or keyed (ADR-0050, ADR-0053). Node IDs are those of the Projects file, as its record already uses them.

## 2. Method

1. **Repository sweep.** The Projects record (sources, rules applied, A1 to A92, inventory, verification, audit), the Shell rules export, the Library records, the eleven other refined-UI records for A3 quotations, and the cross-file audit's Projects findings.
2. **Authorities read from Figma.** The Shell's collapsed strip, record header toolbar and accepted Projects menus; the Library's Read me, Controls and Record components and its variable collections with values.
3. **Extraction.** One read-only script per scope page (14 calls, none timed out) returned, for every sheet: section order, gaps and padding; grid positions and labels; overlaps and children outside bounds; shell instances (direct and nested) and redrawn look-alikes; drawer geometry; bound and literal paints; font family and size (own text and phone inputs); phone target sizes; and the text scanned for earlier fixtures, revisions, ISO and numeric dates, weekday–date mismatches against the 2026 calendar, events after 09:00 on Thu 5 Nov, zones, money, percentages, forbidden words, US spellings, gendered pronouns, references and people. Each page's result was saved as data and analysed locally.
4. **Targeted reads.** The Read me cards and the resolution of every node ID they cite; the Shell and kit components; separators and Scratch; the X33 flyout and the RC01 header; the canvas frames against the index.
5. **One screenshot** (SU03, `103:1692`) to settle whether internal names sit inside the customer preview. They do not.
6. **Contrast.** Five text pairs and two UI edges computed from the variable values.

About 30 Figma calls in all. Nothing was written to any Figma file.

## 3. Results

**Summary.** The file is structurally exemplary and close to the Shell in its chrome, but it predates three decisions taken around it: the A1 record header (accepted 9 November 2026, named version 10 November), the A3 story reconciliation (12 November) and the Library's drawer widths (11 November). **22 findings: no Blocker, 10 Major, 11 Minor, 1 Polish.** Of the cross-file audit's Projects findings, AF-014, AF-015, AF-017, AF-018, AF-019, AF-020, AF-021, AF-087, AF-145 and AF-149 are confirmed here (AF-016, AF-017, AF-019 and AF-145 wider), and AF-075, AF-129 and AF-131 are present in this file pending Dean's rulings.

What passes:

- **Structure (ST1 to ST4, GV4).** Page order and empty separators and Scratch; six sections per page with 360 px gaps and 60 px padding; desktop sheets at x 60, 1660, 3260 with rows 1060 apart, tablets at x 60 and 1144; every one of the 234 labels at y − 26; no loose node, overlap or child outside its sheet; all 289 node IDs cited in the Read me resolve, and all 248 recorded frames exist.
- **Shell chrome (SH1 in part, SH2, SH3 in part).** The top bar, rail and right strip are instances on 202 of 203 desktop sheets (the ST01 specimen board has none by design); the top-bar order is identical on every sheet (New, Assistant, Calendar, Conversations, Page guide, Notifications, Account; no Help); the right strip has the six tabs of R66; the 432 px panels at x 960 match R45.
- **Tokens and type.** Roboto is the only family (25,448 text nodes); the 66 "PPO colour" variables are identical in name and value to the Library's; 33,891 paints are bound.
- **Content.** No single-digit revisions; `SYN-PPO-` only in two notes cards that cite it as legacy; no ISO or numeric dates, no am/pm, no bare `$`, no percentage; no US spelling in the scanned list; "score" and "Coordinator" only in sentences that forbid them; Block C site times in AEST with the AEDT equivalent computed correctly.
- **People and facts that A3 fixes.** Glasshouse 4 is Hillview Growers at Tatura VIC; Priya Shah is a Hillview recipient, not the Block C contact; Ben Carter is the Woodhaven recipient and Jamie Ellis appears only as an internal commercial reviewer; Jordan Hale appears only as an approver or reviewer, none of the four roles A3 retires; `SYN-SUB-` is the subcontract-package family.
- **Customer preview (HO3).** SU03's preview body carries no internal name, reference or RAID item, states the GST basis, and its arithmetic and weekdays check (A$186,400.00 + A$10,850.00 = A$197,250.00 excluding GST; Thursday 19 and Wednesday 25 November 2026).
- **Accessibility spot-check (RA2).** Text pairs 4.98:1 to 7.10:1; control edge 3.32:1; Gantt bar edge 3.83:1.

**PJ-03 Programme and baselines** (the page Dean linked) is structurally clean on all 21 sheets and its zone arithmetic is right, but it carries the largest share of three findings: 575 of the file's 809 literal paints are its Gantt and baseline bars (PJA-08), Kim Patel owns tasks on at least 13 of its sheets (PJA-01), and its working-calendar drawer is 680 px (PJA-12). X16 and X17 show events at 09:21 and 09:24 without a later-frame label (PJA-14).

**V3 conformance audit, §6.3 Projects, against the design.** (a) A consistent record header with source, baseline, manager, site and next milestone: open until PJA-02 lands. (b) Baseline diff before committing a change: drawn (PG12, RC04, RC10). (c) Schedule context kept when opening a task: drawn as the task panel over the Gantt (PG04, RC02). (d) A keyboard or list alternative to the Gantt: drawn as the Schedule list (RC03) and the phone task list (PH06). (e) Downstream consequences of a date change: drawn as warnings that move nothing (PG05, PG06, X16). (f) Ownership of claims and Finance holds: drawn (CM11, CM12, PS17). Visual design is not runtime proof; the V3 audit's acceptance tests stay with the build.

## 4. Findings

| ID | Sev. | Check | Finding (evidence) | Recommended fix | Cross-file |
|---|---|---|---|---|---|
| PJA-01 | Major | FA2, FA1 | Kim Patel, an earlier fixture A3 says does not exist, owns tasks or receives engineering hand-offs on at least 43 sheets on 8 pages (PG04 `66:1539` "Owner Kim Patel · Delivery…", IN06 `39:1732` "received by Kim Patel Thu 29 Oct · design basis issued", X08 `40:3526`, RD02 `73:648`, AC01 `108:2`) | Sam Jordan, as Dean decided for Estimating on 12 November 2026 (AQ-2) | AF-014 confirmed |
| PJA-02 | Major | SH6, SH1 | No Shell / Record header · toolbar component or instance. RC01 `50:2` uses an earlier header ("Record baseline", "Add task"; no breadcrumb, Actions or Outputs); SU03 `103:1692` has a desktop back arrow (R123); RC12 `50:598` and X12 `58:4011` use a "…" menu (R118) | Copy the accepted toolbar and its phone bar; one state-driven primary per record; Actions and Outputs; no back arrow or "…" | AF-017 confirmed, wider |
| PJA-03 | Major | SH7, GV1 | Read me `35:2` and record §1 cite the 8 November Shell version, with no reason for the pin | Cite the 10 November version after PJA-02 | AF-021 confirmed |
| PJA-04 | Major | SH5, SH1 | A local 56 px collapsed menu (`25:222`, on PJ03 `29:1518` and PG02 `65:604`) where the accepted Shell has the 12 px strip `29:3119` (8 November 2026). A9's premise, "the Shell file has none", is not so | Local copy of `29:3119`; withdraw A9 (AQ-4) | AF-145 confirmed, raised from Minor |
| PJA-05 | Major | SH4, SH1 | Flyout X33 `126:5103` is a kit composition lacking the accepted Favourites, Saved views and Recent columns, "All 11 Projects pages" and "Edit menu (administrators)"; it shows routes and decision IDs as item sub-lines and claims "none invented" | Rebuild from the Shell's flyout; drop the sub-lines | New (G2 recorded the composition only) |
| PJA-08 | Major | CT2, CT5 | 809 literal paints (33,891 bound); 392 are Gantt and baseline bars (`#e8f1fb`, `#4a7bb7` equal the Library's `gantt/blue-fill` and `gantt/blue-outline`; `#f6f7f9` matches no variable); no Gantt colour collection in the file | Add the Library's Gantt colour variables and bind every bar; bind the rest | AF-019 confirmed, wider |
| PJA-09 | Major | CV4, FA1 | 27 wrong weekdays on 11 Initiation sheets: "Tue 4 Nov" (a Wednesday), "Mon 3 Nov" (a Tuesday), "Fri 24 Oct" (a Saturday), e.g. "submitted Tue 4 Nov 15:40 by Tom Reid" for SYN-OPP-000301's handover (IN02 `38:487`) | Confirm each date against the Sales Handovers page, which the record says these cells match, and fix both files | AF-016 confirmed, 2 → 27 |
| PJA-10 | Major | HO2, HO1 | IS01 to IS04 (`116:734` to `116:1957`) draw Reporting's Delivery performance (RP-03, `route:/reports/delivery`) and Finance's Project financial performance (FN-03) as Projects sheets, under the route `/insights/delivery-performance` | Link the INSIGHTS items to the owning pages and remove IS01 to IS04, or label them as references with the owners' routes (AQ-5) | New |
| PJA-11 | Major | RA3, CT3 | At least 37 phone input texts at 12 or 13 px (16 px required); PH09 `90:4838` Save button 32 px high (48 px required) | 16 px phone inputs, 48 px phone controls | New |
| PJA-12 | Major | SH3, CT5 | Working-calendar drawer 680 px (PG07 `67:2200`) against the Library's 360, 480, 640, 800 (owner decision, 11 November 2026); tablet task panel 400 px (TB07 `69:6591`); inline inspector 440 px (AC01, A76) | Calendar to 640 px; tablet panel by the narrow-screen rule; 432 px panels after AQ-1 | Listed in the Library record §4 |
| PJA-06 | Minor | SH4 | Docked menu's first group is "PINNED" (`25:130`); the accepted menu says "FAVOURITES" (R115, R121); A17 is out of date | Rename; correct A17 | Related to AF-165 |
| PJA-07 | Minor | CV3, SH4 | Docked menu counts are register totals (Active 9, Closed 2026 6, Risks & issues 19), not worklist counts (Q22) | Keep worklist counts only | New |
| PJA-13 | Minor | CT3 | 679 desktop text nodes below 11 px (661 at 10 px, 18 at 9 px): Gantt axis dates and variance chips (PG01, PG02, RC02, RD05, X14) | 11 px minimum | AF-149 confirmed |
| PJA-14 | Minor | FA5 | 17 sheets show events from 09:08 to 10:05 AEDT on Thu 5 Nov without a later-frame label (X15, X16, X17, RD07, X18, CM05, X20, RK06, X27, PS24, SU06, X28, PS26, AC11, AC13, PS29, FS02) | Append "· later frame, Thu 5 Nov hh:mm" to each label | AF-087 confirmed |
| PJA-15 | Minor | FA7 | "He is flagged and removed from Update 4" for Noah Patel (SU09 `104:2404`) | They, or the name | AF-015 (1 of 2 reproduced) |
| PJA-16 | Minor | CV6, FA3 | `SYN-EAR-0006` (four digits) on RC17 and X15; `SYN-ES07-08` to `-12` drawn on PG13 `69:2820`; `PPO-PJ-CALENDAR-01` shown as the calendar's name (PG07, AD05) | `SYN-EAR-000006`; cite ES-07 cases in the notes; a display name for the calendar | New |
| PJA-17 | Minor | ST5 | Index omits X33 `126:5103` and the Interaction-states notes card `133:214` (also absent from the record's inventory) and the four non-scope page IDs | Add them | AF-018 confirmed |
| PJA-18 | Minor | ST3, FA4 | No label names its signed-in person; every top bar does (Morgan Lee on 131 sheets, Kai Morgan 21, Jess Wong 20, Dean Fiedler 10 on Administration, eight others) | Per AQ-3 | AF-020 confirmed |
| PJA-19 | Minor | CV7, HO1 | "Delivered Tue 27 Oct · SYN-SN-260114" (RD02, RD03, RC14) states arrival with a serial number, not Supply's receipt | Cite Supply's receipt; check the Supply file | New |
| PJA-20 | Minor | GV1 | The file's current name per Dean's link is "PPO - Projects module"; the Read me, record and named-version string say "(proposal)" | Confirm (AQ-6) and align | New |
| PJA-21 | Minor | CT1, CT5 | Local "Sales /" kit differs from the Library: chip tone Green vs Accent; Button kind Link vs Controls / Link; Checkbox State vs Checked; Filter chip and Tab State vs Selected; no Library KPI tile | Record the mapping; swap at Library publication | New |
| PJA-22 | Polish | CT2 | "PPO colour" mode named "Mode 1"; the Library's is "Value" | Rename the mode | New |

Fix owner for all: the next build session of the Projects file, after Dean's answer where a question applies; PJA-03 and PJA-17 also correct the Projects record. The file is a proposal, so no named version is owed for the batch.

## 5. Questions for Dean

| # | Question | Recommendation |
|---|---|---|
| AQ-1 | Does the Library's `drawer/standard` 480 px include the shell's 48 px tab column (Shell R45: 432 + 48 = 480)? | Yes. The 15 sheets with 432 px panels then conform, and the Library record's row "432 px → 480 px" for this file is corrected |
| AQ-2 | Who replaces Kim Patel in this file? | Sam Jordan in every role, as decided for Estimating, checked against the Engineering file (AC-01) |
| AQ-3 | Sheet labels: the brief's "[signed in as …]" or the file's "[source]" bracket? | Both: keep the source and append "· as <person>" where the person is not Morgan Lee |
| AQ-4 | Collapsed docked menu: the accepted 12 px strip or the file's 56 px icon strip? | The accepted strip; withdraw A9 |
| AQ-5 | Should Projects draw RP-03 and FN-03 pages at all? | No: link to the owning pages |
| AQ-6 | Is the file now named "PPO - Projects module"? | Confirm; then align the Read me and record |

Cross-file questions that still govern this file: AC-01 (Kim Patel), AC-12 (Update 4) and AC-22 (SYN-OPP-000318) of PPO-FIGMA-ALIGNMENT-AUDIT.

## 6. Not checked and limits

- **Addenda.** A1, A2 and A3 were not supplied. The ledger cannot catch a fact that every file states the same wrong way, and the RP-03 owner text on IS01, the A3.8 queue totals and the Glasshouse 4 basis the Finance file reads were not tested.
- **Rendered checks.** One screenshot only. Clipping and truncation inside sheets, the register standard (CV1), one line per cell (CV2) and register footers were not checked; the record's own structural pass reports 4,234 one-line cells.
- **Chip tones (CT4)** were not extracted; the cross-file audit covers tone across files.
- **Handovers** with Sales, Finance claims and Engineering's SYN-ECR-000014 were not re-read on the other side.
- **Heuristics.** The after-09:00 scan finds times written with "Thu 5 Nov"; the people scan matches known first names; phone inputs were sampled up to eight per sheet, so 37 is a lower bound.
- **Library.** Read through its Read me, Controls, Record pages and variables; its Grid, Gantt, Forms, States and Phone pages were not compared part by part.

## 7. Next steps

1. Dean answers AQ-1 to AQ-6 and the cross-file AC-01, AC-12 and AC-22.
2. The Projects file's next build session applies the alignment batch in the order Major, Minor, Polish; the batch text and the extraction script stay in that session's working files so each fix can be re-proved.
3. In the same change as the batch, the Projects record updates its Shell basis, A9, A17, the inventory (`133:214`) and its file name.
4. Separate later changes, not made here: the Library record's alignment row for this file (after AQ-1); the Sales Handovers page weekdays (with PJA-09).
