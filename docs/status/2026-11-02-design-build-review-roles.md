---
title: Design, build and review roles
date: 2026-11-02
---

Dean set how the tools divide the work: Claude designs pages in Figma, records the design lock-ins and reviews Codex's pull requests; Codex builds the pages in the application, at most three at a time; ChatGPT is a research and business-analysis partner and an optional second opinion, not a builder; Dean accepts designs and merges. The [decision](../decisions/design-build-review-roles.md) records the flow for a page, with the lock-in as the build specification.

Two rules change in CONTRIBUTING.md:
- **One independent review.** A pull request that needs a review gets one full review of one head. The reviewer then confirms only that its findings were addressed; a second full review is needed only when the fixes add new behaviour, a migration, a permission or grant, or a calculation or estimating rule. This replaces "a new commit needs a new review".
- **Agents do not merge**, including reverts, until Dean says otherwise. Accepting scope and design is Dean-only, so the standing order cannot take either. The rest of the 30 October standing order still applies, and the merge gates remain the checklist.

`AGENTS.md` now points cloud tasks to `scripts/cloud-setup.sh`, which arrives in #846. The [cross-model review rule](../decisions/cross-model-review.md) and the [standing order](../decisions/autonomous-agent-operation.md) carry amendment notes. Pull requests already in progress keep their current owners.

This pull request changes `AGENTS.md`, `CONTRIBUTING.md` and the standing-order record, so Dean merges it.

No application code, test, migration, permission, grant, CI workflow or branch protection changes.

<!-- decision-index -->
- [Design, build and review roles](../decisions/design-build-review-roles.md) (PPO-DESIGN-BUILD-REVIEW-ROLES-DEC) records Dean's 2 November 2026 roles: Claude designs and reviews, Codex builds, ChatGPT advises, Dean accepts and merges; one independent review per pull request; agents do not merge until Dean says otherwise.
