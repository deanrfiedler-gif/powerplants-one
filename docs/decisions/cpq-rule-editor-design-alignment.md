# CPQ rule editor alignment below “Applies when”

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 15 October 2026. Scope: ES-02/ES-03 Rules studio, route `/estimating/rules/[id]`, Definition view. Parent requirements EST-02 to EST-09 are unchanged; no parent ID is added or renamed.

## Request

Dean asked on 15 October 2026: “Regarding the UI for the CPQ rules module, ensure the UI on the live Powerplants One application has been designed correctly and matched the design that we created in Figma, especially the lower section below the "Applies when" (screenshot attached for reference), as I don't think it is 100% correct.”

The reference is the accepted named Figma version “CPQ — Configure & price and Rules studio, accepted” ([design decision](cpq-figma-design.md)), frames `486:641` (rule editor, Definition) and `488:1029` (field changed to a text fact), with components CPQ / Group header `467:272`, CPQ / Condition row `467:207`, CPQ / Action card header `469:471`, CPQ / Control `466:230` and CPQ / Fact token `466:88`. The phone frame “Rule conditions tab” (`508:1123` flow) and the retained captures 02, 03, 14, 39 and 40 in [CPQ Figma design r01](../reference/ui/estimating/cpq-figma-design-r01/README.md) were also compared.

## What the built page got wrong

Rendering the page built under [cpq-figma-ui](cpq-figma-ui.md) at 1440 × 960, against a synthetic Support spacing rule, confirmed Dean's concern:
- “When conditions are true” and “Always applies” were two separate 40 px buttons, not one joined control beside the heading and its description.
- Each group was a heavy bordered box with an extra “Always” button and four separate buttons, not a 2 px rule with a joined ALL / ANY / NOT control. “+ Condition” and “+ Group” sat at the bottom, not in the group header, and there was no group menu.
- Move up, Move down and Remove sat on their own line under every condition, not inline on its row. There was no drag handle.
- The field box read “Cable run distance · Decimal” instead of the label with a “Number” hint. Units sat outside the value box. “is one of” used a tall list box, and Yes/No used “equals” with a separate Yes/No value instead of “is true / is false”.
- Changing the field always cleared the operator and value silently. The design clears them only for an incompatible type, and says why.
- There was no “This draft is incomplete” summary and no incomplete state on a row.
- “Action” was a bare form: two selects, a duplicated “Quantity formula” heading over a raw text area, and a list of fact keys. The design draws “Actions”: a card with a type header, Product and Installed unit, the formula as tokens with a validity line, and Rounding and Resolution group.

## Decision

Rebuild the editor below “Applies when” to the accepted frames, using existing CPQ data and services only:
- A shared condition builder, `src/components/cpq-conditions.tsx`, replaces the old one for every CPQ condition editor: rules, option availability, constraints, decision-table rows and milestone proposals. Those other editors keep their own “When conditions are true / Always applies” choice; the rule editor shows it in its section head, as drawn.
- Rows follow CPQ / Condition row. Operators are offered by type. Yes/No folds its value into “is true / is false”. “is one of” for choices opens a checklist. A saved operator outside the usual set (for example NE true) stays visible rather than being lost. Changing the field keeps a compatible operator. An incompatible type clears operator and value and states what was cleared, in the design's wording.
- Reordering works with the buttons, with Alt + ↑ / ↓ (focus stays on the moved control) and by optional drag. A NOT group keeps exactly one child: its row clears rather than removes. Switching a group of several conditions to NOT keeps them together inside it rather than dropping any.
- The incomplete summary lists every unfinished condition, the missing resolution group and an invalid formula. Each item moves focus to its control. Raw text such as “-” or “1.” stays incomplete.
- The action card shows the rule's one action, either Material quantity or Labour effort. Its menu changes the type, opens the compatibility and capacity checks, and removes the rule.
- The formula shows as fact, parameter and operator tokens, with a local syntax line and its comparison with the saved version. It is edited in the existing frame-05 dialog.
- Release parameters keep their editor, restyled as compact rows.
- Eight Font Awesome icons (grip-dots-vertical, arrow-up, arrow-down, keyboard, box-open, function, lock, user-helmet-safety) join the product icon map, each with a local fallback drawing (ADR-0050). No private Figma artwork or URL is committed.

## Proposed departures, explicit

These differ from the drawn frames because the native CPQ model does not hold what the drawing shows. None of them invents data.
- **Add action:** a release rule holds exactly one action, so Add action stays visible as unavailable, with its reason (display rule “Button (unavailable)”).
- **Product, unit and resolution group:** the rule's target part is its resolution group. Product and Installed unit (Labour item and Effort unit for labour) are therefore read only, and Resolution group is the editable choice. The drawing has Installed unit editable and Product read only.
- **Rounding:** there is no separate rounding step, so Rounding is read only (“As written in the formula”).
- **Formula editing:** raw inline editing of the formula is removed, so a draft can no longer hold syntactically invalid formula text entered on the page. The browser spec now proves draft persistence with a complete alternative formula. The formula check states syntax and the saved-version comparison; like the dialog, it claims no unit algebra.
- **Labels:** live labels and values come from saved data, not the design's literals. Examples are “the fact dictionary” rather than “2026.10”, and “saved version n” rather than “v7”.
- **Retained live-only content:** the Release parameters editor remains. The rule picker with “+ Rule” first stayed in Rule details; the follow-up below moves it into the header menu.

## Follow-up: above “Applies when”, Quick test and draft bar

The first increment left the header, readiness strip, view tabs, Rule details, Quick test and draft bar unaligned. This follow-up completes the same 15 October request against the same frames, `486:641` and `488:1029`, and the tablet frame retained as capture 39. The components are CPQ / Context header `475:120225`, CPQ / State `466:56`, Record / View tab `312:16`, CPQ / Control `466:230` and CPQ / Button (unavailable) `471:133`.

### What the page still got wrong

A render of the page after the first increment at 1440 × 960, 1024 × 768 and 390 × 844 showed these gaps. The [before and after captures](../testing/evidence/cpq-rule-editor-upper/README.md) are kept as implementation evidence.
- **Header:** a quiet “Release” button stood where the design draws a 40 px “⋯” menu. The context line was 12 px, without “(you)” or the save state's dot.
- **Readiness strip:** the states were pills. Validation and tests were combined as “Validation / tests”, and Published read “Release 1”.
- **View tabs:** there were no counts, a 3 px selected rule and 24 px gaps.
- **Rule details:** the description line was missing. A rule picker and “+ Rule” sat beside Edit details, and a large gap preceded the details.
- **Quick test:** there was no state chip, and the inputs listed every fixture fact without units. “Draft result” appeared only after Run all, as a cost/sell pass or fail. Neither the rule's quantity, the condition outcomes, the published comparison nor the not-evidence note was shown. At 1024 px the panel squeezed the editor rather than moving into the Test bench.
- **Draft bar:** it was 80 px high, with a bold “Draft saved …” and no dot or revision. The reason text never changed, and “Create version…” was drawn as an ordinary primary button while disabled.

### Decision

- **Header:** the rule editor uses CPQ / Context header: a 40 px title row with a “More rule actions” (⋯) menu, then rule key · ruleset · you (you) · save state with its dot, for example “Draft v2 · saved 10:06 pm” or “Unsaved changes”. Configure & price keeps its existing header; the rule editor opts in.
- **Rule picker:** following Dean's standing delegation to the recommended option, the picker and “+ Rule” move into the ⋯ menu, not the registry. The registry lists saved releases only, so a rule that exists only in an unsaved draft would otherwise be unreachable. “Switch rule…” opens a dialog listing the draft's rules with the current one marked, and “Add a rule” adds one as “+ Rule” did. “Release and publication” replaces the Release button; Releases also remains in the side menu.
- **Rule state:** four separate CPQ / State items, each an icon and text, never colour alone. Draft shows the saved time, Unsaved changes, Saving…, Not saved or read only. Validation shows Valid, Incomplete · n, or Refused by the server check. Tests shows Not run on this draft, Running…, All n passing or n failing. Published shows “vN · active in release version M”, Not in the active release, Not active or Not published. A shared `CpqState` serves them, and the Quick test chip.
- **View tabs:** Record / View tab counts: saved scenarios on Test bench, release memberships and decision-table references on Where used, and saved versions of this rule on History. The drawn count is hidden from assistive technology and its meaning is the tab's description, so tab names do not change. Changes names the saved release version it compares with.
- **Rule details:** a description line names the purpose, the ruleset and what editing never changes. Edit details carries its icon, and the six details are label, value and sub-line on the drawn 12 / 16 px grid.
- **Quick test** (`src/components/cpq-quick-test.tsx`): Scenario as CPQ / Control with its note, Inputs with units, and a Draft result card. The card shows this rule's quantity and unit (“33 each”), the formula with the scenario's values (“ceil(140 ÷ 10) × 2 + 5 = 33”), the comparison with the published or saved version (“Published v1 gives 33 · no difference for this scenario”), and one True / False / Unknown line per condition with its icon. Then come Run all and the “Quick test is not evidence for publication…” note. An incomplete draft shows “—”, “No result: condition 1 is incomplete” and “Complete the draft to test it”, as frame 488:1029 draws.
- **Draft bar:** the save state with its dot and revision (“Draft v2 · revision 1 · saved 10:06 pm”, “Unsaved changes · revision 2 (local)”), and a reason that follows the state. Save draft is primary only while there are unsaved changes. Create version is a CPQ / Button (unavailable) with a lock and the reason as its description, until every scenario and coverage check passes on the exact draft.
- **Icons:** code-branch, pen-to-square, floppy-disk, play and circle-xmark join the product icon map, each with a local fallback drawing (ADR-0050).
- **Tablet and phone:** below 1100 px the Quick test leaves the definition and opens the Test bench, as frame 39 draws at 1024 px. It has no Run all button there, because the Test bench has one.

### Proposed departures, explicit

None of these invents data. Each follows what the native CPQ model holds.
- **Version names:** v-numbers are saved rule versions, and “R4” becomes “release version n”. A rule version is reused when content returns to an earlier one, so such a draft reads “Draft (same as vN)”.
- **People:** the header names the signed-in user with “(you)”; the model holds no rule owner. Owner and Reviewer keep “Release author” and “Independent review”, because no owner, team or assigned reviewer exists. Their sub-lines state the saved release version and that the reviewer must not be the author. The design's “DEC-CCE-06” text is not shown.
- **Scenarios:** fixtures belong to the release, so the note reads “n saved scenarios in this release”, not “for this rule”.
- **Quick test runs:** after a 0.5 s pause in editing, the selected scenario runs on the exact draft through the existing read-only validator, with one more run of the comparison version. Nothing is written, and the Tests state is unchanged. The validator requires author permission, so other roles see that requirement in the panel. Errors stay in the panel.
- **Inputs and condition lines:** Inputs list only the facts this rule reads (conditions, then formula) and the parameters its formula names, marked “release parameter”. Nested ALL / ANY groups read as one line, and “is one of …” elides its list as drawn.
- **Rounding:** the substitution line adds “rounded to three places” only when the native three-place quantity was rounded; there is no separate rounding step.
- **Menu contents:** the frames do not draw the open ⋯ menu, so Switch rule…, Add a rule and Release and publication are a PPO decision.
- **Headings:** headings in the rule editor use the drawn bold weight; elsewhere CPQ keeps 600.

### Still not changed

Configure & price keeps its header, readiness strip and tabs: the shared components render as before unless the rule editor opts in. Two small shared changes apply everywhere. The context separators and avatar initials are hidden from assistive technology, and the status sits with its dot in one group. The phone Conditions / Actions / Test tabs (capture 40), the side menu's drawn filters (All rules, My drafts, Needs validation, Ready for a version) and the narrow shell rail at 1024 px are not built. Owner visual acceptance, device and screen-reader acceptance, CI and deployment remain separate.

## Verification of the first increment

All local and synthetic. Pages were rendered and exercised against a task-owned PostgreSQL cluster and development server, never Dean's database or :3000:
- type check, ESLint on the changed files and the Font Awesome unit test;
- desktop captures at 1440 × 960 and 1024 × 768, and phone captures at 390 × 844 and 320 × 740, with no horizontal overflow;
- Alt + ↑ / ↓ keeps focus, the cleared-field message matches the design wording, the summary link focuses the right control, and Escape returns focus from the values checklist;
- the production build (`next build`), the studio and naming checks, and 849 of 852 unit cases. The 3 failures are the `document-store` and `recovery` cases previously recorded as Windows-only failures on unmodified `main`. They were not re-run on `main` in this task;
- `tests/browser/cpq.spec.ts`, with its updated formula assertions and a new condition-builder case, against the disposable `ppo_synthetic_test` database. On the final source, both tests pass on desktop and on mobile. Two runs failed once, outside the rule editor, and passed when re-run on the warm server: the mobile journey at the Configure & price reload step (140 instead of 150), and the desktop journey at its first evaluation save after a cold server start (`CalculationLimit` after a 44-second first compile). The local run used a 30-second expectation timeout because the development server answers more slowly than the compiled application. CI runs the spec with its own defaults and remains the authority.

## Verification of the follow-up

All local and synthetic, against a separate task-owned PostgreSQL cluster and development server (not Dean's database or :3000), on the branch stacked on the first increment:
- type check (`tsc --noEmit`), `npm run lint` on the whole tree, and the Font Awesome unit test with the product icon count moved from 59 to 64;
- `npm run studio:check`, `scripts/check_naming.py` and `scripts/check_foundation.py`;
- the production build (`next build`), after removing a stale `.next/dev` type file left by the stopped development server;
- 852 of 855 unit cases. The 3 failures are the `document-store` (2) and `recovery` (1) cases already recorded as Windows-only failures; they were not re-run on `main` in this task;
- `tests/browser/cpq.spec.ts` against the disposable `ppo_synthetic_test` database, with a 30-second expectation timeout for the development server. Its new assertions cover:
  - no in-page rule picker, and a “More rule actions” menu;
  - the separate rule states, and the Test bench tab's count as its description;
  - the Quick test's “33 each”, substitution, saved comparison and condition line, and on the phone the Quick test inside the Test bench;
  - the incomplete state's “Incomplete · 1”, “No result: condition 1 is incomplete”, and Create version unavailable with its reason;
  - switching rules from the menu dialog;
  - the draft bar's “· revision n · saved” after Save draft.
- Both tests passed on desktop. On mobile, the condition test passed. The journey test failed once with a `DependencyUnavailable` / `DatabaseConnectTimeout` at a Configure & price API call, before it reached the rule editor, and both tests passed on the re-run.
- [Captures](../testing/evidence/cpq-rule-editor-upper/README.md) at 1440 × 960, 1024 × 768 and 390 × 844, before and after, compared with frames 486:641, 488:1029 and capture 39.

Not run: database and HTTP suites (no server change), the access-review job (no capability change), and physical devices or screen readers. CI on the compiled application remains the authority.
