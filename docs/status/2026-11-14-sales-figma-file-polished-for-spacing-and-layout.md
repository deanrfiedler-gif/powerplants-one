---
title: Sales Figma file polished for spacing and layout
date: 2026-11-14
---

Dean asked for "PPO - Sales module (accepted)" to be polished so every element looks professional, starting from the Deal record's signals strip, which touched the bottom of the header band. The pass followed the alignment batch the same day and is recorded in section 16 of the [Sales refined UI proposal](../decisions/sales-module-refined-ui-proposal.md#16-polish-pass--14-november-2026). The header band now has 12 px below the strip on all 20 Deal and Lead record sheets. Tables, columns, toolbars, dialog headers, calendars, phone and tablet edges now sit inside their containers, and text that ran past its container is truncated or wraps. Three KPI meta lines were reworded to fit their tiles. No sheet was added or removed and no node ID cited earlier changed.

Checked: a read-only scan of the nine scope pages before and after the fixes, five read-only reviews by eye covering every sheet, and renders of the changed parts. The re-scan finds no text past its container's padding apart from one 2 px type sample. `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py` were run for this record.

Not done or open: keyboard, screen-reader and touch behaviour cannot be tested in a static file. The tablet rail cuts More above Settings, which is shell chrome for PPO - Shell. TB13's next-activity time still truncates, and two borderless footer buttons keep their padding. Dean saves "PPO - Sales module (accepted) · alignment batch" after this pass, so it pins it too. A different session's check of the changed sheets is still pending.
