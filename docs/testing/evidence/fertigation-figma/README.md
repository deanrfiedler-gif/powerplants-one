# Fertigation Figma implementation evidence

Date: 13 October 2026. Source branch: `codex/fertigation-figma-ui`, based on main `c3ff5b90d0730f55583b6ee73f9d1af4a449695e`. Scope: EST-02/03/06, existing record route and native r01 calculation.

Reference: [accepted Figma design and frame identities](../../../decisions/fertigation-figma-design.md), retained [icon-free captures](../../../reference/ui/estimating/fertigation-figma-design-r01/README.md). Private live Figma screenshots and design-context inspection were used to compare geometry, type, colours and composition. Licensed artwork is not copied into this public evidence directory.

Fixture: `boardReferenceScope()` with synthetic imported inputs and explicitly documented synthetic declarations. Host setup uses a disposable PostgreSQL 16 cluster with database `ppo_synthetic_test`, independent of other local work. Chrome desktop 1440 × 1000 and phone emulation 390 × 844 are the target comparison widths.

Documentation foundation passed: all 78 parent IDs, 22 issued sources, 9,157 local links and 5,744 marker-scan files retained. Initial TypeScript and targeted lint found a missing close-icon key and an unused import; both were corrected. All 125 targeted fertigation unit tests passed. TypeScript passed after the corrections. The studio register check passed with 358 page entries, 44 component entries and no integrity errors; pending/stale reviews stay visible.

The first complete local optimized build and targeted ESLint checks passed. CI on `2e98c28` passed the full E1 static, unit and PostgreSQL lane, including native fertigation and retained artifacts. Its browser lane exposed moved-control selectors, a hidden phone recalculation/trace entry and a reused fixture allocation ID; those are being corrected and rerun. Closing an editor intentionally keeps its entries, so the new navigation test explicitly discards its untouched editor before opening History.

Paired inspection of all nine desktop views, phone Overview/Growing areas, the phone section sheet and History identified workspace-reset specificity conflicts and wrapping. The corrections retain scoped styling, the existing account/page-guide access, real filters, row menus and calculation trace. Private iterative screenshots are not release evidence: some used an injected copy of the working stylesheet while the compiled application was rebuilt. Final compiled screenshots and browser outcomes are recorded separately below when complete. Owner visual acceptance and hosted deployment are pending.
