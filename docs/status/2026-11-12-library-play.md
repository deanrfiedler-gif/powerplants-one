---
title: Three playable flows added to PPO - Library
date: 2026-11-12
---

The library audit found few playable parts in the private Figma file "PPO - Library", and Dean agreed to three flows after the Phone page. On 12 November 2026 he said: "I confirm that you can proceed however you believe is the most professional." The [Play record](../decisions/library-play.md) (PPO-LIBRARY-PLAY-PROP) lists what was drawn.

- **Page.** "Play · Three flows", with a card that says how to play it.
- **Flow 1.** Edit a record section and save: the drawer opens, Save is unavailable until something changes, then saving and saved.
- **Flow 2.** A save with an unknown outcome: Outcome unknown in the save bar and a banner, Check the outcome, then confirmed saved.
- **Flow 3.** Move a card to another stage: the target stage turns green, the drop bar appears and highlights under the card, then saving and saved with Undo.
- **Motion.** The links use the confirmed timings of 100, 200 and 300 ms, so they can be judged in use.
- **Also changed.** The lifted deal in the Board page's example is now a A$38,500 Discovery deal, so the stage totals add up.

**Checked:** frames of each flow were rendered and inspected, and drawing defects found on the way were fixed. All twenty-one prototype links were read back from the file with their trigger, target and transition. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.

**Not done:**
- The flows have not been played in Present; the connector cannot do that.
- Each flow shows one path. Refusals, errors and the keyboard and phone routes are not played.
- The flows are examples, not components, and are not published.
- No application code, binding, register or page guide changed.

Every record shown is synthetic. File links are not recorded here (ADR-0050, ADR-0053).

<!-- decision-index -->
[Play · Three flows in PPO - Library](../decisions/library-play.md) (PPO-LIBRARY-PLAY-PROP) records three playable example flows drawn on 12 November 2026 from library parts: editing a record section and saving, a save with an unknown outcome, and moving a card to another stage, wired at the confirmed motion timings. They add no rule and no part, and have not been played in Present. It authorises no application code or deployment.
