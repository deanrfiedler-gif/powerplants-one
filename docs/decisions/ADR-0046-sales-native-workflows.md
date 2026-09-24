# ADR-0046 — Native Sales handovers and aftercare

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: Implementation decision under the 24 September Sales instruction; business and visual acceptance separate.

## Context and choice

CR-01–05 extend BP-03/04 on the existing BP-02/ADR-0003 TypeScript, Next.js and PostgreSQL stack. Reuse domain services, shared Activities, current permission checks and durable operation receipts/outbox. No new technology or package is selected. Standalone HTML embedding and duplicate CRM/task/customer stores were rejected because they would bypass source ownership and recovery.

Use separate typed Sales handover and Aftercare aggregates with append-only versions and review events. Mutable drafts and immutable submissions are distinct. Every source link is authorised again on reads and commands, including historical snapshots and receipt recovery. A SHA-256 canonical source fingerprint binds receiving decisions to exact source versions. Accepted evidence survives successors. The immutable Won obligation is referenced, never updated. Migration 0046 follows refreshed main 0044; concurrent equipment PR #302 owns migration 0045 and ADR-0045.

## Authority and current-source reconciliation

Existing opportunity read/edit ownership governs Sales handover preparation. Existing estimating.edit governs Estimating receiving, with independent CRM/source visibility. Won receiving additionally requires the destination's existing project.edit or service.work_order.edit capability; Parts routing has no native receiving contract and cannot be accepted. No implied department authority or threshold. Aftercare reuses shared.internal.read and shared.history.record for internal customer review evidence, plus explicit account/review ownership and source report access. This is a bounded reuse of existing internal history authority, not adoption of all proposed CR-05 capability names. No new capability or grant is added. Receiving Service and CRM decisions require their respective existing command capability and exact source record evidence.

ES-05/06/07, agreements/renewals and ERP order conversion remain unimplemented on the audited main. Expose Unavailable rather than manufacturing sources. Record proposed routing with its evidence and owned unresolved actions; acceptance never creates downstream work or releases it. No probability, interval, satisfaction, competence, contact authority, retention or financial policy is adopted.

CR-05's historical unqualified Opportunity proposal conflicts with current CRM's qualified Discovery invariant. Preserve CRM's source command and qualification controls: a receiving link confirms a separately created permitted CRM record and does not qualify or create one inside Aftercare. Unknown receiving outcomes remain unresolved and block closure or resubmission. Source services retain their own state and freshness.

## Verification obligations

Scoped detail/list/history/receipt parity; revoked and hidden related access; immutable submitted basis; stale source/version rejection; exact original replay/conflict; upgrades across 0026; owned follow-up and closure guards; desktop/mobile/keyboard and source/reference comparisons. Execution is recorded in the [implementation handover](../delivery/sales-native-completion-handover.md). This decision does not claim successful verification or deployment.
