# CPQ workbench controls

<!-- versioning: git; committed history is authoritative -->

Stable component `cpq-workbench`; ES-02/ES-03. Owner Dean Fiedler; Host example, not an isolated gallery fixture. Design reference: [implementation decision](../../../decisions/cpq-figma-ui.md). Private Figma frames and page-specific geometry are recorded in the four route contracts.

## Desktop

Typed conditions use field/operator/value rows, ALL/ANY/NOT groups and explicit Always. Changing a field clears the previous operator and value. Move up/down works without dragging. Whole-number facts reject fractions; unknowns stay blank and optional Not applicable stays explicit. Formulas accept only the bounded interpreter language. Why presents calculated, adjusted and effective values, selected contributions, exact price/FX provenance and reasons. Shared costs have their own group.

Desktop summary/quick test is 380 px; Why is a 400 px drawer. At 390/320 px stack tables as labelled cards; use full-screen summary/Why and reachable native modal controls. Native focus trap, Escape and focus return are required. Reuse shared buttons, shell and register table; scoped CPQ geometry is intentional and must not affect other consumers.

## Mobile

At 390 and 320 px preserve every control and amount, 44 px targets, no horizontal page overflow, dialog Escape and focus return. Device and screen-reader acceptance remain pending.

## Fixtures and consumers

Four route consumers `/estimating/cpq`, `/estimating/cpq/[id]`, `/estimating/rules`, `/estimating/rules/[id]`. `../cpq-fixtures.json` names state fixtures; tests/browser/cpq.spec.ts supplies authorised real synthetic records. Unit/database tests prove immutable evidence, calculation and handover. These fixtures never grant production authority.

## Alignment and review

Native cent rounding, saved shell preferences and data-dependent labels are explicit departures from literal design example values. No private Pro SVG or private Figma URL is committed. The named version and [44 icon-free source captures](../../../reference/ui/estimating/cpq-figma-design-r01/README.md) are retained. Owner visual review, physical devices and screen readers remain open. Functional proof and deployment are tracked separately in docs/delivery/cpq-ui-handover.md. No review fingerprint is asserted by this change.

Configure & price keeps its white desktop summary alongside the entire workspace column, including the header, tabs and action footer, as retained frame 16 shows. Rules studio keeps Quick test beside its definition body as frame 02 shows. At phone widths summary opens in the full-screen panel; Save precedes Use in the configuration footer.

The expanded CPQ primary rail is 240 px at desktop widths; the saved collapsed preference is retained. Use the existing variable Roboto font and explicit normal-weight fields with zero input margins so legacy form styles cannot change CPQ spacing. Desktop footer actions remain on one line beside readable 14 px status copy, with the 80 px frame-16 footer. These overrides are scoped to CPQ; other shell consumers retain their dimensions.

Native fields use an explicit accessible name from the visible label, with help as a separate description. Select options do not become part of the field name; the Review adjustment journey selects the exact Decision field.

The formula dialog follows retained frame 05: an 880 px dialog with a 300 px insertion panel, searchable numeric facts/parameters and registered function insertions. Header and action footer remain visible while content scrolls; the desktop editor and insertion list scroll independently. Syntax checking is local; scenario calculations run through the read-only server validator. Apply changes only the working draft and invalidates its earlier test result. Authored unit metadata is shown without claiming dimensional inference.
