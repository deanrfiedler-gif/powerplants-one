---
title: Service review and reports design accepted
date: 2026-10-18
---

Dean accepted the Figma design for the SV-06 register and report record (`/service/reports`, `/service/reports/[id]`): "I accept the Service review and reports SV-06 design with your recommendations, including D1–D6 and Q1–Q2". The [decision](../decisions/service-review-figma-design.md) records it as the named Figma version "Service review and reports — accepted", and the [retained captures](../reference/ui/service/service-review-design-r01/README.md) are twelve icon-free PNGs with hashes.
- The register uses the Work orders grid, with review queues in the side menu and the large snapshot. It keeps the built recent window of 200 reports.
- The report record uses the shared record layout, with a Before issue bar and five view tabs. Review submission is edited in the Evidence tab using the built fields: Approved or Returned for each entry, Review decision, Authority disposition and internal remarks.
- The customer report is issued as exact HTML and nothing is sent. Customer responses are bound to that exact report, and owned remaining work and a proposed (not booked) return visit follow from it.

This is a design decision only. No code, route, migration, permission or capability changes. No device, accessibility or operational review is recorded.

<!-- decision-index -->
[Service review and reports design — owner decision](../decisions/service-review-figma-design.md): the SV-06 register (`/service/reports`) and report record (`/service/reports/[id]`), with SV-07 remaining work and the FI-07 customer response on the report, drawn in Figma on the accepted Work orders layouts. Audited, polished and accepted on 18 October 2026 ("I accept the Service review and reports SV-06 design with your recommendations, including D1–D6 and Q1–Q2") as the named version "Service review and reports — accepted". Grid register with review queues in the side menu and the large snapshot. The report record has a Before issue bar and five view tabs. Review submission is edited in the Evidence tab. The customer report is issued as exact HTML and nothing is sent; responses are bound to that exact report. Twelve icon-free captures are retained. Building the page is not decided.
