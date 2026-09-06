# PPO-010 — Estimating discovery and sequencing

**Date:** 6 September 2026 · **Owner:** Dean Fiedler · **Status:** User-authorised discovery; implementation proposals unaccepted · **Related:** EST-01–EST-09, D-009/D-010, issue #10.

Dean instructed: “start PPO-010/BP-04 discovery and design.” This authorises the bounded source assessment, blueprint, synthetic screen walkthrough, acceptance plan and reviewable repository handover. It does not implement estimating or authorise operational CREMS replacement, live prices, MYOB transactions, customer messages, migration, hosting or paid services.

The [BP-04 package](../blueprints/BP-04-estimating-quotation.md) is a parallel domain design. P01–P12 service dependencies remain unchanged; the master still places EST implementation in Wave B. [E1–E6](../delivery/estimating-implementation-plan.md) are local BP-04 labels only. Bringing E1 forward needs an explicit recorded bounded implementation/sequencing decision; preparing its starter does not make that decision.

The design reuses the selected TypeScript/Next.js/PostgreSQL modular monolith, shared identity/permission/Activity/receipt/outbox and document patterns. No architecture replacement, migration number or new ADR sequence slot is allocated. Initial main `17f1505e` was refreshed after actual CRM I1 merge to `c3ac9b2a`; the design recognises the delivered Opportunity/Activity target without expanding CRM I1's Open/Enquiry/Qualified/no-money boundary.

DG source behaviour is assessed against the original guide. Proposed improvements are explicit: durable drafts, visible deliberate repricing, clearer staged totals, protected rerun edits and richer content-bound response exceptions. None is passed off as existing CREMS functionality. D-009/D-010 remain open. No numeric commercial threshold, Screen Systems formula, live endpoint, approved quotation terms or departmental delegation is invented.

Repository publication proves a discoverable design contribution, not completed business acceptance. Issue #10 must stay open until its source/configuration validation and accepted fixture/output obligations are actually met. The [handover](../delivery/estimating-discovery-handover.md) owns this contribution's validation/publication record. Existing baseline requirements, issued source bytes and AT status remain unchanged.

Dean subsequently approved the package in direct response to the request for permission to upload the CREMS-derived design to this private repository and open a review PR. This authorises that publication. It does not invoke E1, accept missing source rules or authorise a merge by implication.
