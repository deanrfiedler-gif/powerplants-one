---
document_id: PPO-CS06-NATIVE-BUILD-DEC
date: 2026-10-20
owner: Dean Fiedler
status: Implementation direction authorised; implementation and owner visual review pending
versioning: git
---

# Access & readiness — native implementation

The [accepted CS-06 design](access-readiness-figma-design.md) remains the visual authority, including D1–D7 and Q1–Q4. On 20 October Dean authorised the prerequisite backend work after the build investigation found missing requirement publication and appointment binding: "I am happy to proceed however is the most professional long term solution" and "we may have to adjust some journeys and backend accordingly, providing they are an improved version". This records the bounded implementation choice, not approval of a completed application.

## Requirement revisions

Use the existing immutable `cs_snapshots` Submission and `cs_record_events` Reviewed/Returned records. The readiness record continues to hold the active requirements, evidence and work windows. A pending requirements revision lives in a Submission snapshot with an explicit readiness purpose, its active-requirements hash and its contributors. Saving or replacing that draft never changes active requirements or invalidates a preparation solely because a draft exists. The most recent pending submission is the only one eligible for publication. A reviewer must hold the existing `shared.edit` authority and must not be a contributor to that draft. Publication checks the exact active basis and expected version, retains the review event, and replaces the active requirements atomically. Returning a revision leaves the active requirements untouched.

Evidence capture and work windows remain separate from requirements publication. Changes invalidate earlier preparation through the existing source fingerprint; exact evidence review remains independently attributable. Requirement edits cannot bypass publication through the legacy save endpoint. Legacy source records remain recorded sources with their actual history; no migration or seed marks them reviewed. No requirements still means unknown readiness.

Alternatives considered: replacing active content while a draft is edited violates D4; putting draft state only in the browser loses recovery and independent review; a new revision table duplicates the immutable snapshot and event facilities already present. The existing storage can express this bounded lifecycle without a schema migration, new capability, dependency or service. Any future expansion that outgrows these explicit purposes must revisit the storage contract.

## Visit binding and acknowledgement

New visit-bound preparation reads the permitted appointment at the same site and company and retains its schedule, assignment and scope basis with the check. The server supplies its attendance interval, rather than trusting copied browser times. A later move, reassignment or changed appointment basis requires a new check. Retained generic checks remain visible as unbound historical checks and are never represented as tied to an appointment. Current record and source authority are checked again on save; a refused acknowledgement preserves the form reason for correction and creates no event.

Acknowledgement grants no work authority, booking, resource reservation, pack issue or dispatch clearance. P4 is displayed as gated, with no fabricated confirmation or contact write. Work-window weekdays and Conversations remain outside this increment. SharePoint continues to own source documents; no communication or external integration is introduced.

## Delivery boundaries

Refine `/sites/[id]/readiness`, retaining CS-06 and its parent requirements PRJ-04, SVC-03, SVC-04, SVC-06, SVC-10 and NFR-02. Reuse the current shared record composition, controls, compact phone header, tokens and icon mapping. Undrawn authoring and recovery forms adapt the existing CS controls. Their design remains open for owner review, separately from conformance to the drawn frames.

Tests must cover draft isolation, independent publication, stale publication, evidence review, current permission checks, appointment moves, acknowledgement refusal, exact recovery and phone layouts. Owner visual review, independent review, business acceptance and deployment remain separate from automated proof. No independent second-model review has yet occurred.
