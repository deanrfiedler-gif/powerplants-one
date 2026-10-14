---
owner: Dean Fiedler - prototype owner
status: Implementation decision; independent business acceptance open
date: 2026-10-14
---

# Excel import verified quotation continuation

The user requested implementation of step 5 of the [Excel import plan](../delivery/excel-estimate-import-plan.md). PPO-010 and EST-02–EST-05, EST-07/08, DOC-01/02 remain the parent scope; XI-03/06/07/08 supply bounded evidence. CREMS is historical context. This decision authorises no commercial issue, approval, sending or integration.

Reuse the existing E1 Draft quotation writer, decimal arithmetic, safe snapshot/template, durable render job and operation receipt transaction. Extract an internal transaction participant without changing native PrepareDraftQuote payloads or hashes. A separate Excel review and command require the exact current imported native version on the selected Active option and Complete E2 basis. Current workbook include/print flags are proposals; retained lines without a current workbook row require explicit choices. Every choice and customer-visible narrative is reviewed separately from import approval.

Bind the review hash to actor, native/import identities and hashes, current E2/context, quote predecessor/version, full choices, reconciliation, whitelisted customer content and template definition hash. Rebuild it under the workspace transaction lock at acceptance. One native Draft revision, render job, immutable audit review, receipt and outbox commit together. Existing append-only audit evidence carries the review; a permission-checked internal endpoint retrieves it. The customer DTO and output do not receive import evidence. Accepted replay checks current historical authority before recovering the original receipt and does not demand that the original remain current.

Live PostgreSQL inspection confirmed audit_events and draft_quote_revisions reject updates/deletes, quotation headers advance one revision, and deferred graph constraints bind the current revision. No schema, grant, seed, dependency, framework or storage adapter is added. A dedicated handoff table was considered but duplicates immutable evidence and exact version references already carried by the native revision and audit. Direct native preparation alone was rejected for this flow because it does not reconcile workbook proposals or capture a separately verified review. Raw database writes are not promoted to an Excel handoff; the new invariant is enforced by the service transaction and tested through database-backed execution, not a new SQL trigger.

The existing whitelist cannot determine whether an estimator put confidential words into a description or scope narrative. Explicit customer wording confirmation remains required. Render completion is separate from command acceptance. Original outputs remain recoverable; edited estimates or choices create new reviewed Drafts. Native import/review UI, operational workbook readiness, E4 issue/approval and deployment remain separate.
