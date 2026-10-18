---
document_id: PPO-PL04-CHANGES-FOLLOW-UP-FIGMA-DEC
date: 2026-10-18
owner: Dean Fiedler
status: Owner-accepted design; named Figma version saved; native implementation and UI baseline acceptance separate
source_commit: 3bd12c428ec1db087d35bf2e6e55f8845a78b9db
versioning: git
---

# Changes and follow-up design — owner decision

On 18 October 2026 Claude recommended PL-04 as the next page to design in Figma, and Dean replied: "Proceed on that basis." The page is Changes and follow-up, scope PL-04 "Rescheduling and acknowledgement centre". It covers the queues at `/schedule/changes` and Policy impact at `/schedule/policy-impact`, drawn in the same workspace.

Claude drew the page on copies of accepted frames, and edited no accepted frame or main component. The sources were:
- the PL-04 design register pages ([scope-pl-04](../design/development/pages/scope-pl-04.md), [route-schedule-changes](../design/development/pages/route-schedule-changes.md), [route-schedule-policy-impact](../design/development/pages/route-schedule-policy-impact.md));
- [PPO-SCHED-ADR](scheduling-resources-architecture.md) and [ADR-0010](ADR-0010-p05-planner-controlled-changes.md) for requests, decisions and customer contact;
- the [policy impact review](scheduling-policy-impact-review.md) and [policy publication](scheduling-policy-publication.md) decisions;
- the built `ChangesWorkspaceScreen` and its request decision control;
- the accepted [Field team](field-team-figma-design.md) (PL-02) register, large snapshot and phone frames, the [Service planner](service-planner-figma-design.md) (PL-01) side menu, and the [Appointment detail](appointment-detail-figma-design.md) (SV-04) record layout;
- the [field readiness gate](field-readiness-gate-proposal.md) for dispatch holds and site readiness (P4), and the [D-025 customer communications paper](customer-communications-d025.md) for who sends customer messages.

Dean asked for three rounds of audit and polish before accepting. The notes card records his words as "give the pages an audit and professional polish", "give the new pages an audit and polish" and "give all the pages an audit and polish". Claude then asked: "Do you accept PL-04 with the recommendations?" Dean replied: "I accept the Changes and follow-up PL-04 design with your recommendations, including D1–D7 and Q1–Q4."

The named Figma version "Changes and follow-up — accepted" was saved on 18 October 2026 at Dean's request. The accepted design is identified by the node IDs below, and the retained captures.

Scope:
- `scope:PL-04` "Rescheduling and acknowledgement centre", with `route:/schedule/changes` and `route:/schedule/policy-impact`.
- Parent requirement IDs are not traced to PL-04 individually. [PPO-SCHED-ADR](scheduling-resources-architecture.md) traces the scheduling programme (SVC-04/05 and the others it lists), and the policy impact decision traces PT-28 / AT-35. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design Changes and follow-up (PL-04) next | User decision, 18 October 2026 | "Proceed on that basis", after Claude recommended PL-04 |
| Conversations action in the top bar | User decision, 18 October 2026 | Dean asked for the Conversation icon left of the information icon on new top bars. Applied on every frame. The shell amendment itself is a separate, still-open record |
| Audit and polish before acceptance | User decision, 18 October 2026 | Three rounds, quoted above. Section 6 |
| Departures D1–D7 | Accepted as recommended, 18 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Cancel request | Resolved as recommended | The built control lets the person who logged a request cancel it. Offer it in the request card's "…" menu, not as a third button |
| Q2 Needs review and policy holds | Resolved as recommended | Bookings held by a published rule stay out of the Needs review queue, as built. Holds show in the planner's Needs attention band ([PL-01](service-planner-figma-design.md) D3) |
| Q3 Side-menu counts | Resolved as recommended | Counts follow the selected period and site, so they match the grid |
| Q4 Next step after an accepted move | Resolved as recommended | "Record customer contact" is the primary action, because the customer has not been told yet |
| Accept the design | User decision, 18 October 2026 | Quoted above |
| Save the named version | Done | Saved by Claude in the Figma desktop app on 18 October 2026 at Dean's request ("Yes, save the seven named Figma versions now"); confirmed in version history |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. Named version "Changes and follow-up — accepted", saved 18 October 2026. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Changes and follow-up · PL-04" `1326:4525`, after Service planner · PL-01 `1203:5805` and before Travel review · PL-05 `1371:3488`. The page header `1326:4526` holds the conformance declaration; the notes card `1335:3505` is in Flows and notes `1335:3504`. File index row "Row / Changes and follow-up · PL-04" `1396:355183` on Start here |
| Desktop 1440 × 900 | Needs review `1326:4561`; change request selected, snapshot `1326:4656`; stale technician request, reason missing `1331:3860`; exact appointment from Travel review `1334:315770`; customer follow-up, Follow-up tab `1332:1465`; move accepted, decision saved `1334:315082`; Policy impact `1333:1881` |
| Tablet 1024 | Needs review with the side menu collapsed `1333:313396` |
| Phone 390 and 320 | Needs review list `1333:313870`; change request review, full length, at 390 `1333:313910` and 320 `1334:2974` |
| States | Phone 390: loading `1334:7420`; empty queue `1334:7477`; could not load `1334:7519`; view only, no booking access `1334:314921` |
| Prototype | None for PL-04. After acceptance on 18 October 2026, Claude removed the 27 links copied from Field team that led to frames on other pages and renamed the flow starting points "PL-04 — desktop" (three) and "PL-04 — phone". Section 7 |
| Page parts (proposed) | Section "Page components (proposed)" `1335:3501`: Changes grid header `1326:4888` and Changes grid row `1326:4902`. They stay on the page, as the Field team and Service review parts do |
| Story | Synthetic, the week of Tue 13 – Mon 19 Oct 2026 with the planner's crew and sites:<br>• Hillview Growers asks to move SYN-PPO-APT-000052 (SYN-PPO-WO-000040, Glasshouse 4) from Tue 13 Oct 13:30–16:30 to Thu 15 Oct 08:00–11:00; Morgan Lee accepts the move at 08:51;<br>• Sam Patel's technician request on SYN-PPO-APT-000047 goes stale when Jordan Kim is added at 08:40;<br>• SYN-PPO-APT-000055 at Coastal Berries was moved to Wed 14 Oct and has two follow-ups open;<br>• a proposed 240-minute visit limit from Mon 19 Oct would hold 3 of 14 confirmed bookings |
| Retained captures | [Changes and follow-up design r01](../reference/ui/service/changes-follow-up-design-r01/README.md): twelve icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:PL-04`, `route:/schedule/changes` (side menu: Changes & follow-up) and `route:/schedule/policy-impact` (side menu: Policy impact). Parent requirements as traced by PPO-SCHED-ADR and the policy impact decision, unchanged. Capabilities unchanged (`schedule.read`, `schedule.request`, `schedule.manage` and the existing policy duties) |
| Page type (r20) | Work queue + persistent detail for the five queues: Needs review, Change requests, Customer follow-up, Cancellations, and History / all visits. Review / comparison for Policy impact |
| Reused components | Shell v2 (Rail · Service, top bar, Menu item, Menu heading, Menu strip and edge), Grid header and cells, the PL-02 large snapshot with previous and next, Tag, Button, Planner / Input (PL-01), Shell / Phone header, Tab bar (phone), Technician list row (phone, PL-02), and Shell / Top bar action · Conversations from the proposed shell amendment. New: Changes grid header and Changes grid row |
| Incoming handovers | A period, time zone and site from the Service planner; an exact appointment from Travel review (PL-05) or a planner card, shown even when the period or queue would hide it |
| Outgoing handovers | Appointment controls (SV-04) to move, reassign, record contact or cancel; owned follow-up activities in My Work; the planner for the visit's day. Policy impact hands each exact booking back to the queue. The page sends no message and acknowledges no job pack |
| Source authority | The PL-04 design register pages; [PPO-SCHED-ADR](scheduling-resources-architecture.md); [ADR-0010](ADR-0010-p05-planner-controlled-changes.md); the policy impact and publication decisions; the built `ChangesWorkspaceScreen` and request decision control; [D-025](customer-communications-d025.md) for customer messages |
| Proposed departures | D1–D7 in section 4, accepted |
| Status | Owner-accepted design, 18 October 2026. After acceptance on 18 October 2026, the Figma page header was updated to "Accepted by Dean", naming this decision record in place of the earlier proposed name `rescheduling-centre-figma-design.md`; the named version is still to be saved |
| Decision record | This file |
| Named version | "Changes and follow-up — accepted", saved 18 October 2026 |

## 4. What the design shows

### Queues

- **Side menu:** Planner and Resources, then a "Changes & follow-up" group with the five queues and their counts, then a "Reviews" group with Policy impact, Travel review and Demand & capacity (D1). Counts follow the selected period and site (Q3).
- **Toolbar:** Search visits, the period (Tue 13 – Mon 19 Oct), All permitted sites, the time zone, the count with its read time, and two actions.
- **Grid:** the Changes grid, one row per visit (D2). Columns: Visit, Work, Needs review because, Booked, Requested, Customer, Follow-up and Site, scrolling sideways. The Work column is 260 px and Follow-up 300 px so no visible cell clips.
- **Exact appointment:** a visit opened from Travel review shows a banner, "Opened from Travel review", and stays visible even though the period and queue filters would hide it. No queue is selected; "Return to review queue" goes back.

### Selected visit

- **Snapshot:** a row opens the PL-02 large snapshot with previous and next (D2). The footer has Move or reassign and Open appointment.
- **Booked now and its consequences (D3):** the left column shows the current booking, each crew member with role and travel, and the appointment, schedule and crew versions the decision is checked against. Below, "If the booking changes" lists what a change sets in motion: customer contact, job pack re-acknowledgement, site readiness (gate P4) and dispatch holds with their reasons. A note says a pending request reserves nothing, accepting rechecks the whole booking, and recording contact is not message delivery or crew pack acknowledgement.
- **Tabs:** Change request, Follow-up and History, each with a count, then Contact and booking history.
- **Change request:** who logged it, the source and version, the request in the customer's words, and a Booked now / Requested table for When, Crew, Travel and Time zone. Each changed value carries a "Changed" marker in words, never colour alone. A version line says whether the request is stale. Decision reason (required), Accept and check move, Reject request, and a link to review the current booking policy. Cancel request sits in the card's "…" menu (Q1).
- **Stale request (D4):** an amber line names what changed since the request ("Jordan Kim was added at 08:40"). Accept and Reject stay unavailable until a reason is entered, as built. Staleness alone does not block, because accepting rechecks the booking.
- **Follow-up tab (D5):** owned follow-up activities with owner, due time and state (Open, In progress, Completed), then recorded customer contact with its outcome and schedule version. "Record customer contact" opens the existing appointment contact control (SV-04); there is no new command. "Open in My Work" opens the activity. The note repeats that a contact record is not proof of delivery and that customer messages are sent by a named person (D-025).
- **Move accepted:** a green banner, "Move accepted · Thu 15 Oct 08:00–11:00", says what was rechecked and that the customer has not been told yet. The table becomes Before / Booked now and names the crew. The decision shows who made it, when and why. "Record customer contact" is the primary action, with "Open in planner" beside it (Q4).

### Policy impact

- **Layout:** a Review / comparison page in the same workspace, with Policy impact selected under Reviews (D7).
- **Published rule:** maximum visit, effective since, sites and policy version, read-only.
- **Temporary comparison:** proposed effective time, proposed maximum visit in minutes and site restriction, each required, with the time zone and the 1–1440 whole-minute limit; travel is not included. "Compare with bookings".
- **Bookings requiring review:** a table of Visit, Work, Booked, Length and Effect if published, with the effect in words ("Held: 240 min over the new limit"), headed by "3 of 14 confirmed bookings from Mon 19 Oct · read 08:45". Each visit links to its booking. A note says the comparison changes no rule and no booking, and publishing is a separate, controlled step.

### Tablet and phone

- **Tablet 1024:** the rail is compact and the side menu collapsed; the grid scrolls sideways.
- **Phone list (D6):** the title is "Changes". A queue selector, the period, the count and read time, then list rows in the PL-02 phone pattern: work, visit and site, time, and one reason line.
- **Phone review (D6):** one scroll. The request card comes first with Booked now and Requested as stacked blocks, "Changed" tags, the decision reason field and full-width buttons. Then "If the booking changes", Booked now, and Contact and booking history. At 320 px, Move or reassign moves into More, and labels wrap.
- **States:** loading, with "Current results unconfirmed"; an empty queue (Cancellations, "0 of 6") with "Show History / all visits"; could not load, with no list or counts and "Retry loading"; view only, where the request is readable but the decision controls are replaced by a note that a scheduler with booking access decides.

### Departures, accepted

| ID | Departure | Earlier pattern |
|---|---|---|
| D1 | The five queues become side-menu views with counts under "Changes & follow-up"; Policy impact, Travel review and Demand & capacity sit under "Reviews". Refines PL-01 D1 | A Queue select and workspace tabs |
| D2 | The queue is a Changes grid (Visit, Work, Needs review because, Booked, Requested, Customer, Follow-up, Site); a row opens the PL-02 large snapshot with previous and next | Stacked queue buttons beside one card |
| D3 | The left column shows the booking now, crew, travel and versions, then what a change sets in motion: customer contact, job pack re-acknowledgement, site readiness (gate P4) and dispatch holds. The right column has Change request, Follow-up and History tabs. Each changed value is named in words, never by colour alone | Register: current and requested time, crew roles, travel and versions together before a decision; customer commitment, dispatch and preparation consequences kept separate |
| D4 | A stale request shows an amber version line naming what changed since the request. Accept and Reject stay unavailable until a reason is entered, as built; staleness alone does not block | Register: stale-version states stay in the booking controls |
| D5 | A Follow-up tab lists owned follow-up activities with owner, due time and state, then recorded customer contact. "Record customer contact" opens the existing SV-04 contact control; no new command | Register: owned follow-up, booking history and contact events reviewed separately, in the appointment review |
| D6 | Phone: the queue as list rows (PL-02 phone pattern); one-scroll review with Booked now and Requested as stacked blocks; decision reason and full-width buttons in the request card. At 320 px Move or reassign moves into More, and the title is "Changes" | Register: stacked queue, selected review and current/proposed sections |
| D7 | Policy impact is a Review / comparison page in the same workspace: the published rule beside a temporary comparison form, then the bookings requiring review as a table with the effect in words | Register: published context before the form, a result summary and responsive review cards |

The notes card names the built pattern for D1 and D2. For D3 to D7 the "Earlier pattern" column quotes the PL-04 register pages instead.

### Retained PL-04 rules

The design keeps these rules from the PL-04 register and PPO-SCHED-ADR:
- pending requests reserve nothing, and acceptance reruns the booking guards;
- an exact appointment handover stays visible outside the selected period and queue;
- changed booking facts need fresh customer contact and preparation review;
- recording contact is not message delivery or job pack acknowledgement;
- a decision needs a reason;
- loading, failed and denied reads show no earlier list or counts;
- saving, stale-version, uncertain-outcome and unchanged-retry states stay in the existing booking controls;
- a policy comparison saves no policy, booking, document or task, and a zero result is not approval to publish or dispatch.

## 5. Not decided and not drawn

- **Building the page.** The built page is `ChangesWorkspaceScreen` with a Queue select, workspace tabs and stacked queue buttons beside one card, and the policy impact page with its publication workspace. The build order is not decided.
- **Prerequisites for a build:**
  - a grid read with the Requested, Customer and Follow-up columns for each visit;
  - the "If the booking changes" consequences in one read: customer commitment, job pack acknowledgement, site readiness (P4, not yet built) and dispatch holds;
  - a named change for a stale request, from the booking history;
  - side-menu counts for the selected period and site (Q3).
- **The Conversations action** is part of the proposed top-bar shell amendment. `Shell / Top bar` and `Shell / Phone header` change only when that amendment is accepted.
- **The named version** "Changes and follow-up — accepted" was saved on 18 October 2026. The File index row was added on 18 October 2026.
- **Not drawn:**
  - Cancellations and History / all visits rows;
  - a tablet snapshot;
  - Policy impact on a phone, and the saved proposal, review and publication workspace on that route;
  - saving, uncertain-outcome and unchanged-retry states, which stay in the existing booking controls;
  - the Cancel request "…" menu open (Q1);
  - 200% browser zoom, which the spec reviews separately;
  - the record-page list of requests on SV-04.
- **Data in the frames:** the visits, people, growers, sites, versions and times are synthetic. They are not operational records.

## 6. Audit and polish

The notes card records three passes on 18 October 2026.

- **First pass:** every visible text checked for copy left from the source pages, placeholders and fonts (all Roboto), and the story across frames.
  - Read times moved to 08:45, after the 08:40 crew change the stale request depends on.
  - Changed values show the value with a "Changed" marker (desktop) or tag (phone) instead of a wrapping suffix, with date over time and one person per line.
  - The move-accepted table names the crew instead of "Same crew".
  - The follow-up note and contact heading match their context and the section-heading style; field labels and values share a baseline.
- **Second pass:** every visible truncated text measured. The Work column became 260 px and Follow-up 300 px so no visible cell clips. Follow-up wording is shorter ("Confirm new time · Alex Nguyen · Wed 09:00"). Phone record titles use the full header width, the phone decision-reason field wraps, and sections were refitted.
- **All-pages pass:** the seven new proposal pages checked together for truncation and overflow, fonts, labels, rail selection, the Conversations action on every top bar, placeholders, and one story across pages. Here the move is now accepted at 08:51, after the 08:45 reads it depends on, matching the Sites page; field labels on the 320 phone wrap instead of clipping "Required".

## 7. Verification

- The audit passes are those recorded on the notes card (section 6). This record was written from the notes card and page header, read without changes, and from the twelve exported captures.
- **Prototype:** the accepted frames carried navigation links copied from the Field team page, leading to Field team frames (`1295:4183`, `1295:4405`, `1295:4633`, `1295:4892`, `1295:4933`), and flow starting points named "PL-02 — …". After acceptance on 18 October 2026, Claude removed the 27 links to other pages and renamed the flow starting points. There is no PL-04 prototype flow, and none was played in Present mode.
- **Captures:** twelve copies of the accepted frames on the "Captures (icon-free)" page `115:2`, from y = 192,000. Prototype links were removed and each of the 623 Font Awesome icon instances was swapped for `Icon/placeholder` (`67:77`) at its original size. A scan after the swap found no Font Awesome instance and no visible vector outside a placeholder or the Powerplants logo. The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder. The hashes are in the [captures README](../reference/ui/service/changes-follow-up-design-r01/README.md).
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
