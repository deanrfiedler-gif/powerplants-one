# BP-03 — CRM Functional & Build Blueprint

| Document control | Value |
|---|---|
| Revision / date | r05 / 7 September 2026 |
| Status | Broader design proposed; I1 implemented and component-tested; actual publication in handover; owner acceptance outstanding |
| Owner | Dean Fiedler — personal private prototype |
| Workstream | PPO-009 / [issue #9](https://github.com/deanrfiedler-gif/powerplants-one/issues/9); distinct from PP-01 P09 |
| Authority | Discovery authorised design only; separate I1 invocation authorises the bounded synthetic implementation in #39 |
| Discovery starting source | Main `85bd2fcc388495cc24dc2ee4f273accc49da2f24`; tree `7406ceb9b000e616410489bb66503a6e9e8c6c08` |
| Parent scope | CRM-01–CRM-08 and PAR-01–PAR-18; identities and issued references preserved |

[Parity and evidence](crm-parity.md) · [Screens and walkthrough](crm-screen-specification.md) · [Implementation sequence](../delivery/crm-implementation-plan.md) · [First starter](../delivery/crm-first-increment-starter.md) · [Handover and publication](../delivery/crm-discovery-handover.md).

## I1 implemented subset and publication evidence

The separately authorised [I1 issue #39](https://github.com/deanrfiedler-gif/powerplants-one/issues/39) / [PR #40](https://github.com/deanrfiedler-gif/powerplants-one/pull/40) builds only owned opportunity and qualification follow-up. [I1 handover](../delivery/crm-i1-handover.md), [ADR-0015](../decisions/ADR-0015-crm-i1-owned-opportunities.md) and its external publication record govern actual delivered status. This amendment does not mark an unmerged branch complete.

The concrete I1 subset is one immutable fictional Enquiry → Qualified definition, Open outcome only, existing permitted customer context, active eligible owner, atomic initial Internal CustomerContact/RelationshipReview Activity, qualification under the current owner, and deliberate next-action planning. Opportunity/OPP identity, typed configuration/event records and a real ActivityLink Opportunity FK use existing shared authority/transactions. Sales worklist, New opportunity and detail/progression/actions are responsive online screens. Completion retains its exact outcome and shows Next action needed; unknown due remains explicit. UUID/reference/title/version/stage/close remain separate.

Company, organisation/site/contact links, source context and owner are fixed. No scoped manager/admin capability, PATCH, lead, board/drag, closing/reopening, transfer, reassociation, forecast/value/probability, account-plan builder, downstream handoff, file, communication, automation, export/delete or CRM offline feature is included. Those broader proposals below remain design only. P09/P10 service/report/Finance boundaries remain independent. Real operational licence/configuration evidence, D-013/D-025, owner-accepted parity and full AT-25 stay open/planned.

The [concrete API](../contracts/service-api.md#bp-03-i1-opportunity-implementation-amendment) and [physical dictionary](../contracts/service-data-dictionary.md#bp-03-i1-physical-opportunity-extension) refine the candidate contracts below for I1. No PP-01 API-C/API-R number or new parent is allocated. Original discovery wireframes and historical baseline statements remain source evidence; runtime screenshots and checks have separate provenance. [I2 starter](../delivery/crm-i2-starter.md) was subsequently invoked for a bounded scoped Board/Grid worklist. [I2 handover](../delivery/crm-i2-handover.md) records the bounded implementation and its source-specific verification/publication; the broader proposed relationship and commercial scope below is unchanged. Both views consume one current-authority page, actual Enquiry/Qualified and Open, and preserve canonical detail/actions. No schema or business command is added.

## 1. Purpose, evidence and scope

Give sales an accountable view of each commercial pursuit: who is involved, which organisation/site is intended, what needs to happen next, what has already been tried or offered, and which downstream owner must accept a handover. Preserve required Pipedrive outcomes and history before considering transition. Pipedrive remains operational; PPO contains synthetic demonstrations only. No runtime integration, database change, import, cutover, communication or automation activation is delivered by this blueprint.

The maintained [master, section 09](BP-01-master-blueprint.md#09-crm-capability-blueprint) owns the eight CRM parents. Its issued baseline is unchanged. This blueprint elaborates that scope without promoting its proposals to corporate policy. Evidence labels used here are **UD** (current user decision), **OBS** (bounded observation), **SRC** (maintained source), **DOC** (official vendor behaviour), **PRO** (proposal) and **OPEN** (unresolved evidence). Evidence dates, scope and confidence live once in the [parity assessment](crm-parity.md#1-evidence-ledger).

UD: parallel CRM design is authorised alongside P09. OBS: one live Pipedrive metadata read returned ten stages across two pipeline IDs; account/tenant identity and complete access cannot be verified through the exposed connector. No new customer/deal/person/communication sample was read. SRC: the master records an earlier 60-open-deal sample, with no exhaustive-use claim. DOC: vendor documentation explains capability, never this account's licence or configuration.

D-013 (parity/history), D-025 (communications), D-011 (identity), D-020 (access), D-026 (migration) and D-028 (aftercare/group scope) remain open. This package selects a reviewable synthetic design, not operational closure. All proposed preserve/improve/integrate/defer dispositions require later outcome acceptance. No retirement is selected.

## 2. Product boundaries and practical defaults

| Concern | Proposed default and reason | Approval/evidence still needed |
|---|---|---|
| First useful journey | Existing permitted organisation → owned Open opportunity → explicit next action → recorded qualification and stage change | Synthetic vertical slice can proceed under a later implementation instruction |
| Separate leads | Design a separate qualification inbox/LeadCandidate for later evidence-led scope; do not add it to the first slice | Actual separate Pipedrive Lead use, conversion and disqualification examples |
| Pipelines | Immutable versioned definitions; first slice uses one explicitly fictional two-stage definition, Enquiry → Qualified | Operational pipeline names, entry/exit criteria and mapping acceptance |
| Accountability | One accountable owner, one designated next Activity or an owned next-action-needed state; other activities allowed | Manager delegation and escalation policy |
| Sales activity | Reuse Activity; first slice uses existing CustomerContact or RelationshipReview. Call/meeting/visit channel detail is a later typed extension | Used types, recurrence and communication rules |
| Forecast | Show stage and next actions first. First slice has no values, weighted total or forecast probability | Sales/Finance-approved basis, currencies, options and cohort rules |
| Site ambiguity | First slice requires an existing organisation; site/contact may be explicitly unknown. Qualifying requires contact or an owned contact-identification action | Wider multi-site pursuit and cross-company policy |
| Mobile sales | Responsive online workflow initially; no CRM cache or service worker extension | Sales device/workflow, data retention, revocation and poor-connectivity evidence |
| Documents | Permission-checked references; show unavailable until exact source/version and current read authority exist | SharePoint setup/retention, quotation interface and document audience |

These are reversible prototype choices. No pricing, discount, approval threshold, marketing consent, retention period, sales quota or response SLA is invented. Defer unfamiliar capabilities while preserving their inventory and operational source.

## 3. Journeys and business controls

Common journey contract: the server derives actor/workspace/time; requires current capability and record scope; validates every linked target; checks expected versions under the shared transaction lock; commits domain changes, immutable history/audit, operation receipt and outbox together. Replays recheck current permission before returning the original receipt. UI Save is confirmed only by a server receipt; unsaved input survives recoverable validation/conflict in the current session. Restart durability is not claimed for online unsaved forms. Denied/revoked reads do not retain sensitive content in the visible form.

### J1. Enquiry, qualification and opportunity creation

**Actors:** sales contributor, opportunity owner; manager for later reassignment. **Preconditions:** active synthetic identity with `crm.opportunity.create`, shared read and relevant activity authority; existing permitted organisation in one visibility company. **Inputs:** short title, source channel/basis, customer need, accountable owner, optional contact/site with explicit unknown reasons, and next action with a due instant or due-needed flag. No legal account or order is inferred from the selected organisation.

**Transition:** create Open at the configured entry stage. A later LeadCandidate journey would use New → Qualifying → Qualified/Disqualified; conversion creates exactly one opportunity and immutable source conversion link, rather than renaming a lead into a deal. Lead use remains OPEN and outside the first slice.

**Rules:** duplicate candidates are advisory until reviewed; same name/email never merges identities. Qualification records a need, an accountable next action and either a permitted contact or an owned plan to identify that contact. Unknown budget, authority or timing stays unknown and visible, without invented zero values. Operational qualification gates require sales acceptance.

**Exceptions/recovery:** unknown organisation routes to existing shared-context creation under its own permission; first CRM slice does not create a second account master. Missing site is allowed for discovery, not automatic readiness for service or delivery. Invalid affiliation, hidden organisation, inactive owner and stale configuration reject creation without partial activities. Timeout resolves using the same operation ID and original content.

**Audit/acceptance:** retain source channel, reported occurrence time when supplied, server capture, initial stage-definition version and owner. Synthetic example: SYN-PPO-ORG-000901 creates SYN-PPO-OPP-000001 with one owned CustomerContact action; replay produces one opportunity, one Activity/link set and one receipt. CRM-01/02/03; PAR-01/02/03/05; cases CA-01–CA-04.

### J2. Organisation, contact, site and stakeholder relationships

**Actors:** sales contributor, shared-data steward; scoped observer reads. **Preconditions:** current shared permissions, same company visibility context, permitted people and sites. **Inputs:** existing organisation/person UUIDs, affiliation role/effective dates, site Operator/Owner/BillingParty separately, stakeholder purpose and evidence confidence.

**Transitions:** reuse current Prospect/Active/Inactive organisation meaning and existing effective affiliations. A proposed opportunity stakeholder can be Proposed → Confirmed → Ended, preserving previous role/evidence. Confirmation means the relationship was reviewed; it does not confer contractual authority or marketing consent. First slice only selects existing person context; new stakeholder model is later.

**Rules:** group hierarchy does not imply legal consolidation or access. Person identity and affiliation remain separate. Organisation owner is accountable for the relationship, not a permission grant. Site operator can differ from owner and billing party. A sales account plan is a company-scoped extension to the shared organisation, with objectives, sector/crop/territory facts, source date and review owner; no new editable legal-account master.

**Exceptions/recovery:** two similar names in different companies remain distinct; disputed identity produces a reviewed candidate decision, never an automatic merge. Site-party change uses a future effective successor/impact workflow; CRM cannot rewrite P02's original context or old service evidence. Former affiliations remain historical and filtered under current access.

**Audit/acceptance:** preserve role author/time, evidence date and previous relationship. Synthetic same-name organisations in two companies yield only the authorised selection; inaccessible affiliations, counts and source keys do not leak. CRM-01/04/06; PAR-01/07/09/15; CA-05/06/10.

### J3. Opportunity progression and next action

**Actors:** current owner with edit capability; manager only with explicitly granted scoped manage capability. **Preconditions:** Open opportunity, current pipeline-definition/stage, expected opportunity version and current next Activity context. **Inputs:** requested stage, reason, qualification/progression evidence, next action or explicit owned next-action-needed reason.

**Transitions:** stage changes within Open follow a versioned allowed-edge table. Backward movement needs a reason. Terminal close outcome is separate (see J6). First slice only permits Enquiry → Qualified; no arbitrary jumps, pipeline switch, close/reopen or policy editor. Proposed later pipeline transfer records old/new definition and mapped stage; it is never an in-place relabelling of history.

**Rules:** stage age comes from an immutable stage-entry event. No-next-action, unknown due date and overdue are separate conditions. Completing an Activity does not automatically move a stage. If the designated Activity becomes terminal without a successor, show Next action needed; never leave a completed activity presented as a future task. Closing or reassigning the pursuit does not silently cancel or transfer every linked Activity.

**Exceptions/recovery:** stale version returns a safe current comparison and retains proposed input for an explicit retry; no last-writer-wins. Owner loses access: mutation and receipt lookup fail; manager receives an authorised reassignment queue only within their own scope. Unknown response: reconcile original operation before creating another intent.

**Audit/acceptance:** preserve stage from/to, definition version, reason, actor/time and next-action link changes. Two concurrent transitions accept one expected version. CA-02/03/04/07/08/10; CRM-02/03; PAR-03/04/05.

### J4. Calls, meetings, visits and follow-up

**Actors:** activity owner, scoped coordinator, attendee/contact as a referenced person only. **Preconditions:** `activity.read/edit`, shared read/content-class permission and current permission for every linked target. **Inputs:** purpose, owner, due instant or explicit date-needed, links, planned channel/location when a future typed extension exists; completion outcome and occurrence basis.

**Transitions:** retain Activity Open → InProgress → Completed, or Open/InProgress → Cancelled. Only owner with current authority starts/completes/cancels; an authorised coordinator can reassign an active action to a currently eligible owner. Terminal content is immutable. A correction creates a successor or attributed note under a future explicit correction command.

**Rules:** visit preparation surfaces permitted contact preferences, site context, prior sales actions and reviewed customer-safe downstream references. A sales meeting does not reserve a technician or become a service Appointment. A logged call/email is user-reported activity, not Sent/Delivered/Accepted evidence. Recurrence is a separate series/occurrence design with timezone, exception and deduplication identity; do not generate repeated tasks until approved.

**Exceptions/recovery:** declined/unavailable contact produces an owned follow-up with reason; repeated click does not create duplicates. Concurrent completion and reassignment recheck owner/version transactionally. Failed save leaves unsaved state, not Completed. Poor connection shows unavailable/unsaved; no CRM offline storage claim.

**Audit/acceptance:** original due, actual user-reported occurrence, server completion, owner and outcome remain distinct. Completing a qualification call shows the outcome and next-action-needed state, and sends nothing. CA-04/08/13/14; CRM-03/04/07; PAR-05/06/07/10/14.

### J5. Estimating, quotations and alternatives

**Actors:** sales owner, estimator, commercial reviewer within their existing/future authorities. **Preconditions:** readable pursuit and exact estimating/document reference; no embedded price editor. **Inputs:** external/provider identity, estimate/option/revision, alternative-group membership, selected forecast basis and source date when supported.

**Transitions:** an estimating request is Proposed → Submitted → Accepted/Returned by its receiving domain; quote revision changes create successor references. Sales never marks an estimate approved or customer-accepted on the estimator's behalf.

**Rules:** one commercial pursuit can contain several options/revisions. Mutually exclusive alternatives contribute at most one approved forecast basis; explicitly additive work requires its own inclusion rationale. Estimated, quoted, customer-accepted and ERP-ordered values are separate facts. Unknown currency/tax basis or outdated source prevents a verified aggregate. Pricing/rates/discounts stay in authoritative Estimating/ERP contracts.

**Exceptions/recovery:** inaccessible or unavailable document remains unavailable, not a copied sales attachment that bypasses permissions. Superseded quotation keeps exact bytes/history and does not inherit acceptance. Downstream timeout becomes outcome unknown until the receiving domain receipt is found.

**Audit/acceptance:** retain the old option/revision link, selection reason and authoritative acceptance reference. Two synthetic alternatives of AUD 10,000 and AUD 12,000 in one exclusive group must never sum to AUD 22,000 as one forecast; no value is displayed until a basis is selected. CA-09/11; CRM-05; PAR-08/13.

### J6. Won/lost and controlled downstream handover

**Actors:** permitted sales closer; receiving estimator/service/project owner; Finance remains separate. **Preconditions:** required close evidence and current scope, exact offered/accepted version where relevant, named receiving owner for included handover. **Inputs:** close outcome, reason, effective date, customer acceptance evidence reference if it exists, unresolved items and proposed handover destination.

**Transitions:** Open → Won/Lost/Withdrawn; reopening creates an explicit event/reason preserving prior closure. Handover Proposed → ReadyForReview → Accepted/Returned/CancelledBeforeEffect is separate. These are later proposals; first slice never closes or creates downstream work.

**Rules:** Won is a sales outcome. It does not establish customer acceptance, ERP order, work authorisation, booking, revenue or payment. Source stage 'Order Confirmed' remains a stage. Product/parts handover needs catalogue and delivery constraints; upgrade/project handover needs exact scope/options/design assumptions; service handover references an existing permitted intake path. Warranty/return queries route to Service/Finance review and are not new revenue by default.

**Exceptions/recovery:** customer reserves part of scope, receiving owner returns missing detail, ERP existence unknown or identity unresolved: retain the sales outcome if supported, hold the downstream acceptance and assign the missing action. Duplicate handover requests reconcile on pursuit/revision/destination/operation identity. Do not silently fan out multiple work orders.

**Audit/acceptance:** separate sales close, customer response, receiver decision and external order references. A synthetic Won pursuit with no ERP evidence displays ERP order unavailable and creates no ERP state. CA-11/12; CRM-02/05/06; PAR-03/08/09/16.

### J7. Aftercare, renewals and reviewed growth

**Actors:** sales relationship owner, Service/Projects source owner and later agreement owner. **Preconditions:** independently readable permitted source outcome; source domain controls whether it is reviewable/customer-safe. **Inputs:** exact source event/revision, observation, review owner, next action/date or date-needed, potential need without assumed value.

**Transitions:** relationship review Open → InProgress → Completed/Cancelled. A future GrowthCandidate can be Proposed → Reviewed → Pursue/NoAction/NeedsInformation; Pursue can create an opportunity idempotently. A renewal review does not auto-renew an agreement.

**Rules:** service observation can suggest a review, never a customer commitment. Technical defect/remaining-work ownership stays with Service, report/customer-response ownership with P09, charging/reconciliation with P10. Closing sales follow-up does not close technical work. Training completion and contract renewal require their own evidence.

**Exceptions/recovery:** disputed report, unavailable respondent, restricted internal finding or changed source revision holds the sales interpretation. The source owner can publish an authorised summary; CRM does not relax its permission or copy confidential technical/Finance content. Replaying an event creates one review action, with separate source-event and action IDs.

**Audit/acceptance:** preserve reviewed source reference, decision/reason and the person who accepted follow-up responsibility. Synthetic 'controller may need upgrade' stays a review proposal until a sales owner qualifies it. CA-12/13; CRM-07; PAR-10/11.

## 4. Shared-platform integration note

Inspected physical sources: [migration 0002](../../db/migrations/0002-shared-foundation.sql), [migration 0003](../../db/migrations/0003-customer-intake.sql), [permissions](../../src/platform/permissions.ts), [activities](../../src/activities/activities.ts), [shared authority](../../src/shared/authority.ts), [reads](../../src/shared/reads.ts), [operations](../../src/platform/operations.ts), [receipts](../../src/shared/receipts.ts); ADR-0007/0008/0013 and current service dictionary/API/document/Finance contracts. Existing logical future-state text is not evidence of implementation.

| Concept | Implemented foundation at starting main | Proposed CRM use or smallest extension |
|---|---|---|
| Group/account | `organisations`, same-company `parent_organisation_id`, owner, sector, legal/display names | Reuse for relationship groups; group hierarchy grants no access or ERP consolidation. Dedicated account-plan child later |
| Visibility company | Organisation/Site have permanent company context | Opportunity has one fixed `company_id`; cross-company sharing/consolidation needs separate future junction/grants and decision |
| Site parties | `site_parties`, effective Operator/Owner/BillingParty, company FKs | Show roles individually; current operator never rewrites historic customer/service context |
| People | Workspace `people`, `person_company_contexts`, effective `relationships` | Reuse UUID; validate person in company and affiliation; optional opportunity stakeholder child later. No duplicate Person for each account |
| Facility/equipment | Typed site/company facilities/assets, configurations and history | Read through existing scoped projections; CRM cannot verify uncertain assets or move them |
| External identity | ERP connections and account mappings with exact provider/company/entity key; Proposed mappings and restricted key projection | Do not use ERP customer mapping to store Pipedrive deal IDs. Propose typed external-source connection/mapping extension with tenant/company/entity context, reviewed separately |
| Activity | Five kinds: TechnicalFollowUp, CustomerContact, MaterialAction, FinanceQuery, RelationshipReview. UUID only; Open/InProgress/Completed/Cancelled | Reuse lifecycle/categories initially; add typed Opportunity target, same-company/site constraint and target visibility. Opportunity and Person links do not exist now |
| Activity content/access | Internal/RestrictedService/RestrictedFinance; all links must be readable; owner grants no access | Use Internal sales actions plus explicit shared.internal.read initially. No new 'public sales' class disguised as RestrictedService |
| Attributed history | `history_records` is site/asset-oriented and append-only, with original author/time and captured context | Do not invent a generic opportunity target there. OpportunityEvent/Note extension must retain the same provenance principles; shared audit remains common |
| Documents | Existing bounded Synthetic DocumentReference and pack/file issue mechanisms | No general CRM upload/SharePoint connector. Reference exact authorised document identity/version; new audience/link support is later and must not modify report contracts casually |
| Identity/reference registry | Typed `business_identities`, atomic workspace/type references, deferred target checks | Add Opportunity typed target and OPP allocator under a future forward migration. SYN-PPO-OPP is reserved naming, not an existing entity |
| Permission/receipts/outbox | Current typed capability unions, SQL constraints, target-specific receipt authorisation, atomic sharedOperation | Add CRM capabilities/record dispatch and minimal typed events; retain old accepted normalisation/hashes and P09 cases |

**Parallel boundary:** P09 issue #36 / draft PR #37 at `54abe1f4c30272095088d9f5e6a1b13e2547d708` was inspected at discovery start. It reserves ADR-0014 and migration 0009 and changes `permissions.ts`, `receipts.ts`, layout, workflows and service/report code. It is not treated as merged or accepted. This package allocates no ADR, API-C/API-R or migration number and changes none of those physical contracts. Future implementation must allocate against then-current main and reconcile unions/dispatch rather than replacing them from P08. The [starter](../delivery/crm-first-increment-starter.md) requires this check.

Likely shared documentation overlap: STATUS, blueprint index, document/decision registers and prototype traceability. CRM changes are small appended scope notes; PP-01 classifications and acceptance states stay intact. P09 retains immutable submissions, reviews, report issue/revision and content-bound responses. CRM references permitted eventual outcomes only; P10 retains financial disposition, posting and reconciliation. No CRM event is a surrogate completion of either increment.

## 5. Candidate data contract (all CRM additions proposed)

Mutable records follow current UUID/workspace/company/version/server actor/time/synthetic conventions. Immutable events/revisions retain exact predecessor, original author/occurrence/source and server capture separately. UUID links use real composite FKs; no arbitrary UUID in a generic JSON relationship. Null means unknown. Field ownership below is the target proposal; current operational authority is in section 8.

| Candidate | Minimum fields and validation | Lifecycle / ownership |
|---|---|---|
| Opportunity (first slice) | `id`, `display_number` allocated OPP, fixed `company_id`, existing `organisation_id`, optional `site_id`/`primary_person_id`, explicit unknown reasons, `title` 1–200, `need_summary` 1–2000, `owner_id`, `pipeline_definition_id`, `stage_id`, `close_outcome`, `next_activity_id` or next-action-needed reason, `version`, `source_channel` | First slice Open only; later Won/Lost/Withdrawn with events. CRM owns synthetic sales facts; shared records retain their owners |
| PipelineDefinition / StageDefinition | Immutable definition revision, label, stage IDs/order, allowed edges and entry requirements; same-context FK | First slice fixed published synthetic config; no general editor. Later effective successor and explicit impact review |
| OpportunityEvent | Opportunity UUID, event type/schema, from/to stage or changed-field summary, actor/time, operation ID, definition revision, reason | Append-only; creation/progression/qualification audit. No unfiltered restricted content in generic event payload |
| Opportunity qualification | First slice recorded need, contact or identification action, qualification note 1–2000 and exact stage event | Sales assertion, not evidence of credit/discount/budget authority |
| Activity extension | Opportunity typed target in `activity_links`; fixed company/site/access context; Opportunity's designated action references an Activity genuinely linked to it | Reuse current Activity state and owner rules. Existing non-CRM activities/commands unaffected |
| LeadCandidate (later) | Source ID/type, person/organisation, need, owner, qualification state, disqualification reason, converted opportunity and conversion event | Conditional on PAR-02; one accepted conversion per source lead, preserves source ID |
| Stakeholder / AccountPlan (later) | Opportunity/organisation UUID, person/affiliation, role, evidence/confidence, validity; plan objectives, crop/sector/territory, owner, review action | Role not approval authority; territory not access grant. Effective successor history |
| PursuitOptionReference (later) | Exact estimating source/revision; exclusive-group ID or additive scope; selected forecast basis/reason, currency and tax basis if provided | Estimating owns option/price/version; CRM owns reviewed pursuit association, never copied price master |
| SalesNote / CommunicationReference (later) | Typed opportunity/context, content class, original author/time, source connection/entity/key/version, capture actor/time; note predecessor | Append-only corrections; source message controls original bytes and recipient/delivery facts |
| ExternalSourceMapping (later) | Workspace/provider/connection/tenant/company/entity/external key, PPO target, mapping version/status, source update/as-at/deleted marker | Proposed/Reviewed/Exception; exact source IDs preserve leading zeros/case; generic support needs a separate physical review |
| SalesHandover / GrowthCandidate (later) | Source pursuit/revision or reviewed downstream event, intended destination, receiver, missing items, status/reason, deduplication key and receipt | Receiving domain owns acceptance; CRM owns pursuit/review, never service/ERP processing |

First slice scope is fixed on creation. Changing organisation/site/company after linking requires a later impact-aware successor/reassociation command. A broad PATCH may not alter context to bypass immutable Activity links. Additional fields are introduced only with their acceptance cases; no unbounded custom-field JSON store is proposed as a shortcut.

## 6. Proposed commands and read models

Names below are local BP-03 proposals, not allocated API-C/API-R identifiers or implemented routes. Route family candidate: `/api/v1/crm/opportunities`. Common envelope follows the [service API](../contracts/service-api.md); preserve existing commands and hashes. Body ceiling candidate 64 KiB, unknown keys rejected, UUIDs exact, `schema_version=1`, positive safe `expected_version` on mutations, explicit `operation_id`, bounded reason; server actor/workspace/state/audit fields cannot be supplied.

| Command / candidate route | Guards and atomic result | Slice |
|---|---|---|
| CreateOpportunity / POST collection | Current create/shared/internal/activity authority; permitted same-company org/site/person; owner can access all links and edit; valid entry definition; creates Opportunity + initial Activity/link + event/audit/receipt/outbox atomically | First |
| RecordQualificationAndProgress / POST `/:id/qualify` | Current owner+edit or scoped manage, Open+Enquiry, expected version/definition, need and contact/owned identification action; records qualification and Qualified stage event | First |
| PlanOpportunityAction / POST `/:id/next-action` | Expected opportunity version; new Activity input or an existing Open/InProgress same-context permitted linked Activity; owner eligible; atomically designate and bump pursuit | First |
| Start/Complete/Cancel Activity / existing activity routes | Extend target validation/visibility only; retain existing operation hash behaviour. Completing designated action yields derived next-action-needed until replaced | First |
| UpdateOpportunity / POST `/:id/save` | Later bounded editable narrative fields with expected version; no state/context/owner backdoor | Later |
| TransferOpportunityOwner / POST `/:id/transfer-owner` | Scoped manage permission; eligible new owner; reason; open Activity reassignment preview/explicit decisions and versions; no automatic access grant | Later |
| Close/Reopen/TransferPipeline / dedicated routes | Typed transition, exact evidence/definition, state-specific guards and history; no downstream acceptance inferred | Later |
| SubmitSalesHandover / dedicated route | Exact source revision and independently validated destination authority; one request/receipt per command; receiving owner accepts separately | Later |

Lock order follows current sharedOperation operation/workspace strategy and locks affected opportunity/action rows deterministically; inspect then-current implementation before extending. Denied checks occur before receipt replay; accepted original receipt is immutable. Same key/different normalised content is a conflict. Unknown response uses existing operation lookup extended for Opportunity with current permissions; it never blindly creates a new operation. Side effects are minimal outbox records; no sending consumer is enabled.

| Read model | Proposed contract |
|---|---|
| Sales worklist / opportunity list | Actor/company/stage/owner/next-action filters; literal bounded search; default 25, maximum 100; signed actor/workspace/filter/size-bound cursor and stable UUID ordering. No arbitrary sort/filter expression |
| Opportunity detail | Permitted facts, current version/definition, authorised action flags, next Activity projection and safe history; hidden related record cannot expose title, existence count or source key |
| Pipeline board/list | Same visibility predicate and dataset; per-stage pagination/truncation explicit. First slice has list; board later. Counts/aggregates execute after permission filtering and show as-at/completeness |
| Owner/context selectors | Bounded eligible users/organisations/people/sites; no unscoped directory or raw grant list. Submitted values revalidated at command time |
| History/documents/downstream | Independent target/file permission at read time; exact revision and provenance. Unavailable is distinct from empty. Restricted service/Finance notes are never copied into sales summaries |

Errors: 400 invalid envelope, 413 oversized body, 422 field/business validation, 403 missing capability, indistinguishable 404 for missing/out-of-scope target, 409 expected-version/operation-content conflict, 503 unavailable/retryable failure. Align exact current error codes at implementation; these proposed semantics do not overwrite service responses. Error bodies contain safe correlation and permitted current versions only, not hidden target identities. Server reads use current grants, including revoked access during export or file download.

## 7. Proposed capability and scope matrix

This describes capabilities to implement in synthetic fixtures, not approved Powerplants job roles or live Pipedrive settings. Existing Workspace/Company/Site scopes remain. **Read** always means capability AND applicable record scope AND content-class permission AND independently authorised linked content. An owner/manager label grants nothing by itself. Systems has no default business access.

| Action | Ordinary scoped sales reader | Opportunity owner with edit | Scoped sales manager | Restricted information / limits |
|---|---|---|---|---|
| Direct read/search/filter | `crm.opportunity.read` + `shared.read` + initial `shared.internal.read` | Same | Same | Suppress inaccessible related data before projection/filter/count |
| Create | Only with explicit `crm.opportunity.create` and Activity permissions | Same; owning existing record is insufficient | Same | Eligible owner/context checked server-side |
| Qualify/progress | Denied | `crm.opportunity.edit` and current ownership | Explicit `crm.opportunity.manage` in scope | First slice synthetic owner path; no implied sales approval policy |
| Plan next action | Only with scoped edit/manage and Activity edit | Allowed with every target/content grant | Allowed with explicit capabilities | Action owner must be eligible; designated action's scope fixed |
| Complete/cancel action | Only its owner with activity.edit | Opportunity ownership alone insufficient | Manager must explicitly reassign first | Terminal history immutable |
| Transfer owner | Denied | No implicit self-transfer permission | Dedicated manage permission + eligibility + reason | Transfer neither grants new access nor revokes independently granted company access; test policy explicitly |
| Restricted internal/Finance/service | Independent content and domain grants | Same | Same | Sales role never broadens Finance or P09 report rights |
| Totals/forecast/dashboard | Only permitted records and approved measure capability | Same | Same | Missing data ≠ zero; no hidden-item counts or unapproved money basis |
| Export | Disabled first slice | Later explicit `crm.export` plus current read on every row/field | Same, no blanket manager export | Expiring download and access recheck; source keys need separate entitlement |
| Files/history | Independent exact target/file checks | Same | Same | Link access does not grant file access; no persistent public file URL |
| Delete/archive/merge | No destructive delete first slice | Later archive capability; preserve accepted IDs/history | Reviewed identity merge workflow later | Legal retention/deletion policy unresolved; source deletion is a tombstone, not erasure authority |
| Permission/config administration | None | None | None by default | Separate future administration, not this workstream |

Revocation test surface includes direct GET, search terms, selector matches, aggregates, nested Activity/title/outcome, operation receipts, file URLs, export generation/download and session switching. Hidden record and nonexistent record share a safe response. Site-scoped observers must not infer company-wide pursuits from organisation hierarchy or counts. Previously rendered content clears on identity change. Existing P08 recovery capability authorises no CRM cache or read.

## 8. Coexistence, field authority and migration design

### One writable authority by phase

No phase transition occurs in this package. **Now** includes discovery and synthetic implementation. **Rehearsal** means a later separately authorised isolated copy with outbound integration disabled. **Accepted transition** requires D-013/D-025/D-026 and receiving-owner acceptance, and may apply to only selected capabilities.

| Field family | Now / synthetic development | Later rehearsal | After accepted capability transition (proposal) |
|---|---|---|---|
| Operational prospects, deals, stages, sales ownership and next actions | Pipedrive writable; PPO synthetic only | Pipedrive remains operational writer; immutable source snapshot staged in isolated target | PPO writes accepted CRM scope; corresponding Pipedrive fields read-only by separately authorised procedure; no dual write |
| Legal account, credit, products/prices, orders and Finance facts | MYOB intended authority; exact ownership/configuration must be verified | Read-only reviewed mapping, no invented verification | MYOB stays authority; CRM consumes permitted dated projection |
| Shared relationship/site/person descriptive facts | Existing operational source owners retained; PPO synthetic shared tables own fictional facts | Per-field approved source mapping, conflicts quarantined | Nominate one owner per field before enablement; no silent choice between CRM/ERP/SharePoint |
| Business documents/issued content | Existing repository/source owner; SharePoint intended destination | Preserve exact source/version/hash in authorised staging | SharePoint/document domain owns files and retention; CRM owns only permitted association |
| Email/calendar originals | Mail/calendar provider and existing Pipedrive configuration | Read-only evidence where separately approved | Provider owns originals; PPO may own approved CRM intent/links under explicit direction and conflict rules |
| Service reports/customer responses | P09 source domain as actually delivered | No reinterpretation by CRM importer | Service/report domain owns content/response; CRM reads permitted references |
| Field quantities/billability/ERP processing | Service and P10 Finance boundaries | No sales conversion into billable quantities | Finance remains separate authority |
| Sales aftercare plan | Existing operational workflow; PPO proposals only | Source review and explicit owner mapping | CRM owns accepted relationship actions; technical remaining work stays in Service |

For any field not explicitly mapped, retain source operation and mark target read-only/unmapped. A coexistence contract must name source, writer, projection, conflict owner and handback process; 'two-way sync' is not an ownership decision.

### Mapping and preservation protocol

1. Establish exact account/tenant, connected actor/visibility limits, company mapping, snapshot cutoff/timezone and authorised scope. Retain extraction method/version/filter/pagination and completeness evidence outside Git. Do not infer tenant from stage IDs.
2. Inventory field metadata by exact API key, type, enum IDs/labels, required rules and visibility. Map standard/custom fields and pipeline/stage/close outcomes separately; preserve unmapped source values with an owned exception. A deleted option label cannot be silently replaced by its successor's meaning.
3. Resolve identities through reviewed source-key matches. Duplicate candidates preserve originals, score/basis and reviewer decision; no automatic match by name, phone, email or parent company. Cross-company candidates remain separate until an explicit sharing/consolidation extension exists.
4. Stage organisations/people/affiliations and sites before dependent pursuits/actions. Resolve contacts with several affiliations, removed owners and source records with missing targets through exception queues. Historical author labels remain distinct from current PPO users and import actors.
5. Map activities with owner, due date/time/timezone and unknown-date meaning, completion/cancellation, original occurrence, links and recurrence provenance if present. Notes/history preserve original author/time, exact source entity/key/version and current restriction. A flattened export does not prove original event history survived.
6. Inventory files separately: source file/document IDs, version, owner/audience, byte size/hash and readable source reference. Preserve exact issued content and permission evidence; generic source URL is a locator, not identity or enduring permission. Quarantine unavailable/unsafe files with owned remediation; do not report them as migrated.
7. Preserve archived/deleted markers and unsupported history as explicit source states. No source deletion authorises destructive target deletion, erasure of audit or freeing references. Retention/hold/disposal decisions remain open and may require restricted retained-source access.
8. Initial extraction and subsequent changes need separate evidence. Proposed change key is `(connection, tenant, company, entity, source_id, source_version/event_id)`; where source lacks monotonic versions, retain update time plus canonical payload hash and overlapping extraction windows. Do not claim exactly-once source delivery. Upsert only after current mapping/permission/reconciliation rules pass; preserve import-run receipt and idempotent target effect.
9. Reconcile counts by entity/status/company and extraction scope, FK/link coverage, field values, sampled narratives/author/times, file hashes, stage histories and approved monetary definitions. Record excluded/hidden/unavailable/deleted items explicitly. Equal totals alone do not establish completeness; missing visibility prevents a whole-account conclusion.
10. Rehearse baseline + overlapping delta + duplicate delivery + concurrent source edit + missing owner/file/history + revoked access + restart. Track each exception with type, source identity, accountable owner, next action and resolution evidence; never bury it in a log. Only approved synthetic/redacted evidence belongs in the repository.

### Cutover and rollback criteria (future, unapproved)

Require an accepted PAR outcome/disposition for every used capability including residual integrations; reviewed field/identity/permission mapping; original history/file access; successful initial/delta reconciliation and restart replay; trained users and agreed support/exception owners; explicit operational write freeze and final delta; signed receiving-owner acceptance and rollback decision authority. No assumed defect tolerance or retention deadline is supplied. AT-25 alone is insufficient without applicable AT-01/02/20/21/23/24/34/35 outcomes.

Rollback separates application release rollback from business-state handback. Stop new target commands, preserve post-cutover changes/receipts, reconcile all uncertain operations and return only reviewed deltas to the chosen source writer under new authority. Do not restore an old database over new communications/orders, resume both writers or replay issued effects. Retain authorised historical Pipedrive access until its accepted history treatment is proven; retiring any capability requires explicit approval.

## 9. Communications and automations under D-025

Current connector cannot inspect mailboxes, calendar settings, automation definitions/runs or installed integrations. Owner evidence is required before asserting actual use. First implementation remains online, manually recorded activity with no sending. Product behaviour below was checked on 6 September 2026; it is not evidence of account entitlement.

Pipedrive documents one-way calendar creation from Pipedrive to the provider and two-way creation. It also says provider edits to a linked event can update its Pipedrive activity even under one-way mode. Therefore mapping direction must distinguish creation from subsequent edits. Its article describes owner-bound activity sync, limited recurring-event editing and visibility dependence on all linked items. These behaviours must be rehearsed if used. [Official calendar sync](https://support.pipedrive.com/en/article/calendar-sync).

Pipedrive documents configurable email sync and visibility. The source mailbox, selected folders/history and filing permissions must be established before any target scope is designed as accepted. An email activity or tracking/open signal is not proof of delivery or customer acceptance. [Official email sync](https://support.pipedrive.com/en/article/email-sync).

| Future integration | Proposed ownership/recovery contract | Evidence required before build/activation |
|---|---|---|
| Email reference/filing | Provider owns original message; exact mailbox/message/thread/attachment IDs; dedup by provider context and source ID; explicit filing/visibility on each record | Owner-redacted sync/privacy settings, one safe message-link walkthrough, supported API rights and history scope |
| Calendar | Provider event UID/instance/recurrence/version and PPO Activity ID; separate create/update/cancel direction, timezone and private-event handling | Current calendars, sync settings/types, edit/delete and recurrence examples; no implicit attendee invitation |
| Internal notification | Durable outbox + recipient/current scope; one effect per trigger-event/rule-version/recipient/channel; pause/retry/reconcile | Accepted trigger/conditions, recipient selection, notification preference and support ownership |
| Automation | Versioned definition, acting principal/scope, source event, conditions, target effect, run/attempt history; access rechecked when run | Used automation list plus one representative definition and failure/retry history; not just a count |
| External send | Separate approved intent, send attempt, provider receipt, supported delivery fact and explicit response | Channel, authority/consent, recipient evidence, actual provider idempotency/reconciliation behaviour |

Transient failure retries with a bounded policy after current permission checks; permanent validation or permission failure goes to an owned exception. An uncertain external outcome is reconciled by provider correlation/source identity before retry. No blind resend after timeout. A rule replay creates no duplicate effect; rule edits require a new version and intentional replay policy. No activation, webhook, mailbox connection or invitation is part of discovery or the first slice.

## 10. Measures and reporting proposals

REP-01 stage ageing = elapsed time from last stage-entry event to as-at, with reopen/transfer events explicit. Next action overdue compares the chosen known due instant; unknown due or no designated action is a separate bucket. REP-02 conversion needs an approved cohort/window/denominator and treatment of reopened, withdrawn and duplicate alternatives. REP-03 account planning shows owned actions/review freshness, not invented sales targets.

Weighted forecasts are deferred until an approved amount/currency/tax basis, option selection and probability rule exist. Stage probabilities observed in Pipedrive are configuration evidence, not revenue recognition or accepted target calibration. Mixed currencies, missing basis and incomplete source scope cannot become a verified total. Filters, boards and dashboards must report permitted rows, as-at time, completeness and failed-source states consistently. No revenue, margin, balance or order KPI is added by this blueprint.

## 11. Requirement coverage and acceptance

| Parent | Blueprint scope | Parity | Proposed evidence / sequence |
|---|---|---|---|
| CRM-01 | J1/J2, sections 4–8 | PAR-01/02/07/15 | CA-01/05/06/10; increments I1/I2 |
| CRM-02 | J1/J3/J6, progression/close distinction | PAR-02/03/04 | CA-02/03/07/11; I1/I2/I3 |
| CRM-03 | J4, Activity extensions, communications | PAR-05/06 | CA-04/08/10/14; I1/I4 |
| CRM-04 | J2/J4, account plan, territory/visits | PAR-07/14 | CA-05/13; I2/I5 |
| CRM-05 | J5/J6, alternative/estimate/order lineage | PAR-08/13 | CA-09/11; I3 |
| CRM-06 | J2/J6, scoped downstream/source view | PAR-09/15 | CA-06/10/12; I3/I5 |
| CRM-07 | J7, reviews/renewals/growth | PAR-10/11 | CA-12/13; I5 |
| CRM-08 | Account parity, communication/mobile/migration/residual inventory | PAR-01–PAR-18 | CA-14/15/16 and full accepted AT-25; I2–I6 |

CA identifiers are BP-03-local acceptance design cases defined in the [implementation plan](../delivery/crm-implementation-plan.md#acceptance-catalogue). They do not replace master AT or PP-01 PT IDs. All CA cases are **Not run**. The complete AT-25 text includes approved CRM outcomes, history, permissions, migration and automation/mobile behaviour; neither this blueprint nor its wireframes makes it pass. Existing AT/PT statuses and all 78 parent identities are preserved.

The first slice is sufficiently specified for a later authorised synthetic implementation, subject to live shared-contract reconciliation. Operational pipeline/lead, licence, communication, permission, history and cutover decisions remain provisional; the [evidence requests](crm-parity.md#4-smallest-useful-evidence-requests) identify their practical impact and proposed owners.

## Controlled owner handover proposal — design only

The separately invoked [contract/design package](../delivery/crm-handover-design-handover.md) under #55 follows verified I2 publication. Its [decision table](../decisions/crm-opportunity-handover.md) proposes current-owner initiation with a distinct scoped own-transfer capability, immediate effect and current-authority recovery of proven original operations. H-01–H-03 await Dean; publication does not accept them. For this bounded candidate, it refines the broad manager-only transfer proposal in sections 6–7; it does not implement that manager role or a transfer grant.

The [physical/interface map](../contracts/crm-opportunity-handover.md), [canonical C03 journey](crm-handover-journey.md) and [future HV matrix](../testing/crm-handover-verification.md) preserve immutable original qualification, separate Activity/estimate/Finance ownership, all-target access and accepted hashes. I1's current immutable owner remains the implemented contract. All HV cases are Not run, AT-25 remains Planned and #9 stays open. The conditional implementation starter needs policy decisions and a new invocation.

## 9 September 2026 — approved desktop/mobile refinement implementation

The [CRM refinement decision](../decisions/crm-desktop-mobile-refinements.md) supersedes the first slice's presentation-only boundary for title/contact editing, optional AUD value/expected close, structured requirements and reversible Enquiry/Qualified changes. Strict dedicated commands and migration 0017 preserve original context, ownership, Activity links, exact history and receipt authority. The six-stage reference, sales close/handover, facility taxonomy and source integrations remain separate increments. Desktop snapshots/tables and mobile full-deal/lists use current permitted records. See the [handover](../delivery/crm-refinements-handover.md) for actual verification and publication; parent IDs and issued sources remain unchanged.
