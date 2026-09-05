# Current prototype status

**Updated:** 5 September 2026 · **Owner:** Dean Fiedler · **Repository:** personal/private · **Stage:** P04 work scope, coverage and readiness component-verified; verification/publication evidence in the handover. PP-01 remains incomplete.

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

## P02 and P03 delivery

P02 is implemented and component-verified under [issue #22](https://github.com/deanrfiedler-gif/powerplants-one/issues/22) and [PR #23](https://github.com/deanrfiedler-gif/powerplants-one/pull/23). The [P02 handover](delivery/p02-handover.md) records current verification/merge evidence, exact commands and limitations. [ADR-0007](decisions/ADR-0007-p02-shared-foundation.md) covers typed shared records, P01 migration, scope boundaries, immutable history, atomic references and non-destructive seed. This does not resolve operational ownership, department authority or live account verification.

P03 delivers SC-01–SC-04 business views, owned Activity/ActivityLink, additive intake mapping, bounded TR-01 transitions and API-C24 extensions under [issue #24](https://github.com/deanrfiedler-gif/powerplants-one/issues/24) and [PR #25](https://github.com/deanrfiedler-gif/powerplants-one/pull/25). [ADR-0008](decisions/ADR-0008-p03-customer-intake.md) records the compatibility and permission decisions; the [P03 handover](delivery/p03-handover.md) records exact commands, actual checks, limitations and publication status. The final implementation run passed 4 unit, 29 PostgreSQL, 4 HTTP and 12 Chromium cases; 38 desktop/mobile captures were inspected and retained. There is no independent-review claim.

## P04 delivery and next dependency

P04 under [issue #26](https://github.com/deanrfiedler-gif/powerplants-one/issues/26) and [PR #27](https://github.com/deanrfiedler-gif/powerplants-one/pull/27) implements SC-05: explicit ticket junction, scoped work orders, immutable approved revisions, items/assets/identification limits, manual synthetic authority, distinct coverage, server-controlled readiness and Proposed visits. [ADR-0009](decisions/ADR-0009-p04-work-scope-readiness.md) defines the small physical/contract amendments, including the known-site identification boundary and no financial disposition. The [P04 handover](delivery/p04-handover.md) is the actual test/visual/publication record; independent review and owner acceptance are not implied.

The next bounded task is **P05 — Planner and controlled changes**, with a [prepared starter prompt](delivery/p05-starter-prompt.md). P05 has not started. Appointment confirmation, resource reservation, planner and controlled changes remain unimplemented. Packs, field execution, offline queues, reports, Finance processing and live integrations remain P06+. Follow P01–P12 in order. All full PT/AT procedures and the complete PP-01 journey remain incomplete.

## Repository and publication controls

The inspected repository is private with main as default branch. Branch protection was not enabled in the baseline, and a GitHub Projects board has not been provisioned. Existing Issues and the versioned backlog are used. No claim is made that checks are enforced by branch rules. See [foundation handover](delivery/foundation-handover.md) for earlier work and [package assurance](prototype/assurance.md) for this package's validation/publication status.
