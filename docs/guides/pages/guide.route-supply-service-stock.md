---
guide_key: guide.route-supply-service-stock
entry_key: route:/supply/service-stock
also_applies_to: []
carried_over_from: src/supply/guide.ts
title: Service stock custody
status: InReview
shown_before_review: true
versioning: git
owner_role: "Prototype content owner: Dean Fiedler"
source_commit: b95d335987ee3b8f2c9f19509e7832c5200db67d
contents: { overview: "Overview", how: "How to use", journey: "Journey map" }
list_styles: { journey: journey }
---

Reconcile warehouse → technician / van → job → outcome against exact Field evidence.

## SC-10 — purpose and prerequisites {#overview}

Use your permitted synthetic profile and the exact company, Site and existing source identities. Keep the source time, completeness, units, owner and next action explicit. These pages coordinate evidence; MYOB remains the intended inventory and Finance authority.

### Establish custody

Create a custody record against Service demand, its actual Work Order appointment/visit, custodian, van, warehouse and authoritative issue/transfer observation. Preserve item, unit and serial/batch identity.

### Explain every issued quantity

Record a full reconciliation snapshot: held in custody, at job, used, unused returned, damaged, quarantined and missing. These are mutually exclusive current outcomes and must total issued exactly. Used quantity references matching current Field parts capture.

### Reconcile before closure

Close only after no quantity remains unexplained, in custody, at the job or in quarantine, and an inventory reference and evidence time support reconciliation. Custody is not consumption; consumption is not automatically billable. Investigate an unknown original transfer before repeating any equivalent effect.

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

1. **Establish custody**\
   Create a custody record against Service demand, its actual Work Order appointment/visit, custodian, van, warehouse and authoritative issue/transfer observation. Preserve item, unit and serial/batch identity.
2. **Explain every issued quantity**\
   Record a full reconciliation snapshot: held in custody, at job, used, unused returned, damaged, quarantined and missing. These are mutually exclusive current outcomes and must total issued exactly. Used quantity references matching current Field parts capture.
3. **Reconcile before closure**\
   Close only after no quantity remains unexplained, in custody, at the job or in quarantine, and an inventory reference and evidence time support reconciliation. Custody is not consumption; consumption is not automatically billable. Investigate an unknown original transfer before repeating any equivalent effect.

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
