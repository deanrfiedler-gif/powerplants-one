---
title: CR05 browser test gets a three-minute limit
date: 2026-11-02
---

The CR05 desktop browser test (`tests/browser/sales-workflows.spec.ts`, "CR05 issued source review…") failed on #850 at `df593c83a` on 2 November 2026. It had reached its final step, `captureSizes`, when it ran out of the default 120-second limit. The other 650 tests in that proof passed, and #850 changes no application or test code. The same test passes in about 90 seconds on `main` at `7c23b54c7`, so it normally uses about 75% of its limit. The likely cause is a slow run while the CI queue was heavy; the trace was not opened to confirm this.

The test now sets a 180-second limit, as two other journeys in the same file do on #702. Its five-second render assertions and its other checks are unchanged. This is separate from the route-handling fix in #849, which does not change the limit.

Not run locally, because the reviewed Chrome cannot be installed in this workspace; GitHub CI runs the test on both viewports.

No application code, migration, permission, grant or workflow changes.
