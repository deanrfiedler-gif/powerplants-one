---
guide_key: guide.route-supply-shipments
entry_key: route:/supply/shipments
also_applies_to: []
carried_over_from: src/supply/guide.ts
title: Inbound shipments
status: InReview
shown_before_review: true
versioning: git
owner_role: "Prototype content owner: Dean Fiedler"
source_commit: b95d335987ee3b8f2c9f19509e7832c5200db67d
contents: { overview: "Overview", how: "How to use", journey: "Journey map" }
list_styles: { journey: journey }
---

Coordinate shipment lines, split allocations and dated ETA evidence.

## SC-03 — purpose and prerequisites {#overview}

Use your permitted synthetic profile and the exact company, Site and existing source identities. Keep the source time, completeness, units, owner and next action explicit. These pages coordinate evidence; MYOB remains the intended inventory and Finance authority.

### Register each shipment line

Create a Supply line with Shipment basis, shared shipment identity, unique line reference, supplier, warehouse, item and unit. Several lines can use one shipment identity; several shipments can serve one demand.

### Allocate to demands

Use Allocate to a line for like-unit, same-company and same-item demand. The server conserves both line capacities even when two users save together.

### Review ETA changes

Revise the source record with a reason. Retain estimated versus confirmed ETA, a confidence basis only if the source provides one, dispatch evidence, manufacturing, customs, broker and freight references.

## How to use it {#how}

1. **Find the record**\
   Search and completeness filters remain in the URL. Select a record; Back and reload restore the selected line under your current permissions.
2. **Read the evidence**\
   Review source time, completeness, current quantities and retained revisions. Missing evidence remains unknown; there is no assumed observation-age threshold.
3. **Save deliberately**\
   Use the relevant workflow action and enter evidence, observation time, completeness and a reason. Saved is shown only after a server receipt. Review / correct capture retains its original.
4. **Complete the handover**\
   Follow canonical context links and the one owned Activity. Keep technical, commercial, scheduling, document and Finance decisions with their owners.

## Your journey {#journey}

Evidence enters once and is followed through the appropriate native workspace.

1. **Register each shipment line**\
   Create a Supply line with Shipment basis, shared shipment identity, unique line reference, supplier, warehouse, item and unit. Several lines can use one shipment identity; several shipments can serve one demand.
2. **Allocate to demands**\
   Use Allocate to a line for like-unit, same-company and same-item demand. The server conserves both line capacities even when two users save together.
3. **Review ETA changes**\
   Revise the source record with a reason. Retain estimated versus confirmed ETA, a confidence basis only if the source provides one, dispatch evidence, manufacturing, customs, broker and freight references.

## On your phone {#mobile}

At 390 and 320 CSS pixels the worklist and detail stack, capture fields use 16px text and controls retain 44px targets. Receipt, picking/dispatch and delivery have focused mobile forms. This workflow is online; no offline queue is implied.

## Keyboard shortcuts {#shortcuts}

| Key | Action |
|---|---|
| `Tab / Shift Tab` | Move between labelled controls. |
| `Enter / Space` | Open the focused record or action. |
| `Escape` | Close the form or page guide; a form asks before discarding entered values. |

## If something is unavailable {#recovery}

For validation errors, correct the named fields. For a stale revision, refresh and compare the retained proposal against current evidence. An uncertain save retains its original operation and content in this browser session: check the original receipt or retry that exact PPO save. Restored access is checked before any receipt is disclosed. Unknown external outcomes require evidence against the original reference; absence is not proof of failure.

> [!NOTE]
> Synthetic/manual coordination only. No live purchase, reservation, ERP receipt/shipment/return/credit, customer message, automatic reschedule or stock/Finance ledger is provided. Visual review, owner acceptance and deployment are separate.
