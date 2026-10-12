# Figma shell and My Work implementation evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Prepared 13 October 2026. Application visual review: pending. Deployment: not performed by this contribution.

This is the first bounded increment in the [Figma implementation decision](../../../decisions/figma-ui-implementation.md), based on main `7e4ef3b`. Source inspection used the accepted Figma desktop/phone overview frames `404:3` and `404:181`, Shell v2 and More `79:51`. The existing [icon-free reference captures](../../../reference/ui/my-work/my-work-page-design-r01/README.md) remain unchanged. Their weather and numeric samples are design fixtures, not records to seed.

## Verification environment

Windows, Node 24.21.0, npm 11.19.0, PostgreSQL 16; isolated `ppo_synthetic_test`, migrated and seeded using the existing registry. Browser proof uses the compiled app and stable Chrome, the existing controlled My Work observation clock and real permitted source commands. No operational data, ERP/document integration or production credentials are used. Local proof outputs stay outside tracked source; Kit-enabled private captures must not be published in this public repository under ADR-0053.

## Execution ledger

The initial compiled build, changed-file lint and TypeScript checks passed. The first browser run stopped at two superseded presentation assertions: the local Roboto family alias and the removed greeting's department chip. Those assertions were updated to the accepted design; outcome, counts, permissions, history, timing, focus and reload assertions were retained. The visual pass also identified breadcrumb compression and premature toolbar wrapping; the implementation was corrected before final verification.

Final application source: `33b23b7`. The subsequent evidence-only commit does not change the tested application or test code.

| Check | Result |
|---|---|
| `npm run build` | Passed, including TypeScript and all route generation. |
| Changed TypeScript/TSX ESLint and `git diff --check` | Passed. |
| Navigation and work unit suites (`--test-concurrency=2`) | 26 passed. The initially launched unrestricted full-unit run was stopped; no full-unit pass is claimed locally. |
| `npm run studio:check` | Passed: 358 entries, 43 components, 204 source routes, no integrity errors. 330 unreviewed entries and 28 stale reviews remain visible. |
| `python scripts/check_foundation.py` | Passed: 78 parent requirements, 22 issued sources, 9,091 local links and 5,741 text files checked. |
| `python scripts/check_naming.py` | Passed: 589 document records; copy-ready instructions remain within 8,000 characters. |
| Compiled My Work desktop/phone suites | 20 passed; 20 expected opposite-device skips. Real counts, outcome commands, source history, rescheduling, saved views, denial, unavailable sources and focus return retained. Customise-in-More keyboard return is added. |
| Compiled department-navigation, navigation-layout and shell suites | All 15 passed. All seven rails, tooltip behavior in compact mode, More/Workspace, exact receiving records, short-window containment and 320/390/780/781/1199/1200/1440 px navigation are included. |
| Navigation safety | All 17 applicable desktop/phone scenarios passed in the combined run before the separate My Work startup issue. The three desktop-only scenarios were skipped on phone as intended. |

The combined browser attempt encountered an unchanged 120-second startup limit for its separate My Work server and was stopped after shared navigation checks. The final focused My Work run used the same tests, clocks, assertion budgets and Chrome projects with only the redundant general web server omitted through a local configuration; all 20 applicable scenarios then passed. No timeout was raised. Department tests now explicitly select compact mode before requiring compact-only tooltips; the expanded default is checked separately at 240 px. The Programme receiving surface remains flush with the current rail. No passing test or source fingerprint grants owner acceptance.

[PR #459](https://github.com/deanrfiedler-gif/powerplants-one/pull/459) carries the implementation. Full contribution CI is a separate pending result at this handover; no merge or hosted deployment is claimed.

## Comparison and differences

Desktop source: 1440 × 900; phone source: 390 × 844. Inspect expanded/collapsed rail and secondary menu, More, populated and unavailable data, keyboard focus and 320 px phone containment. Source geometry is recorded in the decision and working page/component masters. The first actual compiled captures show the compact rows, outcome rings, toolbar/summary, three quick actions and icon-only phone navigation. Existing runtime controls (identity, guidance, department selection) and unavailable weather/counts are explicit adaptations. Other module interiors and accepted My Work detail/grid designs remain outside this increment. Actual device and screen-reader review is still open.


## Retained local captures

Visual inspection used the licensed local preview at 1440 × 900 and 390 × 844. Automated captures use the public fallback icon renderer (the Kit environment setting was empty), at 1440 × 1000 and 390 × 844. This verifies layout and behavior without publishing Pro artwork; it is not a claim of pixel equality between different data, heights or icon-rendering states. The local PNGs were inspected after the passing run and remain outside public source:

| Capture | SHA-256 |
|---|---|
| `desktop-overview.png` | `3d7dcc009af0f263c73f152422f87169663e87992fa0359f0545d72f384af5d8` |
| `phone-overview.png` | `8cbbcdf4fa8bf2e0bf7192f7778f5e026f34572b7acdf4bace4c3dfaef728fc4` |

The overview geometry follows the inspected source. Data-dependent rows/cards, the omitted unconfigured weather, permitted utility controls and the current department's destinations explain the deliberate visual differences. Keyboard/focus and CSS reflow checks do not substitute for a physical-device or screen-reader review.
