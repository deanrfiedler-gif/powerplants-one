# Document library native workspace evidence

Owner: Dean Fiedler. PR #706, scope DK-01/DK-02. This is developer execution evidence, not independent visual review, owner approval or deployment.

## Source and comparison

Accepted input: PPO - Design, page `744:2609`, named version **Document library — accepted**, with the phone-header amendment. Live register, record, phone, 320 px, state-board, registration and review-dialog frames were read on 31 October 2026. Retained icon-free [source captures](../../../../reference/ui/document-library/document-library-figma-r01/README.md) remain unchanged.

The application screenshots below use synthetic response fixtures in the real application shell, Chrome and the local server on port 3476. Font Awesome network requests are blocked; local fallback glyphs are used. They do not prove a database-backed browser journey. Native database and HTTP proofs are separate below.

| Width | Register | Exact record |
|---|---|---|
| 1440 | [Register](register-1440.png) | [Record](record-1440.png) |
| 1024 | [Register](register-1024.png) | [Record](record-1024.png) |
| 390 | [Register](register-390.png) | [Record](record-390.png) |
| 320 | [Register](register-320.png) | [Record](record-320.png) |

[Historical unavailable content at 320 px](record-unavailable-320.png) verifies that exact content is not substituted. The developer comparison corrected unstyled menu rows, toolbar sizing and the phone action bar overlapping department navigation. These captures use a different synthetic review state from the accepted reviewed example; no design sample totals are hard-coded.

## Behaviour and adaptations

- Shared secondary menu, RegisterTable, sort headers, Button, WorklistMenu/Panel, Field, ReadState, RecordTabs, RecordIdentity and ShellIcon are reused. Component specifications are unchanged.
- Number/Updated sorting implements the accepted Q2; controlled UI types implement Q5 while legacy free-text types remain readable.
- Load 25 more rechecks the displayed window. Register loading/failure clears old rows and selections; denied reads expose no retained detail. No result totals are claimed.
- Independent review, finding response/acceptance, historical source context and exact link retirement retain backend authority. Native PDFs download; job packs also open their exact issued-pack page.
- Unknown command results retain the same body and operation ID for retry and block editing/closing. Dirty-navigation protection is reused. Browser termination is not persistent draft storage.
- The phone record hides the department tab bar while its record actions occupy the bottom edge. Context follows the main view and the tab list scrolls horizontally.

## Validation

The final execution results and remaining checks are recorded in the PR handover. Studio and foundation passed before final documentation edits; TypeScript, full lint, bounded full unit execution, compiled build and the full library database suite are being completed. Focused cursor/shared-contract units passed (13 tests). Native HTTP passed (2 tests) against the development server, not a compiled server. Browser tests cover four viewport sizes, unchanged uncertain retry, denied refresh, independent acceptance, exact historical link handover, unavailable content, expanding paging, snapshot Escape/focus return and failed-read retry.

The isolated PostgreSQL 16.15 cluster uses only `ppo_synthetic_test` on loopback port 55476. The first full suite stopped at reset with insufficient lock slots; its cluster was restarted with `max_locks_per_transaction=1024`. The unrestricted unit attempt was stopped under excessive concurrency and is not a completed result. Node 24.22.2 and npm 11.19.0 are installed; the repository's reviewed Node version is 24.21.0. No migration, capability, grant, dependency, operational data or external integration is introduced.

Independent review, visual acceptance, broader real-browser workflow/assistive-technology review and business approval remain separate.
