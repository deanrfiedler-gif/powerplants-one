# AD-03 — Data Quality Workbench sources

The [issued HTML](../../reference/ui/data-quality/PPO-Data-Quality-Workbench-r01.html) and [companion report](../../reference/ui/data-quality/PPO-Data-Quality-Workbench-Report-r01.md) are preserved exactly as delivered. The [maintained preview](../../reference/ui/data-quality/PPO-Data-Quality-Workbench-working.html) contains the source maintenance described below. Both retain the same synthetic design scope; neither is an application route or approved operational policy.

## Build and verify

From the repository root:

```sh
python3 scripts/build-data-quality-workbench.py
python3 scripts/build-data-quality-workbench.py --check
node scripts/check-data-quality-model.mjs
PPO_DESIGN_JSDOM_MODULE=/absolute/path/to/jsdom/lib/api.js node scripts/check-data-quality-dom.mjs
PPO_DESIGN_PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.js PPO_AD03_CHROMIUM=/absolute/path/to/chromium node scripts/check-data-quality-browser.mjs
```

The Python wrapper stages the portable assembler in a temporary directory, keeps the original metadata order deterministic, verifies the issued r01 hash, and writes only the versionless maintained preview and its build manifest. `--check` refuses a mismatch. The three verification entry points are repository-native ESM scripts; their default optional module resolution can use a locally installed `jsdom` / `playwright`, or the declared module paths above. This contribution changes no package dependency or workflow.

## Maintained source changes

The publication pass exposed unused-binding/import lint errors in the portable source. The model now exposes the assembled binding as `globalThis.AD03Model`, consumed explicitly by the controller. The payload projection uses an equivalent key exclusion rather than unused rest-destructured bindings. The controller removes the unused route flag, unused callback/catch parameters and replaces an expression-style capability refusal with a direct guard. The checks use ESM imports and repository-relative paths. Business assertions and user-facing workflows are unchanged.

The original issued HTML embeds its exact original source; it remains the original evidence target. Source hashes in the original report describe that first issue. The maintained preview's current hashes and rerun results are separate under [repository evidence](../../testing/evidence/data-quality-r01/README.md). No original result is relabelled as a rerun.

## Source inventory

| File | Responsibility |
|---|---|
| `model.js` | Synthetic identity/scope, exact proposals, review, local receiver, original results, scoped copies and fixture checks |
| `workspace.js` | Six views, forms, role/read scenarios, navigation, local saves, snapshots and dialogs |
| `workspace.css` / `template.html` | r22 visual vocabulary, responsive workspace interior and portable assembly markers |
| `fixtures.json` / `seed.py` | Sixteen fictional finding scenarios and the retained fixture-generation recipe |
| `fonts.css` | Three exact embedded PPOBoardRoboto rules from the supplied r22 board |
| `icons.json` | Unchanged Customer 360 line-icon set at repository baseline `108b1600` |
| `source-pins.json` | Required asset hashes and original plan/theme source identities |
| `build.py` | Original portable assembler, invoked by the repository wrapper |
| Font notices | Source asset attribution and retained notice lineage; no relicensing claim |

The fixture recipe uses the portable staging path `ad03-src/fixtures.json`; normal repository builds use the checked-in JSON. If fixtures are revised, regenerate deliberately in a portable staging directory and review the resulting source and maintained preview.

Roboto attribution and source notices are retained in `Roboto-OFL.txt` and `Apache-2.0.txt`, matching the differing current repository notice and historical source-guide lineage described in the original package. The exact embedded font bytes are pinned.

## Boundaries

The module is a single HTML file with no external runtime requests. All records and adapters are fictional. Preview role selection is not authentication. Browser storage is not atomic multi-user persistence. Real domain write policy, authoritative transactions, external integrations, owner acceptance and Azure deployment remain separate work.
