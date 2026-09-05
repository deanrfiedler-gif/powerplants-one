# Current prototype status

**Updated:** 5 September 2026 · **Owner:** Dean Fiedler · **Repository:** personal/private · **Stage:** prototype definition and architecture complete as documents; application implementation not started.

## Current direction

Dean chose to create his own private prototype and authorised the repository foundation, then explicitly requested the First Prototype Definition & Architecture package: scoped service journey, BP-02, BP-07, minimum Finance/document contracts and an ordered implementation plan.

The [PP-01 package](prototype/README.md) now defines that synthetic planned-service journey. The technology design recommendation is TypeScript/Next.js with PostgreSQL, explicit domain services, a durable outbox, bounded browser offline capture and simulated source adapters. [ADR-0003](decisions/ADR-0003-prototype-architecture.md) records its scope and pending feasibility.

## What exists

- Master working document with stable filename and an unchanged issued v02 baseline; preserved v01/audit references.
- Original 78-parent requirement index, 29 decision register, 38 master acceptance scenarios and 16 linked discovery/design issues.
- PP-01 scope, BP-02, BP-07, complete selected data/choice and API contracts, Finance/document contracts, decision/evidence treatment and implementation plan.
- Fifteen screens, twelve reusable components, all sixteen master TR transitions, twenty service rules, twenty-four validation messages, twenty-six command families and ten read contracts.
- Thirty synthetic acceptance procedures and structured catalogue; twelve ordered implementation work packages.
- All 78 parents dispositioned: 24 Core, 25 Partial, 29 Deferred within this prototype. These are scope classifications, not completed requirements.
- Repository documentation checks for source hashes, baseline registers, local links and package traceability; actual check evidence in package assurance/publication records.

## What is not implemented

There is no runnable application, installed application framework, application database, operational source integration, migrated dataset, hosted environment or production service. The design selects a prototype stack recommendation; implementation versions and feasibility are P01 work. All application acceptance procedures remain Not run.

No paid service, repository visibility/membership change, source-system transaction, customer message or migration is performed by this documentation package. MYOB and SharePoint configuration/authority remain unverified. Pipedrive, Smartsheet and native CAD retain their existing roles.

## Decision state

D-003/D-004/D-022/D-029 are partially resolved for repository naming, selected synthetic journey and recommended prototype design. The other 25 master decisions remain open; none is fully closed. [Current evidence treatment](prototype/decisions-and-evidence.md) distinguishes useful design detail from operational closure evidence.

Dean owns private prototype decisions. Proposed department roles do not assign employees, approve an organisation chart or establish corporate sponsorship. SOL008 remains the separate PPA Smartsheet Delivery System reference; GEN is provisional here.

## Immediate next task

[P01 — Application foundation and architecture proof](delivery/prototype-implementation-plan.md#4-p01-implementation-brief): prepare a reproducible local synthetic application, pin supported dependencies, verify PostgreSQL/permission/operation/reservation foundations, and record evidence. Follow the ordered P01–P12 plan. Missing operational facts do not prevent synthetic development under the explicit assumptions.

## Repository and publication controls

The inspected repository is private with main as default branch. Branch protection was not enabled in the baseline, and a GitHub Projects board has not been provisioned. Existing Issues and the versioned backlog are used. No claim is made that checks are enforced by branch rules. See [foundation handover](delivery/foundation-handover.md) for earlier work and [package assurance](prototype/assurance.md) for this package's validation/publication status.
