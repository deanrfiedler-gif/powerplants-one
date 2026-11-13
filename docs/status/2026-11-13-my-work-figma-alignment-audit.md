---
title: My Work module Figma file alignment audit
date: 2026-11-13
---

Dean asked for the Figma file of the My Work module UI to be audited, so the proposal can be aligned with the accepted Shell, the Library and the module files that send it work before he reviews and accepts it. The cross-file alignment audit was run read-only over "PPO - My Work module": all eleven scope pages and 139 sheets were checked. The comparison bases were the accepted Shell at its named version of 10 November 2026, the Library's variables and rules, the file's own record and the facts and handovers in the other module records. The [audit record](../decisions/my-work-figma-alignment-audit.md) (PPO-MYWORK-FIGMA-ALIGNMENT-AUDIT) lists 38 findings: 16 Major, 16 Minor and 6 Polish, and no Blocker. The Majors fall into four groups:

- facts received from Service, Projects, Estimating, Finance and the portal that drifted (Ravi Kumar's report-questions item, SYN-MOC-000118, the Hillview motor, Casey Ward's morning, SYN-PRJ-000014, SYN-QUO-000221, SYN-OPP-000318, Jamie Ellis);
- banners and phone headers drawn as frames;
- three unrecorded departures from the Shell (the right strip on the settings sheets, a scrim behind the search dropdown, a green focus ring);
- the toolbar primary's 3.57:1 contrast on AC05, 32 px phone actions and off-scale text sizes.

The record re-tests the cross-file audit's 20 findings for this file and holds twelve questions for Dean. A paste-ready alignment batch for the file's next build session was sent with it. Nothing in any Figma file was changed and nothing is accepted. The file links are not recorded (ADR-0050, ADR-0053).

Checked: 139 of 139 recorded node IDs resolve with matching codes. Read from the files: every page's structure, grid and labels; the local top bar, rail, right strip, collapsed strip, docked menu and phone record header, layer by layer against the accepted Shell; the 66 colour variables against the Library; chip tones, type sizes, unbound paints, phone targets and contrast pairs; text scans for pronouns, revisions, dates, references, people and earlier fixtures. Repository checks for this change: `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`. Not checked: Addendum A3 was not available (its facts were reconstructed from other records' citations); the register standard rule by rule; the other module files' Figma pages (read through their records); keyboard, screen reader, zoom and device reviews; no sheet was rendered. Every record, person, value and date shown is synthetic.

<!-- decision-index -->
[My Work module Figma alignment audit](../decisions/my-work-figma-alignment-audit.md) (PPO-MYWORK-FIGMA-ALIGNMENT-AUDIT) records the read-only audit of 13 November 2026 of the My Work module design file against the accepted Shell, the Library and the other module records: 38 findings (16 Major, 16 Minor, 6 Polish), the alignment matrix, twelve questions for Dean and the alignment batch for the file's next build session. It changes no design and accepts nothing; all data is synthetic.
