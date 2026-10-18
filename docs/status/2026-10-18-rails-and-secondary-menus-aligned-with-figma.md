---
title: Rails and secondary menus aligned with Figma
date: 2026-10-18
---

Dean asked for the left rails and secondary menus to match the Figma designs and for the search box in the secondary menu to be removed. The [decision](../decisions/shell-rail-menu-figma-alignment.md) records the Figma components and values. The rail toggle is a plain row again; the collapsed rail, the grouped Service rail and the department heading now match the drawn rails; the labelled Sales rail reads "Estimating handovers" (Dean, 11 October). `SecondaryMenuFrame` defaults to the Figma menu, so My Work, Engineering, Acceptance, Facilities, Products and the ES-08 lists share it; Job Pack and the Projects register keep their accepted menus. The More panel has no search box, Workspace dropdown or footer (Dean chose removal of the last two the same day); its Workspaces links choose the department. Still different: some menu contents (Products filters, ES-08 back link), pages whose drawn menu is not built (Leads, Work orders, Engineering workload), and rail count badges. Built on a branch for review; CI, owner visual review and deployment are separate. No migration, permission, route or parent ID changes.

<!-- decision-index -->
[Rails and secondary menus aligned with Figma](../decisions/shell-rail-menu-figma-alignment.md) (PPO-SHELL-RAIL-MENU-FIGMA-DEC) records Dean's 18 October 2026 instruction to align the application's rails and secondary menus with the Shell v2 components in Figma and to remove the More panel's search, with the Figma values used and what still differs.
