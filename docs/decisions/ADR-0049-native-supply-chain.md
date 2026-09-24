# ADR-0049 — Native Supply Chain coordination

<!-- versioning: git; committed history is authoritative -->

Date: 25 September 2026. Owner: Dean Fiedler. Status: implementation decision under the user's SC-01–SC-10 instruction; business policy and visual acceptance pending.

## Context and baseline

Current main is `0f10b7fb46a8ab512e9b019573ece272cf5920b9`, tree `a5b0624f19205909e67b83b437bc1edb79510f3a`. GitHub was fetched before editing. Open PR #314 concerns ES-02 and shares STATUS, the document register and design register only. Recent native Customer, Equipment, Sales, Engineering and Scheduling changes are part of this baseline. Issue #13 remains open. BP-08 and native Supply Chain routes were absent; 0048 was the latest migration. The unrelated uncommitted Field/Quality work remains in the original checkout. This work uses the isolated `feature/supply-chain-native` worktree.

## Decision

Reuse TypeScript/Next.js/PostgreSQL and the existing modular monolith, shell, scoped permissions, UUID identities, shared operation receipts/audit/outbox, Activities and document store. No new dependency, framework, ledger or external integration. Use a closed set of typed Supply Chain aggregates (demand, supply line, return and service custody), immutable revisions and typed observations. Explicit foreign keys connect allocations and parent scope; exact six-place decimal quantities are a synthetic implementation limit, not an ERP unit policy. Like-unit comparisons only.

The existing workspace transaction lock serialises consequential coordination changes. It protects cross-line conservation and predecessor corrections along with optimistic aggregate versions. This small synthetic prototype accepts workspace-level serialisation; fine-grained locks are a later measured optimisation. Every operation authorises current company, Site and linked source context before receipt recovery. Restricted credit observations require Finance authority before querying their content or counts.

Stock observations are dated evidence, never a PPO inventory balance. Source reservations and ERP purchase/receipt/shipment/return/credit commands remain **Not configured**. Manual and synthetic source outcomes retain qualified provider/configuration/company/entity/key, completeness, original operation and evidence time. Unknown outcomes block equivalent commands until an evidenced reconciliation of the original operation.

Native coordination follows the current receiving contracts and r20 register/detail/review patterns. Historical HTML supplies design reference only where acceptance is not recorded. SC-10 receives a new native design contract, with no claim of an earlier image. SC-08's incomplete authoring package and mismatched historical hashes remain documented unchanged.

## Alternatives and limits

Ten independent fixtures would duplicate authority and fail conservation. A second inventory or Finance ledger would conflict with MYOB's intended ownership. A generic unrestricted JSON editor would not provide usable workflows or typed validation. A live ERP adapter cannot be implemented without verified mappings and transaction authority. No observation-age threshold, unit conversion, departmental authority or financial loss definition is invented.

Required evidence is unit, database, HTTP and browser verification of the actual native implementation, with scoped/revoked access, replay, concurrent quantities, corrections, downstream unchanged records and mobile capture. Code delivery, visual review, owner acceptance, deployment and production readiness remain separate.

Sources: [readiness contract](../contracts/supply-chain-readiness.md), [fulfilment contract](../contracts/order-fulfilment-integration.md), [BP-01](../blueprints/BP-01-master-blueprint.md), SCM-01–SCM-08, SVC-09, IF-11–IF-16, D-005/D-006/D-017, AT-16/AT-29/AT-31.
