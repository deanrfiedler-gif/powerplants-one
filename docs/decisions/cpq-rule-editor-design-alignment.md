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
- **Retained live-only content:** the Release parameters editor and the rule picker with “+ Rule” in Rule details remain.

## Not changed by this decision

Above “Applies when”, the header, readiness strip, Rule details labels and rule picker are unchanged. So are the Quick test panel (the design's “33 each” result with per-condition outcomes) and the footer wording. They differ from frames `486:641` / `488:1029` and are a separate follow-up. Phone tabs (Conditions / Actions / Test) are not built. Owner visual acceptance, device and screen-reader acceptance, CI and deployment remain separate.

## Verification

All local and synthetic. Pages were rendered and exercised against a task-owned PostgreSQL cluster and development server, never Dean's database or :3000:
- type check, ESLint on the changed files and the Font Awesome unit test;
- desktop captures at 1440 × 960 and 1024 × 768, and phone captures at 390 × 844 and 320 × 740, with no horizontal overflow;
- Alt + ↑ / ↓ keeps focus, the cleared-field message matches the design wording, the summary link focuses the right control, and Escape returns focus from the values checklist;
- `tests/browser/cpq.spec.ts`, with its updated formula assertions and a new condition-builder case, against the disposable `ppo_synthetic_test` database. Both tests passed on desktop and on mobile. On mobile, one earlier run of the existing journey failed at the unrelated Configure & price reload step (140 instead of 150) and passed when re-run. The local run used a 30-second expectation timeout because the development server answers more slowly than the compiled application. CI runs the spec with its own defaults and remains the authority.
