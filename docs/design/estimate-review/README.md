# ES-04 maintainable design sources

The standalone [HTML](../../reference/ui/estimate-review/PPO-Estimate-Review-and-Pricing-Exceptions-r01.html) is generated from `template.html`, `fonts.css`, `workspace.css`, `model.js` and `workspace.js`.

```sh
python3 scripts/build-estimate-review-design.py
node scripts/check-estimate-review-model.mjs
node scripts/check-estimate-review-browser.mjs
```

Run the native script with the repository's pinned dependencies and Chrome installation. Its workflow retains original captures and manifests. The generated artifact is self-contained; no build server or network call is required to open it. Browser-local persistence depends on browser file/origin policy.

The embedded font is reused unchanged from the Notification r01 source. The r20 board supplies visual tokens, page types and component patterns; the ES-04 CSS is locally scoped. Do not edit the generated artifact independently of its sources. Rebuild and verify exact output before publication.

See the [detailed report](../../reference/ui/estimate-review/PPO-Estimate-Review-and-Pricing-Exceptions-Report-r01.md), [decision and receiving handover](../../decisions/estimate-review-pricing-exceptions-design.md) and [verification](../../testing/evidence/estimate-review-r01/README.md). No operational pricing authority or application baseline is adopted by this package.
