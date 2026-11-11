---
title: Maintenance M2 agreement billing defaults
date: 2026-11-11
---

[PR #904](https://github.com/deanrfiedler-gif/powerplants-one/pull/904) implements M-R3 backend preparation defaults for Covered agreement WorkOrders, with project billing B4 precedence. The [Finance amendment](../contracts/finance-handoff.md#m2-agreement-covered-workorder-defaults), [decision](../decisions/maintenance-service-ts02-decisions.md#m2-backend-implementation--11-november-2026) and [evidence](../testing/evidence/maintenance-m2/README.md) define the exact boundary: source API defaults and NonBillable reason fallback, explicit reasoned Billable exceptions, no UI or schema/grant change.

Verification passed: full application check with 1,450 unit tests and production build; eight new database cases and 15 B4 regressions; foundation, prototype, naming, migration and status checks plus 44 documentation tests. Document-dependent cases explicitly use the existing synthetic-byte renderer helper, not real PDF evidence. Chrome is absent; normal rendered/HTTP/browser suites and independent Claude review remain required. C1 is a separate stacked contribution. No merge, deployment, TS-02 acceptance or operational authority is claimed.
