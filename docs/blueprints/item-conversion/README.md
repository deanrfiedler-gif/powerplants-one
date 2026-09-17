# ES-07 standalone build

This directory assembles [ES-07 HTML r01](../../reference/ui/quoting/PPO-One-Off-Item-Resolution-and-Conversion-r01.html). Read the [feature report](../../reference/ui/quoting/PPO-One-Off-Item-Resolution-and-Conversion-Report-r01.md) and [receiving handover](../../decisions/item-resolution-conversion-design.md) for scope and authority.

| File | Purpose |
|---|---|
| `build.cjs` | Standard-library Node assembler; pins ES-06 bytes, evaluates its retained response model to create a labelled fictional accepted fixture, shares ES-05 r02 CSS and embeds the ES-07 scripts |
| `model.js` | Exact accepted source, item operations, entity mappings, review, original conversion and recovery guards |
| `ui.js` | Five-step renderer, decisions, snapshots, exports, ES-06 import and local persistence |
| `shell.html` | Workspace-only scaffold, no shared application masthead |
| `style.css` | Bounded guided-workflow/comparison additions to the shared workspace styles |

Run from the repository root with Node supporting Web Crypto:

```sh
node docs/blueprints/item-conversion/build.cjs
node docs/testing/item-conversion-model-check.cjs > docs/testing/item-conversion-model-results.json
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
```

No dependencies or new framework are installed. Edit source here, rebuild and regenerate the focused results together. Do not hand-edit the generated HTML or modify issued upstream references. If a pinned upstream issue changes, a reviewed successor mapping is needed; do not silently remove the hash guard.

The output contains embedded fonts, CSS and JavaScript and can be opened as a standalone HTML file in a browser with Web Crypto and local storage support. Local storage key: `ppo-es07-conversion-r01`. Browser policy and storage availability vary; failure holds further actions and leaves evidence export available. Exports are downloads, not an external delivery service. Reset affects this module’s local demonstration case only.

The default case uses a hypothetical complete-pack attestation to exercise conversion; real r03 attachment files are absent. ES-06 handover imports stay held for those missing files. Provider responses and all external keys are synthetic; no network write is made. The tests execute the generated scripts with a small DOM shim and are not native visual/accessibility assurance. See [verification](../../testing/item-conversion-verification.md).
