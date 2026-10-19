---
title: "Conversations T1c-3: the context panel"
date: 2026-10-19
---

T1c-3 of Conversations is built in [PR #600](https://github.com/deanrfiedler-gif/powerplants-one/pull/600). Dean started it on 19 October 2026, in parallel with T1d: "Yes, start T1c-3 (context panel) and T1d (record-page lists, notifications, My Work, reply-by reminders) as two parallel sessions with their own worktrees and PRs."

A thread now has the context panel from the accepted T1 design, without Carl ([T1c design section 11](../decisions/conversations-t1c-design.md#11-t1c-3-the-context-panel)). Its groups are Record, Files and documents, Contacts, Related records and This thread.
- **The read.** `GET /api/v1/conversations/[id]/context` answers only a reader of the thread. It is rebuilt for each viewer from reads PPO already has, and it stores nothing (S5).
- **Documents.** A deal's documents are its quotations, at each revision. A project's documents are the controlled documents linked to it in the document library, at their linked revision.
- **Related records.** These are the projects or work orders delivered from a deal, the deals a project came from, and records linked with `#` in the thread.
- **Reasons and access.** Every item says why it is there. Anything the viewer cannot open is left out, title included. A contact's phone and email show only to a viewer who may read the person.
- **Layout.** The panel is docked at 320 px from 1280 px. Below that it opens from a Context button: a drawer at 1024 px, and a sheet on phones, where the button is icon-only at 320 px.
- **Departures from the frames.** There are no pins, which belong to Carl in T2. The 1280 px docking width, the drawer and the 320 px sheet were not drawn.
- **Not shown.** Purchase orders, service requests and engineering drawings are not shown, because no existing read links them to a deal or project.

No migration, seed, capability, grant or parent ID changes. Nothing is deployed to the hosted demo. CI, owner review and production readiness are separate.
