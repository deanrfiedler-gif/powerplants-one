---
document_id: PPO-SV07-FINDINGS-FIGMA-DEC
date: 2026-10-18
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: 3bd12c428ec1db087d35bf2e6e55f8845a78b9db
versioning: git
---

# Findings and follow-up design — owner decision

On 18 October 2026 Claude drew the next Service page in Figma: Findings and follow-up, scope SV-07 "Unresolved findings and follow-up worklist", at the proposed route `/service/findings`. No route, read model or service exists for SV-07 yet, so this design defines what gets built.

Dean set the brief: "I am happy for you to design and build the page however you believe it should be to ensure it is as professional as possible. We can add new features to it then build the page code from it." The new features are D5–D7 in section 4. They are features adopted in the design. Building them, and the page, is a separate step that is not decided.

Claude drew the page from these sources:
- the SV-07 design register page ([scope-sv-07](../design/development/pages/scope-sv-07.md));
- the accepted [Service review and reports design](service-review-figma-design.md) (SV-06), which shows SV-07 remaining work on the report and left a cross-report worklist undecided (its Q2);
- the retained [Service Review & Reports r02](service-review-reports-workspace-design.md) design, which first paired SV-06 with SV-07;
- the field completion follow-up in `src/field/completion.ts`;
- the [service inspections](service-inspections.md) (FI-03, FI-04), [field incidents](field-incidents.md) (FI-06) and [field customer response](field-customer-response.md) (FI-07) decisions, and [ADR-0014](ADR-0014-p09-service-reports.md) for reports;
- the PL-04 rescheduling proposal ([scope-pl-04](../design/development/pages/scope-pl-04.md)), whose frames the page was copied from. No accepted frame or main component was edited. The story continues the PL-04, Inspections and Incidents proposals drawn the same day.

Before accepting, Dean asked Claude to "give all the pages an audit and polish" (section 6). He then accepted it: "I accept the Findings and follow-up SV-07 design with your recommendations, including D1–D8 and Q1–Q4." The named Figma version "Findings and follow-up — accepted" was saved on 18 October 2026 at Dean's request.

Scope:
- `scope:SV-07` "Unresolved findings and follow-up worklist", with the proposed `route:/service/findings`, reached from the Service review workspace.
- The Escalations page (SV-08, Remote diagnosis and escalation) shares the same Service review side menu. It has its own record, `escalations-figma-design.md`, written in parallel.
- Parent requirement IDs are unchanged. None is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design SV-07 as professionally as possible, adding new features before it is built | User decision, 18 October 2026 | Dean's brief, quoted above |
| Conversations action in the top bar | User decision, 18 October 2026 | Dean asked for it on every new top bar, left of the information icon. The shell amendment is a separate record (section 5) |
| Audit and polish before acceptance | User decision, 18 October 2026 | "give all the pages an audit and polish". Section 6 |
| Departures D1–D4 and D8 | Accepted as recommended, 18 October 2026 | Dean's acceptance, quoted above. Section 4 |
| New features D5 Next action, D6 Recurrence and D7 Remote diagnosis handover | Accepted as features of the design, 18 October 2026 | Same words. Section 4. Building them is not decided |
| Q1 Sources | Resolved as recommended | The five shown: inspection defects and not-tested checks, incident corrective actions, remaining work from Partial or Unable-to-proceed completions, customer reservations, and scheduling follow-up |
| Q2 Who sets the next action | Resolved as recommended | Service coordinators and reviewers with service work-order edit access. Technicians see their own findings view-only. The exact capability is chosen when the page is built; no capability is added here |
| Q3 Recurrence window | Resolved as recommended | 90 days on the same equipment and the same check or category, shown as "2nd in 30 days" where it fits |
| Q4 Overdue | Resolved as recommended | Overdue when the next action's due time has passed in site time. No automatic escalation and no customer message |
| Accept the design | User decision, 18 October 2026 | Quoted above |
| Named version "Findings and follow-up — accepted" | Done | Saved by Claude in the Figma desktop app on 18 October 2026 at Dean's request ("Yes, save the seven named Figma versions now"); confirmed in version history |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053). Named version "Findings and follow-up — accepted", saved 18 October 2026 |
| Page | "Findings and follow-up · SV-07" `1358:3488`, under "— Service operations —", after Service review and reports `1265:53` and before Remote diagnosis and escalation · SV-08 `1365:2901`. The page header `1358:3489` holds the conformance declaration; the notes card `1364:3235` is in Flows and notes `1364:3234`. File index row "Row / Findings and follow-up · SV-07" `1396:355211` on Start here |
| Desktop 1440 × 900 | Register, All open `1358:3524`; remaining work selected, snapshot `1358:3611`; needs an owner, assigning the next action `1361:2933`; recurring fault, recurrence history `1362:2635` |
| Tablet 1024 | Register with the side menu collapsed `1358:4344` |
| Phone 390 and 320 | All open list `1358:4413`; finding, remaining work, full length, at 390 `1358:4449` and at 320 `1363:3258` |
| States | Phone 390: loading `1358:4701`; nothing unresolved `1358:4758`; could not load `1358:4800`; view only `1363:323475` |
| Prototype | The page has two flow starting points, on the desktop register and the phone list, renamed "SV-07 — desktop" and "SV-07 — phone" after acceptance. No page-specific links between frames exist. After acceptance on 18 October 2026, Claude removed 33 copied hover links that pointed at a component on another page. The shell's rail and menu toggle interactions remain. Claude did not play the prototype in Present mode |
| Page parts (proposed) | Section "Page components (proposed)" `1364:3254`: Findings grid header `1358:4959` and Findings grid row `1358:4971`, with Default, Hover, Selected and Closed variants. They stay on the page, as the Service review parts do |
| Story | Synthetic. Seven open findings across five sources, including:<br>• SYN-PPO-RPT-000058: Morgan Lee's corroded cable gland on tank level sensor LS-4, remaining work from a Partial completion, with the report returned for the level reading (the SV-06 story);<br>• SYN-PPO-APT-000049: a firmware check not tested on irrigation controller IC-7 in Casey Ward's attempt, with no owner;<br>• SYN-DEF-000021: vent actuator VA-12 failing travel again after SYN-DEF-000016 was corrected by re-tightening the coupling, now overdue |
| Retained captures | [Findings design r01](../reference/ui/service/findings-design-r01/README.md): nine icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:SV-07`, proposed `route:/service/findings`, reached from Service review (side menu: Findings). Parent requirement IDs unchanged. Capabilities unchanged |
| Page type (r20) | Register or worklist with the large snapshot. Record detail on the phone. A form inside the snapshot for setting the next action |
| Reused components | Shell v2 (Rail · Service, top bar, Menu item, Menu heading, Menu strip and edge), Grid header and cells, the PL-02 large snapshot with previous and next, Tag, Button, Planner / Input, Technician list row (phone), and Shell / Top bar action · Conversations from the proposed shell amendment. New, proposed: the page parts in section 2 |
| Incoming handovers | All read-only here:<br>• owned follow-up from Partial or Unable-to-proceed completions (FI-01, SV-06);<br>• inspection defects and not-tested checks (FI-03, FI-04);<br>• incident corrective actions (FI-06);<br>• customer responses with reservations (FI-07, SV-06);<br>• scheduling follow-up (PL-04) |
| Outgoing handovers | • The owning record for every closure: inspection review, incident, service report or work order.<br>• The next action as one owned My Work activity (D5).<br>• Remote diagnosis (SV-08) for a recurring fault (D7).<br>It never closes a finding, changes the owning record, escalates automatically or messages the customer |
| Source authority | Design register [scope-sv-07](../design/development/pages/scope-sv-07.md); `src/field/completion.ts`; the service inspections, field incidents, field customer response and scheduling decisions; the accepted [Service review design](service-review-figma-design.md). No route or service exists: this design defines the build |
| Proposed departures | D1–D8 in section 4, accepted |
| Status | Owner-accepted design, 18 October 2026 |
| Decision record | This file |
| Named version | "Findings and follow-up — accepted", saved 18 October 2026 |

After acceptance on 18 October 2026, the page header in Figma was updated to "Accepted by Dean", naming this decision record.

## 4. What the design shows

### Register

- **Place:** the rail's Service review item is selected and the top bar reads Findings. The side menu holds Service reports, a Findings group, an Escalations group for SV-08, and a History group (D1).
- **Views:** All open (default), Needs an owner, Due this week, Overdue, Waiting on review, Ready to close and Recurring, each with a count. Closed findings sits under History (D2).
- **Grid:** the Work orders grid. Columns run Source record, What remains, State, Owner, Due, Next action, Closes when, Source, Equipment and Site, scrolling sideways with fixed checkbox and settings columns (D2).
- **Identity:** each row is identified by its source record, such as SYN-DEF-…, SYN-ACT-…, SYN-PPO-RPT-… or SYN-PPO-APT-…. There is no finding number (D3).
- **States:** shown as Tags in words: Open, Needs an owner, Waiting on review, Ready to close and Overdue. An unowned finding reads "Unassigned" with due "None".
- **Toolbar:** Search findings, Owner: Anyone, Source: All, Site: All, and the count with its read time ("7 open · 11:30").

### Snapshot

A row opens the large snapshot, with previous and next.

- **Left:** the title, the source record, its kind and the equipment; the state, owner and due date. Then:
  - **What remains:** the finding, the completion or attempt behind it, and anything returned or asked, with the customer and site.
  - **What closes it:** the owning record's own rules, such as a done follow-up with evidence and a reissued report, a passing and accepted retest, or accepted evidence and incident closure (D4).
  - A note: "Findings never close here. Each one closes in its own record, when that record's rules are met; this list then updates by itself."
  - Actions that open the owning records, such as Open report and Open follow-up, or Open inspection and Open visit.
- **Right:** tabs Next action, Recurrence and History, each with a count, and a History list below.

### New features adopted in the design

- **D5 Next action.** An owner, a due time, an instruction and the evidence needed, saved as one owned My Work activity. The card shows the activity ID, "In My Work" and who set it, with Change next action and Open in My Work. On a finding that needs an owner, the tab becomes "Set the next action": Owner, Due and Instruction are required, with an unsaved-changes count, Save next action and Cancel. The form says: "Saving creates an owned activity in Morgan Lee's My Work. It changes nothing on the inspection, and only the inspection's own review closes this finding." Changing the next action updates the same activity and keeps the history.
- **D6 Recurrence.** The same equipment and the same failed check or category within 90 days is flagged (Q3), with the earlier occurrences and their correction. The VA-12 frame lists this finding and SYN-DEF-000016, closed after the coupling was re-tightened. A callout reads "The same correction did not hold". Recurrence informs the next action. It never reopens or closes anything.
- **D7 Remote diagnosis handover.** A recurring fault offers "Request remote diagnosis", next to Set next action. It hands over to SV-08, whose page was drawn in parallel and has its own record.

### Phone

- **List:** a view selector (All open), Owner: Anyone, the count and "As at 11:30". Each row shows the title, the due date, the source record and its kind, and the state and owner in colour with words (D8).
- **Finding:** one scroll. The header gives the title, the source record and the position ("3 of 7"). Then the state line, and cards for What remains, Next action (with Change next action), What closes it ("Closed in its own record, never here") and History ("Newest first"). Open report and Open follow-up are pinned at 390; at 320 only Open follow-up is pinned, beside a menu button.
- **Access:** the phone tab bar shows its last tab selected, the More pattern of SV-06 D6.
- **States:**
  - loading: "Loading permitted findings…", with "Current results unconfirmed";
  - nothing unresolved: "No permitted finding is open", with Show closed findings;
  - could not load: "Findings could not be loaded", with no list or counts, and Retry loading;
  - view only: the finding with "You can read this finding but not change its next action. A coordinator with service access sets it." (Q2).

### Departures and features, accepted

| ID | Departure or feature | Earlier pattern |
|---|---|---|
| D1 | Place. Findings sits in the Service review workspace (rail: Service review; side menu: Service reports, a Findings group, an Escalations group for SV-08, and History split into Closed findings and Closed cases), as PL-04 sits under Schedule. The rail is full, so no new rail entry is proposed | No SV-07 page. The accepted SV-06 side menu holds only report queues |
| D2 | Register by state. Views: All open, Needs an owner, Due this week, Overdue, Waiting on review, Ready to close, Recurring, and Closed findings. Columns put State, Owner, Due and Next action first | SV-06's Remaining work open queue, per report |
| D3 | Identity. A finding is identified by its source record; no new finding number is introduced | None |
| D4 | Closure is shown, not decided. "What closes it" lists the owning record's own rules. Findings never close here; the row leaves the list when its record closes | Follow-up shown on the selected report only (r02) |
| D5 | Next action (new feature). Owner, due time, instruction and evidence needed, saved as one owned My Work activity; changing it updates the same activity and keeps the history | Owned remaining-work actions on the report |
| D6 | Recurrence (new feature). The same equipment and the same failed check or category within 90 days is flagged, with the earlier occurrences and their correction. It informs the next action and never reopens or closes anything | Cross-report recurrence was a receiving refinement in r02 |
| D7 | Remote diagnosis handover (new feature). A recurring fault offers "Request remote diagnosis", handing over to SV-08 | None |
| D8 | Phone. List rows with source and state; a one-scroll record with What remains, Next action, What closes it and History. The Conversations action sits left of the information icon on every top bar and phone header | None |

## 5. Not decided and not drawn

- **Building the page.** Nothing for SV-07 is built. The build order is not decided.
- **Prerequisites for a build:**
  - a findings read over the five sources (Q1), keyed by source record (D3), with each source's own closure rule (D4);
  - a write that saves and changes the next action as one owned My Work activity with its history (D5), limited to the Q2 roles;
  - recurrence matching on equipment and check or category over 90 days (D6, Q3);
  - an overdue rule in site time (Q4);
  - the SV-08 escalation page for D7;
  - the route `/service/findings` and the Service review side menu change (D1).
- **The Service review side menu.** D1 puts Service reports, Findings, Escalations and History in one side menu. The accepted SV-06 frames still show the report queues only. Aligning them is open.
- **Closed findings.** The side menu says "Closed findings"; the empty state and the notes card say "Closed, last 30 days". The window is not decided.
- **The Conversations action** is part of the proposed top-bar shell amendment, a separate record ([Conversations T1 scope](conversations-t1-scope.md)). `Shell / Top bar` and `Shell / Phone header` change only at that amendment's own lock-in. This record does not change them.
- **Not drawn:**
  - the History and Recurrence tabs for every source;
  - bulk assignment from the register;
  - Closed, last 30 days;
  - the tablet snapshot;
  - SV-08 remote diagnosis itself;
  - denied access;
  - desktop register states and hover states;
  - 200% zoom, reviewed separately.
- **Data in the frames:** the findings, people, sites, equipment, readings and times are synthetic. They are not operational records.

## Build decisions — 31 October 2026

Dean explicitly requested the native SV-07 build on the already merged findings backend. Earlier statements that no read or next-action service exists describe the 18 October design checkpoint; the [native contract](../contracts/service-findings.md) supersedes those prerequisites as implementation evidence, without changing the accepted reference bytes.

Codex decision under the standing order: retain **Closed findings**, with no date cutoff, rather than **Closed, last 30 days**. This matches the existing source-state read, keeps older source history reachable and avoids confusing an update timestamp with a closure date. Counts remain the authorised candidate window, never all-history totals. Reversal requires an explicit closure-date predicate and matching label/tests.

Due this week uses Monday through Sunday in each site's civil time. Ready to close is the completed-follow-up view, qualified as requiring source review rather than inventing source closure readiness. Recurrence compares native failed checks on the same equipment within 90 days; sources without a stable fault key remain explicitly unassessed. D7 and the Escalations group remain outstanding for SV-08. These implementation choices are not Dean's visual acceptance.

## 6. Audit and polish

Dean asked to "give all the pages an audit and polish". Claude checked the seven new proposal pages together:
- truncation and overflow;
- fonts (Roboto only) and labels;
- rail selection;
- the Conversations action on every top bar;
- placeholders;
- one story across pages: people, sites, dates and record IDs.

The Service review side menu matches the Escalations page. Changed on this page: the SYN-PPO-APT-000049 attempt is by Casey Ward, 08:30–11:30, matching the Inspections page.

## 7. Verification

- The notes card, page header, frame names, File index row and capture copies were read through the Figma connector. After acceptance Claude updated the page header and flow names and removed copied links to other pages (section 2).
- The nine captures are copies of the accepted frames on the "Captures (icon-free)" page, from y = 204,000. Prototype links were removed and each of the 468 Font Awesome icon instances was swapped for `Icon/placeholder` at its original size. A scan after the swap found no Font Awesome instance and no visible vector outside a placeholder or the logo.
- The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder. The hashes are in the [captures README](../reference/ui/service/findings-design-r01/README.md).
- In the captures, the phone header cuts the finding's title to one line at 390 and 320. The full title is not repeated on the phone page.
- Claude did not play the prototype in Present mode.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
