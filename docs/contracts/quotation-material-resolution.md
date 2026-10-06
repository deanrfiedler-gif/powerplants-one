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

Retain/Hold freeze reviewed evidence and return an explicit continuing follow-up without native receipts. An applied forecast withdrawal resolves only the evidenced forecast consequence. Unmet Demand and unrelated Requested Impacts remain visible. Fresh native material readiness is computed; current ES-07 exceptions require fresh explicit disposition. Quotation retention leaves operational follow-up available and supplies no operational approval. Pending material proposals, receiving and frozen reviews do not themselves reopen retained quotation disposition. Only returned material outcomes enter its evidence basis; relevant native dependency changes still require fresh assessment. Current authority is checked before pending or historical evidence is disclosed.

## Recovery and storage

Migration 0067 adds immutable `quote_material_events`, exact predecessor/sequence/receiving guards, native reservations and deferred receipt/history checks. It adds no identity, seed, grant, capability or technology. Original migrations and command hashes remain unchanged. The existing actor-bound browser journal retains an uncertain original through reload and blocks replacement. Missing receipt is inconclusive; recover or retry the exact original. Same operation with changed payload conflicts. Workspace serialization and one-application constraints prevent duplicate effects. Any native or late evidence refusal rolls back both effects and their histories/receipts.

Populated upgrade and actual application/PostgreSQL restart checks preserve original records and output bytes. Hosted upgrade is reviewed for generic runtime table privileges; deployment is not performed. MYOB remains intended ERP authority, SharePoint owns business documents and CAD tools retain authoring. Commercial thresholds, observation age, integration mappings and broader downstream resolution remain Not configured.

## One independently received Project dependency — SYN-ES07-08

SYN-ES07-08 adds explicit receiving for one FS/SS successor: withdraw both forecast dates from A and B, preserve their dependency, require five separate owner decisions, then atomically execute two native Projects task saves and the exact Impact successor. Project advances twice; each task and the selected Demand once. Unmet Demand, independent Impacts, Activity ownership and fresh explicit ES-07 disposition remain. Additional relationships or consequential links hold execution.

The [adopted dependency decision](../decisions/quotation-task-dependency.md) and [handover](../delivery/quotation-task-dependency-handover.md) define direction, native warnings, unchanged relationship and exact recovery. `material-propose` optionally adds `successor_task_id`; omission retains every original isolated command hash. Selecting B adds the Successor receiving role with current Project/source read authority and a reserved successor `SaveProjectTask` command at Project version +1. The proposal and immutable review bind both tasks and all three native operations. Five exact acceptances precede review/application. Both task saves and the Impact successor commit or roll back together. Original two-receipt outcomes remain unchanged and recoverable after migration 0068. [Execution evidence](../testing/evidence/quotation-task-dependency/README.md) remains separate from acceptance and deployment.

The applied pair has the following complete native write footprint, including ordinary owning-workflow evidence. Live trigger definitions, not only their introducing migrations, establish the revision and typed-history effects.

| Record | Exact application effect |
|---|---|
| `projects` | Selected aggregate advances twice; native updater/server timestamps change; business context and target date remain. |
| `project_tasks` | A and B each advance once, both forecast dates become null, updater/time change, and `project_version` records P+1 for A and P+2 for B. Other task fields and unrelated tasks remain. |
| `project_dependencies` | Native task save reasserts B's predecessor rows. The one composite identity `(workspace, Project, B, A)` and FS/SS kind are unchanged; this table has no date/version/lag columns. |
| `project_schedule_events`, `business_identities` | Two immutable native schedule snapshots and their two existing-type `ProjectScheduleEvent` identities are created. Existing identities and reference counters remain. |
| `supply_records`, `supply_revisions` | Only the selected Demand advances once with native updater/time/reason; its trigger creates one exact revision. Quantity, classification, origin and other business fields remain. |
| `supply_facts` | One exact Reviewed Impact successor with the selected predecessor and existing MaterialAction ID. No new Activity/link, other fact successor or allocation effect. |
| `quote_material_events` | One immutable MaterialApply outcome advances this target's material sequence, retaining review/receiving/native commands, three receipts and actual after-position. |
| `operation_receipts`, `audit_events`, `outbox_jobs` | Four of each: three native originals plus MaterialApply's original. Outbox families are two ProjectTaskSaved, one SupplyRecorded and one QuotationSupplyRecorded; these are synthetic event jobs, not new business Activities. |

The existing actor-bound browser journal retains uncertainty and clears pending state only after confirmed original recovery/application. The server does not rewrite quotation issue/source, conversion, referral, receiving, correction, allocation or review predecessors. Rollback removes the entire write footprint above together; retained histories and output bytes survive both failure and successful execution.

## Three independently received Project tasks — SYN-ES07-09

SYN-ES07-09 extends the exact received allocation outcome to explicitly selected A → B → C in the same Active Project. Six separate decisions cover Demand, Project coordinator, A owner, MaterialAction owner, B owner and C owner. Immutable review precedes separate atomic application of three native task saves and the exact Impact successor. All four FS/SS combinations are supported; every additional touching edge or consequential link holds execution. Each task advances once, Project three times, Demand once; both relationships remain. Four native receipts substantiate scoped forecast withdrawal. Unmet Demand, independent Impacts, the Activity lifecycle and fresh explicit ES-07 disposition remain. Earlier isolated/two-task payloads and outcomes retain recovery. See [decision](../decisions/quotation-task-chain.md), [handover](../delivery/quotation-task-chain-handover.md) and [execution ledger](../testing/evidence/quotation-task-chain/README.md).

`material-propose` optionally adds `chain_end_task_id` together with `successor_task_id`. Omission preserves earlier normalised commands. `ChainEnd` is C’s separate receiving role (shown as Third task), requiring current project.read and complete linked reads. The optional stored `chain_end_command` reserves C’s native save at Project P+2. The six decisions bind the complete proposal; no earlier consent transfers. Migration 0069 adds no grants, seed, capability or identity type. Current authority precedes old snapshots and originals.

The complete write footprint is three task versions (P+1/P+2/P+3), three Project increments, two unchanged dependency keys/kinds reasserted by native saves, three schedule histories/identities, one Demand increment/revision, one exact predecessor-linked Reviewed Impact with the same MaterialAction, one MaterialApply outcome and five receipt/audit/outbox sets including its coordinator original. Allocations, quantities, classification, Receipt facts, Activity/links, other tasks, references and output bytes remain. Late C, Impact or evidence refusal rolls back the entire footprint. No partial completion. The [decision](../decisions/quotation-task-chain.md) records native warnings, alternatives, authority, exact lineage and remaining holds.

## Owned three-task Project branch — SYN-ES07-10

SYN-ES07-10 makes the previously held A → B and A → C allocation-reduction consequence executable within Projects and the existing Supply Impact workflow. Six separate decisions (Demand, Project, A, MaterialAction, B/Successor and C/BranchSuccessor) precede immutable review and separate atomic application. Three native task saves clear dates and preserve both FS/SS relationships; all four combinations are supported. Each task advances once, Project three times and Demand once. Four native receipts substantiate the exact Impact successor. Unmet Demand, independent holds, Activity lifecycle and fresh explicit ES-07 disposition remain. Extra touching edges/consequential records hold action. Migration 0070 preserves isolated, paired and linear-chain hashes, roles, evidence and recovery.

See the [branch decision](../decisions/quotation-task-branch.md) for exact lineage, receiving authority, native write footprint, refusals and alternatives; the [handover](../delivery/quotation-task-branch-handover.md) and [execution ledger](../testing/evidence/quotation-task-branch/README.md) separate functional proof, visual/owner acceptance and deployment. `branch_successor_task_id` with `successor_task_id` explicitly selects the branch; combining it with `chain_end_task_id` is refused. BranchSuccessor never reinterprets ChainEnd. No native rule, grant, seed, policy or external-system authority changes.

## Owned three-task Project merge — SYN-ES07-11

SYN-ES07-11 makes the previously held three-task merge A → C and B → C executable after an independently received allocation reduction. Six decisions cover Demand, Project coordinator, A, MaterialAction, retained predecessor B and shared successor C. Native saves withdraw A/C forecasts; B's complete native row, dates, status, progress, owner, version and history remain exact. Project advances twice and Demand once; both FS/SS relationships remain, with three native receipts. Unmet Demand and independent holds remain; current ES-07 exceptions require fresh disposition. Migration 0071 preserves earlier isolated, pair, chain and branch contracts and original recovery.

See the [merge decision](../decisions/quotation-task-merge.md) for native evidence, retained B, exact effects, authority, refusals and alternatives; [handover](../delivery/quotation-task-merge-handover.md) and [ledger](../testing/evidence/quotation-task-merge/README.md) separate actual proof from acceptance/deployment. Optional merge_predecessor_task_id and merge_successor_task_id select the topology together, exclusively of earlier inputs. MergePredecessor receives B retention; MergeSuccessor receives C withdrawal. Earlier roles and hashes remain unchanged.
