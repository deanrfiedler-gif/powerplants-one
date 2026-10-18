---
title: Merge conflict reduction proposed
date: 2026-10-18
---

After 21 or more open pull requests repeatedly conflicted on `docs/STATUS.md`, the decisions index, the document register and generated files, and #568 and #569 both claimed migration 0108, a [proposed working rule](../decisions/merge-conflict-reduction.md) (PPO-MERGE-CONFLICT-DEC) adds three controls. Dean's decision on the open items below is still needed.
- **Fragments.** This entry is the first: a change adds `docs/status/YYYY-MM-DD-slug.md` and `python3 scripts/build_status.py` renders `docs/STATUS.md` and the decisions index from it, newest first, above the unchanged earlier text. The foundation check fails if the rendered part is edited by hand or the earlier part gains an entry. The rendered files can still conflict, but the fix is mechanical (see the [fragment guide](../status/README.md)).
- **Migration numbers.** `scripts/check_migrations.py` fails on duplicate, unregistered or out-of-order migration and seed versions and on a reservation for a number already used. A pull request claims its number with `--reserve` in `db/reservations/`; `--open-prs` compares against other open pull requests.
- **Working agreements** in [CONTRIBUTING.md](../../CONTRIBUTING.md#working-in-parallel): one owner per branch, no stacking beyond one level, re-merge `origin/main` right before each push.

Open for Dean, not changed here: turning off "Require branches to be up to date" in favour of a merge queue or a merged-tree check, rendering the fragments after merge by workflow, and an open-pull-request check in CI. Branch protection and workflow files are untouched. Not verified: behaviour with two real concurrent pull requests, or GitHub's "Update branch" button on the rendered files. No application code, migration, permission or parent ID changes.

<!-- decision-index -->
[Reducing merge conflicts between parallel pull requests](../decisions/merge-conflict-reduction.md) (PPO-MERGE-CONFLICT-DEC) is a **proposed** working rule of 18 October 2026: changes add a `docs/status/` fragment instead of editing `docs/STATUS.md` and this index, migration and seed numbers are reserved one file per number and checked for duplicates, and branches have one owner, one level of stacking and a re-merge before each push. It lists the branch-protection, merge-queue and workflow changes that remain Dean's decision.
