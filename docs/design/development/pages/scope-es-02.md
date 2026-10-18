# Estimation Wizard · discovery, alternatives & revisions — design reference

Stable entry: `scope:ES-02`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/estimating/discovery`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Current native page — 13 October 2026

The [Figma implementation decision](../../../decisions/es02-wizard-figma-implementation.md) supersedes the historical pending-implementation statements below. Six-family/category authoring, explicit historical classification review and phone editor now use the existing ADR-0054 backend. See the [current record-page contract](route-estimating-discovery-id.md) and [execution evidence](../../../testing/evidence/es02-figma/README.md). Owner visual acceptance and deployment remain separate.

## Purpose and task

Retain the native five-step wizard delivered by PR #272, including exact revision comparison, structured multi-area scope, source-change handling, immutable alternatives and saved-cost reads. The 24 September reconciliation updates the workload return link and removes obsolete wording that denied the now-native ES-08 specialist integration. No discovery DTO, hash, command, schema or costing guarantee changes.

1. Review Requirements, Configuration, Scope & delivery, Pricing and Review
2. Keep alternatives and their exact revisions distinct
3. Check the saved cost basis before preparing a quotation

**Page built to the board, 12 October 2026.** On Dean's instruction the discovery workspace was rebuilt to design board r01's composition; the [build record](../../../decisions/es02-wizard-ui-build.md) lists what was adopted (P3–P7, P9, the O1 recommendation, B1–B4 and B6) and what still waits (P1/P2 need the successor configuration definition; P8 is a shell change). Visual review is pending.

**Design board r01, 24 September 2026.** An in-app design board re-bases the wizard onto the running shell and build plan r04 and compares it with the running build on `main` `72b2769`. It records one user decision: six equipment families with 108 categories replace r04 §4.7's four presentation groups (23 September 2026). Implementing that needs a successor to configuration definition `PPO-ES02-CONFIG-r01`, a migration and an ADR amending ADR-0035; none is authorised. The board's proposals P2–P9 and open decision O1 are not accepted. It also records six findings against the running build (B1–B6). See the [design board record](../../../decisions/es02-design-board.md); the page-level contract, with measured geometry, is in [the discovery workspace entry](route-estimating-discovery-id.md).

## Desktop

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

The measured desktop composition of the running wizard, and the board's proposed alternative, are recorded in the [discovery workspace entry](route-estimating-discovery-id.md#desktop). Desktop control height (36 px in the wizard against the 44 px shared token) is open decision O1.

## Mobile

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

On phones the running wizard renders fields at 14–14.4 px and controls at 30–38 px (findings B3 and B4); the board proposes 16 px fields and 44 px controls. Measurements are in the [discovery workspace entry](route-estimating-discovery-id.md#mobile).

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [read-only-summary.png](../../../testing/evidence/es02-native-r01/read-only-summary.png)
- [PPO-Estimation-Wizard-Container-r03.html](../../../reference/ui/estimating/PPO-Estimation-Wizard-Container-r03.html)
- [Discovery register design r01](../../../reference/ui/estimating/discovery-register-figma-design-r01/README.md) — the register at `/estimating/discovery` (`route:/estimating/discovery`), owner-accepted 18 October 2026; [decision](../../../decisions/discovery-register-figma-design.md). Not built
- [Create discovery workspace design r01](../../../reference/ui/estimating/create-discovery-workspace-figma-design-r01/README.md) — `/estimating/discovery/new` (`route:/estimating/discovery/new`), owner-accepted 18 October 2026; [decision](../../../decisions/create-discovery-workspace-figma-design.md). Not built
- [Discovery costing design r01](../../../reference/ui/estimating/discovery-costing-figma-design-r01/README.md) — `/estimating/discovery/[id]/costing` (`route:/estimating/discovery/[id]/costing`), owner-accepted 18 October 2026; [decision](../../../decisions/discovery-costing-figma-design.md). Not built
- [Design board r01](../../../reference/ui/estimating/design-board-r01/README.md) — 30 artboards, proposed and not accepted; key boards: [06 · Equipment families](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-06-Equipment-Families-r01.png) (1440 × 1780), [07 · Departures](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-07-Departures-and-Build-Findings-r01.png) (1440 × 1440), [04 · Design versus current build](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-04-Design-Versus-Current-Build-r01.png) (1440 × 2500), [S2 · Configuration](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-S2-Configuration-r01.png) (1440 × 1770) and [R2 · Phone configuration](../../../reference/ui/estimating/design-board-r01/PPO-ES-02-Design-Board-R2-Phone-390-Configuration-r01.png) (390 × 844)
- [Paired build evidence](../../../testing/evidence/es02-design-board-r01/README.md) — application captures and measurements on `main` `72b2769`

## Behaviour, handovers and verification

The draft User Guide `guide.es.02` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Accepted Sales brief link (LC-13)

Keep the existing scope ID and r20 record workspace/intake worklist page type. Incoming: exact current accepted Sales event and source facts. Outgoing: explicit immutable link to the existing native estimating workspace, selected option and scope revision. Reuse PageHeader, Button, Field, error/status controls, native details disclosure and the existing command journal. The existing CRM panel and estimating layout are retained legacy host exceptions; no shared style system changes.

From accepted Intake, open an existing workspace or create native Discovery. Show Sales problem, scope, exclusions, assumptions, unknowns and requested-date basis as reported context; do not pre-confirm Discovery answers. A successful creation returns to the handover for a separate link review. Compare both saved versions, record a reason and save the link. Keep that comparison fixed through background refresh. Separate current acceptance, source drift and historical links. A denied target displays no retained target identities. An interrupted link recovers the exact original from the actor-scoped journal, including after reload.

Desktop: place the link comparison and separate native-creation result beside the accepted brief; use labelled saved versions and wrap long reasons. Phone: stack the same controls at 390 and 320 CSS px, keep recovery controls reachable and contain scope text without horizontal overflow. Keyboard navigation must reach the native workspace and original-result controls. The new-state mockup images are missing; retain the exact existing HTML/image references above. This is a proposed additive adaptation, not adopted paired visual or owner acceptance.
