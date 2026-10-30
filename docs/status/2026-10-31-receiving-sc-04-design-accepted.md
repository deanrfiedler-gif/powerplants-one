---
title: Receiving SC-04 design accepted
date: 2026-10-31
---

Dean accepted the Figma design for SC-04, receipt, inspection and quarantine: "Accept all". The [design decision](../decisions/receiving-figma-design.md) (PPO-SC04-RECEIVING-FIGMA-DEC) records D1–D9 and the recommended answers to Q1–Q6:
- a register grouped by disposition, and a receipt record with Lines, Inspection, Quarantine, Affected demand and History tabs;
- arrival, inspection and quarantine never count as usable; only a named person's release does;
- four dispositions: Release, Hold in quarantine, Reject to Returns & claims, and Short or over receipt;
- a correction needs each affected demand owner's acknowledgement and is made by reversal;
- each receipt shows what went to MYOB, and failures are owned in Integrations (AD-04).

Q1–Q6 are design direction, not verified operating rules. Twenty-four icon-free captures with hashes are retained in [receiving-design-r01](../reference/ui/supply-chain/receiving-design-r01/README.md), and the design register page for `scope:SC-04` cites them. In Figma the capture copies sit on the Captures page at y = 810,000.

Checked:
- No Font Awesome instance or stray vector is left in the capture copies, and no copy carries a prototype link.
- The page has no overlaps, and none of its 36 prototype links goes off the page.

Not done:
- The prototype flows were traced in code, not played in Figma Present mode. Devices, keyboard and screen reader weren't checked.
- `/supply/receipts` isn't changed. MYOB document types, locations and serial tracking stay unverified under DEC-CCE-10.
- Material demand, Purchasing, Inbound shipments, Returns & claims and Integrations are still proposals; accepting SC-04 doesn't accept them. The decision lists three small differences on those pages.
- The named Figma version "Receiving — accepted" waits for Dean.

No application code, route, migration, permission, grant, adapter or parent ID changes.

<!-- decision-index -->
[Receiving design](../decisions/receiving-figma-design.md) (PPO-SC04-RECEIVING-FIGMA-DEC) records Dean's 31 October 2026 acceptance of the SC-04 design: a register by disposition, a five-tab receipt record, side forms and a phone count form. Only a named person's release makes stock usable, and a correction is made by reversal after each affected demand owner acknowledges it. Changing the application page isn't decided, and MYOB mappings stay unverified.
