---
document_id: PPO-REPORTING-FIGMA-AUDIT
date: 2026-11-13
owner: Dean Fiedler
status: Audit findings, 13 November 2026, on the private Figma file "PPO - Reporting module" (proposal) at Dean's request; read-only in Figma; no design is changed and nothing is accepted by this record; the questions in section 5 are Dean's; no application code, route, migration, permission or deployment
versioning: git
---

# Reporting module Figma file — alignment audit

**Owner:** Dean Fiedler · **Date:** 13 November 2026 · **Status:** Audit findings. Nothing in Figma was changed; nothing is accepted.

Dean asked for an audit of the Reporting module's Figma file. He supplied two documents as aids: the cross-file alignment audit prompt of 12 November 2026 and the read-only UI/UX V3 conformance audit of 10 November 2026. He also gave the PPO - Library file as a reference. This record applies the cross-file prompt's checks (sections 4 and 5.4) to one file, the Reporting file. Where the repository records allow, it also tests the Reporting file's shared facts against the other module records. The record follows Dean's standing instruction to proceed on the most professional approach: the six questions are stated with recommendations, not left blocking.

## 1. Scope and sources

| Source | Status | Use |
|---|---|---|
| Private Figma file "PPO - Reporting module" | Proposal (record [PPO-REPORTING-REFINED-FIGMA-PROP](reporting-module-refined-ui-proposal.md), 10 November 2026) | Audited: all 16 pages, 221 sheets and cards on 11 scope pages, the kit page |
| Private Figma file "PPO - Shell (accepted)", named version "Shell refined concept — accepted · record header toolbar" (10 November 2026) | Accepted | Read only: the Reporting flyout and docked menu on the Workspace menus page (`103:17132`, `103:17816`) and its header (`101:8554`). Rules from the [rules export](../design/development/systems/shell-refined-concept-rules.md) R1 to R125 |
| Private Figma file "PPO - Library" | Proposed, not published | Read only: the Read me and the Controls status-chip card (`52:435`); decisions from the [drawer widths](library-drawer-widths.md), [controls](library-controls.md) and [audit](library-audit.md) records |
| Module records on `main` at `707b21cc` | Proposals and acceptances | Cross-file facts: Estimating, Projects, Service, Supply, Settings, My Work, Customer portal |
| Addenda A1, A2 and A3 | Not supplied to this session | Used only as the records quote them |

The Figma files' links and keys are not recorded here (ADR-0050, ADR-0053). Node IDs are given for the Reporting file because its record already lists them.

## 2. Method

1. **Repository sweep.** The Reporting record and fragment, the Shell rules, the named-version handoff, the Library records and the module records listed above. The record's sheet inventory was parsed into 221 rows with no duplicate node.
2. **Extraction.** One read-only plugin script per scope page (11 runs) returned sections, sheets, labels, bounds, overlaps, shell instances, fonts and sizes, paints without a variable, and text scans. The scans covered forbidden words, earlier fixtures, pronouns, ISO and other date forms, revisions, references, US spellings, money, later times on Thu 5 Nov and a people census. A second pass per page collected chip label-to-tone pairs, docked-menu variants, panel and dialog widths and where 10 px text comes from. The results were analysed offline in isolated Python.
3. **Targeted reads.** The kit page's 122 components and the variable collection; the record-header component's variants; three sheets' structure (SP01, SP03, SP10); the context of five names; the Shell's Reporting menus; the Library's chip meanings. No screenshot was needed: every finding rests on properties or text.
4. **About 45 Figma calls** in all. Nothing timed out and nothing was skipped.

## 3. Results

**21 findings: 0 Blocker, 8 Major, 10 Minor, 3 Polish.**
- 18 are for the Reporting file's next build session. Some of them follow Dean's answers to Q1, Q3, Q4 and Q6.
- 2 are for the accepted Shell.
- 1 (AF-008) waits on Dean's choice of the true value.

Of 43 checks: 20 Pass, 16 Fail, 4 Not checked, 3 Not applicable.

The file is structurally sound:
- every recorded node resolves;
- every sheet is on the grid with a correct one-line label;
- nothing overlaps or leaves its sheet;
- Roboto is the only font;
- the shell chrome is instanced;
- personas match the top bar;
- no gendered pronoun, ISO date or earlier fixture appears as a current fact.

The misalignments sit in four places:
- chip tones;
- the revision form;
- unbound chart colours;
- the hand-copied docked menu.

Two items in the content also conflict with other files: the scheduling-policy time and Reporting settings ownership.

| Check | Result | Findings |
|---|---|---|
| ST1 page order · ST3 grid and labels · ST5 inventory | Pass | |
| ST2 sections · ST4 loose nodes | Fail (Polish) | AF-019, AF-020 |
| SH1 instances | Fail | AF-005 |
| SH2 top bar · SH4 menus · SH5 strip · SH6 record header | Pass | |
| SH3 drawers · SH7 named version | Fail | AF-018, AF-009 |
| CT1 to CT5 components, colours, type, tones, Library | Fail | AF-001, AF-002, AF-004, AF-011 to AF-014 |
| CV1 register standard · CV4 dates · CV5 money · CV7 words · CV8 spelling | Pass | |
| CV2 cells and search · CV3 footers | Not checked | |
| CV6 references | Fail | AF-003 |
| FA2 fixtures · FA3 families · FA4 personas · FA7 pronouns | Pass | |
| FA1 ledger · FA5 story clock | Fail | AF-008, AF-015, AF-006 |
| FA6 My Work queues | Not checked | |
| HO1 handovers · HO2 ownership | Fail | AF-008, AF-016, AF-007, AF-017 |
| HO3 previews · GV3 · EX1 | Not applicable | |
| RA1 variants · RA2 contrast | Pass | |
| RA3 targets | Not checked | |
| GV1 labels | Fail | AF-010, AF-021 |
| GV2 no links · GV4 nodes resolve | Pass | |

Evidence for the passes:
- **Shell chrome.** Instances on every app sheet: top bar 178, rail 178, right strip 178, collapsed strip 66 and record header 23.
- **Docked menus.** Their text equals the accepted Reporting menu, with the R108 views nested under each report page.
- **Record headers.** They draw "Return" beside the primary "Adopt…", as the accepted approver variant draws "Return" beside "Approve…".
- **Contrast.** The chart slots recompute to the record's figures: 4.42, 3.20, 5.02, 2.14 and 2.69 on white.

## 4. Findings

### Major

| ID | Check | Finding | Fix owner |
|---|---|---|---|
| AF-001 | CT4 | Ten state words are drawn in more than one tone against ST01c's one tone per meaning and the Library's confirmed meanings: Draft in four tones (Neutral 28, Grey 1, Info 1, Warning 4), Approved, Downloaded, Unknown, Open, Returned, On superseded version, Private, Yes and Policy v1 | Reporting |
| AF-002 | CT4 | On Sales performance the "Within 30 days" ageing band is Success (20) beside a Neutral "31 to 90 days", a good-or-bad colour on a measure that BP-01 22.1 and CR-04 D3 forbid. Won is Success while Lost is Neutral, which matches neither the Library (Lost is Danger) nor the no-judgement rule | Reporting, after Q3 |
| AF-003 | CV6 | At least 78 single-digit revisions break A2's two-digit form: quotation r1, r2, r3 on the RP-02 sheets; Glasshouse 4 baseline r1 and r2 on DP01, DP03, DP06, DP09 and RDX3. The Estimating record draws SYN-QUO-000214 r02, the Projects record baseline r01 and r02, and this file's own RP-04 draws "r02" | Reporting |
| AF-004 | CT2 | 2,271 solid paints without a variable on 91 sheets, nearly all chart colours. The tokens the record names (chart/1 to chart/6, chart/neutral) do not exist: the file's one collection, PPO colour, has 66 variables and no chart group. #3d9938 sits one step from brand/green-deep | Reporting; PPO - Library (B6) |
| AF-005 | SH1 | The docked Reporting menu is a plain frame copied onto 90 sheets in nine text variants. Its text is right, but the proposed nine-page menu (A24, refinement R3) would mean editing 90 frames by hand. The accepted Shell also draws per-workspace menus as frames, so there is no accepted component to instance | Reporting |
| AF-006 | FA5 | SE01, SE04, SE-X2 and TB-SE01 state at 09:00 that scheduling policy v2 was "published Thu 5 Nov 09:40". The Settings record draws v2 as reviewed at 09:00 and published at 09:40 on a later frame, and the Service record calls the policy "v7" | Reporting; Dean (Q5) |
| AF-007 | HO2 | Fourteen Reporting settings sheets (AD01 to AD08 and their dialogs, states, tablet and phone) at the proposed `/reports/settings` sit in neither the accepted seven-page nor the proposed nine-page Reporting menu. The Settings record does not mention them | Dean (Q4), then Reporting |
| AF-008 | HO1 | The five story conflicts in the file's own audit (record section 10, G2) are still open: KPI-11's CP-4 test in Q3 against A3.2's Q4; stage counts 9, 11, 10, 5, 3 against the Sales board's 9, 8, 11, 6, 4; A3.8's second overdue action; REP-09's 9 kinds against 8 open; KPI-15 Draft against a requested adoption | Dean, then the file that differs |

### Minor and Polish, by check

- **SH7, GV1 (AF-009, AF-010).** The Read me and the record cite the Shell's 8 November acceptance, not the named version "· record header toolbar" of 10 November that the file uses. The record calls the file "(proposal)" while the shared link names "PPO - Reporting module".
- **CT5, CT3, CT1 (AF-011, AF-012, AF-014).** These are the deltas the file needs at the Library swap:
  - tabs are 38 px with a green marker, where the Library sets 48 px with a navy marker;
  - avatar initials are 10 px, a size the Library has retired;
  - the chip tone is named "Green", where the Library says "Accent";
  - off-scale text sizes appear: 15, 17, 18, 24 and 32 px;
  - dialogs come in six widths, where the Library sets 560 or 720 px.
- **CT4 (AF-013).** Tint carries states (Shared, Viewed, Added, Counted) where the Library keeps it for counts and references. Scope tags are Grey, waiting states are Warning rather than Info, and "Reviewed" is Warning.
- **FA1 (AF-015).** "Casey Ng" owns three Supply exception rows on RP-05 and appears in no other module record.
- **HO1, HO2 (AF-016, AF-017).** The accepted Shell's Reporting Recent row still reads Q2 (record A16). PS04 and PH04 draw the My Work landing without matching it to the My Work file.
- **SH3 (AF-018).** All right panels are 432 px at x 960, as Shell R45 sets. Whether they become 360 or 480 px waits on Q1.
- **Polish (AF-019 to AF-021).** The Saved views page lists its States section after Phone in the layer order. Seven hidden build-helper scripts sit loose on the kit page. The Shell's Workspace menus header still says "Proposal · awaiting Dean's acceptance".

The full register, with node IDs, expected and found values and a fix for each finding, went to Dean with this audit as `findings.csv`, together with `alignment-matrix.csv`, `ledger-diff.md` and a paste-ready "Alignment batch · PPO - Reporting module" brief.

## 5. Authority conflicts and questions for Dean

| # | Question | Readings | Recommendation |
|---|---|---|---|
| Q1 | Drawer width for right panels | Shell R45 and R98: 432 px panel plus 48 px tab column (480 in all). Library (11 November 2026): 360, 480, 640 or 800 px, silent on the tab column | Read `drawer/standard` 480 as the whole drawer including the tab column, so the Shell stands; use `drawer/narrow` 360 for filter, period and company panels; record it in the drawer-widths record |
| Q2 | Library B6 ("stat tiles and charts … before any reporting or dashboard design", 11 November 2026) against the Reporting file's Tile family, chart vocabulary v2, Dashboards and Report builder (10 November 2026) | B6 puts the Library first; the Reporting file already drew them | Make Report / Tile, ST01b and ST02 the starting point for B6; keep Dashboards and the Report builder as proposals until the Library parts publish |
| Q3 | Tone meanings for Reporting's words | Library card 2: Lost Danger, Reviewed Success, Tint never a state. Reporting: no good-or-bad colour on a measure | Library tones for record states in drill lists (Won Success, Lost Danger); measure elements (ageing bands, periods, the prior period) Neutral; "Sent, not yet acknowledged" Info; Shared and Viewed Neutral; Counted and Withheld Grey |
| Q4 | Owner and menu row for Reporting settings | Reporting AD-A1 (`/reports/settings`) against a Settings module that does not mention them | Keep the policies in Reporting (RP-06 D1), add "Reporting settings" to the Set-up group for administrators, link it from the Settings hub, and record it in both records |
| Q5 | Scheduling policy version and the 09:40 publication | Settings: v1 in force, v2 reviewed, published 09:40 later. Service: v7. Reporting: v2 published at 09:00 | Settings' numbering and time, since Settings owns publication |
| Q6 | File name | "(proposal)" in the record and the Read me; no suffix in the link | Keep "(proposal)" until acceptance, then "(accepted)" as Sales did |

The Reporting record's own open questions stand unchanged. They are A14 (Melbourne Cup Day), A17 (one restricted-section rule), REP-02's catalogue status, A24 (the nine-page menu), A23 (Dashboards and the builder as RP-06 record types) and A28 (governed targets).

## 6. Not checked and limits

- **Addenda.** A1, A2 and A3 were not supplied, so the fact ledger is built from the records only. FA6 (My Work per-person queues) could not be checked.
- **Other module files.** These were not opened. Handovers were compared with their repository records, not with their sheets; this covers the Insights extracts and the My Work landing.
- **Not measured.** Cell heights, footers, search fields, target sizes and focus rings were not re-measured (CV2, CV3, RA3). The builder's own scripted pass reports them clean.
- **Inferred, not read.** The Plugin API cannot read a file's name, so AF-010 rests on the shared link.
- **Rule-context words.** 247 forbidden-word occurrences sat in sentences with a negation and were not read individually. The 33 others were read and all sit in rule or declined lists.
- **Static only.** No prototype, keyboard, screen-reader or 200 % zoom proof, as for any static design.

## 7. Next steps

Each step is its own later change.

1. Dean answers Q1 to Q6.
2. The Reporting file's next build session applies its alignment batch in the order of the brief. The batch needs no named version; Dean saves one on acceptance.
3. The Shell file's owner fixes AF-016 and AF-021 under a new named version.
4. The module stories in AF-008 are aligned once Dean picks each value.
5. The Reporting record's correction for AF-009 and AF-010 follows the file change.
6. Outside this file, the Supply record on `main` reads "sections she may not read" for Robin Hale, a gendered pronoun for a synthetic person; it is reported for that record's owner.

No other record, the design register, the code and every Figma file are unchanged. All 78 parent requirement IDs remain.
