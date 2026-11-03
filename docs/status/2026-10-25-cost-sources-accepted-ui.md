---
title: Cost sources accepted UI implementation
date: 2026-10-25
---

Dean authorised implementing the accepted ES-03 Cost sources register and publishing a reviewable PR. This contribution starts from current main `60a7f7b4` in a dedicated worktree. Open PRs were checked; none claims Cost sources.

Initial gap assessment: the native page still uses the older 100-row card-list read. The additive register API already supplies full permission-scoped matching counts, paging, independent-review eligibility, owner/author attribution and exact first-tier/expiry facts. The accepted grid, menu, phone list, source snapshot and selection actions need to consume these reads while preserving native commands and immutable estimate/quotation pricing.

Planned shared edits are bounded to the Cost sources contract and guide, its existing page/component register entries, native register/detail reads where required, and shell integration for this route. No new technology, migration or capability is presently required. Implementation, validation, visual comparison, owner acceptance and deployment remain separate; execution results will be recorded before handover.
