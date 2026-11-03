---
title: Intake workload phone selection CI correction
date: 2026-11-02
---

PR [#703](https://github.com/deanrfiedler-gif/powerplants-one/pull/703) repairs its native phone selection test to use the existing Hide panel control before selecting a row beneath the overlapping panel. Sequence, export, stale-selection rejection and geometry assertions remain intact. The 320 px regression now selects and clears two rows with focus return. No UI, native read/mutation, permission or policy change. Current main’s accepted-design documentation batch is integrated.

See [implementation evidence](../testing/evidence/intake-workload-accepted/README.md) for the exact CI findings, successful targeted validation and separate CR05 capture deadline. Claude review is explicitly waived; fresh CI, owner/device acceptance, guide publication, merge and deployment remain separate.
