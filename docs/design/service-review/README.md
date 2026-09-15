# Service Review source

Edit `model.js`, `workspace.js`, `workspace.css` and `template.html`, then run:

```sh
python3 scripts/build-service-review-design.py
node scripts/check-service-review-model.mjs
node scripts/check-service-review-browser.mjs
```

Run from the repository root with its maintained dependencies for browser checks. `fonts.css` and `icons.json` retain embedded assets from the supplied Work Orders r01 / r20 lineage. No runtime package is added. The standalone HTML is assembled at `docs/reference/ui/service-review/PPO-Service-Review-and-Reports-Workspace-r01.html`.

See the [receiving handover](../../decisions/service-review-reports-workspace-design.md). Preserve issued r01 bytes once published for review; future material changes use the repository's normal reviewed successor issue process.
