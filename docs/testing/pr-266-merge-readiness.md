# PR #266 merge-readiness repair — 21 September 2026

The repair integrates main `8ed8b0c5` into EN-07 head `78a8acb9` without rewriting branch history. Its conflicts were in shared presentation code, following the accepted existing-module refinement (#271).

- EN-06 keeps main's two-row grid and docked inspector shadow. EN-07 keeps its separately scoped flex layout and r03 content.
- The shared header keeps main's semantic breadcrumb and centred controls, with EN-07's route-derived module and destination.
- EN-07 uses the current My Work secondary-menu rules: 240px, grey background, white current item and the 24px collapsed disclosure strip. The register test continues to compare the complete computed menu geometry with actual My Work; only the obsolete fixed dimensions and breadcrumb selectors change.
- No migration bytes, seeds, permissions, issued sources, workflow gates or business assertions are changed by the repair.

Foundation, prototype and naming checks pass locally. TypeScript passes on pinned Node 24.21.0/npm 11.19.0. Final lint/unit and GitHub job results are recorded on the PR; GitHub must check the published commit before merge. Historical evidence remains historical and is not relabelled as this execution.

Dependency order is EN-07 (#266), EN-08 (#270), then PJ-09 (#269). These branches must be reconciled in that order, with merge commits retaining shared ancestry. This repair does not merge to main or deploy. Full owner/device/business acceptance remains separate.

## P11 initial customer readiness follow-up

GitHub job `106238842138` on repair head `30984721` failed before the P11 journey began. The retained screenshot/DOM shows “Loading permitted records…”. Its browser-lifecycle attachment records the customer GETs starting at 5509/5511 ms and still awaiting responses when the five-second heading assertion ended the test at 9808 ms. There was no customer response to assert against yet.

`prepareJourney` now observes the actual customer GET using the existing response/action budget, asserts HTTP 200 and private/no-store, then retains the original heading assertion. It does not retry, fabricate a response, extend a global timeout or alter application loading/permissions. The full P11 journey holds the real initial response for 6.5 seconds (concurrent reads share one delay), retaining its actual body/status, so this sequencing is exercised on desktop and phone. This test change propagates through EN-08 and PJ-09 without a schema or application-code change. Original failed evidence remains in GitHub run `35569802089`, artifact `10626195695`; subsequent runs are separate evidence.

## CRM readiness and overlay interaction follow-up

Two more jobs on `30984721` completed with specific failures. CRM job `106238841932` found the initial identity region still busy after its five-second assertion. The already verified EN-08 correction is now also included in EN-07: both CRM helpers use their existing 15-second action budget for initial identity readiness, and the real-response 6.5-second regression remains in the full CRM journey. No identity or permission implementation changes.

Compiled-browser job `106238841770` passed 232 cases but the EN-07 register test tried to click Clear selection through the open inspector overlay. The retained 1440px screenshot was inspected: the declared responsive overlay covers those actions and its close control is accessible. The test now closes the inspector through that real control, verifies the hidden selection survives, then clears it and verifies the selection region disappears. Dock/overlay geometry, computed My Work parity, filtered-selection disclosure and real pointer actionability are all retained. No force click or product layout change is used. Original run `35569802077`, artifact `10626500385`, remains the failure evidence.

## Full application job budget

On head `3a125bc8`, all 16 other checks passed. The full application job `106246123399` in run `35572242671` passed its browser, Finance, report, PostgreSQL transaction and HTTP steps, then GitHub cancelled the final offline restart proof at the job's two-hour limit. The run annotation states that the maximum execution time was exceeded; this is not a completed offline proof. Its logs and retained artifacts remain the original evidence.

The overall `p01` job budget is now 150 minutes to give the serial retained suites and real process restarts headroom on CI workers. Every test, required status context, individual test deadline, performance assertion and evidence-upload step is retained. No application, migration, seed or permission code changes in this follow-up. Fresh checks on the published heads are required before merge; the earlier successful stages are not relabelled as a complete run.
