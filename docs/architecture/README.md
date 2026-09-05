# BP-02 architecture work brief

**Status:** Scope for the next specification, not a selected architecture.

Define a maintainable prototype architecture against the master Section 23.4 and DAT-01–DAT-11 contracts. Begin with the smallest coherent service journey; retain room for all seven business domains without building their full interfaces prematurely.

## Required outputs

| Area | Reviewable output |
|---|---|
| Runtime and hosting | Options, constraints, costs and decision record; development/test separation and future production path |
| Data and authority | Logical-to-physical mapping, company/entity keys, field ownership, concurrency, history and source-as-at semantics |
| Service model | ERP-owned versus platform-owned operational records assessed under D-007; one writable authority per phase |
| Integration | Read/manual/command modes, API evidence, idempotency, partial failure, reconciliation and source outage behaviour |
| Documents | Stable SharePoint reference model and exact issue preservation; native CAD boundary |
| Identity and access | Role/action/data controls, device/cache scope, server enforcement and audit |
| Operability | Monitoring, backup/restore, deployment/schema compatibility, migration, support and cost assumptions |
| Validation | Representative synthetic fixtures plus later authorised non-production proofs for critical source assumptions |

Use local repository ADR identifiers for decisions. Do not select a framework because it appears in a template or workflow. Python is used only for repository documentation checks at this stage; it is not the application-stack choice.

Follow [the initial backlog](../delivery/backlog.md) and preserve [current decisions](../decisions/decision-register.csv). The paired BP-07 work is described in [the first-release brief](../delivery/first-release.md).
