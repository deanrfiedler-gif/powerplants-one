---
title: Design-to-build operating model
date: 2026-11-01
---

Under Dean's delegation of 1 November 2026, [ADR-0067](../decisions/ADR-0067-design-to-build-operating-model.md) sets how UI pages are designed in Figma and built in the app, and the [design-to-build standard](../standards/design-to-build-standard.md) holds the working rules. New tokens and components now start in Figma, Git keeps acceptance records and shipped values, and `scripts/check_design_tokens.py` compares the two. `docs/design/figma-variables.json` is the first snapshot: all 63 mapped variables have their value on that property in the CSS, 19 are design-only and 32 form an unmapped baseline. Hard-coded colours (1,998) and multi-valued properties (56 of 198, 29 of them mapped) are report-only until the reconciliation stage.

The Figma files have not changed. The freeze, library, pilot and domain files are later stages, and pages are still drawn in "PPO - Design" until the freeze. Figma's memory meter read 80.4% (682,382 layers) on a fresh load and 82.5% (687,991) after opening one page, with no file changed by the readings, so the restructure comes before further bulk drawing. Cross-file behaviour is untested. Dean also raised the design goal: decision 14 and section 14 of the standard set a higher design language first, five flagship journeys, tiered redesign waves and task tests with staff, none of which has started. Dean approved the staff task tests; nobody has been contacted. This change accepts no page design. All 78 parent IDs remain.

<!-- decision-index -->
[Design-to-build operating model](../decisions/ADR-0067-design-to-build-operating-model.md) (ADR-0067) makes Figma the starting point for new visual decisions, keeps acceptance and shipped values in Git, and plans a frozen record, one published library and domain files created on demand.
