# Screen Configurator Workbench composition

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: application comparison and owner acceptance recorded separately.

This host entry binds `scope:ES-08` and the existing configuration/view routes. Source: private Figma page `406:2` and exact frames in [the design record](../../../decisions/es08-figma-design.md). The [implementation decision](../../../decisions/es08-figma-implementation.md) records the direct build authority and adaptations. Original board images and r03 HTML remain historical references. Accepted named-version evidence and icon-free Figma captures are still missing.

The host groups the workbench context facts, readiness checks, seven view links, section menu, source-attributed fields, segmented options, expandable result rows, sheet/title blocks, field inspector, working panel and save bar. These components share the same Bench state and synthetic fixtures; the menu does not hold another proposal. The shared cross-section remains registered separately. `WorklistMenu` supplies run actions; existing scoped ES-08 Dialog supplies modal semantics and focus restoration.

## Figma components

**Status:** Proposal only · **Location:** Screen Configurator Workbench · ES-08 406:2 (formerly "ES-08 · Screen Configurator Workbench"), in the private "PPO - Design" Figma file

- Workbench / Context strip `415:4566`
- Workbench / Context fact `413:93834`
- Workbench / Segment `413:93796`
- Workbench / Field `413:93832`
- Workbench / Save bar `415:4693`
- Workbench / Sheet header `417:92945`
- Workbench / Field inspector `417:92959`
- Workbench / Working panel `419:2027`
- Workbench / Section stepper (phone) `417:93096`

Twenty-seven ES-08 parts stay on the proposal page until the design is accepted; the main ones are listed. The mapping is kept in `../components.json` (`figma`); node IDs are stable, and the file link stays out of this repository (ADR-0053). It records where the design component is, not visual alignment or review.

## Desktop

1440 px with the two 240 px navigation columns, 24 px workbench padding and 16 px card gaps. Configure uses a 5:3 split. Readiness uses compact checks with keyboard-accessible detail; tables retain real headings and cells. The 440 px Parts panel overlays the right edge below the application top bar. Pricing and Definition preserve full-width tables. Narrow desktop widths stack columns. Main content scrolls independently of the footer.

## Mobile

390 px and 320 px. Compact title and expandable readiness; horizontally scrolling view tabs; section stepper and single-column fields. Save and Next section stay reachable. Workbench actions opens the reason, calculation review and method. The selected drawing field is available in a bottom sheet, and working uses a full-screen panel. Wide evidence/parameter tables scroll in their own containers. Position and finding filters remain available as labelled selects when the secondary menu is hidden.

Keyboard: all menu and section controls have names and current/pressed state; inputs preserve labels and field error associations; dialogs trap focus through native modal behaviour and restore the opener; history overflow supports arrows, Escape and choice selection. Drawing selection retains its named keyboard buttons. No custom ARIA grid is introduced.

Fixtures: `scripts/es08-fixture.ts` and `tests/browser/specialist-workbench.spec.ts` exercise Northbank, the five profiles, selection across sheets, invalid geometry, untested options, manual re-review, missing prices, exact run export, pending receipt recovery and read-only/permission withdrawal. New presentation checks exercise menu filters, overlays and phone actions. All are synthetic; no test grants engineering acceptance.

Limits: schematic structural members, loads, procurement fit and supplied fabric suitability remain unapproved. Drawing-only inputs remain browser-local. Private Kit artwork is not committed. Reference presence, functional proof, paired visual inspection, owner acceptance and deployment remain separate in the page register and execution evidence.

Phone dialogs explicitly remove the native browser maximum-width cap so working, actions and inspector surfaces can occupy their intended full viewport width. The browser proof checks 390 pixels and focus restoration.

The adopted Shell v2 header shows the current workbench name at desktop widths. Its Page hierarchy control retains the Specialist configurations ancestor and keyboard focus return; collapsed ancestor fragments are not part of the visible title.
