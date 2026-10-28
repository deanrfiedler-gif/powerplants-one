# Native Sales verification evidence

Owner: Dean Fiedler. Code and synthetic evidence are submitted for review. Owner acceptance, merge and deployment are not recorded.

Application source: `23fcb3a4e4fd8b177e03a05702800731f7b28e5a`. Assurance correction: `69c7427878d0373b6aab50659d61ce886907c575`. Base: `6c5e7c4fcbaf05d712a46989faf2cf7cabb8ba72`. [PR #303](https://github.com/deanrfiedler-gif/powerplants-one/pull/303) holds the current head, checks and review status. [Implementation handover](../../../delivery/sales-native-completion-handover.md) records the scope and delivery inventory.

## Actual execution

Windows uses `npm.cmd` and `python -X utf8`; CI uses `npm` and `python3`. `$envFile` below denotes the external disposable Sales environment at `C:/Users/Dean.Fiedler/AppData/Local/Temp/ppo-sales-cr01-cr05-test/test.env`. No credentials are committed. The database is the guarded `ppo_synthetic_test` on loopback port 5546; the application is served in compiled mode at port 3000.

| Command | Observed result |
|---|---|
| `python -X utf8 scripts/check_foundation.py` | Passed: 78 parent requirements, 17 issued sources unchanged |
| `python -X utf8 scripts/check_prototype.py` | Passed: 78 parent dispositions retained |
| `python -X utf8 scripts/check_naming.py` | Passed: project instructions 7,978 characters |
| `npm.cmd run studio:sync`; `npm.cmd run studio:check` | New routes synchronised, discovery guides replaced; check passed with 280 entries, 126 routes and no integrity errors; all review records remain pending |
| `npm.cmd run lint`; `npm.cmd run typecheck`; `npm.cmd run build`; `git diff --check` | Passed on reviewed application source |
| `node --import tsx --test tests/unit/crm-insights.test.ts tests/unit/department-navigation.test.ts tests/unit/shell-navigation.test.ts` | Final focused analytics/navigation proof 12/12 passed; full Linux unit suite at `69c7427` passed 388/388 |
| `node --env-file=$envFile --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/sales-workflows.test.ts` | Windows setup timeout history recorded in the handover; CI at `575ae00` passed all seven Sales cases within CRM/Sales 61/61 and the full database suite 555/555 |
| `node --env-file=$envFile --import tsx --test --test-concurrency=1 --test-timeout=120000 --test-name-pattern='CR05 source changes' tests/database/sales-workflows.test.ts` | Added training/CRM/source-change case: Windows seed setup timed out before assertions. Passed in Linux CI at `69c7427`, together with all eight Sales cases in CRM/Sales 62/62 |
| `node --env-file=$envFile --import tsx --test tests/http/sales-workflows.test.ts` | Revised isolated fixture 1/1 passed; it creates its own work order/visit/report through existing HTTP commands |
| `node --env-file=$envFile node_modules/@playwright/test/cli.js test --config=playwright.compiled.config.ts tests/browser/sales-workflows.spec.ts --no-deps --output=verification-evidence/sales-reviewed --reporter=list` | Final compiled attempt: 7 passed, 1 worklist-readiness failure. Six CR-02/03/05 cases passed across desktop and phone, including long feedback persistence and guarded closure |
| Same browser command with `--grep 'CR01/04' --output=verification-evidence/sales-reviewed-workspace` | Corrected exact-response readiness replay: 2/2 passed. All eight distinct Sales desktop/phone journeys have passing final-application evidence |
| Compiled `crm.spec.ts`, `department-navigation.spec.ts`, `sales-workflows.spec.ts` combined | 26 passed, 11 existing project skips; one timeout occurred in browser creation before a navigation case. The retained CRM workflows passed; no assertion or deadline was weakened |

Retained CRM CI at `575ae00` passed I2 keyboard/long-text 17/17 and actual application/PostgreSQL restart write/verify, including original receipts and shared Activities. Estimating upgrade/restart, Email Calendar, Projects, Engineering, Finance, reporting, demo upgrade, quality/access, focused HTTP and declared-load checks also passed at that checkpoint. The full browser lanes each passed 352 with 60 intentional project skips and nine failures subsequently corrected by the explicit tab/rail, navigation-readiness and Aftercare fixture fixes. The full HTTP lane passed 45/46 before discovering the shared-visit collision; its revised isolated Sales case passed locally. These earlier failures are retained as earlier results, not relabelled as green final-head CI.

The PR check suite is authoritative for current-head CI; a green earlier commit is not used to approve a later one. Required checks and repository review conditions must pass before merge.

## CR05 initial-read investigation — 29 October 2026

This investigation is [PR #738](https://github.com/deanrfiedler-gif/powerplants-one/pull/738), separate from the guide-security correction in #735, under #737 step 3. Both downloaded failure archives match their GitHub SHA-256 digests:

| Head / run | Artifact | SHA-256 | CR05 result |
|---|---|---|---|
| `b9b1455e` / [40650787949](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/40650787949) | 12803489917, original failed attempt | `ac71b4c6af8b0a90fdd0f97ff968b9701caa9b223d0b6beb74a0b370224747e2` | 36.696 s; Customer review absent at line 358 |
| `429413af` / [40693504129](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/40693504129) | 12823268962 | `1b1236d97b9ef61f1f4cd9284d9af4ba3337ad39c70592ab264079058907e1e1` | 36.905 s; same assertion |

The screenshot and accessibility snapshot in **both** archives show `Loading aftercare review…` as the main content. Neither shows the workspace or a displayed resource error. The shell and demonstration identity are present; the options-loading notice is absent. The prior HTTP 200/body assertions succeeded, but they do not establish that the hook accepted that response, or that the response belonged to the deliberately held request: the waiter matches any GET to the record path.

The archives contain neither trace ZIPs nor generated Playwright HTML reports; `.github/workflows/application.yml` deliberately excludes them because raw traces can contain session material. In the latest archive, the main server's `process-18407.jsonl` reaches its diagnostic cap at 13:51:03.837 UTC, before CR05 starts at 14:21:30.304 UTC on 28 October. Those logs cannot establish the failed test's request order. Overlapping reads, a response from a disposed effect, and delayed client consumption remain hypotheses; a loading snapshot alone does not select one. No rendering defect or resource-hook defect is established.

The existing test now records a bounded, content-free `cr05-initial-read.json` around its initial read and original tab assertion. It correlates numbered browser requests/responses/completions, the intercepted route's upstream read/delay/fulfilment, the response matched by the test, window-focus/visibility events, page-error occurrence and loading/tab/error-state transitions. It records no URL, header, cookie, identity, body, record content or error message. The artifact is retained on passes as well as failures and uses the existing upload paths. The six-second hold, latest-response application semantics, five-second assertion, permissions and error handling are unchanged. This is diagnostic instrumentation, not a correction or a regression pass.

Local ESLint and TypeScript checks pass. Browser reproduction could not start: the standard Chrome installer fails on this container's UID/group operations; a separately extracted stable Chrome 156.0.8078.73 exits with SIGSEGV before opening a page under Playwright. Node is 24.22.1, npm 11.9.0 and repository Playwright 1.64.1; this is not a successful run of the pinned CI environment. No local browser, database or HTTP pass is claimed. Exact-head CI and captured request sequencing remain required before choosing a correction.

## Latest completed Sales CI checkpoint

At `69c7427`, [CRM/Sales assurance](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35935637580/job/107431925953) passed 388 units, 62 database cases (all eight Sales cases), 31 browser cases with two existing project skips, 17 retained I2 cases, and actual application/PostgreSQL restart verification. This includes training evidence, source change, CRM Unknown/Returned/Accepted receiving, receipt revocation and all eight new desktop/phone Sales journeys. The [full compiled application lane](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35935637612/job/107431926324) then passed 374 browser cases with 61 existing project skips. Header/board visual checks, documentation, register, Email, Leads, Engineering, Projects, reports, demo and focused quality/access/HTTP jobs also passed. Full application/database/HTTP jobs remain independently tracked; use the PR for the final exact-head result.

Current-main Service Job Pack PR #304 was subsequently incorporated at `b28242c`, through base `9e49a57`. No Sales runtime file changed in that merge. The merged local production build and register check passed again: 280 entries, 126 routes, 25 component records and no integrity errors. Captures retain their original source provenance; merging another domain does not re-date the visual inspection or grant acceptance.

The completed compiled CI log identifies its tested merge as `c379a7c11fc0e6b8ece337cb5997e8c6bb7d9a8b` (`69c7427` into `9e49a57`). That object was fetched and compared with `b28242c`: every difference is documentation or retained images; the application, migrations, scripts and tests are identical. This establishes the tested runtime source while keeping the current PR-head check gate separate.

The separate broad application browser lane at that checkpoint passed 373 cases, skipped 61 and failed one mobile permission-revocation assertion because its generic error locator matched both the parent CRM refusal and a child shared-data refusal. The correction identifies the authoritative `This record is unavailable.` alert explicitly. All private-title/form removal, late-response rejection and unchanged-Activity assertions are retained; no test deadline or permission rule changes.

The correction is `5c0493b`. Its local compiled replay passed 2/2 (desktop and phone): `node --env-file=$envFile node_modules/@playwright/test/cli.js test --config=playwright.compiled.config.ts tests/browser/crm.spec.ts --grep 'CA-06/10 real CRM permission revocation' --no-deps --output=verification-evidence/sales-revocation-final --reporter=list`. This new test-only commit is separate from the identical-runtime comparison above; the full 373/1 CI attempt remains recorded as a failed attempt.

## Native Sales restart comparison

The [retained comparison](restart-verification.json) records a completed local application and PostgreSQL restart at merged application source `b28242c`. Before and after the restart, authorised HTTP reads returned identical record/history/source-basis data for all seven Sales records and the same 48 original receipts. Canonical hashes also matched all five handovers, two aftercare records, 48 append-only events, two immutable Won obligations and 30 shared Activities, including JSON-normalised timestamps. Accepted Estimating/Won and Closed aftercare states were prerequisites of the comparison.

The local inspection helper was run as `node --env-file=$envFile --import tsx tmp/sales-restart-snapshot.ts write`, then the identified Sales application process was stopped and the dedicated port-5546 PostgreSQL cluster restarted with `pg_ctl restart -m fast -w`. The compiled application was relaunched with `node --env-file=$envFile --import tsx scripts/local-server.ts --compiled`. After its ready message, the same helper's `verify` phase asserted complete equality. Its database-name/port guard confines the procedure to this disposable synthetic cluster. This is executed persistence evidence, not production qualification or owner acceptance.

## Inspected captures and deliberate differences

The [manifest](capture-manifest.json) contains 34 unmodified PNG files, all individually inspected: 20 native scope/width captures; eight worklist/intake captures; five issued desktop references; and one CSS-zoom reflow capture. It records SHA-256 hashes and exact source provenance. No traces, session storage, cookies or document bytes are committed. Runtime: Node 24.21.0, PostgreSQL 16, Playwright 1.63.0, Chrome 154.0.8037.58, `en-AU` locale.

| Scope | Native inspection and reference comparison |
|---|---|
| CR-01 | [Desktop](cr01-1440.png), [1024](cr01-1024.png), [phone](cr01-390.png), [320](cr01-320.png), [reference](cr01-reference-1440.png). Eight native tabs; next customer action and objective lead the Overview. Existing owner/outcome controls, real stage permissions and saved source facts replace sample reference claims. No invented probability or second shell |
| CR-04 | [Desktop](cr04-1440.png), [1024](cr04-1024.png), [phone](cr04-390.png), [320](cr04-320.png), [reference](cr04-reference-1440.png). Insights are a collapsible, bounded-height disclosure above the retained worklist. Current-filter population, denominator, as-at, unknown amounts and unweighted basis stay explicit; phone lanes and tab strips scroll within their existing containers |
| CR-02 | [Detail](cr02-1440.png), [1024](cr02-1024.png), [phone](cr02-390.png), [320](cr02-320.png), [Sales worklist](cr02-worklist-1440.png), [Intake](cr02-intake-1440.png), [reference](cr02-reference-1440.png). Shared two-column brief becomes one column on phones. Three focused native tabs and a separate receiving queue carry frozen server revisions; sample standalone metrics, shell and unsourced readiness claims are not copied |
| CR-03 | [Detail](cr03-1440.png), [1024](cr03-1024.png), [phone](cr03-390.png), [320](cr03-320.png), [worklist](cr03-worklist-1440.png), [reference](cr03-reference-1440.png). Exact corrected revision and receiver decision are visible. Unavailable quotation/conversion sources and open release prerequisites remain explicit; the native workflow does not copy mock conversion authority from the six-tab demonstration |
| CR-05 | [Detail](cr05-1440.png), [1024](cr05-1024.png), [phone](cr05-390.png), [320](cr05-320.png), [worklist](cr05-worklist-1440.png), [phone worklist](cr05-worklist-320.png), [reference](cr05-reference-1440.png). Worklist and five-tab detail use native cards and source-owned customer context. Eligible issued Service reports bound this increment; no fabricated agreement/order/delivered-project source or default date is shown |

Keyboard evidence includes arrow-key selection in the shared tabs, native expandable commercial preparation, long feedback saved without the old 200-character limit, and a visibly focused skip link in [CSS zoom 2](cr05-200-percent-css-zoom.png). The zoom capture is a CSS reflow check, not a native browser-zoom or physical-device claim. Retained CRM cases exercise dialog focus/recovery and denied/loading/conflict/uncertain states. Geometry assertions cover page overflow and header containment. At 320 px the breadcrumb truncates visually, while full record context remains on the page; tab and stage strips retain labelled keyboard controls.

The comparison found and corrected inherited phone-header grid specificity, Overview hierarchy and narrative limits. The native composition intentionally follows current shell/components and server truth rather than reproducing standalone demonstration shells. Physical touch devices, assistive technology and owner visual acceptance remain separate review items. No visual baseline fingerprint was marked accepted.
