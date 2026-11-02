---
document_id: PPO-RP04-SERVICE-PERFORMANCE-FIGMA-DEC
date: 2026-11-01
owner: Dean Fiedler
status: Owner-accepted design; native implementation, measure definitions and UI baseline acceptance separate
source_commit: 1fc002978ee2a6871121d9252609a49c6dc31b9a
versioning: git
---

# Service, maintenance and resource performance RP-04 design — owner decision

On 24 October 2026 Dean asked for the design of the Service management report: "Your task is to design and build the "Service, maintenance and resource performance (RP-04)" UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." Claude drew the page in Figma, audited it and presented it with fourteen decisions and eight questions. It covers:
- the report at `/reports/service`, one page with field readiness (KPI-01, KPI-02) first, then scheduling (KPI-03, KPI-04), outcomes (KPI-05, KPI-06), data quality (KPI-07), coverage and follow-up (REP-12) and capacity context from PL-03;
- the report header, a chart and a table in each section, and drills to source records;
- KPI-04 median and tail, the REP-12 maintenance list, "Definition pending" and export;
- desktop 1440, tablet 1024, phone 390 and 320, and seven states.

Claude drew the page from these sources:
- [BP-01](../blueprints/BP-01-master-blueprint.md) §22.1 to §22.3 (KPI-01 to KPI-07, REP-12);
- the [field readiness gate](field-readiness-gate-proposal.md), and the [Job pack](job-pack-figma-design.md), [My jobs](my-jobs-figma-design.md), [Service planner](service-planner-figma-design.md), [Service review](service-review-figma-design.md), [Changes and follow-up](changes-follow-up-figma-design.md) and [Capacity review](capacity-review-figma-design.md) designs;
- Service and Finance [download access](report-finance-download-access.md) and the [conformance standard](../standards/html-module-conformance.md);
- the report shell of RP-01 and RP-02, and the drawn Findings, Maintenance, Service agreements, Field team and Site readiness pages.

On 1 November 2026 Dean answered "Do you accept the RP-04 proposal, and with which answers to Q1–Q8?": "Accept, use recommendations". This record reads that as adopting D1–D14 and the recommended answers to Q2–Q8.

Claude then found that its recommendation for Q1 was wrong. It had recommended a cutoff of 24 hours before the visit, describing that as the gate's issue lead time (P5). P5 is actually 12:00 site time on the last working day before the visit; the gate's 24 hours is the site confirmation window. Claude told Dean before anything was committed and asked which cutoff to use. He answered: "Use the gate's rule". The frames, captures and this record all use that rule.

Scope:
- `scope:RP-04` "Service, maintenance and resource performance", at `/reports/service`. No new scope is added.
- No parent requirement ID is added or renamed; all 78 remain.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, grant, seed, export or deployment. It publishes no measure definition and sets no target or baseline. Every record, figure and date shown is synthetic.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the page RP-04 | User decision, 24 October 2026 | Dean's request quoted above |
| Decisions D1–D14 | Accepted as drawn, 1 November 2026, with D7 corrected | Dean's answers, quoted above. Section 4 |
| Q1 Pack cutoff | User decision; replaces the first recommendation; design direction only | 12:00 site time on the last working day before the visit, the gate's P5 rule, so a pack cannot meet the gate and miss KPI-01 by a different deadline. Callouts booked after the cutoff are permitted exceptions, counted apart. The definition still has to be published in Measure definitions (section 6) |
| Q2 Return-visit window | Resolved as recommended; design direction only | 14 days from the first attendance on the same work order scope item and equipment, excluding planned multi-visit work flagged when the work order was authorised. The frames keep KPI-06 withheld, because the definition is not published |
| Q3 Who owns RP-04 | Resolved as recommended | Dean, until a service manager is named in PPO. The department owner proposes each definition and a second person approves it |
| Q4 Technicians' own figures | Resolved as recommended; needs a row-level filter at build | Yes: their own rows only (state S6), never a colleague's and never a comparison with others. Managers see everyone |
| Q5 When a pack must be acknowledged | Resolved as recommended | Before the visit starts, for the applicable revision. A reissued revision asks again, and the earlier acknowledgement stays on record |
| Q6 Tail measure | Resolved as recommended | The 90th percentile by nearest rank, with the slowest value and the median as the headline. Averages are not shown |
| Q7 Permitted exceptions | Resolved as recommended | Same-day callouts booked after the cutoff, and visits the customer asked to bring forward. Anything else stays in the rate and shows a reason |
| Q8 Where service definitions live | Resolved as recommended | Measure definitions (FN-06), as a Service group, with versions, effective dates and two-person approval |
| Accept the design | User decision, 1 November 2026 | Quoted above |
| Named Figma version | Saved by Dean, 1 November 2026 | "I have saved the named version as Service performance · RP-04 — accepted". Section 8 |
| Building the page | Not decided | Section 6 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Service performance · RP-04" `2411:33278`, under "— Reporting —", after Sales performance · RP-02. The page header holds the conformance declaration and the "Notes · RP-04 proposal" card holds D1–D14, Q1–Q8, the flows, story sources and gaps. File index: the row "Row / Service performance · RP-04" `3096:30671` in the Reporting group |
| Desktop 1440 | Full report `2413:196`, with sections field readiness `2418:887882`, scheduling `2421:395`, outcomes `2421:667`, data quality `2426:589`, coverage and follow-up `2426:763` and capacity context `2426:1192`; KPI-01 drill `2442:2779`; KPI-04 median and tail `2447:1963`; REP-12 maintenance list `2447:2413`; KPI-06 Definition pending with About this measure open `2451:894198`; export side form `2451:894542` |
| Tablet 1024 | Full report, rail and side menu collapsed `2453:2205` |
| Phone 390 and 320 | Field readiness summary `2464:897493` and `2464:898007`; drill list `2464:897803` and `2464:898317` |
| States | S1 loading `2474:3113`; S2 no data `2474:3396`; S3 could not load `2474:3722`; S4 partial completeness `2474:4054`; S5 definition pending, cutoff not agreed `2474:4440`; S6 restricted sections, technician Casey Ward `2474:4756`; S7 stale source `2474:5095` |
| Components | Moved at acceptance to the Components page, section "Components · Reporting parts" `2781:344446`, keeping their node IDs and instances: Report / Rate tile `2413:87` (percentage with its counts in words beside it) and Report / Withheld tile `2413:100` |
| Prototype | Flows "RP-04 — desktop" and "RP-04 — phone" |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00 AEST, September 2026 beside August, signed in as Dean Fiedler. S6 is signed in as Casey Ward. Existing references are unchanged. September rows the drawn pages do not hold are placeholders (section 6) |
| Retained captures | [Service performance design r01](../reference/ui/reporting/service-performance-design-r01/README.md): twenty-two icon-free PNGs of eighteen frames, with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:RP-04` Service, maintenance and resource performance, `/reports/service`. BP-01 §22.1 to §22.3: KPI-01 to KPI-07 and REP-12, with PL-03 as context only. Parent IDs unchanged. Reads `pack.read`, `schedule.read`, `report.read`, `service.work_order.read` and `maintenance.read`; `reporting.service.read` and `reporting.export` stay proposed |
| Page type (r20) | Record detail (report page, sharing the RP-01 and RP-02 shell). Supporting: a right-side inspection panel for source records and About this measure, a side form for Export, and an Overview strip for field readiness |
| Reused components | The report shell: Rail · Reports (proposal), the top bar with the Conversations action, v2 / Menu item and Menu heading, toolbar and report header facts, Record / Banner, Button and Tag. Report / Tile, Cell, Header cell, Section header and Legend item from RP-02. FN-05 Outlook / Basis swatch for patterns. RP-01's Export, About and source-record side panels. The compact phone header and action bar. New: the two parts in section 2 |
| Incoming handovers | Reports overview RP-01 (rail item and catalogue). Read-only reads, each with its as-at time, of Service requests, Work orders, Service planner, Changes and follow-up, Field team, Job pack, My jobs, Site readiness, Service review, Findings, Service agreements, Maintenance, Warranty cases, Equipment, Capacity review and Measure definitions |
| Outgoing handovers | Rows open their source records on their own pages, where the owner acts. About this measure opens Measure definitions or shows Definition pending. Export produces a file with a manifest and an audit event. The page edits, assigns, books, issues, acknowledges and sends nothing, and never writes to MYOB |
| Source authority | The records listed above. RP-01 and FN-06 are still proposals; section 6 records that dependency |
| Proposed departures | Accepted: section 4 |
| Status | Owner-accepted design, 1 November 2026 |
| Decision record | This file |
| Named version | "Service performance · RP-04 — accepted", saved by Dean on 1 November 2026 |

## 4. What the design shows

### The page (D1–D5)

- **Field readiness first (D1):** KPI-01 and KPI-02 lead and link to the readiness gate, because they measure the field readiness problem.
- **Every rate carries its counts (D2):** numerator and denominator in words beside the percentage (86% · 31 of 36 eligible visits), with August beside September. A percentage never stands alone.
- **No target, baseline, utilisation score or good/bad colour (D3):** values are ink, and tags name data states in words.
- **Definition pending withholds the value (D4):** the value is not shown and the missing definition is named. Counts that need no definition are still shown.
- **Missing is never zero (D5):** partial history shows Not known (S4), an empty filter shows no rate (S2), an unread source shows Could not load (S3), and a stale source shows Out of date with its read time (S7).

### The measures (D6–D9)

- **Acknowledgement (D6):** KPI-02 counts only acknowledgement of the applicable revision before the visit. Returned and Not acknowledged are apart, and receipt, open and read never count.
- **The cutoff (D7, corrected):** KPI-01 uses the gate's issue lead time. It becomes a measure definition only when Measure definitions publishes it; S5 is what the app shows until then. The gate treats a late issue as a warning that still dispatches, and KPI-01 counts it as not ready by the cutoff without blocking anything.
- **Period and now (D8):** September is complete and compared with August. Live items are labelled "Not in September" and never change the month's rate.
- **Median and tail (D9):** KPI-04 and KPI-05 show the median, the 90th percentile and the slowest value. Unfinished items are counted apart and never given an elapsed time that reads as a result.

### Drill-down, export, capacity and phone (D10–D14)

- **Drill to the source, read only (D10):** a row opens an inspection panel listing each source record with its read time and an Open link.
- **One route, six sections (D11):** each section has its definition, grain, sources and completeness. Save view and Export follow RP-01.
- **Capacity is context (D12):** hours booked of hours available from PL-03, with effort unknown counted and never turned into hours. No score and no percentage.
- **Phone (D13):** the service manager sees the field readiness summary and one read-only drill list, with 44 px targets. Source records and Export stay on desktop.
- **Who sees what (D14):** technicians see only their own figures, and a section a role may not read is counted, never valued.

### Departures, accepted

| ID | Departure | Pattern it changes |
|---|---|---|
| D1 | The field readiness pair leads, ahead of the REP order | RP-02's section order follows its REP numbers |
| D11 | Service & maintenance is the fifth item of the Reports rail, which `src/shell/navigation.ts` lacks | The current workspaces, as on RP-01 |
| Story | The main frames show definitions as adopted v1, which do not exist yet; KPI-06 and S5 show the state that applies until they do | RP-01's catalogue status for REP-12 |
| Story | September placeholder rows use the `SYN-PPO-` prefix to sit inside the drawn appointment sequence | New records normally use `SYN-<TYPE>-000nnn` |

## 5. Earlier records this amends

None. The [field readiness gate](field-readiness-gate-proposal.md) keeps P5 as written, and its value stays synthetic until Service sets real values under D-015. KPI-01 follows that value when it changes.

## 6. Not decided and not drawn

- **Building the page.** No route exists. The build order is not decided.
- **Publishing definitions.** This acceptance publishes nothing. Until KPI-01 to KPI-07 and REP-12 are published with a second person's approval, the page must show Definition pending for them.
- **RP-01 and FN-06.** Both were still proposals when this was accepted. If either changes the shared report shell or the definition model, this design follows it through a recorded amendment.
- **Prerequisites for a build:**
  - the `/reports/service` route in the Reports workspace;
  - definitions in the Measure definitions model;
  - event history kept from the first run (pack check, issue and acknowledge; change confirm and acknowledge; report submit, review and issue), since past periods cannot be rebuilt from current state;
  - the issue lead time in a scheduling policy, as gate P5 requires;
  - export with a manifest and audit event;
  - personal saved views and per-source read status;
  - a row-level filter for technicians;
  - `reporting.service.read`, with the access-review chain.
- **Not drawn:** the Save view dialog and an opened saved view; the filter panel; drills for KPI-03, KPI-05, KPI-07 and the capacity grid; the phone report after field readiness; a chart comparing August; keyboard order, 200% zoom and dark mode.
- **Data in the frames:** synthetic, and it sets no operating rule. These were invented for this page: September appointments SYN-PPO-APT-000033 to -000046, work orders SYN-PPO-WO-000024 to -000032, reports SYN-PPO-RPT-000033 to -000047, every maintenance row except SYN-MOC-000118, -000121 and -000131, SYN-AGR-000009, and the finding ages SV-07 does not date.
- **Drawn pages that disagree (left to fix at source):**
  - SYN-PPO-APT-000049 is Wed 14 Oct 10:30 on Job packs, but Tue 13 Oct 08:30 on Findings and Capacity review;
  - SYN-PPO-APT-000052's change is 13:30 to 14:30 on Changes and follow-up, but Thu 15 Oct on Site readiness.

  This report follows Job packs and Changes and follow-up.

## 7. Audit and polish

Before presenting the page Claude screenshotted most frames inside Figma and checked section bounds and overlaps by script. For the main report it also checked fonts, placeholder text, percentages without counts and wording. Not every retained image was opened at reading size: Claude opened the final 02, 10, 14 and 16, and 01a and 17 before their last small fix. The others were checked by text search and script only.

- **Corrected before presenting:** the export form footer hidden behind its body and a short scrim; the tablet's axis label and two table columns that clipped; a faint icon on the selected rail item.
- **Corrected at lock-in, on 1 November 2026:**
  - the cutoff, on every frame: section definitions, chart footnotes, tiles, the KPI-01 table, the drill panel and the next-7-days tile. SYN-PPO-APT-000041 is now 5 h 05 min after the cutoff, and SYN-PPO-APT-000036's withdrawal moved from 15:30 to 10:40 so that it still falls before the cutoff;
  - permission names that do not exist: `service.read` and `scheduling.read` became the real capabilities in section 3, and S6 now shows `field.read.own`.
  - three flaws seen in the exported images: the scheduling table's Acknowledged heading broke mid-word on desktop, the exception counts on the blue chart blocks sat off-centre, and S6 still showed "Technician: all 7".

  The September counts did not change.

## 8. Verification

- All eighteen source frames, the page header and the notes card were searched by script after the correction. The only matches left are the unrelated "24 h" axis label on the KPI-04 frame, Q1's account of the correction, and the proposed capability `reporting.service.read`.
- Claude did not play the flows in Present mode.
- The captures are copies of the accepted frames on the "Captures (icon-free)" page, from y = 1,403,173. Prototype reactions were removed and each Font Awesome instance was swapped for `Icon/placeholder`. The two full-length reports (desktop 9,700 px, tablet 9,874 px) were each split into three clipped frames at section boundaries, because the export is capped at 4,096 px. The hashes are in the [captures README](../reference/ui/reporting/service-performance-design-r01/README.md).
- **The named version.** Dean saved "Service performance · RP-04 — accepted" himself on 1 November 2026 and said so: "I have saved the named version as Service performance · RP-04 — accepted". Claude did not open the version history to confirm it. It is a version of the whole file, so it also holds whatever other sessions had drawn by then. The page header and the File index row were updated afterwards to record it, so those two text changes post-date the named version.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
