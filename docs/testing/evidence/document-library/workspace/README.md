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

## Validation

The [execution summary](execution.json) records the tested application source and separates these results:

- Compiled build and its TypeScript check passed on application source `f78fc093`. Full lint and final focused lint passed. Studio, foundation, naming, status-source and browser-runtime checks passed.
- Compiled fixture browser: **5/5 passed**, including 1440/1024/390/320 px, unchanged uncertain retry, denied refresh, independent finding acceptance, exact historical link handover, unavailable content, expanding paging, snapshot Escape/focus return, permitted Previous/Next and strict registration/revision payloads. The first compiled attempt began before the server was ready; the remaining selector ambiguity was corrected before the final complete run. Final test-only selector and evidence edits do not change compiled application code.
- Native compiled HTTP: **2/2 passed**, including the new sorted/mine register, permitted choices and historical revisions endpoints, existing lifecycle commands, refusal and exact download headers.
- Native database: **13/14 passed** in the full library run. DK-B03 exposed an extra capability gate in the preserved register read, where the existing contract returns an empty permitted list. That case passed on unmodified `origin/main` at `6e939bf0`, then passed on the corrected branch. The other thirteen cases include both populated upgrades, native PDF sources, unchanged-operation recovery, sorted cursor scope and permitted choices. This is a full run plus a focused correction proof, not a claimed clean fourteen-case rerun.
- Full bounded units: **1,280/1,285 passed**. Four failures reproduced on an unmodified-main archive: CPQ package execution budget, two private document-store path cases and the private-recovery path case. The remaining CPQ rule-worker case passed both the main control and a serial retry on this branch. No unrelated test or guard was weakened.

Not run locally: every other module's database/HTTP/browser suites (no migration, grant or shared control implementation changes), a live end-to-end browser journey through all native commands, manual screen-reader testing or browser 200% zoom. Exact-head CI and independent visual/functional review remain pending. Keyboard evidence is the snapshot Escape/focus-return journey plus native/shared controls; it is not an exhaustive accessibility audit.

The isolated PostgreSQL 16.15 cluster uses only `ppo_synthetic_test` on loopback port 55476. The first full suite stopped at reset with insufficient lock slots; its cluster was restarted with `max_locks_per_transaction=1024`. The unrestricted unit attempt was stopped under excessive concurrency and is not a completed result. Node 24.22.2, npm 11.19.0, Playwright 1.64.1 and reviewed Chrome 156.0.8078.80 were used; the repository runtime reference uses Node 24.21.0. No migration, capability, grant, dependency, operational data or external integration is introduced.

Independent review, visual acceptance, broader real-browser workflow/assistive-technology review and business approval remain separate.
