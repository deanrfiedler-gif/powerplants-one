# Discovery workspace — design reference

Stable entry: `route:/estimating/discovery/[id]`. Owner: Dean Fiedler. Status: **Built to design board r01 on 12 October 2026; Figma design accepted the same day, alignment pending; visual review pending**.
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

Accepted design (12 October 2026): the [ES-02 Estimation Wizard Figma design decision](../../../decisions/es02-wizard-figma-design.md), with captures 01–18 in [Figma design r01](../../../reference/ui/estimating/es02-wizard-figma-design-r01/README.md). The running page is still the board build described below. Align it to the design in a follow-up, adopting the differences the decision lists; the family overview and Category field wait for the six-family definition (Q8).

- **Layout at 1440 × 1000:** the labelled Shell v2 rail (240 px, Estimation wizard current; the user may collapse it to 76 px), main column 820 px and the 380 px summary on the right; at 1920 × 1200, 240 / 1300 / 380; in Alternatives, Revisions and the comparisons the summary closes and the main column is 1200 px. Breadcrumb "Estimating & quotation / Estimation wizard".
- **Header and tabs:** the record-header structure with a 20 px title, the Synthetic preview tag, a meta line ending in the save state with its change count, Summary and "…"; Record / View tabs with counts and the viewed-alternative select at the right of the tab row.
- **Content:** five equal 48 px steps; family tiles as filters (grey when empty, white with an amber dot while systems need confirming, pastel green only when all are confirmed; neutral count badges) and a Shared infrastructure strip; content-fitted grids with 48 px rows, wide grids scrolling sideways in labelled regions; Record / Banner state messages; one navy primary action per view.
- **Overlays and outcomes:** the 440 px evidence panel, the Save discovery revision dialog, the unsaved discovery dialog, the saved-revision banner, the unsaved-changes popover and the Add system menu (captures 13–18).

Built on 12 October 2026 to [design board r01](../../../decisions/es02-wizard-ui-build.md) on Dean's instruction; the board's proposals P3, P4, P5, P6, P7 and P9, the O1 recommendation and build findings B1–B4 and B6 are in the page. P1/P2 (six families and categories) wait for the successor configuration definition and P8 belongs to the shell.

Composition, top to bottom in the main column: context row (title, synthetic marker, customer · site · owner, save state with an amber dot for a working copy; viewed alternative and the Summary toggle on the right); equal-width tabs **Discovery / Alternatives [n] / Revisions [n]** with a 3 px navy underline; five 44 px steps, each with a status line derived from findings (never from visits); the step content; the working-copy bar (**Previous · Save discovery revision · Continue**, with the reason a disabled Save is disabled). The summary is white, square, flush right and full height at 380 px, with a left-only shadow, and scrolls on its own. One scroll owner per column; tables scroll sideways inside labelled, focusable regions.

| Viewport | Estimating menu | Main column | Summary | Notes |
|---|---|---|---|---|
| 1920 × 1200 | 240 px open | 1,224 px | 380 px | Menu open by default above 1440 px |
| 1440 × 1000 | 24 px collapsed | 960 px | 380 px | P3: collapsed by default at 1440 px and below; a remembered choice wins |
| 1024 × 768 | Overlay | Full width | Labelled bar that opens a sheet | P4; the working-copy bar stays in view |

Control heights follow the O1 recommendation: 44 px fields and working-copy actions, 40 px toolbar and in-table controls. Status is always a word in a tag; the attention strip is neutral with an amber dot; the evidence panel is a 440 px non-modal overlay that never replaces the summary.

## Mobile

Accepted design (12 October 2026): capture 19 in [Figma design r01](../../../reference/ui/estimating/es02-wizard-figma-design-r01/README.md). Phones use the accepted phone record pattern: a back arrow with the record title, a status row, equal Discovery / Alternatives / Revisions tabs, the viewed alternative and the step select (previous and next, 44 px), systems as list rows that open a system editor page, and a Summary / Save discovery revision footer with no bottom tab bar; the summary opens as a sheet. At 1024 × 768 the rail collapses to 76 px and the summary becomes a labelled bar. Not drawn yet: phone Alternatives and Revisions.

At 780 px and below the step row becomes **Step n of 5** with a select and previous/next buttons (P5); the summary bar sits under it and the bottom bar carries **Summary** and **Save discovery revision** above the shell's phone navigation (P4); fields read at 16 px and every control is 44 px (B3, B4); family cards become a scrolling row; two- and three-column grids stack; tables keep local sideways scrolling in labelled regions. No viewport scrolls sideways (checked at 390 × 844 during the build).

The phone breadcrumb still shows both crumbs (P8 is a shell change). Real-device checks and Dean's visual review are not recorded; this entry stays **Needs review**.

### Previous measurements (superseded)

Measured on the earlier build (`main` `72b2769`, 24 September 2026): at 1440 × 960 the menu was 240 px, the main column 804 px and the summary 320 px; at 1024 × 768 and on phones the summary stacked after the whole form and the action bar sat at the form's end; phone fields rendered at 14–14.4 px and controls at 30–38 px. Those findings (B1–B4, B6) are corrected by the 12 October build.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Board 08 catalogues 24 states from r04 §9 and the §3.5 working-copy lifecycle: loading, no workspace, filtered empty, unsaved, checking, incomplete, saving, accepted, rejected, unknown outcome, invalid, stale source, stale workspace, denied, read-only, identity loss, no costing, unpriced, legacy basis, archived, limit reached, unavailable integration, rendering, and recovery after reload. Initial loading, unknown save outcome, stale workspace and read-only are drawn full size (X1–X4). Status always carries words, not colour alone, and comparison markers carry a glyph and a word (P6). A draft is preserved when guidance or a reference is opened.

## Visual references

Accepted Figma design (12 October 2026): [ES-02 Estimation Wizard Figma design r01 captures](../../../reference/ui/estimating/es02-wizard-figma-design-r01/README.md), twenty-two icon-free PNGs (design compositions, not application captures), recorded by the [design decision](../../../decisions/es02-wizard-figma-design.md). The board captures below stay unchanged; the Figma design governs appearance.

- [ES-02 page build record](../../../decisions/es02-wizard-ui-build.md) — what the 12 October 2026 build adopted from the board and what it left out
- [PPO-Estimation-Wizard-Container-r03.html](../../../reference/ui/estimating/PPO-Estimation-Wizard-Container-r03.html) — functional study r03
- [read-only-summary.png](../../../testing/evidence/es02-native-r01/read-only-summary.png) — application capture, ES-02 native r01

Design board r01, adopted as the page's composition on 12 October 2026 ([retained captures and hashes](../../../reference/ui/estimating/design-board-r01/README.md)):

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

Lost-save recovery (12 October 2026 repair): when a background read finds the accepted successor and invalidates the open comparison, the workspace warning must still expose **Confirm original save outcome** on desktop and phone. Keep editing paused and recover the original operation; do not infer command acknowledgement from the refreshed revision. ES02-T27/T28/T54/T58 forces this refresh and checks the original receipt/revision. This functional correction does not grant visual acceptance.

The draft User Guide `guide.page.estimating.discovery.id` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Incoming: the CR-02 sales-to-estimating handover (accepted submission with opportunity, customer and one site) and permitted Facility and equipment references; the CS-08 survey is declared but not yet integrated. Outgoing: the immutable discovery revision and the Draft quotation render. The manual estimate receives a saved, Complete basis only by explicit adoption. Sent, accepted and converted belong to ES-05, ES-06 and ES-07.

Checked on 24 September 2026: a paired design and build comparison at 1440, 1024, 390 and 320 px, and an automated axe-core audit with no violations on the board and two on the build (B5, B6). Not checked: keyboard order, focus return, 200% zoom, screen reader, real devices, the build's Alternatives and Revisions tabs and dialogs, and the business journey. Visual review of this entry remains **Needs review**. Do not replace a comparison image simply to make a test pass.

## Accepted Sales brief link (LC-13)

Keep the existing scope ID and r20 record workspace/intake worklist page type. Incoming: exact current accepted Sales event and source facts. Outgoing: explicit immutable link to the existing native estimating workspace, selected option and scope revision. Reuse PageHeader, Button, Field, error/status controls, native details disclosure and the existing command journal. The existing CRM panel and estimating layout are retained legacy host exceptions; no shared style system changes.

From accepted Intake, open an existing workspace or create native Discovery. Show Sales problem, scope, exclusions, assumptions, unknowns and requested-date basis as reported context; do not pre-confirm Discovery answers. A successful creation returns to the handover for a separate link review. Compare both saved versions, record a reason and save the link. Keep that comparison fixed through background refresh. Separate current acceptance, source drift and historical links. A denied target displays no retained target identities. An interrupted link recovers the exact original from the actor-scoped journal, including after reload.

Desktop: place the link comparison and separate native-creation result beside the accepted brief; use labelled saved versions and wrap long reasons. Phone: stack the same controls at 390 and 320 CSS px, keep recovery controls reachable and contain scope text without horizontal overflow. Keyboard navigation must reach the native workspace and original-result controls. The new-state mockup images are missing; retain the exact existing HTML/image references above. This is a proposed additive adaptation, not adopted paired visual or owner acceptance.

Backend continuation, 12 October 2026: [ADR-0054](../../../decisions/ADR-0054-es02-equipment-catalogue.md) adds opt-in r02 six-family/category persistence and exact historical compatibility. Current native creation stays r01; r02 authoring and accepted Figma alignment remain separate. Reuse the existing family-icon fallback for unfamiliar saved family IDs. Preserve the existing desktop/mobile contracts, scope, references and pending review; no visual acceptance is inferred.
