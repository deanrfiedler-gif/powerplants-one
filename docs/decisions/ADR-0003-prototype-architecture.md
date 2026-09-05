# ADR-0003 — Prototype application architecture

**Status:** Selected architecture; P01 implementation/evidence now tracked in [ADR-0006](ADR-0006-p01-local-foundation.md) and the [P01 handover](../delivery/p01-handover.md). **Date:** 5 September 2026. **Related:** D-022/D-023, NFR-01–NFR-12.

## Context and options

The private prototype needs interactive desktop/mobile workflows, relational integrity, exact issued evidence, offline recovery and eventual MYOB/SharePoint integration. No application stack or delivery/support team was established by the repository foundation.

[BP-02](../architecture/BP-02-platform-architecture.md) compares TypeScript/Next.js/PostgreSQL, ASP.NET Core, a managed backend, Power Platform and early microservices. The assessment is qualitative and does not claim actual staff skills, account entitlements, benchmark results or vendor pricing.

## Selected design

One TypeScript/Next.js modular monolith, PostgreSQL with explicit migrations/constraints, typed domain services, a durable database outbox/worker, maintained protocol libraries, and replaceable ERP/document/distribution adapters. React supports the interactive UI; a limited service-worker/IndexedDB subsystem handles assigned field context and durable capture. Use Playwright plus meaningful database/API tests, and real-device verification where emulation is insufficient.

Begin locally with synthetic data and adapters. A local-only development identity adapter still exercises server permissions and is prohibited in remotely exposed environments. Select Entra-compatible OIDC for the future corporate identity boundary after tenant proof. Assess Azure container hosting/managed PostgreSQL for a later private remote prototype; hosting purchase and operational ownership remain unresolved.

## Rationale and trade-offs

The shared browser/server language and one transactional core reduce initial coordination overhead while preserving domain boundaries. PostgreSQL can enforce booking/allocation invariants. SQL migrations keep integrity rules visible. Offline and external effects remain difficult and receive explicit proof rather than being delegated to a framework assumption.

C# remains a credible alternative if a committed support team or integration constraint favours it. A managed backend may reduce provisioning but does not remove source ownership, Finance, permissions or recovery design. Microservices are deferred until there is a measured scaling/team need.

## Proof and revisit conditions

P01 must verify supported pinned dependencies, reproducible build, database constraint feasibility and the identity boundary. P08 verifies offline storage/replay; P10 Finance conservation/unknown outcomes; P12 recovery/deployment. Record costed hosting options before remote provisioning. Revisit if the owner/support skill model, actual MYOB service ownership, offline device constraints or host capabilities invalidate the recommendation.

This is an architectural selection within the requested design task, not a claim that Dean approved a corporate technology standard or that infrastructure has been provisioned. D-022 is partially resolved for prototype design only; D-023 remains open.
