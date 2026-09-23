---
document_id: PPO-HELP-CRM
guide_key: crm.deals.worklist
title: CRM Deals - Page Guide
date: 2026-09-13
status: InReview - source-checked pilot; application walkthrough not run
owner: Dean Fiedler - personal prototype owner
reviewer: Business reviewer not yet nominated
source_commit: 1cc882e53020bdfb22f7e9192365d90b1d8282ab
workflow_basis: Two-stage Enquiry and Qualified synthetic opportunity workflow
audience: Internal prototype users; synthetic examples only
route_patterns: /crm/opportunities; /crm/opportunities/new; /crm/opportunities/:id
resource_ids: None - no approved SOP supplied or connected
versioning: git
---

<!-- USER GUIDE START -->

# CRM Deals — Page guide

**Draft guide for review** · Prepared 13 September 2026 · Applies to the synthetic version showing **Enquiry** and **Qualified**. If your board shows different stages, use guidance matched to that version. This article has been checked against the source; a user walkthrough is still required.

## Purpose and outcome

Use Deals to find and maintain a sales opportunity, understand the customer's requirement, review progress and keep an accountable next action. “Deal” and “opportunity” refer to the same record in this guide; some controls use “opportunity”.

A useful deal record identifies the organisation, explains the need, records known customer context and has an owned next activity or a visible need to plan one. Saving or qualifying a deal does not issue a quotation, win an order, book work or transfer responsibility to Estimating.

## Before you start

- Work in the intended prototype identity and company context. The worklist shows only records your identity can access.
- Find the existing organisation, contact and site before creating a deal. A company here is the business entity handling the opportunity; the organisation is the customer or prospect. Do not select an unrelated record to make a form pass.
- Know the customer's objective, where the enquiry came from and who owns follow-up. Record uncertainty explicitly.
- Use synthetic information in this prototype. A current browser connection is required; CRM does not provide an offline queue.
- Editing depends on current ownership, permissions and relationship eligibility. Being able to read a deal does not necessarily allow you to change it.

## Quick start

1. Open the CRM Sales worklist and use **Search opportunities** to find a title, reference or organisation.
2. Choose **Board** for stage overview or **List** for ownership, activity and saved-record detail. Use **Filters** and the sort control to narrow the work.
3. Open the deal. On desktop, a board card opens a snapshot; select **Open full deal** for its full record. List titles and mobile cards open the full record.
4. Check the customer need, current stage, contact, site and next activity. Resolve missing information or plan a specific action to obtain it.
5. Use the appropriate edit or activity action if you have permission. Wait for confirmed saving; a moving card or typed field is not confirmation.
6. Finish with a current record and an accountable next action. Check its owner and due date, or the explicit **Due date needed** state.

## Understand the page

| Control or area | How to use it |
|---|---|
| Board / List | Switch presentation of the same permitted results. Search, filters and sort remain while toggling in the current worklist session. Returning from another page or reloading is not a saved-view guarantee. |
| Search opportunities | Search deal title, opportunity reference or organisation name. This is different from the header's global search. |
| Opportunity | Open the creation form, where available to your identity. This creates a record and initial Activity together. |
| Filters | Filter by Company, Site, Opportunity owner, Next action and Stage. **Owned by me** refers to deal ownership, not Activity ownership. Changing Company clears the Site filter. |
| Sort | Choose **Reference order**, **Title A–Z** or **Newest first**. Expected-close-date sorting is not available on this baseline. |
| Page size | Choose 10, 25 or 50 records. Counts and known values relate to the returned page. |
| Clear filters | Reset search/filter/sort/page-size settings to their defaults. |
| Stage columns | Read stage and count. An empty column means no records in that stage on this result page; it does not prove there are no such deals elsewhere. |
| Deal card | Read title, organisation, known value, expected close and contact. The activity area shows the next action and its owner. |
| Activity area | Open its snapshot, then **Open full activity** for an active action or **Plan an activity** when another next step is needed. |
| List | Compare opportunity context, opportunity owner, stage/outcome, next action/action owner and saved version/time. Bulk-selection and bulk-delete checkboxes are not implemented here. |
| Next page | Read the next result page when offered. **Refresh from start** restarts the list after changes. |

Use both text and dates when interpreting warnings. A warning about an activity is not automatically a judgement about the customer's interest or forecast confidence.

## Counts, value and dates

The summary and stage totals add the known deal amounts on the displayed result page. Amounts are **AUD excluding GST**. An unknown value displays **Not estimated** and is counted separately; it is not zero. A known zero must mean an actual zero amount.

These are unweighted opportunity amounts, not accepted quotation totals, invoiced revenue, cash receipts or a probability-adjusted forecast. A final page is still only that page. Only **All matching results** means the complete matching result set is displayed together. The **As at** time records the result window; refresh after material changes.

Expected close is a date-only sales expectation, displayed with the year. It does not book delivery, promise installation or set an Activity's due date. Activity times on the worklist use Brisbane time. Confirm the meaning and time context shown in the form before saving.

## Create an opportunity

**Before:** you have creation permission and can select appropriate existing customer records. If the pursuit already exists or came from a converted Lead, open that existing deal rather than creating another copy.

1. Select **Opportunity** from the worklist.
2. Select the company and organisation, then the permitted contact/site or a clear reason for an allowed unknown.
3. Enter the opportunity title, customer need, source channel and source evidence. Choose an eligible opportunity owner.
4. Define the initial Activity: kind, owner, action purpose and due date/time. If the date is not known, retain **Due date needed** and make date confirmation part of follow-up.
5. Submit the creation form once. Wait for server confirmation and the new full record. Check that both the opportunity and its initial Activity exist.

In this version, direct creation starts at **Enquiry / Open**. The separate Leads conversion journey can create a Qualified opportunity; its qualification and conversion rules remain in Leads. This guide does not instruct users to recreate a converted lead manually.

| Information | Requirement |
|---|---|
| Company and organisation | Existing permitted selections are required. |
| Opportunity owner | Required eligible owner; do not confuse this with the initial Activity owner. |
| Title and customer need | Required. Use a specific objective, e.g. “Synthetic nursery — tray filling upgrade”; avoid a product name alone. |
| Contact | Select an appropriate person or explain why the contact is unknown. |
| Site | Select an appropriate site or explain the unknown where the company rules allow it. A company requiring a site must have one selected. |
| Source channel and source evidence | Required. Describe how the enquiry was received and the basis of the information. |
| Initial Activity | Required kind, owner and action purpose, plus due time or explicit Due date needed. |
| Value and expected close | Optional later edits through **Edit deal**; do not substitute guesses for unknowns. |

Unsaved creation is not a durable draft or an offline record. Avoid navigating away or reloading before confirmed saving.

## Review and maintain a deal

Open the full record and use **Details** to review customer context, source, requirements and saved-record information. **Timeline** contains Activities and history. Other tabs may have bounded functionality; their presence alone does not mean quotation issue or file upload is available.

**Edit deal information**

1. Select **Edit deal** when available.
2. Update the title, customer contact, deal value or expected close date. If no contact is selected, explain the unknown.
3. Enter value as a non-negative amount with up to two decimal places; commas may be used. Leave it blank when not estimated. The current form accepts amounts up to $999,999,999.99.
4. Select **Save deal** and check confirmation. If another person changed the record, compare the current saved version with your proposal before deciding to retry.

Changing the customer contact here does not transfer the deal owner. Ownership transfer is not available in this baseline.

**Maintain requirements and scope**

Use the requirements/scope edit control in **Details**. Keep **Customer need and objective** meaningful. Record **Inclusions**, **Exclusions**, **Assumptions**, **Constraints**, **Acceptance requirements**, **Required timing** and **Delivery arrangements** where known.

Be specific about the difference between an assumption and confirmed information. A scope save updates this deal; saved estimates, quotations and other commercial records retain their own scope and must be reviewed separately when requirements change. There is no automatic accepted Sales-to-Estimating handover from this edit.

## Manage the next action

The **opportunity owner** is responsible for the deal. The **Activity owner** is responsible for a particular action; they can be different people where permissions allow it. The designated next action is one selected Activity, not necessarily every open task associated with the customer.

1. Open the next Activity from the card or the full deal's **Timeline**.
2. Perform the permitted Activity workflow and record the actual outcome when completing it. Completing an Activity does not automatically qualify the deal.
3. Return to the deal and deliberately plan a new next Activity or select an eligible existing active Activity using the Timeline controls.
4. Confirm its action purpose, owner and due time or Due date needed state. Save and check the resulting next-action display.

Use actionable wording: “Confirm tray dimensions and required hourly output with the customer” is more useful than “Follow up”. If a contact is unknown, assign an identification action. Do not invent a person's identity to remove a warning.

| What you see | What it means | What to do |
|---|---|---|
| Next action needed | The designated action is finished and another active next step needs selection. | Open the deal and plan or select the next action. |
| Due date needed | An active action has no confirmed due time. | Confirm a realistic due time through the Activity workflow. |
| Overdue | The active action's due time has passed. | Check what happened, record its outcome or arrange an appropriate revised follow-up. |
| Upcoming | An active, dated action is not overdue at the result time. | Check that its purpose and owner remain appropriate. |
| Next action unavailable | The linked action cannot be shown under current access/context. | Check the full deal and current identity/access. Do not assume the action is missing or completed. |

## Change stage

This guide covers **Enquiry** and **Qualified** only. Stage movement is a business record change. Qualifying records the reason the opportunity should progress; it does not mean a customer has accepted a quote or an order has been won. Sales outcome stays **Open** in this baseline.

**Accessible route:** open the deal and select the target in its stage controls, or use **Change stage** in the desktop snapshot. This form route avoids depending on drag-and-drop. Only permitted editors can change the stage.

1. Select the target stage.
2. When entering **Qualified**, record a meaningful **Qualification outcome**.
3. If no customer contact is selected, choose an eligible **Owned contact-identification action**. It must be an active CustomerContact or RelationshipReview Activity owned by the opportunity owner. Arrange that action first if no eligible choice exists.
4. Save the stage change and wait for confirmed saving. Verify the new stage and retained history in the full record.

On desktop, dragging an editable card into Qualified opens the evidence form. Dragging back to Enquiry can save directly. Treat the temporary card position as pending until the save succeeds. Returning to Enquiry preserves earlier qualification in history and leaves Activities and sales outcome unchanged.

**Undo stage move** submits another controlled change; it is not deletion of the first event. Check the result, and supply evidence when the return stage requires it. If a save is refused or its outcome is uncertain, resolve that result before attempting another move or undo.

Won/Lost, automatic delivery handover and the proposed five-stage sequence are not controls taught by this version of the guide. Use the guide matching your deployed page when those features change.

## Save confirmation and recovery

| What you see | Correct response |
|---|---|
| Unsaved | Your changes have not been confirmed on the server. Finish or deliberately cancel; do not assume browser storage protects them. |
| Saving/pending | Wait for the result. Repeated clicks or a temporarily moved card do not prove success. |
| Saved to the server | The server confirmed the operation. Review the refreshed record; if needed, reopen it to verify the intended facts. |
| Save outcome uncertain — confirm the original action | The response did not establish whether the original operation completed. In an editor offering **Confirm original save outcome**, use that control before another action. |
| Saved version changed | Select **Load current saved version for comparison**, review the current record and your retained proposal, then use **Use current version for deliberate retry** only if your change is still appropriate. |
| Worklist results changed | Select **Refresh from start** so a changed result set does not cause skipped/repeated records. |

The board's direct-drag feedback does not expose every editor recovery control in this baseline. If its result is uncertain, stop moving the card, refresh/read the deal and check the recorded outcome. If it remains unclear, report it to the prototype owner; do not create a substitute deal or repeatedly reverse an unconfirmed action. Automatic resubmission is not part of this guide.

## Responsibilities and handover

The deal owner retains responsibility for accurate context and a useful next step. Activity ownership identifies who performs that action. Stage movement, Activity completion and scope editing do not transfer the deal or establish another department's acceptance.

If Estimating input is required, capture the customer's objective, known scope, assumptions and outstanding questions, and follow the agreed business coordination process. No approved intake SOP is connected here, and the future formal submit/clarify/accept/revise intake workflow is not implemented by this guide.

A visit, estimate or quotation linked elsewhere has its own state and responsibilities. Do not interpret a saved deal, a linked record or a monetary value as authority to order equipment, promise delivery or invoice.

## Worked examples

### Normal case: a synthetic tray-filling upgrade

An existing fictional customer, **Synthetic Fern Nursery**, is considering a tray-filling upgrade. Search for its existing opportunity. Open the deal, confirm the selected site/contact and review the required output and tray information in the scope.

Record the next action as “Confirm tray dimensions and hourly output with the customer”, assign an eligible Activity owner and confirm the due time. When qualification is supported, use the stage form and explain the outcome. Check the saved Qualified stage and the next action. Expected result: a traceable opportunity and accountable follow-up, with no automatic quotation or delivery booking.

### Incomplete case: contact and price unknown

The site and organisation are known, but the person who will confirm the brief is not. Record why the contact is unknown and leave value blank. Create an owned contact-identification Activity; if qualifying without a selected contact, the required identification action belongs to the opportunity owner and remains active.

Expected result: **Not estimated** remains truthful, the missing contact has an accountable next step, and qualification cannot pass without its required evidence. No fictitious contact or zero value is entered merely to remove a warning.

### Changed brief and concurrent edit

The customer changes the required line arrangement after the deal scope was saved. Another permitted user has also updated the record. Compare the new saved version with your proposed scope, keep valid information, and deliberately retry only the intended change.

Then arrange review of any existing estimate/quotation separately. Expected result: the deal records the revised requirement, existing commercial revisions remain intact, and downstream review is still owned rather than assumed completed.

## Troubleshooting

| Problem | Check and next step |
|---|---|
| I cannot find a deal | Check spelling/reference, filters, Owned by me, company/site and page limits. Clear filters and refresh. Access may exclude it; a missing result is not proof it was deleted. |
| A customer/site/contact option is missing | Confirm the selected company/organisation and refine the lookup search. Do not choose an unrelated option. Raise unresolved identity/data issues with the prototype owner. |
| I cannot edit | Check current ownership/permissions and relationship eligibility. Read-only access is intentional; request the correct authorised person to act through the agreed process. |
| Qualification will not save | Supply the outcome and either a permitted contact or the required active owner-held identification Activity. Read the field-specific validation. |
| My totals look too low | Check filters, page size, more pages, unknown values and the As at time. These are displayed-page known values excluding GST. |
| I completed an Activity but the deal did not progress | Completion and qualification are separate. Record a supported stage decision and choose the next action as appropriate. |
| Filters disappeared after reload | This version does not promise durable saved views. Reapply the intended filters; changing Board/List within the same session does preserve them. |
| The connection failed | Use the original-outcome confirmation where offered. CRM has no offline queue; do not treat unsaved work as synchronised. |
| My screen shows five stages or other controls | This draft is not applicable to that workflow. Obtain the guide for your version; do not reinterpret these two-stage instructions. |

## Related SOPs and resources

**No approved SOP linked yet.** The prototype has no connected approved sales qualification or Sales-to-Estimating intake procedure for this guide. When available, the Page guide will identify each procedure's verified title, applicable revision and source and open it in a separate tab.

Use the full deal for customer context, Activity links and record history. The existing general **Quick Help** covers navigation and basic keyboard controls. The richer Page guide interface is the proposal accompanying this article.

## Guide review and feedback

Prototype guide accountability: **Dean Fiedler**. Business reviewer: **not yet nominated**. Preparation date: **13 September 2026**. User-task validation and onboarding measurements have not yet been performed.

For the design review, report unclear instructions to the prototype owner with the section name and what was difficult. There is no connected in-app feedback queue yet. Keep real customer information out of public feedback. Reading this article does not count as training completion or SOP acknowledgement.

<!-- USER GUIDE END -->

## Author evidence — excluded from the user article

Prepared against main `1cc882e53020bdfb22f7e9192365d90b1d8282ab`, read 13 September 2026. This is source inspection, not a new runtime verification. No operational SOP, questionnaire or business record was inspected for this guide. The fictional examples are illustrative, not seed-record locators.

| Material claim | Source at that baseline |
|---|---|
| Board/List, filters, search, counts, snapshots, Activity links and drag | [Worklist UI](../../src/components/crm-worklist.tsx) and [worklist service](../../src/crm/worklist.ts) |
| Query and view kept in current component state; no reload-persistence claim | [Worklist UI](../../src/components/crm-worklist.tsx) |
| Create required/conditional fields; initial Activity | [Create UI](../../src/components/crm-screens.tsx), [validation](../../src/crm/validation.ts), [opportunity service](../../src/crm/opportunities.ts) |
| Contact/value/date/scope edits, stage form, undo and read-only controls | [Deal controls](../../src/components/crm-deal-controls.tsx), [validation](../../src/crm/refinement-validation.ts), [service](../../src/crm/refinements.ts) |
| Known value totals and unknown exclusion | [Value summary](../../src/crm/value-summary.ts), [worklist UI](../../src/components/crm-worklist.tsx) |
| Current stage definitions/qualification; no Won/Lost | [Worklist service](../../src/crm/worklist.ts), [stage validation](../../src/crm/refinement-validation.ts), [0017 refinement migration](../../db/migrations/0017-crm-ui-refinements.sql), [five-stage plan](../delivery/crm-five-stage-implementation-plan.md) |
| Separate Leads conversion | [Leads service](../../src/crm/leads/service.ts) |
| Save status, reconciliation, conflict comparison | [Command state](../../src/components/crm-state.ts), [editor](../../src/components/crm-deal-controls.tsx), [detail](../../src/components/crm-screens.tsx) |
| Existing general Quick Help and current session clearing | [Shell controls](../../src/components/shell-controls.tsx) |

Pending dependencies: rebase content when the five-stage CRM implementation and its frontend continuation are actually merged and selected for deployment; verify route labels/creation/conversion/recovery on that build. Guide use by actual staff, independently reviewed business accuracy and executed HELP/T scenarios remain Not run.
