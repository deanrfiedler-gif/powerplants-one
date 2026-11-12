---
title: States page drawn in PPO - Library
date: 2026-11-10
---

After the Forms page, Dean answered again: "Proceed however you believe is the most professional." States came next of the groups the design-to-build standard requires and the private Figma file "PPO - Library" lacked. The [proposal record](../decisions/library-states.md) (PPO-LIBRARY-STATES-PROP) lists what was drawn.

- **States page.** A page named "States · Loading, empty and errors" gives every page one way to show loading, empty, could not load, unavailable, not refreshed, incomplete, offline, a changed session, and a save whose outcome is unknown. It brings the accepted System pages parts into the library.
- **Parts.** Six `Status: Proposed` parts: Message panel, Outcome banner, Connection banner, Inline notice, Empty and Placeholder.
- **Review board.** Nine cards: choosing the state, loading, empty, could not load and partial data, access, outcome unknown, connection and session, Do and Don't, and the values.
- **Variables and styles.** `state/panel-width` and the Text / 28 Medium and Text / Reference styles. The library now holds 119 variables; [`docs/design/library-variables.json`](../design/library-variables.json) is updated.
- **To confirm.** Five items need Dean's decision. The one with a real conflict is the "Outcome unknown" wording: System pages adopted one wording for every surface, while the Create forms pattern, accepted the same day, kept "Confirm original save". The others are placeholders inside pages, plain empty states, not refreshed, and incomplete.

**Checked:** the components and every card were rendered and inspected. A structural read found no solid fill or stroke without a variable, no text without a text style, no shadow without an effect style and no plain corner radius. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.

**Not done:**
- No page is accepted and the library is not published.
- No prototype links were set on the State parts.
- The frozen System pages design, the Forms page's save bar and the built pages are unchanged.
- No application code, binding, register or page guide changed.

Every record shown is synthetic. File links are not recorded here (ADR-0050, ADR-0053).

<!-- decision-index -->
[States · Loading, empty and errors in PPO - Library](../decisions/library-states.md) (PPO-LIBRARY-STATES-PROP) records the shared loading, empty, error, access, outcome-unknown and connection parts drawn in the private library file on 10 November 2026 from the accepted System pages design, PT-29 and NFR-05, and five items for Dean to confirm. It authorises no application code, route, migration, permission or deployment; all data is synthetic.
