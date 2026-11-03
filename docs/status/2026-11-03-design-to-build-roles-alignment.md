---
title: Design-to-build operating model aligned with the roles decision
date: 2026-11-03
---

[ADR-0067](../decisions/ADR-0067-design-to-build-operating-model.md) and the [design-to-build standard](../standards/design-to-build-standard.md) were written on 1 November 2026, the day before Dean adopted the [roles decision](../decisions/design-build-review-roles.md). They are now aligned with it:
- Claude designs and records the lock-in, Codex builds from the lock-in, and Dean accepts and merges.
- Build review comes from the other model family, once.
- The Build done comparison is part of Claude's one review of a build, not a second gate.
- Design ready stays a check by a separate Claude session before Dean's acceptance.

ADR-0067 records the change in a new Roles section, and the standard's section 12 now names who does each step. No other rule changed, and no page design is accepted. ADR-0067 still awaits the cross-model review its pull request requires. All 78 parent IDs remain.
