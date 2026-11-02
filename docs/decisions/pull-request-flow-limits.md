---
document_id: PPO-PR-FLOW-LIMITS-DEC
date: 2026-11-02
owner: Dean Fiedler
status: Owner-adopted repository working rule 2 November 2026; limits ready page builds, batches design lock-ins and sets the direction for historical Discovery reads; no application change
source_commit: 7c23b54c794bc96bde0ca780deaceb03ab4d0514
versioning: git
---

# Pull request flow limits

## Decision

On 2 November 2026 Claude recommended an answer to each open question in the pull request triage, and Dean replied: "Yes, apply them". This record holds those answers. It adds to the [roles decision](design-build-review-roles.md), which keeps Codex to at most three builds in progress.

1. **Ready page builds.** At most three page builds are marked ready at a time. The two batches in progress on 2 November (#850, #849, #693, #703, #705, #706, #770, then #750, #702, #699 and #851) finish as a one-off exception, and the limit applies after them.
2. **New page builds.** None starts until the backlog drains to the limit of three builds in progress, counted as `CONTRIBUTING.md` counts them. About 17 builds had code pushed on 2 November. Design work continues meanwhile.
3. **Shared contract.** Only one pull request that edits `docs/contracts/service-api.md` is ready at a time.
4. **Design lock-ins.** Each lock-in opens as a draft, and only the batch branch is marked ready. One batch is open at a time, with no separate cap on drafts. The batch gets one independent review covering the whole batch. Each lock-in keeps its own acceptance record, so batching never stands in for Dean's acceptance.
5. **Historical Discovery revisions.** A saved revision stays readable, read-only, under the definition it was saved with, and is labelled as an earlier definition. Saving changes or carrying it forward still requires review against the current definition. This is the direction for a later increment: it needs a stored copy of each published definition, and it should be built before the next definition change is published. Nothing changes in the application now.

The triage dispositions adopted with these answers are:

- **Closed:** #698, #727, #732, #739, #725, #712 and #807. Their branches are kept.
- **Close later:** #814 after #706 merges. #809 after #705 merges, once Claude has checked the panel's focus handling against #705.
- **#818:** kept. It merges `main`, is reconciled with the roles decision and gets one independent review before Dean decides on it. Merging it would adopt its rules only, and each later stage comes to Dean separately.

## Why

- **Ready limit.** Marking a pull request ready starts the full suites, about 1.5 hours per pull request. On 2 November seven ready pull requests queued 53 workflow runs, and the wait became longer than the work.
- **Lock-in batching.** Lock-ins change `docs/design/` and images, which are never treated as documentation only, so each ready lock-in runs every suite. #844 landed 36 lock-ins as one batch.
- **Discovery reads.** `parseDiscovery` checks `definition_hash` on every read, so publishing a changed definition would make every existing Discovery group unreadable until it is reviewed. A saved revision records what was actually asked and answered, and that record should survive a change to the questions. The definition has not changed since 14 September, so the problem is not live.

## Alternatives considered

1. **Ten builds in progress (#807).** Rejected: it contradicts the roles decision, and the queue on 2 November showed that three is already the working capacity.
2. **A cap on open lock-in drafts (five was suggested).** Rejected: drafts skip the long suites, so the number of drafts costs little.
3. **Keep Discovery reads failing until reviewed.** Rejected as the long-term rule, because it makes saved records unreadable. It stays in place until the later increment.

## Scope and limits

- This changes no application code, test, migration, permission, CI workflow or branch protection, and it does not edit `CONTRIBUTING.md`.
- The limits rely on agents and Dean following them. No check enforces them.
- The Discovery answer sets a direction only. It is not a design or an implementation, and its detail remains open until that increment.
