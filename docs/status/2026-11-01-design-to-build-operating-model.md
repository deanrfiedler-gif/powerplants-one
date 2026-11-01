---
title: Design-to-build operating model
date: 2026-11-01
---

Under Dean's delegation of 1 November 2026, [ADR-0067](../decisions/ADR-0067-design-to-build-operating-model.md) sets how UI pages are designed in Figma and built in the app, and the [design-to-build standard](../standards/design-to-build-standard.md) holds the working rules. New tokens and components now start in Figma, Git keeps acceptance records and shipped values, and `scripts/check_design_tokens.py` compares the two. `docs/design/figma-variables.json` is the first snapshot: 63 mapped variables all match the CSS, 19 are design-only and 32 form an unmapped baseline. Hard-coded colours (1,997) and multi-valued properties (57 of 200) are report-only until the reconciliation stage.

The Figma files have not changed. The rehearsal, freeze, library and domain files are later stages, and pages are still drawn in "PPO - Design" until cut-over. The memory meter has not been read and cross-file behaviour is untested. This change accepts no page design. All 78 parent IDs remain.

<!-- decision-index -->
[Design-to-build operating model](../decisions/ADR-0067-design-to-build-operating-model.md) (ADR-0067) makes Figma the starting point for new visual decisions, keeps acceptance and shipped values in Git, and plans a frozen record, one published library and domain files created on demand.
