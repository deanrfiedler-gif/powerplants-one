# Discovery workspace — design reference

Stable entry: `route:/estimating/discovery/[id]`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `72b27694462a176529dc68343526dfda215cd298`. Application destination: `/estimating/discovery/{id}`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

The Estimation Wizard's discovery workspace (ES-02, [build plan r04](../../../reference/ui/estimating/PPO-ES-02-Estimation-Wizard-Discovery-Alternatives-and-Revisions-Refinement-Build-Plan-r04.md)). One workspace covers one opportunity, one site and one selected alternative. Five steps share one working copy, and saving creates an immutable discovery revision. Review here is a completeness and source check, not approval, which belongs to ES-04.

1. Confirm the opportunity, customer, site, viewed alternative and save state in the context row.
2. Work through Requirements, Configuration, Scope & delivery, Pricing and Review. Each step shows a status derived from its findings, never from whether it was visited.
3. Keep alternatives and their exact revisions distinct, using the Discovery, Alternatives and Revisions tabs.
4. Check the saved cost basis, then save a discovery revision with a reason before preparing a quotation.

The [ES-02 design board record](../../../decisions/es02-design-board.md) holds the user's six-family decision, the board's proposals (P2–P9), open decision O1 and build findings B1–B6 referred to below. None of the proposals is accepted.

## Desktop

Keep the r04 rules: breadcrumb **Estimating / Estimation Wizard**; global search and quick add centred on the whole viewport; secondary menu 240 px expanded or 24 px collapsed, with an edge control inside its boundary; exactly three tabs and five steps; the summary white, flush right and full height, starting around 360–400 px; one vertical scroll owner per view, with local horizontal scrolling for tables; the bottom bar ending at the main column's edge.

Measured on the running build (`main` `72b2769`, local synthetic, Configuration step, 24 September 2026):

| Viewport | Estimating menu | Main column | Summary | Steps | Action bar |
|---|---|---|---|---|---|
| 1440 × 960 | 240 px at x 76 | 804 px at x 316, 772 px of content | 320 px at x 1120 | One row, 48 px | At the foot of the column; the column scrolls inside itself |
| 1024 × 768 | Not shown | 948 px; the page scrolls as a whole | Stacked after the whole form, from 2,048 px down | One row, 48 px | Static at the end of the form |

The build narrows the summary from 380 px to 320 px at 1500 px and below (B2), fills the configuration attention strip with amber (B1), and gives desktop controls a height of 36 px (O1).

Proposed by design board r01, not accepted:

| Viewport | Menu | Main column | Summary | Notes |
|---|---|---|---|---|
| 1920 × 1200 | 240 px | 1,224 px | 380 px | Menu open |
| 1440 × 960 | 24 px | 960 px | 380 px | P3: collapsed by default at 1440 px and below; a saved preference still wins |
| 1024 × 768 | Not shown | Full width | A labelled bar that opens the full summary | P4; actions stay in view |

The other desktop proposals are family-then-category selection when adding a system (P2), a right-side evidence panel (P7), and summary findings as linked rows that open their step and field (P9). On the board, as in the build, each step button shows its number, name and a one-line status. The board's attention strip is neutral with a small amber indicator, as r04 §4.5 requires.

## Mobile

Measured on the running build:

| Viewport | Steps | Summary | Action bar | Breadcrumb |
|---|---|---|---|---|
| 390 × 844 | Two rows, 45 px | Stacked after the form, from 2,624 px down | Static at the end of the form | Both crumbs truncated |
| 320 × 700 | Two rows, 45 px | Stacked after the form, from 2,755 px down | Static at the end of the form | Both crumbs truncated |

No viewport scrolls sideways. On phones every field renders at 14–14.4 px (B3), controls are 30–38 px high (B4), and the Areas and Systems table scroll regions cannot be reached by keyboard (B6).

Proposed by design board r01 (boards R2–R4), not accepted: the current page alone in the header at 16 px (P8); a 44 px step select with previous and next buttons (P5); a sticky action bar with **Summary** and **Save discovery revision**, the summary opening as a sheet (P4); 16 px field text and 44 px controls throughout; wide tables in a labelled, focusable region that scrolls sideways.

The mobile composition has not been visually accepted for this entry. Boards R2–R4 are compositions, not device captures, and a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Board 08 catalogues 24 states from r04 §9 and the §3.5 working-copy lifecycle: loading, no workspace, filtered empty, unsaved, checking, incomplete, saving, accepted, rejected, unknown outcome, invalid, stale source, stale workspace, denied, read-only, identity loss, no costing, unpriced, legacy basis, archived, limit reached, unavailable integration, rendering, and recovery after reload. Initial loading, unknown save outcome, stale workspace and read-only are drawn full size (X1–X4). Status always carries words, not colour alone, and comparison markers carry a glyph and a word (P6). A draft is preserved when guidance or a reference is opened.

## Visual references

- [PPO-Estimation-Wizard-Container-r03.html](../../../reference/ui/estimating/PPO-Estimation-Wizard-Container-r03.html) — functional study r03
- [read-only-summary.png](../../../testing/evidence/es02-native-r01/read-only-summary.png) — application capture, ES-02 native r01

Design board r01, proposed and not accepted ([retained captures and hashes](../../../reference/ui/estimating/design-board-r01/README.md)):

- [S0 · Configuration, menu open](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-S0-Configuration-1920-Menu-Open-r01.png) — desktop 1920 × 1200
- [S1 · Requirements](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-S1-Requirements-r01.png) — desktop 1440 × 1680
- [S2 · Configuration](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-S2-Configuration-r01.png) — desktop 1440 × 1770
- [S3 · Scope & delivery](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-S3-Scope-and-Delivery-r01.png) — desktop 1440 × 1460
- [S4 · Pricing](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-S4-Pricing-r01.png) — desktop 1440 × 1260
- [S5 · Review](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-S5-Review-r01.png) — desktop 1440 × 1460
- [V1 · Alternatives](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-V1-Alternatives-r01.png), [V2 · Compare alternatives](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-V2-Compare-Alternatives-r01.png), [V3 · Revisions](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-V3-Revisions-r01.png), [V4 · Compare revisions](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-V4-Compare-Revisions-r01.png) — desktop 1440 wide
- [V5 · Evidence inspector](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-V5-Evidence-Inspector-r01.png), [V6 · Save discovery revision](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-V6-Save-Discovery-Revision-r01.png) — desktop 1440 × 1000
- [X1](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-X1-State-Initial-Loading-r01.png)–[X4](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-X4-State-Read-Only-r01.png) states and the [states catalogue](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-08-States-Catalogue-r01.png)
- [R1 · Tablet](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-R1-Tablet-1024-Configuration-r01.png) — 1024 × 768
- [R2 · Phone configuration](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-R2-Phone-390-Configuration-r01.png), [R3 · Phone summary sheet](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-R3-Phone-390-Summary-Sheet-r01.png) — 390 × 844
- [R4 · Phone review](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-R4-Phone-320-Review-r01.png) — 320 × 700
- [04 · Design versus current build](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-04-Design-Versus-Current-Build-r01.png) and [07 · Departures](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-07-Departures-and-Build-Findings-r01.png)

Application captures on `main` `72b2769` ([evidence](../../../testing/evidence/es02-design-board-r01/README.md)): [1440 × 960](../../../testing/evidence/es02-design-board-r01/build-configuration-1440x960.png), [1024 × 768](../../../testing/evidence/es02-design-board-r01/build-configuration-1024x768.png) and [390 × 844](../../../testing/evidence/es02-design-board-r01/build-configuration-390x844.png), Configuration step.

The board artboards are design references, not application captures. Their data is the r04 §4.9 Northbank fixture; the application captures use different synthetic data.

## Behaviour, handovers and verification

The draft User Guide `guide.page.estimating.discovery.id` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Incoming: the CR-02 sales-to-estimating handover (accepted submission with opportunity, customer and one site) and permitted Facility and equipment references; the CS-08 survey is declared but not yet integrated. Outgoing: the immutable discovery revision and the Draft quotation render. The manual estimate receives a saved, Complete basis only by explicit adoption. Sent, accepted and converted belong to ES-05, ES-06 and ES-07.

Checked on 24 September 2026: a paired design and build comparison at 1440, 1024, 390 and 320 px, and an automated axe-core audit with no violations on the board and two on the build (B5, B6). Not checked: keyboard order, focus return, 200% zoom, screen reader, real devices, the build's Alternatives and Revisions tabs and dialogs, and the business journey. Visual review of this entry remains **Needs review**. Do not replace a comparison image simply to make a test pass.
