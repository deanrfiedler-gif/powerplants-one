# Quotation approval, issue and distribution — design reference

Stable entry: `scope:ES-05`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/estimating/quotes`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Extend the current Draft quotation foundation with approval, controlled issue, distribution and superseded-revision handling.

1. Inspect the saved Draft and its cost/scope basis
2. Complete required approval before controlled issue
3. Track distribution outcomes against the issued revision

## Desktop

Accepted design: the [Quotation page design decision](../../../decisions/quotation-page-customer-views-figma-design.md) of 30 October 2026 draws the customer quotation page at an indicative `/quote/[token]`, outside the application shell, and the Send quotation composer on the Distribution step, with 29 icon-free captures in [design r01](../../../reference/ui/estimating/quotation-page-design-r01/README.md). Departures D1–D15 and answers Q1–Q8 are recorded there. Nothing is built; stages QV-S1 to QV-S3 and ADR-0059 keep their own gates. The customer route is registered only when QV-S1 adds it.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 05–08 and 12 in [design r01](../../../reference/ui/estimating/quotation-page-design-r01/README.md): the customer page at 390 and 320 with a compact customer header, the reflowed issued document and a fixed 48 px Download PDF bar, and the link notice.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- Accepted Figma design: [Quotation page design r01 captures](../../../reference/ui/estimating/quotation-page-design-r01/README.md) (29 icon-free PNGs; design compositions, not application captures). See the [Quotation page design decision](../../../decisions/quotation-page-customer-views-figma-design.md).
- [PPO-Quotation-Approval-Issue-and-Distribution-r02.html](../../../reference/ui/quoting/PPO-Quotation-Approval-Issue-and-Distribution-r02.html)

## Behaviour, handovers and verification

The draft User Guide `guide.es.05` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Bounded native release

The native `/estimating/quotes/[id]/release` workflow extends the existing quotation and renderer with exact independent synthetic approval, issue and recorded distribution. [Current guidance](route-estimating-quotes-id-release.md) and [execution evidence](../../../delivery/quotation-release-handover.md) govern the implemented subset. The retained six-view/r03 design, owner acceptance and operational commercial policy remain separate.

## ES-06 receiving link

An exact issued revision now links to the staff response page. Reported acceptance, corrections and negotiation remain separate from ES-05 approval/issue; the link passes this exact revision. See [response contract](../../../contracts/quotation-response.md). The shared panel stylesheet also serves ES-06; its controls and tokens are unchanged.

## NAV contextual navigation

Filter by estimate reference/title and continue through older windows of up to 100 scoped estimates. offset and q are shareable state; each quotation receives an exact access check. Missing or restricted sources are partial, not an empty complete register.

Desktop uses the existing shell with a 76 px compact or 232 px labelled primary rail. Mobile uses labelled destinations and More > Workspace; Home/search/help remain reachable. Check 320/390/780/781/1199/1200 px where applicable, long labels, visible focus and Escape/return focus. Missing accepted images remain explicit; no new accepted image or review fingerprint is recorded. Functional results and screenshot observations are in the NAV ledger; owner/device review and deployment remain separate.


The shared [Reviews & approvals register](route-estimating-reviews.md) now supplies the permission-scoped ES-04/ES-05 queue and exact native handovers at `/estimating/reviews`. Earlier standalone workflow proposals remain separate from this accepted register implementation.
