---
document_id: PPO-SALES-REVIEW-PROP
date: 2026-11-12
owner: Dean Fiedler
status: Independent read-only review of the accepted private Figma file for the Sales module on 12 November 2026 at Dean's request, by a session that did not draw it; Dean decided the questions on 14 November 2026 as recommended (section 11) and the alignment batch was applied in the file the same day (section 12; proposal record section 15); a different session checked the live file on 14 November 2026 and recommends acceptance after the fixes it lists (section 13); this record accepts no design; no application code, route, migration, permission or deployment
versioning: git
---

# PPO - Sales module independent review, 12 November 2026

**Owner:** Dean Fiedler · **Date:** 12 November 2026 · **Status:** Review findings and recommendations. Nothing is drawn. The session that holds the file decides how to draw the fixes, Dean decides the questions in section 9, and any change to the accepted file needs a new named version that Dean saves.

## 1. The request

Dean asked for an audit of the Sales module UI in Figma, sent the link of the file (opened at its Contacts, customers, products and insights page) and offered the PPO - Library file as a reference. He supplied two documents as aids, neither of which is in this repository: the cross-file Figma alignment audit prompt, whose checks ST, SH, CT, CV, FA, HO, RA and GV are applied here to this one file, and the UI/UX conformance audit of 10 November 2026 against the candidate Version 3.0 blueprint. The whole file was audited, not only the page the link opened.

The file is the one the [proposal record](sales-module-refined-ui-proposal.md) (PPO-SALES-REFINED-FIGMA-PROP) describes, accepted on 9 November 2026; the build basis that record names is the later of the two versions named "PPO - Sales module (accepted) · batch 2 · N13". **Where that record already decides something (A1 to A10, N1 to N4, N13, the corrections C1 to C6), the decision stands** and is not reopened here.

The [cross-file alignment audit](https://github.com/deanrfiedler-gif/powerplants-one/pull/925) (PPO-FIGMA-ALIGNMENT-AUDIT, open as pull request 925 when this review was written) covers thirteen module files and counts 23 findings that touch this file. This review read the one file in more depth, re-tested eleven of them, cites the AF numbers where an item overlaps, and records what it adds. Section 5 maps the two.

## 2. Basis and limits

- **Read-only.** Every Figma call was a read: 33 calls, including three on the accepted Shell file and the PPO - Library page list as comparison bases. No node, variable, style, comment or version was created or changed.
- **Scan.** All eight scope pages, 114 sheets and about 62,000 nodes, plus the Read me and Shell and kit pages and the empty separators. Each sheet was walked for labels, grid position, children outside bounds, hidden nodes, instances and their main components, colour bindings, fonts and sizes, truncation, prototype reactions, contrast of each text against its nearest solid background, chip tones, avatar initials, and a set of text patterns (weekdays against the 2026 calendar, references, revisions, time zones, GST wording, pronouns, spelling, retired fixtures, events later than the story clock). Text was normalised for non-breaking spaces before matching.
- **Context reads and renders.** The R01 record header, the R02 estimates table, C360, the SI01 Hillview row, the L01 lead rows, P01, A01, TB18, PH11, H01, W01 and AC01 were read in context; the R01 header, a D04 board card, PR01 and PH11 were rendered and inspected.
- **Inventory.** All 157 node IDs the proposal record cites were resolved (section 4.6).
- **Authorities.** The proposal record; the Shell rules export R1 to R125 and the accepted Shell file's record header toolbar and workspace menus; the [drawer widths decision](library-drawer-widths.md) and the other Library records; [build from the named Figma version](figma-named-version-build-handoff.md); the [Estimating module review](estimating-module-independent-review.md); and the later module records that state Addendum A3 facts (Reporting, Customers, Sites & Equipment, Customer portal, My Work).
- **Not available.** Addenda A1, A2 and A3 were not supplied. A3 facts are taken from the alignment prompt and from later records that quote them, and are marked "to confirm" where only one record states them. The connector cannot read version history, so whether Dean saved a version after 9 November 2026 is not established. The Estimating, Reporting, My Work and Customers, Sites & Equipment files were not opened; their values come from their records and from the cross-file audit.
- **Limits.** About 100 sheets were not read by eye. Contrast was computed against the nearest solid ancestor fill; a background drawn as a sibling shape is missed, so the failures are a lower bound. Prototype flows do not exist in the file (recorded). Keyboard, screen-reader, zoom and reflow behaviour cannot be tested in a static file; touch-target sizes were not measured.

## 3. What holds

| Check | Result |
|---|---|
| Page template (ST1, ST2) | Read me; the Accepted separator; eight scope pages; Shell and kit; the Proposals separator; Scratch. Both separators and Scratch are empty. Every scope page keeps the six sections in order, omitting those it has nothing for, with 360 px gaps on all eight pages |
| Sheets and labels (ST3 to ST5) | 114 sheets, as the record and the Read me index state. Every sheet sits on the slot grid (desktop at x 60, 1660 and 3260 in 1,060 px rows; tablet at x 60, 1144, 2228 and 3312; phone at a 450 px pitch) with a one-line label 26 px above it at the sheet's width. No loose node, no child outside its sheet, and one hidden node in the file, the helper text the record names |
| Shell (SH1, SH2) | Top bar, rail and right strip are instances on every desktop sheet; the top bar holds New, Assistant, Calendar, Conversations, Page guide, Notifications and Account in that order with no Help button; the right strip has the six tabs and the divider; the preview drawer is 432 px plus the 48 px tab column (R45, R98); the 1024 bar has the accepted 332 / 360 / 332 zones |
| Colour and type | Outside the Shell copies, fills and strokes are bound to the 66 "PPO colour" variables except the recorded forecast ramp and scrims and the items in SR-30. Roboto is the only family |
| Content | No American spelling in the tested list; no amount without A$; no ISO date except the import file's own values on AD03; probability, weighting and score appear only in rules that forbid them; no Delete action. Kim Patel, Sasha Cole, Mei Tan, Grace Holt, Jamie Ellis, Carl as a person, `SYN-PPO-`, `SYN-CO-` and `SYN-REL-` are absent. "Gatton pack-house" is Lockyer Lettuce's site, not Hillview's; Priya Shah is Hillview's operations manager, consistent with the Customer portal record |
| Registers | No wrapped register cell; no search box in the content area; frozen columns, edge shadows, filtered-empty, loading, could-not-load, denied and stale states drawn as the record says |
| Substance | Separate outcomes (Won, handover obligation, receiving, conversion), archive instead of delete, versioned pipeline configuration, explained rule-based signals with no score, counts that state their rule, a denied record that reads as not found, and private-by-default email. This is ahead of common CRM practice and should be kept as it is |

## 4. Findings

Severity: **Blocker** a wrong or contradictory fact on an accepted sheet where the true value is known, from the file itself or from Addendum A3 as the prompt quotes it; **Major** a fact, role or reference that differs from another file or record whose authority is not settled, or a departure from a Shell, Library or accessibility rule; **Minor** a convention that drifts without changing meaning; **Polish** tidiness. Every item is owned by the Sales file's next drawing session unless it says otherwise, and every change needs a new named version. The scratch findings file gives each item's rule, expected value, check and node IDs in full.

### 4.1 Wrong or contradictory facts

| ID | Sev. | Where | Found | Expected | Cross-file |
|---|---|---|---|---|---|
| SR-01 | Blocker | R01 `16:2456`, R02 `46:7267`, R04, R07, X05, C360 `39:6902`, TB14, PH09 | The Riverbend deal record contradicts itself. R01's linked work reads "Sales brief · Not started" while R02, R04 and R07 say brief r1 was submitted Wed 4 Nov 2026 16:10 and accepted Thu 5 Nov 08:30, and X05 says it is "still awaiting Estimating". R01's signals strip reads "Quotation · Draft r1 · A$129,500" and the R02 table lists "Quotation SYN-QUO-000204 · r1 · Draft · Not issued", while R01 links "SYN-QUO-000214 · Draft r2" and C360 reads "Quotation SYN-QUO-000214 r1 issued by Estimating · Fri 31 Oct, 16:20" beside "Estimate r1 … quotation not issued". The estimate is SYN-EST-000412 and SYN-EST-000398 on R02 and SYN-EST-000204 on C360 | One story: brief r01 submitted and accepted; SYN-QUO-000214 with r01 issued and r02 in draft; the estimate and discovery references the Estimating file uses (SYN-EST-000312, SYN-DISC-000312) | AF-129, AF-136 |
| SR-02 | Blocker | R01 and clones; L01 `21:2710`, X02, TB04 | SYN-LEAD-000208 is the Riverbend deal's source lead ("converted 24 Oct 2026", captured by Tom Reid) and, on Leads, a New inbox lead for "Gippsland Dairy Gardens · to confirm" | One record per reference | New |
| SR-03 | Blocker | At least 31 sheets on five pages | 151 date strings whose weekday is wrong for 2026, most of them right for 2025: "Fri 24 Oct 2026" and "Fri 31 Oct" (Saturdays), "Mon 3 Nov" (a Tuesday), "Thu 6 Nov 2026" (a Friday), "Mon 1 Dec 2026" (a Tuesday). The story day itself reads "Wed 5 Nov" on TB06, TB07 and AD05. The file also writes "Tue 3 Nov" and "Wed 4 Nov" correctly, so both calendars are present | The 2026 weekday for each date | AF-078 (146 strings) |
| SR-04 | Blocker | C01, C02, C03, C360, X22, TB06, TB14, PH08 | Noah Clarke as Riverbend Growers' billing contact | Noah Patel (A3.9; confirm the role) | AF-005 |
| SR-05 | Blocker | SI01 `88:19242`; the Hillview rows on C01, O01, X21, X22, TB06 and TB07 to check | Hillview Growers at "71 Hillview Rd, Werribee South VIC 3030", "Werribee VIC", "Glasshouse 4 · Werribee" | Tatura VIC (A3.9), with the site the Customers, Sites & Equipment file draws | New |
| SR-06 | Blocker | PR01 `42:7122`, TB08 | "412 in catalogue", view tiles with totals, a five-page pager with "25 per page" beside 12 rows, "Showing 12 of 412", TB08 "12 of 248"; twelve `SYN-PRD-F-`, `-M-` and `-V-` references with four digits; "cat r3 · tech r1" | The bounded read and references of A3.13 | AF-003, AF-004 |
| SR-07 | Major | Deals page (avatar PN ×40), Leads page (×21), TB15, TB16, H02, H03, R07 | Priya Nair owns deals and leads and is also the Estimating receiver of Sales briefs; Kate Morgan does not appear | The four deal owners of A3.7 as the Reporting record (SP-A3) gives them: Dean Fiedler, Sasha Clarke, Kate Morgan, Tom Reid; Priya Nair stays the estimator | Reporting SP-A3 |
| SR-08 | Major | W01, W02, X16, AC02, X18 to X20, C360 against TB10, TB14, TB16 | The Projects receiver is Jordan Wu on desktop and Jess Wong on tablet; the Service owner of SYN-SR-000512 is Lena Brooks on C360 and Ravi Kumar on TB14. Jordan Wu and Lena Brooks appear in no other record | One person per role; the A3 personas | New |
| SR-09 | Major | TB18, PH11, P01, X10, X13, TB05, PH06, H02 | TB18 shows the week of 9 to 13 Nov and PH11 "Thu 12 Nov 2026" with "now 09:40", where A01 shows 2 to 6 Nov at 09:00; P01, X10 and X13 list a call made "Today 09:42" at a 09:00 story time; TB05 and PH06 date the tasks Wed 29 Oct, Fri 31 Oct and Mon 3 Nov where T01 has Thu 29 Oct, Mon 2 Nov and Wed 4 Nov; H02 says a model was "confirmed at the site visit on Fri 6 Nov" | Thu 5 Nov 2026, 09:00 on every sheet, or a labelled later frame | AF-011 (due in 3 h) |
| SR-10 | Major | A01, AD04 | "Week 45 · Brisbane AEST (UTC+10)"; digest "07:30 · Brisbane AEST" | Melbourne AEDT for the signed-in staff member | New |
| SR-17 | Major | D04, IN02 | Deals by stage 9 / 8 / 11 / 6 / 4 against Reporting's 9 / 11 / 10 / 5 / 3 | Dean's decision (Q-G) | AF-074 |

### 4.2 Shell, Library and ownership

| ID | Sev. | Found | Authority | Cross-file |
|---|---|---|---|---|
| SR-12 | Major | The record header is a hand-drawn frame on 38 record sheets: an ellipsis button instead of a labelled Actions menu, Lost as a title-row button, no Outputs, and a stepper reading "7 of 38" and "1 of 14". The kit holds no copy of the toolbar component, and the record and Read me cite only the Shell version of 8 November | R116 to R125 and the named version "Shell refined concept — accepted · record header toolbar" (10 November 2026); the proposal record's follow-up 1 in section 13.6 | AF-008 (graded Blocker there) |
| SR-13 | Major | The kit has no Shell / Workspace menu · collapsed strip, so registers show the rail only | The Shell's collapsed strip `29:3119`, which the cross-file audit finds in ten other files; the Estimating record lists it as a Sales follow-up | New |
| SR-14 | Major | The Sales view of Products (PR01) has "New draft revision" as its primary | One owner per page; the file's own Page template card says shared records are authored in their own domain | New |
| SR-15 | Major | R02 labels a "Discovery workspace SYN-EST-000412"; `SYN-REF-` is a Service referral here and a reference case in the Estimating file | One family per kind | AF-141 |
| SR-16 | Major | The phone tab bar restyle of 10 November (record section 14) has no recorded named version | Build from the named version, rule 5 | AF-077 |
| SR-19 | Minor | On D02 the docked menu nests no views under Deals while Deals is current | R108 and Q21 | New |
| SR-20 | Minor | Eight side panels are 432 px; the Reschedule, Reopen deal and Prepare handover dialogs are 480, 520 and 760 px | Drawer widths of 11 November 2026 (360, 480, 640, 800); dialogs 560 to 720 px (A5) | Library record section 4 |

### 4.3 Accessibility and design-ready defects

| ID | Sev. | Found |
|---|---|---|
| SR-11 | Major | Text below 4.5:1 on accepted sheets: the D04 health-signal chips (#3D9A37 on #EDF5E9 at 10 px, 3.21:1, nine texts), the TB02 readiness line (3.21:1), A01's "Thu 5" header (3.07:1) and now label (3.57:1), the TB18 and PH11 now labels (#E5533D on white, 3.73:1) and the ST01 keyboard-order badges (3.57:1). The record's P10 contrast proof says every pair passes |
| SR-29 | Minor | The phone tab bar shows Deals as current on every phone sheet, including Activities (a recorded limit), and its five cells are unnamed layers |
| SR-22 | Minor | About 90 texts at 10 px outside components and more inside them (avatar initials, rail labels), KPI values at 22 px, some 15 and 17 px, against the record's 11 to 20 px; no text styles in the file |

### 4.4 Conventions and finish

| ID | Sev. | Found | Cross-file |
|---|---|---|---|
| SR-18 | Minor | Docked-menu badges differ from the pages they open: Tasks 6 (T01: 12 active, 3 overdue, 2 due today), Sales Inbox 3 (M01: 6 unread), Hand over to Estimating 5 (H01: 4 for Sales to act, 9 open), Won-deal receiving 2 (W01 groups 4, 2, 3, 1 and 6). The Shell's own Sales menu also shows Sales Inbox 3 | Cf. ER-12 |
| SR-21 | Minor | One word, several tones: Planned (Warning, Info, Neutral), Open (Success, Neutral), Draft (Grey, Neutral, Warning; the Library sets Neutral), Submitted, Missing, Current, Decision maker, Private to you; stage chips are Tint in registers although R12 makes stages Neutral | AF-140 |
| SR-23 | Minor | GST written "ex GST" 27 times and "excl. GST" 14 times | — |
| SR-24 | Minor | Revisions in four forms: "r1", "Rev 3" in the Deals Quoted column, "cat r3 · tech r1" on Products, and "Revision"; pipeline and history versions v1 to v8 | AF-002 |
| SR-25 | Minor | Three gendered pronouns for synthetic people (R04, X18, AD05) | AF-006 (graded Blocker there) |
| SR-26 | Minor | X18 to X20 show the Hillview review held on Thu 12 Nov over AC02, which is Planned at the story time, without a later-frame label; AC02 shows referral SYN-REF-000802 submitted on 4 Nov while X19 prepares it from the 12 Nov visit | — |
| SR-27 | Minor | Read me cards out of date: the header still says 52 sheets await a named version and cites the 8 November Shell version; the Page template card says a further version is needed though Dean re-saved; the index gives drawers as 432 px and lists R03 twice; the audit card's R4 reads "12 d in stage" where D04 reads "4 d"; nothing mentions the phone tab bar change | AF-007 |
| SR-30 | Polish | Literal paints on the eight Flows and notes cards (#FFFFFF, #E9ECF1) and on the D07 selection bar | AF-009 |

### 4.5 Repository record

| ID | Sev. | Found |
|---|---|---|
| SR-28 | Minor | Of the 157 node IDs the proposal record cites, 140 resolve. Three are Shell-file IDs, correctly cited. Fourteen no longer exist: eleven section IDs from before the restructure into pages (`11:88`, `16:2455`, `21:2709`, `25:3470` to `25:3473`, `61:11501`, `63:14522`, `69:15443`, `89:23786`) and the three proposal sheets folded into accepted sheets (`69:15988`, `69:16429`, `69:16971`). All 114 sheet IDs resolve and sit on the pages section 13.6 gives |

## 5. Relationship to the cross-file audit

| Cross-file finding | This review |
|---|---|
| AF-002, AF-003, AF-004, AF-005, AF-006, AF-007, AF-008, AF-009, AF-074, AF-077, AF-078 | Confirmed: SR-24, SR-06, SR-06, SR-04, SR-25, SR-27, SR-12, SR-30, SR-17, SR-16, SR-03 |
| AF-010 (23 labels with truncation disabled), AF-011 ("due in 3 h" at 09:00), AF-129, AF-131, AF-136, AF-140, AF-141, AF-164 and the audit's other shared findings | Not re-tested here; consistent with what was read, and cited where they touch an SR item |
| — | Added: SR-01, SR-02, SR-05, SR-07 to SR-11, SR-13 to SR-15, SR-18 to SR-23, SR-26, SR-28, SR-29 |

Two gradings differ. The cross-file audit grades the record header (AF-008) and the pronouns (AF-006) as Blockers; this review grades them Major and Minor, because the header is an open follow-up the proposal record names and the pronouns change no fact. Either grading puts both in the next batch.

## 6. Alignment matrix

The scratch matrix gives each of the 43 checks a value and a reason: 14 Pass, 25 Fail, 3 Not applicable (CT5, HO3, EX1) and 1 Not checked (FA6, because the My Work file was not read). The passes are ST1 to ST5, SH1, SH2, CT1, CV1, CV2, CV7, CV8, RA1 and GV2. ST1 passes against the file's own template; the alignment prompt places Shell and kit after the Proposals separator (AF-164, Q-I).

## 7. Professional finish and gaps

The registers, the record layout, the administration pages and the states are at a professional standard and read as one product with the Shell. What holds the file back is not layout but trust in the data: a reviewer who opens the Riverbend deal sees three quotation states, three estimate references and two brief states (SR-01), and a reader who checks a date finds a weekday that does not exist (SR-03). Fixing the story is worth more than any visual refinement.

Beyond the findings, the record's own open items stand: G12 (Insights drill-through and win/loss), N5 to N12, board swimlanes, the offline state, prototype links, and tablet and phone variants of the dialogs. Two gaps follow from this review. The Activities page has no tablet or phone sheet at the story time once SR-09 is fixed, and the Deal record has no 320 px sheet although the phone record is the densest phone layout.

## 8. Recommended order

1. **Dean's questions** Q-A to Q-E and Q-G, which fix the values the batch writes.
2. **Facts** SR-01 to SR-10 and SR-17 in one pass, then re-run the weekday, reference, name and story-clock scans.
3. **Shell** SR-12 and SR-13: copy the record header toolbar and the collapsed strip from the Shell, place them, and cite the 10 November Shell version.
4. **Accessibility** SR-11, SR-22 and SR-29.
5. **Ownership and conventions** SR-14, SR-15, SR-18 to SR-21, SR-23 to SR-27 and SR-30.
6. Dean saves a new named version covering this batch and the phone tab bar (SR-16). The proposal record is amended in the same change: the version, the Shell basis, the node IDs (SR-28) and any rebuilt sheet.

The paste-ready alignment batch, the findings and matrix files and the fact-ledger difference were sent to Dean with this review; they are not committed.

## 9. Questions for Dean

| # | Question | Recommendation |
|---|---|---|
| Q-A | Correct the weekdays by keeping each date and fixing its weekday, and take the SYN-QUO-000214 r01 issue date from the Estimating file? | Yes. Keep dates, fix weekdays. For r01, Fri 30 Oct 2026, as the accepted Estimating file has it (30 October 2026 is a Friday), and correct C360's "Fri 31 Oct" in the same batch; the other files follow AF-136 |
| Q-B | Kate Morgan in place of Priya Nair as owner of deals and leads, with Priya Nair kept as the estimator? | Yes, as A3.7 gives the deal owners; it also removes the same person from both sides of the brief handover |
| Q-C | Jess Wong as the Projects receiver and Ravi Kumar as the Service owner on every sheet, retiring Jordan Wu and Lena Brooks? | Yes, subject to A3 |
| Q-D | Which Hillview site and address? | The one the Customers, Sites & Equipment file draws at Tatura VIC; that file owns sites |
| Q-E | Melbourne AEDT as the zone stated for staff? | Yes |
| Q-F | Move the 432 px panels to the Library widths in this batch? | Yes: Filters and Columns at 360 px; New deal, New lead, New person and the side forms at 480 px; New organisation at 640 px if it keeps two columns. Bring the three dialogs inside 560 to 720 px |
| Q-G | Which stage distribution stands for the 38 open deals? | The one A3.7 states, if it states one; otherwise the accepted Sales board, and the Reporting file aligns |
| Q-H | Keep the Sales view of Products read-only? | Yes: replace "New draft revision" with "Open in Products" |
| Q-I | Shell and kit before or after the Proposals separator? | After, as the alignment prompt and the Estimating file have it; update the Sales Page template card |
| Q-J | Two-digit revisions and versions everywhere, including product catalogue and technical revisions and pipeline versions? | Yes, as the Estimating review's Q-C recommends |

## 10. Boundary

This record changes no design and accepts none. It corrects no other record: the proposal record's Shell basis, named versions and node IDs are findings for the change that follows. It authorises no application code, route, migration, permission, integration, customer communication or deployment. Every record, person, value and date in the file is synthetic.

## 11. Decisions — 14 November 2026

Dean renamed the file "PPO - Sales module (accepted)", the name the proposal record and other records cite (PPO-STD-001 section 13.2: existing names cited by a record do not change). Asked for a professional recommendation on each question in section 9, he was given them and answered: "proceed on your recommendations". That decides Q-A to Q-J as follows.

| # | Decision |
|---|---|
| Q-A | Each date is kept and its weekday corrected to the 2026 calendar. The one date that moves is the issue of SYN-QUO-000214 r01, which reads Fri 30 Oct 2026, as the accepted Estimating file has it |
| Q-B | Kate Morgan owns every deal and lead that Priya Nair owned; Priya Nair stays the Estimating receiver. Checked against the A3 facts the later records quote before the batch, and the result recorded |
| Q-C | Jess Wong is the Projects receiver (the Projects file's initiation page names "Jess Wong · receiving owner (default)") and Ravi Kumar the Service owner on every sheet; Jordan Wu and Lena Brooks are retired |
| Q-D | Hillview Growers is sited at Tatura VIC, with the site name and address the Customers, Sites & Equipment file draws; times stay in Melbourne time |
| Q-E | Staff times are stated in Melbourne AEDT (UTC+11 in November); a site's own zone appears only where that site's time is shown |
| Q-F | Overlay panels take the Library widths: 360 px for Filters and Columns, 480 px for the side forms; dialogs sit within 560 to 720 px; the 480 px preview drawer is unchanged |
| Q-G | The Sales stage distribution (9 / 8 / 11 / 6 / 4) stands and the Reporting file aligns to it, unless addendum A3.7 states a distribution, in which case both files take A3's |
| Q-H | The Sales view of Products is read-only and follows the Products file's Sales view (CA14): the bounded-read wording, no totals, view-tile counts or pager, the A3.13 references, and "Open in Products" in place of "New draft revision" |
| Q-I | Shell and kit moves below the Proposals separator; the pages take the short names; Administration · Sales sits after Interaction states; IN01, IN02 and TB12 move to their own Insights page; the Page template card is updated |
| Q-J | Revisions and versions take two digits everywhere (r01, r03, v07); external file names keep their own form |

The process is the one Dean set for the Estimating batch. This session claims the file in a draft pull request, applies the batch with the facts first, and records what changed. Dean saves one named version at the end; it also pins the phone tab bar change of 10 November. A different session checks the changed sheets before Dean accepts them.


## 12. Batch applied — 14 November 2026

The batch was applied in the file on 14 November 2026; [section 15 of the proposal record](sales-module-refined-ui-proposal.md#15-alignment-batch--14-november-2026) records each change, the new node IDs and the scans. No design is accepted by it: Dean saves the named version "PPO - Sales module (accepted) · alignment batch", and a different session checks the changed sheets first.

| Findings | Outcome |
|---|---|
| SR-01 to SR-05, SR-07 to SR-10, SR-25, SR-26 | Fixed as decided under Q-A to Q-E |
| SR-06, SR-14 | Fixed: PR01 and TB08 are the read-only Sales view (Q-H) and follow the Products file's CA14 rows and references (proposal record section 15.7) |
| SR-11, SR-20, SR-21, SR-23, SR-24, SR-27, SR-29, SR-30 | Fixed; no text below 4.5:1 or under 11 px remains outside components |
| SR-12, SR-13 | Fixed: the toolbar and the collapsed strip are local copies of the Shell components, placed on 37 record headers and 82 desktop sheets |
| SR-15 | Fixed in part: R02's discovery workspace reads SYN-DISC-000312; the `SYN-REF-` family waits for the reference registry |
| SR-16 | Open until Dean saves the named version, which also pins the phone tab bar change |
| SR-17 | Unchanged in this file under Q-G; the Reporting file aligns |
| SR-18, SR-19 | Fixed: the docked menu nests the Deals views and its badges match the pages |
| SR-22 | Fixed in part: 88 texts raised to 11 px; 22 px KPI values, some 15 and 17 px texts and the absence of text styles remain |
| SR-28 | Recorded: proposal record section 15.4 lists the IDs that no longer exist |

Page structure followed Q-I. Shell and kit sits below the Proposals separator, the pages take the short names, Administration · Sales follows Interaction states, and IN01, IN02 and TB12 are on their own Insights page. The batch found one new contradiction, which it did not change: TB15 cites SYN-OPP-000301 for a Hillview deal that D01 gives to Mallee Fresh Produce (proposal record section 15.6).

## 13. Independent check — 14 November 2026

Dean asked a session that drew none of the batch to check it before Dean accepts it, to say whether it can be accepted and to list the fixes for the session that applied it. This section is that check. It changed nothing in any Figma file and accepts no design.

### 13.1 Basis

- **What was read.** The live Sales file "PPO - Sales module (accepted)", through the Figma connector, which reads the file's current state and cannot open a saved version. Dean saved the named version "PPO - Sales module (accepted) · alignment batch" on 14 November 2026 (proposal record section 15.7). The live file differs from that version at least by PR01 and TB08 (section 15.7) and possibly by the polish pass (proposal record section 16, merged while this check ran), which says it is not established whether the version holds the pass. Every finding below is about the live file.
- **Authorities.** The accepted Shell file (record header toolbar `170:10178`, its phone component `170:10215`, the collapsed strip `29:3119`, rules R108 and R116 to R125); the accepted Products file's CA14 `25:6579`; the Estimating file's Sales brief, workbench and quotation sheets, read for the Riverbend references only; the [drawer widths decision](library-drawer-widths.md); Dean's decisions Q-A to Q-J (section 11).
- **Claims checked.** Proposal record sections 15.1 to 15.7. Section 16 was not checked claim by claim, but the scans and renders below cover the live file, so its effects are included, and two of its claims are tested where they overlap (13.4, SC-10).

### 13.2 Method and limits

- **Read-only.** 42 scripts and 36 renders, all reads: 36 scripts (one failed and was rerun) and 35 renders on the Sales file, four scripts on the Shell file, one script and one render on the Products file, and one script on the Estimating file. No node, text, variable, comment or version was created or changed in any file.
- **Scans, one script per group of pages.** All nine scope pages, the Read me page and the three Shell and kit components:
  - structure: sections, gaps, sheet grid, labels, toolbar and strip instances, phone tab bars, panel and dialog geometry, and text cut off by a clipping frame;
  - content: about 15,900 visible text nodes, tested for weekdays against their dates, dates and times after the story clock, the names in A, avatar initials against the name beside them, pronouns, GST and currency wording, single-digit revisions, and references sharing a row with more than one organisation;
  - colour: contrast of every text against the background composited from every fill painted beneath it, not only the nearest one; text under 11 px; unbound paints;
  - kit: a node-by-node fingerprint of each kit copy against its Shell original (names, sizes, positions, layout, text, variable names, paints and stroke weights).
- **By eye.** 32 Sales sheets rendered in full and one in part:
  - record headers: R01, L02, H02, W02, AC02, C02, C360, SI02, TB14, TB15, TB16;
  - panels and dialogs, all eleven resized: X01, X02, X07, X12, X16, X17, X19, X20, X21, X22, X23;
  - strip sheets: D01, A01, AD05, IN01, PR01;
  - tablet and phone: TB08, PH02, PH08, PH09, PH11;
  - in part: D05's forecast table.

  Also rendered: the kit toolbar set, the Read me header card and the Products file's CA14.
- **Limits.**
  - About 80 sheets were not read by eye.
  - Contrast is sampled at each text's centre. Image and gradient fills are skipped, and clipping is ignored, so text hidden under a phone tab bar is flagged; the four such flags (PH01, PH05, PH07, PH08) were checked by render and are not defects.
  - The reference test finds clashes only within one row. SYN-QUO-000198 (SC-05) was found by eye, so other cross-sheet clashes may remain.
  - Chip tones were measured only where the fill sits on the chip frame. Where it does, each word has one tone.
  - Not opened: the Customers, Sites & Equipment file, so Hillview's address "1 Synthetic Lane, Tatura VIC" is not checked against it; addendum A3; the version history.
  - Keyboard, screen-reader and touch behaviour cannot be tested in a static file.

### 13.3 What the file bears out

| Claim | Result |
|---|---|
| Weekdays (Q-A) | No date on the nine scope pages has the wrong weekday for its year |
| Retired names and zones (Q-C, Q-E) | Jordan Wu, Lena Brooks, Noah Clarke, Brisbane and AEST do not appear as text. A01 reads "Melbourne AEDT (UTC+11)". No gendered pronoun. GST is written "ex GST" (W02's table headers show Ex GST, GST and Inc GST separately). Amounts are in A$ |
| Places (Q-D) | Hillview Growers is at Tatura on SI01, C01, AC02 and TB07. Westgate Flowers stays at 19 Westgate Rd, Werribee VIC 3030. "Werribee range" and "Werribee house 1" are Westgate's |
| Riverbend story | R02 reads brief r01 "submitted Mon 2 Nov 2026, 09:05 · accepted for estimating Tue 3 Nov, 10:12 by Priya Nair", word for word with the Estimating file's brief sheets. SYN-QUO-000214 r02 is awaiting approval on R01, R02, C360, TB14, PH09, TB19 and PH07, as in the Estimating file. SYN-EST-000312 v03, SYN-DISC-000312 and the superseded SYN-EST-000398 agree. No sheet read gives SYN-QUO-000214 r01 an issue date that conflicts with the Estimating file's Fri 30 Oct. The exceptions are SC-01 |
| Lead references (SR-02) | SYN-LEAD-000208 is only Riverbend's source lead; SYN-LEAD-000214 is only the Gippsland Dairy Gardens inbox lead |
| Roles (Q-B, Q-C) | Priya Nair appears as receiving owner, estimator or quotation preparer on H01, H02, H03, TB09, R02, R04, R07, C360, TB14, M01, TB19 and PH07. Jess Wong is the Projects receiver and Ravi Kumar the Service owner wherever named. Noah Patel is Riverbend's billing contact. The exceptions are SC-02 and SC-03 |
| Record headers (15.2) | Exactly 37 instances of the local toolbar, on the sheets listed. Each has the breadcrumb, a one-row title with one chip and the star, a one-line sub-line cut off at its width, the toolbar and the rule. Outputs is hidden by an override on every one. "7 of 38 in view" appears on the 13 deal sheets and "1 of 14 in view" on the 9 lead sheets; previous and next are hidden elsewhere. H02 and TB15 show "Submit r01" disabled with its reason; W02 reads "Read only · awaiting review by Jess Wong (Projects) since Mon 2 Nov 2026". S03 has no header |
| Collapsed strip | 82 instances, each at x 80 and 852 px tall, on the 82 sheets claimed. Every one of those sheets has its content region at x 92, 1300 px wide, and nothing in it starts left of x 92. Register action columns end at x 1393, 1 px under the right strip, where the region's clip hides the overrun. A01's five day columns fit the grid with Friday whole |
| Widths (Q-F) | X07 and X23 are 360 px at x 1032. X01, X02 and X19 to X22 are 480 px at x 912, against the right strip. X12 and X17 are 560 px at x 440, and X16 is 720 px at x 360, centred on the 1440 frame. Nothing is cut off |
| Accessibility | No text falls below 4.5:1, or 3:1 at 18.66 px and above, against its composited background, apart from disabled controls. No text under 11 px outside component instances |
| Phone | The tab bar set `339:217` is on all 11 phone sheets, each with its own tab current: Deals on PH01, PH02 and PH05; Activities on PH11; Contacts on PH08 and PH09; More on PH03, PH04, PH06, PH07 and PH10. The sticky bars of PH02, PH09 and PH10 hold a labelled Actions menu and the primary, 48 px high (R124) |
| Docked menu (SR-18, SR-19) | D02 nests List, Board, Forecast, Archive and Needs attention under Deals. Its badges (Leads 14, Tasks 5, Sales Inbox 6, Hand over to Estimating 4, Won-deal receiving 4) match the counts the pages they open show: 14 in the Leads inbox, 3 overdue and 2 due today on Tasks, and the M01, H01 and W01 counts section 4 gives |
| Page structure (15.4) | The pages and their order match 15.4. The Insights page holds IN01, IN02 and TB12. Every scope page keeps its sections in the template order, 360 px apart, omitting those it has nothing for. All 114 sheets sit on the grid, each with a one-line label cut off at the sheet's width. The page counts on the Read me header card add up to 114 and match the pages |
| Kit copies | Names, variant names, sizes, node counts, text, variable names and icon colours match the Shell originals. The exceptions are SC-07 |

### 13.4 Findings

Severity as in section 4. "Batch session" means the session that applied the batch.

| ID | Sev. | Sheet and node | The record claims | The file shows | Fix | Owner |
|---|---|---|---|---|---|---|
| SC-01 | Blocker | D01 `11:89`, D02 `11:995`, D03 `13:809`, D07 `13:1826`, X01 `47:7518`, X07 `47:11814`, X23 `89:21045`, X24 `89:21894`; D04 `14:1487`; C02 `87:18770` | One Riverbend state on every sheet (15.1) | Riverbend's Quoted cell reads "A$129,500 · Draft" on the eight Deals sheets; the D04 card reads "Quote draft"; C02's open-work row reads "Quotation SYN-QUO-000214 r02 · Awaiting approval" beside a "Draft" chip. R02 says the Quoted column shows the newest revision and its state; that is r02, awaiting approval, A$126,800 | Quoted cell "A$126,800" with the "In approval" state the deal record uses; D04 "Quote in approval"; C02 chip "Awaiting approval" | Batch session |
| SC-02 | Blocker | D05 `15:2176` (SYN-OPP-000262, -000259); D06 `14:2316` and X17 `62:14191` (-000355, -000244); TB01 `65:14070` (-000309, -000284); L01 `21:2710` and X02 `47:8197` (SYN-LEAD-000209, -000214, -000205); TB04 `65:14651` (-000209) | Kate Morgan owns the deals and leads Priya Nair owned; Priya Nair appears only in Estimating roles (15.1) | Each owner cell shows Kate Morgan's "KM" avatar beside the label "PN" (render of D05 confirms). L01 and X02 also give SYN-LEAD-000209's activity to "PN". The avatar layers are still named "Avatar · PN" | Owner label "KM" (or "Kate Morgan" where the column shows names) and activity owner Kate Morgan; rename the layers | Batch session |
| SC-03 | Major | AC02 `35:5789`, X18 `86:18164`, X19 `86:18466`, X20 `86:18737`; C02 `87:19087`, C360 `39:7219`, PH08 `103:27403`; C01 `41:6960`, X22 `89:20483`; TB06 `99:24448`, PH08 `103:27461` | Ravi Kumar replaces Lena Brooks and Noah Patel replaces Noah Clarke (15.1) | The names changed but the avatars did not: Ravi Kumar shows "LB" and Noah Patel "NC". Priya Shah shows "PN" on C01 and X22 (AC02 has "PS"), and Jo Marsh shows "JW" | Initials RK, NP, PS and JM; rename the avatar layers | Batch session |
| SC-04 | Major | AD05 `96:22104` | Nothing happens after Thu 5 Nov 2026, 09:00 unless labelled a later frame (15.1, 15.5) | "Recent changes" lists "Tom Reid created the personal view … Fri 6 Nov, 16:02" and "Dean Fiedler set 'Close date moved' … Fri 6 Nov, 09:15" between "2 min ago" and Thu 5 Nov 08:20. The cards read "Dean Fiedler · Fri 6 Nov 2026" and "Tom Reid · Fri 6 Nov". Keeping the date under Q-A moved these past events after the story clock | Re-date the three changes before Thu 5 Nov 09:00 (for example Wed 4 Nov), keeping the list newest first, and record the exception to Q-A | Batch session |
| SC-05 | Major | X16 `62:13516`, D06 `14:2316`, X17 `62:14191`; TB16 `101:26748`; TB15 `101:26350` | Each reference names one record | SYN-QUO-000198 is Lockyer Lettuce's signed quotation r02 on X16, D06 and X17, and Hillcrest Tomatoes' accepted quotation r03 on TB16. SYN-OPP-000301 is still both Mallee Fresh Produce (D01, H01, P01) and Hillview (TB15), as 15.6 item 1 records | Give Hillcrest's quotation and TB15's Hillview deal unused numbers in their families, and record them in 15.6 | Batch session |
| SC-06 | Major | D05 `15:2176`, D06 `14:2316`, X17 `62:14191`, IN01 `44:6852`; D01 `11:89`, TB01 `65:14070`, H03 `85:17647` | One fact per record (A) | SYN-OPP-000249 Tamar Valley Greens is open in Negotiation on D05, with its close date of Wed 14 Oct passed, but Lost on Fri 30 Oct on D06 and X17; IN01 counts no open deal past its close date. SYN-OPP-000277 Coastal Herbs is owned by Dean Fiedler on D01 and by Sasha Clarke on TB01, H03 and IN01. Neither was raised in section 4; both may predate the batch | Remove SYN-OPP-000249 from D05's open groups; D01's owner Sasha Clarke | Batch session |
| SC-07 | Major | Kit: `355:278` (button `355:315`), `355:438` (button `355:463`, bar `355:458`), `355:466`; visible on all 82 strip sheets | Copied "with the Shell's names, sizes and variable bindings" (15.2) | Three states differ from the Shell. (1) In the "Awaiting approval · preparer" variant, Approve… is fully opaque; the Shell draws it at 45 %, disabled under R117. H02 and TB15 override it back to 45 %. (2) The phone component's "Issue on desktop" is fully opaque; the Shell draws it at 45 % under R124. (3) The strip's Default handle is brand/navy at 100 %, bound; the Shell's is #242a37 at 40 %, a deliberate plain paint. The handle reads as a solid bar on every strip sheet (seen on X01 and A01). Smaller departures: the copies use the Sales icons, with 1.6 px strokes against the Shell's 1.33 px at 20 px and 1.07 px at 16 px; frames clip content; the sub-line has a 19 px line height against 18 px; the phone sticky bar has borders top and bottom only, against the Shell's on all sides | Set both disabled buttons to 45 % and the handle to the Shell's paint (or brand/navy at 40 % paint opacity, recorded); note the icon strokes until the library is published | Batch session |
| SC-08 | Major | TB08 `99:25356` | TB08 follows CA14: each row carries its reference and alias; CA14's four views; the bounded-read sub-line (15.7) | TB08 has no Reference · alias column. Its only view control reads "Published only", above rows that include Draft products (CP-40, CP-60). CA14's four views are absent, and so is the sub-line "Read from Products, never edited here." | Add the reference column (alias may truncate), replace "Published only" with CA14's views or "Catalogue", and add the sub-line | Batch session |
| SC-09 | Minor | PR01 `42:7122` | PR01 follows CA14 (15.7) | Rows, revisions, kinds, lifecycles, availability, views, title chip, footer and no totals all match. But the Reference column cuts the alias ("SYN-PROD-000003 ·…") while Revision has spare width; CP-40's publication lacks "basis r03 Published"; there is no Lifecycle filter; product names are not styled as links; and CA14's facts strip is missing. That strip reads "Bounded read · 50 shown · limit 100 · no total is claimed · Catalogue evidence, not installation approval · MYOB remains the ERP authority" | Rebalance the columns; add the basis note, the Lifecycle filter, the link style and the facts strip; see 13.6 for Compatibility | Batch session |
| SC-10 | Minor | Scrims on X03, X04, X05, X06, X10, X11, X12, X13, X14, X15, X16, X18 and X25 (the Deals page's sample limit was reached, so X17 and X24 are unconfirmed) | Literal paints remain only on section backgrounds and the D05 ramp (15.3; also 16.1) | Every scrim named "Scrim · brand/navy 32%" is a literal #242a37 | Bind the scrims to brand/navy at 32 % paint opacity, or record them as deliberate literals | Batch session |
| SC-11 | Minor | T01 `29:3470`, X12 `60:11678`, M01 `30:3952` | No single-digit revision except an external file name (15.5; Q-J) | "Procurement replies after rev 3" (T01 and X12) and, on M01, the subject "Frost protection — revised rev 3 received" and the line "Thanks, rev 3 received." | "r03" in the task note; on M01 either "r03" or a recorded exception for a customer's own words | Batch session |
| SC-12 | Minor | TB16 `101:26748` | A state with no action reads "Read only" with its reason and date (R117; 15.2) | "Read only · accepted by Projects", with no date. W02 gives one | "Read only · accepted by Projects Thu 29 Oct 2026" | Batch session |
| SC-13 | Minor | All 37 headers | Instances swap to the published library later (15.2) | The quotation variants serve as presets. Draft is used wherever the primary is live, on deals, leads, briefs, reviews, people, organisations and sites. "Awaiting approval · preparer" is used on H02 and TB15, whose primary is blocked by missing checks, not by the preparer rule. Closed is used on W02 and TB16. The primary layer keeps the name "Button · Submit for approval" under labels such as Move to Quoting, Convert to deal or Plan activity. A build reading variant or layer names gets quotation meanings | Record the mapping (variant used as a layout preset; the label is the override) in 15.2. Raise a state-neutral variant set with the Shell when the library is published | Batch session; Shell |
| SC-14 | Minor | AC02 `35:5495` | One state-driven primary (R117; 15.2) | "Complete review" is live on a review that is Planned for Thu 12 Nov, with preparation 3 of 4 and "Review held" unchecked | At Planned, show Complete review disabled with "Review on Thu 12 Nov · hold it first", or make the primary the preparation step; keep Complete review for X18's later frame | Batch session; Dean, if Dean prefers otherwise |
| SC-15 | Minor | R03 `60:10146`, X16 `62:13516` | Products names follow the catalogue (15.7, left for this check) | R03's scope line "Fertigation controller CC-8" and X16's delivery item "Chiller controller CC-8" use a model that CA14 and PR01 list as SYN-PROD-000016 "Climate controller CC-8", discontinued. "EC/pH dosing unit DU-2" is not in the catalogue | See 13.6 | Batch session |
| SC-16 | Minor | Read me: header card `9:161`, sheet index `51:9990`, Page template card `135:2` | The cards state the batch, the versions and the page order (15.4) | Both the header card and the Page template card say the batch awaits the named version Dean has saved. The header card still says "batch 2" pins the current state of every sheet. Neither card mentions PR01 and TB08 after the version, or the polish pass. The index card's polish list still reads "P10 contrast proof: every text pair ≥ 4.5:1, so no colour changed", which the audit card marks superseded | Update all three once the version that follows the fixes is saved | Batch session |
| SC-17 | Minor | W02 `34:5264` | People and roles hold (A) | The customer acceptance evidence is an "Email from Priya Shah, Thu 17 Sep 2026" on Bellarine Berries, but Priya Shah is Hillview Growers' operations manager (C01, AC02, X18 to X20). Probably predates the batch | Name a Bellarine Berries contact | Batch session |
| SC-18 | Polish | C02 `87:18770`, C360 `39:7219`, TB14 `101:25936`; R01 to R07, L02 to L06, W02, AC02 | The taller headers hide nothing the sheet exists to show (asked of this check) | Nothing a sheet exists to show is lost, but the frame now cuts C02's relationships card through the "Noah Patel" row. Noah Patel's billing role, the evidence of SR-04, falls below the frame on C360 and TB14. The deal and lead Details columns, W02's obligation card and AC02's source projection fall below too | End each cut between rows (move the card or trim a gap); no frame needs to grow | Batch session |
| SC-19 | Polish | PH02 `67:15797`; X24 `89:21894`; X25 `96:22962` | — | PH02's Actions button is 89 px wide against 176 px on PH09 and PH10. X24's 862 px dialog starts at y 19, over the top bar. X25's scrim covers the top bar, which other scrims leave clear | Match the sticky-bar split; keep dialogs and scrims below the top bar | Batch session |

**Follow-ups outside the batch.** These are not findings against it.

- **Preview drawer.** D03 keeps the 432 px drawer panel plus the 48 px tab column. Under the [drawer widths decision](library-drawer-widths.md) of 14 November 2026 it moves to a 480 px panel once the Shell's batch 2 draws that panel; Q-F left it unchanged.
- **Estimating file.** Its workbench sheets (W04 to W07, W09 to W13, W17) say brief r01 was "accepted Mon 2 Nov 2026", while its own brief sheets and W08 say Tue 3 Nov. The Sales file follows the brief sheets. This is for the Estimating file's owner.
- **Products file.** CA14 draws a search box in the content area, which Dean's direction for the Sales pages rules out. This is for the Products file's owner.
- **Weekends from keeping dates.** Keeping every date under Q-A leaves some business events on weekends: the Riverbend deal was opened on Sat 24 Oct, emails and a document are dated Sat 31 Oct, Riverbend's expected close is Sat 19 Dec, and IN01 moves one close date to Sun 20 Dec. This follows from the decision and is recorded, not counted as a finding.

### 13.5 The decisions recorded in section 15.2

| Decision | View |
|---|---|
| Plan activity, Mark as lost, Log call and the other title-row buttons move into Actions | Agree. R118 and R123 call for it, it leaves one primary, and the Estimating batch did the same. The frequent actions stay one click away on the next-step card (Reschedule, Record outcome), as R01 shows |
| Outputs hidden on every Sales record | Agree. No Sales record issues a document, and R119 makes Outputs absent where there are none. It is hidden by an override rather than by a variant without Outputs, which survives a library swap; SC-13 records that |
| One chip per header | Agree. On the person and site records the chip is a role ("Primary contact", "Operator · Riverbend Growers") because those records have no lifecycle state. Record that reading of R116 rather than inventing a state |
| Existing primaries kept on the person, organisation and site records | Agree. Plan activity, Create follow-up and Plan site visit are each record's next action, and none is a New (R123). Replacing TB14's and PH09's "New deal" with Create follow-up is right |
| Previous and next only where shown | Agree (R120) |
| Headers 50 px taller on desktop and 54 px on tablet | Acceptable. The renders show every sheet still opens on its subject; what falls below is secondary. Make each cut fall between rows (SC-18) |

### 13.6 The Products view: the two items left to this check

- **PR01's Compatibility button.** Remove it. CA14, which owns the Sales view of Products, draws none, and the Sales view is a bounded read with one way out, "Open in Products". A salesperson who needs a compatibility check reaches it through Open in Products. If Dean wants it closer, it belongs in a row's menu as "Check compatibility in Products", not as a second header button.
- **Product names in R03 and SI02.**
  - **R03.** Its scope lines are what is being sold, so each line that is a catalogue product should carry its `SYN-PROD-` reference and the catalogue's name. A line that is not yet a catalogue product should read as such, for example "to be specified by Estimating". "Fertigation controller CC-8" must change, because CC-8 is a discontinued climate controller in the catalogue. X16's "Chiller controller CC-8" takes the same fix.
  - **SI02.** Its equipment items are installed assets with their own `SYN-AST-` references, owned by Customers, Sites & Equipment. They need no catalogue reference and can stay as drawn. Where an asset is a Powerplants catalogue product, it may show the `SYN-PROD-` reference as a secondary link once that file draws one.

### 13.7 Verdict

**Accept after the listed fixes.** The structure of the batch holds: the Shell parts, the widths, the page structure, the weekdays, the retired names and zones, contrast, sizes and the phone tab bar all bear out the record. The file is not ready as it stands, though, because the batch's own fact pass left residues that contradict its claims:

- Riverbend's quotation reads Draft on ten sheets (SC-01).
- Fifteen owner cells and two activity owners still read "PN" (SC-02).
- Avatar initials of retired or other people remain (SC-03).
- Events on AD05 are dated after the story clock (SC-04).
- Two references each name two records (SC-05).
- Two records contradict each other between sheets (SC-06).
- Three kit states depart from the Shell (SC-07).
- TB08 does not follow CA14 as claimed (SC-08).

The fixes are mechanical, and none needs a new decision except SC-14, where Dean may prefer the drawn primary.

The order:

1. The batch session fixes SC-01 to SC-08 and, in the same pass, SC-09 to SC-12 and SC-15 to SC-17. It records SC-13 and decides SC-14 under the standing order unless Dean answers. It then re-runs the owner, initials, quotation-state, story-clock and reference scans and the kit comparison, and posts the results.
2. A session other than the batch session confirms those findings only, under the one-review rule. It does not review the file again from the start.
3. Dean saves one named version over the result. Recommended title: "PPO - Sales module (accepted) · alignment batch · checked". It pins the phone tab bar change (section 14), the alignment batch (sections 15.1 to 15.6), the Products view (section 15.7), the polish pass (section 16) and these fixes. It becomes the build basis, and the proposal record names it.

SC-18 and SC-19 can follow in the same pass or later. Until the version is saved, the build basis stays "· batch 2 · N13".
