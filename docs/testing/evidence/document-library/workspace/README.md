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

The [supplemental execution manifest](native-execution.json) records three passing native browser tests against the unchanged compiled application at `c2b6ec405f10db7eecf67327821002a599d82cc0`. `tests/browser/library-native.spec.ts` calls the real application and PostgreSQL database: no library command or read is fulfilled with a response fixture. The only business-response fault injection lets a real revision commit before dropping delivery of that response. External Font Awesome requests are blocked for repository-safe captures.

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
