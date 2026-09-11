# Approved CRM feature scope — report r02

**Revision:** r01 · **Decision date:** 10 September 2026 · **Status:** Accepted product scope and planning priorities · **Owner:** Dean Fiedler · **Workstream:** PPO-009 / [issue #9](https://github.com/deanrfiedler-gif/powerplants-one/issues/9).

## Authority and source

Dean accepted *Powerplants One CRM Feature Report r02* and instructed: “I'm happy with that. Can we lock that into the CRM blueprint and Github?” This adopts the report's PPO scope, recommended behaviour and delivery priorities as the current CRM design baseline.

The [complete r02 text](../reference/crm-feature-report-r02.md) preserves the report's authoring source, all sixteen feature sections and their official Pipedrive citations. The supplied approved Word file is `Powerplants-One-CRM-Feature-Report-r02.docx`, SHA-256 `a37a19ceb56797783d2e4170850dcd98eccd427e243c6b9b7fa319b2663bc5fa`. Its content matched the previously generated r02 file. The issued report's original “recommended” and “proposal” wording is retained; this decision records subsequent acceptance. Vendor descriptions remain reference evidence, not requirements to replicate every Pipedrive feature or evidence of this account's configuration.

Dean subsequently explicitly authorised publishing the approved report, blueprint and supporting documentation to the public `deanrfiedler-gif/powerplants-one` repository. This authority covers this documentation package.

## Adopted scope

[BP-03 section 0](../blueprints/BP-03-crm.md#0-approved-crm-scope--report-r02) is the maintained feature-to-requirement mapping. CRM-01–CRM-08 and PAR-01–PAR-18 retain their existing identities.

Essential: shared customer context, manually entered leads and qualification, owned opportunities and pipeline, activities and handovers, consistent desktop/mobile behaviour, permissions and history. Next: reliable reporting and module links, individual email and calendar integrations. Later: selected automation, scoring and human-reviewed AI assistance.

Four areas are deferred at this stage:

1. Lead capture and prospecting: website forms/chatbots/live chat, prospect databases, visitor identification and external enrichment. Manual lead entry and conversion remain included.
2. Proposals and electronic signatures: generating customer proposals and collecting signatures in CRM. Estimate links, status, exact revisions and commercial context remain included; BP-04 Estimating & Quotation retains its own scope.
3. Marketing: campaigns, bulk marketing and marketing subscription management. Individual correspondence, ordinary CRM classification and relationship follow-up remain included.
4. Subscription limits: Pipedrive plan comparisons and vendor capacity/entitlement tables are outside the PPO feature scope. This does not remove access controls, data integrity or performance requirements.

These are current-stage deferrals, not permanent retirement of operational tools or permission to discard their records. Reintroducing a deferred capability requires an explicit subsequent scope decision, recorded here and in BP-03 with its delivery impact.

## Delivery and unresolved details

Use the [updated implementation sequence](../delivery/crm-implementation-plan.md#approved-r02-priorities-for-remaining-work) to compare accepted behaviour with actual main before selecting the next bounded build. Acceptance of scope does not mean the features are implemented or tested. Existing I1/I2 and mobile/UI handovers remain the source of delivery evidence.

The report's open design choices remain open: operational stage/qualification rules, exact fields, access/transfer policy, forecast definitions, initial provider/sync direction and receiving-module contracts. In particular, #55 H-01–H-03 are not resolved by general support for ownership handover. D-013/D-025/D-026 retain their operational evidence and transition work; this decision settles current product scope without claiming account parity, migration acceptance or AT-25 completion.

This publication changes documentation. It does not invoke application implementation, live integrations, sending, import, cutover or paid services. Original issued baselines and the 78 parent requirements remain unchanged. No technology ADR is allocated.
