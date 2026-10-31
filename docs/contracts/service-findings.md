# SV-07 Service findings contract

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 20 October 2026. Status: bounded synthetic backend contract; application design and owner acceptance separate. [Decision](../decisions/service-findings-backend.md), [accepted design](../decisions/findings-figma-design.md).

## Reads and identity

`GET /api/v1/service/findings` returns the permitted findings register. `GET /api/v1/service/findings/{source}:{source_id}` returns one exact source observation. Both use current server identity and private/no-store responses. R2 adds the next-action endpoint below and migration 0111. There is no new finding business record, capability, seed or grant.

| Source key | Identity and owning record | Closure/disposition |
|---|---|---|
| `inspection` | Existing Service inspection defect UUID; exact defect version, appointment, equipment and native inspection link. Required Fail/NotTested/UnableToAssess results already create these defects | Only native defect Closed is Closed. CorrectionRecorded is WaitingReview. Activity completion alone is FollowUpCompleted |
| `incident` | Corrective action UUID; incident UUID/version, appointment and currently bound equipment | Only incident Closed is Closed. Accepted action evidence is WaitingReview. Completing an Activity leaves the incident open |
| `completion` | Immutable submitted report revision UUID; exact report reference/revision and Partial/UnableToProceed source | A successor report revision is Superseded. A current incomplete observation remains open after its Activity completes; no generic source closure exists |
| `response` | Immutable non-Accepted customer response UUID and parent report | Only an explicit correction makes this observation Superseded. A follow-up does not change the response. AcceptedWithReservations, Declined and Unavailable retain their native words |
| `schedule` | Native scheduling follow-up Activity UUID; appointment reference and retained schedule version | Completed Activity is Closed for this follow-up only. It does not move a booking or establish acknowledgement. Cancellation requires disposition |

An identifier combines the source key and existing UUID. Defect display references are qualified by appointment because `DEF-001` is only unique within its host. No new business number is allocated. Superseded observations are separate from resolved/Closed sources; their original Activities and immutable evidence survive.

## Authority and privacy

Every read requires current shared, work-order and scheduling read permissions. Each row then uses the source's existing authority: Service review or assigned field inspection access, incident access, report context, or appointment access, plus current access to its Activity and equipment. Native work-order visibility retains all historical-asset restrictions. A source link never grants access to an Activity outside the same company/site. Working-company scope is applied by the existing permission helpers.

Payloads are allowlisted. There are no signature bytes/hashes, private incident facts, evidence-storage metadata, source bindings, contact details or provider data. An inaccessible source contributes no title, identifier, count, search match or continuation. A missing Activity can be an explicit source-owned unknown; an existing inaccessible Activity suppresses the row. Set-based source, Activity, field-assignment and historical-asset authority predicates run before pagination. Every returned/count-contributing source and continuation source is checked again through the native reader. Reads serialize with native writes at the existing workspace boundary; detailed hydration is bounded to 50 candidates and one continuation check. Clock-based permissions are rechecked as well.

## Queries and counts

Filters: `q` (up to 200 printable characters), `source`, `company_id`, `site_id`, `owner_id`. Search covers permitted source references, remaining-work text, site/equipment labels and next-action summary/owner. Unknown keys and invalid identifiers are refused.

Views: `due_this_week` and `recurring` supplement `open` (default), `all`, `needs_owner`, `overdue`, `waiting_review`, `follow_up_completed`, `closed`, `superseded`. Open excludes Closed and Superseded. NeedsOwner includes a missing or cancelled Activity: it calls for assignment/disposition and does not assert the prior owner's identity was deleted. WaitingReview is sourced from recorded correction or accepted incident-action evidence; it is not a computed assertion that every closure prerequisite passes.

`count_scope` is `AuthorisedCandidateWindow`, following the existing Work Orders register convention. Search/source/company/site/owner filters and authority run in SQL before taking `limit + 1` candidates. Only the first `limit` are hydrated; the selected view then filters that window. `counts` covers that window before the view; `total` is the number of returned rows in the selected view, not a whole-register total. `offset` is 0–1,000,000; `limit` is 1–50, default 25. Ordering is newest source/Activity update first, then the stable source-qualified ID. A permitted continuation yields `next_offset = offset + limit`; follow it even when the selected view has no rows in the current window. An expired grant or failed native authority check removes that row and marks `completeness: Partial`; `Complete` means the candidate window was fully checked, not that all history was returned. Each response carries its database `as_of` and synthetic provenance. Page requests are fresh reads; concurrent business changes may change pagination. Consumers must not present these window counts as whole-register dashboard totals.

Due times remain the native Activity deadline instants, accompanied by `due_date_only` and site timezone. Overdue means an active Activity's deadline has passed, strictly; completed/cancelled Activities and Closed/Superseded observations are never labelled overdue. No deadline, ownership, acceptance or customer-contact result is inferred from the source's title.

## Page views and recurrence

The native page at `/service/findings` uses the Service review side menu. `due_this_week` uses Monday through Sunday in the source site's civil calendar and only active actions on open observations. `recurring` includes open findings with an earlier permitted failed-check match. The UI label Ready to close maps to `follow_up_completed` and explicitly requires source review; it does not assert that all closure prerequisites passed. Closed findings has no date cutoff, as [recorded](../decisions/findings-figma-design.md#build-decisions--31-october-2026).

`options.owners` and `options.sites` contain only the already-authorised candidate window's values. `recurrence` states its basis and partiality and allowlists earlier source identities, hrefs, dates, states and correction notes. Failed inspection checks match exact equipment and check key, strictly earlier and at most 90 elapsed days apart. Native authority and Activity visibility run before the bounded 50-match candidate window and again before publication. No inferred title similarity or safety-classification category matching occurs. Other sources have no stable equipment-bound fault key and return `NoStableFaultKey`; no negative recurrence claim is made for them. Recurrence never changes source state or Activity data.

## R2 next action

`GET /api/v1/service/findings/{source}:{source_id}/next-action` accepts no query fields. It returns the permitted finding, an opaque `source_token`, `expected_version` (Activity version, or zero if missing), `can_edit` and `blocked_reason`. Reading does not create a binding or Activity. The token covers the exact native observation, source disposition, appointment/work-order context and equipment. It is a freshness check, never an access token. Due/overdue follows the same database-clock rule as the main read.

`POST` to that same endpoint accepts only `schema_version: 1`, `operation_id`, `reason`, `source_token`, `expected_version`, `owner_id`, `due_at`, `instruction` and `required_evidence`. Owner, UTC due instant and instruction (1–2,000 characters) are required. Required evidence is 1–4,000 characters or explicit null. It is a request for evidence, not a record of its acceptance. The server derives the Activity identity and all company/site/source links; clients cannot target an arbitrary Activity. A successful save returns the standard Activity operation receipt, HTTP 200, also used for replay.

Current native source access, scoped `service.work_order.edit` and `activity.edit` are required. The owner must be active, able to own/read the Activity and every retained link, and able to read the native finding. Exact source-token or Activity-version mismatch returns 409. Closed/Superseded sources and Completed/Cancelled Activities return 422 with a native disposition requirement, even if the finding is displayed in NeedsOwner. No silent reopen or replacement occurs.

The native Activity is updated in place. Where the source has no task, one new restricted Service Activity is created and its source binding retained separately; the original source remains unchanged. The instruction is the Activity summary. `required_evidence` is exposed on the finding action and My Work detail, backed by one Activity extension row even when several native observations reference that Activity. My Work history includes before/after owner, due, instruction/summary and required evidence, author and reason. Audit, receipt, outbox, binding and evidence fields commit in the same transaction as the Activity.

Once R2 binds an Activity, generic My Work updates expose `can_edit: false` and refuse new `UpdateActivity` commands with `SourceWorkflowRequired`, including when required evidence is null. Native tasks not yet adopted by R2 retain their existing coordinator editor: the actor needs scoped Service edit access and native read authority across every linked source, and the proposed owner needs Activity eligibility and the same native read authority. Technicians cannot use this path to bypass coordinator authority. These legacy edits retain Activity-version checks, including cleanup after a source observation is superseded; they do not acquire R2 source-token or source-state semantics. Owner start/complete/cancel keep their existing authority. Previously accepted generic updates remain recoverable. The R2 page remains a separate UI dependency.

Exact retries return the original receipt after later edits or source disposition, provided the actor retains current source/Activity authority. Owner eligibility and freshness are revalidated only for new writes; they do not strand an already accepted original. Receipt lookup is actor-private and repeats current source write authority. Changed payloads cannot reuse an operation ID. No change here modifies native inspection/incident ownership, accepts evidence, closes findings, releases holds, changes bookings or messages a customer.

## Verification and limits

Prove all five sources using native commands, count/search/detail isolation, working-company scope, field assignment and revoked source/Activity permissions, immutable original content, completion-versus-closure, correction/supersession, deterministic paging and absence of business writes. The [execution ledger](../testing/evidence/service-findings/README.md) records actual results and limits.

The page adds native presentation and bounded failed-check recurrence. It supplies no escalation case, automatic message or operational integration. Existing source routes receive closure handovers; R2 adds only next-action assignment/editing. Source-specific closure gaps remain visible rather than being filled by a new workflow in this projection.
