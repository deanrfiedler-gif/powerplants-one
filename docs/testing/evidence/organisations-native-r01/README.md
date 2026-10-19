# Organisations CS-01 native evidence

Owner: Dean Fiedler. Status: native implementation and local functional verification delivered for review. Owner/device review, baseline acceptance, CI, merge and deployment remain separate.

Source: [accepted Organisations D1–D7/Q1–Q4](../../../decisions/organisations-figma-design.md), [icon-free r01 captures](../../../reference/ui/customers/organisations-design-r01/README.md). Implementation: [CS-01](../../../decisions/organisations-figma-implementation.md). PR: #604. Named Figma version remains pending in the source. No live Figma calls or writes.

The isolated worktree uses its own loopback app and PostgreSQL 16 `ppo_synthetic_test` cluster, with `max_locks_per_transaction=1024`. No shared-main service/database is used. The Font Awesome Kit is unconfigured; captures show local fallback glyphs. Runtime content is authorised synthetic fixture data, not the Figma story.

## Capture pairing

The 26 captures use compiled application commit `30f08b68`; their hashes, dimensions and build ID are in [execution.json](execution.json). Controlled loading/unavailable/denied captures use fault injection over the actual host; all other states use real source reads. The source images remain byte-identical. The pairing is a manual visual comparison, not a pixel-diff pass or owner acceptance.

| Accepted r01 capture | Native capture | Comparison and adaptation |
|---|---|---|
| 01 · Register · 1440 × 900 | [Register](register-1440.png) | Adapted. Shared menu/grid structure; actual source identities, local search and 44 px minimum controls expand the drawn geometry. |
| 02 · Overview · 1440 × 1234 | [Overview](record-1440.png) | Adapted. Shared header, source bar, facts and seven tabs; real records and source limitations replace the design story. |
| 03 · Sales · 1440 × 1078 | [Sales](sales-1440.png) | Adapted. Unified table and type/status controls; estimates and Draft revisions are identified separately and retain Partial. The clean synthetic database has no matching Sales rows in this record; no design-story rows are inserted. |
| 04 · Quotations / Status menu · 1440 × 900 | [Filtered Sales](sales-filtered-1440.png) | Adapted. Same filter/menu state; real empty/partial source population, no invented quotation lifecycle or totals. |
| 05 · Create · 1440 × 900 | [Create](create-1440.png) | Adapted. Three form sections and duplicate check; existing required reason, company/owner labels and Internal note visibility retained. Existing shell family navigation adds height. |
| 06 · Tablet register · 1024 × 900 | [Tablet](register-1024.png) | Adapted. Shared collapsed secondary menu; current primary rail retained, grid scrolls inside its surface. |
| 07 · Phone list · 390 × 844 | [Phone list](register-390.png) | Adapted. Real long names/IDs wrap; additional labelled snapshot action and local search increase toolbar height. |
| 08 · Phone overview · 390 × 844 | [Phone overview](record-390.png) | Adapted. Four leading tabs, permitted contact and sticky follow-up; secondary handovers remain in the actions menu. |
| 09 · Small phone overview · 320 × 844 | [320 overview](record-320.png) | Adapted. Wrapped header and horizontally scrollable tab strip; real contact details replace the design story. |
| 10 · Four state frames, each 390 × 844 | [Loading](loading-390.png), [empty](empty-390.png), [unavailable](unavailable-390.png), [Service unavailable](service-unavailable-390.png) | Adapted. Shared loading/error presentation; failed list removes rows/counts and gives one recovery action; failed Service retains independently read sources. |

Additional undrawn states include the 1280 and 320 register, 1024/1280 record, 403 denied list, desktop/phone snapshot, create at tablet/phone widths, long identity, original-operation recovery and a 720 px reflow check. These use shared patterns and have no separate accepted capture.

## Executed checks

| Check | Result |
|---|---|
| `npm ci --engine-strict=false` after merging `70450f2e` | Passed, 238 packages. Four high advisories also present in the unmodified-main install; no audit fix or dependency change. Node 24.22.0 / npm 11.19.0. |
| `npm run test:unit` | 933 tests: 927 passed, six failed in the initial concurrent run. See the baseline comparison below. |
| Serial replay of `cpq-packages`, `document-store`, `foundation`, `recovery`, `organisation-return` unit files | 13 tests: ten passed; only the three baseline-reproduced Windows filesystem failures remain. |
| Same four pre-existing unit files on detached unmodified `main` at `70450f2e` | 12 tests: nine passed, the same three filesystem failures. No source edits, database or application server in that worktree. |
| `node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/organisation-register.test.ts` | Three passed in 178.6 s, followed by a clean reset. Covers signed scope and paging, all supported sorts, population counts/options, working company, revoked sources, current/historical site roles and unknown/restricted states. |
| `node .../cli.js test --config=playwright.crm-ui.config.ts --project=desktop --grep 'each adopted module retains'` | Passed. Corrects the first CI run's duplicate register/record host key and stale record layout metadata. |
| `npm run build` with `NODE_OPTIONS=--max-old-space-size=8192` | Passed on application commit `30f08b68`, including TypeScript and production route generation. |
| `npm run typecheck`, `npm run lint`, `npm run studio:check` | **Passed.** Full lint passed before the final empty-work correction; `node node_modules/eslint/bin/eslint.js src/components/customer-workspace.tsx tests/browser/organisations-native.spec.ts` passed on that correction. Typecheck and studio were repeated on final source. Studio recorded 364 pages, 48 components, 21 runnable examples, 48 component reviews pending, 336 unreviewed pages and 28 stale. These are not promoted by this PR. |
| `python scripts/check_foundation.py` | **Passed**, including the final status fragment, document links and evidence files; no errors. Documentation assurance only. |
| `python scripts/check_naming.py` | **Passed** on the final documents and register; no errors. |
| `node scripts/design-baseline-check.mjs` | **Passed** after final source changes: six retained baselines, 24 captures, 41 shared token names and three recorded legacy divergences. |
| `python scripts/build-ui-sequence.py --check` | **Passed** after regeneration. Status and decisions-index outputs were regenerated from 34 fragments. |
| `node --env-file=.env.local --import tsx --test tests/http/organisation-register.test.ts` | **One passed** against compiled commit `3f1604d6` in 1.46 s; the later tab-order-only change does not touch the endpoint. |
| Final compiled native browser replay and evidence, commands below | **Seven passed** in 33.5s on `30f08b68`, then **one touch-phone replay passed** in 6.4s. All five widths, desktop/phone tab order, URL filters/Sales, snapshot focus, create persistence, fault states, saved preferences, empty open-work and original-operation recovery passed. 26 captures refreshed; manual inspection covers retained compositions and corrected states. |
| Selected existing browser regressions, command below | **24 passed** across desktop and touch-phone projects in 2.8 minutes on compiled commit `3f1604d6`. Covers saved directories, tab URL/source links, contact/site creation, Lead lost-response recovery, validation, leave protection, long Activity context, Sites hierarchy and shell navigation. The later desktop/phone tab-order correction is rechecked by the native proof. |

The unit failures reproduced on unmodified `main` are the two P06 private-document-store cases and P12 private recovery paths on Windows. The initial CPQ workload timing failure and two foundation launch/configuration timeouts passed on the serial feature replay and unmodified main. They are not waived tests. An initial database replay during compilation exceeded 120 s and was stopped; the complete sequential replay above passed. The first build was stopped in TypeScript near the default heap limit; subsequent 8 GB-heap builds passed. No existing test deadline, fixture date, permission rule or assertion was weakened.

Earlier browser replays exposed the hidden register heading, an unlabelled saved-view select, the phone Account development handover and outdated D5/D7 selectors; these were corrected. The initial selected regression replay was 19/24: two Lead cases used a hard-coded port 3000 Origin, two Sites cases used an incorrect identity prefix in the new selector, and one phone Activity selector read the preceding panel before URL navigation completed. The final replay retains the original deadlines and exact checks, using the configured Origin, actual `SYN-PPO-SITE-` identity and named Activity panel. The final visual pass also removed duplicate error recovery controls and inherited form input margins.

The full fifteen-family `quality-states` matrix requires its report/pack fixtures. Its CS-01 endpoint and empty-state assertion were updated but the full matrix was **not executed locally** in the initial increment. The [focused integrated quality and access CI job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39186201199/job/117849297769) subsequently passed on `8a7db7be`, including that matrix. This does not imply the other CI jobs passed.

An earlier pushed-head CI run reported the [ES-08 phone bounding-box timeout](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39184471775/job/117843990233) named among the brief's known flakes: `specialist-workbench.spec.ts:576`, waiting for the Standard screen cloth dialog. That spec and its deadlines are unchanged. It passed in the subsequent `8a7db7be` run. This is not a claimed unmodified-main reproduction of that CI timeout.

## CI correction follow-up

This section records the #604 correction at `785aa259` and its subsequent local verification. The comparison JSON retains that source identity; it is not a benchmark of the final #607 implementation. The integration retains this evidence and the ten-reader regression while using #607's separately validated register query and browser synchronisation. Its transaction-local JIT setting and bounded duplicate matching are recorded in the [integration status](../../../status/2026-10-19-organisations-ci-repair.md).

The completed `8a7db7be` CI run reported four concrete failure paths:

- The [P11 load job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39186201199/job/117849297669) exceeded its 25-minute step and 30-minute job limits. Its logs contain register statement timeouts at the declared load. The sampler also awaited the obsolete `/api/v1/crm/directory` response. It now observes `/api/v1/customers/register`, retaining every original profile, wave, concurrent user, network rule, success assertion and deadline.
- The [mobile intake journey](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39186201199/job/117849297742) inspected the old record while the Stakeholders handover was still navigating. D3/D5 correctly present the primary contact in both record facts and Overview. The test now confirms the destination URL and Stakeholders content before asserting the exact contact handover.
- The [compiled mobile](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39186201261/job/117849231611) and [compiled desktop](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39186201261/job/117849231672) Sales checks found the actual workspace still loading. Record navigation now observes and asserts the original successful workspace GET before testing its tabs. Existing tab assertions and test/expectation deadlines are unchanged.
- The [desktop notification journey](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39186201199/job/117849297788) still selected `.crm-directory-table` on Customers. It now selects the D1 register's organisation link; the bell, notification state, source guard and preference assertions remain intact.

The register correction materialises each permitted lower-case name once and groups related source reads within the existing SQL snapshot. It preserves all source visibility predicates, null-versus-zero states, matching semantics, nine sorts and scoped signed pagination. No migration, index, dependency, grant or timeout change is introduced.

The [local load comparison](ci-load-comparison.json) uses the existing `qualityLoadFixture`: 1,000 organisations, 5,000 assets and 10,000 appointments in the synthetic workspace. On the same retained fixture, ten original reads completed in 3,193 ms as a group; ten corrected reads completed in 859 ms, with identical reported counts and 25 rows per page. All original reads also passed locally, so this is **not** a local reproduction of the CI timeout or a production latency claim. It is a bounded before/after observation; the unchanged CI performance procedure remains the full gate. A new database regression exercises ten concurrent readers at 1,000 organisations under the normal pool/statement deadlines, checking permitted counts, owner options and signed continuation.

The first local database replay was interrupted when its isolated PostgreSQL process stopped; its timeout and connection failures are retained in the ignored log and are not counted as passing proof. The replay uses the restarted isolated cluster, never Dean's database.

| Follow-up check | Executed result |
|---|---|
| Full `tests/database/organisation-register.test.ts`, serial, original 120-second test deadline | **Four passed** in 274.2 s. Includes all original authority/paging/source assertions and the new ten-reader load proof. |
| Final selected ten-reader load proof after adding exact duplicate-count and internal-field assertions | **One passed** in 136.7 s overall; the individual test took 103.1 s, within its unchanged deadline. |
| Focused `organisation-return`, `quality-comparison-profile`, `quality-network-conditioning`, `conversations-context` unit files | **Nine passed** in 8.8 s. The last file covers the newly integrated main change. The earlier Windows-only full-unit limits above remain accurately recorded. |
| Full typecheck, lint and production build | **Passed** on the integrated application tree at `78a0fab5` (main `47e47361` plus correction `785aa259`). Build uses the same 8 GB Node heap. Targeted lint also passed on the subsequent test-only assertion/selector corrections. |
| Compiled native CS-01 and notification journeys, both desktop and mobile projects | **16 passed** in the initial 18-test replay. The two intake failures exposed the newly added wait targeting a hidden eyebrow; it was corrected to the visible Relationship views tab list, retaining the destination URL and exact contact-link checks. |
| Corrected intake journey, both projects | **Two passed** in 44.7 s. Together with the preceding replay, all 18 selected journeys pass. No application rebuild was needed for this test-selector correction. |
| `tests/http/organisation-register.test.ts` against the compiled application | **One passed** in 1.75 s, retaining signed-scope, invalid-query and restricted-source checks. |
| `npm run studio:check` | **Passed**: 364 pages, 48 components, 21 runnable examples; 48 component reviews pending, 336 unreviewed pages, 28 stale. No review state promoted. |
| `node scripts/design-baseline-check.mjs` | **Passed**: six retained baselines, 24 captures, 41 shared token names, three documented divergences. |
| Naming and generated UI sequence checks | **Passed**: 728 document records, 565 metadata records, 399 Git masters; 364 sequence entries. |

The compiled browser replay uses the command below with `PPO_CS01_EVIDENCE` unset, preserving the 26 earlier visual captures and their manifest. The first replay raced the separately starting local server and logged an attempted second bind; the intended compiled server handled the tests. The corrected intake replay reused that server without a startup error. Fresh CI on the pushed correction remains the final execution gate; these local results do not pre-claim it.

```powershell
node --env-file=.env.local node_modules/@playwright/test/cli.js test --config=playwright.compiled.config.ts --no-deps tests/browser/organisations-native.spec.ts tests/browser/intake.spec.ts tests/browser/sh-platform.spec.ts --grep 'CS01|P03 customer|SH notification' --reporter=list
node --env-file=.env.local node_modules/@playwright/test/cli.js test --config=playwright.compiled.config.ts --no-deps tests/browser/intake.spec.ts --grep 'P03 customer' --reporter=list
```

### Browser commands

The ignored local environment selects the isolated port; no shared server is used. `--no-deps` omits route warm-up because the compiled server is already running; repository project and assertion deadlines are unchanged. The evidence environment variable is removed before regression tests so only CS-01 captures enter this folder.

```powershell
$env:PPO_CS01_EVIDENCE='docs/testing/evidence/organisations-native-r01'
node --env-file=.env.local node_modules/@playwright/test/cli.js test --config=playwright.compiled.config.ts --no-deps --project=desktop-chromium tests/browser/organisations-native.spec.ts --reporter=list
node --env-file=.env.local node_modules/@playwright/test/cli.js test --config=playwright.compiled.config.ts --no-deps --project=mobile-chromium tests/browser/organisations-native.spec.ts --grep 'phone snapshot returns' --reporter=list
Remove-Item Env:PPO_CS01_EVIDENCE
node --env-file=.env.local node_modules/@playwright/test/cli.js test --config=playwright.compiled.config.ts --no-deps tests/browser/directory-navigation.spec.ts tests/browser/crm-refinements.spec.ts tests/browser/customer-location.spec.ts tests/browser/intake.spec.ts tests/browser/navigation-safety.spec.ts tests/browser/shell-loading.spec.ts tests/browser/leads.spec.ts tests/browser/quality.spec.ts tests/browser/crm-i2.spec.ts tests/browser/mobile-crm.spec.ts --grep 'directory record links|desktop directory tables|CS01 source tabs|P03 customer|P03 unavailable|F42 /customers/new|desktop and phone preserve exact shell|LC-12 creates a customer|P11 PT-27/29 shared validation|CA-02/05/13 I2 pagination|CA-13 shared brand|organisation summary opens' --reporter=list
```

## Known adaptations for review

- The existing shell owns header/search/department navigation. Register search is an additional local control. 44 px controls accommodate touch; rows wrap real long identifiers.
- Create retains the shell's family navigation and the command's required capture reason. Those make it taller than the source; input spacing follows the form composition and the footer remains reachable. Similar-name candidates are not ranked as a new matching rule.
- Open service remains Unknown. Work-order status does not establish closure; no combined request/order/visit calculation is invented.
- Existing Customer 360 quotations include saved estimates and Draft revisions, not a complete issued revision history. Rows identify their kind; unknown lifecycle is excluded from open/closed filters with an explanation. Financial amounts without a verified basis are omitted.
- Visits and generic customer documents have no connected customer read here; handover remains explicit. Source Partial is retained.
- Last-change author, record position and readiness are omitted or unknown. Current site roles and permitted people are actual reads. Lead selection retains explicit LC-12 review/save. Notes retain Internal visibility.
- The old Customer 360 implementation still uses bounded per-record domain authorisation reads; this change does not claim to eliminate that inherited N+1 path. The new register is one SQL snapshot with bounded signed pages.
- Search, filters, view and sort survive return through the URL. Selection, page cursor trail and scroll position are transient. Legacy saved preferences accept only their supported criteria; additional filters remain in the URL.

All ten retained compositions have native counterparts. The table lists the remaining visual/content differences for owner review; it does not label adapted layouts as pixel matches. No owner, physical-device, screen-reader or true 200% zoom acceptance is inferred. The additional 720 px capture checks reflow only.
