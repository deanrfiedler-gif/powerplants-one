# Supplier Pricing & Cost Sources source

PD-03 / ES-03 standalone synthetic design. Generated file: [HTML](../../reference/ui/supplier-pricing/PPO-Supplier-Pricing-and-Cost-Sources-r01.html). Companion: [detailed report](../../reference/ui/supplier-pricing/PPO-Supplier-Pricing-and-Cost-Sources-Report-r01.md).

```sh
python3 scripts/build-supplier-pricing.py
node scripts/check-supplier-pricing-model.mjs
npx eslint docs/design/supplier-pricing/*.js scripts/check-supplier-pricing-*.mjs
node scripts/check-supplier-pricing-browser.mjs
```

Native checks require the repository's installed/pinned Playwright and Chrome channel. The dedicated workflow performs assembly, focused lint, model, native and repository documentation checks and retains screenshots. It changes no dependencies.

`model.js` owns exact scaled-integer arithmetic, sources, snapshots and transitions. `workspace.js` renders the five views and manages browser-local recovery. `workspace.css` reuses the r20-aligned ES-10 primitives with module-specific review composition. `fonts.css` embeds the existing PPO Roboto assets, retained from the same source family. `template.html` assembles the single offline artifact.

Use the fixed synthetic assessment date, 17 September 2026, to reproduce validity behaviour. Resetting clears only `ppo.supplier-pricing.r01`. Export before resetting any review work that should be retained. Roles are illustrative; there is no server authentication.

See [decision](../../decisions/supplier-pricing-cost-sources-design.md) and [verification](../../testing/evidence/supplier-pricing-r01/README.md) for actual outcomes and limits.
