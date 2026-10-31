---
document_id: PPO-PARALLEL-CONTRIBUTION-DEC
date: 2026-10-17
owner: Dean Fiedler
status: Owner-adopted repository working rule; supersedes the one-writer rule in CONTRIBUTING.md; changes no application behaviour
source_commit: 2dc9ab9d9f33c8375d355fb66b1d4db7c70c8ce9
versioning: git
---

# Parallel contribution rules

## Decision

On 17 October 2026 Dean asked for a professional recommendation on the CONTRIBUTING.md rule "One repository-writing session at a time", given the aim that Powerplants One be as professional as possible. Claude recommended replacing it with parallel work under explicit isolation and ownership rules. Dean adopted the recommendation: "I am happy to proceed based on your professional recommendations."

The rules are maintained in [CONTRIBUTING.md — Working in parallel](../../CONTRIBUTING.md#working-in-parallel), and that section is authoritative. `AGENTS.md` points every agent to it.

## Why the old rule was replaced

The one-writer rule was written after parallel sessions produced duplicate pull requests editing the same files, competing rewrites of `docs/STATUS.md`, and contradictory decisions. By October 2026 it was no longer followed: about ten Claude sessions plus Codex wrote in parallel, each in its own worktree. A rule that is routinely broken teaches every contributor that the contributing guide is optional. Returning to a single writer would have given up most of the delivery throughput and would not match professional team practice either. The "name the session holding the write in STATUS.md" step was a manual lock that nobody maintained, and it created STATUS.md conflicts of its own.

## What replaces it

Each original failure gets its own control:

| Failure | Control |
|---|---|
| Duplicate work | Claim a task with an early draft pull request after checking open PRs and issues |
| Concurrent edits to the same files | One task, one branch, one dedicated worktree cut from current `main`; overlapping work is stacked or sequenced |
| Competing STATUS.md and register rewrites | Shared files take narrow edits in the same PR, rebased on `main`; never wholesale rewrites |
| Contradictory decisions | One decision, one record under `docs/decisions/`; superseding records name what they replace |
| Colliding migration numbers (0021, 0029, PR #359 in `AGENTS.md`) | Numbers are claimed in the draft PR; the later merge renumbers |
| Two individually green PRs breaking `main` (#386 with the icon change) | Integrate against current `main` and rerun checks before merging |

Agents are contributors under the same rules. Enforcement by tooling is preferred to enforcement by memory.

## Scope and limits

- This is a repository working rule. It changes no application behaviour, requirement, migration, grant, workflow file or deployment, and all 78 parent requirement IDs remain unchanged.
- Earlier "current repository-writing session" entries in `docs/STATUS-log.md` remain as historical records.
- At Dean's request the same day, branch protection on `main` now requires branches to be up to date before merging, so GitHub enforces the integration rule. `docs/STATUS.md` records the configured state.
- The same day, secret scanning, push protection, Dependabot alerts and Dependabot security updates were enabled on the repository at Dean's request; that settings change is recorded in `docs/STATUS.md`.

## Amendment — 26 October 2026: Codex build limit

Superseded on the number and the finishing rule by the [31 October 2026 amendment](#amendment--31-october-2026-codex-build-limit-raised-to-twenty). The record below stays as written.

On 26 October 2026 Codex held sixteen open draft pull requests, twelve of them building accepted pages (#696 to #707). Ten held only a claim, about ten lines in one file (#693, #698, #699, #702 to #707 and #712). Of the six with implementation pushed (#690, #695, #696, #697, #700 and #701), five had failing checks and four had merge conflicts. Many builds in flight at once multiply conflicts and the migration-ledger repairs that every merge brings ([migration test expectations](migration-test-expectations.md)).

Claude recommended limiting Codex to three builds at once and finishing the failing ones first. Dean replied: "proceed with your recommendations".

The rule, added to [CONTRIBUTING.md — Working in parallel](../../CONTRIBUTING.md#working-in-parallel):

- Codex has at most **three implementation pull requests in progress** at once. A draft that holds only its claim does not count until implementation is pushed to it.
- Codex **finishes the builds it has already implemented**, with every check passing and conflicts resolved, before it pushes implementation to another claim.
- Claims beyond the limit may stay open as markers.

This changes no claim already made and no application behaviour.

## Amendment — 31 October 2026: Codex build limit raised to twenty

On 31 October 2026 Dean told Codex in a Codex chat: "I approve you to build up to as many as 10 pages at a time." Codex recorded this on [#705](https://github.com/deanrfiedler-gif/powerplants-one/pull/705) as an override of the three-build limit. By that evening six Codex pull requests had implementation pushed (#703, #704, #705, #706, #801 and #803), while `CONTRIBUTING.md` still said three.

Claude pointed out the difference and asked: "Should I draft the change raising the Codex build limit to match your authorisation?" Dean replied: "Yes, draft it", and then: "We can increase it to 20".

The rule in [CONTRIBUTING.md — Working in parallel](../../CONTRIBUTING.md#working-in-parallel) is now:

- Codex has at most **twenty implementation pull requests in progress** at once. A draft that holds only its claim does not count until implementation is pushed to it.
- **At the limit**, Codex finishes a build it has already implemented, with every check passing and conflicts resolved, before it pushes implementation to another claim.
- Claims beyond the limit may stay open as markers.

The words "at the limit" are Claude's drafting, not Dean's. The 26 October wording required every implemented build to finish before implementation went to another claim, which would have allowed only one new build at a time under any number.

Every other rule still applies, including one owner per branch, claims, integration against current `main`, independent review and the merge gates. The 26 October evidence about conflicts and failing checks was gathered at a lower level and has not been retested at twenty.

This changes no claim already made and no application behaviour.
