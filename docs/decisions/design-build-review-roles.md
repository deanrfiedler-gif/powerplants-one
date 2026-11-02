---
document_id: PPO-DESIGN-BUILD-REVIEW-ROLES-DEC
date: 2026-11-02
owner: Dean Fiedler
status: Owner-adopted repository working rule 2 November 2026; sets design, build and review roles, one independent review per pull request, and owner-only merging; amends the cross-model review rule and the standing order; changes no application behaviour
source_commit: 4f26da5964205bd03c9930fc825fbae0b0683372
versioning: git
---

# Design, build and review roles

## Decision

On 2 November 2026 Dean set out the tools he uses (Claude, Claude Code, ChatGPT and Codex) and how he wants to work: design the pages in Figma with Claude, and build them in the application with Codex. Claude recommended one builder, an independent reviewer from the other model family, and Dean as the only person who accepts designs and merges. Dean accepted: "I am happy to proceed based on your professional recommendations." He added: "when carrying out independent reviews, we need to ensure that we don't get stuck in a review loop. Generally only one independent review is required."

| Contributor | Role |
|---|---|
| Dean | Owner: accepts scope and designs, merges every pull request until he says otherwise, starts demo deployments |
| Claude (Claude Code) | Designs pages in Figma; records design lock-ins in the repository; reviews Codex's pull requests independently; keeps decision records and repository guidance current |
| Codex | Builds the pages in the application, one page per pull request, at most three builds in progress |
| ChatGPT | Research and business-analysis partner, and an optional second opinion on higher-risk changes; not a builder |
| GitHub CI | The proof: the required checks on a branch up to date with `main` |

[CONTRIBUTING.md — Independent review by a second model](../../CONTRIBUTING.md#independent-review-by-a-second-model) carries the working rules and is authoritative.

## The flow for a page

1. **Scope.** Dean agrees the scope ID, the user need and the acceptance criteria.
2. **Design.** Claude designs the page in Figma. Dean accepts it.
3. **Lock-in.** Claude records the accepted design in the repository: the design register entry, the captures and the decision record. This is the build specification; a page without a lock-in is not ready to build.
4. **Build.** Codex builds the page from the lock-in in the repository, not from Figma directly.
5. **Review.** Claude reviews the build once (below).
6. **Prove.** GitHub CI passes on a branch up to date with `main`.
7. **Merge.** Dean merges, then starts the demo deployment when he chooses.

## One independent review

A pull request gets one full independent review, of one head, covering defects only. The author fixes or answers each finding and posts the evidence. The reviewer then confirms only that those findings were addressed. A second full review is needed only when the fixes add new behaviour, a migration, a permission or grant, or a calculation or estimating rule. This replaces the rule that every new commit needs a new review, which turned reviews into loops.

## Merging

Agents do not merge from 2 November 2026 until Dean says otherwise. This suspends the merge part of his [standing order of 30 October 2026](autonomous-agent-operation.md); the rest of it (agents decide, record and proceed) still applies. The merge gates in CONTRIBUTING.md remain the checklist for "completed and ready".

## Why

- **Separation of duties.** The builder and the reviewer come from different model families, so each catches mistakes the other makes.
- **One builder.** Two builders on the same codebase produced duplicate pull requests, conflicting edits, stale claims and a 76-pull-request backlog on 1 November 2026.
- **The lock-in is the handoff.** Building from the repository's accepted captures and acceptance criteria, rather than from Figma, gives Codex a fixed, reviewable specification and the reviewer a fixed standard.
- **One review keeps work moving.** A full re-review of every new commit added cost without finding new defects in proportion.
- **Owner merging while the backlog clears.** It keeps the number of merges per day within what can be checked on the demo.

## Alternatives considered

1. **Claude designs and builds; Codex reviews.** Keeps design context with the builder and has a full local test environment, but Dean prefers Codex for building.
2. **Two builders (Claude and Codex, or Codex and ChatGPT).** Rejected: it recreates the coordination failures above.
3. **Keep agent merging under the standing order.** Deferred: Dean merges until the backlog is clear and the new flow is proven.

## Scope and limits

- Pull requests already in progress keep their current owners; this applies to new work.
- This changes no application code, test, migration, permission, CI workflow or branch protection.
- It amends the roles in the [cross-model review rule](cross-model-review.md) and the merge part of the [standing order](autonomous-agent-operation.md); both carry an amendment note.
