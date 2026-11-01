---
title: B1 typed project link on work orders
date: 2026-10-30
---

A Service work order can now belong to one project through a typed link, which closes the first part of TS-01 finding F-02. Migration 0122 adds an optional `work_orders.project_id` with database guards: same company and customer, an Active project when linking, no direct switch between projects and no change once a visit has started. Existing work orders stay unlinked; nothing is read from the free-text `project_reference`. Linking and unlinking each need a reason, both expected versions, `project.edit` on the project and `service.work_order.edit` on the work order. No capability or grant was added. The project page gains a Field work card that lists only the work orders the reader may read, never a count of hidden ones, and the work order page shows its project only to readers of that project. See the [Service API B1 amendment](../contracts/service-api.md#b1-typed-project-link-amendment--30-october-2026-implementation-in-review) and the [verification note](../testing/evidence/work-order-project-link/README.md).

This builds rule R1 of the project field work and milestone billing decision, still proposed in [PR #751](https://github.com/deanrfiedler-gif/powerplants-one/pull/751). Claude made the detailed choices under Dean's standing order of 30 October 2026 as agent decisions, listed in the verification note; Dean has not accepted them.

Not done: Raise field work from the project, increments B2 to B4, and paired visual or owner review. Locally, renderer-dependent database suites fail with `RenderOrStorageFailure` because the container's Chrome is below the pinned renderer, so the CI database shards are the authority for the migration ripple. The pull request needs a cross-model review because it adds a migration.
