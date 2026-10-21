---
title: Appointment detail SV-04 native shared record
date: 2026-10-21
---

The accepted Appointment detail design is implemented for review on the existing `/service/appointments/[id]` route: shared record layout, derived Parts/dispatch checks, current pack acknowledgements and returns, contact rows, follow-ups and controlled booking forms. P4 site readiness and P5 lead time remain visibly gated. No new migration, capability, dependency or integration is added. The [page contract](../design/development/pages/route-service-appointments-id.md), scope contract, guides and shared-component bindings accompany the code.

[Synthetic verification and deviations](../testing/evidence/appointment-detail-native/README.md) distinguish code proof from the accepted Figma source. R2 historical cause/task context and undrawn Parts controls remain open. Owner visual review is pending; no deployment or business acceptance is claimed.
