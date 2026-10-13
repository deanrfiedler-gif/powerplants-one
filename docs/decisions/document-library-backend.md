# DK-01/DK-02 document library backend

Owner: Dean Fiedler  
Review status: implementation decision for the requested synthetic backend; business acceptance and live integration remain open.

## Decision and scope

Implement BC-03's first increment against the existing PostgreSQL, operation receipt/audit/outbox and private write-once document store. Parent requirements DOC-01–DOC-06, PRJ-01 and NFR-01 retain their original scope. DK-01/DK-02 cover registration, exact revision history, declared business-record references, findings and independent review. DK-03 issue/distribution and DK-06 template publication remain separate.

A LibraryDocument has a stable UUID and synthetic DOC display number, immutable revision metadata and an exact source identity. This adopts DOC for the new internal business identity; no external record is renamed. The first sources are bounded synthetic UTF-8 text and existing exact Job Pack / Service Report issues. Native source authority is rechecked, and issued bytes are reused without regeneration. SharePoint remains the intended business-document authority; this increment neither connects to it nor stores credentials, operational documents or native CAD edits.

Use existing database and storage components rather than a new document service, search engine or external provider SDK. Storing content directly in register rows would blur metadata and exact storage availability; using a mutable URL would lose revision identity. Both alternatives are rejected. Synthetic text is stored in an immutable operation-bound envelope outside the repository. Recovery accepts only the original text and must reproduce the retained envelope/hash.

## Behaviour

Three explicit, scoped capabilities are document.read, document.register and document.review. There are no seeded grants or new users. Native source access and linked-record access remain additional requirements, not inherited from document permissions. Working-company scope applies. Hidden records are omitted before filtering/pagination; an unreadable exact native source hides its library metadata. Declared references whose receiving records are no longer visible are omitted with a partial-coverage notice, without identifiers or counts.

Register metadata is revisioned. A successor starts unreviewed; references and decisions retain their exact old revision. Withdrawn identities and historical revisions remain readable. Current-use commands require the current nonwithdrawn revision and an available, current native source. A review purpose and rationale bind to the exact source hash. Reviewed and Returned decisions are immutable and independent of both the registrar and source author. Open findings block Reviewed. A later finding makes the previous Reviewed decision insufficient even after closure; a new revision is needed for a new decision.

Findings retain their original text, owner and due date. A response awaits a separate review; its author cannot accept it. Acceptance closes only that finding. Responses and acceptance remain in immutable events. Declared links identify an exact revision and receiving object, and may be retired; they do not modify an issued package, native schedule, quote, acceptance or business approval. Automatic impact actions and cross-domain retargeting are deferred to the receiving workflow.

Every mutation carries schema version, operation UUID, reason, expected aggregate version and exact revision where applicable. Current authority is checked before an original receipt can replay. Immutable events bind the typed mutation, aggregate version, audit, receipt and internal outbox. Revision metadata and source keys never mutate. Downloads validate exact bytes and recheck authority after storage access. Missing bytes cannot fall back to a successor.

## Boundaries and acceptance

This is a synthetic backend increment, not the existing standalone design's visual acceptance. No browser editor, bulk upload, live SharePoint sync, native CAD comparison, issued-document distribution or provider outage classifier is claimed. Availability reports exact availability/unavailability independently of review. Native recovery remains with its source workflow. Local library history and declared usage are bounded/paged; no claim of exhaustive organisation-wide usage is made.

Tests must prove scoped reads and mutations, independent review, finding transitions, stale/racing commands, original receipts, exact historic downloads, source authority/currentness, missing-byte recovery, immutable evidence, populated/repeated upgrade and database restart. Register deployment, interface review and production readiness separately.
