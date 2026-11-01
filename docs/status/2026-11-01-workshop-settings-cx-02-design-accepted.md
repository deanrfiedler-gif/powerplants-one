---
title: Workshop settings CX-02 design accepted
date: 2026-11-01
---

Dean accepted the Figma design for Workshop settings, `scope:CX-02/settings`: "Accept and lock in". The [design decision](../decisions/workshop-settings-figma-design.md) (PPO-CX02-WORKSHOP-SETTINGS-FIGMA-DEC) records D1–D12 and the recommended answers to Q1–Q9:
- an overview of eight areas, with status in words, version in force, proposals waiting and owner;
- a limit change is a new version, builds in progress keep their revision, and recorded tests keep their limit;
- the workshop lead publishes, with a second person reviewing, except that Dean publishes release rules;
- serial numbers don't reset each year;
- nothing on the page changes MYOB.

Two story details disagreed with the accepted Workshop builds frames. The page was relabelled to agree with them (Q6, Q7), and those frames and their captures are unchanged. Q1–Q9 are design direction, not verified operating rules, and every limit shown is synthetic. Twenty icon-free captures with hashes are retained in [workshop-settings-design-r01](../reference/ui/settings/workshop-settings-design-r01/README.md), and the design register page for `scope:CX-02/settings` cites them. In Figma the capture copies sit on the Captures page at y = 1,580,000.

Dean saved the named Figma version "Workshop settings — accepted".

Checked:
- No Font Awesome instance or stray vector is left in the capture copies, and no copy carries a prototype link.
- The page has no overlaps, and all its prototype links stay on the page.

Not done:
- The prototype flows weren't played in Figma Present mode. Devices, keyboard and screen reader weren't checked.
- Whether MYOB tracks serials for these items is open with the MYOB partner (Q4).
- The proposals this page draws on stay proposals; accepting it doesn't accept them.

No application code, route, migration, permission, grant, adapter or parent ID changes.

<!-- decision-index -->
[Workshop settings design](../decisions/workshop-settings-figma-design.md) (PPO-CX02-WORKSHOP-SETTINGS-FIGMA-DEC) records Dean's 1 November 2026 acceptance of the `scope:CX-02/settings` design: eight configuration areas changed through Propose, Review by a second person and Publish, where builds in progress keep their revision and recorded tests keep their limit. Building the page isn't decided.
