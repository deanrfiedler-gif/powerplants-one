# Scheduling-policy Step 4 enforcement evidence

Owner: Dean Fiedler. Source self-review and synthetic verification; independent review and owner/production acceptance remain separate. Baseline: `a9cead152a99a89be1476284e7c5d6fc4c462f5f` after #330. Branch: `codex/scheduling-step4`. Traceability: SVC-04/05, DAT-06, NFR-08, D-015/D-020, TR-03/08, API-R04/API-C26, EVT-12, PT-08/09/28/30 and AT-35. All 78 parent IDs and issued references are preserved.

## Scope and environment

Task-owned PostgreSQL 16.15 clusters use loopback ports 55769 (serial database regression suites) and 55770 (serial compiled-browser, restart and hosted-upgrade proofs), each containing only `ppo_synthetic_test`. Locked Node 24.21.0/npm 11.19.0 dependencies and adopted Chrome 154 render the compiled application. Original checkout, unfinished worktrees and earlier services/databases/evidence are preserved. No schema, installed migration/seed, #330 retained-root repair, reserved 0051/0052, grant or capability changes. Original logs and exact synthetic documents remain in the private task directory; source/log fingerprints identify completed proof separately from interrupted runs.

## Completed local proof

[Verification metadata](verification.json) records LF-normalised source hashes, exact private-log hashes and eight capture hashes. These are component results, not an assertion about all PR checks. Current-head CI and broader regression totals are reported on [PR #331](https://github.com/deanrfiedler-gif/powerplants-one/pull/331); interrupted or still-running suites are not counted here.

| Proof | Completed result | Boundary covered |
|---|---|---|
| Policy PostgreSQL/HTTP suites | 45/45, zero failures/skips, 717.4 s | Core commands, real-connection races in both orders, guarded dispositions, Step 4 enforcement, persistence and registered authenticated HTTP adapters. |
| Final Step 4 enforcement rerun | 5/5, zero failures/skips, 79.6 s | Current-effective future-pin readiness, My Jobs derived hold, boundaries, immediate/renewed holds, both Start orderings, offline exact recovery and valid resolved Start. |
| Scheduling/policy units | 128/128, zero failures/skips | Chain boundaries, fixed terms, immutable evidence, selectors, activation routes and no offline/bypass registration. |
| Hosted database and upgrade suites | 15/15, zero failures/skips, 180.9 s | Both exact known retained roots, unknown-root refusal, late-failure rollback/retry, runtime grants, original sessions/CRM/booking evidence and unchanged installed bytes. |
| Compiled Step 4 journeys | 2/2, zero failures/skips/flakes, 74.5 s | Desktop and phone; publication against stale preparation, editable invalid intervals, owner/field holds, Start refusal, controlled cancellation/resolution and lost-response exact retry. |
| Existing compiled browser regressions | 55/55, zero failures/skips/flakes, including warm-up | Planner, policy-impact, scheduling workspaces, field/readiness, offline, packs and work orders on desktop and phone. |
| Planner projection correction | 2/2, zero failures/skips, 25.2 s | Existing exact summary/detail facts and current permission/scope equivalence. |
| Actual app/PostgreSQL restart | Passed; [metadata](restart.json) | Different process IDs and postmaster start times; 32 durable table fingerprints, accepted offline receipt, delayed Start review, factual recovery originals and exact HTML/PDF/PNG. Session lifecycle audits are allowed; all business audits remain exact. |
| Legacy compatibility | Three exact receipts recovered | Unmodified refreshed main creates confirmation/move/change-acceptance originals, then this code recovers them unchanged and refuses a new request missing complete preparation. Private original file hash is retained in metadata. |
| Build, lint and type check | Passed | Compiled Next application and registered route exports; no added dependencies. |
| Foundation, prototype, naming, studio | Passed | 78 parent dispositions retained; studio 321 entries, 30 components, 19 runnable examples, zero errors. All 321 entries remain unreviewed and all 30 component reviews pending. |
| Full Windows unit run | 562/566; four baseline failures | Same four failures reproduced against unchanged `a9cead1` in the three affected files: 3/7 pass. Two document-store paths, one private recovery path and one Windows route separator assertion. No new unit regression is attributed to this work. |

The final readiness/list refinements additionally retain the current-effective actual-start guard for future pins and derive My Jobs holds from durable impacts. The focused enforcement rerun is recorded separately from the earlier 45-case run. No existing timeout, skip or performance threshold was relaxed. Prior concurrency expectations that explicitly represented unenforced Step 3 behaviour now assert Step 4 refusal and unchanged pins; reverse-order tests add the complementary ordering.

Controlled PostgreSQL barriers observe distinct backend IDs and actual `pg_blocking_pids` edges. Publication competes with confirmation, move, cancellation, change acceptance, actual Start and resolution. No runtime test-only bypass was added. Publication-first preparation refuses stale saves; booking-first publication refuses stale reviewed population; cancellation remains controlled. Publication-first Start refuses immediately, whereas an accepted Start remains historical and exactly recoverable. A later publication or relevant booking/source change invalidates an earlier resolution.

Browser captures include [desktop hold](desktop-appointment-hold-1440.png), [1024 px hold](desktop-appointment-hold-1024.png), [390 px hold](mobile-appointment-hold-390.png), [320 px hold](mobile-appointment-hold-320.png), [desktop field refusal](desktop-field-start-held.png), [phone field refusal](mobile-field-start-held.png), and [desktop](desktop-resolution-recovered.png)/[phone](mobile-resolution-recovered.png) recovered resolution. Automated checks found no horizontal overflow at those widths. Source self-review inspected the desktop and phone captures; it does not confer design-register visual approval or physical-device acceptance.

## Failures, corrections and retained evidence

The initial positive resolution/start case exposed the stored pack flag: acknowledgements made while a policy hold existed could leave the SQL attendance guard blocked after a valid resolution. Start now reconciles that derived flag only after all current server checks, within the same transaction and existing SQL dispatch guard. The corrected positive test proves independent crew acknowledgement, controlled amendment/reissue, fresh resolution, actual start, Current capture authority and unchanged earlier issued bytes.

The first renewed-hold fixture overlapped a seeded reservation; its proposed finish was corrected to remain outside that reservation. An interrupted turn terminated the private task cluster and incomplete race run. PostgreSQL recovered its existing data; interrupted cases are rerun and are not counted as complete evidence. The isolated positive case then passed without skips. Initial type checking caught the inherited Playwright web-server union; the dedicated config now declares its owned compiled launcher explicitly. Initial documentation checks caught a missing evidence link/component viewport headings and an overlong copied instruction block; all were corrected before the passing checks. The first legacy-receipt snapshot comparison included new Session login audits; the proof now preserves all earlier audit rows while allowing those additional login records, without excluding business audit changes.

The first PR CI head exposed a real projection omission: appointment detail included `can_resolve_policy`, while the batched planner summary did not. The unchanged quality equivalence assertion failed. The corrected summary uses the same current scoped read duties and scheduler/actual-owner rule in the existing batched query; both original quality-planner cases pass. No assertion or performance budget was weakened.

The first optional local HTTP invocation preceded listener readiness (ten transport refusals). After readiness, eight of ten passed; the remaining two required the existing persistence-proof setup files, which had not yet been created. Those incomplete setup attempts are not claimed as passing HTTP/restart evidence. The independently completed Step 4 real-process restart above uses its own private exact originals.

## Activation and limits

Online guarded routes activate selection, readiness, actual-start and delayed-offline enforcement together. Existing dedicated duties remain required; offline publication/resolution are absent. The [decision](../../../decisions/scheduling-policy-publication.md#step-4-coordinated-enforcement-and-compatibility--30-september-2026) states the compatibility boundary: pre-Step-4 or mixed writers cannot safely run after publication. Rollback must retain the enforcement and parsing contract, otherwise stop writes and repair forward without erasing evidence.

No Step 5 proposal/review/publication UI, merge, deployment, production integration or external communication is included. Functional captures do not grant visual review, independent source review, owner/device/accessibility acceptance or full PT-28/PT-30 completion. Existing PT-27 work remains open.
