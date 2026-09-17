# ES-09 Estimate-to-Actual Outcome Review source

This source produces the [standalone r01 HTML](../../reference/ui/estimate-actual-review/PPO-Estimate-to-Actual-Outcome-Review-r01.html). The [companion report](../../reference/ui/estimate-actual-review/PPO-Estimate-to-Actual-Outcome-Review-Report-r01.md) documents every view, field, formula, rule, permission, recovery behaviour, receiving boundary and limitation.

| File | Responsibility |
|---|---|
| `template.html` | Semantic page shell and assembly markers. |
| `fonts.css` | Embedded Roboto extracted from the verified r20 theme board, byte-identical to the copy used by the Quality and My Work designs. |
| `workspace.css` | Scoped r20 styles, register and comparison layouts, and the phone treatment. |
| `model.js` | Fixtures, exact integer arithmetic, comparison and reconciliation rules, guarded commands and receipts. |
| `workspace.js` | Five views, docked snapshots, decision forms, restricted rendering, local session and recovery. |

From the repository root:

```bash
python3 scripts/build-estimate-actual-review.py
node scripts/check-estimate-actual-review-model.mjs
node scripts/check-estimate-actual-review-browser.mjs
```

The native browser command uses the repository's pinned Chrome channel. Set `PPO_BROWSER_EXECUTABLE` to an installed Chromium binary to run it in an environment without that channel; the result manifest records which binary ran, and a run against another binary is not evidence for the pinned one. The focused GitHub Actions workflow performs deterministic build verification, the model check and the native check on the pinned runtime, and retains original screenshots for 14 days.

Edit the sources and rebuild the HTML; never edit the built file. No application package, dependency pin, server contract or database migration is introduced here. The complete fixture is synthetic, and browser role selection is an explanatory display control, not authenticated access control.

Nothing in this source adopts an accounting definition, a materiality threshold, an allocation basis or a variance reason registry. Where a definition is missing the workspace withholds the number and names the missing definition.
