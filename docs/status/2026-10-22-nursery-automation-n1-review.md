---
title: Nursery Automation N1 independent review corrections
date: 2026-10-22
---

PR #662's separate gpt-6-astra review identified transient-refresh draft/recovery loss and historical views displaying current Discovery attributes. A follow-up identified editing an explicitly selected latest history revision as another recovery edge. The correction preserves transient working state under current authority, separates saved source context from successor editing, and makes explicit history selections read-only. The live page contract and guide explain these behaviours.

The extended history database proof passed with the existing structured-configuration contract preserved; the other two Nursery database cases passed. New desktop/phone regression coverage exercises refresh failures during editing and uncertain-save recovery, source-system removal and explicit history views. [Execution evidence](../testing/evidence/nursery-automation-n1/README.md) distinguishes initial captures from the correction; final independent re-review, current-head browser/build and all CI gates are recorded in PR #662 before merge. Supplier/owner acceptance and N2–N4 remain separate and are not granted by code review.
