---
document_id: PPO-ADR-EXCEL-REVISION
date: 2026-10-14
owner: Dean Fiedler - prototype owner
status: Implementation decision; business acceptance open
versioning: git
---

# Excel revised-workbook comparison and controlled re-import

Dean authorises Step 4 of the [Excel plan](../delivery/excel-estimate-import-plan.md), under PPO-010, EST-02–EST-05, EST-07/08 and DOC-01/02; XI-03/04/05/07/08 apply. CREMS reconstruction is not a dependency.

Reuse the bounded reader, native costing transaction, private source adapter and operation receipts. Add a successor evidence table in migration 0096. Keep first-save tables, hashes, commands and migration 0095 unchanged. Separate successor evidence avoids rewriting immutable issued evidence or weakening its version-one constraint. No dependency, service, permission, seed or operational integration is added. Slots 0093/0094 remain reserved for template work.

Compare against the exact current native version and the latest accepted workbook. Resolve workbook_ref + option + line_ref across retained history, including lines removed earlier. Existing IDs survive reordering and reappearance; new keys receive deterministic, namespaced UUIDs. Reject a different workbook identity or an option without a prior Excel import. A whole-estimate replacement is explicit: current native values, previous workbook values, proposed values, changed fields, section/source/presentation changes, scope, title and totals are review evidence. This exposes intervening PPO edits instead of silently treating the previous upload as current.

Every current line absent from the upload requires Keep or Remove. Keep copies the exact native line after uploaded lines, in original native order; it retains prior import provenance when known. PPO-only lines have no inferred section, source record or quote presentation choices. Uploaded lines replace their matching current lines only after exact-comparison confirmation. Native source-binding inheritance and specialist lineage remain governed by their existing successor rules. Scope changes still require a Complete E2 revision first.

The comparison hash binds actor, current version/content, E2 context, original upload and retained import history. The save additionally binds the complete decisions and confirmation set. Current authority and comparison are rechecked after source durability verification inside the native atomic operation. Exact accepted retries recover the original operation before source I/O, under current historical access. Original versions, workbooks, quotes and receipts are never updated. Review does not prepare or issue a quotation.

Alternatives rejected: implicit append/merge (hides omissions and PPO edits), row-position identity (breaks reorder), updating first-save evidence (destroys history), and a new import framework/store (unnecessary). The pilot retains 100 final lines and the 64 KiB native receiver boundary; capacity expansion and quotation continuation remain separate steps.
