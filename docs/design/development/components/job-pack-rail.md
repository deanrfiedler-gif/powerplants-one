# Job Pack readiness, crew and output rail

Owner: Dean Fiedler. SV-05 / SC-06. Accepted Job Pack r03 plus adopted D9/D10; application acceptance separate.

## Figma components

**Status:** Mapped · **Location:** Components › Job pack and Components › Record, in the private "PPO - Design" Figma file

- Job pack / Status strip `301:4783`
- Job pack / Crew row `275:2698`
- Record / Readiness bar `239:1800`
- Record / Check item `239:1799`

Job pack / Status strip is the collapsed status panel; the open panel is composed in page frames from these parts. The mapping is kept in `../components.json` (`figma`); node IDs are stable, and the file link stays out of this repository (ADR-0053). It records where the design component is, not visual alignment or review.

## Desktop

Reuse ReadinessCard, CrewCard and OutputCard in the page rail. Server outcomes are grouped in fixed Authorisation, Booking, Dispatch, Completion order, then other stages. Keep all action-required rows outside disclosures. Satisfied groups remain one keyboard activation away. Retain assessment reason, actor, date and valid-until value. The dispatch block remains the server result.

Crew roles follow the issue's exact revision. Task creation, opens/downloads and explicit acknowledgements remain distinct recorded facts. Recovery/follow-up owners use names, never internal IDs. Recovery operates on the existing original job. Staff history includes exact earlier issue acknowledgements; it cannot transfer a response to a successor.

## Mobile

On coordinator phones, Readiness opens the status content in the same scroll surface; Pack and History return to their respective content. Recipient phones retain the applicable issue, crew acknowledgement and dispatch result together. Long reason/name/source text wraps. Disclosures and actions keep at least 44 px targets; focus remains visible.

## Fixtures, consumers and limits

The retained pack read and `job-pack-presentation.spec.ts` exercise attention, satisfied disclosures, output failure with a named owner and earlier issue acknowledgements. Consumers are scope:SV-05 and route:/service/packs/[id]. The catalogue entry is reference-only because it has no isolated renderer. I5 supplies final paired page conformance; owner/device acceptance and deployment remain unclaimed.

## Job Pack Figma application, 13 October 2026

The [implementation decision](../../../decisions/job-pack-figma-implementation.md) binds this component to the accepted Figma Job Pack layout. Desktop uses the shared menu, register and 320 px status panel; phone uses compact register rows and coordinator Pack / Readiness / History tabs. Existing exact-content, permission, source and command contracts remain. The live host fixtures are `tests/ui/job-pack-fixture.tsx` and `job-pack-register-fixture.tsx`; states and consumer bindings are maintained in `components.json`. See [execution evidence](../../../testing/evidence/job-pack-figma-ui/README.md). Owner/device acceptance remains pending; no fingerprint is copied into a review record.
