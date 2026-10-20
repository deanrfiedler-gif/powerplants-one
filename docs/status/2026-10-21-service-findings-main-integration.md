---
title: SV-07 split CI passes; PR 634 integrates the newer migration history
date: 2026-10-21
---

All 22 workflows passed for PR #634 head `70260676`, including the repaired compiled desktop shards and mandatory aggregate. Main `4c1097cc` subsequently introduced migration 0113, conflicting with the pending 0111 histories. The integration retains both migrations, exact upgrade expectations and original ledgers; the hosted-demo count includes both. Populated 0109 and late-0111-after-0113 upgrade cases passed locally, and independent second-model review found no defects in the resolution. The [evidence record](../testing/evidence/service-findings/README.md) distinguishes the completed CI checkpoint and focused local proof from the combined head, whose fresh CI remains required. Scope remains BC-06 SV-07 R2 backend; page work, recurrence, SV-08, business approval and deployment remain separate.
