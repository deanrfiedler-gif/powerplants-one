---
title: Conversations navigation proof repair
date: 2026-10-21
---

Dean authorised a separate investigation of the Conversations navigation failure blocking Facilities PR #627. Codex claims the repair on `codex/conversations-navigation-proof`, cut from current main `bd5d6e6c`. The accepted [T1c design](../decisions/conversations-t1c-design.md#52-pages-and-components) opens the preferred thread on desktop and retains the list on phones; the failing browser assertion expected the list URL on both.

The repair in separate draft PR #654 asserts the exact desktop thread destination, the populated phone list and explicit thread handover, and successful mark-read acknowledgement before checking the unread badge. Existing current-page and permission checks and standard deadlines remain. The page contract, register and guide describe the existing accepted destinations. No application behaviour, migration, capability, dependency, Facilities implementation or assistant-core work changes.

All six final navigation repetitions, 38 Conversations unit cases and the full compiled Conversations browser file passed locally (55 passes / seven existing viewport skips). Lint, type checking, build, studio, naming, foundation and generated-document checks passed. The combined check stopped at four full-suite unit failures: three reproduce on unchanged main, while the CPQ timing failure passed on main and in a focused repair-tree rerun. The full unit run is not a pass; Linux CI remains pending. [Verification evidence](../testing/evidence/conversations-navigation/README.md) records the baseline, intermediate badge timing failure and limits. Facilities PR #627's remaining database-2 job passed, completing its Application assurance run successfully; its separate compiled-suite Conversations failure is addressed only in #654. Owner review, deployment and business acceptance remain separate.
