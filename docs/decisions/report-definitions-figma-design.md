---
document_id: PPO-RP06-REPORT-DEFINITIONS-FIGMA-DEC
date: 2026-10-31
owner: Dean Fiedler
status: Owner-accepted design; native implementation, definitions, schedules, permissions and UI baseline acceptance separate
source_commit: 7eb4432baefcf8b098a37726b250a311f21e67dc
versioning: git
---

# Report definition, saved views and scheduled review RP-06 design — owner decision

On 24 October 2026 Dean asked for the design: "Your task is to design and build the "Report definition, saved views and scheduled review (RP-06)" UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." The page was left unfinished by the Figma call limit. On 31 October 2026 he asked: "Your task is to finish the existing "Report definitions · RP-06" page in Figma (page 2466:3344) as a proposal for my review." Claude finished the page, audited it and presented it with ten decisions and seven questions. It covers:
- the page at `/reports/definitions`: a register with four views (definitions, saved views, scheduled reviews, export permissions);
- a definition record, a version comparison with impact, a record-a-review side form and review history;
- desktop 1440, the definition record at tablet 1024, scheduled reviews and record a review on phones at 390 and 320, and eight states.

Claude drew the page from these sources:
- [BP-01](../blueprints/BP-01-master-blueprint.md) §22.1 to §22.3 (REP-01 to REP-12, KPI-01 to KPI-15);
- [Conversations reply-by reminders](conversations-reply-by-reminders.md), which is still a proposal, with nothing scheduled;
- [Service and Finance download access](report-finance-download-access.md) and the [conformance standard](../standards/html-module-conformance.md);
- the Figma pages Reports overview RP-01, RP-04, Measure definitions FN-06 and Audit history AD-07.

On 31 October 2026 Dean answered "Do you accept the RP-06 proposal?": "Accept as recommended". The button he chose was offered as accepting the proposal with the recommended answers to Q1–Q7, so this record reads his answer as adopting D1–D10 and those answers.

Scope:
- `scope:RP-06` "Report definition, saved views and scheduled review", at `/reports/definitions`. No new scope is added.
- No parent requirement ID is added or renamed; all 78 remain.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, grant, seed, export, scheduler, service or deployment. It adopts no report or measure definition, schedules no review and sets no export permission. Every record, person, date and version shown is synthetic.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the page RP-06 | User decision, 24 and 31 October 2026 | Dean's requests quoted above |
| Decisions D1–D10 | Accepted as drawn, 31 October 2026 | Dean's answer, quoted above. Section 4 |
| Q1 Who adopts report definitions | Resolved as recommended; design direction only | The report owner proposes and a different named person adopts. Dean adopts all REP-01 to REP-12 definitions at first, until each department has its own reviewer |
| Q2 Which reports need a scheduled review | Resolved as recommended; design direction only | Monthly: RP-04 sections, REP-12, REP-01, REP-03, REP-04, REP-11. Quarterly: REP-05 to REP-09. None while a definition is Draft (REP-02, REP-10) |
| Q3 Sharing saved views outside a team | Resolved as recommended | Not by default. Share with named people or a team; business-wide only for an Adopted definition, by the report owner. Sharing never grants access to the report |
| Q4 Reviews on the management overview | Resolved as recommended; RP-01 not changed | A count of overdue reviews with a link on RP-01, and no scores, when RP-01 next changes |
| Q5 When a monthly review is due | Resolved as recommended; proposed rule | 5 working days after month end. Claude proposed this for the story; it is not drawn from a source |
| Q6 Recording a review while a definition is In review | Resolved as recommended | Allowed. The review states the version and its status, and adopts nothing |
| Q7 REP-02 denominator | Accepted as recommended; **conflict open** | Every pursuit created, with quoted shown as a stage. It disagrees with RP-02 Q1. Section 5 |
| Accept the design | User decision, 31 October 2026 | Quoted above |
| Named Figma version | Not yet saved | Section 8 |
| Building the page | Not decided | Section 6 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Report definitions · RP-06" `2466:3344`, under "— Reporting —", after Delivery performance · RP-03. The page header `2466:3345` holds the conformance declaration; the notes card `2855:2823` holds D1–D10, Q1–Q7 and the flows. File index: the row "Row / Report definitions · RP-06" `2874:2710` in the Reporting group |
| Desktop 1440 | Definitions register `2483:239`; definition record, REP-02 `2503:459`; version comparison, REP-01 `2844:4232`; saved views `2844:4685`; scheduled reviews `2844:5150`; record a review, RP-04 September `2844:26688`; review history, RP-04 `2846:1657`; export permissions `2846:2016` |
| Tablet 1024 | Definition record, rail and side menu collapsed `2848:2071` |
| Phone 390 and 320 | Scheduled reviews `2850:5536` and `2850:5751`; record a review `2850:5963` and `2850:6090` |
| States | Loading `2852:6343`; nothing defined `2852:6381`; could not load `2852:6403`; no permission `2852:6429`; definition uses an unadopted measure `2852:6451`; saved view on a superseded version `2852:6475`; review overdue `2852:6507`; proposer is the reviewer `2852:6539` |
| Components | None added or changed, so there is no binding file. New layouts are page parts on this page |
| Prototype | Flows "RP-06 — desktop" and "RP-06 — phone" |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00 AEST. RP-04 is reviewed monthly by the Service manager, with September's review recorded and two actions. REP-02 is at version 1 Draft. The saved view "Glasshouse projects" sits on RP-03. RP-05 Finance sections export to Finance only. Owners are shown as roles. Existing references are unchanged |
| Retained captures | [Report definitions design r01](../reference/ui/reporting/report-definitions-design-r01/README.md): twenty-one icon-free PNGs of twenty-one frames, with hashes. Capture copies are on the Captures page from y = 810,000 |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:RP-06` Report definition, saved views and scheduled review, `/reports/definitions` (not built), `guide.rp.06`, related `scope:FN-06` and `scope:AD-03`. BP-01 §22.1 to §22.3, REP-01 to REP-12, KPI-01 to KPI-15. Parent IDs unchanged |
| Page type (r20) | Register / worklist. Supporting: Record detail (definition record), Review / comparison (version comparison) and Form / guided workflow (record a review) |
| Reused components | Shell / Top bar `35:138` (linked, with the Conversations action); v2 Rail and Menu items as RP-04; Shell / Phone header · compact; Grid / Header cell, checkbox and row-actions cells; Grid / Group band and Grid / List row (phone), both proposed in the file audit; Controls / Form field; Response / Input (phone, 16 px); Tag; Button; Record / Banner, View tab and Filter chip; the RP-04 report-header facts pattern |
| Incoming handovers | Reports RP-01 to RP-05 (a "Report definition" link on each report header); Measure definitions FN-06 ("Reports using this measure"); My account SH-03 · SH-05 (a person's saved views); Conversations (a review-due notice) |
| Outgoing handovers | Measure definitions FN-06 (each measure's meaning and status, never copied here); Audit history AD-07 (export manifests and second-person approvals); RP-02 to RP-05 (open a saved view, or a report at a stated version); Conversations (assign a review action, in-app only). No handover to MYOB, SharePoint or any customer message |
| Source authority | The records listed above |
| Proposed departures | Accepted: section 4 |
| Status | Owner-accepted design, 31 October 2026 |
| Decision record | This file |
| Named version | Not yet saved: section 8 |

## 4. What the design shows

- **Boundary (D1):** FN-06 owns what a measure means. RP-06 owns which records a report includes, grouping, default filters, access and review cadence, and only links to the measure.
- **One page, four views (D2):** definitions, saved views, scheduled reviews and export permissions as tabs, with a definition record, version comparison, record-a-review form and review history behind them.
- **Status in words (D3):** Draft, In review, Adopted, Superseded.
- **Second-person adoption (D4):** the proposer's Adopt is disabled, and PPO refuses it if tried another way. The refusal is recorded in Audit history.
- **Reviews are due dates (D5):** an in-app reminder appears when PPO checks run. No frame claims a background service, email or escalation. Overdue is said in words.
- **Superseded views (D6):** a saved view on a superseded definition keeps working, says so, and moves only when its owner moves it.
- **Export permissions (D7):** per report and section, with format and an optional second person. Seeing a report does not grant export, and access is checked again when the file is read.
- **Nothing unresolved looks verified (D8):** no targets or baselines anywhere, and no Verified mark while a measure or definition is unresolved. An adopted report definition does not adopt a pending measure.
- **Reviews are permanent (D9):** a recorded review is never edited. A correction is a new entry naming the one it corrects, and a review keeps the version and data as at it was recorded against.
- **Phone (D10):** the reviews list and record a review only, with 16 px inputs and 48 px buttons. Definitions, saved views and export permissions stay on desktop.

### Departures, accepted

| ID | Departure | Pattern it changes |
|---|---|---|
| Story | The record-a-review frames show RP-04 September as entered on Wed 7 Oct, before saving, though the page's story is as at 13 Oct | Story date. The frame label says so; review history shows the saved result |
| Tablet | The top bar hides its parent crumb at 1024 so the search and icons fit. Its zones are resized as instance overrides | Shell / Top bar at wider widths |
| Page parts | Tables other than the Grid header are built from frames, with raw colour values matching the tokens rather than bound variables | Components and tokens. A build uses the shared table and tokens |

## 5. Conflict to resolve: the REP-02 denominator

Q7 was recommended and accepted as "every pursuit created, with quoted shown as a stage". The RP-02 design decision (PPO-RP02-SALES-PERFORMANCE-FIGMA-DEC), which Dean accepted on 30 October 2026 in pull request #765, still open when this was written, says in its Q1 that conversion is three transitions, each "the numerator divided by decided records", and that "still-open records are listed and never count as losses". The two disagree on whether open records sit in the denominator.

Claude did not read RP-02 Q1 before recommending Q7, so Dean accepted the recommendation without this comparison in front of him. This record does not choose between them. It amends neither record, and it publishes no definition. The accepted RP-06 drawing shows the denominator as an open decision at the story date, so it holds whichever rule governs.

Export rules also differ in emphasis. RP-02 D13 asks for a second person for anything leaving Powerplants, while RP-06 sets a second person per report section. They can both stand, and a build should apply both.

## 6. Not decided and not drawn

- **Building the page.** No route exists. The build order is not decided.
- **Adoption, schedules and permissions.** This acceptance adopts no definition, schedules no review and sets no export permission.
- **Scheduling.** The [reminders proposal](conversations-reply-by-reminders.md) is undecided. If a background service is adopted later, D5's wording follows it through a recorded amendment.
- **RP-01.** Q4's count of overdue reviews is not on RP-01 yet. RP-01, RP-03, RP-04, RP-05, FN-06 and AD-07 were still proposals when this was accepted, so a change to them may need a recorded amendment here. So may the outcome of the proposed Grid and Controls components in the file audit.
- **Prerequisites for a build:**
  - the `/reports/definitions` route in the Reports workspace;
  - stored report definitions with versions and second-person adoption;
  - saved views that state their version;
  - due dates, recorded reviews and review actions;
  - export permissions by section, with manifests;
  - the links from each report and from FN-06;
  - any new capability, with the access-review chain.
- **Not drawn:** send for review and adopt as their own forms; new definition; change cadence; move a saved view; save a view; the phone definition record, saved views and export permissions; keyboard order, 200% zoom and dark mode.

## 7. Evidence and limits

Claude checked each desktop frame and the states, notes and phone sections by screenshot, and the tablet frame before its top-bar fix and that top bar after it. A scripted layout check found no overlap and nothing outside its section. No Font Awesome instance is left in the capture copies. A text search found "target", "baseline", "background" and "Verified" only where a frame says they are absent or withheld. The flows were not played in Present mode. No independent review has taken place.

## 8. Named version

The named Figma version "Report definitions · RP-06 — accepted" has not been saved. Dean saves it, or asks Claude to. The pull request stays a draft until he confirms it, as the lock-in protocol requires.
