# Document library API

Owner: Dean Fiedler. Review status: synthetic implementation contract; business acceptance remains open. Scope DK-01/DK-02, BC-03; parent DOC-01, DOC-02, DOC-04 and DOC-06. Related acceptance AT-20/AT-36 is only partially exercised by this bounded backend. Existing DOC-03 output and DOC-05 distribution authorities are preserved.

The [architecture decision](../decisions/document-library-backend.md) records reuse, limits and the source/permission model. The issued standalone [design](../reference/ui/document-library/PPO-Document-Register-and-Linked-Library-r01.html) remains a visual reference. No native page integration or live SharePoint operation is implied.

## Read contract

All paths begin `/api/v1/document-library`. Read, source and selected working-company authority apply before metadata, matching, paging, history, bytes or original receipts. Existing source grants remain additional requirements. Default-denied `document.read` permits library reads in its company/site scope; `document.register` and `document.review` are separate write duties.

| Method and suffix | Result |
|---|---|
| GET root | One row per identity, current revision only. Default state Current; state All/Withdrawn includes retained withdrawals |
| GET /linked?target_kind=KIND&target_id=UUID | Native-context lookup of active declared references, returning each linked exact revision even after a successor exists. Limit/after page by visible link UUID |
| GET /:id | Exact selected revision or the current one; aggregate version, source hash/size, findings, retained review and separate availability/currentness |
| GET /:id/content?revision_id=UUID | Required exact revision; protected attachment, private/no-store, nosniff, sandbox CSP. No mutable latest download |
| GET /:id/history | Immutable event history, including original response/acceptance facts; exact revision attribution |
| GET /:id/usage | Declared references to exact revisions, retirement and need for successor/withdrawal assessment. No native issued-manifest rewrite |

Register filters: q (title, display number, type, applicability), company_id, organisation_id, site_id, document_type, owner_id, availability (Available/ExactUnavailable), review_state (Unreviewed/Reviewed/Returned/ReviewOutdated), state (Current/Withdrawn/All). Limit 1–50, default 25. Default ascending stable UUID order; `next_after` is the last visible returned UUID and can be supplied as `after`. The caller retains its filters on continuation. Register pages are live reads, not frozen exports; no total or exhaustive-match claim is made. Usage uses the same limit/after convention; history is descending aggregate version with exclusive `before`/`next_before`.

The in-progress accepted-page read support also accepts `sort=registration|number|updated` and `direction=asc|desc`, using the identity UUID as the tie-breaker. Sorted continuation uses `cursor`/`next_cursor`, signed and bound to actor, workspace, working company, filters, sort and page size. A process restart expires continuations; the caller must refresh. Legacy `after` is limited to ascending registration order. Rows include permitted organisation/site names, owner/registrar/source-author labels and separate register/review/independence hints; commands remain authoritative. Usage includes a label only after target authority succeeds. GET `/:id/revisions` returns permitted historical revisions newest first with exclusive `before`/`next_before` and limit 1–50 (default 25); `coverage=Partial` discloses omitted sources without identities or counts. GET `/options` returns 25 permitted choices with `after`/`next_after`, kind and optional company/customer/site/document/search context. `RecordedOwner` includes owners of readable documents, labelled inactive where applicable; `Owner` is the separate currently eligible registration/finding assignee picker. Native command authority revalidates every selection. `mine=true` binds the register owner to the current actor. Database, HTTP and visual verification remains separately recorded.

Hidden source records are omitted, without titles or source IDs. Unreadable receiving objects are omitted from usage/history with Partial coverage; their identities and counts are not exposed. An exact source whose authority is present but whose bytes are missing remains registered with ExactUnavailable. Availability does not rewrite its review decision.

`eligible_for_current_use` means only: current nonwithdrawn library revision, native source current, exact bytes available, Reviewed and no unresolved or later findings. It does not authorise operating equipment, issue a document, change an approved estimate, accept delivery or prove customer acknowledgement. Audience is descriptive applicability metadata; permission grants and native source authority enforce access. No external audience publication is implemented.

## Commands

All commands use JSON (up to 64 KiB per request), reject unknown fields, and return the existing operation receipt. Supply `schema_version: 1`, a UUID `operation_id`, and a nonempty single-line `reason` (up to 1,000 characters). Mutations use the current aggregate `expected_version` and exact `revision_id`; registering a successor uses `observed_revision_id` for the old current revision and `revision_id` for the new one. A new accepted operation returns 201; identical replay returns 200 with its original receipt. Current authority is rechecked first.

| POST suffix | Additional fields and effect |
|---|---|
| root | id, company_id, organisation_id, nullable site_id, revision metadata and source. Starts version/revision 1, Current, Unreviewed |
| /:id/revisions | expected_version, observed_revision_id, new revision metadata and source. Keeps identity/context, advances the current revision, starts Unreviewed |
| /:id/findings | action Open: finding_id, text, owner_id, due_date; action Respond: finding_id, text; action Accept: finding_id, text |
| /:id/review | outcome Reviewed/Returned, purpose, rationale; exact immutable independent decision |
| /:id/links | action Add: link_id, target_kind, target_id, purpose; action Retire: link_id |
| /:id/withdraw | Retains the identity, revisions and exact references; no delete/reactivate |
| /:id/recover | text; restores only missing original synthetic content with matching retained hash/envelope; historical and withdrawn revisions allowed |

Revision metadata: client-provided revision_id UUID, title (200), document_type (80), applicability (2,000), audience (200), owner_id UUID. The owner must be active and hold scoped document.register and shared.read. Context is fixed for an identity; the chosen organisation and site must have an existing current site-party relationship when registered.

Sources are discriminated objects:

- `{kind: "SyntheticText", text: "..."}`: 1–20,000 characters after outer whitespace normalisation; valid multiline text, UTF-8, privately stored in an operation-bound write-once envelope outside Git.
- `{kind: "JobPackIssue", issue_id: "UUID"}`: native exact issued PDF and its retained manifest.
- `{kind: "ReportIssue", issue_id: "UUID"}`: native exact issued PDF and its retained manifest.

Provider URLs, paths, credentials and arbitrary uploads are not accepted. Native issue context must match the registered company, organisation and site. Exact source keys stay private. Re-registering a historical native source can preserve its identity; it cannot make that source current or eligible for current use.

Finding text/response/acceptance is limited to 2,000 characters; due_date is a valid date-only value. The assigned owner responds to an Open finding. The response author cannot accept it; document.review is required. Responses do not close findings. The prototype bounds each revision to 100 findings and each document to 100 active declared references, with explicit refusal at the limit.

Review purpose is 200 characters, rationale 2,000. The registrar and exact native source author cannot independently review that revision. Both Reviewed and Returned require exact available current content. Reviewed additionally requires all findings closed. A later finding invalidates current-use eligibility without rewriting the original decision. Another review requires a successor revision.

Declared target kinds are Organisation, Site, Asset, Project, WorkOrder and EngineeringPackage. Native visibility and matching company/customer/site context apply. Each active target/revision pair is unique. Retiring a historical/withdrawn reference is allowed with the latest aggregate version. Retargeting is an explicit new link; old evidence is retained. Receiving-domain handover commands remain authoritative.

## Recovery, concurrency and evidence

Keep the original operation UUID and exact normalised command after an uncertain result; inspect `/api/v1/operations/:operation_id` or replay that original. Altered content under the same UUID fails. An optimistic version conflict is a refused new action; reload and deliberately form a new command. Server-side workspace serialization and immutable evidence bind the exact aggregate transition, actor, source, audit, original receipt and internal outbox.

Private storage may succeed before a database transaction fails. The retained envelope includes document/revision IDs and command hash, so a changed retry cannot overwrite orphaned content. The exact original can retry. Missing synthetic content recovery must reproduce the original envelope and bytes; corrupted or conflicting write-once storage is not silently overwritten. Native issue recovery stays with the owning workflow. No provider outage cause, recovered external delivery or live synchronisation is inferred from a local result.

The [execution ledger](../testing/evidence/document-library/README.md) separates code verification, initial defects, CI, review, owner acceptance and deployment.
