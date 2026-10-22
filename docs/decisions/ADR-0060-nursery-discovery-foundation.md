# ADR-0060: Nursery Automation discovery foundation

<!-- versioning: git; committed history is authoritative -->

Status: implementation choice for the user-authorised N1 increment; business and equipment review pending.
Date: 22 October 2026. Owner: Dean Fiedler. Builder: Codex.

## Context

[N1](../blueprints/nursery-automation-configurator.md#11-delivery-and-acceptance) captures curated equipment data, discovery and production scenarios with save/reopen and explicit unknown/conflicting evidence. The user selected Javo Standard 2.0 and Plus. The updated estimating plan adopts O1–O15 and DP1–DP8; its shared Products profiles and paired CPQ receiver are not implemented on main 002af00e. EST-02, EST-03 and EST-06 retain their identities.

## Decision

Use the existing TypeScript application, PostgreSQL, estimating workspace/alternative/source authority, shared command receipts and reusable form controls. Add a dedicated bounded Nursery discovery aggregate and immutable revisions, under existing estimating.read/edit permissions. Capture evidence, scenarios and candidate selections without a suitability or pricing engine. Reuse the source's exact company, option, site and revision; incomplete saved Discovery and Express remain visibly incomplete. Save does not make Discovery Complete.

Keep a versioned source-qualified starter equipment catalogue separate from Products publication. The two Javo entries have no approved numeric limits or invented Variant mapping. Synthetic examples are not manufacturer ratings. N1 does not publish Products or send parts, labour, facts or documents to CPQ. Future N3 must pair exact parts and delivery facts through the shared receiver and activity ledger; no parallel labour calculator is introduced.

## Options considered

- Dedicated PostgreSQL revisions: small additive schema, explicit history/concurrency/recovery and shared authority. Chosen.
- Extend the historical ten-question Discovery answer format: less schema, but breaks its frozen definition and mixes specialist scenarios into unrelated answers. Rejected.
- Browser-only storage or workbook upload: quick demonstration, but cannot prove authorised save/reopen and makes the workbook a prerequisite. Rejected.

## Consequences and validation

Migration 0116 is reserved before implementation. No new grant, capability, framework or dependency. New tables require populated-upgrade, immutable history, original-operation recovery, stale source/target, cross-company/read-only and save/reopen tests. Native page and shared-component bindings require register and desktop/phone evidence. Supplier limits, product/profile bindings, N2 calculations and N3/N4 receiving/quotation remain separate dependencies.

Different-model review is required before merge for the migration and access-sensitive service. This implementation request does not claim that review or authorise production deployment.
