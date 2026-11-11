---
title: Agreement charge C1 cross-revision entitlement review correction
date: 2026-11-11
---

[PR #905](https://github.com/deanrfiedler-gif/powerplants-one/pull/905) corrects Claude finding C1-1: a title-only agreement successor must not issue a fresh entitlement for an already Held or Consumed charge. Conservation now uses agreement + stable charge UUID across revisions; a revised pre-effect Draft transfers its hold atomically. Reserved date, amount, currency and tax basis must remain unchanged in successors. [Evidence](../testing/evidence/agreement-charge-c1/README.md#c1-1-independent-review-correction--11-november-2026) records the source, reservation and validation; [contract](../contracts/maintenance-warranty-api.md#c1-reviewed-agreement-charge-schedules) retains source provenance and approval duties.

Additive migration 0128 preserves all 0127 bytes and historical rows. A duplicate pre-fix live history refuses upgrade without rewriting evidence. No seed, grant, UI, new feature increment, reversal or operational charging policy. Current main `2d9a8ff24` is integrated; #897 remains separately owned and the three-build limit is respected. New-migration review/finding confirmation, final-head runtime CI, Dean's M2 merge and C1 retargeting remain separate gates. Chrome is absent; no full TS-01/02 or real rendered evidence, merge or deployment is claimed.
