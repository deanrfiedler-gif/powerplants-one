# Service requests implementation evidence

<!-- versioning: git; committed history is authoritative -->

Scope SV-01/SV-02. Design: PPO - Design, page 1249:9313, named version Service requests — accepted. Owner implementation visual review: **pending**. This ledger is implementation evidence, not business acceptance or deployment.

## Validation in progress

- Migration 0112 applied successfully to a separate local PostgreSQL 16 instance, database ppo_synthetic_test. No seed or grant changes.
- Initial intake suite could not reset the schema with PostgreSQL's default lock capacity. The separate test instance was raised to max_locks_per_transaction=512. A subsequent run encountered local timeouts; those are retained pending comparison with unchanged main.
- Initial TypeScript run found a DTO assumption in the new record label helper; fixed. Subsequent full check is in progress.
- Default development startup encountered Windows Turbopack's external node_modules junction restriction. A webpack compilation is being attempted using the existing Next installation; this is not a dependency change.
- Live desktop, tablet, 390 px, 320 px and state references were fetched privately. All retained icon-free reference bytes are unchanged. Runtime comparison is pending.

Final commands, outcomes and remaining limitations will replace this in-progress section before handover. Screenshots containing licensed icons remain outside Git.
