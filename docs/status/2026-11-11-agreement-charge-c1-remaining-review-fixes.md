---
title: Agreement charge C1 remaining review corrections
date: 2026-11-11
---

[PR #905](https://github.com/deanrfiedler-gif/powerplants-one/pull/905) addresses Claude findings C1-2, C1-3 and C1-4 after M2 merged. Current main `a65ac3f4a` is integrated; the PR already targets main and its externally-ready state is preserved. [Evidence](../testing/evidence/agreement-charge-c1/README.md#remaining-review-findings-c1-2c1-4--11-november-2026) records commands, the initial expected-error correction and exact restart controls.

Omitted schedules are refused; legacy omission chains retain independent Finance approval at current and charged historical sites. The existing form explicitly withholds successor preparation for charged histories until it can carry a schedule. Renewal wording now explains the supported retained-start extension without exempting reserved dates from the term. The restart helper binds the supplied PID to the actual HTTP listener and requires the old process to have exited. Migrations 0127/0128 and historical rows are unchanged.

Fresh local validation passes 18 C1 database cases, two 0127 upgrades, three uncharged Maintenance compatibility cases, compiled HTTP, and an actual app/PostgreSQL restart. No-restart and decoy-process controls refuse. Application check passes 1,452 units/build, with a final guide-inclusive build; Contacts passes 103 model groups and documentation checks include 44 tests. Required Chrome is absent; the new form-boundary browser case is listed but unexecuted locally. Final-head CI and Claude's targeted confirmation remain separate gates. No full TS-01/TS-02, operational acceptance, merge or deployment is claimed.
