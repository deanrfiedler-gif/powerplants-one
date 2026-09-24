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

## Latest completed Sales CI checkpoint

At `69c7427`, [CRM/Sales assurance](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35935637580/job/107431925953) passed 388 units, 62 database cases (all eight Sales cases), 31 browser cases with two existing project skips, 17 retained I2 cases, and actual application/PostgreSQL restart verification. This includes training evidence, source change, CRM Unknown/Returned/Accepted receiving, receipt revocation and all eight new desktop/phone Sales journeys. Header/board visual checks, documentation, register, Email, Leads, Engineering, Projects, reports, demo and focused quality/access/HTTP jobs also passed. Full application/database/HTTP and compiled-browser jobs were still running when this evidence was published; use the PR for the final exact-head result.

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
