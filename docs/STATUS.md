# Current prototype status

**Updated:** 5 September 2026 · **Owner:** Dean Fiedler · **Repository:** personal/private · **Stage:** P01 local application foundation complete; PP-01 business workflows incomplete.

## Current direction

Dean chose to create his own private prototype and authorised the repository foundation, then explicitly requested the First Prototype Definition & Architecture package: scoped service journey, BP-02, BP-07, minimum Finance/document contracts and an ordered implementation plan.

The [PP-01 package](prototype/README.md) now defines that synthetic planned-service journey. The technology design recommendation is TypeScript/Next.js with PostgreSQL, explicit domain services, a durable outbox, bounded browser offline capture and simulated source adapters. [ADR-0003](decisions/ADR-0003-prototype-architecture.md) records its scope; [ADR-0006](decisions/ADR-0006-p01-local-foundation.md) and the P01 handover record the bounded implementation proof.

Dean has now adopted the independent [PPO-STD-001 naming standard](standards/naming-conventions.md) and authorised its repository implementation. [ADR-0005](decisions/ADR-0005-project-naming-adoption.md) records Powerplants One / PPO, the stable master path, removal of the other project's STD-001 dependency and the scoped contract alignment. The [ChatGPT project instructions](standards/chatgpt-project-instructions.md) are maintained in the repository for the dedicated project.

## What exists

- Adopted naming r02 preserved exactly, with working r03 adoption edition, document/exception registers and naming checks.
- Master working document with stable filename and an unchanged issued v02 baseline; preserved v01/audit references.
- Original 78-parent requirement index, 29 decision register, 38 master acceptance scenarios and 16 linked discovery/design issues.
- PP-01 scope, BP-02, BP-07, complete selected data/choice and API contracts, Finance/document contracts, decision/evidence treatment and implementation plan.
- Fifteen screens, twelve reusable components, all sixteen master TR transitions, twenty service rules, twenty-four validation messages, twenty-six command families and ten read contracts.
- Thirty synthetic acceptance procedures and structured catalogue; twelve ordered implementation work packages.
- All 78 parents dispositioned: 24 Core, 25 Partial, 29 Deferred within this prototype. These are scope classifications, not completed requirements.
- Repository documentation checks for source hashes, baseline registers, local links and package traceability; actual check evidence in package assurance/publication records.

## Implemented foundation and remaining scope

P01 adds a runnable local shell, strict synthetic identity, draft-ticket command, SQL migration/fixtures, reservation experiment and automated checks. [P01 handover](delivery/p01-handover.md) records exact versions, commands, execution limits and current verification/publication state. No operational source integration, migrated dataset, hosted environment or production service exists. All 30 full PT acceptance procedures remain Not run; P01 component tests are recorded separately.

No paid service, repository visibility/membership change, source-system transaction, customer message or migration is performed by P01. MYOB and SharePoint configuration/authority remain unverified. Pipedrive, Smartsheet and native CAD retain their existing roles.

## Decision state

D-003 is resolved for this personal prototype: Powerplants One, PPO and its independent naming standard are user-adopted. D-004/D-022/D-029 remain partially resolved. The other 25 master decisions remain open. Corporate programme designation, if ever requested, would be a new scoped decision rather than a dependency on another project. [Current evidence treatment](prototype/decisions-and-evidence.md) distinguishes useful design detail from operational closure evidence.

Dean owns private prototype decisions. Proposed department roles do not assign employees, approve an organisation chart or establish corporate sponsorship. PPO is the adopted local project code; GEN remains only in preserved historical source names. SOL008 and the other project's STD-001 are outside this project's naming authority.

## Immediate next task

P01 is implemented and verified under [issue #20](https://github.com/deanrfiedler-gif/powerplants-one/issues/20) and [PR #21](https://github.com/deanrfiedler-gif/powerplants-one/pull/21). This increment stops with the [bounded P02 handover](delivery/p01-handover.md#next-bounded-task--p02-not-started). Follow the ordered P01–P12 plan. Missing operational facts do not prevent synthetic development under the explicit assumptions.

## Repository and publication controls

The inspected repository is private with main as default branch. Branch protection was not enabled in the baseline, and a GitHub Projects board has not been provisioned. Existing Issues and the versioned backlog are used. No claim is made that checks are enforced by branch rules. See [foundation handover](delivery/foundation-handover.md) for earlier work and [package assurance](prototype/assurance.md) for this package's validation/publication status.
