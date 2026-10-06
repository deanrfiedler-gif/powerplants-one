# ES-01 design adoption evidence

Owner: Dean Fiedler. Implementation and inspection by Claude, 25 September 2026. Owner visual review, device review and deployment are pending.

These captures show the running `/estimating` page after the ES-01 design decisions of 25 September 2026 ([record](../../../decisions/es01-design-board.md)). They are captures of the local build, not visual acceptance and not a UI baseline entry. The [manifest](manifest.json) identifies the source parent, the LF-normalised source hashes, the server, browser and fixture, and each image's viewport, measured layout, horizontal overflow, page errors, axe-core result, size and SHA-256.

The fixture is a reset `ppo_synthetic_test` database with six synthetic opportunities:
- two without discovery;
- one with incomplete discovery;
- one with complete discovery;
- one legacy estimate with cost lines;
- one legacy scope-only estimate without lines.

No source or customer information is operational. Where the shell owns scrolling, a capture shows the viewport rather than the full scroll.

| Capture | Measured layout | Inspected result |
|---|---|---|
| [Desktop 1440](desktop-1440-panel.png), 1440 × 1000 | Panel | Section tabs; inline search, owner and sort; readiness segments with permitted counts (All 6: 2, 1, 1, 2). The selected row carries the green selected treatment, and the 448 px panel shows its detail with Required response Unknown once. Scope clarification is in the attention tone |
| [Desktop 1360](desktop-1360-panel.png), 1360 × 900 | Panel | The register is 1244 CSS px wide, so the panel docks (decision O1) |
| [Desktop 1359, drawer](desktop-1359-drawer.png), 1359 × 900 | Drawer | The register is 1243 CSS px. Selecting a row opens the 448 px right-hand modal drawer with the same detail. Discovery complete is in the success tone |
| [Tablet 1024, drawer](tablet-1024-drawer.png), 1024 × 768 | Drawer | Legacy manual basis detail with its saved estimate link and basis; the Done footer stays reachable |
| [Phone 390](phone-390-workload.png), 390 × 844 | Stacked | Cards carry the full detail; the disclosure button names the retained selections |
| [Phone 390, filters open](phone-390-filters.png) | Stacked | Readiness, owner and sort open under the disclosure; Apply filters and Clear filters stay in one row |
| [Phone 320](phone-320-workload.png), 320 × 700 | Stacked | Labels, tabs and actions fit without horizontal scroll |
| [200% CSS zoom](desktop-css-zoom-200.png), 1440 × 1000 | Stacked | The register measures 604 CSS px under zoom, so the stacked layout applies without overflow. CSS zoom is not browser-UI or device zoom acceptance |
| [Saved estimates](desktop-1440-saved-estimates.png), 1440 × 900 | — | Table with the saved sell right-aligned in AUD, excluding tax. The scope-only estimate reads Not estimated; New estimate sits in the view's toolbar |
| [Saved estimates, phone](phone-390-saved-estimates.png), 390 × 844 | — | Rows become labelled blocks |
| [No matches](desktop-1440-no-matches.png), 1440 × 900 | Panel frame | Dashed empty state with the shared icon disc and Show all permitted workload; counts read 0 |

Every capture reported no page errors and no horizontal overflow. axe-core found no violations on the ES-01 content. The one `color-contrast` node on the four wide desktop captures is the shared shell's `Ctrl K` hint, ES-02 finding B5; the page does not restyle the shell. The drawer capture has three incomplete contrast checks beneath the modal backdrop.

## Proof run locally

- **Unit:** `npm run test:unit`, 434 passed.
- **Database:** `tests/database/estimating-workload.test.ts`, 4 passed. The new case proves the counts cover permitted, search- and owner-matched rows before the readiness view. Each count equals the rows its view lists, the owner filter narrows them, and another company's rows are never counted.
- **HTTP:** `tests/http/estimating-workload.test.ts`, 1 passed, including the `counts` shape.
- **Browser:** `tests/browser/estimating-workload.spec.ts` in bundled Chromium, 5 passed. The new case is desktop-only by design (phone cards carry the detail), so 1 was skipped. The new case covers panel selection at 1360 px, the drawer at 1359 px (dialog name, Escape, focus return), the resize round trip and Not estimated. The existing cases cover the phone disclosure, desktop segments, URL history, 320 px, 200% CSS zoom, and failed and revoked reads.
- **Regression:** `tests/browser/component-catalogue.spec.ts` passed in both projects. In `tests/browser/estimating.spec.ts`, four E1 cases failed where they generate draft-quote output, because the pinned Chrome document renderer cannot launch in this environment ("Chromium distribution 'chrome' is not found"). The other E1 cases passed, and this change touches no render or quote code.
- **Static:** `npx tsc --noEmit` and ESLint on the changed files, clean.

The pinned Chrome channel and Node 24.21.0 were not available in this environment. CI on the pull request is the authority for the full suites.
