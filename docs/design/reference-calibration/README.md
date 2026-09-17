# ES-10 source guide

This directory builds the standalone [Reference Cases and Calibration Proposals r01](../../reference/ui/reference-calibration/PPO-Reference-Cases-and-Calibration-Proposals-r01.html). The [detailed report](../../reference/ui/reference-calibration/PPO-Reference-Cases-and-Calibration-Proposals-Report-r01.md) documents the complete implemented surface.

| File | Responsibility |
|---|---|
| `template.html` | Module structure, tabs, snapshot and modal surfaces |
| `fonts.css` | Existing embedded PPO Roboto asset copied from Customer 360 |
| `workspace.css` | r20 token-based responsive presentation |
| `model.js` | Synthetic cases, eligibility, statistics, transitions and snapshots |
| `workspace.js` | Rendering, form handling and isolated browser storage |

From the repository root:

```sh
python3 scripts/build-reference-calibration.py
node scripts/check-reference-calibration-model.mjs
npm run browser:install
node scripts/check-reference-calibration-browser.mjs
```

Native checks use the repository's pinned Playwright dependency and Chrome channel. The dedicated workflow runs deterministic assembly, focused lint, the model/native checks and the three required repository documentation checks. Native screenshots and hashes are uploaded as a CI artifact. Nothing here changes a runtime application route, dependency or database.

All examples are synthetic. Northbank preserves PR #220's incoming Draft / Partial state; the five reviewed examples are separately authored demonstrations. Local storage uses `ppo.es10.reference-calibration.r01`. Reset affects that key only. [Receiving handover](../../decisions/reference-calibration-design.md) and [verification record](../../testing/evidence/reference-calibration-r01/README.md).
