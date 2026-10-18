---
document_id: PPO-FI03-FI04-INSPECTIONS-FIGMA-DEC
date: 2026-10-18
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: 3bd12c428ec1db087d35bf2e6e55f8845a78b9db
versioning: git
---

# Inspections design — owner decision

On 18 October 2026 Claude recommended Inspections as the next page to design in Figma. Dean replied "Proceed on that basis", as the page's notes card records. The page covers two scopes and two routes:
- `scope:FI-03` "Service inspection capture" at `/my-jobs/inspections`: the technician records an inspection attempt;
- `scope:FI-04` "Service inspection review and retained retests" at `/service/inspections`: an independent reviewer accepts, returns, asks for clarification or holds the attempt, then issues a scoped internal outcome.

Claude drew the page from these sources:
- the FI-03 and FI-04 design register pages ([scope-fi-03](../design/development/pages/scope-fi-03.md), [scope-fi-04](../design/development/pages/scope-fi-04.md), [route-my-jobs-inspections](../design/development/pages/route-my-jobs-inspections.md), [route-service-inspections](../design/development/pages/route-service-inspections.md));
- the [service inspections](service-inspections.md) decision and the built `src/inspections/service-screen.tsx`, including its review decisions Accepted, Returned, ClarificationRequired and OnHold;
- the accepted [Service review and reports](service-review-figma-design.md) design (SV-06), whose record layout and parts were copied;
- the accepted [My jobs](my-jobs-figma-design.md) design (FI-01), whose capture frames were copied;
- the retained [Quality, Safety & Site Assurance r01](quality-site-assurance-design.md) workspace, which the register pages name as the exact retained reference.

No accepted frame or main component was edited.

Dean asked twice for an audit and polish before accepting. The notes card records his words as "give the pages an audit and professional polish" and, across the seven new pages, "give all the pages an audit and polish". Claude then asked: "Do you accept Inspections with the recommendations?" Dean replied: "I happy to accept and proceed with your recommendations." The reply is quoted exactly, including the missing word. It covers departures D1–D7 and questions Q1–Q4 as written on the notes card, and each question takes its recommended answer.

The named Figma version "Inspections — accepted" was saved on 18 October 2026 at Dean's request.

Scope:
- `scope:FI-03` with `route:/my-jobs/inspections` (rail item My inspections), and `scope:FI-04` with `route:/service/inspections` (rail item Inspection review).
- Parent requirements are as traced by the [service inspections](service-inspections.md) decision, unchanged. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design Inspections (FI-03, FI-04) next | User decision, 18 October 2026 | "Proceed on that basis", after Claude recommended the page, as the notes card records |
| Conversations action in the top bar | User decision, 18 October 2026 | Dean asked for the Conversations action left of the information icon on every new top bar. The shell amendment itself is a separate record and is still open (section 5) |
| Audit and polish before acceptance | User decision, 18 October 2026 | Quoted above. Section 6 |
| Departures D1–D7 | Accepted as recommended, 18 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Result preview while typing | Resolved as recommended | The server evaluates at submission. The capture shows a local preview labelled "not saved yet", and the server's result governs |
| Q2 Compare attempts | Resolved as recommended | A side-by-side compare of attempt 1 and its retest is a later addition. The frames show Compare attempts and Compare links; the compare view is not drawn |
| Q3 Evidence formats | Resolved as recommended | Keep the built PNG and plain text only for now. Phone JPEG photos are noted as a later change |
| Q4 Who reviews | Resolved as recommended | No change. Inspection review needs report read and work order edit access, as built |
| Accept the design | User decision, 18 October 2026 | Question and reply quoted above |
| Save the named version | Done | Saved by Claude in the Figma desktop app on 18 October 2026 at Dean's request ("Yes, save the seven named Figma versions now"); confirmed in version history |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053). Named version "Inspections — accepted", saved 18 October 2026 |
| Page | "Inspections · FI-03 · FI-04" `1339:4184`, in the Service operations group, after My jobs · FI-01 `845:44` and before Incidents and corrective actions · FI-06 `1348:2972`. The page header `1339:4185` holds the conformance declaration. The notes card `1345:2979` is in Flows and notes `1345:2978`. After acceptance on 18 October 2026, the page header was updated to "Accepted by Dean", naming this record; the frame names still end in "(proposal)". File index row "Row / Inspections · FI-03 · FI-04" `1396:355197` on Start here |
| Desktop 1440 × 900 | Section `1344:4267`: review register, All attempts `1339:4220`; attempt 2 retest on Readings, awaiting review `1339:4442`; attempt 1 with the failed check and the review decision Returned `1339:4542`; accepted, outcome ready to issue `1339:4684`; technician capture, draft `1339:317844` |
| Tablet 1024 | Section `1344:4273`: review register with the side menu collapsed `1339:4792` |
| Phone 390 and 320 | Section `1344:4275`: My inspections, assigned visits `1339:317656`; capture, 2 of 4 checks, full length, 390 `1339:317680` and 320 `1344:3577`; Submit inspection sheet, 1 check fails `1343:3284`; reviewer on the Retests tab `1339:4851` |
| States | Section `1344:4281`, phone 390: not connected, last saved 10:31 `1344:3746`; uncertain submit, recover the original `1344:3909`; can't record yet, not attending `1344:4086` |
| Prototype | The page has no flow of its own. After acceptance on 18 October 2026, Claude removed the 18 copied links that led to frames on the My jobs, Work order record and Service review pages and renamed the two flow starting points "FI-03 · FI-04 — desktop" and "FI-03 · FI-04 — phone". Claude did not play the prototype in Present mode |
| Page parts (proposed) | Section "Page components (proposed)" `1344:4285`: Inspection grid header `1339:4974` and Inspection grid row `1339:4919` |
| Story | Synthetic: on Thu 15 Oct 2026 at SYN Glasshouse 4 (Hillview Growers), visit SYN-PPO-APT-000052 under SYN-PPO-WO-000040 with job pack r04. Procedure SYN-SVC-INS-04 v1, "Drive motor insulation and torque", on Shade screen motor M-4:<br>• attempt 1, Casey Ward: holding torque 13.4 N·m against a 12 N·m limit fails, and defect SYN-DEF-000019 is raised with an owned corrective activity;<br>• Sasha Cole returns attempt 1;<br>• Riley Tran records the gearbox seal replaced at 10:20;<br>• attempt 2, Riley Tran: 4 of 4 pass at 11.2 N·m, accepted at 11:24, outcome ready to issue |
| Retained captures | [Inspections design r01](../reference/ui/quality-site-assurance/inspections-design-r01/README.md): twelve icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:FI-03`, `route:/my-jobs/inspections` (rail item My inspections); `scope:FI-04`, `route:/service/inspections` (rail item Inspection review). Parent requirements as traced by the [service inspections](service-inspections.md) decision, unchanged. Capabilities unchanged |
| Page type (r20) | FI-03: Form or guided workflow, and Document and evidence workspace. FI-04: Register or worklist, Record detail, and Review or comparison |
| Reused components | Shell v2 (Rail · Service, top bar with the proposed Conversations action, side menu), Grid header and cells, Record / Header, Record / Readiness bar, Record / Field, Record / View tab, Work order record / Blocker row, Tag, Button, Planner / Input, Visit / Capture row, Job pack list row (phone) and Shell / Phone header. New, proposed: the page parts in section 2 |
| Incoming handovers | An assigned visit and its issued job pack (FI-01, SV-04); attendance and readiness (FI-05); a submitted attempt for review |
| Outgoing handovers | The owned defect and corrective activity, a linked retest attempt, the frozen review and the internal inspection outcome. Nothing reaches the customer from these pages |
| Source authority | The FI-03 and FI-04 design register pages; the [service inspections](service-inspections.md) decision; the built `service-screen.tsx`; the accepted [Service review and reports](service-review-figma-design.md) and [My jobs](my-jobs-figma-design.md) designs |
| Proposed departures | D1–D7 in section 4, accepted |
| Status | Owner-accepted design, 18 October 2026 |
| Decision record | This file |
| Named version | "Inspections — accepted", saved 18 October 2026 |

## 4. What the design shows

### Review register (FI-04)

- **Grid:** the Work orders grid, one row per attempt (D1). Columns run Visit, Procedure, Attempt, Review, Result, Defects, Equipment, Performer, Submitted and Site, scrolling sideways. The Site column is 190 px so site names fit.
- **Side menu:** All attempts; Review: Awaiting review, Clarification requested, On hold and Returned; Follow-through: Retest due, Accepted not issued and Outcomes issued (D1).
- **Review states:** shown as Tags in words.
- **Toolbar:** Performer and Site filters, and the count with its as-at time.
- **Tablet 1024:** the same register with the side menu collapsed.

### Attempt record (FI-04)

- **Layout:** the SV-06 record layout (D2). The header shows the procedure, the attempt number and state, the performer, the attempt it retests, the test times and the submission time. The actions are Open visit and the state's primary action: Review attempt, or Issue outcome after acceptance.
- **Readiness bar:** "Before outcome". It lists readings, calibration at use, evidence, defect corrected, independent review and outcome.
- **Details column:** Summary; Equipment and scope, bound when the attempt was opened; Visit and issued pack.
- **Tabs:** Readings, Evidence, Defects and retests, Review history and Outcome. Each reading states the value, the criterion, the result in words and the instrument with its calibration.
- **Review decision (D3):** what failed is listed first, with the raised defect. Then come the reason, with a character count, and the decision: Accepted, Returned, Clarification required or On hold, as built. It is saved with "Save review decision". The header actions are hidden while the form is open. Returning keeps the attempt exactly as submitted; the retest is a new linked attempt.
- **Outcome tab (D4):** after acceptance, the header's primary action becomes "Issue outcome". The tab shows the prepared internal outcome (HTML and PDF), its SHA-256, what it keeps (the failure, defect, correction and retest, with exclusions and outstanding work) and a preview. A changed source, configuration or open blocker refuses the issue. It is internal and sends nothing to the customer.

### Technician capture (FI-03)

- **Desktop:** the record layout with a "Before you submit" bar (attendance, job pack acknowledged, checks recorded, instrument named for each reading, last save), a Your visit and Equipment column, and Checks, Evidence, Findings and Source tabs. The rail shows the technician's items only. Save draft and Submit inspection sit in the header.
- **One-scroll capture on a phone (D5):** an "Inspections save online only" notice with the last save; Before you test (equipment and configuration, procedure, job pack and attendance); checks, with the result shown as soon as a value is entered and marked "not saved yet" (Q1); choice checks as segmented options; evidence; findings; then a Save draft and Submit dock.
- **Submit sheet (D5):** names the checks that pass, the failing check with its limit and instrument, and the defect and owned corrective activity that submitting will raise. It says the readings and results are frozen and go to an independent reviewer.
- **320 px (D7):** the four seal-condition choices wrap two by two; instrument and findings fields wrap instead of clipping.
- **My inspections (phone):** Riley Tran's own work for the day in To do, Submitted and Finished groups, with an "Online only" marker.

### Phone reviewer (FI-04)

- **Retests tab (D6):** the chain in order: attempt 1's failure, the defect raised at submission, the correction recorded, the passing retest, the pending independent review, and the outcome not yet issued. "Accepting records your review only. The outcome is issued as a separate step." Open visit and Review attempt are pinned.

### States (phone 390)

- **Not connected:** "Not connected · last saved 10:31". Entries after the last save are only on the screen until the user is back online and saves.
- **Uncertain submit:** "We don't know if your submit arrived", with Recover the original, which sends exactly what was submitted with the same ID. Save draft and Submit are disabled.
- **Can't record yet:** the user is not recorded as attending; they start work on the visit in My jobs first. Save draft and Submit are disabled.

### Kept from the built rules

- Submission freezes the entries and their computed results. A failed required check raises or reuses the owned defect.
- A defect closes only with a recorded correction, a passing linked retest and an accepted independent review. A retest cannot be waived.
- Calibration is judged against the snapshot retained at capture.
- Inspections are online only; there is no offline inspection queue.
- The outcome is internal and scoped to the accepted attempt. It completes no appointment, work order or customer process.

### Departures, accepted

| ID | Departure | Earlier pattern |
|---|---|---|
| D1 | Inspection review is a grid (Visit, Procedure, Attempt, Review, Result, Defects, Equipment, Performer, Submitted, Site) with side-menu views by review state: All attempts; Review: Awaiting review, Clarification requested, On hold, Returned; Follow-through: Retest due, Accepted not issued, Outcomes issued | A built worklist of visits with stacked attempt buttons |
| D2 | The attempt record uses the SV-06 layout: a "Before outcome" readiness bar (readings, calibration at use, evidence, defect corrected, independent review, outcome) and tabs Readings, Evidence, Defects and retests, Review history and Outcome. Each reading states value, criterion, result in words and the instrument with its calibration | One long built card per attempt with native details |
| D3 | The review decision form lists what failed first, then the reason and the decision (Accepted, Returned, Clarification required, On hold, as built), saved with "Save review decision". Returning keeps the attempt exactly as submitted; the retest is a new linked attempt | The built review form |
| D4 | After acceptance the header's primary action becomes "Issue outcome". The Outcome tab shows the prepared internal outcome, its hash, what it keeps (the failure, defect, correction and retest) and a preview. It sends nothing to the customer | The built "Issue scoped inspection outcome" button |
| D5 | One-scroll capture: Before you test, checks with the result shown as soon as a value is entered ("not saved yet"), choice checks as segmented options, evidence and findings, then a Save draft and Submit dock. Submit opens a summary sheet that names the failing check and the defect it will raise. An "online only" notice states the last save, because inspections have no offline queue | The built capture form with native fieldsets and details |
| D6 | On a phone, the reviewer's Retests tab shows the chain in order: attempt 1 failure, defect, correction, passing retest, pending review, outcome | Not drawn |
| D7 | At 320 px the four seal-condition choices wrap two by two | Not drawn |

## 5. Not decided and not drawn

- **Building the page.** The built FI-04 page is a worklist of visits with stacked attempt buttons and one long card per attempt. The built FI-03 capture uses native fieldsets and details. The build order is not decided.
- **Later additions recorded by the answers:** the side-by-side compare of attempts (Q2); phone JPEG photos (Q3), which would need their own change to the PNG and plain text rule.
- **The Conversations action** is part of the proposed top-bar shell amendment recorded with the [Conversations design](ai-communications-threads-proposal.md). That amendment is still open. `Shell / Top bar` and `Shell / Phone header` change only when it is accepted.
- **Not drawn:**
  - the Evidence and Review history tabs;
  - the technician's reply to a clarification request;
  - compare attempts;
  - a tablet or 1024 record;
  - denied access, withdrawn applicability and stale conflict states;
  - 200% zoom.
- **Figma housekeeping still open:** frame names that still end in "(proposal)". The File index row and the page header were updated on 18 October 2026.
- **Data in the frames:** the people, sites, equipment, readings, instruments, defects and times are synthetic. They are not operational records.

## 6. Audit and polish

Three passes are recorded on the notes card.

- **Audit and polish:** every visible text was checked for copy left from the source pages, placeholders and fonts (all Roboto; none left), and for one story across frames. Changes:
  - attempt times say "tested", not "attended";
  - Riley's attendance starts at 08:02 with the crew, not at the retest;
  - the review form hides the header actions while it is open;
  - the submit sheet's background shows attempt 1, not the retest;
  - "1 fails" reads "1 fail";
  - the technician desktop content uses the 24 px record inset.
- **Second polish pass:** every visible truncated text was measured. The register Site column is 190 px so site names fit; phone record titles use the full header width; instrument and findings fields wrap at 320 instead of clipping; sections were refitted.
- **Audit across all seven new pages:** truncation and overflow, fonts, labels, rail selection, the Conversations action on every top bar, placeholders, and one story across pages. Changes here:
  - SYN-PPO-APT-000049 is performed by Casey Ward, matching its finding on the Findings page;
  - Riley Tran's My inspections list shows only Riley's own work: four inspections, with a submitted fertigation dosing check in place of the controller firmware check and boiler test;
  - field labels on the 320 phone wrap instead of clipping "Required".

Corrected after acceptance, before the captures were committed (18 October 2026):
- The account button on the technician frames read "SC" (Sasha Cole, the reviewer); it now reads "RT" (Riley Tran).
- The "can't record yet" state listed two recorded checks while saying nothing was saved; it now shows no checks recorded.
- The "not connected" state now shows Save draft and Submit dimmed, as on the incident report.

Images 05, 07 and 12 were exported again from rebuilt copies ([captures](../reference/ui/quality-site-assurance/inspections-design-r01/README.md#corrections-after-acceptance)).

## 7. Verification

- The audits above are recorded on the notes card `1345:2979`. This record copies them; it did not repeat them.
- The twelve captures are copies of the accepted frames on the "Captures (icon-free)" page `115:2`, from y = 196,000. Prototype links were removed and each of the 440 Font Awesome icon instances was swapped for `Icon/placeholder` `67:77` at its original size. A scan after the swap found no Font Awesome instance and no visible vector outside a placeholder or the Powerplants logo.
- The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder. The hashes are in the [captures README](../reference/ui/quality-site-assurance/inspections-design-r01/README.md).
- Claude did not play the prototype in Present mode.
- Nothing is built in this form, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
