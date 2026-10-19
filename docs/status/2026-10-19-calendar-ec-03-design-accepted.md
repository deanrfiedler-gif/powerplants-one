---
title: Calendar EC-03 design accepted
date: 2026-10-19
---

Dean accepted the Figma design for EC-03, the calendar at `/calendar` (the Sales rail's "Activities"), after an audit and polish and a run of both prototype flows: "I accept the Calendar EC-03 design with your recommendations, including D1–D8 and Q1–Q5." The [design decision](../decisions/calendar-figma-design.md) (PPO-EC03-CALENDAR-FIGMA-DEC) records departures D1–D8 and answers Q1–Q5: team availability built after the read-only Microsoft pilot behind its own permission, no Outlook write from Plan follow-up until a calendar-write stage is approved, owner-only meeting links as on Emails, a narrow "Needs a next step" rule, and the compact phone header decided once for every phone page. Eighteen icon-free captures with hashes are retained in [calendar-design-r01](../reference/ui/email-calendar/calendar-design-r01/README.md). The design register pages for `route:/calendar` and `scope:EC-03` cite the frames and captures. In Figma the File index has a Calendar row after Emails, the capture copies sit on the Captures page from y = 280,000, and the Calendar parts moved to Components › Sales parts.

Checked: no Font Awesome instance or stray vector is left in the capture copies, no text colour differs from its bound variable, and no copy carries a prototype link or flow start. The named Figma version "Calendar — accepted" was saved at Dean's "Yes, save the named Figma version "Calendar — accepted"." Not done: the page is not built, and the built Day and Agenda calendar is unchanged. No application code, route, migration, permission or parent ID changes.

<!-- decision-index -->
[Calendar design](../decisions/calendar-figma-design.md) (PPO-EC03-CALENDAR-FIGMA-DEC) records Dean's 19 October 2026 acceptance of the EC-03 design: a Week view with a Due lane so PPO activities never book time, a read-only meeting panel with attendees, links, overlap, source and zone, Plan follow-up, a To do list, free-or-busy team availability, sync states, and phone views with the compact header. Building it is not decided.
