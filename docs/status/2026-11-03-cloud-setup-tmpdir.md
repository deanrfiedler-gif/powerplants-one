---
title: Cloud setup moves the temp folder away from .git
date: 2026-11-03
---

`tests/unit/recovery.test.ts:101` fails in Codex Cloud with "Recovery data must stay outside Git", because `/tmp` and `/workspace` there contain a `.git` entry. Rules version 2.5 recorded this as a pre-existing failure.

When the current temp folder has `.git` in any parent, `scripts/cloud-setup.sh` now uses a private folder under the first of `/var/tmp` and `/dev/shm` that is writable and free of `.git`, and writes `TMPDIR` into `.ppo-tools/env.sh`. A clean temp folder stays as it is. If neither candidate works, the script warns and carries on.

Checked locally: `bash -n`, and the temp-folder logic in Git Bash against folders with and without a `.git` parent. It has not been run in Codex Cloud, so the unit test's result there is still to be confirmed by the next Codex task.

No application code, test, migration, permission, grant, CI workflow or branch protection changes.
