---
title: Field team design accepted
date: 2026-10-18
---

Dean accepted the Figma design for the PL-02 register and person page (`/service/technicians`, `/service/technicians/[id]`): "I accept the Field team PL-02 design with your recommendations, including D1–D8 and Q1–Q5". The [decision](../decisions/field-team-figma-design.md) records it as the named Figma version "Field team — accepted", and the [retained captures](../reference/ui/service/field-team-design-r01/README.md) are ten icon-free PNGs with hashes.
- The register uses the Work orders grid, with Technicians (default), Visits and Needs preparation in the side menu, the planner's people visuals and the large snapshot.
- The person page is one scrolling page on the Work order record layout: an Evidence bar, seven-day availability tracks, competence with the built `competenceState` words and a read-only evidence panel, and upcoming visits. Nothing is edited there.
- The Conversations action sits left of the information icon on every frame, as Dean asked; it stays part of the proposed top-bar shell amendment.
- Build prerequisites: a published role, a booked-hours read on the planner's rule, a per-person competence summary and a person filter in the Field team URL.

This is a design decision only. No code, route, migration, permission or capability changes. No device, accessibility or operational review is recorded.

<!-- decision-index -->
[Field team design — owner decision](../decisions/field-team-figma-design.md): the PL-02 register (`/service/technicians`) and read-only person page (`/service/technicians/[id]`), drawn in Figma on the accepted Service review register, the Work order record layout and the Service planner people rows. Audited, polished and accepted on 18 October 2026 ("I accept the Field team PL-02 design with your recommendations, including D1–D8 and Q1–Q5") as the named version "Field team — accepted". Grid register with Technicians, Visits and Needs preparation in the side menu, the planner's people visuals and the large snapshot. The person page is one scrolling page with seven-day availability, competence evidence in a read-only panel and upcoming visits; nothing is edited there. Ten icon-free captures are retained. Building the page is not decided.
