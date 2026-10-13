# DK-03 output action API

Owner: Dean Fiedler. Implementation contract, 13 October 2026. [Decision](../decisions/output-actions-backend.md). Covers JobPack and ServiceReport only.

## Action context and original recovery

`GET /api/v1/document-outputs/:id/actions?kind=JobPack|ServiceReport` requires the native issue permission and record scope (including Service owner for reports). Returns current parent version/revision/issue, supported action names, native review-page handover, owned native render jobs and complete synthetic distribution history for this output. Action names describe supported commands, not a readiness approval. Native commands revalidate all conditions. No private storage key, render snapshot or worker lease is returned.

`GET /api/v1/document-outputs/:id/operations?kind=…&operation_id=UUID` recovers the calling actor's original native receipt after checking current issue authority and exact parent binding. A 404 means no accessible receipt; it is not evidence that an external delivery did not happen. Repeating the identical original command is safe under its native receipt contract.

## Commands

`POST /api/v1/document-outputs/:id/actions` takes exactly `{kind, action, command}`; query parameters are refused. Existing local/hosted identity and same-origin write protection apply. Success returns the native receipt (202 when newly queued, 201 for other new commands, 200 for replay) or a safe render-job summary for recovery. Original operation IDs and native command payloads are not rewritten.

| Action | Command and authority |
|---|---|
| RequestIssue | Existing pack issue payload (`operation_id`, `schema_version:1`, `reason`, `expected_version`) or existing report issue payload (also exact `revision_id`, `review_id`, `template_id`, `template_version`). Native checks and source/template rules apply. |
| RecoverIssue | `{job_id}` for the exact parent/kind; resumes the native original job. Active leases remain owned, terminal stale jobs require native successor preparation, and issued missing files are never regenerated. The response distinguishes output metadata from checked availability (Available/ExactUnavailable/NotIssued). |
| WithdrawPack | Existing pack withdrawal payload. Reports use their own native amendment/review process; this action refuses ServiceReport. |
| PrepareDistribution | Common operation fields plus `attempt_id`, `issue_id`, `recipient_id`, `expected_version`. Recipient is the exact pack-recipient ID or the report issue's frozen Person ID. Channel is server-fixed Synthetic. |
| RecordDistribution | Common operation fields plus `attempt_id`, `expected_attempt_version`, `outcome`, `evidence`. Prepared can become SimulatedSent, SimulatedNotSent or OutcomeUnknown. |
| ReconcileDistribution | Same shape; only OutcomeUnknown may become SimulatedSent or SimulatedNotSent. Evidence is additive, retaining the original unknown event. |

Distribution attempt version starts at 1, increasing for each immutable event. Parent versions are not bumped by distribution; the receipt retains the parent identity/version and the action context exposes attempt versions and original operations. Shared receipts/audit/outbox and distribution evidence commit atomically. Different payloads under an accepted operation ID return OperationConflict. Unknown fields, unsupported outcomes (including Sent/Delivered) and invalid IDs/versions return 422. Competing versions return VersionConflict; existing unresolved/sent recipients return DistributionRecoveryRequired.

Prepare and a new simulated send verify current issue/revision/status, current audience and retained byte hashes. Job Packs additionally require applicable schedule/crew and no review flag. Reports require the currently valid frozen customer recipient. Changes refuse the command. Historical non-send/unknown recording and reconciliation do not resend, so they can describe an earlier issue after supersession/withdrawal; current permission is still mandatory. A recorded SimulatedNotSent permits a new attempt, subject to fresh applicability/byte checks. Prepared, OutcomeUnknown and SimulatedSent prevent replacement for the same exact issue/recipient.

Both families expose `channel:Synthetic`, with real `sent_at` and `delivered_at` null. Existing pack TaskCreated/SimulatedSent/Opened/Downloaded events and acknowledgements remain native history; new ledger evidence neither rewrites nor backfills them. Existing report responses remain exact-presentation records and are not manufactured by distribution. No provider, customer communication, automated retry, new grant or domain approval is introduced.

## Recovery and verification

If a request response is lost, recover its original receipt or repeat the identical command. If a simulated distribution outcome is uncertain, read the original attempt and explicitly reconcile it before preparing another. If issue finalisation is interrupted, resume the original native job; exact retained bundles are reused. A missing issued file retains its issue identity and requires restoration by the native storage owner.

[Execution evidence](../testing/evidence/output-actions/README.md) separates application/database/HTTP/restart checks from human acceptance and deployment. UI integration, live delivery providers, other output families and DK-06 remain separate.
