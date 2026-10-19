---
title: Quotation view tracking accepted
date: 2026-10-19
---

Dean accepted the quotation view tracking decision paper on 19 October 2026 ([record](../decisions/quote-view-tracking.md)): "Proceed with your recommendations for Q1 to Q10 of the quotation view tracking paper." He had asked for a feature like PandaDoc's earlier that day: "I would like to include a similar feature to this within the Powerplants One app if possible."

The accepted approach is option B, a PPO quotation page:
- **The link.** The issuer's email carries a "View quotation" link to a page that shows the exact issued quotation and offers the retained PDF.
- **What it records.** PPO records views, downloads and approximate active time per section. Each event is stored by type and time, with no IP address, device or identity.
- **What is decided.** The answers cover a link that anyone holding it can open, withdrawal and closure 30 days after validity, no PDF attachment by default, who sees the views, follow-up prompts, and no online acceptance yet.
- **One departure.** Q4 departs from the Emails amendment A1-Q2 for quotation pages only: a section's active seconds may be stored.
- **Status is untouched.** Views never change the quotation's status, response or deal stage.

Nothing is built. Stages QV-S1 to QV-S3 each need their own authorisation. They also depend on ADR-0059 being accepted, PR #608 merging, the privacy notice, request-log and link-domain gates, and the D-020 external-access review. No code, route, migration, capability, grant or parent ID changes. An owner decision paper needs a review by a second model before merge; none has taken place.

<!-- decision-index -->
[Quotation view tracking](../decisions/quote-view-tracking.md) (PPO-QUOTE-VIEW-TRACKING-PROP) records Dean's 19 October 2026 acceptance of option B: a PPO quotation page, reached from a "View quotation" link in the sender's email. The page records views, downloads and approximate time per section without IP, device or identity, as evidence that never changes the quotation's status, with Q1–Q10 adopted as recommended. Building it is not decided.
