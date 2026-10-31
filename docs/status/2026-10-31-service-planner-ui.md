---
title: Service planner accepted design build claimed
date: 2026-10-31
---

Codex owns the PL-01 implementation at `/schedule` on `codex/service-planner`, in its dedicated worktree cut from `origin/main` at `1402c87b`. Dean explicitly authorised 20 concurrent page builds in this chat on 31 October 2026; seven open Codex PRs had pushed source changes at the preflight check. No other open PR claimed PL-01.

Scope follows the [accepted design](../decisions/service-planner-figma-design.md): collapsed Scheduling menu, toolbar, Needs attention, To plan / On hold tray, visit details and controlled move comparison. Existing booking authority, standard-hours capacity and extended-hours warnings remain. Suggestions and Map are excluded. No migration, capability, grant or dependency is planned. Related open PRs #750 and #733 retain ownership of their appointment/readiness and test corrections; shared edits must be narrowly coordinated.

Initial claim only. Application implementation, functional tests, visual comparison and owner acceptance are pending; no deployment. The historical 9 October review is preserved and must not be refreshed without actual review. Exact-head Claude review and every CONTRIBUTING merge gate remain required.
