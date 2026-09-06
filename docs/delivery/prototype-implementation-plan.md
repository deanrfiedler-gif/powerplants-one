# PP-01 — Ordered prototype implementation plan

**Edition:** r11 · **Status:** P01/P02 complete; P03 implemented with final component and publication evidence in its [handover](p03-handover.md); P04 component-verified with evidence in its [handover](p04-handover.md); P05 implemented with final verification/publication in its [handover](p05-handover.md); P06 implemented with exact verification/publication in its [handover](p06-handover.md); P07 implemented with exact verification/publication in its [handover](p07-handover.md); P08 implemented with verification/publication evidence in its [handover](p08-handover.md); P09 implemented with exact verification/publication in its [handover](p09-handover.md); P10 separately authorised, implemented and awaiting final verification; GitHub jobs currently blocked before steps; P11/P12 planned. Full-procedure execution is recorded separately from the authored catalogue defaults.

[Package](../prototype/README.md) · [Scope](../prototype/scope-and-journey.md) · [BP-02](../architecture/BP-02-platform-architecture.md) · [BP-07](../blueprints/BP-07-service-operations.md).

## 1. Delivery approach

Implement one complete synthetic planned-service journey in small reviewable pull requests. Use the architecture, dictionary, commands and acceptance scenarios as one contract. Keep basic identity/permission, audit and persistence in the foundation; do not postpone them until after a visually convincing demo.

Dean subsequently authorised **P01 — Application foundation and architecture proof**, including local dependencies, code, tests, a focused issue, branch, PR and merge after applicable checks/review. P01 is local-only. Cloud subscription, deployment, ERP transaction and source migration remain outside scope.

P01–P12 are local plan identifiers, not GitHub issue numbers or ERP references. Convert the next ready package into a focused implementation issue when beginning it; do not create a large speculative backlog of tiny tasks. Existing PPO-001–PPO-016 remain discovery/design issues and preserve their original scope.

**Parallel CRM design:** PPO-009 / issue #9 now has a [BP-03 discovery handover](crm-discovery-handover.md) and a separate [proposed CRM sequence](crm-implementation-plan.md). Its local I1–I6 labels do not extend or renumber P01–P12. CRM runtime is not implemented by that design work; future shared changes must reconcile the actually delivered P09 contracts and preserve the service dependency order.

## 2. Ordered work packages

| ID / outcome | Depends on | Build content | Completion evidence / PT coverage | Relative complexity |
|---|---|---|---|---|
| P01 Application foundation and architecture proof | This package | Pin stack/runtime/lockfile; reproducible run/build; base application shell; local-only synthetic identity adapter; PostgreSQL connection/migration; thin adapter interfaces; costed remote-hosting decision deferred | Fresh checkout starts from instructions; production/remote mode rejects development identity; one guarded server command/receipt; reservation feasibility spike documented | Medium |
| P02 Shared persistence, permissions and synthetic seed | P01 | Workspace/user/grant/audit/operation/outbox foundations; typed customer/site/asset models and deterministic seed; migration/constraint tests; role-scoped DTOs | PT-01/PT-02/PT-03 baseline; wrong-workspace/company access blocked; database restart preserves records; repeat seed/reset safe | High |
| P03 Customer context and service intake | P02 | SC-01–SC-04; contacts/operator/history/activity; ticket triage and stage validation; controlled asset uncertainty | PT-02/PT-03/PT-04/PT-25; prior unsuccessful fix and original attribution visible; unknowns owned | Medium |
| P04 Work scope, coverage and readiness | P03 | SC-05; scope revisions, assets/tasks, authority, manual coverage; readiness policy and allowed exceptions; planned visits | PT-04/PT-05; unauthorised extra work blocked; mandatory control cannot be overridden; prepared work reaches Authorised | High |
| P05 Planner and controlled changes | P04 | SC-07/SC-08; crew reservation transaction, day/week views, keyboard move, buffers/calendars/skills, customer windows, contact/change requests, cancellation | PT-08/PT-09/PT-10/PT-26; simultaneous moves cannot overbook; failed move retains original; project request never auto-confirms | High |
| P06 Job-pack generation, issue and acknowledgement | P05 | SC-06/SC-14; synthetic document store, templates/manifests, durable render job, issue/recipient events, amendments/holds | PT-06/PT-07/PT-18/PT-23; exact output/source hash; issue only after durable storage; two crew acknowledgements | High |
| P07 Technician online workflow and capture | P06 | SC-09/SC-10; job context, start, time/material/findings/readings/checklist/photos, evidence correction and completion drafts | PT-13/PT-14 initial; persists complete online visit; captured/approved/billable remain separate | High |
| P08 Offline queue and exception recovery | P07 | IndexedDB/service-worker scope, quota/save handling, restart, attachment dependencies, operation replay, stale assignment, narrow recovery and schema migration | PT-11/PT-12/PT-24/PT-28; real durable local save proved; no duplicates/loss on reconnect; no false server success | Very high |
| P09 Review, report and customer acknowledgement | P07; P08 before offline response claim | SC-11; exact entry set, returns/corrections, report output, response choices, remaining work and follow-up | PT-13/PT-14/PT-15/PT-16/PT-23; reservations/unavailability handled; changed report does not inherit signature | High |
| P10 Finance handoff and account simulation | P09 | SC-12/SC-13; quantities/allocations, review/processing claim, synthetic targets, unknown-outcome recovery, reconciliation, selected account fixtures | PT-17/PT-19/PT-20/PT-21; one target per operation, exact fixture balances and no false complete import | Very high |
| P11 Integrated quality, access and usability | P08/P09/P10 | Complete flow; direct API/file/search/export/notification tests; accessible planner/forms; error recovery; scoped dashboards; long-content outputs | PT-01/PT-18/PT-27/PT-29/PT-30; all selected critical flow/error cases pass with evidence; UI review includes phone and desktop | High |
| P12 Recovery, delivery and owner demonstration | P11 | Clean restore, old payload/release checks, runbook, deterministic demo reset, costed hosting/auth decision if remote requested; final PT execution evidence | PT-22/PT-28/PT-30 and full acceptance index; owner can run/recover demo; no outstanding critical access/data-loss defect | High |

PT references on intermediate packages identify the component obligations to exercise. A multi-component PT is recorded as fully Passed only when all its preconditions exist, with the full suite executed at P11/P12; an early component check is not a complete parent-case pass.

Complexity is a relative design judgement, not a time estimate. Offline and Finance deserve explicit proof because they combine state, retries and external effects. No budget, staffing availability, completion date or operational SLA is invented.

## 3. Dependency and release boundaries

P01/P02 establish the technical core; P03–P06 establish prepared and schedulable work; P07–P10 complete field/report/Finance consequences; P11/P12 prove integration and recovery. Individual screen work may be drafted earlier, but a package cannot claim completion until its guards and dependencies are functional.

The original P07 online demonstration label was **Online workflow preview — offline/report/Finance work incomplete**. At the P08 boundary the label became **Field workflow preview — report/Finance work incomplete**. P09 uses **Field workflow preview — Finance work incomplete**, with the report verification/publication state recorded separately. The first complete PP-01 demonstration is after P12. Do not silently redefine PP-01 as finished because the dashboard looks polished.

## 4. P01 implementation brief

**Goal:** create a runnable local application foundation that validates the architecture without prematurely implementing every module.

**Inputs:** BP-02, ADR-0003/0004, current AGENTS/STATUS, dictionary common fields, API envelope and PT-01/PT-08 design cases.

**Tasks:** select supported runtime/dependency versions with official release/security checks; create package/lockfile and documented scripts; create TypeScript/Next.js shell with a synthetic banner and accessible navigation; connect PostgreSQL and execute one reversible migration; implement server-derived synthetic identity in local mode; implement one permission-checked record read and one versioned/idempotent command; prove resource-reservation exclusion using a focused database experiment; define simulated ERP/document adapters; add appropriate build/type/integration CI jobs without changing repository visibility or paid settings.

**Required handover:** exact commands to install/run/check/reset synthetic data, selected versions and rationale, files changed, migration/recovery note, evidence from fresh setup and tests, limitations, next P02 issue. Do not create real credentials or purchase hosting. Do not infer that a local demo identity can be exposed remotely.

**Ready-to-use task statement:** Implement P01 from the current prototype package in a reviewable branch and pull request. Read the current repository guidance and architecture ADRs first. Build and verify the local synthetic foundation and architecture proofs, record results and update current status. Keep external business integrations simulated and report any material architecture change before extending scope.

## 5. Definition of done for every implementation PR

The PR explains the user outcome/problem, changed behaviour, affected source/package IDs, relevant scope limits and evidence. It includes migrations and contract changes when required, plus tests that challenge meaningful failure cases. Document screenshots supplement persisted/API evidence; they do not replace it.

For money, booking, issued documents, permissions and offline evidence, test the refusal/retry/concurrent/changed-source path as well as the successful path. Record actual expected/observed values. Keep accessibility and field usability in the change, including keyboard alternatives and clear saved/error states. Update STATUS and test results only to reflect what was executed.

No real customer message, ERP post, file migration or source cutover is hidden inside a feature demo. Such actions require a later scoped instruction and validated interface/authority. Routine authorised local/repository implementation should proceed without repeated permission requests.

## 6. Design issue disposition

| Existing issue | Package contribution | Remaining distinction |
|---|---|---|
| PPO-001 / #1 | Scope/rationale, synthetic journey, owner and baseline questions | Operational cohort/benefit baseline remains D-004 |
| PPO-002 / #2 | Synthetic authority model, alternatives and evidence checklist | Actual MYOB configuration/API/service ownership remains open |
| PPO-003 / #3 | DAT-01–DAT-03 dictionary, history/correction and identity tests | Actual master keys/data quality require later source validation |
| PPO-004 / #4 | BP-02 options, selected design, ADRs and P01 proof | P01 local build/integrity proof executed; remote hosting/costing and operational feasibility deferred |
| PPO-005 / #5 | BP-07 screens, fields, transitions, rules, errors and tests | P01 draft foundation only; business workflows and real policy acceptance remain |
| PPO-006 / #6 | FD-10 and selected FD-01/02/04 simulation contract | Real Finance definitions/ERP reconciliation remain D-017 |
| PPO-007 / #7 | DAT-11 and OUT-09/10/14 issue/retention contract | Actual SharePoint/templates/retention remain unverified |
| PPO-008 / #8 | Permissions, offline boundary, candidate measurements and recovery | Device/identity/security/NFR operational evidence still needed |
| PPO-014 / #14 | Deterministic fixtures and 30 executable manual test procedures | Authored procedure defaults are not execution evidence; actual results are maintained in delivery handovers |
| PPO-016 / #16 | Initial environment/release/restore/support plan | Costed hosting/support and live operating handover remain open |

A completed design issue means its specified design deliverable exists, not that referenced parent requirements have been implemented. Live issue states and closing evidence are recorded separately after publication.

## 7. Immediate evidence requests that can wait for synthetic development

Record actual MYOB version/modules and service ownership; SharePoint site/library/permission/retention model; representative technician devices/connectivity; approved scheduling/control/coverage rules; Finance mapping/tolerance examples; output branding/contact/signature policy. Use synthetic assumptions until these are available, retaining the UQ labels.

Do not request all company exports to start P01. A few representative, authorised/redacted samples later are more useful than importing unclassified operational datasets into the prototype.

## 8. Future modules and controlled expansion

PPO-009–PPO-013/PPO-015 preserve CRM parity, CREMS reconstruction, Engineering, Projects, supply chain and extended service lifecycle work. Shared IDs/activities/document references established here support them. Detailed module design should follow a bounded next business journey and reuse the platform contracts; it should not independently invent another customer, asset, document or Finance master.

The separate SOL008 Smartsheet delivery-system work remains intact. Its process lessons can inform future BP-06, but no migration or replacement is implied by completing PP-01.

## P03 delivery boundary and P04 prerequisite

SC-01–SC-04 now use persisted scoped business services. [ADR-0008](../decisions/ADR-0008-p03-customer-intake.md) narrows triage to known requester/site and resolved owned clarification; it does not implement an approved identification scope. Activity/ActivityLink accepts only existing Organisation/Site/Asset/Ticket targets. Work-order creation in the broader SC-04 and issued reports/future appointments in PT-25 remain later dependencies. Full PT-02/PT-03/PT-04/PT-25 acceptance is not claimed by component tests.

The next separately authorised task is P04: SC-05 work scope, coverage, authority, readiness and planned visits. Its concrete task and prerequisites are in the [P03 handover](p03-handover.md#next-bounded-task--p04-not-started). P03 does not start P04 or complete PP-01.

## P04 delivery boundary and next P05 prerequisite

P04 implements SC-05, DAT-05 and the Authorisation/Proposed portion of DAT-06 through API-C03 and documented supporting commands. See [ADR-0009](../decisions/ADR-0009-p04-work-scope-readiness.md), [P04 component evidence/publication](p04-handover.md) and the [P05 starter](p05-starter-prompt.md). P03 known-site triage remains exact; known-site Identification plans do not enable site-less intake. Scope successors preserve approved originals and hold old proposal context for later review. P05 is now implemented under its separately authorised task; its maintained amendment and handover govern current scheduling behaviour.

P04 does not deliver typed material requisitions/stock/shortage processing within SCM-01/SCM-06. Its controlled tool-preparation evidence and scope-review flags contribute only to SCM-08. Earlier package mappings identify dependencies, not proof that every mapped parent is complete. PT-03/PT-04/PT-05 components are separately evidenced; full acceptance remains Not run.

## P05 delivery boundary and next P06 prerequisite

[ADR-0010](../decisions/ADR-0010-p05-planner-controlled-changes.md) and [P05 handover](p05-handover.md) record SC-07/SC-08 controlled bookings/changes, real whole-crew reservation constraints, exact evidence, typed contact/requests and cancellation. PT-08/09/10/26 components are separately evidenced; no full procedure or parent requirement is marked complete. Source calendars/skills/availability are immutable synthetic bundles. Dispatch remains held pending real P06 pack/acknowledgement evidence; customer date agreement is separate.

[P06 starter](p06-starter-prompt.md) prepares nine-section job packs, durable exact document output/issue and per-assignment acknowledgement. It requires verified P05 publication, avoids circular preparation/dispatch gates, preserves P05 scheduling consequences and acknowledges the P07 actual-start dependency. P06 is now implemented under issue #30 / PR #31; its current amendment and handover govern real pack/assignment evidence.

## P06 delivery boundary and prepared P07

[P06 handover](p06-handover.md) records SC-06/SC-14, DAT-07/minimum DAT-11, OUT-09, API-C08–11, TR-04–07 and EVT-04/05 components. Exact controlled files and current individual responses evolve dispatch readiness without circular preparation gates. P04/P05 source authority, reservations, contacts, receipts and all issued bytes remain. P06 originally left PT-06 final actual start to P07; PT-18/23 report/Finance and integrated steps remain later. P07 now implements that real online guard under the separately authorised increment below.

## P07 delivery boundary and prepared P08

[P07 handover](p07-handover.md) records SC-09/10, DAT-08, API-C12–14, online TR-09/10, typed capture/corrections, exact private PNGs and completion drafts. [ADR-0012](../decisions/ADR-0012-p07-online-field-evidence.md) preserves current P06 authority and per-actor attendance, original scope/issued evidence, actor-wide time exclusion, storage/database reconciliation and independent closure lifecycles. PT-06 is now an integrated P07 obligation; PT-13/14 reviewer/report/return steps remain P09. Actual verification/publication and acceptance status are linked from the handover, not inferred from implementation.

[P08 starter](p08-starter-prompt.md) prepares bounded durable offline operation/attachment dependencies, stale-authority recovery and browser schema/quota/restart proof. P08 implementation and exact verification/publication are now recorded in its handover below. Report submission/customer response, Finance, hosting, production migration and live communication remain outside P07.


## P08 delivery boundary and prepared P09

[P08 handover](p08-handover.md) and [ADR-0013](../decisions/ADR-0013-p08-offline-recovery.md) record durable owner-bound context/original/evidence/PNG stores, a narrowly scoped shell worker, strict local transaction save outcomes, bounded per-operation replay and recoverable leases, current-authority adjudication and owned restricted exception recovery. P04–P07 domain commands, issued bytes, exact original receipts and separate lifecycle boundaries remain. API-C15 does not implement report submission or approval. PT-11/PT-12/PT-24/PT-28 components have separately recorded execution evidence; full procedure status is never inferred from code or isolated checks.

At the completed P08 boundary, [P09 starter](p09-starter-prompt.md) was preparation only. It requires verified P08 publication from the external issue record, current main and exact checks before starting review/submission/report/customer-response work. Finance processing remains P10. P09–P12, hosting, operational identity/integration, production migration and customer communications are not started by P08.

## P09 physical implementation and P10 preparation

P09 API-C16–18 implement exact personal completion submission, service review/return, narrow attendance acceptance, immutable OUT-10 issue and content-bound customer responses. API-C19 is Finance handoff and remains P10. [ADR-0014](../decisions/ADR-0014-p09-service-reports.md) reconciles conceptual TR-11–13 with the existing appointment/attendance model, retains Authorised work-order state and all P04–P08 controls, and introduces no whole-order/ticket/Finance closure. [P09 handover](p09-handover.md) records actual verification and authoritative external publication. [P10 starter](p10-starter-prompt.md) requires verified publication, current main/contracts/newer decisions and separate authority; preparation is not implementation.

## P10 implementation boundary

[Issue #45](https://github.com/deanrfiedler-gif/powerplants-one/issues/45) / [PR #48](https://github.com/deanrfiedler-gif/powerplants-one/pull/48) implement only SC-12/SC-13, DAT-10, minimum FIN/FD records, API-C19–22/TR-14 and restricted OUT-14 under [ADR-0016](../decisions/ADR-0016-p10-finance-handoff.md). The [P10 handover](p10-handover.md) records exact prerequisite verification, implementation, actual checks and publication limits. SyntheticManual is default; SyntheticApi is confined to F-07 and controlled simulator faults. Physical work orders may remain Authorised after Completed appointments. API-C23 closure is not added. Full P10 PT procedure results must identify all executed steps; P11/P12 integrated acceptance remains separate.

P09 retained original Draft entry flags and independently accepted Partial/UnableToProceed attendance with missing personal declarations. P10 requires exact Approved review/entry/source hashes, complete declarations and current dependencies before allocation. It never invents zero quantities or uses a customer response as billing approval. Prepare a P11 starter after verified P10 publication, requiring newer main/authority and a separate invocation; do not begin P11.
