---
document_id: PPO-SV08-ESCALATIONS-FIGMA-DEC
date: 2026-10-18
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: 3bd12c428ec1db087d35bf2e6e55f8845a78b9db
versioning: git
---

# Remote diagnosis and escalation design — owner decision

On 18 October 2026 Claude drew a Figma page for Remote diagnosis and OEM escalation, scope SV-08, at the proposed route `/service/escalations`. No route, read model or service exists for SV-08 yet, so this design defines what gets built. Dean's direction for the page was: "Proceed however you believe is the most professional."

Claude drew the page from these sources:
- the SV-08 design register page ([scope-sv-08](../design/development/pages/scope-sv-08.md)) and the SV-08 entry in the [HTML page coverage audit r04](../reference/ui/module-page-register/PPO-HTML-Page-Coverage-Audit-r04.md);
- the [D-025 customer communications decision](customer-communications-d025.md) and [ADR-0058](ADR-0058-outbound-customer-email.md): a named person sends any message, and PPO sends nothing by itself;
- Dean's working rule that field work is hardware and controller settings are the grower's;
- copies of the Incidents and Findings proposal frames drawn the same day. No accepted frame or main component was edited.

Before accepting, Dean asked for an audit and polish of all the new pages: "give all the pages an audit and polish". He was then asked "Do you accept Escalations with the recommendations?" and replied: "I accept the Remote diagnosis and escalation SV-08 design with your recommendations, including D1–D7 and Q1–Q4." The named Figma version "Remote diagnosis and escalation — accepted" was saved on 18 October 2026 at Dean's request.

Scope:
- `scope:SV-08` "Remote diagnosis and OEM escalation", with the proposed `route:/service/escalations`, reached from Service review.
- The coverage audit r04 traces SV-08 to SVC-01 (triage), SVC-06 (technical context) and SVC-10 (evidence and findings), with SV-02, EQ-01 and EQ-03 as planning inputs. No parent requirement ID is added or renamed.
- It sits beside SV-07 Findings in the Service review workspace. The [Findings design decision](findings-figma-design.md) is recorded in parallel; the [Service review decision](service-review-figma-design.md) (SV-06) holds the workspace it extends.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability or deployment. It authorises no message to a manufacturer or customer.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design SV-08 as most professional | User decision, 18 October 2026 | "Proceed however you believe is the most professional." |
| A named person sends; PPO sends nothing | Existing decision applied | D-025 and ADR-0058, accepted 17 October 2026. Applied as D6 |
| Controller settings are captured read-only | Dean's working rule, applied | Settings belong to the grower. Applied as D4 and D7 |
| Customer contact details and prices left out of the evidence pack | Proposed rule, accepted with the design | D5 |
| Conversations action in the top bar | User decision, 18 October 2026 | Dean asked for it left of the information icon on every new top bar. The shell amendment itself is a separate, still-open record |
| Audit and polish before acceptance | User decision, 18 October 2026 | Quoted above. Section 6 |
| Departures D1–D7 | Accepted as recommended, 18 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Who may open and send a case | Resolved as recommended | Service coordinators and senior technicians. The sender is always a named person |
| Q2 Chasing | Resolved as recommended | The reply-expected date drives a "chase" reminder in the owner's My Work. No automatic message goes to the manufacturer |
| Q3 Manufacturer list | Resolved as recommended | A simple maintained list of manufacturers with their support route (portal or address), taken from equipment records, not free text |
| Q4 Warranty | Resolved as recommended | Show the equipment's warranty end date on the case, so the coordinator can say whether the request is a warranty claim. Warranty decisions stay with Warranty (aftercare) |
| Accept the design | User decision, 18 October 2026 | Quoted above |
| Save the named version | Done | Saved by Claude in the Figma desktop app on 18 October 2026 at Dean's request ("Yes, save the seven named Figma versions now"); confirmed in version history |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. Named version "Remote diagnosis and escalation — accepted", saved 18 October 2026. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Remote diagnosis and escalation · SV-08" `1365:2901`, under "— Service operations —", after Findings and follow-up · SV-07 `1358:3488`. The page header `1365:2902` holds the conformance declaration; the notes card `1370:2098` is in Flows and notes. File index row "Row / Remote diagnosis and escalation · SV-08" `1396:355218` on Start here |
| Desktop 1440 × 900 | Register, Open cases `1365:2937`; case in Diagnosing, with diagnosis and the draft evidence pack `1365:3183`; Record as sent `1365:3312`; Reply to act on, turning advice into a next action `1365:3445` |
| Tablet 1024 | Register with the side menu collapsed `1365:3576` |
| Phone 390 and 320 | Open cases list `1365:325743`; reply to act on at 390 `1365:3805` and 320 `1369:3477` |
| States | Phone 390: loading `1365:325781`; no open cases `1365:325838`; could not load `1365:325880` |
| Prototype | The page has two flow starting points, on the desktop register and the phone list. After acceptance on 18 October 2026, Claude renamed them "SV-08 — desktop" and "SV-08 — phone" and removed ten copied links to other pages. No flow was played in Present mode |
| Page parts | Section "Page components (proposed)" `1370:2116`: Escalation grid header `1365:3872` and Escalation grid row `1365:3886`. They stay on the page, as the Service review and Field team parts do |
| Story | Synthetic, as at Thu 15 Oct 2026, 11:30. SYN-PPO-ESC-000004, the recurring VA-12 travel fault from Findings (finding SYN-DEF-000021), owned by Sasha Cole, for SYN Actuator Co. SYN-PPO-ESC-000003, a climate computer that drops its network link, waiting on the manufacturer, owned by Alex Nguyen. SYN-PPO-ESC-000002, boiler controller BC-2 showing fault E-17, with a reply from SYN Boiler Controls to act on, owned by Sam Patel |
| Retained captures | [Remote diagnosis and escalation design r01](../reference/ui/service/escalations-design-r01/README.md): nine icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:SV-08`, proposed `route:/service/escalations`, reached from Service review (side menu: Escalations). Parent requirements as traced by the coverage audit r04, unchanged. No capability exists yet; Q1 names who may open and send a case |
| Page type (r20) | Register or worklist for the cases. Record detail with a Document and evidence workspace for one case |
| Reused components | Shell v2 (Rail · Service, top bar, side menu), Grid header and cells, Record / Header, Readiness bar, Field, View tab, Work order record / Blocker row, Tag, Button, Planner / Input, Technician list row (phone), and Shell / Top bar action · Conversations from the proposed shell amendment. New: the page parts in section 2 |
| Incoming handovers | A finding (SV-07), usually a recurring fault, with its inspection attempts, defects and corrections (FI-03, FI-04); the equipment and its configuration snapshot |
| Outgoing handovers | An evidence pack (HTML and PDF) for a named person to send; a finding and next action in My Work from the manufacturer's advice. Nothing goes to the customer |
| Source authority | The SV-08 design register page and coverage audit r04 entry; D-025 and ADR-0058; settings are the grower's. No route or service exists yet: this design defines the build |
| Proposed departures | D1–D7 in section 4, accepted |
| Status | Owner-accepted design, 18 October 2026. After acceptance on 18 October 2026, the page header in Figma was updated to "Accepted by Dean"; the notes card records the acceptance |
| Decision record | This file |
| Named version | "Remote diagnosis and escalation — accepted", saved 18 October 2026 |

## 4. What the design shows

### Register

- **Grid:** one row per case. Columns run Case, Fault, State, Owner and Next step, scrolling sideways with fixed checkbox and settings columns.
- **Toolbar:** Owner and Manufacturer filters, the count with its read time ("3 open cases · as at Thu 15 Oct, 11:30") and two actions.
- **Side menu:** the Service review menu, with an Escalations group (Open cases, Diagnosing, Waiting on manufacturer, Reply to act on) below Findings, and History split into Closed findings and Closed cases (D2).
- **States in words:** Diagnosing, Waiting on manufacturer and Reply to act on are tags with words (D1).

### Case record

- **Header:** the fault as the title, the state tag, the case number, the manufacturer, the finding it came from, the owner and role, when it was opened and the record position. Primary actions change with the state: Open finding and Prepare to send while diagnosing; Open equipment and Close case once a reply is in.
- **Readiness bar:** "Before sending" checks Fault described, Diagnostics recorded, Configuration captured, Evidence pack reviewed, Customer details left out and Recipient chosen. "Before closing" checks Sent and recorded, Reply recorded, Advice reviewed, Next action owned, Case outcome written and Customer details left out.
- **Details column:** Summary (state, fault type, owner, opened, model, serial, warranty and version), Equipment and site, and the Finding. The warranty line shows the equipment's warranty end (Q4). It says: "Controller settings belong to the grower; they are captured read-only, never changed from here."
- **Tabs:** Diagnosis, Configuration, Evidence pack, Correspondence and History, with counts.
- **Diagnosis (D4):** "Diagnostics already tried", one row per attempt with who, when and the result, linking to the defect or inspection attempt. Entries are kept as recorded and go into the evidence pack.
- **What the manufacturer will see (D5):** the draft evidence pack, to review before sending. It lists readings with the instrument and its calibration, the limit switch settings captured read-only, photos with a SHA-256 for each, the inspection attempts and defect history, and "Customer contact details · left out". The pack names the site, not the people.
- **Record as sent (D6):** after a person has sent the pack, the Correspondence tab records the pack version and its hash, how and to whom it was sent, who sent it, when, the manufacturer's reference and when a reply is expected. The state change "Diagnosing → Waiting on manufacturer" is shown. The footer says: "Recording sends nothing. Send the pack from your mailbox or their portal first, then record it here."
- **Reply to act on (D7):** the reply as recorded, with the manufacturer's case reference, its recommended steps and its attachments with hashes. A step that changes settings says the grower approves it first. "Recorded as received by Sam Patel. PPO did not receive or send this message." A required Next action field, with Create finding and next action and Record a follow-up question. "Closing the case records its outcome. It does not close the finding."

### Phone

- **List:** rows with the fault, the case number and manufacturer, the state and owner, and a right-hand note: Not sent, the sent date, or Replied. "Waiting on manufacturer · chase today" shows the Q2 reminder. Open cases and Owner filters, the count and the read time stay above the list.
- **Reply to act on:** tabs Reply, Diagnosis, Pack and History. The reply and its steps, then the next action with its owner, the finding created with it and "Customer details · left out". At 390 the footer holds Ask again and Create next action; at 320 it holds Create next action and an icon button.
- **States:** loading, with "Loading permitted cases…" and "Current results unconfirmed"; no open cases, with Show closed cases; could not load, with no list or counts and Retry loading.

### Departures, accepted

| ID | Departure | Earlier pattern |
|---|---|---|
| D1 | Lifecycle: Diagnosing → Waiting on manufacturer → Reply to act on → Closed. A case can also be withdrawn. The state is always shown in words | None. The coverage audit r04 described a page with an evidence timeline and no states |
| D2 | Escalations sits beside Findings in the Service review workspace. The side menu gains an Escalations group (Open cases, Diagnosing, Waiting on manufacturer, Reply to act on), and History splits into Closed findings and Closed cases. The Findings frames use the same menu | The design register gave `/service/escalations` as the destination, with no place in a menu |
| D3 | A case has its own number, SYN-PPO-ESC-…, because it is a new record with its own correspondence. It always links to its finding and equipment | None |
| D4 | Each diagnostic tried is recorded with who, when and the result. Controller settings are captured as a read-only snapshot, because settings belong to the grower | None |
| D5 | PPO prepares an HTML and PDF evidence pack (readings, configuration, photos, attempts and defects) with hashes. Customer contact details and prices are always left out. The pack must be reviewed before it can be recorded as sent | None. The coverage audit r04 named consent and contact arrangements as part of the case, without saying what goes to the manufacturer |
| D6 | PPO sends nothing. A named person sends the pack from their own mailbox or the manufacturer's portal, then records who, how, when, the manufacturer's reference and when a reply is expected (D-025) | None |
| D7 | The reply is recorded as received, with its attachments. "Create finding and next action" turns the advice into owned work in My Work; settings changes still need the grower's approval. Closing the case does not close the finding | None |

All seven come from the notes card. Every top bar also carries the proposed Conversations action left of the information icon.

## 5. Not decided and not drawn

- **Building the page.** Nothing for SV-08 is built. The build order is not decided.
- **Prerequisites for a build:**
  - an escalation case record with its own identity type and number series (D3), and its lifecycle (D1);
  - a read-only configuration snapshot of the controller (D4);
  - the evidence pack renderer with hashes, and a rule that leaves customer contact details and prices out (D5);
  - a capability for opening and recording cases, granted to Service coordinators and senior technicians (Q1);
  - a chase reminder in My Work from the reply-expected date (Q2);
  - a maintained manufacturer list with support routes, from equipment records (Q3);
  - the equipment's warranty end date on the case (Q4).
- **To settle in the build:**
  - D3 says a case always links to its finding, but frame 04 shows a case with "No finding linked yet", where creating the next action creates the finding. The build must say whether a finding is required when a case is opened.
  - On the phone reply frames the title is cut short with an ellipsis in the header; the full title is not shown elsewhere on those frames.
- **The Conversations action** is part of the proposed top-bar shell amendment, a separate record that is still open. `Shell / Top bar` and `Shell / Phone header` change only when that amendment is accepted.
- **Not drawn** (from the notes card):
  - the Configuration, Evidence pack and History tabs in full;
  - withdrawing a case, and a closed case;
  - the pack preview;
  - the phone Diagnosis tab;
  - denied access;
  - 200% zoom.
- **Data in the frames:** the cases, people, manufacturers, equipment, sites, references and times are synthetic. They are not operational records.

## 6. Audit and polish

At Dean's request ("give all the pages an audit and polish"), the seven new proposal pages were checked together on 18 October 2026. The notes card records the checks:
- truncation and overflow;
- fonts (Roboto only), labels and rail selection;
- the Conversations action on every top bar;
- icon placeholders;
- one story across the pages: people, sites, dates and record IDs.

The Service review side menu matches the Findings page. White cards on the grey record background are the accepted SV-06 pattern. No change was needed on this page.

## 7. Verification

- The notes card records the audit in section 6. This record adds no separate screenshot or script evidence for it.
- The nine captures are copies of the accepted frames on the "Captures (icon-free)" page `115:2`, from y = 208,000. Prototype links were removed and each of the 354 Font Awesome icon instances was swapped for `Icon/placeholder` (`67:77`) at its original size. A scan after the swap found no Font Awesome instance and no visible vector outside a placeholder or the Powerplants logo.
- The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder. The hashes are in the [captures README](../reference/ui/service/escalations-design-r01/README.md).
- The named version was saved on 18 October 2026.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
