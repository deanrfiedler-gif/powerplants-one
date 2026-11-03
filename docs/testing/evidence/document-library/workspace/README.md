# Document library native workspace evidence

Owner: Dean Fiedler. PR #706, scope DK-01/DK-02. This is developer execution evidence, not independent visual review, owner approval or deployment.

## Source and comparison

Accepted input: PPO - Design, page `744:2609`, named version **Document library — accepted**, with the phone-header amendment. Live register, record, phone, 320 px, state-board, registration and review-dialog frames were read on 31 October 2026. Retained icon-free [source captures](../../../../reference/ui/document-library/document-library-figma-r01/README.md) remain unchanged.

The application screenshots below use synthetic response fixtures in the real application shell, reviewed Chrome 156.0.8078.80 and the compiled local server on port 3476. Font Awesome network requests are blocked; local fallback glyphs are used. They do not prove a database-backed browser journey. Native database and HTTP proofs are separate below.

| Width | Register | Exact record |
|---|---|---|
| 1440 | [Register](register-1440.png) | [Record](record-1440.png) |
| 1024 | [Register](register-1024.png) | [Record](record-1024.png) |
| 390 | [Register](register-390.png) | [Record](record-390.png) |
| 320 | [Register](register-320.png) | [Record](record-320.png) |

[Historical unavailable content at 320 px](record-unavailable-320.png) verifies that exact content is not substituted. The developer comparison corrected unstyled menu rows, toolbar sizing and the phone action bar overlapping department navigation. These captures use a different synthetic review state from the accepted reviewed example; no design sample totals are hard-coded.

## Behaviour and adaptations

- Shared secondary menu, RegisterTable, sort headers, Button, WorklistMenu/Panel, Field, ReadState, RecordTabs, RecordIdentity and ShellIcon are reused. Component specifications are unchanged.
- Record Previous/Next and the compact phone position use a freshly permitted result window and preserve the return filters. Position says how many are shown, never a total.
- Number/Updated sorting implements the accepted Q2; controlled UI types implement Q5 while legacy free-text types remain readable.
- Load 25 more rechecks the displayed window. Register loading/failure clears old rows and selections; denied reads expose no retained detail. No result totals are claimed.
- Independent review, finding response/acceptance, historical source context and exact link retirement retain backend authority. Native PDFs download; job packs also open their exact issued-pack page.
- Unknown command results retain the same body and operation ID for retry and block editing/closing. Dirty-navigation protection is reused. Browser termination is not persistent draft storage.
- The phone record hides the department tab bar while its record actions occupy the bottom edge. Context follows the main view and the tab list scrolls horizontally.

## Validation after Claude review

The [execution summary](execution.json) records application source `2ae0b19796f886dba0a827db1aea050aeb941678`. The [earlier execution](execution-before-review.json) retains the prior full-unit/main-control results; it is not a claim that those suites were repeated on this head.

- Final compiled build and its TypeScript check passed. Focused lint, studio, foundation, status sources and 25 focused library/navigation units passed.
- Final compiled fixture browser: **6/6 passed**, at 1440/1024/390/320 px. This covers unchanged uncertain retries, denied refresh, independent finding acceptance, exact historical links, unavailable content, growing-window refresh and focus, snapshot Escape/return, Previous/Next, strict registration/revision payloads, Find-field Enter prevention, paged/off-page labels, retained filter focus and selected record tabs, and earlier-link assessment.
- Native compiled HTTP: **2/2 passed**, including registration-purpose choices, read-only owner refusal, sorted register, exact revisions/download headers and native lifecycle commands.
- Native database: **11/14 passed** in the full run. DK-B02 and DK-B03 timed out during migration setup; DK-B10 still expected random UUID order. All three cases passed on the unchanged main archive and then passed on this branch after the chronology assertion was corrected. This is a full run plus three focused reruns, not a clean full-suite result. The two new UI-read database cases passed in the full run, including chronological/signed/legacy continuation, owner refusal, registration scopes and selected labels.

The unchanged control is `6e939bf0`; `src`, `scripts` and `db` have no differences from current main `1402c87b`. The final screenshots were compared with the retained accepted captures. Developer comparison identified and corrected clipped toolbar labels. Shared fallback icons are used; the browser blocks Font Awesome network requests. This does not constitute independent visual acceptance.

At that execution, the complete native browser journey and 200% zoom were not run; the supplemental proof below closes those two gaps. Other module database/HTTP/browser suites and a manual screen-reader audit remain unrun. The full unit suite was not repeated after these scoped review fixes; its previous baseline failures remain in the earlier execution record. GitHub CI was still queued/pending and fresh Claude review is required for the pushed head.

The isolated PostgreSQL 16.15 cluster uses only `ppo_synthetic_test` on port 55476; the compiled application uses port 3476. No migration, capability, grant, dependency, operational data or external integration was introduced. Independent review, owner acceptance and deployment remain pending.

## Native browser continuation — 31 October 2026

The [supplemental execution manifest](native-execution.json) records three passing native browser tests against the unchanged compiled application at `c2b6ec405f10db7eecf67327821002a599d82cc0`. `tests/library-browser/library-native.spec.ts` (originally `tests/browser/library-native.spec.ts` in that historical manifest) calls the real application and PostgreSQL database: no library command or read is fulfilled with a response fixture. The only business-response fault injection lets a real revision commit before dropping delivery of that response. External Font Awesome requests are blocked for repository-safe captures.

- Registration, finding ownership/response/independent acceptance, independent review, a declared site link and a successor revision complete through the panels. The registrar cannot review or accept their own finding response. The successor starts Unreviewed with no inherited findings; r01 retains its Reviewed decision, closed finding and exact original download.
- Only the test-created original source envelope is removed after checking its document, operation, revision and text. Historical download then returns `ExactDocumentUnavailable`, the UI removes Download r01, and the recovery panel restores only the matching original. The successor still downloads its different bytes. Withdrawal retains the original; another-company identity cannot read its record or download.
- A concurrent link command makes an open revision form stale. The server refuses its save with 409 and the form retains entered text. A later revision commits before the browser loses its response; retry sends the unchanged body and operation ID, returns the original receipt and leaves exactly two revisions. Pending controls prevent edits or cancellation.
- At 320 px, keyboard arrows/Home/End select and focus record tabs. Enter opens the snapshot and Escape restores focus to its trigger. Root horizontal overflow checks pass. Chrome's own 200% setting produces a 720 CSS-pixel layout in a 1440-pixel viewport, with devicePixelRatio 2; register/record reflow and keyboard tab movement pass. Zoom captures use the physical viewport because a full-page CSS clip would crop this zoomed image.

| Native state | Capture |
|---|---|
| Historical unavailable content, 320 px | [Unavailable r01](native-historical-unavailable-320.png) |
| Exact successor, 320 px | [Record](native-record-320.png) |
| Keyboard-opened snapshot, 320 px | [Snapshot](native-snapshot-320.png) |
| Real Chrome 200% zoom | [Register](native-register-zoom200.png), [record](native-record-zoom200.png) |

Developer comparison used the retained accepted phone register, phone record and 320 px unavailable-content references, alongside the desktop comparison above. The captures retain the current card/header density, eligibility placement, unavailable state, bottom actions and snapshot flow for visual review. Synthetic titles, chronology and review state differ from the design examples. Reflow and functional checks pass; spacing and composition still require independent visual review, and no pixel-equivalence or owner acceptance is claimed.

The browser proof runs on a separate loopback PostgreSQL cluster on port 55477, with only `ppo_synthetic_test`; the compiled application uses port 3476. Initial attempts exposed an unseeded/shared test database and use of the wrong local launcher, followed by harness corrections for navigation-time response capture, strict command fields and phone accessible names. They are not application regressions. The final suite uses the supported `scripts/local-server.ts --compiled` launcher and passes all three tests without application changes. Existing backend/restart evidence is retained separately, without claiming a new complete database-suite run.

To repeat on a dedicated disposable database, configure `.env.local`, run the repository build/migrate/seed procedures, then run `node --env-file=.env.local node_modules/@playwright/test/cli.js test --config playwright.library.config.ts`. The configuration starts the compiled loopback launcher or reuses an existing local server. The fixture grants synthetic test identities document permissions and deliberately removes/restores only its own generated source file; do not point it at another concurrent test run's database.

CI, fresh exact-head cross-model review, manual screen-reader review and owner visual/workflow acceptance remain separate review items. No merge or deployment is performed by this continuation.

## Native test collection isolation — 1 November 2026

The native spec now lives in `tests/library-browser`, selected by the existing `playwright.library.config.ts`. Ordinary Application and compiled browser discovery stays in `tests/browser` and no longer imports or executes this native fixture. This is suite isolation, not a skipped assertion: all three journeys remain in the dedicated native configuration, with their existing assertions and deadlines. The `ppo_synthetic_test` guard now runs first in `beforeAll`, before `librarySetup` creates sessions or grants. The dedicated configuration still requires explicit local synthetic environment configuration.

This addresses High finding 1 in [Claude’s #706 review](https://github.com/deanrfiedler-gif/powerplants-one/pull/706#pullrequestreview-5721514480). The source-bound historical manifest and capture bytes are unchanged. Collection checks are distinct from executing the browser, database or acceptance journeys; other review findings remain open.


## Review correction execution — 1 November 2026

The corrections restore the accepted Revisions table and selected-revision evidence panel, Links table and server status filters, and readable History summaries. Successor saves and Open current revision preserve the originating list context. Applied filters remain visible on tablet; Reset preserves view/sort and clears an unsubmitted search. Site-only registrars must choose their permitted site before Owner. Unavailable originals lead Overview with an explicit warning and use Recover original text as the primary authorised phone action. Shared components and source/target permissions remain authoritative.

The compact toolbar keeps quick customer/site/owner choices; Find/paging and Type use Filters, with an applied indicator. This bounded adaptation is declared in the design decision. Partial pages supply no filter totals. History preserves event/review evidence while resolving current permitted actor and target display labels. These are implementation claims, separate from visual or workflow acceptance.

The database run started at `1eec23654442d551ae8dfebb55b1003435601395`; the backend, scripts and database-test sources did not change during that run. It passed **14/16** in **3799.71 seconds**. DK-B01 stopped in the unchanged seed's `ppo.site_timezone` check (`pg_timezone_names`, statement timeout) before library assertions. DK-UI04 reached a new fixture error: its Site grant omitted the required `site_id` companion. The fixture correction is `98edd480`; no permission definition or application guard changed. Both affected cases then passed on the branch (**2/2**, 268.14 seconds). The original lifecycle case also passed on an unmodified `26deea85` main archive (**1/1**, 189.82 seconds). That control does not reproduce the initial timeout. It is a full run plus focused reruns, not a clean sixteen-case pass.

Passed coverage includes permitted sorting/continuations beyond one page, native source restrictions, exact historical bytes, missing-byte recovery, independent reviews/findings, stale and changed commands, storage success followed by database rollback, original replay/receipts, both populated upgrade histories, registration choices, and all/active/needs-assessment/retired/exact-revision link filters across 33 references. The isolated PostgreSQL cluster uses only `ppo_synthetic_test` on port 55696. The local test-runner deadline was 600 seconds because of slow fixture setup; application connection/read limits and the migration/seed guards were unchanged.

Current main `c69a0922` was integrated as `990ef69e`; it changes documentation/register sources and a register unit, with no backend/script/database/package change from the control. The affected register units passed **14/14**, Studio passed with **379 entries**, and status passed with **225 fragments**. Focused paging/navigation units passed **11/11**, final focused lint passed, and the hosted shell comparison passed **1/1** with the agreed Templates menu-count rule. Naming passed after the final panel correction. Foundation passed before the documentation merge (22 retained sources, all 78 parent requirements, 15,155 local links). Default and compiled browser collections each found **1,357 tests in 144 files**, with no native fixture; the dedicated native configuration collects all three journeys.

The final application source is `91cb4f0778dd649cda90482b2e81d871c50e4d7e`. Production build and TypeScript passed (50 seconds compilation, 71 seconds typecheck, 82 static pages). The final compiled fixture browser run passed **14/14** in **2.1 minutes**, compiled HTTP passed **2/2** in **24.30 seconds**, and real native browser journeys passed **3/3** in **1.6 minutes**. Final panel/test lint, Studio, status and naming passed. The [source and capture manifest](review-execution.json) records exact source hashes, runtime, local configuration, earlier failed attempts and all 36 fresh PNG hashes. Prior manifests and captures remain unchanged.

The native run uses the real compiled app and isolated synthetic PostgreSQL database. It verifies register-entry successor navigation and retained list context, independent findings/review, the unchanged historical review after a successor, historical download, missing-byte refusal and exact-original recovery, withdrawal, company denial, stale commands, same-operation replay after a lost committed response, keyboard tab/snapshot focus, 320 px reflow and actual Chrome 200% zoom. The final run was serial after restarting only this task's local app; no application/database timeout was relaxed.

Intermediate execution remains explicit. One fixture case failed in both projects because its new selector searched for “Filters” instead of the phone's “Filter, a filter is applied”; corrected in `82487228`, followed by a complete passing rerun. One native run passed two journeys but read the register-entry URL before navigation settled; `406d86c0` adds the wait. The next run hit database connection timeouts before two workflows (one journey passed). The final serial run above passed all three. These failures are not relabelled as passes or attributed to an unproven product regression.

Developer comparison covered the retained accepted desktop register, snapshot, Overview, Revisions, Links, History, registration/revision/review panels and 390/320 px phone references. It found and corrected a missing WorklistPanel consumer binding: Library now supplies scoped shared-token styling for the 480 px right drawer and 560 px centred review dialog, bounded body scrolling, retained header and phone reflow. Other WorklistPanel consumers are unchanged. The fixture checks the panel widths. The default 1440 px toolbar now occupies one row. Searchable choices/Type remain in Filters; quick selects have bounded widths. Forms retain shared Field/choice controls, explicit command reasons and vertical scrolling rather than the design example's paired fields. The shared phone-header amendment, synthetic records and permitted evidence also account for differences. Independent composition, spacing and owner workflow acceptance are still pending; no visual fingerprint or pixel-equivalence claim is assigned.

| Current-source state | Capture |
|---|---|
| Desktop register and snapshot | [Register](review-2026-11-01/desktop-chromium/register-1440.png), [snapshot](review-2026-11-01/desktop-chromium/snapshot-1440.png) |
| Desktop record and selected revision | [Overview](review-2026-11-01/desktop-chromium/record-1440.png), [Revisions](review-2026-11-01/desktop-chromium/revisions-1440.png) |
| Declared links and history | [Links](review-2026-11-01/desktop-chromium/links-1440.png), [History](review-2026-11-01/desktop-chromium/history-1440.png) |
| Command panels | [Register](review-2026-11-01/desktop-chromium/registration-panel.png), [revision](review-2026-11-01/desktop-chromium/revision-panel.png), [review](review-2026-11-01/desktop-chromium/review-panel.png) |
| Phone register and record | [390 px register](review-2026-11-01/mobile-chromium/register-390.png), [320 px record](review-2026-11-01/mobile-chromium/record-320.png) |
| Unavailable historical bytes | [Real 320 px record](review-2026-11-01/native/native-historical-unavailable-320.png) |
| Real Chrome 200% zoom | [Register](review-2026-11-01/native/native-register-zoom200.png), [record](review-2026-11-01/native/native-record-zoom200.png) |

Repeat native execution with the dedicated `playwright.library.config.ts` command above. For fixture execution, use `playwright.compiled.config.ts` with `tests/browser/library-workspace.spec.ts` against a configured synthetic environment, or reproduce the targeted configuration recorded in the manifest. HTTP uses `node --env-file=.env.local --import tsx --test --test-concurrency=1 tests/http/document-library.test.ts` against the same compiled local launcher. Never reuse another task's database. The fresh captures contain synthetic data; browser traces/session artifacts are not published.

Current-head CI, fresh cross-model review, independent visual review, manual screen-reader review and owner workflow acceptance remain separate. No merge or deployment has occurred.
