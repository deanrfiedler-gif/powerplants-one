---
title: Field team PL-02 native accepted-design build
date: 2026-10-21
---

The [Field team native build](../decisions/field-team-native-build.md) implements the accepted PL-02 register and read-only person record in the existing routes. Technicians is the default; the compact grid/phone list, person snapshot, seven-day availability, competence evidence and person-filtered View visits reuse existing scoped reads and shared controls. Planner booked-hours semantics are reused, resource type substitutes for unpublished role, and reviewer IDs remain explicit. No migration, capability, source edits or Conversations action is added. The page contracts, three guide entries and component consumer bindings are updated together. [Execution evidence](../testing/evidence/field-team-build/README.md) records checks and limitations. Column settings and undrawn responsive/menu compositions remain explicit gaps. Owner visual review is pending; deployment and business acceptance are not claimed.

CI repair follow-up: the shared Chrome maintenance repair landed separately on main in `36c55914` through PR #630. Field team uses that baseline and retains only its own test/evidence repairs; ten selected desktop/phone backend browser cases pass against a separately created disposable synthetic database. Full CI status is recorded on #648, separately from owner visual review.

The later compiled desktop run reaches its job limit on both unchanged main and #648. Separate maintenance PR #652 partitions that existing suite; #648 temporarily targets it to keep infrastructure outside the page diff. Prior-head application, database and phone checks pass, but the final inherited-workflow result remains pending. The evidence records the original Reports/Specialist navigation failures without claiming that partitioning fixes them.

<!-- decision-index -->

[Field team native build](../decisions/field-team-native-build.md) records implementation of accepted PL-02, including the planner hours rule, existing source-read sufficiency and open design details. Owner visual review remains pending.
