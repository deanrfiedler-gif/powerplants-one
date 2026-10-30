---
title: Product pricing PD-03 design accepted
date: 2026-10-31
---

Dean accepted the Figma design for PD-03, product supplier-source context, after an audit: "Accept with recs". The [design decision](../decisions/product-pricing-figma-design.md) (PPO-PD03-PRODUCT-PRICING-FIGMA-DEC) records departures D1–D15 and answers Q1–Q12:
- bindings shown as a grid against one exact product revision, newest first and permanent;
- Mapped only when units are exactly equal and the revision is reviewed; otherwise Unresolved with evidence and an owner, never converted;
- every source change goes to Cost sources (ES-03), and refresh happens in the estimate;
- affected estimates limited to what the viewer may see, never claiming no impact;
- a worklist across products for the estimating lead, and a restricted view with no figures or counts;
- additions F1 price check, F2 validity timeline and F5 follow-up actions.

Thirty-five icon-free captures with hashes are retained in [product-pricing-design-r01](../reference/ui/products/product-pricing-design-r01/README.md), and the design register page for `scope:PD-03` cites them. The Products contract now says PD-03 performs no FX and shows an FX source's original price and rate as recorded (Q11).

The named Figma version "Product pricing — accepted" is not saved yet; it waits for Dean's yes.

Checked:
- Layout, overflow, clipping and off-page link scripts, and in-Figma screenshots.
- No Font Awesome instance, stray vector or prototype link in the capture copies.

Not done:
- Present mode was not run, so the prototype links are untested in play.
- The built page has not moved to this design. The worklist read, the fuller affected-estimate read, the owner field and the Mapped rule need their own go-ahead.

No application code, route, migration, permission, grant or parent ID changes.

<!-- decision-index -->
[Product pricing design](../decisions/product-pricing-figma-design.md) (PPO-PD03-PRODUCT-PRICING-FIGMA-DEC) records Dean's 31 October 2026 acceptance of the PD-03 design: permanent bindings between exact revisions, Mapped only on equal units and a reviewed revision, Unresolved with evidence and an owner, every source change in ES-03, and limited affected-estimate lists that never claim no impact. Building it is not decided.
