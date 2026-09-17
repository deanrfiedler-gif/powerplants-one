# Output, Issue & Distribution Centre source

DK-03 standalone design. Review the [HTML](../../reference/ui/output-distribution/PPO-Output-Issue-and-Distribution-Centre-r01.html), [detailed report](../../reference/ui/output-distribution/PPO-Output-Issue-and-Distribution-Centre-Report-r01.md), [decision](../../decisions/output-issue-distribution-design.md) and [verification](../../testing/evidence/output-distribution-r01/README.md).

```sh
python3 scripts/build-output-distribution.py
node scripts/check-output-distribution-model.mjs
npx eslint docs/design/output-distribution/*.js scripts/check-output-distribution-*.mjs
node scripts/check-output-distribution-browser.mjs
```

Use the repository's pinned Node/npm/Playwright and Chrome channel for native verification. The focused workflow installs those existing pins and retains the original browser results and screenshots. `PPO_CHROME_PATH` runs the same journeys against another inspected browser build; whichever runtime was used is recorded in `results.json`.

`model.js` owns fixture identities, separate fact dimensions, original-operation recovery and the release, distribution and response rules. It includes a self-contained SHA-256 so every displayed byte count and content identity is computed from the exact content the file can preview and download; no hash is an authored literal. `workspace.js` owns the six-view controller, forms, local save and recovery. `workspace.css` adds the module composition. `template.html` is the assembly host. `source-manifest.json` pins the exact source authority and the reused r20-aligned fonts and styles. The builder reads the shared Supplier Pricing assets directly rather than creating duplicate asset copies.

Open the generated single HTML file to review it. For consistent same-origin browser storage it can also be served by a local static server. No provider or network request is made by the file. Reset affects only `ppo.output-distribution.r01` and its `.view` preference key, and re-arms the scripted finalisation interruption. JSON review export is not an import or restore contract.

The stylesheet belongs to this isolated artifact; future application integration must scope its host and reuse the established components. All content is synthetic. Preview profiles are illustrative and do not secure the embedded fixture data.
