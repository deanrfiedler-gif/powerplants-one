---
title: PPO daily workspace and MYOB book of record
date: 2026-10-19
---

Dean adopted a direction for all modules: "Yes, record the wider direction: PPO is the day-to-day workspace for all modules and MYOB Acumatica is the book of record, with the integration principles you recommended, as its own decision record." The [direction record](../decisions/ppo-workspace-myob-book-of-record.md) (PPO-ERP-OPERATING-MODEL-DEC) keeps the existing authority split (ADR-0048, ADR-0049) and sets ten integration principles (EI-1 to EI-10). They cover one owner per item of data, master data entered once in PPO, finished business events sent to MYOB, approval before posting and correction by reversal, retry-safe sends with visible states, daily reconciliation, supported Acumatica interfaces only, least privilege, and a read-only start. MYOB subscription savings are to be confirmed with the MYOB partner before being counted.

Not done: no integration technology is chosen, and no adapter, endpoint, credential, migration or production connection is added. The Acumatica tenant contract (DEC-CCE-10) remains open.

<!-- decision-index -->
[PPO as the daily workspace, MYOB Acumatica as the book of record](../decisions/ppo-workspace-myob-book-of-record.md) (PPO-ERP-OPERATING-MODEL-DEC) records Dean's 19 October 2026 direction that staff do day-to-day work in PPO across all modules while MYOB Acumatica stays the book of record, with integration principles EI-1 to EI-10; integration technology and the tenant contract remain open.
