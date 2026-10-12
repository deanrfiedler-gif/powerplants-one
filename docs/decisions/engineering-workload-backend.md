# Engineering workload register backend

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 13 October 2026. Status: user-authorised BC-01 backend implementation; independent review, owner acceptance and deployment separate.

## Outcome and source

Continue the [backend completion plan](../delivery/backend-completion-plan.md) from main `7e4ef3b`. EN-01 / ENG-01 needs sorted, permission-scoped register reads for the [accepted Engineering workload design](engineering-workload-design.md). Existing package commands, technical source/release rules and detail reads remain authoritative. Trace: ENG-01/02/04, AT-01, PT-01; no parent IDs change.

Reuse Next.js, PostgreSQL, native Engineering projection/visibility, technical counts and the existing signed page-token helper. No new technology, migration, seed or capability. A browser-sorted first page cannot establish register ordering or menu totals; a copied permission engine risks divergence. Add a dedicated read endpoint rather than change the existing list DTO.

## Read contract

`GET /api/v1/engineering/register` accepts `q` (literal, trimmed search, at most 200 characters), `owner_id`, `discipline`, `attention=true|false`, `view=all|mine|author|review|released`, `sort=RequiredDate|ActionDate|Name|Updated`, `direction=asc|desc`, `limit` (1–100, default 50) and the returned `cursor`. Default ordering is RequiredDate ascending; missing dates are last in either direction and UUID breaks ties.

Reuse current package context/company/site/working-company access and exact technical source visibility. My work means assigned package ownership; Author actions, Reviews assigned to me and Released use native technical counts. Coordination state never establishes release. Needs attention uses the recorded blocker, permitted deliverables lacking prerequisite evidence, overdue required date or overdue action date. One explicit Brisbane date applies to the complete read.

Menu counts cover all authorised search/discipline/owner/attention matches before the selected view/state and before pagination. They count packages, not technical records, and include the three native coordination statuses. Optional `state=Queued|In design|Awaiting information` intersects the selected view. Return selected matching count, page completeness and observation time separately. No candidate-window total is labelled global.

Engineer filter options are distinct recorded owners of authorised search/discipline/attention matches, before owner/view selection. They include an explicit current active flag; an inactive recorded owner remains filterable. These are filter choices, not people eligible for new assignment. Existing context-bound owner options retain that command responsibility. Return up to 100 choices and an explicit has-more flag; refine search/discipline when bounded. No unrelated directory identity is disclosed.

Page tokens bind actor, workspace, working company, normalised filters, page size, ordering and the current source fingerprint. A changed source invalidates the continuation and asks for a fresh first page. Tokens are transient across server restarts, as in the shared helper; they confer no authority. Missing anchors are refused. Counts, options and page rows share one source contract. A final fresh source check refuses the entire response if visible records, technical facts, names, filter choices or scope change during assembly; current read authority is checked again. Ordinary reads create no effects.

## Implementation and evidence boundary

Return the existing explicit package projection with permitted technical counts, needs-attention and owner-active facts. Actual effort, utilisation and availability remain unknown; this read invents none. Existing package details and coordination commands serve the future record window. No Figma, shell, component, guide workflow, export or business command change.

Prove full-match counts beyond one page, deterministic null/tie ordering, every view, literal filters, signed/stale continuation, inactive owner visibility, source-change release invalidation, company/site/workspace and restricted-source isolation, working-company narrowing and late revocation. Exercise connected native writes through the compiled HTTP route and verify old list/detail compatibility. Keep source-bound [execution evidence](../testing/evidence/engineering-workload/README.md), retained failures, CI and human acceptance separate.
