# Current Field Work owner walkthrough

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: pending actual observations. Prepared 3 October 2026. [Acceptance/prerequisite ledger](../testing/field-integrated-acceptance-ledger.md), [executed evidence](../testing/evidence/field-integrated-acceptance/README.md), [measurement sheet](../testing/field-benefit-measurement.md).

## Start the retained session

This is a local, private synthetic session. Use the **field-acceptance** worktree, its compiled build and matching private `journey.env`, `journey-pg`, `journey-documents` and `journey/private` profiles. This run is under `C:/Users/Dean.Fiedler/.codex/tmp/field-acceptance-20261003`. Do not substitute the regression database, an earlier proof environment or an old rollback release. [Entry records](../testing/evidence/field-integrated-acceptance/entry-records.json) identify the actual work order, original/proposed/separate visits, reports and Finance handoff; use those exact UUIDs.

Saved entry links: [original closed visit](http://127.0.0.1:3022/my-jobs/97a4254d-ea7a-4448-9c85-280fc6a322b0), [work-order visits](http://127.0.0.1:3022/service/work-orders/06e126ae-c3f5-4245-a86e-961281426c70#planned-visits), [separate completed visit](http://127.0.0.1:3022/my-jobs/bbf7bcf6-35a8-465e-9b7b-61ee8515ec42), [original reserved report](http://127.0.0.1:3022/service/reports/9b993939-3432-411e-acf4-6b9a7ce024b0). Select the task's stated identity before opening a restricted handover.

From PowerShell in the isolated worktree:

```powershell
$sessionRoot = 'C:/Users/Dean.Fiedler/.codex/tmp/field-acceptance-20261003'
$cfg = "$sessionRoot/journey.env"
Get-NetTCPConnection -State Listen -LocalPort 55810,3022 -ErrorAction SilentlyContinue
```

If already running, check `http://127.0.0.1:3022/api/v1/health` and open [local My Jobs](http://127.0.0.1:3022/my-jobs). An unexpected listener is a stop condition, not permission to kill it. The retained PID file identifies the task's own app. If the owned database is stopped, start only it with `& 'C:/Program Files/PostgreSQL/16/bin/pg_ctl.exe' -D "$sessionRoot/journey-pg" -l "$sessionRoot/owner-pg.log" -w start`. Then start the compiled app in a terminal:

```powershell
node "--env-file=$cfg" --import tsx scripts/local-server.ts --compiled
```

Wait for the explicit `3022 · compiled build` listener message and successful health response before opening records. The retained dependency pins are Node 24.21.0, npm 11.19.0, PostgreSQL 16.15 and the unchanged lockfile; observed Chrome version and build ID are in the verification manifest. To prepare a **new** session, use fresh empty task-owned directories and a new cluster named `ppo_synthetic_test`, apply registered migrations/seeds, `npm ci` and `npm run build`, then run the four explicit phases below. Never reset this retained session to manufacture a pass.

Accepted timer reference: [unchanged r05](../reference/ui/field-work-timer/powerplants-one-field-work-timer-r05.html). The current inspection host also disables attempt selection while the original receipt is being checked or remains unresolved; wait for recovery before selecting an attempt. Record that availability in H07/H09 without treating it as technical acceptance.

## Identity and review record

Use **Change identity** and the labelled synthetic profile selector. `assigned-technician` is the original attendee; `second-technician` is the crew member without original attendance and the later attendee. `coordinator` owns Service preparation/review; `finance`, `finance-reviewer`, `finance-processor`, `finance-reconciler` have distinct existing duties. A local role switch does not turn one reviewer into several human participants. Do not use Systems or broader grants to bypass a refused action.

Before starting, record reviewer/role, date/time and timezone, source/build, OS/device model, browser/version, viewport, actual zoom, input method and assistive technology/version (or Not used). Record comments verbatim and Pass/Fail/Blocked for each task in [human-session.json](../testing/evidence/field-integrated-acceptance/human-session.json), or supply them in chat for transcription. Availability and assisted explanation are distinct from independent success. Do not infer acceptance from silence.

## Ordered tasks and observable outcomes

| Task | Starting record / action | Pass observation; record Fail if contradicted | Comment / actual outcome |
|---|---|---|---|
| H01 history and original facts | Original visit as `assigned-technician`; inspect customer/Site links, history, approved scope and exact pack | Correct Site/order; own immutable arrival, stopped timer/time, factual evidence and separate Service acceptance visible. Booking allowance is not actual time | Pending |
| H02 closed visit without own attendance | Same original as `second-technician`, using Tab/Shift+Tab/Enter | Says another crew member's attendance is not yours; no new-arrival control. Explain in your own words the permitted next step | Pending |
| H03 existing proposal and explicit preparation | Follow **Review work-order visits**; inspect the cancelled Unknown proposal, stated reason and separate Preparing/confirmed/completed visit | Other visits are contextual. No automatic new visit/assignment/closure. Explain why Unknown preparation could not be fixed by merely acknowledging it, and when an existing suitable proposal should be reused | Pending; Service reviewer also required |
| H04 receiving handovers | Appointment, contact history, current readiness, crew, exact fresh pack and personal acknowledgement rows | Booking/contact/readiness/competency/pack are distinct. Each technician acknowledged personally; original acknowledgements did not transfer. Read-only technician cannot prepare or confirm | Pending |
| H05 separate actual visit | Separate visit as `second-technician`; then as `assigned-technician` | Own second arrival/timer/evidence/report for the former; permitted next-technician history with no borrowed arrival for the latter. Original report remains revision 2 with reservation | Pending |
| H06 report and response | Original report as coordinator; open exact HTML/PDF and reservation history | Internal attendance acceptance differs from ReportContent response and AttendanceFacts. No response/optional mark is inherited by the separate report | Pending |
| H07 owned work and independent controls | Follow original remaining-work/response Activity; inspect current inspection/incident scenarios in regression evidence | Owner/due-needed/outcome remain explicit. Completing an Activity or accepting report content cannot clear incident/inspection/policy controls. Unsupported receiving actions remain unavailable | Pending; Service/technician reviewer required |
| H08 Finance | Original handoff as Finance reconciler; inspect target and OUT14; return to reports | Reconciled original remains exact; separate attendance has no inherited Finance outcome. Explain recorded/approved/billable/posted differences | Pending; Finance reviewer if cohort includes handoff effort |
| H09 keyboard and recovery | Keyboard navigate both closed views, work-order link, Back and Page guide; inspect retained original receipt recovery | Focus visible/meaningful, labels useful, guide focus returns, no drag-only dependency. A failed/uncertain command retains its original; never re-enter old attendance on the separate visit | Pending |
| H10 layout/zoom | Desktop 1440 and 1024; resize 390/320; use actual browser 200% zoom | Readable wrapped history/IDs, reachable controls, one content scroll owner and no horizontal page overflow. Record any confusion/clipping with record and state | Pending; resizing is not a physical-phone result |
| H11 physical phone, screen reader, visual comparison | Physical phone; representative screen reader; independent reviewer against retained timer r05 and accepted shared references | Check headings/labels, errors/status announcements, focus/return and controls at all four widths/200%. Missing accepted closed-visit/FI07 native mockups remain explicit | Pending: no participant/device supplied |

At the end, Dean records **Accepted within stated scope**, **Changes required**, or **Not yet reviewed**, identifying H IDs and comments. This decision cannot close prerequisite PT cases, grant another role's approval or certify production readiness.

## Repeat the technical phases and recover

The phase driver uses real commands and existing guards. With the private config and `PPO_ACCEPTANCE_DIRECTORY` outside Git, run `initial`, `prepare`, `finish`, `history` in order using:

```powershell
$env:PPO_ACCEPTANCE_DIRECTORY = "$sessionRoot/journey"
$env:PPO_ACCEPTANCE_PHASE = 'initial' # then prepare, finish, history
node "--env-file=$cfg" node_modules/@playwright/test/cli.js test --config=playwright.acceptance.config.ts "--output=$sessionRoot/phase-unique-results"
```

`initial` refuses an existing completed checkpoint. Do not repeat a partly accepted phase blindly: preserve its failed output and private original commands, inspect durable receipts/current records, and resume through exact original recovery. The initial profile owns five offline originals and must remain separate from the return profile. Locked/expired cache requires the original actor's explicit online verification. ReviewRequired/rejected originals remain old-visit-bound; never rewrite their payloads, IDs, dependencies or visit to obtain acceptance.

For the saved-point restart, close clients, run `scripts/step6-preservation.ts before-restart <private-run>`, stop only owned app/PostgreSQL processes, verify both ports closed, restart the same cluster/current compiled app, observe health, then run `scripts/step6-preservation.ts after-restart <private-run> before-restart exact`. Invoke through `node "--env-file=$cfg" --import tsx`. Compare process IDs/postmaster start times as well as all table/file hashes before continuing `prepare`. Keep the app/store/database/profile together. No backup restore is implied; actual restore uses the separately controlled [P12 runbook](p12-recovery-runbook.md).

If the listener does not become ready, retain logs/PIDs and stop that attempt before a documented fresh launch; do not run commands against an unverified port or broaden its Origin gate. No old release, database downgrade, orphan deletion or profile clearing is an authorised recovery method. Preparation, scheduling, review/issue, inspection/incident workflow and Finance processing remain online only. No live MYOB/SharePoint/CAD operation, external message, merge or deployment is part of this session.
