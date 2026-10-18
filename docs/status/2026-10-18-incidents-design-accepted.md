---
title: Incidents and corrective actions FI-06 design accepted
date: 2026-10-18
---

Dean accepted the Figma design for the FI-06 register, incident record and report form (`/service/incidents`, `/service/incidents/[id]`, `/service/incidents/new`): "I accept the Incidents and corrective actions FI-06 design with your recommendations, including D1–D7 and Q1–Q4." The [decision](../decisions/incidents-figma-design.md) (PPO-FI06-INCIDENTS-FIGMA-DEC) records departures D1–D7 and the recommended answers to Q1–Q4. The [retained captures](../reference/ui/quality-site-assurance/incidents-design-r01/README.md) are twelve icon-free PNGs with hashes. The FI-06 scope and route page notes now point to them.
- **Design:** a grid register with Triage and Follow-through views; the record on the SV-06 layout with a "Before closure" bar, a hold card, a triage form, action evidence accepted by a separate person and a closure tab with an outcome preview; a one-scroll report form with a submit sheet. A submitted report holds its exact scope until closure; triage does not release it, as the existing contract says.
- **Answers:** report from the visit's More menu on My jobs and Appointment detail (Q1); a separate Restricted details section (Q2); site time shown, UTC stored (Q3); linked inspection defects in triage (Q4).

Not done: the named version "Incidents and corrective actions — accepted" is not saved and waits for Dean's explicit yes; the shared shell change for the Conversations action is still open. The File index row and page header were updated after acceptance, and two slips in the captures (a clipped line and the offline buttons) were corrected before commit. Not built in this form, and building it is not decided. Synthetic data only. No code, route, migration, permission, capability or parent ID changes.

<!-- decision-index -->
[Incidents and corrective actions design](../decisions/incidents-figma-design.md) (PPO-FI06-INCIDENTS-FIGMA-DEC) records Dean's 18 October 2026 acceptance of the FI-06 Figma design for the incidents register, record and report form, with departures D1–D7 and the recommended answers to Q1–Q4. The named version is not saved yet, and building the design is not decided.
