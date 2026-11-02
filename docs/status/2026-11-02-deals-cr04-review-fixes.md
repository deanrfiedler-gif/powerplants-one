---
title: Deals CR-04 review corrections
date: 2026-11-02
---

PR #699 addresses Claude review 5743113432 on d320cf27: changed worklist polls retain open drafts while clearing and explaining selection/sequence, and follow-through reads only on opening or explicit reload. The existing server read contract remains unchanged.

Current main was merged without conflicts; #851 was not merged when this handover resumed. The review waiver and earlier instruction to merge remain superseded. Dean merges after review; Codex does not merge.

The same PR accounts for all nine failures across the four completed compiled-browser jobs: drag recovery, phone owner/outcome navigation, insights entry and card/menu/scrollbar geometry. The separate UI conformance failures are also addressed. The [CR-04 evidence](../testing/evidence/deals-cr04/README.md) distinguishes inspected CI failures, implemented corrections and checks actually run. New browser regressions are supplied for the two review findings. Browser execution and visual acceptance remain with GitHub CI and owner review.
