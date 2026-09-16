---
document_id: PPO-SUPPLIER-PRICING-DEC
title: Supplier Pricing and Cost Sources design and receiving handover
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Authorised standalone design; owner acceptance and application integration separate
source_commit: d565a9de01b94aa7ad3fffe3a996f78c3aee589b
---

# Supplier Pricing & Cost Sources design

Dean authorised the five-view PD-03 / ES-03 HTML workspace and detailed companion report after the supplier-pricing recommendation. The contribution is a standalone synthetic design, scoped to source maintenance/review, exact cost provenance and deliberate draft successors. It does not implement live pricing, catalogue publication or commercial approval.

## Architecture decision

Reuse the repository's standalone HTML/JavaScript/CSS pattern with embedded Roboto, a small deterministic builder and the existing pinned native-browser verification runtime. This produces one offline review artifact and makes domain transitions independently testable. A new framework or Next.js route would add application scope and dependencies without improving this design deliverable; a static image would not demonstrate the source and estimate preservation controls. No new runtime service, migration or dependency is introduced.

Authoritative costing requires decimal arithmetic. This synthetic model uses scaled BigInt inputs and exact half-up rounding of extended line cents to make its declared convention reproducible. It does not adopt D-009, operational FX/tax/landed-cost policy or production money representation.

## Source and identity

Read current AGENTS, README, STATUS, BP-04 section 7, the estimating screen specification, naming guidance, Products r04 and theme r20. The coverage register's PD-03 and ES-03 identifiers are page IDs, distinct from older ES screen numbering. Preserve all 78 parent IDs and existing issued references. Local `SYN-…` labels are demonstration references, not new governed record type codes.

Main baseline: `d565a9de01b94aa7ad3fffe3a996f78c3aee589b`; tree `2c84890de6ab80ac397fbd2bc57736ce7d3a51c6`. Related ES-10 remains a separate contribution in PR #221, not inherited as merged authority.

## Invariants

- Retain supplier currency, unit, tiers, company/product mappings, validity, rate evidence and source identity.
- Source review is separate from estimate cost review, pricing approval, catalogue publication and ERP updates.
- Draft source edits stop at submission; decisions require an independent reviewer and a rationale.
- Missing or expired evidence remains visible; an unknown amount is never normalised to zero.
- Use supplier-unit quantity thresholds; preserve explicit conversions and refuse partial complete-pack quantities.
- Freight appears once as a standalone line; unconfirmed import assumptions remain unresolved.
- Refresh selected eligible costs into a separate draft, retaining exact snapshots and all original estimate/quotation bytes in the model.
- No inherited approval. Stale preview evidence and repeated identical refreshes are refused.
- Failed saves retain form contents; concurrent changes and malformed storage pause writes.

## Deliverables and receiving boundaries

[Interactive HTML](../reference/ui/supplier-pricing/PPO-Supplier-Pricing-and-Cost-Sources-r01.html), [detailed report](../reference/ui/supplier-pricing/PPO-Supplier-Pricing-and-Cost-Sources-Report-r01.md), [source](../design/supplier-pricing/README.md) and [verification record](../testing/evidence/supplier-pricing-r01/README.md).

MYOB retains intended ERP authority and SharePoint intended document authority. Read-only source provenance alongside an existing estimate is the recommended first runtime increment, after permission-scoped source/mapping contracts exist. Durable source commands and estimate successors need server permissions, atomic version checks, idempotency/receipts, exact document evidence and agreed cost policies. ES-04 remains the next commercial-review boundary.

Owner visual acceptance, screen-reader/device review, full operational acceptance, integration, deployment and merge are separate from this design contribution. No source thresholds or review authority are adopted by fixture data. Recovery is to revert this isolated design package; there is no database migration or external write to reverse.

## Main-branch reconciliation

Main advanced during verification to `e1b705acc5457dab6fc0b6a2f0c977132cbd2215` through PR #214. The shared HTML index, STATUS and document register were reconciled from that exact main, preserving all incoming module entries and adding only this contribution. The merge uses current main as its base tree and retains both commit histories. Module HTML/source remains the focus-corrected version; no unrelated main files are replaced.
