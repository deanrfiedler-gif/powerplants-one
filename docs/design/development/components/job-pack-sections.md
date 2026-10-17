# Job Pack saved section presentation

Owner: Dean Fiedler. Scope: SV-05 / SC-06. Reference: [Job Pack r03](../../../reference/ui/job-pack/powerplants-one-job-pack-r03.html). D6-A is the adopted design decision; application visual acceptance remains open.

## Figma components

**Status:** Mapped · **Location:** Components › Job pack, in the private "PPO - Design" Figma file

- Job pack / Section head `275:2578`
- Job pack / Stage heading `275:2657`
- Job pack / Fact `275:2595`
- Job pack / Note `275:2597`
- Job pack / Callout `275:2601`
- Job pack / Disclosure `275:2660`
- Job pack / Criterion row `275:2655`
- Job pack / List item `275:2735`
- Job pack / Record row `275:2706`
- Job pack / Document row `275:2708`
- Job pack / History row `275:2716`
- Job pack / Form field `287:3282`
- Job pack / Select row `287:3304`

Saved-section parts from the accepted Job pack page (272:2). The mapping is kept in `../components.json` (`figma`); node IDs are stable, and the file link stays out of this repository (ADR-0053). It records where the design component is, not visual alignment or review.

## Desktop

SectionBody is shared by Job pack and Preparation. SectionParts reuses Pair, information grids, task lists, history rows and notes. It presents only data whose formatter matches the exact saved section. Each successful structured view includes the native Exact text as it will be issued disclosure. Unknown, inaccessible, ambiguous or unsupported data retains the original section text. The existing note remains separate.

## Mobile

Control labels stack above values below the page breakpoint. Long values wrap. Native disclosures keep visible focus and work by keyboard. Inspect 390/320 px alongside 1024 and shell transition widths. A source link never substitutes for the retained wording.

## Fixtures, consumers and limits

`tests/fixtures/job-pack-read.json` adds only a section projection to the retained pre-I6 snapshot. Unit compatibility tests retain its original text. The application browser fixture exercises verified, unavailable and mismatched states, exact disclosure and six widths. Scope equipment IDs are null for recipients; staff links require current asset access. History needs selected ID/order/hash proof. No source read changes the snapshot or grants work authority.

The component is bound to scope:SV-05 and route:/service/packs/[id]. It is reference-only in the catalogue because there is no isolated renderer. Whole-page paired comparison belongs to I5; device and owner acceptance are not inferred from automated checks.

I7 adds staff-only recorded author, verification and source metadata to hash-verified history rows. Recipients do not receive those metadata fields. The hash remains the original ID/kind/summary/confidence/occurrence basis; provenance additions do not move it.

## Job Pack Figma application, 13 October 2026

The [implementation decision](../../../decisions/job-pack-figma-implementation.md) binds this component to the accepted Figma Job Pack layout. Desktop uses the shared menu, register and 320 px status panel; phone uses compact register rows and coordinator Pack / Readiness / History tabs. Existing exact-content, permission, source and command contracts remain. The live host fixtures are `tests/ui/job-pack-fixture.tsx` and `job-pack-register-fixture.tsx`; states and consumer bindings are maintained in `components.json`. See [execution evidence](../../../testing/evidence/job-pack-figma-ui/README.md). Owner/device acceptance remains pending; no fingerprint is copied into a review record.
