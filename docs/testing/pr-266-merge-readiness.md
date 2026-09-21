# PR #266 merge-readiness repair — 21 September 2026

The repair integrates main `8ed8b0c5` into EN-07 head `78a8acb9` without rewriting branch history. Its conflicts were in shared presentation code, following the accepted existing-module refinement (#271).

- EN-06 keeps main's two-row grid and docked inspector shadow. EN-07 keeps its separately scoped flex layout and r03 content.
- The shared header keeps main's semantic breadcrumb and centred controls, with EN-07's route-derived module and destination.
- EN-07 uses the current My Work secondary-menu rules: 240px, grey background, white current item and the 24px collapsed disclosure strip. The register test continues to compare the complete computed menu geometry with actual My Work; only the obsolete fixed dimensions and breadcrumb selectors change.
- No migration bytes, seeds, permissions, issued sources, workflow gates or business assertions are changed by the repair.

Foundation, prototype and naming checks pass locally. TypeScript passes on pinned Node 24.21.0/npm 11.19.0. Final lint/unit and GitHub job results are recorded on the PR; GitHub must check the published commit before merge. Historical evidence remains historical and is not relabelled as this execution.

Dependency order is EN-07 (#266), EN-08 (#270), then PJ-09 (#269). These branches must be reconciled in that order, with merge commits retaining shared ancestry. This repair does not merge to main or deploy. Full owner/device/business acceptance remains separate.
