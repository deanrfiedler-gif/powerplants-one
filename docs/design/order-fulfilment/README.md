# Order Fulfilment & Customer Delivery source

This source produces the [standalone r01 HTML](../../reference/ui/supply-chain/PPO-Order-Fulfilment-and-Customer-Delivery-Workspace-r01.html) for page scopes **SC-05**, **SC-06** and **SC-07**. The [companion report](../../reference/ui/supply-chain/PPO-Order-Fulfilment-and-Customer-Delivery-Workspace-Report-r01.md) documents its views, fields, quantity definitions, permissions, recovery behaviour, provenance and receiving boundaries.

| File | Responsibility |
|---|---|
| `template.html` | Semantic page shell, working-context card and assembly markers. |
| `fonts.css` | Embedded Roboto from the verified attached r20 board. Byte-identical to `docs/design/my-work/fonts.css`, SHA-256 `57b4aafb71296b18d80408cb10aa972c87f5185deafd748c7fdcfb33e2bd4bef`. |
| `workspace.css` | Scoped r20 tokens and controls, derived from the My Work r01 base and rescoped to `#ppo-fulfilment`, plus register, stock, picking, delivery and exception layouts and the phone treatment. |
| `model.js` | Pure coordination model: synthetic fixture, quantity algebra, permission projections, validation, commands and idempotent receipts. No DOM access. |
| `workspace.js` | Five views, drawers, forms, local persistence, source scenarios and recovery. |

From the repository root:

```bash
python3 scripts/build-order-fulfilment.py
node scripts/check-order-fulfilment-model.mjs
node scripts/check-order-fulfilment-browser.mjs
```

The native browser command requires the repository's pinned runtime, Playwright and an installed browser. It prefers the pinned Chrome channel and falls back to the Playwright-bundled Chromium, recording in `results.json` which browser actually ran. The focused GitHub Actions workflow performs deterministic build verification, the model checks and the native checks, and retains original screenshots for 14 days. [Verification evidence](../../testing/evidence/order-fulfilment-r01/README.md) records the exact runs and results.

Edit the sources and rebuild the HTML; never edit the generated file. Keep `fonts.css` byte-identical until a deliberate dependency update with reviewed provenance.

The complete fixture is synthetic. Two companies, three warehouses, six identities and every `SYN-…` reference are demonstration values. No application package, dependency pin, server contract or database migration is introduced here, and browser role and company selection is a presentation of the model's permission projections rather than authenticated access control.
