---
title: Chrome 156 compatibility maintenance
date: 2026-10-21
---

Dean authorised separate runtime maintenance PR #643 after Sites #640's CI began installing Chrome `156.0.8078.47` and rejecting it before application tests. The refusal reproduced on unchanged main `4c1097cc`. PR #630 subsequently merged the same browser repair into main at `f6d2cc7a`; #643 preserves that implementation and its tests, and now retains the parallel verification history only. Sites #640 can receive the fix directly from main. The [browser maintenance record](../decisions/browser-runtime-maintenance.md) distinguishes exact-source browser/PDF and CI evidence from the reconciled documentation checks. No deployment, database change or business transaction was performed by this repair session.
