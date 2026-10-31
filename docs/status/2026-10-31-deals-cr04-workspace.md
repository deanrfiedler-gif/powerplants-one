---
title: Deals CR-04 workspace implementation and validation
date: 2026-10-31
---

PR #699 resumes the 24 October claim from preservation commit `e2123a86` in the dedicated `codex/deals-cr04-accepted` worktree. Dean directly authorised up to ten concurrent page builds on 31 October; no repository-wide limit change is included in this feature PR. Current main was merged without discarding additive work.

The accepted CR-04 Board, List, Forecast, Archive, snapshot, filters, selection/CSV, creation and outcome interactions now use native authorities and the shared shell/register patterns. The bounded snapshot API checks exact native quotation, estimate and handover versions and permissions; advisory prompts do not add transition rules. The current-page, complete-result and selection denominators remain explicit, with unknown money preserved. The older branch now uses a consumer-binding fragment and the shared workspace attribute, without extending frozen component/CSS lists.

Focused unit (10), native database (2), HTTP (3), CR-04 browser (9 across final focused runs) and retained CRM presentation (13) cases have passed. Application captures at 1440, 1024, 390 and 320 px were inspected against r02; [evidence and adaptations](../testing/evidence/deals-cr04/README.md) keep fixed design reads separate from native command proof. Full lint, the 8192 MB typecheck and studio:check passed. The broader retained native CRM retry remains non-green; dependency/read failures also reproduced against unmodified main. Exact results and final documentation validation are recorded in the evidence report. Expected close filtering remains outside this implementation while PR #790 is unmerged. No migration, capability, grant or dependency was added. Functional proof, developer visual inspection, owner acceptance and deployment remain separate; no visual acceptance or deployment is claimed.
