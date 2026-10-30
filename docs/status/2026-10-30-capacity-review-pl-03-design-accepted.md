---
title: Capacity review PL-03 design accepted
date: 2026-10-30
---

Dean accepted the Figma design for Capacity review (PL-03, `/schedule/capacity`) on 30 October 2026. Asked "Do you accept the PL-03 design with the recommended answers?", he answered "Accept as recommended". The [decision](../decisions/capacity-review-figma-design.md) (PPO-PL03-CAPACITY-REVIEW-FIGMA-DEC) records it, and the [retained captures](../reference/ui/service/capacity-review-design-r01/README.md) are eighteen icon-free PNGs with hashes.
- **Design.** A capacity grid of people by week or by day, in hours and words, with Demand list and Skill view tabs, analysis that is never saved, and hand-offs to the planner (PL-01) and Changes & follow-up (PL-04). The page books nothing.
- **Recommendations adopted.** Weekly by default; hours, never percent; each domain's read scope decides what is shown; over-capacity only from known hours on a day.
- **Rule change.** [PPO-SCHED-ADR](../decisions/scheduling-resources-architecture.md) now accepts owner-supplied project effort and workshop planned step hours as known hours. This is a design rule; no source field exists yet.

The named Figma version "Capacity review — accepted" is still to be saved. The page is not built in this form and building it is not decided; the app still shows the built page. The images are design compositions with synthetic data, not application captures, and set no UI baseline. No code, route, migration, permission, capability or parent ID changes.

<!-- decision-index -->
[Capacity review design — owner decision](../decisions/capacity-review-figma-design.md) (PPO-PL03-CAPACITY-REVIEW-FIGMA-DEC) records Dean's 30 October 2026 acceptance of the PL-03 Figma design for `/schedule/capacity`: a capacity grid in hours and words, Demand list, Skill view and analysis that is never saved, with PPO-SCHED-ADR amended to accept owner-supplied project effort and workshop step hours. Building it is not decided.
