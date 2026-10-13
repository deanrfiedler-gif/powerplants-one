# Deals Figma design

**Owner:** Dean Fiedler · **Date:** 14 October 2026 · **Status:** Requested design delivered as a proposal; owner acceptance pending.

## Request and source

Dean requested the Deals module UI in the existing PPO Design file using `docs/reference/ui/deals/ppo-deal-pipeline_r37.html`. The supplied node `190:20237` is the accepted Leads page. A dedicated [Deals (proposal) page](https://www.figma.com/design/epLfuDjst5hUJeqBi3eJo8/PPO---Design?node-id=549-2) preserves that existing work. The choice of r37 follows this specific request; the repository's retained r38 runtime references remain unchanged.

Source SHA-256: `3b0d7806907bc97e9db37f5ae7d0cedf385abb6d9ec2781b0bedd1e8e7c4ca39`. The issued HTML bytes were not edited. A temporary local copy was used for rendered inspection and a temporary Figma capture; the capture was removed after native composition.

## Conformance

| Field | Delivery |
|---|---|
| Scope | PPO-009 CRM Deals worklist; current consumer `route:/sales/opportunities` and related `scope:CR-04`; all parent IDs retained |
| Page type | Register / worklist; supporting persistent record snapshot and Form / guided workflow for pipeline configuration |
| Source authority | User-selected r37 reference and existing PPO Figma components; proposed composition and synthetic fixtures, not operating rules |
| Reused components | Sales rail `190:20256`, shared top bar `35:138`, Button `3:17`/`3:29`, accepted Leads Grid header/cell/checkbox/actions components, local Roboto text styles and PPO colour/layout variables; r37 inline SVG icons |
| New local components | Deals/Card Default and Rotting variants; desktop list header/row and phone row; form field; checkbox option; source SVG icon components |
| Incoming | Synthetic qualified opportunity, owner, stage/version, contact and current next activity |
| Outgoing | Reviewable follow-up, stage and pipeline context within CRM; Won does not create an order or authorise Projects/ERP work |
| Exceptions shown | Missing next action, overdue activity, rotting, forecast ahead, expired quotation, unknown estimate and external activity owner |
| Proposed departures | Collapsed Sales rail around the standalone workspace; existing shared shell/controls; stacked phone list; simplified Figma controls and bounded navigation between six composed states |
| Verification | Editable structure, source totals/counts and rendered desktop/phone inspection; exact frame links and PNG evidence are in the execution record |

## User-directed visual refinement

On 14 October Dean supplied a [stage/card screenshot](../testing/evidence/deals-figma/reference-columns.png), requested correctly positioned white chevrons and professional polish, then directed removal of the extra page container and consistency with other PPO tables. These are explicit user directions, not instructions inferred from the HTML.

All four board compositions now use paired 9px outgoing points/incoming cut-ins across 78px headers. Cards retain 264px height and source spacing, with correct activity-type and expected-close icons, overlapping owner avatars, task counts and distinct overdue/rotting cues. The five desktop workspaces place their toolbar, status strip and worklist directly below the shared top bar; the rounded module frame and inset were removed.

The list reuses the exact Grid components used by accepted Leads (`190:20513`): 40px white header and rows, 14px Roboto, 12px cell padding, fine right/bottom dividers, neutral stage tags, checkboxes, number alignment and action cells. Contact and next-activity due are separate columns. The 1604px grid scrolls horizontally within the 1364px workspace; all 18 rows fit vertically. Shared component masters and issued HTML remain unchanged.

## Acceptance boundary

This is Figma design delivery. Navigation links connect desktop Board/List, the first deal's Snapshot, Filters and Pipeline settings, with returns to the board. Apply/Save are review navigation only: they do not execute or persist a filter/pipeline command. Other source actions, drag behaviour, loading/error families, full record pages and additional responsive states remain outside these six views. No application, database, permission, dependency or hosted deployment changed.

The [working page contract](../design/development/pages/route-sales-opportunities.md), [component contract](../design/development/components/sales-board.md) and [evidence](../testing/evidence/deals-figma/README.md) retain separate source presence, agent visual inspection, owner review, runtime proof and deployment status. Existing review fingerprints were not refreshed.
