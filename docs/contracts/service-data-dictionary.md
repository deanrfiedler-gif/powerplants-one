# PP-01 — Service data and choice dictionary

**Edition:** r09 · **Status:** Logical contract; P01–P07 implement bounded subsets with explicit limits below. This is not an exported CREMS/MYOB schema.

[BP-02](../architecture/BP-02-platform-architecture.md) · [BP-07](../blueprints/BP-07-service-operations.md) · [Finance](finance-handoff.md) · [Documents](document-issue-distribution.md).

**P01 physical subset:** Workspace, synthetic company context, User, company-scoped read/edit grants, opaque Session, New Ticket, AuditEvent, OperationReceipt and OutboxJob. Ticket fixtures use owned requester/site clarification markers; `site_identification_needed=true` and no site relation exists yet. Shared Organisation/Person/Site/Asset models and full scope/assignment permissions remain P02. Fixture references are deterministic reserved SYN-PPO identities; no create endpoint or production reference allocator exists. Full cross-type allocation/uniqueness is a P02 obligation. The separate `ppo_proof` reservation table is a disposable feasibility experiment, not a completed DAT-06 model. [ADR-0006](../decisions/ADR-0006-p01-local-foundation.md) and the [handover](../delivery/p01-handover.md) record migrations, tests and limits.


## P06 physical implementation amendment

[ADR-0011](../decisions/ADR-0011-p06-controlled-job-packs.md), [API amendment](service-api.md#p06-implementation-amendment) and [handover](../delivery/p06-handover.md) govern current DAT-07/minimum DAT-11. Earlier stage limits describe their delivery point; DAT-08 is now implemented within the P07 amendment below; DAT-09/10 remain design.

| Logical record / physical mapping | Implemented facts and invariants |
|---|---|
| Pack / packs | One pack per appointment, permanent PACK UUID/reference, current revision/issue pointer, version, Draft/Returned/Checked/Issued/Withdrawn and needs_review projection. |
| PackRevision / pack_revisions | Immutable predecessor, integer revision, nine typed section notes and explicit source/history selection; exact server snapshot/hash/reason/actor/time. Check/return decisions are separate immutable pack_checks; no rewritten approved input. |
| RenderJob / pack_render_jobs + pack_render_attempts | Immutable actor/operation/finalisation operation, input hash, reserved issue UUID/time; leased attempt/token, state, owner, safe errors and write-once output manifest. Original intent remains even without a file. |
| PackIssue / pack_issues + pack_issue_events | One immutable issue per revision/job, actual issued_by/issued_at, exact manifest/output/source hash, schedule/assignment version. Issued/ReviewRequired/Superseded/Withdrawn are append-only events; old output never changes. |
| PackRecipient / pack_recipients | Unique issue/assignment and issue/user, required individual assignment/version. Seed adds Morgan independently of Riley; acknowledgement never represents another person. |
| PackAcknowledgement / pack_acknowledgements | Unique recipient and actor/operation, exact hash, original capture time and authoritative server response time. New issue or replacement assignment requires a new response. |
| DistributionEvent / pack_distribution_events | TaskCreated/SimulatedSent/Opened/Downloaded only; time/evidence/actor/recipient. No invented delivery or acknowledgement. Contact outcome remains a separate P05 fact. |
| PackFollowUp / pack_follow_ups | Immutable issue-event/Activity link. ReviewRequired/Withdrawn atomically create a service-owner CustomerContact Activity, Site link and due_needed=true. P03 completion requires a recorded outcome. No messages sent. |
| DocumentReference / pack_sources + pack_source_locations | Synthetic provider/item/version/hash/byte count, title, owner, company/site/classification; immutable byte reference with availability/location version projection. Exact original bytes outside Git; P04 document_references text unchanged. |
| DocumentTemplate/Policy / pack_templates + pack_policy | Immutable version/definition/hash/renderer; current policy version/template pointer rechecked before check/request/final issue. No public editor. |
| IssueManifest / pack_issues.manifest and durable bundle | Exact source/template IDs/versions/hashes, source snapshot hash, stable adapter key, PDF/HTML/bundle bytes/hashes, filename/revision, prepared/reserved issue time and renderer/browser versions. Actual release time belongs to immutable issue row. |

The P04 appointment unconditional `dispatch_hold` CHECK is replaced only in migration 0006 with actual issue/assignment/acknowledgement evidence. Domain readiness additionally rechecks non-waivable current policy/authority. A stored false flag is not sufficient for future P07 start: P07 must run the current guard inside its start transaction. Appointment/work-order change triggers invalidate pack applicability atomically with P05/P04 changes. Full reports, Finance, generic uploads and field evidence are not implemented.

## P05 physical implementation amendment

[ADR-0010](../decisions/ADR-0010-p05-planner-controlled-changes.md), [migration 0005](../../db/migrations/0005-planner.sql), the [API amendment](service-api.md#p05-implementation-amendment--current-bounded-contract) and [handover](../delivery/p05-handover.md) define the current DAT-06 subset. Earlier stage amendments are historical delivery boundaries; future dictionary states remain design.

| Record / mapping | Delivered control |
|---|---|
| Appointment / appointments | Proposed/Confirmed/Cancelled; distinct record, schedule and assignment versions. Original order/site/timezone/window/scope/content/readiness-policy/proposal provenance stays fixed. New current scheduling policy, exact booking snapshot/hash and preparation/review/cancellation requirement. Confirmed reserves crew, never implies dispatch or attendance. Actual-start/end nullable markers support a hard refusal contract only; P07 capture is absent. |
| AppointmentProposal / appointment_proposals | Immutable original P04 row snapshot taken before additive fields, or original new proposal; exact SHA-256 of PostgreSQL JSONB UTF-8 text. No migration or repeat seed promotes P04 proposals. |
| AppointmentRevision / appointment_revisions | Immutable snapshot/hash for each current record version, preserving confirmation/contact/move/cancellation history. No hard deletion. |
| SchedulingPolicy / scheduling_policies | Immutable Published version/effective dates/source-as-at/synthetic evidence. Initial exact customer agreement required, changed date contact may remain owned, every crew member holds every required synthetic skill, maximum core duration 480 minutes in seed. No unrestricted policy editor. |
| Resource / resources + resource_sites | Fictional Technician UUID with workspace/company/site eligibility, optional user FK, version, base timezone, active/effective/source evidence and Published bundle. A user role is not competency or booking authority. |
| WorkingCalendar / working_calendars + calendar_intervals/calendar_exceptions | Published version/timezone/effective source; weekday local minute intervals with exclusion, explicit closed UTC exceptions. Synthetic weekday 08:00–17:00 Brisbane; 30 September closure is an invented fixture, not an asserted public holiday. No overnight/overtime/real roster rules invented. |
| ResourceEvidence + SkillEvidence / resource_evidence + skill_evidence | Exact synthetic source reference/version/text/hash, reviewer/time and source-as-at; typed resource/evidence FKs, skill code/status/active/valid-from/to. Verified evidence must cover visit end. SYN-VISUAL means fictional external visual inspection only, not a trade approval. |
| AvailabilityBlock / availability_blocks | Typed Leave/Unavailable/OtherWork, UTC interval, version/source-as-at/evidence and active flag. Published source roots and child insertion/update/deletion cannot mutate existing booking eligibility; no source-edit endpoint exists in P05. |
| Assignment / assignments | Immutable exact appointment/context/resource, assignment version, role, explicit nonnegative travel before/after with reason and resource/calendar versions. Active may change true → false once. Complete crew replacement is atomic. |
| ResourceReservation / resource_reservations | Typed assignment/resource and full buffered UTC interval; half-open GiST exclusion across active workspace/resource bookings. Deferred consistency requires the entire active confirmed crew, exactly one Lead, exact intervals/version and no orphan/partial reservations. Release preserves rows. |
| ScheduleChangeRequest / schedule_change_requests + schedule_request_crew | Typed business identity and appointment/context, Manual/ProjectReference/TechnicianRequest, source reference/version, expected appointment/schedule version, requested interval/reason and exact immutable crew snapshot/children. Pending changes no booking; decision is Accepted/Rejected/Cancelled with actor/time/reason and version. Deferred equality seals child intent. |
| ContactOutcome / contact_outcomes | Typed immutable appointment/Person recipient/context/schedule version and exact dates, manual/simulated channel, Attempted/Confirmed/NoResponse/Failed, occurrence/notes/actor/time, optional owned Activity FK. An attempt never creates date agreement, delivery or pack acknowledgement. Cancelled contact does not reopen an appointment. |
| ScheduleFollowUp / schedule_follow_ups | Typed immutable appointment-to-existing-Activity junction, schedule version and CustomerConfirmation/ChangedSchedule/Cancellation/ContactUnsuccessful consequence. Activity is independently permission checked and remains owned with a due date or explicit due-needed. Existing ActivityLink uses Site; WorkOrder/Appointment/Report/Handoff link variants are not enabled. |

Capabilities are schedule.read/manage/request/contact plus existing record scope and independently checked related targets. The seed derives coordinator grants only from still-active P04 grants and introduces a fictional assigned technician with request-only authority. Systems and the earlier unassigned-technician profile gain no booking access. The two-person SQL confirmed P05 fixture is explicit; all eight resources, two calendars, ten new visits, reviewed evidence, refusal variants and receipt 5 are synthetic and non-destructive. Scope, authorisation evidence, coverage and all P01–P04 receipts/hashes remain unchanged. Scheduling creates no charging, warranty or financial disposition.

## P04 physical implementation amendment

[ADR-0009](../decisions/ADR-0009-p04-work-scope-readiness.md), [migration 0004](../../db/migrations/0004-work-scope.sql) and the [handover](../delivery/p04-handover.md) define the additive P04 subset. Logical later-state rows below remain design, not implemented functionality.

| Record / physical mapping | Current typed boundary |
|---|---|
| WorkOrder / work_orders | UUID/permanent WO reference, company/site/customer/service-owner, version, PlatformSynthetic only, Draft/Authorised only. Current scope pointer separate from authorised scope pointer; project/opportunity reference text optional. Pending-account plan on scope substitutes for neither verified ERP mapping nor financial release. |
| WorkOrderTicket / work_order_tickets | Unique immutable many-to-many pair with disposition and real workspace/company/site FKs. At least one link; creation does not alter Ticket. Authorisation requires linked tickets Triaged. |
| ScopeRevision / scope_revisions | Revision/content version, predecessor/change reason, summary/exclusions/limits/account plan, exact coverage/document/policy FKs. Server approval actor/time and immutable JSONB evidence/hash; SHA-256 of stored JSONB text in UTF-8. Approved scope/children cannot change. Current successor needs fresh review; prior remains exact. |
| ScopeItem / scope_items | Exact revision/sequence, Inspection/Identification/Intervention, task/outcome/completion list/competency codes/access/shutdown conditions. |
| ScopeAsset / scope_assets | Unique item/asset pair, real same-site/company asset FK and exact optional configuration FK. No serial uniqueness assumption. ReviewRequired cannot be verified authority. |
| IdentificationPlan / identification_plans | Bound to exact scope-item/asset, method/limits, server reviewer/time. Unresolved/disputed asset permits Identification only, with overall diagnostic limit. No asset identity mutation. |
| CoverageAssessment / coverage_assessments | Immutable canonical five states, source/reference/version/dates, assessment/reason/reviewer/time and FinanceReview/ContractReference route. No financial disposition. ApprovedNonBillable is not enabled. |
| DocumentReference / document_references | Minimum immutable Synthetic/text/plain manual evidence, exact content and source/version/hash, local key, owner, Available and RestrictedService. PostgreSQL stores the small text content durably. No general document store/SharePoint/issue/distribution. |
| PolicyVersion / policy_versions + policy_criteria | Immutable predefined Published synthetic policy/version and typed criterion/applicability/stage/exception rows. No arbitrary policy editor/publish command. |
| ReadinessAssessment / readiness_assessments | Exact scope revision/content version on every assessment. **Authorisation** adds a stage with null appointment; Booking/Dispatch/Completion needs actual Appointment FK. Append-only criterion assessment versions; latest evaluated by content version/expiry. Typed evidence FK, reviewer/time/reason/source-as-at/valid-until. Policy-derived exception flag cannot be submitted or fabricated. |
| Appointment / appointments | UUID/permanent APT reference, same-order/site context, positive UTC interval/paired containing window, site timezone, scope/content/policy references. Proposed only; commitment Unknown/Proposed, preparation Unknown/Preparing/Blocked, dispatch hold true. No crew/resource/reservation/confirmation/move/cancel/actual attendance. |

P03 known-site intake is retained: the wider identification-scope triage alternative does not create a site-less WorkOrder. New capabilities are service.work_order.read/edit, service.scope.authorise and service.readiness.assess, each combined with scope. ActivityLink remains P03 targets only. All applied P01–P03 migration/seed bytes, accepted hashes/receipts/audit/history, source identities and all 78 parents are preserved.

## 1. Conventions

**P03 physical amendment:** [ADR-0008](../decisions/ADR-0008-p03-customer-intake.md), the [API amendment](service-api.md#p03-implementation-amendment--current-bounded-contract) and [handover](../delivery/p03-handover.md) define the current subset. Migration 0003 adds rich DAT-04 fields to the existing Ticket, plus Activity and ActivityLink. It never edits applied migrations or original ticket IDs, references, versions, received times, provenance, accepted operation hashes, receipts or immutable history. Old records receive additive mapping markers `intake_schema_version=1` and `received_time_basis=LegacyUnverified`. P03 create/save commands explicitly use physical mapping version 2 and UserReported time provenance. API command schema version remains 1. Original unknown requester/site/impact/source facts remain unknown. Symptoms map to the retained `symptom` column and owner to `triage_owner_id`; the logical names below are not alternative request keys.

Ticket gains typed optional requester/site/asset relationships, impact, rationale, next action, open questions, clarification resolution and a typed clarification Activity FK. Requester uses the same shared Person and explicit company context, asset must belong to the ticket site, and company remains fixed. An unknown requester requires an explicit description; absent site requires `site_identification_needed=true`. New intake needs an active scoped owner and next action but may retain unknown impact/rationale. Known requester/site and resolved owned clarification are stricter P03 triage gates; approved identification scope awaits P04. Received time is user business data, never server audit time or invented verified evidence.

Activity is a UUID business identity in the existing permanent registry, with company, optional site, version, canonical category/state, owner, summary, due instant or explicit due-needed flag, outcome/cancellation reason and content class. No Activity readable-reference pattern is introduced. Create starts Open; active update/reassignment is allowed; only the owner with current authority starts/completes/cancels. Completed requires outcome and Cancelled requires cancellation reason; terminal content remains immutable. Links, category, company/site and content class are fixed for P03. FinanceQuery requires RestrictedFinance. ActivityLink is a typed immutable composite relationship with real workspace/company foreign keys to implemented Organisation, Site, Asset or Ticket records, unique per target and with a deferred nonempty-link check. Site/asset/ticket links respect the activity site when set. Future WorkOrder/Appointment/Report/Handoff UUIDs are rejected.

Every activity projection also requires access to all linked records; ownership alone grants nothing. An inaccessible link suppresses the whole activity, including title/outcome, from searches, lists and direct access. A company-scoped clarification can precede site identification; once a site-scoped activity links a ticket, cross-site correction is deferred rather than rewriting the original context. RequestInformation commits its ticket questions, next action, owned activity, link, audit, operation receipt and outbox atomically. CustomerContact is not proof of communication delivery; appointment-dependent ContactOutcome remains deferred.

Versioned seed receipt 3 adds fictional complete/incomplete requests and active/unknown-due/overdue/completed/cancelled activity examples. A real OEM follow-up supplements the original P02 historical note without changing that note's former limitation or unsuccessful-fix attribution. Repeated seed does not overwrite deliberate edits, revive revoked grants, duplicate activities or reset counters. New history capture accepts bounded multiline narrative and Reported/Suspected confidence only; source author/time/context remain distinct from server capture. Mapping Proposed/configuration ReviewRequired restrictions, asset move guards and immutable source snapshots remain in force.

**P02 physical amendment:** [ADR-0007](../decisions/ADR-0007-p02-shared-foundation.md) and the [handover](../delivery/p02-handover.md) supersede the P01-only deferrals above for included shared records. Organisation/Person/Relationship/Site/SiteParty/Facility/Asset/ErpAccountMapping/AssetConfiguration/AssetLocationEvent/HistoryRecord now have typed tables. Company visibility contexts, permanent identity/reference registration and scoped grants extend P01. Historical P01 ticket clarification fields remain unchanged until P03. All downstream DAT-04–11 business models remain outside P02 except the existing P01 ticket/platform subset.

Organisation/Site have an explicit company visibility context; this is neither automatic debtor ownership nor billing authority. Person has explicit company contexts supporting many affiliations. Site/asset relationships are company-consistent, with same-site hierarchy constraints. P01's text connection field maps to a UUID connection while preserving the original exact key in `legacy_erp_connection_key` and `external_connection_key`. Provider is Synthetic; entity_type is Customer for included mapping commands. The migration does not invent MYOB endpoints or actual source ownership.

P02 configuration/history/location content is immutable. History additionally preserves captured `site_label`, optional `operator_organisation_id/operator_label`, and optional `asset_identity_status` at the represented historical context. Unknown historical identity status remains null; original source author and occurrence time are distinct from server actor/capture time. P02 location chains must match current asset site, and asset site mutation is blocked pending a reviewed move command. Site operator periods exclude overlaps; Owner/BillingParty permit distinct concurrent parties.

Controlled source document evidence and verification fields/commands are deferred; P02 prohibits Verified account mappings and keeps configurations ReviewRequired. Activity/ActivityLink and booking-stage commands are P03/later. The future verification migration must add typed document evidence, reviewer/time and invariants before lifting the Verified restriction. Open-ended configuration supersession, relationship correction and asset move-impact workflows need explicit successor migrations/commands. These bounded deferrals preserve meaning instead of supplying fictitious verification. Person readable references remain optional and absent; ORG/SITE/AST/TKT are allocated atomically and never reused after acceptance.

R = required on record creation; G = required at the stated command/stage; O = optional; C = required when its stated condition applies. UUID means stable internal identity. `Ref(X)` means an internal foreign key to X in the same workspace, not free text. Text limits below are prototype design constraints, not facts from a legacy system. Display numbers are separate from internal/source keys.

Common to mutable business records: `id` UUID R; `workspace_id` UUID R; `version` positive integer R starting at 1; `created_at` UTC instant R; `created_by` Ref(User) R; `updated_at` UTC instant R; `updated_by` Ref(User) R; `synthetic` boolean R. Common to immutable revision/event records: identity/workspace/created fields, `schema_version` integer R and source revision references; no in-place business-content update. Status changes to issued objects are new events with a derived current-status projection.

Common validation: trim surrounding text whitespace without changing meaningful serial/identifier case; reject control characters in single-line labels; short names 1–200 characters, external IDs 1–200, narrative 1–10,000 when required; URLs are display/reference text and never arbitrary server-fetch instructions. Quantity numeric(18,6), money numeric(19,4) with currency/basis, duration integer seconds ≥0, with derived decimal minutes; exact Finance comparison/rounding is defined separately. Maximum values and file sizes are configurable tested limits, not user-entered policy.

Null means unknown/not supplied; use NotApplicable only when a reviewer records why. No empty UUID, magic zero date or inferred ERP number. Required-stage validations run on the server even if a form was bypassed. Effective-dated relationships use `[valid_from, valid_to)` with null end for current; overlapping active operator/location assignments are blocked unless their role explicitly permits multiple concurrent parties.

### 1.1 Adopted readable-reference contract

[PPO-STD-001](../standards/naming-conventions.md) and ADR-0005 define readable references separately from UUID and external keys. Existing `display_number` fields use `SYN-PPO-<TYPE>-<at-least-six-digit-sequence>` in PP-01: Asset=AST, Ticket=TKT, WorkOrder=WO, Appointment=APT and FinancialHandoff=FH. Add server-allocated `display_number` text to Organisation (ORG) and Site (SITE). Person (PER) display references are optional and are not required for the first prototype.

Pack identity (`pack_id`) and report identity (`report_id`) each own one server-allocated display number, PACK and RPT respectively. Their revision records carry that same immutable display reference; a new content revision does not allocate a new pack/report number. Physical schema placement must enforce the logical identity/revision separation. This is a deliberate dictionary amendment, not an executed migration.

Allocate atomically by workspace/type/synthetic namespace; enforce display-reference uniqueness across workspace business identities, preserve gaps and never reset annually or reuse a number. An offline draft has a stable UUID and displays **Pending reference** until server allocation; the persisted accepted record must have its required number. SYN is mandatory alongside `synthetic=true` in PP-01. Non-synthetic PPO references are reserved and disabled. External company/entity keys retain exact case, punctuation and leading zeros. Foreign keys always use UUIDs; repeated revision display values identify the same aggregate and are not duplicate aggregate allocations.

Wire keys remain snake_case; enum/event values retain their current PascalCase contracts. The [label mapping](../standards/naming-conventions.md#122-canonical-state-values) controls friendly UI text. Future OPP/EST/QUO/PRJ/REQ/VAR/TRN reference types are naming reservations only; their records are not added to PP-01.

## 2. Shared context — DAT-01–DAT-03

| Record | Field / type / requirement | Meaning and constraint |
|---|---|---|
| Organisation | `display_name` text R; `legal_name` text O | Relationship organisation distinct from debtor account |
| Organisation | `relationship_status` enum R; `owner_id` Ref(User) R | Prospect/Active/Inactive; relationship owner is not an ERP credit approver |
| Organisation | `parent_organisation_id` Ref(Organisation) O; `sector` text O | No parent cycle; controlled sector catalogue may be added later |
| Organisation | `notes` text O; `access_class` enum R | Internal notes excluded from customer outputs unless explicitly selected/reviewed |
| Person | `display_name` text R; `email` text O; `phone` text O | Email syntactically validated when present; neither is a unique person identity |
| Person | `active` boolean R; `contact_preference` text O | No automatic marketing consent inferred |
| Relationship | `organisation_id` Ref(Organisation) R; `person_id` Ref(Person) R | Many-to-many affiliations; no duplicated person solely for another company |
| Relationship | `role_label` text R; `valid_from` date R; `valid_to` date O | Historical role retained |
| ErpAccountMapping | `organisation_id` Ref(Organisation) R; `erp_connection_id` UUID R; `erp_company_id` text R; `customer_id` text R | Unique active connection/company/customer mapping; no name-based automatic merge |
| ErpAccountMapping | `mapping_status` enum R; `verified_by` Ref(User) G; `verified_at` instant G; `evidence_ref` Ref(DocumentReference) G | Verification fields required for Verified; fixtures are explicitly simulated verification |
| ErpAccountMapping | `valid_from` instant R; `valid_to` instant O | Company-specific effective mapping; historical handoffs retain original snapshot |
| Site | `display_name` text R; `location_description` text R; `timezone` IANA zone R; `owner_id` Ref(User) R | Location identity independent of debtor/delivery address |
| Site | `address` structured object G booking; `latitude/longitude` decimals O | Address has country/state/suburb/postcode/street; coordinate pair must be valid together |
| Site | `access_instructions` text G booking; `primary_contact_id` Ref(Person) G booking | Controlled exception can record contact/access arrangement; no guessed contact |
| Site | `biosecurity_notes` text O; `controls_reviewed_at` instant C | Review timestamp required when controls are relied on for dispatch |
| SiteParty | `site_id` Ref(Site) R; `organisation_id` Ref(Organisation) R; `role` enum R | Operator/BillingParty/Owner; billing authority also requires account mapping |
| SiteParty | `valid_from/valid_to` instants R/O; `evidence_ref` Ref(DocumentReference) O | Operator change never rewrites old visits |
| Facility | `site_id` Ref(Site) R; `parent_facility_id` Ref(Facility) O; `name` text R | Optional greenhouse/bay/system grouping; no hierarchy cycle |
| Asset | `display_number` text R; `description` text R; `identity_status` enum R; `site_id` Ref(Site) R | Verified/Unresolved/Disputed; display number unique within workspace |
| Asset | `facility_id` Ref(Facility) O; `parent_asset_id` Ref(Asset) O | Same-site hierarchy; no cycle; facility must belong to site. An asset move uses a reviewed change that also reassesses hierarchy/facility links |
| Asset | `manufacturer/model/serial` text O; `external_equipment_ref` text O | No global uniqueness assumption for serial; duplicate candidates require review |
| Asset | `lifecycle_status` enum R; `predecessor_asset_id` Ref(Asset) O | Active/Removed/Decommissioned; replacement does not reset warranty automatically |
| Asset | `installed_on/commissioned_on/warranty_start/warranty_end` dates O | Distinct dates; end before start invalid for the same interval |
| AssetConfiguration | `asset_id` Ref(Asset) R; `revision` integer R; `description` text R; `source_ref` Ref(DocumentReference) O | Immutable configuration snapshot; uniqueness asset/revision |
| AssetConfiguration | `valid_from/valid_to` instants R/O; `reviewer_id` Ref(User) C | Reviewer required for a Verified configuration relied on by a pack |
| AssetLocationEvent | `asset_id` Ref(Asset) R; `from_site_id` Ref(Site) O; `to_site_id` Ref(Site) R; `effective_at` instant R | Records move with reason/actor and any future appointment review tasks |
| HistoryRecord | `site_id` Ref(Site) R; `asset_id` Ref(Asset) O; `occurred_at` instant R; `author_label` text R | Preserve historical attribution even when source author is not a current User |
| HistoryRecord | `kind` enum R; `summary` text R; `confidence` enum R; `source_ref` Ref(DocumentReference) O | PriorWork/KnownIssue/AttemptedFix/TechnicalAdvice; Reported/Suspected/Verified |
| HistoryRecord | `source_system/source_id` text C imported; `verification_status` enum R; `access_class` enum R | Imported/Verified/ReviewRequired; do not promote unverified imported notes |
| Activity | `kind` enum R; `owner_id` Ref(User) R; `summary` text R; `status` enum R | TechnicalFollowUp/CustomerContact/MaterialAction/FinanceQuery/RelationshipReview; Open/InProgress/Completed/Cancelled |
| Activity | `due_at` instant O; `due_needed` boolean R; `outcome` text G closure | Unknown due date is visible; Completed requires outcome; Cancelled requires reason |
| ActivityLink | `activity_id` Ref(Activity) R; `object_type` enum R; `object_id` UUID R | Allowlisted Organisation/Site/Asset/Ticket/WorkOrder/Appointment/Report/Handoff; same-workspace referential validation |

## 3. Intake and authorised work — DAT-04/DAT-05

| Record | Field / type / requirement | Meaning and constraint |
|---|---|---|
| Ticket | `display_number` text R; `received_at` instant R; `channel` enum R | Phone/Email/Manual/PlannedMaintenance/Other; no mailbox integration implied |
| Ticket | `requester_id` Ref(Person) O; `requester_description` text C if person unknown | Either known person or owned clarification marker |
| Ticket | `site_id` Ref(Site) O; `site_identification_needed` boolean R | Site required before triage completion or an explicit identification scope |
| Ticket | `summary/symptom` text R; `impact` text G triage; `priority` enum R; `priority_reason` text G triage | Low/Normal/High/Urgent; no SLA/dispatch authority implied |
| Ticket | `triage_owner_id` Ref(User) R; `status` TicketState R; `resolution` text G resolve/close | Open questions/follow-up separately linked |
| WorkOrder | `display_number` text R; `site_id` Ref(Site) R; `service_owner_id` Ref(User) R; `status` WorkOrderState R | One operational authority model per order |
| WorkOrder | `authority_mode` enum R; `authoritative_external_key` structured object C ERP-owned | PlatformSynthetic/PlatformOperational/ErpOwned; only PlatformSynthetic enabled in PP-01 |
| WorkOrder | `billing_mapping_id` Ref(ErpAccountMapping) G financial release; `scope_revision_id` Ref(ScopeRevision) G authorise | Work authorisation may use explicitly reviewed pending-account plan; financial release may not |
| WorkOrder | `project_reference/opportunity_reference` text O; `close_reason` text G close/cancel | References only, no invented synchronisation |
| WorkOrderTicket | `work_order_id` Ref(WorkOrder) R; `ticket_id` Ref(Ticket) R | Unique pair; many-to-many with explicit issue disposition |
| ScopeRevision | `work_order_id` Ref(WorkOrder) R; `revision` integer R; `summary/exclusions` text R | Draft editable until authorisation; approved snapshot immutable |
| ScopeRevision | `coverage_assessment_id` Ref(CoverageAssessment) G authorise; `approved_by/approved_at` User/instant G | Record authority/delegation policy and any permitted diagnostic limit |
| ScopeRevision | `authority_evidence_ref` Ref(DocumentReference) G authorise; `change_reason` text C successor | No numeric spending limit invented; optional exact amount/currency only if explicitly supplied |
| ScopeItem | `scope_revision_id` Ref(ScopeRevision) R; `sequence` integer R; `task_description/expected_outcome` text R | Unique sequence per revision |
| ScopeItem | `required_skill_codes` text list O; `completion_requirements` structured list R; `shutdown_condition` text O | Versioned policy codes; condition review needed if applicable |
| ScopeAsset | `scope_item_id` Ref(ScopeItem) R; `asset_id` Ref(Asset) R; `configuration_id` Ref(AssetConfiguration) O | Unique item/asset pair; identification plan may refer to Unresolved asset |
| IdentificationPlan | `asset_id` Ref(Asset) R; `method/limits` text R; `approved_by/approved_at` User/instant G | Required before authorising work that relies on unresolved identity |
| CoverageAssessment | `status` CoverageState R; `agreement_reference` text O; `source_version` text O; `effective_from/to` dates O | Unknown/Covered/NotCovered/Disputed/NotApplicable |
| CoverageAssessment | `assessment/reason` text R; `assessed_by/assessed_at` User/instant G authorise; `charging_route` enum G | FinanceReview/ContractReference/ApprovedNonBillable; financial approval remains separate |

## 4. Resources, readiness and appointments — DAT-06

| Record | Field / type / requirement | Meaning and constraint |
|---|---|---|
| Resource | `user_id` Ref(User) O; `name` text R; `resource_type` enum R; `active` boolean R | Technician only in first scope; later equipment resources require new policy |
| Resource | `calendar_id` Ref(WorkingCalendar) R; `base_timezone` IANA R | Calendars are explicit, not inferred from site state |
| WorkingCalendar | `name/timezone` text/IANA R; `weekly_intervals` structured R; `exceptions` structured list O | Positive intervals, holidays/leave separately identifiable; published version required for confirmation |
| SkillEvidence | `resource_id` Ref(Resource) R; `skill_code` text R; `valid_from/to` dates R/O; `status` enum R | Verified/Unverified/Expired; expiry evaluated through visit end |
| SkillEvidence | `evidence_ref` Ref(DocumentReference) C Verified; `reviewer_id` Ref(User) C Verified | Synthetic evidence marked; no actual trade licence validation claimed |
| AvailabilityBlock | `resource_id` Ref(Resource) R; `start_at/end_at` instants R; `kind` enum R | Leave/Unavailable/OtherWork; overlaps block reservation |
| Appointment | `display_number` text R; `work_order_id` Ref(WorkOrder) R; `status` AppointmentState R | One site from work order in PP-01 |
| Appointment | `start_at/end_at` instants R; `site_timezone` IANA R; `requested_window_start/end` instants O | Valid positive interval; paired requested window fields |
| Appointment | `customer_commitment` enum R; `preparation_status` enum R; `dispatch_hold` boolean R | Commitment Unknown/Proposed/Confirmed/Changed; preparation Unknown/Preparing/Ready/Blocked |
| Appointment | `actual_start_at/end_at` instants C started/finished; `completion_outcome` enum G submit | Complete/Partial/UnableToProceed; attendance status remains separate |
| Appointment | `policy_version_id` Ref(PolicyVersion) G confirm; `scope_revision_id` Ref(ScopeRevision) G confirm | Frozen decision inputs; later revisions trigger review |
| Assignment | `appointment_id` Ref(Appointment) R; `resource_id` Ref(Resource) R; `crew_role` enum R; `assignment_version` integer R | Lead/Technician/Specialist; unique active appointment/resource |
| Assignment | `travel_before_minutes/travel_after_minutes` integers R; `active` boolean R | Nonnegative, explicitly supplied/verified; no hidden travel default |
| ResourceReservation | `assignment_id` Ref(Assignment) R; `resource_id` Ref(Resource) R; `start_at/end_at` instants R; `active` boolean R | Includes travel buffers; active ranges cannot overlap active booking/availability blocks |
| ScheduleChangeRequest | `appointment_id` Ref(Appointment) R; `expected_version` integer R; `source_type/source_reference` text R | Manual/ProjectReference/TechnicianRequest; request is not confirmed change |
| ScheduleChangeRequest | `proposed_start/end` instants O; `proposed_resource_ids` UUID list O; `reason` text R; `status` enum R | Pending/Accepted/Rejected/Cancelled; record decision actor/time/reason |
| ReadinessAssessment | `appointment_id` Ref(Appointment) R; `criterion_code` text R; `policy_version_id` Ref(PolicyVersion) R | Unique current criterion/appointment/policy assessment |
| ReadinessAssessment | `outcome` ReadinessState R; `blocking_stage` enum R; `exception_allowed` boolean R | Booking/Dispatch/Completion; exception permission comes from policy, not form input |
| ReadinessAssessment | `evidence_refs` UUID list C Pass/exception; `assessed_by/at` User/instant C decided; `valid_until` instant O; `source_as_at` instant C source-derived; `reason` text C exception/N/A | Unknown/expired assessments never pass a mandatory dispatch gate; source freshness follows policy or fresh owner verification |
| ContactOutcome | `appointment_id` Ref(Appointment) R; `activity_id` Ref(Activity) O; `recipient_id` Ref(Person/User) R; `channel` enum R | ManualPhone/ManualEmail/InPerson/Simulated; no sending implied |
| ContactOutcome | `outcome` enum R; `occurred_at` instant R; `notes` text O | Attempted/Confirmed/NoResponse/Failed; does not substitute for pack acknowledgement |

## 5. Packs, field evidence and reports — DAT-07–DAT-09

| Record | Field / type / requirement | Meaning and constraint |
|---|---|---|
| PackRevision | `pack_id` UUID R; `appointment_id` Ref(Appointment) R; `revision` integer R; `status` PackState R | Unique pack/revision; one applicable issued revision per appointment |
| PackRevision | `scope_revision_id` Ref(ScopeRevision) R; `appointment_version` integer R; `sections` validated object R | Nine section keys from document contract; no unrestricted document blob |
| PackRevision | `manifest_id` Ref(IssueManifest) G check; `checked_by/at` User/instant G check; `change_summary` text C successor | Checked inputs frozen; edit returns to Draft |
| PackIssue | `pack_revision_id` Ref(PackRevision) R; `issue_manifest_id` Ref(IssueManifest) R; `issued_by/at` User/instant R | Immutable event; rendered content durable before insert |
| PackRecipient | `pack_issue_id` Ref(PackIssue) R; `assignment_id` Ref(Assignment) R; `user_id` Ref(User) R; `required` boolean R | Unique issue/assignment/user; lead acknowledgement is not crew acknowledgement |
| PackAcknowledgement | `recipient_id` Ref(PackRecipient) R; `presented_hash` text R; `acknowledged_at` instant R; `operation_id` UUID R | Exact content hash must match; server actor must be recipient |
| FieldEntry | `entry_type` enum R; `appointment_id` Ref(Appointment) R; `actor_id` Ref(User) R; `operation_id` UUID R | Time/Material/Observation/Reading/Checklist/Photo; actor derived from session or validated capability |
| FieldEntry | `captured_at` instant R; `received_at` instant G sync; `assignment_id/version` Ref/integer R; `pack_issue_id` Ref(PackIssue) R | Original context preserved; captured clock is not authoritative receipt time |
| FieldEntry | `scope_item_id` Ref(ScopeItem) O; `asset_id` Ref(Asset) O; `review_status` EntryReviewState R | G attribution before review where job type requires it |
| FieldEntry | `payload` typed object R; `supersedes_entry_id` Ref(FieldEntry) O; `correction_reason` text C successor | Approved original cannot be edited in place |
| Time payload | `time_kind` enum R; `start_at/end_at` instants R; `elapsed_seconds` integer derived; `elapsed_minutes` decimal derived; `note` text C Other/exception | Travel/Labour/Break/Waiting/Other; no per-actor overlaps without explicit review |
| Material payload | `movement_kind` enum R; `item_reference` text O; `description` text R; `quantity` decimal R; `uom` text R | Consumed/Returned/Required/Removed; positive quantity, direction by kind |
| Material payload | `lot/serial` text C item policy; `source_reference` text O; `stock_status` enum R | Unknown/VerifiedReference/ReviewRequired; never posts stock by capture |
| Observation payload | `finding` text R; `confidence` enum R; `attempted_fix` text O; `result` text O; `follow_up_required` boolean R | Reported/Suspected/Verified; failed fixes remain history |
| Reading payload | `name` text R; `value` decimal or text R; `unit` text R; `context` text R | Exactly one typed value; no automated pass/fail without approved criteria |
| Checklist payload | `check_id` text R; `result` enum R; `reason` text C non-Pass; `evidence_ids` UUID list C policy | Pass/Fail/NotPerformed/NotApplicable; N/A requires allowed policy |
| Photo payload | `attachment_id` Ref(Attachment) R; `caption` text R | Attachment must be committed/available before submission |
| Attachment | `filename` text R; `media_type` text R; `byte_count` integer R; `sha256` text R; `status` enum R | Pending/Uploaded/Quarantined/Available/Rejected; actual content inspected |
| Attachment | `storage_key` text G upload; `upload_operation_id` UUID R; `access_class` enum R | No raw signed URL as durable key; one final object per operation/hash |
| ServiceReport | `report_id` UUID R; `appointment_id` Ref(Appointment) R; `revision` integer R; `status` ReportState R | Unique report/revision; one appointment per report in PP-01 |
| ServiceReport | `work_performed/findings/exclusions/remaining_work` text R; `source_entry_ids` UUID list R | Empty actual work needs explicit UnableToProceed explanation |
| ServiceReport | `reviewer_id/reviewed_at` User/instant G review; `manifest_id` Ref(IssueManifest) G issue; `change_reason` text C successor | Exact entry revisions and template frozen at issue |
| CustomerResponse | `report_revision_id` Ref(ServiceReport) R; `presented_hash` text R; `presentation_kind` enum R | IssuedReport/DraftEvidence; draft acknowledgement never relabelled as final |
| CustomerResponse | `respondent_name/role` text R; `response` ResponseState R; `remarks` text C reservations/decline/dispute | Unavailable uses reason and attempted-contact context instead of invented respondent |
| CustomerResponse | `presented_at/captured_at` instants R; `captured_by` Ref(User) R; `signature_attachment_id` Ref(Attachment) O | Signature optional, protected; exact revision binding immutable |

## 6. Finance and document records — DAT-10/DAT-11

| Record | Field / type / requirement | Meaning and constraint |
|---|---|---|
| FinancialHandoff | `display_number` text R; `work_order_id` Ref(WorkOrder) R; `revision` integer R; `status` HandoffState R | One company/account/currency basis per handoff; source visits explicit |
| FinancialHandoff | `billing_mapping_id` Ref(ErpAccountMapping) G submit; `mode` enum R; `correlation_id` UUID R | SyntheticManual/SyntheticApi/Manual/VerifiedApi; only synthetic modes enabled |
| FinancialHandoff | `source_report_revision_ids` UUID list G submit; `evidence_manifest_id` Ref(IssueManifest) G submit | Source entries must belong to same order/account context |
| FinancialHandoff | `reviewer_id/reviewed_at` User/instant G approve; `definition_version` text G approve | Finance treatment/rounding/tolerance policy must be explicit |
| FinancialHandoff | `processing_owner_id` Ref(User) C processing; `returned_reason` text C returned; `supersedes_handoff_id` Ref(Handoff) O | Preserve processed original; correction/reversal references separate |
| HandoffLine | `handoff_id` Ref(Handoff) R; `source_entry_id` Ref(FieldEntry) R; `source_revision` integer R | Frozen Approved source; one-to-many allocations allowed |
| HandoffLine | `source_quantity` decimal R; `approved_quantity` decimal R; `allocated_quantity` decimal R; `uom` text R | Nonnegative; allocation conservation enforced transactionally |
| HandoffLine | `billing_disposition` enum R; `billable_quantity` decimal C Billable; `reason` text C other/adjustment | Pending/Billable/NonBillable/WarrantyReview/GoodwillReview; review states cannot release |
| HandoffLine | `rate/amount` decimal O; `currency/tax_basis` text C amount; `rounding_rule_ref` text C calculation | No default rates, tax or rounding inferred |
| TargetResult | `handoff_id` Ref(Handoff) R; `erp_company_id/entity_type/document_id` text R; `target_status` text R | Actual source status preserved; synthetic target clearly labelled |
| TargetResult | `observed_at` instant R; `evidence_ref` Ref(DocumentReference) R; `outcome` enum R | Processed/NotProcessed/Unknown/Reversed; operator assertion requires evidence |
| LineMapping | `handoff_line_id` Ref(HandoffLine) R; `target_result_id` Ref(TargetResult) R; `target_line_id` text R | Explicit source-to-target grain; multiple rows permitted with conservation |
| LineMapping | `mapped_quantity` decimal R; `uom` text R; `conversion_rule_ref` text C conversion; `mapped_amount` decimal O | Compare consistent UOM/currency/basis only |
| Reconciliation | `handoff_id` Ref(Handoff) R; `revision` integer R; `result` enum R; `reviewer_id/at` User/instant R | Matched/NotComparable/Difference/NoPostingRequired; differences cannot be silently zeroed |
| Reconciliation | `comparison_basis` structured R; `differences` structured R; `disposition/evidence_refs` text/list R | Source totals, target totals, tolerances, reasons and exact target references |
| ErpObservation | `connection/company/entity_type/external_id` texts R; `source_as_at/observed_at` instants R | Read-only snapshot with source key, not platform financial master |
| ErpObservation | `import_run_id` UUID R; `completeness` enum R; `definition_id/version` text C metric; `payload` validated R | Complete/Partial/Failed/Unknown; source statuses/signs preserved |
| DocumentReference | `provider` enum R; `tenant_id/site_id/drive_id/item_id` texts C SharePoint; `local_object_key` text C Synthetic | Synthetic/SharePoint; application record scope checked in either mode |
| DocumentReference | `version_id` text O; `title/media_type` text R; `access_class` enum R; `owner_id` Ref(User) R | Version required for controlled source issue; ordinary mutable URL only a convenience |
| DocumentReference | `content_hash` text G controlled issue; `retention_policy_ref` text G operational issue; `status` enum R | Available/Unavailable/Withdrawn/ReviewRequired; no invented retention duration |
| IssueManifest | `object_type/object_id/object_revision` enum/UUID/integer R; `purpose` enum R; `template_id/version` text R | Pack/Report/FinanceEvidence purposes; exact selected scope |
| IssueManifest | `source_snapshot_hash` text R; `source_document_versions` structured list R; `rendered_object_key/hash` text G issue | Includes each source ID/version/hash and access classification |
| IssueManifest | `prepared_by/at` User/instant R; `approved_by/at` User/instant G issue; `supersedes_manifest_id` Ref(Manifest) O | Immutable content identity; source audience filtering occurs before rendering |
| DistributionEvent | `manifest_id` Ref(Manifest) R; `recipient_ref` text R; `channel` enum R; `state` enum R | Manual/Simulated in PP-01; Prepared/Issued/Sent/Delivered/Failed; event facts only |
| DistributionEvent | `occurred_at` instant R; `evidence_reference` text C Sent/Delivered; `operation_id` UUID R | No Delivered event inferred from download link generation |

## 7. Platform records

| Record | Field / type / requirement | Meaning and constraint |
|---|---|---|
| User | `subject_id/issuer` text R; `display_name` text R; `active` boolean R | Unique issuer/subject; no shared staff identity |
| PermissionGrant | `user_id` Ref(User) R; `capability` text R; `scope_type/scope_id` enum/UUID R; `valid_from/to` instants R/O | Explicit workspace/company/site/assignment scope; deny outside it |
| PolicyVersion | `policy_type/key/version` texts/integer R; `status` enum R; `effective_at` instant G publish; `definition` validated object R | Draft/Published/Withdrawn; applicable business publisher and evidence |
| AuditEvent | `actor_id`, `object_type/id`, `operation_id`, `occurred_at`, `outcome`, `reason` typed R | Immutable safe material-change metadata; permitted before/after summary and source version |
| OperationReceipt | `actor_id/operation_id` UUID R; `payload_hash` text R; `result_ref/version` UUID/integer R; `received_at` instant R | Unique actor/operation within workspace; checked with original payload hash |
| OutboxJob | `kind` text R; `operation_id/correlation_id` UUID R; `payload_version` integer R; `payload` validated R | Durable job created with domain transaction |
| OutboxJob | `status` enum R; `attempts` integer R; `lease_until/next_attempt_at` instants O; `error_code` text O | Ready/Running/Done/Retry/Blocked/OutcomeUnknown; lease expiry is not external failure proof |
| LocalOperation | `operation_id` UUID R; `schema_version` integer R; `actor/assignment/pack context` typed R; `payload_hash` text R | Local durable identity; required attachment IDs and original capture time |
| LocalOperation | `sync_state` SyncState R; `server_receipt_id` UUID C Synced; `error_code` text O | LocalSaved/Queued/Uploading/Synced/Failed/Conflict/ReviewRequired |

## 8. Canonical lifecycle choices

| Enum | Exact values | Initial/default rule |
|---|---|---|
| TicketState | New, NeedsInformation, Triaged, Active, Waiting, Resolved, Closed, Cancelled | New |
| WorkOrderState | Draft, Authorised, InProgress, WorkComplete, Closed, Cancelled | Draft |
| AppointmentState | Proposed, Confirmed, InProgress, CompletedPendingReview, Completed, Cancelled | Proposed |
| PackState | Draft, Returned, Checked, Issued, Superseded, Withdrawn | Draft; issued status derived from immutable issue events |
| EntryReviewState | Draft, Submitted, Returned, Approved, Superseded | Draft; original approved row immutable |
| ReportState | Draft, Submitted, Returned, Reviewed, Issued, Superseded, Withdrawn | Draft |
| HandoffState | Draft, ReadyForReview, Returned, Approved, AwaitingERP, OutcomeUnknown, ReconciliationRequired, Reconciled, Cancelled | Draft |
| ReadinessState | Unknown, Pass, Blocked, PermittedException, NotApplicable | Unknown |
| CoverageState | Unknown, Covered, NotCovered, Disputed, NotApplicable | Unknown |
| ResponseState | Accepted, AcceptedWithReservations, Declined, Unavailable, Disputed | No default response; explicit capture |
| SyncState | LocalSaved, Queued, Uploading, Synced, Failed, Conflict, ReviewRequired | Only after actual local save: LocalSaved |
| MappingStatus | Proposed, Verified, Disputed, Inactive | Proposed |
| AccessClass | Internal, RestrictedService, RestrictedFinance, CustomerApproved | Internal; CustomerApproved still requires recipient scope |

Every enum used above without a named reusable type has its exact values in that row. Free-text source `target_status` is deliberately preserved because MYOB status mappings are unverified; it cannot directly drive an approved local lifecycle without a verified adapter map.

## 9. Cross-record invariants

1. All referenced records belong to the workspace; cross-company financial links require explicit mapping and cannot be resolved by display name.
2. Scope assets belong to the authorised site/context or carry a reviewed effective relocation/identification record. Historical snapshots retain original context.
3. Active crew reservations are non-overlapping and include travel. Proposed, Cancelled and historical replaced assignments do not reserve future time.
4. A pack issue's scope/appointment/recipient snapshots must match its checked inputs; a change requires review before start.
5. Approved field entries cannot be changed in place. Successor chains cannot cycle; dependent reports/handoffs identify exact source revisions.
6. One report issue maps to one immutable rendered output. Responses bind the presented hash; draft responses are not final responses.
7. Active Finance allocations summed over a source entry revision cannot exceed its approved quantity. Processed quantities remain consumed until an evidenced correction/reversal policy permits a replacement.
8. Source reads preserve company, currency, type, status, cutoff and completeness. Partial page totals are not account balances.
9. Published policy/template changes retain effective versions and create impact review; they do not rewrite issued evidence.
10. Hard-delete is not a business lifecycle action for issued/reviewed/processed evidence. Approved retention/hold controls govern later disposal.

## 10. Implementation completion criteria

P02 creates migrations and named constraints for these included records; fields may be physically normalised further without changing semantics. The implementation PR must record any deliberate simplification, migration cost and affected test. API schemas are derived from the record/stage contract but expose only role-appropriate fields. No broad administrative JSON editor may bypass the guards.

The [parent traceability register](../prototype/traceability.csv) identifies full versus partial/deferred parent coverage. This dictionary is complete for the described PP-01 record contract; it does not claim all future CRM, estimating, project, supply-chain or ERP fields are known.

## 11. Naming aliases and API projection

In compact table notation Ref(Handoff) means FinancialHandoff, Ref(Manifest) means IssueManifest, and Ref(User)/Ref(Person) unions require an explicit recipient kind plus the corresponding validated foreign key. Physical migrations use unambiguous names. Internal revision IDs are UUID record IDs; human integer revision numbers are attributes, not interchangeable keys. Payload schemas reject fields that are absent from the typed command contract.

P04 control clarification: an explicit shutdown condition keeps mandatory isolation and shutdown authority applicable even on an Inspection task. Non-intervention alone cannot make such a declared control NotApplicable.

## P07 physical implementation amendment

Migration `0007-online-field.sql`, seed receipt 7 and [ADR-0012](../decisions/ADR-0012-p07-online-field-evidence.md) implement bounded DAT-08. Prior migrations, seeds, revoked grants, approved scope evidence, booking snapshots and issued files/manifests/receipts remain unchanged. A fresh setup applies 1–7; P06 upgrade applies only 7. Repeated seed does not overwrite accepted data or restore revoked grants.

| Physical record | Identity, fields and invariant |
|---|---|
| `field_attendances` | Immutable UUID per appointment/actor; original assignment ID/version, schedule version, scope revision/version/hash, issued pack ID/hash, captured and authoritative received instants, reason, authority snapshot/hash. Snapshot includes current complete crew acknowledgements and non-waivable control/competency evidence. One technician never creates another's attendance. |
| `field_entries` | Immutable UUID, root ID, integer lineage version, kind, actor/appointment/attendance, original assignment/scope/issue hashes, task/asset attribution, captured/received instants, review status Draft, authority state Current/ReviewRequired and strict typed payload. Successors retain source ID and required correction reason. Accepted originals are immutable even before review. |
| `field_time_ranges` | Current effective version projection, per-actor half-open `[start,end)` exclusion across appointments. Adjacent exact intervals are valid. Correction replaces the projection atomically while preserving every historical interval. P07 provides no overlap override or review approval. |
| `field_attachments` / events | Stable UUID, original upload operation, owner/appointment/attendance, safe filename, media type, declared byte count/hash, private provider/item/version identity, state/version, dimensions and safe failure code. Immutable state-event history. Available cannot silently change bytes. |
| `field_entry_attachments` | Exact entry-to-attachment references, scoped to the same appointment. Unavailable references remain explicit and cannot satisfy a required completion check. |
| `completion_drafts` / revisions | One draft root per appointment/actor, optimistic version; immutable revisions retain own attendance, scope outcome, actual work, limits, remaining work, personal declarations/reason, per-task outcomes, required attachment state snapshots, blockers, received time and owned follow-up. |
| `completion_entry_refs` | Relational entry ID/version set per immutable draft revision. Own current accepted entries cannot be silently omitted. A later correction makes older draft evidence visibly stale; originals stay exact. |
| `field_follow_ups` | Existing Activity/ActivityLink pattern binds unresolved observation/check, Required/Removed material or remaining completion work to this appointment/entry and the existing service owner. Due date is explicitly unknown and needs resolution. No confirmed return appointment is fabricated. |

| Kind | Strict payload and synthetic policy |
|---|---|
| Time | `time_kind`: Travel/Labour/Break/Waiting/Other; UTC `start_at/end_at`; nullable `note`, required for Waiting/Other. Positive interval up to 48 hours, whole elapsed seconds and display minutes derived by the server. No booking-derived labour, rounding, automatic break deduction or overtime/payroll policy. |
| Material | `movement_kind`: Consumed/Returned/Required/Removed; meaningful `description`, positive bounded decimal-string `quantity`, `uom`: EA/M/M2/M3/L/ML/KG/G/SET/PACK; nullable item/lot/serial/source references. SYN-PART-LOT needs lot, SYN-PART-SERIAL needs serial and quantity 1. `stock_status` Unknown/ReviewRequired only; VerifiedReference requires a later supported identification process. No stock posting or approved/billable quantity. |
| Observation | `finding`, `confidence`: Reported/Suspected/Verified, nullable `attempted_fix/result`, explicit boolean `follow_up_required`. Attempted action requires its result, including failure. Finding confidence never verifies an uncertain asset identity or certifies compliance. |
| Reading | `name`, exactly one of decimal-string `numeric_value` or `text_value`, controlled `unit`, meaningful `context`. No inferred tolerance/pass/fail. Allowed units are exported by `src/field/validation.ts`; unknown units are refused rather than silently converted. |
| Checklist | Fixed synthetic `check_id`, Pass/Fail/NotPerformed/NotApplicable, reason for every non-Pass, scoped `evidence_ids`. SYN-SITE-CONTROLS and SYN-TASK-RESULT are mandatory and disallow N/A. Site-controls Pass requires available photo evidence. SYN-OPTIONAL-PHOTO allows reasoned N/A and requires photo for Pass. This is an explicit prototype policy, not operational safety certification. |
| Photo | Durable `attachment_id` plus meaningful `caption`; references retain original bytes and source context. Required unavailable photos block Complete preparation and must block later submission when implemented. |

Numeric values remain canonical exact decimal strings (up to nine integer and six fraction digits); readings permit a sign, quantities are positive. Physical payload names clarify the design dictionary's one `value` choice without adding ambiguous dual values. Attribution is required for materials, findings, readings, checks, photos and Labour time. The API rejects forged actor/scope/approval fields. Captured instants remain distinct from receipt and schedule; client future instants beyond the bounded five-minute allowance are refused, never silently rewritten.

Attachment policy: exact PNG signature, chunk length/order/CRC, bounded inflate, exact scanline size/filter values; non-interlaced 8-bit RGB/RGBA only, maximum 4 MiB, 4096 pixels per side and 12 million pixels. Animated or embedded text/EXIF/unknown chunks are rejected. The private local P06 adapter writes immutable bytes outside Git with hash/byte-count/retrieval verification. Metadata alone stays Pending. Uploaded, Quarantined, Available and Rejected have distinct recoverable ownership and evidence; no deletion/garbage collector exists.

Completion outcomes are Complete/Partial/UnableToProceed; personal time/material declarations are AllRecorded/None/Incomplete with explanation. Exact per-task outcomes must cover authorised tasks. Complete requires all task outcomes complete, valid declarations, required available attachments and mandatory checks without unresolved findings/control failures. Partial/UnableToProceed can preserve explicit blockers and owned remaining work. Saving any draft keeps attendance, work order, ticket, reviewer acceptance, report and Finance lifecycles separate. Report submission/review and approved entry sets remain DAT-09/P09, Finance DAT-10/P10; no future feature is represented by fake records.

## P08 physical implementation amendment

[ADR-0013](../decisions/ADR-0013-p08-offline-recovery.md), [migration 0008](../../db/migrations/0008-offline-recovery.sql) and the [API-C15 contract](service-api.md#p08-implementation-amendment) extend DAT-08 and online/offline TR-10. Existing P01–P07 migration/seed bytes, original receipts, issued evidence and all 78 parent identities remain. No DAT-09 report/review or DAT-10 Finance tables/fixtures are invented.

| PostgreSQL table / fact | Exact columns and invariant |
|---|---|
| `sync_acceptances` | `workspace_id,actor_id,operation_id,appointment_id,envelope,payload_hash,receipt_id,received_at`. Unique original actor/operation and exact linked normal receipt; composite FK binds workspace/actor/operation/receipt. Immutable original JSON envelope excludes only its separately stored hash. Append-only update/delete guard; server validates canonical hash and dependencies under the same domain transaction. |
| `offline_recovery_grants` | `id,workspace_id,actor_id,company_id,site_id,appointment_id,owner_id,token_hash,authority,issued_at,expires_at`. Immutable exact original actor/job/scope/issue authority and recorded service owner. Random 32-byte token stored only as SHA-256 server-side; seven-day synthetic validity. It grants only bounded evidence preservation. |
| `offline_recovery_cases` | `id,workspace_id,actor_id,operation_id,grant_id,activity_id,receipt_id,envelope,payload_hash,byte_hash,byte_count,storage_item_id,received_at`. Unique original actor/operation; original envelope exact grant actor/job/authority checked by trigger. Evidence commands only. All byte fields null together or exact bounded PNG metadata together. Immutable case and original storage item. Activity and separate receipt record owned preservation, never normal field acceptance. |
| `offline_recovery_dispositions` | `id,workspace_id,case_id,actor_id,disposition,reason,received_at`. Append-only RetainedForReview/ClarificationRequired with exact actor/server time. Normal scoped recorded service owner required; originals/case/bytes remain unchanged. |
| Existing `field_follow_ups` | Accessible factual capture with ReviewRequired authority now also creates owned service follow-up once in the original capture transaction. Earlier follow-up reasons and all originals remain. No review override, approved quantity or closure. |

IndexedDB name is `PPO-offline-field`; current version **2**, compatible original payload schema **1**. Browser records use explicit `workspace_id:actor_id` ownership. Context/operation/blob access checks the current durable unlocked owner and its 24-hour verified identity horizon. A local origin's developer tools or user-cleared browser disk is outside the prototype's access-security claim.

| IndexedDB store | Exact retained purpose / key |
|---|---|
| `meta` | Key `active`: owner `{workspace_id,actor_id,display_name}` or null, verified time, locked flag and generation. Sign-out/identity change commits lock before server session mutation. |
| `contexts` | Key owner/job: owner, last verified/expiry, exact authority/recovery grant, minimum current permitted own service Job DTO and exact issued HTML. Maximum two explicitly downloaded jobs per owner; 24-hour synthetic expiry. A locked cache does not expose normal job/title/pack views. Explicit context removal preserves original operations and bytes. |
| `operations` | Key owner/original operation: immutable wire envelope, owner and local creation time. Hash computed before transaction; changed reuse refused. Original payload schema/dependency/lineage is never silently rewritten during replay/upgrade. |
| `evidence` | Same original key: owner, operation ID and original factual payload, atomically committed with original and required local bytes. No claim of normal acceptance. |
| `bytes` | Same original upload key: owner, operation ID, exact Blob, SHA-256 and byte count. Hash/size checked before transaction; metadata-only or substituted old bytes is not a durable image. |
| `status` | Same key: owner, LocalSaved/Sending/Pending/ServerSaved/Conflict/ReviewRequired/Failed, safe message/code, attempts, next-attempt hint, exact optional normal receipt and separate optional restricted recovery metadata. Receipt commit is separate from original local save. |
| `leases` | Owner key: sender UUID, expiry and owner generation. Thirty-second exclusive sending claim, recoverable after expiry; no permanent lock. Existing server transaction/receipt remains final duplicate-effect protection. |

Version 1 uses the same first six stores; version 2 adds leases in a native upgrade transaction. Unsupported newer browser database versions block the older application explicitly; original stores are retained. Unsupported payload versions stay ReviewRequired and exportable, without invented conversion. Quota/unavailable/abort/blocked/version-change errors do not silently fall back to memory. A completed strict transaction is the browser-local durability boundary; real hardware/device guarantees remain unverified. Partial-eviction markers can warn but cannot recover erased data or prove full absence of loss.

The public shell uses a SHA-256 build-derived service-worker cache name and an explicit allowlist under `/offline/`: HTML/CSS and eight generated pure TypeScript modules. No API/private business response is cached by the worker; exact permitted pack HTML is explicitly stored under owner-bound context. Updates wait for open field clients; they do not delete IndexedDB. No automatic sending/background sync, browser encryption, remote wipe or device-management claim is made.


Normal acceptance and restricted recovery are mutually exclusive for one original under the same operation/workspace transaction locks. Once preserved into restricted recovery, replay returns RecoveryDispositionRequired without a normal receipt; changed reuse conflicts. A competing normal acceptance either wins once and blocks recovery as AlreadyAccepted, or recovery wins once and blocks normal acceptance. Neither path creates a second capture or follow-up. Direct online P07 commands also refuse the held original after current authorisation; the schema-7 upgrade path remains compatible. The browser does not offer recovery on an actively Sending row.

## BP-03 I1 physical opportunity extension

[Migration 0010](../../db/migrations/0010-crm-opportunities.sql) adds `opportunities`, `crm_pipeline_definitions`, `crm_stage_definitions` and `opportunity_events`; [ADR-0015](../decisions/ADR-0015-crm-i1-owned-opportunities.md) records the intentionally small model. Opportunity, pipeline definition and event UUIDs use the shared permanent identity registry. Only Opportunity gets an atomic `SYN-PPO-OPP` reference. UUID, reference, title, aggregate version, stage and close outcome are independent.

One immutable fictional `SyntheticEnquiryI1` definition, version 1, has Enquiry ordinal 1 and Qualified ordinal 2. The pipeline UUID is `c1000000-0000-4000-8000-000000000001`; its label is “Fictional sales enquiry — I1”. No probability, amount, currency, forecast or operational pipeline mapping is stored. Stage-entry time changes only with qualification; normal action planning does not rewrite it.

Opportunity fixes workspace/company, original organisation/site/contact IDs and unknown reasons, owner, definition, title and manually recorded source context. Qualification records current need/note and an optional owned identification Activity; original and subsequent event snapshots remain append-only. Real company/workspace FKs protect organisation, site, person-company context, owner, stage, event and action identities. A deferred guard requires the designated Activity to link that exact opportunity and requires a matching current-version event. A new designation must be active. Completion/cancellation later leaves that designation historical and derives Needed until a successor is deliberately selected.

`activity_links.opportunity_id` is a generated typed column for `object_type=Opportunity`, with a real `(workspace_id, company_id, opportunity_id)` FK. Existing Organisation/Site/Asset/Ticket links retain their meaning. Opportunity-linked Activities are Internal and retain the opportunity's exact site, including explicit unknown site. Every target independently controls Activity visibility. No generic target cast, label-based linkage or ownership-derived visibility is introduced.

Seed receipt 10 creates configuration and explicit CRM read/create/edit grants for eligible existing synthetic profiles only once. It creates no opportunity or action. Repeat seed preserves edits, revoked grants, counters and history. Systems/unassigned identities receive no default CRM authority. Original migration/seed/issued-source bytes and accepted operation hashes remain unchanged. Actual fresh/upgrade/restart results and current P09 migration ordering belong in the [I1 handover](../delivery/crm-i1-handover.md).
