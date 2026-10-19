---
title: Quotation view tracking decision paper
date: 2026-10-19
---

A decision paper on quotation view tracking is drafted for Dean's decision ([record](../decisions/quote-view-tracking.md)). Dean asked for a feature like PandaDoc's on 19 October 2026: "I would like to include a similar feature to this within the Powerplants One app if possible." He then asked: "Yes, draft a decision paper for quote view tracking based on your recommendation, on a branch with a draft PR."

The paper recommends option B, a PPO quotation page:
- **The page.** The email carries a link to a PPO page that shows the exact issued quotation and offers the PDF download.
- **What it records.** Views, downloads and approximate active time per section, by event type and time only, under the privacy rules of the accepted Emails amendment A1.
- **What views never do.** They never change the quotation's status or response.

It asks Dean ten questions (Q1–Q10). It also sets out stages QV-S1 to QV-S3, which depend on ADR-0059 being accepted, PR #608 merging, the privacy notice, request-log and link-domain gates, and the D-020 external-access review.

The paper is Proposed and not accepted. No code, route, migration, capability, grant or parent ID changes. An owner decision paper needs a review by a second model before merge; none has taken place.

<!-- decision-index -->
[Quotation view tracking](../decisions/quote-view-tracking.md) (PPO-QUOTE-VIEW-TRACKING-PROP) proposes a PPO quotation page, reached from a "View quotation" link in the sender's email, that records views, downloads and approximate time per section without IP, device or identity, as evidence that never changes the quotation's status. It sets out ten questions for Dean's decision.
