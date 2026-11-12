---
title: Shell primary action colour raised to pass contrast, accepted and saved as a named version
date: 2026-11-12
---

At Dean's instruction, the private Figma file "PPO - Shell (accepted)" has a new colour variable, action/primary (`#2d7128`, CSS name `--ppo-refined-action-primary`). The five primary button fills in Shell / Record header · toolbar now use it in place of brand/green-deep. White on the old fill measured 3.57:1, below the 4.5:1 of WCAG 1.4.3 (audit finding AF-001, PR #920). The new pair measures 5.99:1. brand/green-deep keeps its value and its marker role, and its description now says it is never a fill behind text.

Dean accepted the change the same day and saved the named version, recorded as "Shell refined concept — accepted · primary action contrast". Builds that use the shell and start after 12 November 2026 cite it. The [shell decision record section 12](../decisions/shell-refined-concept-design.md#12-primary-action-colour--12-november-2026) records the nodes changed, the alternatives weighed, the acceptance and the follow-ups, and the [rules export](../design/development/systems/shell-refined-concept-rules.md) notes the change. The file's link and key are not recorded (ADR-0050, ADR-0053).

Checked: through the Figma connector, all five fills are bound to the new variable, and renders sample `#2d7128` on every primary. No text sits on brand/green-deep on the shell or toolbar pages. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_foundation.py`, `python3 scripts/check_naming.py` and `npm run studio:check`.

Not checked: the named version's title, which this session cannot read; it rests on Dean's word.

Not done:

- The module files' local copies (102 occurrences in AF-001), which change with each file's next reviewed change.
- The library's hover and pressed rule C1, which no green passes at 24%; recommended to the library session, not decided here.
- Any application code. The token is added by the pull request that builds the record header toolbar.
