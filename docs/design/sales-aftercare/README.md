# CR-05 Sales Aftercare & Renewal Worklist source

This source produces the [standalone r01 HTML](../../reference/ui/sales-aftercare/PPO-Sales-Aftercare-and-Renewal-Worklist-r01.html). The [companion report](../../reference/ui/sales-aftercare/PPO-Sales-Aftercare-and-Renewal-Worklist-Report-r01.md) documents its actual views, fields, actions, state transitions, provenance, permissions, recovery behaviour, synthetic scenarios and application receiving requirements.

| File | Responsibility |
|---|---|
| `template.html` | Semantic page shell and assembly markers. |
| `fonts.css` | Embedded Roboto, copied byte for byte from the My Work r01 source, which took it from the verified attached r20 board. SHA-256 `57b4aafb71296b18d80408cb10aa972c87f5185deafd748c7fdcfb33e2bd4bef`. |
| `workspace.css` | Scoped r20 styles derived from the My Work r01 stylesheet, plus the CR-05 outcome ledger, provenance chips, review comparison, steppers and history grouping. |
| `model.js` | Synthetic customers and neighbouring source records, aftercare projections, permissions, validation and guarded local commands. |
| `workspace.js` | Five views, record and item drawers, forms, local storage, scenarios and recovery. |

From the repository root:

```bash
python3 scripts/build-sales-aftercare.py
node scripts/check-sales-aftercare-model.mjs
node scripts/check-sales-aftercare-browser.mjs
```

The build is deterministic: the same sources produce the same bytes and the script prints the SHA-256 of the result. The model check runs the source model in an isolated VM context and needs no browser. The native browser check prefers an installed Chrome and falls back to the bundled Chromium, recording in `verification-evidence/sales-aftercare/results.json` which browser actually ran, the HTML hash, every group result and the hash of each screenshot.

Edit the sources and rebuild the HTML; do not edit the generated file. No application package, dependency pin, server contract, route or database migration is introduced here. The complete fixture is synthetic. Preview roles are presentation controls and are not authenticated access control — the receiving application must enforce the equivalent scope and permission on the server.

## 17 September recovery

The supplied HTML and report are unchanged. Source files were extracted from that exact HTML and the deterministic builder reproduces it byte-for-byte. The missing model/browser scripts were recreated as explicitly labelled recovery suites. Read [provenance and fresh verification](../../testing/pr-217-repair-status.md); earlier evidence remains historical.
