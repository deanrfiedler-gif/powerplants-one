# Job Pack Figma application evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Prepared by Codex, 13 October 2026. Branch: `codex/job-pack-figma-ui`, starting from `c3ff5b9`. Scope: SV-05 / SC-06, SVC-03, SVC-06, OUT-09. All data used is synthetic.

## Source and comparison

The accepted reference is the named Figma version in [the design decision](../../../decisions/job-pack-figma-design.md), with seven retained icon-free boards in [Job Pack design r01](../../../reference/ui/service/job-pack-design-r01/README.md). The actual Figma desktop register and record screenshots, node metadata and child component design contexts were inspected during implementation. Their private URLs and licensed icon artwork remain outside this public repository.

The application comparison mounts the actual application shell and Job Pack components using `tests/ui/job-pack-fixture.tsx` and `job-pack-register-fixture.tsx`. These explicitly mocked reads establish presentation only. `tests/database/pack-register.test.ts` independently exercises the real read services and permissions against a separate loopback PostgreSQL cluster using the disposable `ppo_synthetic_test`.

The record comparison covers the nine saved sections, source-change state, first/successor preparation, status/menu collapse, keyboard navigation, coordinator phone tabs and saved-content printing. The register comparison covers views, visit groups, selection, CSV download, column visibility, preview tabs, compact phone filters and denied data. Automated viewports cover 1440, 1024, 820, 770, 390 and 320 CSS px. Source and application captures use different synthetic records; layout comparisons do not assert identical business content.

## Executed checks

- `npm run build`, `npm run typecheck` and targeted ESLint passed. A final build and lint run includes the section-local source comparison added during review.
- 31 focused unit tests passed: register attention/CSV/time zones, pack presentation, saved section fidelity, print escaping and shell navigation.
- All three new database scenarios passed against PostgreSQL 16: scoped register projection, genuinely packless visits, and an assigned recipient seeing only the applicable issue after a successor is prepared. The first and third passed together; the corrected second passed in a focused run. An earlier test fixture attempted a forbidden raw appointment-state update; it was corrected to use the real pack creation command. This was a fixture error, not a relaxed application rule.
- All five final component-browser tests passed in 48 seconds, covering all 41 retained r03 tokens, six viewport widths, saved-only print, preferences, keyboard tabs, register selection/export/inspection, phone filters and permission denial. The final fixture also checks that changed draft sources select the review action even while the draft carries `needs_review`.
- The initial compiled application run passed 33 tests and skipped seven repeated desktop viewport sweeps. Eight failures were two breadcrumb assertions against the former location of the Service link, plus six real-workflow cases run after the new database permission test deliberately removed `pack.prepare`. The assertion now uses the shared hierarchy and the isolated database is reset before the workflow replay. Replay results are recorded below when complete.
- `npm run studio:check` passed: 358 entries, 43 components, 204 routes, no errors. Existing unreviewed/stale states remain visible (330 unreviewed; 28 stale); this run grants no visual acceptance.
- Foundation, PP-01 package and naming checks passed. The maintained project instruction file is 7,998 characters. These checks establish documentation consistency only.

Local execution uses a separate loopback PostgreSQL cluster with increased test lock capacity, the existing stable Chrome channel (155.0.8059.40) and original fallback icons. No shared application database, seed, migration or permission grant was changed. An intermediate presentation rerun stopped in global setup when Chrome could not launch within 180 seconds; no assertions ran. The workstation was concurrently running several other builds. The final five-test replay above passed after those resource constraints eased.

## Remaining acceptance

Owner review, physical phones, screen readers, operational acceptance and hosted deployment are separate from code verification. The running Kit supplies licensed icons; local tests use the existing original fallback drawings. No licensed Figma artwork is bundled in the application.
