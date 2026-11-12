---
title: Phone items and motion timings confirmed in PPO - Library
date: 2026-11-12
---

On 12 November 2026 Dean said: "Confirm Ph1–Ph7 as recommended and the motion timings". Both sets were proposals in the private Figma file "PPO - Library".

- **Phone items.** Ph1 to Ph7 on the Phone page are confirmed as drawn ([Phone record](../decisions/library-phone.md), section 6):
  - how a sheet closes, and a handle on bottom sheets only;
  - list rows of at least 56 px with a title, one line of facts and the state;
  - 48 px buttons in every action bar, with the Service field dock as the one exception;
  - the tab bar on list pages only;
  - toasts above the bar, and an action's result as a line;
  - phone below 768 px;
  - More on a record as an icon that opens a bottom sheet.
- **Motion timings.** `motion/fast` 100 ms, `motion/standard` 200 ms and `motion/slow` 300 ms are confirmed ([audit record](../decisions/library-audit.md), A9). `motion/delay` was already decided.
- **In the library.** The Phone board's card 8, page header and rules, the Read me, the Foundations layout and motion tables and the variable descriptions now say confirmed. No value changed.
- **To align later.** The built application switches to the phone layout at 780 px and opens More on a phone record as a dropdown. Both align at their next reviewed change.

**Checked:** the Phone board's card 8 and the Foundations layout and motion tables were rendered after the change, and each changed text was read back from the file. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.

**Not done:**
- The Phone page is not accepted and the library is not published; every part stays `Status: Proposed`.
- The motion timings have not been judged in a prototype or in code.
- No application code, binding, register or page guide changed.

<!-- decision-index -->
[Phone · Lists, sheets and bars in PPO - Library](../decisions/library-phone.md) (PPO-LIBRARY-PHONE-PROP) now records Dean's confirmation of 12 November 2026 of its seven items Ph1 to Ph7, and the [library audit](../decisions/library-audit.md) (PPO-LIBRARY-AUDIT-DEC) his confirmation of the motion timings of 100, 200 and 300 ms. Neither accepts a page, publishes the library or authorises application code.
