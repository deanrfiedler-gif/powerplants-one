---
title: Phone page drawn in PPO - Library
date: 2026-11-11
---

After the library audit, Dean said: "Go ahead with the Phone patterns page". Phone patterns were the fourth of the groups the design-to-build standard requires and the private Figma file "PPO - Library" lacked. The [proposal record](../decisions/library-phone.md) (PPO-LIBRARY-PHONE-PROP) lists what was drawn.

- **Phone page.** A page named "Phone · Lists, sheets and bars" holds the parts every page shares below 768 px. Its rules come from three accepted decisions: the phone header amendment, the phone register patterns amendment and the phone tab bar decision, with the shell's phone rules.
- **Parts.** Eight `Status: Proposed` parts: Header, Status line, Tab bar, List row, Selection bar, Menu row, Sheet and Action bar. Five icons were added (Menu, Chat, Home, Person and Deal) and one text style, Text / 11 Regular, for tab labels that are not current.
- **Review board.** Eight cards:
  - anatomy;
  - header and status line;
  - tab bar and menu;
  - lists, views, filters and selection;
  - sheets;
  - action bars;
  - Do and Don't;
  - the values.
- **Variables.** `phone/width`, `phone/header-height`, `phone/tab-bar-height` and `phone/row-min-height`. The library now holds 138 variables; [`docs/design/library-variables.json`](../design/library-variables.json) is updated.
- **Audit items closed.** Controls / Dialog now comes in the two dialog widths, and the Record page's card 7 places the Drawer component.
- **To confirm.** Seven items need Dean's decision:
  - how a sheet closes;
  - the list row's height and contents;
  - 48 px action bars, with the field dock as the exception;
  - the tab bar on list pages only;
  - toasts above the bar, and results as a line;
  - phone starting below 768 px;
  - More on a record as an icon that opens a sheet.

**Checked:** every component and card was rendered and inspected, and drawing defects found on the way were fixed. A structural read of the page found no text without a text style, no shadow without an effect style, no default layer name and no component without a status line. Variables and text styles were read back from the file. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.

**Not done:**
- No page is accepted and the library is not published.
- The open phone menu, notifications and Quick add wait for the shell move.
- No prototype links were set, and nothing was tried on a phone.
- The accepted phone sheets and the built phone pages are unchanged.
- No application code, binding, register or page guide changed.

Every record shown is synthetic. File links are not recorded here (ADR-0050, ADR-0053).

<!-- decision-index -->
[Phone · Lists, sheets and bars in PPO - Library](../decisions/library-phone.md) (PPO-LIBRARY-PHONE-PROP) records the shared phone parts drawn in the private library file on 11 November 2026 from the phone header amendment, the phone register patterns amendment, the phone tab bar decision and the shell's phone rules: the header row, status line, tab bar, list rows, selection, sheets and action bars. It lists seven items for Dean to confirm. It authorises no application code, route, migration, permission or deployment; all data is synthetic.
