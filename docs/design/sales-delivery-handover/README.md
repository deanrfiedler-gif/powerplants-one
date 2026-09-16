# CR-03 Sales-to-Delivery Handover design source

This is the reproducible source of the [standalone r01 workspace](../../reference/ui/crm/PPO-Sales-to-Delivery-Handover-Workspace-r01.html). The [detailed companion report](../../reference/ui/crm/PPO-Sales-to-Delivery-Handover-Workspace-Report-r01.md) documents every view, field, decision and boundary. The [decision and receiving handover](../../decisions/sales-delivery-handover-design.md) retains authorisation, provenance and receiving scope. Actual results are in the [verification record](../../testing/evidence/sales-delivery-handover-r01/README.md).

| File | Purpose |
|---|---|
| `model.js` | Synthetic sources, proposed state model, submission/return/acceptance guards, source-fingerprint binding, revision comparison, obligations, original-operation recovery and session validation |
| `workspace.js` | Six-view renderer, saved views, filters, snapshots, decision forms, comparison, local persistence and recovery banners |
| `workspace.css` | Scoped r20 palette, layout, registers, forms, comparison, responsibility chain and responsive rules |
| `template.html` | Self-contained document assembly template; workspace interior only, with no competing application masthead |

Run from the repository root:

```sh
python3 scripts/build-sales-delivery-handover.py
node scripts/check-sales-delivery-handover-model.mjs
node scripts/check-sales-delivery-handover-browser.mjs
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
git --no-pager grep -n -E "^(<<<<<<<|=======$|>>>>>>>)" -- docs
git diff --check
```

The embedded r20 Roboto faces are **not duplicated here**. The build reads them from `docs/design/quality-site-assurance/fonts.css`, SHA-256 `57b4aafb71296b18d80408cb10aa972c87f5185deafd748c7fdcfb33e2bd4bef`, and asserts that hash, so an upstream change is a reviewed decision rather than a silent difference in this output.

The build also asserts that the retained customer quotation r03 (`docs/reference/ui/quoting/ppo-quotation-module-r03.html`, SHA-256 `7ee657ef0f78d905486e9227a0821d88f86beddc9e13b872202b4095e2b6fe9a`) is unchanged, because the accepted commercial basis reproduces its declared lines, selection defaults and amounts. Do not remove that guard: if the upstream issue changes, the accepted basis needs a reviewed successor mapping, not a silent rebuild.

Edit the sources here and rebuild. Do not hand-edit the generated HTML and do not modify any issued upstream reference.

The browser script uses the repository-pinned Playwright. It launches the `chrome` channel by default; set `PPO_CHROME_PATH` to an explicit Chromium binary where that channel is not installed. The manifest always records the browser version actually used, so a run on a different binary is visible rather than implied. Results and captures are written to the ignored `verification-evidence/sales-delivery-handover/` directory.

No dependency, framework, application route, migration, adapter or hosting change is introduced. The output is a single file that opens directly in a browser with no network dependency; external links open repository references only.

Local storage key: `ppo-cr03-handover-r01`. Browser storage can be unavailable, cleared or blocked; when a read or write fails the workspace holds the session in the page alone, says so in the status line, and preserves any damaged saved record rather than overwriting it. Export is a download, not a delivery service. Reset affects this module's local demonstration only.

Every identity, person, amount, document, purchase order and external key is fictional. Preview roles are presentation examples and are not authentication.

Roboto attribution: copyright 2011 Google Inc., Apache License 2.0. The exact declarations were extracted from the repository r20 style board, SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`.
