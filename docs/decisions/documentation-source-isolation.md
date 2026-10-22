---
document_id: PPO-DOCUMENTATION-SOURCE-ISOLATION-DEC
date: 2026-10-22
owner: Dean Fiedler
status: Implementation authorised; pull request review pending
source_commit: 002af00e4e19e9aa0d12f83d36199bebe6572a1b
versioning: git
---

# Documentation sources without shared generated diffs

## Decision and scope

On 22 October 2026 Dean instructed Codex to extend the existing fragment system, stabilise the README, update contributor instructions and checks, and open a pull request for review. This decision continues the [merge-conflict reduction controls](merge-conflict-reduction.md). It supersedes the requirement for each contribution to commit regenerated status and decision indexes. Implementation and review are separate; this change grants no business acceptance or production authority.

## Architecture and alternatives

Keep the existing Python standard-library generator and dated status fragments. Make the tracked status and decision pages stable navigation and historical records. Render the combined views into ignored `tmp/documentation/` output and publish source-bound copies as read-only Documentation assurance artifacts. Preserve the legacy text and issued references. The root README describes purpose, setup and navigation rather than a sequence of feature deliveries.

Committing generated indexes in every feature PR was rejected because independent fragments still changed the same output lines. A bot committing to main was rejected because it would introduce write permissions and a protected-branch publication process. Read-only generated artifacts follow the existing UI build-sequence approach and need no package, service or environment-variable changes.

Routine feature PRs own their source files and relevant documentation. Required shared contracts and design registers still change with the implementation, using declared scope and coordinated ownership. A new chapter is added only when no authoritative chapter exists. Decisions, contracts, guides and evidence retain their existing locations and IDs.

## Implementation and ownership

Owner: Codex, working for Dean Fiedler. [PR #663](https://github.com/deanrfiedler-gif/powerplants-one/pull/663) changes `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, the PR template, status/decision landing pages and fragment guide, maintained ChatGPT instructions, status generator and documentation-scope checker/tests, Documentation assurance and merged-tree workflows, this decision and its status/register entries. Application, database, capabilities, runtime design registers and issued references are unchanged.

`build_status.py --check` validates sources without requiring generated files in Git. The default command writes `tmp/documentation/STATUS.md` and `decisions.md`. `--web-ref` requires a full SHA equal to HEAD and a clean checkout before creating source-bound links. The Documentation assurance job uploads those two files with read-only repository permissions and 30-day retention. PR artifacts identify the checked merge commit; main artifacts identify their main commit. Source files remain available when artifacts expire.

`check_documentation_scope.py` compares a PR head with its merge base. It rejects additions, edits, deletions and renames affecting the protected navigation/history paths unless a newly added exact-path maintenance declaration explains them. Old declarations cannot exempt later contributions. Committed generated views are refused even with a declaration. The [maintenance guide](../maintenance/README.md) defines the exception contract, and the [fragment guide](../status/README.md) covers ordinary contributions and older-branch recovery.

Both existing documentation and merged-tree workflows run the scope check. This adds steps to existing jobs, not a new required-check name. Repository settings are unchanged; whether a job is required remains a branch-protection setting. The exception is visible scope for review, not an approval mechanism or a security boundary against someone deliberately changing the check itself.

## Acceptance

- Independent fragments combine deterministically without modifying tracked outputs.
- Malformed fragments, broken documentation links and changed legacy entry identities still fail validation.
- Routine PR edits to shared navigation pages fail with an actionable message; narrowly declared documentation-maintenance changes remain reviewable.
- Generated artifacts identify their source and keep links usable outside the checkout.
- README content remains useful without per-feature updates; instructions and checks describe the same workflow.

## Validation and limits

Local validation on 22 October 2026:

- 22 Python regression tests passed, including two real independent Git branches merged with only fragment changes, deterministic combined output, no tracked output changes, malformed fragments, broken/escaping links, legacy identity protection, protected-file renames, declaration misuse, missing base history and exact clean source binding.
- Foundation passed: 22 issued sources, all 78 parent requirements, 29 parent decisions and 38 authored acceptance records preserved; 12,896 local links checked and 6,994 text files scanned without errors at that run. These are documentation assurance counts, not executed business acceptance.
- Prototype, naming, migration numbering and all 62 CI-scope classifier self-tests passed. The maintained ChatGPT instructions remain within 8,000 characters.
- Both historical index suffixes match main `002af00e` byte for byte. Every removed generated paragraph is reproducible from the 91 original fragments; this contribution adds the 92nd fragment. No issued-reference path changed.
- Both edited workflow files parse as YAML, retain read-only repository permissions and contain the PR boundary step. `actionlint` is unavailable locally; workflow execution and artifact upload require GitHub CI. Final-head CI is reported on the PR separately from these local results.

The root README's former delivery narrative remains in Git history and the linked feature/status records. GitHub readers can browse current source fragments immediately; the consolidated view is a local file or downloadable artifact. This deliberately changes the reading workflow instead of maintaining a stale generated snapshot in Git. Older open PRs need to integrate the landing-page transition once and retain their source fragments. Shared runtime contracts such as the access-review design still require coordinated updates; this change does not claim to eliminate code, migration or semantic conflicts.
