# Project commercial controls contract

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Prepared: 14 October 2026. Status: user-authorised synthetic backend design; implementation follows the completed CPQ handover on isolated codex/pj05-commercial-controls. Independent automated review is recorded in the execution evidence; business policy and owner acceptance remain open.

Scope: BC-06 / PJ-05 with BC-07 / FN-06 definitions. Parent scope: PRJ-01/PRJ-05/PRJ-08, FIN-05/FIN-06/FIN-07/FIN-08; FD-08; D-017/D-020; AT-31/AT-38. This extends [BP-06](../blueprints/BP-06-projects-commercial-delivery.md). The [Finance definitions](project-commercial-finance-definitions.md) govern every amount projection. [Decision](../decisions/project-commercial-controls.md) records alternatives and authority.

## Outcome and bounded first delivery

An authorised commercial preparer selects one existing Active Project with an explicitly received Won Sales handover and exact reported-accepted quotation. They propose a commercial basis from that source plus a reviewed synthetic contract document, record owned obligations and notices, and submit a priced variation for independent decision. A Finance reader can distinguish original value, approved change and unresolved exposure, recover exact history, and see changed or unavailable source evidence.

This increment does not create or alter a quotation, Sales outcome, Project schedule, purchase order, reservation, invoice, receivable or payment. It sends no notice or customer message. A synthetic commercial decision is not legal entitlement or operational approval. A full FN-06 configuration/publication workbench, FN-03/04/05 calculations, independent-order contract bases, arbitrary currencies, tax determination, automatic deadlines, multiple contracts per Project, and native page controls are subsequent increments.

## Existing authorities and exact basis

1. Reuse native Project visibility and current customer/site relationships. A closed Project refuses new mutations; permitted reads and original-operation recovery remain available.
2. Select an actual `sales_delivery_bindings` Project link to an accepted Won handover. Verify its original acceptance event, same company/customer/site and destination, current handover state and source hash. A title or pasted Sales reference is insufficient.
3. Select an exact native quotation issue and response associated with that same opportunity. Reuse `responseContext` and native outcome-source validation. Require the current issued revision, ready reported Accepted response without unresolved conditions/clarifications, exact response event/sequence and issue/output hash. A Draft quote, independent Won narrative or accepted handover alone cannot supply this proof.
4. The original value is derived by the server from the exact quotation's retained safe snapshot, under its existing AUD/excluding-tax contract. It is never taken from the Deal's proposed value, a browser total or the newest estimate. Verify complete native quote amounts; an unknown or incompatible amount prevents basis submission.
5. Select a current exact LibraryDocument revision, independently Reviewed with no unresolved findings and no findings added after that retained review (including subsequently closed findings), in the Project's company/customer and matching site (or explicitly company/customer-wide applicability). Require current document/source access. Freeze document/revision/review IDs, content hash and the stated clause locator. This remains declared synthetic source evidence, not verification of external contract meaning.
6. Every saved basis binds these exact identities and retained source evidence. New submission/approval rechecks current validity. Later source change never replaces those references or erases the accepted history; reads distinguish Current, Changed and Unavailable. Source changes hold fresh dependent approvals until a separately specified revalidation/successor contract is available.

## Actors and permissions

Default-denied capabilities are `project.commercial.read`, `project.commercial.prepare` and `project.commercial.review`. They apply at the existing company/site scope and confer no automatic grant. Every actor also needs current native Project read and relevant exact source permissions. The current Project coordinator creates the original basis and assigns its eligible owner. The coordinator or that already recorded basis owner may create dependent obligations, notices and variations. Subsequent preparation is restricted to the coordinator or that record's recorded owner with the preparation duty. A proposed owner never grants creation authority; the initial owner remains fixed in this increment. Owner reassignment requires a later controlled contract and never inherits permission.

A reviewer must hold the review duty and differ from the proposer, the submitted revision author and its submitter. A changed proposal requires a new submission; review cannot change submitted content. Finance projection additionally requires native `finance.read` and `shared.finance.read`; a broad Project read alone must not disclose commercial values. The API defines required duties per command and receipt, with no authorisation based on screen labels or source team membership.

Reviewer/source owners are existing active scoped users. If a responsible user loses eligibility, keep the original record and expose remediation only to currently authorised readers. Revoked read permission must block list/detail/history, source options, calculations and recovery alike. Inaccessible source identifiers and counts are not disclosed.

## Records and versioning

Use stable UUIDs, immutable revisions and explicit references within existing PostgreSQL and transaction services. Migration 0101 adds immutable entries, source bindings and events; no seed or grant. Existing UUID identities and native audit/receipt/outbox infrastructure are reused.

| Record | Retained content | Invariants |
|---|---|---|
| Commercial basis | Project/company/customer/site, commercial owner, exact Sales binding and acceptance, quote/revision/issue/response, original AUD amount, reviewed contract document/revision/clause, scope/exclusions, definition version | At most one approved original basis per Project in R1; source and amount do not silently refresh |
| Basis revision and decision | Complete proposal, source snapshot/hash, author, version, reason; separate submitted and independent decision events | Approved original is immutable; returned drafts can produce a successor revision; earlier versions remain exact |
| Obligation | Basis, title, clause/reference, owner, explicit due date or date-needed, requirement/evidence, state and optional native Activity links | Obligation ownership and due date do not create legal duties or calculated deadlines; linked Activities keep their own lifecycle |
| Notice evidence | Basis, clause, narrative evidence (including any recipient description), reported occurrence instant, original reviewed basis document, author/reason and predecessor notice ID for correction | Staff-recorded evidence of a notice only; no Sent/Delivered/LegallyServed claim and no outbound action |
| Variation | Basis, title/scope/exclusions, owner, source clause/document, requested and separately priced signed amounts, explicit date impact proposal, state, supporting evidence, optional corrected-approved-variation reference | Requested/priced/approved values are different facts; approved terms freeze the exact submitted revision |
| Decision | Exact basis/variation/event version, retained source hash, outcome, rationale, reviewer, server time and immutable decision evidence | No self-review; at most one decision for a submission; changed terms need a successor submission |

Every command carries the native operation ID, schema version, reason and expected record version. Header and revision changes, source snapshots, audit, receipt and native synthetic outbox evidence commit together. Native workspace transaction locking and exact record versions prevent two concurrent basis approvals or unseen aggregate changes. Use foreign keys/checks to prevent cross-Project, cross-company and orphaned evidence, plus the established immutable-evidence guards.

## Native page contract — PJ-05

The register at `/projects/commercial` reads one chosen project. `/projects/[id]/commercial/[entry]` opens Basis, Variation, Obligation or Notice on the shared record layout. The menu exposes Variations & obligations. The Project record Commercial view is excluded while PR #698 remains unmerged.

Commercial reads add internal owner/actor names only after source and Activity visibility succeeds, retain the distinct stored reason and note, and return project context and current command-duty hints. Independent-review eligibility checks every Create, Revise and Submit author, not only the current history page. Commands remain the final authority. Current Activity states drive the blocked satisfaction explanation and per-row open/closed counts. Notice correction status is derived from the native successor chain: Latest, Corrected or Unavailable when the successor cannot be read. It does not add a stored state, disclose an inaccessible successor ID or change the native latest-only correction command.

Register reads scan authorised entries, sort by latest change with ID as a deterministic tie-break, and retain signed visible-record cursors. Complete counts are returned only for a fully visible unpaged result; a partial result exposes no hidden IDs or hidden count. The UI follows pages before grouping and suppresses complete counts if any page is partial or its 4,000-record display bound is reached. Refreshing restarts paging; a vanished cursor requires a fresh read. Within one read transaction, identical retained-basis authority and status checks are reused per basis; Activity visibility is still checked per record, and no result survives the request.

The existing basis-options route also accepts `picker=owners|activities|handovers|quotations|documents` and optional search `q`; quotation choices require `handover_id`. Choices are permission checked and do not confer authority. The original three-ID basis-options read resolves and verifies the exact combination; Create rechecks it. Picker results are capped at 100 with `has_more`, without disclosing inaccessible candidate counts.

Decision dialogs omit prospective control values under G8. Existing Finance reads remain the sole source of control totals; access failure is Unavailable, never zero. Known subtotal is labelled incomplete. The UI keeps original pending command bytes and operation ID in scoped session storage before sending; uncertain outcomes lock editing until a confirmed original receipt or unchanged retry succeeds. No offline records or My Work items are added.

## Lifecycle rules

**Basis:** Draft -> Submitted -> Approved or Returned. A returned basis can revise narrative content and be submitted again. Its exact source selection is fixed; a different source needs withdrawal and a separately created draft before any original has been approved. A preparer may Withdraw an unapproved draft/submission with a reason. Approval requires complete exact source evidence and an independent reviewer. Once approved, the original is retained without editing or replacement in R1.

**Obligation:** Open -> Satisfied or Waived. Open revisions may correct date/evidence with an explicit reason. Satisfied requires exact completion evidence; Waived requires an independent commercial review and source rationale. Reopening is a reasoned successor event retaining the previous disposition. Completing an Activity does not satisfy an obligation automatically. All linked Activities must be Completed or Cancelled before a terminal obligation disposition; this first slice does not implement an explicit remaining-action exception.

**Notice:** append-only RecordedEvidence. A correction creates a successor linked to the prior notice, with its own exact evidence and reason. Date is explicitly reported, never calculated from a clause. No future occurrence date may be represented as already occurred. Intended future notice work belongs in an obligation/Activity.

**Variation:** Requested -> Assessed -> Submitted -> Approved, Rejected or Disputed. Assessed requires an explicit priced amount and rationale; requested amount may remain unknown. Only an exact priced submission can be approved. Rejected/Disputed proposals may be revised and resubmitted while their earlier decisions remain visible. A preparer may withdraw any unapproved proposal with a reason. Approved variations cannot be edited, withdrawn or re-decided; an explicit separately reviewed signed adjustment refers to the original. That adjustment contributes its own delta once, never replaces the original amount.

Approval records the submitted priced amount as approved change; a reviewer cannot silently supply a different amount. Different terms require a returned/disputed proposal and fresh pricing/submission. Requested, priced and approved amounts may be negative; explicit zero is distinct from unknown. Date impacts remain proposals and do not update Project forecasts or Service bookings. Any aggregate guard, such as refusing a negative adjusted control value, must be documented as a synthetic rule and covered by independent fixtures before implementation.

## API surface

The implemented root is `/api/v1/projects/:id/commercial`, using native local/hosted identity, same-origin protections, strict schema validation and private/no-store responses.

| Endpoint | Contract |
|---|---|
| GET root | `kind`, native `limit`/`cursor` paging; permitted current records with source status. No count of restricted records. |
| GET root?id=UUID | Current record and 50 immutable events descending; `before_version` pages history. Exact original source is returned only under source authority. |
| GET /basis-options | Explicit `handover_id`, `quote_revision_id`, `document_id`; returns exact eligible source input and server-calculated original amount, with no fallback. Selection uses native source workspaces. |
| POST root | Typed `Create`, `Revise`, `Submit`, `Decide`, `Withdraw`, `Satisfy`, `Reopen` commands, described below. |
| GET /finance | Full relevant variation register at the same workspace-locked snapshot; requires native Finance and commercial read. No historical as-of query. |
| GET /api/v1/operations/:operation_id | Native actor-private original receipt with the original command's current duty and exact source/Activity authority. |

Every POST requires `schema_version:1`, UUID `operation_id` and `id`, `expected_version` (zero for creation), `action`, `reason` (1–1000 characters) and `note` (1–2000). `Create` supplies `kind` and `content`; dependent kinds also supply `basis_id`. Basis creation supplies the exact `source` from basis-options. Notice correction and variation adjustment may supply `predecessor_id`. `Revise` supplies the retained `kind` and complete `content`; other commands cannot supply content. `Decide` supplies only the appropriate `outcome` alongside common fields: Basis Approved/Returned, Obligation Waived/Returned, Variation Approved/Rejected/Disputed. An obligation submits specifically for independent waiver; returned waiver returns Open. Approval itself cannot edit pricing.

Content requires title (200), detail (4000), clause (500), an eligible `owner_id` and at most 20 unique saved Project `action_ids`. Obligation adds `due_date` (ISO date or null), explicit `date_needed`, and optional `evidence` (4000). Notice adds required `evidence` (4000) and UTC `occurred_at`; a correction must reference the latest notice in its chain. Variation adds explicit nullable `requested_amount` and `priced_amount` strings plus optional `date_impact` (2000). Basis scope/exclusions and notice recipient/type are narrative detail in this slice; separately typed subclauses, notice-to-obligation/variation links and attachments remain later work. Every record refers to its original independently reviewed basis document, with a recorded clause locator.

Money is bounded to ±999999999999.99 per record, rejects excess precision and is returned with two decimals. Aggregate arithmetic uses integer cents. Revisions retain all earlier action links. Linked Activity permissions remain independent; inaccessible evidence is withheld. Root commands use the existing 64 KiB JSON limit. Native signed cursor limits apply; no page-level total is reported as a whole-register total.

Source choices and initial ownership are fixed. There is one approved original per Project. Changed source evidence holds new basis/variation revisions, submissions and independent decisions. Recorded notices, withdrawals and factual obligation satisfaction/reopening can still retain evidence under current access after source drift; none claims a new source approval. Current source checks verify exact retained document and quotation output bytes; historical recovery needs authority to the original sources rather than successful current reapproval.

## Recovery, stale evidence and privacy

- The identical accepted operation recovers its original result after later workflow/source changes, provided the actor retains original-command and source read authority. Check authorisation before returning the receipt; do not rerun current eligibility as though it were a new action.
- Reusing the operation ID with different content is a conflict. A lost response must not cause a new record or second approval.
- Concurrent edits/submissions/decisions use exact versions; only one wins. A rejected stale command commits no partial source, financial, audit or event rows.
- New commands refuse source drift, withdrawal, changed accepted quotation response, invalid Project lifecycle and missing required authority. Keep permitted historical evidence readable, explicitly labelled as historical/changed.
- No customer-safe quotation/report/portal projection receives internal clauses, cost evidence, prices marked internal, disputes or commercial decisions automatically.
- Money reads are assembled from one consistent snapshot. If any needed source is inaccessible, suppress the affected total and disclose only a safe completeness explanation, never hidden identities, amounts or numeric restricted counts.

## Acceptance contract

Local test keys below do not replace parent acceptance IDs. AT-31/AT-38 and owner acceptance remain separately tracked.

| Local test | Required proof |
|---|---|
| PJ05-01 | Native issued/accepted quotation -> explicit Won receiving -> existing Project -> exact commercial basis -> independent approval; original value matches issued quote snapshot |
| PJ05-02 | Draft/declined/conditional/superseded quotation, independent Won narrative, wrong binding/customer/site/company and unreviewed/withdrawn document cannot create an eligible approved basis |
| PJ05-03 | Requested/priced/approved/disputed amounts remain separate; negative/zero/unknown values and exact cent sums match independently written expectations |
| PJ05-04 | Self-review, unrelated/revoked actors and cross-company reads/writes/history/recovery fail without leaking source details or changing rows |
| PJ05-05 | Source changes between prepare/submit/approve hold new action; original saved snapshots and prior successful receipts remain exact and recoverable under current authority |
| PJ05-06 | Racing edits, duplicate submissions and repeated/lost-response decisions produce one accepted effect; injected late failure rolls back the whole evidence graph |
| PJ05-07 | Obligation completion/waiver, notices/corrections and Activities retain distinct ownership, lifecycle and source evidence; no message or schedule/stock/accounting effect |
| PJ05-08 | Finance reads use every authorised applicable record across pages; missing/hidden/source-changed values produce explicit incomplete/held results and no misleading zero |
| PJ05-09 | Approved delta correction is a separate exact decision counted once; approved originals remain immutable and a proposed date impact leaves forecasts unchanged |
| PJ05-10 | Populated historical upgrade retains full original ledgers/grants/identities, including the deferred identity boundary; reserved Products migration, repeat migration/seeding and hosted upgrade gates remain correct |
| PJ05-11 | Compiled HTTP exercises real permissions, exact source/decimal rejection, concurrency and original receipt recovery; actual application/PostgreSQL restart preserves records and recovery |
| PJ05-12 | Exact final-source regression/build/type/lint, access catalogue and documentation/register checks pass, with unchanged-main evidence for any genuine environment limitation |

The implementation handover must state delivered subsets and remaining boundaries accurately. This contract is not proof that an endpoint, migration or test already exists.
