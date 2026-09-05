# PP-01 — Service API, operation and event contracts

**Edition:** r02 · **Status:** Proposed internal API contract; no endpoints implemented. These are Powerplants One routes, never asserted MYOB endpoints.

[Architecture](../architecture/BP-02-platform-architecture.md) · [Dictionary](service-data-dictionary.md) · [Service specification](../blueprints/BP-07-service-operations.md).

**Naming amendment:** ADR-0005 consolidates all ticket and work-order resources under `/service/tickets` and `/service/work-orders`. API-C/API-R IDs and workflow meanings are unchanged. No endpoints or legacy aliases are implemented.

## 1. Common protocol

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
