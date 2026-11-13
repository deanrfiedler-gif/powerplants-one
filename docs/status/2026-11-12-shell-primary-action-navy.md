---
title: Shell primary action returned to navy; awaits Dean's acceptance
date: 2026-11-12
---

Dean chose navy for the primary action the same evening as the green contrast fix: Q-B on PR #931, set out in a [DEAN] comment on PR #923 and confirmed in the session. In the private Figma file "PPO - Shell", the five primary button fills in Shell / Record header · toolbar now use brand/navy, as rule D35 already says. The `action/primary` variable added earlier that day is deleted, so the PPO colour collection holds 66 variables again, as R15 states. brand/green-deep's description now says primary buttons use brand/navy.

White on brand/navy `#242a37` measures 14.37:1 at rest. Under Library C1, which is unchanged, it measures 9.79:1 on hover and 6.59:1 pressed. The earlier recommendation to darken Primary on hover and pressed is withdrawn. The [shell decision record section 13](../decisions/shell-refined-concept-design.md#13-primary-action-returned-to-navy--12-november-2026) records the change, and section 12 stays as the record of the green change. The file's link and key are not recorded (ADR-0050, ADR-0053).

Checked through the Figma connector:

- all five fills are bound to brand/navy;
- renders sample `#242a37` on every primary;
- no node on the three pages is bound to `action/primary`;
- the file has 66 local colour variables.

Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_foundation.py`, `python3 scripts/check_naming.py` and `npm run studio:check`.

Not done:

- Dean's acceptance in words and a new named version (suggested: "Shell refined concept — accepted · navy primary action").
- The module files' copies of the green primary, which move to brand/navy in each file's next reviewed change (AF-001, PR #925).
- Any application code. The built S1 stylesheet already defines `--ppo-refined-brand-navy`, so no new token is needed.
