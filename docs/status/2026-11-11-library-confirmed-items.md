---
title: Gantt, Forms and States items confirmed in PPO - Library
date: 2026-11-11
---

Dean asked for a professional recommendation on each of the sixteen open items on the Gantt, Forms and States pages of the private Figma file "PPO - Library". The answer recommended confirming all sixteen as drawn, with three refinements. On 11 November 2026 he answered: "Confirm all sixteen as recommended, with the refinements".

- **Gantt.** G1 to G5 confirmed as drawn: violet Today on a Gantt only, 40 px rows, the Attention icon on At risk and Conflict bars, whole-day snap, and a drop that opens the task panel ([record](../decisions/library-gantt.md), section 6). The built ProjectsGantt's 38 px rows move to 40 px in a later reviewed change.
- **Forms.** F1 to F6 confirmed as drawn: 36 px fields on desktop with 44 px and 16 px text in Touch, the requirement in words, the hint under the label, radio and choices, the date picker, and Save disabled only when nothing could be saved ([record](../decisions/library-forms.md), section 6). F4 refinement: the frozen file's accepted Choice option part is compared with Form / Choice the next time that file is opened, before either is built.
- **States.** S1 to S5 confirmed as drawn: one "Outcome unknown" wording with forms included, placeholders inside pages, plain empty states, not refreshed, and incomplete ([record](../decisions/library-states.md), section 6). S2 refinement: placeholders appear only after a read has taken about 300 ms. S4 refinement: "Shown as at" names the day when it is not today.
- **Forms save bar.** Because of S1, Form / Save bar's uncertain state takes the Outcome banner with Check the outcome and Retry the same action, replacing Confirm original save. The Forms record's saving rule and values table now say so.

**Checked:** the three records were read back after editing. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.

**Not done:**
- The Figma file is unchanged. On 11 November 2026 the Figma connection refused further edits: the account had reached its daily limit for tool calls, 200 a day on a Professional Full seat. The confirmed items, the S1 save bar, and the S2 and S4 refinements are drawn once the limit allows. Section 7 of each record lists the changes.
- No page is accepted and the library is not published.
- No application code, binding, register or page guide changed.

Every record shown is synthetic. File links are not recorded here (ADR-0050, ADR-0053).
