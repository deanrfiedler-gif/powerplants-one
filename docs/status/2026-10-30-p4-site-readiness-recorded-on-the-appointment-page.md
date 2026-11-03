---
title: P4 site readiness recorded on the appointment page
date: 2026-10-30
---

The SV-04 appointment page (`/service/appointments/[id]`) now records customer site readiness and shows the server-derived P4 criterion. Before this, migration 0120 held dispatch and refused attendance until site readiness was confirmed, but no screen could record it, so end-to-end scenario TS-01 could not dispatch or start any visit. Dean asked for the TS-01 gaps to be built; this is the first, owned by Claude on branch `claude/site-readiness-recording`.

- The Customer site readiness check, readiness strip and Ready to dispatch read the current-schedule `preparation` projection: Confirmed (late after the window), Not ready, or Not confirmed.
- Record site readiness opens an inline editor with the four P4 checks (Confirmed, Not ready or Not applicable, each with a note), the window and a note; Record no answer saves NoResponse.
- The booking recovery journal accepts exactly the typed `purpose` and four `site_checks`; the first browser run found it refusing them.

No migration, seed, grant, capability, route or dependency changes. Four departures from the drawn dialog (S1–S4) are agent decisions under Dean's standing order, recorded in the [page specification](../design/development/pages/route-service-appointments-id.md#p4-customer-site-readiness-recording--30-october-2026) and the [field readiness gate note](../decisions/field-readiness-gate-proposal.md#implementation-note--30-october-2026-p4-recording-on-the-appointment-page). Local results and limits are in the [evidence](../testing/evidence/appointment-detail-native/README.md#p4-site-readiness-recording--30-october-2026): type check, lint, 11 unit cases and 16 browser cases passed; one database case fails here and on unmodified main for a renderer-version reason. CI, cross-model review, owner visual review and business acceptance remain separate. P5 display, Schedule-page and Sites (CS-06) recording remain open.
