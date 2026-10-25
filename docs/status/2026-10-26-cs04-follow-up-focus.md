---
title: CS-04 follow-up focus decision and implementation boundary
date: 2026-10-26
---

The existing [Sites decision now records Dean's 26 October focus amendment](../decisions/sites-figma-design.md#8-keyboard-focus-during-follow-up-refresh--26-october-2026), authorised by "Proceed based on your professional recommendations." [Draft PR #715](https://github.com/deanrfiedler-gif/powerplants-one/pull/715) contains the bounded behaviour, alternatives, scope and required focus/revocation test matrix. The Site record contract and ReadState guidance identify the amendment as authorised but not implemented. It remains distinct from test-only [PR #710](https://github.com/deanrfiedler-gif/powerplants-one/pull/710); pause/hide controls remain a separate undecided question.

Application implementation remains queued under the [Codex build limit](../decisions/parallel-contribution-rules.md#amendment--26-october-2026-codex-build-limit). At preflight, #690, #695, #696, #697, #700 and #701 remain open with implementation. No application code, permission, polling, test helper or deployment changes are claimed here.

Independent review by a different model is required before merge because this is an owner-decision amendment; none has taken place. New browser tests, manual keyboard/screen-reader review and physical-device acceptance have not been executed for the unbuilt correction. Documentation validation is recorded in the PR separately from those future checks.

<!-- decision-index -->
[Sites focus amendment](../decisions/sites-figma-design.md#8-keyboard-focus-during-follow-up-refresh--26-october-2026) extends PPO-CS04-SITES-FIGMA-DEC with the authorised keyboard behaviour; implementation is queued under the existing build rule.
