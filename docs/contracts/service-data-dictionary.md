# PP-01 — Service data and choice dictionary

**Edition:** v01 · **Status:** Proposed logical contract for implementation. This is not an exported CREMS/MYOB schema or an executed database migration.

[BP-02](../architecture/BP-02-platform-architecture.md) · [BP-07](../blueprints/BP-07-service-operations.md) · [Finance](finance-handoff.md) · [Documents](documents-and-issues.md).

## 1. Conventions

R = required on record creation; G = required at the stated command/stage; O = optional; C = required when its stated condition applies. UUID means stable internal identity. `Ref(X)` means an internal foreign key to X in the same workspace, not free text. Text limits below are prototype design constraints, not facts from a legacy system. Display numbers are separate from internal/source keys.

Common to mutable business records: `id` UUID R; `workspace_id` UUID R; `version` positive integer R starting at 1; `created_at` UTC instant R; `created_by` Ref(User) R; `updated_at` UTC instant R; `updated_by` Ref(User) R; `synthetic` boolean R. Common to immutable revision/event records: identity/workspace/created fields, `schema_version` integer R and source revision references; no in-place business-content update. Status changes to issued objects are new events with a derived current-status projection.

Common validation: trim surrounding text whitespace without changing meaningful serial/identifier case; reject control characters in single-line labels; short names 1–200 characters, external IDs 1–200, narrative 1–10,000 when required; URLs are display/reference text and never arbitrary server-fetch instructions. Quantity numeric(18,6), money numeric(19,4) with currency/basis, duration integer seconds ≥0, with derived decimal minutes; exact Finance comparison/rounding is defined separately. Maximum values and file sizes are configurable tested limits, not user-entered policy.

Null means unknown/not supplied; use NotApplicable only when a reviewer records why. No empty UUID, magic zero date or inferred ERP number. Required-stage validations run on the server even if a form was bypassed. Effective-dated relationships use `[valid_from, valid_to)` with null end for current; overlapping active operator/location assignments are blocked unless their role explicitly permits multiple concurrent parties.

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
