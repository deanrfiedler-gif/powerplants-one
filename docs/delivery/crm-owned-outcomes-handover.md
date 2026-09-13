---
document_id: PPO-009-OUTCOME-HO
revision: r01
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Implemented on a branch; database, browser and merged-main verification pending
source_commit: 503473dc136046812fbd42907aca448d7e895b9d
---

# CRM owned outcomes — increment B

[CRM-02 / issue #144](https://github.com/deanrfiedler-gif/powerplants-one/issues/144) follows the five-stage increment A. The [adopted policy package](../decisions/audit-follow-through-policy-package.md) was committed before this implementation. This is a synthetic prototype increment; delivery acceptance, receiving-route confirmation and operational transactions remain separate.

## Implemented contract

`POST /api/v1/crm/opportunities/{id}/outcome` accepts schema version 1, original operation UUID, expected opportunity version, reason, `close_outcome` (Won/Lost), `lost_reason` (Price/Competitor/Timing/No decision for Lost; null for Won) and `acceptance_evidence` (1–2,000 characters for Won; null for Lost). Unknown fields, conflicting evidence and missing required facts are refused. The screen accepts optional outcome notes; without them it records the selected action as the operation reason.

Current opportunity ownership, scoped CRM edit/read, relationship eligibility and all-target access to original Activities remain required. Won is available only from Closing; Lost from any of the five stages. The I1 definition remains Open. State guards execute only for a new effect; an accepted original may be replayed under its current required authority even after subsequent versions. A reused operation with different content conflicts.

Migration 0023 adds immutable outcome fields and one immutable handover-due companion for Won. The transaction commits one opportunity version, exact event, audit, original receipt and minimal internal outbox together. The due companion records the closing owner and exact outcome version/event/time. It neither claims a receiving owner nor reassigns any Activity. Existing snapshots, issued bytes, seeds and old migration checksums are untouched. Generic existing-demo migration/table grants were reviewed; no hosted upgrade was run.

Reopening, a fresh second outcome, and stage movement after closing are refused by both commands and SQL. Existing independent information, scope and Activity permissions remain; later edits cannot rewrite the captured handover basis. No Project, Service Order, Sales Order, customer communication or ERP action is created.

The detail dialog uses the existing frozen original-operation/reconciliation controls. Closed records retain their stage with disabled stage controls. Board/List share the same permitted projection and outcome filter, default Open; Won/Lost/All expose retained records explicitly. Filters bind read cursors, and counts/known values describe the selected returned page.

## Verification and remaining work

Local lint, type checking and 85 existing unit tests passed. A worktree dependency symlink caused the first build to fail before application compilation; dependencies were copied into the worktree and the unchanged build then passed. Database and browser results require the existing disposable CI jobs because this workspace has no PostgreSQL and the pinned browser download is unavailable. No local database/browser pass is claimed.

Four added cases in the existing focused CRM database suite cover one Won handover, every Lost stage/reason, replay/conflict, competing outcomes, scope/legacy refusal, preservation of Activities/history, and refusal of unaudited direct SQL. Two browser cases run on desktop/phone for persisted outcomes, structured reason validation, Board/List recovery, and a lost accepted response. The existing real application/PostgreSQL restart script now also preserves and rereads both closed outcomes, their original receipts/hashes, handover due and Activities. Existing I1/I2 restart proof remains.

All six cross-domain migration assertions, Leads integration migration/seed expectations and the existing-demo added-migration count have been reconciled to 0023. There is no new seed. Record exact contribution and merged-main results on the PR before calling increment B complete. Controlled owner transfer (#145), receiving route/owner confirmation and E2 are subsequent work.

First CI correction: E1 job `103800486162` on source `f294473c` failed its old-schema full-row comparison because the three newly added event fields were absent from the expected row. Every original value matched. E1-DB10 now explicitly requires `close_outcome`, `lost_reason` and `acceptance_evidence` to be null on historical events; no field is dropped from the comparison. The other ten E1 DB cases passed. The migration applied successfully.
