# Architecture index

[BP-02 — Platform Solution Architecture](BP-02-platform-architecture.md) is the current prototype design recommendation. It defines options/rationale, topology, data/authority, concurrency, source adapters, identity, offline, documents, hosting/cost inputs, updates, testing, monitoring and recovery.

Read [ADR-0003](../decisions/ADR-0003-prototype-architecture.md), [ADR-0004](../decisions/ADR-0004-service-authority-and-offline-scope.md), the [data dictionary](../contracts/service-data-dictionary.md) and [API contract](../contracts/service-api.md) together. The recommendation is not an implementation or operational approval. P01 performs initial feasibility; tenant-specific proof remains in the decision register.

The complete [PP-01 package](../prototype/README.md) pairs this architecture with BP-07 and the minimum Finance/document contracts. Python remains a documentation-check utility, not the chosen application runtime.
