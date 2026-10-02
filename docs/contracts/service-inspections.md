# Service inspection API and data contract

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Synthetic implementation contract; review/acceptance status is separate. See [decision](../decisions/service-inspections.md) and [evidence](../testing/evidence/service-inspections/README.md).

## Boundaries and endpoints

FI-03: `GET /api/v1/my-jobs/inspections`, `GET/POST /api/v1/my-jobs/[appointment_id]/inspections`, plus `preview` and `files`. FI-04: `GET /api/v1/service/inspections`, `GET/POST /api/v1/service/inspections/[appointment_id]`, plus `files`. Pages use the same appointment ID as an explicit query. Engine attempts retain their own stable IDs.

Capture rechecks current assigned field permissions; submission adds completion permission. Actual personal attendance, issued pack/scope, readiness and scheduling-policy controls remain authoritative. Review/release use scoped report duties, Service work-order edit permission and named Service ownership, with mandatory independent review. There are no new capabilities, grants or identities. Wrong-scope direct reads/files/receipts are refused.

Commands: open, save, evidence/remove_evidence, submit, clarify, review, correct, defect and release. Each has the existing schema version, original operation ID, reason and relevant optimistic version. Receipts bind the real Appointment and original ServiceInspection command duty. Duplicate accepted payloads replay one receipt; changed reuse conflicts. A failure rolls back database effects. Stored bytes may remain orphaned after rollback but never become an accepted evidence row.

Open requires the exact preview binding hash. One open draft per performer and exact procedure/equipment/scope/context replaces Service's legacy host-wide draft constraint. Engineering retains its original host-wide contract. Stable check occurrence hashes include procedure identity, scope item, equipment ID and stable check key. Revision/name equality alone does not merge defects.

## Persistence and output

Migration 0055 adds five immutable consumer tables: catalogue versions, retirement events, attempt bindings, command events and issued output manifests. The shared attempts/results/instrument uses/evidence/reviews/defects/lineage tables remain the engine. Seed 55 supplies two fictional procedure versions and one separate fictional instrument; it changes no installed seed, user or permission grant.

Bindings retain exact immutable template, appointment/schedule/assignment, scope task, Equipment/configuration, attendance, pack and preparation/readiness sources. A scope-pinned configuration wins; an unpinned scope must expose exactly one current Equipment version in preview. Changed sources retain history while requiring reassessment.

Raw values/units and exact approved conversions stay separate from computed evaluations. Calibration uses the retained snapshot and actual test date; later renewal cannot repair history, while retrospective withdrawal affects current applicability. Required unknown/incomplete checks remain owned work. PNG and plain-text byte limits, hashing and storage verification reuse the shared engine.

Submission freezes exact content and atomically creates/reuses required owned defects and RestrictedService corrective Activities through Activity authorization/insertion primitives. A recorded correction plus correctly linked fresh passing retest and independent acceptance is required for closure. Activity completion alone changes no inspection defect.

The initial corrective owner and due date remain fixed together with the Activity. Coordinated reassignment is unavailable in this increment; the API refuses a divergent owner/due date or waiver of retesting. System-changing corrections require the owning Engineering workflow.

Release binds one exact accepted attempt/review and its procedure/equipment/scope, failures, corrections, exclusions and remaining work. The existing controlled renderer/store retains exact Internal HTML/PDF bytes and hashes. Files recheck current audience/scope authority and verify stored bytes. Current applicability is displayed separately; issued bytes never mutate. No other domain is completed and no FI-06 clearance is claimed.

## Recovery

Initial scope is online. Server drafts persist across reload and application/database restart. Unsaved entries stay in browser memory. Before transport, one bounded unchanged original is retained in actor-scoped session storage; Service evidence opts into a 6,000,000-character limit and quota refusal sends nothing. Existing consumers keep 32 KiB. Same-tab reload recovers the original; closing the tab/clearing storage removes that browser copy. There is no offline inspection queue or inferred offline proof.

## FI-06 consumer interaction

The incident contract adds a separate current restriction to readiness, Start and exact inspection release. Factual inspection capture/correction/retest remains available under an incident hold when its own assignment, attendance, preparation, scheduling and source requirements pass. Passing evidence never closes an incident. Release rechecks exact incident applicability under the shared transaction before and after rendering; historical outputs keep original bytes. Current hold information contains no incident facts or restricted evidence. The original 0055 contract and evidence remain the baseline.
