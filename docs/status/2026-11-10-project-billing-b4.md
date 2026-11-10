---
title: Project billing B4 cost-only backend
date: 2026-11-10
---

[PR #893](https://github.com/deanrfiedler-gif/powerplants-one/pull/893) continues the existing B4 claim after B3 merged. Finance now requires every line of a currently project-linked WorkOrder to be NonBillable at submission, approval and begin processing, including revised Drafts and pre-existing Approved handoffs. Closed projects remain subject to the rule. Historical schemas without the link remain compatible. Backend reason defaults do not confer an override; additional work uses approved variation ProjectClaims. No UI, migration, seed, permission, grant or dependency changes.

The [B4 contract](../contracts/finance-handoff.md#b4-project-linked-workorder-cost-only-amendment), [backend plan](../delivery/backend-completion-plan.md#project-billing-b4-backend--10-november-2026) and [execution evidence](../testing/evidence/project-billing-b4/README.md) record the scope and validation boundaries. TS-01’s procedure now separates the API claim path from unavailable claim UI/OUT-14 and orders new claim authority before project closeout. Connected synthetic Finance proof is not full TS-01 acceptance. Validation is in progress; Claude review and full rendered CI remain required. No merge, deployment or real ERP action is claimed.
