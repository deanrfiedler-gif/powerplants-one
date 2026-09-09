# Dedicated Leads workspace

**Document ID:** PPO-009-LEADS-DEC · **Revision:** r01 · **Date:** 9 September 2026  
**Status:** User-directed design; application implementation pending  
**Owner:** Dean Fiedler · **Scope:** PPO-009 / CRM-01, CRM-02, CRM-03, CRM-08

Dean requested a dedicated list-only Leads page, with qualified leads progressing to Deals, then instructed “Proceed on that basis” for the list/detail design, one synthetic conversion journey and treatment of existing Enquiry-stage records.

This selects the separate inbox direction previously deferred in BP-03. Leads is a CRM workspace, not an additional business domain. Deals retains Board/List. Proposed routes are `/crm/leads` and `/crm/leads/:id`; existing `/crm/opportunities` remains the canonical Deals route. The internal Opportunity identity is not renamed.

Active lead statuses are New, Contacting and Nurturing. Disqualified and Converted are retained outcomes; archive is a separate visibility flag. Qualification and conversion are one deliberate action, avoiding a second stock of qualified leads awaiting an automatic move. A lead represents an enquiry or potential pursuit, not a person or company master record.

Conversion creates exactly one linked Opportunity, retains the source lead and its history, and removes it from the active Leads list. It preserves linked customer/contact/site identities, source, activity identities, ownership and restrictions. The first proposed synthetic conversion lands at Qualified with Open sales outcome in the existing two-stage definition. This needs a new atomic domain command and forward schema work; the existing create-then-qualify HTTP sequence is not an adequate implementation.

Existing Enquiry-stage opportunities remain unchanged, visible and editable through their accepted journey. No record is automatically reclassified or moved, and no immutable stage definition, original event, estimate or Activity link is rewritten. Review and any later deal-to-lead workflow are separate bounded work. The older six-column visual reference's Lead/Qualification columns are superseded as a future product direction by this separate inbox; operational deal-stage configuration remains unresolved. This design adds no six-stage definition.

Already-qualified enquiries may be entered directly as deals, with the same qualification and next-action checks in the future implementation. Operational thresholds, source import, live communications and deployment are outside this design. These choices do not close account parity or full AT-25.

The [design and implementation boundary](../blueprints/crm-leads-design.md) owns fields, interaction, conversion preservation, future verification and current handover. The [synthetic preview](../blueprints/crm-leads-preview.html) is in-memory only. This file records a product decision, not a claim of runtime delivery.
