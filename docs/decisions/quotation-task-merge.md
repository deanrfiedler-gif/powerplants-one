# Owned three-task Project merge with retained predecessor

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. 6 October 2026. SYN-ES07-11. Authorised synthetic implementation choice; independent review and owner acceptance pending. ES-07 / SC-09 / PJ-03; EST-03/08/09, SCM-08, PRJ-02/04, IF-03/13/14, AT-05/26/29/32. Existing parent IDs and issued references remain.

## Source reconciliation and inspected native semantics

Refreshed main is #353 merge `7e61c742acbfd2bb894218bd6e78b08c25ef69df`, containing checked head `2beb040997ed9d4f056c2c60dcdcc6473689398c`. All 43 final-head checks across 16 workflows passed. Independently fetched #353 post-merge assurance is complete: all 39 checks across 12 workflows passed. The exact merge-SHA observation is retained in the merge ledger; deployment and owner acceptance remain separate. Earlier #349 cancellation/failed aggregate, #351 unchanged-main Scheduling race and repaired migration assertion, #352 development failures/naming repair/cancellations and #353 migration-constant/invalid-fixture/timestamp repairs, timeout/startup failure, baseline Windows failures and superseded cancellations remain unchanged in their historical ledgers. Deployment, source-specific proof and owner acceptance remain separate.

No open PR or suitable contribution was present. Isolated `codex/quotation-task-merge` starts from refreshed main. The original checkout, unfinished Excel import and every retained proof database remain untouched. A new task-owned PostgreSQL 16.15 cluster at loopback 5685, database `ppo_synthetic_test`, was migrated through 0070 and its live columns/triggers inspected before selecting 0071.

Native `SaveProjectTask` accepts both dates null. It versions only the saved task and the Project, reasserts that task's incoming dependencies, and appends a schedule snapshot, identity, receipt, audit and outbox event. It does not propagate changes to other tasks. The dependency key is `(workspace_id, project_id, task_id, predecessor_id)`; task_id is the successor. FS/SS are the only kinds. No independent dependency version, configured lag or lower-bound field exists. `scheduleIssues` warns at the next Monday–Friday day after predecessor finish for FS and predecessor start for SS. Missing dates retain a warning; these date warnings do not automatically reschedule or grant work authority. Membership and acyclicity remain native save constraints.

## Selected action and B's valid position

Select exactly three distinct, internally owned, dated, non-milestone Planned tasks at zero progress in one Active Project. The complete touching graph must be A → C and B → C. Support FS/FS, FS/SS, SS/FS and SS/SS. Every additional incoming/outgoing edge touching A, B or C, A–B cross-link, reversed/missing selected edge or consequential record holds action.

The exact applied allocation outcome must actually reduce the selected Project-origin Demand, retain the selected current Requested Impact, and leave positive current unmet quantity. A is selected explicitly in that Project. Native Demand origin identifies the Project, not a task-to-material allocation: the complete independently received proposal associates this forecast consequence with A. No label, free-text note or inferred task material allocation proves that association. Demand, Project and task owners receive it explicitly with the actual reduction, current quantities and Impact lineage.

B's retained position is established from native evidence: complete current task row, both ordered dates, Planned/zero progress, internal owner, no incoming dependencies, no native schedule warning, exact outgoing B → C link and no unsupported Project/Demand consequential records. Its owner separately acknowledges that exact retained position and merge context. This establishes a structurally valid retained forecast; it is not proof of material sufficiency, resource availability, a new booking or commercial commitment. The native model has no task-specific reservation or resource availability contract to infer. Unknown broader consequences remain holds.

Withdraw both dates on A, then C with two existing `SaveProjectTask` bodies, retaining both C predecessor links. B receives no save and no replacement dates. Once A is Unscheduled, C cannot retain a supported forecast through both predecessors, while nothing in native propagation requires a change to independent predecessor B. Append only the selected native `Supply:Fact:Impact` Reviewed successor. These three native effects, their original receipts and immutable outcome share the existing workspace-locked transaction. Any late A/C, Impact, evidence or receipt failure rolls back the entire action. ES-07 calls owning command bodies and does not update Project rows directly.

Alternatives: A alone leaves C's dependent forecast unsupported; withdrawing B discards a valid received position without native necessity; deleting edges loses dependency meaning; replacement dates invent scheduling policy. Notes, Activity completion and request-only work do not execute this action. A graph dispatcher is larger than the bounded need. Reuse TypeScript/Next/PostgreSQL, controls, permissions and journal. No new technology, dependency, framework, service, deployment infrastructure, capability, seed, grant or identity type.

## Exact evidence, responsibilities and authority

Freeze quotation issue/source line/output manifest and bytes, completed conversion, accepted referral and due date or explicit Date needed, Receipt correction proposal/receiving/review/native outcome, original applied allocation proposal/receiving/review/operations/receipts/completed outcome. Bind selected Project-origin Demand, exact current Requested Impact, complete predecessor chain and linked MaterialAction. Do not relabel OtherApproved Demand.

Bind current Demand quantity/classification/owner/version, usable allocations and source facts, unmet quantity, computed readiness and independent holds; Project aggregate/context; all three tasks' owners, versions, status, progress, dates, notes and consequential links; both exact directed FS/SS dependencies; Activity identity/version/owner/lifecycle; relevant effective authority hashes. B additionally binds every native row field, including project_version, created/updated actors and server timestamps. The retained native row is checked again after the effects and persisted in the immutable outcome.

| Separate decision | Exact effect or retained position | Duty in addition to complete current linked/source reads |
|---|---|---|
| Demand | Demand version and exact Impact successor; received A consequence | supply.coordinate |
| Project | Two aggregate increments and programme consequence | project.edit |
| Task / A | Both A forecast dates withdrawn; other fields retained | project.read |
| MaterialAction | Verified scoped return; Activity lifecycle unchanged | activity.edit |
| MergePredecessor / B | Complete B position retained with both incoming C relationships; no B command or commitment | project.read |
| MergeSuccessor / C | Both C forecast dates withdrawn; both predecessor links retained | project.read |

The applying referral owner needs native Projects edit and Supply coordination authority. One actor holding several roles records each decision separately. Accepted, Returned and Held bind the whole proposal, retained B, effects, topology, evidence and versions. Corrected receiving after review requires a new review. Relevant ownership/authority or evidence changes require renewed receiving; previous Receipt/allocation/isolated/pair/chain/branch acceptance grants no merge authority. Reassignment, return, due date/Date needed and operational work after quotation retention preserve existing lineage.

## Frozen review, exact write footprint and meaning

Review freezes proposal/dependency hashes, six exact decision IDs, three reserved operations, reviewer, reason and server time. Separate application rechecks current permissions, original output bytes, complete relevant position, all touching edges and consequential links. A change to retained B invalidates unexecuted acceptance. Selected Project aggregate changes are relevant because native saves version it; unrelated Projects/Supply records are selectively irrelevant.

| Record | Exact application effect |
|---|---|
| projects | P → P+2, native updater/time; business context and target date retained |
| project_tasks | A and C each advance once; dates null; project_version P+1/P+2; native updater/time. Status, progress, owner, notes and other fields retained. B's entire row unchanged |
| project_dependencies | C's native save reasserts both identical composite keys and FS/SS kinds; no resulting addition, removal, reversal or relabelling |
| project_schedule_events / business_identities | Two schedule snapshots and two existing-type ProjectScheduleEvent identities; no B event or identity change; reference counters retained |
| supply_records / supply_revisions | Selected Demand advances once with native updater/time/reason and one revision; quantity, classification and origin retained |
| supply_facts | One Reviewed successor of the exact selected Requested Impact, with the same MaterialAction; all other Impacts retained |
| quote_material_events | One MaterialApply binds proposal/review/six decisions, exact allocation outcome, topology, three native receipts and actual resulting position including retained B |
| operation_receipts / audit_events / outbox_jobs | Four of each including coordinator original: two ProjectTaskSaved, SupplyRecorded and QuotationSupplyRecorded |

Allocations/history, Receipt facts, Activity/links, unrelated tasks, Project business context, quotation sources/references and output bytes remain unchanged. Scoped resolution is withdrawal of A/C's evidenced forecast consequence, substantiated by actual native histories and receipts. Impact Reviewed links that verified consequence only; it does not assert material readiness. MaterialAction remains independently owned and is never completed automatically.

Unmet Demand, other Requested Impacts and independent operational holds stay visible. Recompute readiness from current native evidence and require fresh explicit ES-07 disposition for every current exception. Earlier retention does not cross relevant changed versions. Quotation retention leaves operational work actionable without a fabricated exception. Notes, Activity completion, status labels and accepted receiving cannot clear readiness.

Project Engineering packages/acceptance stages and Demand consequential facts/children, attendance/technical/customer-commitment links, issued operational outcomes and unknown external outcomes prevent this bounded action. The native task schema has no additional attendance or acceptance foreign-key target; the protected Project and Demand readers cover the implemented consequential links. Additional outside authority must be adopted in its owning workflow.

## Compatibility and recovery

Migration 0071 adds nullable `merge_successor_command` and distinct MergePredecessor/MergeSuccessor roles. Optional `merge_predecessor_task_id` and `merge_successor_task_id` must appear together and cannot combine with earlier topology inputs. Evidence records `topology: Merge`, `mergePredecessor`, `mergeSuccessor`, native retained row and warnings. Only C has the extra reserved command. No chain/branch role, hash, command or stored outcome becomes merge evidence. Omission preserves earlier normalized payloads; old rows acquire only a null additive column. Earlier position overloads remain.

Use actor-bound journals, workspace serialization, exact operation reservations and native receipts. Competing active work is excluded across all three tasks, including retained B, and the Impact. Recover uncertain originals before replacement. Identical replay returns its original result; changed payload conflicts; concurrency cannot duplicate decisions/effects. Reserved operations cannot cross target, family or topology. Missing receipt stays inconclusive. Current authority precedes receipt and historical disclosure.

Preserve #349 restricted hosted-runtime privileges: no migration-ledger read grant. Catalog-shape-safe prepared statements execute current parameters, permissions and server clocks. Populated upgrades retain earlier records/grants/histories/allocations/output bytes and original replay. Actual application/PostgreSQL restart must retain receipts and native effects. Forward repair preserves evidence; older writers unaware of merge work cannot safely take over active merge proposals.

MYOB remains ERP authority, SharePoint business-document authority and native CAD authoring authority. Commercial thresholds, allocation priority, conversions, resource/calendar policy and live integrations remain Not configured. Functional proof, paired visual review, physical-device/screen-reader review, owner acceptance and deployment are separate. No merge, deployment or business transaction is authorised.

Next concrete increment: a separately received four-task diamond (A → B, A → C, B → D, C → D), after establishing the native effects and independent receiving for both paths into D. The exact three-task contract deliberately holds that larger topology; no general graph rescheduling is adopted.
