---
document_id: PPO-FI06-INCIDENTS-FIGMA-DEC
date: 2026-10-18
owner: Dean Fiedler
status: Owner-accepted design; named Figma version not yet saved; native implementation and UI baseline acceptance separate
source_commit: 3bd12c428ec1db087d35bf2e6e55f8845a78b9db
versioning: git
---

# Incidents and corrective actions design — owner decision

On 18 October 2026 Claude recommended Incidents and corrective actions (`scope:FI-06`) as the next page to draw in Figma, and Dean replied "Proceed on that basis". The page covers three routes: the register at `/service/incidents`, the incident record at `/service/incidents/[id]` and the report form at `/service/incidents/new`. A person on site reports an exact factual event. An independent reviewer triages it, assigns owned corrective actions, accepts their evidence and the incident content, and closes it with an internal outcome.

Claude drew the page from these sources:
- the FI-06 design register pages ([scope-fi-06](../design/development/pages/scope-fi-06.md), [route-service-incidents](../design/development/pages/route-service-incidents.md), [route-service-incidents-id](../design/development/pages/route-service-incidents-id.md), [route-service-incidents-new](../design/development/pages/route-service-incidents-new.md));
- the [FI-06 architecture decision](field-incidents.md) and its [API and data contract](../contracts/field-incidents.md);
- the built `src/incidents/screen.tsx` and its model (classifications, priorities and states);
- the proposed [Quality, Safety & Site Assurance workspace r01](quality-site-assurance-design.md) (PPO-QA-WORKSPACE-DES), Incidents & actions and Review & release views;
- the Inspections FI-03/FI-04 proposal page drawn the same day, whose frames were copied as the starting point. That page sits on the accepted [Service review](service-review-figma-design.md) layout (SV-06);
- the capture cards of the accepted [My jobs](my-jobs-figma-design.md) design (FI-01);
- the [Service inspections decision](service-inspections.md) for linked inspection defects.

Every top bar carries the proposed Conversations action left of the information icon, as Dean asked for every new page on 18 October 2026. Before accepting, Dean asked for a second polish pass and then for "an audit and polish" of all seven new pages. He was then asked "Do you accept Incidents with the recommendations?" and replied: "I accept the Incidents and corrective actions FI-06 design with your recommendations, including D1–D7 and Q1–Q4."

The intended named version is "Incidents and corrective actions — accepted". **It has not been saved.** It waits for Dean's explicit yes. Until then the accepted frames are identified by their node IDs in section 2 and by the retained captures.

Scope:
- `scope:FI-06` "Incident and corrective-action record", with `route:/service/incidents`, `route:/service/incidents/new` and `route:/service/incidents/[id]`.
- Parent requirement IDs are as traced by the [FI-06 architecture decision](field-incidents.md), unchanged. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design FI-06 next | User decision, 18 October 2026 | "Proceed on that basis", after Claude recommended FI-06 |
| Conversations action in the top bar | User decision, 18 October 2026 | Dean's instruction for every new page. The shared shell change is a separate, still-open step (section 5) |
| Second polish pass, then audit and polish of all seven pages | User decision, 18 October 2026 | "give all the pages an audit and polish". Section 6 |
| Departures D1–D7 | Accepted as recommended, 18 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Reporting from a visit | Resolved as recommended | "Report an incident" sits in the visit's More menu on My jobs and on Appointment detail. It opens this form with the visit and scope filled in. Those two pages are not redrawn here (section 5) |
| Q2 Restricted details | Resolved as recommended | Keep the separate Restricted details section with its plain reader statement, not a toggle on each field |
| Q3 Due times | Resolved as recommended | Show site time (AEST) and store UTC. The built form asks for "Due time (UTC)"; the drawn report form also shows the occurrence time in site time, where the built form asks for "Occurrence time (UTC)" |
| Q4 Linking inspection defects | Resolved as recommended | A "Linked inspection defect" field in triage, not on the report form, so reporters do not need defect IDs. The built review section already holds the optional linked defect ID |
| Accept the design | User decision, 18 October 2026 | Quoted above |
| Contract rule shown in the design | Existing rule, not new | A submitted report holds its exact scope until closure; triage does not release it. This is the rule in [field-incidents.md](field-incidents.md) and the [contract](../contracts/field-incidents.md). The design shows it; it does not change it |
| Named version "Incidents and corrective actions — accepted" | Not saved; waits for Dean's explicit yes | Notes card: "a named version only on Dean's explicit yes" |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053). The intended named version "Incidents and corrective actions — accepted" is not saved yet |
| Page | "Incidents and corrective actions · FI-06" `1348:2972`, under "— Service operations —", after "Inspections · FI-03 · FI-04" `1339:4184`. The page header `1348:2973` holds the conformance declaration; the notes card `1355:2930` is in Flows and notes. File index row "Row / Incidents and corrective actions · FI-06" `1396:355204` on Start here |
| Desktop 1440 × 900 | Register, All incidents `1348:3008`; record, submitted with the scope held, Factual report tab `1348:3253`; triage form `1348:3382`; actions and evidence, accepting evidence `1348:3516`; accepted, ready to close `1348:4410`; report form, draft `1348:3653` |
| Tablet 1024 | Register with the side menu collapsed `1348:3756` |
| Phone 390 and 320 | Report form, draft, full length `1348:3985` (390 × 1477) and `1354:3721` (320 × 1625); Submit report sheet `1354:3275`; reporter view, submitted and held `1348:4149` |
| States | Phone 390: not connected, last saved 10:49 `1354:3435`; uncertain submit, recover the original `1354:3571` |
| Prototype | One flow starting point on the register, renamed "FI-06 — desktop" after acceptance. The frames carry the copied rail toggle, menu toggle and More actions interactions, and the grid row's hover and selected variants. After acceptance on 18 October 2026, Claude removed five copied record-header action links that led to another page. There are no frame-to-frame links. Claude did not play the prototype in Present mode |
| Page parts | Section "Page components (proposed)" `1355:2926`: Incident grid header `1348:4353` and Incident grid row `1348:4367` (Default, Hover and Selected). They stay on the page, as the Service review parts do |
| Story | Synthetic: SYN-PPO-INC-000014, a hot water flange leak at the boiler outlet during the boiler controller BC-2 swap on visit SYN-PPO-APT-000047, Tue 13 Oct 2026, at SYN Block C Plant Room (Block C Growers). Sam Patel reports; Jordan Kim owns the corrective action. Five other incidents fill the register |
| Retained captures | [Incidents design r01](../reference/ui/quality-site-assurance/incidents-design-r01/README.md): twelve icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:FI-06`, `route:/service/incidents` (rail item Incidents and actions), `route:/service/incidents/[id]` and `route:/service/incidents/new`. Parent requirements as traced by [field-incidents.md](field-incidents.md), unchanged. Capabilities unchanged (`incident.read`, `incident.report`, `incident.review`, `incident.close`, `incident.sensitive`) |
| Page type (r20) | Register or worklist for the register. Record detail with Document & evidence workspace and Review / comparison for the incident record. Form or guided workflow for a new report |
| Reused components | Shell v2 (Rail · Service, top bar with the proposed Conversations action, side menu), Grid header and cells, Record / Header, Readiness bar, Field and View tab, Work order record / Blocker row, Tag, Button, Planner / Input, Visit / Capture row. New, proposed: Incident grid header and row |
| Incoming handovers | A permitted appointment with its exact scope and equipment (FI-01, SV-04); an inspection defect (FI-03, FI-04) may be linked in triage |
| Outgoing handovers | A hold on the exact scope, which readiness and Start check; owned corrective activities in My Work; an internal incident outcome. No visit, work order, customer or Finance completion |
| Source authority | The FI-06 design register pages; [field-incidents.md](field-incidents.md) and the [contract](../contracts/field-incidents.md); the built `incidents/screen.tsx` and model |
| Proposed departures | D1–D7 in section 4, accepted |
| Status | Owner-accepted design, 18 October 2026 |
| Decision record | This file |
| Named version | "Incidents and corrective actions — accepted", not saved yet |

After acceptance on 18 October 2026, the page header in Figma was updated to "Accepted by Dean", naming this decision record; the named version is still not saved.

## 4. What the design shows

### Register

- **Grid:** one row per incident (D1). Columns run Incident, Summary, Classification, State, Hold, Priority, Actions, Reported, Reporter and Site. The 1440 frame shows the first five with a settings column; the Summary column is 290 px.
- **Toolbar:** Reporter, Site, the count with its read time ("6 incidents · as at Tue 13 Oct, 16:30 AEST") and two actions.
- **Side menu:** All incidents; a Triage group with Awaiting triage, In review, Clarification or returned and On hold; a Follow-through group with Holding work, Actions open, Ready to close and Closed (D1).
- **Holds:** every open incident shows "Scope held". Holding work counts 5. Only the closed incident shows "No hold".

### Incident record

- **Layout:** the SV-06 record layout (D2). The header shows the summary, state, incident number, classification, reporting time, reporter and the latest event. A "Before closure" bar lists what closure needs: the hold, the assessment, corrective actions, action evidence, incident content and current sources. A summary column holds Summary, Affected scope and Visit. Tabs: Factual report, Triage and review, Actions, Evidence and History.
- **Hold card (D3):** the first card on the Factual report tab names the held scope ("Scope held: boiler controller BC-2", "Held until closure"). It says what the hold stops (readiness and Start for later visits on that scope) and what continues (attendance, timers and inspection evidence). "Triage does not release the hold; only independent closure does."
- **Original report:** the report's facts as recorded, "facts are never edited in place", with restricted details shown as "none recorded".
- **Triage form (D4):** the report is summarised in one row above the form. The form asks for the basis for the assessment, the assessment, the priority, and the accountable owner and due time. The footer says "Triage keeps the scope held. Only closure releases it."
- **Actions and evidence (D5):** each corrective action shows its My Work activity and its completion. Its evidence files show their size and hash. A person other than the one who did the work accepts them or returns them for correction, with a required reason. Completing the activity does not accept its evidence.
- **Closure (D6):** the Triage and review tab shows the prepared internal outcome and what it keeps: the report, triage, the action and its accepted evidence, with restricted details left out. A preview follows. "Close incident" is the primary action. A changed source or a missing original file refuses closure.

### Report form

- **Layout (D7):** one scroll on phone; on desktop a Report tab and an Evidence tab beside a "Your visit" column with the visit, site, crew, work order, job pack and equipment.
  - "Before you submit" lists the exact scope, classification, facts, reason and the last save.
  - "Reports save online only. … Nothing is sent to triage until you submit."
  - What and where: the exact affected scope and equipment, the classification as four options (Observation, Near miss, Incident, Unknown) and the occurrence time in site time (Q3).
  - What happened: operational summary, factual observations and immediate response already taken.
  - Restricted details, with who can read them (Q2).
  - Reason for this report, then evidence.
  - Save draft and Submit report.
- **Submit sheet:** the sheet says the scope will be held until the incident is closed, that an independent reviewer triages it, and whether restricted details were entered. After submission the facts change only through a correction with its own reason.
- **Reporter view (phone):** Report, Triage, Actions and History tabs. The hold card, "Your report" with its version, and Open visit and Add evidence.
- **At 320 px:** the classification options wrap two by two, and every field label wraps so "Required" stays inside the card.
- **States:** not connected, which keeps the last save time and says reports are never queued offline; and an uncertain submit, which offers "Recover the original" with the same ID.
- **Rail:** the desktop report form uses the technician rail (My Work, My jobs, My inspections, Incidents and actions, Equipment).

### Departures, accepted

| ID | Departure | Earlier pattern |
|---|---|---|
| D1 | A grid register with side-menu views: All incidents; Triage (Awaiting triage, In review, Clarification or returned, On hold); Follow-through (Holding work, Actions open, Ready to close, Closed) | The built "Permitted incidents" list of summaries, each showing classification, state, assessment, priority, hold and due |
| D2 | The record uses the SV-06 layout with a "Before closure" bar and the tabs Factual report, Triage and review, Actions, Evidence and History | The built record's stacked sections (observations and corrections, owned corrective actions, retained evidence, reviewed outcomes, history, triage and review) |
| D3 | A hold card first: which exact scope is held, what that stops and what continues. Only closure releases the hold | The built list shows the hold as one line ("Scope held" or "No active hold from this record") |
| D4 | A triage form with the assessment, priority, accountable owner and due time and a written basis, with the report summarised above it | The built "Reasoned decisions" fieldset shared by review and closure |
| D5 | Each corrective action shows its My Work activity and completion; its evidence files show size and hash, and a separate person accepts or returns them with a reason | Actions and retained evidence in separate built sections |
| D6 | The Triage and review tab shows the prepared internal outcome, what it keeps and a preview; "Close incident" is the primary action | "Close and issue scoped outcome" in the decisions fieldset; outcomes listed after issue |
| D7 | A one-scroll report form in sections, classification as four options, a submit sheet that says the scope will be held until closure. Online only, as built. At 320 the options wrap two by two | The built "Factual event record" fieldset with a classification select and UTC times |

## 5. Not decided and not drawn

- **Building the page.** The built register, record and report form are the native FI-06 implementation inspected on 2 October 2026. Nothing changes until a build adopts this design. The build order is not decided.
- **Prerequisites and open points for a build:**
  - "Report an incident" in the visit's More menu on My jobs and Appointment detail (Q1). Those accepted pages are not redrawn here;
  - showing site time and storing UTC for due and occurrence times (Q3);
  - the register columns Actions, Reported, Reporter and Site, and the Triage and Follow-through view counts, need a read that supplies them;
  - the drawn report form has no "Source reference" field, which the built form has. Whether to keep it is decided at build.
- **The Conversations action** is part of the proposed top-bar shell amendment. Dean accepted the action in [PPO-CONV-T1-SCOPE](conversations-t1-scope.md), but the shared `Shell / Top bar` and `Shell / Phone header` components change only at its T1c lock-in, which is still open.
- **Named version.** "Incidents and corrective actions — accepted" is not saved. It waits for Dean's explicit yes.
- **Not drawn:**
  - the Evidence and History tabs in full;
  - correction after a return or a clarification request;
  - reopening;
  - rebinding to a reassessed scope;
  - adopting a reassigned activity;
  - the tablet record;
  - denied access and refreshed-denial states;
  - 200% zoom, which the spec reviews separately.
- **Data in the frames:** the incidents, people, visits, equipment, sites, files and hashes are synthetic. They are not operational records. Classification is a coordination label, not a risk assessment, as [field-incidents.md](field-incidents.md) sets out.

## 6. Audit and polish

From the notes card:
- **Audit before presenting:** every visible text was checked for copy left from the Inspections frames, placeholders and fonts (all Roboto; none left), and the story against the contract.
  - A submitted report holds its scope until closure, not until triage, so every open incident shows "Scope held" and Holding work counts 5.
  - Restricted details read "none recorded" to match the report.
  - The breadcrumb parent is "Incidents" so the incident number fits.
  - Link-styled fields carry links only; long report fields wrap.
  - At 320 the scope label wraps instead of clipping "Required".
- **Second polish pass, at Dean's request:** every visible truncated text was measured. The register Summary column is 290 px. Phone record titles use the full header width. The triage form shows the accountable owner and due time without scrolling: the report summary is one row, with the immediate response in its detail line.
- **Audit and polish of all seven pages:** truncation and overflow, fonts, labels, rail selection, the Conversations action on every top bar, placeholders, and one story across pages. White cards on the grey record background are the accepted SV-06 pattern. All seven field labels on the 320 phone report form now wrap.

Corrected after acceptance, before the captures were committed (18 October 2026):
- In image 11 the second line of "You can still add evidence" was cut off by its row; the row now grows with its text.
- In image 12 the not-connected state showed Save draft and Submit report as available; they are now dimmed, as the page notes require. Images 11 and 12 were exported again from rebuilt copies ([captures](../reference/ui/quality-site-assurance/incidents-design-r01/README.md#corrections-after-acceptance)).

## 7. Verification

- The audit and polish passes are recorded on the notes card `1355:2930` and summarised in section 6.
- The twelve captures are copies of the accepted frames on the "Captures (icon-free)" page `115:2`, from y = 200,000. Prototype links were removed and each of the 421 Font Awesome icon instances was swapped for `Icon/placeholder` (`67:77`) at its original size. A scan after the swap found no Font Awesome instance and no visible vector outside a placeholder or the Powerplants logo.
- The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder. The hashes are in the [captures README](../reference/ui/quality-site-assurance/incidents-design-r01/README.md).
- Claude did not play the prototype in Present mode.
- The captures are design compositions, not application captures, and set no UI baseline. The native FI-06 pages keep their own [evidence](../testing/evidence/field-incidents/README.md). No owner device, accessibility or operational review of this design is recorded.
