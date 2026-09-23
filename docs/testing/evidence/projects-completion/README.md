---
document_id: PPO-PJ-COMPLETION-EVIDENCE
date: 2026-09-24
owner: Dean Fiedler
status: A0 audit evidence; implementation and family acceptance outstanding
versioning: git
---

# Projects completion evidence

[Programme and source findings](../../../delivery/projects-completion-programme.md). Starting source: `ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc`. A0 changes working documentation and register metadata only. Prior PJ-09 execution remains in its [original evidence record](../project-acceptance-r01/README.md); it is not relabelled as a fresh run.

| Executed inspection | Outcome |
|---|---|
| `git fetch origin`; `git rev-parse origin/main`; `git status --short` | Current main matches the supplied checkpoint; original tree clean |
| `gh pr list --state open --limit 100 --json number,title,headRefName,baseRefName,headRefOid,url`; `gh pr view 299 --json files,mergeStateStatus,statusCheckRollup` | One PR at initial inspection; shared paths and pending checks identified |
| `git worktree list`; scoped `git status --short` on Sales/Engineering/Equipment/Estimating worktrees | Concurrent uncommitted contributions recorded; no concurrent work changed |
| `git log --all --format=%H -- <r02 path>` and SHA-256 over `git show <commit>:<path>` | Actual r02-named HTML contains r01 bytes; expected r02 hash unavailable in its reachable path history |
| Read-only live `information_schema.columns` query for Projects, tasks, dependencies, events, Activity links and Sales handovers | Current lifecycle and generated Project link confirmed; no Sales handover table in inspected database |
| `node --version`; `npm.cmd --version` | 24.21.0 / 11.19.0 |

Initial sandbox fetch/network attempts were refused, then the authorised fetch/PR reads succeeded through sandbox escalation. An initial inline schema command failed PowerShell quoting before connecting; the corrected stdin script succeeded. Neither is an application regression.

## Validation

| Command | Actual outcome |
|---|---|
| `npm.cmd run studio:check` | Pass: 273 entries, 119 source routes, 24 component entries, no errors. All 273 visual reviews and 24 component reviews remain pending |
| `node --import tsx --test tests/unit/project-acceptance.test.ts tests/unit/projects-gantt.test.ts tests/unit/department-navigation.test.ts` | Pass: 16 tests, no failures/skips. Existing acceptance gates, FS/SS/cycle/date rules and navigation/permission filtering retained |
| `python scripts/check_foundation.py` | Pass: 17 issued sources, 78 requirements, 29 decisions, 38 planned acceptance cases, 4,655 local links, no errors |
| `python scripts/check_naming.py` | Pass: 419 document records, 261 compared metadata documents, 144 Git masters, no errors |
| `git diff --check` | Pass |

The Python executable is `C:\Python314\python.exe`; the requested python3 alias is not installed. The unchanged Python scripts were run with `python`.

The first sandboxed studio/unit attempts failed before test execution with `uv_os_get_passwd ENOMEM` in tsx startup. The same failure was reproduced on clean main `ca006fb1` with `node --import tsx --test tests/unit/projects-gantt.test.ts`. Outside the sandbox, the above studio and 16 unit checks passed without source/test changes. This is an observed environment limitation, not an inferred application failure.

No new browser/HTTP/database workflow exists in A0. Build, full application suites, native PJ-01–09, consolidated browser/zoom/device checks and hosted deployment were not executed for this documentation-only reconciliation. No fresh screenshot or negative-control capture is claimed; historical PJ-09 evidence keeps its original source/limits.

The final pre-publication fetch still reported `ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc`; #299 remained the only open PR at that inspection. No intervening main changes required merging. PR/CI results must be read from the actual contribution and are separate from these local checks.
