---
title: Service planner accepted design implementation in draft
date: 2026-10-31
---

Codex owns the PL-01 implementation at `/schedule` on `codex/service-planner`, in its dedicated worktree cut from `origin/main` at `1402c87b`. Dean explicitly authorised 20 concurrent page builds in this chat on 31 October 2026; seven open Codex PRs had pushed source changes at the preflight check. No other open PR claimed PL-01.

Scope follows the [accepted design](../decisions/service-planner-figma-design.md): collapsed Scheduling menu, toolbar, Needs attention, To plan / On hold tray, visit details and controlled move comparison. Existing booking authority, standard-hours capacity and extended-hours warnings remain. Suggestions and Map are excluded. No migration, capability, grant or dependency is planned. Related open PRs #750 and #733 retain ownership of their appointment/readiness and test corrections; shared edits must be narrowly coordinated.

Draft implementation adds the side menu, compact toolbar, gate-backed attention band, tray/44 px strip and current/proposed move comparison, preserving native commands and working-hours rules. The existing work-order states do not identify Parts, Customer or Access window holds, so absent reasons remain unavailable; no expiry is invented. See [build evidence](../testing/evidence/service-planner-build/README.md).

Focused units (24), typecheck, lint, studio, foundation, naming, prototype and status checks have passed during development. Database tests hit the unchanged reset deadline, also reproduced by an existing test on untouched main; the exact new hold assertions passed separately after native setup. The focused HTTP hold-contract case passed. Full browser proof and visual comparison are in progress; owner acceptance is pending and no deployment occurred. The historical 9 October review is preserved and must not be refreshed without actual review. Exact-head Claude review and every CONTRIBUTING merge gate remain required.
