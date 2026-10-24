---
title: "Security: zod lock update for GHSA-mrhx-c7xc-m3w5"
date: 2026-10-24
---

The locked `zod` moves from 4.5.4 to 4.6.7 in `package-lock.json`. [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) (high, published 1 October 2026) says zod before 4.6.6 can exhaust memory while validating oversized constrained collections. The runtime step of the [Dependency audit](../decisions/ADR-0056-dependency-update-and-audit-gates.md) gate allows no exceptions, so it failed on main at 0691b661 and on every open pull request.

- **Lockfile only.** `zod` is not a direct dependency. `@anthropic-ai/sdk` declares it as an optional peer, and `eslint-plugin-react-hooks` and `zod-validation-error` depend on it. All three accept `^3.25.0 || ^4.0.0`. `npm update zod --package-lock-only` changed the version, `resolved` and `integrity` lines of `node_modules/zod` and nothing else. `package.json` is unchanged and no package is added or removed. 4.6.7 is the newest 4.6 patch, published 12 October 2026.
- **Template consequence (ADR-0056, [renderer manifest](../decisions/template-renderer-manifest.md)).** The retained DK06-OUT09-1 contract fingerprints the whole of `package-lock.json`. Once this merges, every managed OUT-09 publication (version 3 or later) made under DK06-OUT09-1 reads `DefinitionChanged`. Job pack preparation, check and issue then refuse with `TemplateUnavailable` at each site it is assigned to, until it is republished as DK06-OUT09-2 and assigned as a successor. DK06-OUT09-2 publications record only the Playwright versions, which do not change here. Legacy version 1–2 definitions and OUT-10/OUT-14 do not fingerprint the lockfile.

Checked locally on 24 October 2026:
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities. Against main's lock, it reports the zod high.
- `node scripts/check-npm-audit.mjs`: no unexcepted high or critical advisory.
- `npm ci --engine-strict=false` (Node 24.22.1 here against the 24.21.0 pin): installed zod 4.6.7; 0 vulnerabilities.
- Typecheck (`tsc --noEmit`) and lint (`eslint .`): passed. No tracked file imports zod.
- Unit tests: 1,074 of 1,083 passed. Four suites (`azure-demo`, `cpq-packages`, `cpq`, `foundation`) timed out in the parallel run; all 28 of their tests passed when rerun one at a time. The other three are the `document-store` (2) and `recovery` folder checks recorded as failing on Windows on main; they neither read the lockfile nor load zod. The Claude adapter tests pass (27 of 27) once the Claude Code session's own `ANTHROPIC_BASE_URL` and `NODE_USE_SYSTEM_CA` are unset; the adapter refuses those by design.
- `python3 scripts/build_status.py --check` and `python3 scripts/check_naming.py`: passed.
- Not run locally: database, HTTP and browser suites. CI runs them.

Not done:
- **Merge.** Dean decides whether to merge, because of the template consequence above.
- **Stale braces exception.** GitHub withdrew [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) on 23 October 2026, so `scripts/check-npm-audit.mjs` now warns that its `braces` exception no longer matches. The warning appears on main too. Removing the exception is a separate change.
