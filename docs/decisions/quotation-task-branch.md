# Owned three-task Project branch forecast withdrawal

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. 6 October 2026. SYN-ES07-10. Authorised synthetic implementation choice; independent review and owner acceptance pending. ES-07 / SC-09 / PJ-03; EST-03/08/09, SCM-08, PRJ-02/04, IF-03/13/14, AT-05/26/29/32. Preserve all parent IDs and issued references.

## Refreshed source and native semantics

Refreshed main is #352 merge `1ffcf653cd94982ea3f58253d3dc9c4f9be7ebbc`, containing final checked head `3a2e1c02bdbfd84af589e1618b33bc30d9d72e7a`. GitHub independently confirms all 41 final-head checks passed. Post-merge results are separately refreshed in the [execution ledger](../testing/evidence/quotation-task-branch/README.md). No open PR or suitable branch contribution was present. Isolated `codex/quotation-task-branch` preserves the original checkout, unfinished Excel import and every earlier proof database. Earlier failures, repairs and cancellations retain their actual meaning.

Inspected native Projects services, validation, dependency calculation, Supply commands, immutable material guards and the live PostgreSQL 16 schema through 0069 in a new task-owned cluster on loopback 5683 (`ppo_synthetic_test`). A dependency's composite identity is `(workspace_id, project_id, task_id, predecessor_id)`: task_id is the successor. FS and SS are supported independently on each edge. There is no dependency version, lag or configured lower-bound field. `scheduleIssues` warns for FS before the next Monday–Friday day after predecessor finish, SS before predecessor start and missing dates. Saves enforce membership and acyclicity without automatic rescheduling. Missing-date warnings remain after withdrawal. No calendar, resource availability or replacement-date policy is inferred.

Project tasks have no native attendance, Engineering or acceptance foreign-key targets. Consequences are carried by Project links and Demand facts/data/children. Existing protected readers and refusal rules remain authoritative for those records. Current permissions precede their existence, counts, snapshots, historical outcomes and receipts.

## Selected executable action and alternatives

Select exactly three distinct internally owned, dated, non-milestone Planned tasks at zero progress in the same Active Project: B depends on A and C depends on A. Support FS/FS, FS/SS, SS/FS and SS/SS. Inspect every incoming and outgoing edge touching A, B or C. Hold extra branches, merges, predecessors/successors, B–C links, missing/reversed edges, external owners and consequential records.

Withdraw both forecast dates on A, then B, then C using three existing native `SaveProjectTask` bodies. Preserve both exact dependencies. Follow with the selected native `Supply:Fact:Impact` Reviewed successor. Run these four effects, histories, original receipts and immutable outcome in one workspace-locked PostgreSQL transaction. A late refusal at B, C, Impact or outcome rolls back everything. ES-07 never directly updates Projects rows. No new native transition or weakened dependency/readiness rule is needed.

Withdrawing A alone leaves both successor forecasts unsupported; changing one successor leaves the other unsupported. Deleting edges would discard dependency meaning. Replacement dates invent scheduling policy. Activity-only or request-only outcomes cannot implement the selected consequence. A generic graph dispatcher is larger than this bounded action. Reuse the existing TypeScript/Next/PostgreSQL architecture, commands, permissions, journal and controls; add no technology, framework, dependency, service, seed, grant, capability or identity type.

## Exact lineage, position and receiving

Freeze original quotation issue, immutable source/line/output manifest and bytes, completed conversion, accepted referral and due date or explicit Date needed, Receipt correction and its receiving/review/native outcome, then the applied allocation proposal, every receiving decision, immutable review, reserved operations, receipts and exact completed outcome. Select an actually reduced Project-origin Demand and the exact current Requested Impact retained in that outcome, its complete predecessor chain and linked MaterialAction. Never relabel OtherApproved Demand.

Bind Demand quantity/classification/version/owner, all usable allocations and source facts, unmet quantity, computed readiness and independent holds; Project aggregate/context/version; all three task IDs, owners, versions, statuses, progress, dates, notes and consequential links; both exact edges and native FS/SS kinds; Activity identity/version/owner/lifecycle; and relevant current authority hashes. Changed source, Receipt, allocation, ownership, authority, relationships or consequential links invalidate affected unexecuted receiving. Unrelated Projects and Supply records do not. Selected Project aggregate changes remain relevant because each save versions it.

| Separate responsibility | Effect received | Current duty in addition to complete linked/source reads |
|---|---|---|
| Demand | Selected Demand version and exact Impact successor | supply.coordinate |
| Project coordinator | Aggregate advances three times; programme consequence | project.edit |
| Task A owner / Task | A's two forecast dates become Unscheduled | project.read |
| MaterialAction owner | Scope of verified returned evidence; Activity unchanged | activity.edit |
| Task B owner / Successor | B's two forecast dates become Unscheduled; A → B retained | project.read |
| Task C owner / BranchSuccessor | C's two forecast dates become Unscheduled; A → C retained | project.read |

One person holding multiple roles records each decision separately. Accepted, Returned and Held bind the complete proposal and its topology, evidence, versions and authority. Corrections retain the previous decision; correction after review requires a new review. Referral return/reassignment and operational work after quotation retention retain their existing rules. The referral owner needs current native Projects edit and Supply coordination authority. Earlier Receipt, allocation, isolated-task, two-task and linear-chain acceptance grants no branch consent.

## Review, write footprint and returned meaning

Immutable review freezes proposal/dependency hashes, six exact receiving IDs, all four reserved native commands, reviewer, reason, evidence and server time. Separate application rechecks the complete position under the workspace lock immediately before mutation, including newly introduced links on every selected task.

| Record | Permitted effect |
|---|---|
| projects | Selected aggregate P → P+3, native updater/time; business context and target date retained. |
| project_tasks | A/B/C advance once, dates null; project_version P+1/P+2/P+3 and native updater/time. Status, zero progress, owners, notes and all other fields retained. |
| project_dependencies | Native saves reassert the two identical composite keys and FS/SS kinds. No edge added, deleted in the resulting position, reversed or relabelled. |
| project_schedule_events / business_identities | Three immutable schedule snapshots and three existing-type ProjectScheduleEvent identities. Existing identities/reference counters retained. |
| supply_records / supply_revisions | Selected Demand advances once with native updater/time/reason and one revision. Quantity/classification/origin retained. |
| supply_facts | One Reviewed Impact successor, exact predecessor and original MaterialAction ID; no other Impact is reviewed. |
| quote_material_events | One immutable MaterialApply, exact proposal/review/six decisions, four native receipts and actual after-position/topology. |
| operation_receipts / audit_events / outbox_jobs | Five of each including coordinator original: three ProjectTaskSaved, one SupplyRecorded and one QuotationSupplyRecorded. |

Allocations/history, Receipt facts, unrelated tasks, Activities/links, issued references and output bytes remain unchanged. Scoped resolution means withdrawal of this unsupported branch's forecasts, substantiated by actual native histories and receipts. Impact Reviewed identifies that verified consequence only. MaterialAction keeps its independent lifecycle; completion, notes or labels never prove readiness.

Unmet Demand and independent operational holds remain visible. Recompute current material readiness from returned evidence. Wherever a current ES-07 exception exists, require fresh explicit disposition; old retention does not cross changed relevant versions. Quotation retention leaves operational work actionable without manufacturing an exception. Engineering, Scheduling, attendance, acceptance, commitments, issued operational outcomes, consequential Supply facts/children and unknown external outcomes require their owning workflow before this action.

## Compatibility and recovery

Migration 0070 is selected after refreshed-main/live-schema inspection. Add optional `branch_successor_command` and distinct `BranchSuccessor` receiving. `material-propose` adds `branch_successor_task_id` only with `successor_task_id`, and refuses combination with `chain_end_task_id`. Branch evidence explicitly records `topology: Branch` and `branchSuccessor`; the command, receiving, immutable review and after-position bind this meaning. Preserve existing ChainEnd, chain_end_command and A → B → C records without relabelling. Omitted branch input preserves prior normalized payloads and hashes; old rows acquire only a null additive column. Retain earlier position-function signatures and original outcomes.

Use actor-bound operation journals, workspace serialization, exact native reservations and permission-first original recovery. Competing active work is excluded across all three tasks and the Impact. Exact repeated commands return the original; changed payloads conflict; concurrent submissions create no duplicate decisions/effects. Operations cannot cross target, topology or family. Missing receipt stays inconclusive; recover the original before replacement. Preserve #349 restricted hosted-runtime privileges and catalog-shape-based prepared statements with current parameters, grants and server time; no migration-ledger access is added. Populated upgrades and actual application/PostgreSQL restarts must prove preservation. Forward repair retains evidence; rollback to writers unaware of branch work is unsupported while such work exists.

MYOB remains ERP authority, SharePoint business-document authority and native CAD authoring authority. Commercial thresholds, allocation priority, conversions, calendar/resource policy and live integration remain Not configured. Functional proof, visual review, physical-device/screen-reader review, owner acceptance and deployment remain separate. No merge/deployment is authorised.

Next concrete boundary: a three-task merge A → C and B → C. It needs its own independently owned native-consequence contract and receiving for both predecessors; no branch or chain consent transfers and no general graph rescheduling is adopted.
