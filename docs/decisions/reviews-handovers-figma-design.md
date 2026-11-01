---
document_id: PPO-SH06-FIGMA-DEC
date: 2026-11-01
owner: Dean Fiedler
status: Owner-accepted design amendment; named Figma version not yet saved; building the views, the newer sources and any source receipt separate
source_commit: 1fc002978ee2a6871121d9252609a49c6dc31b9a
versioning: git
---

# Reviews & handovers design — owner decision

On 31 October 2026 Dean asked Claude "to design and build the "Reviews and handovers (SH-06)" amendment in Figma as a proposal for my review. Draw the frames; do not stop at a written brief." Claude drew the amendment and asked "Do you accept the SH-06 proposal with its recommended answers?" On 1 November 2026 Dean answered: "Accept as recommended".

The accepted [My Work page](my-work-page-design.md) already holds a Reviews & handovers frame, `415:91696`. This amendment starts from copies of that frame and draws only what it lacks: the six views of the issued [SH-06 design](cross-module-approvals-handover-design.md), the persistent detail pane, the newer review sources and the phone list to detail. The accepted frames on `404:2` are not edited.

Claude drew the amendment from these sources:
- the issued [r01 HTML](../reference/ui/approvals-handover/PPO-Cross-Module-Approvals-and-Handover-Inbox-r01.html) and [report](../reference/ui/approvals-handover/PPO-Cross-Module-Approvals-and-Handover-Inbox-Report-r01.md);
- the [My Work page decision](my-work-page-design.md) (R2, R3, frame `415:91696`);
- the built `src/components/review-workspace.tsx` and `src/reviews/service.ts`;
- the source pages named in section 3, for their records.

Scope:
- `scope:SH-06` and `route:/work/reviews`. No new scope ID or route.
- Parents unchanged, as r01 maps them: CRM-03, DOC-06, NFR-01, NFR-05, NFR-08 and NFR-11 for the SH family, and CRM-03, PRJ-03, SVC-02, SVC-12, DOC-05, NFR-01 and NFR-11 under F06/F06-A. No parent ID is added or renamed, and none is marked complete.

This is a design decision. It authorises no application code, read, migration, capability, grant or deployment. Nothing on this page approves, returns, publishes, posts or completes a source task.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Accept the design | User decision, 1 November 2026 | "Accept as recommended", answering the question quoted above. Every recommended answer below is adopted on those words |
| D1–D14 | Claude's proposals, accepted with the design | Section 4 |
| Q1 Should All permitted open tasks be for managers only? | Resolved as recommended | No. It is shown to everyone and filtered by what each person may read. r01 treats it as coordination, and the source page still checks who can decide |
| Q2 One queue or separate views for handovers and reviews? | Resolved as recommended | Separate, as r01 keeps them. All permitted is the one combined view |
| Q3 Which sources first in the build? | Resolved as recommended | The built Service, Finance and Engineering sources; then Won-deal receiving and Sales brief; then Reviews & approvals, Estimate review and Quotation release; then Technical reviews, Product publication and Catalogue import; then Measure and Report definitions and Claims; Data quality and Settings last. One at a time, proving the source receipt updates the queue (r01 section 16). This orders the sources; it does not start a build |
| Q4 Should due dates come only from source rules? | Resolved as recommended | Yes. The queue computes nothing, and Overdue can appear only when a source supplies the rule |
| Q5 EN-07 names Jamie Rossi as authoriser for SYN-ECR-000014 | Resolved as recommended | The story keeps it waiting on Dean. EN-07 is not edited |
| Q6 FN-01 closes SYN-FH-000060 on Mon 12 Oct at 10:12 | Resolved as recommended | The story keeps it waiting at Tue 09:00. FN-01 is not edited |
| Q7 CR-03 is dated Mon 19 Oct and names Morgan Hale as sales owner of SYN-PPO-OPP-000321 | Resolved as recommended | The story keeps Dean as sender. CR-03 is not edited |
| Q8 FN-01 shows SYN-PPO-RPT-000058 issued; SV-06 shows it Submitted | Resolved as recommended | SV-06 is the source. The base frame's SYN-PPO-SRPT-000088 is not on SV-06, so it is not used |
| Q9 REP-02 return | Resolved as recommended | Avery Lin's return at Tue 08:20 is new for this story. RP-06 shows v1 Draft and states the open point. The item is labelled Report definitions RP-06, where the record lives |
| Q10 Sent submissions holds 3 | Resolved as recommended | FN-06 and FN-04 name Dean as submitter of Earned value v1 and Claim 3, so they are listed with the won handover. FN-06 also makes Dean approver of Actual cost v2, left out to keep the four waiting items; a real queue lists it |
| Q11 Ages | Resolved as recommended | r01's calendar-day rule applies in this queue, so a handoff FN-01 shows as 3 d reads 4 d. Ages for Claim 3, Earned value and the Settings request are story values; Settings is drawn at Thu 22 Oct |
| Named version | Not saved | Section 7 |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Reviews & handovers · SH-06" `2998:12031`, under "— My Work —", after My Work · SH-01 · SH-02 `404:2`. Header `2998:12032`, notes card `3006:17978`. File index row `3093:16575` |
| Base frame, not edited | `415:91696` on `404:2` |
| Desktop 1440 | Section `2998:12077`: Owned reviews with detail `3000:2059`; All permitted open tasks, full length `3001:3963`; Returned submissions `3001:4804`; Handovers `3001:5255`; Sent submissions `3001:5748`; Historical outcomes, read only `3001:6241`; Filters open `3002:1935` |
| Tablet 1024 | Section `2998:12081`: queue `3005:2299`, detail as overlay `3005:2615` |
| Phone 390 and 320 | Section `2998:12085`:<br>• 390: list `3005:2948`, detail `3006:12955`, back to list `3005:3197`, All permitted back at row 9 `3005:3412`, view chooser `3006:13207`, filters `3006:13242`<br>• 320: list `3005:3654`, detail `3006:13081`, back to list `3005:3892` |
| States | Section `2998:12092`: loading `3006:15276`, nothing waiting `3006:15677`, could not load `3006:16055`, one source failed `3006:16437`, source revision changed `3006:16950`, item no longer permitted `3006:17504` |
| Flows | "SH-06 — desktop" and "SH-06 — phone", 62 links set by script, none leaving the page. Not played in Present mode |
| Page parts | Section `2999:1104`: Reviews / Queue header `2999:1105`, Queue row `2999:1170`, List row (phone) `3005:2947`. They stay on this page until a build needs them. No shared component was changed, so no component binding is added |
| Retained captures | [Reviews & handovers design r01](../reference/ui/my-work/reviews-handovers-design-r01/README.md): twenty-four icon-free PNGs with hashes |

## 3. Story and conformance

**Story.** Synthetic, as at Tue 13 Oct 2026, 09:00 AEST, signed in as Dean Fiedler.

| View | Items |
|---|---|
| Owned reviews, 4 | SYN-FH-000060 goodwill remedy, Not to be posted (Finance handoffs); SYN-PPO-RPT-000058 r01 (Service review); SYN-ECR-000014 v2, the CP-4 contactor change authority (Change review); SYN-PROD-DP25 r04 (Product publication) |
| Returned submissions, 1 | REP-02 Conversion v1 (Report definitions) |
| Handovers, 3 | SYN-PPO-OPP-000030 r1 (Sales brief); SYN-PPO-OPP-000321 r1 (Won-deal receiving); SYN-FH-000072 (Finance handoffs) |
| Sent submissions, 3 | SYN-PPO-OPP-000321 r1, waiting for Sam Patel to accept; Earned value v1 (Measure definitions); SYN-CLM-000056 (Claims & obligations) |
| All permitted open tasks, 17 | The above, with SYN-EST-0142 v3 (Reviews & approvals), SYN-REV-000045 v1 (Technical reviews), SYN-EST-0139 v2 (Estimate review), SYN-QUO-0087 r1 (Quotation release), SYN-DQF-000042 (Data quality), nfs-dosing-2026-10-12 (Catalogue import) and SYN-PPO-ACR-000004 (Settings) |
| Historical outcomes, 5 | SYN-FH-000058, SYN-PPO-RPT-000053 r01, SYN-PROD-CP40 r03, SYN-PPO-QUO-000188 r2 and FD-08 v1 |

Records come from the drawn pages and no reference is rewritten or added. All values are fixtures: not an operating rule, deadline or authority.

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:SH-06` Cross-module approvals and handover inbox, `route:/work/reviews`. An amendment to `404:2`, parents as above |
| Page type (r20) | Work queue + persistent detail, as issued in r01. Supporting: Record detail for the pane. Phone: list to detail |
| Reused components | v2 / Rail, Shell / Top bar `35:138` linked, v2 / Menu item, heading, strip and edge, Shell / Phone header · compact `1530:110`, v2 / Tab bar (phone), Shell / Quick add (phone), Grid / Header cell, Cell and Row actions cell, Grid / Group band (proposed, PR #694) `2651:7352`, Controls / Choice option (proposed, PR #694) `2648:7409`, Button, Tag, Font Awesome Light icons through the Kit. New, page only: section 2. Reviews / List row (phone) follows Grid / List row (phone, proposed) `2651:7385` with a fourth line |
| Source authority | User brief and decisions above; issued r01; accepted My Work; built SH-06; the source pages, some still proposals, for their records; fictional fixture |
| Incoming handovers | From the My Work side menu, the phone view chooser, notification links and global search. Each source supplies a permission-filtered task: company, record identity, exact revision, source state, action owner, submitter, due date or none, next action and source freshness |
| Outgoing handovers | "Open" and "Decide in [source page]" go to the exact record and revision on its own page, with a safe return. Only the source page decides, transfers, corrects, resubmits, issues, accepts or reconciles. Sent, received and accepted stay separate |
| Exceptions and recovery | Loading, nothing waiting, could not load, one source failed, source revision changed, item no longer permitted |
| Departures | Section 4 |
| Verification | Section 6 |

## 4. Decisions drawn (D1–D14)

| ID | Decision | Basis |
|---|---|---|
| D1 | **Departure:** six views sit in the My Work side menu under Reviews & handovers, each with a count. This replaces the view picker on `415:91696` | Brief; r01 |
| D2 | **Departure:** view names are Owned reviews, All permitted open tasks, Returned submissions, Handovers, Sent submissions and Historical outcomes. The built page says My reviews, All permitted, Returned to me, Handovers, Sent by me and History | Brief |
| D3 | **Departure:** the detail pane is persistent beside the queue, and at 1440 the rail collapses so a 728 px queue and a 376 px pane both fit. The built page uses WorkDialog | r01; AI-01 precedent |
| D4 | **Departure:** rows are two lines, 56 px, so source page, record and revision stay together under the item. The accepted grid is 40 px. State and person share a column | Brief |
| D5 | Total age, this cycle, source due date and no due date stay separate. Ages follow r01: calendar days at midnight boundaries, descriptive only. **Departure:** "No due date" replaces the "Date needed" of r01 and the built page | Brief; r01 |
| D6 | State is in words on a Tag: Waiting for you, Returned to you, Waiting for them, Completed. No Overdue state or filter is drawn, because no source rule is supplied to this queue | Brief |
| D7 | No approve, return or complete control exists here. "Decide in [source page]" appears only when it waits on you, "Correct in [source page]" when it came back to you, and "Open in [source page]" otherwise. Reading, filtering and notifications change nothing | r01 |
| D8 | Handovers keep Sent, Received and Accepted as separate facts, each with its own date or an explicit "not yet" | r01 section 9 |
| D9 | Historical outcomes are read only. Where this queue has no first-submission date it says "Not held" | r01 section 5 |
| D10 | Filters are Source module, Type, Age and Due date. Sixteen source pages group into eight modules. Tablet and phone use one Filters control; phone choices are 16 px | Brief |
| D11 | Tablet 1024 opens detail as an overlay. Phone goes list to detail with Back to list and returns to the same row, highlighted | r01 departure, kept |
| D12 | A dash means not read and never means zero. "+" marks a partial count when one source failed. An item no longer permitted hides its source, revision and history | r01 section 11 |
| D13 | Built today: Service report, Finance handoff and Engineering change review and receiving. All other sources are drawn as designed, each with its source label. Asks in Conversations are not reviews and never appear | Brief |
| D14 | The rail is the base frame's, as on `404:2`, with the account changed to DF | Brief |

## 5. What this does not decide or build

- **Building the views.** The application has six bounded views over Service report, Finance handoff and Engineering change review and receiving records. The side-menu views, the pane, the new columns and every newer source are not built, and no read exists for them.
- **Source pages.** None is edited. Several are themselves proposals, and acceptance here does not accept them. Q5–Q8 record differences between this story and those pages, and they remain differences.
- **Authority.** Reviewer, deputy, routing, escalation and service-level policy stay with each domain, as r01 section 16 says.
- **Not drawn:** saved views, sort and column settings; the source pages; a 768 width; a keyboard walkthrough.
- **Not verified:** the built page's bounded source slices and queue page size are not restated by this design, and they still limit what a count can claim.

## 6. Verification

- **Structure, by script and screenshots.** Every frame was checked in screenshots inside Figma. A scan found no overlap, nothing outside a section, no detail pane or queue content past its frame, no off-page prototype link and no stray node. Seven off-page tab links carried by the phone base frame were removed. No Overdue state appears.
- **Flows were not played in Present mode.** The links were set by script and each returned success.
- **Captures.** Twenty-four copies on "Captures (icon-free)" `115:2`, from y = 1,452,000. After the swap a scan found no visible Font Awesome instance; hidden layers inside instances keep theirs and do not export. Exported at scale 1; all twenty-four match their frames' sizes, and four were inspected by eye (01, 11, 15, 23). Hashes and exported sizes are in the [captures README](../reference/ui/my-work/reviews-handovers-design-r01/README.md).
- **Not evidenced.** Nothing is built. No user, device, accessibility or operational review is recorded. The register's visual status is unchanged, and no review fingerprint was copied. Captures are design compositions, not a UI baseline.

## 7. Named version

Not saved. Dean saves "Reviews & handovers · SH-06 — accepted", or says that Claude may. The pull request stays a draft until he confirms it.
