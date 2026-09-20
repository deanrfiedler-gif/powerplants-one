# EN-07 Engineering Change-Impact Review: local evidence r01

Captured on 20 September 2026 from a task-owned local server (`127.0.0.1:3107`) running branch `feat/en07-change-impact-review`, against the synthetic development database with migration 0030 and seed 30 applied. **Every capture was taken again after the screen was brought to desktop mockup r03**, the updated design Dean supplied that day ([retained here](../../../reference/ui/engineering-changes/PPO-EN-07-Engineering-Change-Impact-Review-Desktop-UI-Mockup-r03.png)); the earlier set, against mockup r02, is in this folder's history at commit `0504a6f`. Every record shown is fictional and was built through the application's ordinary API by `scripts/engineering-changes-scenario.ts`. These are implementation captures for owner review. They are not the mockup, not a registered UI baseline, and not visual, device or business acceptance. Decisions, departures and the case-by-case status are in [the integration record](../../../decisions/engineering-change-impact-review-design.md).

| Capture | Viewport | Identity | What it shows |
|---|---|---|---|
| `register-r03-1586.png` | 1586×992, mockup r03's own | SYN Sam Jordan | The comparison state for r03: pills for review state and attention, full due dates, one "Package / project" cell, the two chips, Technical basis, the zone-labelled check time, "Pending review" in the caution colour, whole-row follow-through, the amber strip beneath it, and the primary, outlined and link actions. All eight columns in view beside the real 220px menu and a 368px inspector |
| `register-expanded-1672.png` | 1672×941, mockup r02's own | SYN Sam Jordan | The same state with the 400px inspector: real 220px My Work menu docked, eight rows, SYN-EN07-003 inspected, no box ticked, `8 changes · 0 selected`, all eight default columns in view, table flush to the menu and inspector dividers |
| `register-collapsed-1920.png` | 1920×1080 | SYN Sam Jordan | First-use state: menu hidden with no residual track, destination named in the header, 448px inspector with all three follow-through lines and the derived overlap note |
| `register-1366.png`, `register-1280.png` | 1366×768, 1280×800 | SYN Sam Jordan | Menu docked; the inspector overlays because the register would fall under its usable width. At these heights r03's order leaves the follow-through and the amber strip below the fold of the inspector's scrolling body; "Pending review" and the pinned primary action stay in view |
| `register-zoom200-960.png` | 960×540 (1920 at 200%) | SYN Sam Jordan | Overlay menu and overlay inspector; controls reflow and stay reachable |
| `register-phone-390.png` | 390×844 | SYN Sam Jordan | Flush stacked summaries with labels in words; the eight-column grid is not shrunk |
| `impact-1440.png` | 1440×960 | SYN Sam Jordan | Current and proposed comparison, exact sources as reviewed against current, affected items |
| `impact-returned-1440.png` | 1440×960 | SYN Alex Lee | SYN-EN07-005 returned for scope clarification, with its reason, owner and the successor-revision action |
| `reviews-1440.png` | 1440×960 | SYN Casey Reviewer | The assigned discipline review of SYN-EN07-001 |
| `handovers-commercial-1440.png` | 1440×960 | SYN Coordinator | Where "Open commercial review" lands: the in-module synthetic prerequisite, known cost with the unknown component named as not zero |
| `verification-failed-1440.png` | 1440×960 | SYN Taylor Commissioning verifier | SYN-EN07-007: the retained failed attempt, its corrective work, and closure blocked |
| `history-1440.png` | 1440×960 | SYN Quinn Materials viewer | Revisions, decisions, source checks and events, read-only |

Persistence across a restart was shown by a digest of record identities, versions, stages, attention, menu counts, the recorded source-check time and 41 history events: `ebd7ba7b…1cb92b` before the server was stopped, after it was started again, and after the scenario was rerun.

Not captured or reviewed: keyboard-only operation, a screen reader, a physical device, the compiled build, and print output.
