---
title: Field team PL-02 native accepted-design build
date: 2026-10-21
---

The [Field team native build](../decisions/field-team-native-build.md) implements the accepted PL-02 register and read-only person record in the existing routes. Technicians is the default; the compact grid/phone list, person snapshot, seven-day availability, competence evidence and person-filtered View visits reuse existing scoped reads and shared controls. Planner booked-hours semantics are reused, resource type substitutes for unpublished role, and reviewer IDs remain explicit. No migration, capability, source edits or Conversations action is added. The page contracts, three guide entries and component consumer bindings are updated together. [Execution evidence](../testing/evidence/field-team-build/README.md) records checks and limitations. Column settings and undrawn responsive/menu compositions remain explicit gaps. Owner visual review is pending; deployment and business acceptance are not claimed.

CI repair follow-up: the shared Chrome maintenance repair landed separately on main in `36c55914` through PR #630. Field team uses that baseline and retains only its own test/evidence repairs; ten selected desktop/phone backend browser cases pass against a separately created disposable synthetic database. Full CI status is recorded on #648, separately from owner visual review.

The compiled desktop budget exhausted on unchanged main and the earlier #648 head. Its separately maintained two-shard workflow then passed at `d0775e28`: all 66 checks succeeded, including 971 units, both compiled desktop shards (544 unique passed / 21 skipped, with warm-up repeated), phone (485 passed / 80 skipped), retained Scheduling, every database and application workflow. The original Reports/Specialist navigation failures remain recorded; partitioning is not claimed to fix them. After #648 was merged into #652 outside this session, Dean requested separate review scopes again. Infrastructure-only #653 is the parent; #652 continues the same Field team change above current main, preserving both PL-02 and CS-08 component bindings. Fresh integration CI remains pending, and owner visual review remains pending.

<!-- decision-index -->

[Field team native build](../decisions/field-team-native-build.md) records implementation of accepted PL-02, including the planner hours rule, existing source-read sufficiency and open design details. Owner visual review remains pending.
