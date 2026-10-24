# Customer communications API (D-025 S2 and S3)

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Status:** S2 merged in PR #569. S3 is being implemented under the 24 October authority recorded in [D-025](../decisions/customer-communications-d025.md#24-october-2026--s3-synthetic-implementation-authority), in draft PR #695. Review, executed business acceptance and deployment remain separate. Nothing here reaches a provider, mailbox or customer.

## Boundary and authority

The [S2 record](../decisions/customer-communications-core-s2.md) builds the communication core of the [D-025 decision paper](../decisions/customer-communications-d025.md) behind [ADR-0058](../decisions/ADR-0058-outbound-customer-email.md)'s provider-neutral channel. The only channel is synthetic: every record carries `channel: "Synthetic"` and every read returns `simulated: true`.

- **Reading a message** needs read access to its source record through the source's own module (R3): `project.read` with the project's visibility rules, or `supply.read` with the demand's. A customer timeline also needs `shared.read` on the organisation, and lists only the messages whose sources the reader can read.
- **Confirming, withdrawing and reconciling** need the default-denied `customer_message.send` and the class's working duty (`supply.coordinate` for M1 and M2, `schedule.manage` for M3, `project.edit` for M4) in the message's company and site, plus read access to the source. For M4 (Reviewed), the sender must not be the person who prepared it.
- **Switching a class** needs the default-denied `customer_message.switch` in the company.
- **Notice preferences** need `shared.edit` (record) or `shared.read` (read) in the company, and the contact must belong to the company.
- **Templates** need `template.propose` and `template.read` (propose), or `template.publish`, `template.read` and the class's working duty (publish). The proposer cannot publish.

No seed grants either new duty.

## Preparation (internal)

Preparation has no HTTP endpoint. PPO drafts each message when the module that owns the class asks the service, through `prepareCustomerMessage(principal, source, { operation_id, schema_version: 1, reason, communication_id, supersedes_id? })`. The `MessageSource` authorises its caller and returns the fact version, any class facts and the R1 named-role recipient. The service reads the source record itself and derives the customer, site, confirmed reference and follow-up owner. S2 shipped no source. S3 supplies M1/M2 through native Supply commands below; M3 remains S5 and M4 remains S6.

Preparation refuses `MessageClassOff` while the class is Off, `MessageAlreadyPrepared` for a second message with the same class, source, fact version and recipient (unless the first was withdrawn), and `CorrectionNotApplicable` when `supersedes_id` does not name a sent message about an earlier version of the same fact. Otherwise it records the message Prepared, or Held with one owned follow-up when there is no named contact (`NoRecipient`), the contact is not a current contact of the customer (`RecipientNotCurrent`), the contact asked not to be notified (`DoNotNotify`), there is no address (`MissingAddress`), no template is published (`TemplateUnavailable`) or a bound fact is missing (`MissingData`).

## Endpoints

All endpoints start with `/api/v1` and use the existing session, origin, JSON, no-store and actor-private receipt protections. Commands answer 201 the first time and 200 with the original receipt on replay.

| Method and path | Result |
|---|---|
| GET `/customer-communications?organisation_id=` or `?project_id=` or `?demand_id=` | The customer, project or order timeline: exactly one filter, newest first, at most 200 rows. |
| GET `/customer-communications/queue[?owner=me]` | The outbound queue: Prepared messages waiting for a named sender, and Held, Failed and OutcomeUnknown messages with their follow-up. |
| GET `/customer-communications/:id` | One message: exact subject and body, bound facts, template version and hash, every ledger event with its display state, and follow-ups. |
| POST `/customer-communications/:id/confirm` | `{ operation_id, schema_version, reason, expected_version, content_hash }`. The named sender confirms the exact content hash: Prepared to Queued. If the switch, preference or recipient no longer allows sending, the message is Held with a follow-up instead. Refuses `ContentChanged`, `MessageNotPrepared`, `IndependentSenderRequired`, `VersionConflict`. |
| POST `/customer-communications/:id/withdraw` | `{ …, expected_version }`. Prepared or Held to Withdrawn; refuses `MessageNotWithdrawable` once confirmed. |
| POST `/customer-communications/:id/reconcile` | `{ …, expected_version }`. OutcomeUnknown only: searches the channel for PPO's message identifier. A copy makes it Sent, or Failed with a non-delivery report; no copy queues it again and re-arms its outbox job. |
| GET, POST `/customer-communications/switches` | `?company_id=`; POST `{ …, company_id, message_class, mode: "Off" \| "Synthetic", expected_version }` (0 before the first change). Refuses `SwitchUnchanged`. |
| GET, POST `/people/:id/notice-preferences` | `?company_id=`; POST `{ …, company_id, message_class, preference: "Allowed" \| "DoNotNotify", expected_version }`. The reason records why. With nothing recorded, the basis is `NamedRecipient`. |
| GET, POST `/customer-email-templates` | `?company_id=`: current publication, history and proposals per class. POST `{ …, company_id, message_class, definition }` proposes a CUS-EMAIL definition. |
| POST `/customer-email-templates/proposals/:id/publish` | `{ …, definition_hash, approval_note }`: publishes the exact proposal as the next version for its company and class. Refuses `IndependentPublisherRequired`, `DefinitionChanged`, `AlreadyPublished`. |

## Template definition

```json
{ "schema_version": 1, "family": "CUS-EMAIL", "message_class": "DispatchNotice", "audience": "Customer",
  "subject": "[{{source.reference}}] Dispatch – your order",
  "body": ["Hello {{recipient.name}},", "…"] }
```

Placeholders bind only the class's allowlisted fields in `ppo.customer_email_bindings`; S2 allows `customer.name`, `recipient.name`, `site.name` and `source.reference`. The database refuses any other binding even when the application is bypassed. The renderer adds the stop instruction and a provisional plain sign-off, and marks a correction in the subject and first line.

## States and the worker

| State | Meaning |
|---|---|
| Prepared | Drafted by PPO; content, recipient and template fixed; waiting for a named sender |
| Held | Not sent, with a reason and an owned follow-up |
| Queued | Confirmed by the named sender; waiting for the worker |
| Submitted | The channel accepted it; accepted is not sent |
| Sent | The channel's sent copy was found (simulated); delivery not confirmed |
| Delivered | Positive delivery evidence only (simulated); never a read receipt |
| Failed | Rejected, or a matched non-delivery report |
| OutcomeUnknown | The hand-over's result is unknown; reconcile before any retry |
| Withdrawn | Cancelled before any hand-over |

`runCustomerMessageJobs()` (run by `npm run documents:worker`; the hosted demo worker does not run it) drains `CustomerMessageConfirmed` outbox jobs with leases and attempts. It checks the switch, preference and recipient again before every hand-over, never resubmits a job whose lease expired mid hand-over (that message becomes OutcomeUnknown), and then observes Submitted and Sent messages for sent copies, non-delivery reports and delivery evidence.

The synthetic channel keeps its simulated Sent Items in `ppo.synthetic_mailbox_messages`. A tag in a synthetic address's local part chooses the simulated outcome: none (Sent), `+delivered`, `+bounce`, `+reject`, `+lost-request` (lost before acceptance) and `+lost-response` (accepted, response lost).


## S3 native dispatch and delay notices

The 24 October 2026 S3 implementation retains the source authority of [Supply Chain](supply-chain-readiness.md) and the native/source-ERP boundary of [order fulfilment](order-fulfilment-integration.md). It serves EC-04 and SC-05–SC-07 without adding UI controls. The existing synthetic worker, immutable CUS-EMAIL publications, named sender confirmation, preference checks and owned follow-ups remain the channel boundary.

### Source commands and reads

| Method and `/api/v1` path | Contract |
|---|---|
| GET `/supply/customer-delivery-options?company_id=` | Fictional Carrier, Platform and DelayReason choices with stable `SYN-CAR-000nnn`, `SYN-PLT-000nnn` and `SYN-DLR-000nnn` codes. Requires current `supply.read` and shared company access. No external lookup. |
| GET `/supply/records/:id/customer-delivery` | Current named contact/customer ETA, immutable history, dispatch details, linked notice IDs/states/source hashes and last sent customer ETA. Requires the Demand's full current source-read authority. |
| POST `/supply/records/:id/customer-delivery` | `{ operation_id, schema_version: 1, reason, expected_version, contact_id, customer_eta, delay_reason_code }`. Nullable contact/date/reason; `expected_version` is the Demand version. `supply.coordinate` records one contiguous delivery revision and one native Demand revision. The contact must be current and belong to that exact company/customer. |
| POST `/supply/records/:id/facts` | Existing native command. An optional `dispatch_notice: { carrier_code, platform_code, tracking_number }` is accepted only for Dispatch. It belongs to that exact new fact. Omitting it preserves the historic normalized command and receipt hash. A new Moved fact prepares M1 atomically when the class is Synthetic and the Demand names a customer. |
| POST `/supply/records/:id/customer-notices` | Explicit preparation/recovery from existing native facts: `{ operation_id, schema_version: 1, reason, expected_version, dispatch_fact_id }`. A current Moved fact ID selects M1 (`supply.fulfil`); null selects M2 (`supply.coordinate`). A Held/Prepared predecessor must be withdrawn before preparation for the same fact/contact. Caller-supplied addresses, body text and facts are refused. |
| GET `/supply/operations/:operation_id` | Actor-private original source-command receipt. Current source read and command duty are checked before returning an old receipt. |

Commands return 201 on first acceptance and 200 with the exact original receipt on identical replay. Changed replay payloads refuse `OperationConflict`; stale native versions refuse `VersionConflict`. Concurrent duplicates produce one accepted source operation and at most one draft. New and existing routes retain session/origin/no-store protections and company/workspace isolation.

Carrier/platform choices and tracking identifiers are explicitly supplied for each exact Dispatch fact; a successor does not silently inherit a previous consignment number. The tracking link is constructed under `https://tracking.example/` with an encoded consignment identifier. It is fictional and is never fetched. Carrier facts are not a booking instruction or a MYOB shipment transaction.

### Trigger and content rules

- **M1:** a native Moved fact produces one immutable draft. Prepared dispatch evidence alone produces none. The snapshot identifies the exact movement, cumulative current moved quantity and outstanding quantity in the recorded unit. Partial dispatches are separate notices. A corrected Moved fact can succeed a Sent/Delivered ancestral notice to the same contact; original content, references, hashes and events remain exact. Submitted/OutcomeUnknown predecessors require reconciliation before a correction can be sent.
- **M2:** only an explicit customer-ETA revision later than the last ETA actually sent to the same current named contact qualifies. The baseline must have Sent ledger evidence and a publication that included `{{delivery.customer_eta}}`; storing an unrendered date is insufficient. Submitted/Queued/OutcomeUnknown are not Sent. Positive delivery is not inferred. A later bounce does not erase the historical fact that a message was sent. Changing the named contact starts with no baseline for that contact unless PPO has already sent one to them.
- **No inferred dates:** a supplier Promise, incoming shipment ETA, schedule forecast or `required_on` is never copied into customer ETA or automatically reschedules work. The internal command reason, fact evidence and Activity text never become delay wording. The delay reason comes only from the fictional customer-safe catalogue.
- **Off:** records and carrier evidence can still be saved; no notice or contact task is drafted. Explicit later preparation can use the retained native fact. Already prepared/queued notices are held when confirmation/the worker encounters Off.
- **Missing setup:** missing carrier/platform/tracking, named contact, address, explicit bound facts or template produces Held with an owned follow-up. A published template cannot bypass the trigger's required carrier/movement fields by omitting their placeholders.

Added M1 bindings: `dispatch.carrier`, `dispatch.platform`, `dispatch.tracking_number`, `dispatch.tracking_url`, `dispatch.movement_at`, `dispatch.quantity`, `dispatch.dispatched_quantity`, `dispatch.outstanding_quantity`, `dispatch.item`, `dispatch.unit`, `delivery.customer_eta`. Added M2 bindings: `delivery.customer_eta`, `delay.previous_eta`, `delay.reason`. Existing shared bindings and issued publications remain unchanged. No template is auto-published by the seed.

### Refusal and recovery

A communication binds its exact native fact, current delivery revision, optional sent baseline, canonical source snapshot and SHA-256. Confirmation and the worker compare current named-role/source facts to that binding. A changed role yields `RecipientChanged`; superseded movement, ETA/baseline or quantity facts yield `SourceChanged`. The worker also rechecks the named sender's current source read, `customer_message.send` and class working duty; revoked authority yields `SenderUnauthorised`, with no handover and an owned follow-up. A correction with an unresolved prior handover yields `PriorOutcomeUnknown`.

Withdraw a Held draft, correct the source or resolve the predecessor outcome, then prepare from current evidence and obtain a new named confirmation. Neither a retry nor restoring a grant promotes a held message. Reconcile unknown handovers through the existing command before any retry. There is no new retry daemon, provider adapter or hosted worker.

Migration/seed 0121 adds the immutable delivery, dispatch-detail and message-source evidence plus seven fictional options. It extends the existing binding/hold allowlists; it adds no identity type, capability, grant or user. The local tests prove synthetic behavior only. Cross-model review, final-head CI, business acceptance and production readiness must be reported separately in the PR/status evidence.
