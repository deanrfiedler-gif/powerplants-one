---
title: Design-to-build operating model aligned with the roles decision
date: 2026-11-03
---

[ADR-0067](../decisions/ADR-0067-design-to-build-operating-model.md) and the [design-to-build standard](../standards/design-to-build-standard.md) were written on 1 November 2026, the day before Dean adopted the [roles decision](../decisions/design-build-review-roles.md). They are now aligned with it:
- Claude designs and records the lock-in, Codex builds from the lock-in, and Dean accepts and merges.
- Build review comes from the other model family, once.
- The Build done comparison is part of Claude's one review of a build, not a second gate.
- Design ready stays a check by a separate Claude session before Dean's acceptance.

ADR-0067 records the change in a new Roles section, and the standard's section 12 now names who does each step. No page design is accepted.

Codex's cross-model review of the pull request found five defects, all now fixed:
- `scripts/check_design_tokens.py` follows `var()` aliases to any depth.
- It reads declarations only outside comments and quoted strings, and ignores a `!important` priority.
- It holds the original 32 unmapped names, so the baseline can only shrink.
- After the freeze, nothing is removed from `PPO - Design` during recovery.
- Two earlier, unrecorded audits are no longer described as independent reviews.

Seven new regression tests cover the script changes. The check's results on the repository are unchanged: 63 mapped, 19 design-only, 32 unmapped. All 78 parent IDs remain.
