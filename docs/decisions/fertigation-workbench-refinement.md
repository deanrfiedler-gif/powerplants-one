# Priva fertigation workbench refinement — proposed design departures

**Status:** Proposed. Raised for decision; not accepted. No baseline, stylesheet, register entry or application screen is changed by this record.
**Owner:** Dean Fiedler.
**Raised:** 23 September 2026, from a design review of the r02 standalone workbench.
**Covers:** Priva fertigation scoping workbench r02, the standalone HTML whose SHA-256 is `b51bf2cab7cb1af54e33a0ec739921c4ca1a08da918165d615ead347d6463ab9` (the same bytes [ADR-0038](ADR-0038-priva-fertigation-native.md) records); the ES-02 fertigation scope; and the native record route `route:/estimating/fertigation/[id]` ([page contract](../design/development/pages/route-estimating-fertigation-id.md)).

## Question

Which presentation changes on the refinement board should become the fertigation workbench baseline, and on what conditions?

## Context

- Dean asked for a design board of the r02 workbench with refinements that make it look more professional, then directed that the work proceed however is most professional.
- The board is a private claude.ai design canvas, "Priva Fertigation Workbench" (version 5, 23 September 2026). It holds the nine sections at 1440 px, the Overview at 390 px, a design-language sheet and two shared parts: the module header and a section rail. It uses r02's synthetic project SYN-PPO-FERT-001 and changes no calculation.
- Observed in r02 at desktop width: text inside the SVG charts and diagrams scales with the window (about 30 px on Dean's 1920 px screenshots); axis ticks fall on non-round steps (11.6, 23.3, 34.8); the five header actions wrap to a second row; the nine tabs show a count only on Scope review; the five configurator cards repeat identical warnings; missing values read "Unknown bar" or "Unknown m³/h".

Known: the r02 bytes, its sample data and the board's content. Assumed: the native route keeps r02's nine-section structure, as ADR-0038 retains its registers and five families. Not verified: see Verification.

## Proposed departures

Each departure can be accepted or rejected on its own.

| ID | r02 | Board | Standard it touches | Recommendation |
|---|---|---|---|---|
| D1 | Horizontal strip of nine tabs; scrolls sideways below 1180 px | 248 px section rail inside the module, grouped Define the farm · Test the operating basis · Prepare the scope, with an open-check count per section and a blocker icon as well as colour. A section picker on phones | [Conformance](../standards/html-module-conformance.md): the shell owns application navigation. Precedent: the accepted Job Pack contents rail ([Job Pack design](job-pack-design.md)) | Adopt where the module interior is at least 1200 px wide, leaving about 950 px for content; below that, collapse to the section picker. Tabs with per-tab counts is the defensible alternative |
| D2 | Masthead with five actions wrapping to two rows; full-width synthetic-data banner | Save project as the only primary action, Report beside it, New / Open / import / export under Project tools; synthetic flag as a tag in the context bar | Conformance: no competing application masthead | Adopt in the standalone module. In the application, drop the "Powerplants One · Specialist scoping" eyebrow; the shell owns branding and the module keeps its title and context row |
| D3 | Chart fills #8896a8 (prepare) and #83b6d3 (flush, 2.19:1 against white) | Keep #8896a8 (3.01:1); darken flush to #5b9bc0 (3.05:1); add #c4553f blocker share (4.45:1) and #c4851a review share (3.13:1) | [UI style specification](../standards/ui-style-specification.md) palette; WCAG 1.4.11 non-text contrast | Adopt as chart-only fills, not as status tokens |
| D4 | "Unknown bar" and "Unknown m³/h" text; C1 reads Unknown in the base scenario | Dashed "Not recorded" or "To confirm" token; "Excluded in scenario" for a phase-excluded value, with its value when included; a basis tag (Assumed or Calculated) on each metric tile | ADR-0038 result states: known, unknown, not applicable, outside the supported model | Adopt, mapping one visual treatment to each ADR-0038 state |
| D5 | Five configurator cards, each repeating "Outside entered limits" and "Envelope unverified" | One comparison table: each family's published envelope drawn against the 16–28 m³/h requirement, an indicative read per family, and the shared project check stated once | ADR-0038: no manufacturer rating is seeded; user-entered failures remain failures | Adopt on two conditions: per-row project status returns as soon as any family has an exact configuration, and the indicative read stays labelled indicative, never a rating |
| D6 | Charts and diagrams as scaled SVG | Fixed 11–14 px chart text; round axis steps; labelled readouts (curve head 45.4 m, required 39.4 m, margin +6.0 m); head build-up bars; a single-cycle timeline detail; channel-by-channel I/O banks; scope review grouped by section with identical checks combined | None; presentation only | Adopt |

The board displays values that r02 computes but does not show: the head build-up (20.4 + 6 + 5 + 4 + 4 = 39.4 m), the emitter derivation (4,000 × 2 × 2 L/h = 16.0 m³/h), "8,000 of 8,000 containers allocated" (from r02's duplicate-allocation check), C1 at 2 m³/h and G3 at 100 L per event (from the future scenario), and the pipe transit (196.35 L, 70.7 s). The indicative family reads ("Spans required range", "Peak above published 25", "Below published statements") are new interpretive labels over r02's published family statements.

## Not changed

- Calculations, registers, fields, checks and severities. The 21 checks (2 blockers, 19 for review) are r02's.
- Brand tokens, Roboto/Verdana, radii, 40 px desktop and 44 px phone controls, and the focus ring.
- Accepted baselines and the application. Notices on the board use an even border without a left rule, consistent with option B of the [notice accent rule](notice-accent-rule-departure.md) proposal; that decision stays separate.

## If accepted

1. Record acceptance per departure here, with the date and Dean's words.
2. Standalone module: issue r03 as a successor HTML with a change record, retaining the r02 bytes above.
3. Native route: record the accepted revision, viewport and hash under Visual references in the page contract; build with shared components; review paired captures at 1440 × 960, 1024 × 768, 390 × 844 and 320 px.
4. D3: add the chart fills to the UI style specification as chart-only values.
5. D1 in the application: add the section rail to the component catalogue with its consumers.

If a departure is rejected, the board reverts that part to r02's treatment and this record notes it as rejected.

## Verification, 23 September 2026

- The board was rendered locally in Chromium (Playwright 1.56) with the repository's Roboto variable font, through a harness that inlines the shared parts. This approximates the canvas runtime; it is not the runtime. All 13 artboards were measured: no horizontal overflow, and each height fits its content.
- Found and fixed before this record: a rail border hidden by 1 px; page-heading actions duplicating panel actions on six pages; operating-group labels wrapping to three lines; phone connector lines not joining; the phone view clipped by 20 px; and a review-share fill (#e2a93b) at 2.11:1, replaced by #c4851a.
- Not verified: rendering in the canvas runtime itself, 320 px width, 200% zoom, keyboard order, screen reader, forced colours and print.
- Pre-existing and unchanged: brand green #62bb46 is 2.41:1 against white. r02 uses it for delivery bars; the board keeps it and adds a #416d33 outline where a cell carries meaning.

## Related

- Board: private claude.ai design canvas "Priva Fertigation Workbench".
- [ADR-0038](ADR-0038-priva-fertigation-native.md), [page contract](../design/development/pages/route-estimating-fertigation-id.md), [HTML module conformance](../standards/html-module-conformance.md).
