# FI-07 attendance acknowledgement and report response contract

Owner: Dean Fiedler. Status: implemented bounded synthetic contract; human acceptance pending. Authority: [decision](../decisions/field-customer-response.md), P07/P08/P09 and parent SVC-09/10/11, DOC-01/02/03, NFR-01/07/09. FI-07 remains a scope, with existing Service report destinations.

## Commands and authoritative records

POST /api/v1/reports/:id/respond remains CustomerResponse / CustomerResponseRecorded. Existing required fields, operation UUID, schema_version 1, expected_report_version, response ID, exact presentation/revision/kind/hash, stated respondent, explanation/next action, presentation/capture times and bounded synthetic PNG remain unchanged.

Optional additions:

| Field | Meaning |
|---|---|
| subject | ReportContent (legacy default) or AttendanceFacts. AttendanceFacts concerns only the named technician's original attendance shown in reviewed HTML. |
| supersedes_response_id | Explicit predecessor of the same report, subject and exact presentation. One direct successor only. |
| correction_reason | Meaningful explanation (at least ten characters), required only with predecessor. |

Absent extension fields remain absent in normalised legacy commands, preserving P08 and original operation hashes. New native/offline captures explicitly select subject. All five existing response choices remain. Non-Accepted requires explanation and owned next action. Unavailable forbids respondent identity and mark. No response is separate from Accepted.

Migration 0057 adds only immutable ppo.customer_response_contexts. Composite foreign keys bind the existing response, approved review and predecessor in the same workspace. A trigger verifies same report/revision/presentation/subject and predecessor ordering; a unique predecessor index adjudicates competing successors. The source_binding and restriction observation are server facts. No migration/seed history, identity, capability, grant, user, template or existing response is rewritten. Legacy responses without companions mean ReportContent.

ppo.attendance_acceptances remains internal Service review, with its existing attendance and appointment-completion effects. The customer response command changes none of those records, Finance, inspection defects, incidents or work authority.

## Current checks and factual restrictions

Every capture and replay rechecks report.respond, company/site/report/attendance scope, expected version, current revision and issued identity, presentation kind/hash and exact retained bytes. Current reviewed audience, person/company association, source identities, equipment visibility, Service owner, assignment, scope/pack and original evidence are checked again before receipt publication after storage. A changed factual binding gives ResponseSourceChanged; stale version/presentation retain existing conflicts. Required missing/quarantined/damaged evidence cannot save.

An existing or newly arriving incident hold, open inspection defect or changed readiness outcome permits factual capture about unchanged retained content. The response records only coarse current restriction observations, not incident IDs/counts/narratives or clearance. Missing required restriction sources are unavailable. Work-start, scheduling, competency, technical retest/independent acceptance and incident release commands are unchanged.

Current response permission is required for original receipt recovery even after an accepted operation. A permitted recovered receipt remains an original fact after later source changes; it is not a fresh response or present clearance. File/signature reads retain their existing scoped paths and private no-store handling. Old output bytes remain exact.

## Reads, follow-up and correction

GET /api/v1/reports/:id adds subject, exact review ID, optional predecessor/reason, receipt-time restrictions and capturing actor display to permitted response history. Source binding and private storage keys are never projected. attendance_acceptance is explicitly internal; response_applicability describes current source/audience and coarse restrictions separately from history. Internal review notes retain Service-edit visibility.

Each non-Accepted independent response creates the existing RestrictedService CustomerContact Activity owned by the current Service owner, due date explicitly needed. A correction reuses the predecessor's permitted Open/InProgress Activity; if already closed, another non-Accepted response creates a new obligation. Accepted correction does not close prior work. Existing Activity update/start/complete/cancel commands own due/owner/outcome history. Its permitted reverse link discloses no report if current report scope fails. Completion never erases a dispute, defect or incident.

POST /api/v1/service/work-orders/:id/visits remains the sole return-visit preparation command. It requires current version and approved scope, and creates Proposed. Scheduling acceptance/confirmation, availability, authority and packs remain receiving responsibilities. No broader SV-06/SV-07 programme is introduced.

## Presentation, marks and recovery

Both DraftEvidence and IssuedReport retain exact HTML; PDF download is not capture. Old draft responses never become issued responses. Changed reports require successor factual correction/submission/review/issue and a fresh response. A mark cannot transfer to changed content, another subject or a correction. Original PNG bytes/hashes/attribution stay protected and are not independently verified identity or legal signature assurance.

Online uses the existing actor/workspace-bound session journal: save immutable original before send, receipt lookup on reload, explicit unchanged retry after uncertainty, correctable input after definite refusal. Pending work disables replacement save/navigation. Saved receipts replace local raw payload with minimal continuation. Closing the tab loses that online copy.

Existing P08 owner-bound offline queue/cache/receipts remain. New captures may select attendance or report subject; legacy queued originals are not rewritten. Exact cached HTML/hash is presented; explicit replay revalidates current authority/source/evidence. Corrections are online history actions. Offline review, issue, incident operations and background sending remain unavailable.

