---
document_id: PPO-ES06-DES
title: Quotation response and negotiation design and receiving handover
date: 2026-09-16
owner: Dean Fiedler
status: Authorised direction; detailed design proposed; visual acceptance and runtime integration pending
source_commit: 9921be2439ca479135482c51fbf3ed4b28615f37
versioning: git
---

# ES-06 quotation response and negotiation

Dean authorised ES-06 around the retained customer quotation r03 experience after correcting ES-05. This design extends the existing ES-06 scope from coverage register r06; it does not create a replacement quotation module or absorb ES-07 conversion.

- [Standalone HTML r01](../reference/ui/quoting/PPO-Quotation-Response-and-Negotiation-r01.html)
- [Detailed companion report r01](../reference/ui/quoting/PPO-Quotation-Response-and-Negotiation-Report-r01.md)
- [Reproducible source](../blueprints/quotation-lifecycle/README.md)
- [Verification and open review](../testing/quotation-lifecycle-verification.md)

| Conformance | Decision / proposal |
|---|---|
| Scope | ES-06 — exact issued revision, permitted options, clarification, acceptance, decline, expiry and revised offers without inherited acceptance |
| r20 page type | Document & evidence workspace; Record detail and Review / comparison staff views; Form / guided workflow decisions |
| Reuse | Exact r03 customer stylesheet/assets/content and signing layout; shared r20 workspace context, cards, tabs, support column, decision dialogs and docked snapshot |
| Input | ES-05 current immutable issue, customer projection and permitted access. The standalone fixture is r03’s supplied R02; missing estimate approval and attachments remain disclosed |
| Output | Material change request back to ES-05; confirmed exact response and owned prepared handover to ES-07 |
| Proposed extensions | Five staff views, full customer viewport, local persistence/recovery bridge and question/change-request action; no accepted baseline update |

The source r03 file is unchanged. Its data remains fictional and its three referenced attachment files remain unavailable. The new adapter hashes its own exact output bytes, retains original response identity, rejects invalid selections/amounts/identity/signature/consent, and holds unknown outcomes for evidenced reconciliation. Failed responses can retry only with the same operation and payload. New acceptance is held for expired, withdrawn, superseded or revision-required offers. Closing an issue retains old responses and holds its prepared handover.

Information-only answers require customer confirmation. A material change returns to ES-05 and cannot be silently resolved as unchanged. A response is neither work authority nor order conversion. ES-07 remains the next existing HTML scope; ES-08 stays Screen Systems only. No pricing formula or operational terms are adopted from the sample.

The implementation retains the existing standalone HTML/CSS/JavaScript technology and uses a stdlib Python assembler to share exact source styles/assets. This avoids maintaining a second customer design and avoids a new framework or runtime dependency. A live integration would use existing application authority and services; the iframe bridge is a synthetic demonstration boundary, not an identity system.

Twenty-four model/command/adapter groups pass, including execution of the actual generated customer script. Native visual/device/print and owner acceptance remain pending; see the linked verification for the browser-policy limit. This contribution changes no application source, database, service, hosted environment or accepted UI baseline.

Receiving application work must establish authenticated customer access, complete approved terms/files, exact source and issue loading, server time/expiry, durable response operations/receipts, concurrency, signature/consent policy, document retention and ES-07 conversion authority. The separate HTML fixtures do not synchronise records automatically.
