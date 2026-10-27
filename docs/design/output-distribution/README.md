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

## Source-pin review — 11 October 2026

The document issue/distribution contract and ES-05 decision replaced routine revision metadata with Git-managed history. HTML conformance also gained the application integration gate: canonical routes, scoped shell boundaries, independent source/compiled comparisons and separate owner review remain prerequisites for a later native integration. Naming adopted the same living-master rule while retaining controlled issued revisions, and added the independent Fertigation scope key; neither changes this synthetic distribution model's IDs or issue rules. The manifest now pins those reviewed current sources.

The stale manifest was also present on unchanged main `442a863`. This review refreshes source references only: the fixture, shared styles, issued HTML and historical verification remain unchanged. Current model/browser CI is recorded separately; no owner acceptance, native integration or deployment is inferred.

Local verification passes 38 model groups and 36 native browser groups with no browser errors. Deterministic assembly using the builder's declared inputs and Git LF source bytes reproduces the exact issued HTML; no reference file is rewritten. The current GitHub run remains separate.

## Source-pin review — 27 October 2026

Reviewed main `09ada5633893db8cd6a93742ce6e6b6c7cf2c5c2` after [PR #717](https://github.com/deanrfiedler-gif/powerplants-one/pull/717) merged. Against pre-integration main `923f1284765d5a88c0fb003725951a573a9b374c`, the [issue/distribution contract](../../contracts/document-issue-distribution.md#native-outputs-receiving-workspace--24-october-2026) only adds the native Outputs receiving section; all earlier contract bytes remain unchanged. The new section limits that workspace to OUT-09/OUT-10 and preserves family-qualified exact issues, source-domain authority, separate preparation/issue/distribution/response facts and Library/Templates ownership. Those boundaries agree with this package's receiving plan and immutable-evidence rules. Its broader fictional families remain historical demonstrations, not evidence of native workspace support.

The full manifest audit also found a separate stale [naming-standard](../../standards/naming-conventions.md#10-business-record-references) pin. The pinned bytes match commit `f1a79dadc4d9076b8d235c22ea75ba23e4de69e6`; the only subsequent change is the [20 October namespace amendment](../../decisions/readable-reference-namespaces.md), which shortens new application allocations to `SYN-<TYPE>-<NUMBER>` while preserving existing `SYN-PPO-…` references. The retained September fixture, including references produced by its local scenario, is historical and is not a current reference allocator. Its longer references and original bytes stay intact; a native implementation must use the adopted allocation policy.

Both source pins are refreshed after that review. This remains a valid retained standalone scenario under those limits, not the accepted native layout: the [15 October Figma decision](../../decisions/output-issue-figma-design.md#6-consequences) already supersedes its layout and gives the native contracts precedence. No fixture, component, builder, other pin, issued HTML or review record changes. The [verification summary](../../status/2026-10-27-dk-contract-source-pins.md) records fresh results separately from the historical checks above.
