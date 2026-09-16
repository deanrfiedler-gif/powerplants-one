# My Work & Action Centre source

This source produces the [standalone r01 HTML](../../reference/ui/my-work/PPO-My-Work-and-Action-Centre-r01.html). The [companion report](../../reference/ui/my-work/PPO-My-Work-and-Action-Centre-Report-r01.md) documents its actual views, fields, roles, interactions, provenance and receiving boundaries.

| File | Responsibility |
|---|---|
| `template.html` | Semantic page shell and assembly markers. |
| `fonts.css` | Embedded Roboto from the verified attached r20 board. |
| `workspace.css` | Scoped r20 styles, worklist layout and phone treatment. |
| `assurance-model.js` | Unmodified Quality PR #208 source model, head `23199a8a4e11e71c52d774d9d58ad5e4ae4c8c32`; SHA-256 `d9c383a80e0d522d22fd502741d43ef90db2dd7373acd73958c3bf28d900cbcc`. |
| `model.js` | Source-obligation projections, permissions, views, preferences and guarded local commands. |
| `workspace.js` | Six views, exact source drawers, forms, local storage and recovery. |

From the repository root:

```bash
python3 scripts/build-my-work.py
node scripts/check-my-work-model.mjs
node scripts/check-my-work-browser.mjs
```

The native browser command requires the repository's pinned runtime, Playwright and installed Chrome. The focused GitHub Actions workflow performs deterministic build verification, model and native checks and retains original screenshots for 14 days. [Verification evidence](../../testing/evidence/my-work-r01/README.md) records exact runs and results.

Edit sources and rebuild the HTML. Keep the copied Assurance model byte-identical until a deliberate dependency update with reviewed provenance. No application package, dependency pin, server contract or database migration is introduced here. The complete local fixture is synthetic; browser role selection is explanatory and is not authenticated access control.
