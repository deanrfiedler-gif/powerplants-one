# Service inspection verification

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Synthetic implementation evidence; independent owner, visual, physical-device and screen-reader acceptance remain pending. No deployment or operational engineering approval.

Delivery: [PR #334](https://github.com/deanrfiedler-gif/powerplants-one/pull/334). Implementation commit `f3fa0b02e256a4f12b37dabadd8050f31e27f57d` contains the exact runtime trees in the identity record. The first follow-up handover commit changes documentation only. A later CI correction changes the inspection browser fixture dates, without changing application, SQL, seed or shared test-helper behaviour. Final-head CI results are recorded in the PR validation section and check runs; no local result is substituted for CI.

## Starting point

Fetched main: `feb01e57c1ffdab0a5f8d1a5664ab5144bd37ccd`. Scheduling Step 6 PR #333 merged at 2026-10-01T07:34:17Z with all 17 reported checks successful. Its handover identifies no unresolved blocking permission, data-loss or recovery defect relevant to this increment. Performance misses and retained unsupported offline originals remain separate findings. The original checkout and unrelated Maintenance/Products/Excel worktrees were preserved.

Implementation uses an isolated `codex/service-inspections` worktree. Two fresh task-owned PostgreSQL 16.15 clusters use database `ppo_synthetic_test`: regression port 57561 and browser/restart port 57563; compiled application port 57560. Private config, session/browser profiles, database backups, issued originals and raw recovery files remain outside Git. Installed migrations/seeds through 0054 and reserved 0051/0052 remain unchanged. An additional clean worktree at the exact main baseline supplies comparison evidence.

## Acceptance basis and evidence

F02-A with F01-A/F08-A: exact Equipment/appointment context, applicable preparation, immutable procedure, draft capture, failed check, frozen submission, reviewer return, owned correction, fresh retest, independent review and exact scoped internal output. Tests are maintained in `tests/database/service-inspections.test.ts` and `tests/browser/service-inspections.spec.ts`.

Initial database failures are retained: fixture site lookup used an absent field; an empty preparation source correctly blocked capture; the installed pressure instrument correctly failed as overdue; an Internal corrective Activity correctly refused technicians without that classification. Corrections use actual appointment site, reviewed preparation, a separate fictional current pressure instrument and normal RestrictedService Activity authorization. Existing instrument/seed bytes were not changed.

The initial corrected three-case database run passed all three cases. The expanded final five-case Service database run passed 5/5, with no skipped tests. No failed result is silently converted to a pass.

| Acceptance requirement | Executed proof and boundary |
|---|---|
| F02-A valid and failed readings, exact sources | Real issued/started appointment, reviewed FI-05 preparation, immutable template and Equipment configuration; 120 kPa fails; a fresh 2.1 bar reading is retained raw and evaluates as 210 kPa using the one documented conversion. Separate source/configuration changes withdraw applicability. |
| Missing prerequisite, criteria and unknown condition | Missing reviewed preparation prevents capture. The second synthetic procedure retains missing criteria/unknown applicability as incomplete owned obligations; it cannot be accepted. Required checks do not disappear. |
| Exact instrument at use | Required measurement/range/unit/certificate visible in capture and review; overdue evidence refuses submission. Later renewal does not repair the retained snapshot. Retrospective withdrawal removes current applicability. |
| Owned failure and retained retest | Atomic submission creates one defect and RestrictedService Activity. Repeated failure reuses lineage. Activity completion alone leaves the defect open. Return, clarification and hold retain reason/owner; correction precedes a fresh linked retest and independent acceptance. |
| Exact bounded outcome | Only the accepted procedure/equipment occurrence is released. A separate procedure's two outstanding defects stay in remaining work; its correction is excluded from accepted-scope corrections. Appointment remains InProgress and work order Authorised. Internal HTML/PDF reopening verifies byte hashes. |
| Authority and concurrency | Two technicians and multiple procedures have independent drafts. Stale saves, wrong owner/company, changed non-lead assignment and revoked capture/receipt authority are refused. Review works after technician grants are removed from the named Service reviewer. |
| Recovery and accessible validation | Compiled browser journey retains invalid-unit input, explicit dirty-switch cancellation, offline/uncertain original and an accepted submission whose response was lost. Reload/retry uses the original ID/payload without duplication. Keyboard submission and guide Escape/focus return pass. No offline queue is claimed. |
| Durable history | Actual application and PostgreSQL restarts compare ten complete table snapshots, two technicians' unchanged saved-draft receipts, original submission receipt and issued file bytes. |

## Validation results

Environment: Windows, Node 24.21.0, npm 11.19.0, PostgreSQL 16.15, Playwright 1.63.0 with Chrome 154.0.8037.93. Dependencies remain locked and unchanged. Final local compiled build: `D49Y9dS7Qw2QbEKy6RmRr`; earlier restart build: `U1kApxdVJ0PgEFx3ZwNyt`. The final source/build record and reviewed captures accompany this evidence.

| Check | Actual result |
|---|---|
| Service database journey, final expanded run | 5/5 passed: atomic submission/retest/output, retained calibration and changed sources, concurrent drafts/upload failures, unknown criteria/permissions/assignment, overdue renewal. |
| Shared-engine/EN-08/recovery/Service focused units | 28/28 passed. |
| Full local unit run | 563/567 passed. Four Windows failures in document-store roots (2), recovery directory and warm-route path handling also fail in unchanged main's focused comparison (3/7 pass, same 4 failures). No assertions or platforms are skipped. |
| Broad database regressions | Original run: 90/92 passed, including Equipment/EN-08, FI-01, FI-05, Scheduling policy enforcement, all 22 offline cases and P09 reports. One policy snapshot statement timeout and one invalid assignment-removal fixture failed; both originals retained. |
| Policy persistence/upgrade repeat | All 11 cases pass, including populated 0050→0055, preserved old rows/grants and exact added instrument, direct reseed and fresh install. Unchanged main also passes 11/11. The original timeout did not reproduce; its cause remains unproven. |
| Build/type/lint | Seven local compiled builds passed; typecheck and lint passed. No timeout or performance target changed. |
| Register/repository assurance | Studio, foundation, prototype and naming checks passed. All 78 parent IDs retained. Register review warnings remain visible; no fingerprints were copied into acceptance records. |
| Final compiled Service browser journey | 2/2 passed on build `D49Y9dS7Qw2QbEKy6RmRr`: desktop 53.6 s; phone 42.8 s. Release response measured 4,558 ms and 4,710 ms respectively; these are observations, not a performance acceptance claim. |
| Hosted-demo populated upgrade | 5/5 passed, including exact saved data, grants/invitation limits, idempotent retry and late-failure rollback across migrations 0018–0055. No hosted tester gains Service inspection authority. |
| Compiled EN-08/FI-05 regression | 4/4 passed across desktop and phone. EN-08's ordinary-command fixture includes retained tests, reviews, release and receiving before all six views; FI-05 exercises unchanged originals, changed sources and responsive review. |
| Independent retained-source comparison | 2/2 passed: Quality r01 and r20 are separately opened and hashed, and focus/strong-line tokens match the native shell. The existing 8 px app card radius versus r20's 7 px is a documented adaptation. |
| Final-build actual restart | Passed: app PID 24200→31144, PostgreSQL start 09:24:44.567Z→09:37:52.465Z on 1 October; same build, ten exact table snapshots, two concurrent personal drafts/receipts and original submission receipt. HTML 84,644 bytes and PDF 126,677 bytes retain exact hashes in [restart.json](restart.json). |

Final-head CI is reported in the linked delivery PR; local results above do not stand in for CI. Independent owner acceptance remains pending even when automated checks pass. [Source/build identity](identity.json) identifies the exact runtime trees and environment; [evidence hashes](evidence-index.json) identify retained original logs and committed captures without publishing private originals.

## Inspected layout and accessibility evidence

Agent inspection on 1 October compared the retained proposed Quality reference with the bounded native shared-shell adaptation. This is technical visual inspection, not independent owner approval. No accepted native FI-03/FI-04 desktop or phone mockup exists; register reviews remain pending.

Paired sources: [Quality desktop](captures/quality-r01-desktop.png), [Quality phone](captures/quality-r01-mobile.png), [r20 desktop](captures/theme-r20-desktop.png), [r20 phone](captures/theme-r20-mobile.png), [native desktop worklist](captures/native-worklist-desktop.png), [native phone worklist](captures/native-worklist-mobile.png). [Desktop comparison](reference-desktop.json) and [phone comparison](reference-mobile.json) retain exact source hashes and measured values. The first comparison read board tokens from `body` instead of its documented `#ppo-theme-board` boundary and failed; the corrected selector passes without changing the reference or app tokens.

| Viewport | Capture and review evidence |
|---|---|
| 1440 × 1000 | [Capture](captures/capture-1440.png), [review overview](captures/review-overview-1440.png), [readings and exact evidence](captures/review-readings-1440.png) |
| 1024 × 768 | [Capture](captures/capture-1024.png), [review overview](captures/review-overview-1024.png), [readings](captures/review-readings-1024.png) |
| 390 × 844 | [Capture](captures/capture-390.png), [review overview](captures/review-overview-390.png), [readings](captures/review-readings-390.png) |
| 320 × 844 | [Capture](captures/capture-320.png), [review overview](captures/review-overview-320.png), [readings](captures/review-readings-320.png) |

Each image is a viewport of the shell's scrolling content, not a stitched whole page. Fields/cards wrap, readable evidence and hashes stay within the viewport, and the shell `main` is the only content scroll owner ([geometry](layouts.json)). Keyboard Enter submission, invalid-unit input retention, guide Escape/focus return and native source-detail focus are exercised. [Actual 200% browser zoom](captures/zoom-200.png) has 720 × 500 CSS pixels at device pixel ratio 2 ([measurement](zoom.json)); the focused source control fits within the viewport. The original full-page zoom capture was cropped by screenshot clipping; that private original is retained and the evidence uses the actual viewport surface.

[Before](captures/draft-before.png) and [after](captures/draft-after.png) restart draft images are byte-identical. The final zoom capture follows the FI-05 regression's shared synthetic readiness-source change: the old readings remain visible with reassessment warnings, while the earlier restart/layout captures precede that change. No physical-device, assistive-technology or human task-time comparison is inferred. In the selected failed-check journey one unresolved defect becomes zero only after correction and accepted retest; the separate incomplete-procedure proof retains its two other obligations. Wider missing-evidence rates, defect ageing and owner review time remain acceptance work.

## Original failures and corrections

Private original logs are retained with hashes in the evidence index. Early fixture corrections are described above. Later database fixture attempts removed a lead crew assignment and were correctly rejected by the existing booking invariant; the final test removes the actual non-lead member, preserving that guard. The broad policy run hit PostgreSQL `57014` during a pre-publication snapshot; focused topic and clean-main repeats passed without changing deadlines.

Browser runs 01–05 retained their failures: an incorrect Customer/Site action route, rerun fixture conflict, starting before every crew acknowledgement, an exact label locator that included option text, a wrong expected denial status, and checking for issued UI before the renderer returned. Corrections use established `/actions`, task-database backups before reset, all acknowledgements before Start, accessible combobox roles, the existing 403 capability gate and the actual release response before the unchanged UI assertion. Runs 06 and 07 passed both desktop and phone journeys. One duplicate local launcher encountered an occupied port; subsequent runs explicitly wait for the task-owned app. The first restart launcher omitted PostgreSQL's task port and failed to bind the default; corrected startup explicitly used 57563. No unrelated process or database was stopped.

The original browser release wait is retained as a performance observation; explicit request completion is not evidence of a new performance target. Release timings are recorded alongside final browser results. Scheduling Step 6's existing performance findings and unsupported offline originals remain unchanged.

The first complete CI runs at `708a798cfc1007b208bff3d21f028ae0e9f19826` exposed a shared-crew fixture collision: P09 reports already books 10–11 December 2031. Both browser lanes correctly refused the new inspection fixtures at the same times. The Service inspection fixtures now own 3–4 November 2031, which are unused by the other browser journeys. All four local inspection/reference cases pass with these dates. No booking guard, assertion, skip or deadline changed. The original compiled lane recorded 525 passes, three failures and 79 existing project-specific skips; the application browser lane recorded 526 passes, the two fixture failures and the same existing skips.

The compiled lane's third failure was P09's existing online/offline report test: its Submission reason remained hidden with Capture selected after the test clicked Completion. The independent application browser lane passed that exact report test on the same source. Its cause is unproven; the final PR validation records the unchanged-main comparison and repeat outcome. Initial local report comparisons used the suite's hard-coded port-3000 Origin against task port 57560 and were correctly refused by the local gateway. The comparison harness retains a copy with only its two Origin literals changed to the task port; original tests and application guards remain intact. Private original CI/local logs and comparison evidence are retained outside Git.

## Limits

Online server drafts and unchanged-original recovery are supported. Unsent browser edits are not persisted; closing the tab removes its session recovery copy. No new offline inspection protocol is implemented. FI-06 incident clearance, general template authoring, OEM integrations and operational limits are unavailable. Native adaptations of the retained proposed Quality HTML require independent acceptance; captures do not grant approval.
