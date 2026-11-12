---
document_id: PPO-LIBRARY-PLAY-PROP
date: 2026-11-12
owner: Dean Fiedler
status: Three playable example flows drawn in the private Figma file "PPO - Library" on 12 November 2026 under the library audit's direction B4; examples only, built from Proposed parts; not played in Present; nothing published from the library; no application code, route, migration, permission or deployment; every record shown is synthetic
versioning: git
---

# Play · Three flows in PPO - Library — proposal

**Owner:** Dean Fiedler · **Date:** 12 November 2026 · **Status:** Proposed examples. They add no rule and no part.

The [library audit](library-audit.md) found few playable parts in the library, and Dean agreed direction B4: after the Phone page, wire three flows. On 12 November 2026, asked for the next step, Claude listed the flows next in the agreed order and Dean answered: "I confirm that you can proceed however you believe is the most professional." This record covers the page that holds them, named "Play · Three flows".

The flows let the confirmed [motion timings](library-audit.md) be judged in use, which the audit left open. They are examples made of library parts. They are not components and are not published.

## 1. Sources

| Source | Use |
|---|---|
| [Record page](library-record.md), cards 1 and 7 | The synthetic lead page and the 480 px edit drawer |
| [Forms page](library-forms.md), Form / Save bar | Disabled, Ready, Saving and Uncertain |
| [States page](library-states.md), State / Outcome banner | Unknown, Checking and Saved (S1) |
| [Board page](library-board.md), card 6 | The Deals board with flow headers, the target stage and the drop bar (B8 to B10) |
| [Controls page](library-controls.md) | Toast, buttons and fields |
| [Library audit](library-audit.md), A9 | `motion/fast` 100 ms, `motion/standard` 200 ms, `motion/slow` 300 ms, confirmed 12 November 2026 |

## 2. What was drawn

**Page** "Play · Three flows" `284:37`, after the Phone page. An "About this page" card `284:38` says how to play it.

| Flow | Frames | What it shows |
|---|---|---|
| 1 · Edit a record section and save | A1 `284:237`, A2 `284:350`, A3 `284:452`, A4 `284:547`, A5 `284:660` | Edit on Summary opens the drawer; Save is unavailable until the owner changes; Save, saving, then saved with a toast and the new owner in the section |
| 2 · A save with an unknown outcome | B1 `284:1381`, B2 `284:1475`, B3 `284:1578`, B4 `284:1685`, B5 `284:1788` | Save, saving, then Outcome unknown in the save bar and in a banner under the header; Check the outcome; confirmed saved |
| 3 · Move a card to another stage | C1 `285:2315`, C2 `285:2602`, C2b `285:2684`, C3 `285:2838`, C4 `285:3091` | Drag a deal; the target stage turns green and the drop bar appears; holding the card over Lost highlights it; release over Scoping; saving; saved with Undo |

**Links.** Twenty-one prototype links, each on a see-through hotspot over the control it stands for, or on the frame for a timed step.

| Step | Trigger | Transition |
|---|---|---|
| A state change: a field changes, Save is pressed, a card is held over a command | Click, or pointer entering and leaving | 100 ms |
| The drawer opens; the card is lifted and the drop bar appears | Click; drag | 200 ms |
| The drawer closes; the card settles in its stage; Undo returns it | Click; timed | 300 ms |
| Waiting on the server | Timed, 0.9 s | Then 200 or 300 ms |

**Changed elsewhere**
- **Board page, card 6.** The lifted deal in the example is now "Propagation irrigation upgrade" (A$38,500), a Discovery deal, so the stage totals add up when it moves. It was a A$210,000 deal, more than its stage's total.
- **Read me.** The page index and the notes on what is here.

## 3. Not done and open

- **Not played.** The links were read back by script: each has the trigger, target and timing in the table. The flows have not been played in Present, which the connector cannot do. Whether the drag and the timings feel right is for Dean to judge by playing them.
- **Release after a drag.** A Figma prototype ends a drag when the pointer is released, so flow 3 asks for a click on the green stage to stand for the release.
- **One path each.** The flows show the expected path. Refusals, validation errors, "not saved" and Cancel with unsaved changes are on the Forms, States and Board pages, not played here.
- **No keyboard or phone.** The flows are pointer-only at desktop width.
- **Motion.** The timings are the confirmed numbers. They can change if playing the flows shows they should.
- **Code.** No application code, component binding, register or page guide changed. No variable was added.

## 4. Checks

- **Rendered and inspected.** The first, changed and last frames of each flow, and the corrected frames.
- **Defects fixed while drawing:**
  - the saved owner did not show in the Summary section on the two "saved" frames;
  - the save bar kept a sentence from the Record page while saving and when the outcome was unknown;
  - the lifted card sat behind the drop bar, then covered the Lost box's wording.
- **Links read back.** All twenty-one links were read from the file with their trigger, target frame and transition.
- **Structural read of the page** (about 4,170 nodes). Outside instances it found no solid fill or stroke without a variable, no text without a text style and no default layer name.
- **Repository checks for this change:** `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.
