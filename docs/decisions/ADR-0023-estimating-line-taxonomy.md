---
document_id: PPO-ADR-0023
revision: r01
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Selected implementation design under adopted DR-01; verification pending
source_commit: 233dd66ccdf2a576c0e36f2cddd374504b337fb0
---

# ADR-0023 — Versioned manual line categories and explicit Allowance

## Authority and scope

The [audit package](audit-follow-through-policy-package.md) adopts DR-01: Product/Labour/Freight plus Engineering/Subcontract, with Allowance as a separate explicit line flag. Dean authorised continued repository implementation. The [E1 receiving extension](../contracts/estimating-e1.md) is reconciled in #162. This ADR selects a preservation strategy, not a new costing or routing policy. DR-02 equipment and E2 options/questions follow separately. Numeric routing, the five container propositions, FX/discount/review/terms, E3–E6 and operational integrations are outside this increment.

Current allocations were inspected: migration 0024 is reserved by controlled CRM transfer #161; 0016 remains reserved. The independent runtime-maintenance PR #163 published ADR-0022 while this work was local. This decision was moved from its unissued local allocation to **ADR-0023** before publication; 0019 remains unused. This increment allocates additive migration **0025** and ADR-0023. It depends on the verified outcomes/transfer source and the reconciled estimating contract; no unverified dependency is claimed complete.

## Decision

Keep the current stack, arithmetic, fixed Estimate owner, option A, scopes and quote source contracts. Accept command schema 2 only for CreateEstimate/SaveEstimate, with five categories and a required Boolean `allowance` on every line. Schema 1 retains its exact parser whitelist, defaults, canonical command shape, three categories and original receipts. Shared non-estimating command schemas and PrepareDraftQuote remain unchanged. The receipt, audit and outbox record envelopes remain version 1 because their structures do not change; the canonical command hash binds the new input schema and flags.

Add immutable `estimate_versions.cost_schema_version`, constrained to 1 or 2, default 1. Existing rows receive only this explicit historical format discriminator; their line/scope JSON, hashes, owners, versions, reasons and stored outputs remain unchanged. Existing schema-1 detail DTOs omit the new discriminator to preserve their original shape. Schema-2 detail includes it. Database line checks admit the five categories only under format 2, require a Boolean flag there, and reject that field/new categories under format 1. Existing decimal, predecessor, identity, graph and immutability checks remain.

A new schema-2 version's content hash includes `cost_schema_version: 2` alongside the original title/scope/lines/policy basis. Schema-1 content hashes retain the exact original shape. Command parsing dispatches before hashing; no default flag or new discriminator is added to an old operation before receipt comparison. Writing a schema-1 version continues to work against older accepted E1 schemas in the upgrade fixtures; only schema-2 writes require migration 0025.

The UI distinguishes old unrecorded allowance evidence from an explicit false choice. Reading an old line does not mark it No. A deliberate new-version adoption exposes the expanded categories and explicit allowance choices, preserving the viewed predecessor. A flag is internal estimating evidence; quote include/print and its grouped “Included scope allowance” remain independent. Quote-safe DTOs and exact historical HTML/PDF do not gain category/allowance or other internal metadata. New categories/flags do not calculate a delivery route or change arithmetic.

## Alternatives and trade-offs

- Extending schema 1 with a default false flag would alter canonical payload/content shapes and manufacture historical evidence; rejected.
- Inferring Allowance from a hidden, zero or incomplete line confuses independent facts; rejected.
- A separate companion table avoids an additive discriminator on old rows but complicates every version read and requires deferred format association for the existing arithmetic trigger. One explicit immutable column gives a directly constrained format while preserving old JSON and API shapes.
- A new generic policy/rules engine adds unnecessary scope; retain the two bounded parsers and existing exact arithmetic.

## Required verification and publication

Prove schema-1 exact canonical hashes/replays, schema-2 strict flags/categories and unchanged decimal totals; concurrent saves, changed same-key content, denied actor/related target and rollback; direct SQL format/immutability challenges; migration-24 E1 original records, ledger, revoked grants and exact rendered bytes through forward upgrade and repeat seed. Preserve all raw old fields and explicitly compare the new discriminator as 1, rather than discarding unrelated differences.

Extend the existing E1 HTTP/browser/restart gates with meaningful new-version adoption and exact original quote recovery. Inspect desktop/phone/320px controls and original outputs. Reconcile all migration registry consumers and review the hosted-upgrade gate without executing a hosted upgrade. Retain all applicable existing checks and report source/checkout/tree/run/attempt, counts, failure dispositions and actual merged-main verification. Code delivery is separate from operational acceptance; no reset of accepted prototype data is an upgrade proof.
