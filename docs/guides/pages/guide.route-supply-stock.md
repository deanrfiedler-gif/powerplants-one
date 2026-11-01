---
guide_key: guide.route-supply-stock
entry_key: route:/supply/stock
also_applies_to: []
title: Inventory
status: InReview
versioning: git
owner_role: "Prototype content owner: Dean Fiedler"
source_commit: a7d50d2e
contents: { overview: "Overview", how: "How to use", journey: "Journey map" }
list_styles: { journey: journey }
---

Read dated source observations in the Inventory register, snapshot and item record. MYOB remains the intended ERP authority. PPO posts no stock movement.

## SC-05 — purpose and prerequisites {#overview}

You need read access to the exact company and Site. Recording an observation requires the existing Supply coordination permission. Keep the source time, completeness, unit and owner explicit.

### Read the observation basis

On hand, source available, source reserved, held and evidenced usable are distinct. Unknown never means zero. Totals combine distinct permitted location observations for the same company, item and unit. Overlapping or missing location evidence leaves the total Unknown. Each observation retains its time and version.

### Review competing demand

Open the item's Demand view and follow a permitted allocation to Material demand. Incoming shipment allocation is coordination evidence, not a source reservation or stock quantity. Readiness remains a separate review.

### Respect the source boundary

No Product link is recorded. Product mapping persistence remains outstanding; a matching name, SKU or family does not create a link. Live reservation policy is Not configured. Activity is evidence history over native records mentioning the item, not a stock ledger.

## How to use it {#how}

1. **Find an item**\
   Search Inventory and filter by location, unit or completeness. The toolbar reports the actual bounded result as N shown · limit 100. The secondary menu has no counts. Locations are flat rows.
2. **Read its evidence**\
   Select a snapshot or open the item record. Quantities, Locations, Demand, Activity and Source evidence retain exact source references. Within Inventory, filters and selection remain in the URL. The native observation form retains the source record; its Back action returns without Inventory filters.
3. **Record an observation**\
   Record observation opens the existing native Supply form. For an existing item, review its current source version and give a reason. Saved appears only after the server receipt; expected versions and original-operation recovery remain active.
4. **Complete the handover**\
   Follow the native source record, permitted Material demand or Service stock link. Technical, commercial, scheduling and Finance decisions remain with their owners. Open product stays unavailable while no link is recorded.

## Your journey {#journey}

Evidence enters once and remains attributable to its source.

1. **Review the bounded register**\
   N shown is the number returned by this read, not a complete-stock count. Unknown and known zero are different states.
2. **Compare the observations**\
   Read quantities, flat locations, completeness and each source time. A partial source scan cannot establish totals. No freshness threshold or source precedence is invented.
3. **Follow the native action**\
   Use Record observation for the existing form, or follow the permitted owning record. A read, allocation or link never posts a stock movement.

## On your phone {#mobile}

Use full-width item links and Search and filter. Quantity meanings remain separate at 390 and 320 px. The item tabs and actions sit above the shared bottom navigation. Swipe the tab bar to reach all five views. Record observation keeps the native responsive form and uncertain-save recovery. This workflow is online; no offline posting is offered.

## Keyboard shortcuts {#shortcuts}

| Key | Action |
|---|---|
| `Tab / Shift Tab` | Move between labelled controls. |
| `Enter` | Open the focused item or action. |
| `Space` | Select a snapshot checkbox or activate a button. |
| `Escape` | Close the shared secondary menu and restore focus; native forms retain their existing discard checks. |

## If something is unavailable {#recovery}

A failed or denied read removes the previous projection. Retry read preserves your selected item and filters. Unavailable source evidence and missing quantities remain Unknown; they are never replaced with zero.

For validation errors in the native form, correct the named fields. For a stale revision, refresh and compare the retained proposal with current evidence. An uncertain save retains its original operation and content in this browser session: check the original receipt or retry that exact PPO save. Restored access is checked before any receipt is disclosed. Absence of a receipt is not proof that an external effect failed.

> [!NOTE]
> Synthetic/manual coordination only. No live purchase, reservation, ERP receipt/shipment/return/credit, customer message, automatic reschedule or stock/Finance ledger is provided. Guide review, application visual acceptance and deployment are separate.
