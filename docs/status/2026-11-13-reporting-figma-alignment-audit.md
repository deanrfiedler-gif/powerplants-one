---
title: Reporting module Figma file audited for alignment
date: 2026-11-13
---

Dean asked for an audit of the Reporting module's private Figma file, "PPO - Reporting module" (a proposal). The audit tests the file against the accepted shell, the shared addenda as the records quote them, its own record, PPO - Library and the other module records, so that the next build session for the file has one ordered batch of fixes. The [audit record](../decisions/reporting-figma-alignment-audit.md) (PPO-REPORTING-FIGMA-AUDIT) lists 21 findings: 0 Blocker, 8 Major, 10 Minor and 3 Polish. The file is structurally sound. All 221 recorded sheets resolve and sit on the grid with correct labels, nothing overlaps, and the shell chrome is instanced. The Major findings are:
- the same state word drawn in different tones;
- a good-or-bad colour on an ageing band;
- single-digit revisions where Addendum A2 needs r01;
- 2,271 chart paints with no colour variable behind them;
- a docked menu copied by hand onto 90 sheets;
- a policy shown as published 40 minutes after the story time;
- Reporting settings with no owner or menu row;
- five recorded story conflicts still open.

Six questions are for Dean, among them how the Library's drawer widths and chip meanings apply to Reporting.

Checked: the audit read all 16 pages of the file and changed nothing in Figma. Its analysis is reproducible from per-page extracts. `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py` pass. No other record, the design register, any application code, route, migration or permission changed. Acceptance and every fix are Dean's or the build session's.

<!-- decision-index -->
[Reporting module Figma file alignment audit](../decisions/reporting-figma-alignment-audit.md) (PPO-REPORTING-FIGMA-AUDIT) records a read-only audit of the private Figma file "PPO - Reporting module" on 13 November 2026 against the accepted shell, PPO - Library and the module records. It lists 21 findings with fix owners, the check matrix and six questions for Dean. It changes no design, accepts nothing and authorises no application code or deployment.
