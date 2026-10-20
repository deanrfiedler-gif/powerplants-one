# Create discovery workspace — execution evidence

<!-- versioning: git -->

Scope ES-02, route `/estimating/discovery/new`. Reference: **PPO - Design**, page `1414:356570`, named version **Create discovery workspace — accepted**. [Page contract](../../../design/development/pages/route-estimating-discovery-new.md) lists every frame and adaptation. This record is in progress.

## Checks run

- First `tsc --noEmit --pretty false` passed before the new browser fixture files were added. Final source check follows separately.
- `node --import tsx --test tests/unit/discovery-creation-page.test.ts`: 3 passed, 0 failed. Covers reported Sales statements, explicit follow-ups, stale-source refusal and preserving oversized accepted text.
- `git diff --check` passed before final documentation updates.
- Focused ESLint and browser checks are running; no passing result is claimed yet.

## Local environment limits

The Windows worktree uses installed dependencies through a junction. The standard development launcher failed before serving the page because Turbopack refused the junction target outside its root. An ignored local copy of the same loopback launcher selects installed Webpack for visual validation on port 3107. No application configuration or dependency changed. This fallback is not a successful standard build.

Browser tests use deterministic synthetic API observations and stable UUIDs. They exercise real page controls and recovery requests, but do not prove database permissions or transaction acceptance; the [prerequisite record](../discovery-creation/README.md) owns that evidence. Captures hide runtime icon glyphs. Retained Figma reference bytes are unchanged.

## Review and delivery

Owner visual review: pending. Paired application comparison: in progress. Physical-device, assistive-technology and browser-zoom acceptance: pending. Deployment: not performed. Documentation checks and automated behaviour do not grant business acceptance.
