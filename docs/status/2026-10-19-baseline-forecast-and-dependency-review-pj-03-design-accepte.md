---
title: Baseline, forecast and dependency review PJ-03 design accepted
date: 2026-10-19
---

Dean accepted the Figma design for PJ-03, baseline, forecast and dependency review, after an audit and a run of both prototype flows in Present mode: "I accept the Baseline, forecast and dependency review PJ-03 design with your recommendations, including D1–D11 and Q1–Q8. Lock it in." The design extends the Schedule and Baselines views of `/projects/[id]` and the Programme at `/projects/programme`, with no new route.

The [design decision](../decisions/baseline-forecast-figma-design.md) (PPO-PJ03-BASELINE-FORECAST-FIGMA-DEC) records departures D1–D11:
- baseline bars and "+nd" slip labels as a Gantt Display option;
- calendar-day and working-day counts, each naming its calendar;
- a working-calendar drawer that only the coordinator can change;
- an Actual dates tab and an inline dependency check in the task panel;
- nonworking shading from the saved calendar;
- the Programme against latest baselines;
- the reason for each move;
- a prompt that asks successor owners to review (My Work activities);
- a hand-off to a PJ-08 customer-update draft.

It also records the answers to Q1–Q8, including calendar days first, today's calendar for working-day counts, and the coordinator only for the calendar.

Sixteen icon-free captures with hashes are retained in [baseline-forecast-design-r01](../reference/ui/projects/baseline-forecast-design-r01/README.md). The design register pages for `scope:PJ-03` and `route:/projects/programme` cite them. In Figma the File index has a PJ-03 row after the Project record page, and the capture copies sit on the Captures page at y = 320,000.

Checked: no Font Awesome instance is left in the capture copies (393 swapped), and no copy carries a prototype link or flow start.

Not done:
- The named Figma version "Baseline, forecast and dependency review — accepted" waits for Dean's yes.
- The page is not built.
- D9–D11 need their own reads or handovers.
- No application code, route, migration, permission or parent ID changes.

<!-- decision-index -->
[Baseline, forecast and dependency review design](../decisions/baseline-forecast-figma-design.md) (PPO-PJ03-BASELINE-FORECAST-FIGMA-DEC) records Dean's 19 October 2026 acceptance of the PJ-03 design: baseline bars and slip labels on the Gantt, a task panel for forecast changes and actual dates, calendar-day and working-day counts that name their calendar, the reason for each move, a working-calendar drawer, the Programme against latest baselines, owner review prompts and a customer-update hand-off. Building it is not decided.
