---
document_id: PPO-MERGE-CONFLICT-DEC
date: 2026-10-18
owner: Dean Fiedler
status: Proposed repository working rule; the scripts and checks apply from merge, and Dean's decision on the open items below is still needed; changes no application behaviour
source_commit: c089e132de43a046c5b2938851ed59f0de770259
versioning: git
---

# Reducing merge conflicts between parallel pull requests

## Context

On 17 and 18 October 2026 more than twenty pull requests were open at once. They repeatedly conflicted with `main` and went "behind" it, mainly on four shared files: `docs/STATUS.md`, `docs/decisions/README.md`, `docs/standards/document-register.csv` and the shell design records. Two pull requests (#568 and #569) both claimed migration 0108, and generated files (the access-review design and the UI build sequence) conflicted whenever two branches regenerated them. Branch protection requires a branch to be up to date before it merges, and a full CI run takes about 75 minutes while the queue is backed up. Every merge therefore made each other pull request out of date and sent it back for another run.

Dean asked for the most professional approach. This record is the repository part: conventions and tooling that remove the avoidable conflicts. The [parallel contribution rules](parallel-contribution-rules.md) already set claim-first, one task per branch and narrow edits to shared files; they did not stop the collisions, because "narrow edits to a shared file" still means every pull request edits the same lines at the top of the same file.

## What is proposed

### 1. Status and decision-index fragments

A change no longer edits `docs/STATUS.md` or the narrative index in `docs/decisions/README.md`. It adds one file, `docs/status/YYYY-MM-DD-slug.md`, with a title, a date and the status text; an optional second section after `<!-- decision-index -->` is the index entry for a decision record. `python3 scripts/build_status.py` renders the fragments, newest first, between marker comments at the top of both files. Everything below the end marker is the existing text, kept byte for byte as the frozen legacy record; no history is rewritten and `docs/STATUS-log.md` is untouched.

`scripts/check_foundation.py` (and therefore the Documentation assurance job) fails when:
- the rendered section of either file differs from what the fragments produce, so a hand edit between the markers is refused;
- the legacy part gains, loses or renames an entry (recorded in `docs/status/legacy-index.txt`), so a new entry cannot be slipped in by hand;
- a fragment has a bad name, date, title or empty body.

What this does and does not remove. Fragment files are unique per change, so they never conflict. The two rendered files still change in every pull request, so two branches can still conflict on them, but the conflict is now mechanical: take `main`'s copy and run the script. It no longer needs anyone to merge prose.

### 2. Migration and seed number reservation

`scripts/check_migrations.py` runs in the same job and fails when:
- two files in `db/migrations/` or two registry entries share a version, or versions are out of order;
- a migration file is not in `scripts/migration-registry.ts`, or the reverse; `latestMigrationVersion` is stale; a seed is registered against a missing migration, repeats a version or has no file;
- a reservation names a number that is already a migration, so a consumed reservation is deleted in the pull request that lands the migration.

A reservation is the file `db/reservations/NNNN.md` (branch, owner, purpose, date), created by `python3 scripts/check_migrations.py --reserve "purpose"` in the draft pull request that claims the work. Because the path is the number, two draft pull requests that reserve the same number add the same path and the second to merge gets a git conflict instead of a silent collision. A seed uses its migration's number, so one reservation covers both. `--next` prints the next free number and `--open-prs` also reads the files of every open pull request through `gh` and names any that claim the same number.

The check sees the tree CI builds, which is the pull request merged into `main`. It catches a duplicate after the other pull request has merged; it cannot see two open pull requests that have not yet met, which is why the reservation and the `--open-prs` comparison exist.

### 3. Working agreements in CONTRIBUTING.md

One owner per branch (only that session or person pushes to it); no stacking beyond one level (a pull request may target `main` or one parent branch, never a child of a child); and re-merge `origin/main` immediately before every push. Generated files that conflict are regenerated from `main`'s copy rather than merged by hand. These are written in [Working in parallel](../../CONTRIBUTING.md#working-in-parallel).

## Options considered

| Option | Verdict |
|---|---|
| Keep hand-edited shared files and rely on discipline | Rejected: this is the rule that failed on 17 and 18 October. |
| Fragments with a rendered index committed to `main` (this record) | Proposed: no workflow or settings change needed, and `STATUS.md` still reads on GitHub. Rendered files can still conflict, mechanically. |
| Fragments rendered after merge by a workflow that commits to `main` | Better still: the rendered files then never conflict. It needs a new workflow file and write access, which the GitHub connector cannot add; listed as an open decision. |
| Reservation in one shared CSV | Rejected: appending to one file is the conflict being removed. |
| Number reservation by one file per number | Proposed. |

## Open decisions for Dean

These are repository settings and workflow changes, so this pull request does not make them.

1. **Branch protection: "Require branches to be up to date before merging".** Today it makes every merge force every other pull request to rerun a 75-minute CI. The recommendation is to turn it off and keep correctness with a merged-tree check instead, either of two ways. The better is a GitHub **merge queue**, which tests each pull request on top of `main` plus the pull requests ahead of it; it needs a `merge_group` trigger on each required workflow. The alternative keeps the workflows as they are: the required checks already run on the pull request merged into `main`, and the Documentation assurance job (which now includes the two checks above) is cheap enough to run again on `main` after each merge to catch the rare logical conflict early. The cost is that two individually green pull requests can break `main` together, as #386 did with the icon change; the merge queue is the control that closes that.
2. **Render the fragments after merge.** A workflow that runs `build_status.py` on pushes to `main` and commits the result would remove the last conflicts on `STATUS.md` and the decisions index, at which point the foundation check would stop requiring the rendered files to be current in pull requests.
3. **Open-pull-request check in CI.** Running `check_migrations.py --open-prs` in the job needs `pull-requests: read` on the token and a change to `.github/workflows/documentation.yml`.
4. **Generated design files** (the access-review design, the UI build sequence and similar) conflict because two branches regenerate them. This record only adds the "regenerate from `main`" rule; moving them out of the pull request path or generating them in CI is a separate decision.

## Scope and limits

- Documentation, scripts and a working rule only. No application code, migration, permission, capability, workflow file, branch protection setting or parent requirement ID changes.
- Not verified: behaviour with two real concurrent pull requests, because only three are open and none reserves a number; the rendered files' conflicts under GitHub's own "Update branch" button; and `--open-prs` against the #569 claim of 0109 beyond a read-only listing of what it claims.
- Historical status entries stay in `docs/STATUS.md` below the end marker and in `docs/STATUS-log.md`. The legacy part is frozen against new entries, not against corrections.
