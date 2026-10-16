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
