---
title: Warranty to Supply native return receiving
date: 2026-11-13
---

[PR #945](https://github.com/deanrfiedler-gif/powerplants-one/pull/945) implements a bounded MA-07 → SC-08 backend bridge. An exact authorised Warranty claim and complete original delivery prepare one source-bound native Supply return. Warranty and Supply retain separate original operation receipts in the same transaction; native Supply controls authorisation, receipt, disposition and supplier movement. Permission-scoped progress never implies customer resolution or Finance credit.

The [contract](../contracts/maintenance-warranty-api.md#warranty-to-supply-return-receiving), [decision](../decisions/warranty-supply-return-receiving.md) and [execution ledger](../testing/evidence/warranty-supply-return/README.md) preserve the exact boundary. No migration, capability, grant, UI or external adapter is added. Old external return events remain unchanged. Independent Claude review, final-head CI, owner acceptance and merge remain separate; nothing is deployed.

<!-- decision-index -->
[Warranty to Supply return receiving](../decisions/warranty-supply-return-receiving.md) records the bounded native bridge and source/authority rules as a Codex implementation decision under the standing order.
