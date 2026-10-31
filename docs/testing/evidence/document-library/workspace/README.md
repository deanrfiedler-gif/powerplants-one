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

Not run: all other module database/HTTP/browser suites, a complete native browser command journey, a manual screen-reader audit or 200% browser zoom. The full unit suite was not repeated after these scoped review fixes; its previous baseline failures remain in the earlier execution record. GitHub CI was still queued/pending and fresh Claude review is required for the pushed head.

The isolated PostgreSQL 16.15 cluster uses only `ppo_synthetic_test` on port 55476; the compiled application uses port 3476. No migration, capability, grant, dependency, operational data or external integration was introduced. Independent review, owner acceptance and deployment remain pending.
