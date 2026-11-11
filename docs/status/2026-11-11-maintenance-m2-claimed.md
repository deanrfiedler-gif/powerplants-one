---
title: Maintenance M2 billing defaults claimed
date: 2026-11-11
---

Codex claims M2 of [the adopted maintenance decision](../decisions/maintenance-service-ts02-decisions.md): agreement-covered WorkOrder Finance defaults with project R3 precedence. Dean instructed proceeding with M2 and C1 in chat. This claim starts no implementation. Expected paths: `src/finance/service.ts`, a source-local Finance helper if needed, focused database/unit tests, the Finance contract, maintenance decision, backend delivery plan, execution evidence and a dated completion fragment. No UI, grant or migration is expected for M2. C1 follows as a separate contribution.

Inspection adds `src/finance/reads.ts` and `src/finance/validation.ts` to the declared scope: the sources API exposes defaults; validation retains explicit dispositions and reasons for Billable overrides. The helper is `src/finance/work-allocation-defaults.ts`.
