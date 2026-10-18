# Customer communications API (D-025 S2)

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Status:** Synthetic S2 implementation in a draft pull request; Dean's authorisation of S2, review, business acceptance and deployment are separate. Nothing here reaches a provider, mailbox or customer.

## Boundary and authority

The [S2 record](../decisions/customer-communications-core-s2.md) builds the communication core of the [D-025 decision paper](../decisions/customer-communications-d025.md) behind [ADR-0058](../decisions/ADR-0058-outbound-customer-email.md)'s provider-neutral channel. The only channel is synthetic: every record carries `channel: "Synthetic"` and every read returns `simulated: true`.

- **Reading a message** needs read access to its source record through the source's own module (R3): `project.read` with the project's visibility rules, or `supply.read` with the demand's. A customer timeline also needs `shared.read` on the organisation, and lists only the messages whose sources the reader can read.
- **Confirming, withdrawing and reconciling** need the default-denied `customer_message.send` and the class's working duty (`supply.coordinate` for M1 and M2, `schedule.manage` for M3, `project.edit` for M4) in the message's company and site, plus read access to the source. For M4 (Reviewed), the sender must not be the person who prepared it.
- **Switching a class** needs the default-denied `customer_message.switch` in the company.
- **Notice preferences** need `shared.edit` (record) or `shared.read` (read) in the company, and the contact must belong to the company.
- **Templates** need `template.propose` and `template.read` (propose), or `template.publish`, `template.read` and the class's working duty (publish). The proposer cannot publish.

No seed grants either new duty.

## Preparation (internal)

Preparation has no HTTP endpoint. PPO drafts each message when the module that owns the class asks the service, through `prepareCustomerMessage(principal, source, { operation_id, schema_version: 1, reason, communication_id, supersedes_id? })`. The `MessageSource` authorises its caller and returns the fact version, any class facts and the R1 named-role recipient. The service reads the source record itself and derives the customer, site, confirmed reference and follow-up owner. S2 ships no source: M1 and M2 arrive in S3, M3 in S5 and M4 in S6.

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
