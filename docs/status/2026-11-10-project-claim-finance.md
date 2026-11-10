---
title: Project billing B3 Finance claim backend
date: 2026-11-10
---

Draft [PR #883](https://github.com/deanrfiedler-gif/powerplants-one/pull/883) adds ProjectClaim sources to the existing Finance pipeline, dependent on unmerged B2 #881. Finance prepares exact whole reached milestones/approved positive variations, reviews them independently, retains/transfers/releases entitlement holds under the existing workspace lock, records synthetic processing outcomes and reconciles exact target amounts. Original lookup recovers uncertain outcomes without a second target. Source drift blocks new authority; source access is rechecked for history and receipts.

Migration 0126 discriminates project and WorkOrder sources on the existing handoff/line/hold tables and enforces exact source and entitlement conservation. It adds no seed or grant. Existing migration/version assertions and the reviewed demo-upgrade gate are extended. The [Finance amendment](../contracts/finance-handoff.md#b3-projectclaim-backend-amendment) defines the source-specific API queue, permission boundary, project state/hold measures and output hold. Billed value, cash and open receivables remain unavailable.

Verification: all 1,449 unit tests, lint, TypeScript, Studio and production build passed. Six explicitly labelled command-only B3 database cases, three existing WorkOrder command cases and one populated 0125 Finance upgrade case passed using the optional synthetic renderer boundary. Nine unmocked historical/demo upgrade cases, ten focused unit cases and 44 documentation tests passed. Foundation, prototype, naming and migration checks passed. The focused compiled HTTP command proof passed against the normal compiled application server, with synthetic bytes substituted only during fixture setup. Chrome is absent, so normal rendered database/HTTP/browser integration remains unrun here and required in CI; the command-only proof uses an explicit synthetic-byte renderer boundary, not real rendered output. See [execution evidence](../testing/evidence/project-commercial/README.md#b3-projectclaim-finance-backend--10-november-2026).

Claim UI and OUT-14 content, B4 project-work cost-only enforcement and TS-01 acceptance remain open. Claude's one review, full CI and Dean's merge remain outstanding. No deployment, real MYOB processing or business acceptance.
