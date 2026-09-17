# Quotation lifecycle design sources

These source files reproduce **ES-05 r02** and **ES-06 r01** while preserving the issued quotation r03 and ES-05 r01 references. Run:

```sh
python3 docs/blueprints/quotation-lifecycle/build.py
node docs/testing/quotation-release-r02-model-check.cjs
node docs/testing/quotation-response-model-check.cjs
```

The builder checks the exact source hashes before reading them. It extracts r03’s original customer stylesheet and embedded logo for the ES-05 document projection, then adds a bounded response adapter around r03’s unchanged customer presentation for ES-06. The generated HTML files are self-contained; no JavaScript framework, new dependency, external asset service or runtime application change is introduced.

| Source | Responsibility |
|---|---|
| `build.py` | Deterministic assembly; preserve issued sources; escape embedded documents for safe inline scripts |
| `workspace.css`, `inspection-panel.js` | Workspace-only composition and docked snapshot inspection |
| `release-output.js` | Exact ES-05 content rendered with retained r03 document components; script-free output |
| `response-model.js` | Exact issue/selection/signature validation, response operations, negotiation, closure, recovery and prepared handover |
| `customer-bridge.js` | Retain customer form/selection state and communicate exact response intents to the enclosing local model |
| `response-shell.html`, `response.css`, `response-ui.js` | Staff workspace, full customer viewport, forms, evidence, persistence and exports |

ES-05 and ES-06 are standalone fixtures, not automatically synchronised application modules. ES-06 uses the original r03 Riverbend offer; it does not fabricate estimate approval or import unrelated ES-05 commercial terms. Operational ES-05 → ES-06 issue loading, authenticated customer links and ES-06 → ES-07 conversion are receiving contracts.

The model checks execute generated scripts in Node VM using DOM shims. They do not supply native layout, accessibility, print or device evidence. See [verification](../../testing/quotation-lifecycle-verification.md), [ES-05 report](../../reference/ui/quoting/PPO-Quotation-Approval-Issue-and-Distribution-Report-r02.md) and [ES-06 report](../../reference/ui/quoting/PPO-Quotation-Response-and-Negotiation-Report-r01.md).
