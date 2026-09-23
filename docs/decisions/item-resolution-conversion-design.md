---
document_id: PPO-ES07-DES
title: One-off item resolution and conversion design and receiving handover
date: 2026-09-16
owner: Dean Fiedler
status: Authorised direction; detailed design proposed; native visual and application acceptance pending
source_commit: 8d821e9d764737ab41a753c6fb72342b399428a2
versioning: git
---

# ES-07 item resolution and conversion

Dean authorised the next existing module, ES-07, with the exact accepted quotation basis, item/catalogue resolution, company/entity mappings, conversion review and evidence-led recovery without duplicate orders. The requested deliverables are standalone HTML and a detailed Markdown companion under the existing r20 conformance discipline.

- [HTML r01](../reference/ui/quoting/PPO-One-Off-Item-Resolution-and-Conversion-r01.html)
- [Detailed report r01](../reference/ui/quoting/PPO-One-Off-Item-Resolution-and-Conversion-Report-r01.md)
- [Reproducible sources](../blueprints/item-conversion/README.md)
- [Verification and remaining acceptance](../testing/item-conversion-verification.md)

## Scope and conformance

| Field | Decision / proposed treatment |
|---|---|
| Identity | ES-07 in coverage register r06; related BP-04 EST-08/EST-09, IF-01/IF-02/IF-03; dependency ES-06 and AD-05 |
| r20 type | Form / guided workflow, supported by Review / comparison |
| Components | ES-05 r02 workspace title/context, cards, badges, controls, support column, action bar, centred decisions and docked snapshots; embedded r20 Roboto and shared palette |
| Input | Exact current accepted ES-06 issue, permitted selections, immutable amounts, response/hand-over evidence and complete source pack |
| Output | Owned incomplete-pack return or reviewed frozen plan plus original item/conversion operations and per-target evidence |
| Departures | Five-step ES-07 composition; explicitly hypothetical complete-pack attestation and target precision/tax capabilities for the default fixture; supported importer limited to retained Riverbend R02 |
| Baseline | Existing r03/r20/ES-05/ES-06 references and accepted UI register unchanged; detailed visual/owner acceptance pending |

The sequential page composition reflects a different task, using the same visual vocabulary. It adds no competing application masthead. Customer quotation r03 remains the external document/signing surface. ES-05 owns changed issue; ES-06 owns negotiation/response; ES-08 remains Screen Systems only. No parent requirement is added, replaced or declared accepted.

## Receiving contract

The builder generates a fictional acceptance through the retained ES-06 model and pins its source hash. The default complete scenario is labelled hypothetical: r03 supporting files remain unavailable. Actual ES-06 JSON imports are checked against exact issued bytes, source projection, valid acceptance/selections and owned prepared handover. Missing supporting documents stay blocked and cannot be overridden by a supplied JSON flag. Import establishes a reviewed local source candidate, not live upstream currentness or a production signature.

Resolution preserves accepted quantities and amounts. Existing-item binding, creation awaiting synchronisation, reactivation, unknown effect, confirmed-no-effect failure and clarification are separate states. Original item operations are distinct from order operations. Company changes invalidate mappings before effects and are held after known or uncertain effects. The valve-line precision example blocks a two-decimal destination rather than repricing the accepted quotation.

Receiver approval binds one exact version and payload hash; history survives invalidation. Operator preparation freezes one original conversion with per-target correlations. Unknown effects require lookup. Confirmed siblings remain intact; only evidenced no-effect siblings can retry, under the same operation. Supersession blocks new effects but permits original reconciliation. Compensation is not simulated as an automatic cleanup.

## Outgoing boundaries and required application work

The confirmed synthetic result contains the accepted source, exact reviewed payload, destination identity, original operation, target references and outcome evidence. ERP owns real target records. Separate receiving gates continue to govern project/work release, procurement and Finance. An exported return carries reason, owner and due date; it is not a sent communication or acknowledged upstream receipt.

Receiving implementation must verify MYOB entities, decimal/tax behaviour and provider recovery semantics; load current approved source and complete retained files; enforce real grants and company scope; persist original operations, outbox, receipts, correlations and concurrency; and establish evidence retention and controlled correction. No live endpoint or adapter is invented. This design changes no application source, database, service, deployment or accepted UI baseline.

Thirty-three generated model/UI command groups pass. Native browser/layout/accessibility/print review and owner acceptance remain pending. The source dependency is ES-05/06 draft PR [#212](https://github.com/deanrfiedler-gif/powerplants-one/pull/212), head `8d821e9d764737ab41a753c6fb72342b399428a2` at preparation. Publish ES-07 as a dependent draft PR against that branch, with only its explicit contribution list; integration into main is separate.
