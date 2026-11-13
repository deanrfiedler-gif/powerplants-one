---
document_id: PPO-SALES-REVIEW-PROP
date: 2026-11-12
owner: Dean Fiedler
status: Independent read-only review of the accepted private Figma file for the Sales module on 12 November 2026 at Dean's request, by a session that did not draw it; findings and recommendations only; nothing was changed in Figma; no design is accepted or amended by this record; no application code, route, migration, permission or deployment
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
