---
title: CS-04 follow-up focus decision and implementation boundary
date: 2026-10-26
---

The existing [Sites decision records Dean's 26 October focus amendment](../decisions/sites-figma-design.md#8-keyboard-focus-during-follow-up-refresh--26-october-2026), authorised by "Proceed based on your professional recommendations." That decision owns the bounded behaviour, alternatives, scope and required focus/revocation test matrix; [PR #715](https://github.com/deanrfiedler-gif/powerplants-one/pull/715) is its contribution record. The Site record contract and ReadState guidance identify the amendment as authorised but not implemented. It remains distinct from test-only [PR #710](https://github.com/deanrfiedler-gif/powerplants-one/pull/710); pause/hide controls remain a separate undecided question.

Application implementation remains queued under the [Codex build limit](../decisions/parallel-contribution-rules.md#amendment--26-october-2026-codex-build-limit). At the original preflight, #690, #695, #696, #697, #700 and #701 were open with implementation; this is historical evidence, and current completion/capacity must be rechecked before a separate build. No application code, permission, polling, test helper or deployment changes are claimed here.

Claude Opus 5.5 [independently reviewed](https://github.com/deanrfiedler-gif/powerplants-one/pull/715#pullrequestreview-5647371727) head `6c1a5a37a2707bb095111a6d75fba3670501c79a` on 26 October 2026, reporting three Medium and three Low findings without approval. On 27 October, Dean instructed "Proceed" with the documentation corrections. The [decision's author dispositions](../decisions/sites-figma-design.md#delivery-and-review-state) address all six: persistent recovery targets, explicit paging reset, terminal bookmark/inactive-window lifecycle, simulated versus real-window tests, bounded preamble supersession and accurate review status. Independent verification of the corrected head remains pending; the PR records the correction SHA and documentation validation separately.

New browser tests, manual keyboard/screen-reader review and physical-device acceptance have not been executed for the unbuilt correction. No merge or deployment is claimed.

<!-- decision-index -->
[Sites focus amendment](../decisions/sites-figma-design.md#8-keyboard-focus-during-follow-up-refresh--26-october-2026) extends PPO-CS04-SITES-FIGMA-DEC with the authorised keyboard behaviour; implementation is queued under the existing build rule.
