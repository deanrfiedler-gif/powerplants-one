---
document_id: PPO-SV06-REVIEW-FIGMA-DEC
date: 2026-10-18
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: 3881bb4a0c34f0eaa130dbf5300b357947a02038
versioning: git
---

# Service review and reports design — owner decision

On 18 October 2026 Dean asked which UI page to design next in Figma. Claude recommended Service review and reports (`scope:SV-06`): the register at `/service/reports` and the report page at `/service/reports/[id]`. It is step 13 of the service job walk, "Service report reviewed and answered", and it had no Figma page. Dean replied: "Yes, proceed with that."

Claude drew the page from these sources:
- the accepted Work orders register and Work order record pages;
- the retained [Service Review & Reports r02](service-review-reports-workspace-design.md) design;
- the built register and report page;
- [ADR-0014](ADR-0014-p09-service-reports.md) for P09 reports;
- the [field customer response](field-customer-response.md) decision (FI-07);
- the [report photo inspection](report-photo-inspection.md) decision.

Dean then asked for "an audit and final polish to ensure everything is accurate and as professional as possible", and accepted the result: "I accept the Service review and reports SV-06 design with your recommendations, including D1–D6 and Q1–Q2. Save the named version, add the File index row, export the captures and open the draft PR." The design reference is the named Figma version "Service review and reports — accepted".

Scope:
- `scope:SV-06` "Service review and controlled report workspace" with `route:/service/reports` and `route:/service/reports/[id]`.
- SV-07's remaining work and FI-07's customer response are shown on the report, as r02 integrated them. Neither scope gains a page of its own here.
- Parent requirements are as traced in the r02 design and ADR-0014, unchanged. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design SV-06 next | User decision, 18 October 2026 | "Yes, proceed with that." |
| Audit and final polish | User decision, 18 October 2026 | Quoted above. Changes are listed in section 4 |
| Departures D1–D6 | Accepted as recommended, 18 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Keep the built register's recent window of 200 reports | Resolved as recommended, 18 October 2026 | Same words. The count line says so; older reports stay linked from their attendance |
| Q2 No separate SV-07 cross-report worklist yet | Resolved as recommended, 18 October 2026 | Same words. The Remaining work open queue covers it until a cross-report view is decided |
| Accept the design and lock it in | User decision, 18 October 2026 | Quoted above |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Service review and reports — accepted". The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Service review and reports · SV-06" `1265:53`, under "— Service operations —", after Job pack `272:2` and before My jobs `845:44`. The page header holds the conformance declaration; the notes card is `1271:299637` in Flows and notes. File index row "Row / Service review and reports · SV-06" |
| Desktop 1440 × 900 | Register, All reports `1266:190`; report snapshot, Submitted `1267:929`; report on the Evidence tab, Submitted `1269:1621`; Review submission, returning `1269:2112`; Customer report ready to issue `1270:2196`; Customer response with reservations `1271:2457` |
| Tablet 1024 | Register with the side menu collapsed `1271:2894` |
| Phone 390 and 320 | Register `1271:3948`, 320 register `1271:13017`, report on the Evidence tab `1271:9242`, Record customer response sheet `1271:12493` |
| States | Phone 390: loading `1271:13201`; no matches `1271:13297`; could not load `1271:13383`; view only `1271:13460`; response refused because a newer report was issued `1271:13592` |
| Prototype | Flows "SV-06 — desktop (proposal)" and "SV-06 — phone (proposal)". The links run: register rows to the snapshot, the Customer report and the Customer response; snapshot to the report or Review submission; the report to Review submission and back; and phone register to the report and the response sheet. Claude set the links through the connector but did not play them in Present mode |
| Page parts (proposed) | Section `1265:122`: Report grid row `1265:123`, Report grid header `1265:181`, Report list row (phone) `1271:3935` |
| Story | Synthetic:<br>• SYN-PPO-RPT-000058: Morgan Lee's attendance on SYN-PPO-WO-000035, with a level reading of 45.0 m in a 4.5 m tank, returned for correction;<br>• SYN-PPO-RPT-000056: reviewed and ready to issue;<br>• SYN-PPO-RPT-000053: issued and accepted with reservations, with one owned remaining action |
| Retained captures | [Service review design r01](../reference/ui/service/service-review-design-r01/README.md): twelve icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:SV-06`, `route:/service/reports` and `route:/service/reports/[id]`, with SV-07 remaining work and the FI-07 customer response shown on the report. Parent requirements as traced in the r02 design and ADR-0014, unchanged. Capabilities unchanged |
| Page type (r20) | Register or worklist for reports. Document and evidence workspace on the shared record layout for a report. Form or guided workflow for Review submission, Issue report and Record customer response |
| Reused components | Shell v2 (Rail · Service, top bar, Menu item, Menu heading, Menu strip and edge), Grid header and cells, the large snapshot, Record / Header, Readiness bar, Check item, Field, Section heading, View tab, Work order record / Blocker row, Job pack / Form field, Tag, Button. New, proposed: the page parts in section 2 |
| Incoming handovers | All read-only here:<br>• submitted completions and their entries from My jobs (FI-01);<br>• the exact appointment, work order and scope;<br>• inspection findings (FI-03, FI-04) and holds (FI-05, FI-06);<br>• the site primary contact |
| Outgoing handovers | • Entry and submission review (approve or return).<br>• One exact customer-safe report issued as HTML.<br>• Customer responses bound to that exact presentation.<br>• Owned remaining-work actions, and a return-visit proposal on the work order.<br>• A link to the Finance handoff.<br>It never sends anything to the customer, books a visit or decides Finance treatment |
| Source authority | [Service Review & Reports r02](service-review-reports-workspace-design.md); [ADR-0014](ADR-0014-p09-service-reports.md); [field customer response](field-customer-response.md); [report photo inspection](report-photo-inspection.md); design register [scope-sv-06](../design/development/pages/scope-sv-06.md), [route-service-reports](../design/development/pages/route-service-reports.md) and [route-service-reports-id](../design/development/pages/route-service-reports-id.md); the accepted [Work orders](work-orders-design.md) and [Work order record](work-order-record-page-design.md) pages |
| Proposed departures | D1–D6 in section 4, accepted |
| Status | Owner-accepted design, 18 October 2026 |
| Decision record | This file |
| Named version | "Service review and reports — accepted" |

## 4. What the design shows

### Register

- **Grid:** the Work orders grid. Columns run Report, Visit, State, Outcome, Attention, Technician, Attendance, Customer, Site, Customer response, Remaining work, Work order, Revision and Updated, scrolling sideways.
- **States:** shown as Tags in words: Submitted, Returned, Reviewed and Issued.
- **Outcome:** the technician's declared Complete, Partial or Unable to proceed.
- **Attention:** names what needs doing, such as "Level reading looks wrong", "Ready to issue", "Response: reservations" or "Remaining work overdue".
- **Side menu:** the queues; see D1.
- **Toolbar:** Technician and Customer filters, and the count with its as-at time.
- **Snapshot:** a row opens the large snapshot. It shows the summary, the submitted entries, the review checks and History, with Open report and Review submission.

### Report record

- **Header:** the visit title, a state Tag, the report reference and revision, the technician and the attendance times. The actions are Open work order and the state's primary action: Review submission, Issue report or Record response.
- **Readiness bar:** "Before issue". It lists entries approved, outcome declared, remaining work owned, site contact, customer report and customer response.
- **Details column:** Summary; Customer, site and equipment; and Work order and request, each in its own state.
- **Evidence tab:** the submission panel names the entry that looks wrong and the missing site contact. Each entry is approved or returned from its row.
- **Review submission:** edits in the tab with a save bar. It uses the built fields:
  - a decision of Approved or Returned for each entry, with the entry's review reason;
  - Review decision Returned;
  - Authority disposition Current;
  - internal review remarks that are never shown to the customer.
- **Customer report tab:** the prepared HTML with its SHA-256, the recipient chosen at review, and a preview of exactly what the customer will see. Issuing fixes those bytes; Powerplants One sends nothing.
- **Customer response tab:**
  - the response "Accepted with reservations", bound to the exact issued report;
  - the respondent's identity as stated, not verified;
  - the owned action, the proposed (not booked) return visit, Finance not ready, the next customer update and the issued report marked Not sent.

### Phone

- **Register:** list rows with a state Tag, the attention line and the declared outcome.
- **Report:** status first, then view tabs, the submission panel and the entries, with Open work order and Review submission pinned.
- **Record customer response:** a full-screen sheet.
- **States:** loading; no matches, with removable filter chips; could not load, showing no stale list; view only; a response refused because a newer report was issued, keeping the user's entries.

### Kept from r02 and the built rules

- The reviewer approves or returns the technician's exact entries and never changes their facts. A correction creates a successor revision; the original stays exact.
- Approval covers the technical evidence only. Finance treatment, rates and warranty are decided separately.
- One exact customer-safe HTML report is issued, and nothing is sent. A response is bound to that exact issued report. Anything other than Accepted needs an explanation, an owner and a due date.
- A return visit is a proposal on the work order, never a booking.

### Departures, accepted

| ID | Departure | Earlier pattern |
|---|---|---|
| D1 | The register uses the Work orders grid, with queues in the side menu:<br>• All reports and My reviews;<br>• Review: To review, Returned to technician and Ready to issue;<br>• After issue: Awaiting response, Response not accepted and Remaining work open.<br>r02's four count cells become these counts | The built card list; r02's count cells |
| D2 | Row checkboxes, with Open in sequence and Export list, as on the other accepted registers | No selection |
| D3 | A row opens the large snapshot | A link to the report |
| D4 | The report uses the shared record layout. A Before issue readiness bar sits under the header. View tabs are Evidence, Work outcome, Customer report, Customer response and History; r02's six views become five tabs, and Remaining work & handoff sits on the Customer response tab and the work order | r02's six views; the built stack of panels |
| D5 | Review submission edits in the Evidence tab with a save bar, and each entry is approved or returned from its row. On a phone, Record customer response is a full-screen sheet | The built review form in a panel |
| D6 | On a phone, Service review is reached from More; the tab bar keeps its five tabs | Not drawn |

### Audit and polish

The audit checked every field, option and state against the built report page. It made these changes:
- The review form uses the built labels and options listed above.
- The response wording matches the built states ("With reservations").
- The Evidence badge counts the one entry that needs attention.
- Remaining work is separated from follow-up.
- Icons are consistent.

Every card inset was measured. No text overlaps or clips, except deliberately below the fold on the phone sheets.

## 5. Not decided and not drawn

- **Building the page.** The built register is a list of report cards from a recent window. The built report page is a stack of panels with the review, issue, response and correction forms. The build order is not decided.
- **Not drawn:**
  - the Work outcome and History tab contents;
  - the report after issue;
  - a correction cycle;
  - the photo inspection view;
  - the Finance handoff;
  - desktop register states;
  - the tablet record;
  - hover states.
- **Shell:** at 1024 px the top bar still cuts off the account button. It is the shell follow-up recorded with the [Service requests design](service-requests-figma-design.md).
- **Data in the frames:** the reports, people, sites, readings and times are synthetic. They are not operational records.

No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
