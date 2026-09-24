# Job Pack I4 application evidence

Owner: Dean Fiedler. Captured and inspected by Codex on 24 September 2026 against compiled source `899dd6e`, with the retained synthetic pack read and a real local session. These are presentation fixtures; they do not prove a persisted save or grant owner acceptance.

## Captures and review

`source-change-{1440,1024,820,770,390,320}.png` shows the changed-source notice. `print-choice-{1440,1024,820,770,390,320}.png` shows the saved preparation dialog at the same widths. Heights are respectively 960, 768, 800, 900, 844 and 800 CSS px. The notice was scrolled into view on narrow screens.

Inspected the 1440, 1024 and 320 px source notice and 390 and 320 px print dialog. The notice wraps within the centre column at desktop/tablet and within the phone column. The 320 px dialog fits, retains readable text and labelled actions, and the phone navigation stays outside its content. The accepted r03 component treatment is reused. Whole-page paired reference comparison, physical device and owner acceptance remain I5 work. No page review fingerprint is adopted here.

## Functional evidence

- Compiled I4 and existing r03 conformance: 17 passed, five deliberate duplicate mobile-project skips.
- Real P06 journeys: five passed, one desktop long-output timeout. Both desktop and phone main journeys include the new save-and-print step and passed against the real API. An isolated long-output retry encountered the booking left by the timed-out attempt; a clean-fixture rerun remains required.
- HTTP negative access case passed. The second HTTP case requires the restart artefact normally produced by the database pipeline; that artefact was absent locally.
- Changed-file lint, typecheck, build, studio register, foundation, naming and prototype checks passed. Full unit/database baseline was not a pass; environment and timeout limits are recorded in the handover.

Local logs are in the task worktree `tmp/`; they are not source records or production acceptance.
