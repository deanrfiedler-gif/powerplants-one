---
title: Service request integration repairs
date: 2026-10-21
---

PR #636 is reconciled with main's Discovery migration 0113 while preserving reserved Service migration 0112, both sets of component consumers, and all status fragments. The upgrade proofs retain exact prior ledgers and account for both migrations; the Service upgrade also covers installing 0112 after 0113 is already present. No new migration, capability, seed or dependency is introduced by this repair.

The failed checks at `fc2385ac` identified old form-label and queue assertions, missing route-specific host contracts, and a real save-bar overflow that allowed the duplicate panel to intercept Create. The repair updates the existing keyboard and handover journeys, adds queue/list count proof, maps each Service route to its retained accepted source, and wraps the save actions within their pane. The [evidence ledger](../testing/evidence/service-requests-accepted/README.md) records executed checks and CI separately. Owner visual review and deployment remain pending; the remaining ADR-0043 scope stays excluded.
