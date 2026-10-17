# CPQ workbench controls

<!-- versioning: git; committed history is authoritative -->

Stable component `cpq-workbench`; ES-02/ES-03. Owner Dean Fiedler; Host example, not an isolated gallery fixture. Design reference: [implementation decision](../../../decisions/cpq-figma-ui.md). Private Figma frames and page-specific geometry are recorded in the four route contracts.

## Figma components

**Status:** Mapped · **Location:** CPQ · 2 Foundations & components 464:3, in the private "PPO - Design" Figma file

- CPQ / State `466:56`
- CPQ / Fact token `466:88`
- CPQ / Control `466:230`
- CPQ / KV row `466:240`
- CPQ / Condition row `467:207`
- CPQ / Group header `467:272`
- CPQ / Option tile `467:314`
- CPQ / Outline item `467:351`
- CPQ / BOM header `468:97`
- CPQ / BOM row `468:293`
- CPQ / BOM group row `468:301`
- CPQ / Compare header `468:316`
- CPQ / Compare row `468:437`
- CPQ / Waterfall row `469:156`
- CPQ / Test result row `469:234`
- CPQ / Change row `469:334`
- CPQ / Quantity basis `469:414`
- CPQ / Action card header `469:471`
- CPQ / Button (unavailable) `471:133`
- CPQ / Action bar `471:224`
- CPQ / Configuration summary `471:420`
- CPQ / Why this line panel `473:1055`
- CPQ / Context header `475:120225`

The 23 CPQ components stay on their own accepted component page, which the CPQ decision records cite. The mapping is kept in `../components.json` (`figma`); node IDs are stable, and the file link stays out of this repository (ADR-0053). It records where the design component is, not visual alignment or review.

## Desktop

Typed conditions follow CPQ / Condition row 467:207 and CPQ / Group header 467:272 ([alignment decision](../../../decisions/cpq-rule-editor-design-alignment.md)). Each group is a 2 px rule with a joined ALL / ANY / NOT control, inline + Condition / + Group and a group menu. Each row has a drag handle, a 220 px field with its type hint, a 160 px type-specific operator, a value with its unit and inline Move up / Move down / Remove. “When conditions are true / Always applies” is one joined control: the rule editor shows it in its section head, and other condition editors carry their own. Changing to a field of the same type keeps the operator. An incompatible type clears operator and value and says what was cleared. Incomplete rows show warning borders and a message, and the rule editor summarises every incomplete item with a route to its control. Move up / Move down and Alt + ↑ / ↓ reorder without dragging; dragging is optional. Whole-number facts reject fractions; unknowns stay blank and optional Not applicable stays explicit. Formulas accept only the bounded interpreter language. Why presents calculated, adjusted and effective values, selected contributions, exact price/FX provenance and reasons. Shared costs have their own group.

The rule editor opts into CPQ / Context header (`CpqHeader record`: 40 px title row, “More rule actions” menu, 14 px meta with “(you)” and the save state’s dot) and Record / View tab counts (`CpqTabs record`; the count is drawn, its meaning is the tab description). Its rule state uses `CpqState` 466:56, an icon and text in the success, warning, danger, link or muted tone, plain in the strip and as a pill in panel heads, never colour alone. Quick test (`QuickTestPanel`, `useQuickTest`) runs the selected scenario on the exact draft through the read-only validator after a 0.5 s pause. It shows this rule’s quantity and substitution, the published or saved comparison, and True / False / Unknown condition lines; it is never evidence for a version. The draft bar keeps Create version as CPQ / Button (unavailable) with its reason until every scenario passes. Configure & price keeps the default header, readiness and tabs. Desktop summary/quick test is 380 px; below 1100 px the rule quick test moves into the Test bench. Why is a 400 px drawer. At 390/320 px stack tables as labelled cards; use full-screen summary/Why and reachable native modal controls. Native focus trap, Escape and focus return are required. Reuse shared buttons, shell and register table; scoped CPQ geometry is intentional and must not affect other consumers.

## Mobile

At 390 and 320 px preserve every control and amount, 44 px targets, no horizontal page overflow, dialog Escape and focus return. Device and screen-reader acceptance remain pending.

## Fixtures and consumers

The rules register distinguishes the company activation from publication history. Active rows retain the exact rule/release version even while a newer saved draft exists. Older active rows open the immutable revision read only; returning to the working draft is explicit. A published release superseded by another company activation is labelled inactive. Keep these states in the register, editor, guide and database/browser fixtures together.

Four route consumers `/estimating/cpq`, `/estimating/cpq/[id]`, `/estimating/rules`, `/estimating/rules/[id]`. `../cpq-fixtures.json` names state fixtures; tests/browser/cpq.spec.ts supplies authorised real synthetic records. Unit/database tests prove immutable evidence, calculation and handover. These fixtures never grant production authority.

## Alignment and review

Native cent rounding, saved shell preferences and data-dependent labels are explicit departures from literal design example values. No private Pro SVG or private Figma URL is committed. The named version and [44 icon-free source captures](../../../reference/ui/estimating/cpq-figma-design-r01/README.md) are retained. Owner visual review, physical devices and screen readers remain open. Functional proof and deployment are tracked separately in docs/delivery/cpq-ui-handover.md. No review fingerprint is asserted by this change.

Configure & price keeps its white desktop summary alongside the entire workspace column, including the header, tabs and action footer, as retained frame 16 shows. Rules studio keeps Quick test beside its definition body as frame 02 shows. At phone widths summary opens in the full-screen panel; Save precedes Use in the configuration footer.

The expanded CPQ primary rail is 240 px at desktop widths; the saved collapsed preference is retained. Use the existing variable Roboto font and explicit normal-weight fields with zero input margins so legacy form styles cannot change CPQ spacing. Desktop footer actions remain on one line beside readable 14 px status copy, with the 80 px frame-16 footer. These overrides are scoped to CPQ; other shell consumers retain their dimensions.

All CPQ headings use normal letter spacing. The application-wide negative tracking is inappropriate for the retained 20 px workbench title; dialog titles also use the frame-05 20 px / 26 px treatment. Compiled captures at `3468ce6` exposed this inherited spacing; browser assertions now cover the correction at desktop and phone widths. The captured geometry and successful interactions are bounded evidence, not owner acceptance.

The dialog title rule must also include the `#ppo-cpq` ancestor: the workbench's generic `h2` selector otherwise wins by specificity and renders 16 px. Integrated CI at `72dd7c2` exposed this on both desktop and phone. Keep the 20 px / 26 px assertions; correct the scoped cascade rather than the expected geometry.

Option cards follow frame 16 as full-width stacked rows at desktop and phone widths, with a 64 px minimum height that grows with content. Selection retains a two-pixel blue outline and pale surface; the native radio uses the dark ink colour. Labels use medium weight. Preserve configured choice order and let unavailable reasons wrap; selection never reorders the choices.

Native fields use an explicit accessible name from the visible label, with help as a separate description. Select options do not become part of the field name; the Review adjustment journey selects the exact Decision field.

The formula dialog follows retained frame 05: an 880 px dialog with a 300 px insertion panel, searchable numeric facts/parameters and registered function insertions. Header and action footer remain visible while content scrolls; the desktop editor and insertion list scroll independently. Syntax checking is local; scenario calculations run through the read-only server validator. Apply changes only the working draft and invalidates its earlier test result. Authored unit metadata is shown without claiming dimensional inference.
