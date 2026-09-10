# Dedicated Leads workspace

**Document ID:** PPO-009-LEADS-DEC · **Revision:** r02 · **Date:** 9 September 2026
**Status:** UI design approved; application implementation pending
**Owner:** Dean Fiedler · **Scope:** PPO-009 / CRM-01, CRM-02, CRM-03, CRM-08

Dean requested a dedicated list-only Leads page, with qualified leads progressing to Deals, then instructed “Proceed on that basis” for the list/detail design, one synthetic conversion journey and treatment of existing Enquiry-stage records.

This selects the separate inbox direction previously deferred in BP-03. Leads is a CRM workspace, not an additional business domain. Deals retains Board/List. Proposed routes are `/crm/leads` and `/crm/leads/:id`; existing `/crm/opportunities` remains the canonical Deals route. The internal Opportunity identity is not renamed.

Active lead statuses are New, Contacting and Nurturing. Disqualified and Converted are retained outcomes; archive is a separate visibility flag. Qualification and conversion are one deliberate action, avoiding a second stock of qualified leads awaiting an automatic move. A lead represents an enquiry or potential pursuit, not a person or company master record.

Conversion creates exactly one linked Opportunity, retains the source lead and its history, and removes it from the active Leads list. It preserves linked customer/contact/site identities, source, activity identities, ownership and restrictions. The first proposed synthetic conversion lands at Qualified with Open sales outcome in the existing two-stage definition. This needs a new atomic domain command and forward schema work; the existing create-then-qualify HTTP sequence is not an adequate implementation.

Existing Enquiry-stage opportunities remain unchanged, visible and editable through their accepted journey. No record is automatically reclassified or moved, and no immutable stage definition, original event, estimate or Activity link is rewritten. Review and any later deal-to-lead workflow are separate bounded work. The older six-column visual reference's Lead/Qualification columns are superseded as a future product direction by this separate inbox; operational deal-stage configuration remains unresolved. This design adds no six-stage definition.

Already-qualified enquiries may be entered directly as deals, with the same qualification and next-action checks in the future implementation. Operational thresholds, source import, live communications and deployment are outside this design. These choices do not close account parity or full AT-25.

The [design and implementation boundary](../blueprints/crm-leads-design.md) owns fields, interaction, conversion preservation, future verification and current handover. The [synthetic preview](../blueprints/crm-leads-preview.html) is in-memory only. This file records a product decision, not a claim of runtime delivery.

## Mobile refinement

Dean subsequently requested a Pipedrive-like mobile Leads presentation with a top-left back button and preservation of the existing individual lead detail. Revision r02 replaces the phone navigation shell with a compact Inbox toolbar, full-width list rows, optional search, sort/filter sheets and a floating add button. Desktop and detail layouts are retained. Leads has no bottom navigation; a proposed navy five-destination bar for a later Deals review is documented in the design. This request continues the synthetic design scope and does not authorise runtime implementation or deployment.

## Approved UI reference

Dean confirmed “I like that design. I think we can lock that in.” The accepted Leads UI is the preview at commit `6dd76b22c2cf8348f0b0ee45a158237e86d9816e`, HTML SHA-256 `e2111c3117a4f7d64cf3ca036cb0786f0df43009118a9ab2e089acb4430d6dea`. It includes the desktop and mobile Leads list, the preserved lead detail, navy add button with white plus, and Add Lead form with one scrolling field area and fixed heading/actions. Use these exact preview bytes as the implementation reference; further visual changes should be explicit refinements.

This records UI acceptance. The future Deals bottom navigation remains a proposal. Application implementation, runtime acceptance, merge and deployment are separate delivery steps. Existing focused verification is [run 34417450025](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34417450025); this approval record does not change the preview.
