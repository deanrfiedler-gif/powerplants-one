---
title: Deals CR-04 remaining CI causes corrected
date: 2026-11-03
---

PR #699 merges main `9d953fed4` without conflicts and corrects the three causes behind seven failed jobs on `6230b4e6f`. The CR-04 database spec now declares its disposable synthetic reset opt-in, phone List rows can grow beyond their 136 px minimum when activity text wraps, and the Views keyboard proof scopes its choices to the open dialog. Both database tests and all existing browser assertions, timeouts and expected values remain.

The hidden phone title was an application defect: the fixed-height flex row held a 2,000-character activity summary, while the title's hidden overflow allowed it to shrink to zero height. The row now grows with its content. The existing 320 px owner-transfer journey remains the regression proof; no accepted decision was used to replace its assertion.

Setup reports PostgreSQL ready and the browser unavailable. With reset variables unset in the invoking shell, the CR-04 source-permission test passes and the issued-quotation test reaches the unavailable renderer (`ExactDraftUnavailable`). Browser specs are **not run here; left to GitHub CI**. The [application evidence](../testing/evidence/deals-cr04/README.md) records the checks and limits. Claude's previous full review and confirmation remain; only confirmation of these three causes and unchanged assertion strength is requested. Dean merges. No migration or deployment is included.
