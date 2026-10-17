---
document_id: PPO-SV01-REQUESTS-FIGMA-DEC
date: 2026-10-17
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: 18e7decf1f66a1f8ad202d87caca9fa8193348a0
versioning: git
---

# Service requests design — owner decision

On 17 October 2026 Dean asked which UI page to design next in Figma. Claude recommended Service requests: the register (`scope:SV-01`) and the request detail page (`scope:SV-02`) together. They are the first step of the service job walk, and they had no Figma page. Dean replied: "Yes: draw the Service requests page (SV-01 register and SV-02 request detail) in Figma, following your recommendations."

Claude drew the page from five sources:
- the accepted Work orders register and Work order record pages;
- the [service requests native refinement](service-requests-native-refinement.md), whose recommendations D1–D8 Dean accepted on 23 September 2026;
- the built register and record;
- [ADR-0008](ADR-0008-p03-customer-intake.md) for P03 triage;
- [ADR-0043](ADR-0043-service-request-lifecycle.md), still proposed.

Dean accepted the result: "I accept the Service requests SV-01 and SV-02 design with your recommendations, including D1–D6 and Q1–Q2. Save the named version, add the File index row, export the captures and open the draft PR." The design reference is the named Figma version "Service requests — accepted".

Scope:
- `scope:SV-01` "Service desk and triage worklist" with `route:/service/tickets` and `route:/service/tickets/new`.
- `scope:SV-02` "Request detail and communication timeline" with `route:/service/tickets/[id]`.
- Parent requirements SVC-01, SVC-02 and SVC-06, as the refinement traces them. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability or deployment. ADR-0043 stays proposed.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design Service requests next | User decision, 17 October 2026 | Quoted above |
| Departures D1–D6 | Accepted as recommended, 17 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Log a request stays a page | Resolved as recommended, 17 October 2026 | Same words. As built today, so the duplicate check has room beside the form |
| Q2 The 1024 px top bar clips the account button | Resolved as recommended, 17 October 2026 | Same words. It becomes a shell follow-up that narrows the search below 1280 px. This page does not patch the shared top bar. The accepted planner tablet frame shows the same clip |
| 23 September D1, D3, D4, D5 and D8 | Kept | The [native refinement](service-requests-native-refinement.md). D2's collapsed lanes are not drawn, because the native Board has three lanes. D6's workspace registration is a build matter |
| 23 September D7, no row checkboxes | Superseded by D2 below | Dean's acceptance of D2 |
| Accept the design and lock it in | User decision, 17 October 2026 | Quoted above |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Service requests — accepted". The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Service requests · SV-01 · SV-02" `1249:9313`, under "— Service operations —", before Work orders `193:18953`. The page header holds the conformance declaration; the notes card is `1261:289978` in Flows and notes. File index row "Row / Service requests · SV-01 · SV-02" |
| Desktop 1440 × 900 | Section `1249:9359`: register, All open `1249:9382`; request snapshot `1254:3846`; Board `1255:2587`; Log a request with a possible duplicate `1259:3354`; request record, Triage tab `1255:3172`; Complete triage, editing `1256:287381`; a Triaged request on Linked work `1257:3058` |
| Tablet 1024 | Section `1249:9363`: register with the side menu collapsed `1259:288310` |
| Phone 390 and 320 | Section `1249:9367`: register `1259:289789`, 320 register `1259:290489`, request record `1259:290111`, Complete triage sheet with one error `1259:290321` |
| States | Section `1249:9374`, phone 390: loading `1261:4946`; no matches `1261:5127`; could not load `1261:5300`; view only `1261:289734`; save refused because of a newer revision `1261:289886` |
| Prototype | Flows "SV-01 and SV-02 — desktop (proposal)" and "SV-01 and SV-02 — phone (proposal)". The links run: register row to snapshot, snapshot to record or Complete triage, Board and List, Log a request, record to Complete triage and back, and phone row to record, sheet and back. Claude set the links through the connector but did not play them in Present mode |
| Page parts (proposed) | Section `1250:963`: Request grid row `1250:964` and header `1250:1010`, Request / Board card `1255:2149`, Request list row (phone) `1259:289773` |
| Story | Synthetic: SYN-PPO-TKT-000091, Needs information with an overdue clarification, linked to SYN-PPO-WO-000041, the accepted Work order record's example |
| Retained captures | [Service requests design r01](../reference/ui/service/service-requests-design-r01/README.md): thirteen icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:SV-01`, `scope:SV-02`, `route:/service/tickets`, `route:/service/tickets/new` and `route:/service/tickets/[id]`. Parent requirements SVC-01, SVC-02 and SVC-06, unchanged. Capabilities unchanged |
| Page type (r20) | Register or worklist for requests, with a Board view. Record detail on the shared record layout for a request. Form or guided workflow for Log a request and Complete triage |
| Reused components | Shell v2 (Rail · Service, top bar, Menu item, Menu heading, Menu strip and edge), Grid header and cells, the large snapshot, Record / Header, Readiness bar, Check item, Field, Section heading, View tab, Criterion row, Work order record / Blocker row, Job pack / Form field, Tag, Button. New, proposed: the page parts in section 2 |
| Incoming handovers | Customers, sites, people and equipment (read-only), the owner list, linked work orders with their own state, and owned clarification activities from My Work |
| Outgoing handovers | Log a request, Request information, Complete triage and Update details. A customer statement can be added to an open request (D8). The page hands on to Create work order (SV-03) and to the work order and activity records. It never authorises work, books a visit or contacts the customer |
| Source authority | [Native refinement](service-requests-native-refinement.md) (D1–D8); [ADR-0008](ADR-0008-p03-customer-intake.md); [ADR-0043](ADR-0043-service-request-lifecycle.md) (proposed); design register [scope-sv-01](../design/development/pages/scope-sv-01.md) and [scope-sv-02](../design/development/pages/scope-sv-02.md); the accepted [Work orders](work-orders-design.md) and [Work order record](work-order-record-page-design.md) pages |
| Proposed departures | D1–D6 in section 4, accepted |
| Status | Owner-accepted design, 17 October 2026 |
| Decision record | This file |
| Named version | "Service requests — accepted" |

## 4. What the design shows

### Register (SV-01)

- **Grid:** the Work orders grid. Columns run Request, Summary, Stage, Priority, Attention, Next action, Action due, Action owner, Customer, Site, Equipment, Linked work, Request owner, Received and Channel, scrolling sideways.
- **Priority:** Urgent shows as a danger Tag and High as a warning Tag. Normal and Low show as text.
- **Attention:** names the triage blockers or the clarification due. An overdue clarification shows in the danger colour.
- **Unknown values:** read "Not confirmed" or "Not recorded" in amber words.
- **Side menu:** the queues; see D1.
- **Toolbar:** Log a request, Owner and Priority filters, a List and Board switch, and the count with its as-at time.
- **Board:** three lanes, New, Needs information and Triaged. Each card shows the reference, priority, title, customer and site, the next action with owner and due time, and one attention line.
- **Snapshot:** a row opens the large snapshot. It shows the request's summary, the reported issue, the triage checks and History, with Open request and Complete triage.

### Request record (SV-02)

- **Header:** the title, a stage Tag, the reference, the owner, the received time and revision, and the record position. The actions are Update details and the stage's primary action (Complete triage, or Open work order once triaged).
- **Readiness bar:** "Before triage". It lists site, equipment, impact and backup, priority reason and next action, plus any open clarification; "Triaged" adds the linked work order.
- **Details column:** Summary; Customer, site and equipment; and Linked work, which shows each work order in its own state.
- **Triage tab:** the open clarification and question with their actions, then the triage checks: Pass, or Unknown in words.
- **Complete triage:** edits in the tab:
  - fields: clarification outcome, reviewed priority, request owner, priority reason, next action, and the reason for this triage action;
  - a save bar: "Completing triage moves this request to Triaged. It authorises no work and books no visit."
- **Linked work tab:** the work order's own state and next visit. A "Who owns what" list covers the request, work order, visit, parts and customer update.
- **Log a request:** a page with the form in three groups and a "Check before creating" panel. When an open request matches the customer, site and equipment, it offers "Add as customer statement" (23 September D8). The check is a prompt, not a block.

### Phone

- **Register:** list rows with priority Tags and the attention line.
- **Record:** status first, view tabs, then the panel and checks, with Update details and Complete triage pinned.
- **Complete triage:** a full-screen sheet with an error summary.
- **States:** loading; no matches, with removable filter chips; could not load, showing no stale list; view only; save refused, keeping the user's entries.

### Departures, accepted

| ID | Departure | Earlier pattern |
|---|---|---|
| D1 | The register uses the Work orders grid, and its queues move into the side menu. All open and My requests come first. Triage covers New to triage, Urgent, Needs information and Overdue clarifications. After triage covers No work order yet and Work order linked. My requests and the two After triage views are new. List is the default; Board is one click away | A queue row of toggles above a Board |
| D2 | Row checkboxes return, with the same two bulk actions as Work orders, Open in sequence and Export list | 23 September D7: no bulk selection |
| D3 | A row opens the large snapshot | A 420 px docked preview |
| D4 | The record uses the shared record layout. A Before triage readiness bar is built from the triage checks. View tabs are Triage, Reported issue, Linked work, Updates and History; Updates is r02's Evidence & updates | A progress strip and r02 tab names |
| D5 | Complete triage edits in the Triage tab with a save bar, the Work order record's Edit scope pattern. On a phone it is a full-screen sheet | A 560 px panel over a scrim |
| D6 | Resolution & review, the Active, Waiting, Resolved and Closed lanes, and the later-stage columns wait for ADR-0043 and are not drawn | Drawn as proposed in September |

## 5. Not decided and not drawn

- **Building the page.** The built register already has Board and List with the queue toggles. The built record is a stack of panels with the intake and triage forms. The build order is not decided.
- **ADR-0043** stays proposed. Nothing here adds a stage, command or field.
- **Not drawn:**
  - the Reported issue, Updates and History tab contents;
  - the Request information and Update details forms;
  - Board drag and Move;
  - the phone Filters sheet;
  - desktop register states;
  - the tablet record;
  - hover states.
- **Shell follow-up (Q2):** at 1024 px the top bar cuts off the account button. A shell change should narrow the search below 1280 px.
- **Data in the frames:** the requests, people, sites and times are synthetic. They are not operational records.

No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
