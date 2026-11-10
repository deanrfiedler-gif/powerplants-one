---
title: Gantt parts drawn in PPO - Library
date: 2026-11-10
---

Dean asked for the next page after confirming the five Time items ("Confirm all five items as recommended and draw the next page"). The Gantt chart was to be drawn in the Projects file, which another session's open pull request #896 records and which awaits his review. Asked where to draw it, he chose "Library page (Recommended)". The [proposal record](../decisions/library-gantt.md) (PPO-LIBRARY-GANTT-PROP) lists what was drawn.

- **Gantt page.** A page named "Gantt · Bars and links" in the private Figma file "PPO - Library" puts task bars, milestones, phase and baseline bars, dependencies and Today on the Time page's axis. It is the last page in the order Dean accepted.
- **Parts.** Six `Status: Proposed` families: Bar (five statuses by three states), Milestone, Phase bar, Baseline bar, Today line and Dependency. Time / Band gains working and non-working exception kinds.
- **Review board.** Nine cards: anatomy, bars and milestones, dependencies, baselines and moved tasks, calendar and scale, changing dates, states, Do and Don't, and the values.
- **Sources.** Dean's Gantt colour decision of 14 October 2026, the PJ-03 baseline and forecast decisions, and the built ProjectsGantt.
- **Variables.** A new "Gantt colour" collection of eleven, nine carrying the built Gantt's CSS names, and three layout variables. The library now holds 113 variables; [`docs/design/library-variables.json`](../design/library-variables.json) is updated.
- **To confirm.** Five items need Dean's decision: Today stays violet on a Gantt, 40 px rows, the icon on At risk and Conflict bars, whole-day snap, and a drop that opens the task panel.

**Checked:** the components and every card were rendered and inspected, and drawing defects found on the way were fixed. A structural read found no solid fill or stroke without a variable, no text without a text style, no shadow without an effect style and no plain corner radius outside Figma's default section and component-set frames. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.

**Not done:**
- No page is accepted and the library is not published.
- The Projects file and pull request #896 were not touched.
- No prototype links were set on the Gantt parts.
- The built ProjectsGantt is unchanged.
- No application code, binding, register or page guide changed.

Every record shown is synthetic. File links are not recorded here (ADR-0050, ADR-0053).

<!-- decision-index -->
[Gantt · Bars and links in PPO - Library](../decisions/library-gantt.md) (PPO-LIBRARY-GANTT-PROP) records the task bars, milestones, phase and baseline bars, dependencies and Today line drawn in the private library file on 10 November 2026 on the Time page's axis, their sources in Dean's Gantt colour decision, the PJ-03 decisions and the built ProjectsGantt, and five items for Dean to confirm. It authorises no application code, route, migration, permission or deployment; all data is synthetic.
