# Canonical visit job pack handover

Owner: Dean Fiedler. Catalogue key: job-pack-entry. Used by Field Technicians; scope SV-05, receiving PL-02. Reuses ReadState, Button and ButtonLink and the existing permission-filtered appointment pack endpoint. SV-04 now composes the same canonical entry endpoint with pack details in its shared record host; it no longer imports this visual component. Its binding and state proof live under `shared-record` and `tests/browser/appointment-detail.spec.ts`.

## Figma components

**Status:** None · **Location:** Components, in the private "PPO - Design" Figma file

No main component on the Components page yet. Page frames may draw this pattern; add a component when an accepted design needs one. Job pack list row (phone) 275:42685 is the register row, not the entry handover. The mapping is kept in `../components.json` (`figma`); node IDs are stable, and the file link stays out of this repository (ADR-0053). It records where the design component is, not visual alignment or review.

## Desktop

Display exact pack reference/status and Open job pack. When the server returns no visible pack and can_prepare, display Prepare job pack with the exact appointment query. Otherwise explain unavailable access without claiming that no pack exists. A refresh hides earlier links immediately; denied/error reads keep them hidden. A 401/403/404 response displays a non-error access-unavailable status and refresh control, without claiming that no pack exists. A transport/server failure still displays the shared error and retry control. The optional panel never grants pack access to an appointment-only reader.

## Mobile

Wrap wording and references, keep 44 px actions within the drawer and appointment panel. Keyboard: native focusable links/buttons; the enclosing Field Technicians dialog retains its trap and return behaviour. No drag interaction or independent scroll region is added.

Fixtures: `tests/browser/job-pack-integration.spec.ts` exercises existing, prepare, unavailable, 403/404 denied, server-failed and refresh states through both real consumers. The catalogue remains Reference only because it has no isolated renderer. Command permission, visit readiness and approved scope are rechecked by the existing server on Save; this component grants no authority. Review and deployment are separate.

## Job Pack Figma application, 13 October 2026

The [implementation decision](../../../decisions/job-pack-figma-implementation.md) binds this component to the accepted Figma Job Pack layout. Desktop uses the shared menu, register and 320 px status panel; phone uses compact register rows and coordinator Pack / Readiness / History tabs. Existing exact-content, permission, source and command contracts remain. The live host fixtures are `tests/ui/job-pack-fixture.tsx` and `job-pack-register-fixture.tsx`; states and consumer bindings are maintained in `components.json`. See [execution evidence](../../../testing/evidence/job-pack-figma-ui/README.md). Owner/device acceptance remains pending; no fingerprint is copied into a review record.
