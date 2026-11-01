---
document_id: PPO-HELP-CRM
guide_key: guide.page.sales.opportunities
entry_key: route:/sales/opportunities
also_applies_to: ["route:/sales/opportunities/[id]"]
title: Deals
status: InReview
shown_before_review: false
versioning: git
owner_role: "Prototype content owner: Dean Fiedler"
audience: Internal prototype users; synthetic examples only
source_commit: 95ce53f30e884c1f165bb031f5ac826a72a6f5c2
workflow_basis: Five-stage synthetic deal workflow (Discovery, Scoping, Quoting, Negotiation, Closing)
runtime_evidence: Not run. Written from the application source at source_commit; no application walkthrough or user test has been performed.
resource_ids: []
change_summary: Rewritten for the five-stage Deals workflow, replacing the two-stage Enquiry and Qualified guide.
---

This guide covers the Deals worklist and the full deal page in the synthetic five-stage pipeline: **Discovery**, **Scoping**, **Quoting**, **Negotiation** and **Closing**. The records are synthetic. A deal in the earlier pipeline, which uses **Enquiry** and **Qualified**, is described under Troubleshooting.

## Purpose and outcome {#purpose}

Use Deals to find, create and maintain a sales deal, record how far it has progressed, keep an accountable next activity and record the final sales outcome. The screens say "deal"; the record is saved in Powerplants One as an opportunity.

A deal is in good order when it names the customer organisation, states the customer's need, has a deal owner, sits in the stage that matches its progress and has a next activity with an owner and a due date, or the visible **Due date needed** state.

Moving a deal between stages does not create, issue or accept an estimate or quotation. Recording **Won** does not create an order in the finance system or authorise delivery. It records a sales decision and makes a handover due.

## Before you start {#before}

- Work in the intended prototype identity and company. The worklist shows only the deals that identity is permitted to read.
- Reading a deal and changing it are different permissions. Only the current deal owner, with the right permission for the company and site, can edit the deal, change its stage, plan its next action, transfer it or record its outcome. Everyone else sees a read-only deal.
- The **Deal** button appears on the worklist only when your identity may create deals.
- Find the existing organisation, site and contact first. A new deal selects existing records; it does not create customers.
- Know the customer's need, how the enquiry arrived and who will own the follow-up. Where something is not known, the form asks you to say so rather than guess.
- Deals needs a live connection. The Add deal page is marked **Online**. Nothing is queued for later, so an unsaved change is not saved.

## Quick start {#quick-start}

1. Open **Deals**. The **Board** shows one column for each stage, with its total value and number of deals.
2. Find a deal. Choose **Filters** and use **Search deals**, or use a ready-made choice in **Views**.
3. Open the deal by selecting its title. The eye icon opens a snapshot first, and **Open full deal** in the snapshot opens the full page.
4. Check the customer, contact, site, deal owner, value, expected close date and next activity.
5. If you are the deal owner, change what is out of date: **Edit deal**, **Edit requirements and scope**, **Plan next action** or **Change stage**.
6. Wait for **Saved to the server**, then check the refreshed record. A card that has moved on the board is not proof of saving.
7. To start a new deal, select **Deal** on the worklist, complete **Add deal** and select **Add deal and action**.

## Understand the page {#page-tour}

### The worklist

| Control or area | What it does |
|---|---|
| **Board**, **List**, **Forecast** | Three presentations of the same permitted deals, filters and sort. |
| **Archive** | Saved **Won** and **Lost** deals. Choose **All closed**, **Won** or **Lost**. Manual archiving and restoring are not available. |
| **Deal** | Opens **Add deal**. It appears only if you may create deals. |
| **Pipeline totals** | Shows **Total value**, **Deals**, **Not estimated** and **Weighted value**, which reads **Not configured**. It states whether the figures cover **All matching results** or the **Current result page only**. |
| **Pipeline** | Chooses which pipeline the worklist reads. The default is **Fictional sales pipeline**, the five-stage pipeline. |
| **Help** | Opens **Deal board guide**, a short summary of the worklist. |
| **Filters** | Opens **Filter deals**. See the filters below. |
| **Add condition** and the condition chips | Open the same filters. Each active condition shows as a chip; select a chip to remove that condition. |
| **Views** | **All open**, **Owned by me**, **Overdue activities** and **No next activity**, plus any view you save with **Save as new view**. Saved views last for this visit only; the address bar keeps your current filters if you reload. |
| **Triage** | Lists open deals whose activity is overdue, missing or has no date. |
| **What changed** | Lists the most recently updated deals on this page. An update time alone does not show that the stage moved. Open the deal for its history. |
| **Sort by** | **Default order**, **Title A–Z** or **Newest first**. |
| **Pipeline insights** | An expandable summary above the results: known value, next-action coverage, age in the current stage and recorded close-date changes. |
| **Deal data options** | **Export current page as CSV** works. Import, clean-up and restore are shown as unavailable. |
| **Refresh from start**, **Next page** | Restart the list, or read the next page of results. |

The filters in **Filter deals** are **Search deals** (deal title, reference or organisation), **Company**, **Site**, **Deal owner**, **Sales outcome** (**Open**, **Won**, **Lost** or **All**), **Next action**, **Stage**, **Sort**, **Page size** (10, 25 or 50 records) and **Owned by me**. Use **Find company filter**, **Find site filter** and **Find owner filter** to search a long list. Changing **Company** clears **Site**. **Clear filters** returns the search and filters to their defaults, but keeps the **Pipeline** you chose. Select **Done** to close the panel.

### Board cards

Each card shows the deal title, organisation, primary contact (or **No primary contact**), expected close date (or **Close date not set**) and value (or **Not estimated**). Below that:

- The activity strip shows the next activity and when it is due, or **Nothing scheduled** and **Schedule a follow-up**.
- The health chip reads **No next activity**, **Activity date needed**, **Overdue activity**, **Next activity planned** or **Activity unavailable**. A warning icon marks a deal that needs attention.
- Two circles show the deal owner and the activity owner.
- The footer icons are **Snapshot**, **Activities**, **Documents**, **Next activity**, and, for the deal owner of an open deal, **Change stage** and **Edit deal**.

On a desktop screen you can drag an editable card to another stage column. While you drag, **Delete**, **Lost**, **Won** and **Move** appear. Deletion is not available. **Won** is available only for a deal in **Closing**. Dropping on **Move**, **Lost** or **Won** opens the matching form for review; it does not save by itself.

### The List

The **List** shows these columns: **Deal**, **Organisation**, **Primary contact**, **Value**, **Expected close**, **Stage / outcome**, **Owner** and **Next activity**. Drag a column divider to resize it, or focus it and use the arrow keys.

### The Forecast

The **Forecast** groups open deals by expected close date: **Overdue**, each of the coming months (**Show** 3, 6 or 12 months), **Later** and **No close date**. Amounts are unweighted. They are not committed revenue.

### The full deal page

The page shows the title, **Back to sales worklist**, the deal reference and outcome, **Edit deal**, the key facts (**Outcome**, value in **AUD, excl. GST**, **Expected close**, **Customer contact**, **Deal owner**) and a stage track with one button for each stage. The current stage shows **Current stage**. If the deal owner has changed, **Original deal owner** and **Current owner** are both shown.

| Tab | What it holds |
|---|---|
| **Overview** | **Next customer action**, **Customer objective**, **Deal information** and **Linked handovers & aftercare**. |
| **Scope & sites** | **Deal information**, **Site and source** and **Requirements and scope**. |
| **Activities** | The source lead if the deal was converted from one, the next-action panel, **Plan next action** and **Activity history**. |
| **Tasks** | **Owned work**: the open shared activities linked to this deal, with a link to **Open Sales Tasks**. |
| **Estimates & quotations** | The estimate and quotations linked to this deal. **Create estimate** appears if you may create one. |
| **Correspondence** | Email messages explicitly linked to the deal. This view sends nothing. |
| **Documents** | **Deal documents**: linked quotation documents and their output state. |
| **History** | **Deal history**: every recorded change, with who made it and when. |

If the deal owner may transfer or finish the deal, **Transfer deal owner** and **Record sales outcome** appear above the tabs.

## Information you need {#information}

### To add a deal

| Information | Required | How to enter it |
|---|---|---|
| **Qualification outcome** | Always | The outcome of qualifying the customer need. **Discovery** starts with a qualified need. Up to 2,000 characters. |
| **Visibility company** | Always | Choose the company handling the deal. Changing it clears the organisation, site, contact and owner. |
| **Organisation** | Always | Search and choose an existing customer organisation. It appears once a company is chosen. The **Site**, **Contact** and **Deal owner** fields appear after the organisation is chosen. |
| **Site** | Depends on the company | Choose an existing site. If the company does not require one, you may leave it empty and answer **Why is the site unknown?** If the company requires one, you must choose it and your authority is limited to that site. |
| **Contact** | Choose one or explain | Choose an existing person, or answer **Why is the contact unknown?** |
| **Deal owner** | Always | Choose an eligible owner. This is the person accountable for the deal. |
| **Deal title** | Always | A specific name, for example the customer and the job. |
| **Customer need** | Always | What the customer wants to achieve. Up to 2,000 characters. |
| **Source channel** | Always | **Phone**, **Email**, **Meeting**, **Referral** or **Other**. |
| **Source context (synthetic)** | Always | How the enquiry arrived. Up to 1,000 characters. |
| **Initial next action** | Always | **Activity kind** (**Customer Contact** or **Relationship Review**), **Activity owner**, **Action purpose**, and either a **Due date and time** or **Due date needed** ticked. |

Times are entered and shown in Brisbane time. If the contact is unknown, the initial activity must be owned by the deal owner and should be the action that identifies the contact. The form refuses a different activity owner in that case.

### To maintain a deal

| Information | Where | Rules |
|---|---|---|
| **Deal title**, **Customer contact**, **Deal value · AUD, excl. GST**, **Expected close date** | **Edit deal** | Leave the value blank when it is not estimated. Enter a non-negative amount with up to two decimal places; commas are accepted and the amount must be below 1 billion. If no contact is chosen, answer **Why is the contact unknown?** Outside **Enquiry**, a deal saves without a contact only while it holds an open contact-identification activity of kind **Customer Contact** or **Relationship Review** owned by the current deal owner. A deal added with a contact holds no such activity, so its contact cannot be cleared. |
| **Customer need and objective** | **Edit requirements and scope** | Required. Up to 2,000 characters. |
| **Inclusions**, **Exclusions**, **Assumptions**, **Constraints**, **Acceptance requirements**, **Required timing**, **Delivery arrangements** | **Edit requirements and scope** | Optional. Up to 5,000 characters each. Unrecorded items show **Not recorded**. |
| **Action choice**, **Activity kind**, **Activity owner**, **Action purpose**, **Due date and time** | **Plan next action** | Choose **New** to create an activity, or **Existing** to pick an active activity already linked to this deal. |
| **Deal stage** | **Change deal stage** | Move forward one stage, or back to any earlier stage. |
| **Sales outcome**, **Outcome evidence source**, **Lost reason** or **Acceptance or order evidence**, **Outcome notes (optional)** | **Record sales outcome** | See Record the sales outcome below. |

## Complete the main tasks {#tasks}

### The five stages

Every new deal starts in **Discovery**, whether you add it with **Add deal** or convert it from a lead. It then moves through the stages in this order.

| Stage | Position | What the application does |
|---|---|---|
| **Discovery** | 1 | Where every new deal starts. The deal is saved with its qualification outcome and its first activity. |
| **Scoping** | 2 | A stage you move the deal to. The only extra rule is the contact rule below. |
| **Quoting** | 3 | A stage you move the deal to. It does not create or issue a quotation. |
| **Negotiation** | 4 | A stage you move the deal to. The only extra rule is the contact rule below. |
| **Closing** | 5 | The final stage, and the only stage from which **Won** can be recorded. |

The stage records where the deal has reached. Beyond the direction of the move and the contact rule below, the application attaches no stage-specific requirement. Estimates and quotations are done and recorded in their own places.

- **Moving forward:** one stage at a time. Moving from **Discovery** straight to **Quoting** is refused.
- **Moving back:** to any earlier stage. Earlier history is kept.
- **Contact rule:** this applies to every stage change, forward or back, while the deal has no **Customer contact**. The deal must still hold its contact-identification activity, which is the initial activity set when the deal had no contact. That activity must be open (not completed or cancelled), of kind **Customer Contact** or **Relationship Review**, and owned by the person who owned the deal when it was created. If it is not, the stage change is refused. To avoid the rule, choose a **Customer contact** with **Edit deal** and **Save deal** first; once the deal has a contact, stage changes no longer check the activity. A deal that already has a contact is not affected.
- **After an outcome:** once **Won** or **Lost** is recorded, the stage cannot change and the outcome cannot be reopened.
- **Lost** can be recorded from any stage. **Won** can be recorded only from **Closing**.

### Add a deal

**Before:** you may create deals, and the organisation, site and contact already exist.

1. On **Deals**, select **Deal**. The **Add deal** page shows "Pipeline: Fictional sales pipeline. Stage: Discovery. Sales outcome: Open."
2. In **Deal and customer context**, enter the **Qualification outcome**, then choose the **Visibility company**, **Organisation**, **Site**, **Contact** and **Deal owner**.
3. Enter the **Deal title**, **Customer need**, **Source channel** and **Source context (synthetic)**.
4. Under **Initial next action**, choose the **Activity kind** and **Activity owner**, write the **Action purpose**, then enter a **Due date and time** or leave **Due date needed** ticked.
5. Select **Add deal and action**. Add deal creates the deal and its first activity together.

**Finished when:** the full deal page opens and **Saved to the server** appears. **Next:** the deal owner adds the value and expected close date with **Edit deal**.

Check the list before you start. If the pursuit already exists, or came from a converted lead, open that deal rather than adding a second one. See [Leads](/sales/leads) for conversion.

### Edit the deal

**Before:** you are the deal owner.

1. Open the deal and select **Edit deal**, on the page heading or in **Deal information**.
2. Change the **Deal title**, **Customer contact**, **Deal value · AUD, excl. GST** or **Expected close date**.
3. Select **Save deal** and wait for the confirmation.

**Finished when:** the key facts show the new values and **Deal history** shows **Deal information updated**. Changing the contact does not change the deal owner.

### Maintain requirements and scope

1. Open **Scope & sites** and select **Edit requirements and scope**.
2. Keep **Customer need and objective** specific. Record what is known under **Inclusions**, **Exclusions**, **Assumptions**, **Constraints**, **Acceptance requirements**, **Required timing** and **Delivery arrangements**.
3. Select **Save requirements and scope**.

**Finished when:** **Deal history** shows **Requirements and scope updated**. Saved estimates and quotations keep their own scope. Review them separately when the requirements change.

### Plan the next action

The next action is one chosen activity. The activity owner is responsible for that activity and may be a different person from the deal owner.

1. Open the **Activities** tab. The next-action panel shows the chosen activity, its owner and when it is due, with **Open activity**.
2. To choose another, use **Plan next action**. For **Action choice**, pick **New** and fill in the **Activity kind**, **Activity owner**, **Action purpose** and due time, or pick **Existing** and choose an **Existing active linked activity**.
3. Select **Save next action**.

**Finished when:** the panel shows the new activity and **Deal history** shows **Next action planned**. Completing an activity records its outcome in the activity. It does not move the deal or choose the next activity, so come back and plan one.

### Change the stage

1. Select **Change stage** on the card, the stage button in **Deal information**, one of the stage buttons on the full deal page, or **Change stage** in the snapshot. All of these open **Change deal stage**. This route works by keyboard and on a phone, and does not depend on dragging.
2. Choose the **Deal stage**. **Save stage** stays disabled until you choose a different stage.
3. Select **Save stage** and wait for the confirmation.

**Finished when:** the stage track shows the new **Current stage** and **Deal history** shows **Deal stage changed**, with the previous and new stage. On the board, **Undo stage move** reverses the last move by making another stage change. It does not delete the first one.

If you drag a card to a stage instead, the card moves to the new column straight away and the board shows "moving to" that stage. That is not proof of saving. The move is saved when the board shows **Stage saved:** followed by the stage and the status reads **Saved to the server**. If the server refuses the move or its result is uncertain, the card returns to its original column.

### Record the sales outcome

**Before:** you are the deal owner. To record **Won**, the deal must be in **Closing**.

1. Select **Record sales outcome**, or drag the card to **Won** or **Lost**.
2. Choose the **Sales outcome**. Only **Lost** is offered unless the deal is in **Closing**.
3. Choose the **Outcome evidence source**: **Issued quotation and reported response**, or **Separate outcome evidence**. For a quotation, choose the **Quotation release to review**, then select **Review quotation basis**. The comparison you review is the one that is submitted. A quotation whose reported response does not match the outcome (accepted for **Won**, declined for **Lost**) is not eligible.
4. For **Won**, enter the **Acceptance or order evidence**. For **Lost**, choose a **Lost reason**: **Price**, **Competitor**, **Timing** or **No decision**.
5. Add **Outcome notes (optional)** if useful, then select **Record outcome**.

**Finished when:** the deal shows **Outcome: Won** or **Outcome: Lost** and **Deal history** shows **Sales outcome recorded**. Reopening is unavailable. **Next:** for **Won**, the accountable owner follows up the **Handover due** panel, described below.

### Transfer the deal owner

1. Select **Transfer deal owner**.
2. Find and choose the **New deal owner** and write the **Transfer reason**.
3. Check the **Activities keep their owners** panel, then select **Confirm owner transfer**.

The transfer is immediate once saved. Activities, tasks, estimates, quotations and delivery obligations keep their own owners, so the new owner must review them separately.

## Completion and handover {#completion}

The deal owner is accountable for the deal record, its stage and its outcome. The activity owner is accountable for one activity. Stage changes, activity completion and scope edits do not transfer the deal, and they do not show that another team has accepted anything.

When you record **Won**, a **Handover due** panel appears. It names the accountable owner, who was the deal owner when **Won** was recorded, and the deal version at which it was recorded. Existing activities keep their owners. Receiving progress appears under **Linked handovers & aftercare** on the **Overview** tab, with a link to open the **Estimating** or **Won receiving** workflow and the aftercare worklist. Those workflows have their own states and pages, for example [Won handovers](/sales/handoffs/won). Receiving acceptance does not authorise delivery.

Quotations and estimates have their own pages. See [Estimating](/estimating). A saved deal, a linked record or a deal value is not authority to order equipment, promise delivery or invoice.

## Statuses, warnings and save state {#states}

| What you see | What it means | What to do |
|---|---|---|
| **Next action needed** (card: **No next activity**) | The chosen activity is finished or none is chosen. | Open the deal and plan a next action. |
| **Due date needed** (card: **Activity date needed**) | The active activity has no confirmed due time. | Confirm a due time on the activity. |
| **Overdue** (card: **Overdue activity**) | The due time has passed. | Record what happened and plan the next step. |
| **Upcoming** (card: **Next activity planned**) | The activity is active and not yet due. | Check that its purpose and owner are still right. |
| **Next action unavailable** (card: **Activity unavailable**) | The chosen activity cannot be shown to your identity. | Do not assume it is missing or finished. Check your access. |
| **Not estimated** | The deal has no value. It is counted separately and is not zero. | Leave it until a real figure is known. |
| **Current result page only** | The totals cover this page of results, not every matching deal. | Use **Next page**, or read **All matching results** when that is shown. |
| **Read only under current ownership, permissions or relationship eligibility.** | You are not the current deal owner, or you lack the permission. | Ask the deal owner. This is intentional. |
| **Handover due** | **Won** has been recorded and receiving is not yet confirmed. | See Completion and handover. |
| **Unsaved** | Your change is not on the server yet. | Finish it or cancel it. The browser does not keep it for you. |
| **Saved to the server** | The server confirmed the change. | Check the refreshed record. |
| **Unsaved — review the error** | The server refused the change. | Read the field message, correct it and save again. |
| **Save outcome uncertain — confirm the original action** | The answer did not show whether the change was saved. | Select **Confirm original save outcome**. Do not make the change a second time. |
| **Compare saved version** (with your proposal) | Someone changed the deal after you opened it. Your proposal is kept. | Select **Load current saved version for comparison**, review, then **Use current version for deliberate retry** only if your change is still right. |
| **Previously loaded record. Its current state could not be refreshed.** | The page is showing the last record it loaded. | Select **Try loading again** before you act on it. |

## Worked examples {#examples}

### A new deal moves to Scoping

**Starting point:** SYN Fernvale Nursery asks about an automated tray-filling line. You own the follow-up. For this example the deal is called SYN-OPP-0001; the application gives each real deal its own reference.

**Actions:**
1. Select **Deal**. Choose the company, then the organisation "SYN Fernvale Nursery", its site and its contact.
2. Enter the **Qualification outcome** "Customer confirmed a budget cycle and a site visit date", the **Deal title** "SYN Fernvale Nursery tray-filling line", the **Customer need**, **Source channel** Phone and a **Source context (synthetic)**.
3. Under **Initial next action**, choose **Customer Contact**, set yourself as **Activity owner**, write "Confirm tray sizes and hourly output with the customer" as the **Action purpose** and enter a **Due date and time**.
4. Select **Add deal and action**. The deal opens in **Discovery**.
5. Select **Edit deal** and enter a value and an **Expected close date**. Leave the value blank if there is no real estimate.
6. Under **Scope & sites**, record the **Inclusions** and **Assumptions** you know.
7. When the customer has given the detail you need, select **Change stage**, choose **Scoping** and select **Save stage**.

**Expected result:** the deal is in **Scoping**, **Deal history** shows **Deal created**, **Deal information updated**, **Requirements and scope updated** and **Deal stage changed**, and the card shows a next activity with its owner and due date. No estimate or quotation has been created.

### A stage move whose result is uncertain

**Starting point:** SYN-OPP-0002, "SYN Hillcrest Packing Line", is in **Scoping**. On the board you drag its card to **Quoting**, and the connection drops.

**Actions:**
1. Do not drag the card again. The status line reads **Save outcome uncertain — confirm the original action**. The card goes back to **Scoping**, because the board drops a move whose save the server has not confirmed.
2. Select **Confirm original save outcome**.
3. If the status changes to **Saved to the server**, the move was made. Check that the card is now in **Quoting**.
4. If the server instead refuses the move and **Load current saved version for comparison** appears, select that button. The board reloads from the server. Use **Change stage** on the card again only if you still want the move.

**Expected result:** the deal is in exactly one stage that the server has confirmed, and **Deal history** shows a single **Deal stage changed** for the move. If you tried to skip a stage, for example **Scoping** to **Negotiation**, the server refuses with "Move forward one stage or back to an earlier stage in this pipeline." and the card returns to **Scoping**.

## Troubleshooting {#recovery}

| Symptom | Check and recover |
|---|---|
| I cannot find a deal. | Check **Filters** and the condition chips, **Sales outcome** (a closed deal is under **Archive**), the **Pipeline** choice and **Page size**. Select **Clear filters**. A missing result is not proof that a deal was deleted, because access can hide it. |
| A stage change or **Edit deal** is refused with "Choose an active action. The completed or cancelled outcome remains in history." | The deal has no **Customer contact**, and its contact-identification activity has been completed or cancelled. Choose a **Customer contact** with **Edit deal** and select **Save deal**, then change the stage again if you need to. Once the deal has a contact, neither checks the activity. See the contact rule under The five stages. |
| A stage change or **Edit deal** is refused with "Contact identification needs an active Customer contact or Relationship review action owned by the opportunity owner." | The deal has no **Customer contact**, and its contact-identification activity is not a **Customer Contact** or **Relationship Review** activity with the owner the check expects. A stage change expects the person who owned the deal when it was created. **Edit deal** expects the current deal owner, so after **Transfer deal owner** the new owner cannot save the deal without a contact. Choose a **Customer contact** with **Edit deal** and select **Save deal**, then change the stage again if you need to. |
| **Edit deal** is refused with "A qualified deal needs a contact or an owned active contact-identification action." | You cleared the **Customer contact** on a deal that holds no contact-identification activity, usually because it was added with a contact. That deal must keep a contact: choose one in **Customer contact** and select **Save deal** again. |
| A stage change is refused with "Select an owned active contact-identification action before qualification." | The deal has no **Customer contact** and no contact-identification activity is recorded. Choose a **Customer contact** with **Edit deal**, then change the stage again. |
| The deal is in **Enquiry** or **Qualified**. | It belongs to the earlier pipeline, **Fictional sales enquiry — I1**. Choose that pipeline in **Pipeline**. On the deal page an **Enquiry** deal shows **Record qualification** and **Progress to Qualified**. That pipeline has no **Won** or **Lost** outcome. |
| I cannot edit the deal. | Check whether you are the deal owner. A read-only deal is intentional. Ask the deal owner, or ask for the deal to be transferred. |
| **Change stage** is missing or disabled. | The deal is already **Won** or **Lost**, you are not the deal owner, or a save is in progress or uncertain. |
| **Won** is not offered. | The deal is not in **Closing**. Move it there one stage at a time. |
| I cannot choose an organisation, site or contact. | Choose the company first and search again. Do not pick an unrelated record to make the form pass. |
| I cannot add a deal. | The **Deal** button needs permission to create deals. If the company requires a site, choose one before the contact and owner lists load. |
| The worklist says the results changed. | Select **Refresh from start**. This stops skipped or repeated deals. |
| My totals look low. | The totals cover the page you can see, and unknown values are not counted. Check **Page size**, **Next page** and **Not estimated**. |
| Completing an activity did not move the deal. | That is expected. Change the stage yourself and plan the next action. |
| The page could not load. | Select **Try loading again**. If it keeps failing, report it to the prototype owner with the page and what you did. |

## Mobile, keyboard and offline use {#mobile}

- **Screen width.** At 781 pixels wide or more you can drag board cards and collapse a stage column from its menu. Narrower than that, the board shows one stage at a time. Use the **Choose Board stage** buttons, which show each stage and its count. Dragging is not available.
- **Search.** On a desktop screen **Search deals** is inside **Filters**. On a phone it sits in the page header.
- **Without dragging.** **Change stage** on a card, or the stage buttons on the deal page, do everything dragging does. Use them on a phone, with a keyboard or with assistive technology.
- **Keyboard.** The board and the list are focusable regions that scroll with the arrow keys. In the menus, the arrow keys, Home, End and typing a letter move between choices, and Escape closes the menu and returns focus to its button. Dialogs close with Escape, and ask before discarding unsaved changes.
- **Offline.** Deals needs a connection. Nothing is queued, and a change is only saved when you see **Saved to the server**.

## Related SOPs and resources {#resources}

No approved SOP linked yet.

Other pages you may need while working a deal: [Leads](/sales/leads), [Sales Tasks](/sales/tasks), [My Work](/work), [Estimating](/estimating) and [Add deal](/sales/opportunities/new).

## Guide review and feedback {#review}

The prototype content owner is Dean Fiedler. The business reviewer has not yet been nominated, and this guide has not been reviewed. It is checked against the application source, not against a running copy. No in-app feedback queue exists yet: report an unclear or wrong instruction to the prototype owner, with the section name. Reading this guide is not training completion or SOP acknowledgement.
