# Quotation detail — design reference

Stable entry: `route:/estimating/quotes/[id]`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/estimating/quotes/{id}`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

An app page exists here. Its wider workspace scope or newer design still needs refinement; see the linked scope areas below.

1. Confirm the record reference and customer/site context in this record workspace.
2. Find the intake or existing estimate
3. Check scope completeness and required clarification
4. Assign or review the next estimating action

## Desktop

Accepted design: the [Quotation detail design decision](../../../decisions/quotation-detail-figma-design.md) of 23 October 2026 makes this page the hub of one quotation across its life, with 22 icon-free captures in [design r01](../../../reference/ui/estimating/quotation-detail-design-r01/README.md). Departures D1–D16 and answers Q1–Q11 are recorded there: the shared record layout with an eight-step lifecycle bar (facts with dates, never a percentage), a primary action that follows state, a details column with the Customer views line and a linked-records chain, and seven tabs (Document with a Customer page preview, Revisions with compare, Distribution, Customer views, Response, Follow-up and History). Every decision stays on the release, response and conversion pages. The page opens in the Sales rail for deal owners and in the Estimating rail for estimators. Nothing new is built; today's page is unchanged.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 12–16 in [design r01](../../../reference/ui/estimating/quotation-detail-design-r01/README.md): the tablet record at 1024, and the deal owner's phone record at 390 and 320 with the compact record header, the lifecycle as a list, the Customer views line, the reflowed issued document, section links to the other tabs, and a sticky bar with Download PDF and the state's primary action.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Accepted Figma design: [Quotation detail design r01 captures](../../../reference/ui/estimating/quotation-detail-design-r01/README.md) (22 icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/quotation-detail-figma-design.md). No HTML reference exists.

## Behaviour, handovers and verification

Accepted Figma design: see the [decision](../../../decisions/quotation-detail-figma-design.md). Declined, Clarification, Negotiation, Returned, Held and Converted states, the record "…" menu, phone sub-pages for the other tabs and 200% zoom are not drawn. Customer views need quote view tracking stage QV-S1, and real send outcomes need ADR-0059 and QV-S2. Dean saved the named Figma version "Quotation detail — shared record layout, accepted" on 25 October 2026.

The draft User Guide `guide.page.estimating.quotes.id` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Controlled synthetic release

Permitted staff can open the ES-05 release workspace from an exact Draft. New synthetic release revisions use that workspace and retain separate preparation/approval/issue/distribution facts. E1 Draft output and safe-only reader boundaries remain retained. See [release guidance](route-estimating-quotes-id-release.md).
