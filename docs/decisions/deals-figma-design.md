# Deals Figma design

**Owner:** Dean Fiedler · **Date:** 13 October 2026 · **Status:** Requested design delivered as a proposal; owner acceptance pending.

## Request and source

Dean requested the Deals module UI in the existing PPO Design file using `docs/reference/ui/deals/ppo-deal-pipeline_r37.html`. The supplied node `190:20237` is the accepted Leads page. A dedicated [Deals (proposal) page](https://www.figma.com/design/epLfuDjst5hUJeqBi3eJo8/PPO---Design?node-id=549-2) preserves that existing work. The choice of r37 follows this specific request; the repository's retained r38 runtime references remain unchanged.

Source SHA-256: `3b0d7806907bc97e9db37f5ae7d0cedf385abb6d9ec2781b0bedd1e8e7c4ca39`. The issued HTML bytes were not edited. A temporary local copy was used for rendered inspection and a temporary Figma capture; the capture was removed after native composition.

## Conformance

| Field | Delivery |
|---|---|
| Scope | PPO-009 CRM Deals worklist; current consumer `route:/sales/opportunities` and related `scope:CR-04`; all parent IDs retained |
| Page type | Register / worklist; supporting persistent record snapshot and Form / guided workflow for pipeline configuration |
| Source authority | User-selected r37 reference and existing PPO Figma components; proposed composition and synthetic fixtures, not operating rules |
| Reused components | Sales rail `190:20256`, shared top bar `35:138`, Button `3:17`/`3:29`, local Roboto text styles and PPO colour/layout variables; r37 inline SVG icons |
| New local components | Deals/Card Default and Rotting variants; desktop/phone list rows; form field; checkbox option; source SVG icon components |
| Incoming | Synthetic qualified opportunity, owner, stage/version, contact and current next activity |
| Outgoing | Reviewable follow-up, stage and pipeline context within CRM; Won does not create an order or authorise Projects/ERP work |
| Exceptions shown | Missing next action, overdue activity, rotting, forecast ahead, expired quotation, unknown estimate and external activity owner |
| Proposed departures | Collapsed Sales rail around the standalone workspace; existing shared shell/controls; stacked phone list; simplified Figma controls and bounded navigation between six composed states |
| Verification | Editable structure, source totals/counts and rendered desktop/phone inspection; exact frame links and PNG evidence are in the execution record |

## Acceptance boundary

This is Figma design delivery. Navigation links connect desktop Board/List, the first deal's Snapshot, Filters and Pipeline settings, with returns to the board. Apply/Save are review navigation only: they do not execute or persist a filter/pipeline command. Other source actions, drag behaviour, loading/error families, full record pages and additional responsive states remain outside these six views. No application, database, permission, dependency or hosted deployment changed.

The [working page contract](../design/development/pages/route-sales-opportunities.md), [component contract](../design/development/components/sales-board.md) and [evidence](../testing/evidence/deals-figma/README.md) retain separate source presence, agent visual inspection, owner review, runtime proof and deployment status. Existing review fingerprints were not refreshed.
