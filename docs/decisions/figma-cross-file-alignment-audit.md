# Cross-file Figma alignment audit

<!-- versioning: git; committed history is authoritative -->

| Document control | Value |
|---|---|
| ID | PPO-FIGMA-ALIGNMENT-AUDIT |
| Date | Thu 12 Nov 2026 |
| Status | Audit findings, 2026-11-12; no design is changed and nothing is accepted by this record |
| Decision owner | Dean Fiedler |

Thu 12 Nov 2026. Read-only findings; no design is changed and nothing is accepted by this report.

All 13 linked module files were read, plus targeted accepted Shell authorities. The register contains 77 deduplicated finding groups: 12 Blocker, 19 Major, 45 Minor, 1 Polish. Shared findings count once globally and can affect several files. This is a bounded audit, not a clean bill of health.

## Scope and evidence

Repository snapshot: `eeac965493a2d856d7e8fdc27ab4ef35acf15188`. The source sweep read 63 documents and scanned 920 decision/status records for Figma URLs and 15 known file keys, finding none. The latter does not prove that arbitrary unknown opaque strings cannot be keys. The attached audit prompt was explicitly requested for execution; other source documents were evidence under its authority rules. Full A1, A2 and amended A3 were not supplied. The 409 record excerpts and 25 prompt fragments are not a substitute for all canonical facts.

Sales build basis: `PPO - Sales module (accepted) · batch 2 · N13`, Mon 9 Nov 2026, later of duplicate names as recorded; Tue 10 Nov 2026 phone-bar change still needs a recorded build pin. Estimating: `PPO - Estimating module (accepted)`, Tue 10 Nov 2026. Shell: `Shell refined concept — accepted · record header toolbar`, Tue 10 Nov 2026, following the Sun 8 Nov 2026 accepted version. Named-version history was unavailable; these are record citations, not independent history verification. Module names use Read me/source titles because the API returned the generic root name Document.

Pending records were read separately from accepted/main authority: PR #913 · Settings, PR #914 My Work, PR #916 Shared records, PR #917 Service and PR #918 Documents/messages. Their proposed completion explains newer live content; no pending acceptance is inferred. Source records are `docs/decisions/{sales,estimating,projects,supply,engineering,service,finance,settings,reporting}-module-refined-ui-proposal.md`, `my-work-refined-ui-proposal.md`, `shared-records-refined-ui-proposal.md`, Shell record/rules, named-version handoff, readable-reference namespaces, Library records, code navigation/permissions and the design register.

## Method and coverage

One Figma session was reused. Read-only walks extracted sections/sheets, all scope TEXT nodes, local component inventories, literal paints and bounds. Large payloads exceeded the 48,000-byte response cap, so chunked compressed reads and matching hashes replaced the original 120–180 call estimate. Failed diagnostic/invalid-page reads were retried; no linked scope page remains unread because of a timeout or tool limit. Some Read me/kit paint and mixed-font details were not fully expanded. No screenshots were needed to settle the reported text/property findings; this does not establish all rendered clipping or visual equivalence. Local analysis used Python isolated mode.

Full compound checks are marked Not checked whenever only part was proved. Fail means at least one confirmed mismatch, with the unchecked remainder retained. The 43 base checks × 15 module files have 645 filled cells: 452 Not checked, 94 Fail, 64 Pass, 35 Not applicable. Additional matrix rows cover 25 available truth fragments, 409 source excerpts and 13 handover pairs. Source-excerpt rows remain Not checked until normalised against the complete A3.

## Results by file

| File | Scope pages | Sheets / cards¹ | Logged calls² | Blocker | Major | Minor | Polish |
|---|---|---|---|---|---|---|---|
| PPO - Sales module (accepted) | 8 | 114 | 35 | 9 | 1 | 2 | 0 |
| PPO - Estimating module | 15 | 297 | 70 | 2 | 0 | 0 | 0 |
| PPO - Projects module | 14 | 234 | 38 | 0 | 5 | 4 | 0 |
| PPO - Supply module | 15 | 233 | 41 | 1 | 4 | 5 | 0 |
| PPO - Engineering module | 12 | 193 | 27 | 1 | 1 | 5 | 0 |
| PPO - Service module | 17 | 288 | 29 | 1 | 1 | 4 | 0 |
| PPO - Finance module | 10 | 221 | 31 | 1 | 1 | 4 | 0 |
| PPO - Settings module | 14 | 267 | 39 | 1 | 0 | 2 | 0 |
| PPO - Reporting module | 11 | 221 | 49 | 1 | 5 | 1 | 0 |
| PPO - My Work module | 11 | 137 | 35 | 1 | 1 | 3 | 1 |
| PPO - Customers, Sites & Equipment module | 15 | 184 | 23 | 1 | 0 | 5 | 0 |
| PPO - Documents & messages module | 8 | 202 | 24 | 1 | 1 | 4 | 0 |
| PPO - Customer portal module | 9 | 174 | 16 | 1 | 1 | 5 | 0 |
| PPO - Assistant, Knowledge and Help | — | — | — | 0 | 0 | 0 | 0 |
| PPO - Products module | — | — | — | 0 | 0 | 0 | 0 |
| PPO - Shell (accepted) | targeted authority | — | targeted reads | 1 | 0 | 1 | 0 |

¹Sheet definitions vary: Reporting 221 includes notes/cards; Finance scope 221 plus 1 kit menu; others separate notes where recorded. No misleading combined sheet total is claimed. ²Calls include per-file logged failures/retries and identified parent metadata/confirmations. Shell/session and unallocated diagnostics are additional; an exact complete session-call total is not claimed.

Settings 267 sheets, My Work 137, Shared records 184 and Service 288 are present despite older main records. Documents/messages has drawn scope content but unfinished index/audit cards. Customer portal has174 sheets with an empty Read me. Missing unfinished material is Not checked, not a defect. Library is record-only; Assistant/Knowledge/Help and Products have no supplied location and remain Not checked. Frozen Design was not opened because no confirmed finding required it.

## Ten priority findings

- **AF-001 · Accepted toolbar primary labels fail contrast across local copies.** White #ffffff on green #3d9a37 is 3.573964:1 in the accepted Shell and extracted local copies. Several module audit cards claim all pairs pass or that the failing pair is unused. Owner: PPO - Shell (accepted), then the affected module owners.
- **AF-008 · Record header toolbar adoption remains open.** R01 has the earlier header; the local kit and all scope instance inventories contain no record-header-toolbar component; no Outputs or Reports label appears anywhere on Sales sheets Owner: PPO - Sales module (accepted).
- **AF-003 · Products exposes totals in desktop and tablet views.** PR01: 12 of 412 catalogue entries, 412 in catalogue; TB08: 12 of 248 products Owner: PPO - Sales module (accepted).
- **AF-005 · Earlier Noah Clarke fixture remains.** 10 current Noah Clarke occurrences Owner: PPO - Sales module (accepted).
- **AF-077 · Sales phone-bar change lacks a recorded new build pin.** The record explicitly says a new named version is needed after 11 phone-bar placements, while the build basis remains Mon 9 Nov batch 2 N13. Version history is unavailable; a later unrecorded save may exist. Owner: Dean; Repository; PPO - Sales module (accepted).
- **AF-033 · SYN-OPP-000301 remains in Engineering’s recorded Hillview/Mallee conflict.** SYN-OPP-000301 remains in Engineering’s recorded Hillview/Mallee conflict Owner: Dean; PPO - Engineering module.
- **AF-073 · Reporting counts the October T06 test in the Q3 cohort.** Reporting DP07 lists CP-4 T06 SM-3 among 12 Q3 tests, whereas Engineering records the test on Thu 15 Oct 2026. Owner: Dean; PPO - Reporting module.
- **AF-074 · Sales and Reporting disagree on the 38 open deals by stage.** Sales D04 Discovery/Scoping/Quoting/Negotiation/Closing=9/8/11/6/4. Reporting=9/11/10/5/3. Both total 38. Owner: Dean; PPO - Reporting module; PPO - Sales module (accepted).
- **AF-075 · Glasshouse 4 Update 4 has different fixed source revisions across the handover.** Projects SU04 is r01 fixed Wed 4 Nov17:20 with Jo Marsh/Priya Shah as email recipients. Documents CM05 says r2 fixed Thu 5 Nov08:24, Prepared08:30 at 09:00, and CM07 holds Priya. Portal later09:45 shows r2 published09:40 and Priya Held. The last two agree; no r02/08:24 transition is drawn in Projects. Owner: Dean; PPO - Projects module.
- **AF-053 · Ravi Today queue omits the specified report-questions task.** OV07 instead shows a report-response Today row for SYN-RPT-000040: Agree a due date with Sam Whitlock; its explanation says the response was not Accepted. No Owen/report-questions task occurs anywhere in My Work. Service identifies the same report as awaiting Owen Dunne. Owner: PPO - My Work module (proposal).

## Findings register

Every finding below preserves its rule, expected and found values, owner and recommended action. The scratch CSV uses one row per evidence occurrence (finding IDs repeat); JSON groups those occurrences. Both retain all evidence; representative evidence is shown here.

### AF-001 · Blocker · Accepted toolbar primary labels fail contrast across local copies

File: PPO - Shell (accepted) and local module copies. Checks: RA2. Rule/source: Prompt RA2; accepted Shell live Draft toolbar 170:9933; local module proofs and enabled instances.

Expected: At least 4.5:1 for 14 px normal-size text; correct the proof wherever it claims this pair passes or is unused.

Found: White #ffffff on green #3d9a37 is 3.573964:1 in the accepted Shell and extracted local copies. Several module audit cards claim all pairs pass or that the failing pair is unused.

Fix owner: PPO - Shell (accepted), then the affected module owners. Action: Choose an accessible primary fill/text pair in the Shell owner’s reviewed batch, save a new named version, then propagate local copies and recalculate each module’s proof and enabled primary states. New accepted version: True. Evidence occurrences: 102.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Shell (accepted) / Record header toolbar | [node ID retained in scratch] | Submit for approval |
| PPO - Supply module / Material demand and Pulse · SC-01 | [instance ID retained in scratch] | Record supplier promise |
| PPO - Supply module / Material demand and Pulse · SC-01 | [instance ID retained in scratch] | Record supplier promise |

### AF-002 · Blocker · Single-digit revision labels remain

File: PPO - Sales module (accepted). Checks: CV6. Rule/source: Prompt CV6/A2; sales-module-refined-ui-proposal.md §13.6 follow-up2.

Expected: r01, r02 and corresponding two-digit revisions

Found: 231 current text nodes contain single-digit revision labels

Fix owner: PPO - Sales module (accepted). Action: Replace current rN labels with r0N, retaining the same revision identity. New accepted version: True. Evidence occurrences: 231.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Sales module (accepted) / Deals · CR-01 · CR-04 | [node ID retained in scratch] | Signed quotation · SYN-QUO-000171 r1 |
| PPO - Sales module (accepted) / Deals · CR-01 · CR-04 | [node ID retained in scratch] | Signed quotation · SYN-QUO-000187 r1 |
| PPO - Sales module (accepted) / Deals · CR-01 · CR-04 | [node ID retained in scratch] | Signed quotation · SYN-QUO-000198 r2 |

### AF-003 · Blocker · Products exposes totals in desktop and tablet views

File: PPO - Sales module (accepted). Checks: CV3. Rule/source: Prompt CV3, known item3 and Q5 default; A3.13 excerpt.

Expected: 12 shown · limit 100; no total/view-tile totals/pager on a bounded read

Found: PR01: 12 of 412 catalogue entries, 412 in catalogue; TB08: 12 of 248 products

Fix owner: PPO - Sales module (accepted). Action: Use the bounded count wording and remove total-based view counts and pagination from PR01 and TB08. New accepted version: True. Evidence occurrences: 5.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Sales module (accepted) / Contacts, customers, products and insights · CS-01 · CS-02 · CS-03 · CS-04 · PD-01 · CR-04 · RP-02 | [node ID retained in scratch] | Showing 12 of 412 catalogue entries · as at Thu 5 Nov 2026, 09:00 |
| PPO - Sales module (accepted) / Contacts, customers, products and insights · CS-01 · CS-02 · CS-03 · CS-04 · PD-01 · CR-04 · RP-02 | [node ID retained in scratch] | 412 |
| PPO - Sales module (accepted) / Contacts, customers, products and insights · CS-01 · CS-02 · CS-03 · CS-04 · PD-01 · CR-04 · RP-02 | [instance ID retained in scratch] | 412 in catalogue |

### AF-004 · Blocker · Products keeps obsolete catalogue-form references

File: PPO - Sales module (accepted). Checks: CV6. Rule/source: Prompt CV6, known item3; full A3.13 not supplied.

Expected: Short family references from A2; exact product-family mapping requires full A3.13

Found: 12 SYN-PRD-F/M/V references on PR01

Fix owner: PPO - Sales module (accepted). Action: Map each product to the full A3.13 catalogue before replacing its obsolete reference; do not invent replacement numbers. New accepted version: True. Evidence occurrences: 12.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Sales module (accepted) / Contacts, customers, products and insights · CS-01 · CS-02 · CS-03 · CS-04 · PD-01 · CR-04 · RP-02 | [node ID retained in scratch] | SYN-PRD-V-0402-01 |
| PPO - Sales module (accepted) / Contacts, customers, products and insights · CS-01 · CS-02 · CS-03 · CS-04 · PD-01 · CR-04 · RP-02 | [node ID retained in scratch] | SYN-PRD-V-0331-03 |
| PPO - Sales module (accepted) / Contacts, customers, products and insights · CS-01 · CS-02 · CS-03 · CS-04 · PD-01 · CR-04 · RP-02 | [node ID retained in scratch] | SYN-PRD-M-0318 |

### AF-005 · Blocker · Earlier Noah Clarke fixture remains

File: PPO - Sales module (accepted). Checks: FA2. Rule/source: Prompt FA2/A3 correction excerpt.

Expected: Noah Patel

Found: 10 current Noah Clarke occurrences

Fix owner: PPO - Sales module (accepted). Action: Replace Noah Clarke with Noah Patel everywhere that the same synthetic person appears. New accepted version: True. Evidence occurrences: 10.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Sales module (accepted) / Contacts, customers, products and insights · CS-01 · CS-02 · CS-03 · CS-04 · PD-01 · CR-04 · RP-02 | [node ID retained in scratch] | Noah Clarke |
| PPO - Sales module (accepted) / Contacts, customers, products and insights · CS-01 · CS-02 · CS-03 · CS-04 · PD-01 · CR-04 · RP-02 | [node ID retained in scratch] | Noah Clarke |
| PPO - Sales module (accepted) / Contacts, customers, products and insights · CS-01 · CS-02 · CS-03 · CS-04 · PD-01 · CR-04 · RP-02 | [node ID retained in scratch] | Introduce a Powerplants contact to Noah Clarke (billing) |

### AF-006 · Blocker · Gendered pronouns describe synthetic people

File: PPO - Sales module (accepted). Checks: FA7. Rule/source: Prompt standing instruction4 and FA7.

Expected: Names or they/them/their

Found: 3 current text nodes use her for a synthetic person

Fix owner: PPO - Sales module (accepted). Action: Use their for each possessive her, preserving the meaning. New accepted version: True. Evidence occurrences: 3.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Sales module (accepted) / Handovers and aftercare · CR-02 · CR-03 · CR-05 | [node ID retained in scratch] | Did not attend · the Service referral still carries her case |
| PPO - Sales module (accepted) / Deal record · CR-01 | [node ID retained in scratch] | Mei Tran confirmed the two-bay scope on 3 Nov; her two open questions (zone 3 misting split, whether commissioning is in the price) arrived by email today at 08:41. |
| PPO - Sales module (accepted) / Administration and customisation · AD-02 | [node ID retained in scratch] | Sasha Clarke changed her Pulse digest time to 07:30 |

### AF-007 · Minor · Read me retains superseded named-version status

File: PPO - Sales module (accepted). Checks: GV1. Rule/source: sales-module-refined-ui-proposal.md §13.6 and §14; prompt GV1.

Expected: Identify the later 9 Nov batch 2 N13 save as the 114-sheet build basis; distinguish the later 10 Nov phone-bar change pending a new recorded version

Found: Header says 52 sheets await a named version although §13.6 records the later save

Fix owner: PPO - Sales module (accepted). Action: Rewrite the header status against §13.6 and §14, without claiming the later phone change is pinned. New accepted version: True. Evidence occurrences: 1.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Sales module (accepted) / Read me · PPO - Sales | [node ID retained in scratch] | Refined desktop UI pages for the Sales workspace of Powerplants One, composed inside the accepted shell (PPO - Shell, named version "Shell refined concept — accepted", 8 November 2026). Accepted set (named version "PPO - Sales module (accepted)", 9 November 2026): 62 sheets. Drawn after it on 9 November 2026 and awaiting a new named version: 52 sheets — Deal record tabs (3), Lead record tabs (4), Sales brief Questions and r2 (2), aftercare dialogs (3), Person, Stakeholders, Sites and New organisation/person (6), administration and customisation (12: AD01–AD09, X23–X25), interaction states (ST01), tablet and phone (21). Total 114 sheets, since 9 November 2026 organised on one page per scope (see the Page template card) and counted by area: Deals (8), Deal record (7), Leads and Sales Pulse (7), Tasks, Activities and Email (3), Handovers and aftercare (8), Contacts, customers, products and insights (10), Dialogs (25), States (7), Tablet and phone (30), Administration (9). N1–N4 are accepted and integrated. Shell chrome is instanced from copies of the accepted components in this file so it can be swapped to the published library later; the 1024 tablet bar matches the accepted shell sheet W (zones 332 / 360 / 332, corrected 9 November 2026 after the batch 2 · N13 version); the phone header and Sales tab bar are derived here. Every record, person, value and date is synthetic (as at Thu 5 Nov 2026, 09:00, signed in as Dean Fiedler). |

### AF-008 · Blocker · Record header toolbar adoption remains open

File: PPO - Sales module (accepted). Checks: SH6. Rule/source: Prompt SH6; Shell R116–R125; Sales §13.6 follow-up1.

Expected: A1/R116–R125 record header: previous/next in view, Actions, Outputs where relevant and one state-driven primary

Found: R01 has the earlier header; the local kit and all scope instance inventories contain no record-header-toolbar component; no Outputs or Reports label appears anywhere on Sales sheets

Fix owner: PPO - Sales module (accepted). Action: Adopt the accepted A1 header across the record-page batch, including phone sticky actions, and save a new named version. New accepted version: True. Evidence occurrences: 1.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Sales module (accepted) / Deal record · CR-01 | 16:2456 | Earlier shared record layout; no A1 toolbar instance |

### AF-009 · Blocker · Literal paints remain beyond documented exceptions

File: PPO - Sales module (accepted). Checks: CT2. Rule/source: Prompt CT2; Sales §4 and §13.2.

Expected: PPO colour variable binding; preserve opacity; known forecast ramp and plain scrims remain declared exceptions

Found: 42 nodes outside shell copies, forecast ramp and scrims have literal fills or strokes, including stage text, selection controls and notes cards

Fix owner: PPO - Sales module (accepted). Action: Bind each non-exempt solid paint to the matching PPO colour variable, preserving its current opacity. New accepted version: True. Evidence occurrences: 42.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Sales module (accepted) / Deals · CR-01 · CR-04 | [node ID retained in scratch] | Notes · Deals |
| PPO - Sales module (accepted) / Deals · CR-01 · CR-04 | [node ID retained in scratch] | Button · Plan activity |
| PPO - Sales module (accepted) / Deals · CR-01 · CR-04 | [node ID retained in scratch] | Divider |

### AF-010 · Minor · Labels have truncation disabled

File: PPO - Sales module (accepted). Checks: ST3. Rule/source: Prompt ST3; Sales §13.6 says every one-line label truncates to the sheet width.

Expected: textTruncation=ENDING at the sheet width

Found: 23 sheet labels have textTruncation=DISABLED despite their fixed sheet-width bounds

Fix owner: PPO - Sales module (accepted). Action: Enable ending truncation on the 23 labels while preserving their sheet-width bounds and y offset. New accepted version: True. Evidence occurrences: 23.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Sales module (accepted) / Handovers and aftercare · CR-02 · CR-03 · CR-05 | [node ID retained in scratch] | TB09 · Estimating handovers — Sales briefs worklist at 1024 × 768 (tablet: grouped by who acts next; Save is not Submit) [G11] |
| PPO - Sales module (accepted) / Handovers and aftercare · CR-02 · CR-03 · CR-05 | [node ID retained in scratch] | TB15 · Sales brief record at 1024 × 768 (tablet: Draft with the nine-check bar, details column, Brief tab; Submit disabled with the reason) [G11] |
| PPO - Sales module (accepted) / Handovers and aftercare · CR-02 · CR-03 · CR-05 | [node ID retained in scratch] | TB10 · Won-deal receiving — worklist at 1024 × 768 (tablet: grouped by receiving state; the Won obligation is immutable) [G11] |

### AF-011 · Blocker · Relative due time contradicts the story clock

File: PPO - Sales module (accepted). Checks: FA5. Rule/source: Sales §2/§5 A9 and Read me [node ID retained in scratch] story clock; prompt FA5.

Expected: today, 14:00 · due in 5 h at Thu 5 Nov 2026, 09:00

Found: 9 copies say today,14:00 · due in3h

Fix owner: PPO - Sales module (accepted). Action: Change due in 3 h to due in 5 h on the nine copies, or label an explicitly later story frame if its clock intentionally differs. New accepted version: True. Evidence occurrences: 9.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Sales module (accepted) / Deal record · CR-01 | [node ID retained in scratch] | Next step · Call Mei Tran · today, 14:00 · due in 3 h |
| PPO - Sales module (accepted) / Deal record · CR-01 | [node ID retained in scratch] | Next step · Call Mei Tran · today, 14:00 · due in 3 h |
| PPO - Sales module (accepted) / Deal record · CR-01 | [node ID retained in scratch] | Next step · Call Mei Tran · today, 14:00 · due in 3 h |

### AF-012 · Blocker · Quotation revision labels remain single-digit

File: PPO - Estimating module. Checks: CV6. Rule/source: Estimating §4 reference rule, §11.1 quotation revisions, Read me [node ID retained in scratch]; prompt CV6/A2.

Expected: r01, r02, r03 as appropriate

Found: 47 current quotation/customer-quotation text nodes still contain r1/r2/r3

Fix owner: PPO - Estimating module. Action: Normalise the quotation revision labels to two digits without changing their revision or state. New accepted version: True. Evidence occurrences: 47.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Estimating module / Quotations · ES-05 · ES-06 · ES-07 | [instance ID retained in scratch] | r1 · Accepted |
| PPO - Estimating module / Quotations · ES-05 · ES-06 · ES-07 | [instance ID retained in scratch] | r2 · Not approved |
| PPO - Estimating module / Quotations · ES-05 · ES-06 · ES-07 | [instance ID retained in scratch] | r1 · Issued · viewed |

### AF-013 · Blocker · Gendered pronouns describe synthetic people

File: PPO - Estimating module. Checks: FA7. Rule/source: Prompt standing instruction4 and FA7.

Expected: Names or they/them/their

Found: 3 current text nodes use he/her for synthetic people

Fix owner: PPO - Estimating module. Action: Use they for Dean, their own mailbox for Sasha Clarke, and them Director for the respondent. New accepted version: True. Evidence occurrences: 3.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Estimating module / Administration · ES | [node ID retained in scratch] | Grants are generated from the permissions file into the AD-01 access review; this page reads them and never edits them. Dean holds publish duties until he says otherwise. |
| PPO - Estimating module / Quotations · ES-05 · ES-06 · ES-07 | [node ID retained in scratch] | Quotation SYN-QUO-000205 · acceptance #1 recorded Mon 2 Nov 2026, 14:30 · correction #2 recorded Tue 3 Nov 2026, 09:05 by Priya Nair · the respondent’s role was recorded as Owner; the PO names her Director |
| PPO - Estimating module / Quotations · ES-05 · ES-06 · ES-07 | [node ID retained in scratch] | Quotation SYN-QUO-000209 · issued Mon 26 Oct 2026, 14:00 · fingerprint 3f8c…b02d · deal owner Sasha Clarke sends from her own mailbox · as at Mon 26 Oct 2026, 14:05 |

### AF-014 · Major · Kim Patel remains under conflicting persona authorities

File: PPO - Projects module. Checks: FA2, FA1. Rule/source: Supplied audit prompt §4.5 FA2; authority conflict with estimating-module-refined-ui-proposal.md A23.

Expected: No current person named Kim Patel under the supplied A3 summary

Found: 111 extracted text nodes mention Kim Patel; includes active named engineering roles. The owner-accepted Estimating A23 also names Kim Patel, so the cross-file authority conflict must be settled explicitly. This is a failed prompt comparison, not permission to override the accepted Estimating role.

Fix owner: Dean; PPO - Projects module. Action: After Dean settles the recorded Estimating/A3 conflict and supplies the role mapping, replace Kim Patel consistently in the affected current facts and their notes; do not invent a replacement person. New accepted version: False. Evidence occurrences: 111.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Projects module / Risks & issues · PJ-04 | [node ID retained in scratch] | Kim Patel |
| PPO - Projects module / Risks & issues · PJ-04 | [node ID retained in scratch] | Dependency · High · owner Kim Patel (Engineering) · review deadline Wed 4 Nov 2026 passed yesterday · linked readiness blocker |
| PPO - Projects module / Risks & issues · PJ-04 | [node ID retained in scratch] | Kim Patel · Engineering |

### AF-015 · Minor · Gendered pronouns remain in text

File: PPO - Projects module. Checks: FA7. Rule/source: Supplied audit prompt §4 (FA7); full A1–A3 addenda not supplied.

Expected: Use names or they/them for people

Found: 2 text nodes contain gendered pronouns; the occurrence register preserves the full text and location.

Fix owner: PPO - Projects module (proposal). Action: Replace gendered references with the named person or grammatically correct they/them/their wording, then rescan all text nodes. New accepted version: False. Evidence occurrences: 2.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Projects module / Read me · PPO - Projects | 35:4 | Refined UI pages for the Projects workspace of Powerplants One, composed inside the accepted shell (PPO - Shell, named version "Shell refined concept — accepted", 8 November 2026) and organised on the page template adopted for the Sales file on 9 November 2026. Scope pages sit under — Proposals — until Dean accepts them; a page moves above — Accepted — on his word and keeps every node ID. [Source attribution omitted.] Every record, person, value and date is synthetic: as at Thu 5 Nov 2026, 09:00 AEDT (Melbourne), signed in as project manager Morgan Lee; site facts in site time with the zone named. |
| PPO - Projects module / Stakeholder updates · PJ-08 | [node ID retained in scratch] | Noah Patel received Update 3 and has since left the customer. He is flagged and removed from Update 4; sent updates keep their own distribution (D6). |

### AF-016 · Minor · Two history headings have the wrong weekday

File: PPO - Projects module. Checks: CV4. Rule/source: Supplied audit prompt §4 (CV4); full A1–A3 addenda not supplied.

Expected: Wed 4 Nov 2026; Tue 3 Nov 2026 if the displayed calendar dates are retained

Found: Tue 4 Nov 2026 and Mon 3 Nov 2026 on IN09 history.

Fix owner: PPO - Projects module (proposal). Action: Confirm the event dates against the complete ledger, then correct the weekday/date pairs; if retaining 4 and 3 Nov, use Wed and Tue respectively. New accepted version: False. Evidence occurrences: 2.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Projects module / Initiation · PJ-01 | [node ID retained in scratch] | Tue 4 Nov 2026 |
| PPO - Projects module / Initiation · PJ-01 | [node ID retained in scratch] | Mon 3 Nov 2026 |

### AF-017 · Major · Project record still uses the earlier custom header

File: PPO - Projects module. Checks: SH6, SH1. Rule/source: Supplied audit prompt SH6/A1; latest accepted Shell R116–R125.

Expected: Shared A1 header instance: breadcrumb, one-row title/state/star, sub-line, previous/next in view, Actions, Outputs where applicable and one state-driven primary

Found: RC01 50:2 shows Record baseline and Add task in the earlier header. No record-header toolbar component exists in the 154-component local kit; record-page instance inventory contains no shared record-header toolbar.

Fix owner: PPO - Projects module (proposal). Action: Adopt the latest accepted record-header toolbar and its phone pattern on Projects record sheets; preserve their page-specific primary and output availability. New accepted version: False. Evidence occurrences: 3.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Projects module / Project record · PJ-02 | [node ID retained in scratch] | Block C fertigation upgrade |
| PPO - Projects module / Project record · PJ-02 | [node ID retained in scratch] | Record baseline |
| PPO - Projects module / Project record · PJ-02 | [node ID retained in scratch] | Add task |

### AF-018 · Minor · Read me index and repository inventory omit drawn nodes

File: PPO - Projects module. Checks: ST5. Rule/source: Supplied audit prompt §4 (ST5); full A1–A3 addenda not supplied.

Expected: Index X33 126:5103 and Interaction states notes [node ID retained in scratch] in Read me; include notes [node ID retained in scratch] in repository inventory; include every page node ID, including separators and Scratch.

Found: Read me text contains neither node ID. Repository records X33 but omits [node ID retained in scratch]. All 247 recorded table node IDs do resolve; this finding is incomplete indexing, not missing Figma nodes. Read me also omits node IDs for Read me · PPO - Projects 0:1, — Accepted — 12:2, — Proposals — 12:3, Scratch 12:19.

Fix owner: PPO - Projects module (proposal). Action: Update the Projects Read me index and its repository record to include the two drawn nodes with their correct page and purpose. New accepted version: False. Evidence occurrences: 7.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Projects module / Read me · PPO - Projects | 35:8 | index text |
| PPO - Projects module / Projects register and Pulse · PJ-02 | 126:5103 | X33 · Projects register — accepted Projects workspace flyout |
| PPO - Projects module / Interaction states · PJ | [node ID retained in scratch] | Flows and notes · Interaction states · PJ |

### AF-019 · Major · UI paints remain literal outside shell copies

File: PPO - Projects module. Checks: CT2. Rule/source: Supplied audit prompt §4 (CT2); full A1–A3 addenda not supplied.

Expected: Bind UI colour fills and strokes to the matching PPO colour variable

Found: 131 UI paint occurrences confirmed on the targeted page after excluding section canvas decoration and named/instanced Shell ancestors. Full-file heuristic counts are reported separately, not treated as an exact defect total.

Fix owner: PPO - Projects module (proposal). Action: Bind each confirmed UI paint to the matching existing PPO colour variable and rerun the check, preserving intentional opacity and geometry. New accepted version: False. Evidence occurrences: 131.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Projects module / Project record · PJ-02 | [node ID retained in scratch] | fills |
| PPO - Projects module / Project record · PJ-02 | [node ID retained in scratch] | fills |
| PPO - Projects module / Project record · PJ-02 | [node ID retained in scratch] | fills |

### AF-020 · Minor · Sheet labels omit the signed-in person required by this audit

File: PPO - Projects module. Checks: ST3, FA4. Rule/source: Supplied audit prompt ST3/FA4 versus module Read me page-template cards ([source] convention).

Expected: Every sheet label explicitly identifies its signed-in person, matching the drawn account

Found: 234 of 234 labels do not contain signed in as. Their existing [source] form follows the module Read me template, which conflicts with the supplied audit label form.

Fix owner: PPO - Projects module (proposal). Action: Resolve the label-template conflict once, retain source traceability, and add the drawn signed-in person to every affected label without changing the persona. New accepted version: False. Evidence occurrences: 234.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Projects module / Risks & issues · PJ-04 | 86:3 | RK01 · Risks & issues — RAID register across projects: kind, priority Normal or High, owner, review deadline, state; 19 open (PJ-04) [project-raid-backend, refined · S-14] |
| PPO - Projects module / Risks & issues · PJ-04 | [node ID retained in scratch] | RK02 · Risks & issues — Project RAID view: Block C’s entries, open and closed, with links to readiness and variations (PJ-04) [project-raid-backend, refined] |
| PPO - Projects module / Risks & issues · PJ-04 | [node ID retained in scratch] | RK11 · Risks & issues — Closed project refuses a new entry: explained, existing entries read only (PJ-04) [project-raid-backend · 5.5] |

### AF-021 · Major · Shell basis is not pinned to the latest accepted toolbar version

File: PPO - Projects module. Checks: SH7. Rule/source: Supplied audit prompt SH7; named-version build handoff rule5; module Sources and Read me.

Expected: Cite the latest named Shell version or record an explicit reason for pinning the earlier one

Found: The source record/Read me cites the 8 November Shell basis or the toolbar as a proposal; no explicit reason to remain pinned after the accepted record-header named version is recorded.

Fix owner: Repository and PPO - Projects module (proposal). Action: Update this module’s recorded Shell basis after reviewing the toolbar adoption; if it must remain pinned, state the reason, limitations and follow-up batch explicitly. New accepted version: False. Evidence occurrences: 1.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Projects module / Read me · PPO - Projects | 35:4 | Refined UI pages for the Projects workspace of Powerplants One, composed inside the accepted shell (PPO - Shell, named version "Shell refined concept — accepted", 8 November 2026) and organised on the page template adopted for the Sales file on 9 November 2026. Scope pages sit under — Proposals — until Dean accepts them; a page moves above — Accepted — on his word and keeps every node ID. [Source attribution omitted.] Every record, person, value and date is synthetic: as at Thu 5 Nov 2026, 09:00 AEDT (Melbourne), signed in as project manager Morgan Lee; site facts in site time with the zone named. |

### AF-022 · Major · Kim Patel remains under conflicting persona authorities

File: PPO - Supply module. Checks: FA2, FA1. Rule/source: Supplied audit prompt §4.5 FA2; authority conflict with estimating-module-refined-ui-proposal.md A23.

Expected: No current person named Kim Patel under the supplied A3 summary

Found: 32 extracted text nodes mention Kim Patel; includes active named engineering roles. The owner-accepted Estimating A23 also names Kim Patel, so the cross-file authority conflict must be settled explicitly. This is a failed prompt comparison, not permission to override the accepted Estimating role.

Fix owner: Dean; PPO - Supply module. Action: After Dean settles the recorded Estimating/A3 conflict and supplies the role mapping, replace Kim Patel consistently in the affected current facts and their notes; do not invent a replacement person. New accepted version: False. Evidence occurrences: 32.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Supply module / Read me | [node ID retained in scratch] | Story: one synthetic dataset on every sheet, as at Thu 5 Nov 2026, 09:00 AEDT, signed in as supply coordinator Robin Hale. A sheet drawn for another person names them in its label and in its top bar (Casey Ng, Quinn Avery, Drew Collins, Avery Lin, Jordan Blake, Kim Patel, Casey Ward, Dean). |
| PPO - Supply module / Kitting and controllers · CX-02 | [node ID retained in scratch] | Asked · Kim Patel |
| PPO - Supply module / Kitting and controllers · CX-02 | [instance ID retained in scratch] | An independent engineer checks the configuration. Kim Patel has been asked. |

### AF-023 · Minor · Gendered pronouns remain in text

File: PPO - Supply module. Checks: FA7. Rule/source: Supplied audit prompt §4 (FA7); full A1–A3 addenda not supplied.

Expected: Use names or they/them for people

Found: 10 text nodes contain gendered pronouns; the occurrence register preserves the full text and location.

Fix owner: PPO - Supply module (proposal). Action: Replace gendered references with the named person or grammatically correct they/them/their wording, then rescan all text nodes. New accepted version: False. Evidence occurrences: 10.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Supply module / Read me | [node ID retained in scratch] | — Desktop 1440 —<br>49:523   RT01 · Returns & claims — register with four status columns: goods, customer remedy, supplier claim, credit; six views (SC-08) [proposal 23 October 2026, new shell]<br>49:1015   RT12 · Returns & claims — Credits & reconciliation view as the Finance lead: expected and observed amounts, “not cash”, supplier and customer credits never netted (SC-08, D6)<br>49:1420   RT02 · Return SYN-RTN-000015 FM-2 — Supplier claim: four-track strip, claim Submitted; prepared is not submitted (SC-08, S-24, full length)<br>49:1842   RT03 · Return SYN-RTN-000015 — Goods and custody: at bench, disposition ReturnToSupplier (SC-08)<br>49:2299   RT10 · Return SYN-RTN-000015 — History, grouped by day (SC-08)<br>— Dialogs and panels —<br>50:1673   RT04 · Return SYN-RTN-000015 — Credit, Match credit note as the Finance lead: expected A$395.00 “not cash”, MYOB observed A$268.00, difference recorded (SC-08, S-24)<br>50:2178   RT05 · Raise supplier claim — SV-24 ×2 from quarantine: the claim pack and the supplier’s return authority (SC-08, S-25)<br>50:2689   RT06 · Record supplier response — the supplier answered the claim; the next owner is named (SC-08)<br>— States —<br>50:3127   RT07 · Return SYN-RTN-000009 VA-41 — claim declined: the claim track closes, the goods get a new disposition, no credit (SC-08 state)<br>50:3503   RT08 · Return SYN-RTN-000020 SV-24 — MYOB send not confirmed: the “return to supplier” event reads Unknown and blocks a repeat (SC-08 state, S-25, N-S4)<br>50:3879   RT11 · Return SYN-RTN-000015 — Credit tab as the supply coordinator: amounts on her own claim, read only (proposed, SC-08 D7, Q3)<br>50:4292   RT13 · Return SYN-RTN-000015 — Credit tab as the supply coordinator on the accepted pattern: states in words, amounts withheld (D6)<br>— Tablet 1024 —<br>50:4693   TB14 · Return SYN-RTN-000015 FM-2 — Supplier claim at 1024 × 768 (tablet): the four tracks stay side by side (SC-08)<br>— Phone 390 and 320 —<br>50:5042   PH15 · Record goods received with a photo on the phone — DP-25 from Mallee Fresh (SC-08, RT09)<br>— Flows and notes —<br>50:5156   Notes · Returns & claims · SC-08 |
| PPO - Supply module / Read me | [node ID retained in scratch] | — Desktop 1440 —<br>58:517   IS01 · Supply & Finance trust — Supply view, signed in as Avery Lin: KPI-10 38 % (3 of 8), KPI-12 36 % (4 of 11), three ageing tables never added, expected credits “not cash” (RP-05, S-33) [accepted 1 November 2026, new shell]<br>58:1276   IS02 · Readiness and promise performance — promises kept by supplier, ETA freshness and Blocked by cause, counts with their rules (RP-05 extract; proposed, N-S5)<br>59:2140   IS03 · Drill-through — from the count “3 of 8” to its rows: the 8 assessed packages and the 3 left out (RP-05, S-33)<br>— Dialogs and panels —<br>58:2483   X20 · About this measure — KPI-10: definition, counts, what is left out, owner, version and sources (RP-05; panel)<br>— States —<br>58:3279   IS04 · Supply & Finance trust — signed in as Robin Hale: sections she may not read show Restricted and no figures, not even counts (RP-05 D10; 4.2 matrix)<br>58:3977   IS05 · Supply & Finance trust — partial source: MYOB credit notes unavailable; observed credits read Unavailable, never A$0.00 (5.13)<br>— Tablet 1024 —<br>58:4745   TB17 · Supply & Finance trust at 1024 × 768 (tablet), Supply view (RP-05)<br>— Phone 390 and 320 —<br>58:5427   PH20 · Supply & Finance trust on the phone — summaries first, then one list of Blocked and At risk lines; no tables (RP-05 D11)<br>— Flows and notes —<br>58:5556   Notes · Insights · RP-05 (Supply extract) |
| PPO - Supply module / Read me | [node ID retained in scratch] | — Desktop 1440 —<br>68:581   AD01 · Supply settings hub — what can be changed, by whom and at which scope; what waits for a decision; recent changes (administrator’s view) (SC, CX-02)<br>68:1026   AD02 · Readiness and promise rules — version 1 proposed and reviewed, ready to publish: promise basis, ETA freshness 7 days, acknowledgement limit 5 working days, both unallocated-demand words (SC-01, SC-02, SC-03; proposed, Q4)<br>68:1432   AD04 · Receiving and goods-in — dispositions, goods-in form item classes and serial-capture classes (SC-04)<br>68:1852   AD05 · Carriers and notices — carriers and the freight platform as placeholders; notice templates M1 and M2 linked to Customer messages (SC-06, SC-07; Q2)<br>68:2204   AD06 · Returns and claims — return dispositions, claim templates and the credit matching tolerance owned by Finance (SC-08)<br>68:2559   AD10 · Notifications, saved views and layout — Robin Hale’s own Supply settings: nudges, saved views with their counts, columns, density and record layout (SC)<br>69:1636   AD07 · Workshop settings — Overview: eight areas, each with its status in words, the version in force, proposals waiting and its owner (CX-02) [accepted design, new shell]<br>69:2023   AD08 · Test definitions — the register, and Earth continuity version 2 proposed (0.5 Ω to 0.2 Ω): the proposer cannot review it (CX-02) [accepted design, new shell]<br>69:2475   AD09 · Serial numbering and release rules — the serial never resets; the builder never releases (CX-02) [accepted design, new shell]<br>— Dialogs and panels —<br>69:2834   AD03 · Publish version — the affected open records are shown before the administrator publishes; the reviewer was a second person (SC; dialog)<br>69:3316   X23 · Propose a change — Earth continuity limit 0.5 Ω to 0.2 Ω: a limit change is a new version (CX-02; dialog) [accepted design, new shell]<br>— States —<br>69:3802   AS01 · Review refused — the proposer opens Review on their own proposal and is refused in plain words (CX-02 D7; 4.2 matrix)<br>69:4265   AS02 · Readiness and promise rules — Robin Hale’s view: read only; proposing and publishing need a settings permission she does not hold (4.2 matrix)<br>69:4679   AS03 · Publish refused — the review is out of date: the proposal changed after it was reviewed (CX-02 D7 pattern)<br>— Tablet 1024 —<br>69:5091   TB19 · Supply settings hub at 1024 × 768 (tablet) — the settings menu folds away; areas and what waits (SC, CX-02)<br>— Phone 390 and 320 —<br>69:5401   PH23 · Review on the phone — Dean reviews Earth continuity version 2 as a full-height sheet (CX-02) [accepted design, new shell]<br>— Flows and notes —<br>69:5508   Notes · Administration · SC · CX-02 |

### AF-024 · Major · Supplier claims retain the superseded reference family

File: PPO - Supply module. Checks: FA3, FA2, CV6. Rule/source: Supplied audit prompt FA2/FA3 and A3 supplier-claim family summary.

Expected: Use SYN-SCL- for supplier claims, retaining the same numeric suffix unless the complete ledger says otherwise

Found: 50 text nodes contain current SYN-CLM- supplier claim references.

Fix owner: PPO - Supply module (proposal). Action: Change supplier claim references from SYN-CLM- to SYN-SCL- consistently and verify them against Finance and Reporting before the next build handover. New accepted version: False. Evidence occurrences: 50.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Supply module / Returns and claims · SC-08 | [node ID retained in scratch] | SYN-RTN-000015 · SYN-CLM-000318 · FM-2 |
| PPO - Supply module / Returns and claims · SC-08 | [node ID retained in scratch] | SYN-RTN-000012 · SYN-CLM-000311 · TS-2 |
| PPO - Supply module / Returns and claims · SC-08 | [node ID retained in scratch] | SYN-RTN-000020 · SYN-CLM-000319 · SV-24 |

### AF-025 · Minor · Order revisions use one-digit labels

File: PPO - Supply module. Checks: CV6. Rule/source: Supplied audit prompt §4 (CV6); full A1–A3 addenda not supplied.

Expected: r01 instead of r1 under the shared two-digit display convention

Found: 8 text nodes show r1, including the recorded purchase-order revision and its material-change handover.

Fix owner: PPO - Supply module (proposal). Action: Use r01 in the affected displayed revision labels and preserve the underlying external order identity; confirm any exact external-source exception in the record. New accepted version: False. Evidence occurrences: 8.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Supply module / Material change impact · SC-09 | [node ID retained in scratch] | Revision r1 · Sent |
| PPO - Supply module / Material change impact · SC-09 | [node ID retained in scratch] | Revision r1 · Sent |
| PPO - Supply module / Material change impact · SC-09 | [node ID retained in scratch] | Revision r1 · Sent |

### AF-026 · Minor · UI paints remain literal outside shell copies

File: PPO - Supply module. Checks: CT2. Rule/source: Supplied audit prompt §4 (CT2); full A1–A3 addenda not supplied.

Expected: Bind UI colour fills and strokes to the matching PPO colour variable

Found: 2 UI paint occurrences confirmed on the targeted page after excluding section canvas decoration and named/instanced Shell ancestors. Full-file heuristic counts are reported separately, not treated as an exact defect total.

Fix owner: PPO - Supply module (proposal). Action: Bind each confirmed UI paint to the matching existing PPO colour variable and rerun the check, preserving intentional opacity and geometry. New accepted version: False. Evidence occurrences: 2.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Supply module / Material demand and Pulse · SC-01 | [node ID retained in scratch] | fills |
| PPO - Supply module / Material demand and Pulse · SC-01 | [node ID retained in scratch] | fills |

### AF-027 · Minor · Sheet labels omit the signed-in person required by this audit

File: PPO - Supply module. Checks: ST3, FA4. Rule/source: Supplied audit prompt ST3/FA4 versus module Read me page-template cards ([source] convention).

Expected: Every sheet label explicitly identifies its signed-in person, matching the drawn account

Found: 229 of 233 labels do not contain signed in as. Their existing [source] form follows the module Read me template, which conflicts with the supplied audit label form.

Fix owner: PPO - Supply module (proposal). Action: Resolve the label-template conflict once, retain source traceability, and add the drawn signed-in person to every affected label without changing the persona. New accepted version: False. Evidence occurrences: 229.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Supply module / Kitting and controllers · CX-02 | [node ID retained in scratch] | KC01 · Kitting & controllers — Kits register by state: Planned, Picking, Kitted, Issued (CX-02/kitting) [proposal 22 October 2026, new shell] |
| PPO - Supply module / Kitting and controllers · CX-02 | [node ID retained in scratch] | KC02 · Kitting & controllers — Controllers register by state (CX-02/kitting) |
| PPO - Supply module / Kitting and controllers · CX-02 | [node ID retained in scratch] | KC03 · Kit SYN-KIT-000034 for build SYN-BLD-000046 — Pick list: reserved, not booked out; controller line; completeness check (CX-02/kitting, N-S9) |

### AF-028 · Major · Shell basis is not pinned to the latest accepted toolbar version

File: PPO - Supply module. Checks: SH7. Rule/source: Supplied audit prompt SH7; named-version build handoff rule5; module Sources and Read me.

Expected: Cite the latest named Shell version or record an explicit reason for pinning the earlier one

Found: The source record/Read me cites the 8 November Shell basis or the toolbar as a proposal; no explicit reason to remain pinned after the accepted record-header named version is recorded.

Fix owner: Repository and PPO - Supply module (proposal). Action: Update this module’s recorded Shell basis after reviewing the toolbar adoption; if it must remain pinned, state the reason, limitations and follow-up batch explicitly. New accepted version: False. Evidence occurrences: 1.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Supply module / Read me | [node ID retained in scratch] | A5 Addendum A1 was not supplied as text. The shared record toolbar and its rules R1 to R10 were read from the Shell file’s page “Record header toolbar (proposal 9 November 2026)”. |

### AF-029 · Minor · Read me page index omits four page IDs

File: PPO - Supply module. Checks: ST5. Rule/source: Supplied audit prompt §4 (ST5); full A1–A3 addenda not supplied.

Expected: List every page and its node ID in Read me

Found: The scope-sheet inventory is complete, but Read me text omits page IDs for Read me 0:1, — Accepted — 11:2, — Proposals — 11:3, Shell and kit 11:19.

Fix owner: PPO - Supply module (proposal). Action: Add the missing page IDs to the Read me index and preserve the complete existing sheet inventory. New accepted version: False. Evidence occurrences: 4.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Supply module / Read me | 0:1 | Read me page index |
| PPO - Supply module / — Accepted — | 11:2 | Read me page index |
| PPO - Supply module / — Proposals — | 11:3 | Read me page index |

### AF-030 · Minor · Gendered pronouns remain in synthetic-person copy

File: PPO - Engineering module. Checks: FA7. Rule/source: Attached audit prompt §4 FA7.

Expected: Names or they/them throughout.

Found: Gendered pronouns remain in synthetic-person copy

Fix owner: PPO - Engineering module. Action: Replace each listed sentence with its supplied neutral wording and rerun the whole-file pronoun scan. New accepted version: False. Evidence occurrences: 15.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Engineering module / Materials and substitutions · EN-06 | [node ID retained in scratch] | Sent Mon 26 Oct 2026 and awaiting Robin Hale. It shows in his My Work as a handover acknowledgement. No demand exists until Supply accepts the whole payload. |
| PPO - Engineering module / Technical reviews and issues · EN-05 | [node ID retained in scratch] | Drew Collins has not acknowledged. It shows in his My Work as a handover acknowledgement, in "Issues not acknowledged" here, and on the Engineering Pulse. Riley Chen can send a reminder; only Drew can acknowledge. |
| PPO - Engineering module / Technical reviews and issues · EN-05 | [node ID retained in scratch] | Noah Patel receives the issue for information by a link through Customer messages. His acknowledgement form is the only Engineering page a customer sees. |

### AF-031 · Minor · Single-digit revision suffixes remain

File: PPO - Engineering module. Checks: CV6. Rule/source: Attached audit prompt §4 CV6.

Expected: Two-digit revision suffixes r01, r02, etc.

Found: Single-digit revision suffixes remain

Fix owner: PPO - Engineering module. Action: Apply the exact two-digit replacements, preserving revision identity and all hashes. New accepted version: False. Evidence occurrences: 20.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Engineering module / Materials and substitutions · EN-06 | [node ID retained in scratch] | r3 · 1f0a… |
| PPO - Engineering module / Materials and substitutions · EN-06 | [node ID retained in scratch] | r2 · 8c41… |
| PPO - Engineering module / Materials and substitutions · EN-06 | [node ID retained in scratch] | r1 · 44de… |

### AF-032 · Minor · Displayed dates omit the year

File: PPO - Engineering module. Checks: CV4. Rule/source: Attached audit prompt §4 CV4.

Expected: Full date, e.g. Thu 5 Nov 2026; preserve each event’s actual year.

Found: Displayed dates omit the year

Fix owner: PPO - Engineering module. Action: Expand each listed date from its source event, retaining the event time and correct site zone; do not assign 2026 blindly to a cross-year range. New accepted version: False. Evidence occurrences: 358.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Engineering module / Read me · PPO - Engineering | 79:63 | A16 Sheets drawn as at an earlier moment, each saying so: MT09 (R3, Fri 23 Oct 2026; the prompt names R4), MT13 (Thu 29 Oct), CR14 (Fri 16 Oct), CR15b (Tue 3 Nov, 11:00), CM13 and CM16a (SYN-CMS-000011, Fri 30 Oct). |
| PPO - Engineering module / Materials and substitutions · EN-06 | [node ID retained in scratch] | Reviewed Wed 21 Oct · Casey Quinn |
| PPO - Engineering module / Materials and substitutions · EN-06 | [node ID retained in scratch] | Issued Fri 23 Oct · Alex Morgan |

### AF-033 · Major · SYN-OPP-000301 remains in Engineering’s recorded Hillview/Mallee conflict

File: PPO - Engineering module. Checks: FA1. Rule/source: Engineering record A14 line 401; prompt FA1/FA3.

Expected: One opportunity identity across Engineering and Sales; replacement requires full A3/Dean resolution.

Found: SYN-OPP-000301 remains in Engineering’s recorded Hillview/Mallee conflict

Fix owner: Dean; PPO - Engineering module. Action: Resolve the opportunity mapping with the accepted Sales story and amended A3, then update every listed Engineering occurrence. New accepted version: False. Evidence occurrences: 21.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Engineering module / Read me · PPO - Engineering | 79:61 | A14 SYN-OPP-000301 kept as the prompt's Hillview Glasshouse 5 basis; the Sales file uses it for Mallee Fresh Produce. Clash to resolve. |
| PPO - Engineering module / Read me · PPO - Engineering | 79:74 | D-002, D-008, D-012, D-019 technical authority and sources · PPO-011 SOLIDWORKS versions, PDM and dependencies · EN-02 Q1 to Q6 · EN-03 D11 output hash · EN-05 review policy question · EN-06 E6 policy · EN-07 D8 · EN-08 X7 and X8 · AT-15 and AT-37 not claimed · SYN-OPP-000301 clash (A14) · C1 contrast · date style without the year (audit R1). |
| PPO - Engineering module / Engineering workload and Pulse · EN-01 | [node ID retained in scratch] | SYN-OPP-000301 |

### AF-034 · Minor · Control-state fills are literal colours

File: PPO - Engineering module. Checks: CT2. Rule/source: Attached audit prompt §4 CT2.

Expected: Bind visible control fills to PPO colour variables while retaining opacity.

Found: Control-state fills are literal colours

Fix owner: PPO - Engineering module. Action: Bind these state-layer colours to the matching PPO colour variable and preserve the existing hover/pressed opacity. New accepted version: False. Evidence occurrences: 12.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Engineering module / 7:14 | [node ID retained in scratch] | fills |
| PPO - Engineering module / 7:14 | [node ID retained in scratch] | fills |
| PPO - Engineering module / 7:14 | [node ID retained in scratch] | fills |

### AF-035 · Minor · Sheet labels omit the signed-in person

File: PPO - Engineering module. Checks: ST3. Rule/source: Attached prompt ST3 and FA4 (label clause only); source record default persona is insufficient to name the actor on each label..

Expected: Each label names the signed-in actor, in addition to the scope or route.

Found: 184 labels have scope/source references but no named actor.

Fix owner: PPO - Engineering module. Action: Append the actor confirmed by each sheet’s header, using the source-record default only where the sheet has no explicit exception. Preserve page, state and scope wording; do not infer missing role permissions. New accepted version: False. Evidence occurrences: 184.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Engineering module / Materials and substitutions · EN-06 | 40:9 | MT01 · Materials & substitutions — materials register, grouped by project (EN-06) [EN-06 proposal register; built in code] |
| PPO - Engineering module / Materials and substitutions · EN-06 | [node ID retained in scratch] | MT02 · Materials — Block C SYN-MAT-000031 R3, Lines with content revision and hash (EN-06 · S-13) [EN-06 proposal Lines] |
| PPO - Engineering module / Materials and substitutions · EN-06 | [node ID retained in scratch] | MT03 · Materials — Block C R4 draft, Item & unit mapping: verified, proposed and missing rows; MYOB mapping read only (EN-06 · S-13) [EN-06 proposal Item & unit mapping] |

### AF-036 · Minor · Gendered pronouns remain in synthetic-person copy

File: PPO - Service module. Checks: FA7. Rule/source: Attached audit prompt §4 FA7.

Expected: Names or they/them throughout, including notes and sheet indexes.

Found: Gendered pronouns remain in synthetic-person copy

Fix owner: PPO - Service module. Action: Apply the supplied neutral wording, then rescan all text nodes including Read me indexes. New accepted version: False. Evidence occurrences: 12.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Service module / Read me | [node ID retained in scratch] | FT01 · Field team — Technicians: one row per person, competence for seven days (PL-02) [PL-02 field team]  ·  1440 × 900  ·  [node ID retained in scratch]<br>FT02 · Field team — Casey Ward selected, snapshot: today’s visits, van 1, competence summary, handover notes (PL-02) [PL-02 snapshot]  ·  1440 × 900  ·  [node ID retained in scratch]<br>FT03 · Technician Casey Ward — evidence bar, details, seven-day availability 07:00 to 18:00, competence, visits (full length) (PL-02) [PL-02 technici…  ·  1440 × 1027  ·  [node ID retained in scratch]<br>FT06 · Field team — Needs preparation: visits without an issued pack within the window (PL-02, SV-05) [PL-02 needs preparation]  ·  1440 × 900  ·  [node ID retained in scratch]<br>FT04 · Review competence evidence — Pat Rowe first aid Expired: read-only evidence; Verified, Unverified, Expired; who verified (PL-02) [PL-02 eviden…  ·  1440 × 900  ·  [node ID retained in scratch]<br>FT05 · Technician record on the phone, view only — Casey Ward sees her appointments without booking rights (PL-02) [PL-02 phone state]  ·  390 × 844  ·  [node ID retained in scratch]<br>FT01t · Field team — tablet, Technicians (PL-02) [PL-02 tablet]  ·  1024 × 768  ·  [node ID retained in scratch] |
| PPO - Service module / Read me | [node ID retained in scratch] | TL01 · Time & labour review — register, To review, strip collapsed: planned, recorded, reviewed and billable as four columns (FI-01 time review) [tim…  ·  1440 × 900  ·  [node ID retained in scratch]<br>TL02 · SYN-APT-000079 Casey Ward, Tue 3 Nov, Goulburn — day timeline: four rows, segments by kind with words, evidence markers (full length) (FI-01 t…  ·  1440 × 966  ·  [node ID retained in scratch]<br>TL04 · SYN-APT-000079 — Query tab: Riley’s question at 09:06 and Casey’s reply at 09:34, quoted as written (FI-01 time review) [time review [node ID retained in scratch]]  ·  1440 × 900  ·  [node ID retained in scratch]<br>TL06 · SYN-APT-000079 — Billable marking with reasons: Work billable, Travel non-billable by default, Waiting billable (customer-caused); no amount (…  ·  1440 × 900  ·  [node ID retained in scratch]<br>TL08 · SYN-APT-000079 — Reviewed and sent; History: the original beside the reviewed version, every change with actor, time and reason (FI-01 time re…  ·  1440 × 900  ·  [node ID retained in scratch]<br>TL10 · Time & labour review — Exceptions: outside hours, long wait, time against a cancelled visit, query with no reply; each with its own side form …  ·  1440 × 900  ·  [node ID retained in scratch]<br>TL11 · Multi-visit allowance by crew and day — Block C, two days (rolled forward): work left is a best guess; the request to the planner; allowance N…  ·  1440 × 900  ·  [node ID retained in scratch]<br>TL03 · Query the technician — about the 50 min wait, Riley Tran, 09:06 (FI-01 time review) [time review [node ID retained in scratch]]  ·  1440 × 900  ·  [node ID retained in scratch]<br>TL05 · Adjust a segment — Waiting 0 h 50 → 0 h 35 with a reason; the original kept; the technician sees both (FI-01 time review) [time review 1405:27…  ·  1440 × 900  ·  [node ID retained in scratch]<br>TL07a · Accept reviewed time — a short centred dialog, 09:50 (FI-01 time review) [time review [node ID retained in scratch]]  ·  1440 × 900  ·  [node ID retained in scratch]<br>TL07b · Send with the Finance handoff — attaches reviewed hours to SYN-FH-000044; it reaches Finance when Service review approves the report, 09:52 (…  ·  1440 × 900  ·  [node ID retained in scratch]<br>TL12 · Kim Taylor’s timer left running overnight — coordinator view, 07:40: flagged at 12 h; only Kim sets the finish, within 48 h, with a reason; no…  ·  1440 × 900  ·  [node ID retained in scratch]<br>TL02t · SYN-APT-000079 — tablet day timeline, four rows and segments (full length) (FI-01 time review) [time review tablet]  ·  1024 × 768  ·  [node ID retained in scratch]<br>TL09 · My time — Casey Ward: recorded and in review, no billable; a question waiting; her reply waiting to send, 09:31 (FI-01 time review) [time revi…  ·  390 × 844  ·  [node ID retained in scratch] |
| PPO - Service module / Time and labour review · FI-01 | [node ID retained in scratch] | Kim Taylor’s timer has run since Wed 4 Nov 16:05 (15 h 35). It was flagged at 12 h, Thu 04:05. Only Kim can set when she finished, within 48 h and with a reason. PPO never ends a timer by itself. |

### AF-037 · Minor · Single-digit revision suffixes remain

File: PPO - Service module. Checks: CV6. Rule/source: Attached audit prompt §4 CV6.

Expected: Two-digit revision suffixes r01, r02, etc.

Found: Single-digit revision suffixes remain

Fix owner: PPO - Service module. Action: Apply exact replacements consistently; if an output filename is renamed, update its actual output reference and hash through the owning workflow rather than silently altering evidence. New accepted version: False. Evidence occurrences: 95.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Service module / Read me | [node ID retained in scratch] | MP01 · Due maintenance — All open, grouped by target week: Overdue, This week, Next week, Week of 16 Nov, Later (MA-04) [MA-04 due maintenance]  ·  1440 × 900  ·  [node ID retained in scratch]<br>MP02 · SYN-MOC-000121 Coastal Herbs pump service — Scheduled, Obligation tab: the maintenance checks bar; fixed facts original due, plan revision, eq…  ·  1440 × 900  ·  [node ID retained in scratch]<br>MP03a · SYN-MOC-000118 Mallee Fresh — Work tab: the work order and booking read only (MA-04) [MA-04 occurrence work]  ·  1440 × 900  ·  [node ID retained in scratch]<br>MP03b · SYN-MOC-000118 — Evidence tab: tasks completed only from the exact reviewed report revision; one task Partial → Prepare follow-on Service req…  ·  1440 × 900  ·  [node ID retained in scratch]<br>MP06 · SYN-MOC-000119 Westgate — Deferred, Exceptions tab: customer not ready; target Thu 12 Nov; lateness against the original due visible (MA-04) […  ·  1440 × 900  ·  [node ID retained in scratch]<br>MP07 · Maintenance plans — All plans: To review 1 (Hillcrest), Reviewed, Held 1 (Lakeside, pending renewal) (MA-03) [MA-03 plans]  ·  1440 × 900  ·  [node ID retained in scratch]<br>MP08 · Plan SYN-MPL-000031 r2 Mallee Fresh quarterly — Task revisions: tasks per revision, interval with anchor and Australia/Adelaide, covered equip…  ·  1440 × 900  ·  [node ID retained in scratch]<br>MP04 · Prepare work request — SYN-MOC-000122 Hillview: one owned service request; the work order created with the plan’s tasks (M-R2); the Covered en…  ·  1440 × 900  ·  [node ID retained in scratch]<br>MP05b · Defer or skip — owner (resolves no owner), action, a later target within the agreement, reason, source evidence; the original due kept (MA-04…  ·  1440 × 900  ·  [node ID retained in scratch]<br>MP09 · Generate due work — preview: every date in the window, “Already exists · kept”; creates due work only; window 3 months (built limit 1 to 12) (…  ·  1440 × 900  ·  [node ID retained in scratch]<br>MP10 · Propose successor r3 — effective date, owner, and a reviewer other than the proposer (MA-03) [MA-03 successor]  ·  1440 × 900  ·  [node ID retained in scratch]<br>MP05a · SYN-MOC-000120 — Overdue with no owner: the owner is required before any action; the plan is Held pending renewal (MA-04) [MA-04 states]  ·  1440 × 900  ·  [node ID retained in scratch]<br>MP11a · Plan changed after generation — the occurrence keeps the revision it was generated from (MA-03) [MA-03 states]  ·  1440 × 900  ·  [node ID retained in scratch]<br>MP11b · Generate again — every date already exists; nothing is created (MA-03) [MA-03 states]  ·  1440 × 900  ·  [node ID retained in scratch]<br>MP11c · Evidence partly received — SYN-MOC-000118: 3 tasks reported done, 1 Partial; the report is still in review (MA-04) [MA-04 states]  ·  1440 × 900  ·  [node ID retained in scratch]<br>MP01t · Due maintenance — tablet worklist, All open by target week (MA-04) [MA-04 tablet]  ·  1024 × 768  ·  [node ID retained in scratch]<br>MP12a · Due maintenance on the coordinator’s phone — All open, by target week, 09:10 (MA-04, W8) [MA-04 phone]  ·  390 × 844  ·  [node ID retained in scratch]<br>MP12b · Occurrence on the coordinator’s phone — SYN-MOC-000122 Due, Obligation: fixed facts and Prepare work request (MA-04, W8) [MA-04 phone record]  ·  390 × 844  ·  [node ID retained in scratch] |
| PPO - Service module / Incidents and actions · FI-06 | [node ID retained in scratch] | Prepared internal outcome r1 ready. |
| PPO - Service module / Incidents and actions · FI-06 | [node ID retained in scratch] | Prepared internal outcome r1 · PDF 3 pages · sha256 c07b…4d2e |

### AF-038 · Minor · Displayed dates omit the year

File: PPO - Service module. Checks: CV4. Rule/source: Attached audit prompt §4 CV4.

Expected: Full date, e.g. Thu 5 Nov 2026; retain each event’s actual year.

Found: Displayed dates omit the year

Fix owner: PPO - Service module. Action: Expand each listed date using the source event year and zone. Do not assign 2026 blindly across year boundaries. New accepted version: False. Evidence occurrences: 791.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Service module / Incidents and actions · FI-06 | [node ID retained in scratch] | Tue 3 Nov, 14:20 |
| PPO - Service module / Incidents and actions · FI-06 | [node ID retained in scratch] | Tue 3 Nov |
| PPO - Service module / Incidents and actions · FI-06 | [node ID retained in scratch] | Tue 20 Oct, 15:40 |

### AF-039 · Major · 09:00 Service Pulse shows the 09:06 query as already sent

File: PPO - Service module. Checks: FA5. Rule/source: Prompt FA5; IS02 label [node ID retained in scratch] and TL03 timestamp [node ID retained in scratch].

Expected: At 09:00, Casey’s long wait is still awaiting Riley’s 09:06 query.

Found: 09:00 Service Pulse shows the 09:06 query as already sent

Fix owner: PPO - Service module. Action: Change the 09:00 Pulse item to its pre-query state, or relabel the entire sheet as a later frame and reconcile every item at that later time. New accepted version: False. Evidence occurrences: 3.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Service module / Insights · RP-04 | [node ID retained in scratch] | Casey’s long wait queried; Kim’s outside hours and left-running timer |
| PPO - Service module / Insights · RP-04 | [node ID retained in scratch] | IS02 · Service Pulse — day start (proposed): Focus for today ranked by rule, Ravi Kumar, 09:00 (full length) (RP-04, N-N1) [proposed] |
| PPO - Service module / Time and labour review · FI-01 | [node ID retained in scratch] | Riley Tran · Thu 5 Nov 2026, 09:06 |

### AF-040 · Minor · Sheet labels omit the signed-in person

File: PPO - Service module. Checks: ST3. Rule/source: Attached prompt ST3 and FA4 (label clause only); source record default persona is insufficient to name the actor on each label..

Expected: Each label names the signed-in actor, in addition to the scope or route.

Found: 234 labels have scope/source references but no named actor.

Fix owner: PPO - Service module. Action: Append the actor confirmed by each sheet’s header, using the source-record default only where the sheet has no explicit exception. Preserve page, state and scope wording; do not infer missing role permissions. New accepted version: False. Evidence occurrences: 234.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Service module / Incidents and actions · FI-06 | [node ID retained in scratch] | IC01 · Incidents and actions — register, All, grouped by state (FI-06) [FI-06 1348:3008] |
| PPO - Service module / Incidents and actions · FI-06 | [node ID retained in scratch] | IC02 · SYN-INC-000010 — submitted, scope held, Factual report; the hold card first (FI-06) [FI-06 1348:3253] |
| PPO - Service module / Incidents and actions · FI-06 | 56:2364 | IC04 · SYN-INC-000009 — Actions and evidence, accepting evidence: a separate person accepts or returns (FI-06) [FI-06 1348:3516] |

### AF-041 · Minor · Gendered pronouns remain in synthetic-person copy

File: PPO - Finance module. Checks: FA7. Rule/source: Attached audit prompt §4 FA7.

Expected: Names or they/them throughout.

Found: Gendered pronouns remain in synthetic-person copy

Fix owner: PPO - Finance module. Action: Replace each listed sentence with its supplied neutral wording and rerun the whole-file pronoun scan. New accepted version: False. Evidence occurrences: 16.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Finance module / Read me | [node ID retained in scratch] | A named version is Dean’s to save once he accepts. Any later design change needs a new named version; the build reads the named version, not the live file. |
| PPO - Finance module / Cash outlook · FN-05 | [node ID retained in scratch] | Project manager: S13 Kai Morgan sees his projects only → S6 the Hillcrest claim 2 date goes stale at 14 days → PH-CO08 Kai confirms on the phone (Waiting to send offline) → the nudge clears. |
| PPO - Finance module / Project financial performance · FN-03 | [node ID retained in scratch] | Accept holds the submitted forecast A$176,900.00 excl. GST (margin 16.8 %) until the next review. Return, in Actions, sends it back to Jamie Rossi with a note; September’s reviewed forecast A$173,900.00 excl. GST keeps showing until he resubmits. |

### AF-042 · Minor · Displayed dates omit the year

File: PPO - Finance module. Checks: CV4. Rule/source: Attached audit prompt §4 CV4.

Expected: Full date, e.g. Thu 5 Nov 2026; preserve each event’s actual year.

Found: Displayed dates omit the year

Fix owner: PPO - Finance module. Action: Expand each listed date from its source event, retaining the event time and correct site zone; do not assign 2026 blindly to a cross-year range. New accepted version: False. Evidence occurrences: 725.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Finance module / Read me | [node ID retained in scratch] | Story time Thu 5 Nov 2026, 09:00 AEDT (Melbourne), signed in as Finance lead Avery Lin; MYOB read Thu 5 Nov 06:00 · Complete for company Powerplants AU. The handoff walk-through keeps its own clock (09:52 to 10:40). |
| PPO - Finance module / Read me | 86:68 | C7 BRC-07 first posting aligned to Tue 3 Nov (PP07) · C8 CA17 memo moved out of the amount column · C9 78 grid cells set to their column width so headers align · C10 cut notes-card text fixed · C11 a text node wrongly recoloured by a sweep restored · C12 CO07 gap owners aligned with CO11 and the capability matrix |
| PPO - Finance module / Insights · RP-05 | [node ID retained in scratch] | From MYOB · read Thu 5 Nov 06:00 · |

### AF-043 · Major · Finance disputes still use the superseded SYN-DSP family

File: PPO - Finance module. Checks: FA3. Rule/source: Attached audit prompt §4 FA3.

Expected: SYN-DPT- for Finance disputes, retaining each numeric identity.

Found: Finance disputes still use the superseded SYN-DSP family

Fix owner: PPO - Finance module. Action: Replace dispute references consistently across accounts, cash outlook, notes and index, then compare with full A3 before the next build. New accepted version: False. Evidence occurrences: 39.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Finance module / Read me | [node ID retained in scratch] | A5 Readable references (SYN-FH-, SYN-EXC-, SYN-DIF-, SYN-DSP-, SYN-PAP-, SYN-CLM-, SYN-SCN-, SYN-INV-, SYN-CRN-, SYN-PMT-, SYN-BIL-, SYN-C-, SYN-SCL-); the new families are proposed additions to PPO-STD-001. |
| PPO - Finance module / Read me | [node ID retained in scratch] | Customer account Goulburn Orchards — Disputes tab, SYN-DSP-000003 owned |
| PPO - Finance module / Insights · RP-05 | [node ID retained in scratch] | No expected date: SYN-INV-000356 Northbank · SYN-DSP-000003 Goulburn · SYN-PO-000228 DP-25 |

### AF-044 · Minor · Control-state fills are literal colours

File: PPO - Finance module. Checks: CT2. Rule/source: Attached audit prompt §4 CT2.

Expected: Bind visible control fills to PPO colour variables while retaining opacity.

Found: Control-state fills are literal colours

Fix owner: PPO - Finance module. Action: Bind these state-layer colours to the matching PPO colour variable and preserve the existing hover/pressed opacity. New accepted version: False. Evidence occurrences: 5.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Finance module / 9:79 | [node ID retained in scratch] | fills |
| PPO - Finance module / 9:79 | [node ID retained in scratch] | fills |
| PPO - Finance module / 9:79 | [node ID retained in scratch] | fills |

### AF-045 · Minor · Sheet labels omit the signed-in person

File: PPO - Finance module. Checks: ST3. Rule/source: Attached prompt ST3 and FA4 (label clause only); source record default persona is insufficient to name the actor on each label..

Expected: Each label names the signed-in actor, in addition to the scope or route.

Found: 183 labels have scope/source references but no named actor.

Fix owner: PPO - Finance module. Action: Append the actor confirmed by each sheet’s header, using the source-record default only where the sheet has no explicit exception. Preserve page, state and scope wording; do not infer missing role permissions. New accepted version: False. Evidence occurrences: 183.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Finance module / Insights · RP-05 | [node ID retained in scratch] | IS01 · Supply & Finance trust — Finance view, October 2026 (RP-05) [/reports/reconciliation] |
| PPO - Finance module / Insights · RP-05 | [node ID retained in scratch] | IS02 · Finance Pulse — day start, Focus for today (proposed · N-N1) [/finance] |
| PPO - Finance module / Insights · RP-05 | [node ID retained in scratch] | IS03 · KPI-12 drill-through — four failed or unresolved items (RP-05 · FN-01 · FN-06) [/reports/reconciliation?measure=KPI-12] |

### AF-046 · Minor · Order revision in recovery header is single-digit

File: PPO - Settings module. Checks: CV6. Rule/source: Prompt CV6/Addendum A2 excerpt.

Expected: SYN-SYNC-000435 · SYN-PO-000236 r02

Found: Header says SYN-SYNC-000435 · SYN-PO-000236 r2; the separate immutable key PO-000236-r2 is not treated as a display revision

Fix owner: PPO - Settings module (proposal). Action: Change only the displayed order revision to r02; preserve the integration idempotency key. New accepted version: False. Evidence occurrences: 1.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Settings module / Integrations and recovery · AD-04 | [instance ID retained in scratch] | SYN-SYNC-000435 · SYN-PO-000236 r2 |

### AF-047 · Minor · Literal solid paints remain outside Shell copies

File: PPO - Settings module. Checks: CT2. Rule/source: Prompt CT2; pending records prescribe scrim colour/opacity but do not exempt binding; My Work A30 records approximate states.

Expected: Bind solid fill/stroke colour to PPO colour while preserving paint opacity

Found: 19 nodes have unbound paints; all are 32% navy scrims

Fix owner: PPO - Settings module (proposal). Action: Bind the non-Shell paints to their matching PPO colour variables without changing opacity; preserve any separately approved visual approximation. New accepted version: False. Evidence occurrences: 19.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Settings module / Settings hub and Business policies · AD-02 | [node ID retained in scratch] | Scrim · navy 32 % |
| PPO - Settings module / Settings hub and Business policies · AD-02 | [node ID retained in scratch] | Scrim · navy 32 % |
| PPO - Settings module / Operational health · AD-09 | [node ID retained in scratch] | Scrim · navy 32 % |

### AF-048 · Minor · Baseline revisions still use one digit

File: PPO - Reporting module. Checks: CV6. Rule/source: Supplied audit prompt §4; docs/decisions/reporting-module-refined-ui-proposal.md.

Expected: r01, r02 and other two-digit revision labels, keeping the same revision meaning.

Found: 107 current text nodes contain one-digit revision labels.

Fix owner: PPO - Reporting module. Action: Replace each r1/r2 token with r01/r02 in the listed nodes; rescan every text node and preserve v1 definition-version labels. New accepted version: False. Evidence occurrences: 107.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Reporting module / Report definitions · RP-06 | [node ID retained in scratch] | A changed baseline is kept beside the current one (Glasshouse 4 r1 beside r2). |
| PPO - Reporting module / Delivery performance · RP-03 | [node ID retained in scratch] | +5 working days · forecast Fri 20 Nov against Fri 13 Nov (baseline r2) |
| PPO - Reporting module / Delivery performance · RP-03 | [node ID retained in scratch] | +4 working days · forecast Wed 25 Nov against Thu 19 Nov (baseline r1) |

### AF-049 · Major · 09:00 Service performance reports a 09:40 publication as completed

File: PPO - Reporting module. Checks: FA5. Rule/source: Supplied audit prompt §4; docs/decisions/reporting-module-refined-ui-proposal.md.

Expected: At Thu 5 Nov 2026, 09:00 AEDT, the 09:40 policy publication is future; a later state must be labelled with its later as-at time.

Found: 5 current nodes say policy v2 was published at 09:40 on sheets using the 09:00 story.

Fix owner: PPO - Reporting module. Action: Describe the 09:40 publication as forthcoming in 09:00 sheets or move the whole sheet to an explicitly later as-at state; compare Service and Settings policy evidence. New accepted version: False. Evidence occurrences: 6.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Reporting module / Service performance · RP-04 | [node ID retained in scratch] | What changed since September, in facts: eligible visits 46 (September 36) · confirmed bookings 52 (44) · reports issued 38 (29) · KPI-06 v1 submitted Fri 30 Oct, awaiting adoption · scheduling policy v2 published Thu 5 Nov 09:40 applies from November; October stays under v1. Nothing here is better or worse. |
| PPO - Reporting module / Service performance · RP-04 | [node ID retained in scratch] | Owner Jordan Kim · KPI-03 v1 and KPI-04 v1 Adopted, effective Thu 1 Oct · monthly · October is computed under scheduling policy v1; v2 (published Thu 5 Nov 09:40) applies from November |
| PPO - Reporting module / Service performance · RP-04 | [node ID retained in scratch] | Owner Jordan Kim · KPI-03 v1 and KPI-04 v1 Adopted, effective Thu 1 Oct · monthly · October is computed under scheduling policy v1; v2 (published Thu 5 Nov 09:40) applies from November |

### AF-050 · Major · Docked Reporting menus are frames rather than component instances

File: PPO - Reporting module. Checks: SH1. Rule/source: Supplied audit prompt §4; docs/decisions/reporting-module-refined-ui-proposal.md.

Expected: Each repeated docked menu should be an instance of a local shared component, retaining recorded proposed menu variants.

Found: 91 docked menu roots are FRAME nodes; representative39:219 has frame children for header, groups and footer. The kit has local component21:93.

Fix owner: PPO - Reporting module. Action: Make reusable local docked-menu components for the accepted and explicitly proposed variants, then replace these frame copies with instances; verify type and main-component identity. New accepted version: False. Evidence occurrences: 91.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Reporting module / Service performance · RP-04 | [node ID retained in scratch] | Workspace menu · docked · Reporting · Service performance |
| PPO - Reporting module / Service performance · RP-04 | [node ID retained in scratch] | Workspace menu · docked · Reporting · Service performance |
| PPO - Reporting module / Service performance · RP-04 | [node ID retained in scratch] | Workspace menu · docked · Reporting · Service performance |

### AF-051 · Minor · Current displayed revisions remain single-digit

File: PPO - My Work module. Checks: CV6. Rule/source: Prompt CV6/Addendum A2 excerpt.

Expected: r01, r02 and the corresponding two-digit display revisions

Found: 69 current text nodes contain single-digit proposal, project-baseline or equipment-configuration revisions

Fix owner: PPO - My Work module (proposal). Action: Normalise display revisions to two digits without changing the underlying revision identity. New accepted version: False. Evidence occurrences: 69.

| File / page | Node | Evidence |
|---|---|---|
| PPO - My Work module / My actions · SH-02 | [node ID retained in scratch] | Sent the revised stage 2 lighting proposal (r2) to Sunline Hydroponics; Kate Morgan copied. They will reply after their board meets on Tue 10 Nov. |
| PPO - My Work module / My actions · SH-02 | [node ID retained in scratch] | Sent the revised stage 2 lighting proposal (r2) to Sunline Hydroponics; Kate Morgan copied. |
| PPO - My Work module / My actions · SH-02 | [node ID retained in scratch] | Sent the revised stage 2 lighting proposal (r2) to Sunline; Kate Morgan copied. |

### AF-052 · Minor · Gendered pronouns describe synthetic people

File: PPO - My Work module. Checks: FA7. Rule/source: Prompt FA7 and standing instruction4.

Expected: their call; their contact card

Found: Two current nodes use her for Kate Morgan and the Hillview contact

Fix owner: PPO - My Work module (proposal). Action: Use their in both current sentences. New accepted version: False. Evidence occurrences: 2.

| File / page | Node | Evidence |
|---|---|---|
| PPO - My Work module / My actions · SH-02 | [node ID retained in scratch] | Since you last opened this (Wed 28 Oct): Kate Morgan logged a call with Sunline Hydroponics (Mon 2 Nov) and set the deal's next action to her call on Fri 6 Nov. Nothing on this activity changed. |
| PPO - My Work module / Calls to log · SH-02 | [node ID retained in scratch] | Hillview Growers · started from her contact card |

### AF-053 · Major · Ravi Today queue omits the specified report-questions task

File: PPO - My Work module. Checks: FA6. Rule/source: Prompt known item8/A3.8 and A3.11 excerpt; current OV07; Service counterpart independently read by source agent.

Expected: Contact Owen Dunne about the report questions at 09:00

Found: OV07 instead shows a report-response Today row for SYN-RPT-000040: Agree a due date with Sam Whitlock; its explanation says the response was not Accepted. No Owen/report-questions task occurs anywhere in My Work. Service identifies the same report as awaiting Owen Dunne.

Fix owner: PPO - My Work module (proposal). Action: Restore the specified Owen Dunne report-questions task and reconcile the current report-response row against A3.8/A3.11; retain unrelated Sam Whitlock Sales tasks. New accepted version: False. Evidence occurrences: 6.

| File / page | Node | Evidence |
|---|---|---|
| PPO - My Work module / My Work overview · SH-01 · SH-02 | [node ID retained in scratch] | After the customer response was not Accepted |
| PPO - My Work module / My Work overview · SH-01 · SH-02 | [node ID retained in scratch] | Agree a due date with Sam Whitlock  ·  SYN-RPT-000040 Goulburn Orchards report response |
| PPO - My Work module / My Work overview · SH-01 · SH-02 | [node ID retained in scratch] | Thu 5 Nov 2026 · as at 09:00 AEDT |

### AF-054 · Polish · RH04 label remains above the preceding long sheet

File: PPO - My Work module. Checks: ST3, ST4. Rule/source: Prompt ST3/ST4; live label and sheet bounds.

Expected: Label63:1296 at y2822, 26 px above RH04 frame63:1295 at y2848

Found: Label y2194 lies inside RH03 bounds y1160–2688; it is 654 px above RH04

Fix owner: PPO - My Work module (proposal). Action: Move the RH04 label to y2822, preserving its x60, width1440 and ending truncation. New accepted version: False. Evidence occurrences: 3.

| File / page | Node | Evidence |
|---|---|---|
| PPO - My Work module / Reviews and handovers · SH-06 | [node ID retained in scratch] | RH04 label |
| PPO - My Work module / Reviews and handovers · SH-06 | [node ID retained in scratch] | RH04 sheet |
| PPO - My Work module / Reviews and handovers · SH-06 | [node ID retained in scratch] | RH03 sheet |

### AF-055 · Minor · Literal solid paints remain outside Shell copies

File: PPO - My Work module. Checks: CT2. Rule/source: Prompt CT2; pending records prescribe scrim colour/opacity but do not exempt binding; My Work A30 records approximate states.

Expected: Bind solid fill/stroke colour to PPO colour while preserving paint opacity

Found: 125 nodes have unbound paints; includes scrims, contrast swatches, badge and annotation specimens and hover/pressed overlays

Fix owner: PPO - My Work module (proposal). Action: Bind the non-Shell paints to their matching PPO colour variables without changing opacity; preserve any separately approved visual approximation. New accepted version: False. Evidence occurrences: 125.

| File / page | Node | Evidence |
|---|---|---|
| PPO - My Work module / Interaction states · SH | [node ID retained in scratch] | Button · Save call |
| PPO - My Work module / Interaction states · SH | [node ID retained in scratch] | Swatch |
| PPO - My Work module / Interaction states · SH | [node ID retained in scratch] | Aa |

### AF-056 · Minor · UI scrims and state paints remain literal

File: PPO - Customers, Sites & Equipment module. Checks: CT2. Rule/source: Supplied audit prompt §4 CT2; complete A1–A3 originals unavailable.

Expected: Bind visible UI fills/strokes to the appropriate PPO colour variable

Found: 11 literal UI fill occurrences, zero literal strokes, after excluding Shell ancestors and SECTION canvas decoration. All 11 are scrims.

Fix owner: PPO - Customers, sites and equipment (proposal). Action: Bind these fills to the matching existing PPO colour variables while preserving opacity and state layering; if an extra variable is needed, route that choice to the Library owner. New accepted version: False. Evidence occurrences: 11.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Customers, Sites & Equipment module / {'id': '3:72', 'name': 'People · CS-02'} | [node ID retained in scratch] | fills |
| PPO - Customers, Sites & Equipment module / {'id': '3:72', 'name': 'People · CS-02'} | [node ID retained in scratch] | fills |
| PPO - Customers, Sites & Equipment module / {'id': '3:72', 'name': 'People · CS-02'} | [node ID retained in scratch] | fills |

### AF-057 · Minor · Displayed revisions retain one-digit forms

File: PPO - Customers, Sites & Equipment module. Checks: CV6. Rule/source: Supplied audit prompt CV6; full A2 unavailable; existing module fixture/source conventions preserved as an authority question.

Expected: Display r01, r02 and other two-digit revision labels under the supplied audit convention

Found: 115 visible current-display text nodes contain r1–r9; complete candidate occurrences, including source questions and machine payload text, remain in candidates.json. Includes SYN-QUO-000151 r2 at [node ID retained in scratch].

Fix owner: PPO - Customers, sites and equipment (proposal). Action: Confirm the original A2 convention and any exact-source exception, then normalise displayed revisions consistently. Preserve issued file names, machine payloads, hashes and immutable historical identifiers unless their owner explicitly changes them. New accepted version: False. Evidence occurrences: 115.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Customers, Sites & Equipment module / Organisations · CS-01 | [node ID retained in scratch] | SYN-QUO-000151 r2 |
| PPO - Customers, Sites & Equipment module / Organisations · CS-01 | [node ID retained in scratch] | SYN-QUO-000151 r2 |
| PPO - Customers, Sites & Equipment module / Account development · CS-07 | [instance ID retained in scratch] | Submitted · r2 |

### AF-058 · Minor · Movement card retains the explicitly forbidden transfer heading

File: PPO - Customers, Sites & Equipment module. Checks: CV7. Rule/source: Shared records Read me [node ID retained in scratch] R2 and EQ-04 transfer prohibition; supplied prompt CV7.

Expected: A heading that describes the replacement links/history without implying warranty, entitlement or defect transfer

Found: MV04 text [node ID retained in scratch] reads What transferred. Read me [node ID retained in scratch] R2 already identifies the retitle as pending.

Fix owner: PPO - Customers, sites and equipment (proposal). Action: Retitle the card to Replacement links and history after confirming that the heading describes its contents; preserve explicit rules saying that warranty and defects never transfer. New accepted version: False. Evidence occurrences: 2.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Customers, Sites & Equipment module / Movement, replacement and retirement · EQ-04 | [node ID retained in scratch] | What transferred |
| PPO - Customers, Sites & Equipment module / Read me | [node ID retained in scratch] | R2 Movement MV04: retitle the "What transferred" card so the word appears only in the rule. R3 Give every register footer the same range wording ("1 to 16 of 96"). R4 Shorten long record sub-lines (BL02, BK02) to kind · reference · state. R5 Re-read the EQ-01 and EQ-09 notes cards when the reference file can be read, and reconcile. |

### AF-059 · Minor · Sheet labels omit the signed-in person required by this audit

File: PPO - Customers, Sites & Equipment module. Checks: ST3, FA4. Rule/source: Supplied prompt ST3/FA4 versus Shared records Read me [node ID retained in scratch].

Expected: Each sheet label explicitly identifies the drawn signed-in person

Found: All 184 drawn sheet labels follow the [source] pattern and omit signed in as. Read me [node ID retained in scratch] explicitly specifies that source pattern; this is a template authority conflict.

Fix owner: PPO - Customers, sites and equipment (proposal). Action: Settle the shared label-template conflict once; retain the source citation and add the drawn signed-in person to every affected UI label. Identify specification boards explicitly rather than inventing a persona. New accepted version: False. Evidence occurrences: 184.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Customers, Sites & Equipment module / Organisations · CS-01 | 38:9 | OR01 · Hillview Growers — Sales tab: one table with type chips and a Status filter; quotations by current revision only; sales orders Not connected; revisions never totalled (CS-01) [CS-01 D3, D5, D6, Q1] · full length |
| PPO - Customers, Sites & Equipment module / Organisations · CS-01 | [node ID retained in scratch] | OR02 · Hillview Growers — Service tab: requests, work orders, agreements and warranty as the Service read gives them; open service as a count with its read (CS-01) [CS-01 D3, D4] |
| PPO - Customers, Sites & Equipment module / Organisations · CS-01 | [node ID retained in scratch] | OR03 · Hillview Growers — Projects tab: SYN-PRJ-000024 in Delivery and closed SYN-PRJ-000014, with witnesses and recipients named; opens in Projects (CS-01) [CS-01 D3] |

### AF-060 · Minor · Completed Read me index omits page node IDs

File: PPO - Customers, Sites & Equipment module. Checks: ST5. Rule/source: Supplied audit prompt §4 ST5; complete A1–A3 originals unavailable.

Expected: List each page with its node ID as well as the existing sheet IDs

Found: All 184 sheet IDs resolve, and the proposed PR #916 inventory matches them. None of the 20 page IDs appears in Read me; its page-order card names the pages without IDs. This is not a missing-sheet finding.

Fix owner: PPO - Customers, sites and equipment (proposal). Action: Add the 20 page IDs to the completed Read me index and keep its 184-sheet inventory unchanged. New accepted version: False. Evidence occurrences: 20.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Customers, Sites & Equipment module / Read me | 0:1 | Read me page node index |
| PPO - Customers, Sites & Equipment module / — Accepted — | 3:69 | Read me page node index |
| PPO - Customers, Sites & Equipment module / — Proposals — | 3:70 | Read me page node index |

### AF-061 · Major · Proposed Documents navigation conflicts with accepted Knowledge navigation

File: PPO - Documents & messages module. Checks: SH4, SH1. Rule/source: Supplied prompt SH4 and known item 4/A3.12; accepted Shell workspace menus 103:19012; proposed PR #918 A3.

Expected: Document register, Outputs and Templates in Knowledge → DOCUMENTS, using the accepted Shell menu components

Found: 79 drawn Documents docked menus are proposed FRAME copies; Read me [node ID retained in scratch] routes Documents & outputs through More → Shared records. The accepted Shell Knowledge menu places these pages in DOCUMENTS. Draft PR #918 A3 explicitly records the alternative as a proposal.

Fix owner: Dean; PPO - Documents & messages module. Action: Resolve the recorded navigation proposal with Dean and the Shell owner. Recommended alignment is the accepted Knowledge → DOCUMENTS route; adopt its approved component and nested current views. Update Read me and the proposed source record together; do not imply that the existing proposal was unrecorded. New accepted version: False. Evidence occurrences: 81.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Documents & messages module / Read me | [node ID retained in scratch] | Refined UI pages for Documents and messages of Powerplants One: the Document library, Outputs and Templates pages reached from More › Shared records › Documents & outputs, and the Email, Calendar and Customer messages pages of the Email workspace. Composed inside the accepted shell (PPO - Shell, named version “Shell refined concept — accepted · record header toolbar”, 10 November 2026) and organised with the page template adopted for the Sales file. Status: proposal. Design acceptance is Dean’s and has not been given; no named version is saved yet. Everything shown is synthetic: as at Thu 5 Nov 2026, 09:00 AEDT, company Powerplants AU, signed in as service manager Jordan Kim unless a sheet names another person; every send is on the Synthetic channel.<br><br>Flagship journeys (these sheets get the first audit pass and the most states). 1 · Jordan Kim’s morning on the desktop: Outputs (SYN-PACK-000072 Not issued, issue by 12:00) → Request issue → Preparation (Queued 09:30 → Durable 09:32 → Issued 09:33) → the recipients’ acknowledgements pending → Document library (review SYN-DOC-000112, the Glasshouse 4 drive 2 isolation procedure registered by Sam Patel) → Templates (Job pack version 3 at Block C) → Email (Noah Patel’s isolation approval linked to SYN-WO-000062; Jordan’s reply as correspondence) → Customer messages for Service (the safety bulletin notice, proposed). 2 · The sender’s queue: Robin Hale confirms the M2 delay notice to Sam Okafor and reconciles the Riverbend outcome unknown; Jess Wong approves and sends the Glasshouse 4 Update 4 to Jo Marsh while Priya Shah’s copy stays Held · do not notify. |
| PPO - Documents & messages module / Outputs · DK-03 | [node ID retained in scratch] | node type/name |
| PPO - Documents & messages module / Outputs · DK-03 | [node ID retained in scratch] | node type/name |

### AF-062 · Minor · UI scrims and state paints remain literal

File: PPO - Documents & messages module. Checks: CT2. Rule/source: Supplied audit prompt §4 CT2; complete A1–A3 originals unavailable.

Expected: Bind visible UI fills/strokes to the appropriate PPO colour variable

Found: 52 literal UI fill occurrences, zero literal strokes, after excluding Shell ancestors and SECTION canvas decoration. 37 are scrims and 15 are button hover/pressed overlays.

Fix owner: PPO - Documents & messages module (proposal). Action: Bind these fills to the matching existing PPO colour variables while preserving opacity and state layering; if an extra variable is needed, route that choice to the Library owner. New accepted version: False. Evidence occurrences: 52.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Documents & messages module / {'id': '7:10', 'name': 'Interaction states · DK · EC'} | [node ID retained in scratch] | fills |
| PPO - Documents & messages module / {'id': '7:10', 'name': 'Interaction states · DK · EC'} | [node ID retained in scratch] | fills |
| PPO - Documents & messages module / {'id': '7:10', 'name': 'Interaction states · DK · EC'} | [node ID retained in scratch] | fills |

### AF-063 · Minor · Displayed revisions retain one-digit forms

File: PPO - Documents & messages module. Checks: CV6. Rule/source: Supplied audit prompt CV6; full A2 unavailable; existing module fixture/source conventions preserved as an authority question.

Expected: Display r01, r02 and other two-digit revision labels under the supplied audit convention

Found: 145 visible current-display text nodes contain r1–r9; complete candidate occurrences, including source questions and machine payload text, remain in candidates.json. Includes template proposal Draft r2. Draft PR #918 A17 says A2 was not supplied with the original brief.

Fix owner: PPO - Documents & messages module (proposal). Action: Confirm the original A2 convention and any exact-source exception, then normalise displayed revisions consistently. Preserve issued file names, machine payloads, hashes and immutable historical identifiers unless their owner explicitly changes them. New accepted version: False. Evidence occurrences: 145.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Documents & messages module / Interaction states · DK · EC | [node ID retained in scratch] | Every saved revision returns the proposal to Draft (r2, Thu 5 Nov 2026, 08:15). |
| PPO - Documents & messages module / Interaction states · DK · EC | [node ID retained in scratch] | Template proposal · Glasshouse 4 drive work isolation pack r2 at 09:00 |
| PPO - Documents & messages module / Interaction states · DK · EC | [node ID retained in scratch] | Draft r2 · Thu 5 Nov 2026, 08:15 |

### AF-064 · Minor · Templates notes use a gendered pronoun for Sam Patel

File: PPO - Documents & messages module. Checks: FA7. Rule/source: Supplied audit prompt §4 FA7; complete A1–A3 originals unavailable.

Expected: Sam Patel is refused review/publication of their own proposal

Found: Node [node ID retained in scratch] says his own proposal.

Fix owner: PPO - Documents & messages module (proposal). Action: Replace his own proposal with their own proposal or Sam’s own proposal. New accepted version: False. Evidence occurrences: 1.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Documents & messages module / Templates · DK-06 | [node ID retained in scratch] | Jordan Kim reads, reviews proposals Jordan did not save, publishes Job pack versions and assigns site use; Propose a change is withheld with its reason (TP02). Sam Patel proposes and revises (TPX01, TPX02) and is refused review and publication of his own proposal (TP10f). Riley Tran reviews. Avery Lin reads Finance evidence definitions only (TP08b). Ravi Kumar drafts M3 (TP10g). Robin Hale and Jess Wong publish the customer email templates of the classes whose duty they hold (TP09). |

### AF-065 · Minor · Output issue date has a mismatched weekday

File: PPO - Documents & messages module. Checks: CV4. Rule/source: Supplied audit prompt CV4; live OU12; Outputs notes A-OU3.

Expected: Sat 31 Oct 2026, 16:20 if the recorded date/time is retained

Found: OU12 node [node ID retained in scratch] says Issued Fri 31 Oct 2026, 16:20. Outputs notes [node ID retained in scratch] already document this source conflict; 31 October 2026 is Saturday.

Fix owner: PPO - Documents & messages module (proposal). Action: Confirm the event date against the complete ledger; if retaining 31 October, change Fri to Sat. Resolve the source question and affected downstream event references together. New accepted version: False. Evidence occurrences: 2.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Documents & messages module / Outputs · DK-03 | [node ID retained in scratch] | Issued Fri 31 Oct 2026, 16:20 |
| PPO - Documents & messages module / Outputs · DK-03 | [node ID retained in scratch] | A-OU3 · The quotation on OU12 reads “Fri 31 Oct 2026, 16:20” exactly as section 9.2 gives it; 31 Oct 2026 is a Saturday, so the dataset needs correcting. |

### AF-066 · Minor · Gendered pronouns remain in synthetic-person copy

File: PPO - Customer portal module. Checks: FA7. Rule/source: Attached audit prompt §4 FA7.

Expected: Names or they/them throughout, including notes and sheet indexes.

Found: Gendered pronouns remain in synthetic-person copy

Fix owner: PPO - Customer portal module. Action: Apply the supplied neutral wording, then rescan all text nodes including Read me indexes. New accepted version: False. Evidence occurrences: 1.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Customer portal module / Staff workspace · Customer portal | [node ID retained in scratch] | • Requests she raises at Riverbend glasshouses |

### AF-067 · Minor · Single-digit revision suffixes remain

File: PPO - Customer portal module. Checks: CV6. Rule/source: Attached audit prompt §4 CV6.

Expected: Two-digit revision suffixes r01, r02, etc.

Found: Single-digit revision suffixes remain

Fix owner: PPO - Customer portal module. Action: Apply exact replacements consistently; if an output filename is renamed, update its actual output reference and hash through the owning workflow rather than silently altering evidence. New accepted version: False. Evidence occurrences: 18.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Customer portal module / Staff workspace · Customer portal | [node ID retained in scratch] | r2 |
| PPO - Customer portal module / Staff workspace · Customer portal | [node ID retained in scratch] | r1 |
| PPO - Customer portal module / Staff workspace · Customer portal | [node ID retained in scratch] | r1 |

### AF-068 · Minor · Displayed dates omit the year

File: PPO - Customer portal module. Checks: CV4. Rule/source: Attached audit prompt §4 CV4.

Expected: Full date, e.g. Thu 5 Nov 2026; retain each event’s actual year.

Found: Displayed dates omit the year

Fix owner: PPO - Customer portal module. Action: Expand each listed date using the source event year and zone. Do not assign 2026 blindly across year boundaries. New accepted version: False. Evidence occurrences: 217.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Customer portal module / Visits and reports · CP-04 | [node ID retained in scratch] | Thu 5 Nov |
| PPO - Customer portal module / Visits and reports · CP-04 | [node ID retained in scratch] | Thu 5 Nov |
| PPO - Customer portal module / Visits and reports · CP-04 | [node ID retained in scratch] | Thu 5 Nov |

### AF-069 · Major · Current quotations still use retired SYN-PPO catalogue-form references

File: PPO - Customer portal module. Checks: FA2. Rule/source: Prompt FA2, FA3, CV6 and §8.14.

Expected: SYN-QUO-000214 and SYN-QUO-000177 with the same two-digit revision and identity.

Found: Current quotations still use retired SYN-PPO catalogue-form references

Fix owner: PPO - Customer portal module. Action: Replace the current quotation family consistently across list, exact quotation, dialog, tablet, phone and label; align with accepted Estimating before release. New accepted version: False. Evidence occurrences: 23.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Customer portal module / Quotations and account · CP-06 | [node ID retained in scratch] | SYN-PPO-QUO-000214 r01 |
| PPO - Customer portal module / Quotations and account · CP-06 | [node ID retained in scratch] | SYN-PPO-QUO-000214 |
| PPO - Customer portal module / Quotations and account · CP-06 | [node ID retained in scratch] | Quotation SYN-PPO-QUO-000214 |

### AF-070 · Minor · Quotation issue and validity weekdays disagree with 2026 dates

File: PPO - Customer portal module. Checks: CV4. Rule/source: Attached audit prompt §4 CV4.

Expected: 31 October 2026 is Saturday; 30 November 2026 is Monday.

Found: Quotation issue and validity weekdays disagree with 2026 dates

Fix owner: PPO - Customer portal module. Action: Reconcile the authoritative quotation dates first, then update the weekday/date pair consistently on every listed customer view. If the dates remain 31 October and 30 November, use Sat and Mon. New accepted version: False. Evidence occurrences: 16.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Customer portal module / Quotations and account · CP-06 | [node ID retained in scratch] | Fri 31 Oct 2026, 16:20 |
| PPO - Customer portal module / Quotations and account · CP-06 | [node ID retained in scratch] | Valid to Sun 30 Nov 2026 |
| PPO - Customer portal module / Quotations and account · CP-06 | [node ID retained in scratch] | Exact issued revision · r01 · issued Fri 31 Oct 2026, 16:20 |

### AF-071 · Minor · Placeholder fill and stroke are literal colours

File: PPO - Customer portal module. Checks: CT2. Rule/source: Attached audit prompt §4 CT2.

Expected: Bind visible fills and strokes to PPO colour variables outside shell copies.

Found: Placeholder fill and stroke are literal colours

Fix owner: PPO - Customer portal module. Action: Bind the placeholder fill and border to named PPO variables, retaining its clearly undecided wording. New accepted version: False. Evidence occurrences: 2.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Customer portal module / 5:11 | [node ID retained in scratch] | fills |
| PPO - Customer portal module / 5:11 | [node ID retained in scratch] | strokes |

### AF-072 · Major · The same unknown MYOB send uses Warning in Supply and Danger in Reporting

File: PPO - Supply module; PPO - Reporting module. Checks: CT4. Rule/source: Audit prompt CT4; cross-file live instance main-component identity.

Expected: One shared tone for an unknown send outcome, distinct from an unknown quantity; agree the shared meaning before rollout.

Found: SYN-RTN-000020 return-to-supplier outcome Unknown: Supply [node ID retained in scratch] uses Tone=Warning; Reporting [node ID retained in scratch] uses Tone=Danger.

Fix owner: Dean; PPO - Supply module; PPO - Reporting module. Action: Confirm one Unknown send semantic tone with the Library owner; align both instances and the corresponding shared state documentation, keeping repeat blocked until the outcome is known. New accepted version: False. Evidence occurrences: 2.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Supply module / Returns and claims · SC-08 | [node ID retained in scratch] | Chip · Unknown |
| PPO - Reporting module / Supply and Finance trust · RP-05 | [node ID retained in scratch] | Chip · Unknown |

### AF-073 · Major · Reporting counts the October T06 test in the Q3 cohort

File: PPO - Reporting module. Checks: HO1, FA1. Rule/source: Reporting record G2; Engineering record A11 and CM03 inventory; prompt FA1/HO1.

Expected: A test recorded Thu 15 Oct 2026 belongs to Q4; Q3 is 1 Jul–30 Sep. Eligible cohort and all dependent ratios must use the same test dates.

Found: Reporting DP07 lists CP-4 T06 SM-3 among 12 Q3 tests, whereas Engineering records the test on Thu 15 Oct 2026.

Fix owner: Dean; PPO - Reporting module. Action: Retain the explicit Engineering test date unless Dean changes the fixture authority; rebuild the Q3 eligible cohort and its numerator, denominator, drill and Insights extracts from the agreed ledger rather than changing only the displayed quarter. New accepted version: False. Evidence occurrences: 5.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Reporting module / Delivery performance · RP-03 | [node ID retained in scratch] | Eligible completed tests of the Control panels class in Q3 2026 (1 Jul to 30 Sep) |
| PPO - Reporting module / Delivery performance · RP-03 | [node ID retained in scratch] | CP-4 · T06 SM-3 screen motor current |
| PPO - Engineering module / Change review · EN-07 | [node ID retained in scratch] | Screen motor SM-3 drew 3.1 A against ≤ 2.4 A on Thu 15 Oct (T06, defect SYN-DEF-000027). The rework on Fri 16 Oct passed at 2.1 A, but the load calculation r02 shows the 18 A contactor without margin at the measured start current. |

### AF-074 · Major · Sales and Reporting disagree on the 38 open deals by stage

File: PPO - Sales module (accepted); PPO - Reporting module. Checks: HO1, FA1. Rule/source: Reporting SP-A1/G2; live Sales D04 and Reporting Sales performance; prompt HO1/FA1.

Expected: The same as-at story, permitted population and pipeline version must yield the same stage distribution; owner-accepted Sales and later proposed/A3-derived counts cannot be silently reconciled.

Found: Sales D04 Discovery/Scoping/Quoting/Negotiation/Closing=9/8/11/6/4. Reporting=9/11/10/5/3. Both total 38.

Fix owner: Dean; PPO - Reporting module; PPO - Sales module (accepted). Action: Confirm the intended A3 stage ledger and pipeline/as-at basis, then align every board, Insights extract, report and drill; preserve accepted Sales until the owner resolves the conflict and saves a new named version for any change. New accepted version: If Sales changes. Evidence occurrences: 25.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Sales module (accepted) / Deals · CR-01 · CR-04 | [node ID retained in scratch] | 38 open deals · A$2,412,600 · as at Thu 5 Nov 2026, 09:00 |
| PPO - Sales module (accepted) / Deals · CR-01 · CR-04 | [node ID retained in scratch] | 4 |
| PPO - Sales module (accepted) / Deals · CR-01 · CR-04 | [node ID retained in scratch] | Closing |

### AF-075 · Major · Glasshouse 4 Update 4 has different fixed source revisions across the handover

File: PPO - Projects module; PPO - Documents & messages module; PPO - Customer portal module. Checks: HO1, FA1. Rule/source: Prompt HO1/FA1 and known item11; live Projects SU04, Documents CM05/CM07 and portal PU02/PU03.

Expected: The same Glasshouse 4 Update 4 at the shared09:00 snapshot uses one fixed revision and recipient policy; later publication is explicitly labelled.

Found: Projects SU04 is r01 fixed Wed 4 Nov17:20 with Jo Marsh/Priya Shah as email recipients. Documents CM05 says r2 fixed Thu 5 Nov08:24, Prepared08:30 at 09:00, and CM07 holds Priya. Portal later09:45 shows r2 published09:40 and Priya Held. The last two agree; no r02/08:24 transition is drawn in Projects.

Fix owner: Dean; PPO - Projects module. Action: Confirm the amended A3 Update 4 fixture, then align the Projects source revision and recipient-preference treatment to that decision, retaining explicit09:40/09:45 later labels and Priya’s Held email in the receiving files. New accepted version: False. Evidence occurrences: 15.

| File / page | Node | Evidence |
|---|---|---|
| projects / Site assurance · PJ-09 | [node ID retained in scratch] | Glasshouse 4 climate screens · SYN-PRJ-000024 · owner Jamie Rossi (project manager) · Engineering reviews technical criteria · draft r03 from SYN-ECR-000014 not issued |
| projects / Stakeholder updates · PJ-08 | [node ID retained in scratch] | Update 4 · r01 · Glasshouse 4 climate screens |
| projects / Stakeholder updates · PJ-08 | [node ID retained in scratch] | Prepared to send Wed 4 Nov 2026, 17:20 by Jamie Rossi · due Thu 5 Nov · recipients Jo Marsh, Priya Shah · M4 message prepared, not sent |

### AF-076 · Minor · Accepted workspace-menu header still says proposal

File: PPO - Shell (accepted). Checks: GV1. Rule/source: Accepted Shell record and live workspace-menu page; prompt known item15.

Expected: Accepted status and repository-backed source wording matching the accepted page and record.

Found: Header still says Proposal · awaiting Dean’s acceptance and Figma only · no repository record.

Fix owner: PPO - Shell (accepted). Action: Update the stale header and its source statement in the Shell owner’s next reviewed batch, then save and record a new named version. New accepted version: True. Evidence occurrences: 2.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Shell (accepted) / Workspace menus (accepted) | [node ID retained in scratch] | Proposal · awaiting Dean’s acceptance |
| PPO - Shell (accepted) / Workspace menus (accepted) | [node ID retained in scratch] | Figma only · no repository record |

### AF-077 · Blocker · Sales phone-bar change lacks a recorded new build pin

File: PPO - Sales module (accepted). Checks: GV3. Rule/source: docs/decisions/sales-module-refined-ui-proposal.md §14; docs/decisions/figma-named-version-build-handoff.md rule5.

Expected: A uniquely named version is recorded for the accepted Tue 10 Nov phone-bar change before build handoff.

Found: The record explicitly says a new named version is needed after 11 phone-bar placements, while the build basis remains Mon 9 Nov batch 2 N13. Version history is unavailable; a later unrecorded save may exist.

Fix owner: Dean; Repository; PPO - Sales module (accepted). Action: Verify Figma history, save a uniquely named version only if needed, and cite that exact version in a separate Sales record amendment before build handoff. New accepted version: Conditional: verify history; save only if needed. Evidence occurrences: 1.

| File / page | Node | Evidence |
|---|---|---|
| PPO - Sales module (accepted) / Repository record §14 | repository text | Tue10Nov phone-bar change needs a new named version; current build pin remains Mon9Nov batch2 N13 |

## Authority conflicts and questions

Q1: no optional locations arrived; Library records only, Assistant/Knowledge/Help and Products Not checked, existence unknown. Q2: read-only. Q3: include existing content in ongoing builds. Q4: apply the Library’s recorded transition. Q5: Sales Products totals remain a finding. Q6: all severities included in every brief. Full A1/A2/A3 were requested once and were not supplied.

## AC-01 · Kim Patel persona

Reading A: Prompt FA2 says Kim Patel does not exist.

Reading B: Owner-accepted Estimating A23 retains Kim Patel;74 live occurrences. Projects has111 and Supply32.

Recommendation: Use full amended A3 to decide one role-specific mapping. Preserve accepted Estimating until Dean records a change and saves a new named version. No replacement is inferred.

## AC-02 · Collapsed strip dimensions

Reading A: Prompt SH5 calls the strip80 px; My Work repeats80 px; Projects A9 explicitly proposes56 px.

Reading B: Accepted Shell R75 and live variants are12 px. The rail and component-set container are80 px. Settings and Estimating explicitly use12 px.

Recommendation: Correct the audit wording to distinguish the 80 px rail/container from the 12 px strip; decide whether Projects A9 or My Work needs a later approved change.

## AC-03 · Accepted page-template exceptions

Reading A: Prompt places kit after Proposals and requires sixsections and responsive variants everywhere.

Reading B: Accepted Sales §13.6 places kit before Proposals and permits emptysections to be omitted. Estimating A31 permits7 pages withoutphones and 6withouttablets.

Recommendation: Keep the accepted exceptions; change them only by a recorded new template decision and accepted-file version.

## AC-04 · Phone targets

Reading A: Prompt RA3 requires48 px except the Assistant’s44 px.

Reading B: Accepted Estimating A32 specifies44 px actions and 28 px customer anchors; My Work PR914 explicitly proposes44 px.

Recommendation: Decide the shared target-size baseline and migration separately. Do not silently resize accepted designs.

## AC-05 · Estimating record toolbar

Reading A: A1/latest Shell uses the shared toolbar and Outputs.

Reading B: Accepted Estimating A16/A17 carries breadcrumb stepper and Reports; live Reports labels remain.

Recommendation: Reconcile the accepted carry-forward with A1 before the Estimating header batch; quote the exact new decision in its record.

## AC-06 · Sales-brief revision notation

Reading A: Prompt A2 and Estimating §4 require two-digit revisions.

Reading B: Estimating §11.1 explicitly preserves brief r1/r2. Quotation labels do not have this exception.

Recommendation: Confirm notation for shared Sales briefs. Fix the independently confirmed quotation revision drift; do not apply a blind replacement to immutable integration keys or version-number fields.

## AC-07 · Tablet top-bar actions

Reading A: Prompt SH2 requires all seven actions everywhere.

Reading B: Accepted Shell Q19 omits Calendar on tablets.

Recommendation: Retain the explicit breakpoint exception and correct the audit rule rather than fail tablet instances automatically.

## AC-08 · Opportunity SYN-OPP-000301

Reading A: Accepted Sales identifies Mallee Fresh Produce — Irrigation pump station.

Reading B: Engineering uses the same reference for Hillview Glasshouse 5 in18texts, already noted in its record.

Recommendation: Preserve accepted Sales unless Dean changes its fixture. Confirm the Engineering reference from full A3; update Engineering’s connected request/estimate references together.

## AC-09 · Unknown send tone

Reading A: Supply return SYN-RTN-000020 uses Warning.

Reading B: Reporting shows the same unknown send as Danger.

Recommendation: Choose one shared unknown-send semantic tone with the Library owner. Keep repeat blocked; do not conflate unknown quantity with unknown send.

## AC-10 · T06 reporting quarter

Reading A: Reporting DP07 places CP-4 T06 in Q3,1Jul–30Sep.

Reading B: Engineering records T06 on Thu 15 Oct 2026.

Recommendation: Retain the explicit October date unless Dean changes the fixture; rebuild the eligible Q3cohort and dependent ratios from the agreed ledger.

## AC-11 · Sales stage counts

Reading A: Accepted Sales at 09:00 has9/8/11/6/4 across the stages, total38.

Reading B: Reporting at 09:00 has9/11/10/5/3, also total38.

Recommendation: Confirm the exact permitted cohort and amended A3 counts; do not silently rewrite accepted Sales. A Sales change requires a new named version.

## AC-12 · Glasshouse 4 Update 4 source revision

Reading A: Projects SU04 fixes r01 on Wed 4 Nov17:20.

Reading B: Documents/messages CM05 fixes r2 at Thu 5 Nov08:24, prepares08:30, and portal later publishes r2 at 09:40; Priya’s email is Held.

Recommendation: Confirm the amended A3 Update 4 fixture and align Projects’ source state/recipient policy. Keep receiving-file later labels and held-email treatment.

## AC-13 · Primary-action contrast

Reading A: The accepted Shell and copied toolbar use14 px white on #3d9a37,3.574:1.

Reading B: RA2 requires4.5:1; several module proof cards assert passing pairs or no use of this pair.

Recommendation: Choose an accessible shared fill/text pair in the Shell owner’s reviewed batch, save a new named version, then propagate local copies and recalculate proofs.

## AC-14 · Drawer-width transition — resolved by existing decision

Reading A: Prompt contrasts432 px panels with Library360/480/640/800.

Reading B: Shell preview432+tabs48=480total. Library drawer record explicitly retains current accepted/local widths until their next reviewed change; Library remains unpublished.

Recommendation: No new width decision is needed for the audit. Apply the recorded transition and measure panel versus total separately.

## AC-15 · Draft tone transition — resolved by existing decision

Reading A: Library Controls C2 fixes Draft as Neutral.

Reading B: Legacy Sales Warning migration is explicitly deferred until adoption of the unpublished Library.

Recommendation: Keep this as a scheduled adoption dependency, not an unrecorded current defect.

## AC-16 · Documents and Shared records navigation

Reading A: Accepted Shell places Document register, Outputs and Templates in Knowledge → DOCUMENTS; Shared records is a column in More.

Reading B: Documents/messages PR #918 A3 explicitly proposes More → Shared records → Documents & outputs and 79 drawn frame menus. Shared records Read me 90:76 separately proposes a docked menu.

Recommendation: Dean and the Shell owner settle the recorded proposals. Adopt the accepted hierarchy unless a new Shell decision changes it; preserve the distinction between an explicit proposal and an unrecorded departure.

## AC-17 · Signed-in labels versus source citations

Reading A: Prompt ST3/FA4 requires each UI label to name the signed-in person.

Reading B: Several module templates use [source] instead; Shared records Read me [node ID retained in scratch] explicitly specifies that pattern.

Recommendation: Decide one shared label template. Retain source citations and add the actual drawn persona; mark specification boards explicitly rather than inventing a user.

## AC-18 · Shared records survey count

Reading A: Read me 90:83 reports the source state counts sum to13 of 14.

Reading B: The file draws Reviewed10 to make its chosen cohort.

Recommendation: Confirm the canonical survey cohort and states in full A3; keep the source question open and update all dependent totals together.

## AC-19 · Backup configuration chronology

Reading A: SYN-BKP-000019 stages are dated12–15Oct2026.

Reading B: Configuration r2 was applied Wed 4 Nov 2026; Read me 90:84 asks whether bench preparation predates application.

Recommendation: Confirm whether the stages describe bench preparation or a later backup event. Do not invent replacement dates; align the event chronology and notes together.

## AC-20 · Output issue weekday source conflict

Reading A: Documents OU12 preserves Fri 31 Oct 2026,16:20 from its source.

Reading B: The calendar date31Oct2026 is Saturday; Outputs notes32:33772 already flags the contradiction.

Recommendation: Retain the numeric date/time only after ledger confirmation; if retained, use Sat 31 Oct 2026,16:20 and reconcile counterpart references.


## Known items confirmed or closed

| Item | Disposition |
|---|---|
| 1 | Confirmed: Sales A1 toolbar adoption remains open. |
| 2 | Confirmed: Sales231single-digit revision text nodes. |
| 3 | Confirmed: Sales Products totals/catalogue references. Products file unavailable, so full catalogue comparison remains open. |
| 4 | Confirmed drawn Documents route differs from accepted Knowledge DOCUMENTS; see Documents finding/brief. |
| 5 | Shared records menu explicitly labelled proposal; ownership/route decision retained for Dean, not silently accepted. |
| 6 | My Work recurring checks not placed in its menu. Full Assistant counterpart unavailable. |
| 7 | Resolved by panel432+tabs48 and Library deferred-adoption record. |
| 8 | Confirmed: My Work Ravi report-response item differs; Service record remains AwaitingOwen. |
| 9 | Service Portal request channel explicitly treated as proposed in record/notes; migration0112 has no such channel. |
| 10 | Settings Simulated,US$30 andflagSYN-AIF-000002 observed; full pilot-role/Assistant counterpart comparison unavailable. |
| 11 | Documents/portal heldM4 and09:40laterpublication agree; Projects fixed source revision differs. |
| 12 | Products Design page not opened; no supplied Products file. Do not confuse Settings releaseREL with product relationshipPRL. |
| 13 | Confirmed gendered-person text across multiple modules; Settings/Reporting/Sharedrecords sampled full-text scans clear for this narrow check. |
| 14 | Estimating acceptance recorded; quotation revisions fail; full conversion/CPQ/cost-source reconciliation needs complete A3. |
| 15 | Shell accepted workspace-menu header stale. Frozen Design’s AI/PD reference labels were not audited as module failures. |
| REP-09 | Closed: nineexception-kind entries over eight exceptions is explicitly explained by one exception carrying two kinds (cable/glandkit). Not an arithmetic defect. |

## Component and tone comparison

The local-definition comparison lists same-name/shallow-structure differences and differently named/shallow-shape matches in `component-comparison.json`. These are candidates, not proof of visual equivalence: copied icons can differ in paths/rounding, component-set arrangement can differ, and identically named variant states belong to different parent sets. Deep geometry and complete variant-property parity remain Not checked. The exact same Unknown send record in Supply/Reporting was confirmed by instance main-component identity; Draft’s deferred Library migration and different meanings of Sent were kept separate.

## Not checked, limits and resume points

- Obtain the complete amended A1/A2/A3 and the three optional file locations. Resolve the named authority questions first; do not infer that the two unlinked modules do not exist.
- Normalise the 409 record excerpts into atomic facts using A3; finish every fact, queue total, forbidden-word context, ownership and handover mapping. Samples that agree do not pass the full compound check.
- Finish deep component/variant comparison, all nested overlap/render checks, phone input/target measurements, interactive keyboard/focus and alternative-text checks, full Australian-English/style review and all permission-bound counts.
- Verify live named-version history and exact displayed file titles; no available tool exposed them. Check active-build timestamps before the next read; the present audit could not establish last-hour edit activity.
- Revisit unfinished Documents/messages index/audit and portal Read me after the owning sessions finish. Recheck pending records after merge.
- No separate customer disclosure was confirmed by the supplied exposure-list scan; full A3.11 and exhaustive permission/organisation boundaries remain unproved. Portal retiredquotation references are recorded under reference/fixture rules.
- Persistent PR notification subscription is unavailable in the connected tools and the CLI authentication is invalid. The session actively monitors CI, but does not claim a persistent watch subscription.

## Alignment batches and next steps

Resolve the shared Shell contrast first, then accepted Sales/Estimating Blockers, then shared facts/handovers/reference families, then local conventions and polish. Every brief includes all severities and occurrence evidence. Accepted Shell/Sales/Estimating edits belong to their own sessions and require a new named version. Corrections to other records are separate later changes. The audit changed no Figma file, code, migration, permission, design register, shared index or other decision record; all 78 parent requirement IDs remain intact.

## Matrix summary

P=Pass; F=Fail(finding IDs); N/A=Not applicable; NC=Not checked. The full CSV supplies a reason in every cell.

| Check | sales | estimating | projects | supply | engineering | service | finance | settings | reporting | my-work | shared-records | documents-messages | customer-portal | assistant-knowledge-help | products |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ST1 | NC | P | P | P | P | P | P | P | P | P | P | P | P | NC | NC |
| ST2 | NC | NC | P | P | P | P | P | NC | P | NC | P | P | P | NC | NC |
| ST3 | F AF-010 | NC | F AF-020 | F AF-027 | F AF-035 | F AF-040 | F AF-045 | NC | NC | F AF-054 | F AF-059 | NC | NC | NC | NC |
| ST4 | NC | NC | NC | NC | NC | NC | NC | NC | NC | F AF-054 | NC | NC | NC | NC | NC |
| ST5 | P | P | F AF-018 | F AF-029 | NC | NC | NC | P | P | P | F AF-060 | NC | NC | NC | NC |
| SH1 | NC | NC | F AF-017 | NC | NC | NC | NC | NC | F AF-050 | NC | NC | F AF-061 | NC | NC | NC |
| SH2 | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC |
| SH3 | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC |
| SH4 | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | F AF-061 | NC | NC | NC |
| SH5 | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC |
| SH6 | F AF-008 | NC | F AF-017 | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC |
| SH7 | NC | NC | F AF-021 | F AF-028 | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC |
| CT1 | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC |
| CT2 | F AF-009 | NC | F AF-019 | F AF-026 | F AF-034 | NC | F AF-044 | F AF-047 | NC | F AF-055 | F AF-056 | F AF-062 | F AF-071 | NC | NC |
| CT3 | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC |
| CT4 | NC | NC | NC | F AF-072 | NC | NC | NC | NC | F AF-072 | NC | NC | NC | NC | NC | NC |
| CT5 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | NC | N/A | N/A | N/A | N/A | NC | NC |
| CV1 | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC |
| CV2 | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC |
| CV3 | F AF-003 | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC |
| CV4 | NC | NC | F AF-016 | NC | F AF-032 | F AF-038 | F AF-042 | NC | NC | NC | NC | F AF-065 | F AF-068,AF-070 | NC | NC |
| CV5 | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC |
| CV6 | F AF-002,AF-004 | F AF-012 | NC | F AF-024,AF-025 | F AF-031 | F AF-037 | NC | F AF-046 | F AF-048 | F AF-051 | F AF-057 | F AF-063 | F AF-067 | NC | NC |
| CV7 | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | F AF-058 | NC | NC | NC | NC |
| CV8 | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC |
| FA1 | F AF-074 | NC | F AF-014,AF-075 | F AF-022 | F AF-033 | NC | NC | NC | F AF-073,AF-074 | NC | NC | NC | NC | NC | NC |
| FA2 | F AF-005 | NC | F AF-014 | F AF-022,AF-024 | NC | NC | NC | NC | NC | NC | NC | NC | F AF-069 | NC | NC |
| FA3 | NC | NC | NC | F AF-024 | NC | NC | F AF-043 | NC | NC | NC | NC | NC | NC | NC | NC |
| FA4 | NC | NC | F AF-020 | F AF-027 | NC | NC | NC | NC | NC | NC | F AF-059 | NC | NC | NC | NC |
| FA5 | F AF-011 | NC | NC | NC | NC | F AF-039 | NC | NC | F AF-049 | NC | NC | NC | NC | NC | NC |
| FA6 | NC | NC | NC | NC | NC | NC | NC | NC | NC | F AF-053 | NC | NC | NC | NC | NC |
| FA7 | F AF-006 | F AF-013 | F AF-015 | F AF-023 | F AF-030 | F AF-036 | F AF-041 | P | P | F AF-052 | P | F AF-064 | F AF-066 | NC | NC |
| HO1 | F AF-074 | NC | F AF-075 | NC | NC | NC | NC | NC | F AF-073,AF-074 | NC | NC | NC | NC | NC | NC |
| HO2 | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC |
| HO3 | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC |
| RA1 | P | P | P | P | NC | NC | NC | P | P | P | P | NC | NC | NC | NC |
| RA2 | NC | NC | NC | F AF-001 | F AF-001 | F AF-001 | F AF-001 | F AF-001 | F AF-001 | F AF-001 | F AF-001 | F AF-001 | F AF-001 | NC | NC |
| RA3 | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC | NC |
| GV1 | F AF-007 | P | P | P | P | P | P | P | NC | P | P | P | P | NC | NC |
| GV2 | NC | NC | NC | NC | P | P | P | NC | P | NC | NC | NC | P | NC | NC |
| GV3 | F AF-077 | NC | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | NC | NC |
| GV4 | P | P | P | P | P | P | P | P | P | P | P | NC | NC | NC | NC |
| EX1 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | NC | NC | NC |

## Complete coverage explanations

### PPO - Sales module (accepted)

| Check | Result | Reason |
|---|---|---|
| ST1 | Not checked  | Sales accepted order conflicts with prompt; separators and Scratch empty. |
| ST2 | Not checked  | Section order and360px gaps checked; exact padding and accepted omission exceptions prevent an unqualified prompt-wide Pass. |
| ST3 | Fail AF-010 | Confirmed observations; other subchecks may remain limited. |
| ST4 | Not checked  | No sheet/section AABB overlaps; direct children contained. Full visual/internal-layer and Read me-card overlap review not performed. |
| ST5 | Pass  | Four Read me cards; every current scope sheet ID appears in the Read me index and resolves. Historical/external record IDs were kept separate. |
| SH1 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| SH2 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| SH3 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| SH4 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| SH5 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| SH6 | Fail AF-008 | Confirmed observations; other subchecks may remain limited. |
| SH7 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| CT1 | Not checked  | Local component inventories compared for names and shallow structure; component-comparison.json lists every detected group. Deep shape, variant properties and semantic equivalence remain unproved. |
| CT2 | Fail AF-009 | Confirmed observations; other subchecks may remain limited. |
| CT3 | Not checked  | All scope text families, including mixed segments,Roboto. Full radius,shadow,scrim and phone-input scale verification not completed. |
| CT4 | Not checked  | Cross-file comparison remains with the parent audit; per-file extracted evidence and local component inventories supplied. |
| CT5 | Not applicable  | Local Shell/Sales copies; Library is unpublished and not adopted in these records. |
| CV1 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| CV2 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| CV3 | Fail AF-003 | Confirmed observations; other subchecks may remain limited. |
| CV4 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| CV5 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| CV6 | Fail AF-002,AF-004 | Confirmed observations; other subchecks may remain limited. |
| CV7 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| CV8 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| FA1 | Fail AF-074 | Full A3 missing; all extracted current text retained for ledger comparison. Sales relative-clock finding is separately underFA5. |
| FA2 | Fail AF-005 | Confirmed observations; other subchecks may remain limited. |
| FA3 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| FA4 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| FA5 | Fail AF-011 | Confirmed observations; other subchecks may remain limited. |
| FA6 | Not checked  | Full A3.8 queue ledger not supplied; no complete per-person reconciliation claimed. |
| FA7 | Fail AF-006 | Confirmed observations; other subchecks may remain limited. |
| HO1 | Fail AF-074 | Cross-file comparison remains with the parent audit; per-file extracted evidence and local component inventories supplied. |
| HO2 | Not checked  | Cross-file comparison remains with the parent audit; per-file extracted evidence and local component inventories supplied. |
| HO3 | Not checked  | Cross-file comparison remains with the parent audit; per-file extracted evidence and local component inventories supplied. |
| RA1 | Pass  | Recorded current sheets and responsive variants resolve. Documented desktop-first omissions are accepted exceptions. |
| RA2 | Not checked  | Six text pairs independently pass4.5:1 in both files; Estimating accent also passes5.289. Full rendered text/UI-edge pairing proof not completed; Sales retains unused old Estimating accent3.649 as a documented cross-file token difference. |
| RA3 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| GV1 | Fail AF-007 | Confirmed observations; other subchecks may remain limited. |
| GV2 | Not checked  | Parent repository sweep owns the whole-main link/key scan. |
| GV3 | Fail AF-077 | Named versions recorded; live history API unavailable. Sales§14 recorded post-save change is a separate repository finding; no unsupported claim about latest live version. |
| GV4 | Pass  | All114 current sheet frames resolve;17 non-current or external record references do not. |
| EX1 | Not applicable  | This check applies only to Customer portal. |

### PPO - Estimating module

| Check | Result | Reason |
|---|---|---|
| ST1 | Pass  | Read me, empty Accepted separator,15 scope pages,empty Proposals separator,Shell and kit,Scratch; accepted scope position confirmed. |
| ST2 | Not checked  | Section order and360px gaps checked; exact padding and accepted omission exceptions prevent an unqualified prompt-wide Pass. |
| ST3 | Not checked  | All297 sheets have matching labels at y−26,correct width and ending truncation; exact prompt scope/persona suffix convention is not fully reconciled. |
| ST4 | Not checked  | No sheet/section AABB overlaps; direct children contained except the two recorded clipped customer-page columns. Full visual/internal-layer and Read me-card overlap review not performed. |
| ST5 | Pass  | Four Read me cards; every current scope sheet ID appears in the Read me index and resolves. Historical/external record IDs were kept separate. |
| SH1 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| SH2 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| SH3 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| SH4 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| SH5 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| SH6 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| SH7 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| CT1 | Not checked  | Local component inventories compared for names and shallow structure; component-comparison.json lists every detected group. Deep shape, variant properties and semantic equivalence remain unproved. |
| CT2 | Not checked  | 0 literal fills/strokes in all scope sheets and notes; bindings and PPO colour collection observed. Read me and kit paint trees were not fully scanned. |
| CT3 | Not checked  | All scope text families, including mixed segments,Roboto. Full radius,shadow,scrim and phone-input scale verification not completed. |
| CT4 | Not checked  | Cross-file comparison remains with the parent audit; per-file extracted evidence and local component inventories supplied. |
| CT5 | Not applicable  | Local Shell/Sales copies; Library is unpublished and not adopted in these records. |
| CV1 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| CV2 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| CV3 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| CV4 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| CV5 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| CV6 | Fail AF-012 | Confirmed observations; other subchecks may remain limited. |
| CV7 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| CV8 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| FA1 | Not checked  | Full A3 missing; all extracted current text retained for ledger comparison. Sales relative-clock finding is separately underFA5. |
| FA2 | Not checked  | 74 current Kim Patel occurrences conflict with accepted A23; fullA3 and owner reconciliation required. |
| FA3 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| FA4 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| FA5 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| FA6 | Not checked  | Full A3.8 queue ledger not supplied; no complete per-person reconciliation claimed. |
| FA7 | Fail AF-013 | Confirmed observations; other subchecks may remain limited. |
| HO1 | Not checked  | Cross-file comparison remains with the parent audit; per-file extracted evidence and local component inventories supplied. |
| HO2 | Not checked  | Cross-file comparison remains with the parent audit; per-file extracted evidence and local component inventories supplied. |
| HO3 | Not checked  | Cross-file comparison remains with the parent audit; per-file extracted evidence and local component inventories supplied. |
| RA1 | Pass  | Recorded current sheets and responsive variants resolve. Documented desktop-first omissions are accepted exceptions. |
| RA2 | Not checked  | Six text pairs independently pass4.5:1 in both files; Estimating accent also passes5.289. Full rendered text/UI-edge pairing proof not completed; Sales retains unused old Estimating accent3.649 as a documented cross-file token difference. |
| RA3 | Not checked  | Full check not established by this bounded extraction; see evidence and limits. |
| GV1 | Pass  | Read me16:224 and16:241 explicitly state297 sheets,accepted10Nov and named version; scope page placement agrees. |
| GV2 | Not checked  | Parent repository sweep owns the whole-main link/key scan. |
| GV3 | Not checked  | Named versions recorded; live history API unavailable. Sales§14 recorded post-save change is a separate repository finding; no unsupported claim about latest live version. |
| GV4 | Pass  | All397 recorded node IDs resolve, including the297 current scope sheets. |
| EX1 | Not applicable  | This check applies only to Customer portal. |

### PPO - Projects module

| Check | Result | Reason |
|---|---|---|
| ST1 | Pass  | Page order/status placement verified; both separators and Scratch read separately and empty. |
| ST2 | Pass  | All scope pages have the six adopted sections in order and exactly360 px gaps; sheet origins follow the module template y100. |
| ST3 | Fail AF-020 | Confirmed evidence listed in findings; source conflicts and unexamined remainder are retained explicitly. |
| ST4 | Not checked  | All sheet direct children are in bounds, and section/label positions checked; nested sibling overlaps and rendered clipping were not exhaustively verified. |
| ST5 | Fail AF-018 | Confirmed evidence listed in findings; source conflicts and unexamined remainder are retained explicitly. |
| SH1 | Fail AF-017 | Confirmed evidence listed in findings; source conflicts and unexamined remainder are retained explicitly. |
| SH2 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| SH3 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| SH4 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| SH5 | Not checked  | Documented A9 proposal56px differs from accepted12px; prompt80px is a separate conflict. Dean decision required; not an unrecorded defect. |
| SH6 | Fail AF-017 | Confirmed evidence listed in findings; source conflicts and unexamined remainder are retained explicitly. |
| SH7 | Fail AF-021 | Confirmed evidence listed in findings; source conflicts and unexamined remainder are retained explicitly. |
| CT1 | Not checked  | Local component inventories compared for names and shallow structure; component-comparison.json lists every detected group. Deep shape, variant properties and semantic equivalence remain unproved. |
| CT2 | Fail AF-019 | Confirmed evidence listed in findings; source conflicts and unexamined remainder are retained explicitly. |
| CT3 | Not checked  | Explicit single-family text is Roboto; 218 mixed-font nodes retained. Mixed runs on one targeted scope page were all Roboto; remaining mixed runs, sizes/radii/shadows not fully validated. |
| CT4 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| CT5 | Not applicable  | Local copies retained; Library remains unpublished and not adopted. No published Library version exists to match. |
| CV1 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| CV2 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| CV3 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| CV4 | Fail AF-016 | Confirmed evidence listed in findings; source conflicts and unexamined remainder are retained explicitly. |
| CV5 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| CV6 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| CV7 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| CV8 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| FA1 | Fail AF-014,AF-075 | Confirmed evidence listed in findings; source conflicts and unexamined remainder are retained explicitly. |
| FA2 | Fail AF-014 | Confirmed evidence listed in findings; source conflicts and unexamined remainder are retained explicitly. |
| FA3 | Not checked  | Full A3 fact ledger is unavailable and/or cross-file receiving evidence is owned by parent analysis; no complete pass inferred. |
| FA4 | Fail AF-020 | Confirmed evidence listed in findings; source conflicts and unexamined remainder are retained explicitly. |
| FA5 | Not checked  | Full A3 fact ledger is unavailable and/or cross-file receiving evidence is owned by parent analysis; no complete pass inferred. |
| FA6 | Not checked  | Full A3 fact ledger is unavailable and/or cross-file receiving evidence is owned by parent analysis; no complete pass inferred. |
| FA7 | Fail AF-015 | Confirmed evidence listed in findings; source conflicts and unexamined remainder are retained explicitly. |
| HO1 | Fail AF-075 | Full A3 fact ledger is unavailable and/or cross-file receiving evidence is owned by parent analysis; no complete pass inferred. |
| HO2 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| HO3 | Not checked  | Full A3 fact ledger is unavailable and/or cross-file receiving evidence is owned by parent analysis; no complete pass inferred. |
| RA1 | Pass  | All inventoried states/tablets/phone sheets resolve, including the declared320 px variants. |
| RA2 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| RA3 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| GV1 | Pass  | Module proposal status agrees between Read me, scope placement and current repository record. |
| GV2 | Not checked  | Parent repository sweep owns the complete decision-record/status-fragment link/key scan. |
| GV3 | Not applicable  | This module remains a proposal, not an accepted file. |
| GV4 | Pass  | All inventory-table sheet/card IDs resolve in the complete extracts; kit-page row independently resolved. |
| EX1 | Not applicable  | Customer-portal-only exposure check. |

### PPO - Supply module

| Check | Result | Reason |
|---|---|---|
| ST1 | Pass  | Page order/status placement verified; both separators and Scratch read separately and empty. |
| ST2 | Pass  | All scope pages have the six adopted sections in order and exactly360 px gaps; sheet origins follow the module template y100. |
| ST3 | Fail AF-027 | Confirmed evidence listed in findings; source conflicts and unexamined remainder are retained explicitly. |
| ST4 | Not checked  | All sheet direct children are in bounds, and section/label positions checked; nested sibling overlaps and rendered clipping were not exhaustively verified. |
| ST5 | Fail AF-029 | Confirmed evidence listed in findings; source conflicts and unexamined remainder are retained explicitly. |
| SH1 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| SH2 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| SH3 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| SH4 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| SH5 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| SH6 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| SH7 | Fail AF-028 | Confirmed evidence listed in findings; source conflicts and unexamined remainder are retained explicitly. |
| CT1 | Not checked  | Local component inventories compared for names and shallow structure; component-comparison.json lists every detected group. Deep shape, variant properties and semantic equivalence remain unproved. |
| CT2 | Fail AF-026 | Confirmed evidence listed in findings; source conflicts and unexamined remainder are retained explicitly. |
| CT3 | Not checked  | Explicit single-family text is Roboto; 375 mixed-font nodes retained. Mixed runs on one targeted scope page were all Roboto; remaining mixed runs, sizes/radii/shadows not fully validated. |
| CT4 | Fail AF-072 | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| CT5 | Not applicable  | Local copies retained; Library remains unpublished and not adopted. No published Library version exists to match. |
| CV1 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| CV2 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| CV3 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| CV4 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| CV5 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| CV6 | Fail AF-024,AF-025 | Confirmed evidence listed in findings; source conflicts and unexamined remainder are retained explicitly. |
| CV7 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| CV8 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| FA1 | Fail AF-022 | Confirmed evidence listed in findings; source conflicts and unexamined remainder are retained explicitly. |
| FA2 | Fail AF-022,AF-024 | Confirmed evidence listed in findings; source conflicts and unexamined remainder are retained explicitly. |
| FA3 | Fail AF-024 | Confirmed evidence listed in findings; source conflicts and unexamined remainder are retained explicitly. |
| FA4 | Fail AF-027 | Confirmed evidence listed in findings; source conflicts and unexamined remainder are retained explicitly. |
| FA5 | Not checked  | Full A3 fact ledger is unavailable and/or cross-file receiving evidence is owned by parent analysis; no complete pass inferred. |
| FA6 | Not checked  | Full A3 fact ledger is unavailable and/or cross-file receiving evidence is owned by parent analysis; no complete pass inferred. |
| FA7 | Fail AF-023 | Confirmed evidence listed in findings; source conflicts and unexamined remainder are retained explicitly. |
| HO1 | Not checked  | Full A3 fact ledger is unavailable and/or cross-file receiving evidence is owned by parent analysis; no complete pass inferred. |
| HO2 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| HO3 | Not checked  | Full A3 fact ledger is unavailable and/or cross-file receiving evidence is owned by parent analysis; no complete pass inferred. |
| RA1 | Pass  | All inventoried states/tablets/phone sheets resolve, including the declared320 px variants. |
| RA2 | Fail AF-001 | Confirmed evidence listed in findings; source conflicts and unexamined remainder are retained explicitly. |
| RA3 | Not checked  | Extracted evidence is available, but this full check has not been established; see limits and parent cross-file analysis. |
| GV1 | Pass  | Module proposal status agrees between Read me, scope placement and current repository record. |
| GV2 | Not checked  | Parent repository sweep owns the complete decision-record/status-fragment link/key scan. |
| GV3 | Not applicable  | This module remains a proposal, not an accepted file. |
| GV4 | Pass  | All inventory-table sheet/card IDs resolve in the complete extracts; kit-page row independently resolved. |
| EX1 | Not applicable  | Customer-portal-only exposure check. |

### PPO - Engineering module

| Check | Result | Reason |
|---|---|---|
| EX1 | Not applicable  | Customer exposure rule applies to Customer portal file only. |
| GV4 | Pass  | 20/20 sampled inventory IDs resolved in full page traversal. |
| GV3 | Not applicable  | Module is a proposal and has no owner-accepted named version. |
| GV2 | Pass  | Repository scan of 920 decision/status files found no Figma file URL or any supplied known key. |
| GV1 | Pass  | Scope pages stay below proposal separator and Read me/module record describe proposal; accepted source labels are citations, not module acceptance. |
| RA3 | Not checked  | Keyboard/focus/target notes extracted; actual target geometry, alt text and mixed font inputs not fully measured. |
| RA2 | Fail AF-001 | Accepted toolbar primary text fails 4.5:1 contrast |
| RA1 | Not checked  | Responsive/state sheets inventoried; exact per-scope exemptions and missing sheet comparison not fully reconciled. |
| HO3 | Not checked  | Cross-file counterpart and ownership comparison belongs to aggregate audit; full A3 unavailable. |
| HO2 | Not checked  | Cross-file counterpart and ownership comparison belongs to aggregate audit; full A3 unavailable. |
| HO1 | Not checked  | Cross-file counterpart and ownership comparison belongs to aggregate audit; full A3 unavailable. |
| FA7 | Fail AF-030 | Gendered pronouns remain in synthetic-person copy |
| FA6 | Not checked  | Full A3.8 queue totals and complete My Work counterpart comparison unavailable. |
| FA5 | Not checked  | Story-clock text extracted; every future event’s local as-at context not fully reconciled. |
| FA4 | Not checked  | Original candidate was removed or held as an authority conflict; see questions. |
| FA3 | Not checked  | Full rule not established by compact extraction; no pass inferred from absence of an automated hit. |
| FA2 | Not checked  | Available earlier-fixture list scanned; complete A3 missing. Prefix matches must preserve Service INC, subcontract SUB and progress CLM exceptions. |
| FA1 | Fail AF-033 | SYN-OPP-000301 remains in Engineering’s recorded Hillview/Mallee conflict |
| CV8 | Not checked  | No comprehensive Australian-English lexical/style review completed. |
| CV7 | Not checked  | Forbidden-word candidates require per-page policy/evidence context; no whole-file pass inferred. |
| CV6 | Fail AF-031 | Single-digit revision suffixes remain |
| CV5 | Not checked  | Amounts and bases extracted; source dataset/money arithmetic not fully reconciled. |
| CV4 | Fail AF-032 | Displayed dates omit the year |
| CV3 | Not checked  | Counts and rules extracted; permission/eligibility datasets needed for complete proof. |
| CV2 | Not checked  | Register text scanned; ellipsis/sideways-scroll behaviour and all line-height properties not extracted. |
| CV1 | Not checked  | ST01/ST02/ST03 standard and register texts read, but all interaction properties and per-page exceptions not exhaustively proved. |
| CT5 | Not applicable  | Library remains unpublished and file keeps local copies; no published version to match. |
| CT4 | Not checked  | Tone naming evidence retained; exhaustive state-to-tone cross-file comparison not yet complete. |
| CT3 | Not checked  | All non-mixed text nodes report Roboto; mixed-run families, all size exceptions/radii/shadows were not resolved. |
| CT2 | Fail AF-034 | Control-state fills are literal colours |
| CT1 | Not checked  | Local component inventories compared for names and shallow structure; component-comparison.json lists every detected group. Deep shape, variant properties and semantic equivalence remain unproved. |
| SH7 | Not checked  | Source record cites earlier named Shell version plus toolbar addition; version history not available, no silent repin. |
| SH6 | Not checked  | Local toolbar components and record instances present; exhaustive record eligibility/primary and phone sticky-bar verification not completed. |
| SH5 | Not checked  | Authority conflict: prompt says 80 px; accepted strip 12 px. Measurements must refer to variant rather than component-set bounds. |
| SH4 | Not checked  | Docked menus and rail texts extracted; all workspace/state combinations not compared with accepted Shell. |
| SH3 | Not checked  | 432 panel/480 total distinction and Library deferred-adoption decision apply; individual drawer tab geometry not fully measured. |
| SH2 | Not checked  | Top-bar text and local instances extracted; exact breakpoint-specific action order not independently resolved. |
| SH1 | Not checked  | Per-sheet local main-component counts and look-alike frame candidates retained; full copied-structure/detachment comparison awaits cross-file analysis. |
| ST5 | Not checked  | Four Read me cards and full index extracted; one-to-one index/record reconciliation not completed. |
| ST4 | Not checked  | Zero direct-child out-of-bounds results; no claim about every nested card or visual clipping. |
| ST3 | Fail AF-035 | Confirmed missing signed-in names on listed labels; other pitch/truncation geometry remains unproved. |
| ST2 | Pass  | All scope pages have six sections in expected order and 360 px gaps; empty sections carry notes. [] |
| ST1 | Pass  | Page order matches proposal template; both separator pages and Scratch return zero children. |

### PPO - Service module

| Check | Result | Reason |
|---|---|---|
| EX1 | Not applicable  | Customer-only rule. |
| GV4 | Pass  | All 288 pending PR917 sheet inventory IDs resolve, including a20sheet sample. Main record has only a page-level incomplete inventory; no main sheet-inventory claim is inferred. |
| GV3 | Not applicable  | These module files are proposals with no owner-accepted named version. |
| GV2 | Pass  | Main decision/status scan found no Figma URLs or any supplied known file key. |
| GV1 | Pass  | Existing scope pages are under Proposals; notes describe proposals. Pending Service completion PR917 is not owner acceptance. |
| RA3 | Not checked  | Accessibility notes and targets described; every target, phone input, keyboard order and alternative text not measured. |
| RA2 | Fail AF-001 | Local accepted toolbar primary text fails 4.5:1 contrast |
| RA1 | Not checked  | All built responsive/state sheets inventoried. Service pending PR917 inventory resolves; main is stale. Portal incomplete sections are not failures. |
| HO3 | Not checked  | Exact preview/current customer output comparison across every sender remains incomplete. |
| HO2 | Not checked  | Staff and customer preview contexts classified; every cross-file page owner not exhaustively proved. |
| HO1 | Not checked  | Portal Hillview invoice431/payment118 match Finance current06:00 read; Portal publication and held-email semantics matched internally. Complete cross-file pair set remains open. |
| FA7 | Fail AF-036 | Gendered pronouns remain in synthetic-person copy |
| FA6 | Not checked  | Service RPT000040 is awaiting Owen Dunne; no literal Today task or Sam Whitlock occurs. My Work exact task comparison is parent-owned; full A3.8 totals unavailable. |
| FA5 | Fail AF-039 | 09:00 Service Pulse shows the 09:06 query as already sent |
| FA4 | Not checked  | Original candidate was removed or held as an authority conflict; see questions. |
| FA3 | Not checked  | Service SYN-INC is a field incident, and Portal SYN-DSP is a dispatch; neither is automatically a forbidden operational-incident/dispute family. Full A3 unavailable. |
| FA2 | Not checked  | No confirmed known earlier-fixture occurrence in Service; Sasha Cole is explicitly Equipment steward, not Service coordinator. |
| FA1 | Not checked  | Cross-file text evidence retained; full A3 one-truth ledger was not supplied. |
| CV8 | Not checked  | No exhaustive Australian-English lexical review completed. |
| CV7 | Not checked  | Forbidden-word candidates contextualised; full page-decision lexical exclusions not exhausted. |
| CV6 | Fail AF-037 | Single-digit revision suffixes remain |
| CV5 | Not checked  | Hillview Portal invoice arithmetic and GST basis agree with Finance; this is a bounded match, not a pass for every amount. |
| CV4 | Fail AF-038 | Displayed dates omit the year |
| CV3 | Not checked  | Counts and query bounds extracted; full permitted-record datasets unavailable. |
| CV2 | Not checked  | All register texts extracted; line-count, overflow and duplicate search mechanics not independently proven. |
| CV1 | Not checked  | ST01 register standards read; all control behaviours and stated page-specific exemptions not fully proven. |
| CT5 | Not applicable  | Library remains unpublished; local copies are in use. |
| CT4 | Not checked  | Full text and component main IDs retained; state-to-tone mapping is not completely resolved for every instance. |
| CT3 | Not checked  | All non-mixed families scanned; not every mixed segment, size exception, radius, shadow or scrim was measured. |
| CT2 | Not checked  | Complete extracted text is available; this composite rule was not fully proved from compact node evidence. |
| CT1 | Not checked  | Local component inventories compared for names and shallow structure; component-comparison.json lists every detected group. Deep shape, variant properties and semantic equivalence remain unproved. |
| SH7 | Not checked  | Service pending record cites10Nov toolbar version; Portal has no completed main module record. Version history not available. |
| SH6 | Not checked  | Toolbar components, per-sheet main counts and text retained; full eligibility/actions and sticky-bar geometry not exhausted. |
| SH5 | Not checked  | Prompt80 px conflicts with accepted12 px collapsed strip variant; component-set bounds must not be mistaken for strip width. |
| SH4 | Not checked  | Menu text and instances retained. Service pending A55 adds Time & labour review and requires a separate Shell alignment decision. |
| SH3 | Not checked  | Accepted 432 px panel plus48 px tabs applies until Library adoption; all panel tab geometry was not remeasured. |
| SH2 | Not checked  | Top-bar text and local instance inventory retained; full breakpoint action order/visibility was not proved. |
| SH1 | Not checked  | Local Shell instance counts retained. Service redrawn flyout109:1112/FL01 is declared as pending A55; the complete geometry comparison to accepted Shell is outstanding. |
| ST5 | Not checked  | Service has Read me cards and index but main inventory is stale versus pending PR 917. |
| ST4 | Not checked  | No direct child escaped a sheet in the extraction. All nested card overlaps and intentional overlays were not exhaustively classified. |
| ST3 | Fail AF-040 | Confirmed missing signed-in names on listed labels; other pitch/truncation geometry remains unproved. |
| ST2 | Pass  | All built scope pages have six ordered sections and 360 px gaps; compact geometry does not measure every internal card. [] |
| ST1 | Pass  | Read me, empty accepted/proposal separators, scope pages under Proposals, kit and empty Scratch are in adopted order. |

### PPO - Finance module

| Check | Result | Reason |
|---|---|---|
| EX1 | Not applicable  | Customer exposure rule applies to Customer portal file only. |
| GV4 | Pass  | 20/20 sampled inventory IDs resolved in full page traversal. |
| GV3 | Not applicable  | Module is a proposal and has no owner-accepted named version. |
| GV2 | Pass  | Repository scan of 920 decision/status files found no Figma file URL or any supplied known key. |
| GV1 | Pass  | Scope pages stay below proposal separator and Read me/module record describe proposal; accepted source labels are citations, not module acceptance. |
| RA3 | Not checked  | Keyboard/focus/target notes extracted; actual target geometry, alt text and mixed font inputs not fully measured. |
| RA2 | Fail AF-001 | Accepted toolbar primary text fails 4.5:1 contrast |
| RA1 | Not checked  | Responsive/state sheets inventoried; exact per-scope exemptions and missing sheet comparison not fully reconciled. |
| HO3 | Not checked  | Cross-file counterpart and ownership comparison belongs to aggregate audit; full A3 unavailable. |
| HO2 | Not checked  | Cross-file counterpart and ownership comparison belongs to aggregate audit; full A3 unavailable. |
| HO1 | Not checked  | Cross-file counterpart and ownership comparison belongs to aggregate audit; full A3 unavailable. |
| FA7 | Fail AF-041 | Gendered pronouns remain in synthetic-person copy |
| FA6 | Not checked  | Full A3.8 queue totals and complete My Work counterpart comparison unavailable. |
| FA5 | Not checked  | Story-clock text extracted; every future event’s local as-at context not fully reconciled. |
| FA4 | Not checked  | Original candidate was removed or held as an authority conflict; see questions. |
| FA3 | Fail AF-043 | Finance disputes still use the superseded SYN-DSP family |
| FA2 | Not checked  | Available earlier-fixture list scanned; complete A3 missing. Prefix matches must preserve Service INC, subcontract SUB and progress CLM exceptions. |
| FA1 | Not checked  | No known failing occurrence confirmed for this check; complete amended A3/source reconciliation remains unavailable. |
| CV8 | Not checked  | No comprehensive Australian-English lexical/style review completed. |
| CV7 | Not checked  | Forbidden-word candidates require per-page policy/evidence context; no whole-file pass inferred. |
| CV6 | Not checked  | No known failing occurrence confirmed for this check; complete amended A3/source reconciliation remains unavailable. |
| CV5 | Not checked  | Amounts and bases extracted; source dataset/money arithmetic not fully reconciled. |
| CV4 | Fail AF-042 | Displayed dates omit the year |
| CV3 | Not checked  | Counts and rules extracted; permission/eligibility datasets needed for complete proof. |
| CV2 | Not checked  | Register text scanned; ellipsis/sideways-scroll behaviour and all line-height properties not extracted. |
| CV1 | Not checked  | ST01/ST02/ST03 standard and register texts read, but all interaction properties and per-page exceptions not exhaustively proved. |
| CT5 | Not applicable  | Library remains unpublished and file keeps local copies; no published version to match. |
| CT4 | Not checked  | Tone naming evidence retained; exhaustive state-to-tone cross-file comparison not yet complete. |
| CT3 | Not checked  | All non-mixed text nodes report Roboto; mixed-run families, all size exceptions/radii/shadows were not resolved. |
| CT2 | Fail AF-044 | Control-state fills are literal colours |
| CT1 | Not checked  | Local component inventories compared for names and shallow structure; component-comparison.json lists every detected group. Deep shape, variant properties and semantic equivalence remain unproved. |
| SH7 | Not checked  | Source record cites earlier named Shell version plus toolbar addition; version history not available, no silent repin. |
| SH6 | Not checked  | Local toolbar components and record instances present; exhaustive record eligibility/primary and phone sticky-bar verification not completed. |
| SH5 | Not checked  | Authority conflict: prompt says 80 px; accepted strip 12 px. Measurements must refer to variant rather than component-set bounds. |
| SH4 | Not checked  | Docked menus and rail texts extracted; all workspace/state combinations not compared with accepted Shell. |
| SH3 | Not checked  | 432 panel/480 total distinction and Library deferred-adoption decision apply; individual drawer tab geometry not fully measured. |
| SH2 | Not checked  | Top-bar text and local instances extracted; exact breakpoint-specific action order not independently resolved. |
| SH1 | Not checked  | Per-sheet local main-component counts and look-alike frame candidates retained; full copied-structure/detachment comparison awaits cross-file analysis. |
| ST5 | Not checked  | Four Read me cards and full index extracted; one-to-one index/record reconciliation not completed. |
| ST4 | Not checked  | Zero direct-child out-of-bounds results; no claim about every nested card or visual clipping. |
| ST3 | Fail AF-045 | Confirmed missing signed-in names on listed labels; other pitch/truncation geometry remains unproved. |
| ST2 | Pass  | All scope pages have six sections in expected order and 360 px gaps; empty sections carry notes. [] |
| ST1 | Pass  | Page order matches proposal template; both separator pages and Scratch return zero children. |

### PPO - Settings module

| Check | Result | Reason |
|---|---|---|
| ST1 | Pass  | Read me;empty Accepted;empty Proposals;all proposal scope pages;Shell and kit;empty Scratch. |
| ST2 | Not checked  | All six section names/order and360px gaps observed; exact grid/padding for full-length and unused-section notes not fully checked. |
| ST3 | Not checked  | 267 labels at x/width matching sheet and y−26,all ENDING; exact grid and scope/persona suffix convention not fully reconciled. |
| ST4 | Not checked  | No sheet/section AABB overlaps or direct children outside; full internal-layer and Read me-card review not performed. |
| ST5 | Pass  | Four Read me cards;all267 current sheet IDs in index and pending completion PR inventory;all resolve. Main build-claim lag is explained by pending PR. |
| SH1 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| SH2 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| SH3 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| SH4 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| SH5 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| SH6 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| SH7 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| CT1 | Not checked  | Local component inventories compared for names and shallow structure; component-comparison.json lists every detected group. Deep shape, variant properties and semantic equivalence remain unproved. |
| CT2 | Fail AF-047 | Confirmed evidence listed in the findings; other subchecks remain bounded. |
| CT3 | Not checked  | All scope font families including mixed runsRoboto; full sizes/radii/shadows/scrims not audited. |
| CT4 | Not checked  | Cross-file aggregation with parent;per-file texts,components and focused evidence provided. |
| CT5 | Not applicable  | Local Shell/Sales copies; Library unpublished and not adopted. |
| CV1 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| CV2 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| CV3 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| CV4 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| CV5 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| CV6 | Fail AF-046 | Confirmed evidence listed in the findings; other subchecks remain bounded. |
| CV7 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| CV8 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| FA1 | Not checked  | Full A3 unavailable. All scope text retained; focused ledger facts checked but complete fact coverage is impossible. |
| FA2 | Not checked  | No obvious earlier-person candidates;contextual role and fullA3 reconciliation incomplete. REL releases and EXC Finance exceptions not false-flagged. |
| FA3 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| FA4 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| FA5 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| FA6 | Not checked  | Assistant settings recurring-check capability does not establish an incorrect My Work menu owner; full queue ledger unavailable. |
| FA7 | Pass  | All scope and Read me text scanned;no gendered-pronoun candidate for a synthetic person. |
| HO1 | Not checked  | Cross-file aggregation with parent;per-file texts,components and focused evidence provided. |
| HO2 | Not checked  | Cross-file aggregation with parent;per-file texts,components and focused evidence provided. |
| HO3 | Not checked  | Cross-file aggregation with parent;per-file texts,components and focused evidence provided. |
| RA1 | Pass  | All267 recorded current scope sheets including listed responsive/state sheets resolve against pending completion record. |
| RA2 | Fail AF-001 | Confirmed evidence listed in the findings; other subchecks remain bounded. |
| RA3 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| GV1 | Pass  | Current proposal labels,placement andRead me agree;pending PR explains main claim-only/in-progress metadata. |
| GV2 | Not checked  | Parent repository sweep owns whole-main link/key scan. |
| GV3 | Not applicable  | Proposal not accepted;no accepted named-version obligation claimed. |
| GV4 | Pass  | All267 current sheet IDs from pending completion PR resolve,exceeding20-node sample. Main My Work has only a claim; not treated as missing accepted inventory. |
| EX1 | Not applicable  | Customer-portal-only matrix check. |

### PPO - Reporting module

| Check | Result | Reason |
|---|---|---|
| ST1 | Pass  | 17 pages in adopted order; four Read me cards; both separator pages and Scratch report zero children. |
| ST2 | Pass  | All11 scope pages have six sections in prescribed y-order, same x and360px gaps; container geometry extracted. |
| ST3 | Not checked  | All221 label positions and x-grid positions checked with no anomalies; full label/persona convention and variable-height y-row pitch require reconciliation with recorded full-length sheets. |
| ST4 | Not checked  | No scope frame overlaps or direct-child overflow; nested-card/label visual collision proof not exhaustive. |
| ST5 | Pass  | Four Read me cards and221 current record inventory IDs all resolve; live scope frame count221 matches inventory. |
| SH1 | Fail AF-050 | Confirmed evidence; remaining subchecks may be incomplete. |
| SH2 | Not checked  | Full check not established by extracted text/geometry; see evidence and limits. |
| SH3 | Not checked  | Shared width transition resolved in Library record; full per-drawer geometry not compared. |
| SH4 | Not checked  | Full check not established by extracted text/geometry; see evidence and limits. |
| SH5 | Not checked  | Authority conflict AC-strip: prompt80px vs accepted12px variants; actual Shell-set width80is not strip width. |
| SH6 | Not checked  | Representative definition header44:1819 wraps correct A1 instance44:1820, with Actions/Outputs and state-driven primary; all record states not separately verified. |
| SH7 | Not checked  | Full check not established by extracted text/geometry; see evidence and limits. |
| CT1 | Not checked  | Local component inventories compared for names and shallow structure; component-comparison.json lists every detected group. Deep shape, variant properties and semantic equivalence remain unproved. |
| CT2 | Not checked  | Heuristic count1651 literal fills and752 literal strokes across scope pages excludes Shell/Phone/Brand-named ancestors but may include copied icon/menu internals; full provenance-qualified count not established. |
| CT3 | Not checked  | Full check not established by extracted text/geometry; see evidence and limits. |
| CT4 | Fail AF-072 | Full check not established by extracted text/geometry; see evidence and limits. |
| CT5 | Not checked  | Library file link absent; current repository says Library unpublished. |
| CV1 | Not checked  | Full check not established by extracted text/geometry; see evidence and limits. |
| CV2 | Not checked  | Full check not established by extracted text/geometry; see evidence and limits. |
| CV3 | Not checked  | Full check not established by extracted text/geometry; see evidence and limits. |
| CV4 | Not checked  | Date-style and timezone semantics not exhaustively reconciled; one ISO-date source annotation observed but not triaged as current app data. |
| CV5 | Not checked  | Full check not established by extracted text/geometry; see evidence and limits. |
| CV6 | Fail AF-048 | Confirmed evidence; remaining subchecks may be incomplete. |
| CV7 | Not checked  | Full check not established by extracted text/geometry; see evidence and limits. |
| CV8 | Not checked  | Full check not established by extracted text/geometry; see evidence and limits. |
| FA1 | Fail AF-073,AF-074 | Full amended A3 and canonical ledger missing; available facts inspected, including RPT-002. |
| FA2 | Not checked  | Full check not established by extracted text/geometry; see evidence and limits. |
| FA3 | Not checked  | Full check not established by extracted text/geometry; see evidence and limits. |
| FA4 | Not checked  | Signed-in roles require fullA3; labels mainly cite source frame provenance rather than explicit signed-in person. |
| FA5 | Fail AF-049 | Confirmed evidence; remaining subchecks may be incomplete. |
| FA6 | Not checked  | Full A3.8 per-person queue totals unavailable. |
| FA7 | Pass  | All34,237 scope text nodes and808 Read me texts scanned for gendered pronouns; none in scope current text. |
| HO1 | Fail AF-073,AF-074 | Cross-file pair reconciliation pending; full A3 unavailable. |
| HO2 | Not checked  | Full check not established by extracted text/geometry; see evidence and limits. |
| HO3 | Not checked  | Full check not established by extracted text/geometry; see evidence and limits. |
| RA1 | Pass  | All221 inventory sheets/cards resolve; each scope includes its recorded States, Tablet and Phone sections. |
| RA2 | Fail AF-001 | Confirmed evidence; remaining subchecks may be incomplete. |
| RA3 | Not checked  | Target sizes, focus order and image alternatives not exhaustively measured. |
| GV1 | Not checked  | Proposal page position matches current record; all header wording not fully classified. |
| GV2 | Pass  | All920 decision/status source files scanned; no Figma URLs or15 supplied file keys. |
| GV3 | Not applicable  | Reporting is a proposal; no accepted named version. |
| GV4 | Pass  | All221 current inventory node IDs resolve, exceeding20-node sample. |
| EX1 | Not applicable  | Customer-portal-only check. |

### PPO - My Work module

| Check | Result | Reason |
|---|---|---|
| ST1 | Pass  | Read me;empty Accepted;empty Proposals;all proposal scope pages;Shell and kit;empty Scratch. |
| ST2 | Not checked  | All six section names/order and360px gaps observed; exact grid/padding for full-length and unused-section notes not fully checked. |
| ST3 | Fail AF-054 | Confirmed evidence listed in the findings; other subchecks remain bounded. |
| ST4 | Fail AF-054 | RH04 label overlaps preceding RH03; sheet/section AABBs and direct children otherwise pass. Full internal-layer review not performed. |
| ST5 | Pass  | Four Read me cards;all137 current sheet IDs in index and pending completion PR inventory;all resolve. Main build-claim lag is explained by pending PR. |
| SH1 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| SH2 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| SH3 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| SH4 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| SH5 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| SH6 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| SH7 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| CT1 | Not checked  | Local component inventories compared for names and shallow structure; component-comparison.json lists every detected group. Deep shape, variant properties and semantic equivalence remain unproved. |
| CT2 | Fail AF-055 | Confirmed evidence listed in the findings; other subchecks remain bounded. |
| CT3 | Not checked  | All scope font families including mixed runsRoboto; full sizes/radii/shadows/scrims not audited. |
| CT4 | Not checked  | Cross-file aggregation with parent;per-file texts,components and focused evidence provided. |
| CT5 | Not applicable  | Local Shell/Sales copies; Library unpublished and not adopted. |
| CV1 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| CV2 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| CV3 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| CV4 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| CV5 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| CV6 | Fail AF-051 | Confirmed evidence listed in the findings; other subchecks remain bounded. |
| CV7 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| CV8 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| FA1 | Not checked  | Full A3 unavailable. All scope text retained; focused ledger facts checked but complete fact coverage is impossible. |
| FA2 | Not checked  | No obvious earlier-person candidates;contextual role and fullA3 reconciliation incomplete. REL releases and EXC Finance exceptions not false-flagged. |
| FA3 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| FA4 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| FA5 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| FA6 | Fail AF-053 | Confirmed evidence listed in the findings; other subchecks remain bounded. |
| FA7 | Fail AF-052 | Confirmed evidence listed in the findings; other subchecks remain bounded. |
| HO1 | Not checked  | Cross-file aggregation with parent;per-file texts,components and focused evidence provided. |
| HO2 | Not checked  | Cross-file aggregation with parent;per-file texts,components and focused evidence provided. |
| HO3 | Not checked  | Cross-file aggregation with parent;per-file texts,components and focused evidence provided. |
| RA1 | Pass  | All137 recorded current scope sheets including listed responsive/state sheets resolve against pending completion record. |
| RA2 | Fail AF-001 | Confirmed evidence listed in the findings; other subchecks remain bounded. |
| RA3 | Not checked  | Full rule not established by property/text extraction; no unqualified Pass claimed. |
| GV1 | Pass  | Current proposal labels,placement andRead me agree;pending PR explains main claim-only/in-progress metadata. |
| GV2 | Not checked  | Parent repository sweep owns whole-main link/key scan. |
| GV3 | Not applicable  | Proposal not accepted;no accepted named-version obligation claimed. |
| GV4 | Pass  | All137 current sheet IDs from pending completion PR resolve,exceeding20-node sample. Main My Work has only a claim; not treated as missing accepted inventory. |
| EX1 | Not applicable  | Customer-portal-only matrix check. |

### PPO - Customers, Sites & Equipment module

| Check | Result | Reason |
|---|---|---|
| ST1 | Pass  | Proposal page order verified; separators and Scratch independently read and empty. |
| ST2 | Pass  | Every existing scope page has all six sections in the adopted order, with measured 360 px gaps. |
| ST3 | Fail AF-059 | Confirmed evidence in the listed findings; authority conflicts and unexamined remainder stay explicit. |
| ST4 | Not checked  | All direct children are inside sheets; label bounds and x-grid checked. Exhaustive nested sibling overlap/rendered clipping has not been verified. |
| ST5 | Fail AF-060 | Confirmed evidence in the listed findings; authority conflicts and unexamined remainder stay explicit. |
| SH1 | Not checked  | Full check not established by the structural/text extraction; see progress limits and parent cross-file analysis. |
| SH2 | Not checked  | Full check not established by the structural/text extraction; see progress limits and parent cross-file analysis. |
| SH3 | Not checked  | 432 px content plus 48 px tabs explains the accepted 480 px total. Unpublished Library sizing does not automatically replace accepted modules; full page-by-page drawer verification not done. |
| SH4 | Not checked  | Shared records docked component [node ID retained in scratch] is expressly proposed in A2/Read me. The complete accepted More/Shared records entry comparison is not established; do not treat the proposal as an unrecorded defect. |
| SH5 | Not checked  | The local accepted collapsed component is 12 px and the file documents the prompt’s 80 px conflict. Full per-sheet adoption was not independently proved; do not fail accepted 12 px. |
| SH6 | Not checked  | Full check not established by the structural/text extraction; see progress limits and parent cross-file analysis. |
| SH7 | Not checked  | Sources name the accepted Shell and toolbar but not an exact named version; incomplete main/PR handoff is kept distinct from a current-drawing defect. |
| CT1 | Not checked  | Local component inventories compared for names and shallow structure; component-comparison.json lists every detected group. Deep shape, variant properties and semantic equivalence remain unproved. |
| CT2 | Fail AF-056 | Confirmed evidence in the listed findings; authority conflicts and unexamined remainder stay explicit. |
| CT3 | Not checked  | All 15,709 visible text nodes, including every mixed-font segment, use Roboto. Full size/radius/shadow/phone-input compliance was not established. |
| CT4 | Not checked  | Full check not established by the structural/text extraction; see progress limits and parent cross-file analysis. |
| CT5 | Not applicable  | Local copies are retained. Library is unpublished; there is no published Library version to compare. |
| CV1 | Not checked  | Full check not established by the structural/text extraction; see progress limits and parent cross-file analysis. |
| CV2 | Not checked  | Full check not established by the structural/text extraction; see progress limits and parent cross-file analysis. |
| CV3 | Not checked  | Full check not established by the structural/text extraction; see progress limits and parent cross-file analysis. |
| CV4 | Not checked  | Full check not established by the structural/text extraction; see progress limits and parent cross-file analysis. |
| CV5 | Not checked  | Full check not established by the structural/text extraction; see progress limits and parent cross-file analysis. |
| CV6 | Fail AF-057 | Confirmed evidence in the listed findings; authority conflicts and unexamined remainder stay explicit. |
| CV7 | Fail AF-058 | Confirmed evidence in the listed findings; authority conflicts and unexamined remainder stay explicit. |
| CV8 | Not checked  | Full check not established by the structural/text extraction; see progress limits and parent cross-file analysis. |
| FA1 | Not checked  | Full A3 ledger is unavailable. The extracted named facts and handovers are available to parent cross-file analysis; no complete pass inferred from the absence of simple regex matches. |
| FA2 | Not checked  | Full A3 ledger is unavailable. The extracted named facts and handovers are available to parent cross-file analysis; no complete pass inferred from the absence of simple regex matches. |
| FA3 | Not checked  | Full A3 ledger is unavailable. The extracted named facts and handovers are available to parent cross-file analysis; no complete pass inferred from the absence of simple regex matches. |
| FA4 | Fail AF-059 | Confirmed evidence in the listed findings; authority conflicts and unexamined remainder stay explicit. |
| FA5 | Not checked  | Full A3 ledger is unavailable. The extracted named facts and handovers are available to parent cross-file analysis; no complete pass inferred from the absence of simple regex matches. |
| FA6 | Not checked  | Full A3 ledger is unavailable. The extracted named facts and handovers are available to parent cross-file analysis; no complete pass inferred from the absence of simple regex matches. |
| FA7 | Pass  | Every visible extracted text node scanned; no gendered pronoun for a synthetic person remains. |
| HO1 | Not checked  | Full A3 ledger is unavailable. The extracted named facts and handovers are available to parent cross-file analysis; no complete pass inferred from the absence of simple regex matches. |
| HO2 | Not checked  | Full check not established by the structural/text extraction; see progress limits and parent cross-file analysis. |
| HO3 | Not checked  | Full A3 ledger is unavailable. The extracted named facts and handovers are available to parent cross-file analysis; no complete pass inferred from the absence of simple regex matches. |
| RA1 | Pass  | All 184 sheets in the proposed inventory resolve, including its states, tablets and phones at 390/320. |
| RA2 | Fail AF-001 | Confirmed evidence in the listed findings; authority conflicts and unexamined remainder stay explicit. |
| RA3 | Not checked  | Full check not established by the structural/text extraction; see progress limits and parent cross-file analysis. |
| GV1 | Pass  | Read me and scope placement say proposal, matching the current claim/proposed continuation record; no acceptance inferred. |
| GV2 | Not checked  | Parent repository sweep owns the complete main-branch record/status link and key scan. |
| GV3 | Not applicable  | The file remains a proposal; no accepted named version is claimed. |
| GV4 | Pass  | All 184 IDs in the separately identified proposed PR #916 inventory resolve in the full extraction; current main has no sheet inventory and is not presented as complete. |
| EX1 | Not applicable  | This check applies only to the Customer portal file. |

### PPO - Documents & messages module

| Check | Result | Reason |
|---|---|---|
| ST1 | Pass  | Proposal page order verified; separators and Scratch independently read and empty. |
| ST2 | Pass  | Every existing scope page has all six sections in the adopted order, with measured 360 px gaps. |
| ST3 | Not checked  | All 198 UI-sheet labels name the signed-in person; four specification-board labels explicitly identify the board instead. Geometry passes the module’s measured label/x-grid convention; full prompt row spacing has not been established. |
| ST4 | Not checked  | All direct children are inside sheets; label bounds and x-grid checked. Exhaustive nested sibling overlap/rendered clipping has not been verified. |
| ST5 | Not checked  | Read me index and audit cards are unfinished, as draft PR #918 explicitly records. Existing 202 sheets and 7 notes cards were extracted; missing index content is not failed. |
| SH1 | Fail AF-061 | Confirmed evidence in the listed findings; authority conflicts and unexamined remainder stay explicit. |
| SH2 | Not checked  | Full check not established by the structural/text extraction; see progress limits and parent cross-file analysis. |
| SH3 | Not checked  | 432 px content plus 48 px tabs explains the accepted 480 px total. Unpublished Library sizing does not automatically replace accepted modules; full page-by-page drawer verification not done. |
| SH4 | Fail AF-061 | Confirmed evidence in the listed findings; authority conflicts and unexamined remainder stay explicit. |
| SH5 | Not checked  | The local accepted collapsed component is 12 px and the file documents the prompt’s 80 px conflict. Full per-sheet adoption was not independently proved; do not fail accepted 12 px. |
| SH6 | Not checked  | Full check not established by the structural/text extraction; see progress limits and parent cross-file analysis. |
| SH7 | Not checked  | Read me and proposed PR #918 explicitly cite the latest 10 November toolbar version; no current main record exists yet, so complete record compliance remains unfinished. |
| CT1 | Not checked  | Local component inventories compared for names and shallow structure; component-comparison.json lists every detected group. Deep shape, variant properties and semantic equivalence remain unproved. |
| CT2 | Fail AF-062 | Confirmed evidence in the listed findings; authority conflicts and unexamined remainder stay explicit. |
| CT3 | Not checked  | All 21,291 visible text nodes, including every mixed-font segment, use Roboto. Full size/radius/shadow/phone-input compliance was not established. |
| CT4 | Not checked  | Full check not established by the structural/text extraction; see progress limits and parent cross-file analysis. |
| CT5 | Not applicable  | Local copies are retained. Library is unpublished; there is no published Library version to compare. |
| CV1 | Not checked  | Full check not established by the structural/text extraction; see progress limits and parent cross-file analysis. |
| CV2 | Not checked  | Full check not established by the structural/text extraction; see progress limits and parent cross-file analysis. |
| CV3 | Not checked  | Full check not established by the structural/text extraction; see progress limits and parent cross-file analysis. |
| CV4 | Fail AF-065 | Confirmed evidence in the listed findings; authority conflicts and unexamined remainder stay explicit. |
| CV5 | Not checked  | Full check not established by the structural/text extraction; see progress limits and parent cross-file analysis. |
| CV6 | Fail AF-063 | Confirmed evidence in the listed findings; authority conflicts and unexamined remainder stay explicit. |
| CV7 | Not checked  | Full check not established by the structural/text extraction; see progress limits and parent cross-file analysis. |
| CV8 | Not checked  | Full check not established by the structural/text extraction; see progress limits and parent cross-file analysis. |
| FA1 | Not checked  | Full A3 ledger is unavailable. The extracted named facts and handovers are available to parent cross-file analysis; no complete pass inferred from the absence of simple regex matches. |
| FA2 | Not checked  | Full A3 ledger is unavailable. The extracted named facts and handovers are available to parent cross-file analysis; no complete pass inferred from the absence of simple regex matches. |
| FA3 | Not checked  | Full A3 ledger is unavailable. The extracted named facts and handovers are available to parent cross-file analysis; no complete pass inferred from the absence of simple regex matches. |
| FA4 | Not checked  | Full check not established by the structural/text extraction; see progress limits and parent cross-file analysis. |
| FA5 | Not checked  | Full A3 ledger is unavailable. The extracted named facts and handovers are available to parent cross-file analysis; no complete pass inferred from the absence of simple regex matches. |
| FA6 | Not checked  | Full A3 ledger is unavailable. The extracted named facts and handovers are available to parent cross-file analysis; no complete pass inferred from the absence of simple regex matches. |
| FA7 | Fail AF-064 | Confirmed evidence in the listed findings; authority conflicts and unexamined remainder stay explicit. |
| HO1 | Not checked  | Full A3 ledger is unavailable. The extracted named facts and handovers are available to parent cross-file analysis; no complete pass inferred from the absence of simple regex matches. |
| HO2 | Not checked  | Full check not established by the structural/text extraction; see progress limits and parent cross-file analysis. |
| HO3 | Not checked  | Full A3 ledger is unavailable. The extracted named facts and handovers are available to parent cross-file analysis; no complete pass inferred from the absence of simple regex matches. |
| RA1 | Not checked  | States/tablets/phones are drawn and extracted, but the original required inventory is missing and PR #918 is explicitly incomplete. |
| RA2 | Fail AF-001 | Confirmed evidence in the listed findings; authority conflicts and unexamined remainder stay explicit. |
| RA3 | Not checked  | Full check not established by the structural/text extraction; see progress limits and parent cross-file analysis. |
| GV1 | Pass  | Read me and scope placement say proposal, matching the current claim/proposed continuation record; no acceptance inferred. |
| GV2 | Not checked  | Parent repository sweep owns the complete main-branch record/status link and key scan. |
| GV3 | Not applicable  | The file remains a proposal; no accepted named version is claimed. |
| GV4 | Not checked  | No main record or completed proposed inventory exists. Draft PR #918 explicitly says incomplete, so no 20 recorded IDs can be sampled; all existing sheets were still extracted. |
| EX1 | Not applicable  | This check applies only to the Customer portal file. |

### PPO - Customer portal module

| Check | Result | Reason |
|---|---|---|
| EX1 | Not checked  | Full customer-sheet text scanned for the supplied internal-reference/word list; no confirmed disclosure beyond retired quotation-family text. Staff notes/previews are not customer exposure; full A3.11 list, all grant scopes and non-text evidence remain unavailable. |
| GV4 | Not checked  | No Customer portal refined-module record exists on main, so no recorded inventory to sample; all built sheet IDs retained. |
| GV3 | Not applicable  | These module files are proposals with no owner-accepted named version. |
| GV2 | Pass  | Main decision/status scan found no Figma URLs or any supplied known file key. |
| GV1 | Pass  | Existing scope pages are under Proposals; notes describe proposals. Pending Service completion PR917 is not owner acceptance. |
| RA3 | Not checked  | Accessibility notes and targets described; every target, phone input, keyboard order and alternative text not measured. |
| RA2 | Fail AF-001 | Local accepted toolbar primary text fails 4.5:1 contrast |
| RA1 | Not checked  | All built responsive/state sheets inventoried. Service pending PR917 inventory resolves; main is stale. Portal incomplete sections are not failures. |
| HO3 | Not checked  | Exact preview/current customer output comparison across every sender remains incomplete. |
| HO2 | Not checked  | Staff and customer preview contexts classified; every cross-file page owner not exhaustively proved. |
| HO1 | Not checked  | Portal Hillview invoice431/payment118 match Finance current06:00 read; Portal publication and held-email semantics matched internally. Complete cross-file pair set remains open. |
| FA7 | Fail AF-066 | Gendered pronouns remain in synthetic-person copy |
| FA6 | Not checked  | Service RPT000040 is awaiting Owen Dunne; no literal Today task or Sam Whitlock occurs. My Work exact task comparison is parent-owned; full A3.8 totals unavailable. |
| FA5 | Not checked  | Later Service work-order frames explicitly say13:20; Portal Update4 is published09:40 and displayed in09:45/09:47 later frames. All event clocks not proved. |
| FA4 | Not checked  | Service uses Ravi coordinator and phone Casey defaults; Portal labels name customer/staff. Complete role ledger and every label reconciliation unavailable. |
| FA3 | Not checked  | Service SYN-INC is a field incident, and Portal SYN-DSP is a dispatch; neither is automatically a forbidden operational-incident/dispute family. Full A3 unavailable. |
| FA2 | Fail AF-069 | Current quotations still use retired SYN-PPO catalogue-form references |
| FA1 | Not checked  | Cross-file text evidence retained; full A3 one-truth ledger was not supplied. |
| CV8 | Not checked  | No exhaustive Australian-English lexical review completed. |
| CV7 | Not checked  | Forbidden-word candidates contextualised; full page-decision lexical exclusions not exhausted. |
| CV6 | Fail AF-067 | Single-digit revision suffixes remain |
| CV5 | Not checked  | Hillview Portal invoice arithmetic and GST basis agree with Finance; this is a bounded match, not a pass for every amount. |
| CV4 | Fail AF-068,AF-070 | Quotation issue and validity weekdays disagree with 2026 dates |
| CV3 | Not checked  | Counts and query bounds extracted; full permitted-record datasets unavailable. |
| CV2 | Not checked  | All register texts extracted; line-count, overflow and duplicate search mechanics not independently proven. |
| CV1 | Not checked  | ST01 register standards read; all control behaviours and stated page-specific exemptions not fully proven. |
| CT5 | Not applicable  | Library remains unpublished; local copies are in use. |
| CT4 | Not checked  | Full text and component main IDs retained; state-to-tone mapping is not completely resolved for every instance. |
| CT3 | Not checked  | All non-mixed families scanned; not every mixed segment, size exception, radius, shadow or scrim was measured. |
| CT2 | Fail AF-071 | Placeholder fill and stroke are literal colours |
| CT1 | Not checked  | Local component inventories compared for names and shallow structure; component-comparison.json lists every detected group. Deep shape, variant properties and semantic equivalence remain unproved. |
| SH7 | Not checked  | Service pending record cites10Nov toolbar version; Portal has no completed main module record. Version history not available. |
| SH6 | Not checked  | Toolbar components, per-sheet main counts and text retained; full eligibility/actions and sticky-bar geometry not exhausted. |
| SH5 | Not checked  | Prompt80 px conflicts with accepted12 px collapsed strip variant; component-set bounds must not be mistaken for strip width. |
| SH4 | Not checked  | Portal staff workspace menu is proposed; full comparison to accepted More/flyout definition belongs to the aggregate audit. |
| SH3 | Not checked  | Accepted 432 px panel plus48 px tabs applies until Library adoption; all panel tab geometry was not remeasured. |
| SH2 | Not checked  | Top-bar text and local instance inventory retained; full breakpoint action order/visibility was not proved. |
| SH1 | Not checked  | Customer-facing chrome is intentionally its own portal shell; staff local Shell instances are retained. Full accepted component comparison remains outstanding. |
| ST5 | Not checked  | Customer portal is still in progress; Read me is empty and no refined-module record exists on main. Unbuilt documentation is not a failure. |
| ST4 | Not checked  | No direct child escaped a sheet in the extraction. All nested card overlaps and intentional overlays were not exhaustively classified. |
| ST3 | Not checked  | All sheet container and label geometry retained; individual label persona, truncation, pitch and padding not fully checked. |
| ST2 | Pass  | All built scope pages have six ordered sections and 360 px gaps; compact geometry does not measure every internal card. [] |
| ST1 | Pass  | Read me, empty accepted/proposal separators, scope pages under Proposals, kit and empty Scratch are in adopted order. |

### PPO - Assistant, Knowledge and Help

| Check | Result | Reason |
|---|---|---|
| ST1 | Not checked  | No supplied file location; file existence and content not verified. |
| ST2 | Not checked  | No supplied file location; file existence and content not verified. |
| ST3 | Not checked  | No supplied file location; file existence and content not verified. |
| ST4 | Not checked  | No supplied file location; file existence and content not verified. |
| ST5 | Not checked  | No supplied file location; file existence and content not verified. |
| SH1 | Not checked  | No supplied file location; file existence and content not verified. |
| SH2 | Not checked  | No supplied file location; file existence and content not verified. |
| SH3 | Not checked  | No supplied file location; file existence and content not verified. |
| SH4 | Not checked  | No supplied file location; file existence and content not verified. |
| SH5 | Not checked  | No supplied file location; file existence and content not verified. |
| SH6 | Not checked  | No supplied file location; file existence and content not verified. |
| SH7 | Not checked  | No supplied file location; file existence and content not verified. |
| CT1 | Not checked  | Local component inventories compared for names and shallow structure; component-comparison.json lists every detected group. Deep shape, variant properties and semantic equivalence remain unproved. |
| CT2 | Not checked  | No supplied file location; file existence and content not verified. |
| CT3 | Not checked  | No supplied file location; file existence and content not verified. |
| CT4 | Not checked  | No supplied file location; file existence and content not verified. |
| CT5 | Not checked  | No supplied file location; file existence and content not verified. |
| CV1 | Not checked  | No supplied file location; file existence and content not verified. |
| CV2 | Not checked  | No supplied file location; file existence and content not verified. |
| CV3 | Not checked  | No supplied file location; file existence and content not verified. |
| CV4 | Not checked  | No supplied file location; file existence and content not verified. |
| CV5 | Not checked  | No supplied file location; file existence and content not verified. |
| CV6 | Not checked  | No supplied file location; file existence and content not verified. |
| CV7 | Not checked  | No supplied file location; file existence and content not verified. |
| CV8 | Not checked  | No supplied file location; file existence and content not verified. |
| FA1 | Not checked  | No supplied file location; file existence and content not verified. |
| FA2 | Not checked  | No supplied file location; file existence and content not verified. |
| FA3 | Not checked  | No supplied file location; file existence and content not verified. |
| FA4 | Not checked  | No supplied file location; file existence and content not verified. |
| FA5 | Not checked  | No supplied file location; file existence and content not verified. |
| FA6 | Not checked  | No supplied file location; file existence and content not verified. |
| FA7 | Not checked  | No supplied file location; file existence and content not verified. |
| HO1 | Not checked  | No supplied file location; file existence and content not verified. |
| HO2 | Not checked  | No supplied file location; file existence and content not verified. |
| HO3 | Not checked  | No supplied file location; file existence and content not verified. |
| RA1 | Not checked  | No supplied file location; file existence and content not verified. |
| RA2 | Not checked  | No supplied file location; file existence and content not verified. |
| RA3 | Not checked  | No supplied file location; file existence and content not verified. |
| GV1 | Not checked  | No supplied file location; file existence and content not verified. |
| GV2 | Not checked  | No supplied file location; file existence and content not verified. |
| GV3 | Not checked  | No supplied file location; file existence and content not verified. |
| GV4 | Not checked  | No supplied file location; file existence and content not verified. |
| EX1 | Not checked  | No supplied file location; file existence and content not verified. |

### PPO - Products module

| Check | Result | Reason |
|---|---|---|
| ST1 | Not checked  | No supplied file location; file existence and content not verified. |
| ST2 | Not checked  | No supplied file location; file existence and content not verified. |
| ST3 | Not checked  | No supplied file location; file existence and content not verified. |
| ST4 | Not checked  | No supplied file location; file existence and content not verified. |
| ST5 | Not checked  | No supplied file location; file existence and content not verified. |
| SH1 | Not checked  | No supplied file location; file existence and content not verified. |
| SH2 | Not checked  | No supplied file location; file existence and content not verified. |
| SH3 | Not checked  | No supplied file location; file existence and content not verified. |
| SH4 | Not checked  | No supplied file location; file existence and content not verified. |
| SH5 | Not checked  | No supplied file location; file existence and content not verified. |
| SH6 | Not checked  | No supplied file location; file existence and content not verified. |
| SH7 | Not checked  | No supplied file location; file existence and content not verified. |
| CT1 | Not checked  | Local component inventories compared for names and shallow structure; component-comparison.json lists every detected group. Deep shape, variant properties and semantic equivalence remain unproved. |
| CT2 | Not checked  | No supplied file location; file existence and content not verified. |
| CT3 | Not checked  | No supplied file location; file existence and content not verified. |
| CT4 | Not checked  | No supplied file location; file existence and content not verified. |
| CT5 | Not checked  | No supplied file location; file existence and content not verified. |
| CV1 | Not checked  | No supplied file location; file existence and content not verified. |
| CV2 | Not checked  | No supplied file location; file existence and content not verified. |
| CV3 | Not checked  | No supplied file location; file existence and content not verified. |
| CV4 | Not checked  | No supplied file location; file existence and content not verified. |
| CV5 | Not checked  | No supplied file location; file existence and content not verified. |
| CV6 | Not checked  | No supplied file location; file existence and content not verified. |
| CV7 | Not checked  | No supplied file location; file existence and content not verified. |
| CV8 | Not checked  | No supplied file location; file existence and content not verified. |
| FA1 | Not checked  | No supplied file location; file existence and content not verified. |
| FA2 | Not checked  | No supplied file location; file existence and content not verified. |
| FA3 | Not checked  | No supplied file location; file existence and content not verified. |
| FA4 | Not checked  | No supplied file location; file existence and content not verified. |
| FA5 | Not checked  | No supplied file location; file existence and content not verified. |
| FA6 | Not checked  | No supplied file location; file existence and content not verified. |
| FA7 | Not checked  | No supplied file location; file existence and content not verified. |
| HO1 | Not checked  | No supplied file location; file existence and content not verified. |
| HO2 | Not checked  | No supplied file location; file existence and content not verified. |
| HO3 | Not checked  | No supplied file location; file existence and content not verified. |
| RA1 | Not checked  | No supplied file location; file existence and content not verified. |
| RA2 | Not checked  | No supplied file location; file existence and content not verified. |
| RA3 | Not checked  | No supplied file location; file existence and content not verified. |
| GV1 | Not checked  | No supplied file location; file existence and content not verified. |
| GV2 | Not checked  | No supplied file location; file existence and content not verified. |
| GV3 | Not checked  | No supplied file location; file existence and content not verified. |
| GV4 | Not checked  | No supplied file location; file existence and content not verified. |
| EX1 | Not checked  | No supplied file location; file existence and content not verified. |

## Output manifest

Scratch root: `/workspace/work/figma-audit/deliverables/`. Files: `alignment-matrix.csv`, `findings.csv`, `findings.json`, `matrix.json`, `ledger-diff.md`, `questions-for-dean.md`, `report.md`, `component-comparison.json`, `alignment-briefs/` (one Markdown brief for each15 module files plus Shell), and `alignment-audit-bundle.zip`. Source/extraction evidence and progress remain under `/workspace/work/figma-audit/`.

The designated chat output directory is unavailable in this environment (filesystem permission denial, including the attempted escalation). Standalone downloadable delivery was not achieved. The draft PR carries this reviewable report and concise alignment-batch appendix within the two authorised repository files; the complete node-level files remain in session scratch.

## Per-file alignment briefs

### Alignment batch · PPO - Sales module (accepted)

- **AF-002 (Blocker):** Replace current rN labels with r0N, retaining the same revision identity. Expected: r01, r02 and corresponding two-digit revisions Verify: re-extract CV6 and compare all affected variants/counterparts against the agreed expected value.
- **AF-003 (Blocker):** Use the bounded count wording and remove total-based view counts and pagination from PR01 and TB08. Expected: 12 shown · limit 100; no total/view-tile totals/pager on a bounded read Verify: re-extract CV3 and compare all affected variants/counterparts against the agreed expected value.
- **AF-004 (Blocker):** Map each product to the full A3.13 catalogue before replacing its obsolete reference; do not invent replacement numbers. Expected: Short family references from A2; exact product-family mapping requires full A3.13 Verify: re-extract CV6 and compare all affected variants/counterparts against the agreed expected value.
- **AF-005 (Blocker):** Replace Noah Clarke with Noah Patel everywhere that the same synthetic person appears. Expected: Noah Patel Verify: re-extract FA2 and compare all affected variants/counterparts against the agreed expected value.
- **AF-006 (Blocker):** Use their for each possessive her, preserving the meaning. Expected: Names or they/them/their Verify: re-extract FA7 and compare all affected variants/counterparts against the agreed expected value.
- **AF-008 (Blocker):** Adopt the accepted A1 header across the record-page batch, including phone sticky actions, and save a new named version. Expected: A1/R116–R125 record header: previous/next in view, Actions, Outputs where relevant and one state-driven primary Verify: re-extract SH6 and compare all affected variants/counterparts against the agreed expected value.
- **AF-009 (Blocker):** Bind each non-exempt solid paint to the matching PPO colour variable, preserving its current opacity. Expected: PPO colour variable binding; preserve opacity; known forecast ramp and plain scrims remain declared exceptions Verify: re-extract CT2 and compare all affected variants/counterparts against the agreed expected value.
- **AF-011 (Blocker):** Change due in 3 h to due in 5 h on the nine copies, or label an explicitly later story frame if its clock intentionally differs. Expected: today, 14:00 · due in 5 h at Thu 5 Nov 2026, 09:00 Verify: re-extract FA5 and compare all affected variants/counterparts against the agreed expected value.
- **AF-077 (Blocker):** Verify Figma history, save a uniquely named version only if needed, and cite that exact version in a separate Sales record amendment before build handoff. Expected: A uniquely named version is recorded for the accepted Tue 10 Nov phone-bar change before build handoff. Verify: re-extract GV3 and compare all affected variants/counterparts against the agreed expected value.
- **AF-074 (Major):** Confirm the intended A3 stage ledger and pipeline/as-at basis, then align every board, Insights extract, report and drill; preserve accepted Sales until the owner resolves the conflict and saves a new named version for any change. Expected: The same as-at story, permitted population and pipeline version must yield the same stage distribution; owner-accepted Sales and later proposed/A3-derived counts cannot be silently reconciled. Verify: re-extract HO1, FA1 and compare all affected variants/counterparts against the agreed expected value.
- **AF-007 (Minor):** Rewrite the header status against §13.6 and §14, without claiming the later phone change is pinned. Expected: Identify the later 9 Nov batch 2 N13 save as the 114-sheet build basis; distinguish the later 10 Nov phone-bar change pending a new recorded version Verify: re-extract GV1 and compare all affected variants/counterparts against the agreed expected value.
- **AF-010 (Minor):** Enable ending truncation on the 23 labels while preserving their sheet-width bounds and y offset. Expected: textTruncation=ENDING at the sheet width Verify: re-extract ST3 and compare all affected variants/counterparts against the agreed expected value.

Resolve authority conflicts first. The full scratch brief retains every node occurrence. Accepted files need Dean’s newly saved named version after the batch; verify history first for the Sales pin gap.

### Alignment batch · PPO - Estimating module

- **AF-012 (Blocker):** Normalise the quotation revision labels to two digits without changing their revision or state. Expected: r01, r02, r03 as appropriate Verify: re-extract CV6 and compare all affected variants/counterparts against the agreed expected value.
- **AF-013 (Blocker):** Use they for Dean, their own mailbox for Sasha Clarke, and them Director for the respondent. Expected: Names or they/them/their Verify: re-extract FA7 and compare all affected variants/counterparts against the agreed expected value.

Resolve authority conflicts first. The full scratch brief retains every node occurrence. Accepted files need Dean’s newly saved named version after the batch; verify history first for the Sales pin gap.

### Alignment batch · PPO - Projects module

- **AF-014 (Major):** After Dean settles the recorded Estimating/A3 conflict and supplies the role mapping, replace Kim Patel consistently in the affected current facts and their notes; do not invent a replacement person. Expected: No current person named Kim Patel under the supplied A3 summary Verify: re-extract FA2, FA1 and compare all affected variants/counterparts against the agreed expected value.
- **AF-017 (Major):** Adopt the latest accepted record-header toolbar and its phone pattern on Projects record sheets; preserve their page-specific primary and output availability. Expected: Shared A1 header instance: breadcrumb, one-row title/state/star, sub-line, previous/next in view, Actions, Outputs where applicable and one state-driven primary Verify: re-extract SH6, SH1 and compare all affected variants/counterparts against the agreed expected value.
- **AF-019 (Major):** Bind each confirmed UI paint to the matching existing PPO colour variable and rerun the check, preserving intentional opacity and geometry. Expected: Bind UI colour fills and strokes to the matching PPO colour variable Verify: re-extract CT2 and compare all affected variants/counterparts against the agreed expected value.
- **AF-021 (Major):** Update this module’s recorded Shell basis after reviewing the toolbar adoption; if it must remain pinned, state the reason, limitations and follow-up batch explicitly. Expected: Cite the latest named Shell version or record an explicit reason for pinning the earlier one Verify: re-extract SH7 and compare all affected variants/counterparts against the agreed expected value.
- **AF-075 (Major):** Confirm the amended A3 Update 4 fixture, then align the Projects source revision and recipient-preference treatment to that decision, retaining explicit09:40/09:45 later labels and Priya’s Held email in the receiving files. Expected: The same Glasshouse 4 Update 4 at the shared09:00 snapshot uses one fixed revision and recipient policy; later publication is explicitly labelled. Verify: re-extract HO1, FA1 and compare all affected variants/counterparts against the agreed expected value.
- **AF-015 (Minor):** Replace gendered references with the named person or grammatically correct they/them/their wording, then rescan all text nodes. Expected: Use names or they/them for people Verify: re-extract FA7 and compare all affected variants/counterparts against the agreed expected value.
- **AF-016 (Minor):** Confirm the event dates against the complete ledger, then correct the weekday/date pairs; if retaining 4 and 3 Nov, use Wed and Tue respectively. Expected: Wed 4 Nov 2026; Tue 3 Nov 2026 if the displayed calendar dates are retained Verify: re-extract CV4 and compare all affected variants/counterparts against the agreed expected value.
- **AF-018 (Minor):** Update the Projects Read me index and its repository record to include the two drawn nodes with their correct page and purpose. Expected: Index X33 126:5103 and Interaction states notes [node ID retained in scratch] in Read me; include notes [node ID retained in scratch] in repository inventory; include every page node ID, including separators and Scratch. Verify: re-extract ST5 and compare all affected variants/counterparts against the agreed expected value.
- **AF-020 (Minor):** Resolve the label-template conflict once, retain source traceability, and add the drawn signed-in person to every affected label without changing the persona. Expected: Every sheet label explicitly identifies its signed-in person, matching the drawn account Verify: re-extract ST3, FA4 and compare all affected variants/counterparts against the agreed expected value.

Resolve authority conflicts first. The full scratch brief retains every node occurrence. Accepted files need Dean’s newly saved named version after the batch; verify history first for the Sales pin gap.

### Alignment batch · PPO - Supply module

- **AF-001 (Blocker):** Choose an accessible primary fill/text pair in the Shell owner’s reviewed batch, save a new named version, then propagate local copies and recalculate each module’s proof and enabled primary states. Expected: At least 4.5:1 for 14 px normal-size text; correct the proof wherever it claims this pair passes or is unused. Verify: re-extract RA2 and compare all affected variants/counterparts against the agreed expected value.
- **AF-022 (Major):** After Dean settles the recorded Estimating/A3 conflict and supplies the role mapping, replace Kim Patel consistently in the affected current facts and their notes; do not invent a replacement person. Expected: No current person named Kim Patel under the supplied A3 summary Verify: re-extract FA2, FA1 and compare all affected variants/counterparts against the agreed expected value.
- **AF-024 (Major):** Change supplier claim references from SYN-CLM- to SYN-SCL- consistently and verify them against Finance and Reporting before the next build handover. Expected: Use SYN-SCL- for supplier claims, retaining the same numeric suffix unless the complete ledger says otherwise Verify: re-extract FA3, FA2, CV6 and compare all affected variants/counterparts against the agreed expected value.
- **AF-028 (Major):** Update this module’s recorded Shell basis after reviewing the toolbar adoption; if it must remain pinned, state the reason, limitations and follow-up batch explicitly. Expected: Cite the latest named Shell version or record an explicit reason for pinning the earlier one Verify: re-extract SH7 and compare all affected variants/counterparts against the agreed expected value.
- **AF-072 (Major):** Confirm one Unknown send semantic tone with the Library owner; align both instances and the corresponding shared state documentation, keeping repeat blocked until the outcome is known. Expected: One shared tone for an unknown send outcome, distinct from an unknown quantity; agree the shared meaning before rollout. Verify: re-extract CT4 and compare all affected variants/counterparts against the agreed expected value.
- **AF-023 (Minor):** Replace gendered references with the named person or grammatically correct they/them/their wording, then rescan all text nodes. Expected: Use names or they/them for people Verify: re-extract FA7 and compare all affected variants/counterparts against the agreed expected value.
- **AF-025 (Minor):** Use r01 in the affected displayed revision labels and preserve the underlying external order identity; confirm any exact external-source exception in the record. Expected: r01 instead of r1 under the shared two-digit display convention Verify: re-extract CV6 and compare all affected variants/counterparts against the agreed expected value.
- **AF-026 (Minor):** Bind each confirmed UI paint to the matching existing PPO colour variable and rerun the check, preserving intentional opacity and geometry. Expected: Bind UI colour fills and strokes to the matching PPO colour variable Verify: re-extract CT2 and compare all affected variants/counterparts against the agreed expected value.
- **AF-027 (Minor):** Resolve the label-template conflict once, retain source traceability, and add the drawn signed-in person to every affected label without changing the persona. Expected: Every sheet label explicitly identifies its signed-in person, matching the drawn account Verify: re-extract ST3, FA4 and compare all affected variants/counterparts against the agreed expected value.
- **AF-029 (Minor):** Add the missing page IDs to the Read me index and preserve the complete existing sheet inventory. Expected: List every page and its node ID in Read me Verify: re-extract ST5 and compare all affected variants/counterparts against the agreed expected value.

Resolve authority conflicts first. The full scratch brief retains every node occurrence. Accepted files need Dean’s newly saved named version after the batch; verify history first for the Sales pin gap.

### Alignment batch · PPO - Engineering module

- **AF-001 (Blocker):** Choose an accessible primary fill/text pair in the Shell owner’s reviewed batch, save a new named version, then propagate local copies and recalculate each module’s proof and enabled primary states. Expected: At least 4.5:1 for 14 px normal-size text; correct the proof wherever it claims this pair passes or is unused. Verify: re-extract RA2 and compare all affected variants/counterparts against the agreed expected value.
- **AF-033 (Major):** Resolve the opportunity mapping with the accepted Sales story and amended A3, then update every listed Engineering occurrence. Expected: One opportunity identity across Engineering and Sales; replacement requires full A3/Dean resolution. Verify: re-extract FA1 and compare all affected variants/counterparts against the agreed expected value.
- **AF-030 (Minor):** Replace each listed sentence with its supplied neutral wording and rerun the whole-file pronoun scan. Expected: Names or they/them throughout. Verify: re-extract FA7 and compare all affected variants/counterparts against the agreed expected value.
- **AF-031 (Minor):** Apply the exact two-digit replacements, preserving revision identity and all hashes. Expected: Two-digit revision suffixes r01, r02, etc. Verify: re-extract CV6 and compare all affected variants/counterparts against the agreed expected value.
- **AF-032 (Minor):** Expand each listed date from its source event, retaining the event time and correct site zone; do not assign 2026 blindly to a cross-year range. Expected: Full date, e.g. Thu 5 Nov 2026; preserve each event’s actual year. Verify: re-extract CV4 and compare all affected variants/counterparts against the agreed expected value.
- **AF-034 (Minor):** Bind these state-layer colours to the matching PPO colour variable and preserve the existing hover/pressed opacity. Expected: Bind visible control fills to PPO colour variables while retaining opacity. Verify: re-extract CT2 and compare all affected variants/counterparts against the agreed expected value.
- **AF-035 (Minor):** Append the actor confirmed by each sheet’s header, using the source-record default only where the sheet has no explicit exception. Preserve page, state and scope wording; do not infer missing role permissions. Expected: Each label names the signed-in actor, in addition to the scope or route. Verify: re-extract ST3 and compare all affected variants/counterparts against the agreed expected value.

Resolve authority conflicts first. The full scratch brief retains every node occurrence. Accepted files need Dean’s newly saved named version after the batch; verify history first for the Sales pin gap.

### Alignment batch · PPO - Service module

- **AF-001 (Blocker):** Choose an accessible primary fill/text pair in the Shell owner’s reviewed batch, save a new named version, then propagate local copies and recalculate each module’s proof and enabled primary states. Expected: At least 4.5:1 for 14 px normal-size text; correct the proof wherever it claims this pair passes or is unused. Verify: re-extract RA2 and compare all affected variants/counterparts against the agreed expected value.
- **AF-039 (Major):** Change the 09:00 Pulse item to its pre-query state, or relabel the entire sheet as a later frame and reconcile every item at that later time. Expected: At 09:00, Casey’s long wait is still awaiting Riley’s 09:06 query. Verify: re-extract FA5 and compare all affected variants/counterparts against the agreed expected value.
- **AF-036 (Minor):** Apply the supplied neutral wording, then rescan all text nodes including Read me indexes. Expected: Names or they/them throughout, including notes and sheet indexes. Verify: re-extract FA7 and compare all affected variants/counterparts against the agreed expected value.
- **AF-037 (Minor):** Apply exact replacements consistently; if an output filename is renamed, update its actual output reference and hash through the owning workflow rather than silently altering evidence. Expected: Two-digit revision suffixes r01, r02, etc. Verify: re-extract CV6 and compare all affected variants/counterparts against the agreed expected value.
- **AF-038 (Minor):** Expand each listed date using the source event year and zone. Do not assign 2026 blindly across year boundaries. Expected: Full date, e.g. Thu 5 Nov 2026; retain each event’s actual year. Verify: re-extract CV4 and compare all affected variants/counterparts against the agreed expected value.
- **AF-040 (Minor):** Append the actor confirmed by each sheet’s header, using the source-record default only where the sheet has no explicit exception. Preserve page, state and scope wording; do not infer missing role permissions. Expected: Each label names the signed-in actor, in addition to the scope or route. Verify: re-extract ST3 and compare all affected variants/counterparts against the agreed expected value.

Resolve authority conflicts first. The full scratch brief retains every node occurrence. Accepted files need Dean’s newly saved named version after the batch; verify history first for the Sales pin gap.

### Alignment batch · PPO - Finance module

- **AF-001 (Blocker):** Choose an accessible primary fill/text pair in the Shell owner’s reviewed batch, save a new named version, then propagate local copies and recalculate each module’s proof and enabled primary states. Expected: At least 4.5:1 for 14 px normal-size text; correct the proof wherever it claims this pair passes or is unused. Verify: re-extract RA2 and compare all affected variants/counterparts against the agreed expected value.
- **AF-043 (Major):** Replace dispute references consistently across accounts, cash outlook, notes and index, then compare with full A3 before the next build. Expected: SYN-DPT- for Finance disputes, retaining each numeric identity. Verify: re-extract FA3 and compare all affected variants/counterparts against the agreed expected value.
- **AF-041 (Minor):** Replace each listed sentence with its supplied neutral wording and rerun the whole-file pronoun scan. Expected: Names or they/them throughout. Verify: re-extract FA7 and compare all affected variants/counterparts against the agreed expected value.
- **AF-042 (Minor):** Expand each listed date from its source event, retaining the event time and correct site zone; do not assign 2026 blindly to a cross-year range. Expected: Full date, e.g. Thu 5 Nov 2026; preserve each event’s actual year. Verify: re-extract CV4 and compare all affected variants/counterparts against the agreed expected value.
- **AF-044 (Minor):** Bind these state-layer colours to the matching PPO colour variable and preserve the existing hover/pressed opacity. Expected: Bind visible control fills to PPO colour variables while retaining opacity. Verify: re-extract CT2 and compare all affected variants/counterparts against the agreed expected value.
- **AF-045 (Minor):** Append the actor confirmed by each sheet’s header, using the source-record default only where the sheet has no explicit exception. Preserve page, state and scope wording; do not infer missing role permissions. Expected: Each label names the signed-in actor, in addition to the scope or route. Verify: re-extract ST3 and compare all affected variants/counterparts against the agreed expected value.

Resolve authority conflicts first. The full scratch brief retains every node occurrence. Accepted files need Dean’s newly saved named version after the batch; verify history first for the Sales pin gap.

### Alignment batch · PPO - Settings module

- **AF-001 (Blocker):** Choose an accessible primary fill/text pair in the Shell owner’s reviewed batch, save a new named version, then propagate local copies and recalculate each module’s proof and enabled primary states. Expected: At least 4.5:1 for 14 px normal-size text; correct the proof wherever it claims this pair passes or is unused. Verify: re-extract RA2 and compare all affected variants/counterparts against the agreed expected value.
- **AF-046 (Minor):** Change only the displayed order revision to r02; preserve the integration idempotency key. Expected: SYN-SYNC-000435 · SYN-PO-000236 r02 Verify: re-extract CV6 and compare all affected variants/counterparts against the agreed expected value.
- **AF-047 (Minor):** Bind the non-Shell paints to their matching PPO colour variables without changing opacity; preserve any separately approved visual approximation. Expected: Bind solid fill/stroke colour to PPO colour while preserving paint opacity Verify: re-extract CT2 and compare all affected variants/counterparts against the agreed expected value.

Resolve authority conflicts first. The full scratch brief retains every node occurrence. Accepted files need Dean’s newly saved named version after the batch; verify history first for the Sales pin gap.

### Alignment batch · PPO - Reporting module

- **AF-001 (Blocker):** Choose an accessible primary fill/text pair in the Shell owner’s reviewed batch, save a new named version, then propagate local copies and recalculate each module’s proof and enabled primary states. Expected: At least 4.5:1 for 14 px normal-size text; correct the proof wherever it claims this pair passes or is unused. Verify: re-extract RA2 and compare all affected variants/counterparts against the agreed expected value.
- **AF-049 (Major):** Describe the 09:40 publication as forthcoming in 09:00 sheets or move the whole sheet to an explicitly later as-at state; compare Service and Settings policy evidence. Expected: At Thu 5 Nov 2026, 09:00 AEDT, the 09:40 policy publication is future; a later state must be labelled with its later as-at time. Verify: re-extract FA5 and compare all affected variants/counterparts against the agreed expected value.
- **AF-050 (Major):** Make reusable local docked-menu components for the accepted and explicitly proposed variants, then replace these frame copies with instances; verify type and main-component identity. Expected: Each repeated docked menu should be an instance of a local shared component, retaining recorded proposed menu variants. Verify: re-extract SH1 and compare all affected variants/counterparts against the agreed expected value.
- **AF-072 (Major):** Confirm one Unknown send semantic tone with the Library owner; align both instances and the corresponding shared state documentation, keeping repeat blocked until the outcome is known. Expected: One shared tone for an unknown send outcome, distinct from an unknown quantity; agree the shared meaning before rollout. Verify: re-extract CT4 and compare all affected variants/counterparts against the agreed expected value.
- **AF-073 (Major):** Retain the explicit Engineering test date unless Dean changes the fixture authority; rebuild the Q3 eligible cohort and its numerator, denominator, drill and Insights extracts from the agreed ledger rather than changing only the displayed quarter. Expected: A test recorded Thu 15 Oct 2026 belongs to Q4; Q3 is 1 Jul–30 Sep. Eligible cohort and all dependent ratios must use the same test dates. Verify: re-extract HO1, FA1 and compare all affected variants/counterparts against the agreed expected value.
- **AF-074 (Major):** Confirm the intended A3 stage ledger and pipeline/as-at basis, then align every board, Insights extract, report and drill; preserve accepted Sales until the owner resolves the conflict and saves a new named version for any change. Expected: The same as-at story, permitted population and pipeline version must yield the same stage distribution; owner-accepted Sales and later proposed/A3-derived counts cannot be silently reconciled. Verify: re-extract HO1, FA1 and compare all affected variants/counterparts against the agreed expected value.
- **AF-048 (Minor):** Replace each r1/r2 token with r01/r02 in the listed nodes; rescan every text node and preserve v1 definition-version labels. Expected: r01, r02 and other two-digit revision labels, keeping the same revision meaning. Verify: re-extract CV6 and compare all affected variants/counterparts against the agreed expected value.

Resolve authority conflicts first. The full scratch brief retains every node occurrence. Accepted files need Dean’s newly saved named version after the batch; verify history first for the Sales pin gap.

### Alignment batch · PPO - My Work module

- **AF-001 (Blocker):** Choose an accessible primary fill/text pair in the Shell owner’s reviewed batch, save a new named version, then propagate local copies and recalculate each module’s proof and enabled primary states. Expected: At least 4.5:1 for 14 px normal-size text; correct the proof wherever it claims this pair passes or is unused. Verify: re-extract RA2 and compare all affected variants/counterparts against the agreed expected value.
- **AF-053 (Major):** Restore the specified Owen Dunne report-questions task and reconcile the current report-response row against A3.8/A3.11; retain unrelated Sam Whitlock Sales tasks. Expected: Contact Owen Dunne about the report questions at 09:00 Verify: re-extract FA6 and compare all affected variants/counterparts against the agreed expected value.
- **AF-051 (Minor):** Normalise display revisions to two digits without changing the underlying revision identity. Expected: r01, r02 and the corresponding two-digit display revisions Verify: re-extract CV6 and compare all affected variants/counterparts against the agreed expected value.
- **AF-052 (Minor):** Use their in both current sentences. Expected: their call; their contact card Verify: re-extract FA7 and compare all affected variants/counterparts against the agreed expected value.
- **AF-055 (Minor):** Bind the non-Shell paints to their matching PPO colour variables without changing opacity; preserve any separately approved visual approximation. Expected: Bind solid fill/stroke colour to PPO colour while preserving paint opacity Verify: re-extract CT2 and compare all affected variants/counterparts against the agreed expected value.
- **AF-054 (Polish):** Move the RH04 label to y2822, preserving its x60, width1440 and ending truncation. Expected: Label63:1296 at y2822, 26 px above RH04 frame63:1295 at y2848 Verify: re-extract ST3, ST4 and compare all affected variants/counterparts against the agreed expected value.

Resolve authority conflicts first. The full scratch brief retains every node occurrence. Accepted files need Dean’s newly saved named version after the batch; verify history first for the Sales pin gap.

### Alignment batch · PPO - Customers, Sites & Equipment module

- **AF-001 (Blocker):** Choose an accessible primary fill/text pair in the Shell owner’s reviewed batch, save a new named version, then propagate local copies and recalculate each module’s proof and enabled primary states. Expected: At least 4.5:1 for 14 px normal-size text; correct the proof wherever it claims this pair passes or is unused. Verify: re-extract RA2 and compare all affected variants/counterparts against the agreed expected value.
- **AF-056 (Minor):** Bind these fills to the matching existing PPO colour variables while preserving opacity and state layering; if an extra variable is needed, route that choice to the Library owner. Expected: Bind visible UI fills/strokes to the appropriate PPO colour variable Verify: re-extract CT2 and compare all affected variants/counterparts against the agreed expected value.
- **AF-057 (Minor):** Confirm the original A2 convention and any exact-source exception, then normalise displayed revisions consistently. Preserve issued file names, machine payloads, hashes and immutable historical identifiers unless their owner explicitly changes them. Expected: Display r01, r02 and other two-digit revision labels under the supplied audit convention Verify: re-extract CV6 and compare all affected variants/counterparts against the agreed expected value.
- **AF-058 (Minor):** Retitle the card to Replacement links and history after confirming that the heading describes its contents; preserve explicit rules saying that warranty and defects never transfer. Expected: A heading that describes the replacement links/history without implying warranty, entitlement or defect transfer Verify: re-extract CV7 and compare all affected variants/counterparts against the agreed expected value.
- **AF-059 (Minor):** Settle the shared label-template conflict once; retain the source citation and add the drawn signed-in person to every affected UI label. Identify specification boards explicitly rather than inventing a persona. Expected: Each sheet label explicitly identifies the drawn signed-in person Verify: re-extract ST3, FA4 and compare all affected variants/counterparts against the agreed expected value.
- **AF-060 (Minor):** Add the 20 page IDs to the completed Read me index and keep its 184-sheet inventory unchanged. Expected: List each page with its node ID as well as the existing sheet IDs Verify: re-extract ST5 and compare all affected variants/counterparts against the agreed expected value.

Resolve authority conflicts first. The full scratch brief retains every node occurrence. Accepted files need Dean’s newly saved named version after the batch; verify history first for the Sales pin gap.

### Alignment batch · PPO - Documents & messages module

- **AF-001 (Blocker):** Choose an accessible primary fill/text pair in the Shell owner’s reviewed batch, save a new named version, then propagate local copies and recalculate each module’s proof and enabled primary states. Expected: At least 4.5:1 for 14 px normal-size text; correct the proof wherever it claims this pair passes or is unused. Verify: re-extract RA2 and compare all affected variants/counterparts against the agreed expected value.
- **AF-061 (Major):** Resolve the recorded navigation proposal with Dean and the Shell owner. Recommended alignment is the accepted Knowledge → DOCUMENTS route; adopt its approved component and nested current views. Update Read me and the proposed source record together; do not imply that the existing proposal was unrecorded. Expected: Document register, Outputs and Templates in Knowledge → DOCUMENTS, using the accepted Shell menu components Verify: re-extract SH4, SH1 and compare all affected variants/counterparts against the agreed expected value.
- **AF-062 (Minor):** Bind these fills to the matching existing PPO colour variables while preserving opacity and state layering; if an extra variable is needed, route that choice to the Library owner. Expected: Bind visible UI fills/strokes to the appropriate PPO colour variable Verify: re-extract CT2 and compare all affected variants/counterparts against the agreed expected value.
- **AF-063 (Minor):** Confirm the original A2 convention and any exact-source exception, then normalise displayed revisions consistently. Preserve issued file names, machine payloads, hashes and immutable historical identifiers unless their owner explicitly changes them. Expected: Display r01, r02 and other two-digit revision labels under the supplied audit convention Verify: re-extract CV6 and compare all affected variants/counterparts against the agreed expected value.
- **AF-064 (Minor):** Replace his own proposal with their own proposal or Sam’s own proposal. Expected: Sam Patel is refused review/publication of their own proposal Verify: re-extract FA7 and compare all affected variants/counterparts against the agreed expected value.
- **AF-065 (Minor):** Confirm the event date against the complete ledger; if retaining 31 October, change Fri to Sat. Resolve the source question and affected downstream event references together. Expected: Sat 31 Oct 2026, 16:20 if the recorded date/time is retained Verify: re-extract CV4 and compare all affected variants/counterparts against the agreed expected value.

Resolve authority conflicts first. The full scratch brief retains every node occurrence. Accepted files need Dean’s newly saved named version after the batch; verify history first for the Sales pin gap.

### Alignment batch · PPO - Customer portal module

- **AF-001 (Blocker):** Choose an accessible primary fill/text pair in the Shell owner’s reviewed batch, save a new named version, then propagate local copies and recalculate each module’s proof and enabled primary states. Expected: At least 4.5:1 for 14 px normal-size text; correct the proof wherever it claims this pair passes or is unused. Verify: re-extract RA2 and compare all affected variants/counterparts against the agreed expected value.
- **AF-069 (Major):** Replace the current quotation family consistently across list, exact quotation, dialog, tablet, phone and label; align with accepted Estimating before release. Expected: SYN-QUO-000214 and SYN-QUO-000177 with the same two-digit revision and identity. Verify: re-extract FA2 and compare all affected variants/counterparts against the agreed expected value.
- **AF-066 (Minor):** Apply the supplied neutral wording, then rescan all text nodes including Read me indexes. Expected: Names or they/them throughout, including notes and sheet indexes. Verify: re-extract FA7 and compare all affected variants/counterparts against the agreed expected value.
- **AF-067 (Minor):** Apply exact replacements consistently; if an output filename is renamed, update its actual output reference and hash through the owning workflow rather than silently altering evidence. Expected: Two-digit revision suffixes r01, r02, etc. Verify: re-extract CV6 and compare all affected variants/counterparts against the agreed expected value.
- **AF-068 (Minor):** Expand each listed date using the source event year and zone. Do not assign 2026 blindly across year boundaries. Expected: Full date, e.g. Thu 5 Nov 2026; retain each event’s actual year. Verify: re-extract CV4 and compare all affected variants/counterparts against the agreed expected value.
- **AF-070 (Minor):** Reconcile the authoritative quotation dates first, then update the weekday/date pair consistently on every listed customer view. If the dates remain 31 October and 30 November, use Sat and Mon. Expected: 31 October 2026 is Saturday; 30 November 2026 is Monday. Verify: re-extract CV4 and compare all affected variants/counterparts against the agreed expected value.
- **AF-071 (Minor):** Bind the placeholder fill and border to named PPO variables, retaining its clearly undecided wording. Expected: Bind visible fills and strokes to PPO colour variables outside shell copies. Verify: re-extract CT2 and compare all affected variants/counterparts against the agreed expected value.

Resolve authority conflicts first. The full scratch brief retains every node occurrence. Accepted files need Dean’s newly saved named version after the batch; verify history first for the Sales pin gap.

### Alignment batch · PPO - Assistant, Knowledge and Help

Establish missing source/file access and complete the Not checked items above before any alignment claim.


Resolve authority conflicts first. The full scratch brief retains every node occurrence. Accepted files need Dean’s newly saved named version after the batch; verify history first for the Sales pin gap.

### Alignment batch · PPO - Products module

Establish missing source/file access and complete the Not checked items above before any alignment claim.


Resolve authority conflicts first. The full scratch brief retains every node occurrence. Accepted files need Dean’s newly saved named version after the batch; verify history first for the Sales pin gap.

### Alignment batch · PPO - Shell (accepted)

- **AF-001 (Blocker):** Choose an accessible primary fill/text pair in the Shell owner’s reviewed batch, save a new named version, then propagate local copies and recalculate each module’s proof and enabled primary states. Expected: At least 4.5:1 for 14 px normal-size text; correct the proof wherever it claims this pair passes or is unused. Verify: re-extract RA2 and compare all affected variants/counterparts against the agreed expected value.
- **AF-076 (Minor):** Update the stale header and its source statement in the Shell owner’s next reviewed batch, then save and record a new named version. Expected: Accepted status and repository-backed source wording matching the accepted page and record. Verify: re-extract GV1 and compare all affected variants/counterparts against the agreed expected value.

Resolve authority conflicts first. The full scratch brief retains every node occurrence. Accepted files need Dean’s newly saved named version after the batch; verify history first for the Sales pin gap.
