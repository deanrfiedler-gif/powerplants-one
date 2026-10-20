# People register — application verification

<!-- versioning: git; committed history is authoritative -->

Scope **CS-02**. Owner: Dean Fiedler. Contributor/branch owner: this Codex build session. Branch `codex/accepted-ui-build`, application draft PR [#625](https://github.com/deanrfiedler-gif/powerplants-one/pull/625), based on main `971ac3502f87d5ba7e093bbe37abc83e75d4fb99`. Queue/claim PR #624 merged separately. Implementation commit `5f3d78d0` and the subsequent validation commit containing this evidence form the delivered source. Owner visual/device review **pending**. Application deployment is not claimed.

The accepted source is **PPO - Design**, page `1395:150275`, named version **People — accepted**: desktop `1395:150312` (1440 × 900), tablet `1395:150835` (1024 × 900), phone `1395:151069` (390 × 844), loading `1395:151245`, empty `1395:151303`, error `1395:151346` (390 × 844), notes `1395:151383`. Read live metadata, design context, variables and screenshots. Shell sources: top bar `35:138`, Service rail `198:3778`, compact phone header `1530:110`, named **Phone header amendment — accepted**. The [retained captures](../../../reference/ui/customers/people-design-r01/README.md) remain unchanged.

## Fixture and test boundaries

`tests/helpers/people-register.ts` contains the eight fictional frame contacts, `.example` addresses, ACMA fictional-range phone numbers and stable internal fixture IDs. Browser composition tests intercept only the People read; the shell runs in the application. A separate browser case uses the actual read and opens the exact receiving record. The test-database suite executes the real SQL and existing commands against `ppo_synthetic_test` only. No operational data or Pro icon artwork is retained.

Application captures use the repository's local fallback icons with the Kit unavailable on 127.0.0.1. Font Awesome drawing differences are expected; the existing Kit mapping supplies Pro Light only under the repository's opt-in runtime contract. No reference capture is rewritten.

## Executed checks — 20 October 2026

| Check | Result and boundary |
|---|---|
| `npm run studio:check` | Passed: 366 entries, 48 components, 21 runnable components, zero errors. 338 unreviewed and 28 stale entries remain visible; this is not owner acceptance. |
| `npm run lint` | Passed. Focused ESLint rerun covers the final People component and browser-test edits. |
| `npm run typecheck` | Passed. |
| `npm run build` | Passed on the initial implementation and again after the final state/layout changes, including compilation, TypeScript and route generation. |
| `npm run test:unit` | **Failed: 942/947 passed.** Three failures reproduce on unchanged main; two timeouts pass in quiet reruns, detailed below. No full green claim. |
| Quiet unit rerun | **19/19 passed**, serial: `cpq-packages.test.ts`, `foundation.test.ts`, `people-register.test.ts` and `phone-header.test.ts`. |
| `tests/database/people-register.test.ts` | **2/2 passed** against `ppo_synthetic_test`. Permitted rows/counts/options; bounded pages and actor/company/filter-bound cursor refusal; invalid filters; current affiliations, primary contacts, latest notice preference and restricted correction history. Existing migration 0109 and earlier history only. |
| `tests/browser/people-native.spec.ts` | **10/10 passed** across desktop and mobile projects, plus the five-case capture run: 1440/1024/390/320 geometry, filter drafts/apply, transient selection, exact URLs, loading/empty/error/denied, Contacts and actual Person receiving, phone chooser and modal focus. |
| `tests/browser/directory-navigation.spec.ts` | **2/2 passed**, desktop and mobile projects: no automatic record-prefetch reads; exact Person/Organisation/Site receiving, keyboard/touch activation, creation links and shared navigation. |
| `tests/browser/crm-refinements.spec.ts`, saved/scoped directory case | **2/2 passed**, desktop and mobile projects. Existing account saved views remain usable through `people_layout=directory`. |
| `tests/browser/department-navigation.spec.ts`, storage/reflow cases | **2 passed, two existing mobile-project skips**. Engineering context survives unavailable browser storage; the explicit 720 px phone/reflow scenario retains navigation and avoids page overflow. This is not a full zoom/accessibility review. |
| `tests/browser/shell-loading.spec.ts` | **4 passed, two existing mobile-project skips**. Exact shell navigation/Back passes on desktop and phone; desktop first-paint rail and delayed Planner-context checks pass. |
| `python scripts/check_naming.py` | Passed: 741 document records; maintained ChatGPT instructions 7,989 characters, unchanged. |
| `python scripts/check_foundation.py` | Passed: 22 issued artefacts and all 78 parent requirements preserved. |
| `python scripts/build_status.py` | Regenerated status and decisions index from 58 fragments. |
| `python scripts/build-ui-sequence.py` | Regenerated ignored `tmp/` outputs: 366 entries, 363 placed, three excluded. 46 build / 104 refine / 208 review / five decide; 28 owner-reviewed entries retained, no new review invented. |

Windows baseline comparison used a separate untouched worktree at `971ac3502f87d5ba7e093bbe37abc83e75d4fb99`. Running the four affected existing unit files produced 9/12 passing and the same three failures: two `document-store.test.ts` cases throw `ExactDocumentUnavailable`; `recovery.test.ts` expects `/outside Git/` but receives `Unsafe recovery directory`. The full feature run also hit the CPQ worker's five-second `CalculationLimit` and the foundation launcher's five-second `ETIMEDOUT`. Those cases passed on main and in the feature's quiet 19-case serial run. This supports an environment/timing explanation; it does not turn the failed full run into a pass.

Initial browser checks caught oversized checkbox rows, the modal's browser-default width, ambiguous heading selectors and a first-load receiving timeout. The fixes reset checkbox geometry, explicitly fill the phone viewport, select the page's level-one heading, and wait for the existing receiving API. A final live-frame comparison corrected the 75 px loading rows and the empty state's applied filter text. The final browser runs above include those fixes. The empty state's Clear the search action now preserves Organisation and Notices.

The first [Engineering CI run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39338126097) failed one existing department-navigation assertion because both the page and its new menu have a People heading. The affected department and shell assertions now target the level-one page heading; their local reruns pass as recorded above. Final-head CI is reported by the PR and is not inferred from those reruns.

No new UI route was introduced, so `studio:sync` was not needed. The API route is registered through the existing People source bindings. No full database, HTTP, compiled-browser or physical-device suite was run locally; their status is not inferred from these focused checks. GitHub CI and independent review remain separate, with current results on the PR. No independent second-model review is claimed.

## Reproduction environment

Windows, locked Node/npm dependencies, stable Chrome through the repository's existing Playwright dependency. The application ran on loopback port 3034. Browser runs used a local config with that base URL, one worker, `en-AU`, 180-second per-test timeout, and desktop (1440 × 900) / mobile (390 × 844, touch enabled) project settings. Individual frame cases set the widths listed below. The normal repository browser configs discover the committed specs for CI; the local config did not change application code.

Private local configuration was supplied directly to the process from outside this worktree. A local helper validated the loopback synthetic database setting and selected `ppo_synthetic_test`; no configuration values or connection strings are retained. The existing `ppo_synthetic` database lacks 0109's notice-preference table and **was not upgraded**. The disposable test database received its normal test setup with existing migrations only.

The first dev launch rejected a node_modules junction under Turbopack's filesystem-root rules. Only the verified junction was removed; `npm ci --ignore-scripts --no-audit --no-fund` installed the unchanged lockfile in this worktree. No package or lockfile change was made.

## Visual comparison

These are contributor inspections, not Dean's visual review. The accepted live frame and the application were inspected at the same dimensions. No source capture was changed. All screenshots below use synthetic fixtures and local fallback icons.

| Application capture | Compared source / observation |
|---|---|
| [Desktop 1440 × 900](register-1440.png) | `1395:150312`: full-bleed layout, 240 px secondary menu, 60 px toolbar, 40 px rows, pinned selection/actions and local horizontal grid scrolling. Shared timestamp includes year/zone; shell badges and icons reflect the real synthetic session. |
| [Tablet 1024 × 900](register-1024.png) | `1395:150835`: compact register retained; shared menu opens as an overlay instead of the drawn 20 px collapsed strip. |
| [Phone 390 × 844](register-390.png) | `1395:151069`: 85 px list rows. P9 removes the older two-row toolbar, moving the first row from y=166 to y=56. |
| [Phone 320 × 844](register-320.png) | No drawn 320 px register. Compact header combines search/filter; no page-level horizontal overflow. This is an adaptation, not a matched reference. |
| [Loading 390 × 844](loading-390.png) | `1395:151245`: six 75 px skeleton rows with 240/200/140 px bars and 8 px gaps, after the P9 header amendment. Shared tokens supply the colours. |
| [Empty 390 × 844](empty-390.png) | `1395:151303`: Hillview Growers / “Prya” applied state, scoped absence wording and Clear the search. Touch button remains 44 px under P8, compared with 40 px in the older state frame. |
| [Error 390 × 844](error-390.png) | `1395:151346`: error surface, no stale list/count, retry; the shared 44 px touch button differs from the older 40 px drawing. |
| [Denied 390 × 844](denied-390.png), [filters 320 × 844](filters-320.png) | No accepted People frame for either composition. Existing state/modal primitives, explicit access boundary and return focus; owner composition review remains pending. |

## Recorded differences and questions

The [page contract](../../../design/development/pages/route-people.md#recorded-gaps-and-open-questions) owns the complete list: tablet/menu breakpoint, undrawn phone filters and 320 px register, selection purpose, saved views, stakeholder context, date format, notice wording, offline/device limits and shell composition. In particular the inherited phone shell has no floating Quick add; Create person remains in the filter panel. Its navigation and badges reflect real synthetic permissions rather than the frame's example counts. These are declared differences, not new design acceptance. Owner review is independent of test results.

## CI repair — phone title typography

At `eba3607a`, the [Application assurance run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39339814578) and [compiled browser run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39339814613) each failed only the new People geometry case in their desktop and mobile browser jobs: expected 85 px, received 86 px. Each desktop suite otherwise passed 502 cases (21 skipped); each mobile suite passed 444 (79 skipped). The two aggregate checks also failed because those browser jobs failed: six failed checks, one underlying assertion.

The accepted live source was rechecked at **PPO - Design**, `1395:151069`, named **People — accepted**, specifically row `1396:355730`. The title top-aligns a 20 px name line and a 16 px preference line. The application had baseline alignment and an inherited 20 px preference line. The correction restores those exact line boxes and top alignment. The 85 px assertion is unchanged; the test now also waits for `document.fonts.ready` and checks the 20/16 px title geometry. No fixed height clips longer content, and no reference image was altered.

An isolated local typography probe used the committed styles and local Roboto file, then Arial, Verdana, serif and monospace fallbacks. Before correction, the preference line was 20 px for every font and the title grew to 21 px with Arial/Verdana. After correction all five measured a 20 px title and 16 px preference line. This isolates the font-metric sensitivity; it is not a substitute for the complete application browser test. The retained screenshots above belong to the original implementation run; the corrected run's captures and results are kept separately in CI.

Source comparison against unchanged main `0ebb26a3` found no People register component, stylesheet or native spec there; this is new PR code. The shared globals, My Work/shell styles and local Roboto font are unchanged between original base `971ac350` and that main. Main was integrated as `205a861`, with the generated status conflict resolved by taking main's generated file and rerunning its generator. The repair changes only the People consumer and its test, plus this documentation trail.

Local application reruns on 20 October were blocked before their geometry assertion: the external shared configuration selects loopback port 5433, which refused the connection. A read-only check of the existing PostgreSQL listener on 5432 rejected the supplied credentials. Neither shared configuration, credentials nor either database was changed. These local browser attempts are failures, not geometry verification. CI uses its own configured `ppo_synthetic_test` setup. A repeated local build and foundation check were stopped under shared-machine memory pressure; they are not additional local passes. The local studio recheck reported zero errors, naming passed and `git diff --check` passed. Owner review remains pending.

### Completed CI evidence at `53fb1a6a`

| Run / job | Result |
|---|---|
| [Application desktop](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39356040652/job/118411082750) | Job passed; full browser suite **503 passed, 21 skipped** in 42.1 minutes. All five People cases passed, including exact 85 px rows and 20/16 px title lines. |
| [Application mobile](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39356040652/job/118411082863) | Job passed; full browser suite **445 passed, 79 skipped** in 48.4 minutes. All five People cases passed. |
| [Compiled mobile](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39356040429/job/118416191750) | Job passed; full browser suite **445 passed, 79 skipped** in 50.9 minutes. All five People cases passed. |
| [Compiled desktop](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39356040429/job/118416191775) | Full browser suite **503 passed, 21 skipped** in 56.9 minutes, including all five People cases. **Job cancelled at its existing 60-minute limit**, so the compiled aggregate failed. This is not a green job claim. |
| Application static, unit and build stages | Studio, lint, typecheck, **950/950 unit tests**, and production build passed in CI. These Linux results are separate from the earlier Windows failures. |
| Other Application lanes | All four PostgreSQL shards, HTTP, Finance, reports, quality/access, performance and diagnostic replay passed. The aggregate was still queued when this record was written. |
| Other workflows | Fifteen passed, including documentation foundation/prototype/naming, development-register integrity, dependency audit, merged-tree, CRM, Engineering, Projects, Estimating, Products, Email/Calendar and quotation workflows. |

GitHub's compiled-desktop annotation states that the job exceeded one hour. The workflow is unchanged from main `0ebb26a3`; its [unchanged-main compiled run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39351793354/job/118401419442) passed 498 desktop cases (21 skipped) in 44.0 minutes. The five additional People cases account for the suite-count difference. No timeout, assertion, test selection or reference was relaxed. A targeted retry of the cancelled desktop job and its dependent gate was requested; the other completed jobs were retained.

Main subsequently advanced to `0909db97` with claim documentation and migration reservations only. Integrating it resolves the generated-status conflict by rebuilding from all fragments. It adds no application, test or workflow change to the repaired source. The current-head checks and any later retry results are reported on [PR #625](https://github.com/deanrfiedler-gif/powerplants-one/pull/625); the table above remains evidence of the exact executed commit, separate from current-head status, owner review and deployment.
