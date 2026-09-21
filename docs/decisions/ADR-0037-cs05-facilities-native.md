# ADR-0037 — Native Facility details and service memberships

**Date:** 21 September 2026. **State:** Adopted for this authorised synthetic implementation; owner visual acceptance pending.

The r02 CS-05 contract extends canonical Facility identities without replacing the protected identity registry. Use the existing Next/React/TypeScript/PostgreSQL stack, shared transaction/authority/receipts, native shell and controls. No dependency or provider is added. A separate growing-area store, custom-field engine and browser-authoritative persistence would duplicate identity or weaken the adopted field/authority contracts, so they are rejected.

Use additive typed Facility columns, immutable Facility-owned reported sources and automatic before/after audit. Unconstrained numeric columns with finite/range/scale checks reject excess precision before storage rounding. Existing parent graph guards and workspace lock order remain. Asset service memberships have explicit add/end operations and retained source/history, versioning the Asset once without changing Facility content. Protected Asset site movement remains disabled.

The [handover](../delivery/facilities-growing-areas-handover.md) records CS05-D01–D05, migration reservation, API/UI reuse, receiving boundaries and actual evidence. Legacy reads/create and hash canonicalisation are unchanged. No production or business acceptance is inferred.
