# DK-06 managed template drafts API

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Status:** Synthetic implementation contract; independent review, business acceptance and deployment separate.

R2 implements [managed proposals and review evidence](../decisions/document-template-drafts-backend.md), following [R1 catalogue reads](template-catalogue.md). Traceability: DOC-03/DOC-06, OUT-09/OUT-10/OUT-14, D-012/D-024, AT-36 and BC-03.

## Scope and authority

A proposal has a stable UUID, immutable family, company and site, a current revision UUID and a monotonically increasing command version. Its scope is a local review context, not template applicability. Three explicit default-denied capabilities are `template.read`, `template.propose` and `template.review`. No seeded or hosted identity receives them. Read is required with either write duty. Existing shared/site visibility and pack.read, report.read or finance.read must apply in that same scope. Finance additionally needs shared.finance.read. Every bound field's existing source capability is rechecked for reads, new writes, review and original recovery.

The binding catalogue names fields from existing output projections, without evaluating paths or reading their values. OUT-09 and OUT-14 proposals are Internal only. OUT-10 accepts Internal or Customer; only catalogue fields classified Customer can appear in a Customer proposal. Account binding needs finance.account.read. New schema fields are not inferred from arbitrary strings. Operational source/record selection and audience projections remain the owning workflow's responsibility.

## Endpoints

All paths below start with `/api/v1`. The existing session, origin/JSON protection, private/no-store replies and working-company boundary apply.

| Method/path | Contract |
|---|---|
| GET /document-template-drafts/bindings | Required family, company_id, site_id. Returns only currently permitted binding metadata and schema_version 1. |
| GET /document-template-drafts | Required family; optional limit 1–50 and cursor. Current permitted proposal summaries only; no global total. |
| POST /document-template-drafts | Create a Draft and exact first revision. |
| GET /document-template-drafts/:id | Exact current proposal/revision and latest review of that revision. Optional revision_id selects permitted retained history. |
| POST /document-template-drafts/:id/revisions | Append one immutable revision; reset state to Draft. |
| POST /document-template-drafts/:id/reviews | Record independent exact review observations. |
| GET /document-template-drafts/:id/history | Required kind Revision or Review; optional limit and cursor. Current-permission-filtered immutable history. |
| GET /operations/:operation_id | Existing actor-private original receipt recovery under current write duty and original/current revision source permissions. |

All reads explicitly return synthetic:true, publication_eligible:false and supported_runtime_version:null. Complete means no more currently permitted rows in this query, not complete workspace knowledge. Signed cursors bind actor, workspace, working company, family/proposal, kind and page size; hidden candidate IDs and totals are never returned.

## Commands and schema

Every command requires operation_id (UUID), schema_version:1 and reason (1–1000 characters). New accepted commands return 201 and a durable receipt. An unchanged accepted original returns 200 with the original receipt; field order does not change its canonical command identity. A reused operation ID with changed content returns OperationConflict. Retain the exact submitted original for recovery, including body text.

Create additionally requires id, revision_id, company_id, site_id, family, base_template_id, base_content_hash and body. The base must be an existing exact definition in that family with an intact SHA-256 matching the observed hash. Historical bases are allowed; selecting one does not make it eligible for use. The server retains the exact base identity, version, definition, hash and recorded renderer version. Dependencies recorded inside that definition are preserved, without opening any dependency path.

A body contains only schema_version:1, title (1–200 characters), audience (Internal or Customer), and an ordered array of 1–40 fields. Each field has key (unique lowercase stable identifier, at most 64 characters), label (1–120), binding (an available exact catalogue key), and required (boolean; proposed requiredness only). Unknown keys, conditions, scripts, markup properties, URLs, uploads and unsupported bindings are refused. Text remains data and is never executed or rendered by this increment.

Revise requires expected_version, observed_revision_id, a new revision_id and body. The family and base remain permanent. The new revision fingerprints canonical base/body bytes with SHA-256, increments the proposal version and resets state to Draft. Revision numbers and command versions are separate.

Review requires review_id, expected_version, revision_id, content_hash, outcome and checks. Outcome is Reviewed or ChangesRequested. The checks object has exactly schema, source_bindings and audience; each contains result (Pass, Fail, Blocked or NotRun) and note (1–2000 characters). Reviewed requires all three Pass. These are attributed reviewer observations, not an automated claim of business approval. Any contributor to any proposal revision is excluded from reviewing that proposal. There is no review inheritance after an edit.

## Persistence, conflicts and recovery

Four tables hold proposals, immutable revisions, immutable reviews and immutable command events. Deferred checks require exact event snapshots and the matching typed audit, receipt and outbox graph in one transaction. SQL also refuses changed identity/scope, version gaps, cross-family or changed original bases, malformed field schemas, self-review, forged review hashes and evidence rewrites. The existing workspace transaction lock serialises commands; stale expected versions or revision IDs return StaleVersion without partial writes.

Forbidden/missing scope or source access returns RecordUnavailable, including on original retries and history. InvalidData identifies invalid schemas; StaleTemplate requires reloading the retained base. IndependentReviewRequired rejects contributor review. After a lost response, retry the identical original or read its operation receipt. Do not generate another operation ID to reconcile uncertainty. A source permission loss can withhold an old receipt without deleting it.

R2 creates ordinary SharedRecordUpdated evidence only. It never emits PolicyOrTemplatePublished, changes a template/policy, queues a render, updates a saved output, sends a message or downloads/regenerates an issued file. R3 publication, R4 assignment, arbitrary schemas/forms and native authoring controls are separate work.
