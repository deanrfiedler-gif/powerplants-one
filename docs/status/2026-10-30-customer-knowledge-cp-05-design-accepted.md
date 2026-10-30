---
title: Customer knowledge CP-05 design accepted
date: 2026-10-30
---

Dean accepted the Figma design for CP-05, customer knowledge and guided support. Asked "Do you accept the CP-05 design with the recommended answers?", he answered: "Accept and lock in". The [design decision](../decisions/customer-knowledge-figma-design.md) (PPO-CP05-CUSTOMER-KNOWLEDGE-FIGMA-DEC) records departures D1–D14 and answers Q1–Q8:
- Help as the knowledge entry, with no new navigation item;
- Applies: Yes, No or Not sure in words, with the reason, and unknown left unknown;
- a distinct "Stop and call us" note, with hardware and electrical work ending in Request a technician;
- reviewed guided-help paths that end in an article or a prefilled CP-02 request;
- superseded and withdrawn articles that never show old steps as current;
- portal-only articles for CP3, with guided help offered and never required.

Twenty-nine icon-free captures with hashes are retained in [customer-knowledge-design-r01](../reference/ui/customer-portal/customer-knowledge-design-r01/README.md), and the design register page for `scope:CP-05` cites them. The new parts moved to Components · Customer portal, and the capture copies sit on the Captures page at y = 560,000.

Checked:
- No Font Awesome instance or stray vector is left in the capture copies.
- No text colour differs from its bound variable, and no copy carries a prototype link.

Open:
- DK-05, accepted the same day, tells the same article differently (`SYN-KA-000016` r01, not yet published on 13 Oct). The accepted CP-05 frames keep `SYN-KA-000021` r02; aligning them needs a revised capture set.
- Guided-path authoring and the owner feedback list are not drawn on DK-05.
- The named Figma version "Customer knowledge — accepted" is not saved yet.
- The prototype flows have not been played in Present mode.

Not done:
- `/portal/knowledge` is not built.

No application code, route, migration, permission, article publication or parent ID changes.

<!-- decision-index -->
[Customer knowledge design](../decisions/customer-knowledge-figma-design.md) (PPO-CP05-CUSTOMER-KNOWLEDGE-FIGMA-DEC) records Dean's 30 October 2026 acceptance of the CP-05 design: reviewed customer articles with applicability in words, a distinct stop note that ends hardware questions in a technician request, reviewed guided help ending in an article or prefilled support request, and superseded and withdrawn handling. Building it is not decided.
