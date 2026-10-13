# DK-06 controlled template use evidence

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Status:** Synthetic backend verification in progress. Independent review, owner acceptance, native controls and deployment remain separate.

Base: R3 commit 52f5636706f2ad586f4317f743d096f418a34598 / PR #476. The [decision](../../../decisions/template-use-assignment-backend.md) and [contract](../../../contracts/template-use-assignment.md) bound R4 to company/site OUT-09 use.

The initial six database scenarios pass: default denial and exact adoption/recovery; server-time intervals/overlap/gap behaviour; concurrency, rollback and SQL graph controls; current scope and authority; real native PDF issue without template-management grants; and refusal of stale issue after durable storage. Final compilation, API, populated-upgrade, restart and broader regression checks are recorded when executed.

All three populated R2/R3/R4 upgrades pass. The 0093 case preserves exact publication/output/authority/audit/receipt/seed rows and the original ledger, adds only 0094, and proves repeated migration/seeding is inert. The unchanged R3 definition remains supported. A reserved legacy pack completes under a future scoped assignment, while a changed pre-activation baseline blocks new preparation. TypeScript, the 150-capability access model and the working design-register integrity check pass.

Existing R3 renderer and dependency-source bytes remain unchanged. No new framework, dependency, seed, user or grant is introduced. All runtime data is synthetic ppo_synthetic_test; private configuration and raw logs remain outside Git. Source delivery and verification do not confer business or deployment approval.
