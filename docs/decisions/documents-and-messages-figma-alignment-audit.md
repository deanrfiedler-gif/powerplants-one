---
document_id: PPO-DOCS-MESSAGES-FIGMA-ALIGNMENT-AUDIT
date: 2026-11-13
owner: Dean Fiedler
status: Audit findings, 2026-11-13; no design is changed and nothing is accepted by this record; read-only in Figma; no application code, route, migration, permission or integration; every record shown is synthetic
source_commit: e41f806a6e005b29c5b13d7f69afee8c28adb2f7
versioning: git
---

# Documents and messages Figma alignment audit

**Owner:** Dean Fiedler · **Date:** 13 November 2026 · **Status:** Audit findings. Nothing in any Figma file was edited, moved, renamed, commented on or versioned. The fixes are delivered as one alignment batch (Appendix A) for the next build session of the file.

On 13 November 2026 Dean asked for an audit of the Documents & messages module's Figma file, with the cross-file alignment audit prompt and the V3 read-only conformance audit of 10 November 2026 as supporting material, and the PPO - Library file available for reference. This record applies that prompt's checks (its section 4) to one file, "PPO - Documents & messages module", recorded in [PPO-DOCS-MESSAGES-REFINED-FIGMA-PROP](documents-and-messages-refined-ui-proposal.md). Dean's standing instruction applied: proceed on the most professional defaults, so the prompt's questions were answered by their defaults (read-only in Figma; findings of every severity; the Library read for reference only). The V3 audit is a repository audit of 10 November 2026; it supplied the evidence vocabulary and the reminder that structural scans are not visual, keyboard or screen-reader proof, and no V3 requirement is applied here as a rule.

Four statements stay separate: what was audited (sections 1, 2 and 6), what is misaligned (sections 3 and 4), what only Dean can decide (section 5), and what this audit did not change (no Figma file, no other record, no code).

## 1. Scope and sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Documents & messages module" (proposal of 12 November 2026; no named version saved) | Audited in full: Read me and its four cards, eight scope pages, 213 sheets, eight notes cards, Shell and kit, both separators and Scratch |
| Private Figma file "PPO - Shell (accepted)", named versions of 8, 10 and 12 November 2026, and its current state | Authority: the Knowledge flyout and docked menu on the workspace menus page, the More panel (sheet E), the record header toolbar and its phone component, and the "PPO colour" collection (66 variables) |
| Private Figma file "PPO - Customer portal module", sheet QA06 (Block C orders and deliveries) | One handover pair |
| Private Figma file "PPO - Library" (not published) | Page list and variable collections; component names and state layers through its records |
| [Shell rules R1 to R125](../design/development/systems/shell-refined-concept-rules.md); [Shell record](shell-refined-concept-design.md) sections 12 and 13; [named-version build handoff](figma-named-version-build-handoff.md); [Library drawer widths](library-drawer-widths.md); [Library controls](library-controls.md) C1 | Rules applied |
| [Cross-file Figma alignment audit](figma-cross-file-alignment-audit.md) (PPO-FIGMA-ALIGNMENT-AUDIT), both passes | Earlier findings for this file, confirmed or closed here; questions AC-21 to AC-27 |
| [Estimating record](estimating-module-refined-ui-proposal.md) A14; [Settings record](settings-module-refined-ui-proposal.md) GL04; [Customer portal record](customer-portal-refined-ui-proposal.md) QA06; the other refined-UI records on `main` | Facts other files fix, and the people named on this file's sheets |
| `src/shell/navigation.ts` | The built labels of Documents, Outputs, Templates, Sales Inbox and Customer messages |

Addenda A1, A2 and A3 were not supplied as text in this session. A1 is read as Shell rules R116 to R125, A2 as the short reference form with two-digit revisions, and A3 through the records that cite it. Figma links and file keys are not recorded ([ADR-0050](ADR-0050-font-awesome-light-icons.md), [ADR-0053](ADR-0053-figma-page-design.md)); node IDs are the ones this file's record already uses, or the Shell's and portal's as their records cite them.

## 2. Method

- **Extraction.** One read-only script per scope page walked every section and sheet and returned only exceptions and summaries: section order, gaps and padding; sheet positions; label position, width, truncation and form; the signed-in person against the top-bar account; overlap between section children; children outside a sheet; shell instances and their main components; the docked menus; the rail's current item; the top bar's and right strip's icons; record toolbar variants and their position, Actions and Outputs; chip words and tones; unbound paints; fonts and sizes inside and outside instances; and every visible text node tested for earlier fixtures, gendered pronouns, ISO and numeric dates, weekday-date pairs against the 2026 calendar, dates without the year, zones, money, references, revision labels, watched words, US spellings and count wording.
- **Follow-ups.** The local toolbar and kit primary bindings; the phone toolbar's button heights; the "Record header" wrapper frames (each holds only the toolbar instance, so they are not redrawn headers); the docked menu texts; candidate zone, later-event, revision and chip-tone texts; the accepted Shell's Knowledge menus, More panel, docked-menu type size and toolbar binding; portal sheet QA06; the Library's pages; and a check that every node ID in the record's inventory resolves to a sheet named with the recorded code.
- **Analysis.** Locally, against the records and the cross-file audit; findings held in one data file that generates the register, the matrix and the batch. Contrast spot-checks were computed from the variable values with the WCAG relative-luminance formula.
- **Budget.** 21 Figma calls: 16 in this file, 3 in the Shell, 1 in the portal, 1 in the Library. No call timed out and nothing was changed. No screenshot was taken.

Severity follows the prompt: Blocker (an accepted file departs, a customer sheet exposes an internal fact, a record carries a Figma link, or two files own one page with different content), Major (a shared fact, component, tone, family or handover differs; a shell part is redrawn; an unrecorded shell departure; an accessibility failure on every sheet of a kind), Minor (a convention drifts without changing meaning), Polish. The file is a proposal, so no finding is a Blocker.

## 3. Results

**Headline.** The file is well built and fully traceable. All 213 sheets sit in the six-section page template with 360 px gaps, every sheet has one label 26 px above it that names its signed-in person, and that person is the top-bar account on every desktop and tablet sheet. All 213 node IDs in the record resolve to the same codes, and the Read me index cites every one. The shell is instanced throughout (top bar with the seven actions in order and no Help, rail, six-tab right strip, collapsed strip, record toolbar, File drop overlay, Files drawer); Roboto is the only family; no weekday-date pair is wrong; no US spelling, ISO date, earlier person or forbidden control was found; counts are honest. The misalignments sit in four places: where the document pages live in the shell and what the register is called (AF-001, AF-002), facts shared with the Estimating file and the portal (AF-004, AF-005), accessibility carried over from the copied components (AF-003, AF-007), and convention drift (tones, revisions, dates, zones, paints).

| Severity | Count | Documents & messages | Shell | Customer portal | Dean decides first | Repository |
|---|---|---|---|---|---|---|
| Major | 7 | 6 | 1 (AF-007, with this file) | 1 (AF-005) | 5 (AF-001, AF-002, AF-004, AF-005, AF-007) | 1 (AF-006, with this file) |
| Minor | 17 | 15 | 1 (AF-022, with this file) | 0 | 7 (AF-010, AF-015, AF-016, AF-017, AF-020, AF-021, AF-024) | 1 (AF-014, with this file) |
| Polish | 4 | 4 | 0 | 0 | 0 | 0 |
| **Total** | **28** | | | | | |

A finding with two owners is counted under each; "Dean decides first" marks findings whose fix waits on a question in section 5 or in the cross-file audit. The matrix below has a value in every row.

| Check | Result | Note |
|---|---|---|
| ST1 | Pass | Read me, two empty separators, eight scope pages under Proposals, Shell and kit, empty Scratch |
| ST2 | Pass | Six sections in order on every page (four on Interaction states and two on Administration, as the record says), 360 px gaps, 60 px padding |
| ST3 | Fail | AF-025, AF-026 (all 213 labels are 26 px above their sheet, sheet-wide and truncated at the end) |
| ST4 | Pass | No overlap between section children, nothing loose on any page, no child outside its sheet; nested overlap not tested |
| ST5 | Fail | AF-023 (213 of 213 sheet IDs in the index resolve) |
| SH1 | Fail | AF-013 (top bar, rail, right strip, collapsed strip, toolbars, File drop overlay and Files drawer are instances on every sheet) |
| SH2 | Pass | Seven actions in order and no Help on all 163 top bars read; the 18 on Interaction states and Administration were not read for icons |
| SH3 | Pass with an authority conflict | Six right-strip tabs on every sheet; AF-015 |
| SH4 | Fail | AF-001, AF-002, AF-021; the Email workspace has no home in the accepted Shell (Q5) |
| SH5 | Pass | Collapsed strip instanced on tablets and collapsed views (12 px, record A2) |
| SH6 | Pass | Every record sheet instances the toolbar; R119 Outputs only on records with outputs; R120 position hidden where opened by link |
| SH7 | Fail | AF-014 |
| CT1 | Fail | AF-022 |
| CT2 | Fail | AF-008 |
| CT3 | Fail | AF-013, AF-027 (Roboto Regular and Medium only) |
| CT4 | Fail | AF-010 |
| CT5 | Fail | AF-009, AF-028 (Library unpublished; local copies only) |
| CV1 | Pass, partly checked | ST03 and STX01 to STX04 specify the register standard; behaviour not rendered |
| CV2 | Not checked | Needs rendered sheets; the record's audit reports no wrapped cell; no second content search found |
| CV3 | Pass | Totals only where both families are Complete; the 200-message window; At least this many; no Templates counts |
| CV4 | Fail | AF-016, AF-017 (no wrong weekday, no ISO or numeric date) |
| CV5 | Not applicable | No amount on any sheet |
| CV6 | Fail | AF-004, AF-011, AF-012 |
| CV7 | Pass | Watched words only in rules or as the six event names beside Not confirmed or Not recorded |
| CV8 | Pass | No US spelling found |
| FA1 | Fail | AF-004, AF-005, AF-024 |
| FA2 | Fail | AF-004 (no other earlier fixture) |
| FA3 | Fail | AF-012 (SYN-DSP- dispatch and SYN-OPI- incident as A3 fixes them) |
| FA4 | Pass | Label person equals the top-bar account on every desktop and tablet sheet; roles match the records |
| FA5 | Fail | AF-018 |
| FA6 | Not checked | A3.8 per-person totals not supplied; the My Work file was not read |
| FA7 | Fail | AF-006 |
| HO1 Estimating quotation to Outputs | Fail | AF-004 |
| HO1 Supply dispatch to M1, M2 and portal | Fail | AF-005 |
| HO1 Projects update to M4 and portal | Pass | Agrees with the portal (r2 fixed 08:24, published 09:40); Projects differs (cross-file AF-075) |
| HO1 Service reports to Outputs | Pass, partly checked | SYN-APT-000078 agrees with Service; Reporting differs (cross-file AF-135) |
| HO1 other pairs | Not checked | Files not opened in this audit |
| HO2 | Fail | AF-019, AF-020 |
| HO3 | Not checked | No portal preview drawn here; only QA06 compared |
| RA1 | Pass | States, tablet, phone 390 and four 320 variants as the record lists |
| RA2 | Fail | AF-003 (six other pairs spot-checked: 5.29 to 7.10:1) |
| RA3 | Fail | AF-007 |
| GV1 | Pass | Proposal labels agree across Read me, separators and record |
| GV2 | Pass | No Figma link or key in the record |
| GV3 | Not applicable | No named version saved |
| GV4 | Pass | 213 of 213 record node IDs resolve to the same codes |
| EX1 | Not applicable | Customer portal file only |

Earlier findings for this file in the cross-file audit: AF-001, AF-061, AF-062, AF-063, AF-064, AF-116, AF-118, AF-136, AF-140, AF-142, AF-149 and AF-154 are confirmed here (AF-061 and AF-064 wider); AF-065 is closed (OU12 now reads Saturday) but superseded by AF-004, because the accepted Estimating file moved the date to Friday instead; AF-143 is closed for this file, because its Administration sheets mark Settings as Dean decided in AC-24; AF-075 and AF-135 are not this file's to fix, because it agrees with the portal and the Service file; AF-117 and AF-119 are confirmed in part (AF-026, AF-018); AF-147 was not re-tested.

## 4. Findings

The seven Majors are given in full in Appendix A, with node IDs, the expected text and the check that proves each fixed. The register with every field is in the session's `findings.csv`, sent to Dean.

| ID | Severity | Check | Finding | Fix owner |
|---|---|---|---|---|
| AF-001 | Major | SH4, SH1 | A proposed "Documents" workspace drawn as the frame "Docked · Documents (proposed for the Shell file)" on 80 sheets: title Documents, group DOCUMENT PAGES, footer "All 3 Documents pages"; the rail marks the signed-in person's department (Service on 81 of the 93 desktop and tablet sheets of the three pages, also Projects, Engineering, Finance and Sales, and nothing for Lee Nakamura) | Dean (Q1), then Documents & messages |
| AF-002 | Major | SH4, HO2 | "Document library" (title, breadcrumb "Documents › Document library ›", menu); the accepted Shell says "Document register" in Knowledge and "Documents" in Shared records; the built navigation says "Documents". The record's A-list does not raise the difference | Dean (Q2), then Documents & messages |
| AF-003 | Major | RA2, SH7 | White on brand/green-deep #3d9a37, 3.57:1, on the toolbar primary of every record sheet (the file's own ST05 lists it as a fail, R11). The kit's Sales / Button Primary is already brand/navy | Documents & messages |
| AF-004 | Major | FA1, FA2, HO1, CV6 | "SYN-PPO-QUO-000214 r01 … Issued Sat 31 Oct 2026, 16:20" and "SYN-PPO-QUO-000214 r02"; the file's A22 moved the weekday to Saturday where Estimating moved the date to Friday | Documents & messages, after Dean's AC-21 |
| AF-005 | Major | HO1, FA1, CV4 | Documents & messages: "Sent · Thu 5 Nov 09:14 · simulated" in AEDT, sent by Robin Hale. Customer portal QA06: "We told you about this new date by email today, 09:14" under "Times at Block C · AEST · as at Thu 5 Nov 2026, 09:20". The two are an hour apart | Customer portal (Q4); Documents & messages unchanged unless Dean decides otherwise |
| AF-006 | Major | FA7 | "…is refused review and publication of his own proposal (TP10f)" (31:16850); "…records its outcome, as the dataset names him" (63:43329); the repository record's line 14 ("His standing instruction"), A26 ("the dataset names him", "for him") and A29 ("gives him no proposing duty") | Documents & messages; Repository (the record, in its own later change) |
| AF-007 | Major | RA3 | The phone record header component, copied from the Shell (back 32×32, more 32×32, Actions 96×32, primary 260×32), gives 32 px Actions and primary on eight phone sheets, while PH15 and PH15b use a 48 px primary (A31); PH17b's applied search chip "Filter · Search: DSP" is 28 px high with 12 px text | Shell (component), then Documents & messages; Dean decides A31 (Q6) |
| AF-008 | Minor | CT2 | 56 unbound paints: 37 scrims #242a37 at 32 %, 15 hover and pressed layers on ST04 (#242a37 at 8 % and 16 %, #000000 at 30 %), the File drop overlay override #e9eef5 at 92 %, and 3 on STX03 to STX05 | Documents & messages |
| AF-009 | Minor | CT5, CT4 | 8 % and 16 % ink overlays on every kind (A36) | Documents & messages |
| AF-010 | Minor | CT4 | Running is Info on OU04; Checked is Info in register cells on OU01 and OU02 and on 11 ST01 chips; Current is Success on OU06 and Neutral on 27 Document library chips; Open is Warning (findings), Info (Customer messages) and Danger (Outputs); Synthetic is Success on 12 chips and "Synthetic · simulated" Neutral on 9. Across files, Outcome unknown is Danger here and Warning in the Supply file | Documents & messages; Dean for the shared table (AC-26) |
| AF-011 | Minor | CV6 | Single-digit revisions on 167 strings (Templates r1 47 and r2 78, for example "Current revision r2 · saved 08:15"; Email "Template r1 review notes", 28 strings; Customer messages r2, 10; Interaction states r2, 4); Outputs writes v1, v2 and v3 (26 strings) where Templates writes "Job pack version 3" | Documents & messages |
| AF-012 | Minor | CV6, FA3 | "[SYN-C-00231] Statement – October 2026": a one-letter family with five digits, used nowhere else in the records read | Documents & messages |
| AF-013 | Minor | SH1, CT3 | Both proposed menus are frames (80 Documents, 60 Email); their group headings ("REVIEW", "NEEDS ATTENTION", "DOCUMENT PAGES") are 10 px | Documents & messages |
| AF-014 | Minor | SH7, GV1 | Both cite "Shell refined concept — accepted · record header toolbar" (10 November 2026); the Shell has a later version (12 November 2026, primary action contrast) and section 13 (navy primary) awaits its own | Documents & messages; Repository |
| AF-015 | Minor | SH3 | Right panels are 432 px; the Library sets 360 px for filters and columns and 480 px for editing a record section; the calendar's meeting detail pane is 384 px (340 px at 1024), on neither scale | Dean (Q3) |
| AF-016 | Minor | CV4 | 375 dates without the year (Outputs 134, Interaction states 121, Document library 54, Customer messages 36, Email 26, Templates 3, Administration 1), mostly chips such as "Prepared · Wed 4 Nov 16:30"; 24 sheets show times with no zone anywhere on the sheet | Documents & messages, after AC-27 |
| AF-017 | Minor | CV4 | "Times in AEDT" and "Interval (AEDT)" for Northbank Farm · Block C | Documents & messages (Q4) |
| AF-018 | Minor | FA5, ST3 | The sheet draws the card at 09:00 and again at 09:45 ("Later frame · 09:45 AEDT", "Thu 5 Nov 2026, 09:42"); its name and label say neither | Documents & messages |
| AF-019 | Minor | HO2 | Service's work order pages SYN-WO-000060 and SYN-WO-000062 are drawn as carriers for the Outputs menu, Files drawer and Email section without naming Service as owner | Documents & messages |
| AF-020 | Minor | HO2 | AD08 "Numbering, nudges and views — references …" defines the document reference families here while the Settings file draws the numbering registry | Documents & messages; Dean (AC-25) |
| AF-021 | Minor | SH4, GV1 | "reached from More › Shared records › Documents & outputs"; the accepted panel's entry is "Documents", and the Knowledge flyout's group is DOCUMENTS | Documents & messages |
| AF-022 | Minor | CT1 | Variants are named for quotation states and chosen by look: a reviewed document on Draft (DL10), a sent message on Closed (CM04), a prepared message on Approved · not issued (CM02), a held message on Draft (CM07) | Shell, then Documents & messages |
| AF-023 | Minor | ST5 | All 213 sheet IDs and the notes cards are cited and resolve; the page IDs 7:4 to 7:13 are not | Documents & messages |
| AF-024 | Minor | FA1 | "Reconnect required, 1 sync error" here; "Outlook connected, synced 08:58" on the accepted Sales file's A01 | Dean, then the Sales file (a new named version) or this file |
| AF-025 | Polish | ST2, ST3 | Desktop sheets stacked in one column on four pages; tablets in one column on four pages; phone rows 160 px apart on Customer messages and Email and 100 px on Document library and Outputs | Documents & messages |
| AF-026 | Polish | ST3 | "(5.7)" on PH20; "(R119 · DK-03)" on OU13; "(D1 · EC-01 Q2)" on EMX09; "(DK-03 Q6)" on PH03 | Documents & messages |
| AF-027 | Polish | CT3 | Board headings at 24, 26 and 40 px (93 strings) | Documents & messages |
| AF-028 | Polish | CT5 | Local copies under the Sales names, with a "Green" chip tone where the Library has "Accent"; panels and dialogs drawn as frames | Documents & messages, at Library adoption |

The facts that differ, with both values and both places (ledger difference):

| Fact | This file | Other file or record |
|---|---|---|
| SYN-DSP-000061 delay notice sent | Thu 5 Nov 2026, 09:14 AEDT, by Robin Hale (CM04) | "today, 09:14" under "Times at Block C · AEST" (portal QA06) |
| SYN-QUO-000214 r01 | SYN-PPO-QUO-000214 r01, issued Sat 31 Oct 2026, 16:20 (OU12) | SYN-QUO-000214, issued Fri 30 Oct 2026 (Estimating, accepted, A14) |
| The register page's name | Document library | Document register (Shell Knowledge menu); Documents (Shell More panel and the built navigation) |
| Where the document pages live | A proposed Documents workspace; rail marks the department | Knowledge workspace, DOCUMENTS group; rail marks More (Shell) |
| Dean Fiedler's mailbox at 09:00 | Reconnect required, 1 sync error | Outlook connected, synced 08:58 (Sales, accepted, A01) |
| Block C site-use times | AEDT (TP06, TP02b, TP10d) | AEST (portal QA06; A3 puts Block C in Brisbane) |

Agreed across files: the kits' new date Wed 11 Nov 2026 (CM01 and the portal); Sam Okafor at Northbank Farm · Block C of SYN Northbank Nursery; SYN-PRJ-000027 for Block C and SYN-PRJ-000024 for Glasshouse 4 at Hillview Growers; the M4 Update 4 fixed at 08:24 and published at 09:40, and Priya Shah's held copy, as the portal draws them; SYN-APT-000078 as the Glasshouse Valley visit, as the Service file has it; SYN-DSP- for dispatches and SYN-OPI- for the render incident; Mei Tran; Hillview in Melbourne time. Every person named on a sheet appears in another module record, and none of A3's earlier people (Kim Patel, Alex Nguyen, Sasha Cole as sender, Jordan Hale, Mei Tan) appears.

## 5. Authority conflicts and questions for Dean

| # | Question | Readings | Recommendation |
|---|---|---|---|
| Q1 | Where the Document register, Outputs and Templates live (AF-001, AF-021) | Accepted Shell (8 November 2026): the Knowledge workspace's DOCUMENTS group, with More current on the rail, and "Documents" also in the More panel's Shared records column. This file (A3, A4): its own Documents workspace, with the department current. The built navigation: Documents, Outputs and Templates under Shared records | Follow the accepted Shell: the Knowledge docked menu with this file's nested views under the current page (R108), and More current. Withdraw the proposed Documents menu, or put it to the Shell file as a change Dean accepts first |
| Q2 | One name for the register page (AF-002) | "Document library": the accepted DK-01 page (15 October 2026), this file and its routes. "Document register": the accepted Shell (8 November 2026) and DK-01's original title. "Documents": the More panel and the built navigation | Decide it once in the Shell file. The later accepted decision is "Document register"; if Dean prefers "Document library", the Shell's Knowledge menu changes instead. Either way the title, breadcrumb and menu use one name |
| Q3 | Drawer widths (AF-015) | Shell R45 and R67: a 432 px panel beside the 48 px tab column. Library decision of 11 November 2026: 360 px for filters and columns, 480 px for editing a record section, 640 and 800 px for wide content | As in the Supply audit's Q1: confirm whether 480 px is the panel or the panel with its tab column; keep 432 px until then |
| Q4 | Which zone a Block C event is shown in (AF-005, AF-017) | Internal viewers in Melbourne see AEDT; the prompt says a site's own zone applies at Block C (AEST); the portal shows the notice at "09:14" in AEST, an hour from this file's 09:14 AEDT | One instant per event, shown in the viewer's zone on internal pages and in the site's zone on customer pages and site-use intervals: the portal reads 08:14 AEST, and TP06's intervals read AEST |
| Q5 | Where Email, Customer messages and Calendar live | The accepted Shell has no Email workspace (Calendar is a top-bar action and Sales has its inbox); this file proposes a docked Email menu (A3) and keeps the rail label question EC-01 Q2 open; the built navigation names `/email` "Sales Inbox" and `/email/customer-messages` "Customer messages" | Decide it in the Shell file with Q1; keep the Email menu as a labelled proposal until then |
| Q6 | The phone primary's height (AF-007; the file's A31) | The accepted phone record header component draws 32 px Actions and primary; the prompt's RA3 requires 48 px phone targets; PH15 and PH15b already use 48 px | Change the Shell's phone component to 48 px controls (R124) and recopy it into every module file |

The cross-file audit's open questions also decide findings here: AC-21 (the quotation's reference form and issue date; AF-004), AC-25 (one reference registry; AF-020), AC-26 (one chip-tone table; AF-010) and AC-27 (the year on dates; AF-016).

## 6. Not checked and limits

- **Addenda.** A1 to A3 were not supplied as text; A3 facts come from the records that cite it, so a fact no record repeats was not tested, and the My Work totals of A3.8 (FA6) were not tested.
- **Other files.** Only one portal sheet was read. The Estimating, Projects, Service, Supply, Settings, Reporting, My Work and Customers, Sites & Equipment files were not opened; their facts come from their records and the cross-file audit. "PPO - Design" was not opened.
- **Visual and interactive.** No screenshot was taken, so one-line cells, clipping and truncation inside a sheet (CV2) rest on the owning session's renders; no prototype, keyboard, screen-reader, zoom or device review was made. Contrast is computed from variable values, not measured on pixels.
- **Version history.** Not readable through the tools; the file has no named version.
- **Heuristics.** The later-event check (FA5) flags times after 09:00 on sheets whose label names no moment; candidates were read and only CM15 is raised. Chip tones are read from the kit's Tone property.

## 7. Next steps

1. Dean answers Q1, Q2, Q4 and Q6 (and the cross-file AC-21, AC-25, AC-26 and AC-27), since they decide the largest changes in this file.
2. The next build session of this file applies Appendix A, Majors first, and records the result in its own record with a new sheet inventory where node IDs change.
3. The Shell's owner raises the phone component's controls to 48 px and renames the toolbar variants by pattern (AF-007, AF-022), and saves a named version with the navy primary of section 13.
4. The portal's owner aligns the SYN-DSP-000061 notice time (AF-005).
5. The repository record's pronouns and Shell citation are corrected in that record's own later change (AF-006, AF-014); this record does not edit it.

This record authorises nothing in the application: no code, route, read model, migration, permission, capability, grant, seed, integration or deployment, and it accepts no design. All 78 parent requirement IDs remain. Every record, person, value and date in the file is synthetic.

## Appendix A · Alignment batch · PPO - Documents & messages module

Paste-ready for the next build session of this file. Read-only audit of Fri 13 Nov 2026; the file is a proposal, so no named version is needed after the batch, but Dean saves one at acceptance. Settle the Dean items first: Q1 and Q2 decide AF-001, AF-002 and AF-021; Q4 decides AF-005 and AF-017; Q6 decides AF-007; AC-21, AC-25, AC-26 and AC-27 of the cross-file audit decide AF-004, AF-020, AF-010 and AF-016.

### Major

**AF-001 · SH4, SH1 · Document library; Outputs; Templates; Interaction states.** Nodes: OU01 19:245; DL01 25:11072; TP01 23:244 (80 sheets). Rule: Accepted Shell workspace menus: Knowledge flyout 103:18325 and docked menu 103:19012; R6, R8, R108; prompt known item 4. Found: A proposed "Documents" workspace drawn as the frame "Docked · Documents (proposed for the Shell file)" on 80 sheets: title Documents, group DOCUMENT PAGES, footer "All 3 Documents pages"; the rail marks the signed-in person's department (Service on 81 of the 93 desktop and tablet sheets of the three pages, also Projects, Engineering, Finance and Sales, and nothing for Lee Nakamura). Expected: Document pages in the Knowledge workspace: title Knowledge, groups FAVOURITES, DOCUMENTS (Document register, Outputs, Templates), KNOWLEDGE, HELP, footer "All 7 Knowledge pages"; the rail marks More as current. Fix (Dean (Q1), then Documents & messages): Once Q1 is settled, replace the Documents docked frame with the Knowledge docked menu, keep this file's nested views under the current page (R108), and mark More on the rail. Proved fixed when: Every Document library, Outputs and Templates sheet shows the Knowledge menu text of 103:19012 and a rail with More current.

**AF-002 · SH4, HO2 · Document library.** Nodes: DL01 25:11072 (title); DL10 31:21426 (breadcrumb); every docked Documents frame. Rule: Accepted Shell 103:19012 and More panel sheet E 6:1521; accepted DK-01 page decision (15 October 2026); src/shell/navigation.ts. Found: "Document library" (title, breadcrumb "Documents › Document library ›", menu); the accepted Shell says "Document register" in Knowledge and "Documents" in Shared records; the built navigation says "Documents". The record's A-list does not raise the difference. Expected: One name for the register page in the menu, the page title and the breadcrumb. Fix (Dean (Q2), then Documents & messages): Apply the one name Dean chooses to the title, breadcrumb and menu on all 38 Document library sheets and record it as a decided assumption. Proved fixed when: A text search of the file finds one name only.

**AF-003 · RA2, SH7 · Shell and kit; every record sheet.** Nodes: Local component Shell / Record header · toolbar 13:383 ("Button · Submit for approval" fill brand/green-deep); phone component 13:384. Rule: Dean's Q-B on pull request 931 (12 November 2026): primary buttons use brand/navy; the Shell's component 170:10178 is already bound to brand/navy; WCAG 1.4.3. Found: White on brand/green-deep #3d9a37, 3.57:1, on the toolbar primary of every record sheet (the file's own ST05 lists it as a fail, R11). The kit's Sales / Button Primary is already brand/navy. Expected: White on brand/navy, 14.37:1. Fix (Documents & messages): Rebind the primary fill of every variant of 13:383 and of 13:384 to brand/navy and re-run the ST05 contrast board. Proved fixed when: ST05 shows no failing text pair on the primary; the toolbar primaries resolve to #242a37.

**AF-004 · FA1, FA2, HO1, CV6 · Outputs.** Nodes: OU12 26:7463 (nodes 26:7741, 26:7760). Rule: Accepted Estimating record A14 (business day the label names: 31 October became Friday 30 October); prompt FA2 (no SYN-PPO- as current); cross-file AC-21. Found: "SYN-PPO-QUO-000214 r01 … Issued Sat 31 Oct 2026, 16:20" and "SYN-PPO-QUO-000214 r02"; the file's A22 moved the weekday to Saturday where Estimating moved the date to Friday. Expected: SYN-QUO-000214 r01 and r02 in the short form, r01 issued Fri 30 Oct 2026 as the accepted Estimating file has it. Fix (Documents & messages, after Dean's AC-21): Change both references to SYN-QUO-000214 and the issue date to Estimating's Fri 30 Oct 2026; withdraw A22. Proved fixed when: OU12 has no SYN-PPO- text and its dates match the Estimating quotation record.

**AF-005 · HO1, FA1, CV4 · Customer messages.** Nodes: CM04 25:4425; portal QA06 28:1886. Rule: Prompt HO1 (the same time for the same event) and CV4 (a site's own zone applies at Block C, AEST). Found: Documents & messages: "Sent · Thu 5 Nov 09:14 · simulated" in AEDT, sent by Robin Hale. Customer portal QA06: "We told you about this new date by email today, 09:14" under "Times at Block C · AEST · as at Thu 5 Nov 2026, 09:20". The two are an hour apart. Expected: One instant for the SYN-DSP-000061 delay notice: 09:14 AEDT is 08:14 AEST at Block C. Fix (Customer portal (Q4); Documents & messages unchanged unless Dean decides otherwise): Convert the portal's notice time to the site's zone (08:14 AEST), or Dean fixes another instant and both files follow. Proved fixed when: CM04, CMS06, ST01 and portal QA06 name the same instant.

**AF-006 · FA7 · Templates notes; Read me; repository record.** Nodes: Templates notes card 31:16827 (text 31:16850); Read me sheet index 63:43329. Rule: Standing instruction 4 and prompt FA7: names or they/them, never gendered pronouns. Found: "…is refused review and publication of his own proposal (TP10f)" (31:16850); "…records its outcome, as the dataset names him" (63:43329); the repository record's line 14 ("His standing instruction"), A26 ("the dataset names him", "for him") and A29 ("gives him no proposing duty"). Expected: Names or they/them throughout. Fix (Documents & messages; Repository (the record, in its own later change)): Replace with "their own proposal", "names Ravi Kumar", "for Ravi Kumar", "gives Jordan Kim no proposing duty" and "Dean's standing instruction". Proved fixed when: A whole-file text scan for he, him, his, she, her finds nothing.

**AF-007 · RA3 · Document library; Outputs; Email; Calendar; Customer messages (phones).** Nodes: PH02 35:37940, PH02b 35:38127, PH04 32:33511, PH07 37:5836, PH12 32:9606, PH16 32:17516, PH18 32:17780, PH20 37:6165; PH17b 32:17718; Shell component 170:10215. Rule: Prompt RA3 (48 px phone targets, 16 px phone inputs); Shell R124. Found: The phone record header component, copied from the Shell (back 32×32, more 32×32, Actions 96×32, primary 260×32), gives 32 px Actions and primary on eight phone sheets, while PH15 and PH15b use a 48 px primary (A31); PH17b's applied search chip "Filter · Search: DSP" is 28 px high with 12 px text. Expected: Phone sticky bar and header controls at least 48 px; one phone primary height. Fix (Shell (component), then Documents & messages; Dean decides A31 (Q6)): Raise the Shell phone component's controls to 48 px, re-copy it here, and make PH17b's chip and the phone search controls 48 px with 16 px input text. Proved fixed when: No control on a phone sheet is under 48 px; PH15 and PH04 bars have one height.

### Minor

**AF-008 · CT2 · Every page with dialogs; Interaction states.** Nodes: CM03 29:14271, DL05 31:21354, OU03 19:1913 (scrims); ST04 47:983 (state layers); DL15b 29:10856 (File drop overlay). Rule: Prompt CT2; Library controls record (bound fill plus layer opacity). Found: 56 unbound paints: 37 scrims #242a37 at 32 %, 15 hover and pressed layers on ST04 (#242a37 at 8 % and 16 %, #000000 at 30 %), the File drop overlay override #e9eef5 at 92 %, and 3 on STX03 to STX05. Expected: Every visible fill and stroke bound to a PPO colour variable. Fix (Documents & messages): Bind each to brand/navy (or surface/navy-tint for the overlay) and move the opacity to the layer, as the Library does. Proved fixed when: A paint scan outside instances returns 0 unbound.

**AF-009 · CT5, CT4 · Interaction states.** Nodes: ST04 47:983. Rule: Library controls C1, confirmed by Dean on 10 November 2026 (Danger pressed moved to 18 % on 12 November). Found: 8 % and 16 % ink overlays on every kind (A36). Expected: Hover and pressed: brand/navy at 6 % and 12 % on the light kinds; brand/white at 12 % and 24 % on Primary and Danger (Danger pressed 18 %). Fix (Documents & messages): Redraw the ST04 state rows to C1 and withdraw A36's overlay values. Proved fixed when: ST04's hover and pressed rows quote the C1 values.

**AF-010 · CT4 · Outputs; Document library; Customer messages; Email; Interaction states.** Nodes: OU04 25:2410 (Running); OU01 19:245, OU02 25:1834 (Checked); OU06 25:2874 (Current); DL07 29:8488 (Open). Rule: The file's own ST01 46:244 and A36 (Running and Submitted neutral; Durable and Checked success); prompt CT4; cross-file AC-26. Found: Running is Info on OU04; Checked is Info in register cells on OU01 and OU02 and on 11 ST01 chips; Current is Success on OU06 and Neutral on 27 Document library chips; Open is Warning (findings), Info (Customer messages) and Danger (Outputs); Synthetic is Success on 12 chips and "Synthetic · simulated" Neutral on 9. Across files, Outcome unknown is Danger here and Warning in the Supply file. Expected: One tone per state word across the file and with the other files. Fix (Documents & messages; Dean for the shared table (AC-26)): Apply ST01's tones on every sheet, and split words that carry two meanings (pack state Checked against the Checked event) into two words. Proved fixed when: A chip scan returns one tone per word.

**AF-011 · CV6 · Templates; Email; Customer messages; Outputs.** Nodes: TP04 28:2660; TPX02 28:4156; EM01 25:14689; OU01 19:245. Rule: Addendum A2 (two-digit revisions); cross-file AF-063. Found: Single-digit revisions on 167 strings (Templates r1 47 and r2 78, for example "Current revision r2 · saved 08:15"; Email "Template r1 review notes", 28 strings; Customer messages r2, 10; Interaction states r2, 4); Outputs writes v1, v2 and v3 (26 strings) where Templates writes "Job pack version 3". Expected: r01, r02; one word for a template's version. Fix (Documents & messages): Use r01 and r02 for proposal revisions and "version 3" for template versions everywhere. Proved fixed when: A scan for \br\d\b and \bv\d\b finds none.

**AF-012 · CV6, FA3 · Customer messages.** Nodes: CM14 26:12632. Rule: Addendum A2 (SYN-XXX-000nnn). Found: "[SYN-C-00231] Statement – October 2026": a one-letter family with five digits, used nowhere else in the records read. Expected: A reference in the short form, or a named MYOB customer code recorded as an assumption. Fix (Documents & messages): Use the customer account's reference as the Finance file draws it, or record the code as an MYOB customer number. Proved fixed when: No reference on CM14 departs from A2 without a recorded reason.

**AF-013 · SH1, CT3 · Document library; Outputs; Templates; Email; Calendar; Customer messages.** Nodes: Docked frames on OU01 19:245 and CM01 22:1024; local component Shell / Workspace menu · docked 12:183; Shell 103:19012. Rule: Prompt SH1 (instances, not redrawn frames); accepted docked menu group headings 11 px. Found: Both proposed menus are frames (80 Documents, 60 Email); their group headings ("REVIEW", "NEEDS ATTENTION", "DOCUMENT PAGES") are 10 px. Expected: The proposed menus built from the local docked-menu component, with 11 px group headings. Fix (Documents & messages): Instance 12:183 (or the Knowledge menu after Q1) and set group headings to 11 px. Proved fixed when: No own 10 px text remains outside the specification boards.

**AF-014 · SH7, GV1 · Read me; repository record.** Nodes: Read me header 22:1016; record section 1. Rule: Named-version handoff rule 5; Shell record sections 12 and 13. Found: Both cite "Shell refined concept — accepted · record header toolbar" (10 November 2026); the Shell has a later version (12 November 2026, primary action contrast) and section 13 (navy primary) awaits its own. Expected: The latest named Shell version cited, or the reason for pinning stated. Fix (Documents & messages; Repository): Cite the version in force at the next batch and say which Shell sections the batch applies. Proved fixed when: Read me and record cite the same, latest version.

**AF-015 · SH3 · Document library; Outputs; Templates; Email; Calendar; Interaction states.** Nodes: DL03 31:20012, DL10 31:21426, TPX01 28:3732, EM02 32:25320, STX01 55:1668, STX02 55:2500, CA02 29:17850. Rule: Shell R45 and R67 (432 px panel beside the 48 px tab column); Library drawer widths decision (11 November 2026). Found: Right panels are 432 px; the Library sets 360 px for filters and columns and 480 px for editing a record section; the calendar's meeting detail pane is 384 px (340 px at 1024), on neither scale. Expected: One drawer scale. Fix (Dean (Q3)): Keep 432 px until Q3 is settled, then apply the chosen widths. Proved fixed when: Panel widths match the decided scale.

**AF-016 · CV4 · All scope pages.** Nodes: CM01 22:1024; OU01 19:245; DL01 25:11072; record sheets CM03, CM06, CM07, CM13, CMX01, CMX04, CMS01, CMS03, CMS05, CMS09, PH18, OU04, OU05, OU08 to OU10, OU12, DL04, DL06 to DL08, TP02, TP04. Rule: Prompt CV4 (Thu 5 Nov 2026; the zone once per list); cross-file AC-27 (recommended: short form allowed in registers and timelines within the story year, year required on headers, documents and customer sheets). Found: 375 dates without the year (Outputs 134, Interaction states 121, Document library 54, Customer messages 36, Email 26, Templates 3, Administration 1), mostly chips such as "Prepared · Wed 4 Nov 16:30"; 24 sheets show times with no zone anywhere on the sheet. Expected: The year on headers, documents and customer-facing text; the zone stated once on every sheet that shows a time. Fix (Documents & messages, after AC-27): Add the year where AC-27 requires it and one zone statement per sheet that shows times. Proved fixed when: A scan finds no time without a zone on the sheet and no header date without the year.

**AF-017 · CV4 · Templates.** Nodes: TP06 24:2172; TP02b 23:1267; TP10d 29:25249. Rule: Prompt CV4 (Block C in Brisbane, AEST); portal QA06 28:1886. Found: "Times in AEDT" and "Interval (AEDT)" for Northbank Farm · Block C. Expected: Block C site-use intervals in AEST. Fix (Documents & messages (Q4)): State Block C intervals in AEST, keeping the viewer's AEDT read-time footer. Proved fixed when: TP06, TP02b and TP10d show AEST for Block C.

**AF-018 · FA5, ST3 · Customer messages.** Nodes: CM15 26:13078. Rule: Record A33 (sheets not at 09:00 say so in their name); prompt FA5. Found: The sheet draws the card at 09:00 and again at 09:45 ("Later frame · 09:45 AEDT", "Thu 5 Nov 2026, 09:42"); its name and label say neither. Expected: The name and label say the sheet also draws 09:45. Fix (Documents & messages): Add "at 09:00 and a later frame at 09:45" to the name and label. Proved fixed when: CM15's label names both moments.

**AF-019 · HO2 · Outputs; Document library; Email.** Nodes: OU13 26:7868; DL15 31:19588; DL15b 29:10547; DL15c 32:40268; EM10 31:38024. Rule: Prompt HO2 (another file's page is an instance or a labelled preview). Found: Service's work order pages SYN-WO-000060 and SYN-WO-000062 are drawn as carriers for the Outputs menu, Files drawer and Email section without naming Service as owner. Expected: The label says whose page it is, as CM15's "(EC-04 on CS-01)" does. Fix (Documents & messages): Add the owning scope ("on Service's work order page") to the five names and labels. Proved fixed when: The five labels name Service's page.

**AF-020 · HO2 · Administration.** Nodes: AD08 26:2999. Rule: Prompt HO2; Settings record GL04 133:1727 (numbering families registry); cross-file AC-25 (one registry in PPO-STD-001). Found: AD08 "Numbering, nudges and views — references …" defines the document reference families here while the Settings file draws the numbering registry. Expected: Reference numbering drawn in one place. Fix (Documents & messages; Dean (AC-25)): Point AD08's reference rows to the registry and keep only the module's own nudges and views. Proved fixed when: AD08 links to the registry and defines no family.

**AF-021 · SH4, GV1 · Read me.** Nodes: Read me header 22:1016. Rule: Accepted More panel, sheet E 6:1521 (SHARED RECORDS: … Products, Documents). Found: "reached from More › Shared records › Documents & outputs"; the accepted panel's entry is "Documents", and the Knowledge flyout's group is DOCUMENTS. Expected: The path as the accepted Shell words it. Fix (Documents & messages): Reword the path when Q1 is settled. Proved fixed when: The header names an entry that exists in the accepted Shell.

**AF-022 · CT1 · Every record sheet.** Nodes: Local component 13:383; DL10 31:21426; CM02 26:9409; CM04 25:4425; CM07 25:5662. Rule: R116 and R117 (state-driven primary). Found: Variants are named for quotation states and chosen by look: a reviewed document on Draft (DL10), a sent message on Closed (CM04), a prepared message on Approved · not issued (CM02), a held message on Draft (CM07). Expected: Toolbar variants named for record states in general, or one variant per pattern. Fix (Shell, then Documents & messages): Rename the variants in the Shell file by pattern and re-copy. Proved fixed when: Variant names describe the pattern, not a quotation state.

**AF-023 · ST5 · Read me.** Nodes: Sheet index 63:43329. Rule: Prompt ST5; the record's section 10.2 cites page IDs. Found: All 213 sheet IDs and the notes cards are cited and resolve; the page IDs 7:4 to 7:13 are not. Expected: Page node IDs beside each page heading. Fix (Documents & messages): Add the page ID to each page heading of the index. Proved fixed when: Each page heading in the index carries its ID.

**AF-024 · FA1 · Email; Calendar.** Nodes: EM09b 32:24375; PH10 37:6088; CA07c 31:25421. Rule: Prompt FA1; record A32. Found: "Reconnect required, 1 sync error" here; "Outlook connected, synced 08:58" on the accepted Sales file's A01. Expected: One state for Dean Fiedler's mailbox at 09:00. Fix (Dean, then the Sales file (a new named version) or this file): Decide one state and align the other file. Proved fixed when: Both files show the same state.

### Polish

**AF-025 · ST2, ST3 · Customer messages; Templates; Interaction states; Administration; tablets and phones.** Nodes: Sections 22:1023, 32:16696, 32:16697 (Customer messages); tablet and phone sections of Document library and Outputs. Rule: Read me page template 22:1020 (x 60, 1660, 3260; tablets at a 1084 px pitch; phones at 450 px in rows 944 apart). Found: Desktop sheets stacked in one column on four pages; tablets in one column on four pages; phone rows 160 px apart on Customer messages and Email and 100 px on Document library and Outputs. Expected: The template grid where sheets are 900 px high. Fix (Documents & messages): Re-lay the sections on the template grid at the next batch. Proved fixed when: A position scan matches the template.

**AF-026 · ST3 · Email; Outputs.** Nodes: PH20 37:6165; OU13 26:7868; EMX09 35:24522; PH03 32:33159. Rule: Label form CODE · Page — state (scope ID) [signed in as …]. Found: "(5.7)" on PH20; "(R119 · DK-03)" on OU13; "(D1 · EC-01 Q2)" on EMX09; "(DK-03 Q6)" on PH03. Expected: The bracket led by the scope ID. Fix (Documents & messages): Lead each bracket with the scope ID. Proved fixed when: Every label bracket starts with DK- or EC-.

**AF-027 · CT3 · Interaction states.** Nodes: ST01 46:244 to ST05 55:598. Rule: Shell type scale, 11 to 20 px on desktop. Found: Board headings at 24, 26 and 40 px (93 strings). Expected: Board headings within the scale, or the boards marked as outside the product. Fix (Documents & messages): Leave as board styling and say so on the notes card, or use 20 px. Proved fixed when: The notes card states the board styling.

**AF-028 · CT5 · Shell and kit.** Nodes: Kit section 10:2; Sales / Status chip 11:20. Rule: Library Controls record (Controls / Chip with Neutral, Info, Success, Warning, Danger, Tint, Grey, Navy, Accent; Controls / Drawer 217:656; Controls / Dialog). Found: Local copies under the Sales names, with a "Green" chip tone where the Library has "Accent"; panels and dialogs drawn as frames. Expected: Library names and tones once the Library is published. Fix (Documents & messages, at Library adoption): Swap to the published Library parts through its reviewed handoff (A6). Proved fixed when: Instances point at Library components.

After the batch: re-run the page extraction (structure, labels, instances, unbound paints, chip tones, revisions, zones and pronouns), re-run the ST05 contrast board, and update the record's sheet inventory and A-list in the same change. The Sales file (AF-024) is accepted, so a change there needs its own new named version.
