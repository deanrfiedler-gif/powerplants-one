# PJ-06 work-evidence acceptance

Owner: Dean Fiedler. Date: 16 October 2026. Status: authorised bounded synthetic implementation; independent review and operational acceptance separate. Parents PRJ-04/PRJ-05/PRJ-06, SCM-03, AT-38. [Contract](../contracts/project-specialist-work-evidence.md).

## Reconciliation and decision

Main is `1552cfbb8efd6cea17438c2af18ba0effa4fc278`. R1 #518 and R2 #522 remain unmerged. The R2 monitor owns its exact-head follow-up. This contribution starts at R2 `459112db197e8f1b87c2c3e6591284c509a386c6` on a separate worktree because its accepted specialist-bound native material handover is a concrete source dependency. The separate PR repair contribution is not a source of acceptance or permission for this task.

Use the existing PostgreSQL transaction/identity/audit/outbox/receipt services and native document library. Add an immutable submission and append-only decision events, bound to one exact Accepted R2 handover and one exact document revision. A successor explicitly corrects an Accepted, Returned or Withdrawn submission. No draft editor, upload service, framework, dependency or external adapter is needed. Reusing R1 events was rejected because accepting a brief does not accept performed work; reusing EN-07 commissioning outcomes would invent commissioning applicability for subcontract work. Merely attaching a document was rejected because it cannot retain the reviewed scope or independent decision.

Preparation reuses specialist prepare authority and the accepted brief owner/coordinator. Work review has a separate default-denied `project.specialist.work.review` capability; no grants or seeds are added. The reviewer is fixed at submission and must differ from the submitter, exact revision creator and underlying source author. Acceptance means only that the submitted evidence supports the explicitly stated scope and limitations. It does not certify competence, complete a project, accept unrelated work, authorise payment or release a hold point in another service.

Migration 0105 adds typed references, immutable rows and lifecycle/context guards. It preserves all historical schemas, hashes and records; identity constraint changes use the immediate/deferred sequence needed across migration 0026. Generated permission contracts and all exact migration/upgrade assertions must advance together. No default runtime authority is granted by the demo upgrade admission.

## Verification boundary

Prove current and withdrawn/revised sources, exact document bytes, independent decisions, privacy and company isolation, original-operation recovery after source drift, terminal corrections, races, rollback, populated upgrades and actual database/application restart. Record local proof, CI, independent review and human acceptance separately. Native SharePoint/MYOB/CAD authority, supplier identity/competence, downstream disposition and UI remain outside this increment.
