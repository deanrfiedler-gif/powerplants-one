---
title: Cloud setup moves the temp folder away from .git
date: 2026-11-03
---

`tests/unit/recovery.test.ts:101` fails in Codex Cloud with "Recovery data must stay outside Git", because `/tmp` and `/workspace` there contain a `.git` entry. Rules version 2.5 recorded this as a pre-existing failure.

When the current temp folder has `.git` in any parent, `scripts/cloud-setup.sh` now uses a private folder under the first of `/var/tmp` and `/dev/shm` that is writable and free of `.git`, and writes `TMPDIR` into `.ppo-tools/env.sh`. Sourcing `env.sh` recreates the folder, because Codex review found that a fallback under `/dev/shm` was gone in a later shell. A clean temp folder stays as it is. If neither candidate works, the script warns and carries on.

Checked locally: `bash -n`, the temp-folder logic in Git Bash, and the generated `env.sh` lines recreating a removed folder. Codex ran the first version in Codex Cloud: it chose `/dev/shm/ppo-tmp-1000` and `tests/unit/recovery.test.ts` passed 2 of 2. The recreate step has not been run in Codex Cloud.

No application code, test, migration, permission, grant, CI workflow or branch protection changes.
