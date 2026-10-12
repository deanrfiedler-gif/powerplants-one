# Projects register execution record

Owner: Dean Fiedler. Implementation requested 13 October 2026. Branch: `codex/projects-figma-ui`, based on main `c3ff5b9`.

The [decision](../../../decisions/projects-register-native.md) records source nodes, semantics and adaptations. The read adds no migration, seed, grant or business command. The existing application routes and original records remain intact.

## Checks

- Unit checks: CSV escaping/formula protection and the site's local date boundary.
- Database check: native creation and schedule commands, incomplete/complete/undated milestones, at-risk task separation, full-match counts, filtered views, deterministic pagination, invalid cursor/sort rejection, permissions, reconnection and unchanged history.
- Native browser check: desktop/phone register, exact saved snapshot, milestone tab, sequential inspection, CSV download, restorable filters, phone selection, closeout navigation, denied reads, and the retained Gantt link.
- Conformance uses the independently read Figma measurements and original private renders. Captures containing licensed artwork remain outside the public repository. Public icon-free reference captures are missing; owner/device acceptance remains open.

Recorded runs on 13 October:

- Two focused unit tests passed (CSV safety and local date boundary).
- The native database scenario passed, including permission profiles, three full-match counts, schedule facts, signed paging, reconnect and unchanged history. Full command completed with one pass, zero failures, in 610.6 seconds under heavy local memory pressure. A subsequent missing-anchor guard is awaiting the final replay/CI.
- Initial TypeScript check found one invalid fallback icon name, corrected to the existing contacts glyph. Final TypeScript and lint checks remain in progress.
- Initial studio check found the page heading spelling and an indirect shell consumer binding. Both were corrected without changing review fingerprints; final check pending.
- Initial naming check found the copy-ready instruction size limit. Wording was shortened; final check pending.
- Browser, compiled build and final documentation results remain pending. A listed test is not a passing result.

## Environment and retained setup failure

Windows; Node 24.21.0; isolated PostgreSQL 16 instance on a task-specific loopback port, database `ppo_synthetic_test`; application on its own loopback port. No existing app or another task's database was reset. The first database reset failed with PostgreSQL `out of shared memory` and its explicit `max_locks_per_transaction` hint. The isolated cluster is corrected to 512, matching the repository test setup; this setup failure is retained separately from test results.

Current scope excludes hosted deployment and business acceptance until actually established. The user asked for the live application; source delivery alone must not be described as deployed.
