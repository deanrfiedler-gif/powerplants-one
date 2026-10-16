# CPQ rule editor above “Applies when” — before and after captures

<!-- versioning: git; committed history is authoritative -->

**Date:** 15 October 2026 · **Inspector:** Claude Code (agent visual comparison) · **Owner review:** pending.

These are application captures of `/estimating/rules/[id]`, the implementation evidence for the follow-up in the [alignment decision](../../../decisions/cpq-rule-editor-design-alignment.md). The accepted design they are compared with is frames `486:641` and `488:1029` and the [retained captures 02, 03 and 39](../../../reference/ui/estimating/cpq-figma-design-r01/README.md). They are not design references and not a UI baseline.

- **Before:** the branch of the first alignment (below “Applies when”) at `1d0068d`.
- **After:** this follow-up.
- **How:** both were taken with the same task-local Playwright script against a task-owned development server and a disposable PostgreSQL cluster. That is not Dean's database or :3000.
- **Fixture:** each run creates a new synthetic release from `screenDefinition()`. The Support spacing rule is given three conditions (cable run distance > 0 m, vent type is one of Open / Closed, NOT include installation is false); the release is reviewed, sealed and activated by the synthetic reviewer and publisher. The coordinator then sets Priority to 450 and saves a draft (“saved”). For “incomplete”, condition 1's field is changed to the text fact Shared controller. Times, versions and names come from that saved data.

| State | Viewport | Before | After |
|---|---|---|---|
| Draft saved (frame 486:641) | 1440 × 960 | [before](before-desktop-saved.png) | [after](after-desktop-saved.png) |
| Field changed to a text fact, incomplete (frame 488:1029) | 1440 × 960 | [before](before-desktop-incomplete.png) | [after](after-desktop-incomplete.png) |
| “More rule actions” menu open | 1440 × 960 | — | [after](after-desktop-menu.png) |
| Switch rule dialog | 1440 × 960 | — | [after](after-desktop-switch.png) |
| All scenarios passing, Create version available | 1440 × 960 | — | [after](after-desktop-tested.png) |
| Draft saved (capture 39) | 1024 × 768 | [before](before-tablet-saved.png) | [after](after-tablet-saved.png) |
| Quick test in the Test bench | 1024 × 768 | — | [after](after-tablet-testbench.png) |
| Definition, no draft saved | 390 × 844 | [before](before-phone-definition.png) | [after](after-phone-definition.png) |
| Quick test in the Test bench | 390 × 844 | — | [after](after-phone-testbench.png) |

## What the comparison found

- The 1440 px “after” captures match the frames' structure:
  - context header with “⋯” and save-state dot;
  - Draft / Validation / Tests / Published states;
  - counted tabs;
  - Rule details description;
  - Quick test with chip, scenario note, inputs with units, “33 each”, the substitution, the published comparison and True condition lines, then Run all and the note;
  - draft bar with dot, revision, reason and an unavailable Create version.
- In the incomplete state, the Quick test reads “—”, “No result: condition 1 is incomplete” and “Complete the draft to test it”, and Save draft becomes primary, as frame 488:1029 draws.
- At 1024 px the Quick test leaves the definition, as capture 39 shows, and appears in the Test bench.
- Literal values differ where the design's example data differs from the saved synthetic data (for example “v2”, “release version 1”, “SYN Coordinator”). The decision record lists these as departures.
- The narrow shell rail of capture 39 and the phone Conditions / Actions / Test tabs are outside this change.

## SHA-256

| File | Size (px) | SHA-256 |
|---|---|---|
| after-desktop-incomplete.png | 1440 × 960 | `5b0319bc1d55c45f46bd02cb84b1c182a0fd263e1f861f44aa04e89754ac28d7` |
| after-desktop-menu.png | 1440 × 960 | `0339054d434f3d8ccf22012d4113f891393bc6ad9dc90c98b34dcc15e18c0194` |
| after-desktop-saved.png | 1440 × 960 | `64597dae71020e165b2872965681571ba8ed9c42e85f31175e1816bd88590a7a` |
| after-desktop-switch.png | 1440 × 960 | `4e109c1401b97111ead4ae98b5d264df4c2c95e728f79507b78f8099a04d2787` |
| after-desktop-tested.png | 1440 × 960 | `62a151172b4049551e4c101a5755e64836e7682d087210e565c1f9e598275549` |
| after-phone-definition.png | 390 × 844 | `bd119db94d558a1878e506c50c4db76ba9932ac466e7e1e5e68377f0285e196d` |
| after-phone-testbench.png | 390 × 844 | `b294a4d3b080d83db8690c0230a7560d7f5b9819764011011dbaae7da9d771fd` |
| after-tablet-saved.png | 1024 × 768 | `44f84961fe5ca12cd9798fdbfa770656108c55d6b45175eb93147c4bd5061932` |
| after-tablet-testbench.png | 1024 × 768 | `29fc2fc3012262701a4f9e0344c2ed200600073e14eb9b76f8c4a860f3cf77e6` |
| before-desktop-incomplete.png | 1440 × 960 | `3134945dfdb86ee7df97419a49153206758dd2d9b5e4b5cccd0e77a4106b025c` |
| before-desktop-saved.png | 1440 × 960 | `1de883a5c3f90f48f494930f419f7d3e10bbcc92a1044f67b9b8436374ef85bf` |
| before-phone-definition.png | 390 × 844 | `2dfc952962a5042e0aec59f38045ec7d5dc8cd1c6782425c2ef9ff1d0b041fba` |
| before-tablet-saved.png | 1024 × 768 | `7dddeb3d5dfa01a1a0262ea71d92113fbdb6271a45bcc47fd9ef2d4c10caf033` |

This is an agent's visual comparison, not owner acceptance, device testing or screen-reader testing.
