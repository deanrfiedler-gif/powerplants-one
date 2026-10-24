---
title: Work orders register implementation claim
date: 2026-10-24
---

Dean requested consecutive, separately reviewable implementations of the accepted SV-03 register and record page. This contribution claims the register first; the record will follow as a separate dependent PR. Owner: Codex for Dean. Implementation, validation and visual review are pending; no merge or deployment is authorised.

The live accepted register design (page 193:18953, desktop 196:24111, phone 196:24496) and its notes were inspected, including the later compact phone-header amendment. The existing card list lacks the accepted grid, view queues, selection, snapshots and retained navigation context. The current register read filters and counts only an authorised candidate window; it needs consistent permission-scoped filtering and counts before pagination. Native scope, coverage, authorisation and visit rules stay authoritative.

Expected changes: the work-order register read/model, a dedicated register presentation composed from existing shell/grid/record controls, focused database/HTTP/browser tests, the service API chapter, the backend decision's counting contract, the SV-03 page/component bindings, its guide and this fragment. Shared register and component catalogue edits are limited to SV-03. No new technology, migration, capability or grant is planned. Access PR #696 and field-readiness PR #690 keep their implementation ownership; no edits to their branches or workflows are included.
