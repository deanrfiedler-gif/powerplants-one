---
title: Withdrawn braces advisory exception removed from the audit gate
date: 2026-10-24
---

GitHub withdrew `braces` advisory [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) on 23 October 2026 (`withdrawn_at` 2026-10-23T12:53:02Z). On main, `node scripts/check-npm-audit.mjs` therefore warned that the exception no longer matched anything. That exception was the only one recorded under [ADR-0056](../decisions/ADR-0056-dependency-update-and-audit-gates.md). It has been deleted from `scripts/check-npm-audit.mjs`. The `exceptions` list and its comment remain, now empty, so a future exception still has a place to go. ADR-0056 has a dated note recording the removal; its 15 October decisions are otherwise unchanged. `package-lock.json` is unchanged, so the DK06-OUT09-1 template fingerprint is unaffected. `braces` 3.0.3 stays locked through lint tooling.

Checks: `python3 scripts/build_status.py --check` passes. On this branch's lockfile (main's), the full-tree gate prints no warning but still fails on one unexcepted advisory: zod 4.5.4, [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). `npm audit --omit=dev --audit-level=high` fails on the same zod advisory. Both failures are already on main and are addressed by the separate draft [PR #683](https://github.com/deanrfiedler-gif/powerplants-one/pull/683), which waits on Dean's decision about the template consequence. The edited script was also run against #683's lockfile in a scratch copy outside the repository. It passed with no warning and reported "No unexcepted high or critical advisories (0 excepted, 0 exceptions recorded)", and the runtime step found 0 vulnerabilities. This branch's Dependency audit check stays red until #683 merges.

The decision index and `docs/STATUS.md` still describe `braces` as the one exception. They are left unchanged under the routine-PR rule in the [source-isolation decision](../decisions/documentation-source-isolation.md).
