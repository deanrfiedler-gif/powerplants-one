# SV-04 Appointment detail — implementation evidence

Owner: Dean Fiedler. Owner visual review: **pending**. Synthetic prototype proof only; no business acceptance or deployment. The [page contract](../../../design/development/pages/route-service-appointments-id.md) lists source node IDs, accepted version, differences and open questions. Reference PNG bytes remain unchanged; native captures hide licensed icons.

## Scope and environment

Dedicated branch `codex/sv04-appointment-detail`, initially cut from `4c1097cc4d6c5504a65aa4b359bd40a08078d199`, with main `0685e30c` integrated before final verification. Windows, Node 24.22.0, npm 11.19.0, Playwright 1.64.1, supported stable Chrome 155.0.8059.85. Private disposable PostgreSQL 16 cluster, database `ppo_synthetic_test`; no production or shared database used.

The page runs in the local Next application. Presentation tests intercept session, shell context, appointment/pack reads and contact commands with synthetic fixtures. They verify rendered permission boundaries and handovers, not server authentication or database transactions. The server projection has a separate database test. No fixture introduces a new capability.

## Execution ledger

| Check | Result |
| --- | --- |
| `npm ci --engine-strict=false` | Completed; lockfile unchanged. |
| `node --import tsx scripts/check-browser.ts` | Passed with local Chrome 155. |
| `npm run studio:check` | Passed: 366 entries, 48 components, no errors. Invalid test-file catalogue dependencies found in an earlier run were corrected. |
| `npm run typecheck` | Passed after correcting the fixture navigation argument. The final application build also completed its TypeScript check. |
| `npm run build` | Passed, including compilation, TypeScript, page-data collection and static generation. `/service/appointments/[id]` is included in the compiled route list. |
| `npm run lint` | Passed across the repository. The earlier interrupted attempt is not counted as a pass. |
| `node --import tsx --test --test-concurrency=1 tests/unit/appointment-detail.test.ts tests/unit/booking-recovery.test.ts tests/unit/component-catalogue.test.ts tests/unit/development-workspace.test.ts` | **19 passed**, no failures. |
| Full unit suite, serial execution | Attempted, then stopped during host memory pressure. It did not pass as a whole. Catalogue failures were fixed and retested above; operator/execution timeouts and document-store failures from the interrupted run remain unclassified, not asserted to be regressions or baseline failures. |
| `npx playwright test --config tmp/playwright-sv04.config.ts` | **5 passed** against the compiled application (26.7 seconds). Configuration selects only `tests/browser/appointment-detail.spec.ts`, one Chrome project, with viewports varied inside the tests. A previous four-test run also passed against the development server. |
| New database projection test in `tests/database/planner.test.ts` | Not verified locally: reset/seed setup timed out before its assertions. An existing planner test on an unmodified `0685e30c` checkout also failed in reset/setup under the same 180-second budget. The first private-cluster attempt additionally exhausted its lock allowance; that local configuration was corrected. |
| Existing appointment browser journeys | Selectors updated for real menu/header/section changes in planner, PL-01, closed-visit, quality-state and pack handover tests. These database-backed journeys were not rerun locally. |
| `python scripts/check_naming.py` | Passed: 744 documents, no errors. |
| `python scripts/check_foundation.py` | Passed: 78 parent requirements, 69 status fragments, no errors. Documentation assurance only. |
| `python scripts/build-ui-sequence.py`, `python scripts/build_status.py` | Regenerated; no hand edits to generated status/index. |

Earlier browser attempts exposed the missing host token layout override and a 40 px phone button; both were corrected before the passing run. A subsequent Chrome launch failed during simultaneous broad lint/unit execution; those runs were stopped and verification resumed sequentially. A failed attempt is not counted as a pass.

CI is not green. On head `4e74ec21`, documentation and dependency-audit jobs passed, while application jobs failed. The merged-tree typecheck failed on the fixture navigation argument and the register job rejected test-file dependencies; both were corrected and passed locally. An inspected E1 quality job failed at browser installation because current Chrome 156 exceeded the repository's 153–155 support range. The separately open runtime PR #643 addresses that range; this page PR does not change it. Final-head status is reported in the PR, rather than claiming those jobs passed.

## Capture pairing and visual observations

All captures below are from synthetic presentation fixtures with `.ppo-fa` and SVG icons hidden. They are implementation evidence, not replacements for the issued icon-free references. Figma file **PPO - Design**, named version **Appointment detail — shared record layout, accepted**. Full node inventory and source links are in the page contract.

| Native capture | Source node / viewport | Observation |
| --- | --- | --- |
| [Desktop held](paired-held-1440.png) | `1191:50`, 1440 × 1739 | Shared record, 380 px facts, 24 px main gutters, ruled checks, pack/contact/task sections and no tabs. Current server content changes section heights. |
| [Tablet held](paired-held-1024.png) | `1193:264207`, 1024 × 2506 | Facts follow the main workspace. Existing shared shell keeps record identity in the breadcrumb rather than changing the global tablet shell. |
| [Phone 390](paired-held-390.png) | `1193:263684`, 390 × 1696 | Compact shared header, inline Visit, crew disclosure and sticky actions. Explicit unavailable-state explanations and retained source details make this longer than the static source. |
| [Phone 320](paired-held-320.png) | `1193:263999`, 320 × 1728 | Text wraps without horizontal overflow; action targets are at least 44 px. The screenshot is the paired viewport, not the entire scroll extent. |
| [Phone lower content 390](details-390.png), [320](details-320.png) | Same phone source families; 390/320 × 844 | Scrolled view with integrity disclosure open shows retained lower sections; it is not a separate accepted state. |
| [Ready](ready-390.png) | `1195:1202`, 390 × 844 | Current server gate can pass; text explicitly excludes the unimplemented P4 gate. |
| [Supply hold](supply-held-390.png) | `1195:1930`, 390 × 844 | Updated Parts reason restores the hold without changing visit dates. No unsupported previous-promise/task narrative is invented. |
| [Proposed](proposed-390.png) | `1195:2153`, 390 × 844 | No crew reservation; contact and confirmation actions remain available when permitted. |
| [Cancelled](cancelled-390.png) | `1195:2409`, 390 × 844 | Not-applicable checks, retained work-order handover, no editing actions. |
| [Failed refresh](failed-refresh.png), [denied](no-access.png) | Shared record references `315:2094`, `326:53619`; 1440 × 1000 | Failure retains evidence and removes actions; denial clears the record. These reference IDs are shared-record sources, not claimed state-specific artwork. |
| [Pack loading](loading-pack.png) | Shared record state treatment; 1440 × 1000 | A pending pack read cannot show a dispatch pass or a pack handover. |

Browser assertions also cover denied pack data, an empty appointment response, keyboard disclosure access, stale contact input retention, uncertain-save retry of the exact original payload, and a delayed ready-pack response arriving after a newer Parts hold. The final compiled run also verifies that cancelled checks expose no current Parts details or check links. Desktop/tablet/phone screenshots and the ready/held/proposed/cancelled states were visually inspected. This is agent inspection; owner, screen-reader, physical-device and 200% zoom reviews remain pending.

## Deliberate differences and open questions

The source states requiring P4/P5 and the drawn site-readiness dialog remain gated as requested. The overdue/not-ready frames therefore have no executable equivalent in this increment. Undrawn demand-link, Parts-statement and exception dialogs await design. Crew competency is labelled “Checked at confirmation” because the read does not supply a live independent pass. Missing contact roles, record positions and pack-task due dates are not invented. Existing booking forms remain inline.

A current supply hold can be displayed; historical R2 cause/task context is unavailable from the existing structured appointment read and is not inferred from free-text Activity summaries. Native review should decide the visual differences; a later data contract is needed for the full R2 narrative. Owner review remains separate from automated results. No deployment or production-readiness claim is made.
