# Users, Roles, Teams & Access Review working source (AD-01)

This source produces the [versionless working HTML](access-review.html). The [issued r01 HTML](../../reference/ui/access-review/PPO-Users-Roles-and-Access-Review-r01.html) is retained unchanged as historical evidence; generating current capabilities does not grant design acceptance. The [companion report](../../reference/ui/access-review/PPO-Users-Roles-and-Access-Review-Report-r01.md) documents its views, fields, rules, provenance and receiving boundaries. The [build plan](../../delivery/users-roles-access-review-build-plan.md) records the intended scope.

| File | Responsibility |
|---|---|
| `template.html` | Semantic page shell, scope metadata (`ppo-scope-id` AD-01, working status, without an issued revision) and assembly markers. |
| `fonts.css` | Embedded Roboto, byte-identical to `docs/design/my-work/fonts.css` (SHA-256 `57b4aafb71296b18d80408cb10aa972c87f5185deafd748c7fdcfb33e2bd4bef`), itself taken from the r20 board. |
| `workspace.css` | r20 token core (same names and values as My Work r01), scoped under `#ppo-access-review`, with register, matrix, panel and phone treatments. |
| `capabilities.js` | **Generated. Do not edit.** The 92-value `Capability` union from `src/platform/permissions.ts` and the 31-value hosted tester set from `scripts/demo-database.ts`, with the SHA-256 of both sources. |
| `model.js` | Contract rules (scope, uniqueness, validity, evaluation), the proposed workflow (bundles, teams, change requests, reviews, events), guards, visibility, queues, restore validation and the synthetic fixture. |
| `workspace.js` | Six views, dialogs, the 448 px inspection panel, local storage, backup/restore, evidence export, fixed clock, scripted assistant and the eight UI states. |

From the repository root:

```bash
python3 scripts/build-access-review.py
node scripts/check-access-review-model.mjs --write-evidence
node scripts/check-access-review-browser.mjs
```

The native browser command requires the repository's pinned runtime, Playwright and installed Chrome channel. Where that channel is not installed, `PPO_BROWSER_PATH=/path/to/chrome` runs the same checks on a substitute browser. The result file records `browser_channel: substitute` and the path, and that run is not evidence for the pinned runtime. The focused workflow `access-review-design.yml` rebuilds, fails if the generated capability list or HTML differs from the committed files, runs both checks, and retains the evidence for 14 days.

Edit sources and rebuild; never edit the generated HTML or `capabilities.js` by hand. If `src/platform/permissions.ts` or the hosted tester set changes, rebuild. The model check then compares the catalogue with the new union, and any new capability needs a label in `model.js`.

No application package, dependency pin, server contract, migration or seed is introduced. Every identity, grant and event is synthetic. Browser role selection is explanatory; it is not authentication or authorisation.
