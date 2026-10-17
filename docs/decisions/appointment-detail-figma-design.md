---
document_id: PPO-SV04-APPOINTMENT-FIGMA-DEC
date: 2026-10-17
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: 0e351fa124d71073b468192b27ed3d7e51de567d
versioning: git
---

# Appointment detail design — owner decision

On 17 October 2026 Dean asked which UI page to design next in Figma. Claude recommended Appointment detail (`scope:SV-04`, `/service/appointments/[id]`), for three reasons:
- It is where the [field readiness gate](field-readiness-gate-proposal.md) is decided before a crew leaves. Parts, customer site readiness, the job pack and the crew all meet on the appointment, and gate P4 (customer site readiness) is recorded there.
- It had no Figma page, no mockup and no accepted image. Dean's 9 October review of the built page said Refine.
- The Service planner (PL-01), the runner-up, shows the same readiness states across visits, so it is easier to draw once the appointment's wording is settled.

Claude first wrote a design brief on a new Figma page. Dean answered its three questions: "Proceed based on your recommendations." He then said, "You are meant to be drawing the page for me." Claude drew the page and audited it against the accepted pages. Dean asked for two more rounds of polish: "give it an audit and visual polish first to ensure it looks as professional as possible", and then "It still needs another visual polish… Check everything to be sure."

Dean accepted the result: "Yes, lock in the polished SV-04 design: save the named version, add the File index row, export the icon-free captures and open the draft PR with the decision record." The design reference is the named Figma version "Appointment detail — shared record layout, accepted".

Scope:
- `scope:SV-04` "Appointment coordination detail" and `route:/service/appointments/[id]` "Appointment detail".
- Parent requirements SVC-03, SVC-04, SVC-05, SCM-06 and SCM-08, as traced in the [field readiness gate proposal](field-readiness-gate-proposal.md). No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design SV-04 next | User decision, 17 October 2026 | Dean chose "Yes: duplicate the Template page as "Appointment detail · SV-04"…" after the recommendation above |
| Q1 One scrolling page, no view tabs | Resolved as recommended, 17 October 2026 | "Proceed based on your recommendations." Readiness must never be hidden behind a tab |
| Q2 Link a demand to the visit on this page as well as on the work order | Resolved as recommended, 17 October 2026 | Same words. For people with supply access, because an unlinked demand keeps Parts Unknown (gate Q7) |
| Q3 Repeat the overall readiness in the record header | Resolved as recommended, 17 October 2026 | Same words. A Tag beside the state: "Dispatch held" or "Ready to dispatch" |
| Audit and polish, twice | User decision, 17 October 2026 | The two requests quoted above. Changes are listed in section 4 |
| Accept the design and lock it in | User decision, 17 October 2026 | Quoted above |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Appointment detail — shared record layout, accepted". The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Appointment detail · SV-04" `1187:50`, under "— Service operations —" `626:14`, after Work order record page `312:2` and before Job pack `272:2`. The page header holds the conformance declaration; the design brief is card `1187:86` and the notes card is `1195:267235`. File index row `1199:50` |
| Desktop 1440 | Section `1187:96`: confirmed visit with dispatch held, full length, `1191:50` |
| Tablet 1024 | Section `1187:100`: the same visit, full length, `1193:264207` |
| Phone 390 and 320 | Section `1187:104`: the same visit at 390 `1193:263684` and at 320 `1193:263999`, full length |
| States | Section `1187:111`, phone 390: ready to dispatch `1195:1202`; site readiness overdue `1195:1438`; customer reports not ready `1195:1685`; held again by a supply change (gate R2) `1195:1930`; proposed, not booked `1195:2153`; cancelled, read-only `1195:2409` |
| Flows and notes | Section `1187:115`: Record customer site readiness dialog over this page `1195:266625`; full-screen phone sheet `1195:266814`; notes card |
| Prototype | Flows "SV-04 — record site readiness (desktop)" and "SV-04 — record site readiness (phone)". Record contact, or the site readiness row on desktop, opens the dialog or sheet; Cancel, Record no answer, Record confirmation and Close return to the page. Claude set the links through the connector but could not play them in Present mode |
| Page component (proposed) | Appointment / Contact row `1196:265594`, with Layout = Row (desktop, tablet) and Stacked (phone). It shows one contact record: purpose and outcome as a Tag, person and channel, detail, and when with the schedule version |
| Cloned and shared parts | The accepted Work order record desktop `315:2094` and phone `326:53619` frames, and the Record customer site readiness dialog `963:10299` from the Job pack page's field readiness section. Shell, record and job pack parts as in section 3 |
| Retained captures | [Appointment detail design r01](../reference/ui/service/appointment-detail-design-r01/README.md): seven icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:SV-04` and `route:/service/appointments/[id]`. Parent requirements SVC-03, SVC-04, SVC-05, SCM-06 and SCM-08, unchanged. Capabilities unchanged (gate rule R11: no new capability) |
| Page type (r20) | Record detail on the shared record layout. Phone: a single-column record with a pinned action bar and a full-screen sheet |
| Reused components | Rail · Service, Shell / Top bar, Record / Header (detached here for D2), Record / Readiness bar and Check item, Record / Field, Record / Section heading, Record / Criterion row, Work order record / Blocker row, Job pack / Crew row, Visit / Crew row, Job pack / Note and Disclosure, My Work / Activity row, Activity list row (phone), Tag, Button. New, proposed: Appointment / Contact row |
| Incoming handovers | The planner (`/schedule`, with its return link), work order planned visits, the job pack and My Work tasks open this exact appointment. Supply Chain readiness of the demands linked to the visit arrives as a read-only projection |
| Outgoing handovers | Booking commands (confirm, move, reassign, cancel), customer contact records (date agreement or site readiness), Parts statements and permitted exceptions, change-request decisions, and links to the work order, job pack, planner day and tasks. The page never sends anything to the customer (D-025 is open) and never records a Pass for Parts or site readiness by hand |
| Source authority | [Field readiness gate proposal](field-readiness-gate-proposal.md) (P1, P4, P5, R1–R11, Q1–Q7, accepted 16 October); design register [scope-sv-04](../design/development/pages/scope-sv-04.md) and [route-service-appointments-id](../design/development/pages/route-service-appointments-id.md); BP-07 SC-08; BP-01 §13.2; ADR-0010; the [Work order record page design](work-order-record-page-design.md); the current build's `AppointmentScreen` in `src/scheduling/components/client/planner-screens.client.tsx` |
| Proposed departures | D1–D5 in section 4 |
| Status | Owner-accepted design, 17 October 2026 |
| Decision record | This file |
| Named version | "Appointment detail — shared record layout, accepted" |

## 4. What the design shows

### Layout

Desktop follows the Work order record:
- **Record header:** the title, a state Tag and a readiness Tag, the record position, and the actions Record contact and Move or reassign (or Confirm appointment while Proposed).
- **Readiness bar:** Parts, Job pack acknowledged, Site readiness confirmed, Site and isolation controls and Crew competency.
- **Left column:** Summary, Customer and site, and Crew.
- **Main column, in one scroll:**
  - the Dispatch held panel with its reasons and actions;
  - Dispatch checks;
  - the job pack deadline;
  - Job pack, with each crew member's acknowledgement or Return;
  - Customer contact;
  - Follow-ups;
  - Schedule change requests;
  - Integrity details, collapsed.

On a phone the same content is one column: status, the dispatch panel and checks first, then the visit, job pack, contacts and follow-ups, with Record contact and the primary action pinned at the bottom.

### Gate criteria

The criteria are derived and are never ticked by hand:
- **Parts ready for the stated material scope (P1):** Pass, Blocked, Unknown, Not applicable with the preparer's statement, or Permitted exception, with the short lines and promised dates named.
- **Customer site readiness confirmed (P4):** from the latest site-readiness contact for the current schedule version. Its four checks are recorded through the accepted gate dialog.
- **Current site and isolation controls.**
- **Crew competency**, checked at confirmation.

A supply change after dispatch is cleared raises the hold again and creates a task (R2); state 4 shows it. The job pack deadline (P5) is a warning, not a criterion.

### Wording

Names, never identifiers, on screen. Record IDs, versions and hashes sit under Integrity details. Status is always in words. Times are in site time. Contacts say "Recorded", never "Sent".

### Proposed departures from the Work order record

| ID | Departure | Accepted pattern |
|---|---|---|
| D1 | One scrolling page with no view tabs (Q1) | View tabs under the readiness bar |
| D2 | A readiness Tag beside the state Tag in the record header (Q3). The header is detached on this page to add it; a build would give Record / Header an optional second Tag | One state Tag |
| D3 | At 1024 the details column moves below the main column | Not drawn for the Work order record |
| D4 | New page part Appointment / Contact row, Row and Stacked | None |
| D5 | At 1024 the top bar shows the page name only, so the appointment reference is never cut off | Parent and page crumbs |

### Audit and polish

The first polish:
- aligned the contact rows behind a fixed outcome cell;
- stopped showing a task that is due but not overdue in red;
- boxed the change requests like the other sections and gave the page bottom spacing;
- shortened the phone header line;
- added the Stacked phone contact layout, frame labels and the two prototype flows;
- fixed the tablet breadcrumb.

The second polish measured every row in every frame against its box edge:
- The crew rows, whose avatars sat 1 px from the edge, now sit 16 px in like every other row; the follow-up rows match on the right.
- The readiness bar reads "Job pack r04 acknowledged · 0 of 2" instead of a separate crew item.
- Contact names use the row-title colour.
- The phone blockers fit on one line.
- The phone sheet's actions are stacked so none clip.
- The pack deadline is hidden on the Proposed state.

## 5. Not decided and not drawn

- **Building the page.** The built page shows these facts as a stack of panels under an "SC-08" eyebrow, with the readiness criteria as plain text and no Parts or site readiness criterion. Building the gate parts depends on [PR #541](https://github.com/deanrfiedler-gif/powerplants-one/pull/541) (P1–P3, draft) and a later P4 increment. The build order is not decided.
- **Drawn elsewhere or not yet:** loading, no access, a stale version on save and an uncertain save result follow the shared record states on the Work order record page. The Link a demand, Parts statement and permitted exception dialogs are not drawn.
- **Data in the frames:** the visit, people, parts and times come from the synthetic story in the gate proposal (SYN-PPO-WO-000040 on Tue 13 Oct 2026). They are not operational records.

No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
