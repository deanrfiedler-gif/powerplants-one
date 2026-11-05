---
title: Cloud setup keeps synthetic documents beside the tools
date: 2026-11-02
---

The first full run of `scripts/cloud-setup.sh` in Codex Cloud (2 November 2026) fetched `main`, installed Node 24.21.0 and npm 11.19.0, started CI's `postgres:16.15` image through Docker and completed `db:migrate`. `db:seed` then failed: `ENOENT: no such file or directory, mkdir '/home/agent/.ppo-synthetic-documents'`. The synthetic document store defaults to `~/.ppo-synthetic-documents`, and Codex Cloud's home folder is not usable.

When `PPO_DOCUMENT_DIRECTORY` is unset and the home folder can't hold the store, the script now sets it to `.ppo-tools/synthetic-documents` beside the checkout, creates the folder, and writes the setting into `.ppo-tools/env.sh` for later shells. Where the home folder works, nothing changes. Both readers of the store (`src/documents/store.ts` and `src/estimating/fertigation/orphan-maintenance.ts`) already honour `PPO_DOCUMENT_DIRECTORY`.

Checked in a Claude Code cloud workspace with `HOME` pointed at an unwritable path: the script exited 0, `db:migrate`, `db:seed` and `db:health` completed, and `env.sh` carried the new setting.

No application code, test, migration, permission, grant, CI workflow or branch protection changes.
