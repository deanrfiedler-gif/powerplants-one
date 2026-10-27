# Document Register & Linked Library source

DK-01 / DK-02 standalone design. Review the [HTML](../../reference/ui/document-library/PPO-Document-Register-and-Linked-Library-r01.html), [detailed report](../../reference/ui/document-library/PPO-Document-Register-and-Linked-Library-Report-r01.md), [decision](../../decisions/document-register-linked-library-design.md) and [verification](../../testing/evidence/document-library-r01/README.md).

```sh
python3 scripts/build-document-library.py
node scripts/check-document-library-model.mjs
npx eslint docs/design/document-library/*.js scripts/check-document-library-*.mjs
node scripts/check-document-library-browser.mjs
```

Use the repository’s pinned Node/npm/Playwright and Chrome channel for native verification. The focused workflow installs these existing pins and retains the original browser results and screenshots.

`model.js` owns fixture identities, exact source snapshots and review rules. `workspace.js` owns the six-view controller and local recovery. `workspace.css` adds the document layout. `template.html` is the assembly host. `source-manifest.json` records the exact source authority and reused r20-aligned fonts/styles. The builder reads shared Supplier Pricing assets directly rather than creating duplicate asset copies.

Open the generated single HTML file to review it. For consistent same-origin browser storage, it can also be served by a local static server. No provider or network request is made by the file. Reset affects only `ppo.document-library.r01` and its `.view` preference key. JSON review export is not an import/restore contract.

The stylesheet belongs to this isolated artifact; future application integration must scope its host and reuse established components. All content is synthetic. Role controls are illustrative and do not secure embedded fixture data.

## Source-pin review — 11 October 2026

The document issue/distribution contract changed only its living-master metadata: the r07 edition label became Git-managed history. Its issue identities, release/distribution rules and declared integration limits are unchanged. The manifest now pins that reviewed current text.

The stale manifest was also present on unchanged main `442a863`. This review refreshes source references only: the fixture, shared styles, issued HTML and historical verification remain unchanged. Current model/browser CI is recorded separately; no owner acceptance, native integration or deployment is inferred.

Local verification passes 23 model groups and 23 native browser groups with no browser errors. Deterministic assembly using the builder's declared inputs and Git LF source bytes reproduces the exact issued HTML; no reference file is rewritten. The current GitHub run remains separate.

## Source-pin review — 27 October 2026

Reviewed main `09ada5633893db8cd6a93742ce6e6b6c7cf2c5c2` after [PR #717](https://github.com/deanrfiedler-gif/powerplants-one/pull/717) merged. Against pre-integration main `923f1284765d5a88c0fb003725951a573a9b374c`, the [issue/distribution contract](../../contracts/document-issue-distribution.md#native-outputs-receiving-workspace--24-october-2026) only adds the native Outputs receiving section. It leaves Library ownership unchanged and grants no issue authority to document review. This package retains exact source/version identity, independent technical review and locally prepared impact follow-up; those actions neither issue outputs nor alter existing acknowledgements. Its baseline remains valid as a retained standalone scenario.

Only that contract pin changes; all four other pins still match. The [standalone design decision](../../decisions/document-register-linked-library-design.md) already records that the accepted Figma layout supersedes this historical six-view layout and that the native library contract takes precedence. This refresh does not adopt a new layout or claim native integration. Fixture, shared assets, builder, issued HTML and historical evidence stay unchanged. The [verification summary](../../status/2026-10-27-dk-contract-source-pins.md) records fresh results separately from the historical checks above.
