---
title: CR05 browser test holds only the first completed read
date: 2026-11-02
---

The CR05 desktop browser test (`tests/browser/sales-workflows.spec.ts`, "CR05 issued source review…") failed on `main` at `4f26da596` and on #848, on 2 November 2026, with `route.fulfill: Route is already handled!`, followed by a disabled "Close aftercare record" button.

Cause: to exercise the gap between the CompleteReview receipt and the record refresh, the test held every completed-state GET for 6 seconds. Polls kept arriving, so several handlers were still asleep when the test removed the route. They then fulfilled requests Playwright had already released, and delivered stale reads after the page had moved on to the closure step.

Fix: every completed read now waits at one barrier, released 6 seconds after the receipt arrives, so no overlapping focus or interval read can deliver the saved record early, and the test asserts that the release came at least 6 seconds after the receipt. A `finally` releases the barrier if anything fails, so no read stays held. The test removes the route with `page.unrouteAll({ behavior: "wait" })`, the idiom other browser suites here already use, so handlers still running finish first. The Codex review found that the first version of this fix, which held only the first completed read, let a later read through early. The earlier held read in the same test is registered with `{ times: 1 }`, so no other route is affected. The ordering the test proves, receipt first and then the saved record, is unchanged.

Checked locally: ESLint and `tsc --noEmit` passed. The browser test was not run locally, because the reviewed Chrome cannot be installed in this workspace; GitHub CI runs it on both viewports.

No application code, migration, permission, grant or workflow changes.
