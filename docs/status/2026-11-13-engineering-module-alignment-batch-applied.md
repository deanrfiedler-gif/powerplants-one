---
title: Engineering module alignment batch applied
date: 2026-11-13
---

Dean answered the Engineering audit's eight questions as it recommended ("I am happy to proceed based on your recommendations"). The audit session then applied the Engineering items of the alignment batch to the Engineering Figma file. The goal is a file that agrees with the accepted Shell, the other module files and its own rules before it is accepted.

The [audit record](../decisions/engineering-figma-alignment-audit.md) (PPO-ENGINEERING-FIGMA-ALIGNMENT-AUDIT, section 8) records:

- the decisions;
- each change with its count;
- what was not applied and why;
- one correction to the audit (TR06's toolbar primary is not blank);
- the verification.

The [Engineering record](../decisions/engineering-module-refined-ui-proposal.md) gains section 11 and narrow corrections to its sources, assumptions, sheet titles and audit table.

The changes in the file:

- **KPI-11** shown for Q4 2026 to date.
- **Instruments** read from the Equipment register.
- **References and dates:** the Block C survey cited as SYN-SRV-000025, the Glasshouse 5 opportunity as SYN-OPP-000344, and the retest date corrected.
- **Story clock:** events after 09:00 moved inside it.
- **Revisions and wording:** two-digit revisions, no gendered pronouns, and "Read only" wording on twelve toolbars.
- **Shell parts:** navy primaries; 48 px phone controls; Settings current on the administration rail.
- **Administration:** AD08 reads the Settings registry, and AD06 records the revision series.
- **Labels and conventions:** labels name the signed-in person; one tone per state word; bound paints; text sizes on the C6 scale.
- **File-level text:** the Read me and kit cite the Shell's latest named versions.

The Shell, Supply, Service, Customers, Sites & Equipment and Settings files were not edited; their items stay in their own batches.

Checked: the audit scans were re-run across all 12 scope pages, and none of the targeted defects remains. Every child is inside its sheet and every label sits on the template grid. Seven changed sheets were screenshotted, and the three faults those screenshots showed were fixed and re-checked. Sheet node IDs are unchanged. Repository checks: `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`.

Not done:

- a named version pinning the aligned state, which is Dean's to save;
- the six-digit instrument numbers, which wait for the Equipment register;
- the drawer widths;
- Library adoption;
- re-copying the Shell's new component sets;
- any keyboard, screen-reader or device review.

No application code, route, migration, permission or integration changed. Every record, person, value and date is synthetic.

<!-- decision-index -->
[Engineering module Figma alignment audit](../decisions/engineering-figma-alignment-audit.md) (PPO-ENGINEERING-FIGMA-ALIGNMENT-AUDIT), section 8, records Dean's answers of 13 November 2026 and the Engineering alignment batch applied to the Engineering Figma file, with its verification; the file remains a proposal and nothing is accepted.
