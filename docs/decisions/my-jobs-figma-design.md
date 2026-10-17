---
document_id: PPO-FI01-MYJOBS-FIGMA-DEC
date: 2026-10-15
owner: Dean Fiedler
status: Owner-accepted design; native implementation, the backend changes it implies (R6, the allowance source, the offline fixes) and UI baseline acceptance separate
source_commit: a676fde58d2ee88878bb2f9489912c97f49636b3
versioning: git
---

# My jobs design — owner decision

On 15 October 2026, after a code audit, Claude recommended the technician pages as the next Figma design. FI-01 is built and works, but it had no design on the accepted register and record patterns, and the audit found field defects that a design could settle. Dean agreed: "Proceed: design the technician My Jobs list and visit page in Figma, phone-first, following the accepted Pipedrive pattern and ADR-0053, with your recommendations for the open questions."

Dean shared the accepted timer concept board (r05) and asked for its states "at some stage". He also asked for desktop and tablet versions: "however most times the field technician will use the smartphone view." He then asked for:
- a professional polish, with tables that match the other pages;
- the remaining r05 timer states;
- desktop and tablet versions of those states.

He accepted the result the same day: "I accept the My jobs · FI-01 design with your recommendations, including Q9 and Q10. Lock it in under ADR-0053." The design reference is the named Figma version "My jobs — accepted".

Scope: `scope:FI-01` "Technician Today and job execution", with the FI-02 offline copy shown as a state of the same pages. Routes are `/my-jobs` and `/my-jobs/[id]`. The parent requirements recorded for P07, P08 and P09 and for FI-01 and FI-02 are unchanged; no parent requirement ID is added or renamed. This is a design decision. It authorises no application code, route, read model, migration, permission, capability or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Accept the design and its recommendations | User decision, 15 October 2026 | "I accept the My jobs · FI-01 design with your recommendations, including Q9 and Q10." Every recommendation on the notes card is adopted, and each question takes its recommended answer |
| Phone first, with desktop 1440 and tablet 1024 on the accepted layouts | User decision, 15 October 2026 | "Phone-first" in the brief. Then: "we will also still need a desktop and tablet version … however most times the field technician will use the smartphone view" |
| R1 The list is ordered by start time in Today, Upcoming and Recently finished, with the running timer pinned on top; today's visit can never drop off the first page | Claude's recommendation, adopted | Audit finding SVC-4: the current list has no order and no open-only filter |
| R2 One visit page with four tabs: Work (timer, tasks, crew), Capture (checks, readings, findings, parts, photos), Pack (the accepted Job pack technician view, unchanged) and Finish (your time, checks, outcome, submit) | Claude's recommendation, adopted | The accepted View tab `312:16` and shared record layout. Pack reuses the accepted Job pack design |
| R3 The timer keeps the accepted r05 rules | Claude's recommendation, adopted | [r05](field-work-timer-design.md) and [field-timer-native](field-timer-native.md): Start records arrival; Break and Travel pause at once and other reasons need a note; Undo for 8 seconds; at most 5 minutes ahead; a bottom dock with 56 px buttons |
| R4 Photos are taken in the app, resized and converted to PNG on the phone, with location and camera details removed | Claude's recommendation, adopted | ADR-0012's PNG policy stays as it is. Audit SVC-6: the phone currently sends what the camera gives |
| R5 Times are picked in the site's time zone and default to now; nothing is typed as UTC text | Claude's recommendation, adopted | Audit SVC-9 |
| R6 Crew-aware finish: each person submits their own part, and the visit goes to Service review when every crew member who started has submitted | Claude's recommendation, adopted; changes today's rule | Audit SVC-10. It needs a backend change (Section 5) |
| R7 Offline is a state of the same pages: a sync chip, a state on each item, one problem never holds up the rest, and the end of the offline copy is shown | Claude's recommendation, adopted | Audit SVC-1, SVC-8, SVC-13 and SVC-21; ADR-0013 |
| R8 The customer responds after Service review (FI-07) and signs on a signature pad that produces the existing PNG mark | Claude's recommendation, adopted | [field-customer-response](field-customer-response.md); audit SVC-6 |
| R9 No hashes, receipt IDs, UUIDs or prototype wording on technician screens | Claude's recommendation, adopted | Audit SVC-20 |
| Q1 Each crew member submits separately | Resolved as recommended | Yes (R6) |
| Q2 How long a downloaded visit stays on the phone | Resolved as recommended | Keep today's 24 hours, show it as an end time, and revisit after field use |
| Q3 PNG on the phone or JPEG on the server | Resolved as recommended | PNG on the phone now. JPEG only with its own ADR for a decoder and a metadata policy |
| Q4 Customer signature before Service review | Resolved as recommended | No. Keep FI-07's rule and ask coordinators to review the same day |
| Q5 Visits the technician is not assigned to | Resolved as recommended | Not shown, as today |
| Q6 Working colour | Resolved as recommended | Add r05's teal to the Figma library as a variable. Its value comes from `--progress: #26746e` in `src/app/styles/work-timer.css` (ADR-0053 rule 5). The frames show the success green in its place; the build keeps the app's colour |
| Q7 My inspections icon | Resolved as recommended | clipboard-check, as in the phone tab bar, in place of the wrench it shares with My jobs |
| Q8 Desktop and tablet | Resolved as recommended | Drawn on the accepted register and shared record layouts. The phone stays the main design; Pack and Finish on desktop follow the same layout and are not drawn separately |
| Q9 When a running timer counts as forgotten | Resolved as recommended | When one stretch passes 12 h, as the r05 desktop board's activity entry says ("More than 12 h since the stretch started"). Setting the finish keeps field-timer-native's rule: a chosen time within 48 h of the open stretch, and a reason |
| Q10 When "How much work is left?" appears | Resolved as recommended | When you stop on a multi-day job before its last day, with "Not sure, skip" always available |
| Tables match the accepted registers | Dean's request ("Check the tables to ensure they align with the styles used in the other UI pages"), done | 40 px header and cells, group rows, fixed Select and Settings columns and horizontal scroll, as on the accepted Work orders register. Tables inside a visit sit flush with a top border only |
| Select column | Claude's recommendation, adopted | Bulk actions that do not change a visit, such as printing job packs or keeping visits on this device for offline use |
| r05 timer states on this page | Dean's request, done | Stopped with Undo, timer left running overnight, set the finish time, another job is timing, multi-day day 3 with the job labour allowance, and end of day 2 with "How much work is left?", on phone, desktop and tablet |
| One page, not numbered pages | Claude's judgement, accepted with the design | ADR-0055 rule 9 allows numbered pages from about 30 frames but does not require them. The page holds 39 accepted frames, and prototype links work only inside one page |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "My jobs — accepted". The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "My jobs · FI-01" `845:44`, under the divider "— Service operations —" `626:14`, after Job pack. Its header `845:45` holds the conformance declaration. Its notes card `857:1449` lists the story, recommendations, answers, polish, backend work, what is not drawn and the r05 port. File index row `896:222776` |
| Phone 390 and 320 | Section `845:98`:<br>• My jobs 390 `849:56`, 320 `849:250`, no signal `855:918`, Waiting to send `855:1069`<br>• Visit: ready to start `850:314`, working (Work tab) `850:438`, Capture tab offline `851:423`, add a photo `851:725`, add a reading `851:834`, pause reason `854:789`, Finish tab `854:926`, customer response with signature `854:1154` |
| States | Section `845:105`: can't start yet (pack reissued) `856:1210`, couldn't refresh `856:1337`, your part submitted `856:1384`, no visits today `856:1487` |
| Timer states (r05) | Phone `875:3087`: Stopped with Undo `876:3289`, left running overnight `876:3463`, set when you finished `878:3327`, another job is timing `878:3581`, multi-day day 3 `879:3427`, end of day 2 `879:213333`<br>Desktop `884:3463`: `885:215245`, `885:215647`, `889:4417`, `889:4852`, `890:5266`, `890:221178`<br>Tablet `884:3464`: `885:216033`, `885:216405`, `889:5251`, `889:5650`, `890:5701`, `890:221641` (same order) |
| Desktop and tablet | Desktop `845:90`: register `861:1445`, visit Work `862:1737`, visit Capture `864:2027`. Tablet `845:94`: register `865:2339`, visit `865:2756` |
| Flows | Ten prototype flows: phone, offline, desktop, tablet, and "forgot to stop" and "multi-day job" for phone, desktop and tablet. Claude could not run Present mode through the connector, so the links were set but not clicked through |
| Page components (proposed) | My jobs / Live timer banner `848:111`, Visit / Task row `848:62`, Visit / Capture row `848:63`, Visit / Photo tile `848:102`, Visit / Crew row `848:103`, My jobs grid header `869:2781`, My jobs grid row `869:2903` (Default, Hover, Selected) |
| Cloned and shared parts | Work orders register `196:24111` and Work order record page `315:2094` (desktop and tablet), Job pack list row (phone) `275:42685`.<br>Shell parts: Shell / Phone header, v2 / Tab bar (phone), Rail · Service, Shell / Top bar, v2 menu items.<br>Record and grid parts: Grid / Header cell and Cell, My Work / Group row, Record / Header, Readiness bar and Check item, View tab `312:16`, Record / Field and Section heading.<br>Basic controls: Tag, Button, Callout and the sheet scrim |
| Retained captures | [My jobs design r01](../reference/ui/service/my-jobs-design-r01/README.md): thirty-nine icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:FI-01` (primary) with FI-02 offline in the same pages. Routes `/my-jobs` (list) and `/my-jobs/[id]` (visit). Parent requirements as recorded for P07, P08, P09, FI-01 and FI-02, unchanged. Capabilities unchanged: `field.read.own`, `field.start.own`, `field.capture.own`, `field.attachment.own`, `field.correct.own`, `field.completion.own`, `pack.acknowledge`, `report.respond`, `incident.report` |
| Page type (r20) | Register / worklist (My jobs) and Record detail with a Form / guided workflow (the visit's Work, Capture, Pack and Finish tabs). Phone 390 and 320 first; tablet 1024 and desktop 1440 on the accepted register and shared record layouts. Bottom sheets on the phone become centred dialogs on desktop and tablet |
| Reused components | Section 2. New, proposed page components: the live timer banner, task, capture, photo and crew rows, and the My jobs grid row and header |
| Source authority | [field-work-timer-design](field-work-timer-design.md) (r05, accepted) and its concept board; [field-timer-native](field-timer-native.md); [field-closed-visit-guidance](field-closed-visit-guidance.md); [field-customer-response](field-customer-response.md); ADR-0012 (online evidence, PNG policy); ADR-0013 (offline recovery); the accepted [Job pack](job-pack-figma-design.md) and [Work order record page](work-order-record-page-design.md) designs; Claude's code audit of 15 October 2026 (SVC-1 to SVC-21). Fixture: synthetic visits, people, sites and times |
| Incoming handovers | Read-only here except your own capture:<br>• the current assignment and booking (Schedule);<br>• the exact issued job pack and your acknowledgement (Job pack);<br>• the authorised scope, tasks and asset (Work order record);<br>• your FI-01 timer state;<br>• the cached FI-02 offline copy with its download time |
| Outgoing handovers | • Your arrival, timer stretches, checks, readings, findings, parts and PNG photos into the P07 record, with corrections as successors.<br>• Your completion submission to Service review (P09).<br>• The customer's response after Service review (FI-07).<br>• Incidents (FI-06).<br>Never: approve your own report, reopen accepted attendance, change the booking or the pack, or stop and start timers across jobs automatically |
| States shown | Phone, Timer states and States sections above, each frame named after its state. Every state includes the offline variants of the list and Capture tab |
| Departures | Section 4 |

## 4. Display rules and departures

- **The timer keeps r05.** The clock, readouts and visit track keep r05's behaviour and wording. The Undo bar counts down 8 seconds, and the stretch shows "Kept on this device" until the Undo time runs out. Stop never submits the completion.
- **Forgotten finish.** A stretch that passes 12 h is flagged "Timer still running". The technician chooses:
  - when they finished: the last thing they recorded, the booked end, or another time;
  - why the finish is earlier than now.
  A summary shows what will be recorded before they confirm. Setting a finish time keeps the original and records the reason.
- **Another job is timing.** Start is locked by a readiness check that names the other job. A link goes to that job. When the other timer ran overnight, the main action is "Set finish time there" (desktop) or "Set when I finished there" (phone). Nothing stops or starts a timer on another job automatically, as field-timer-native requires.
- **Multi-day jobs.** The day's timer and the job's labour allowance are separate. The allowance covers the whole crew across visits, with earlier days, today and a forecast. "How much work is left?" asks for a best guess for the whole job and never changes recorded time.
- **Offline.** Each item carries its own state: Sending, Waiting for signal or Needs attention. The list shows when the offline copy ends. One refused item never holds up the rest.
- **Synthetic story.** Casey Ward (technician) and Riley Tran (lead), all times AEST:
  - **Main story:** SYN-PPO-WO-000040 "Shade screen motor replacement" on Tuesday 13 October 2026, the Job pack hero visit.
  - **Forgot-to-stop branch:** Wednesday 14 October, with SYN-PPO-WO-000038 "Climate computer health check" as the other job.
  - **Multi-day pair:** SYN-PPO-WO-000047 "Priva NutriJet commissioning" on 1–2 December 2026, as on r05.

| ID | Departure | Reference or today's page |
|---|---|---|
| V1 | View tabs (Work, Capture, Pack, Finish) replace r05's job menu (Overview, Job pack, Field notes, Scope and limits, Equipment, Customer contact, Completion) | r05 Option 1 record page |
| V2 | Desktop and tablet use the accepted register grid and shared record layout (Record / Header, Readiness bar, details column) in place of r05's own record page. r05's 820 px width is not drawn | r05 Option 1 at 1440, 1024 and 820 px |
| V3 | The frames show the Working state and labour bars in the success green, not r05's teal (Q6) | r05 and `--progress` in `work-timer.css` |
| V4 | The job labour allowance and "How much work is left?" are drawn as on r05. They need sources the app does not have (Section 5) | field-timer-native: the allowance shows "Not established", and remaining work uses the completion draft |
| V5 | Photos converted to PNG on the phone (R4), and a signature pad for the customer mark (R8) | Today's app sends the camera's image and has no pad |
| V6 | Crew-aware finish (R6) | Today's completion rule |
| V7 | The list's order and grouping (R1) | Today's unordered list |
| V8 | On tablet, the record position ("1 of 2 today") is hidden in the r05 timer states so the header buttons fit at 1024 px | The shared Record / Header |

## 5. Not decided

- **Building the page.** The native page already runs the r05 timer, and nothing here changes it until a build adopts this design.
- **Backend work the design implies.**
  - Crew-aware completion (R6).
  - Offline:
    - offline Start bound to the assignment, not the row version (SVC-2);
    - retry backoff, skipping refused items and sending any item to recovery (SVC-1);
    - purge after receipt and size-based timeouts (SVC-7, SVC-8).
  - The My jobs order and an open-only filter (SVC-4).
  - On-phone PNG conversion and the signature pad.
  - The forgotten-finish flag at 12 h (Q9).
  - A source for the job labour allowance: quoted labour and crew totals across visits.
  - A record for the "How much work is left?" estimate; today it would go into the completion draft.
- **Another job, ordinary overrun.** r05 offered "Stop that job and start this one". field-timer-native leaves out automatic stop and start across jobs, so whether to offer it is not decided. The drawn case, a timer left overnight, does not need it.
- **Q6 variable.** The teal variable is added at the next library sync, from `work-timer.css`.
- **Not drawn yet:**
  - the Pack tab content (the accepted Job pack technician view, frame `294:4878`, unchanged);
  - Finish and Pack on desktop and tablet;
  - the Paused state after the sheet;
  - r05's 820 px width;
  - the coordinator's job allowance view (r05 Desktop-Allowance), which belongs on a coordinator page;
  - Incidents (FI-06), My inspections (FI-03) and site readiness, which link from here.
- **Inherited shell finding.** At 1024 px the shared Shell / Top bar fits only after hiding its "Design and build workspace" and "Page guide" buttons. The tablet frames hide them; the fix belongs to the Shell page.

## 6. Consequences

- No application code, read model, route, migration, permission or capability changes; all 78 parent IDs remain.
- The `scope:FI-01`, `route:/my-jobs` and `route:/my-jobs/[id]` entries link this design and its captures. Their visual status is unchanged.
- [field-work-timer-design](field-work-timer-design.md) r05 stays the accepted timer baseline and the built presentation. This design places its states on the accepted layouts and records the departures above. r05's bytes and fingerprints are unchanged.
- A later change receives a new named version and a new capture revision folder.

## 7. Verification

- **While drawing.** Claude checked every frame with screenshots inside Figma and fixed what was found:
  - text clipped in the header and status lines;
  - a Figure column that cut the desktop clock's seconds;
  - a readout that collapsed the allowance card;
  - frame labels that overlapped;
  - a labour bar that started at 13:57 instead of 13:42.
- **Polish pass.**
  - Colours were bound to PPO colour variables and text to PPO text styles.
  - Action-bar buttons were set to 56 px and sheet buttons to 48 px.
  - Card padding was set to 16 px on phone and 20–24 px on desktop.
  - Phone headers and action bars were aligned with the accepted record pages.
- **Captures.**
  - The thirty-nine captures are copies of the accepted frames, with all 864 Font Awesome icon instances swapped for `Icon/placeholder`. A scan after the swap found none left.
  - A scan of 2,739 visible texts found none whose stored colour differed from its bound variable.
  - They were exported at scale 1 with the Figma connector. The hashes are in the [captures README](../reference/ui/service/my-jobs-design-r01/README.md).
- **Repository checks.** `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py`, `npm run studio:check` and `python3 scripts/build-ui-sequence.py --check` were run on this change; results are in its pull request.
- **Not evidenced.** Nothing is built, so there is no application or device evidence. This record implies no visual review of the application and no UI baseline.

## 8. Amendment A07 — accept or Return on the phone (16 October 2026)

On 16 October 2026 Dean accepted the field readiness gate with the other five items of the UX benchmark's Decision brief: "I am happy to proceed with all six based on your recommendations." The [UX benchmark decisions](ux-benchmark-decisions-2026-10-16.md) record (PPO-UXB-DEC-01, decision 4) holds the decision and the [field readiness gate record](field-readiness-gate-proposal.md) holds its rules. Amendment A07 lets the technician accept or Return the job pack from the phone, with a reason, and shows the returned state in My jobs. Sections 1 to 7 describe the design as first accepted; where A07 differs, A07 governs.

| Item | Classification | Evidence |
|---|---|---|
| Accept or Return the pack on the phone, with a reason | User decision, 16 October 2026 | Quoted above; A07 in the [amendment register](../design/research/ux-benchmark/amendment-items.csv) |
| The list and visit wording of A1-D5 | Claude's proposal, accepted by the same decision | The field readiness gate record, section 4 |
| Named Figma version | **Waiting for Dean's explicit yes** | "Field readiness gate — accepted" is saved only on that yes; the [captures README](../reference/ui/service/field-readiness-gate-r01/README.md) records the save when it happens |

**Design reference.** Page "My jobs · FI-01" `845:44`, section "A1 · Field readiness gate" `959:243132`: My jobs list on Mon 12 Oct 18:35 with one pack returned `959:243133`; visit "can't start yet, you returned r03" `959:243158`; visit ready to start with parts and site confirmed `959:243243`. Notes card `966:17770`. The Return itself is drawn on the Job pack page (amendment A06 of the [Job pack design](job-pack-figma-design.md)), because the technician returns the exact issue they read. Icon-free captures: [field readiness gate r01](../reference/ui/service/field-readiness-gate-r01/README.md), images 08 to 10.

| ID | Departure from sections 1 to 7 | Accepted design before A07 |
|---|---|---|
| A1-D5 | List rows say "You returned job pack r03 · waiting for r04", "Acknowledge or return job pack r01" and "Job pack due by …"; "Checked for this visit" gains the parts and site-readiness checks | "Acknowledge job pack r01" and "Job pack not issued yet"; four checks |

**Built in the first increment.** The built My jobs visit is still the FI-01 page of the r05 timer baseline, not this design (section 6). On it, the build adds:
- "You returned job pack rNN · waiting for a revision" with the reasons and time, and the start notice that work opens after the revised issue is acknowledged;
- the preparer's "No change needed" answer, quoted, with acknowledgement available again;
- a "Parts:" line with the derived Parts words;
- a link that opens the Return sheet on the pack page for the exact issue;
- the crew list shows "Returned this issue" for a returning crew member.

**Not built yet.** The list-row wording of A1-D5 and the "Checked for this visit" checks belong to the build of this design. "Job pack due by …" and the site-readiness check need the issue lead time (P5) and customer site readiness (P4), which follow in a later increment. Returning a pack offline is not built: the first build is online (R10), and an offline return follows under ADR-0013.

**Verification.** The A1 frames were checked by screenshot when drawn on 16 October; Present mode was not run. The capture copies are recorded in the captures README. The application build's checks are in its pull request.
