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

Native cent rounding, saved shell preferences and data-dependent labels are explicit departures from literal design example values. No private Pro SVG or private Figma URL is committed. Missing retained source images, named-version confirmation, owner visual review, physical devices and screen readers remain open. Functional proof and deployment are tracked separately in docs/delivery/cpq-ui-handover.md. No review fingerprint is asserted by this change.
