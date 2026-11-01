---
guide_key: guide.route-estimating-cost-sources
entry_key: route:/estimating/cost-sources
also_applies_to: ["route:/estimating/cost-sources/[id]", "route:/estimating/cost-sources/new", "route:/estimating/estimates/[id]/sources"]
carried_over_from: src/components/cost-sources-guide.ts
title: Cost sources and reviewed estimate refresh
status: InReview
shown_before_review: true
versioning: git
owner_role: "Prototype content owner: Dean Fiedler"
source_commit: b95d335987ee3b8f2c9f19509e7832c5200db67d
contents: { overview: "Overview", how: "How to use", journey: "Journey map" }
list_styles: { journey: journey }
---

Retain authored synthetic supplier evidence, review one exact revision, then compare the effect on a saved estimate before saving a successor.

## Evidence, source review and saved costs {#overview}

This online workflow separates source evidence, its review, and the estimate version that deliberately uses it. Nothing refreshes historical costs on its own. All reads and commands recheck current company and estimating authority.

### Source register

Search reference, supplier, item or title and filter the current header state. Menu counts cover every permitted search and supplier match; the selected view has its own count and paged results. My sources means owner, while Awaiting my review requires independence from both owner and revision author. Select rows on the current page to open exact evidence in sequence or export their list.

### Exact evidence

A source holds one supplier/item/unit identity. Its revisions retain explicit AUD excluding-tax prices, increasing quantity tiers, source and effective dates, known expiry, evidence reference and authored text. Blank is Unknown; zero must be entered explicitly.

### Separate review duty

The owner saves and submits. A different person with the explicit source-evidence review duty records Reviewed, Returned or Rejected with a rationale. Source review grants no price, estimate or quotation approval.

### Deliberate refresh

Select exact reviewed source revisions for specific saved lines and provide a pricing date. Compare old/new costs and validity warnings. Save creates one estimate successor while retaining quantities, sell prices, scope and specialist lineage.

## How to use it {#how}

1. **Read the source**\
   Open a source from the register. Check its supplier/entity key, item, unit, evidence, dates and tiers. The current source state and the selected historical revision's reviewed event are distinct.
2. **Prepare and submit**\
   Use New synthetic source for a new identity, or Prepare source successor for a correction. Enter a reason and save. Open the saved record, then submit the exact draft. Submitted evidence is frozen until reviewed.
3. **Review independently**\
   Use the separately assigned source reviewer. Read the complete exact evidence, choose an evidence decision and record a rationale. A correction after return or rejection is a new owner draft; the earlier decision remains.
4. **Compare an estimate**\
   Open a saved estimate and choose Compare reviewed source costs. The current editable cost version is required. A discovery-bound estimate must still use the Complete current selected discovery revision. Select a source revision for each affected line and enter the explicit pricing date.
5. **Save only the reviewed comparison**\
   Check every before/after line, total cost effect, unchanged sell and any Unknown expiry. Confirm your review and give a reason. Costs above a saved sell are refused under the existing synthetic arithmetic policy. Revise pricing deliberately before another comparison.
6. **Read the successor**\
   Open saved record after acceptance. The previous estimate, source revision and Draft quote bytes remain unchanged. A later manual change to quantity, unit, cost, source or source date drops typed source provenance from that new line; the historical binding remains.

## Your journey {#journey}

Each saved boundary has its own identity, hash or receipt. A reviewed source may support many estimate versions without modifying them.

1. **Discovery and saved estimate**\
   Establish the scope and exact saved lines.
2. **Authored source evidence**\
   Save, submit and independently review an exact revision.
3. **Comparison**\
   Select affected lines and inspect the proposed cost effects.
4. **Successor**\
   Explicitly save one new cost version, then use downstream estimate review and quotation workflows under their own authority.

## On your phone {#mobile}

Evidence and forms stack vertically; long references wrap. Review each tier and each changed line before saving. Controls remain reachable by touch and keyboard. This is an online synthetic workflow; it is not an offline queue.

## Keyboard shortcuts {#shortcuts}

| Key | Action |
|---|---|
| `Tab / Shift+Tab` | Move through filters, evidence, fields and actions. |
| `Enter` | Apply a filter or activate a focused action. |
| `Space` | Open a details disclosure or confirm the review checkbox. |
| `Esc` | Close this guide and return focus. |
| `Back / Forward` | Return through source and exact revision links. |

## If something is unavailable {#recovery}

Failed reads clear sensitive content and offer Try loading again. Unsaved edits are kept in memory and navigation warns before discarding them. An in-flight synthetic command is retained in this tab's existing actor-bound recovery journal; after reload it checks the original receipt. Check original outcome or Retry exact original reuses its operation ID. An unavailable receipt does not prove the save failed. Accepted recovery retains only a minimal pointer. A conflict requires a fresh comparison; it never overwrites the saved version.

> [!NOTE]
> No live supplier catalogue, MYOB operation, customer message or business approval. FX, unit conversion, landed-cost allocation and operational thresholds remain Not configured. A previously reviewed historical source revision is an explicit choice, not an assertion that it is the latest supplier price. Source presence, automated proof, visual review, owner acceptance and deployment remain separate.
