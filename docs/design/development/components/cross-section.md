# Shared cross-section drawing

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Catalogue key:** `cross-section` · **Review:** Pending

One SVG component draws every greenhouse cross section for the ES-08 Screen Configurator Workbench. The Configure live card and drawing sheet 02 both mount `SectionDrawing` from `src/components/specialist-section.tsx`, so they cannot drift apart (design board departure D15). The geometry comes from `src/estimating/specialist/drawing.ts`, whose five roof profiles, defaults, ranges and withholding rules are the [design board decision's drawing standard](../../../decisions/es08-design-board.md#6-structure-drawing-standard).

## Source and reference

Design: [design board G · shared cross-section engine](../../../reference/ui/specialist/design-board-r01/PPO-ES-08-Design-Board-G-Cross-Section-Engine-r01.png) and [B · structure families](../../../reference/ui/specialist/design-board-r01/PPO-ES-08-Design-Board-B-Structure-Families-r01.png), owner-accepted on 23 September 2026. Application captures: [workbench native r01](../../../reference/ui/specialist/workbench-native-r01/README.md). Paired application acceptance is not recorded.

The application implementation and exact consumer bindings are maintained in `../components.json`.

## Behaviour

- Every section is drawn at true proportion: width and height share one scale, and the sheet variant carries a bar scale.
- Profiles: Venlo (any whole number of 3.2, 4.0 or 4.8 m roofs per span, lattice truss 0.45 m deep), Gable (Fink truss), Arch (circular segment through both gutters), Gothic (pointed curve, crown factor 0.35) and Sawtooth (single slope with the high-side vent).
- The entered screen height is drawn, with one strip per motor group, overhangs, hooks and drive lines end-on. The selected group is highlighted on the sheet variant.
- A rule breach withholds the section with its reason rather than drawing an impossible shape: a Venlo span that is not a whole number of roofs, a pitch outside the profile's range, a vent at or above the sawtooth rise, or a screen at or above the structure underside. Quantities are never withheld by a drawing rule (D14).
- Labels are SVG text with a white halo for dimension chips, so a downloaded sheet is self-contained.

## Figma components

**Status:** Proposal only · **Location:** ES-08 · Screen Configurator Workbench 406:2, in the private "PPO - Design" Figma file

- Drawing / Live section · Gable, 2 of 6 spans `408:83278`
- Drawing / 02 Cross section · Gable `410:83942`

Imported from the application SVG; stays on the ES-08 proposal page until that design is accepted. The mapping is kept in `../components.json` (`figma`); node IDs are stable, and the file link stays out of this repository (ADR-0053). It records where the design component is, not visual alignment or review.

## Desktop

Sheet variant 1,280 × 310 inside the sheet frame with layers (structure, screen, drive, dimensions); card variant 660 × 330; mini variant 400 × 236 on the Configure live card with two spans shown and a break mark.

## Mobile

The SVG scales with its container. At 390 px the sheet text is small and the page relies on pinch zoom, as the design board's phone composition states; the inspector beside it carries the same facts as text.

## Keyboard and accessibility

Presentation only. The drawing's accessible name states the profile, spans, span width, gutter height, top height and screen height, or the withholding reason. Selection, layers and the open/closed toggle are ordinary buttons and checkboxes beside it.

## Differences and limits

Truss webs identify the structure type only; they are not member sizes, bracing design or load paths. The Gable and Arch ranges and defaults, the 0.45 m Venlo truss depth, the Venlo roof widths and the web layouts are proposed conventions. Real Powerplants and supplier profiles have not been compared; supplier drawings remain the evidence the audit requires.

## Verification and maintenance

`tests/unit/specialist-workbench.test.ts` checks the heights against the decision's r10 figures (Venlo 4.6464 m and 4.8081 m, Gable 5.2929 m, Arch R 3.9554 m, Sawtooth 5.5957 m), curve symmetry, the Arch circle and every withholding rule. `tests/browser/specialist-workbench.spec.ts` draws every profile through the component and proves a drawing-only error withholds the section while the quantities stay valid. Automated checks do not grant design acceptance; record reviewer, date, viewport, result and evidence paths in the component review record.


The 13 October Figma implementation reuses this exact geometry in its live card and sheets. Estimate and configuration title-block fields are separate. Selected fields open the phone inspector sheet; quantity authority and drawing-only storage are unchanged. See the Screen Configurator Workbench host for the new composition.
