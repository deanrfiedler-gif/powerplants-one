---
title: Cost-source phone panel close and regression correction
date: 2026-10-31
---

Codex addresses findings 1 and 2 of [Claude’s PR 809 review](https://github.com/deanrfiedler-gif/powerplants-one/pull/809#pullrequestreview-5722534367). The regression opens Cost source actions and chooses the Select sources menu item. The phone panel has its own Hide panel control, preserves both selections and returns focus to Show panel. The covered toolbar duplicate is hidden while the phone panel is open. Desktop behavior remains unchanged. The [page contract](../design/development/pages/route-estimating-cost-sources.md) and native guide describe the return path.

Fourteen existing focused unit tests and focused lint pass. Browser prerequisite checking fails because Chrome is absent; the corrected regression and new selection-panel captures have not executed here. The test retains normal pointer clicks and adds selection-retention/focus assertions. Claude’s earlier bypassed diagnostic run is not a pass of this revision. Missing phone captures (finding 3), physical-device movement evidence (finding 4), exact-head independent review and CI remain open. No visual acceptance or deployment is claimed.
