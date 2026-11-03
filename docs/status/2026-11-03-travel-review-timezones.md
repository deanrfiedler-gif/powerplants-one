---
title: Travel review uses one display timezone across the route
date: 2026-11-03
---

PR #806 integrates main `6a387e228` with a clean merge and addresses the sole defect in [Claude review 5724059438](https://github.com/deanrfiedler-gif/powerplants-one/pull/806#pullrequestreview-5724059438). Primary visit and customer-window times now use the selected display timezone alongside departure, return and conflict intervals. A differing site timezone has explicitly labelled secondary visit/window times with full site-local dates. Primary date prefixes compare dates in the display timezone.

The additive unit and browser cases cover Australia/Brisbane display with Australia/Sydney during daylight saving: 08:30–10:00 Sydney becomes 07:30–09:00 Brisbane, with 07:00 departure and the 07:45 availability block on the visit. Midnight cases retain or suppress the date prefix according to Brisbane's date. Existing assertions remain; neither Scheduling regression spec is edited. No migration, server, permission, grant or #808 implementation is added.

Cloud setup reports database ready and browser unavailable. The focused unit suite passes all eight tests with network access enabled. Browser suites are **not run here; left to GitHub CI**. The existing merge hold now rests on three Scheduling desktop assertions in GitHub CI on the new head: `scheduling-refinement.spec.ts:138` (Changes return heading), `scheduling-workspaces.spec.ts:54` (reflow read status), and `scheduling-workspaces.spec.ts:106` (resource evidence heading). They are not classified as pre-existing without a run. No database suite is required for this client-only change.

Foundation, prototype, naming and status checks passed. The complete network-enabled `npm run check` passed studio, lint, typecheck, all 1,351 unit tests and the production build. Ten test-file failures from the first restricted run reproduced on clean main with the message `test failed`; none remains in the network-enabled suite. Validation and limitations are recorded in the [Travel evidence](../testing/evidence/scheduling-resources/travel-review.md). Claude's one independent review already exists; only confirmation of its finding is requested. Dean merges. No deployment or new visual acceptance is claimed.
