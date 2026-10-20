---
title: Chrome 156 compatibility maintenance
date: 2026-10-21
---

Dean authorised separate runtime maintenance PR #643 after Sites #640's CI began installing Chrome `156.0.8078.47` and rejecting it before application tests. The refusal reproduces on unchanged main `4c1097cc`. The [browser maintenance decision](../decisions/browser-runtime-maintenance.md) extends the existing version floor while preserving majors 153–155 and refusing older 156 builds and unreviewed major 157. Boundary tests, actual browser/PDF execution and CI results remain distinct; final-head CI is pending. The existing stable-channel installer and exact dependency packages remain unchanged. No deployment, database change or business transaction is authorised by this repair.
