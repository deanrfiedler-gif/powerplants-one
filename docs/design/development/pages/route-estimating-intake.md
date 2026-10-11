# Estimating Intake — design contract

<!-- versioning: git; committed history is authoritative -->

Stable entry: `route:/estimating/intake`. Owner: Dean Fiedler. Review: pending. Parent scope: CR-02. Route: `/estimating/intake`.

## Native Sales implementation contract

Save a Sales brief, submit an exact frozen revision and record an independent Estimating receiving decision.

- Sales preparation worklist: select a permitted deal and create its draft.
- Brief: problem/outcome, included scope, exclusions, assumptions, unknowns, date, locations/equipment and exact evidence.
- Review: Submit, Clarify, Answer, Resolve, Return and Accept remain separate.
- History and comparison: source basis and immutable revisions. Estimating Intake shows submitted briefs.

The current deal owner needs opportunity edit access. The chosen receiver needs estimating.edit and source visibility. Prepare an open, owned and dated Activity linked to the Opportunity.

Save is not Submit. Submission freezes content. Accepted for estimating is not estimate or quotation approval. A later draft never replaces the previous submitted basis. Evidence identifies its native source and exact revision.

Acceptance records receiving evidence only. It does not create or approve an Estimate. The latest submitted revision remains the Intake basis while a successor is a draft.

## Desktop

Accepted design (11 October 2026): the [Sales briefs design decision](../../../decisions/sales-briefs-design.md), with captures 01–03 in [Sales briefs design r01](../../../reference/ui/estimating/sales-briefs-design-r01/README.md). It reuses the [Reviews & approvals](../../../decisions/estimate-reviews-design.md) shell and grid. The design labels this destination Sales briefs; the app still shows Intake and the earlier cards, and the shell parts wait for their own rollout decision.

- **Layout at 1440 × 900:** the labelled 240 px rail with Sales briefs selected (white tile, Solid inbox icon); the breadcrumb "Estimating & quotation / Sales briefs" as the page title; a flush 240 px secondary menu; then a 60 px toolbar and a full-bleed grid.
- **Secondary menu:** All briefs, Awaiting my decision (receiving owner is me; Submitted or Clarification answered) and Assigned to me; a State group (Submitted, Clarification requested, Clarification answered, Returned, Accepted); an Attention group (Source changed). Neutral counts appear on open views only. It collapses to a 20 px strip from its right border or the top-bar toggle.
- **Toolbar:** Customer and Receiving owner filters, the count with its refresh time, Refresh and "…".
- **Grid:** one row per brief at its latest submitted revision. Single-line 40 px rows with lines between cells. Columns: Opportunity (reference and revision), Title, Customer, State (icon and words), Updated (sorted, newest first), Requested ("Date needed" when Sales gave a reason instead), Receiving owner and Sales owner. The checkbox column and the settings and "…" column stay fixed while the grid scrolls sideways. Long titles and customers end with an ellipsis; the record window shows them in full.
- **State:** the receiving states as the code records them. "· source changed" is added in the warning text colour to an open brief whose source fingerprint changed; Returned is muted; every state has words.
- **Record window:** clicking a row opens it over the grid, never squeezing it. Its left edge meets the secondary menu's right edge, with close, previous and next on that edge. It shows the summary, the frozen brief, the rule note, Clarification and Evidence tabs, and History. Its buttons are Open opportunity and Open brief; receiving decisions stay on the brief page.
- **Selection:** ticking rows shows a selection toolbar and a 360 px panel with Open in sequence and Export list only.

The brief page itself keeps the requirements below.

 retain the current shell, Roboto/Verdana and navy/green tokens. Reuse PageHeader, Button, Field, SelectField, RecordTabs and error/status controls. Keep review decisions after the brief, immutable history separate and long reasons wrapping. Inspect at 1440 × 960 and 1024 × 768.

## Mobile

Accepted design (11 October 2026): captures 04–05 in [Sales briefs design r01](../../../reference/ui/estimating/sales-briefs-design-r01/README.md).

- **Header and toolbar at 390 × 844:** the page name "Sales briefs" only, with no breadcrumb. A toolbar holds a view picker ("All briefs") standing in for the secondary menu, the count and a filter icon button.
- **List:** flush list rows about 80 px tall, each showing the title and last update, the reference and customer, and the state and requested date, with a chevron.
- **Record view:** tapping a row opens a full-screen record view with back, previous and next. The brief is stacked, and Open opportunity and Open brief are fixed at the bottom.
- **Tab bar:** icons only, the five Estimating tabs, each with a hidden accessible label. Sales briefs is reached through More, so More is the current tab. Phone selection of several rows is not designed yet.

The brief page itself keeps the requirements below.

 stack fields/actions, keep every tab reachable and contain table/history overflow. Inspect at 390 × 844, 320 CSS px and 200% zoom; keyboard focus and recovery state must stay visible.

Loading, empty/filter-empty, partial, failed, denied, read-only, validation, saving, saved, uncertain and source-changed states remain explicit. The guide `guide.route-estimating-intake` carries normal and recovery steps.

Accepted Figma design for the receiving queue: [Sales briefs design r01 captures](../../../reference/ui/estimating/sales-briefs-design-r01/README.md) (icon-free PNGs; not application captures). Retained reference: `docs/reference/ui/estimating/sales-estimating-intake-preview-r02.html`. Missing mobile reference images are explicitly unprovided. The current shell and server authority govern departures from demonstration HTML. ADR-0046 recorded the earlier quotation boundary. Current native ES-05/06/07 engines exist; Sales quotation/outcome integration and automatic downstream effects remain separate from this handover. Actual paired captures and differences are recorded in `docs/delivery/sales-native-completion-handover.md`; acceptance is pending.

## Accepted Sales brief link (LC-13)

Keep the existing scope ID and r20 record workspace/intake worklist page type. Incoming: exact current accepted Sales event and source facts. Outgoing: explicit immutable link to the existing native estimating workspace, selected option and scope revision. Reuse PageHeader, Button, Field, error/status controls, native details disclosure and the existing command journal. The existing CRM panel and estimating layout are retained legacy host exceptions; no shared style system changes.

From accepted Intake, open an existing workspace or create native Discovery. Show Sales problem, scope, exclusions, assumptions, unknowns and requested-date basis as reported context; do not pre-confirm Discovery answers. A successful creation returns to the handover for a separate link review. Compare both saved versions, record a reason and save the link. Keep that comparison fixed through background refresh. Separate current acceptance, source drift and historical links. A denied target displays no retained target identities. An interrupted link recovers the exact original from the actor-scoped journal, including after reload.

Desktop: place the link comparison and separate native-creation result beside the accepted brief; use labelled saved versions and wrap long reasons. Phone: stack the same controls at 390 and 320 CSS px, keep recovery controls reachable and contain scope text without horizontal overflow. Keyboard navigation must reach the native workspace and original-result controls. The new-state mockup images are missing; retain the exact existing HTML/image references above. This is a proposed additive adaptation, not adopted paired visual or owner acceptance.

## NAV contextual navigation

Receiving Intake is a separate permitted Estimating destination from Intake & workload; receiving ownership and contextual Sales handovers remain distinct.

Desktop uses the existing shell with a 76 px compact or 232 px labelled primary rail. Mobile uses labelled destinations and More > Workspace; Home/search/help remain reachable. Check 320/390/780/781/1199/1200 px where applicable, long labels, visible focus and Escape/return focus. Missing accepted images remain explicit; no new accepted image or review fingerprint is recorded. Functional results and screenshot observations are in the NAV ledger; owner/device review and deployment remain separate.
