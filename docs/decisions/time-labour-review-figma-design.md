---
document_id: PPO-FI01-TIME-REVIEW-FIGMA-DEC
date: 2026-10-31
owner: Dean Fiedler
status: Owner-accepted design; named Figma version waits for Dean; options F1-F3 await review; building the page, its data model and any Finance or payroll treatment separate
source_commit: 6e939bf0b937fc05f9e477d1cd14f8838c92fd9a
versioning: git
---

# Time & labour review design — owner decision

On 31 October 2026 Dean asked Claude to "design and build the coordinator's Time and labour review page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." Claude drew the page and asked whether he accepted it. Dean then asked for "an audit and polish", covering improvements, new and innovative features, professionalism and gaps. Claude applied the audit, listed feature options F1–F9 and asked "Do you accept the page with the recommended answers, and draw F1–F3 first?" Dean answered: "Accept and draw F1–F3".

The page draws what the [My jobs design](my-jobs-figma-design.md) left open: "the coordinator's job allowance view (r05 Desktop-Allowance), which belongs on a coordinator page", and the review of recorded time before it becomes billable.

Claude drew the page from these sources:
- the accepted [field work timer](field-work-timer-design.md) r05 and [My jobs design](my-jobs-figma-design.md);
- the accepted [Service planner](service-planner-figma-design.md) and [Travel review](travel-review-figma-design.md) designs;
- [ADR-0016](ADR-0016-p10-finance-handoff.md) and [ADR-0018](ADR-0018-p11-travel-and-integrated-quality.md) for original quantities and travel treatment;
- the [Finance workspace design](finance-workspace-design.md), and Finance handoffs FN-01 `2091:592837` as a proposal for context only;
- Dean's working hours of 10 October 2026: 08:00–17:00 standard, 07:00–18:00 allowed with a warning.

Scope:
- `scope:FI-01`, coordinator side. No new scope ID.
- Traced to parent requirement SVC-08: planned, recorded, reviewed and billable time remain separate. No parent ID is added or renamed, and none is marked complete.
- Proposed route `/service/time` and a technician view inside My jobs. Neither exists, and neither is registered as a route by this decision.

This is a design decision. It authorises no application code, route, read model, migration, capability, grant or deployment. The page never edits recorded time, invoices, pays anyone, books a visit or contacts a customer.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Accept the design | User decision, 31 October 2026 | "Accept and draw F1–F3", answering the question quoted above. Every recommended answer below is adopted on those words |
| Audit and polish before acceptance | User decision, 31 October 2026 | "Give the pages an audit and polish". Section 6 |
| Draw options F1–F3 | User decision, 31 October 2026 | Same words. They were drawn after the acceptance and Dean has not reviewed them, so they are **not accepted** by it (section 5) |
| D1–D19 | Claude's proposals, accepted with the design | Section 4 |
| Q1 Is travel billable by default? | Resolved as recommended | No. Non-billable by default (P11 v2, ADR-0018). The coordinator can decide otherwise with a reason, but billable travel needs a maintained Finance treatment before it is built |
| Q2 Who reviews time? | Resolved as recommended | The service coordinator. A team lead reads their crew's time and can be asked; nobody reviews their own time |
| Q3 Should payroll ever read from here? | Resolved as recommended | Payroll is out of scope. No: r05 says this time is for job costing, not attendance or pay. Any payroll use needs its own decision, reading recorded time, never billable |
| Q4 Should workshop hours use this page? | Resolved as recommended | No. They stay on Workshop builds CX-02 and may reuse this register later as a proposed departure. Not drawn |
| Q5 Which visit is 12 October? | Resolved as recommended | Accepted pages put SYN-PPO-APT-000049 at SYN Block C on Tue 13 Oct and the Glasshouse 4 visit SYN-PPO-APT-000052 on Thu 15 Oct. The 12 October visit is a new SYN-APT-000071. No reference is rewritten |
| Q6 Is SYN-PPO-WO-000040 multi-visit, quoted at 18 h? | Resolved as recommended | Story values for this page only. A build shows "Not established" until a quoted-labour source exists |
| Q7 Time past 07:00–18:00 | Resolved as recommended | Recorded and shown, never refused, and it needs a reason before it can be accepted |
| Q8 Long wait threshold | Resolved as recommended | 45 min as a setting, reviewed after field use |
| Q9 Send while a crew member is Waiting to sync | Resolved as recommended | Allowed. That time joins the same handoff until Finance approves it, then takes its own |
| Q10 When reviewed time reaches Finance | Resolved as recommended | FN-01's moment stays: on Service review approval. Send here only makes the hours ready and visible |
| Q11 "Approved timesheet" on FN-01 | Resolved as recommended | FN-01 reads "Reviewed time" when it is next changed. FN-01 is not edited now |
| Q12 Should the technician see billable marking? | Resolved as recommended | No, it is a commercial decision |
| Q13 Is waiting billable, including safety and approval stops (r05 open point 2)? | Resolved as recommended | Non-billable by default, the coordinator deciding with a reason. Not a verified rule |
| Q14 Can accepted time be reopened? | Resolved as recommended | Yes, until Finance approves the handoff; after that a correction goes through Finance. Reopening keeps the earlier acceptance in History |
| Payroll | User instruction, 31 October 2026 | "payroll is out of scope: say so, and ask me". Asked as Q3 |
| Named version | **Waiting for Dean's explicit yes** | Section 7 |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053). Named version "Time & labour review — accepted": not saved yet |
| Page | "Time & labour review · FI-01" `2920:2650`, under "— Service operations —", after My jobs · FI-01 `845:44`. Header `2920:2651`, notes card `2941:7667`. File index row `2960:12231` |
| Desktop 1440 | Section `2920:2686`:<br>• register `2929:347`; visit record, To review `2929:1071`; after the adjustment `2930:3398`; reviewed and sent `2930:5260`; history `2947:8362`<br>• query `2930:1378`; reply `2930:2009`; adjust `2930:2700`; billable `2930:4022`; accept `2947:7666`; send `2930:4601`<br>• allowance `2934:8391`; planner hand-off `2934:8729`<br>• outside hours `2934:8924`; long waiting `2947:8899`; cancelled visit `2947:9254`; queries `2947:9620` |
| Tablet 1024 | Section `2920:2690`: visit record `2936:11047` |
| Phone 390 and 320 | Section `2920:2694`, technician:<br>• 390: question waiting `2947:9998`, reply `2936:11894`, no signal `2947:10145`, my reviewed time `2936:11954`<br>• 320: reply `2936:12125`, my reviewed time `2936:12185` |
| States | Section `2920:2701`: loading `2940:5739`, nothing to review `2940:6426`, could not load `2940:7033`, read-only `2940:7639`, waiting to sync `2940:8252`, changed by a late sync `2940:8853`, uncertain save `2940:9368`, no access `2947:10201`, someone else changed it first `2947:10387`, handoff already approved `2947:10789` |
| Options, not accepted | Section `2956:10102`: F1 `2956:10103` and `2956:10510`, F2 `2956:10613`, F3 `2956:11159` and `2956:11412` |
| Flows | "Time review — desktop", "Time review — phone", and for the options "Time review — F1 bulk accept (awaiting review)" and "Time review — F3 early warning (awaiting review)". Set by script, not played in Present mode |
| Page parts | Section `2923:3414`: Rail · Service with Time `2923:3415`, Time / Segment `2923:3654`, Time grid header `2923:3655` and row `2923:3710`, Time / Segment header `2923:3751` and row `2923:3776`. They stay on this page until a build needs them. No shared component was changed, so no component binding is added |
| Retained captures | [Time & labour review design r01](../reference/ui/service/time-labour-review-design-r01/README.md): thirty-four icon-free PNGs with hashes. Options F1–F3 are not in this set |

## 3. Story and conformance

**Story.** Synthetic, as at Tue 13 Oct 2026, 09:00 AEST, signed in as Sasha Cole, service coordinator. Casey Ward and Riley Tran on Mon 12 Oct at SYN Glasshouse 4, under SYN-PPO-WO-000040, booked 08:00–16:00.

| Segment | Time | Duration |
|---|---|---|
| Work | 07:20–08:10 | 50 m |
| Waiting for access, with a note | 08:10–08:35 | 25 m |
| Work | 08:35–11:10 | 2 h 35 m |
| Travel, collecting parts | 11:10–12:20 | 1 h 10 m |
| Break | 12:20–12:50 | 30 m |
| Work | 12:50–16:05 | 3 h 15 m |

| Hours | Work | Travel | Break | Waiting | Total |
|---|---|---|---|---|---|
| Planned | 7 h 30 m | — | 30 m | — | 8 h 00 m |
| Recorded | 6 h 40 m | 1 h 10 m | 30 m | 25 m | 8 h 45 m |
| Reviewed | 6 h 10 m | 1 h 40 m | 30 m | 25 m | 8 h 45 m |
| Billable | 6 h 10 m | — | — | — | 6 h 10 m |

Query 09:06, reply 09:34, adjustment 09:41: Casey left site at 10:40 and forgot to pause, so Work 08:35–11:10 becomes Work 08:35–10:40 and Travel 10:40–11:10, with the original kept. Accepted 09:50, sent with new SYN-FH-000074 at 09:55.

Allowance: 18 h quoted, 12 h 00 m used (Casey 6 h 10 m reviewed, Riley 5 h 50 m synced to 13:50), about 8 h left, 6 h booked on SYN-PPO-APT-000052, 2 h not booked, forecast 20 h 00 m. All figures are fixtures: not a quote, a rate or an operating rule.

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:FI-01`, coordinator side, traced to SVC-08. Proposed route `/service/time`. No capability exists for it |
| Page type (r20) | Work queue + persistent detail (register and exceptions). Review / comparison (visit record). Form / guided workflow as docked side forms, and one short centred dialog for Accept. Overview (allowance). Phone: technician reply and read-only time |
| Reused components | Shell / Top bar `35:138` linked, a page clone of Rail · Service, v2 / Menu strip, Menu item and Menu heading, Grid / Header cell, Cell, Checkbox cell, Row actions cell, Grid / Group band (proposed, PR #694), Record / Header, Readiness bar, Check item, View tab, Field, Section heading, History item, Banner, Filter chip, Controls / Form field and Choice option (proposed, PR #694), Button, Tag, Toolbar search, Conversations / Message, Shell / Phone header · compact `1530:110`, v2 / Tab bar (phone). New, page only: section 2 |
| Source authority | User brief and decisions above; accepted designs and ADRs listed above; FN-01 as a proposal; proposed composition; fictional fixture |
| Incoming handovers | Read-only: planned visits and booked hours (PL-01, SV-04); timer segments, notes and the "How much work is left?" answer (FI-01); offline time still on a device (FI-02); the work order and its authorised scope (SV-03); quoted labour (no source: r05 open point 4) |
| Outgoing handovers | Reviewed billable hours attached to the work order's handoff (FN-01): prepared here, sent when Service review SV-06 approves the report, raised by Finance. A query to the technician's My jobs. A request to the Service planner tray: the planner books |
| Exceptions and recovery | Loading, nothing to review, could not load, read-only, no access, waiting to sync, changed by a late sync, uncertain save, someone else changed it first, handoff already approved |
| Departures | Section 4 |
| Verification | Section 6 |

## 4. Decisions drawn (D1–D19)

| ID | Decision | Basis |
|---|---|---|
| D1 | Route `/service/time` and a Time & labour rail item after Service review, counting records to review. **Departure:** no route exists; the rail is a page-only clone | Brief |
| D2 | Side menu collapsed to its strip on the register and record, because eleven columns need the width; open on Exceptions and Allowances | Service planner D1 |
| D3 | **Departure:** per-kind segment colours. r05 defines only working, earlier-days and forecast colours. Work uses the success green, as My jobs V3 and Q6; Travel info, Break neutral, Waiting warning, Adjusted dashed; always with words | r05, My jobs |
| D4 | Planned, recorded, reviewed and billable are four separate rows on every record | SVC-08 |
| D5 | Recorded time is never edited in place. An adjustment is a reviewed record with a reason; the row states the original and the technician sees both | Brief; ADR-0016 |
| D6 | Review states: Waiting to sync, To review, Queried, Reviewed, Adjusted. A late sync returns a record to To review, keeps the earlier review visible and holds the handoff | Brief |
| D7 | Query, adjust, billable, send and planner request are 480 px docked side forms, as on FN-01 | PPO-UI-CONFORMANCE |
| D8 | **Departure:** Send attaches hours to the work order's handoff (new SYN-FH-000074), which reaches Finance when Service review approves the report. Finance applies rates and raises in MYOB; this page shows no rate or amount | Brief; FN-01; Q10 |
| D9 | **Departure:** a long wait is over 45 min in one stretch; time outside 07:00–18:00 needs a reason | Working hours; Q7, Q8 |
| D10 | Accepting a warning needs a reason, keeps the warning and changes no time | Brief |
| D11 | Allowance view by crew and day. "Work left" is a best guess and never changes recorded time. Time not booked becomes a request to the planner; this page books nothing. No data source exists | r05; My jobs section 5 |
| D12 | **Departure:** technician My time inside My jobs, read-only, showing recorded and reviewed but not billable. Replies never change time. Inputs 16 px, main action 48 px | Brief; phone header amendment |
| D13 | Travel here is the timer's Travel pause ("Collecting parts"). Planned allowances and depot legs stay with Travel review PL-05 as a separate fact | r05; PL-05 |
| D14 | New records only: SYN-APT-000071, SYN-FH-000074, SYN-WO-000084 to 000087. Morgan Lee's row matches FN-01's SYN-FH-000061 | Readable reference namespaces |
| D15 | Register cells read "6 h 40" to fit; records read "6 h 40 m". Job names truncate in the register and read in full on the record | Audit |
| D16 | Mark billable, then Accept, then Send, so the main action says what comes next. Accept is a short centred dialog | Audit; PPO-UI-CONFORMANCE |
| D17 | History holds the original beside the reviewed version and every change with actor, time and reason. Technician wording is quoted | Brief |
| D18 | Each exception has its own side form. Time against a cancelled visit stays against that visit; long waits stay Waiting | Brief |
| D19 | A query never expires or chases by itself. A person sends reminders, and reviewing without a reply is recorded | Audit |

Workshop hours are not on this page (Q4).

## 5. What this does not decide or build

- **Options F1–F3 are not accepted.** Claude drew them after Dean's acceptance, as he asked, and they await his review:
  - F1 clean-visit bulk accept, including its rule, the 15 min margin and the shared reason;
  - F2 evidence on the day timeline: marks only, a person decides, no device location;
  - F3 allowance early warning in My Work, whose frame is an excerpt: the My Work page is not edited.
- **F4–F9 are listed on the notes card and not drawn.**
- **Building the page.** The application has no time-entry, adjustment, review or billable record, no allowance source, no "work left" record, no planner request type and no capability for this page. The accepted FI-01 timer design is itself not built.
- **Finance.** The handoff contract is unchanged. Billable travel and waiting need a maintained treatment first (Q1, Q13). FN-01 stays a proposal, and its wording is not edited (Q11).
- **Open:** Jordan Kim appears as a second coordinator only in one state frame, and that role is unconfirmed.
- **Not drawn:** bulk actions on selected rows other than F1; hover states and open menus; a coordinator phone view; a register at tablet width; 200% zoom.

## 6. Verification

- **Audit of 31 October 2026, by script and screenshots.** Found and fixed:
  - a Riley Tran start that needed an unshown warning (now 08:00–13:50, still 5 h 50 m);
  - side forms citing segment numbers no table shows;
  - an "Accept time" action that opened billable marking;
  - stale counts on the late-sync state;
  - a shortened reference in the allowance table;
  - a Break column the column retune clipped.
- **Structure.** Roboto only; no overlap, nothing outside a section, no side form overflowing; no off-page prototype link; no clipped figure in the register. Job names in the register do truncate (D15).
- **Flows were not played in Present mode.** The links were set by script and each returned success.
- **Captures.** Thirty-four copies on "Captures (icon-free)" `115:2`, from y = 1,335,000. A scan after the swap found no Font Awesome instance, including in hidden layers, and no prototype link, and every Glyph sampled sat inside `Icon/placeholder`. Exported at scale 1; all thirty-four match their frames' sizes, and four were inspected by eye (01, 18, 22, 34), plus a sample copy on the Captures page. Hashes are in the [captures README](../reference/ui/service/time-labour-review-design-r01/README.md).
- **Not evidenced.** Nothing is built. No technician, coordinator, device, accessibility or operational review is recorded. The register's visual status is unchanged, and no review fingerprint was copied. Captures are design compositions, not a UI baseline.

## 7. Named version

"Time & labour review — accepted" is **not saved**. It needs Dean's explicit yes, and it would also include the F1–F3 section, marked as awaiting review. This pull request stays in draft until he confirms it.
