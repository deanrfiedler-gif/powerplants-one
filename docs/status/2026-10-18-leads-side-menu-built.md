---
title: Leads side menu built
date: 2026-10-18
---

The Leads page now draws the side menu Dean accepted on 11 October ([Leads design](../decisions/leads-design.md) L1/L2, Figma `190:20519`) on the shared secondary menu: Inbox and My leads; Status: New, Contacting, Nurturing; Follow-up: Overdue, Next action needed; Other views: Archived, Disqualified, Converted, each with its icon and a full-match count. Every view is an existing list read and every count a key of the existing counts read; no rule, migration or capability is added. The icon tabs are gone and Status leaves the Filters menu. The [implementation record](../decisions/leads-side-menu-implementation.md) maps each row to its read. Built on a branch stacked on the rail and menu alignment; the toolbar, columns, record window and rail badge are unchanged, and owner visual review of the application is pending. Work orders and Engineering workload follow separately.

<!-- decision-index -->
[Leads side menu built on the shared secondary menu](../decisions/leads-side-menu-implementation.md) (PPO-CRM-LEADS-SIDE-MENU-IMPL) records the 18 October 2026 build of the accepted Leads side menu, mapping each drawn view to an existing Leads read and count, with what is still the earlier page.
