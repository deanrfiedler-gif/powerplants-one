# Customer communications — decision paper for D-025

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **State:** Proposed decision paper, 16 October 2026, for Dean's decision. **D-025 stays Open** until Dean decides. This paper closes nothing. It authorises no sending code, provider account, credential, mailbox, DNS change, migration or customer message. **Companion:** [ADR-0058](ADR-0058-outbound-customer-email.md), Proposed, records the provider choice and its alternatives.

**Direction, 16 October 2026.** Through the UX benchmark's Decision brief, Dean adopted this direction for D-025: "Email and SMS first, drafted from PPO records and sent by a named person; commission the ADR on SMS and email delivery; approve staff task tests and grower interviews". His words: "I am happy to proceed with all six based on your recommendations." See [UX benchmark decisions](ux-benchmark-decisions-2026-10-16.md) (PPO-UXB-DEC-01). It changes this paper in two places, and leaves the rest open:
- **C2 changes.** A named person sends every customer message, so M1 to M3 are drafted from PPO records and sent by a person rather than sent automatically.
- **Channels.** SMS joins email as a first channel. ADR-0058 covers email; an SMS delivery record is still to be written.
- **Still open:** C1 and C3 to C8. D-025 stays Open until Dean decides them. This direction authorises no sending code or customer message.

**Answers, 17 October 2026.** Dean answered Q1 to Q3 (section 9). In his words:
- **Q1:** "Carrier's own website, Freight booking platform, Recorded in MYOB, Paper or email only". Freight is booked all four ways, so no single system holds every tracking number.
- **Q2:** "No". The Projects Department does not use the Smartsheet Customer Update register today.
- **Q3:** "One shared mailbox".

The answers change M1, M4, R7 and the sequence, as noted where each appears. They decide none of C1 or C3 to C8, and they authorise no sending code, mailbox, app registration or customer message.

**Related:**
- Decisions: D-025; D-020 (identity and privacy), D-024 (branding and templates) and D-026 (migration) where noted.
- Requirements and outputs: CRM-03, DOC-05, PRJ-07, SCM-07, SCM-08, SVC-05; OUT-11, OUT-17; TR-03; IF-09, IF-15; NFR-11.
- Acceptance: AT-25, AT-36.
- Page register: `scope:PJ-08` (`/projects/updates`).

No parent requirement ID changes. Every message below is a proposal for PPO, not an observed operating rule.

## 1. Why decide now

On 16 October 2026 Dean named two problems:

1. Customers constantly phone sales reps to ask when their parts will arrive. He wants an automatic dispatch email that carries the freight tracking number.
2. Customers on projects that run for up to 12 months phone for updates. He wants the Projects Department to send regular update emails with timelines and questions for the customer.

Both need PPO to email customers. PPO deliberately emails no one today:

- **Staff notifications do not send.** Preferences are stored, but the notification service states "Email, push and SMS are not connected. Preferences do not send messages." (`src/notifications/service.ts`).
- **Distribution is synthetic.** The adapter boundary's `DistributionAdapter.prepare` returns `synthetic: true, delivered: false` (`src/adapters/contracts.ts`). The DK-03 ledger accepts only `channel='Synthetic'` and the states Prepared, OutcomeUnknown, SimulatedSent and SimulatedNotSent (migration 0091).
- **Email is read-only.** [ADR-0020](ADR-0020-email-calendar-synthetic-journey.md) seeds synthetic messages. [ADR-0021](ADR-0021-gmail-first-real-provider.md) reads Dean's individually labelled Gmail messages with `gmail.readonly` on the hosted demo only.
- **Sending is reserved for later.** The [Email & Calendar integration design](../blueprints/email-calendar-integration.md) reserves compose and outbox for "a later sending stage". Before broader sending, it requires a company disclosure policy, an operational mailbox list, shared-mailbox requirements and approved signature and filing.

Supply, Service and Projects each need customer email. Deciding D-025 once for all of them avoids three senders with three sets of rules. The [8 October direction](product-direction-quality.md) lets PPO adopt its own tested rules, so nothing here depends on CREMS.

## 2. What this decides and what it leaves open

**Decides, once Dean accepts:**
- which customer emails PPO may send, and who drafts, approves and triggers each;
- the provider;
- the rules for recipients, opt-out, logging, states, failures and content;
- the build order.

**Leaves open:**
- inbound mail sync and filing (the Email & Calendar pilot);
- calendar writes and invitations;
- sharing a message with a colleague;
- marketing and bulk email, and SMS;
- the customer portal (CP stages);
- quotation issue (ES-05), service report distribution (OUT-10), and invoices and statements (MYOB);
- the operational evidence: tenant, mailbox, DNS, retention and support ownership.

On acceptance D-025 would therefore move to **Partially resolved**, not Resolved, in the same way as D-004, D-022 and D-029.

## 3. Message classes

Two classes:

- **Automatic factual message.** It states facts that a staff member has already recorded in PPO. Its template wording is approved once. Each message then goes out without review. It can never carry free text.
- **Reviewed message.** It carries judgement: forecasts, risks and questions. One person drafts it, a second person approves the exact content, and then it goes out.

| Message | Class | Trigger | Drafted by | Approved by | Sent to |
|---|---|---|---|---|---|
| M1 Dispatch notice | Automatic factual | Staff record a Dispatch as Moved, with carrier and tracking number, for demand that belongs to a customer order, work order or project | PPO, from the published dispatch template and the recorded facts | The template publisher (Supply owner) approves the wording once. The person who records the movement is accountable for the facts | The order's delivery contact |
| M2 Delay notice (a confirmed ETA slips) | Automatic factual | Staff record a revised customer ETA, with a reason, that is later than the last ETA PPO sent that customer. PPO never derives a customer date from a supplier ETA | PPO, from the delay template | The template publisher once. The recorder owns the new date and the reason | The same contact as M1 |
| M3 Visit confirmation with site-readiness checklist | Automatic factual | A set lead time before a Confirmed appointment (proposed default: two working days, in the site's timezone). Also when a confirmed visit is changed or cancelled | PPO, from the visit template, the confirmed window and the site's customer-actionable readiness items | The template publisher (Service owner) once. The dispatcher's confirmation (TR-03) is the authority for the date | The site contact who agreed the dates |
| M4 Project update (OUT-11 / PRJ-07 / PJ-08 `/projects/updates`) | Reviewed | The project's update cadence falls due, or a milestone or forecast changes. The trigger creates a draft and an owned Activity for the drafter. **It never sends** | The project coordinator, from the current schedule, milestones, open customer questions and commentary written for the customer | A Projects approver other than the drafter approves the exact revision | The project's update recipients |

- **Corrections.** A correction to a fact that has already been sent produces a successor message that says it is a correction. A sent message is never edited.
- **Switches.** Each message has its own switch, off by default (rule R9).
- **Defaults Dean can change:**
  - the M3 lead time;
  - the M4 approver being someone other than the drafter;
  - the M4 cadence: 14 days unless the coordinator sets 7 or 30, the tiers observed in Smartsheet.

## 4. Provider options

[ADR-0058](ADR-0058-outbound-customer-email.md) records the reasons, constraints and alternatives in full.

| Option | For | Against |
|---|---|---|
| A. Microsoft Graph `sendMail` from a monitored shared mailbox | Same tenant as staff mail, so no new vendor and no customer data sent to a third party. Customer replies land in a mailbox that staff already read. Sent copies are visible in Outlook. It matches the Graph direction of the [integration design](../blueprints/email-calendar-integration.md) | `202 Accepted` only, and no delivery events. Bounces return as non-delivery reports that PPO must read and match. Needs app-only consent scoped to one mailbox. The tenant is still unverified |
| B. Transactional email service | Delivery, bounce and complaint events. Managed suppression list. Throughput | New vendor, cost and data-processing terms. Customer addresses and content leave the tenant. New DNS records, a webhook endpoint and an API secret. Replies still need a monitored mailbox, and sent copies are not in Outlook |
| Rejected | Gmail send: ADR-0021 is read-only and covers one personal account, not a company identity. SMTP submission: another credential type, with outcome reporting no better than A. Portal only: customers must sign in, and the portal is a design only | — |

**Recommendation:** Option A, behind a provider-neutral channel adapter. Volume is low, replies must reach the owning team, and A adds no vendor. Option B stays the named alternative if the pilot shows that bounce visibility under A is inadequate, or that the company's mail is not Exchange Online. Manual sending from Outlook, with the exact text that PPO prepared, stays the fallback for a held message. It is not the channel.

## 5. Policy rules

### R1 Recipients

- **Named role only.** The recipient comes from a named role on the source record, and from nowhere else:
  - M1 and M2: the order's delivery contact.
  - M3: the site contact who agreed the dates. The planner already checks the site's `primary_contact_id` before initial confirmation.
  - M4: the project's update recipients.
- **Same customer.** The contact must be current, must belong to the record's customer organisation and must have a valid address.
- **Never inferred.** A recipient is never taken from an email domain, CRM history, a Pipedrive import or an address typed in at send time.
- **Fixed at preparation.** PPO keeps the address it prepared the message for. If the contact changes before the message is sent, the message is withdrawn and prepared again.
- **No other customers.** There is no Cc or Bcc to another customer and no list sending. The staff copy is the shared mailbox's Sent Items.

### R2 Consent and opt-out

- **Not marketing.** These are service messages about the customer's own order, visit or project. Templates may not carry promotional content, and template review checks for it. Whether a particular template is a commercial electronic message under the Spam Act 2003 is for Powerplants to confirm. This paper gives no legal view.
- **No consent semantics exist today.** `contact_preference` is free text, and the contracts state that no consent is inferred ([contacts and stakeholders design](contacts-stakeholders-design.md), item 2).
- **Proposed notice preference.** Each contact gets a structured preference for each class: *Allowed* or *Do not notify*, with who recorded it, when and why. Being the named recipient on a record is the basis for sending. No marketing consent is inferred from it.
- **Stopping messages.** Every message says plainly how to stop these emails: reply to the mailbox. Staff then record *Do not notify*.
- **Suppression is never silent.** A suppressed recipient holds the message and creates an owned Activity to contact the customer another way.
- **Hard bounces.** A hard bounce marks the address *Undeliverable* until a person corrects it.
- **Smartsheet field.** The Smartsheet MIG-10 Contacts sheet keeps a separate "Do Not Notify" field ([source assessment](../blueprints/projects-source-assessment.md)). Any contact migration under D-026 must carry it across, never default it to Allowed.

### R3 Every message is logged on the timeline

- **One record per message.** Each message has one communication record, linked to the customer organisation, the site and the source record (demand or dispatch, appointment or work order, project).
- **What it holds:**
  - the class, recipient and subject;
  - the exact body;
  - the template publication and version;
  - the source fact versions;
  - the full state history.
- **Who can see it.** Anyone who can read the source record, because it contains only customer-safe content.
- **What it fulfils.** OUT-17 (filed communication record) for mail that PPO sends.
- **Not an Activity.** An Activity is a task. This record is evidence. Activities are created only for follow-up.
- **Retention.** Follows D-020 and D-024, both still open.

### R4 Sent, delivered and failed are kept distinct (DOC-05)

| State | Meaning | Evidence required |
|---|---|---|
| Prepared | Content and recipient fixed; not yet handed to the provider | The communication record |
| Held | Not sent: suppressed, missing address, switch off or missing data | The reason. An owned follow-up always exists |
| Submitted | The provider accepted the request | Graph `202 Accepted`, which Microsoft states "doesn't indicate that the request processing has completed" |
| Sent | The provider confirms that the message left | Under A, the copy found in Sent Items by PPO's message identifier. Under B, the provider's sent or processed event |
| Delivered | The recipient's mail server accepted it | **Positive evidence only**: a provider delivery event, or a message trace under A. Never inferred from silence |
| Failed | Rejected or bounced | A provider error, or a non-delivery report matched to the message |
| OutcomeUnknown | A timeout or crash after hand-over | PPO reconciles before any retry and never retries blind |
| Withdrawn | Cancelled before submission, for example superseded | The superseding record |

Delivered is not read and is not acknowledged. PPO adds no tracking pixels and makes no read claim. Under Option A most messages will honestly show "Sent — delivery not confirmed".

### R5 Failures are visible

- **One owned follow-up.** Held, Failed and OutcomeUnknown each create, or reopen, one owned `CustomerContact` Activity for the source owner:
  - the supply coordinator;
  - the work order's service owner;
  - the project coordinator.
- **The existing pattern.** This is BP-01 TR-03's rule, "Persist commitment and customer notification task separately; failed notification remains visible", and the pattern the planner's existing follow-up already uses.
- **Where it shows.** The failure appears in My Work, on the record and in an outbound queue for the owner of the message class.
- **Monitoring.** Queue age and failure counts are monitored under NFR-11.

### R6 Internal notes never reach a customer

- **BP-06's rule applies.** [BP-06](../blueprints/BP-06-projects-commercial-delivery.md) states: "Internal notes never flow directly to customer view." It adds that "customer visible" is eligibility, not approval.
- **Allowlisted fields only.** Templates bind only to an allowlist of customer-safe typed fields, and publishing refuses a template that binds anything else.
- **Never bound into a template:**
  - free-text internal notes and Activity summaries;
  - RAID commentary;
  - cost, margin and supplier pricing;
  - technicians' personal contact details.
- **M4 free text.** M4 free text is written in the draft, for the customer, and reviewed. Nothing is copied into it automatically.

### R7 Sending identity, replies and form

- **One mailbox.** Messages are sent from one monitored shared mailbox, and replies go to that same mailbox. The owning team handles replies in Outlook. Dean chose one shared mailbox on 17 October (Q3). Its address, whether it is Exchange Online in the company tenant, and who can grant administrator consent are still to be confirmed before the S4 pilot.
- **Subject line.** Subjects follow the naming assistance pattern `[confirmed reference] Purpose – Short description` ([integration design §15](../blueprints/email-calendar-integration.md#15-subject-and-task-naming-receiving-amendment--r03), PPO-STD-001 §24).
- **Branding.** Branding and signature stay provisional plain text until D-024 is decided.
- **Format.** The first stage has no attachments: M1 carries the tracking number and link, not documents. An M4 PDF can follow later as an exact DK-03 output.

### R8 One message per fact

- **Message identity.** A message is identified by class, source record, source fact version and recipient.
- **Retries.** A retried command returns its original receipt.
- **Changed facts.** A changed fact makes a successor message.
- **Unknown outcomes.** Under Option A, PPO searches Sent Items for its identifier before any retry. No exactly-once delivery is claimed.

### R9 Off by default, synthetic first

- **Off by default.** Every message class has a switch, off by default.
- **Synthetic first.** The prototype uses a synthetic channel that records simulated outcomes, as DK-03 does.
- **Internal before external.** The first live sends go only to internal test addresses.
- **Customers last.** A class reaches customers only after Dean switches it on.

## 6. What is reused

| Component | What it gives | What it lacks |
|---|---|---|
| `ppo.outbox_jobs` (migration 0001) | A durable job per accepted operation, with states Ready, Running, Done, Retry, Blocked and OutcomeUnknown, plus leases, attempts, retry time and error code. One job per operation and kind. Document, report and finance workers already drain it | A sending kind. Each migration widens the kind check using the 0091 idiom |
| DK-03 distribution ledger (`src/outputs/distribution.ts`, migration 0091) | A per-recipient attempt bound to an exact output hash and a recovery owner. Append-only Prepare, Record and Reconcile events. Reconcile-before-retry from OutcomeUnknown | Real channel, Submitted, Sent, Delivered and Failed states, and provider message identifiers. Its attempts are guarded to an exact job pack or service report issue, so customer messages most likely need a sibling ledger on the same pattern. The build increment decides this |
| DK-06 templates ([publication](template-publication-backend.md), [use assignment](template-use-assignment-backend.md)) | An immutable reviewed publication, effective intervals by company and site, an exact definition hash, and separate publish and assign duties | It supports OUT-09 with an Internal audience only. It needs a customer-audience email family with the R6 allowlist |
| Activities and the `CustomerContact` pattern (`src/activities/activities.ts`, `src/scheduling/planner.ts`) | Owned, due follow-ups linked to Organisation, Site, Asset, Ticket, Opportunity, Lead or Project. The planner already creates a RestrictedService `CustomerContact` follow-up on booking changes and blocks initial confirmation without recorded customer agreement | A record of a sent message. Activities stay tasks (R3) |
| Email & Calendar types and rules ([integration design](../blueprints/email-calendar-integration.md) §6 and §15) | Provider-neutral types. The rule that a sender needs "an original operation/event key, exact approved communication revision, current authority and a durable outbox", and that accepted sends are not delivery | Any send path |

## 7. Data gaps for each message

### M1 Dispatch notice

| Gap | Evidence | Needed |
|---|---|---|
| No carrier or tracking field | The Dispatch fact holds state (Prepared, Moved), quantity, receiving details, documents, packing, movement time and a separate source shipment observation (`src/supply/model.ts`). "Dispatch documentation" is free text | A typed carrier from a maintained list, a tracking or consignment number, and an optional tracking link pattern for each carrier |
| No order contact | Demand records `customer_id` and its origin (Project, WorkOrder or OtherApproved), but no contact | A delivery contact on the demand or order |
| MYOB shipment semantics unverified | FUL-B01–B04 (shipment identity, quantities, confirmation, idempotency) are open questions. The source shipment stays "a manual observation" ([fulfilment contract](../contracts/order-fulfilment-integration.md)) | Trigger on PPO's own Moved fact, never on a MYOB shipment, until FUL-B01–B04 are verified |
| Partial dispatch | IF-15: "Partial delivery retains outstanding quantity" | The message states the quantity shipped and the quantity outstanding |
| Freight booking is mixed (Q1, answered 17 October) | Dean: freight is booked on carriers' own websites and on a freight booking platform, is recorded in MYOB, and is sometimes on paper or email only | Staff enter the carrier and the tracking or consignment number when they record a dispatch as Moved, because no single source holds them. Still needed: the list of carriers and the name of the freight booking platform. Reading the number from that platform or from the MYOB Acumatica shipment is a later, separate increment, after FUL-B01–B04 are verified |

### M2 Delay notice

| Gap | Evidence | Needed |
|---|---|---|
| No customer ETA | Supply `eta` and `eta_basis` (Estimated, SupplierConfirmed, Unknown) are the inbound supplier date. Demand `required_on` is when the work needs the material. `customer_commitment` is free text | A revision-tracked customer ETA with a reason, and the last ETA sent |
| A supplier slip must not email the customer by itself | SCM-08: "Delays trigger review; they do not silently move confirmed bookings" | When a supplier ETA passes the customer ETA, PPO creates a staff review, not an email |

### M3 Visit confirmation

| Gap | Evidence | Needed |
|---|---|---|
| Window, site and contact exist | The planner holds the confirmed window and checks the site's `primary_contact_id` | Nothing new |
| No customer checklist | CS-06 site readiness ([design](site-access-readiness-design.md)) and FI-05 [field readiness](field-readiness-native.md) record site conditions. No item is marked as customer-actionable and none has customer wording | A customer-actionable flag and customer wording for each readiness item type |
| Lead time not set | — | A versioned policy value (proposed default: two working days) |
| Crew details | — | No technician names or personal numbers. Say "the Powerplants service team" |
| Field readiness is changing | A separate field-readiness proposal is under way | Build M3 after it settles |

### M4 Project update

| Gap | Evidence | Needed |
|---|---|---|
| No update record | OUT-11 and PJ-08 are unbuilt. `scope:PJ-08` is "To build" at rank 95 in the [UI build sequence](../design/development/ui-build-sequence.md). Its guide expects exact content, review, publication of the approved revision and a successor for any edit | An immutable update revision with review and publication |
| No customer-question tracking | "Waiting on others" (`src/activities/work-waiting.ts`) takes its sources only from `ServiceRequest` and `Engineering` | Customer questions on a project, each with a due date and owner, shown as waiting on the customer |
| No Projects Department role | A project has one `coordinator_id` (migration 0019). Capabilities cover `project.read`, `create`, `edit` and `commercial.*` only | A Projects team, and update prepare and review duties |
| No update recipients | Projects have no customer stakeholder list | Update recipients per project (R1) |
| Cadence not adopted | MIG-01's 7/14/30-day tier formula is "an observed source rule". J1 shows the last update date "without adopting an SLA or auto-stale policy" ([source assessment](../blueprints/projects-source-assessment.md), finding 4) | Dean adopts the M4 default, or replaces it |
| Smartsheet register not in use (Q2, answered 17 October) | Dean: the Projects Department does not use the Smartsheet Customer Update register today. MIG-11 still lists two Customer Update Register assets | M4 starts a new process rather than replacing a working one, so it needs no D-026 transition of a live update practice. Whether either asset's historical rows are migrated stays with MIG-11 and D-026 |
| Shareable RAID content | RAID (migration 0087) has no customer-shareable marking. Baselines (0081) and calendars and actuals (0088) supply dates | Only typed dates go into an update automatically. Risks are written for the customer in the draft |
| No page design | PJ-08 has no accepted Figma design ([ADR-0053](ADR-0053-figma-page-design.md)) | A design before the page is built |

### Common to all four

- **No customer email template family.** DK-06 supports internal job packs only.
- **No real channel.** DK-03 is synthetic and limited to job packs and service reports.
- **No sending kind.** No outbox kind exists for customer messages.
- **No structured notice preference** exists on a contact.
- **No tenant or mailbox evidence**, and no stored app credential outside the repository.

## 8. Recommended sequence

| Stage | Content | Depends on |
|---|---|---|
| S1 Decide | Dean accepts C1–C8, with C2 as changed on 16 October. He answered Q1–Q3 on 17 October. D-025 moves to Partially resolved. ADR-0058 moves to Accepted | This paper |
| S2 Communication core, synthetic channel | The communication record and state ledger, outbox kinds and worker, timeline display, Held and Failed follow-ups, the notice preference, and a customer email template family in DK-06. One migration, under AGENTS.md's registry rules. No provider | S1 |
| S3 Dispatch and delay notices | Carrier and tracking fields entered by staff (Q1), the order delivery contact, and the M1 and M2 triggers, proved end to end on the synthetic channel | S2; the carrier list and the freight booking platform's name |
| S4 Live pilot on Graph | The shared mailbox (Q3) and its scoped app registration. Sends to internal test addresses only. Sent Items and bounce matching. Then M1 for real customers, when Dean switches it on | S3; the mailbox address; the tenant administrator |
| S5 Visit confirmations | The customer checklist wording, the lead-time policy, and the M3 triggers | S2, the field-readiness work |
| S6 Project updates | The PJ-08 Figma design, the update record and successors, recipients, customer questions as a waiting-on-customer source, Projects duties and the cadence | S2. Q2 makes it a new process. The design can run alongside S3–S5 |

M1 comes first because it removes the most calls with the smallest data gap. M4 comes last because it needs new records, roles and a page design.

## 9. Decisions for Dean

If Dean answers "Proceed with your recommendations", these are adopted and recorded in his words:

| ID | Recommendation |
|---|---|
| C1 | All PPO customer email goes through one communications service. No module calls a provider directly |
| C2 | The four messages and their authority are as in section 3: M1–M3 automatic factual, M4 reviewed. The defaults listed there apply until changed |
| C3 | The provider is Microsoft Graph from a monitored shared mailbox, behind a provider-neutral channel ([ADR-0058](ADR-0058-outbound-customer-email.md)) |
| C4 | Recipients follow R1 |
| C5 | Consent and opt-out follow R2 |
| C6 | Logging, states and failures follow R3–R5 and R8 |
| C7 | Content follows R6 and R7 |
| C8 | Every class is off by default and synthetic first (R9). The build follows S2–S6, and each stage is still its own increment to authorise |

Questions that only Dean can answer, all answered on 17 October 2026:

- **Q1. Where is freight booked today, and where does the consignment note and tracking number live?** For example a carrier portal, a MYOB shipment, an email from the carrier, or paper. The answer decides whether staff type the number in or a later read supplies it, and which carriers to list.
  - **Answer:** "Carrier's own website, Freight booking platform, Recorded in MYOB, Paper or email only". Staff type the number in (M1). The carrier list and the platform's name are still needed for S3.
- **Q2. Does the Projects Department use the Smartsheet Customer Update register today?** If so: which of the two MIG-11 assets, how often, and who approves. The answer decides whether M4 replaces a working process, which needs a transition under D-026, or starts a new one.
  - **Answer:** "No". M4 starts a new process.
- **Q3. Which mailbox should customer email come from?** One shared mailbox, or one for each team (dispatch, service, projects)? Is it Exchange Online in the company tenant, and who can grant administrator consent? The answer decides the Graph setup and where replies go.
  - **Answer:** "One shared mailbox", as R7 proposed. The address, the tenant and the person who can grant consent are still to be confirmed before S4.

## 10. Evidence boundary

- **Inspected** on main `1552cfb`:
  - the supply model, outbox, distribution, notification, adapter, Activity, planner and waiting sources named above;
  - migrations 0001, 0019, 0087 and 0091;
  - BP-01 (DOC-05, PRJ-07, OUT-11, OUT-17, TR-03, IF-09, IF-15, SCM-07, SCM-08);
  - BP-06;
  - the Email & Calendar integration design, ADR-0020 and ADR-0021;
  - the contacts design, the Projects source assessment and the fulfilment contract.
- **Checked externally:** Microsoft's `sendMail` reference, for the `202 Accepted` behaviour and the `Mail.Send` permission.
- **Not inspected:**
  - the company tenant, mailboxes, DNS or licences;
  - current Smartsheet usage;
  - MYOB;
  - any real customer data.

None of this is a production claim.
