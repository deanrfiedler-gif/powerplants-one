# Synthetic quotation response contract

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. ES-06 / PPO-010 / BP-04 EST-03/08 / OUT-06 / AT-26. [Native decision](../decisions/quotation-response-native.md). Operational policy, owner acceptance and deployment remain separate.

## Exact issue, commands and permissions

GET `/api/v1/estimating/quotes/[id]/response` reads one exact issued revision, its immutable issue UUID/output manifest, source binding, complete response history, current applicability and ES-07 readiness. An unissued revision is unavailable. Unknown query fields are refused; reads are no-store. `[id]` is the existing quotation revision UUID, not a “latest” alias. The issue retains the exact estimate version, option, recipient, scope, include/print choices, terms and template from ES-05. One whole manual option is supported; no partial acceptance or new arithmetic is introduced.

All commands use POST under that path and the original `operation_id`, `schema_version: 1`, `reason`, `evidence`, `synthetic_only: true`, exact `issue_id`, `output_hash`, `expected_response_sequence` and nullable `response_id`. Unknown fields are refused. Reasons are 1–1,000 characters; synthetic evidence is 1–4,000. The current estimate owner with `estimating.quote.prepare` can record. Current workspace/company/site, CRM, original recipient, estimate/source and specialist reads apply to reads, writes, history, files and original recovery. No new grants or users are added.

| Path | Additional fields and exact meaning |
|---|---|
| `/record` | `action: Record` or `Correct`; `report: {outcome, respondent, claimed_role, responded_at, conditions}`. Outcomes: Accepted, Declined, Clarification, Negotiation. `response_id` names the preceding report, null only for the first. Correct requires the current report and retains every original. A reason is mandatory for every outcome, including decline/correction. |
| `/clarification` | `action: Answer` with `detail: {answer}`, or `Confirm` with `detail: {respondent, claimed_role, responded_at}`. `response_id` names an unresolved information-only clarification. An immutable answer precedes reported confirmation; neither changes offered content. |
| `/prepare` | Exact Accepted `response_id`, current `owner_id`, `due_date` and `note`. Creates only a prepared ES-07 review note. The estimator owns preparation; this is not receiving-owner appointment, sending, receiving or conversion. |

Reported time is a valid UTC instant after the exact issue and no later than server recording time. Confirmation follows its recorded answer. Recorder/time come from the authenticated application and server. The respondent and role remain claims. Authority and signature verification are Not configured; no legal execution, approval or work authority is implied. Conditions are preserved text and hold receiving preparation until a subsequent unconditioned response or explicit correction.

## Applicability, corrections and negotiation

Every report/correction is append-only and attributable. A new report explicitly follows the current report. Corrections contain the complete corrected report and link its predecessor; the original remains in history and original-command receipts still recover it. Two competing submissions using one observed sequence cannot both succeed. Repeating the same original command returns its original receipt; changing normalised command content conflicts.

An information-only question remains unresolved until its answer and reported respondent confirmation, or an explicit correction of that question. Later reports cannot erase unresolved questions. Material Negotiation holds acceptance and receiving preparation for that issue permanently under `SYN-ES06-01`; even a corrective account of the negotiation cannot silently relabel changed content. Return to ES-05 for preparation, independent approval and explicit successor issue. The new issue inherits no response.

An actually issued successor supersedes the preceding offer. Source observations, saved-estimate revisions, distribution evidence and unissued preparations affect their own ES-04/05 decisions; they do not mutate issued content or historical acceptance. New acceptance is refused on a superseded/material-held offer. Historical corrections and non-acceptance reports may still preserve factual evidence, visibly without current applicability. No expiry timestamp or withdrawal action is inferred: both policies remain Not configured.

## ES-07 and recovery

The read exposes the latest exact response, all unresolved conditions, material-change hold and retained preparation. Preparation requires a current unconditioned reported acceptance and no unresolved clarification/material negotiation. A later response/correction or successor holds the old preparation automatically; its owner/note/due date and receipt remain intact. Ready means ready for bounded synthetic receiving review, not operational acceptance. The [ES-07 contract](quotation-conversion.md) implements independent receiving, explicit one-off resolution, immutable review and atomic native Forecast demand within a bounded synthetic target. This page remains preparation only.

`quote_response_events` is a subordinate immutable table introduced by 0060. Scoped foreign keys and SQL guards enforce exact issue/hash, ordered sequence, response lineage, clarification and preparation. Deferred evidence checks require atomic audit/receipt/outbox. No existing identity, template, grant, estimate, review, issue or output changes. Original output is verified for new commands; recovery of an already accepted original remains possible when storage later becomes unavailable, subject to current authority.

The existing workspace lock, command hash and actor-bound same-tab journal protect original recovery. Unknown outcomes hold replacement actions; receipt absence is inconclusive. A definitive initial refusal releases only that refused proposal. Receipt lookup/replay checks the original revision and current recording duty before disclosure. No offline response queue, customer login, external message, signature or ERP write exists. See [handover and executed evidence](../delivery/quotation-response-handover.md).
