# Owned downstream material resolution

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. SYN-ES07-07; ES-07, SC-09 and PJ-03. Authorised synthetic implementation under the [decision](../decisions/quotation-material-resolution.md). Functional proof, visual review, owner acceptance and deployment are separate in the [ledger](../testing/evidence/quotation-material-resolution/README.md).

Native ownership follows the adopted [Projects schedule decision](../decisions/projects-gantt-integration.md) and [Projects handover/recovery rules](../delivery/projects-gantt-integration.md), plus [ADR-0049](../decisions/ADR-0049-native-supply-chain.md). Those earlier records keep their historical validation status; this contract adds bounded receiving and atomic composition without changing ordinary SaveProjectTask semantics.

## Exact native action

An independently received allocation reduction can leave a Project-origin Demand unmet with a current Requested Impact and linked MaterialAction. Its accepted Supply referral may coordinate withdrawal of both dates from one existing internally owned, non-milestone, zero-progress Planned task in that Project. Reuse Projects `SaveProjectTask`: dates become null/Unscheduled; status remains Planned. Project and task each advance one version. Native `Supply:Fact:Impact` appends a Reviewed successor of only the selected Impact, advances its Demand once and retains the same Activity. The original quotation-converted OtherApproved Demand is never relabelled to qualify.

This is one small atomic synthetic contract in the existing workspace transaction. The coordinator calls both owning command bodies; it does not directly update domain rows. Completion requires both exact native receipts, the Project schedule event and matching Impact successor. A review-reference note, Reviewed status or completed Activity cannot substitute for that proof. Allocations, Receipt observations, Demand quantity/classification, other Impacts, Activities, other tasks, Project context/target date and issued output bytes remain unchanged.

## Receiving and authority

| Receiving role | Exact affected record | Required duty |
|---|---|---|
| Demand | Selected reduced Demand; Impact successor versions it | `supply.coordinate` |
| Project | Project aggregate version and programme consequence | `project.edit` |
| Task | Existing task and withdrawn forecast dates | `project.read` |
| MaterialAction | Existing Activity and scoped follow-up evidence; Activity unchanged | `activity.edit` |

Each current owner records an independent Accepted, Returned or Held decision, even when one person holds several roles. All require current quotation/source, company/site, Supply, Project, Activity and linked-record reads. The applying referral owner requires the original conversion/Supply coordination duties plus the owning Projects write duty. Assignment and earlier Receipt/allocation acceptance grant none of these duties. Correction names the exact previous decision; correction after review requires a new review.

Current authority precedes all snapshots, summaries, historical outcomes and original receipts. The receiving worklist admits a permitted independently receiving downstream owner without granting Supply coordination. New/revoked source, dependency or owner authority holds unexecuted work. Exact original recovery remains actor-bound and checks current original duties even after reassignment.

Proposal dependencies also bind opaque hashes of the effective grants for each receiving role and the native actor, limited to relevant duties and graph scopes. A newly issued or changed relevant grant requires renewed exact receiving even if it still permits the action. Grant rows are not exposed as another owner's administrative data. Read-time authority reuse is confined to identical evidence within one actor's serialized read; it never crosses requests or owners.

## Commands

POST `/api/v1/estimating/quotes/[id]/conversion/material-{propose,receive,review,apply}` uses the established schema-1 envelope: actor-bound `operation_id`, reason, evidence, explicit `synthetic_only`, target/execution IDs, current follow-up sequence and basis hash. All additionally require exact current `referral_id` and `expected_material_sequence`. Unknown fields are refused.

| Command | Additional exact inputs | Result |
|---|---|---|
| Propose | `allocation_outcome_id`, `demand_id`, `impact_id`, `task_id`, latest proposal `predecessor_id` | Immutable source/dependency snapshot, complete proposal hash, two reserved original native commands |
| Receive | `proposal_id`, `proposal_hash`, `role`, `decision`, previous role decision `predecessor_id` | Attributable separate receiving with actor and server time |
| Review | `proposal_id`, `proposal_hash`, previous review `predecessor_id`, `decision` | Immutable WithdrawForecast, Retain or Hold review with latest receiving IDs |
| Apply | `review_id`, `review_hash` | Immutable returned outcome; two native receipts only for permitted WithdrawForecast |

GET conversion detail returns `material_resolution`: current candidates, exact history, dependencies/readiness, required receiving and applicability. Every event binds original issue/source line, completed conversion, referral, Receipt correction/proposal/receiving, allocation proposal/review/receiving/native receipt, selected Demand, Impact predecessor chain, MaterialAction, Project/task, versions, actor, reason, evidence and server time. Existing referral due date or explicit Date needed remains authoritative. Corrected/reassigned work retains all prior events. Another accepted active target cannot own the same Impact/task.

## Prerequisites and holds

Execution requires an Active Project, both existing dates, an internal task owner and the exact current Requested Impact. Incoming/outgoing task dependencies, linked Engineering packages or acceptance stages, consequential Demand facts/children, attendance/technical/customer-commitment links, incomplete material sources and unknown external outcomes require their own workflow and hold this slice. A completed/cancelled MaterialAction does not resolve the Impact. No lower-bound, external-event reversal, resource or commercial approval policy is invented.

Relevant source, Receipt, allocation, Demand, Impact, Activity, Project/task, ownership, receiving or authority changes invalidate applicable unexecuted work. Selected Project changes are relevant because the native command versions that aggregate. Unrelated Projects and Supply records do not invalidate the proposal. New consequential dependencies are detected under workspace serialization immediately before mutation.

Retain/Hold freeze reviewed evidence and return an explicit continuing follow-up without native receipts. An applied forecast withdrawal resolves only the evidenced forecast consequence. Unmet Demand and unrelated Requested Impacts remain visible. Fresh native material readiness is computed; current ES-07 exceptions require fresh explicit disposition. Quotation retention leaves operational follow-up available and supplies no operational approval.

## Recovery and storage

Migration 0067 adds immutable `quote_material_events`, exact predecessor/sequence/receiving guards, native reservations and deferred receipt/history checks. It adds no identity, seed, grant, capability or technology. Original migrations and command hashes remain unchanged. The existing actor-bound browser journal retains an uncertain original through reload and blocks replacement. Missing receipt is inconclusive; recover or retry the exact original. Same operation with changed payload conflicts. Workspace serialization and one-application constraints prevent duplicate effects. Any native or late evidence refusal rolls back both effects and their histories/receipts.

Populated upgrade and actual application/PostgreSQL restart checks preserve original records and output bytes. Hosted upgrade is reviewed for generic runtime table privileges; deployment is not performed. MYOB remains intended ERP authority, SharePoint owns business documents and CAD tools retain authoring. Commercial thresholds, observation age, integration mappings and broader downstream resolution remain Not configured.
