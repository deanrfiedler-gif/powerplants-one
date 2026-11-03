---
title: Product publication PD-02 design accepted
date: 2026-10-31
---

Dean accepted the Figma design for PD-02, catalogue authoring and publication: "Accept as drawn". The [design decision](../decisions/product-publication-figma-design.md) (PPO-PD02-PRODUCT-PUBLICATION-FIGMA-DEC) records D1–D14, departures P1–P5 and answers Q1–Q5:
- an authoring form where every save is a new immutable revision, with a field-by-field comparison against the predecessor;
- a queue grouped by state, and a frozen review recording Reviewed or Returned with a reason, never by the author;
- publish and withdraw dialogs that name what they bind, with an effective-context date that is "Not an automatic schedule";
- Engineering reviews and the product owner publishes; only required attributes block Submit (a new rule, not built); in-app notifications later.

Twenty-six icon-free captures with hashes are retained in [product-publication-design-r01](../reference/ui/products/product-publication-design-r01/README.md), and the design register page for `scope:PD-02` cites them.

The named Figma version "Product publication — accepted" was saved on 31 October 2026 after Dean answered "Yes, save it".

Checked:
- Layout, overflow, clipping and off-page link scripts, and in-Figma screenshots.
- No Font Awesome instance, stray vector or prototype link in the capture copies.

Not done:
- Present mode was not run, so the prototype links are untested in play.
- The built pages have not moved to this design. The required-attribute rule, image linking and notifications need their own go-ahead.

No application code, route, migration, permission, grant or parent ID changes.

<!-- decision-index -->
[Product publication design](../decisions/product-publication-figma-design.md) (PPO-PD02-PRODUCT-PUBLICATION-FIGMA-DEC) records Dean's 31 October 2026 acceptance of the PD-02 design: immutable revisions compared field by field, frozen independent review, publish and withdraw dialogs that change no saved work, and an effective-context date that is not a schedule. Building it is not decided.
