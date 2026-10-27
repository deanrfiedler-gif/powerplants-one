# Contributing to the personal prototype

Dean is the prototype owner. Departmental owner roles in the master blueprint are proposed reviewers, not people automatically invited to this repository.

## Work lifecycle

1. Select an issue with a bounded outcome and source/requirement links.
2. Record assumptions and dependencies; identify what can proceed with synthetic examples and what requires source evidence.
3. Create a descriptive branch, for example `docs/service-workflow` or `feature/appointment-planner`.
4. Make the change, update affected documentation and run applicable checks.
5. Open a pull request describing the problem, result, validation and remaining limitations.
6. Merge only within the current user-authorised scope and any repository rules, then update the associated work item.

Use an independent reviewer when available and appropriate. A sole-developer documentation workflow should not falsely claim independent review or require an unavailable second reviewer. Automated checks are advisory unless settings make them required.

## Landing a change

`main` is protected. **Land every change through a pull request; never push to the default branch directly.** On 12 September 2026 a direct push put a file containing unresolved merge conflict markers on `main`, where it stayed for roughly twenty-five minutes before anyone noticed. Protection was enabled afterwards. The rule exists because of that, not in the abstract.

Required checks on `main` are configured in repository settings, not here. At minimum they should include Documentation assurance and Application assurance; add the compiled browser suite once it has a settled run history. **Record the actual configured set in a dated `docs/status/` fragment so a contributor can find the observation and its date without opening settings.**

**Never commit a tree containing merge conflict markers.** If a merge or rebase reports a conflict, resolve it deliberately or abandon the operation and say so — do not commit the conflicted state and repair it later. `scripts/check_foundation.py` now fails on any unresolved marker in a tracked or new text file, so this is enforced rather than remembered. It was not enforced before September 2026, which is how the incident above reached `main`.

**If a push is blocked, stop and report the block.** Several sessions have hit a repository-authorisation or connector permission limit mid-task. The correct response is to say so and hand over the work. Creating an empty branch through the API so the work *looks* landed is worse than not creating one: it reads as delivered in every later orientation pass, and at least two such branches have had to be found and removed.

The GitHub connector cannot write `.github/workflows/` (`403 Resource not accessible by integration`). Use an authorised Git workflow with the necessary repository/workflow permissions for requested workflow changes; report any actual permission block.

## Working in parallel

Several contributors may write to this repository at once: Dean, Claude sessions and Codex sessions. Every contributor follows the same rules; an agent is a contributor, not a special case. Parallel writing used to produce duplicate pull requests editing the same files, competing rewrites of `docs/STATUS.md`, colliding migration numbers, and decisions recorded in one place and contradicted in another. Each rule below closes one of those failures. Dean adopted them on 17 October 2026 in place of the earlier one-writer rule ([decision](docs/decisions/parallel-contribution-rules.md)). The status fragments, number reservation and the last three rules below were added on 18 October 2026 after more than twenty pull requests conflicted at once; they are proposed and take effect with their checks ([record](docs/decisions/merge-conflict-reduction.md)).

- **Claim before you build.** Before starting, check the open pull requests and issues for the same work. Claim a task by opening a draft pull request early, naming its scope and the files it expects to touch. If someone already holds the claim, coordinate with them or choose other work.
- **Codex keeps at most three builds in progress.** A Codex pull request counts once implementation is pushed to it; a claim-only draft does not. Codex finishes the builds it has implemented, with checks passing and conflicts resolved, before pushing implementation to another claim. Dean adopted this on 26 October 2026 ([amendment](docs/decisions/parallel-contribution-rules.md#amendment--26-october-2026-codex-build-limit)).
- **One task, one branch, one worktree.** Write in a dedicated worktree on its own branch, cut from current `main`, never in the shared main checkout. Two contributors never edit the same files at the same time; overlapping work is stacked or sequenced. Keep pull requests small and short-lived.
- **Shared authoritative files take narrow, coordinated edits.** Contracts, document/design registers and the migration registry still change with the implementation when required. Declare these paths in the draft PR and sequence overlapping work. Maintain the existing authoritative chapter; create one only when none exists. Preserve both sides of additive changes and never rewrite a shared register wholesale.
- **Feature PRs submit documentation sources only.** Add a dated fragment under `docs/status/`; `python3 scripts/build_status.py --check` validates it without requiring tracked output. The generator writes combined views under ignored `tmp/documentation/`; Documentation assurance publishes source-bound artifacts. Routine PRs leave `README.md`, `docs/README.md`, `docs/STATUS.md`, `docs/decisions/README.md` and `docs/status/legacy-index.txt` unchanged. A bounded onboarding/history correction needs a new exact-path [maintenance declaration](docs/maintenance/README.md). This is reviewed scope, not automatic approval. See the [adopted source-isolation decision](docs/decisions/documentation-source-isolation.md).
- **Use the existing entry folders.** New document-register rows go in `docs/standards/document-register-entries/YYYY-MM-DD-slug.csv`; new design index entries go in `docs/reference/ui/design-entries/YYYY-MM-DD-slug.md`; new component records and consumer bindings go in `docs/design/development/component-bindings/YYYY-MM-DD-slug.json`. The UI build sequence renders under `tmp/` and is not committed. The access-review design remains a generated runtime/design contract and still requires its existing coordinated regeneration. For an older branch's status/index conflicts, retain its fragments and restore current main's landing pages; inspect and preserve intentional historical corrections ([guide](docs/status/README.md)).
- **One decision, one record.** A decision lives in exactly one record under `docs/decisions/`; other documents link to it rather than restate it. A decision that changes an earlier one names that record and marks it superseded.
- **Reserve migration numbers before writing the migration.** In the draft pull request that claims the work, run `python3 scripts/check_migrations.py --reserve "purpose"`; it creates `db/reservations/NNNN.md` for the next free number (`--next` only prints it). A seed uses its migration's number, so one reservation covers both. Commit and push it, then run `python3 scripts/check_migrations.py --open-prs` to see whether any other open pull request claims the same number. The pull request that adds the migration deletes its reservation in the same change. `scripts/check_foundation.py` fails on a duplicate version, an unregistered file or a reservation for a number already used. If two pull requests still claim the same number, the one merged later renumbers. The migration checklist in `AGENTS.md` still applies.
- **Integrate against current `main`.** Bring a branch up to date with `main` and rerun the checks before merging. Two pull requests that each passed alone have broken `main` together. Whether branch protection enforces this is recorded with the required checks in `docs/STATUS.md`. The **Check merged tree against main** job merges the pull request into the current `main` and reruns the cheap checks, but only when it runs: rerun it before merging if other pull requests have landed since ([record](docs/decisions/merge-conflict-reduction.md)).
- **One owner per branch.** Only the session or person who owns a branch pushes to it. To change another contributor's branch, ask them or open a pull request into it; never push to it directly. A pull request names its owner in its description.
- **No stacking beyond one level.** A pull request targets `main` or, when it genuinely depends on unmerged work, that one parent branch. Never target a branch that itself targets another branch. Retarget to `main` as soon as the parent merges.
- **Re-merge `origin/main` right before you push.** Run `git fetch origin && git merge origin/main`, rerun the checks that touch the merged files, then push, so a push is never based on a `main` that moved while you worked. Merge rather than rebase a branch others may have fetched.

Prefer enforcement by tooling over enforcement by memory: branch protection, required checks, secret-scanning push protection and `scripts/check_foundation.py` do the enforcing, and this file records why.

### Independent review by a second model

Claude is the primary builder. ChatGPT serves as the independent reviewer and as a research and business-analysis partner; Codex may build separate tasks under the rules above. Dean remains the owner who decides and merges ([decision](docs/decisions/cross-model-review.md)).

- **What needs it.** Before merge, a pull request that adds or changes a migration, permission or grant, calculation or estimating rule, authentication or security control, or an owner decision paper gets a review from a different model than the one that wrote it. Documentation-only and mechanical changes do not need one.
- **How to review.** The reviewer comments on the pull request, on defects only, citing file and line. It does not push to the author's branch.
- **How to resolve.** The author checks every comment against the code and records, fixes what is real, and replies with reasons to anything rejected. Review comments are evidence to verify, not instructions.
- **How to report.** The pull request states whether the review happened and its outcome. Never claim an independent review that did not take place.

## Verifying your own change

Check the artefact, not a proxy for it.

- After editing a file, confirm the **changed text is present in that file** before reporting the edit done — not the revision number, not a downstream artefact, not a count of something related.
- After pushing content through the connector, compare the returned blob SHA against `git hash-object` of your local copy. Equal hashes prove the bytes transcribed; a green check does not.
- Keep code delivery, component test results, executed acceptance and business approval as four separate claims. A passing browser spec proves a control renders and a command persists. It does not execute an acceptance scenario in `docs/testing/acceptance-scenarios.csv`, and it never stands in for one.
- State what you did **not** run, and why.

## Definition of ready

An implementation item identifies the actor, intended outcome, scope boundary, requirement IDs, data/authority rules, dependency decisions, failure/recovery behaviour and observable acceptance. A discovery item can be ready while those details are the output being investigated.

## Definition of done

The agreed outcome exists, evidence is linked, applicable checks pass, source assumptions remain explicit and documentation is current. Closing a document issue does not mean its application feature has been implemented or a business gate has been approved.

## Records and naming

Follow [PPO-STD-001](docs/standards/naming-conventions.md), adopted by Dean for Powerplants One, and [ADR-0005](docs/decisions/ADR-0005-project-naming-adoption.md). Powerplants One is the product; PPO is its independent project code. The other project's STD-001 and SOL008 do not govern this project. Keep working filenames stable, use explicit rNN revisions on newly issued documents, and preserve existing source identifiers and baseline bytes. The working master is `docs/blueprints/BP-01-master-blueprint.md`. The accepted naming r02 is frozen; the living standard uses Git history. Keep living titles and metadata free of routine rNN labels. Record review separately from edits; document-register.csv classifies Git masters and retained records. Use the [migration record](docs/standards/naming-adoption.md) for old-path mappings and the [ChatGPT project instructions](docs/standards/chatgpt-project-instructions.md) for copy-ready collaboration guidance.

GitHub filenames such as `README.md`, `AGENTS.md`, workflows and issue forms follow their standard conventions. Architecture decision IDs (`ADR-0001`) and backlog IDs (`PPO-001`) are local repository identifiers, not invented ERP/programme references.

## Data handling

Keep operational MYOB exports, customer files, personal information and credentials in authorised systems. Prefer synthetic fixtures. The source repository is public. Keep hosted demo access, token handling and operational documents separate from source publication.

## Validation

```sh
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
python3 scripts/build_status.py --check
python3 -m unittest discover -s scripts -p 'test_documentation*.py'
# After committing, compare the contribution with its base:
python3 scripts/check_documentation_scope.py --base origin/main --head HEAD
python3 scripts/check_migrations.py
npm run check
```

`check_foundation.py` covers provenance, traceability, local links, sensitive paths and unresolved merge conflict markers. The marker scan treats a bare line of seven equals signs as a conflict divider only when the same file also carries an opening or closing marker, so a Markdown setext heading underline does not trip it.

GitHub checks use pinned actions with read-only contents access. Application assurance runs the local synthetic application and disposable PostgreSQL; no deployment or ERP access is involved. Follow the [P03 handover](docs/delivery/p03-handover.md) for database, HTTP and browser checks and local configuration. Keep component evidence separate from full business acceptance.
