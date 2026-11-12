---
title: Shell Figma file independently reviewed; a demo-chip contrast failure, wrong weekdays and a stale Riverbend story found in the accepted file
date: 2026-11-12
---

Dean asked for an audit of the accepted Shell UI in Figma, with the cross-file alignment audit prompt and the UI/UX conformance audit of 10 November 2026 as aids. The [review record](../decisions/shell-independent-review.md) (PPO-SHELL-REVIEW-PROP) holds the findings. It was read-only: nothing was changed in Figma, and the accepted design and both named versions stand until Dean saves a new one.

- **Holds.** The grid, labels and bounds on all three pages; the seven bar actions and six strip tabs; the 480 px drawer, which matches the Library's standard width; the record header toolbar against R116 to R125; the menu page totals; Roboto only; colour bound to variables outside the documented exceptions; and every node ID the decision record cites.
- **Blockers.** The demo tenant chip puts navy text on dark amber at 2.16 : 1; five weekday labels are wrong, one inside the Account menu component; and the Riverbend deal, site and contact role contradict the one truth the accepted Sales record fixed, which the Shell's own toolbar sheet already follows.
- **Majors.** Priya Nair is cast as the Service technician; 10 px text sits outside the C6 scale in the bar, rails, drawers and dialogs; an undocumented `action/primary` variable is indistinguishable from `status/success`; 23 of the 25 workspace menus, the record-context drawer tabs and the narrow bars exist only as detached frames; the drawn rules cards and the repository export differ; `accent/estimating-ink` differs from the accepted Estimating file; and ten menu references are outside the short form.
- **Questions.** Nine, Q-A to Q-I, from which rules text governs to the PPO adaptation of the candidate `REQ-SHELL-001`.

Checked: the three pages walked through the connector (about 13,800 nodes on the shell page, the Components section and the toolbar page, every node of the 25 menu sheets, about 3,800 texts) and the 67 variables read; sheet T rendered; `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`. Not done: version history, prototype flows, addenda A1 to A3, and the Library, Sales and Estimating files; keyboard, focus and hit areas cannot be proved in a static file. No application code, binding, register, page guide or other record changed.

<!-- decision-index -->
[PPO - Shell independent review](../decisions/shell-independent-review.md) (PPO-SHELL-REVIEW-PROP) records a read-only audit of the accepted Shell Figma file on 12 November 2026: 22 findings (SR-01 to SR-22; three Blockers, eight Majors, nine Minors, two Polish) from a demo-chip contrast failure and stale facts to menus that are not components and rules text that differs from its export, a reading against the Version 3.0 conformance audit, and nine questions for Dean. It changes and accepts no design and authorises no application code or deployment.
