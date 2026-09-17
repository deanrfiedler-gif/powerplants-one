# SH-06 r01 verification and handover

Baseline: `main` at `e1b705acc5457dab6fc0b6a2f0c977132cbd2215`. Dedicated branch: `design/cross-module-approvals-handover-r01`.

## Local results

- 18 focused [model groups](model-results.json) passed under Node 24.19.0.
- JavaScript syntax checks and deterministic standalone assembly passed.
- The model check's first run corrected a test expectation: there are nine owned tasks, including the newly sent CRM handover, not eight. Source records were not changed to satisfy the test.
- Foundation, prototype and naming checks all passed; see [documentation results](documentation-results.json). All 78 parent requirements and issued-source checks remain intact.
- Local Chromium was unavailable and its download timed out. No local native-browser or visual pass is claimed at this stage.

The focused workflow uses the existing repository Node/npm/Playwright/Chrome pins and captures native behaviour, console errors, desktop/phone layouts and original screenshots. Results and visual review will be reconciled here after publication.

## Scope of evidence

Model evidence covers source-owned routing, permission-filtered reads, source-task deduplication, dates, return age, stale revisions, terminal history, source loss and non-mutation. Browser evidence is separately required for the actual UI, focus and responsive behaviour. Owner approval, real devices, assistive technology, server permissions and application integration remain separate.

This is a synthetic standalone design. It has no approval command, live source adapter, ERP write or runtime migration.
