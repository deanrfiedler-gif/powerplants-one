---
guide_key: guide.page.sales.leads
entry_key: route:/sales/leads
also_applies_to: ["route:/sales/leads/[id]"]
carried_over_from: src/components/leads-guide.ts
title: Leads
status: InReview
shown_before_review: true
versioning: git
owner_role: "Prototype content owner: Dean Fiedler"
source_commit: b95d335987ee3b8f2c9f19509e7832c5200db67d
contents: { overview: "Overview", how: "How to use", journey: "Journey map" }
list_styles: { journey: journey }
---

Your inbox for new enquiries. Work through each lead, keep the next action current, and convert the ones worth pursuing into deals.

## What this page is for {#overview}

A lead is an enquiry that has not yet become a deal. This page lists the leads you are permitted to see, in the order you choose, so you can triage new enquiries and keep the follow-up honest. Leads you cannot access are never shown.

### Views in the side menu

Inbox holds the leads still in play and My leads the ones you own. Status narrows the Inbox to New, Contacting or Nurturing, and Follow-up to leads that are Overdue or need a next action. Archived holds ones set aside, Disqualified ones ruled out, and Converted ones that became deals. Each view shows how many leads it holds under your current search, owner and source.

### The next activity column

Every lead shows its next scheduled action. Overdue dates and leads with nothing scheduled are marked, so the list doubles as your follow-up queue.

### A table you control

Choose which columns appear, drag the dividers to resize them, and scroll sideways when you need more. Your layout is remembered for you on this device.

## How to use it {#how}

1. **Resolve customer records**\
   Open Resolve customer context to select the customer, site and contact. Create and return uses the shared record forms; each save is separate. A new contact needs a dated customer affiliation. Review the returned selection and save the lead context with a reason. The captured enquiry and earlier selections remain in history.
2. **Transfer accountability**\
   The current owner can transfer an active lead to an eligible recipient. Compare every linked activity; those activities keep their owners, dates and outcomes. No available recipient means the required access has not been established. Confirm original save recovers an accepted transfer even after ownership changes.
3. **Add a lead**\
   Use the + Lead button. Record the title, the organisation or contact, and where the enquiry came from. The arrow beside the button will hold bulk import once that is available.
4. **Narrow the list**\
   Everyone switches between all leads and your own. Filters holds a search box and the source, and shows a count when any are active. Clear filters resets them and keeps the view you are in.
5. **Choose your columns**\
   The gear at the right of the header row opens the column chooser. Search for a column, tick the ones you want, and untick the rest. Reset columns in the footer restores the defaults.
6. **Act on a lead**\
   Open a lead by its title to read the full record, add a note or set the next action. The three-dot menu at the end of each row converts, archives or disqualifies without opening it first.
7. **Convert when it is real**\
   Converting creates the linked deal and moves the lead into the Converted view. If a newly identified site differs from an earlier activity, record a review plan for that source activity and create a dated Deal review owned by the lead owner. Original owners, dates and history stay on the lead; both records show the follow-through. Use Confirm original save if the result is uncertain.

## Your journey {#journey}

Most enquiries follow the same path through this page. Each step leaves a record, so anyone picking the lead up later can see what happened.

1. **An enquiry arrives**\
   The lead appears in Inbox with no next activity, which marks it as needing attention.
2. **You make contact**\
   Set the status as the conversation progresses, and schedule the next action so the lead stops looking unattended.
3. **You qualify it**\
   Keep working it, or disqualify it with a reason. Disqualified leads stay searchable and can be reopened.
4. **It becomes a deal**\
   Convert the lead. The deal carries the enquiry forward and the lead moves to Converted.
5. **Or you set it aside**\
   Archive leads that are genuinely dormant rather than dead. They can be restored from the Archived view at any time.

## On your phone {#mobile}

On a phone the table is replaced by a card list. The menu button in the header opens the same views as the side menu, and the view selector in the toolbar offers them too, with search, sort and filter buttons beside it. The + button at the bottom right adds a lead.

## Keyboard shortcuts {#shortcuts}

| Key | Action |
|---|---|
| `Tab` | Move through the toolbar, the table and each row menu. |
| `← →` | Resize the focused column by 10 pixels; hold Shift for 50. |
| `Home / End` | Set the focused column to its narrowest or widest. |
| `Esc` | Close an open menu, or cancel a column drag in progress. |

## If something is unavailable {#recovery}

If the list cannot load, the page says so and offers to try again rather than showing a stale or partial list. A lead you cannot open is a permission boundary, not a fault.

> [!NOTE]
> This page shows only the leads your access allows, and every action is checked again on the server when you save.
