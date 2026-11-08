---
title: Refined shell S1 utility focus continuation
date: 2026-11-09
---

Codex continues [PR #874](https://github.com/deanrfiedler-gif/powerplants-one/pull/874) from verified remote head `1cba4d85e7847181ee252ac72ca0f840c7db66b1`, following the released claim, for item 13 only. Authority: **Dean's decision, given in chat in Codex's session; no [DEAN] comment**; the [build record](../decisions/shell-refined-s1-build.md#shortcut-audit-and-recovery) records the instruction.

The utility toolbar now recomputes roving focus on subtree/attribute changes, focus entry and viewport resize independently of its own dimensions. Writes are idempotent, and cleanup disconnects observers/listeners before restoring original tabindex values. The added browser case mounts and unhides controls outside flex layout, checks unchanged dimensions and a single visible tab stop, and checks cleanup when refined desktop mode turns off. Existing responsive assertions and timeouts are unchanged.

Final-head local and full-suite evidence is reported on the PR for Claude's confirmation of items 1–13 only. Prior fixes/answers for items 1–12 remain at `1cba4d85`. No new design acceptance, review fingerprint, production-readiness claim, S2 work or PR merge is included.

Local validation: typecheck, full lint, all 1,444 unit tests, production build, studio:check, foundation, naming, status-source, migration-number and whitespace checks passed. Studio retains 26 stale reviews and 53 pending component reviews. Cloud setup provides the synthetic database but reports Chrome unavailable; browser:check confirms the missing `/opt/google/chrome/chrome` executable. Browser execution remains for CI, with no local pass claimed.
