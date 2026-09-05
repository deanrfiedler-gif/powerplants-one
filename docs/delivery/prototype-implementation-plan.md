# PP-01 — Ordered prototype implementation plan

**Edition:** v01 · **Status:** Planned implementation; no application code or PT tests executed.

[Package](../prototype/README.md) · [Scope](../prototype/scope-and-journey.md) · [BP-02](../architecture/BP-02-platform-architecture.md) · [BP-07](../blueprints/BP-07-service-operations.md).

## 1. Delivery approach

Implement one complete synthetic planned-service journey in small reviewable pull requests. Use the architecture, dictionary, commands and acceptance scenarios as one contract. Keep basic identity/permission, audit and persistence in the foundation; do not postpone them until after a visually convincing demo.

The current user instruction authorises this specification/repository package. The next requested action should be **P01 — Application foundation and architecture proof**. No framework installation, cloud subscription, deployment, ERP transaction or source migration is performed by this package.

P01–P12 are local plan identifiers, not GitHub issue numbers or ERP references. Convert the next ready package into a focused implementation issue when beginning it; do not create a large speculative backlog of tiny tasks. Existing PPO-001–PPO-016 remain discovery/design issues and preserve their original scope.

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

An online demonstration after P07 is useful but must be labelled **Online workflow preview — offline/report/Finance work incomplete**. The first complete PP-01 demonstration is after P12. Do not silently redefine PP-01 as finished because the dashboard looks polished.

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
| PPO-004 / #4 | BP-02 options, selected design, ADRs and P01 proof | Feasibility/build/hosting procurement not executed |
| PPO-005 / #5 | BP-07 screens, fields, transitions, rules, errors and tests | Application and real policy acceptance not executed |
| PPO-006 / #6 | FD-10 and selected FD-01/02/04 simulation contract | Real Finance definitions/ERP reconciliation remain D-017 |
| PPO-007 / #7 | DAT-11 and OUT-09/10/14 issue/retention contract | Actual SharePoint/templates/retention remain unverified |
| PPO-008 / #8 | Permissions, offline boundary, candidate measurements and recovery | Device/identity/security/NFR operational evidence still needed |
| PPO-014 / #14 | Deterministic fixtures and 30 executable manual test procedures | All test execution remains Not run |
| PPO-016 / #16 | Initial environment/release/restore/support plan | Costed hosting/support and live operating handover remain open |

A completed design issue means its specified design deliverable exists, not that referenced parent requirements have been implemented. Live issue states and closing evidence are recorded separately after publication.

## 7. Immediate evidence requests that can wait for synthetic development

Record actual MYOB version/modules and service ownership; SharePoint site/library/permission/retention model; representative technician devices/connectivity; approved scheduling/control/coverage rules; Finance mapping/tolerance examples; output branding/contact/signature policy. Use synthetic assumptions until these are available, retaining the UQ labels.

Do not request all company exports to start P01. A few representative, authorised/redacted samples later are more useful than importing unclassified operational datasets into the prototype.

## 8. Future modules and controlled expansion

PPO-009–PPO-013/PPO-015 preserve CRM parity, CREMS reconstruction, Engineering, Projects, supply chain and extended service lifecycle work. Shared IDs/activities/document references established here support them. Detailed module design should follow a bounded next business journey and reuse the platform contracts; it should not independently invent another customer, asset, document or Finance master.

The separate SOL008 Smartsheet delivery-system work remains intact. Its process lessons can inform future BP-06, but no migration or replacement is implied by completing PP-01.
