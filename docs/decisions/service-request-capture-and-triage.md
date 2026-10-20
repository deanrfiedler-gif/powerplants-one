# Service request statement capture and atomic triage

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 20 October 2026. Status: scoped implementation decision under Dean's instruction; code verification and owner visual review remain separate.

Dean instructed: “Implement both customer-statement capture and atomic triage so the page matches the accepted design. I authorise all and any scoped backend changes needed to ensure the Powerplants One app is professional as possible; keep the rest of ADR-0043 out of scope.” This supersedes the two implementation blockers recorded in the [build plan](../delivery/service-requests-accepted-build.md). It does not adopt ADR-0043's wider lifecycle, Conversations, a new capability, or a new customer relationship field. Parent requirements SVC-01, SVC-02 and SVC-06 retain their existing meanings.

## Retained customer statements

Migration 0112 (reserved before implementation) adds an empty, append-only ticket statement table. A statement stores the customer's words, source label, reported time, channel, recorder, operation and resulting request revision. Its basis is always ReportedSymptom. Original symptom text, priority, owner and stage remain unchanged. The request revision advances once, making concurrent statements and triage visible to the existing revision guard. Corrections are subsequent statements; there is no edit/delete command or retrospective backfill.

The existing service.ticket.read/edit permissions govern reads and writes in the request's company/site. Current authority is checked before replay receipt access. The command uses the existing transaction, idempotency, audit, receipt and outbox machinery; only TicketStatementRecorded is added to the outbox allowlist. No seed, identity type, grant, package or service is added. An immutable child table was chosen over overwriting symptoms or a general conversation model because it retains attribution without changing the assessment or adopting the deferred scope.

## One triage decision

TriageTicket optionally accepts a review of the existing priority, request owner, priority reason and next action. Those fields and the transition from New or NeedsInformation to Triaged commit as one request revision. Existing callers without review keep their original canonical command hash. The native intake gate remains authoritative: equipment is informative, not a newly mandatory field; urgency bypasses nothing.

For an open linked clarification, the caller may supply its expected revision. Only its current owner with activity.edit and current visibility may complete it. The clarification outcome, Activity completion evidence, request review, triage transition, audit rows, receipts and outbox jobs share one transaction. The internal Activity receipt has its own operation identity linked to the parent triage operation; parent replay never repeats the child. A stale request/activity, missing field, lost permission or failed evidence write refuses the whole change. Another owner's activity must be completed through its existing authorised workflow.

## Boundaries

MYOB remains the intended ERP authority; SharePoint owns business documents. No connector endpoint, booking, work authorisation, resolution/review lifecycle or operating calculation is introduced. Customer context remains derived from a visible current site Operator or the requester's single visible relationship. The creation form labels that distinction; explicit customer selection is an open design question. Native triage inputs retain their existing server limits where the drawing's counters differ.

The [page contracts](../design/development/pages/scope-sv-01.md) and [evidence ledger](../testing/evidence/service-requests-accepted/README.md) separate source presence, automated proof, visual comparison, owner review and deployment.
