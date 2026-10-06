# Owned four-task Project dependency diamond

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. 7 October 2026. SYN-ES07-12. Authorised synthetic implementation choice; independent review and owner acceptance pending. ES-07 / SC-09 / PJ-03; EST-03/08/09, SCM-08, PRJ-02/04, IF-03/13/14, AT-05/26/29/32. Preserve parent IDs and issued references.

## Reconciliation and native transition

Refreshed main is #354 merge 58679be051d8dc8da4356a714fb0f37d09902092, with checked head 110e6ede0cff36a1351a9bc8265479e015abd127. Its 45 final-head checks passed across 16 workflows. Independently fetched merge-SHA assurance has two passes and 39 failures across 12 workflows. A separately triggered deployment job failed; this contribution does not deploy or retry it. Exact starting metadata is retained in the [execution ledger](../testing/evidence/quotation-task-diamond/README.md). Earlier failure, repair, cancellation and successful-head checkpoints retain their original meanings.

No open PR or suitable diamond contribution existed. Isolated codex/quotation-task-diamond preserves the root checkout, unfinished Excel import and retained proof databases. A new loopback PostgreSQL 16.15 cluster on 5689, database ppo_synthetic_test, was migrated through 0071 and its live schema inspected before choosing 0072.

Native SaveProjectTask accepts both dates null, versions only that task and the Project, reasserts incoming dependencies and creates one schedule snapshot/identity/receipt/audit/outbox. It does not propagate. Membership and acyclicity remain hard guards. Dependencies have composite identity (workspace_id, project_id, task_id, predecessor_id), with task_id the successor. Foreign keys prevent cross-Project relationships. FS and SS are the only kinds; no dependency version, configured lag or independent lower-bound field exists. Native scheduleIssues checks FS against the next Monday–Friday day after predecessor finish and SS against predecessor start. Missing dates remain warnings; they neither reschedule nor grant work authority.

Select four distinct internally owned, dated, non-milestone Planned tasks at zero progress in one Active Project, with exactly A → B, A → C, B → D and C → D. All sixteen independent FS/SS combinations are in scope. Detect every touching incoming/outgoing edge: additional predecessors/successors, branches/merges, B–C cross-links, A→D shortcut and missing/reversed links hold action. Consequential Engineering, Project acceptance, Demand facts/children, attendance, technical/customer commitments, issued operational or unknown external outcomes remain with their owners.

The applied allocation outcome must actually reduce the selected Project-origin Demand and retain the current Requested Impact, with current positive unmet quantity. Demand identifies the Project, not task-level material allocations. A’s forecast consequence is explicitly selected and independently received against complete original allocation evidence; labels, task names and notes do not prove material coverage.

Native date checks are immediate-edge warnings, not a mandatory cascade: after A alone is withdrawn, B and C warn while D can still compare its two dated predecessors. Retaining those forecasts as unresolved work is technically permitted by Projects. The adopted diamond action therefore requires explicit receiving of the propagated unsupported consequence on each path; it does not claim that the database forces all four withdrawals. Four saves are the minimum for the accepted four-forecast withdrawal contract, and missing-predecessor warnings remain after withdrawal.

Withdraw A, then B, then C, then D using four existing native SaveProjectTask bodies. D’s one command retains both predecessor links. Each path loses its supported predecessor forecast; retaining either intermediate or D leaves an unsupported forecast. No native transition requires two D saves. A/B/C/D and the exact selected Impact Reviewed successor, native receipts and immutable outcome are inseparable and share the existing workspace-locked transaction. ES-07 calls the owning commands and never updates Project rows directly.

Alternatives: A alone leaves both branches unsupported; stopping at B/C leaves D unsupported; composing branch and merge actions duplicates scope and would wrongly reinterpret the older merge’s retained B. Replacement dates invent policy; edge deletion loses dependency meaning; note-only/request-only work does not execute the consequence. A generic graph dispatcher is larger than this bounded increment. Reuse TypeScript/Next/PostgreSQL, native permissions, journal and controls. No new framework, dependency, service, infrastructure, seed, grant, capability or identity type.

## Evidence and receiving

Freeze complete quotation issue/source/line/output manifest and bytes, completed conversion, accepted referral and due date or explicit Date needed, Receipt-correction proposal/receiving/review/native outcome, original allocation receiving/review/operations/receipts and exact applied outcome. Bind current Project-origin Demand, selected Requested Impact and complete predecessor chain, MaterialAction, quantity/classification/version, usable allocations/unmet quantity/readiness and independent holds. Bind every task owner/version/status/progress/date/note/consequential link and all four relationships, including both complete paths into D. Diamond evidence captures complete native task and Project rows for preservation checks.

| Separate responsibility | Received effect or retained position | Additional duty beyond complete current linked/source reads |
|---|---|---|
| Demand owner / Demand | Explicit A consequence, one Demand version and selected Impact successor; quantity/classification unchanged | supply.coordinate |
| Project coordinator / Project | Four aggregate increments and complete diamond consequence; business context unchanged | project.edit |
| A owner / Task | Both A dates withdrawn, both branches retained | project.read |
| MaterialAction owner / MaterialAction | Verified scoped return; Activity lifecycle and ownership retained | activity.edit |
| B owner / DiamondB | Both B dates withdrawn; A→B→D path retained | project.read |
| C owner / DiamondC | Both C dates withdrawn; A→C→D path retained | project.read |
| D owner / DiamondD | Both D dates withdrawn once; both incoming links retained | project.read |

One person records every role decision separately. Accepted/Returned/Held bind the whole proposal, both paths/shared successor, affected and retained records/evidence/versions/authority. Corrections append predecessors; corrected receiving after review invalidates that review. Source, allocation, Receipt, Demand, Impact, topology, ownership, authority or consequential changes require renewed applicable receiving. Earlier Receipt/allocation/isolated/pair/chain/branch/merge acceptance grants no diamond authority. The accepted referral owner needs current project.edit and supply.coordinate to apply. Return/reassignment and Date needed remain explicit. Operational work remains available after quotation retention without fabricating an exception.

## Exact footprint and review

Freeze proposal/dependency hashes, all seven receiving IDs, five reserved operations, reviewer/reason/evidence and server time. Recheck complete relevant state under the workspace lock immediately before mutation, including newly introduced edges and consequential records. Either path can invalidate the whole unexecuted diamond. Unrelated Projects/Supply are irrelevant; changes to the selected Project aggregate are relevant because all four saves compare and advance its version.

| Record | Exact permitted effect |
|---|---|
| projects | P→P+4; native updater/time; all business context and target date retained |
| project_tasks | A/B/C/D each advance once, both dates null, project_version P+1/P+2/P+3/P+4 and native updater/time; every other row field retained |
| project_dependencies | B/C/D saves reassert four identical keys and FS/SS kinds; no resulting edge change |
| project_schedule_events / business_identities | Four snapshots and four existing-type ProjectScheduleEvent identities; one for D; earlier identities/counters retained |
| supply_records / supply_revisions | Selected Demand advances once, updater/time/reason and one revision; quantity/classification/origin/owner retained |
| supply_facts | One Reviewed successor of selected Requested Impact, same MaterialAction; other Impacts retained |
| quote_material_events | One immutable MaterialApply linking allocation outcome, proposal/review/seven decisions, explicit diamond, five native receipts and verified after-position |
| operation_receipts / audit_events / outbox_jobs | Six of each including coordinator: four ProjectTaskSaved, SupplyRecorded, QuotationSupplyRecorded |

Allocations/history, Receipt facts, all unaffected task fields, unrelated tasks, Activity/links, issued references and output bytes remain exact. Failure after A/B/C/D, at Impact or immutable outcome rolls back every effect. Never report one completed path as diamond resolution.

Scoped resolution means only withdrawal of these unsupported forecasts. Impact Reviewed links that verified consequence; it is not material readiness. MaterialAction remains independently owned and is not auto-completed. Unmet Demand, native missing-date warnings and independent operational holds remain. Recompute readiness from current evidence; fresh explicit ES-07 disposition is required wherever an exception exists. Old disposition cannot cross relevant changed versions. Notes, Activity completion and labels do not clear holds.

## Compatibility and recovery

0072 adds nullable diamond_commands containing explicit b/c/d native commands, with separate DiamondB/C/D roles and exclusive diamond_b_task_id, diamond_c_task_id, diamond_d_task_id inputs. Omission leaves every earlier normalized payload/hash intact. Earlier chain/branch/merge stored roles and outcomes retain meaning, especially #354’s unchanged B. Earlier SQL overloads remain. New evidence binds complete native rows without expanding old hashes.

Actor-bound journals, workspace serialization, operation reservations and native receipts enforce exact replay, changed-payload refusal, concurrent single effects and competing work exclusion across all four tasks and Impact. Reservations cannot cross target/topology/family. Missing receipts remain inconclusive; recover uncertain originals before replacement. Current authority precedes historical snapshots/counts/original receipts. Retain restricted hosted-runtime privileges and schema-shape-safe prepared reads with current parameters/server clocks; no migration-ledger access. Populated upgrades and actual application/PostgreSQL restart preserve earlier records, grants, histories, allocations, receipts and output bytes.

## Browser maintenance necessary for assurance

The unchanged #354 merge fails before application proof because the stable Chrome installer now supplies 155.0.8059.39 while the gate accepts 153/154. Adopt that exact major’s minimum patch as a bounded maintenance candidate, retaining both earlier floors and refusing 156/unreviewed majors. No installer retry, test retry, deadline, assertion or browser fallback changes. Its adoption requires document-renderer smoke, complete application/database/browser and compiled proof on this contribution. Freezing an obsolete major or accepting all future majors would defeat the existing reviewed-major contract. [Chrome’s official release schedule](https://chromestatus.com/release-notes) identifies 6 October for 155 stable; exact installed Linux version is evidenced by the merge-SHA logs. This does not relabel any failed post-merge run as passing.

MYOB, SharePoint and native CAD retain their authorities. Commercial policy, allocation priority, conversions, resource/calendar policy and live integrations remain Not configured. Accepted diamond mockup imagery is missing; functional/viewport evidence, paired visual review, physical-device/screen-reader review, owner acceptance and deployment remain separate. No merge/deploy/business action is authorised. Next boundary: an additional dependency touching this diamond, requiring a separately bounded owned topology and native effect contract rather than general graph rescheduling.

The browser prerequisite reuses [the separately contributed maintenance decision](browser-runtime-maintenance.md) from PR #355. Its CI remains separate; no deployment authority is added.
