---
title: CI scope counts the cloud setup script as documentation
date: 2026-11-02
---

A change to `scripts/cloud-setup.sh` alone no longer runs the database, browser and application suites. The script only prepares cloud workspaces; nothing in the application, its tests or CI runs it. #848, a one-script fix, waited about an hour and a half for suites it couldn't affect.

`scripts/ci_scope.py` now has a `WORKSPACE_ONLY` list holding that one file. Its self-test fails if any source, test, script, package file or workflow names the file, so the allowance ends as soon as something starts running it. Deleting or renaming the file, or changing it together with code, still runs everything. The [merge-conflict reduction record](../decisions/merge-conflict-reduction.md) carries the amendment.

Checked: `python3 scripts/ci_scope.py --self-test` passed 77 of 77 cases, including six new ones. Against #848's diff the classifier answers `docs_only=true`; against #849's, `docs_only=false`.

No application code, test, migration, permission, grant or workflow file changes.
