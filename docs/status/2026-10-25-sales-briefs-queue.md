---
title: "Sales briefs receiving queue implementation"
date: 2026-10-25
---

Dean requested implementation and a reviewable PR for the accepted [Sales briefs design](../decisions/sales-briefs-design.md) at `/estimating/intake` (CR-02). This contribution owns the queue UI, submitted-revision receiving read, bounded API support, exact-record handovers, focused tests and narrow contract/design-register/guide updates. The destination remains `intake`; the displayed name becomes Sales briefs.

Initial gaps: the card list lacks the accepted menu, grid, phone list, filters, counts, snapshot and selection actions. The existing receiving projection mixes latest submitted content with current aggregate fields and source-change results. Rows, counts and paging need one permission-scoped submitted-revision basis. Receiving commands and LC-13's explicit estimating link remain on the brief page; selection introduces no decisions or automatic Discovery creation.

Implementation and validation are in progress. Application visual review, owner acceptance, independent review, merge and deployment are separate and are not claimed by this scope record.
