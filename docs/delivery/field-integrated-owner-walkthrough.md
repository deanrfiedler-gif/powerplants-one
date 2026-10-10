# Current Field Work owner walkthrough

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: pending actual observations. Prepared 10 October 2026; the 3 October session remains retained separately. [Acceptance/prerequisite ledger](../testing/field-integrated-acceptance-ledger.md), [current rehearsal](../testing/evidence/pt30-integration/README.md), [measurement sheet](../testing/field-benefit-measurement.md).

## Start the prepared session

This is a local, private synthetic session on integrated application source `caecf7b`, build `qE6dn5GfAoZAp53Forj96`. The existing four-phase rehearsal and saved-point restart passed; the settled history recheck at test source `8f2039c` uses the same application. [Readiness and remaining findings](../testing/pt30-integration-readiness.md) must stay visible during review. This is not full PT-30 acceptance.

The `codex/pt30-integration` branch reuses the completed PT-01 worktree at `C:/Users/Dean.Fiedler/.codex/worktrees/pt01-permissions-matrix/powerplants-one`. Its new private environment is `C:/Users/Dean.Fiedler/.codex/tmp/pt30-integration-20261010`: `journey.env`, `data`, `documents` and `journey/private` remain together. [Entry records](../testing/evidence/pt30-integration/entry-records.json) identify the exact saved UUIDs. Do not substitute another regression database or an old rollback release.

The earlier `field-acceptance-20261003` environment, [evidence](../testing/evidence/field-integrated-acceptance/README.md), [entry records](../testing/evidence/field-integrated-acceptance/entry-records.json) and [human worksheet](../testing/evidence/field-integrated-acceptance/human-session.json) are retained without alteration.

Saved entry links: [original closed visit](http://127.0.0.1:33949/my-jobs/d68593d9-962e-4ae2-abf9-136997d6c5fb), [work-order visits](http://127.0.0.1:33949/service/work-orders/91e866b8-5e30-4507-86bd-ee240ec4f902#planned-visits), [separate completed visit](http://127.0.0.1:33949/my-jobs/e2c631cf-433d-4d99-845a-ad18bca1b5e8), [original reserved report](http://127.0.0.1:33949/service/reports/29277fc2-3f54-439c-8a1b-e9b55dc9ca1a), [Finance handoff](http://127.0.0.1:33949/finance/handoffs/073a7bef-d473-4187-a0d5-2ab9539bccfd). Select the task's stated synthetic role before opening a restricted record.

If already running, check `http://127.0.0.1:33949/api/v1/health`. The task's `app.pid` identifies its own app, and `data/postmaster.pid` identifies its own cluster. An unexpected listener is a stop condition, not permission to kill it. If the owned database is stopped, start only it; launch the app from the stated checkout:

```powershell
Set-Location 'C:/Users/Dean.Fiedler/.codex/worktrees/pt01-permissions-matrix/powerplants-one'
$sessionRoot = 'C:/Users/Dean.Fiedler/.codex/tmp/pt30-integration-20261010'
$cfg = "$sessionRoot/journey.env"
Get-NetTCPConnection -State Listen -LocalPort 55949,33949 -ErrorAction SilentlyContinue
# Only if this owned cluster and app are stopped:
& 'C:/Program Files/PostgreSQL/16/bin/pg_ctl.exe' -D "$sessionRoot/data" -l "$sessionRoot/owner-pg.log" -w start
node "--env-file=$cfg" --import tsx scripts/local-server.ts --compiled
```

Wait for the explicit `33949 · compiled build` listener and a successful health response. Retained pins: Node 24.21.0, npm 11.19.0, PostgreSQL 16.15, Playwright 1.63.0 and observed Chrome 155.0.8059.40. A new rehearsal requires fresh empty task-owned directories and a separately configured `ppo_synthetic_test`; never reset this completed session to manufacture a pass.

The booked visits use November 2031 synthetic dates, while the timer's measured minute uses the actual capture clock. Their separation is intentional evidence that booking allowance is not recorded labour; the resulting expanded timeline and wrapped correction control need owner layout review. Generic manual-time guidance on the closed non-attendee view is also visible. Use the settled history capture in the current evidence; the earlier transient loading capture is retained separately.

Accepted timer reference: [unchanged r05](../reference/ui/field-work-timer/powerplants-one-field-work-timer-r05.html). Pending visual review remains separate from source presence and functional checks. Wait for any original receipt recovery to finish before selecting another attempt.

## Identity and review record

Use **Change identity** and the labelled synthetic profile selector. `assigned-technician` is the original attendee; `second-technician` is the crew member without original attendance and the later attendee. `coordinator` owns Service preparation/review; `finance`, `finance-reviewer`, `finance-processor`, `finance-reconciler` have distinct existing duties. A local role switch does not turn one reviewer into several human participants. Do not use Systems or broader grants to bypass a refused action.

Before starting, record reviewer/role, date/time and timezone, source/build, OS/device model, browser/version, viewport, actual zoom, input method and assistive technology/version (or Not used). Record comments verbatim and Pass/Fail/Blocked for each task in the [current human-session.json](../testing/evidence/pt30-integration/human-session.json), or supply them in chat for transcription. Availability and assisted explanation are distinct from independent success. Do not infer acceptance from silence.

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

If the listener does not become ready, retain logs/PIDs and stop that attempt before a documented fresh launch; do not run commands against an unverified port or broaden its Origin gate. No old release, database downgrade, orphan deletion or profile clearing is an authorised recovery method. Preparation, scheduling, review/issue, inspection/incident workflow and Finance processing remain online only. This owner walkthrough performs no live MYOB/SharePoint/CAD operation, external message or deployment. Repository integration is separately authorised and recorded in the current rehearsal evidence.
