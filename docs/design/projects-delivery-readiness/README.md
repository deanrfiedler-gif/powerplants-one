# Projects delivery-readiness source

Stable design source for [Projects — Delivery Readiness & Change Control](../../decisions/project-delivery-readiness-design.md), review r01.

- `template.html`: semantic module frame and metadata.
- `roboto.css`: the three font faces extracted from the supplied r20 board, with only the CSS family alias changed to `PPOFont`.
- `workspace.css`: r20 tokens, module layouts and responsive/print rules.
- `model.js`: isolated synthetic model, source versions, reviews and local receipts.
- `workspace.js`: connected views, forms, source inspection, assistance and local export.

From the repository root:

```sh
node scripts/build-project-delivery-readiness.mjs
node scripts/check-project-delivery-readiness-model.mjs
PPO_DOM_MODULE=/absolute/path/to/an/installed/jsdom/lib/api.js node scripts/check-project-delivery-readiness-dom.mjs
```

The builder updates [the stable working HTML](../../reference/ui/projects/project-delivery-readiness-and-change-control.html). `--issue` also writes the [r01 issue](../../reference/ui/projects/PPO-Project-Delivery-Readiness-and-Change-Control-r01.html); do not use that flag to change a previously received issue. Use a successor review revision for later changes. No runtime dependency is introduced; the DOM checker optionally reuses an existing jsdom installation and is explicitly not a browser renderer.

The [verification record](../../testing/project-delivery-readiness-review.md) records exact checks, source hashes and the browser-access limitation. The [original plan](../../reference/ui/projects/PPO-Project-Delivery-Readiness-and-Change-Control-Plan-r01.md) is preserved as an issued historical brief; its original proposed status is intentional.
