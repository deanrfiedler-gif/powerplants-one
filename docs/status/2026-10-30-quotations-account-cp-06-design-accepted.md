---
title: Quotations and account CP-06 design accepted
date: 2026-10-30
---

Dean accepted the Figma design for CP-06, customer quotation, variation and account views, after both prototype flows were played: "Accept, lock in." The [design decision](../decisions/quotations-account-figma-design.md) (PPO-CP06-QUOTATIONS-ACCOUNT-FIGMA-DEC) records departures D1–D16 and answers Q1–Q7:
- a separate commercial grant, with each slice shown only when delivered, granted and readable;
- the exact issued quotation or variation, with Reply to the sender and no Accept or Sign;
- orders and deliveries as the customer side of the dispatch notice, with proof of delivery limited to quantities;
- account figures from one complete MYOB read with their time, and no figures from a partial or failed read;
- invoice queries and delivery problems through Support requests;
- two story representatives, because the quote page's quotation belongs to SYN Woodhaven Nursery, not the Glasshouse 4 customer.

Q3 gives a recommended direction for D-024 without deciding it. Thirty-six icon-free captures with hashes are retained in [quotations-account-design-r01](../reference/ui/customer-portal/quotations-account-design-r01/README.md), and the design register page for `scope:CP-06` cites them. In Figma the capture copies sit on the Captures page at y = 590,000.

Checked:
- No Font Awesome instance is left in the capture copies, and no copy carries a prototype link.
- Both prototype flows were played in Figma; about 30 of the 96 links were clicked by hand and the rest traced in code. Playback found three defects, all fixed and replayed.

Not done:
- `/portal/commercial` is not built, and CPA-15 stays Not run.
- The Quotation page ES-05, Dispatch & delivery, Customer accounts, Change review and Support requests pages that CP-06 draws on are still proposals; accepting CP-06 doesn't accept them.

At Dean's instruction ("You save it."), Claude saved the named Figma version "Quotations & account — accepted" and saw it in the file's version history.

No application code, route, migration, permission, grant, adapter, customer message or parent ID changes.

<!-- decision-index -->
[Quotations and account design](../decisions/quotations-account-figma-design.md) (PPO-CP06-QUOTATIONS-ACCOUNT-FIGMA-DEC) records Dean's 30 October 2026 acceptance of the CP-06 design: separately granted customer views of exact issued quotations and variations, orders and deliveries with proof, and account reads from MYOB with their source time. Customers reply to the sender and staff record any response; nothing on the page accepts, approves, pays or posts. Building it is not decided, and D-024 stays open.
