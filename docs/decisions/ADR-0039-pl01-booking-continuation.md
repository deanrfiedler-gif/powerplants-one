---
document_id: PPO-ADR-0039
revision: r01
date: 2026-09-23
owner: Dean Fiedler
status: Implemented on an isolated branch under the user's PL-01 instruction; panel design review and owner acceptance separate
source_commit: 2189d0f7992448b11da8e0b99e1c0fd6402ba79d
---

# ADR-0039 — PL-01 proposal continuation and same-tab recovery

The authorised increment connects SC-07 demand to SC-08 booking through API-R03/R04/R09 and API-C04, preserving TR-03/TR-08, SR-05/06/07/19/20 and the existing PT-08/09/10/26 boundaries. The [handover](../delivery/pl01-demand-to-booking-handover.md) records executed evidence separately from owner acceptance.

Use the existing React/Next application, proposal/readiness/contact/confirmation commands and server booking guard. No new dependency, framework, migration or service is needed. Keep the general service proposal's intentional multi-visit support. The guided form requires current authorised scope, no non-cancelled appointment, and explicit Preparing. A version conflict requires review; it never adopts a new expected version silently.

Use an opt-in bounded sessionStorage journal for the four saved steps. Existing useCommand holds originals only while mounted; replacing every use would enlarge this change. An offline queue or persistent cross-device storage would introduce unrelated replay and identity policy. sessionStorage fits reload in the same tab, with explicit unchanged retry and no background send. Storage failure prevents a recoverable send. A pending original retains its exact path, immutable JSON body, expected record identity, actor/workspace and safe destination. After acceptance only receipt lookup/continuation metadata remains. Reload always resolves session first and checks the original server receipt; missing or denied receipts never establish non-execution. Sign-out and identity locks clear this online journal in all open views, following the existing display-clearing policy. Closing the tab loses this recovery copy, not accepted server records.

Move the touched planner component into scheduling's client component folder and update its consumers. Extract the existing scope view for reuse without moving the Service domain. Public UI surfaces contain no server imports. Retain existing server domain edges and typed capability literals. New recovery helpers are generic shared code; scheduling owns the path/destination policy.

PL-01 remains a Planning workspace with a supporting Record detail / Form workflow. Reuse the PPO shell, business-ui fields/read/error states, existing ScopeView, appointment crew/contact controls, readiness form and IANA conversion helpers. Incoming authority is current permitted work-order/scope/version/site context; outgoing authority is an accepted proposal identity followed by independent saved assessment/contact/confirmation. A right-side native dialog has a scrolling body and phone-width layout. This continues the recorded application-first PL-01 departure; its panel composition is proposed for review, not an invented accepted planner baseline. The existing globals.css owns legacy planner rules; a scoped planner-demand.css owns the added panel, avoiding unrelated cascade changes. No design-baseline hashes change.

This lifts the "scheduling from demand" exclusion recorded in [PPO-PL01-DEC r02](pl01-unassigned-demand.md); that record's read contribution and its open follow-up question are unchanged.

The increment began on 2026-09-19 from main `8b33b4e` in an uncommitted worktree. That work was preserved as local commit `7cf1354` on 2026-09-22 and resumed on 2026-09-23 as `feature/pl01-booking-from-demand` from main `2189d0f`, after #279 released the single repository write. First drafted as ADR-0029; renumbered because ADR-0029 is the hosted pack reviewer profile on main.

Early migration definitions are not the live schema. At 0027 the isolated PostgreSQL 16.15 catalogue was observed; on 2026-09-23 a disposable database migrated through 0042 (0016 is hosted-only) showed the six appointment states, the `guard_dispatch` trigger, a deferrable `booking_consistency` trigger, appointment revision capture with a `no_delete` guard, and the active-reservation exclusion on `ppo.resource_reservations`. Migration 0041 made an asset's site `NOT NULL` and permanent; the one fixture that depended on moving an asset's site was removed, and the [handover](../delivery/pl01-demand-to-booking-handover.md) records why.
