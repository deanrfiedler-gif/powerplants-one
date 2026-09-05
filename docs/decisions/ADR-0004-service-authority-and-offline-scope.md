# ADR-0004 — Synthetic service authority and bounded offline scope

**Status:** Prototype simulation/design assumption; operational ownership unresolved. **Date:** 5 September 2026. **Related:** D-004/D-007/D-011/D-015/D-016/D-017/D-020.

## Decision

For PP-01 only, the platform owns synthetic tickets, authorised scope, appointments and field evidence. ERP accounts/transactions and SharePoint documents use explicitly synthetic adapters. Finance uses a simulated manual handoff with reviewed line allocation, returned target evidence and reconciliation. No live ERP master or transaction is changed.

Offline scope is assigned pack/history reading and durable field/acknowledgement/attendance intents. Booking, scope approval, pack/report issue, Finance processing and current-source refresh stay online. A cached field action is provisional until server validation. Preserve original input and source context when an assignment, permission, record or payload version changes.

Use two cached jobs and a simulated 24-hour expiry as deterministic test parameters. They do not establish actual technician offline requirements or retention. No automatic deletion of unsent evidence on expiry/logout/update. Revoked normal access does not grant a general upload API; use the narrowly scoped recovery capability defined in BP-02 or approved local recovery.

## Rationale

This model makes the user's service problems reviewable without inventing MYOB endpoints or waiting for every corporate decision. It also tests source/authority boundaries that the operational design must preserve. A synthetic success never proves live device, identity, ERP or document capability.

## Operational alternatives and consequences

Before a pilot, evaluate ERP-owned service records with platform extensions versus platform-owned operations with ERP financial consequences. Select one writable authority per field family/phase, map existing records and define in-flight transition. Live customer/site/asset ownership, billing definitions, device/cache/security controls and delegated exceptions require their specified evidence.

The original master decisions remain open unless their actual closure evidence is obtained. No Pipedrive/Smartsheet cutover, recurring-maintenance engine, source migration or customer communication is authorised by this design assumption.
