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
