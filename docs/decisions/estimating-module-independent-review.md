---
document_id: PPO-ESTIMATING-REVIEW-PROP
date: 2026-11-12
owner: Dean Fiedler
status: Independent read-only review of the accepted private Figma file for the Estimating module on 12 November 2026 at Dean's request, by a session that did not draw it; Dean decided all nine questions on the recommendations the same day (section 9); the review itself changed nothing in Figma; the alignment batch it leads to is a design amendment that needs Dean's acceptance and a new named version; no application code, route, migration, permission or deployment
versioning: git
---

# PPO - Estimating module independent review, 12 November 2026

**Owner:** Dean Fiedler · **Date:** 12 November 2026 · **Status:** Review findings and recommendations. Dean decided the questions of section 7 on the recommendations the same day (section 9). The review itself drew nothing; the alignment batch that follows is an amendment to the accepted file and needs his acceptance and a new named version that he saves.

## 1. The request

Dean asked for an audit of the Estimating module UI pages in Figma and asked five questions: are there gaps; can it be refined; can it look more professional; should new features be included; does it align with industry practice. He supplied two documents as aids, neither of which is in this repository: the cross-file Figma alignment audit prompt (whose checks ST, SH, CT, CV, FA, RA and GV are applied here to this one file) and the UI/UX conformance audit of 10 November 2026 against the candidate Version 3.0 blueprint.

The file is the one the [proposal record](estimating-module-refined-ui-proposal.md) (PPO-ESTIMATING-REFINED-FIGMA-PROP) calls "PPO - Estimating module (proposal)", accepted on 10 November 2026 with the named version "PPO - Estimating module (accepted)". **Where that record already decides something (A1 to A33, Q1 to Q12, DR-1 to DR-29), the decision stands** and is not reopened here; section 5 says which known items still matter.

## 2. Basis and limits

- **Read-only.** Every call through the Figma connector was a read. No node, variable, style, comment or version was created or changed.
- **Scan.** All 15 scope pages, 90 sections and 297 sheets, about 122,750 visible nodes and 29,340 text nodes, plus the Read me and Shell and kit pages. Each sheet was walked for labels, grid position, overlap, children outside bounds, instances and their main components, colour bindings, fonts and sizes, text styles, prototype reactions, annotations, development status, contrast of each text against its nearest solid background, and a set of text patterns (dates and weekdays, references, revisions, pronouns, spelling, placeholders, retired fixtures).
- **Renders.** 35 sheets were read at full size: E01, E02, E05, T01, T02, T10, Q01, Q03, Q05, Q08, Q13, Q21, Q27, K07, CS03, CT01, R09, V01, V07, W02, W04, O04, I01, AD02, X19, PS04, ST01, QP01, QP03, TB01, PH02, PH05, PH07, PH12 and PH13.
- **Authorities.** The proposal record; the [design-to-build standard](../standards/design-to-build-standard.md); the Shell rules export R1 to R125, in particular the record header toolbar R116 to R125; the [drawer widths decision](library-drawer-widths.md); [readable reference namespaces](readable-reference-namespaces.md); `src/shell/navigation.ts` and the page guidance under `docs/design/development/pages/`.
- **Not available.** Addenda A1 and A3 were not supplied; A3 is known only through the alignment prompt's summary of it. The connector cannot read version history, so whether the file changed after the named version was saved is not established. The Shell, Sales and Library files were not opened.
- **Limits of the scan.** 262 sheets were not read by eye. Chips and KPI tiles use non-breaking spaces, so pattern counts are lower bounds and three of the stale values below were found by reading the render, not by the scan. Prototype flows were counted, not played. Keyboard, screen-reader, zoom and reflow behaviour cannot be tested in a static file. Contrast was computed against the nearest solid fill; disabled controls and dialogs over a scrim were excluded by hand.

## 3. What holds

| Check | Result |
|---|---|
| Page order and template (ST1, ST2) | Read me, the Accepted separator, 15 scope pages, the Proposals separator, Shell and kit, Scratch. Both separators and Scratch are empty. Six sections per page with 360 px gaps |
| Sheets and labels (ST3, ST4) | 297 sheets, matching the record. Every sheet has a label 26 px above it and sits on the slot grid. No loose node, no overlap. The only children outside a sheet are the intended first-screen clips on QP03 and PH11 |
| Inventory (ST5, GV4) | All 306 node IDs the record cites resolve, and every sheet in the file is in the record. The Read me index agrees on 295 sheets; K01 and K08 were not machine-compared |
| Shell parts (SH1 to SH3) | Top bar, rail and right strip are instances on every staff sheet: seven actions in the accepted order with no Help button, six strip tabs |
| Colour (CT2) | Outside component instances, every solid fill, stroke and text colour is bound to one of the 67 "PPO colour" variables, each with a CSS name. Gradients, images and the paints inside the Shell copies were not checked |
| Type family (CT3) | Roboto only |
| Dates (CV4) | 1,251 date strings read; every weekday label among them is true to the 2026 calendar. No slash dates. ISO dates only inside three file names |
| Content | No placeholder text, no American spelling in the list tested, no long-form `SYN-PPO-` reference, no amount without A$ |
| Flows | 14 flow starting points, one per scope page except Interaction states, on 140 nodes with reactions |
| Substance | Immutable versions and revisions, approval bound to a fingerprint, the preparer excluded from approval, cost-source provenance, gate sentences in words, tracking with a privacy line, and the estimate-to-actual loop are drawn consistently and are ahead of common practice |

## 4. Findings

Severity follows the alignment prompt: **Blocker** an accepted file departs from a decided rule or shows a wrong fact; **Major** a shared rule, component or handover differs, or a Design ready item fails; **Minor** a convention drifts; **Polish** tidiness. Every item is owned by the Estimating file's next drawing session unless it says otherwise.

### 4.1 Wrong or contradictory facts

| ID | Sev. | Where | Found | Expected |
|---|---|---|---|---|
| ER-01 | Blocker | T01 to T06, T08 and the estimate host behind X19 | The title chip reads "v03 · draft" and the primary is "Submit for review", while the sub-line, the checks bar and the Estimate card read "v03 Reviewed Wed 4 Nov 2026" | One state per version: Reviewed, with the primary the record's next decision |
| ER-02 | Blocker | T01 | KPI tiles read cost A$96,350, margin 25.6 %, markup 34.4 % and "12 known lines · 2 Unknown"; heading chips read "Indicative · 2 Unknown lines" and, on T02, "14 · 2 Unknown". The Lines tab and the dataset give A$94,270.00, 27.2 %, 37.4 % and ten lines with none Unknown (the ten lines were re-added here and agree) | The dataset values |
| ER-03 | Major | T01, E01 | The checks bar reads "3 of 5" beside four ticks, shows a warning icon on "Costs sourced 10 of 10", and E01 reads "4 of 5" for the same estimate | One count, and an icon that matches it |
| ER-04 | Blocker | Q08 against Q03 | The issued document r01 of SYN-QUO-000214 is drawn twice with different content: Q08's card carries fingerprint 3f8c·b02d (Barossa's, on Q10), a climate computer summary and "valid 30 days"; Q03 carries 9a30·2c1e, the fertigation summary and "Valid until: Not configured" | One immutable document |
| ER-05 | Blocker | Q05, Q27, QP01 to QP04, PH11 | For revision 02 of SYN-QUO-000214: Options read "Alternative B · Not estimated" on Q03 and Q05 but "Option 1 Rainwater top-up… Option 2 Remote access licence…" on the customer page; payment terms read "30 % order · 60 % delivery · 10 % commissioning" on Q27 but "30 days from invoice" on Q05, Q20 and the customer page; the site reads "Riverbend VIC" on Q03 and Q04 and "Lindenow VIC" elsewhere | The exact-output preview and the customer page show the same document |
| ER-06 | Major | Q27 | The totals card reads "2 lines Unknown · not in totals" beside "10 lines · 0 Unknown" | 0 Unknown |
| ER-07 | Major | O04 | The heading chip reads "+A$2,610 more cost · +6.2 %"; the four lines, the footer and the dataset give +A$3,850.00, +7.0 % | +A$3,850.00 · +7.0 % |
| ER-08 | Major | TB01, PH02, PH12 | The tablet and phone workload still show the story before the re-alignment (Riverbend "Adopt evaluation 3 · Draft", Coastal Herbs SYN-EST-000277, four rows under "9 estimates", Unassigned 2) against E01 (Barossa Returned, the Express draft, Unassigned 1). PH02 is titled "My work" under the My Work tab; PH12 is titled "Intake & workload" | The E01 rows; one title and one tab |
| ER-09 | Major | X19 | The approve dialog is drawn signed in as Priya Nair, who prepared the revision and is refused by gate G7, over an estimate record | Jordan Blake, over the approval page |
| ER-10 | Blocker, to confirm | 74 texts on 35 sheets (E05, C00, seven workbench sheets, R01 to R17, X08, X09, PS09, TB11, V01, O11, O12, AD01, AD07) | Kim Patel as engineering owner and rule-set author. The alignment prompt lists Kim Patel among the fixtures A3 retires | The person A3 names. Fix owner: Dean to confirm, then the file |
| ER-11 | Minor | Q10, Q19, AD01 | "Sasha Clarke sends from her own mailbox"; "the PO names her Director"; "until he says otherwise" | Names or "their" |
| ER-12 | Minor | Docked menu, E05, V01 | The menu badge reads Sales briefs 4 where the Pulse reads 3 to act on; V01's "Waiting for me 4" has no row Priya Nair decides | One rule per count |
| ER-13 | Polish | ST01 | The contrast row for the Estimating accent prints the earlier value #1f8a7e and "AA large · UI only" beside 5.29 : 1 | #156e64 and "AA text" (A26) |

### 4.2 Alignment with the accepted Shell and Library

| ID | Sev. | Found | Authority |
|---|---|---|---|
| ER-14 | Blocker | The outputs menu is labelled "Reports" on 33 record sheets (T01 to T08, T16, Q03, Q08, Q10 to Q20, Q25 to Q29, O02 to O07) | R119: "it is named Outputs, not Reports" |
| ER-15 | Major | The record header is drawn by hand on each record and differs between them: the primary sits before Actions on T01 and Q13 and last on Q27; "Catch me up" is a title-row button on T01, Q03 and Q27 and also appears on B02 and Q28; the stepper sits in the breadcrumb row and reads "2 of 9 · Mine". The kit holds no copy of Shell / Record header · toolbar, and the record cites the Shell version of 8 November | R116 to R125 and the named version "Shell refined concept — accepted · record header toolbar" (10 November 2026): one component, one order, "n of N in view" |
| ER-16 | Major | Title-row overflow: T01's title truncates to "Riverbend Growers — Glasshou…" beside five controls; on Q03 and Q13 the Reports button is clipped under the right strip | R116: a one-row title |
| ER-17 | Question | Issue (Q07) and Send (Q08, Q10) are separate primaries, as A17 records | R117 names one primary, "Issue & send", for an approved revision. Section 7, Q-A |
| ER-18 | Minor | Side panels of 380 px (33 on the Configure & price, Rules studio and Estimate pages), 431 or 432 px and 320 to 340 px | The four widths of 11 November 2026: 360, 480, 640, 800. Align at this file's next reviewed change |
| ER-19 | Question | The docked menu has no entry for Estimating Pulse, Saved estimates or the Insights pages; "Priva Fertigation Configurator" stays beside "Specialist configurations" though Fertigation is drawn as one of four workbenches; the Administration sheets keep Estimating as the current rail item under a Settings breadcrumb | Shell file owner. Section 7, Q-F |

### 4.3 Design ready defects

| ID | Sev. | Where | Found |
|---|---|---|---|
| ER-20 | Major | V07, K07, W04, AD02, V01 | Content clipped with no ellipsis or scroll cue: the gate sentences in V07's Gates card ("Margin 17.0 % is below the"); the Proposed sell column on K07; the family tiles and the Route column on W04; the Draft v1 and Under v1 columns on AD02; the second group chip on V01 |
| ER-21 | Major | T10 | In the Lines read table the values sit one column left of their headers (item names under Key, quantities under Item) and the amounts truncate ("A$1,4…"). The Map to Variant and Mark One-off actions sit on the blank-rows notice, not on the unmapped-parts notice |
| ER-22 | Major | PH13, QP03, QP04, PH11 | PH13's "Return r02" and "Cancel" are 18 and 20 px high. On the customer phone sheets the "Download PDF" button frame is 18 px inside a taller bar. The standard asks for 44 px |
| ER-23 | Major | The phone sheets of the Sales briefs, Reviews, Quotations and Outcomes pages | 30 input texts below 16 px |
| ER-24 | Major | CS03, W02, E01 | CS03's primary label is green on navy at 2.37 : 1, and its selected span label is 3.07 : 1. On W02 the reasons an opportunity cannot be chosen ("Accept the brief first", "No brief") read at about 2.5 : 1. Due dates on E01 turn red with no word |
| ER-25 | Major | V07 | Approve and Return sit below the 900 px fold; K07, CS03, R09 and PH05 pin their decisions in a bottom bar |
| ER-26 | Minor | File-wide | About 1,300 texts at 10 px, below the 11 px floor the record sets: four-fifths inside the Shell copies (rail labels, badges), the rest avatar initials, CS03 dimensions and the customer page's section markers. KPI values at 22 px and the customer page's 15, 17, 18 and 24 px sit outside the ten text styles |

### 4.4 Conventions and finish

| ID | Sev. | Found |
|---|---|---|
| ER-27 | Minor | Revisions and versions in two forms. About 500 texts carry one digit (title chips "r1 · Issued", "r2 · Not approved"; briefs r1 and r2; rule sets v1 to v4; sources r2 and r3; "Template r4 · terms r6") beside about 1,000 with two. Q03 shows "r1 · Issued" in its title and "Revision 01" in its document |
| ER-28 | Major | Organisations use SYN-CO- (Riverbend Growers SYN-CO-000312, Westgate Flowers SYN-CO-000333, SYN Metro Aluminium SYN-CO-000418). The accepted [Sales record](sales-module-refined-ui-proposal.md) gives Riverbend Growers as SYN-ORG-000142, and the Settings record also uses SYN-ORG-. Reference widths: SYN-REF- has four digits on the Outcomes and Administration pages and six elsewhere; SYN-EAR-0004 and SYN-CAL-0003 have four, which the six-digit minimum for new references does not support. SYN-SRC-0024 matches the four-digit format the code implements and stays (Q-I) |
| ER-29 | Minor | GST wording in three forms in the application ("ex GST", "excluding GST", "excl."). Stage bars mix "30 Oct", "Fri 30 Oct" and "Mon 2 Nov" in one bar, and some chips drop "Not yet". The time zone is stated on three sheets only |
| ER-30 | Minor | Chip tones differ for one word: Unknown (Warning, Danger, Grey), Allowance (Info, Warning), Manual (Grey, Neutral), Awaiting review (Info, Neutral, Warning), Incomplete (Warning, Grey), Not saved (Grey, Warning) |
| ER-31 | Minor | Line flags without words. T02 tints rows 3 and 8 with no reason; Q27 colours the same rows amber with an icon and no reason; the T02 chip that explains it truncates to "Ano…" |
| ER-32 | Polish | Truncation. On E05 about fourteen secondary lines end in an ellipsis, including every KPI caption and every rule line. KPI captions truncate on T01 and K07, tile labels on Q01, the settings navigation and "Publish v1…" on AD02, and most checks-bar notes and sub-lines |
| ER-33 | Polish | Duplicated controls. W04 shows the five steps as a stepper and again as a left menu. Q08 has three Download PDF and two Send quotation controls. AD02 has Publish in the header and the footer. T01 has Catch me up as a button and as a strip |
| ER-34 | Polish | Register toolbars differ: a Columns button and a columns icon on V01, Q01 and PS04, the icon alone on E01. On V01 and Q01 the table stops short of the page foot and cuts its last group |
| ER-35 | Polish | Designer notes inside the interface: "Side panel 480 px (declared departure D8)" on O04; "Branding waits on D-024", "set at issue" and the "§ summary" markers on the customer page sheets other than QP02 |
| ER-36 | Polish | Labels. The Read me header and the kit section still say "(proposal)". Only the four derived chrome parts carry a Status line. The kit components are named "Sales / …". The Read me lists table, grid, dialog, panel, notice and the CT01 family as kit parts; they are frames |

## 5. The five questions

### 5.1 Gaps

1. **Components.** The kit holds seven components and five Shell parts. Status chips are instanced (1,578), but about 1,300 buttons are drawn by hand against 265 instances, and about 890 tabs, 130 filter chips and 1,260 fields are frames; the Tab and Filter chip components exist and neither appeared in any page's list of most-used components. A32 defers this to the Library. It is raised because ER-15, ER-20, ER-22, ER-33 and ER-34 are what hand-drawn controls produce.
2. **Variables and styles.** Colour is the only variable collection. There is no layout, spacing, radius or type variable and no effect style. Ten text styles exist and none of 29,340 texts uses one (A29). No annotation and no Ready for dev mark exists (A33).
3. **Responsive cover.** Seven pages have no phone sheet and six no tablet sheet (A31); one sheet in the file is 320 px wide. The customer quotation page has no tablet and no 320 px sheet, and the Estimate record has no phone sheet although PH05 and My Work lead to it.
4. **Registered routes with no sheet.** `/estimating/discovery/[id]/nursery`, `/estimating/discovery/[id]/nursery/assessment`, `/estimating/new` and `/estimating/cost-sources/new` have page guidance and no drawing. How `/estimating/fertigation` relates to the Fertigation workbench is not stated.
5. **States.** Not drawn: a long-running evaluation, an upload in progress or failed, a session that expires mid-edit, a partial result from a bulk action, and a quotation past its validity in the stage bar (QP07 draws it for the customer only).
6. **Undo, views and density.** No sheet shows Undo, though the standard adopts inline editing with undo. View tiles exist but saving and sharing a view is not drawn. Density appears only as a setting on AD08.
7. **Validity.** Issued documents print "Valid until: Not configured" while gate G5 depends on the validity end.
8. **Lines.** The Estimate Lines tab (T02) has no Unit column; Q27 and K13 have one.
9. **Still open from the record.** G1, G4, G7, G8, N-E6, N-E10, the A1 rename and the per-route page guidance.

### 5.2 Refinements

- Give the record's identity priority: move Catch me up to the Assistant tab or keep the strip alone; cut the sub-line to three facts, since the Linked chain card repeats the rest.
- On E01, Reference and Opportunity show the same digits in every row while Due is clipped under the frozen column. Put Stage and Due before Opportunity and hide Opportunity by default.
- Show the real rendering in the exact-output preview (Q05, Q03, V07). The approver confirms "I have read the exact output above" against a summary table.
- Let dashboard and card rows wrap to two lines, and move rule text into the "Why this order" popover.
- Pin the decision bar on every approval and review page. Use one stage-bar date form. Put a word beside every colour flag.
- Draw one toolbar order for every register and pin the footer.

### 5.3 Professional finish

The registers, the workbenches, Rules studio, Customer views and the conversion steps are at a professional standard and read as one product. Three things hold the file back.

1. **The customer quotation page** is the least finished surface and the only one a customer sees. Scope, options, exclusions and terms are run-on paragraphs separated by mid-dots; GST and the total including GST are 11 px grey text under the subtotal; validity is relative, not a date; internal markers and notes show. Redraw it as a document: a summary block with the total and a valid-until date, a numbered scope list, options as a priced table, a totals block (subtotal, GST, total including GST), exclusions and assumptions as lists, a contact card, what happens next, and the supplier details an Australian quotation carries, with a tablet and a 320 px sheet.
2. **Crowding and clipping** (ER-16, ER-20, ER-32): fewer controls in the title row, no cut column in a default view, no truncated caption on a KPI tile.
3. **Type and components**: apply the text styles with tabular figures, keep to the ramp, and replace hand-drawn controls with components when the Library is adopted.

### 5.4 New features

Rules first; AI only where marked, grounded in the record, labelled, reviewed before anything is saved. Each is a candidate for Dean, not a decision. N-E1 to N-E10 are already recorded and are not repeated.

| ID | Candidate | Basis | Recommendation |
|---|---|---|---|
| N-E11 | Source change watch: when a bound cost source changes or nears expiry, list the open estimates and quotations it touches with the margin effect and offer the successor revision | Rule. Extends gate G5 and the K16 what-if | Should |
| N-E12 | Similar delivered jobs: on a new discovery or estimate, show eligible reference cases for the same system family with their estimate-to-actual variance | Rule. Uses ES-10 | Should |
| N-E13 | What changed since revision 01, on the customer page of a successor revision | Rule. Uses the comparison on Q20 | Should |
| N-E14 | Lead time and earliest delivery per quotation line, flagged against the "quotation needed" date | Rule. Needs a Supply read | Could |
| N-E15 | Options the customer can tick on the customer page, with the total recalculated and the choice recorded as a response for staff to confirm | Rule. Needs D-024 | Could |
| N-E16 | Written acceptance on the customer page, with a question thread per section that lands in Conversations | Needs D-024 and its own decision record. No signing service is chosen here | Could |
| N-E17 | Margin waterfall per system on the estimate and in Configure & price | Rule. Deterministic arithmetic | Could |
| N-E18 | Scope and exclusion clauses proposed from the systems chosen, from a governed clause library | Rule. Needs DK-06 | Could |
| N-E19 | Paste rows from a spreadsheet into Configure & price lines with the import's row checks | Rule. Reuses the Excel import validation | Could |
| N-E20 | Estimator capacity strip on reassignment (X35): open work against due dates per person | Rule | Later |

### 5.5 Industry practice

| Area | Reading |
|---|---|
| Estimating and quotation control | Ahead of common practice: immutable revisions, approval on a fingerprint, separation of duties, sourced costs, explained gates, measured outcomes |
| Enterprise interface patterns | Aligned: one register standard, selection bar, states drawn once, list to record with a scoped stepper. Short of practice on undo, saved views and density (5.1 item 6) |
| Accessibility | A contrast proof exists and most text passes. ER-22 to ER-26 fall short of the standard's own checklist, and the contrast, target and reflow results remain design evidence, not WCAG 2.2 AA conformance |
| Design system | Below practice for a file of this size: colour tokens only, no applied text styles, few components, no annotations. All four are recorded as deferred to the Library |
| Responsive | Desktop first, by decision. The customer page should not be |
| Customer document | Below market practice in presentation, and without acceptance by decision D-024 |
| Australian conventions | AUD, GST shown separately and date forms are right. Validity should print as a date |
| Version 3.0 candidates `REQ-EST-001` to `REQ-EST-012` | Drawn: 001 to 003, 005 to 008, 010 and 012. Partly: 004 (no undo), 009 (no Expired state), 011 (keyboard order is on ST01; the grid's own keys are one line). The blueprint is a candidate, so this is a reading, not a conformance claim |

## 6. Recommended order

1. **Facts** (ER-01 to ER-13) in one pass, then re-run the story scan with matching that treats non-breaking spaces as spaces.
2. **Record header** (ER-14 to ER-16) once Q-A is decided: place the Shell's record header component on every record sheet.
3. **Design ready defects** (ER-20 to ER-26).
4. **Conventions and finish** (ER-27 to ER-36), with ER-18 if Q-G is yes.
5. **Customer quotation page** redrawn as a proposal on the Proposals side, for Dean's acceptance.
6. **Gaps** 5.1 items 3 to 8, then the candidates Dean chooses from 5.4.
7. Dean saves a new named version. The repository record is corrected in the same change as the file (the Shell version cited, the file name, the node IDs of any rebuilt sheet).

## 7. Questions for Dean

| # | Question | Recommendation |
|---|---|---|
| Q-A | R117 gives an approved revision one primary, "Issue & send"; the Estimating file and A17 keep Issue and Send as separate primaries | Follow the Shell, with the label set by the person's duties: "Issue & send" for someone who may do both, which runs the recheck, records the issue and opens the send composer; "Issue" for an issuer who may not send, after which the record reads "With Sales to send"; "Send quotation" once issued. Closing the composer leaves the revision Issued · not sent. Issue and Send stay two recorded decisions |
| Q-B | Who replaces Kim Patel as engineering owner and rule-set author? | Sam Jordan, the Engineering file's design engineer and default persona, as the one engineering owner: rule-set author, calibration proposer and engineering sign-off. Confirm against A3 before the batch |
| Q-C | Two-digit revisions and versions everywhere, including briefs and rule sets? | Yes, with the Sales file's own open item |
| Q-D | A default quotation validity, printed as a date, so G5 can be computed | 30 days from issue, as an illustrative value until D-010 and D-024 decide |
| Q-E | Redraw the customer page, and draw options and acceptance as proposals? | Redraw now; N-E15 and N-E16 as proposals that wait on D-024 |
| Q-F | Menu entries for Pulse, Saved estimates and Insights, and the future of the Priva Fertigation Configurator item | Decide in the Shell file: Estimating Pulse as the first item, as Sales Pulse is; Saved estimates as an "All estimates" view of Intake & workload, since `/estimating/estimates` has no register route; one Insights item for the Estimating extract of RP-02; keep the built Priva Fertigation Configurator item until the Fertigation workbench replaces it. On the Administration sheets Settings becomes the current rail item |
| Q-G | Move the 380 and 432 px panels to the Library's widths in this batch? | Yes: 360 or 480 by content, since a new named version is needed anyway |
| Q-H | Phone 390 for the Estimate record, and tablet and 320 for the customer page? | Yes to both. The phone estimate is a read-only summary, as PH06 is for a quotation; editing stays on the desktop (A31) |
| Q-I | Organisations: SYN-ORG-000142 in the accepted Sales record or SYN-CO-000312 in the accepted Estimating file for Riverbend Growers? | SYN-ORG- with the Sales numbers, because the code and two records use that family; check A3 for the other organisations |

## 8. Boundary

This record changes no design and accepts none. It corrects no other record: the proposal record's Shell version, file name and A17 wording are findings for the change that follows. It authorises no application code, route, migration, permission, integration, customer communication or deployment. Every record, person, value and date in the file is synthetic.

## 9. Decisions — 12 November 2026

Asked for his decisions, Dean asked for a professional recommendation on each, was given them, and answered: "proceed on your recommendations". Those words decide every question in section 7 as recommended there:

| # | Decision |
|---|---|
| Q-A | One state-driven primary as Shell rule R117 says, labelled by the person's duties: "Issue & send", "Issue" (then "With Sales to send") or "Send quotation". Issue and Send remain two recorded decisions. This supersedes the "Issue & send" part of A17 in the [proposal record](estimating-module-refined-ui-proposal.md) |
| Q-B | Sam Jordan replaces Kim Patel as the one engineering owner: rule-set author, calibration proposer and engineering sign-off |
| Q-C | Two-digit revisions and versions everywhere, briefs and rule sets included; date-based identifiers such as r2026-07 and supplier references such as SQ-2026-114 stay as they are |
| Q-D | Quotation validity printed as a date, set at issue as the issue date plus 30 days, labelled illustrative until D-010 and D-024 decide; an Expired stage is added |
| Q-E | The customer quotation page is redrawn as a proposal; selectable options (N-E15) and online acceptance (N-E16) are drawn as proposals that wait on D-024, and an online acceptance creates a response for staff to confirm |
| Q-F | The menu entries are decided in the Shell file, as recommended; this file makes Settings the current rail item on the Administration sheets |
| Q-G | Overlay panels move to the Library's widths, 360 or 480 px by content; panels that are part of a workbench layout keep their width |
| Q-H | A read-only phone 390 summary of the estimate, and tablet 1024 and phone 320 sheets for the customer page |
| Q-I | Organisations take the SYN-ORG- family with the Sales numbers (Riverbend Growers SYN-ORG-000142) |

The same answer adopts the process recommended with them: the session that wrote this review applies the alignment batch, after claiming the file in a draft pull request; the facts (ER-01 to ER-13) go first; one named version is saved at the end; a different session checks the changed sheets before Dean accepts them; N-E11, N-E12 and N-E13 are drawn as proposals; and the Sales file is the next file to audit.

What is drawn, with node IDs, is recorded in the proposal record when the batch is done. None of it is accepted until Dean says so and saves the named version.

