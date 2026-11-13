---
document_id: PPO-PRODUCTS-REVIEW-PROP
date: 2026-11-13
owner: Dean Fiedler
status: Independent read-only review of the accepted private Figma file for the Products module on 13 November 2026 at Dean's request, by a session that did not draw it, with the private file "PPO - Library" read for comparison; findings and recommendations only; nothing was changed in either file; no design is accepted or amended by this record; no application code, route, migration, permission or deployment
versioning: git
---

# PPO - Products module independent review, 13 November 2026

**Owner:** Dean Fiedler · **Date:** 13 November 2026 · **Status:** Review findings and recommendations. Nothing is drawn. The session that holds the file decides how to draw the fixes, Dean decides the questions in section 6, and any change to the accepted file needs a new named version that Dean saves.

## 1. The request

Dean asked for an audit of the Products module UI in Figma, linking the Catalogue and product record page. He also linked the "PPO - Library" file for comparison. He supplied two documents as aids, neither of which is in this repository:
- the cross-file Figma alignment audit prompt, whose checks ST, SH, CT, CV, FA, HO, RA and GV are applied here to this one file;
- the UI/UX conformance audit of 10 November 2026 against the candidate Version 3.0 blueprint.

The file is the one the [proposal record](products-module-refined-ui-proposal.md) (PPO-PRODUCTS-REFINED-FIGMA-PROP) calls "PPO - Products module". Dean accepted it on 12 November 2026. **Where that record already decides something (A1 to A24, the page assumptions, R1 to R5, G1 to G4, N-P1 to N-P12, P1 to P3), the decision stands** and is not reopened here. The only exception is A5, which section 6 raises as an authority conflict.

## 2. Basis and limits

- **Read-only.** Every call through the Figma connector was a read. No node, variable, style, comment or version was created or changed in either file.
- **Scan.** The scan covered all seven scope pages, 122 sheets and 7 notes cards: 6 pages of 6 sections, plus Interaction states and Administration with their empty sections. It also read the Read me cards, Shell and kit, both separators and Scratch. Each sheet was walked for:
  - its label, grid position, overlap and children outside its bounds;
  - instances and their main components, the record header instance and its texts, chip labels and tones, and primary buttons;
  - colour bindings, fonts and sizes, and the contrast of each text outside instances against its nearest solid fill;
  - text patterns: dates and weekdays, references and their digit widths, revision forms, pronouns, a US-spelling list, ISO dates, the earlier fixtures that Addendum A3.13 retires, forbidden words, placeholders, bare dollar amounts and GST wording.
- **Renders.** Three sheets were read at full size: CA03, PC03 and PP01.
- **Library.** In "PPO - Library" the review read the pages, the variable collections, the Controls page's component sets, the Drawer part `217:656` and every PPO colour value. The linked node is the Play · Three flows page.
- **Authorities.** The authorities were:
  - the proposal record;
  - the Shell rules export R1 to R125, in particular R45, R98 and the record header toolbar R116 to R125;
  - the [drawer widths decision](library-drawer-widths.md), the [library audit](library-audit.md) and the other Library records;
  - [readable reference namespaces](readable-reference-namespaces.md) and the [named-version handoff](figma-named-version-build-handoff.md);
  - the [Estimating review](estimating-module-independent-review.md) for the shared cost-source references;
  - the [shared records record](shared-records-refined-ui-proposal.md) for personas;
  - `src/products/model.ts` and the Products page guides.
- **Not available.** Addenda A1 to A3 were not supplied; A3.13 is known through the proposal record and the alignment prompt's summary. The connector cannot read version history. The Shell, Sales, Estimating and other module files were not opened, so cross-file statements rest on their records.
- **Limits of the scan.**
  - 119 sheets were not read by eye.
  - Contrast was computed against the nearest solid fill, not the rendered pixels.
  - The US-spelling check is a 30-word list.
  - Prototype reactions were counted on the Catalogue page only (none).
  - Keyboard, screen-reader, zoom and reflow behaviour cannot be tested in a static file.

## 3. What holds

| Check | Result |
|---|---|
| Page order and template (ST1, ST2) | Read me, the Accepted separator, seven scope pages, the Proposals separator, Shell and kit, Scratch. Both separators and Scratch are empty. Six sections per page with 360 px gaps and 60 px padding |
| Sheets, labels and inventory (ST4, ST5, GV4) | 122 sheets and 7 notes cards. Every label sits 26 px above its sheet and equals the frame name. There are no loose nodes and no overlaps, and no child sits outside its sheet. All 122 node IDs and 7 notes-card IDs in the record resolve to the sheet of the same code, and the Read me index lists every one |
| Shell parts (SH1 to SH5) | Top bar, rail, right strip, docked Sales menu (Products current, its views nested, R108) or the collapsed strip, and the record header are instances on every staff sheet. The frames named "Record header" are 1032 px wrappers around the instance, not redraws. The renders show seven top-bar actions in the accepted order with no Help button, and six strip tabs. The Administration sheets use the Settings rail with no strip (R13) |
| Record header (R116, R119, R121, R123) | On every record sheet: breadcrumb, one-row title with state chip and star, one sub-line, previous and next "n of N in view", Actions, and Outputs where the record has outputs. There is no New and no back arrow on desktop. The author sees Review disabled with the reason in words (CA04, PB03, ST03) |
| Colour (CT2) and type (CT3) | Outside instances, every solid fill and stroke is bound to a "PPO colour" variable except the 22 scrims. The 66 colours shared with the Library carry identical values. Roboto only |
| Contrast (RA2) | No text outside instances fails 4.5 : 1 (3 : 1 for large text) on any of the seven scope pages. Nine variable pairs were recomputed and pass. The ST03 proof reads 20 Pass |
| Dates, money and words (CV3 to CV8) | About 640 weekday labels, all true to the calendar. Times in AEDT only. No ISO date outside a file name. Every amount in A$. Every register footer reads "N shown · limit 100 · … · no total is claimed". Forbidden words appear only inside the rules that forbid them. No US spelling from the list and no gendered pronoun |
| Facts and personas (FA1 to FA4, FA7) | No earlier fixture appears as a current fact; Supported, Retired and the other retired values appear only inside "Built:" quotes. References use `SYN-PROD-` and `SYN-PRL-` (not the Settings `SYN-REL-` family). Personas match their roles in the other module records. Sasha Cole appears as the Equipment records owner on PD-04, the role the shared records record gives |
| Substance | The file is ahead of common catalogue practice. It shows exact revisions everywhere, independent review with a single publication act, units and money as recorded with no conversion or totals, evidence-only handovers, "uses known to you" and outcome-unknown states. Build difference cards separate the design from the build honestly |

No Blocker was found: no wrong fact, retired persona, "Reports" menu, Figma link or customer exposure.

## 4. Findings

Severity follows the alignment prompt:
- **Blocker:** an accepted file departs from a decided rule or shows a wrong fact.
- **Major:** a shared rule, reference family or handover differs, or an unrecorded Shell departure.
- **Minor:** a convention drifts.
- **Polish:** tidiness.
- **Question:** two authorities disagree.

Node IDs, expected values and fixes for every item are in the alignment batch the session sent Dean with this review.

### 4.1 Record header and Shell

| ID | Sev. | Where | Found | Authority |
|---|---|---|---|---|
| PDR-01 | Major | The twelve Pricing record sheets (PP01 to PP05, PP08 to PP10, PP12, X07, X08, TB05) | The same Published DP-25 record carries three different primaries. "Ask Estimating to review the source" appears on five sheets and "Open the source in ES-03", a navigation, on six. "Bind a cost source" appears on PP03 only, and PP01 also repeats it as a page-bar button | R117: one primary, state-driven, worded from the record's own decisions. Section 4 of the proposal record does not record a departure |
| PDR-05 | Minor | All record sheets | The header's State variant is chosen for its look. Published, Submitted and Reviewed products sit on the "Draft" variant, and an Unresolved relationship, restricted pricing and an abandoned import on "Closed". The Shell component's variants are named for quotation states | Shell component `9:987`. Fix owner: the Shell file (behaviour variants), then this file |
| PDR-06 | Minor | PC03, X09 | The Unresolved relationship record has Actions and a status sentence but no primary and no "Read only" | R117 |
| PDR-07 | Minor | PB05, X05, TB04 | The stepper reads "1 of 1 to review" | R120: "n of N in view" |

### 4.2 Library alignment

| ID | Sev. | Found | Authority |
|---|---|---|---|
| PDR-02 | Question | Eleven panels are 432 px beside the 48 px strip. They include Filters (X15) and Columns (X16), which the Library assigns to 360 px. The Library's Controls / Drawer draws 360, 480, 640 and 800 px panels with no tab column, while A5 reads 432 + 48 as the Library's 480. The Estimating review read the Library the other way (its ER-18) | Drawer widths decision, 11 November 2026; R45, R98; A5, accepted 12 November 2026. Section 6, Q-1 |
| PDR-13 | Minor | The kit's Tab, Filter chip, Avatar and KPI tile are never instanced, and the record tabs are hand-drawn 38 px frames. The Library's Tab is 48 px with a navy marker. The kit's chip tone "Green" is "Accent" in the Library, Button has a "Link" kind where the Library has a Link component, and the avatar initials are 10 px where the Library uses 11 | [Library audit](library-audit.md) section 6; A21 and P1 already defer this to Library adoption |
| PDR-14 | Minor | The Library's PPO colour holds 66 variables. This file holds the same 66 with identical values plus `action/primary` (#2d7128), which the record header's primary uses (A20) | Fix owner: the Library file, before publication |
| PDR-15 | Polish | 22 scrim fills are literal colours, and there is no scrim variable in this file or the Library | Fix owner: the Library, then this file |
| PDR-17 | Polish | No text or effect styles. None of the 67 colour variables carries a CSS code name | Library direction B3 |

### 4.3 References, words and tones

| ID | Sev. | Found | Authority |
|---|---|---|---|
| PDR-03 | Major | Cost sources read `SYN-SRC-000024` to `000029`, six digits, following the accepted PD-03 design. The Estimating [cost-sources design](cost-sources-design.md) (C9) and the Estimating review (Q-I) keep the four-digit `SYN-SRC-0024` that the code implements, so one record has two references across the two files | [Readable reference namespaces](readable-reference-namespaces.md) preserves implemented suffix formats. Section 6, Q-2 |
| PDR-08 | Minor | Products' own revisions are two-digit (r01 to r05). The records it quotes are not: `SYN-SRC-… r1` and `r2` (about 70 texts), `SYN-EST-000144 v1` and an asset's "configuration r2" | Addendum A2. Decide with the Estimating review's Q-C (section 6, Q-3) |
| PDR-09 | Minor | "Unknown" is Neutral for lifecycle (about 30 chips) and Warning for cost validity (about 13) | One tone per word |
| PDR-10 | Minor | About 30 evidence chips show the stored value "SourceReported" | PD-02 D8 names the value; the interface should use words. Section 6, Q-4 |
| PDR-19 | Polish | Cells read "excl. GST" and sentences "excluding GST". The usage is consistent but not written down, and the Estimating review found three forms | Record one app-wide rule |

### 4.4 Layout, accessibility and labels

| ID | Sev. | Found |
|---|---|---|
| PDR-11 | Minor | PH08's Done button is 32 px high, under the 48 px phone target |
| PDR-12 | Minor | Desktop sheets stack in one column at x 60 on six pages, where the template's slot grid has three columns. Import puts PI02 beside PI01 at x 1660, and sheets sit out of code order (CA03 above CA02; PI03 and PI04 below PI09) |
| PDR-16 | Polish | The Shell and kit section "Products parts · …" still says "(proposal, 12 November 2026)" |
| PDR-18 | Polish | Import plan counts are 24 px on PI05, PI08, X12 and X13, outside the 11 to 20 px scale. About 400 texts inside the Shell copies are 10 px, which is the Shell owner's to change |

### 4.5 Governance

| ID | Sev. | Found | Fix owner |
|---|---|---|---|
| PDR-04 | Major | No named version is saved. R1 and R2 were applied after the acceptance, and A20 leaves open which Shell version pins the record header's `action/primary`. Under the named-version handoff (rules 1, 2 and 5) the build basis cannot be cited until a version exists | Dean |
| PDR-20 | Minor | The six Products page guides under `docs/design/development/pages/` still describe the pre-design build, as A24 records | Repository, in its own change |

## 5. Counts

| Severity | Count | IDs |
|---|---|---|
| Blocker | 0 | — |
| Major | 3 | PDR-01, PDR-03, PDR-04 |
| Question | 1 | PDR-02 |
| Minor | 11 | PDR-05 to PDR-14, PDR-20 |
| Polish | 5 | PDR-15 to PDR-19 |

Of the 43 checks applied:
- 23 pass and 15 fail (each with its finding IDs);
- 3 were not checked: CV2 cell by cell, FA6 My Work queues and HO1 handovers, because the other files were not read;
- 2 are not applicable: HO3 customer previews and EX customer exposure.

The Version 3.0 conformance audit of 10 November 2026 does not assess Products; its cross-cutting items UXA-10 (component acceptance pending) and UXA-13 (one transaction-state vocabulary) bear on PDR-13 and PDR-05, and the file already draws "Publication not confirmed: check status" and outcome-unknown states.

## 6. Questions for Dean

| # | Question | Recommendation |
|---|---|---|
| Q-1 | The Library's drawer widths are panel widths: its Drawer part draws 480 px with no tab column, and filters and column choosers take 360. The Shell draws a 432 px panel beside the 48 px strip (R45, R98), and Products A5 reads that as the Library's 480. Which reading governs module files? | The Library's, because its part draws it and it assigns widths by content. At this file's next version: Filters and Columns 360 px; editing, binding, review, lifecycle and row detail 480 px. The Shell's snapshot drawer becomes 480 px at its next version. A5 and the Estimating review's ER-18 then agree |
| Q-2 | Cost sources: `SYN-SRC-000024` (Products, from the accepted PD-03 design) or `SYN-SRC-0024` (Estimating and the code)? | `SYN-SRC-0024`. Cost sources are Estimating's records, the code implements four digits and the namespace decision preserves implemented formats. Products shows a reference exactly as its owner does |
| Q-3 | Two-digit revisions for the records Products quotes (sources, estimates, asset configurations)? | Yes, in one batch with the Estimating file's Q-C |
| Q-4 | Show "Source reported" in the interface while the stored value stays SourceReported? | Yes. The Build difference cards keep quoting the stored value |
| Q-5 | Pricing header primary | "Bind a cost source…" for the person with the bind duty. "Ask Estimating to review the source" moves to the binding row and Actions, and "Open the source in ES-03" becomes a link |
| Q-6 | Save the named version now, before the alignment batch? | Yes, as "PPO - Products module (accepted)", so the build of section 6 of the proposal record can be cited. Confirm the Shell version it pins (A20); the batch then gets a second version |

## 7. Recommended order

1. Dean answers Q-1 to Q-6 and saves the named version (PDR-04).
2. The file's next session applies the Majors: PDR-01, then PDR-02 and PDR-03 once Q-1 and Q-2 are answered.
3. It applies the Minors and Polish in the order of the alignment batch. PDR-13 waits for Library adoption, and PDR-05 for the Shell's behaviour variants.
4. Owners outside the file:
   - **Library:** PDR-14, PDR-15 and PDR-17.
   - **Shell:** PDR-05 variants and the 10 px labels in PDR-18.
   - **Estimating file:** its side of PDR-03 and PDR-08.
   - **Repository:** PDR-19 and PDR-20.
5. Dean saves a new named version. The proposal record is corrected in the same change: A5 under Q-1, A9 under Q-2, section 13 and any rebuilt node IDs.

## 8. Boundary

This record changes no design and accepts none. It corrects no other record: the proposal record's A5, A9, A20 and section 13 are findings for the change that follows. It authorises no application code, route, migration, permission, integration, customer communication or deployment. Every product, supplier, price, file and person in the file is synthetic.
