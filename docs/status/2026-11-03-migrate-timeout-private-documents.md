---
title: Migrations get a 120 s statement bound; cloud setup keeps the document store private
date: 2026-11-03
---

`migrate()` in `scripts/database.ts` now sets `statement_timeout = '120s'` for its own transaction, as `seed()`, `reset()` and `tests/helpers/recover-schema.ts` already do. Before this, each migration statement inherited the pool's 10 s application limit. On 3 November 2026 the DK-B09 populated 0088 upgrade in `tests/database/document-library.test.ts` was cancelled with PostgreSQL 57014 during `migrate(88)`, in migration 0051, while five database suites ran with a concurrent health probe. The same test passed alone on clean main (34 s) and on the merged #770 tree (18 s), so the failure was load, not a schema defect. `SET LOCAL` ends with the transaction, so application reads keep the 10 s limit. The hosted-demo setup command (`scripts/demo-database.ts`) calls `migrate()` and `seed()`, so its migrations now share the bound its seeding already had.

`scripts/cloud-setup.sh` now creates the synthetic document folder with mode 700 and corrects an existing folder to 700. `src/documents/store.ts` refuses a folder that group or others can read. Under the usual umask 022 the earlier plain `mkdir -p` made it 755, so `db:seed` failed with "The exact document version is unavailable" and setup exited with an error in a Claude cloud workspace.

Checked so far: `bash -n scripts/cloud-setup.sh`; setup exited 0 after the folder was corrected to 700 by hand (database ready, browser unavailable); `python3 scripts/build_status.py --check`. Still to run here, and recorded in the pull request when done: `npm run check` and the edited setup script against a 755 folder. Database and browser suites are left to GitHub CI.

No migration, seed, registry, permission, grant, application behaviour, CI workflow or branch protection change.
