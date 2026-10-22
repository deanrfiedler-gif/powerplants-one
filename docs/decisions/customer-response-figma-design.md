---
document_id: PPO-FI07-CUSTOMER-RESPONSE-FIGMA-DEC
date: 2026-10-22
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: e9f28b6955d62cc33408e418f43f00ce5b937551
versioning: git
---

# Customer response design — owner decision

On 19 October 2026 Dean asked which UI page to design next in Figma. Claude recommended FI-07, customer attendance and report response. It is the last phase-00 scope in the [UI build sequence](../design/development/ui-build-sequence.md) without a Figma design, and it completes step 13 of the synthetic job walk ("Service report reviewed and answered"), whose SV-06 half was accepted on 18 October. Dean agreed: "Yes, draw the Customer attendance and report response FI-07 page in Figma next, following the SV-06 and Sites pattern."

FI-07 has no route of its own. The page draws:
- the Customer response tab of the report record at `/service/reports/[id]`, including presenting the exact report to the customer, recording a response, correcting or clarifying one and recovering an uncertain save;
- the technician's phone view of the same report, reached from the visit.

Claude drew the page from these sources:
- the FI-07 design register pages ([scope-fi-07](../design/development/pages/scope-fi-07.md), [route-service-reports-id](../design/development/pages/route-service-reports-id.md)) and guide `guide.fi.07`;
- the [FI-07 decision](field-customer-response.md) and [contract](../contracts/field-customer-response.md): the two subjects, the five choices, exact presentation binding, append-only correction, owned follow-up and restrictions at receipt;
- the built report page: `src/components/report-screens.tsx` (the response form, its labels and status lines), `src/reports/service.ts`, `src/reports/validation.ts`, `src/reports/response-context.ts` and the offline capture in `src/offline/app.ts`;
- copies of accepted designs: the Service review and reports SV-06 record and phone frames, the Access & readiness CS-06 form card, and the My jobs FI-01 response options, segmented choice and signature pad.

Before deciding, Dean asked for an audit: "Give the FI-07 page an audit and polish first, then ask me again." After a later audit of every page he accepted the design: "I accept the Customer response FI-07 design with your recommendations, including D1–D7 and Q1–Q4." That adopts D1–D7 and the recommended answers to Q1–Q4.

Scope:
- `scope:FI-07` "Customer attendance and report response", hosted by `route:/service/reports/[id]`.
- Parent IDs stay as the FI-07 decision records them: SVC-09/10/11, DOC-01/02/03 and NFR-01/07/09, with the DAT, API, TR, OUT and AT references listed there. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, message sending or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design FI-07 next, on the SV-06 and Sites pattern | User decision, 19 October 2026 | Dean's request quoted above |
| Audit and polish before acceptance | User decision, 22 October 2026 | Quoted above. Section 6 |
| Departures D1–D7 | Accepted as recommended, 22 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Response identity | Resolved as recommended | Responses keep internal IDs only; the design identifies each by subject, choice and recorded time. No response number is introduced |
| Q2 Before issue | Resolved as recommended | Against draft evidence only an attendance-facts acknowledgement is offered, and it stays with the draft. Report-content responses wait for the issued report. The built page accepts any subject once a report is Reviewed; narrowing that is a build prerequisite (section 5) |
| Q3 SV-06 respondent | Resolved as recommended and done | The accepted SV-06 frames named Priya Shah, whom People CS-02 records as Hillview Growers' contact, as the SYN Isolation Nursery respondent. On 22 October 2026, as audit recommendation 4, SV-06 was corrected to Dana Brooks, grower; the SV-06 notes card records it |
| Q4 Follow-up due date | Resolved as recommended | The response form does not ask for a due date. The follow-up stays "Due date needed" for the current Service owner to set from My Work, as built |
| Accept the design | User decision, 22 October 2026 | Quoted above |
| Named Figma version | Waits for Dean's explicit yes | Section 7 |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Customer response · FI-07" `1490:70`, under "— Service operations —", after Service review and reports · SV-06 `1265:53` and before Findings and follow-up · SV-07. The page header `1490:71` holds the conformance declaration; the notes card `1490:1458` is in Flows and notes. File index row "Row / Customer response · FI-07" `2025:79`, after the Service review and reports row |
| Desktop 1440 | Issued r01, no response yet `1490:111`; presenting issued r01 to the customer, a focused view without the shell `1491:393540`; Record customer response, report content, Disputed, full length (1440 × 1414) `1490:311`; responses recorded, full length (1440 × 1096) `1490:411`; Correct or clarify the Disputed response, full length (1440 × 1394) `1490:511`; after correction, full length (1440 × 1152) `1490:611`; save not confirmed, original operation kept `1490:711` |
| Tablet 1024 | After correction, rail collapsed, Present report in the record menu (1024 × 1152) `1495:393233` |
| Phone 390 and 320 | Report Response view before the acknowledgement `1490:870`; Record response sheet, attendance facts, Accepted with a mark, full length (390 × 1135) `1490:938`; no signal, waiting to send `1490:960`; recorded `1490:1028`; the sheet at 320 `1496:2772` |
| States | Phone 390: not saved because the shown content changed `1490:1118`; queued acknowledgement refused because r02 was issued `1490:1186`; view only `1490:1254`; correction refused, already corrected `1490:1322`; report not issued, draft evidence only `1490:1390` |
| Page parts | None new. The frames reuse accepted components and the SV-06, CS-06 and FI-01 parts |
| Prototype | Flows "FI-07 — desktop" (from the no-response frame) and "FI-07 — phone" (from the Response view): Present report, Record response, Save response, Correct or clarify, Save correction, Cancel and Retry unchanged on desktop; Record response, Save acknowledgement and Cancel on phone, with waiting to send turning into recorded after 2.5 s |
| Story | Synthetic. `SYN-PPO-RPT-000056` r01 is Alex Nguyen's inspection of valve bank VB-2 at SYN Isolation House (SYN Isolation Nursery) on Sun 11 Oct 2026, 09:00–12:30, as on SV-06. Sasha Cole (signed in, SC) reviewed it at 10:40 and issued it on Tue 13 Oct at 11:05, then shared it with Dana Brooks, grower, from Outlook. Dana disputes the findings by phone at 14:20. On Wed 14 Oct she acknowledges Alex's attendance on his phone at 08:52, which saves at 08:58 when signal returns, and at 10:05 calls back so the dispute is corrected to With reservations. The follow-up "call Dana about valve 4 on the evening cycle" is Sasha's, with its due date still to set |
| Retained captures | [Customer response design r01](../reference/ui/service/customer-response-design-r01/README.md): fourteen icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:FI-07`, hosted by the Customer response tab of `route:/service/reports/[id]` in the Service review workspace, and the technician's phone view of the same report. Parent IDs unchanged; capabilities unchanged (`report.read`, scoped `report.respond`) |
| Page type (r20) | Document and evidence workspace (record tab). Form or guided workflow for recording, correcting and recovering a response. A focused presentation view. A phone sheet |
| Reused components | Shell (Rail · Service, the top bar with the proposed Conversations action), Record / Header, Readiness bar and Check item, View tab, Record / Field, Work order record / Blocker row, Tag, Button, Planner / Input (proposed), the compact phone Record header (phone header amendment P3), the SV-06 response card and phone card, the CS-06 form card, and the FI-01 response options, segmented choice and signature pad |
| Incoming handovers | SV-06 issued report and its exact presentations; FI-01 visit attendance; FI-03/FI-04 open defects, FI-06 incident holds and CS-06 readiness, read as restrictions at receipt; People CS-02 site contact as the stated respondent |
| Outgoing handovers | An immutable response or correction on the report; one follow-up activity in My Work (SH-02) owned by the current Service owner, due date needed; the existing proposed return visit on the work order (SV-03), never a booking; Finance stays separate (FN-01) |
| Source authority | The FI-07 design register pages and guide; the FI-07 decision and contract; `src/components/report-screens.tsx`, `src/reports/service.ts`, `src/reports/validation.ts`, `src/reports/response-context.ts`, `src/offline/app.ts`; migration 0057; tests FI07-01 to FI07-09 |
| Proposed departures | D1–D7 in section 4, accepted |
| Status | Owner-accepted design, 22 October 2026 |
| Decision record | This file |
| Named version | "Customer response — accepted" waits for Dean's explicit yes |

## 4. What the design shows

### Customer response tab

- **Before any response:** a card saying no response has been recorded, with the rule that no response is its own state and never counts as acceptance. It has two rows, one per subject: attendance acknowledgement and report-content response, each "none recorded" with its own action. Below it are the exact presentations (issued r01, current; draft evidence r01, retained and taking no new responses) and the restrictions that will be saved with a response (incidents, inspections, site readiness, and "work, booking and Finance not granted by a response").
- **Responses recorded:** one card per subject (D1). Report content · Disputed shows the stated respondent, who captured it and when the server received it, the exact issued revision and hash, the remarks, the owned action ("Due date needed") and the restrictions at receipt. Attendance facts · Accepted shows the mark as protected evidence, not a legal signature, that it was queued offline and checked again before saving, and that internal Service acceptance of the attendance is separate. The response history below lists every response, newest first.
- **After correction:** Report content · With reservations names the response it corrects and the reason, reuses the original's open action, and says the original stays as recorded and only one direct correction is allowed. The corrected original appears in the history as kept.

### Presenting the report

- Present report opens a focused view (D2): a bar with "Showing the customer", the revision, the exact hash, that the bytes match and when it was presented, with Return to staff review and Record response. The rail, menus and internal notes are hidden. The exact customer-safe report sits on a grey stage. Showing the report records nothing; returning asks to confirm if a response is unsaved.

### Recording, correcting and recovering

- **Record customer response** is an inline form card in the tab (D3). Read-only facts: report, exact content and hash, when and how it was presented, and the follow-up owner. Then Response concerns (Report content or Attendance facts only), the five choices as radios with what each needs, stated respondent name and role, remarks or reservations, owned next action, an optional signature mark (PNG up to 4 MB) and capture time. Save response states what it binds and that nothing is sent.
- **Correct or clarify** uses the same form (D4) with the original, the exact content and the subject shown as fixed facts, and a required correction reason. Save correction says the original stays as recorded and a second correction of it is refused.
- **Save not confirmed** (D5): the tab keeps the operation, offers Check receipt and Retry unchanged, warns not to record it again, and shows exactly what was sent, including the capture time that a retry keeps.

### Tablet

- The corrected record with the rail collapsed. Present report moves into the record's actions menu so the header fits.

### Phone

- **Record:** the compact Record header (phone header amendment P3) with the report reference, Back and More; the title and status in the content; the response cards first. Details, evidence and report open from More, which starts with Open menu and Conversations (D6). One full-width main action, Record response.
- **Record response sheet:** a full-screen sheet with a grey heading row (✕ left, centred title). Dana reads the report on the phone first. The sheet holds the issued report summary, Response concerns, the five choices, stated name and role, and a finger-drawn signature mark (D6).
- **No signal:** the acknowledgement shows Waiting to send. It is checked again against the current report, owner and access before it is saved (D7).
- **Recorded:** saved at 08:58 after the check, with the dispute still owned by Sasha Cole.
- **States:** not saved because the bytes shown differ from issued r01; kept, not saved, because r02 was issued while the phone was offline, with Present r02 or Discard (D7); view only; correction refused because Sasha already corrected the response; and report not issued, where only an attendance-facts acknowledgement against the draft is offered (Q2).

### Departures, accepted

| ID | Departure | Built pattern |
|---|---|---|
| D1 | The Customer response tab shows one card per subject, current response first, with the response history below | Every response in one history list |
| D2 | Present report opens a focused view with the exact hash, Return to staff review and Record response; no rail, menu or internal notes | The report iframe under a heading on the staff page |
| D3 | An inline form card (CS-06 pattern): read-only facts, a two-way Response concerns choice, radio responses with what each needs, then inputs; labels shortened (Save response) | Selects and long labels ("Save response to presented content") |
| D4 | Correct or clarify reuses the form with the original, content and subject shown as fixed facts and a correction reason | A legend change on the same form |
| D5 | An uncertain save keeps the operation on the tab with Check receipt and Retry unchanged and shows what was sent | A separate recovery card at the top of the page |
| D6 | Phone: compact Record header, title and status in the content, response cards first, other sections from More; a full-screen sheet with a grey heading row and a finger-drawn mark | The stacked report page; a PNG upload field |
| D7 | Queued phone responses show Waiting to send, and Kept, not saved with Present r02 or Discard when the report changed | Offline capture with a select; no queue states drawn |

## 5. Not decided and not drawn

- **Building the page.** The built report page keeps its current response form, now hosted by the SV-06 tabbed contract. The build order is not decided.
- **Prerequisites for a build:**
  - per-subject current-response reads, so the tab can show one card per subject (D1);
  - before issue, offering only an attendance-facts acknowledgement against draft evidence (Q2);
  - a focused presentation view that hides internal navigation and notes (D2);
  - the phone sheet's signature pad producing the same protected PNG mark as the desktop upload (D6);
  - queued-response states on the phone (D7).
- **Not drawn:**
  - a Declined or Customer unavailable response;
  - the signature mark viewer;
  - desktop presentation of draft evidence;
  - the SV-06 register queues Awaiting response and Response not accepted (covered by SV-06 D1);
  - the Finance handoff;
  - 200% zoom, which the spec reviews separately.
- **Data in the frames:** the reports, people, times, hashes and marks are synthetic. They are not operational records. Record references keep their existing forms under the [readable references decision](readable-reference-namespaces.md).

## 6. Audit and polish

At Dean's request Claude audited the page before acceptance, and again during the audit of every page on 22 October 2026.

- **Corrected:** hidden SV-06 leftovers in the record menus and phone More sheets; two restriction facts that claimed an inspection or a readiness revision the other pages do not show; phone records moved to the compact Record header with one 48 px main action; both sheets restyled with the grey heading row; the shared 390 px compact header main was 320 px wide, which shortened these headers; it is now 390 px.
- **Laid out:** the page follows the Template: three desktop frames per row, a label above every frame, sections fitted and 80 px apart. A programmatic check found no overlaps and nothing outside its section.
- **Measured:** every row, card heading and label for clipping; none is left. The phone 320 title truncates with an ellipsis, as on other record pages.

The audit is recorded on the notes card `1490:1458`.

## 7. Verification

- Claude checked the frames with screenshots taken inside Figma during the drawing and both audits, and measured visible single-line texts against their rendered widths.
- The fourteen captures are copies of the accepted frames on the "Captures (icon-free)" page, from y = 340,000. Image 14 is a frame holding copies of the five phone state frames. Prototype links were removed and each of the 376 Font Awesome icon instances was swapped for `Icon/placeholder`. Three scans followed:
  - no Font Awesome instance and no visible vector outside a placeholder, the logo or the drawn synthetic signature line was left;
  - none of 1,031 visible texts had a stored colour that differed from its bound variable;
  - no copy carries a prototype link, and no flow starting point was added to the Captures page.
- The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder. The hashes are in the [captures README](../reference/ui/service/customer-response-design-r01/README.md).
- The named Figma version "Customer response — accepted" has not been saved; it waits for Dean's explicit yes.
- Claude did not play the flows in Present mode.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
