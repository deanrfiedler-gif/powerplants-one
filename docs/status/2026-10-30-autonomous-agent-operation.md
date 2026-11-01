---
title: Autonomous agent operation under Dean's standing order
date: 2026-10-30
---

Dean set up scheduled Claude and Codex sessions that hand work to each other through pull request comments. He made a standing order to accept Claude's professional recommendations, and granted both agents permission to merge pull requests that are completed and ready. [CONTRIBUTING.md — Autonomous agent protocol](../../CONTRIBUTING.md#autonomous-agent-protocol) now defines the coordination tags, claims, a Dean-only list and five merge gates, and `AGENTS.md` points to it. The [cross-model review rule](../decisions/cross-model-review.md) carries an amendment: agents may merge, and every autonomous merge needs a review from the other model family.

What remains open: the protocol takes effect for Codex once this merges and Codex's scheduled instructions point to it. Branch protection, required checks and repository settings are unchanged. This pull request changes `AGENTS.md` and `CONTRIBUTING.md`, so under its own rule Dean merges it. It also changes an owner decision record, so it needs a second-model review first.

Checked: `scripts/check_foundation.py`, `scripts/check_naming.py`, `scripts/build_status.py --check`, the documentation unit tests and the documentation scope check. No application code changed, so `npm run check` was not run.

<!-- decision-index -->
- [Autonomous agent operation](../decisions/autonomous-agent-operation.md) (PPO-AUTONOMOUS-AGENT-OPERATION-DEC) records Dean's standing order of 30 October 2026: agents decide and merge under fixed gates, a Dean-only list bounds them, and it supersedes the merge part of Dean's role in the [cross-model review rule](../decisions/cross-model-review.md).
