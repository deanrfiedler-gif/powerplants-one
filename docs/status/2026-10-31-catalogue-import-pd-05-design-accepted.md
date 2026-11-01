---
title: Catalogue import PD-05 design accepted
date: 2026-10-31
---

Dean accepted the Figma design for PD-05, catalogue import and exception review: "Accept and lock in". The [design decision](../decisions/catalogue-import-figma-design.md) (PPO-PD05-CATALOGUE-IMPORT-FIGMA-DEC) records D1–D15, departures X1–X6 and answers Q1–Q7:
- four steps: stage, map rows, independent review of the exact plan, apply;
- every row Resolve, New or Exclude with a rationale; exceptions stay visible; similar names never merge; units are never converted;
- a returned plan stays, and its correction becomes a new plan;
- apply lists exactly what it creates, drafts only, all or nothing, with an applied batch final;
- phone for plan summary and review; mapping is a desktop task;
- to build later: an explicit Submit for review step, an Abandoned state and duplicate matching that ignores case, spaces and hyphens.

Twenty-seven icon-free captures with hashes are retained in [catalogue-import-design-r01](../reference/ui/products/catalogue-import-design-r01/README.md), and the design register page for `scope:PD-05` cites them.

The named Figma version "Catalogue import — accepted" is awaiting Dean's yes.

Checked:
- Layout, clipped text and off-page link scripts, and in-Figma screenshots.
- No Font Awesome instance, stray vector or prototype link in the capture copies.

Not done:
- Present mode was not run, so the prototype links are untested in play.
- The built page has not moved to this design. Submit for review, Abandoned and the duplicate rule need their own go-ahead.

No application code, route, migration, permission, grant or parent ID changes.

<!-- decision-index -->
[Catalogue import design](../decisions/catalogue-import-figma-design.md) (PPO-PD05-CATALOGUE-IMPORT-FIGMA-DEC) records Dean's 31 October 2026 acceptance of the PD-05 design: staged rows with exact mapping decisions, visible exceptions, independent review of an immutable plan and an all-or-nothing apply that creates drafts only. Building it, Submit for review, Abandoned and the duplicate matching rule are not decided.
