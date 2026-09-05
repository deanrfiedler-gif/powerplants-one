# ADR-0009 — P04 work scope, coverage and readiness

**Date:** 5 September 2026 · **Status:** Selected for authorised P04; execution/publication evidence is in the [handover](../delivery/p04-handover.md). **Related:** [issue #26](https://github.com/deanrfiedler-gif/powerplants-one/issues/26), [PR #27](https://github.com/deanrfiedler-gif/powerplants-one/pull/27), SC-05, TR-02, DAT-05–06, API-C03/C25, EVT-01, SR-02/03/04/10/16/18/20, PT-03/04/05 components.

## Decision and alternatives

Extend the existing TypeScript/Next.js/PostgreSQL modular monolith. Retain all dependency pins, server identity, current capability/scope checks, reference allocation and sharedOperation transaction. A separate approval framework, ORM, generic JSON entity store, scheduling engine or document-management service is unnecessary for P04.

Only PlatformSynthetic work authority is enabled. Proposed appointments are immutable attendance intentions with no assignments, reservations or confirmation. Normal GitHub publication does not grant operational service, safety, Finance or integration authority.

## Work context and linkage

WorkOrder owns its UUID, permanent WO reference, company/site/customer, service owner, version and Draft/Authorised state. The selected customer is a currently related site party when the order is created. Company/site/customer/authority context is fixed. Explicit WorkOrderTicket links have same-workspace/company/site foreign keys, unique pairs and a purpose/disposition; at least one link is required. Many orders can share tickets and one order can link several tickets. Creation never edits a ticket.

A draft may link a known-site incomplete request so it stays owned and visible; authorisation requires every linked request Triaged. P03's requester/site triage gate remains unchanged. The wider unknown-site identification alternative is deliberately **not enabled**: IdentificationPlan applies to an unresolved Asset at the WorkOrder's known service site. A site-less intake is not a site-less work order. This resolves the P03/P04 boundary without guessed placeholder locations or an unreviewed triage bypass.

## Scope and authorisation

WorkOrder has separate current `scope_revision_id` and `authorised_scope_revision_id`. Draft saves retain a revision identity and increment its content version; authoritative commands increment the work-order version. Authorisation approves/fixes the exact saved revision, plans and evidence atomically. Approval is the reviewer's explicit API-C03 decision, not a client-supplied approval timestamp or a separate unchecked pre-approval boolean.

Once approved, database triggers reject revision/child mutation, deletion and inserted extra scope items. Material change creates a successor with predecessor and change reason. The order remains Authorised for its **previous exact scope** while the successor is Draft. API-C03 also permits review/authorisation of that successor; it does not implement InProgress/WorkComplete/Closed. Proposals retain their old scope/version and show review required; P04 never repoints them or claims downstream pack/crew invalidation exists.

The immutable approval snapshot records exact scope/items/assets/configuration/identification uncertainty, exclusions, limits, authority and coverage evidence, site source version/control context, owner, readiness and policy. SHA-256 uses the stored PostgreSQL JSONB text encoded as UTF-8, identically for SQL fixtures and runtime approvals. Hashes prove byte identity, not business authenticity. Approved asset context is read from that snapshot; current permissions still govern access. Authorisation actor/time and plan approval metadata remain separate server fields. Draft editing invalidates scope-level readiness by content version; historical assessments/evidence are retained.

## Identification and coverage

Unresolved/disputed equipment can only be authorised in an Identification task with method, limits and overall diagnostic limit, approved by the scope authoriser. The asset identity and original history remain unchanged. Similar descriptions/serials never merge. ReviewRequired configuration cannot be selected as verified authority. No configuration-verification command is introduced.

Inspection/Identification are bounded non-intervention categories: they do not permit performing shutdown, energised access, opening or adjustment. An explicitly declared shutdown prerequisite still requires isolation/shutdown authority evidence. Intervention requires explicit conditions and those same non-waivable controls. This is a conservative synthetic policy, not an operational safety procedure or trade competency determination.

Coverage retains all five canonical positions. Every recorded assessment has reason, assessor/time, optional exact agreement/version/effective dates and a charging route. Unknown/Disputed permits only explicitly bounded Inspection/Identification, with FinanceReview. ContractReference requires an agreement/version and still grants no financial approval. ApprovedNonBillable is not exposed because P04 has no financial-authority contract. NotApplicable requires a reason. A reviewed pending-account/Finance plan is the P04 account basis; no verified ERP mapping is fabricated and no account keys/amounts are projected. All work retains PendingFinanceReview; no invoice, free-work, warranty or supplier-recovery effect is created.

## Minimum DocumentReference boundary

Authority/readiness evidence uses a typed immutable local DocumentReference subset: Synthetic provider, text/plain content, exact source reference/version, title, owner, Available status, RestrictedService class, local key and SHA-256. Text is stored in PostgreSQL alongside its reference so it is durable with the transaction and database backup. This deliberately extends the earlier synthetic file-store stub for small manual evidence only. There are no arbitrary URLs, uploads, financial documents, document browsing, SharePoint, issued packs/reports, distribution or acknowledgement. New evidence creates a new record; old evidence cannot be edited.

## Readiness policy amendment

DAT-06 originally attached every ReadinessAssessment to an Appointment and listed Booking/Dispatch/Completion. TR-02 also requires controls before authorisation, when a proposed visit need not exist. P04 therefore adds **Authorisation** as a blocking stage and scope attribution: every assessment has exact scope revision/content version; `appointment_id` is null for Authorisation and mandatory for later stages. This avoids manufacturing a visit merely to review scope.

A Published immutable predefined PolicyVersion and typed PolicyCriterion rows own stage/applicability/exception rules. No policy-edit/publish endpoint or client `exception_allowed` input exists. The predefined synthetic version uses:

| Criterion | Stage | P04 treatment |
|---|---|---|
| SiteAccess | Authorisation | Evidence-backed Pass required; no N/A or exception |
| SiteControls | Authorisation | Site/biosecurity/control evidence required; no N/A or exception |
| CompetencyPlan | Authorisation | Review required competency requirements; does not validate an assigned crew |
| MandatoryIsolation | Authorisation | Pass for intervention; evidenced N/A only for exact non-intervention scope; never exception |
| ShutdownAuthority | Authorisation | Same non-waivable conditional treatment as isolation |
| ToolPreparation | Booking | Documented non-critical collection/preparation exception permitted |
| CrewCompetency | Booking | Unknown/Blocked only in P04; actual assigned-resource evidence is P05 |
| DispatchControls | Dispatch | Unknown/Blocked only in P04; pack/crew/current controls are later prerequisites |

Decided outcomes retain reviewer/time/reason/source-as-at and evidence. Supplied expiry is binding; expired or scope-stale decisions read Unknown and cannot clear authorisation. No universal operational freshness interval is invented. New assessment versions preserve previous evidence. Non-critical exception never turns another mandatory criterion into ready. Unknown, Blocked and N/A remain distinct. Proposed visits keep dispatch hold and Unknown/Proposed customer commitment; preparation is Unknown/Preparing/Blocked, with no false Ready/Confirmed claim.

## Permission and transaction boundary

New capabilities are service.work_order.read/edit, service.scope.authorise and service.readiness.assess. Both current capability and record scope are required. The versioned synthetic seed derives new read grants only from active ticket-read grants, and the explicit P04 synthetic edit/review/authorise grants from active ticket-edit grants. This is a fixture decision, not a department delegation inferred at runtime. Systems/unassigned Technician gain nothing. Seed receipt 4 prevents revival after later revocation.

Order reads and lists independently scope the customer/site, every linked ticket and every historical affected asset. Inaccessible/missing records use the existing same-404 treatment; missing capability is 403. General DTOs contain no ERP account keys, Finance amounts or restricted Finance evidence. ActivityLink remains limited to the P03 typed targets; no speculative WorkOrder/Appointment/Report/Handoff activity targets are enabled.

Current authority is rechecked before receipt replay. Identical accepted retries return the original receipt; changed operation payload is rejected; stale expected order/scope/policy proposals cannot overwrite saved work. Shared workspace graph locking and mutable-source row locks guard authorisation. Required scope/plan/order/audit/receipt/outbox writes commit together. EVT-01 ScopeAuthorised is a durable unconsumed synthetic intent, never auto-booking. No worker runs.

## Compatibility and evidence

Migration 0004 adds new typed tables/constraints and expands implemented identity/reference/capability enums. Applied 0001–0003 and old seed bytes remain unchanged. Existing UUIDs, references, counters, source keys, history, accepted hashes, receipts and deliberately revoked grants are preserved. There is no down migration; recover valued work from a private pre-upgrade backup into a separate allowlisted database. Disposable reset destroys the whole synthetic universe, as before.

Local PostgreSQL is blocked by OS group restrictions; real PostgreSQL/HTTP/restart/browser evidence uses authorised ephemeral repository CI. Full PT-03 also requires later identity verification; full PT-04 includes dispatch; full PT-05 includes field extra-work capture. P04 supplies component evidence only. Operational policy, real authority delegations, devices, live integrations and acceptance remain unresolved. P05–P12 and PP-01 are incomplete.

Primary technical sources checked 5 September 2026: [PostgreSQL 16 constraints](https://www.postgresql.org/docs/16/ddl-constraints.html), [explicit locking](https://www.postgresql.org/docs/16/explicit-locking.html), [Next.js data security](https://nextjs.org/docs/app/guides/data-security). PPO policy choices above are project decisions, not claims made by those vendor sources.

P04 control clarification: an explicit shutdown condition keeps mandatory isolation and shutdown authority applicable even on an Inspection task. Non-intervention alone cannot make such a declared control NotApplicable.
