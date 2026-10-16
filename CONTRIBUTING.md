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

Required checks on `main` are configured in repository settings, not here. At minimum they should include Documentation assurance and Application assurance; add the compiled browser suite once it has a settled run history. **Record the actual configured set in `docs/STATUS.md` so a contributor can tell what is enforced without opening settings.**

**Never commit a tree containing merge conflict markers.** If a merge or rebase reports a conflict, resolve it deliberately or abandon the operation and say so — do not commit the conflicted state and repair it later. `scripts/check_foundation.py` now fails on any unresolved marker in a tracked or new text file, so this is enforced rather than remembered. It was not enforced before September 2026, which is how the incident above reached `main`.

**If a push is blocked, stop and report the block.** Several sessions have hit a repository-authorisation or connector permission limit mid-task. The correct response is to say so and hand over the work. Creating an empty branch through the API so the work *looks* landed is worse than not creating one: it reads as delivered in every later orientation pass, and at least two such branches have had to be found and removed.

`.github/workflows/` is not writable through the GitHub connector, which returns `403 Resource not accessible by integration`. Workflow files must be added by the repository owner directly.

## Working in parallel

Several contributors may write to this repository at once: Dean, Claude sessions and Codex sessions. Every contributor follows the same rules; an agent is a contributor, not a special case. Parallel writing used to produce duplicate pull requests editing the same files, competing rewrites of `docs/STATUS.md`, colliding migration numbers, and decisions recorded in one place and contradicted in another. Each rule below closes one of those failures. Dean adopted them on 17 October 2026 in place of the earlier one-writer rule ([decision](docs/decisions/parallel-contribution-rules.md)).

- **Claim before you build.** Before starting, check the open pull requests and issues for the same work. Claim a task by opening a draft pull request early, naming its scope and the files it expects to touch. If someone already holds the claim, coordinate with them or choose other work.
- **One task, one branch, one worktree.** Write in a dedicated worktree on its own branch, cut from current `main`, never in the shared main checkout. Two contributors never edit the same files at the same time; overlapping work is stacked or sequenced. Keep pull requests small and short-lived.
- **Shared files take narrow edits.** `docs/STATUS.md`, the document and design registers and the migration registry are edited only where your task changes them, in the same pull request, rebased on current `main`. Never rewrite a shared file wholesale, and keep both sides of an additive conflict.
- **One decision, one record.** A decision lives in exactly one record under `docs/decisions/`; other documents link to it rather than restate it. A decision that changes an earlier one names that record and marks it superseded.
- **Claim migration numbers in the draft pull request.** If two pull requests claim the same number, the one merged later renumbers. The migration checklist in `AGENTS.md` still applies.
- **Integrate against current `main`.** Bring a branch up to date with `main` and rerun the checks before merging. Two pull requests that each passed alone have broken `main` together. Whether branch protection enforces this is recorded with the required checks in `docs/STATUS.md`.

Prefer enforcement by tooling over enforcement by memory: branch protection, required checks, secret-scanning push protection and `scripts/check_foundation.py` do the enforcing, and this file records why.

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
npm run check
```

`check_foundation.py` covers provenance, traceability, local links, sensitive paths and unresolved merge conflict markers. The marker scan treats a bare line of seven equals signs as a conflict divider only when the same file also carries an opening or closing marker, so a Markdown setext heading underline does not trip it.

GitHub checks use pinned actions with read-only contents access. Application assurance runs the local synthetic application and disposable PostgreSQL; no deployment or ERP access is involved. Follow the [P03 handover](docs/delivery/p03-handover.md) for database, HTTP and browser checks and local configuration. Keep component evidence separate from full business acceptance.
