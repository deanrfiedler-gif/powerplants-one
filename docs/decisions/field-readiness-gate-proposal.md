---
document_id: PPO-SVC-FIELD-READINESS-GATE-PROP
date: 2026-10-16
owner: Dean Fiedler
status: Accepted by Dean on 16 October 2026 (R1 to R11 and the recommended answers to Q1 to Q7; section 9); Figma named version, application build and operational acceptance separate
source_commit: 1552cfbb8efd6cea17438c2af18ba0effa4fc278
versioning: git
---

# Field readiness gate — proposal

On 16 October 2026 Dean named a Powerplants Australia problem: field technicians arrive on site to parts that have not arrived or are wrong, or to a customer who was never contacted to get the site and equipment ready. He also proposed that technicians accept or decline a job pack, giving a reason that goes back to the person who prepared it. (The wording here is the handover from the session that assessed his problems; his exact words were not passed on.)

This record proposes four changes that close that gap, plus a pack issue lead time. It frames Dean's "decline" as a **Return with reason**, and makes the existing dispatch gate the main defence. It is a **proposal**. It authorises no application code, migration, seed, permission, capability, route or deployment, and it changes no parent requirement ID. Dean accepts or amends it before any build. **Dean accepted it on 16 October 2026 (section 9).**

PPO is a synthetic prototype. Every person, site, pack, part and time in this record and in the Figma frames is synthetic. Nothing here is an operating rule for Powerplants Australia until Service adopts real values.

## 1. What exists and what is missing

The repository already has most of the gate. The assessment found these foundations on main `1552cfb`:

| Foundation | Where |
|---|---|
| A checker can return a revision with a required reason | `checkPack` (decision `Checked` or `Returned`) in `src/documents/packs.ts:188`; `ppo.pack_checks` with a NOT NULL reason in `db/migrations/0006-job-packs.sql:73`; TR-04 |
| Every assigned crew member must acknowledge the exact issued revision | `acknowledgePack` in `src/documents/packs.ts:422`; the button "I have read and acknowledge this exact pack" in `src/components/field-screens.tsx:504`; TR-06 |
| Dispatch is held until the pack is issued, the crew has acknowledged and readiness is met | `dispatchReadiness` in `src/documents/packs.ts:326` and the database guard `guard_pack_dispatch` in `0006-job-packs.sql:203`; BR-11, SR-07, BP-07 §8 |
| The customer must agree the dates before an appointment is first confirmed | `recordContact` and the `CustomerContactRequired` refusal in `src/scheduling/planner.ts:798` and `:424–438`; ADR-0010 |
| Supply Chain assesses material readiness per demand | `readiness()` in `src/supply/model.ts:595`, returning "Ready for the stated material scope" as defined in the [supply-chain readiness contract](../contracts/supply-chain-readiness.md) (line 37); [ADR-0049](ADR-0049-native-supply-chain.md) |
| Amending or withdrawing an issued pack already gives the service owner an owned Activity | Trigger `pack_owned_follow_up` in `0006-job-packs.sql:226` |

Five gaps remain:

| Gap | Evidence |
|---|---|
| G1. No parts criterion | Readiness policy `SYN-PPO-P04` v1 has eight criteria and none covers parts (`db/seed-p04.sql:11–18`; ADR-0009). The job pack build report records departure **DP-20** "No parts criterion exists" (`docs/delivery/job-pack-build-report.md:1476`), although the accepted r03 HTML showed a Parts row |
| G2. Supply readiness is not wired to dispatch | `src/scheduling`, `src/documents` and `src/field` never import `src/supply`. BP-08 says a material delay "does not alter a booking, Project programme or issued pack" and only creates owned work |
| G3. No customer site-readiness confirmation | `recordContact` records date agreement only. FI-05 is the technician's own review of site requirements, not a customer confirmation. No record proposes one (CS-06 site access design, FI-05 field readiness, the scheduling resources architecture) |
| G4. A technician can only acknowledge | There is no way to say the pack is wrong. The build report rejected a "Declined" acknowledgement state as gap **G-07** ("Do not add"), although BP-07 SC-09 My Jobs and BP-01 §21.4 already give the technician "request change" |
| G5. A checker Return creates no task | The preparer has to find a returned pack in the register |

## 2. Proposed changes

### P1. A Parts readiness criterion at the Dispatch stage

- **Criterion.** Add `PartsReadiness`, "Parts ready for the stated material scope", at the Dispatch stage, in a new readiness policy version `SYN-PPO-P04` v2. Version 1 and every assessment recorded under it stay unchanged.
- **Source.** The outcome is derived by the server from Supply Chain readiness. Nobody can record a Pass by hand, in the same way that the database refuses to clear `CrewCompetency` and `DispatchControls` today (`0004-work-scope.sql:284`). `dispatchReadiness` gains a reason for every Dispatch-stage criterion that is not satisfied; today it reads no Dispatch-stage criterion at all. It reads every Approved demand whose `appointment_id` is the appointment:

  | Supply Chain readiness of the linked demands | Criterion outcome |
  |---|---|
  | Every demand is "Ready for the stated material scope" | Pass |
  | Any demand is Blocked or At risk | Blocked, naming the lines short and their promised dates |
  | Any demand is Evidence needed or Not assessed | Unknown |
  | No demand is linked, and the preparer has recorded "No parts needed for this visit" with a reason | Not applicable |
  | No demand is linked and nothing is recorded | Unknown |

- **Exception.** A permitted exception is allowed, as BP-01 §13.2 allows for urgent work: it records what is missing, who accepted it, the conditions and the follow-up (Q1).
- **Live.** The outcome is re-evaluated whenever `dispatchReadiness` runs and whenever Supply Chain records a change impact (SCM-08). A supply change after dispatch was cleared raises the dispatch hold again and creates an owned Activity. It never moves the booking.
- **Limit.** Supply readiness proves only the parts the demand states. It cannot catch a wrong part in the scope (the contract says Ready "establishes no technical release … site access, customer agreement"). P2 covers that case.
- **Issued bytes.** Dispatch-stage criteria are outside the pack snapshot: `src/documents/context.ts:168` and `:329` take only Authorisation-stage controls and `ToolPreparation`. The criterion therefore changes nothing in `snapshot()`, `PackSnapshot` or OUT-09. Live part states are shown beside the issued text: in the status panel, and as a suffix on each line of the technician's "Bring and collect" card.
- **Not this.** This is not Supply Chain SC-06 (Picking and dispatch), the `/supply/dispatch` page that picks and stages usable allocations. That page can feed readiness; it is not the gate.

### P2. A technician Return with reason on an issued job pack

- **Action.** Each assigned recipient of the current issue can now either acknowledge it, as today, or **return** it. The return goes back to the preparer with a reason.
- **What a return records:**
  - one or more structured reasons: Parts missing, Parts incorrect, Scope unclear, Site not confirmed, Safety or isolation information missing, Other;
  - a required note of up to 1,000 characters;
  - an optional photo, taken in the app under the existing PNG policy (ADR-0012).
- **Binding.** A return is bound to the same facts as an acknowledgement: the exact issue, the assignment and its version, and the presented hash. Only the recipient can make it. A recipient can acknowledge or return an issue, never both. "I have read and acknowledge this exact pack" keeps its wording and meaning.
- **One transaction.** A return does all of the following together:
  1. It records an immutable return row and a new issue event `Returned`.
  2. It holds dispatch and sets the appointment's pack requirement to `ReviewRequired`. Dispatch stays held until a successor revision is checked, issued and acknowledged by the **whole** crew; an acknowledgement of the old issue never carries over (TR-07).
  3. It creates an owned **TechnicalFollowUp** Activity for the preparer, the author of the returned revision: "Revise job pack SYN-PPO-PACK-000052 · r03 returned by Casey Ward: parts incorrect", carrying the note and photo.
  4. It creates an owned Activity for the scheduler, saying the appointment is at risk (Q3). This extends the existing `pack_owned_follow_up` trigger and its service-owner task.
  5. It records an outbox event. Nothing is sent outside PPO.
- **Answering without a revision.** The preparer may answer a return without revising the pack, by recording "No change needed" with a reason that the technician sees (Q2). The technician then acknowledges the same issue, or returns it again.
- **Not a decline state.** This is not the "Declined" acknowledgement state that G-07 rejected. Acknowledgement stays a single per-person event. A return is a separate event that leads to a revision or an answer. Accepting this proposal amends G-07's disposition for that purpose only (Q6).
- **First increment.** It is online. An offline return follows later, under the original-operation protocol of ADR-0013 (R10).

### P3. A checker Return gives the preparer an owned Activity

- **Task.** When a check records `Returned`, the same transaction creates an owned TechnicalFollowUp Activity for the author of the returned revision. It reads "Revise job pack … · rNN returned at the check", with the check reason. It is due by the pack's issue deadline (P5), or flagged "due date needed" when there is no deadline.
- **Fallback owner.** If the author can no longer read the pack, the work order's service owner gets the task.
- **Closing.** The task completes when a successor revision is saved, with that revision as its outcome. The preparer can also complete it (R6).
- **Q5 unaffected.** Pack Q5 (may the preparer check their own revision?) stays open.

### P4. A pre-visit customer site-readiness confirmation

- **Command.** Extend `recordContact` with a contact **purpose**: `DateAgreement` (today's behaviour and the default) or `SiteReadiness`. The recipient rule, schedule-version binding and audit stay as they are.
- **What a site-readiness contact records:**
  - the channel and outcome, as today;
  - four checks, each Confirmed, Not ready or Not applicable with a note: access arranged; power and water available; equipment accessible; isolation arrangements agreed;
  - an optional note.
- **Criterion.** Add `CustomerSiteReadiness`, "Customer site readiness confirmed", at the Dispatch stage of policy v2. It is derived and never assessed by hand:

  | Latest site-readiness contact for the current schedule version | Criterion outcome |
  |---|---|
  | Confirmed, with every check Confirmed or Not applicable | Pass |
  | Any check Not ready | Blocked; the existing `ContactUnsuccessful` path gives the service owner an owned follow-up |
  | None recorded | Unknown |

- **Window.** Confirmation is expected within a window set in the scheduling policy. The synthetic default is from 5 days to 24 hours before the start (Q4).
  - A contact before the window opens does not count.
  - When the window closes without a confirmation, the service owner gets an owned Activity.
  - A late confirmation still passes and is marked late.
  - Moving the visit to a new schedule version needs a new confirmation.
- **Not sending.** PPO sends nothing to the customer. A future visit-confirmation message depends on D-025, which stays open; it would feed this same record.

### P5. A pack issue lead time

- **Rule.** The scheduling policy states when a pack must be issued. The synthetic default is by 12:00 site time on the last working day before the visit, so the crew reads the pack before the travel day and a return leaves time to fix it.
- **Shown.** The register, the pack page and My jobs show "Issue by …" or "Job pack due by …".
- **When missed.** The preparer and the service owner get an owned Activity.
- **A warning, not a criterion.** A late issue still dispatches if every criterion is met, so urgent work is not blocked (Q5).
- **Working days.** They come from the published calendars (ADR-0010).

### The story the frames tell

The hero visit is SYN-PPO-WO-000040, "Shade screen motor replacement", on Tue 13 Oct 2026, 13:30–16:30 AEST.

1. Sasha Cole issues r03 at 10:20 on Mon 12 Oct, before the 12:00 deadline.
2. Dana Ruiz confirms site readiness by phone at 11:02; it is recorded at 11:05.
3. Riley Tran acknowledges r03 at 16:05.
4. Casey Ward reads the pack at 18:20. Every criterion passes, including Parts, because the reserved SD-450 motor is "Ready for the stated material scope". Casey knows from the 2 Oct nameplate photo that the drive is an SD-450B, so returns r03 at 18:31 with the reason Parts incorrect.
5. Sasha gets the task, revises the demand and issues r04 at 08:10 on Tue. The SD-450B is At risk until it is received at 11:00.
6. Casey acknowledges r04 at 08:40, and the visit starts with every check passed.

The accepted My jobs state "can't start yet, job pack reissued r04" (`856:1210`) shows the same correction arriving at 13:20 on the visit day. This proposal moves it to the evening before.

## 3. Traceability

No parent requirement ID is added, renamed or renumbered. Parent IDs are rows of `docs/requirements/requirements.csv` (78 parents). BR, TR, SR and DP IDs are rules, transitions and departures. SV-05, SV-04, FI-01, FI-05 and PL-0x are page-register scopes. BP-07 SC-nn are BP-07 screens, and Supply Chain SC-nn are BP-08 pages.

| Change | Parent requirements | Rules, transitions, sections and records | Pages |
|---|---|---|---|
| P1 Parts criterion | SVC-03 "Readiness evidence precedes dispatch or an authorised exception"; SCM-08 "Delays trigger review; they do not silently move confirmed bookings"; SCM-06 "Carrier arrival is not automatically ERP receipt or job readiness"; SVC-04 (readiness evaluated) | BR-11; BR-18 (item-level allocation, not shipment arrival); BP-01 §13.2 Readiness row "Parts/tools … site prerequisites and customer confirmation"; BP-07 §9.2 step 5; IF-12 to IF-14; supply-chain readiness contract; ADR-0049; ADR-0009; DP-20 (closed by this change if built) | SV-05 (BP-07 SC-06 Pack workbench); Supply Chain SC-01 (Demand and material-readiness workspace); SV-04 (BP-07 SC-08 Appointment) |
| P2 Technician Return | SVC-03; SVC-05 "Record changes/reasons, affected commitments and acknowledgement" | TR-06 (acknowledgement is per person; a read is not an acknowledgement); TR-07 (fresh acknowledgement after a material amendment); BR-12; SR-07; BP-07 SC-09 My Jobs "request change"; BP-01 §21.4 Technician "request change"; G-07 (disposition amended, Q6); ADR-0011; ADR-0012 (photo) | FI-01 (BP-07 SC-09 My Jobs); SV-05 |
| P3 Checker Return task | SVC-03 | TR-04 ("Returned pack retains comments, is revised and resubmitted for checking"); BP-07 §16 Activities; BP-07 SC-01 My Work; BP-08 "Activities/My Work is the only follow-up system" (the same pattern) | SV-05; SH-02 My Work action centre |
| P4 Site-readiness confirmation | SVC-03; SVC-04 | BR-11; BP-01 §13.2 Readiness and Customer arrangements rows; BP-07 §9.3 (contact outcomes recorded independently of booking state); ADR-0010; D-015 and D-025 stay open | SV-04 (BP-07 SC-08 "record contact"); SV-05. FI-05 is a different thing: the technician's own review of site requirements |
| P5 Issue lead time | SVC-03 | BP-01 §13.4 (revalidate parts and customer arrangements before a move); ADR-0010 calendars | SV-05; FI-01; PL-01 |

## 4. Design reference

The Figma amendment is drawn in Dean's working file "PPO - Design". Its link stays out of this public repository (ADR-0050, ADR-0053). It is a proposal: no named version is saved and nothing is accepted. New frames were added beside the accepted ones, and **no accepted frame or component was edited**. The new frames are clones of accepted frames, with instance overrides.

| Page | Section | Frames |
|---|---|---|
| Job pack (accepted) `272:2` | "A1 · Field readiness gate (proposal)" `958:9304` | Phone technician, issued r03, Acknowledge or Return `958:9305`; Return with reason sheet `958:9426`; r03 returned `958:9559`; coordinator Readiness tab, Draft r04 with the Parts and site-readiness criteria `958:9680`. Desktop: Issued r03 returned by Casey Ward with the preparer's task `963:9993`; checker Return dialog that creates the preparer's task `963:10213`; Record customer site readiness dialog `963:10299`. Notes card `966:11510`, with the recommendations and questions of section 6 |
| My jobs · FI-01 `845:44` | "A1 · Field readiness gate (proposal)" `959:243132` | My jobs list on Mon 12 Oct 18:35 with one pack returned `959:243133`; visit "can't start yet, you returned r03" `959:243158`; visit ready to start with parts and site confirmed `959:243243`. Notes card `966:17770` |

Prototype flows: "A1 — technician Return with reason (proposal)" on the Job pack page (Return → sheet → returned; Acknowledge leads to the accepted confirmation frame `304:48130`), and "A1 — My jobs, returned pack (proposal)" on the My jobs page. Prototype links work only inside one page, so the two pages are linked by name, not by click.

Components reused: Job pack / Criterion row, Callout, Note, Crew row, Select row, Form field and Decision dialog; Tag; Button; Job pack list row (phone); the Shell v2 parts. No component or variable was added. The site-readiness dialog is a detached copy of the accepted Decision dialog inside its new frame; the Return sheet reuses the accepted acknowledgement sheet.

Departures from the accepted Job pack and My jobs designs, proposed for acceptance with this record:

| ID | Departure | Accepted design |
|---|---|---|
| A1-D1 | The technician's phone footer holds the document button, Return and "Acknowledge r03" (shortened to fit) | Document button and "Acknowledge this exact issue". The app's "I have read and acknowledge this exact pack" is unchanged |
| A1-D2 | The Dispatch stage lists three criteria | One criterion, "Current site and isolation controls" |
| A1-D3 | A new state label, "Returned by technician", with "Prepare revision r04" as the primary action and a notice carrying the return | No such state |
| A1-D4 | "Bring and collect" lines carry live part readiness beside the issued text | Issued text only |
| A1-D5 | My jobs rows say "You returned job pack r03 · waiting for r04", "Acknowledge or return job pack r01" and "Job pack due by …"; "Checked for this visit" gains the parts and site-readiness checks | "Acknowledge job pack r01" and "Job pack not issued yet"; four checks |

## 5. What a build would touch

A build follows AGENTS.md. One migration is expected. Its number is the next free one when the build starts: main reached 0105 on 16 October, and other open pull requests may claim numbers after it.

### Migration

- `ppo.pack_returns`, immutable. It holds the issue, recipient, actor, original operation, presented hash, reason codes (at least one), note, optional attachment, captured time and returned time. A guard trigger mirrors `guard_pack_acknowledgement`, and a recipient can have either an acknowledgement or a return, never both.
- `ppo.pack_return_answers` for "No change needed" (Q2), immutable.
- `ppo.pack_issue_events.kind` gains `Returned`. `pack_owned_follow_up()` is extended to give the scheduler's at-risk task (Q3).
- `ppo.pack_return_follow_ups` and `ppo.pack_check_follow_ups`, immutable mappings from the return or check to its Activity, following `pack_follow_ups`.
- `ppo.contact_outcomes` gains `purpose` (`DateAgreement` by default, or `SiteReadiness`) and the four typed checks. Existing rows read as `DateAgreement`.
- The trigger that refuses manual clearing of `CrewCompetency` and `DispatchControls` (`0004-work-scope.sql:284`) is extended to `PartsReadiness` and `CustomerSiteReadiness`: no recorded Pass for either. For Parts it still accepts a recorded permitted exception (Q1) and the preparer's "No parts needed for this visit" as Not applicable, both under the existing `service.readiness.assess`.
- `guard_pack_dispatch` is extended so that the database also refuses to clear the hold while either new criterion is not Pass, Not applicable or a permitted exception.
- Shared CHECKs: `ck_outbox_kind` gains `PackIssueReturned`. `ck_grants_capability` is unchanged (no new capability). `ck_identities_type` is unchanged (no new identity type), so the migration does not `ALTER ppo.business_identities`. If a build does add an identity type, it must use the `SET CONSTRAINTS ppo.identity_target IMMEDIATE` idiom and prove an upgrade across 0026 with estimates present.
- Unchanged: the Activity `kind` CHECK (TechnicalFollowUp and CustomerContact are reused), `snapshot()`, `PackSnapshot`, OUT-09 and every issued pack's bytes.

### Seeds

- A new seed adds `SYN-PPO-P04` v2 with the ten criteria, and a new scheduling policy version holding the window and lead-time values.
- It also adds a synthetic Approved demand linked to the hero appointment.
- It is registered against the new migration in `scripts/migration-registry.ts`, in increasing order.
- It adds no grant and no user. Because it is above seed 17 it replays on the hosted-demo upgrade, so `tests/demo/upgrade.test.ts` must still count the same users.

### Permissions

**No new capability** (R11):

| Action | Capability | Why |
|---|---|---|
| Technician return | `pack.acknowledge` | The same exact recipient on the same exact issue |
| Site-readiness contact | `schedule.contact` | Unchanged |
| Parts criterion | none added | Read through a narrow service projection of supply readiness, so technicians and pack readers need no `supply.read` and see no costs |

If Dean prefers a separate `pack.return` capability, the access-review chain applies:
- `python3 scripts/build-access-review.py` on LF bytes;
- a label in `docs/design/access-review/model.js`;
- the pinned size in `scripts/check-access-review-model.mjs`, `scripts/check-access-review-browser.mjs` and `docs/design/access-review/workspace.js`;
- a grant seed that extends the reseed allowlist in `tests/database/quality-upgrade.test.ts` and `tests/helpers/engineering-materials-grants.ts`, and the exact grant sets in `tests/database/field-timer-boundaries.test.ts` and `tests/database/field-customer-response.test.ts`.

### Suites pinned to the migration registry (AGENTS.md)

- **Applied-version lists:** `tests/database/field.test.ts`, `finance-upgrade.test.ts`, `offline.test.ts`, `packs.test.ts`, `planner.test.ts` and `reports.test.ts`.
- **Preserved ledgers and exact added versions:** `field-timer-boundaries.test.ts`, `policy-persistence.test.ts` and `field-customer-response.test.ts`.
- **`leads-projects-integration.test.ts`:** `atVersion(N)` and both `>=18` lists.
- **`tests/demo/upgrade.test.ts`:** the added-migration count.
- **Populated-upgrade cases:** the original ledgers in `quotation-release.test.ts`, `quotation-response.test.ts` and `quotation-conversion.test.ts`.
- **`products-upgrade.test.ts`:** the latest version, the exact added versions, and a new case for installing reserved Products 0052 after the newest history.
- **`tests/unit/migration-registry.test.ts`.**
- **The review gate in `scripts/demo-upgrade.ts`.** The `latestMigrationVersion` comparison (105 on main on 16 October) guards the hosted-demo upgrade. A build adds a review note for the new migration; it does not just bump the number.

### Behaviour suites

| Kind | Suites |
|---|---|
| Database | `packs.test.ts` (return guard, one of acknowledge or return, hold, both Activities, answer); `pack-register.test.ts`; `planner.test.ts` (site-readiness purpose, window, schedule-version binding); `field.test.ts` and `field-readiness.test.ts`; `supply.test.ts` (the service projection); `my-work.test.ts` (the new owned Activities) |
| HTTP | `tests/http/packs.test.ts`, `planner.test.ts`, `field.test.ts` and `supply.test.ts` |
| Unit | `pack-view.test.ts` (a new status label, "Returned by technician") and `pack-applicability.test.ts` |
| Browser | `packs.spec.ts`; `field.spec.ts` (the acknowledgement button text is unchanged; Return added); `planner.spec.ts`; `my-work.spec.ts`; the `job-pack-*` specs |

The `job-pack-*` specs carry two layout rules the build must keep: exactly nine `#jp-panel-pack .jp-section-head h2`, and the phrase "criteria satisfied" exactly once on the page.

`tests/fixtures/job-pack-read.json` also needs the new criteria.

### Design register

When this is accepted and locked in, `scope-sv-05.md`, `scope-fi-01.md` and `scope-sv-04.md` in `docs/design/development/pages/` gain the amendment's frame references. This proposal changes no register file.

## 6. Recommendations and open questions

| ID | Recommendation |
|---|---|
| R1 | Parts readiness is derived from the Supply Chain readiness of demands linked to the appointment, with the outcome mapping in P1. Not applicable needs a recorded preparer statement, never an inference |
| R2 | A supply change after dispatch was cleared raises the hold again and creates an owned Activity; the booking never moves (SCM-08) |
| R3 | The technician Return is a separate event with one or more of six reasons, a required note and an optional photo, made only by the exact recipient |
| R4 | A return holds dispatch until a successor issue is acknowledged by the whole crew, or until the preparer answers "No change needed" and the technician acknowledges |
| R5 | A return creates owned Activities for the preparer and the scheduler; a checker Return creates one for the preparer |
| R6 | Return and check tasks complete when a successor revision is saved; the owner can also complete them |
| R7 | Customer site readiness is a typed purpose of the appointment's contact record, with four checks, bound to the schedule version |
| R8 | The issue lead time is a warning with owned Activities, not a dispatch criterion |
| R9 | Live readiness is shown beside the issued text and never changes `snapshot()`, `PackSnapshot` or OUT-09 |
| R10 | The first build is online; an offline return follows under ADR-0013 |
| R11 | No new capability, Activity kind or identity type |

| ID | Question | Recommended answer |
|---|---|---|
| Q1 | May Parts take a permitted exception? | Yes, with the missing item, the person accepting, the conditions and a follow-up, as BP-01 §13.2 allows for urgent work |
| Q2 | May the preparer answer a return without revising? | Yes, as "No change needed" with a reason the technician sees; the technician then acknowledges or returns again |
| Q3 | Who is "the scheduler" for the at-risk task? | The work order's service owner, who already owns schedule follow-ups and pack review tasks |
| Q4 | Synthetic window and deadlines | Site confirmation from 5 days to 24 hours before the start. Pack issued by 12:00 site time on the last working day before. Return tasks due by 09:00 site time on the visit day, or 2 hours before the start if earlier. Service sets real values under D-015 |
| Q5 | Is the issue lead time a dispatch criterion? | No: a warning and owned Activities (R8) |
| Q6 | Amend G-07? | Yes: a Return event is allowed; a "Declined" acknowledgement state is still not added |
| Q7 | Do demands linked only to the work order, with no appointment, count? | No. They show as "not linked to this visit" and keep Parts Unknown until the coordinator links them |

## 7. Not in this proposal

- Sending anything to customers or technicians: email, SMS or calendar. D-025 stays open.
- Freight tracking.
- Real policy values.
- ERP stock or reservation authority (MYOB stays the authority).
- The Schedule page's own design for recording site readiness. Only the pack page entry and the dialog are drawn here.
- Desktop and tablet versions of the technician Return.
- An offline return.

## 8. Verification

- **Documentation checks.** The proposal's own checks are recorded in the pull request.
- **Figma.** The frames were checked by screenshot after each change. Present-mode click-through has not been run.
- **Nothing else.** No application, database or browser suite was run, because nothing in `src/` or `db/` changed.

## 9. Decision — 16 October 2026

Dean accepted this proposal as one of the six items in the UX benchmark's Decision brief. The brief recommended accepting it, with a Supply-fed parts check at dispatch, a technician Return with a reason that tasks the preparer, and the "not yet opened" marker. Dean replied: "I am happy to proceed with all six based on your recommendations." The [UX benchmark decisions](ux-benchmark-decisions-2026-10-16.md) record (PPO-UXB-DEC-01) holds the full decision.

- **Adopted:** P1 to P5, recommendations R1 to R11, and the recommended answers to Q1 to Q7 in section 6. The technician's word stays "Return"; no "Declined" state is added (Q6).
- **Adopted with it:** UXB-09 and UXB-10 (the parts-readiness ladder per line, read from SC-01) and amendments A06 and A07.
- **Still to do before a build:** Dean's named Figma version of the A1 frames on Job pack (958:9304) and My jobs (959:243132), then a lock-in under ADR-0053. Real policy values (Q4) remain Service's under D-015, and the ladder needs SC-05 Q1 and live reservations.
- **Unchanged:** this record still authorises no application code, migration, seed, permission, route or deployment. The build follows section 5 and `AGENTS.md` in its own pull request.
