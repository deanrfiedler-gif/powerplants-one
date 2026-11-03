---
title: Migrations get a 120 s statement bound; cloud setup keeps the document store private
date: 2026-11-03
---

`migrate()` in `scripts/database.ts` now sets `statement_timeout = '120s'` for its own transaction, as `seed()`, `reset()` and `tests/helpers/recover-schema.ts` already do. Before this, each migration statement inherited the pool's 10 s application limit. On 3 November 2026 the DK-B09 populated 0088 upgrade in `tests/database/document-library.test.ts` was cancelled with PostgreSQL 57014 during `migrate(88)`, in migration 0051, while five database suites ran with a concurrent health probe. The same test passed alone on clean main (34 s) and on the merged #770 tree (18 s), so the failure was load, not a schema defect. `SET LOCAL` ends with the transaction, so application reads keep the 10 s limit. The hosted-demo setup command (`scripts/demo-database.ts`) calls `migrate()` and `seed()`, so its migrations now share the bound its seeding already had.

`scripts/cloud-setup.sh` now creates the synthetic document folder with mode 700 and corrects an existing folder to 700. `src/documents/store.ts` refuses a folder that group or others can read. Under the usual umask 022 the earlier plain `mkdir -p` made it 755, so `db:seed` failed with "The exact document version is unavailable" and setup exited with an error in a Claude cloud workspace.

Checked in a Claude cloud workspace: `bash -n scripts/cloud-setup.sh`; the edited setup run against a folder set to 755 corrected it to 700 and exited 0 (migrate and seed completed, database ready, browser unavailable); `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py` passed. `npm run check` passed register, lint and typecheck; its unit stage had 1,321 passed and 15 failed, all T2d/T2e assistant-SDK tests in `tests/unit/assistant-claude.test.ts` and `tests/unit/assistant-evaluation.test.ts`. The same 15 fail on clean main `9d953fed4` in the same workspace (13 and 2), with the request never reaching the stubbed transport, so they are pre-existing in this environment and not caused by this change; Codex Cloud passed them on 3 November 2026. A separate `npm run build` passed (82 static pages). Database and browser suites are left to GitHub CI.

No migration, seed, registry, permission, grant, application behaviour, CI workflow or branch protection change.
