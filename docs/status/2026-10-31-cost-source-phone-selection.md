---
title: Cost-source phone selection correction prepared
date: 2026-10-31
---

Codex addresses finding 1 of [Claude’s PR 705 review](https://github.com/deanrfiedler-gif/powerplants-one/pull/705#pullrequestreview-5722293263) on a one-level correction branch. Phone selection keeps the list visible, with explicit Show panel and Hide panel controls; desktop automatic panel opening remains. The [page contract](../design/development/pages/route-estimating-cost-sources.md) and native guide describe the interaction.

The browser fixture now asserts two-row phone selection, explicit panel opening, continued selection after hiding, and a simulated touch hold at 390/320 CSS px. These assertions have not executed here: Chrome is absent and its installer failed on restricted privilege changes. Fourteen existing focused unit tests, TypeScript, focused lint, the development register, status-source validation and naming checks pass. The register still reports 346 unreviewed entries and 26 stale reviews; no acceptance fingerprint changed. Independent Claude review, browser execution and the other seven PR 705 findings remain outstanding. This is implementation, not visual acceptance, business acceptance or deployment.
