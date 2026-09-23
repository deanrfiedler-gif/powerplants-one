# Customers, contacts and sites — native verification

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Synthetic local assurance; owner/device acceptance and deployment are not implied.

The [receiving handover](../../../delivery/cs-native-completion-handover.md) records source main, scope, routes, contracts and limitations. Post-concurrency source is `25170bf83008727f005e36b5603841a7b9359027` (merged PR #284). Original checkout and its dirty Facilities page were preserved. No source snapshot was edited.

## Executed checks

Implementation tested: `36035a309db04000c703386e5edf5b3815de2daa`, following contracts `51b4787` and merged main `25170bf`. Windows, Node 24.21.0, PostgreSQL 16, Playwright 1.63.0 and Chrome 153.0.8010.53. Browser/HTTP commands use `PPO_PORT=3048`; database commands use the ignored synthetic local environment and the guarded `ppo_synthetic_test` database. PowerShell invokes `npm.cmd` and `python -X utf8`.

| Command | Actual result |
|---|---|
| `npm run lint` | Passed on final stable source; one intervening run read a file during a formatting edit and was discarded after TypeScript/build and stable lint verification |
| `npm run typecheck` | Passed |
| `npm run test:unit` | Final reconciled local run: 343/347 passed; only the four reproduced Windows baseline failures remain. Earlier run had one additional load-sensitive CLI startup timeout; isolated startup/CS/SH replay passed 16/16. Contract PR Linux CI: 347/347 passed |
| `npm run build` | Passed after the final responsive fix; compiled runtime used for the final seven-width proof |
| `npm run studio:sync`; `npm run studio:check` | Passed after final evidence update: 272 entries / 118 routes, no integrity errors; owner review remains unaccepted |
| `node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/contacts-native.test.ts tests/database/customer-location.test.ts` | Final 11/11 passed, including untouched survey scope refusal, CS projection/contact integrity and merged SH adapters |
| `node --import tsx --test tests/unit/azure-demo.test.ts tests/unit/customer-readiness.test.ts tests/unit/sh-platform.test.ts` | 16/16 passed with unchanged deadlines |
| `node --env-file=.env.local --import tsx --test tests/http/customer-location.test.ts tests/http/facilities.test.ts tests/http/sh-platform.test.ts` | Compiled 4/4 passed |
| `npm exec -- playwright test tests/browser/customer-location.spec.ts --config=playwright.compiled.config.ts --project=desktop-chromium --no-deps` | Five functional journeys and retained-source capture passed. Initial viewport run had one 1024px loading timeout; exact unchanged replay passed. Final geometry run below supersedes its layout evidence |
| Same command with `--project=mobile-chromium` | 5/5 functional journeys passed; 8 intentional skips avoid repeating explicit viewport/source cases |
| Same desktop command with `--grep='CS native family'` | Final 7/7 passed: seven loaded CS screens at each of 1440, 1280, 1024, 768, 430, 390 and 320px; header containment and no application overflow |
| `npm exec -- playwright test tests/browser/facilities.spec.ts tests/browser/sh-platform.spec.ts --config=playwright.compiled.config.ts --project=desktop-chromium --project=mobile-chromium --no-deps` | 24/24 passed: canonical Facilities, recovery, hierarchy, pin review, installed/served separation and merged SH notification/search/views/reviews |
| `python -X utf8 scripts/check_foundation.py` | Passed; retained sources and parent IDs unchanged |
| `python -X utf8 scripts/check_prototype.py` | Passed; all 78 parent dispositions retained |
| `python -X utf8 scripts/check_naming.py` | Passed; maintained project instructions remain within the 8,000-character contract |

Focused local upgrade command: `node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 --test-name-pattern='E1-DB10|DR01-DB03|E2 migration formalises|CS05-T39' tests/database/estimating.test.ts tests/database/estimating-workspaces.test.ts tests/database/facilities.test.ts`. Reconciled run passed repeated upgrade/seed, upgrade across migration 0026 with accepted estimates/quotes, and the CS-05 permission/replay case; the E2 case timed out in seed setup. The exact E2 assertion subsequently passed in [contract PR CI](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35818948840), whose Estimating PostgreSQL run passed 86/86, HTTP run 11/11 and unit run 347/347. Hosted demo upgrade and quality/access lanes also passed; migration/grant assertions were not weakened.

## Baseline and environment comparisons

The pre-SH unchanged source `743d58f` and unchanged post-SH current main `25170bf` both reproduced four Windows unit failures: two private-document temporary-path cases, the recovery path refusal message, and Windows route separators. Current-main command `node --import tsx --test tests/unit/document-store.test.ts tests/unit/recovery.test.ts tests/unit/warm-routes.test.ts` returned 3 passed / 4 failed. The broad-run CLI startup timeout passed in isolation within its unchanged 15-second deadline. Linux CI passes all units.

The initial compiled build failed with a node_modules junction outside the isolated worktree on both unchanged main and CS. Installing the unchanged lockfile into the isolated worktree resolved that build setup; no dependencies changed.

A CS-05 database case and selected upgrade attempts timed out in synthetic seed setup (`pg_timezone_names`), before assertions. Selected unchanged-main cases passed. These are not claimed as reproduced baseline assertion failures; reconciled CS-05 replay passed and CI proved E2 upgrade. A discarded browser run overlapped a test database reset; final browser/HTTP phases were isolated from database resets. An old compiled helper survived its npm parent, so an early HTTP attempt reached stale routes; stopping only the verified task-owned helper and serving the final build produced 4/4 passing HTTP tests. Deadlines, assertions and security guards are unchanged.

## Visual receiving and acceptance

The [capture manifest](capture-manifest.json) records hashes and individual inspection status for 59 unmodified PNG captures: 49 native screens (seven screens at seven widths) and ten retained-source views (five designs at desktop/phone widths). No session trace or cookie-bearing archive is committed.

Actually inspected: all seven native screens at 1440 and 320px; Customer 360 at 1280px; Contact at 1024px; Readiness at 768px; Account plan at 430px; Survey at 390px; and all five retained-source designs at 1440/390px. The other 30 captures are labelled automated geometry evidence, without claiming individual visual review.

Inspection found and fixed legacy CRM header grid specificity that placed shared controls over CS content at phone widths. The new containment assertion failed against the old compiled build, then passed for all 49 final screen/width combinations. Final inspected images show readable wrapped content, clear empty/unknown/restricted states, source-owned links, confined tab-strip scrolling and no header overlap. The smallest header truncates the breadcrumb visually while preserving its full accessible name; controls remain in one row.

The native proposal receives business workflow into PPO's shared shell and controls. It does not copy standalone shell geometry, fabricated sample counts or mocked ERP integrations. Native projection views explain unavailable sources; readiness distinguishes unknown requirements from permission to work; blank plan context is not scored; survey scope must be recorded before submission. Owner/device acceptance remains pending; no visual baseline acceptance is inferred.

Final review added a multi-Facility requirement regression: a selected Facility with no applicable requirement stays unknown even if another selected Facility has reviewed evidence and both have recorded work windows. The test failed before the assessment correction and passed afterwards. Explicit Site-wide requirements still apply to the selected Facilities. This changes no schema, permission or authority boundary.

Native PR CI found an obsolete exact shell-menu count: the authorised Survey destination increased the menu from 22 to 23 entries (24 including Help). The assertion now requires the new exact count and exact canonical Survey link; retained shell geometry assertions and r17 source bytes are unchanged.

The retained P11 journey initially waited for the former customer-detail endpoint after Customer 360 moved to its projection endpoint. Its initial response observer and 6.5-second loading fixture now target the actual `/workspace` request and assert the exact canonical customer ID. All journey decisions, status/no-store assertions, delay and deadlines are retained.

Corrective verification: readiness units 3/3, exact preparation/recheck database case 1/1, rebuilt application/TypeScript passed, compiled readiness browser 2/2. The CRM component run passed 36 cases with 26 intentional skips and one shell comparison timeout under concurrent build load; its exact isolated replay passed in 24.1 seconds with the unchanged 30-second deadline. Retained CRM long-Activity and Site-hierarchy keyboard journeys pass 4/4 on desktop/mobile using the received tabs and exact projection IDs.

The local P11 replay passed its corrected initial Customer read and reached booking, where the device-time fixture was refused by the published working interval (desktop and mobile). An independently installed and compiled, tracked-file-clean worktree at unchanged post-#284 main `25170bf` reproduced the same `SkillOrTravelInvalid` response at `quality-prepare.ts:489`: `PPO_PORT=3052 npm exec -- playwright test tests/browser/quality-journey.spec.ts --config=playwright.compiled.config.ts --project=desktop-chromium --no-deps` returned 1 failed at that booking assertion. It was the current-main comparison source selected before #285 merged. The fixture enters device-local midnight; Australia/Sydney versus CI UTC is the likely environment cause, not a claimed new CS scheduling defect. The corrected native [Linux quality job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35824408766/job/107062908055) and [retained CRM persistence job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35824408762/job/107062908012) both passed. No scheduling guard, test deadline or assertion was weakened.

## Publication record

Server contracts: [PR #285](https://github.com/deanrfiedler-gif/powerplants-one/pull/285), `51b4787`, completed all 20 checks successfully and merged externally at `4c8fd6dba83794f6c64aee6859cadb913401fd64` on 23 September 2026. Its [broad database job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35818948686/job/107046452155) passed 546/546 PostgreSQL tests, 44/44 HTTP tests and the issued-output isolation proof, with reset/restart and exact registry checks intact. Native receiving [PR #287](https://github.com/deanrfiedler-gif/powerplants-one/pull/287), `feat/cs-customer-location-completion`, now targets main. Implementation commits are `f682204` / `36035a3`, guide/evidence `94e7d05`, and final behaviour/test correction `d662047`. Main reconciliation `2165546` changes no implementation bytes; both `origin/main` and final merged #284 are proven ancestors. Current check results remain visible on the PR. No merge, deployment, live integration or owner acceptance is performed by this task.
