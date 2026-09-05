# PP-01 — Service API, operation and event contracts

**Edition:** r05 · **Status:** Internal API contract; bounded P01/P02/P03 subsets are implemented, with component evidence recorded separately. These are Powerplants One routes, never asserted MYOB endpoints.

[Architecture](../architecture/BP-02-platform-architecture.md) · [Dictionary](service-data-dictionary.md) · [Service specification](../blueprints/BP-07-service-operations.md).

**Naming amendment:** ADR-0005 consolidates all ticket and work-order resources under `/service/tickets` and `/service/work-orders`. API-C/API-R IDs and workflow meanings are unchanged. No legacy aliases are implemented.

### P01 implementation subset

API-R03 includes GET `/api/v1/service/tickets/:id` as a single-ticket detail extension. It returns the common read envelope and only `id`, `display_number`, `summary`, `status`, `version`, `synthetic`, `updated_at` and server-derived `can_edit`. It is scoped to the current workspace/company grants. A missing capability returns 403; another company's/workspace's record returns the same 404 as a nonexistent record.

The catalogue's typed draft-save provision is realised as POST `/api/v1/service/tickets/:id/save-draft`, associated with API-C02/DAT-04. Exactly these fields are accepted: `operation_id` UUID, `expected_version` positive safe integer, `schema_version=1`, `summary` 1–200 single-line characters and `reason` 1–1000 single-line characters. Text is trimmed; control characters and unlisted fields (including actor, role, workspace and state) are rejected. Only New requests can be updated. The server does not triage or authorise work. The target and all normalised fields participate in the receipt hash.

The transaction also appends a P01-only `TicketDraftSaved` outbox record with versioned minimal synthetic payload. It remains Ready: no consumer or business side effect is implemented. Existing EVT-01–EVT-12 remain planned and are not renumbered. Server-assigned correlation uses the operation UUID for this bounded command.

Local diagnostics are GET `/api/v1/health` and GET/POST `/api/v1/local-session`. The latter accepts only an allowlisted demonstration `profile`, resolves a server user/session and returns current actor/display context. These local-only routes are not future shared authentication APIs. All routes require the launcher gateway boundary; POST additionally requires the exact loopback Origin and JSON. Non-JSON or oversized bodies are rejected. The rest of this catalogue remains planned. See [ADR-0006](../decisions/ADR-0006-p01-local-foundation.md).

## 1. Common protocol

### P03 implementation amendment — current bounded contract

[ADR-0008](../decisions/ADR-0008-p03-customer-intake.md) and the [P03 handover](../delivery/p03-handover.md) take precedence over the historical subset descriptions below. All paths in this table use `/api/v1`. Existing envelopes, server sessions, scope checks, operation hashing, audit and transactional outbox remain the only protocol. The accepted P01 `SaveTicketDraft` schema, normalisation, hash and original receipts are unchanged; its New-only route remains available. Rich intake uses separate commands with API `schema_version=1`; the database's `intake_schema_version=2` is a distinct mapping marker.

| Contract / route | P03 behaviour and exact accepted command fields |
|---|---|
| API-R01/R02 GET `/customers`, `/people`, `/sites`, `/assets` and existing details | Business lists/traversal reuse scoped reads. Customer detail now always omits exact mapping keys; only the separately authorised `/customers/:id/mappings` route retains those keys. Person detail adds scoped affiliations. Asset search includes description/reference/model/serial. GET `/sites/:id/history` adds scoped attributed history. |
| API-R03 GET `/service/tickets`, `/service/tickets/:id` | Rich intake projection, permitted related labels, owner, received-time provenance, current blockers, clarification activity if readable, and server-derived action availability. List filters: existing `limit`, `cursor`, `q`, `company_id`, `site_id`, plus `owner_id`, `status` (New/NeedsInformation/Triaged). |
| Narrow GET `/work`, `/activities`, `/activities/:id` | Work aliases the activity list. Filters: existing pagination/search/company/site plus `owner_id`, `status` (canonical states or Active), `kind`, `due` (Overdue/Upcoming/Needed), paired `object_type`/`object_id`. Each page reapplies capability, content class and visibility of every linked target. Due groups use server UTC now; terminal state remains distinct from active overdue work. |
| Narrow GET `/selectors/companies`, `/selectors/owners` | Names/UUIDs and permitted create flags only. Owner query accepts `company_id`, optional `site_id`, `purpose` (Ticket/Activity/Customer), optional activity `access_class`, `activity_id`, `ticket_id`, and existing `limit`/`cursor`/`q`. Candidates must have current matching business authority and record access; no grant or account-key projection. Company and owner pages are bounded to 200; signed cursors and literal search reapply current scope. |
| API-C02 POST `/service/tickets` — CreateTicket | Common envelope plus `id`, `company_id` and all intake fields listed below. Allocates TKT with the existing atomic allocator, starts New. |
| API-C02 POST `/service/tickets/:id/save-intake` — SaveTicketIntake | Common envelope plus `expected_version` and all intake fields. New/NeedsInformation only; does not alter status. Company is immutable; a site change that would contradict an existing site-scoped activity is refused. |
| API-C02 POST `/service/tickets/:id/request-information` — RequestTicketInformation | Common envelope plus `expected_version`, `open_questions` (1–4000), `next_action` (1–2000), `follow_up` containing exactly `id`, `owner_id`, `due_at` (UTC/null), `due_needed` (boolean). New → NeedsInformation; question, next action, owned CustomerContact activity and Ticket link commit together. Retry cannot duplicate either. Update the existing active activity for subsequent follow-up; no repeated status transition. |
| API-C02 POST `/service/tickets/:id/triage` — TriageTicket | Common envelope plus `expected_version`, optional `clarification_outcome` (1–4000 when required). New/NeedsInformation → Triaged only. Gates are defined below; no work authorisation or downstream creation. |
| API-C24 POST `/activities` — CreateActivity | Common envelope plus `id`, `company_id`, optional `site_id`, `kind`, `owner_id`, `summary` (1–2000), `due_at` (UTC/null), `due_needed` (boolean), `access_class`, `links` (1–10 unique `{object_type,object_id}` pairs). Starts Open. Only Organisation/Site/Asset/Ticket links are implemented, with real composite foreign keys and current scope checks. |
| API-C24 POST `/activities/:id/update` — UpdateActivity | Common envelope plus `expected_version`, `owner_id`, `summary`, `due_at`, `due_needed`. Open/InProgress only. Company/site/class/category/links remain fixed. |
| API-C24 POST `/activities/:id/start`, `/complete`, `/cancel` | Common envelope plus `expected_version`; complete additionally requires `outcome` (1–10000), cancel `cancellation_reason` (1–2000). Start: Open → InProgress. Complete/cancel: Open/InProgress → Completed/Cancelled. Only the current owner with current edit authority may perform these actions. Terminal content cannot be edited or reopened. |
| API-R09 GET `/operations/:id` | Current actor/workspace/target authority governs original receipts, even after the target advances state. Request-information receipts additionally require current access to their activity. Start/complete/cancel activity receipts require current owner authority. |

**Intake fields:** `received_at` (required UTC instant, at most five minutes in the future), `channel` (dictionary enum), `requester_id` (UUID/null), `requester_description` (up to 2000 clarification text/null), `site_id` (UUID/null), `site_identification_needed` (boolean exactly matching absent site), `asset_id` (UUID/null, same site), `summary` (1–200 single-line), `symptom` (1–10000 narrative, explicit uncertainty permitted), `impact` (up to 2000/null), `priority` (dictionary enum), `priority_reason` (up to 2000/null), `triage_owner_id` (valid active business user), `next_action` (1–2000). Requester description is required when requester is absent. Incomplete impact/rationale may be saved, with owner and explicit unknowns.

**Triage gates:** a known permitted requester/site, symptoms, impact, priority rationale, next action, valid owner and UserReported received time. NeedsInformation additionally requires its clarification activity Completed with outcome and an explicit clarification resolution. P03 deliberately requires known requester/site: the wider catalogue's alternative approved identification scope depends on P04 authority and is unavailable. Urgent priority bypasses no gate. Work orders, approved scope, bookings, dispatch, SLA promises and financial release remain deferred.

For new commands the common envelope is exactly `operation_id` UUID, `schema_version=1`, and `reason` (existing bounded single-line semantics). Existing-record commands require a positive safe `expected_version`. Unlisted fields, client actor/workspace/state/audit data and unsupported target types are rejected. Narrative fields permit line breaks/tabs but reject other control characters; P02 accepted single-line normalisation/hashes remain identical. Shared/P03 bodies are limited to 64 KiB; P01 draft retains 16 KiB. Exact external identifiers remain unchanged text.

Activity categories are TechnicalFollowUp, CustomerContact, MaterialAction, FinanceQuery and RelationshipReview; access classes are Internal, RestrictedService and RestrictedFinance. FinanceQuery requires RestrictedFinance. Due is exactly one of a known instant or explicit due-needed. Ownership never grants record access. Actor and owner must have the required company/site/content and linked-record authority; activity titles, summaries and outcomes are suppressed when any link is inaccessible. Assignment scope and administration-derived business access remain disabled. CustomerContact is a recorded task, not evidence of sending, delivery or acknowledgement; appointment-dependent ContactOutcome remains deferred.

All required business, link, audit, receipt and outbox writes share the existing transaction. Identical accepted retry returns the original receipt before stale-version validation, but only after current authority checks. Changed operation content is rejected. New outbox kinds are TicketCreated, TicketIntakeSaved, TicketInformationRequested, TicketTriaged and ActivityCreated/Updated/Started/Completed/Cancelled; they remain unconsumed synthetic intents. Historical catalogue EVT identities are unchanged.

### P02 implementation amendment

[P02 handover](../delivery/p02-handover.md) and [ADR-0007](../decisions/ADR-0007-p02-shared-foundation.md) record the implementation, physical mappings, permissions and deferrals. The source of exact runtime schemas is [shared commands](../../src/shared/commands.ts); unlisted fields are rejected. All routes below retain the P01 local gateway/origin/session boundaries, `/api/v1` prefix and private/no-store responses.

| Contract / method / route | Implemented fields and result |
|---|---|
| API-R01 GET `/customers`, `/customers/:id` | Organisation projection; authorised contacts, sites and mapping state. Internal notes and exact account keys require separate appropriate grants. No Finance amounts. |
| API-R02 GET `/sites`, `/sites/:id`, `/assets`, `/assets/:id`, `/assets/:id/history` | Scoped site/asset lists, effective party intervals, current asset context, immutable configuration/location records and attributed history. Previous-site history and both sides of move events are independently scoped. |
| Narrow GET `/people`, `/people/:id`, `/facilities`, `/facilities/:id`, `/customers/:id/mappings` | Scoped shared selectors and source context needed to exercise P02; no assignment-derived access. |
| API-R09 GET `/operations/:id` | Original receipt only for its actor/workspace and current target/mutation authority. No cross-user operation browsing. |
| API-C01 POST `/customers` | Common envelope plus `id`, `company_id`, `display_name`, `relationship_status`, `owner_id`; optional `legal_name`, `parent_organisation_id`, `sector`, `notes`, `access_class` (default Internal). |
| API-C01 POST `/sites` | Common envelope plus `id`, `company_id`, `display_name`, `location_description`, `timezone`, `owner_id`; optional `primary_contact_id`, `access_instructions`, `biosecurity_notes`, and up to ten initial `parties` with `organisation_id`, `role`, `valid_from`, optional `valid_to`. Site and initial relationships commit together. |
| API-C01 POST `/assets` | Common envelope plus `id`, `company_id`, `site_id`, `description`, `identity_status`, `effective_at`; optional `facility_id`, `parent_asset_id`, `predecessor_asset_id`, `manufacturer`, `model`, `serial`, `external_equipment_ref`, `lifecycle_status` (default Active), four dictionary dates and initial `configuration` description. Initial location and optional configuration commit with the asset. |
| Narrow POST `/people` | Common envelope plus `id`, `company_ids` (1–10 explicitly authorised contexts), `display_name`; optional `email`, `phone`, `contact_preference`. Initial active=true; no inferred consent or identity deduplication. |
| Narrow POST `/facilities` | Common envelope plus `id`, `company_id`, `site_id`, `name`, optional `parent_facility_id`. |
| Narrow POST `/customers/:id/affiliations` | Common envelope plus new relationship `id`, organisation `expected_version`, `person_id`, `role_label`, date-only `valid_from`, optional `valid_to`. Increments parent version atomically. |
| Narrow POST `/sites/:id/parties` | Common envelope plus new relationship `id`, site `expected_version`, `organisation_id`, `role`, UTC `valid_from`, optional `valid_to`. Increments parent version; overlaps fail. No operator-change impact workflow implied. |
| Narrow POST `/customers/:id/mappings` | Common envelope plus new mapping `id`, organisation `expected_version`, exact `erp_connection_id` UUID, `erp_company_id`, `entity_type=Customer`, `customer_id`, UTC effective period. Creates Proposed only and increments organisation version. Wrong-company/connection rejected. |
| Typed POST `/customers/:id/revise-identity` | Common envelope plus `expected_version`, `display_name`, `parent_organisation_id` (UUID/null; omitted means null). Updates identity description/hierarchy with before/after audit; UUID/reference/company unchanged. |
| Typed POST `/assets/:id/revise-identity` | Common envelope plus `expected_version`, `identity_status`, `serial` (exact text/null), `parent_asset_id` (UUID/null; omitted means null). Preserves historical uncertainty and before/after audit. No move, warranty approval or scope authorisation. |
| Narrow POST `/sites/:id/history` | Common envelope plus new history `id`, site `expected_version`, `occurred_at`, `author_label`, `kind`, `summary`, `confidence` (Reported/Suspected only); optional `asset_id`, paired exact `source_system`/`source_id`, `access_class` (default RestrictedService). Capture actor/time and site/operator snapshots are server-derived; source-backed records are Imported, others ReviewRequired. No verification assertion or business approval accepted. |

For these commands the common envelope is exactly `operation_id`, `schema_version=1`, `reason`. Create identities require a valid UUID. Parent-changing commands also require a positive safe `expected_version`. `201` means a new resource committed; replay returns `200` and the original receipt; typed identity updates return `200`. Child-create receipts identify the child/version; re-read the parent to obtain its incremented version. No worker runs and no external side effect is implied by an outbox/task ID. New outbox kinds are `SharedRecordCreated`, `SharedRecordUpdated`, `SharedHistoryRecorded`; EVT-01–12 remain planned.

List filters are `limit` (default 50, 1–200), `cursor`, literal case-insensitive substring `q`, `company_id` and, for site/asset/facility lists, `site_id`. Person scope derives from authorised company contexts/primary contacts and does not accept company/site filters. History accepts pagination only. Stable ordering is UUID; signed opaque cursors are bound to current actor/workspace/resource/filters/page size and become invalid after the process restarts. Every page reapplies scope. Missing capability is 403; out-of-scope/missing records share 404. Returned page completeness refers to that scoped result, not a global total.

Narrative command fields currently use the bounded single-line text validator (up to 10,000 characters); richer multiline history entry is P03. Exact identifiers preserve all supplied characters, case, punctuation and zeros; date-only values and UTC instants are distinct. Address, coordinates, booking controls, source document evidence, Verified mappings/configurations, operational identity, assignment grants, lifecycle transition commands and downstream workflows are not enabled merely because the physical model or broader catalogue defines them.

Use authenticated same-origin HTTPS JSON endpoints under `/api/v1` for shared browser/mobile commands. Local development may use loopback transport appropriate to the development server. The version is an API compatibility major; each payload also has a schema version. Route handlers call the same domain services as server-rendered actions. A second UI entry point must not bypass permissions, expected versions or operation receipts.

Mutations carry `operation_id` UUID, `expected_version` where an existing aggregate is changed, `schema_version`, command fields and a reason where required. Workspace/actor are resolved from the session and checked against requested record scope. On create, the client may supply a stable UUID used for offline identity; the server validates uniqueness and scope. Do not accept raw client-created audit or approval timestamps as server facts.

Successful mutation response: `operation_id`, `record_id`, `record_version`, `state`, `accepted_at`, `receipt_id`, safe warnings and related generated-task IDs. `201` creates a resource; `200` returns accepted update or replayed receipt; `202` means a durable asynchronous job/intent was accepted, not that the business result is complete.

Error response: `code`, `message`, `field_errors[]` with field/path and corrective text, `correlation_id`, `retryable`, and authorised current-version/blocked-check details. HTTP `401` authentication needed; `403` forbidden; `404` unavailable record without existence disclosure; `409` version/resource/idempotency conflict; `422` invalid state/data; `429` rate limit; `503` dependency unavailable. Never turn a `202`, timeout or missing response into Issued, Synced, Posted or Reconciled.

Read responses have `items`, `next_cursor`, `observed_at`, `completeness`, relevant source run/as-at and per-record versions. Bound page size (prototype default 50, maximum 200) and use an opaque cursor with stable sort plus identity. A filter/page change resets the cursor; an invalid cursor requests a fresh read. Record count and page subtotal must be labelled separately from global/account totals. Polling never grants write authority.

## 2. Read routes

| Contract | Route | Scope/result |
|---|---|---|
| API-R01 | GET `/customers`, `/customers/:id` | Scoped organisation/contact/site relationship DTO; ERP mapping state; no default Finance fields |
| API-R02 | GET `/sites/:id`, `/assets/:id/history` | Effective current context plus attributed historical snapshots |
| API-R03 | GET `/service/tickets`, `/service/work-orders/:id` | Request/order states, approved scope, visits, readiness and permitted next actions |
| API-R04 | GET `/schedule?from=&to=&timezone=` | Permitted resources/appointments, availability/buffers and version tokens; bounded range |
| API-R05 | GET `/my-jobs`, `/appointments/:id/download-manifest` | Assigned-only context, pack version/hash, attachments, cache policy, schema and permission expiry |
| API-R06 | GET `/reports/:id`, `/documents/:id/content` | Authorised exact revision; short-lived streamed/download response only after scope check |
| API-R07 | GET `/finance/handoffs`, `/finance/handoffs/:id` | Finance-scoped source/mapping/result; technician gets no access |
| API-R08 | GET `/customers/:id/account-observations` | Verified company/currency/source basis or explicit synthetic/unavailable state |
| API-R09 | GET `/operations/:operation_id` | Actor/scoped receipt or safe status; no general cross-user operation browsing |
| API-R10 | GET `/admin/exceptions`, `/audit?object=` | Separate support/audit permissions with redacted details |

## 3. Command catalogue

All listed commands use POST. Updates are intent-specific; there is no unrestricted endpoint that accepts arbitrary `status` or database fields.

| ID | Route suffix | Payload beyond common envelope | Guard / durable effect |
|---|---|---|---|
| API-C01 | `/customers`, `/sites`, `/assets` | Typed required fields from dictionary | Scoped synthetic create; identity review and no auto ERP write |
| API-C02 | `/service/tickets`, `/service/tickets/:id/triage` | Request fields; impact/priority/clarification outcome | TR-01; next-action owner retained |
| API-C03 | `/service/work-orders`, `/service/work-orders/:id/authorise` | Ticket/site; exact scope revision, coverage and authority evidence | TR-02; freeze authorised scope and its audit |
| API-C04 | `/appointments`, `/appointments/:id/confirm` | Proposed interval, crew, buffer, policy version and readiness assessment | TR-03; all crew reservations atomic |
| API-C05 | `/appointments/:id/move` | New time/crew, expected assignment/policy versions, reason and acknowledged warnings | TR-08; original remains on failure; impact tasks and pack review requirement |
| API-C06 | `/appointments/:id/change-requests` | Proposed time/crew, source reference/version and reason | Pending request only; no reservation change |
| API-C07 | `/appointments/:id/cancel` | Reason and downstream disposition | TR-16; future reservation release, actual-work guard |
| API-C08 | `/packs`, `/packs/:id/check` | Exact scope/appointment/source manifest, readiness results; check/return decision | TR-04; frozen checked version or returned comments |
| API-C09 | `/packs/:id/issue` | Checked version, template version, recipient assignments | TR-05; 202 generation attempt then explicit issue result when durable |
| API-C10 | `/packs/:id/amend`, `/packs/:id/withdraw` | Change category/reason, successor input and impact | TR-07; dispatch hold and immutable prior content |
| API-C11 | `/pack-issues/:id/acknowledge` | Assignment/version, presented hash and captured time | TR-06; exact recipient acknowledgement event |
| API-C12 | `/appointments/:id/start` | Applicable issue/assignment/scope versions; actual-start intent/context | TR-09; readiness/authority check; offline may require review |
| API-C13 | `/field-entries`, `/field-entries/:id/correct` | Typed capture payload, attribution and source revision; correction reason | TR-10/TR-12; preserve approved originals, deduplicate |
| API-C14 | `/attachments/initiate`, `/attachments/:id/finalise` | File metadata/hash, entry link; upload receipt/hash | Stage/quarantine/inspect; finalise idempotent; no submitted report with incomplete required blob |
| API-C15 | `/sync/operations` | Bounded list of original envelopes, dependency IDs and hashes | Per-operation receipts; failed item does not silently drop others; causal dependency ordering |
| API-C16 | `/appointments/:id/submit-completion` | Exact entry IDs/versions, completion outcome, remaining work and report draft | TR-11; validate all attachment receipts and mandatory evidence |
| API-C17 | `/reports/:id/review` | Approve/return, entry decisions, report revision and reason | TR-12; approved set frozen; returned comments linked |
| API-C18 | `/reports/:id/issue`, `/reports/:id/respond` | Template/audience/exact source or presented hash/response/person/context | TR-13; async generation; immutable customer response |
| API-C19 | `/finance/handoffs`, `/finance/handoffs/:id/submit` | Source report/entry revisions, account/company, quantities, mode and evidence | TR-14; source allocation check and ReadyForReview |
| API-C20 | `/finance/handoffs/:id/review` | Approve/return, financial dispositions, definition/version and reason | Finance permission; exact source unchanged; Approved or Returned |
| API-C21 | `/finance/handoffs/:id/begin-processing`, `/finance/handoffs/:id/record-outcome` | Processing claim/version; target references/evidence or Unknown | Single processor claim; no duplicate external operation |
| API-C22 | `/finance/handoffs/:id/reconcile` | Source-target maps, basis, differences and reviewer disposition | Conservation/evidence/unknown checks; Reconciled only if valid |
| API-C23 | `/service/work-orders/:id/close`, `/service/tickets/:id/resolve`, `/service/tickets/:id/close`, `/service/tickets/:id/reopen` | Resolution, evidence dispositions and owned follow-up/new-work link | TR-15; independent lifecycle checks |
| API-C24 | `/activities`, `/activities/:id/complete`, `/contact-outcomes` | Owner/type/object links, due or due-needed, outcome/recipient context | Scoped attributable action; no outbound messaging |
| API-C25 | `/assets/:id/move`, `/scope-revisions`, `/reports/:id/amend` | Effective change/reason/revision and reviewed impacts | Preserve historical context; dependent pack/report/Finance review |
| API-C26 | `/policies/:id/publish`, `/templates/:id/publish` | Exact reviewed version/effective date/impact result | Business publisher permission plus tests; no deployment grants |

Child editing of drafts can use typed save commands under the corresponding resource with the same expected-version contract. P03/P04 must enumerate exposed fields in schemas; unlisted fields are rejected. API-C26 covers publication design, not a generic no-code policy engine; PP-01 uses a small versioned predefined policy/template set.

## 4. Idempotency and failure recovery

Operation identity is unique by workspace and authenticated actor, stored with canonical payload hash and receipt. Durable operations that consume Finance quantities or create issues retain their identity for the entire active record/replay lifetime; do not expire them on a short HTTP cache TTL. Operational retention remains D-012/D-021. A transient validation failure before acceptance does not consume the operation ID; an accepted command or asynchronous job does.

For existing operations, return the authorised stored receipt before reapplying stale expected-version checks, because successful first execution changed the version. Current access still governs which receipt details can be returned. A same-key/different-payload request is a conflict. A receipt is not a bypass for a different user/workspace.

Attachment upload identity includes upload operation ID, expected content hash and byte count. Finalise verifies actual content and records one object reference. An interrupted upload can resume or restart against the same logical identity; abandoned staging objects are reclaimed under policy after references/leases are checked. Field entry acceptance can preserve metadata while attachment remains Pending, but completion/report issue requires Available status for required files.

Finance external effects are not made transactional by the app database. A manual processor claims the item before opening MYOB, then records evidence. If processing may have succeeded but the result is uncertain, set OutcomeUnknown and investigate. A worker retry must not create a second financial document. Source lookup/reconciliation is required before a new equivalent command is enabled.

## 5. Offline ordering

Each queued operation records dependency operation IDs. Example: create field entry → upload/finalise its photo → submit report referencing accepted revisions. The server returns individual accepted/rejected/pending results; the client only removes or archives a payload after persisting its receipt. Submission is blocked while a required causal dependency is unresolved.

Same-job operations can be replayed sequentially; independent jobs may sync concurrently subject to limits. A stale expected version is not automatically updated and retried if the business meaning changed. Preserve and display differences for review. Evidence captured under a superseded assignment is a recoverable observation, not authority to create new confirmed work.

Response to expiry/revocation follows BP-02's narrow recovery capability. In the absence of that capability, keep unsynced evidence locally under the device policy and use a supervised recovery process. Do not discard data simply because a normal API now returns 403.

## 6. Domain event catalogue

Events carry `event_id`, `schema_version`, `workspace_id`, `aggregate_id/version`, `operation_id`, `correlation_id`, `occurred_at`, `actor_id` and a minimal typed payload. Consumer receipts prevent duplicate side effects.

| Event | Trigger | Consumer action |
|---|---|---|
| EVT-01 ScopeAuthorised | API-C03 | Make authorised work available to planning; no auto booking |
| EVT-02 AppointmentConfirmed | API-C04 | Prepare notification/contact tasks and pack preparation work |
| EVT-03 AppointmentChanged | API-C05 | Mark pack review required; notify affected internal task queue |
| EVT-04 PackIssueRequested / PackIssued | API-C09 / durable issue completion | Generate exact content; then create recipient tasks once |
| EVT-05 PackAmendmentRaised | API-C10 | Hold dispatch where material and create urgent-contact task |
| EVT-06 FieldEvidenceAccepted | API-C13/API-C15 | Update scoped history/review counts; no billing |
| EVT-07 CompletionSubmitted | API-C16 | Create reviewer task with exact entry set |
| EVT-08 ReportIssued | API-C18 | Distribution task and customer-response handling; no invoice |
| EVT-09 HandoffApproved / HandoffOutcomeRecorded | API-C20/API-C21 | Owned processing/reconciliation queue; unknown outcome not auto-retried |
| EVT-10 HandoffReconciled | API-C22 | Update closure readiness; preserve ERP state distinction |
| EVT-11 AssetContextChanged | API-C25 | Review affected future scope/packs; historic snapshots unchanged |
| EVT-12 PolicyOrTemplatePublished | API-C26 | Evaluate affected future work; no silent reissue/reassignment |

## 7. Contract proof

P02 tests transaction/unique/foreign-key guards; P05 tests concurrent crew allocation; P08 tests operation/attachment replay and schema changes; P09/P10 test source revision and financial conservation; P11 tests forbidden direct API/file/query calls. PT cases provide expected business outcomes. Contract schemas and implementation tests must reference these IDs, and breaking changes require a new compatible API/payload version or tested migration.
