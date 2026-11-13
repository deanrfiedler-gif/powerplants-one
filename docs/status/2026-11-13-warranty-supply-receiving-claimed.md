---
title: Warranty to Supply return receiving claimed
date: 2026-11-13
---

[CLAIMED by Codex] Dean instructed proceeding with the next backend work. This contribution owns the MA-07 to SC-08 return receiving bridge on `codex/warranty-supply-receiving`, based on main `e41f806a6`. The Finance contributions #905 and #932 retain their existing owners.

The bounded increment will prepare a native Supply return from exact Warranty claim and authorised return evidence, retain its source identity, and project permission-scoped receipt and disposition progress back to Warranty. Supply remains the physical receiving authority; customer resolution and Finance credit remain independent. Expected changes are in `src/maintenance/`, the narrow native Supply revision guard, the Warranty API route, focused database/HTTP tests, and the existing Maintenance/Warranty contract and delivery chapter. No UI, external adapter, new capability or operational transaction is proposed. Existing immutable events and native transaction helpers are the intended persistence mechanism; a migration would be separately reserved if inspection establishes it is necessary.

Implementation, verification and independent Claude review are pending. Nothing is merged or deployed.
