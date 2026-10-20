---
title: Inspections build claimed; instrument attribution decision needed
date: 2026-10-21
---

The FI-03/FI-04 accepted Inspections build is claimed in draft PR #647. The existing [acceptance record](../decisions/inspections-figma-design.md), live Figma notes and File index agree on the accepted design. Source inspection found that the design associates instruments with individual readings while the built model retains instruments against an entire attempt. The [page contract](../design/development/pages/route-service-inspections.md#data-contract-gap-requiring-an-owner-instruction) records a proposed explicit attribution extension and its historical-integrity and upgrade obligations. No migration has been reserved and no application code has changed; the user's migration stop condition requires an owner instruction before proceeding.

The local read-only schema inspection could not connect to PostgreSQL (`ECONNREFUSED`), so live schema confirmation remains open. Exact outcome preparation before issue also needs implementation; the shared byte store and existing event ledger may support it without a migration. Code delivery, functional proof, owner visual review and deployment remain incomplete.
