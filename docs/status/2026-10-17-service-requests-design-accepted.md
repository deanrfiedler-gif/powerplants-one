---
title: Service requests design accepted
date: 2026-10-17
---

Dean accepted the Figma design for the SV-01 register and SV-02 request record (`/service/tickets`, `/service/tickets/new`, `/service/tickets/[id]`): "I accept the Service requests SV-01 and SV-02 design with your recommendations, including D1–D6 and Q1–Q2". The [decision](../decisions/service-requests-figma-design.md) records it as the named Figma version "Service requests — accepted", and the [retained captures](../reference/ui/service/service-requests-design-r01/README.md) are thirteen icon-free PNGs with hashes.
- The register uses the Work orders grid, with triage queues in the side menu, a Board view and the large snapshot. Row checkboxes reverse the 23 September D7.
- The request record uses the shared record layout, with a Before triage bar, view tabs and Complete triage edited in the tab.
- Log a request stays a page. Its duplicate check offers to add the call to a matching open request.
- Later stages wait for ADR-0043, which stays proposed. A shell follow-up should stop the 1024 px top bar clipping the account button.

This is a design decision only. No code, route, migration, permission or capability changes. No device, accessibility or operational review is recorded.

<!-- decision-index -->
[Service requests design — owner decision](../decisions/service-requests-figma-design.md): the SV-01 register (`/service/tickets`, `/service/tickets/new`) and SV-02 request record (`/service/tickets/[id]`), drawn in Figma on the accepted Work orders layouts. Accepted on 17 October 2026 ("I accept the Service requests SV-01 and SV-02 design with your recommendations, including D1–D6 and Q1–Q2") as the named version "Service requests — accepted". Grid register with triage queues in the side menu, a Board view and the large snapshot. Row checkboxes reverse the 23 September D7. The request record has a Before triage bar and view tabs. Complete triage is edited in the tab. Log a request offers to add the call to a matching open request. Thirteen icon-free captures are retained. Building the page is not decided; later stages wait for ADR-0043.
