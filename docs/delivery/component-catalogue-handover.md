# Component catalogue delivery handover

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Date:** 23 September 2026 · **Source baseline:** `743d58f` · **Branch:** `feat/component-catalogue` · **Review:** [PR #286](https://github.com/deanrfiedler-gif/powerplants-one/pull/286).

The branch incorporates main `25170bf` (SH platform PR #284). Its search route, guides, shell stylesheet, document records and compiled browser configuration are preserved alongside the catalogue. Combined coverage is now 268 page entries, 264 guides and 114 source routes; the document register has 403 records. The original pre-integration counts below identify the earlier executed checks, not the new total.

## Outcome and scope

Dean authorised implementing the browsable component catalogue described in the preceding plan. `/development/design-system` now provides ten categories, 19 runnable examples, one actual host-shell entry and four clearly reference-only patterns. Search/category/area/coverage/review filters, permanent component-state-width links, six detail views, real viewport frames, reference comparison, source/history links, consumer navigation and owned alignment records extend the existing Git-backed workspace. The register now has 267 entries, including the internal preview route.

The application supplies the examples: Button/ButtonLink, CRM Board/Grid/ForecastWorklist, estimating AreasEditor, ProjectsGantt, PlannerBoard/AppointmentCard, business fields/validation/read-state/status, LookupField, RecordTabs/RecordPanel and WorklistMenu/WorklistPanel. PlannerBoard is extracted from the existing screen with the same markup/calculations and callbacks; the business host retains booking authority. AreasEditor narrows its type requirement to the options it actually reads. Gantt adds optional reference-date and persistence inputs; application defaults are unchanged.

The fixture page omits shell/session providers and uses deterministic synthetic data. It never invokes a business command. The local launcher allows same-origin framing only for this independently gated route; other business pages remain DENY and hosted gating remains unchanged. Known synthetic-record links are intercepted. The same global CSS imports/order are used. The native catalogue's theme proposal tools remain available.

## Maintenance and traceability

`docs/design/development/components.json` and `components/*.md` are stable Git masters. The existing page register links to mapped component entries and component Used on links back to page destinations/guides. The catalogue reads existing baseline token differences directly. CI validates coverage, renderer bindings, source exports, reference anchors, consumer keys/imports and review evidence. Fingerprints include transitive relative sources, styles, fixtures, specifications and references; edits invalidate recorded review. No review approval has been manufactured.

ADR-0040 remains the selected architecture. Updated AGENTS and PR guidance require source, examples, specifications and gaps together. Issued references remain unchanged. Broader future theme patterns are inventoried in the component maintenance contract rather than implied to be implemented.

## Verification

- Application build, lint and TypeScript checks passed. The final focused catalogue/development/history/Gantt/planner/configuration unit run passed **27/27** tests, including the preview framing boundary and dependency changes invalidating prior reviews.
- Foundation, naming and prototype assurance passed: 78 retained requirements, 400 document records and 131 Git masters. Register integrity passed with 267 entries, 263 guides, 113 source routes, 24 component entries and 19 runnable examples.
- Browser checks on the compiled local application verified embedded rendering, sales-table filtering, Gantt controls and its 390-pixel list fallback, planner day/week lanes with availability/reservation evidence, dialog Escape and focus restoration, and a 390-pixel outer catalogue without horizontal page overflow. The rebuilt board displayed Discovery and Scoping cards at 390 pixels; AreasEditor opened selected row fields; validation links focused the invalid field and a corrected form showed preview-only save status. Used on displayed local/hosted destinations and Differences showed the retained token discrepancies. The sandboxed theme reference visibly rendered its colour section. All examples use synthetic fixtures; these observations do not prove business persistence or authorisation.
- The browser pass identified and corrected the initial embedded-frame restriction and a missing selected-stage input in the small-screen board fixture. Automated browser coverage was added for every registered example/state, permanent links and consumer references, validation focus, modal focus restoration and mobile board selection. Its CI result is recorded with the pull request; local interactive observations are separate evidence.

Post-integration verification on `8f602b6` passed the build/TypeScript check, 15 focused catalogue/development/history/shell units, register integrity and all three documentation assurance scripts (403 document records). GitHub run [35819689236](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35819689236) mounted every registered example/state on desktop and mobile without runtime errors or business writes and passed validation/dialog focus, mobile board selection and existing Leads/Projects journeys. Its two failures were the same new test selector matching the visible Differences panel and the collapsed theme tools. The selector is now scoped to the intended panel; subsequent CI results are recorded on PR #286.

Paired design acceptance, physical-device and screen-reader acceptance remain open. The local database service was unavailable, so database-backed business journeys were not claimed as locally executed. Retained reference documents are unchanged.

## PR #286 search assurance repair

On catalogue head `b30df17`, both [compiled browser assurance](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35820638388/job/107051524095) and [Application browser proof](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35820638425/job/107051524693) passed 314 tests, skipped 52 and failed the same mobile SH search journey. `keyboard.press("Control+k")` immediately followed navigation; the subsequent fill waited 45 seconds for a search field that never opened. The final snapshot showed the loaded My Work page with global search closed. All catalogue cases passed in those runs.

The test and `ShellControls` are unchanged from main `25170bf`, whose [compiled suite passed](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35817041438). The original search test also passed both desktop and mobile locally. A three-attempt diagnostic with slower client execution observed the mobile search trigger absent immediately after navigation in every attempt, although each local shortcut ultimately succeeded. This supports a startup timing race; it does not establish a deterministic catalogue application regression.

The repair waits for the client-loaded **Change identity** control and, on a phone, **Open global search** before sending the original shortcut. It additionally asserts that the shortcut focuses the search field. Existing search results, source-authorised preview, focus return and saved-view assertions remain. No application code, global timeout, retry policy or skipped case changes.

Local verification uses Node 24.21.0, maintained Chrome 153.0.8010.53 and task-owned PostgreSQL 16.15 / `ppo_synthetic_test`; CI used Chrome 154.0.8037.57. The PR application build, focused lint and TypeScript checks passed. An initial wider local SH/catalogue run overlapped a baseline build and encountered five-second search-result and My Work data-loading timeouts after the repaired shortcut/focus step passed. That run and the competing baseline build were stopped; neither is claimed as a pass. The subsequent focused compiled run passed **10/10** desktop/mobile catalogue and search checks in 3.7 minutes, including every registered fixture state. Fresh PR CI remains separate from local verification and owner acceptance.

## Open alignment work

PR #285 merged to main `4c8fd6d` during the search-assurance repair. The branch incorporates its CS contracts, migration/seed 0044 and shared search/view/review adapters unchanged. The STATUS conflict retains both the catalogue repair and CS handover; the document register retains both sets of entries. Earlier local results above precede this integration; the PR's current-head checks establish the combined result.

All 24 component records retain Not reviewed visual state. Existing module-specific button/table/dialog families are not silently restyled. The four reference-only entries are AI assistance, product patterns, complete saved estimation wizard and future/innovation patterns. Select/edit tables are represented by AreasEditor; universal bulk selection and spreadsheet cell editing remain unadopted capabilities, not hidden finished controls. Whole-app business regression and component presentation are separate evidence.

The surrounding application shell uses its normal local identity service. If that service is unavailable, the catalogue fixtures still run, while permitted navigation is not fabricated. No merge, hosted deployment, business transaction or production readiness is asserted by this handover.

## Recovery and next review

Reset/reload restores synthetic fixtures. Refresh rereads working Git files. Revert unwanted code/specification changes through Git. Review the PR and the component-specific differences before accepting visual alignment. Apply future global styling changes to actual shared components and verify affected consumers.
