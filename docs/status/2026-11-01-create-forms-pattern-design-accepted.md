---
title: Create forms shared pattern design accepted
date: 2026-11-01
---

Dean accepted the Figma design for the shared Create forms pattern: "Accept recommendations". The [design decision](../decisions/create-forms-pattern-figma-design.md) (PPO-CREATE-FORMS-FIGMA-DEC) records D1–D17 and the recommended answers to Q1–Q16:
- one create pattern, from Create organisation: check for an existing record, keep unknowns explicit, review, save, inspect, continue;
- six forms that accepted pages had left undrawn: + Lead, Create opportunity (direct and from a lead), New work order, New build, New engineering request and Create activity;
- quick add only where the accepted page has "+", sharing one field set with the full form;
- a duplicate check that is always a prompt and never merges; an uncertain save that recovers the original request and cannot create a second record;
- a coverage table of every create route, where it is drawn and whether it follows the pattern.

Q1–Q16 are design direction, not verified operating rules. Under Q8, Activity kind was added to Deals Add deal, recorded as an [amendment](../decisions/deals-figma-design.md#amendment--1-november-2026). Dean saved the named version "Create forms · shared pattern — accepted". Icon-free captures with hashes are retained in [create-forms-design-r01](../reference/ui/create-forms-design-r01/README.md). The Figma copies were on a temporary page and were deleted after export.

Checked:
- No Font Awesome instance was left on the capture copies, and none carried a prototype link.
- The page has no overlaps, and off-page links were stripped. All 25 prototype links were traced in the file data to their intended frames.

Not done:
- The prototype flows weren't played in Figma Present mode; Dean declined app access for that check. Devices, keyboard and screen reader weren't checked.
- No application form is changed. Check before creating on leads and deals needs a new read, and New build has no model, route or capability.
- Eight coverage rows, including People and Sites, are still not drawn.
- Pages this one draws on that are still proposals stay proposals.

No application code, route, migration, permission, grant, adapter or parent ID changes.

<!-- decision-index -->
[Create forms pattern design](../decisions/create-forms-pattern-figma-design.md) (PPO-CREATE-FORMS-FIGMA-DEC) records Dean's 1 November 2026 acceptance of one shared create pattern and six forms, with a coverage table of every create route. It adopts Q1–Q16 as design direction and builds nothing.
