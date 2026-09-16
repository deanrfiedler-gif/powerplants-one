---
document_id: PPO-ES05-DES
title: Quotation approval issue and distribution design and handover
revision: r02
date: 2026-09-16
owner: Dean Fiedler
status: Proposed design under authorised module creation; visual acceptance and runtime integration pending
source_commit: 9921be2439ca479135482c51fbf3ed4b28615f37
---

# ES-05 quotation release workspace

Dean requested the Quotation approval, issue and distribution module, aligned with the supplied Powerplants One r20 theme board, plus a professional detailed Markdown companion. This authorises the reviewable design contribution and GitHub PR; it does not adopt unresolved operational approval policies or authorise actual customer distribution.

- [Standalone HTML r02](../reference/ui/quoting/PPO-Quotation-Approval-Issue-and-Distribution-r02.html)
- [Detailed feature and design report r02](../reference/ui/quoting/PPO-Quotation-Approval-Issue-and-Distribution-Report-r02.md)
- [Verification and remaining review](../testing/quotation-lifecycle-verification.md)

Six connected views cover overview, source/output, quotation approval, issue register, distribution evidence and revision history. All records and actions are fictional. Approval binds the exact output fingerprint; issue preserves exact HTML bytes; source changes require explicit review; successor revisions inherit no approval or recipient response. Unknown delivery outcomes are reconciled before retry. Acknowledgement is receipt evidence only.

Dean then authorised correction of ES-05’s presentation before ES-06: remove the competing app masthead, use docked basis inspection and retain quotation r03 as the customer presentation. r02 implements that correction while preserving r01 and all earlier issued references.

| Conformance | ES-05 r02 |
|---|---|
| Existing scope | ES-05 — approved source, exact scope/terms/template, preview, quotation approval, issue register, distribution evidence and superseded revisions |
| r20 page type | Review / comparison, supported by Register / worklist and Document & evidence workspace |
| Reused components | Workspace-only title/context, tabs, cards/register, 292 px supporting column, 448 px right-side snapshot, native decision dialogs and r03 customer document CSS/assets |
| Incoming boundary | Approved source estimate; exact selected scope, terms and template; estimate review remains separate |
| Outgoing boundary | Exact immutable issue/revision/hash and recipient evidence to ES-06; no acceptance created here |
| Declared choices | Bounded customer iframe retains independent scrolling; source-specific ES-05 content does not invent r03’s payment/tax/terms data. Detailed proposals remain subject to visual/owner review |

The [HTML conformance standard](../standards/html-module-conformance.md) records Dean’s required discipline for later packages. No accepted application baseline is changed by this design correction. The complete r20 and quotation r03 reference bytes remain unchanged. The issued coverage register is retained; current index/status pointers identify the new proposed package.

BP-04 EST-03/07/08 and OUT-06 supply traceability. The E1 exact Draft contract is unchanged. The E3 decision pack still requires operational authority, self-review, commercial policy and approved terms. Synthetic Preparer/Reviewer/Issuer roles illustrate separation only. No application source, database, dependency, adapter or deployment configuration is changed.

Twenty-four ES-05 r02 command/state groups pass. They retain the original release controls and check separate docked inspection and r03 component use. Native visual review is pending because the available browser rejected local preview access. The verification note distinguishes these results from business acceptance and runtime integration.

ES-06 now has its own [response and negotiation design](quotation-response-negotiation-design.md), extending the retained r03 experience. The two standalone files use labelled independent fixtures; automatic issue loading and response handover remain receiving contracts. ES-07 owns conversion. Owner acceptance and merge remain separate from delivery of these reviewable designs.
