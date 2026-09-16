# Warranty & Customer Resolution source

MA-06/MA-07 standalone r01. See the [detailed companion report](../../reference/ui/warranty/PPO-Warranty-and-Customer-Resolution-Workspace-Report-r01.md) and [design handover](../../decisions/warranty-customer-resolution-design.md).

Edit the template, model, controller and styles here, then run from the repository root:

```sh
python3 scripts/build-warranty-design.py
node scripts/check-warranty-model.mjs
node scripts/check-warranty-browser.mjs
```

The deterministic builder embeds all runtime assets into the HTML. The browser suite uses the repository's maintained Playwright/Chrome installation and records original screenshots, download evidence and a source/hash manifest. No runtime dependency is added.

Embedded Roboto 400/500/700 is retained from the supplied r20 style board (Google, Apache License 2.0); shared line icons retain the Work Orders/Service Review/Maintenance lineage. All warranty terms, images, names, dates, financial amounts and source references are fictional. The illustration is not a field photograph or operational instruction. Once accepted as an issued baseline, retain r01 and use a reviewed successor revision for material design changes.
