---
title: Forms page drawn in PPO - Library
date: 2026-11-10
---

After the Gantt page, Dean asked whether anything else belonged in the private Figma file "PPO - Library". The answer named the groups the design-to-build standard requires and the library lacked (forms, states, record, phone patterns, and the shell with the page template) and recommended forms first. Dean answered: "Proceed however you believe is the most professional." The [proposal record](../decisions/library-forms.md) (PPO-LIBRARY-FORMS-PROP) lists what was drawn.

- **Forms page.** A page named "Forms · Fields and validation" brings the accepted Create forms pattern into the library as shared parts, with the rules every form uses for fields, choices, dates, validation, checking before creating, saving and leaving.
- **Parts.** Ten `Status: Proposed` form parts: Section header, Error summary, Review row, Match card, Choice, Option, Option list, Day, Date picker and Save bar.
- **Controls changed.** Controls / Field gains a Date type, the requirement in words instead of an asterisk, a hint under the label and values that wrap. Controls / Banner wraps its message and can hide its close button. Controls / Radio is new. Two chevron icons were added.
- **Review board.** Ten cards: anatomy, fields, choosing a value, dates and times, check before creating, validation, saving and leaving, sizes and layouts, Do and Don't, and the values.
- **Variables and styles.** A Touch mode on "Control size", two typography variables, three form variables, and the Text / Control and Text / Section label styles. The library now holds 118 variables; [`docs/design/library-variables.json`](../design/library-variables.json) is updated.
- **To confirm.** Six items need Dean's decision: 36 px fields on desktop with a 44 px Touch size, the requirement in words, the hint under the label, the radio and choices, the date picker, and when Save is disabled.

**Checked:** the components and every card were rendered and inspected, drawing defects found on the way were fixed, and two earlier pages that use the changed Field and Banner were re-rendered. A structural read found no solid fill or stroke without a variable, no text without a text style, no shadow without an effect style and no plain corner radius. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.

**Not done:**
- No page is accepted and the library is not published.
- No prototype links were set on the Form parts.
- The frozen "PPO - Design" file and the built forms are unchanged.
- No application code, binding, register or page guide changed.

Every record shown is synthetic. File links are not recorded here (ADR-0050, ADR-0053).

<!-- decision-index -->
[Forms · Fields and validation in PPO - Library](../decisions/library-forms.md) (PPO-LIBRARY-FORMS-PROP) records the shared form parts and rules drawn in the private library file on 10 November 2026 from the accepted Create forms pattern, the changes to Controls / Field and Banner, the new radio, Touch size and date picker, and six items for Dean to confirm. It authorises no application code, route, migration, permission or deployment; all data is synthetic.
