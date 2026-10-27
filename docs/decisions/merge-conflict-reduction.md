---
document_id: PPO-MERGE-CONFLICT-DEC
date: 2026-10-18
owner: Dean Fiedler
status: Owner-adopted repository working rule (18 October 2026) for the three controls; 27 October 2026 amendment adopted under Dean's delegation; Dean's decision on the other open items below is still needed; changes no application behaviour
source_commit: c089e132de43a046c5b2938851ed59f0de770259
versioning: git
---

# Reducing merge conflicts between parallel pull requests

## Decision

On 18 October 2026 Claude recommended landing this record early, ahead of the other open pull requests, because `docs/STATUS.md` is where most merge conflicts happen. Dean replied: "Ok. We will proceed on that basis." The three controls below (fragments, number reservation and the working agreements) are adopted as written. The [open decisions](#open-decisions-for-dean) are not decided by that reply and stay with Dean.

## Context

On 17 and 18 October 2026 more than twenty pull requests were open at once. They repeatedly conflicted with `main` and went "behind" it, mainly on four shared files: `docs/STATUS.md`, `docs/decisions/README.md`, `docs/standards/document-register.csv` and the shell design records. Two pull requests (#568 and #569) both claimed migration 0108, and generated files (the access-review design and the UI build sequence) conflicted whenever two branches regenerated them. Branch protection requires a branch to be up to date before it merges, and a full CI run takes about 75 minutes while the queue is backed up. Every merge therefore made each other pull request out of date and sent it back for another run.

Dean asked for the most professional approach. This record is the repository part: conventions and tooling that remove the avoidable conflicts. The [parallel contribution rules](parallel-contribution-rules.md) already set claim-first, one task per branch and narrow edits to shared files; they did not stop the collisions, because "narrow edits to a shared file" still means every pull request edits the same lines at the top of the same file.

## Subsequent source-isolation decision — 22 October 2026

The [documentation source-isolation decision](documentation-source-isolation.md) supersedes the per-PR generated-output requirement in section 1 and resolves open decision 2 using ignored local views and read-only CI artifacts. The tracked landing pages preserve navigation and legacy history; contributors submit source fragments. The original reasoning and observations below remain historical.

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

Added on 19 October 2026 as an amendment to open decision 4, at Dean's request to stop one merged pull request making others conflict. Branch protection already had "Require branches to be up to date" off (`strict: false`, read from the API that day), so the conflicts were git text conflicts. Simulating a merge of each conflicting open pull request (#604, #610, #615, #616, #617; #606 did not conflict with `main`) into `main` showed that only three places conflicted, and all three are edited by every design lock-in:

| File | Why it conflicted | Change |
|---|---|---|
| `docs/design/development/ui-build-sequence.md` and `.json` | Generated by `scripts/build-ui-sequence.py` from `register.json` and carrying the register's SHA-256 and totals, so any register change rewrote them. All five conflicting pull requests regenerated them. | **No longer committed.** The script writes to `tmp/` (ignored). `ui-build-sequence.md` stays as a short pointer page, so existing links keep working; the `.json` is removed. `check_foundation.py` runs `build-ui-sequence.py --check`, which derives the sequence and writes nothing, so an entry that cannot be placed still fails CI. The old `--check` compared committed bytes; that comparison no longer exists, and the derivation is the only thing still verified. |
| `docs/standards/document-register.csv` | Every design pull request appended its decision and captures rows at the same line. | **New rows go in `docs/standards/document-register-entries/YYYY-MM-DD-slug.csv`**, one file per change. `check_naming.py` reads the shared file and every entry file as one register (duplicate IDs and paths are still refused across files) and fails if the shared file holds more than the 731 rows it had when this change merged (730 when written; #607 added one first). Existing rows stay and may be corrected in place. |
| `docs/reference/ui/README.md` | Every design pull request added a table row and a dated paragraph at the same lines. | **New designs go in `docs/reference/ui/design-entries/YYYY-MM-DD-slug.md`**, one file each, row and paragraph together. `check_foundation.py` fails if the index gains table rows or dated paragraphs. Existing entries stay and may be corrected in place. |

Who reads what, checked before the change: nothing in `src`, `tests`, `db`, `public`, `.github` or `package.json` reads any of the three groups. The only code readers are `scripts/check_naming.py` (the register), `scripts/check_foundation.py` (links) and `scripts/ci_scope.py` (a path in its self-test, still true). The document register is a CSV in a prose folder, so a pull request that only adds entry files stays documentation only. Fragments rendered by a script, as for `STATUS.md`, were rejected for the register and the index: a rendered file is the thing that conflicts, and these two have no ordering requirement a folder listing cannot meet.

Replay (19 October 2026, `git merge-tree` on `origin/main` at `9dad9aa5`). Each of #604, #606, #610, #615, #616 and #617 was converted as above (generated files and shared appends taken from this change, its own rows and text moved to entry files) and merged with this change and with every other converted pull request, 12 of the 15 possible pairs (the three pairs that include #606 and #610, #615 or #617 were not run). Before conversion, 11 of those 12 pairs conflicted, all but one on the three file groups. After it:

| Merge | Before | After |
|---|---|---|
| Each of the six onto this change | #604, #610, #615, #617: the three groups | none on the three groups; #616 conflicts on `scripts/build-ui-sequence.py` (below) |
| #610, #615, #617, #604 with each other (6 pairs) | `ui-build-sequence.*`; also `document-register.csv` and `reference/ui/README.md` for the three lock-ins | none |
| #616 with #604, #610, #617 | `ui-build-sequence.*`, and the register and index for #610 and #617 | none |
| #616 with #606 | none | none |
| #615 with #616 | the three groups and `STATUS.md` | `docs/STATUS.md` only (a rendered file, open decision 2) |
| #604 with #606 | the same two sequence files and `STATUS.md` | `STATUS.md`, `components.json` and `components/application-shell.md`: both change the shell components, unrelated to this change |

Two remaining effects are real. #616 edits `scripts/build-ui-sequence.py` itself (an owner-placement rule for CX-02), and this change edits the same script's output paths and `--check` mode, so it must merge `main` and keep both; its generated outputs then drop out. And six pull requests merged in sequence still hit `STATUS.md` whenever a rendered file changes in two of them, which only open decision 2 removes. The replay used the diff of each pull request, not a new CI run of the converted branches; the converted branches were not built or tested.

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
7. **Page builds appending to shared lists.** Decided on 27 October 2026; see the [amendment below](#amendment--27-october-2026-page-builds-stop-appending-to-shared-lists).

## Scope and limits

- The first change (sections 1 to 3) was documentation, scripts and a working rule. Section 4 adds one workflow, `scripts/ci_scope.py` and edits ten workflow files; its second change edits `scripts/ci_scope.py` only. Neither changes application code, a migration, a permission, a capability, a branch protection setting or a parent requirement ID.
- Not verified: behaviour with two real concurrent pull requests, because only three are open and none reserves a number; the rendered files' conflicts under GitHub's own "Update branch" button; and `--open-prs` against the #569 claim of 0109 beyond a read-only listing of what it claims.
- Historical status entries stay in `docs/STATUS.md` below the end marker and in `docs/STATUS-log.md`. The legacy part is frozen against new entries, not against corrections.

## Amendment — 27 October 2026: page builds stop appending to shared lists

**Status: adopted on 27 October 2026 under Dean's delegation (see Decision).** Author: Claude, for Dean. This section changes no application, test or tooling file itself; each hotspot is changed by its own pull request.

### Decision

The amendment was first opened as a proposal with three questions for Dean. On 27 October 2026 he replied: "Proceed however you believe is the most professional." That delegates the choice to Claude's recommendation; Dean did not choose between the options himself. On that basis:

1. Hotspots 1 to 5 and 7 take the recommended option below, and hotspot 6 has no change now.
2. The opt-in attribute for shared workspace styles is `data-ppo-workspace="shared"`.
3. Codex does not hold new builds. Under strict mode every merge already sends each open build back to merge `main` and rerun CI, so converting adds no CI run, only a one-time move of the build's own entries, which is about the same work as resolving the conflict it replaces. Holding would idle Codex for at least three sequential CI runs and merges. Each freeze check names the new place when a build uses the old one.

Each hotspot lands as its own pull request, in rank order. This record changes again only if one of them changes a decision above.

### Why

Section 5 stopped design pull requests appending to the document register, the reference index and the generated UI build sequence. It did not cover the files a page build edits. On 26 October 2026 every pair of the four Codex page builds combined in #717 (#696, #697, #700 and #701) conflicted, each time because both builds had added their own entry to the same shared list. Dean reports that `main` now requires a branch to be up to date before it merges (strict mode, turned on at his request). This record last read the setting on 18 October (`strict: false`), and the 23 October status recorded the same; the change was not re-read from the API here. Under strict mode each merge sends every other open build back to resolve these files and rerun about 75 minutes of CI. Eight claimed builds (#698, #699, #702 to #707) are queued to start, three at a time, once #717 lands.

### Measurement

All replays use `git merge-tree --write-tree` (git 2.43.0) on the exact commits below, without a checkout or any resolution, and count each conflicted file and its conflict hunks. Fetched 26 October 2026 at about 21:45 UTC; `main` was `923f1284`.

| PR | Branch | Head |
|---|---|---|
| #696 | `codex/access-identity-register` | `d94b119a` |
| #697 | `codex/work-orders-register` | `1b87f546` |
| #700 | `codex/estimate-reviews` | `3527e788` |
| #701 | `codex/outputs-workspace` | `26825e43` |
| #717 | `ccr-208dc323-vxw0bg` | `9c0559a0` |
| #695 | `codex/customer-communications-s3` | `5f6962e3` |

The eight queued claims each change one file, their claim, so there is no implementation to replay.

**Replay 1: the four builds against each other.** All four share the merge base `0a69f685`. All six pairs conflict.

| Pair | Conflicted files |
|---|---|
| #696 × #697 | `components.json`; `components/` `application-shell.md`, `buttons.md`, `register-table.md` |
| #696 × #700 | `components.json`; `application-shell.md`, `buttons.md`, `dialog.md`, `menu.md`, `register-table.md`; `ui-baselines.json`; `figma-shell.css`; `my-work.css` |
| #696 × #701 | `components.json`; `application-shell.md`, `buttons.md`, `dialog.md`, `menu.md`, `read-state.md`, `register-table.md`; `ui-baselines.json`; `module-workspaces.ts` |
| #697 × #700 | `components.json`; `application-shell.md`, `buttons.md`, `register-table.md` |
| #697 × #701 | `components.json`; `application-shell.md`, `buttons.md`, `register-table.md` |
| #700 × #701 | `components.json`; `application-shell.md`, `buttons.md`, `dialog.md`, `menu.md`, `register-table.md`; `guides.json`; `register.json`; `ui-baselines.json` |

**Replay 2: #717's own merges, in the order it made them.** #696 merged into `main` cleanly. #700 then conflicted in 9 files, #701 in 11 and #697 in 5: the files above, plus `docs/contracts/service-api.md` for #697.

**Replay 3: every real merge since 19 October.** All 200 two-parent merge commits dated 19 October (when section 5 landed) or later and reachable from any branch on `origin` were replayed; 70 had conflicted. The last column counts merges, not files.

| Files | Merges that conflicted | Where it is handled |
|---|---|---|
| `docs/STATUS.md` | 50 | Section 1 and the [source-isolation decision](documentation-source-isolation.md). None of the 78 merges since 23 October conflicted on it or on the decisions index. |
| `docs/design/development/components.json` | 24 | This amendment |
| `docs/design/development/components/*.md` | 24 (94 file conflicts) | This amendment |
| `docs/decisions/README.md` | 15 | As for `STATUS.md` |
| Migration ledgers in `tests/database/` and `tests/demo/` | 14 (790 file conflicts) | [Migration test expectations](migration-test-expectations.md), approved 24 October with implementation on hold |
| `scripts/migration-registry.ts`, `scripts/demo-upgrade.ts` | 12 each | Migration numbering; not this amendment |
| `src/app/styles/my-work.css` | 8 | This amendment |
| `src/app/styles/figma-shell.css` | 7 | This amendment |
| `docs/contracts/*.md` | 2 | This amendment |
| `docs/standards/ui-baselines.json` | 2 | This amendment |
| `src/shell/module-workspaces.ts`, `docs/design/development/register.json`, `guides.json` | 1 each | This amendment |

Fourteen other files conflicted once or twice each. None of them is one of the shared lists above, and they were not examined further. #695 is not a page build: it merges cleanly with each of the four, and against #717 it conflicts only in migration test files, the migration registry and `demo-upgrade.ts`, which #690's migration 0120 also changed.

### Hotspots, ranked

| Rank | Hotspot | Pairs of 6 | Hunks in replay 1 | Merges since 19 October | What each build appends |
|---|---|---|---|---|---|
| 1 | `components.json` | 6 | 61 | 24 | One item to the end of `states`, `dependencies`, `used_on` and `gaps` in each shared component it uses (3 to 10 components), and new component records to the end of `entries` |
| 2 | `components/*.md` | 6 | 25 (in 25 files) | 24 | A consumer section at the end of each shared component's specification |
| 3 | `my-work.css`, `figma-shell.css` | 1 | 8 | 8 and 7 | Its root ID to the same 165 single-line `:is(#ppo-…)` lists (20 and 145) |
| 4 | `ui-baselines.json` | 3 | 3 | 2 | An entry at the end of `module_integrations` |
| 5 | `module-workspaces.ts` | 1 | 1 | 1 | Route entries at the same place in one array (both builds inserted at the top) |
| 6 | `register.json`, `guides.json` | 1 | 6 | 1 each | New route entries and guides at the end of each file (`studio:sync` puts them there) |
| 7 | `docs/contracts/*.md` | 0 (1 in replay 2) | – | 2 | A dated section at the end of the contract |

The CSS lists rank third although only one pair conflicted, because only builds that use the shared workspace styles join them: two of the four here, and every such pair conflicts. The 165 lists that grow are exactly the lists that hold `#ppo-people`, and each of the newest pages (`#ppo-access-register`, `#ppo-estimate-reviews`, `#ppo-discovery-register`) is in all 165 and in no other.

### Reader map, options and recommendation

Each reader below was found by searching the whole tracked tree (source, tests, scripts, workflows, design masters and evidence) for the file name and the symbols it exports, then reading the code around each hit. Order matters where a reader shows or hashes items in file order; it is marked where it does.

#### 1. `components.json`

Readers:
- `src/development/component-catalog.ts` (`readComponentManifest`, `buildComponentLibrary`): validation (unique states, `used_on` keys that resolve and import the implementation, complete gaps) and the component fingerprint, which hashes the whole entry except `review`, arrays in order, plus every file the entry names or imports.
- `src/development/catalog.ts` lines 147–159 and 423–430: a second, direct read that builds `component_links` for `/api/development/catalog`.
- `src/development/runtime.ts`, the design-system and component-preview pages, and `component-catalogue.tsx`: components in file order, `states` and `gaps` in array order, `states[0]` as the default example. "Used on" is shown in page-register order, and `dependencies` are not shown.
- `scripts/build-development-snapshot.ts` (the hosted snapshot), `tests/unit/component-catalogue.test.ts` and `tests/browser/component-catalogue.spec.ts`, through the loader; `scripts/check-development-register.ts` (`studio:check`), which never writes this file.
- `scripts/design-system/merge-component-guides.py`, which reads the file at two commits.
- The page register hashes the file's bytes into the `/development/design-system` and `/development/component-preview` entries.

No component has a recorded review (all 50 have `review: null`), so no fingerprint change would mark anything stale today.

| Option | Assessment |
|---|---|
| **A. One binding file per consumer change** in `docs/design/development/component-bindings/YYYY-MM-DD-slug.json`, naming the components it binds and the items it adds to each array; new component records as one file each. `readComponentManifest` appends them after the existing items in file-name order, and `catalog.ts` uses that loader instead of its own read. `components.json` is frozen at its size after #717, as `document-register.csv` was at 731 rows; existing items stay and may be corrected in place. | **Recommended.** A build adds only new files. Applied in file-name (date) order, the merged entry is the object the append would have produced, so output and fingerprints stay as they would have been; existing data does not move. It follows the precedent in section 5. |
| B. Keep one file but put each array item on its own line, sorted | Two builds still conflict when their items sort next to each other or close an array. Sorting changes the order of `states`, `states[0]` and `gaps`, which readers show. |
| C. Generate `components.json` from fragments and commit the result | Rejected in section 5: the committed output is what conflicts. |
| D. `merge=union` in `.gitattributes` | Rejected in section 5: not documented for GitHub's mergeability check, and it corrupts JSON. |

Proof for A: the catalogue export and every component fingerprint are byte-identical before and after on the same commit; then a converted copy of the four builds' component changes, replayed pairwise, gives no conflict.

Does not fix: two builds that genuinely change the same existing item, which is a real conflict. The Python merge script needs the same merge (or reads the loader's output).

#### 2. `components/*.md`

Readers: the component fingerprint hashes the whole specification; `component-catalog.ts` checks for its Desktop and Mobile headings; `catalog.ts` serves it through the reference route with a SHA check and reads its history; `check_foundation.py` checks its links and anchors; `check_naming.py` requires the `versioning: git` marker on the 27 that are registered masters. No code parses the consumer sections. Two documents link to sections of `application-shell.md` (`docs/design/development/systems/shell.md` lines 215 and 233, `docs/decisions/phone-header-amendment.md` line 104), so existing sections must not move.

| Option | Assessment |
|---|---|
| **A. The consumer note goes in a Markdown file beside the binding** (`component-bindings/YYYY-MM-DD-slug.md`), one section per component bound. The component's fingerprint also hashes the bindings that name it, so a new note marks a review stale as an appended section does today. The specification gains no consumer sections; how a check recognises one without blocking a real rule change is settled in the implementing pull request. Existing sections stay where they are. | **Recommended**, as the Markdown half of hotspot 1. A build edits no shared specification. |
| B. Keep the notes in the specification, in a sorted "Consumers" section | Prose; two builds still conflict when their headings are neighbours. |

Does not fix: a build that changes a component's own rules (Desktop, Mobile, keyboard) still edits its specification. That is a real shared change and should conflict. The catalogue does not render specifications: it links each one on GitHub. Until a later change links the binding notes too, they are read on GitHub or in the checkout from the binding file.

#### 3. The root-ID lists in `my-work.css` and `figma-shell.css`

Readers: nothing reads the text of either file; there is no CSS lint (`lint` runs ESLint only). The page components render the root IDs, not the shell. Twenty-one of the 24 IDs are rendered through `SecondaryMenuFrame` (`src/shell/secondary-menu.tsx`), which already sets `data-module-layout`, `data-menu` and `data-menu-presentation` and passes through any `data-*` attribute a page gives it; the others are plain elements or `SharedRecord`. Several IDs have more than one root: `#ppo-my-work` and `#ppo-estimate-wizard` three each, eight others two. Tests use `#ppo-*` IDs as locators in 28 files, and `my-work.spec.ts` and `my-work-mobile.spec.ts` compare computed styles. The register hashes both files into every page fingerprint (`figma-shell.css` and `layout.tsx`, which imports `my-work.css`, are shared sources), so the 26 reviewed entries already show as stale on `main` (`studio:check`: `stale: 26`) and this change makes none newly stale. Five evidence manifests record an old hash of `my-work.css`; nothing recomputes them. Specificity and load order matter here: `register-table.css`, `specialist-workbench.css` and `my-work-mobile.css` rely on these rules' ID weight, `facilities.css` already needs `#ppo-facilities.facility-record-host` to win, and the menu rules in seven page stylesheets tie with `figma-shell.css` and are settled by load order. Any replacement must therefore keep the (1,0,0) specificity exactly.

The lists are not one list: `my-work.css` has eight different sets of page IDs and `figma-shell.css` one. Older pages belong to irregular subsets (for example `#ppo-facilities`, `#ppo-appointment` and `#ppo-products` without `data-catalogue`), so a single attribute cannot replace the lists without changing which rules reach those pages. New pages always join the same 165 lists.

| Option | Assessment |
|---|---|
| **A. Freeze the ID lists and add one opt-in attribute to each of the 165.** `:is(#ppo-my-work,…,#ppo-estimate-reviews)` becomes `:is(#ppo-my-work,…,#ppo-estimate-reviews,[data-ppo-workspace=shared])` once. A new page sets `data-ppo-workspace="shared"` on its own root element, through `SecondaryMenuFrame`'s existing `attributes` prop (as the Products catalogue already passes `data-catalogue`). A check refuses a new `#ppo-` ID in these lists and names the attribute instead. | **Recommended.** A build changes no shared CSS. `:is()` takes the specificity of its most specific argument, so a page matched by the attribute gets the same (1,0,0) specificity as one matched by its ID, and no cascade outcome changes. No element carries the attribute until a page opts in, so every existing page renders exactly as before. |
| B. Move every existing page to the attribute and delete the ID lists | Cleaner end state, but it edits every root that carries one of the 24 IDs (about 35 elements), and the irregular older subsets need several attribute values. Larger change and more risk for no further reduction in conflicts. Can follow later. |
| C. CSS nesting: state each distinct list once, one ID per line, sorted | A page still edits six lines in two shared files, and two IDs that sort next to each other still conflict. |
| D. The shell sets the attribute from the route table | Page components, not the shell, render the root elements; several roots are outside the route table (search, sales views); and it ties styling to `module-workspaces.ts`, hotspot 5. Rejected. |

Proof for A: the stylesheet diff only adds `,[data-ppo-workspace=shared]` inside the 165 lists; a search shows no element carries the attribute; the browser suites and the compiled browser suite pass in CI with no visual change; a replay of #696 × #700 converted (no list edits, attribute on the root) has no CSS conflict.

Does not fix: a page that needs one of the older irregular subsets, and each page's own stylesheet (already its own file). `src/app/layout.tsx` imports 41 stylesheets in cascade order and #701 added one there; it has not conflicted yet, and importing a page's stylesheet from its own component, as #696 and #700 did, avoids it.

#### 4. `ui-baselines.json`, `module_integrations`

Readers of `module_integrations`: `tests/ui/deals-design-conformance.spec.ts` (for each route-table entry, finds its integration by `id`, checks route, scope and layout, recomputes `sha256` and `shared_sha256` from the files and checks the proof paths exist); `tests/browser/field-incidents.spec.ts`, `reports.spec.ts` and `service-inspections.spec.ts` (one entry each by `id`, hashes recomputed). All find by unique `id`; none depends on order or a count. Other parts of the file have other readers that are not affected: `scripts/design-baseline-check.mjs` and `ui-baselines.yml` read `baselines`, `viewports`, `shared_token_core` and `known_divergences`; the component catalogue reads `known_divergences`; `tests/unit/component-catalogue.test.ts` writes a synthetic copy; 16 Markdown links point at the file; `ci_scope.py` names it in a self-test.

| Option | Assessment |
|---|---|
| **A. One file per integration** in `docs/standards/ui-baselines/module-integrations/<id>.json`, read with the frozen array through one small test helper. Keep the files JSON: `ci_scope.py` treats Markdown or CSV under `docs/standards/` as documentation only, which would skip the conformance test. | **Recommended.** Keys by `id`, which is unique (two routes appear twice). The file and its links stay. |
| B. Sorted insertion in the one array | Objects span many lines and the last item takes no comma, so neighbours still conflict. |

Does not fix: nothing checks that every integration has a route-table entry (the test checks one direction only); this change keeps that as it is.

#### 5. `module-workspaces.ts`

Readers: `src/components/product-navigation.tsx` (`moduleWorkspaceForPath(path)?.navigation`, which hides the tab row; it is a client component, so entries must stay statically imported); `tests/ui/deals-design-conformance.spec.ts` (all entries); `tests/unit/department-navigation.test.ts` (one lookup); the `application-shell` component's `dependencies`, and every page fingerprint through `product-navigation.tsx` in the register's shared sources; a hash step in `estimating-e1.yml`; path filters on `src/shell/**`; seven evidence manifests that record an old hash and are read by nothing. Nothing uses a type derived from the array, and nothing pins a count.

Order: `moduleWorkspaceForPath` returns the first match. One pair is order-sensitive: `/estimating/discovery/<id>` matches both `es02-r01` and `es02-costing-figma`, because the estimate-wizard rule ignores the entry's route. Both have `navigation: "workspace"`, so the visible result is the same either way.

| Option | Assessment |
|---|---|
| **A. Keep one file; one line per entry, sorted by route; matching by explicit precedence** (exact route, then `[id]` pattern, then the module prefix rules), so order no longer decides. A unit test keeps the array sorted. New entries land in their own place instead of all at the top or the bottom. | **Recommended.** Same results for every path: with precedence, `es02-r01` still wins. Two builds conflict only when their routes sort next to each other, as two adjacent pages of the same module would. |
| B. One file per module with an index | The index is again a shared list, and two builds in one module (#700, #703 and #705 are all Estimating) still share a file. |

Proof for A: a table of every registered route, with a UUID for each `[id]` and a child path for each prefix rule, returns the same entry before and after.

#### 6. `register.json` and `guides.json`

Readers and writers: `scripts/check-development-register.ts --sync` (`studio:sync`) rewrites both files whole and puts new routes at the end; `catalog.ts` builds the catalogue in entry order, `matchEntry` gives ties to the earlier entry, the catalogue fingerprint hashes entries in order, and each page fingerprint hashes the entry's whole guide object; guide history is read for the whole of `guides.json`, and the page guide says so; `build-ui-sequence.py` breaks ties by position; the workspace lists entries unsorted and shows the first 60; `navigation-route-map.ts` and `development-workspace.test.ts` read them.

| Option | Assessment |
|---|---|
| A. New entries and guides as one file each, loaded after the existing ones in file-name order, with `--sync` writing files | Removes the conflict and keeps order. Touches about eight readers, and guide history for a new guide would cover its own file only, which is a visible change to what the page guide says. |
| B. `--sync` inserts new entries in sorted position | One script, but new entries then appear in different places in the workspace list (which shows the first 60) and in the build sequence ties, a visible change. |
| **C. No structural change now.** | **Recommended for now.** One conflict in 200 merges. Revisit if the queued builds show it recurring; option A is then the change. |

#### 7. `docs/contracts/*.md`

Readers: `check_prototype.py` (four contracts must exist; it counts the `API-C` and `API-R` rows in `service-api.md` and scans requirement IDs); `check_naming.py` (literal routes and identifiers in three contracts, and the versioning marker on the 26 registered ones); `check_foundation.py` (links: 21 files link to contract headings, one to a dated heading in `output-register.md`); `ci_scope.py` (documentation only unless a consumer names the file); `scripts/check-contacts-model.mjs` (one sentence in `service-data-dictionary.md`); the page register (8 contracts in `source_paths`, 11 in `dependencies`) and six component `dependencies`, hashed into fingerprints; and three design builds (`build-output-distribution.py`, `build-document-library.py`, `build-template-management.py`) that refuse to run when `document-issue-distribution.md` differs from the hash pinned in their `source-manifest.json`. No test reads contract text. No README sets a format: [PPO-STD-001](../standards/naming-conventions.md) makes Git history the change record of a living master, and the dated section at the end is a habit (16 dated headings in 6 files, and about 7 files with undated "amendment" or "extension" headings).

One fact from this map affects #717, not this amendment: #717 carries #701's six added lines in `document-issue-distribution.md`, so once it lands those three design builds will refuse to run until the change is reviewed and the pins are updated. Their workflows run only when their own folders change, so #717's checks will not show it.

| Option | Assessment |
|---|---|
| A. No change | Both sides are kept; the conflict is mechanical. Two conflicts in 200 merges. |
| **B. A writing rule:** put a contract change in the section it amends, or in a new section placed after the section it extends, not at the end of the file. Git history stays the change record. | **Recommended.** One line in the shared-files rule in `CONTRIBUTING.md`; no tooling. Insertions spread through the file instead of meeting at its end. Existing dated sections and their anchors stay. |
| C. One file per contract change | Splits an authoritative contract across files, against `AGENTS.md`'s one authoritative chapter, and breaks the row counts in `check_prototype.py`. Rejected. |

### Moving branches over

- **#717** merged on 27 October 2026 (`09ada563`) unchanged. Each change below is cut from `main` after it.
- **Queued builds (#698, #699, #702 to #707).** A build that starts after a change lands uses the new place from the start; the freeze check refuses the old one and names the new one. A build that started before converts once when it next merges `main`: take `main`'s copy of the frozen file, move its own additions to the new file (or the attribute), rerun the checks. Its own diff holds everything it needs to move, as in section 5.
- **Other open pull requests.** #715 corrects `read-state.md` in place, which stays allowed. #712 and #695 add contract sections (see 7). None of the others touches these files.
- Order of landing: 1 and 2 (components), then 3 (CSS), then 4 and 5. Codex does not hold (Decision 3), so a build in progress converts once for each change that lands under it.

### Implementation

One small pull request per hotspot, highest rank first, each cut from `main` after #717. Each is proved by: a replay showing the earlier conflicts gone (the converted changes of the four builds, merged pairwise); `npm run studio:check`, `lint`, `typecheck`, the unit tests and `build`; the Python documentation checks; and for the CSS change, green browser suites in CI with no visual change. Each states what was and was not run.

### What this does not fix

- Real conflicts: two builds changing the same component rule, route, contract clause or test.
- The migration ledgers, the migration registry and `demo-upgrade.ts`, the largest remaining source by file count (owned by [migration test expectations](migration-test-expectations.md)).
- `src/app/layout.tsx` and `src/shell/navigation.ts`, which builds also edit but which have not conflicted in these replays.
- Strict mode itself: with fewer conflicts, a merge still sends other pull requests back for a CI rerun when they fall behind. Only open decisions 1 and 5 (merged-tree check or merge queue) change that.
