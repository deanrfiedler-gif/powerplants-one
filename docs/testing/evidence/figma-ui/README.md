# Figma shell and My Work implementation evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Prepared 13 October 2026. Application visual review: pending. Deployment: not performed by this contribution.

This is the first bounded increment in the [Figma implementation decision](../../../decisions/figma-ui-implementation.md), based on main `7e4ef3b`. Source inspection used the accepted Figma desktop/phone overview frames `404:3` and `404:181`, Shell v2 and More `79:51`. The existing [icon-free reference captures](../../../reference/ui/my-work/my-work-page-design-r01/README.md) remain unchanged. Their weather and numeric samples are design fixtures, not records to seed.

## Verification environment

Windows, Node 24.21.0, npm 11.19.0, PostgreSQL 16; isolated `ppo_synthetic_test`, migrated and seeded using the existing registry. Browser proof uses the compiled app and stable Chrome, the existing controlled My Work observation clock and real permitted source commands. No operational data, ERP/document integration or production credentials are used. Local proof outputs stay outside tracked source; Kit-enabled private captures must not be published in this public repository under ADR-0053.

## Execution ledger

The initial compiled build, changed-file lint and TypeScript checks passed. The first browser run stopped at two superseded presentation assertions: the local Roboto family alias and the removed greeting's department chip. Those assertions were updated to the accepted design; outcome, counts, permissions, history, timing, focus and reload assertions were retained. The visual pass also identified breadcrumb compression and premature toolbar wrapping; the implementation was corrected before final verification.

Final verification results will be recorded here after execution. No passing test or source fingerprint grants owner acceptance.

## Comparison and differences

Desktop source: 1440 × 900; phone source: 390 × 844. Inspect expanded/collapsed rail and secondary menu, More, populated and unavailable data, keyboard focus and 320 px phone containment. Source geometry is recorded in the decision and working page/component masters. The first actual compiled captures show the compact rows, outcome rings, toolbar/summary, three quick actions and icon-only phone navigation. Existing runtime controls (identity, guidance, department selection) and unavailable weather/counts are explicit adaptations. Other module interiors and accepted My Work detail/grid designs remain outside this increment. Actual device and screen-reader review is still open.
