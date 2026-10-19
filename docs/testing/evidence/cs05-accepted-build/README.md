# Facilities accepted-design build evidence

Scope: CS-05. Builder: Codex. Owner visual review: pending.

This work refines the existing Facilities register, record and forms against
"PPO - Design", page `1415:357158`, named version
"Facilities and growing areas — accepted". The binding decisions and retained
icon-free captures are linked from [the design decision](../../../decisions/facilities-figma-design.md).

## Build plan

- Refine `src/components/facility-*.tsx` and `src/app/styles/facilities.css` using
  the existing shell, compact phone header, register table, tabs, fields,
  lookups, validation and original-operation recovery.
- Extend `src/shared/facilities/reads.ts` where needed for permitted view counts,
  grid metadata and installed/serving/ended equipment. Reuse current schema and
  permissions; no migration, capability or dependency is planned.
- Use deterministic synthetic fixtures for desktop, tablet, phone and state
  comparisons. Preserve existing server version checks and recovery semantics.
- Update the five CS-05 page contracts, their register and Draft guides,
  component consumer bindings as applicable, generated build sequence and a
  status fragment in this PR.
- Run documentation, lint, types, unit, build and focused application/browser
  checks; record results and environment limits here before handover.

Risks to resolve: permission-scoped equipment counts, paginated hierarchy and
lookup completeness, stale/uncertain proposals, 320 px layout, and shared-shell
differences. Sources/History full-size redesign, pin review, service-link
dialogs and Conversations are outside this change. Existing behaviour stays
available where appropriate; missing design behaviour will be recorded rather
than invented.

## Verification

In progress. No implementation verification, owner review or deployment is
claimed by this initial work claim.
