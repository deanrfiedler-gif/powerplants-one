# Repository consolidation and service verification

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. State: authorised implementation in progress, 27 September 2026. [Decision and migration sequence](../decisions/repository-consolidation.md). All 78 parent requirements remain unchanged.

## Starting evidence

- Main `80b2f418b90a69d267ac2e65682a5b560a8b4356`, tree `5c9ee19d6af6e12b5cb5bf464338aacba9172059`; no open PR at preflight. The root planning checkout is 162 commits behind and contains uncommitted work, which remains untouched.
- [Application CI](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/36098609739): 434 unit cases, 601 main database cases and the additional separately reported suites passed. [Compiled browser CI](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/36098609686): 516 passed, 79 skipped. All seven configured protected contexts passed. Counts are component evidence, not complete acceptance.
- [Deployment 36204121972](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/36204121972), 26 September: image source `80b2f41`, digest `sha256:83348b2854d0483b687640488204176bfd62fb57315089f20f7f80f80d97d73c`; database gate, selected web readiness/health and anonymous refusal passed; worker configured with the same digest. Fresh signed-in record/output, worker execution and managed PostgreSQL minor were not checked by this audit.
- Fresh audit checks on unchanged main: foundation, prototype, naming and design-register integrity passed; all 78 parent dispositions retained. Register: 320 entries, 166 source routes, 28 components, zero integrity errors, 320 entry reviews and 28 component reviews pending. Twenty-four focused field/readiness/inspection/development units passed. The production dependency advisory audit reported zero known vulnerabilities; this is not a security certification.
- [Performance job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/36098609739/job/107956098735): all sixteen compiled groups missed the 3-second candidate; p95 3.42–10.03 seconds. All sixteen development groups also missed. Successful execution is deliberately distinct from meeting the candidate. These measurements do not establish hosted response times or their cause.

## Delivery ledger

| Work | Source and state | Remaining proof |
|---|---|---|
| Baseline records | `codex/repository-consolidation` from current main; README/STATUS refreshed and prior snapshot preserved in STATUS-log | Foundation, prototype and naming checks passed locally; all 78 parents retained. PR CI and owner acceptance remain separate. |
| Timer/offline | Existing `feat/fi01-fi02-field-timer-offline` in the original field worktree; implementation completed for PR review with exact existing work preserved | Local proof: 9 database, 12 focused units, 4 new compiled browser cases, actual process restart and 200% zoom passed; guides/register/component/API records updated. Protected PR and remaining owner/device acceptance are separate. |
| Migration allocation | Supply 0049 retained; timer 0050, Maintenance 0051, Products 0052 in that order | Reconcile each unpublished branch and all exact upgrade/grant assertions; no working database rewrite |
| Complete service narrative | Initial checkpoint `7f36e92` retained. The follow-up on clean `f1fa3fb` completes both return attendances on the same work orders; `83bccf1` proves 175 receipts, 61 checked tables and 36 exact files across application/PostgreSQL restart | PR integration, full PT-28 procedure, full PT-30 prerequisites and owner/device acceptance remain open. [Evidence](../testing/evidence/field-timer-native/README.md#completed-service-return-follow-up). |

## Pre-existing work preserved

The root branch retains its field-quality plan/prompt, STATUS/register edits and estimating-reference relocation. Maintenance/Warranty has committed native work plus local modifications; Products has uncommitted native work; Excel import also has unfinished local work. These do not become complete, reviewed or deployed through the consolidation record. No branch is discarded and no historical source is overwritten.

Migration 0049 in Maintenance/Products is an unpublished proposal that conflicts with merged Supply Chain. Its future numbering must change with the complete branch reconciliation. Their local test databases are not evidence of the merged upgrade path. The timer branch already starts at current main and proposes 0050.

## Acceptance boundaries

Use [PP-01 procedures](../testing/prototype-acceptance.md), the [P12 remaining obligations](p12-handover.md), and the current [field programme](field-quality-native-handover.md). FI-05 is merged via #316; dedicated FI-03/FI-04/FI-06 remain later work. Preserve report/Finance authority and exact prior outputs. Synthetic completion does not grant business acceptance, live-system write access or production readiness.

This ledger is updated with actual results as work executes. Do not convert an earlier observation, source implementation or green CI count into a new acceptance claim.

## PT-27 phase audit

Inspected the retained compiled artifact `10848413175` from run `36098609739` on the exact starting main tree. Its 320 successful compiled observations preserve ten concurrent browser users, the declared throttled network and the original candidate boundary. The following medians combine desktop and phone (20 cold and 60 warm observations per view); they are descriptive phase measurements, not new acceptance groups or sums of independent percentiles.

| View | Cold / warm time before first core request | Cold / warm core request to complete body | Cold / warm body-to-settled UI |
|---|---|---|---|
| Customers | 3,284 / 2,413 ms | 3,810 / 3,441 ms | 210 / 181 ms |
| Work order | 3,122 / 2,210 ms | 1,136 / 1,348 ms | 443 / 428 ms |
| Planner | 2,995 / 2,526 ms | 1,458 / 1,456 ms | 336 / 265 ms |
| My Jobs | 2,753 / 2,141 ms | 875 / 1,161 ms | 259 / 244 ms |

This narrows the next performance experiment to initial page/assets/hydration and the longer Customers core-read path. It does not establish that database execution alone caused the Customers interval: transport, declared throttling, concurrent browser load and application work are included. The same artifact records a compiled cold Customers sample fetching the variable Roboto font alongside three shell weights and waiting several seconds for assets; this is an investigation lead, not proof that removing a font fixes the candidate. Inspect the actual compiled payload and server timings, make one bounded change, then repeat the unchanged declared fixture/profile. Do not weaken the candidate or relabel current misses as success. Hosted performance remains unmeasured.

## Publication and next acceptance boundary

Baseline reconciliation [PR #320](https://github.com/deanrfiedler-gif/powerplants-one/pull/320) merged as `7451d30`; [PR #321](https://github.com/deanrfiedler-gif/powerplants-one/pull/321) now targets main. Its source `335a69b` passed the application and other assurance jobs. [Compiled run 36304656815](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/36304656815) passed 518 cases with 79 skips and failed two timer assertions: a fast Pause/reload/Stop legitimately recorded a zero-second event without a positive Waiting entry. The test now observes the browser clock crossing the persisted Pause boundary and asserts positive saved seconds; both desktop/phone cases passed locally (24.8/25.2 seconds), with lint and types. Production logic and the separate zero-second database proof are unchanged. Actual app/database restart and 200% zoom passed in the original CI run. The correction needs its own full CI result; no hosted deployment is included.

The timer correction `a4f7322` passed [compiled CI 36310714597](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/36310714597), including actual process restart and 200% zoom. Full application CI was still running at this checkpoint; the original failed run remains part of the evidence.

## Completed return attendance follow-up

Branch `codex/service-return-verification` retains the initial proposal through controlled cancellation and creates an explicitly prepared replacement on the same work order, dates and authorised scope. Both crew members acknowledge the exact new pack. The second technician records actual attendance, personal timer time and photo-backed task/site checks; a coordinator reviews and separately issues the return report. The appointment becomes Completed while the work order remains Authorised. The original AcceptedWithReservations response, reconciled Finance target and issued bytes remain unchanged; the return report has no inherited customer response or financial outcome. Existing follow-up activities are not automatically closed.

This journey exposed a real UI defect: saved arrival left the independent timer authority stale until the next 15-second refresh. The timer now reloads on a changed attendance ID; the browser proof requires Start work to become available within its normal five-second assertion window without navigation or manual refresh. Existing permission, command and dialog guards remain. There is no migration, capability or dependency change. The live component, page and guide contracts accompany the implementation; reviews remain pending.

Clean source `f1fa3fb` passed both complete compiled desktop/phone journeys in 6.5 minutes. Clean restart source `83bccf1`, on the same runtime build, retained 175 receipts, all checked records across 61 tables, 34 issued pack/report/Finance files and both return-photo originals across actual application and PostgreSQL restart. The [evidence package](../testing/evidence/field-timer-native/README.md#completed-service-return-follow-up) records exact identities, artifact hashes, retained earlier failures and limitations. The existing closed-visit arrival wording remains visible in the inspected history captures; no owner visual acceptance is inferred.

The next acceptance increment is the PT-28 compatible-update/unsupported-original/scheduling-policy procedure, followed by disposition of every remaining PT-30 prerequisite. Inspection found immutable published seed policies and booking pins, but no existing scheduling-policy publication command; the policy step therefore needs a bounded design/implementation and future-booking impact review before it can be demonstrated through the application. Do not substitute a direct database edit for publication evidence. Keep the PT-27 phase-led performance experiment and owner/device review visible. Maintenance 0051 and Products 0052 remain preserved integration work, with their full upgrade/grant obligations outstanding; allocation alone is not reconciliation.

## Verified merge and compatible-update component

PR #321's exact head `a4f7322` passed every reported check and all seven protected contexts. Normal merge `336ba90` on 27 September at 11:05 UTC has the identical file tree; its new actual-main CI remains separate. PR #322 was retargeted to main and marked ready for review after source review found no blocking issue. Its remaining application/browser jobs were still running with no failure at this checkpoint. Neither action deploys the application or grants owner acceptance.

The next local PT-28 component passed on clean candidate `2faa3be`: update from compiled `80b2f41` / schema 0049, preserve six accepted-but-unacknowledged receipts and all original bytes, accept one unsent supported original once, retain one unsupported original, then return to the old software while keeping schema 0050 and the same accepted outcomes. [Exact evidence, failures and procedure](../testing/evidence/offline-compatible-update/README.md). Existing issued pack HTML/PDF/manifest and the original PNG remain unchanged. A private pre-update archive was retained; no restore or external-outcome claim follows.

Next: finish #322's required checks/review and implement the separately bounded scheduling-policy publication/impact path for PT-28. Its design must identify the publisher authority, exact reviewed version, deterministic affected-booking preview, owned review tasks, competing-save/original-retry behaviour and immutable historic output checks. Do not silently move bookings, replace their pinned policy or regenerate existing issues. No operational policy values or additional migration allocation are adopted here. Complete PT-30, PT-27 performance and owner/device review remain open.

## Scheduling-policy review continuation — 27 September

The [PL-04 read-only impact increment](scheduling-policy-impact-handover.md) compares proposed duration/effective-date changes with exact permitted future bookings. It prepares the review boundary for API-C26 without granting publication authority, creating impact tasks or occupying reserved migrations 0051/0052. Full PT-28 stays open. PR #322's application-assurance browser lane recorded a Sales loading timeout; its separately named compiled suite passed. The failing lane also used the compiled configuration, as the later inspection below establishes. Retain the original failed result and resolve the gate before merging the stacked work.

## PR-stack browser stabilisation

Dean authorised sequential integration of #322/#323/#324. The [CR05 evidence](../testing/evidence/cr05-reload/README.md) distinguishes two original CI failures, a controlled reproduction, corrected desktop/phone proof and a failing negative control. The missing test boundary was the reload's asynchronous exact record GET, not document load. The correction also verifies the original Close receipt, saved version and attributed feedback. Five-second UI assertions and performance thresholds stay unchanged. Both original failing jobs used the compiled configuration; original trace ZIPs were excluded by artifact policy and capped request diagnostics cannot attribute the extra CI loading time to a particular runtime phase. Fresh protected checks, review and dependency-order merges remain required.
