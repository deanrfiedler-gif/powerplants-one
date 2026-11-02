---
title: Shared cloud setup script
date: 2026-11-02
---

`scripts/cloud-setup.sh` prepares a disposable cloud workspace (Codex Cloud or Claude Code cloud) the same way each time, so cloud tasks no longer depend on how an environment settings page saves its setup.

- **Node and npm.** Installs the pinned Node (`.nvmrc`) and npm (`packageManager`) beside the checkout in `.ppo-tools/`, without root. The Node binary comes from the npm registry's official `node-linux-<arch>` package, checked by npm against its published integrity hash, because cloud sandboxes reach the registry but not nodejs.org. It writes `.ppo-tools/env.sh` for later shells.
- **Dependencies and settings.** Runs `npm ci` and creates `.env.local` from `.env.example` exactly as CI does.
- **PostgreSQL.** Uses the system PostgreSQL 16 package where it runs as root; otherwise starts CI's `postgres:16.15` image in Docker, the route the #693 Codex Cloud task used; otherwise uses a server already listening on 127.0.0.1:5432. It creates CI's disposable role, password and `ppo_synthetic_test` database with 256 lock slots, then migrates, seeds and checks health.
- **Browser.** Runs `npm run browser:install` where it has root; when that fails or root is unavailable, it reports the browser as unavailable.
- It ends with a summary and tells the task to report suites that need an unavailable service as not run and left to GitHub CI.

Checked in a Claude Code cloud workspace (root, Ubuntu 24.04), 2 November 2026: two consecutive runs completed. Node v24.21.0 and npm 11.19.0; `db:migrate`, `db:seed` and `db:health` completed against PostgreSQL 16.15 with 121 migrations; `tests/database/mobile-crm.test.ts` passed 3 of 3 and `tests/database/policy-command-http.test.ts` passed 1 of 1.

Not checked:
- The browser step completed nowhere. In that workspace the download from dl.google.com is blocked and a preinstalled Chrome 153.0.8010.12 is below the reviewed versions, so `browser:install` failed and the script reported the browser as unavailable.
- The Docker route has not run from this script. It follows the commands the #693 Codex Cloud task used, but the published port has not been proven reachable from a Codex Cloud task.
- No Codex Cloud task has run the script yet.

No application code, test, migration, permission, grant, CI workflow or branch protection changes.
