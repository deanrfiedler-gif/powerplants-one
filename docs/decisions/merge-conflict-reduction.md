---
document_id: PPO-MERGE-CONFLICT-DEC
date: 2026-10-18
owner: Dean Fiedler
status: Owner-adopted repository working rule (18 October 2026) for the three controls; Dean's decision on the open items below is still needed; changes no application behaviour
source_commit: c089e132de43a046c5b2938851ed59f0de770259
versioning: git
---

# Reducing merge conflicts between parallel pull requests

## Decision

On 18 October 2026 Claude recommended landing this record early, ahead of the other open pull requests, because `docs/STATUS.md` is where most merge conflicts happen. Dean replied: "Ok. We will proceed on that basis." The three controls below (fragments, number reservation and the working agreements) are adopted as written. The [open decisions](#open-decisions-for-dean) are not decided by that reply and stay with Dean.

## Context

On 17 and 18 October 2026 more than twenty pull requests were open at once. They repeatedly conflicted with `main` and went "behind" it, mainly on four shared files: `docs/STATUS.md`, `docs/decisions/README.md`, `docs/standards/document-register.csv` and the shell design records. Two pull requests (#568 and #569) both claimed migration 0108, and generated files (the access-review design and the UI build sequence) conflicted whenever two branches regenerated them. Branch protection requires a branch to be up to date before it merges, and a full CI run takes about 75 minutes while the queue is backed up. Every merge therefore made each other pull request out of date and sent it back for another run.

Dean asked for the most professional approach. This record is the repository part: conventions and tooling that remove the avoidable conflicts. The [parallel contribution rules](parallel-contribution-rules.md) already set claim-first, one task per branch and narrow edits to shared files; they did not stop the collisions, because "narrow edits to a shared file" still means every pull request edits the same lines at the top of the same file.

## What is adopted

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

### 4. Merged-tree check and documentation-only CI scope

Added on 18 October 2026 after Dean replied "Proceed on that basis" to the recommendation in open decision 1 below: replace "Require branches to be up to date" with a check of the merged tree, and cut CI volume with path filters. Both are workflow files and one script; no application behaviour changes. Changing the branch protection setting stays Dean's own action.

**Merged-tree check.** `.github/workflows/merged-tree.yml` has one job, named **Check merged tree against main**. It checks out the pull request head with full history, merges `origin/main` into it (a conflict fails the job and names the files), then runs `check_foundation.py`, `check_prototype.py`, `check_naming.py`, `check_migrations.py` and `build_status.py --check` on the merged tree, and `npm run typecheck` unless the change is documentation only. These are the cheap checks that catch breakage once other pull requests have landed, such as the 0108 collision between #568 and #569 described in the context above. The other workflows test GitHub's merge ref, which is cut when the pull request changes and is not recut when `main` moves; this job takes `main` as it is when the job runs, so "Re-run all jobs" after `main` moves re-evaluates it. The job name is stable and the workflow has no path filter or skip, so it reports on every pull request. A required-check name can only be chosen after the job has run once.

Limit that matters: a green result is only as fresh as its last run. Nothing reruns it when `main` moves. Merging a pull request that is behind `main` therefore relies on someone having rerun the check after the last merge, which is what the old setting forced mechanically. The merge queue in open decision 1 closes this; until then, rerun the job (or merge `main` into the branch) before merging when other pull requests have landed since.

**Documentation-only scope.** `scripts/ci_scope.py` classifies a pull request from the merge ref's diff against its base. A change is documentation only when every path is a Markdown, CSV or text file in a prose folder (`docs/status`, `decisions`, `delivery`, `contracts`, `requirements`, `prototype`, `standards`, `testing`, `architecture`, `interfaces`, `guides`, `blueprints`; Markdown only in the last four), a top-level `docs/*.md`, `db/reservations/*.md`, `README.md`, `CONTRIBUTING.md`, `AGENTS.md` or `LICENSE`, or (second change, below) Markdown, CSV or text in `docs/design/research/`. Everything else is not: the rest of `docs/design/`, `docs/reference/` and `docs/testing/evidence/`, because the application serves the design register and the tests open reference pages and evidence; any other extension (JSON, HTML, CSS, JS, images); source, tests, scripts, migrations, workflows and package files. A prose file whose path appears literally in source, tests, `db`, `public` or non-Python scripts is also not documentation only, because a test reads it (`docs/decisions/es08-design-board.md` is one). A pull request that deletes or renames any file is never documentation only (second change). `python3 scripts/ci_scope.py --self-test` holds 62 cases and the merged-tree job runs it.

Ten workflows that previously ran their database and browser jobs on every pull request now start with a small `Change scope` job: `application`, `application-compiled`, `crm-refinements`, `email-calendar-journey`, `estimating-e1`, `products-native`, `quotation-conversion`, `quotation-disposition`, `quotation-response` and `quotation-supply-followup`. Every heavy job in them needs it and runs unless it reported `docs_only=true`. The result is true only for a pull request event; a push to `main`, a manual run, a skipped `Change scope` job or any fault in the script leaves the heavy jobs running. The scope job fails open by design.

How the required check names still report. The required jobs fall in two kinds. The three that are already gates (`P01–P11 and CRM I1–I2 …`, `Desktop and mobile browser suite against the compiled application`, `E1 manual estimate, draft output and restart proof`) now also need `Change scope` and are skipped when it says documentation only; the two CRM jobs and the Email Calendar job are heavy jobs themselves and are skipped the same way. GitHub treats a job skipped by its own condition as passing for a required check (unlike a workflow skipped by `paths:`, which stays pending, which is why no required workflow was given a path filter). `Check documentation foundation` is not gated. When the change is not documentation only the gates are unchanged: they still require every suite to report `success`. No job name or required context was renamed or removed; a parse of every workflow file confirmed that each of the seven required names still belongs to exactly one job.

Already in place, so not added: every workflow triggered by `pull_request` (50 before this change) already has a `concurrency` group that cancels earlier runs of the same pull request, with `cancel-in-progress` true only for pull requests, never for pushes to `main` or manual runs. The only two workflows without a pull request trigger, `azure-demo-connection.yml` and `azure-demo-deploy.yml`, are manual. The new workflow uses the same rule.

Evidence and limits.
- Replaying the classifier over the 39 most recent pull requests (#544 to #583, merged and open) marks 10 documentation only. Over the 80 most recent first-parent merges to `main` it marks 2, because that period is mostly code and design-register work. Design-register pull requests (`docs/design/development/**`, many of the rest) run the full suites, as before.
- Not verified: a real documentation-only pull request through branch protection. The behaviour of a skipped required job rests on GitHub's documentation, not on a run here. Expression syntax was parsed (YAML, `needs` graph, balanced expressions, required names), not linted: `actionlint` was not available.
- Not done: a path filter for `dependency-audit.yml` and `development-register.yml`; scoping pushes to `main`; domain path filters on the quotation, products and Email workflows. Each needs a map of what reads what, because "a migration is never confined to the domain it serves" (`AGENTS.md`). The map for design-register pull requests is the next block.

**Design-register scope (second change, 18 October 2026).** Open decision 6 asked for a map of what the application and tests read under `docs/design`, `docs/reference` and the evidence before any widening. It was built from the tracked files by searching `src`, `tests`, `db`, `public`, the non-Python scripts, the root configuration, the workflows and the three living masters (`docs/design/development/register.json`, `guides.json`, `components.json`) for each folder's name, then reading each reader.

| Area | Files | What reads it | Scope |
|---|---|---|---|
| `docs/design/development` (masters, `pages/*.md`, `components/*.md`, `*-fixtures.json`, `ui-build-sequence.*`) | 422; 417 named by the masters | `src/development/catalog.ts`, `component-catalog.ts` and `runtime.ts` build the catalogue from it per request, and each page's guide control calls `/api/development/catalog`. `tests/browser/equipment.spec.ts` and `maintenance.spec.ts` assert the route-to-guide keys it returns; ten browser specs open the page guide. `tests/unit/component-catalogue.test.ts` builds the live catalogue and asserts no errors. `maintenance.spec.ts` reads `maintenance-fixtures.json`. `npm run check` runs `studio:check`, where a missing named file, or a page without Desktop and Mobile sections, is an error. Only `README.md` and `ui-build-sequence.*` are read by no suite (a link, and a Python generator). | Full suites |
| `docs/reference/ui` | 976; 470 named by the masters | Register entries (`html_path`, `image_paths`) and component reference anchors are read, hashed and served; `module-workflow-maps` is listed as a whole folder; 16 test files name `docs/reference` (browser specs, helpers and unit tests); `installation.test.ts` reads the logo pack; `maintenance.spec.ts` builds paths under the folder at run time. | Full suites |
| Four design packages the suites read: `access-review`, `specialist`, `projects-register`, `app-page-register` | 33 | `src/access` and unit tests; `source-manifest.json` and `specialist.test.ts`; `projects-register.spec.ts`; an ESLint override. | Full suites |
| The other 26 design packages | 181 | Only their own `scripts/check-<package>-*.mjs` and Python builders, which run in each package's `<package>-design.yml` (22 have one; customer-360, data-quality, engineering-basis and projects-delivery-readiness do not). The 69 `.js` files under `docs/design` are linted by `npm run check`. | Full suites |
| `docs/design/research` | 3 | Nothing: no source, test, database file, workflow, script or master names it, and no commit ever has (`git log -S`). | **Documentation only** (Markdown, CSV, text) |
| `docs/testing/evidence` | 4,835 in 220 folders | Five folders are named by code (`cce-reference-validation`, `navigation`, `products-discovery`, `products-native`, `supply-chain-native`); `products-native.yml` writes into its folder; 279 files are named by the masters. | Full suites |
| Prose in the `PROSE` folders | 167 named by the masters | The catalogue reads them as register sources. An edit only changes a fingerprint (the review shows stale, which no suite asserts). A delete or rename leaves a name that resolves to nothing, which `studio:check` reports as an error. | Documentation only, except a delete or rename |

The map found paths built at run time (`docs/design/access-review/${file}`, `docs/design/specialist/${f}`, `docs/reference/ui/ppo-logo-pack/icons/...`, `resolve("docs/reference/ui", path)`), so a search for exact file names cannot prove a file unread. That is why the extension is one whole folder that nothing names, not a pattern over the packages.

What changed in `scripts/ci_scope.py`:
- **`docs/design/research/`** (Markdown, CSV and text only) counts as documentation. The classifier also searches the consumer files for the folder name, and `--self-test` fails if any names it, so the first test, page or script that reads the folder removes it from the scope in the same pull request. A JS, HTML, JSON or image file there is still not documentation.
- **A delete or rename is never documentation only.** This closes a gap in the first change: a documentation-only pull request that renamed a decision named by the register would have skipped the `studio:check` inside `npm run check`, which the required P01–P11 and CRM persistence jobs run. `development-register.yml` runs it on every pull request but is not a required check.
- Self-test: 62 cases (32 before). They cover the research folder, each excluded extension, a similarly named folder, the register files, the other packages, reference and evidence, a consumer naming the folder or the file, a delete, a rename and an add.

Replay, with the same file lists for both classifiers (GitHub's files API, renamed-from paths included). Over #536 to #583 (48 pull requests, merged and open) the first-change classifier marks 13 documentation only and the extended one 15. The two added are #537 and #539, which touch only `docs/design/research` and prose. Over #544 to #583, the first replay's range, both mark 12; re-running the first-change classifier on these file lists gives 12 of 40 where the first replay recorded 10 of 39, so only the same-data comparison is used. No file was deleted in the 48 and one was renamed, so the delete rule changed no result. None of the 15 scoped pull requests touches `docs/design` outside research, `docs/reference` or the evidence, and no consumer names the research folder in the current tree or in the merge commits of #537 and #539.

What stays on the full suites, and why the gain is small. Ten of the 48 are held only by `docs/design/development`, `docs/reference` or evidence paths (#549, #552, #554, #562, #564, #570, #571, #577, #581, #582): the lock-in and comparison pull requests. A lock-in edits `register.json` and `pages/*.md` together with captures, and those are the files the guide-binding browser specs and `studio:check` read. Nothing in the file names separates an edit that cannot change what they read from one that can. Twenty-three are held by code, tests, scripts, workflows, other design packages or a named prose file.

What would scope them, if Dean wants it (not built): a check on the content of the change instead of its paths (for example, only review-status fields in `register.json` and prose in `pages/*.md`, with guide keys and routes unchanged), or a smaller required job that runs `studio:check`, the four development unit tests and the ten page-guide browser specs so the full browser suite can be skipped for register-only changes. Both need the specs that read the live register mapped first, and the second needs `Development register integrity` made a required check.

Limits of the guard. It searches what the `Change scope` job checks out (`scripts`, `src`, `tests`, `db`, `public` and the root files), not the workflows or the three masters, which are outside that sparse checkout. Today none of them names the research folder (checked by hand); if the register later names a research file as a source, an edit to that file would show it stale and a delete is caught by the delete rule, but nothing would fail. Not verified: a real documentation-only pull request through branch protection; consumer names were checked on the current tree and on the two merge commits above, not on the merge tree of every replayed pull request.

### 5. Design pull requests no longer share generated or appended files

Added on 19 October 2026 as an amendment to open decision 4, at Dean's request to stop one merged pull request making others conflict. Branch protection already had "Require branches to be up to date" off (`strict: false`, read from the API that day), so the conflicts were git text conflicts. Simulating a merge of each conflicting open pull request (#604, #610, #615, #616, #617; #606 did not conflict) into `main` showed that only three places conflicted, and all three are edited by every design lock-in:

| File | Why it conflicted | Change |
|---|---|---|
| `docs/design/development/ui-build-sequence.md` and `.json` | Generated by `scripts/build-ui-sequence.py` from `register.json` and carrying the register's SHA-256 and totals, so any register change rewrote them. All five conflicting pull requests regenerated them. | **No longer committed.** The script writes to `tmp/` (ignored). `ui-build-sequence.md` stays as a short pointer page, so existing links keep working; the `.json` is removed. `check_foundation.py` runs `build-ui-sequence.py --check`, which derives the sequence and writes nothing, so an entry that cannot be placed still fails CI. The old `--check` compared committed bytes; that comparison no longer exists, and the derivation is the only thing still verified. |
| `docs/standards/document-register.csv` | Every design pull request appended its decision and captures rows at the same line. | **New rows go in `docs/standards/document-register-entries/YYYY-MM-DD-slug.csv`**, one file per change. `check_naming.py` reads the shared file and every entry file as one register (duplicate IDs and paths are still refused across files) and fails if the shared file holds more than the 730 rows it had. Existing rows stay and may be corrected in place. |
| `docs/reference/ui/README.md` | Every design pull request added a table row and a dated paragraph at the same lines. | **New designs go in `docs/reference/ui/design-entries/YYYY-MM-DD-slug.md`**, one file each, row and paragraph together. `check_foundation.py` fails if the index gains table rows or dated paragraphs. Existing entries stay and may be corrected in place. |

Who reads what, checked before the change: nothing in `src`, `tests`, `db`, `public`, `.github` or `package.json` reads any of the three groups. The only code readers are `scripts/check_naming.py` (the register), `scripts/check_foundation.py` (links) and `scripts/ci_scope.py` (a path in its self-test, still true). The document register is a CSV in a prose folder, so a pull request that only adds entry files stays documentation only. Fragments rendered by a script, as for `STATUS.md`, were rejected for the register and the index: a rendered file is the thing that conflicts, and these two have no ordering requirement a folder listing cannot meet.

What this does not fix, so it is not over-claimed:
- Pull requests opened before this lands still carry the old edits. Each needs one conversion when it next merges `main`: take `main`'s copy of the three groups, then re-add its rows as entry files (the register rows and README text are in its own diff). Deleting the generated `.json` while a branch modifies it is a modify/delete conflict until that branch takes `main`'s side. The replay below shows the converted result.
- Two pull requests can still conflict on files this section does not cover. The replay found `docs/STATUS.md` and the decisions index as rendered files (open decision 2) and `register.json` or a shared page file when two designs touch the same entry; none of the six pull requests did so.
- The access-review design and other generated packages are unchanged.
- Branch protection is not changed. A `merge=union` attribute in `.gitattributes` was not used. It would only apply where git performs the merge itself, GitHub's mergeability check for a pull request is not documented to honour it and this work did not test that, and it silently interleaves CSV lines whether or not it works.

## Options considered

| Option | Verdict |
|---|---|
| Keep hand-edited shared files and rely on discipline | Rejected: this is the rule that failed on 17 and 18 October. |
| Fragments with a rendered index committed to `main` (this record) | Adopted: no workflow or settings change needed, and `STATUS.md` still reads on GitHub. Rendered files can still conflict, mechanically. |
| Fragments rendered after merge by a workflow that commits to `main` | Better still: the rendered files then never conflict. It needs a new workflow file and write access, which the GitHub connector cannot add; listed as an open decision. |
| Reservation in one shared CSV | Rejected: appending to one file is the conflict being removed. |
| Number reservation by one file per number | Adopted. |

## Open decisions for Dean

These are repository settings and workflow changes, so this pull request does not make them.

1. **Branch protection: "Require branches to be up to date before merging".** Today it makes every merge force every other pull request to rerun a 75-minute CI. The recommendation is to turn it off and keep correctness with a merged-tree check instead, either of two ways. The better is a GitHub **merge queue**, which tests each pull request on top of `main` plus the pull requests ahead of it; it needs a `merge_group` trigger on each required workflow. The alternative keeps the workflows as they are: the required checks already run on the pull request merged into `main`, and the Documentation assurance job (which now includes the two checks above) is cheap enough to run again on `main` after each merge to catch the rare logical conflict early. The cost is that two individually green pull requests can break `main` together, as #386 did with the icon change; the merge queue is the control that closes that. **Status, 18 October 2026:** the alternative is built (section 4). A read-only call to the branch-protection API the same day returned `strict: false`, so "Require branches to be up to date" was already off. The required set was seven checks: Check documentation foundation, the two CRM jobs, the compiled browser suite, E1, Email Calendar and P01–P11. Until **Check merged tree against main** is made required, nothing checks the merged result before a merge.
2. **Render the fragments after merge.** A workflow that runs `build_status.py` on pushes to `main` and commits the result would remove the last conflicts on `STATUS.md` and the decisions index, at which point the foundation check would stop requiring the rendered files to be current in pull requests.
3. **Open-pull-request check in CI.** Running `check_migrations.py --open-prs` in the job needs `pull-requests: read` on the token and a change to `.github/workflows/documentation.yml`.
4. **Generated design files** (the access-review design, the UI build sequence and similar) conflict because two branches regenerate them. This record only adds the "regenerate from `main`" rule; moving them out of the pull request path or generating them in CI is a separate decision. **Amended 19 October 2026:** for the UI build sequence and the two appended design files, see [section 5](#5-design-pull-requests-no-longer-share-generated-or-appended-files). The access-review design is not covered and stays open.
5. **Make the merged-tree check required, and decide on a merge queue.** Add **Check merged tree against main** to the required checks once it has run on one pull request (the picker lists only names that have reported). A merge queue would also need a `merge_group` trigger on each required workflow, and on the merged-tree workflow, which this record did not add because it cannot be tried until the queue is enabled.
6. **Widen the documentation-only scope.** The map is built (section 4, second change). It found one design folder nothing reads, now scoped, and that the register, the reference pages and most evidence are read, so design-register pull requests still run every suite (10 of the last 48). Scoping them needs either a content-aware check on `register.json` and `pages/*.md`, or a smaller required job for the register and the ten page-guide specs; say if you want either built.

## Scope and limits

- The first change (sections 1 to 3) was documentation, scripts and a working rule. Section 4 adds one workflow, `scripts/ci_scope.py` and edits ten workflow files; its second change edits `scripts/ci_scope.py` only. Neither changes application code, a migration, a permission, a capability, a branch protection setting or a parent requirement ID.
- Not verified: behaviour with two real concurrent pull requests, because only three are open and none reserves a number; the rendered files' conflicts under GitHub's own "Update branch" button; and `--open-prs` against the #569 claim of 0109 beyond a read-only listing of what it claims.
- Historical status entries stay in `docs/STATUS.md` below the end marker and in `docs/STATUS-log.md`. The legacy part is frozen against new entries, not against corrections.
