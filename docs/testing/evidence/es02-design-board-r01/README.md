# ES-02 design board r01 — paired build evidence

Evidence behind board 04 (*Design versus current build*) and the build findings in the [ES-02 design board record](../../../decisions/es02-design-board.md). It compares the [retained board captures](../../../reference/ui/estimating/design-board-r01/README.md) with the running wizard. It is capture and measurement evidence only: not functional acceptance, not visual acceptance of the application page and not owner acceptance of any proposal.

## Run context

| Item | Value |
|---|---|
| Date | 24 September 2026; captures 05:48 UTC, layout measurements and build audit 05:51–06:10 UTC |
| Code | `main` at `72b27694462a176529dc68343526dfda215cd298` (migration 0044). A first capture on `9bf90b6` was superseded; between the two commits the wizard body is unchanged and only the rail order and two shell labels moved (*Intake & workload*, *Saved manual estimates*) |
| Environment | Local synthetic only: `npm run dev` on the loopback address, disposable local PostgreSQL database migrated and seeded by the repository scripts. Node 24.21.0 and npm 11.19.0 as pinned; PostgreSQL 16.13 (other repository evidence uses 16.15) |
| Browser | Headless Chromium 141.0.7390.37 through Playwright 1.56.1, device scale 1. Not the approved Chrome channel used by CI |
| Identity and data | `SYN Coordinator`. The opportunity, site and discovery workspace were created through the application's own forms (organisation `SYN Willowbank Horticulture`, one saved discovery revision r01). This data differs from the board's Northbank fixture (build plan r04 §4.9), so compare structure and geometry, not values |
| State | Discovery tab, Configuration step, working copy of saved discovery r01 |

## Files

| File | Bytes | SHA-256 |
|---|---:|---|
| [axe-board.json](axe-board.json) | 951 | `47a00ee3a722a6d8549f6e05c325f8a9ee2d4252b096233f256ccaf48997c2ea` |
| [axe-build.json](axe-build.json) | 1,400 | `d0ed971fff0ae46e57b07f073f362f1d7d6b4e968d0ff34e7ff8dfcfc96b2eff` |
| [build-configuration-1024x768.png](build-configuration-1024x768.png) | 90,036 | `82850998b4663d950645812e1bb7414cc2dfe98822d341e6b7832397e8ab9a9f` |
| [build-configuration-1440x960.png](build-configuration-1440x960.png) | 181,768 | `13fda297dd3da4c09e47acc2d957f121bc239d51eab23bc8169f2eb425655e07` |
| [build-configuration-390x844.png](build-configuration-390x844.png) | 64,106 | `89d4f2fa729db56bcdbc0529cfea99c5a1832b10a5345feda3cb2af2a479472b` |
| [build-layout-72b2769.json](build-layout-72b2769.json) | 2,850 | `7e49c836c2bb24d1a7ec0b4152956bca88a21be8121548c1b065bddc7267660a` |

The three PNG captures are the build images embedded in board 04. `build-layout-72b2769.json` holds the raw layout measurements below. `axe-build.json` and `axe-board.json` hold the accessibility results.

## Measured build composition

Measured from the DOM at each viewport on the Configuration step.

| Viewport | Rail | Estimating menu | Main column | Summary | Steps | Action bar | Breadcrumb |
|---|---|---|---|---|---|---|---|
| 1440 × 960 | 76 px | 240 px at x 76, with a 10 px edge control inside its right boundary | 804 px at x 316; 16 px padding, so 772 px of content | 320 px at x 1120 (narrowed from 380 px at 1500 px and below) | One row, 48 px | Visible at the foot of the column (the column scrolls inside itself) | Both crumbs in full |
| 1024 × 768 | 76 px | Not shown | 948 px; the page scrolls as a whole | Stacked after the whole form, from 2,048 px down | One row, 48 px | Static at the end of the form, 1,987 px down | Both crumbs in full |
| 390 × 844 | Hidden (bottom navigation) | Not shown | 390 px; 12 px padding | Stacked after the form, from 2,624 px down | Two rows, 45 px | Static at the end of the form | Both crumbs truncated (50 px and 94 px) |
| 320 × 700 | Hidden (bottom navigation) | Not shown | 320 px; 12 px padding | Stacked after the form, from 2,755 px down | Two rows, 45 px | Static at the end of the form | Both crumbs truncated (26 px and 48 px) |

No viewport scrolls the page sideways. The three workspace tabs share the width equally at every viewport.

The same design artboards measure: at 1440 × 960, menu 24 px, main column 960 px (content from 24 px inside) and summary 380 px; at 1920 × 1200 with the menu open, 240 px, 1,224 px and 380 px.

### Phone fields and targets (390 × 844)

- Every text field, select and text area in the wizard renders at 14 px or 14.4 px: 33 fields on Requirements, 24 on Configuration and 11 on Scope & delivery. The page's mobile contract requires readable 16 px input text.
- Wizard buttons are 36 px high, selects and search fields 38 px, and the Summary toggle 30 px, against the 44 px shared control token (`src/components/ui/controls.css`) and the 44 px form-target policy in the [UI style specification](../../../standards/ui-style-specification.md). Sources: `#ppo-estimate-wizard :is(button, .button) { min-height: 36px }` and `.field :is(input, select, textarea) { min-height: 38px; font: inherit }` in `src/components/estimation-wizard.css`, inheriting `.field { font-size: 0.9rem }` from `src/app/globals.css`.
- The design's phone artboards (390 × 844 configuration and summary, 320 × 700 review) measure 16 px on every field and at least 44 px on every control in view.

## Accessibility audit

axe-core 4.13.0, rule tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` and `best-practice`, violations only.

| Target | Scope | Result |
|---|---|---|
| Running build (`axe-build.json`) | Requirements and Configuration steps at 1440 × 960 and 390 × 844 | Two rules fail. `color-contrast` (serious, 1 node each at 1440): the search shortcut hint `kbd` is `#758091` on white at 10 px, 3.99 : 1 (`src/app/desktop-shell.css`, `.ppo-global-search kbd`, shared shell). `scrollable-region-focusable` (serious, 1 node each at 390): the Areas and Systems table scroll regions (`.es02-table-scroll`) cannot be reached by keyboard |
| Design board (`axe-board.json`) | All 30 in-app artboards at board size | No violations |

Automated rules cover a fraction of WCAG. No manual keyboard pass, 200% zoom, screen-reader or real-device test was performed.

## Limits

- One synthetic workspace, one state per viewport, headless Chromium. The Alternatives and Revisions tabs, dialogs and error states were not measured.
- The local run is not the protected hosted demo; nothing here shows deployment.
- The source findings (`estimation-wizard.css` and `desktop-shell.css` lines) were read from `72b2769`; they can move with later commits.
