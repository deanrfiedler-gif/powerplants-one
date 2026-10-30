---
title: Knowledge search and article detail DK-04 design accepted
date: 2026-10-30
---

Dean accepted the Figma design for DK-04, knowledge search and article detail, answering "Do you accept DK-04 with D1–D12 and the recommended Q1–Q6 answers?" with "Accept as recommended". The [design decision](../decisions/knowledge-figma-design.md) (PPO-DK04-KNOWLEDGE-FIGMA-DEC) records departures D1–D12 and answers Q1–Q6:
- validation, review and applicability shown separately, in words;
- a five-value context that stays Unknown when a value is not known;
- suspected fixes as hypotheses with no steps, and superseded articles that name their successor and withhold their steps;
- exact revisions in references, links and feedback, with authoring and review left to DK-05;
- a place in the Service rail and More › Shared records, and offline copies on the phone that say when they may be out of date.

Twenty-one icon-free captures with hashes are retained in [knowledge-design-r01](../reference/ui/knowledge/knowledge-design-r01/README.md), and the design register page for `scope:DK-04` cites them. In Figma the nine parts moved to Components, Rail · Service gained a hidden Knowledge item, and the capture copies sit on the Captures page from y = 480,000.

Checked:
- No Font Awesome instance, stray vector or prototype link is left in the capture copies.

Corrected at lock-in:
- The navigation placement frame's More › Shared records excerpt had collapsed to an empty box when Dean accepted, and Claude had wrongly reported screenshotting every frame. The list now shows as D1 and Q3 describe; the decision record and notes card state this.

Not done:
- The named Figma version "Knowledge — accepted" waits for Dean.
- The prototype flows were not played in Present mode.
- `/knowledge` is not built, and the accepted links on Equipment, My jobs and Job pack are not drawn on those pages.

No application code, route, migration, permission or parent ID changes. No article, step or safety note in the design is a real or validated procedure.

<!-- decision-index -->
[Knowledge search and article detail design](../decisions/knowledge-figma-design.md) (PPO-DK04-KNOWLEDGE-FIGMA-DEC) records Dean's 30 October 2026 acceptance of the DK-04 design: search against an exact unit's five values, three separate statuses in words, hypotheses and superseded advice kept apart from validated procedures, exact revisions throughout and saved offline copies that say when they may be out of date. Authoring and review stay with DK-05. Building it is not decided.
