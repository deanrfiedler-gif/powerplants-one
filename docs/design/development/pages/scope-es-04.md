# Estimate review and pricing exceptions — design reference

Stable entry: `scope:ES-04`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/estimating/reviews`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement estimate review, pricing exceptions, findings, corrections and separately authorised approval.

1. Review the submitted costing basis and assumptions
2. Return specific findings to their owners
3. Record the permitted review outcome for that exact revision

## Desktop

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [PPO-Estimate-Review-and-Pricing-Exceptions-r01.html](../../../reference/ui/estimate-review/PPO-Estimate-Review-and-Pricing-Exceptions-r01.html)

## Behaviour, handovers and verification

The draft User Guide `guide.es.04` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Native bounded implementation — 3 October 2026

The saved-estimate entry now links `/estimating/estimates/[id]/review`. Exact submissions, independent evidence-review kinds, attributable findings/corrections and selective applicability are implemented. The proposed review queue remains unbuilt. Commercial approval and pricing exceptions remain Not configured. Reuses the estimate-review host component, shared controls and original-operation journal; incoming/outgoing boundaries and desktop/mobile requirements are in [the native page contract](route-estimating-estimates-id-review.md). Source presence and automated proof do not grant visual, owner or deployment acceptance.

## Queue backend - 12 October 2026

The [read-only queue contract](../../../decisions/estimating-review-queue.md) supplies `GET /api/v1/estimating/reviews` over exact ES-04 submissions and ES-05 prepared quotations. Counts cover authorised rows in one candidate window; a partial or filtered empty window is not a complete backlog. Record links return to the existing native review/release page. The [accepted Figma composition](../../../decisions/estimate-reviews-design.md) remains the page reference; its route, shared shell, record windows, loading/error/stale states and window-count presentation remain unbuilt. This API addition grants no visual review fingerprint or owner acceptance.


The shared [Reviews & approvals register](route-estimating-reviews.md) now supplies the permission-scoped ES-04/ES-05 queue and exact native handovers at `/estimating/reviews`. Earlier standalone workflow proposals remain separate from this accepted register implementation.

## Accepted record design - 30 October 2026

The [Estimate review design decision](../../../decisions/estimate-review-figma-design.md) accepts the record page `/estimating/estimates/[id]/review` on the shared record layout, with [20 icon-free captures](../../../reference/ui/estimating/estimate-review-design-r01/README.md). The application is unchanged by it. Commercial approval and pricing exceptions remain Not configured, and this grants no review fingerprint or UI baseline.
