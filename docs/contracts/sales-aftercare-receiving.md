---
document_id: PPO-CR05-RECEIVING
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Candidate receiving contract for CR-05; no application route, schema, adapter or integration exists
source_commit: 0769a16dd842e9dc1c349a853036ab71949e7807
---

# CR-05 Sales Aftercare — application receiving requirements

This contract states what a receiving Powerplants One application must provide for the [CR-05 Sales Aftercare & Renewal Worklist design r01](../reference/ui/sales-aftercare/PPO-Sales-Aftercare-and-Renewal-Worklist-r01.html). It is kept separate from the [companion design report](../reference/ui/sales-aftercare/PPO-Sales-Aftercare-and-Renewal-Worklist-Report-r01.md) so the design can be reviewed on its own and the build requirements can be scheduled on their own.

**Nothing here is implemented.** There is no route, schema, service, adapter, permission rule or migration for CR-05 on `main`. Field names below are proposed and follow the declared PPO conventions: `snake_case` fields, `PascalCase` types and events, and user-facing labels separate from identifiers. Names are not primary keys.

## 1. Entities

| Proposed type | Identity | Purpose |
|---|---|---|
| `AftercareRecord` | UUID; readable reference `SYN-PPO-ACR-nnnnnn`; `record_version` integer | One follow-up obligation arising from one source event, for one customer scope. |
| `AftercareOutcomeFact` | Child of `AftercareRecord`, keyed by `outcome_key` | One of the eleven distinct outcomes, each with `value`, `source_reference` and `as_at`. Never derived from another outcome. |
| `AftercareCommitment` | UUID | An outstanding support or customer commitment carried into the record, with a `disposition`. |
| `AftercareReview` | UUID, one current per record | Date, method, participants, feedback, benefits, concerns, questions, agreed steps, `review_state`, corrections. |
| `AftercareFeedbackItem` | UUID | One statement with a mandatory `feedback_basis` of `Quoted`, `Paraphrased` or `InternalInterpretation`. |
| `AftercareConcern` | UUID | A customer-reported technical concern, either linked to an existing case or carrying a `ServiceReferral`. |
| `ServiceReferral` | UUID; readable `SYN-PPO-REF-nnnnnn` | Prepared handover to Service Cases intake, with its own state and revision count. |
| `TrainingNeed` | UUID; readable `SYN-PPO-TRN-nnnnnn` | A training or documentation need with equipment and material applicability. |
| `CommercialSignal` | UUID; readable `SYN-PPO-CSG-nnnnnn` | An evidence-supported maintenance, renewal or upgrade discussion. |
| `CrmHandover` | UUID; readable `SYN-PPO-HDV-nnnnnn` | A prepared handover to CRM, with its own state and confirmed receiving reference. |
| `AftercareObligation` | Reference to the shared Activity/Task identity | A projection, not a second task store. One obligation has one identity and one completion history. |

`AftercareRecord` carries `organisation_id`, `site_id`, `facility_ids[]`, `asset_ids[]`, `source_kind`, `source_reference`, `source_revision`, `source_read_at`, `source_completeness`, `follow_up_reason`, `follow_up_reason_basis`, `account_owner_id`, `review_owner_id`, `planned_review_date` (nullable), `due_basis` and `record_state`.

## 2. Reads the application must provide

| Read | Requirement |
|---|---|
| Customer 360 context | Organisation, site, facility/growing area, equipment (model, serial, installed location, served areas, software/configuration), contacts with recorded roles and recorded authority, plus `as_at` and completeness for each. Where two sources disagree — the account-owner discrepancy in §7 is a real example — return both and let the screen show the conflict. |
| Source events | Order, delivery, project stage acceptance, service visit, resolved issue and agreement records by reference **and revision**, with the date the aftercare record read them. A later revision must be detectable. |
| Open work | Open Service Cases, warranty matters, returns, unresolved findings and open obligations for the customer, scoped by permission. |
| Agreements | Agreement revision, coverage, exclusions, source-defined expiry and review date, and any open MA-05 renewal review with its state and proposal count. Read-only to CR-05. |
| Documents | Document reference, revision, state (current/superseded), successor and applicability by model, serial range and software/configuration. |
| CRM | Existing opportunities for the customer with stage, owner, created date and the qualification statement recorded against them. |

Every read returns the source's own freshness and completeness. A partial or failed read must be distinguishable from an empty result; none of the three may be presented as "nothing outstanding".

## 3. Commands the application must support

Each command is idempotent on an operation identity supplied by the client, refuses a reused identity that carries different content, and refuses a stale `record_version` or session version without partial effect.

| Command | Guards |
|---|---|
| `PlanAftercareReview` | Requires `due_basis` of `UserChoice`, `RecordedCommitment` or `SourcedRule` with its detail; `SourcedRule` additionally requires the source reference and the exact rule revision. A null date requires an explicit reason and is stored as `Date needed`. **No default interval may be applied.** |
| `ChangeAftercareOwners` | Changes the account owner and review owner independently, with a reason. Individual action owners are never transferred implicitly. |
| `OpenReviewPreparation` | Records the source snapshot; performs no external contact. |
| `SaveAftercareReview` | Requires date, method and at least one participant with a recorded role. Leaves every other outcome untouched. |
| `RecordCustomerFeedback` | Requires `feedback_basis` and the speaker. Cannot change a measured or independently verified outcome. |
| `RecordCommitmentDisposition` | Requires a disposition other than `Open` and a note; `CarriedAsOwnedAction` additionally requires an owner and a due date and creates exactly one shared obligation. |
| `CompleteAftercareReview` | Refuses while any commitment is `Open` or any remaining step or obligation lacks an owner and due date. Sets only the `AftercareReviewConducted` outcome. |
| `CorrectAftercareReview` | Append-only. The original completed record, its feedback and its history are retained and never overwritten. |
| `LinkExistingCase` | Refuses a second link to the same case. Similar wording never merges. |
| `PrepareServiceReferral` | Requires symptom, exact site/equipment/configuration, when it occurs, reported impact, proposed receiving owner, next contact commitment and an explicit duplicate-check acknowledgement. Stores no diagnosis, urgency category or service level. |
| `SubmitServiceReferral` | Distinct from preparing. Leaves the receiving outcome unknown until Service responds. |
| `RecordReferralOutcome` | `Accepted` (with a receiving case reference), `Returned` (with a reason) or `Unknown`. Acceptance is not resolution. |
| `ReviseReturnedReferral` | Appends the missing information and increments a revision count. Never rewrites the original request or the return reason. |
| `RecordTrainingNeed` | Resolves material applicability against the exact model and software/configuration and flags missing or superseded guidance. |
| `ConfirmTrainingArrangement` | Records a customer-agreed date and an explicit acknowledgement that scheduling owns the booking. **Creates no appointment, resource allocation or travel.** |
| `RecordTrainingAttendance` | Requires a confirmed arrangement. Does not set delivery or competence. |
| `RecordTrainingDelivery` | Requires recorded attendance and evidence, and an owned follow-up. Does not set competence. |
| `RecordTrainingAssessment` | Requires recorded delivery, a defined method and its stated limits. `Not assessed` is preserved as a distinct value. |
| `RequestDocument` | Creates a request in the document workflow. CR-05 stores no document bytes and no second repository. |
| `PrepareCommercialDiscussion` | Requires the source observation and the identified customer need. Carries every open technical and customer issue forward for display. |
| `LinkRenewalReview` | Requires an open MA-05 renewal review on the named agreement revision. **Must not write to the agreement.** |
| `LinkExistingOpportunity` | Requires an explicit acknowledgement that existing opportunities were reviewed. |
| `PrepareCrmHandover` | Requires scope, recorded need, source evidence, receiving owner, next action, unresolved assumptions and a deliberate review acknowledgement. Refused where an opportunity is already linked. |
| `SubmitCrmHandover` / `RecordHandoverOutcome` | `Accepted` (with a confirmed opportunity reference that must not already exist), `Returned` (with a reason) or `Unknown`. An accepted handover creates an unqualified opportunity; CRM qualification is a separate decision. |
| `CloseAftercareRecord` | Requires a completed review, every commitment dispositioned, no open obligation and no unreconciled receiving outcome. Closes nothing in another module. |

## 4. Permissions

Permissions, scope and validation are enforced on the server. The HTML role selector is a presentation control and establishes nothing.

| Proposed capability | Applies to |
|---|---|
| `aftercare.read` | Aftercare records within the caller's permitted customer scope. |
| `aftercare.plan` | Review dates, date basis and owner changes. |
| `aftercare.review` | Preparation, review save, feedback, agreed steps, commitment dispositions. |
| `aftercare.complete` | Review completion, corrections and record closure. |
| `aftercare.refer` | Preparing, submitting and revising Service referrals. |
| `service.receive_referral` | Recording the receiving outcome. Held by Service, not by Sales. |
| `aftercare.training` | Training needs, arrangement, attendance, delivery and assessment. |
| `document.request` | Document requests into the document workflow. |
| `aftercare.commercial` | Commercial discussions, renewal-review links and opportunity links. |
| `crm.prepare_handover` / `crm.receive_handover` | Preparing and submitting a handover, and recording its outcome. These are two different capabilities. |

Customer scope is applied to reads, queries, counts, search, snapshots and exports alike. A count that a caller cannot open must not be shown. Private communications, contact preferences and restricted commercial information stay out of aftercare projections unless the caller holds the owning capability.

## 5. Durability, retry and reconciliation

* Every command carries a client operation identity; the server retains a receipt with the operation identity, its content signature, the resulting version and the result reference.
* A retried identity with the same content returns the original result. A retried identity with different content is refused and reported for reconciliation.
* A referral or handover whose outcome is unknown blocks a further submission on the same record until it is reconciled.
* Source revision changes after a snapshot mark the record for reassessment. Earlier reviews, feedback and decisions are retained unchanged.
* Concurrent edits are detected on `record_version` and rejected with the current state, never merged silently.
* No CR-05 command may send an email, message, invitation or booking, or write to an agreement, warranty, ERP or document store.

## 6. Events

Proposed events, for the outbox: `AftercareRecordOpened`, `AftercareReviewPlanned`, `AftercareReviewCompleted`, `AftercareReviewCorrected`, `ServiceReferralSubmitted`, `ServiceReferralOutcomeRecorded`, `TrainingNeedRecorded`, `TrainingDelivered`, `TrainingAssessed`, `CommercialDiscussionPrepared`, `CrmHandoverSubmitted`, `CrmHandoverOutcomeRecorded`, `AftercareRecordClosed`. Each carries the aftercare reference, the record version and the source reference and revision. No event implies that another module's process completed.

## 7. Facts that must be decided before build

| Open question | Why it blocks |
|---|---|
| Follow-up intervals | No interval rule exists. Until one is adopted, with an owner and a revision, every review date must come from a user choice or a recorded commitment. |
| Competence definition | No competence standard or assessment method is adopted. `Assessed` currently means only "someone observed something and said what they observed". |
| Satisfaction measurement | No rating scale, its meaning, its source or its limits are defined. `Not assessed` must stay distinct from a low score. |
| Purchasing authority | No contact in the synthetic fixture has recorded purchasing authority. Commercial follow-up cannot assume a contact can commit. |
| Account owner of record | The shared location fixture records Willowbank's account owner as Alex Morgan; Service Cases r02 records Alex Morgan as Service Manager and Drew Wilson as Sales. One owning source must be chosen. |
| Aftercare reference series | `SYN-PPO-ACR`, `SYN-PPO-REF`, `SYN-PPO-TRN`, `SYN-PPO-CSG`, `SYN-PPO-HDV` and `SYN-PPO-DKR` are proposed synthetic series under PPO-STD-001. Their operational counters and allocation are not allocated. |
| Retention of customer statements | How long quoted customer statements are retained, and who may read them, is not decided. |
