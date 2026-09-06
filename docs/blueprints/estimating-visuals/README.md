# Estimating design preview and evidence

Open [the standalone HTML](../estimating-workspace-mockup.html) in a browser for the fictional costing, scope, quotation and history walkthrough. It embeds the original supplied logo and font, uses no external requests or storage, and resets on reload. It is a design document, not an application route or quotation for a real customer.

The [screen specification](../estimating-screen-specification.md) defines the intended behaviour; the [handover](../../delivery/estimating-discovery-handover.md) records actual verification and limits. Local rendering was unavailable during authoring. No unexecuted capture is presented as evidence.

Publication has now been authorised. The **Estimating design assurance** GitHub workflow runs these checks on the committed synthetic document; consult the PR for actual results:

```sh
python3 docs/testing/estimating-design-check.py
node docs/blueprints/estimating-design-check.mjs
```

The browser check uses the repository's existing Playwright/Chromium pins. On success it produces desktop costing/quotation, 390px and 320px phone costing/quotation, and stale-total captures in `verification-evidence/estimating-design/`, plus `design-review.json` recording exact input hashes and actual checks. The workflow retains these original bytes in the `Estimating-design-evidence` artifact for 14 days. A future PR should link the exact run; inspected captures can then be committed here with their original hashes for durable review.

The checks cover transient line editing/reload, invalid quantity, include/print totals, a bounded customer-preview field check, state illustrations, keyboard tabs and contained layouts. They do not prove server permissions, persistence, safe runtime payloads, PDF issue, screen-reader acceptance or CREMS parity. EA-01–EA-18 remain Not run.
