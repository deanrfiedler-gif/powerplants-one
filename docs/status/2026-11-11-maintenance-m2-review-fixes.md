---
title: Maintenance M2 independent review corrections
date: 2026-11-11
---

[PR #904](https://github.com/deanrfiedler-gif/powerplants-one/pull/904) addresses Claude findings M2-1 and M2-2 on reviewed head `9c29ef63a`. Agreement defaults now require the current scope to be the authorised approved scope; an unapproved Covered draft cannot advertise free-service defaults. The B4 contract states that fallback reasons apply only to NonBillable lines. Authorised coverage history and project precedence are retained. [Evidence](../testing/evidence/maintenance-m2/README.md#independent-review-corrections--11-november-2026) records reproduction, fixture correction and validation.

Local application check passes (1,450 units/build); all nine M2 and 15 B4 cases pass across the recorded broad run and corrected one-case fixture rerun. Documentation checks and 44 documentation tests pass. Current main `2d9a8ff24` is integrated. No schema, permission, seed, UI or new increment. Chrome is absent in the new environment; synthetic-byte checks are not rendered or whole-scenario acceptance. Claude finding confirmation and full final-head runtime CI remain separate. C1 #905 stays stacked until Dean's M2 merge; #897 remains untouched and no fourth implementation is opened. No merge or deployment.
