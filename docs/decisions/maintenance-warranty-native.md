# Native Maintenance and Warranty workflows

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: implementation decision under the owner's 24 September 2026 repository instruction; business and visual acceptance pending.

Decision ID: PPO-MA-NATIVE-DEC. Integration instruction renewed on 7 October 2026. The current contribution uses reserved migration 0051 on main `58679be`; Supply retains issued ADR-0049 and migration 0049. The original Maintenance branch used that number before integration; its evidence remains source-bound. No new technology is selected: the implementation continues the architecture and alternatives below.

## Context and authority

At the original implementation checkpoint, main `0f10b7fb46a8ab512e9b019573ece272cf5920b9` contained Equipment 0045, Sales 0046, Engineering 0047 and cost sources 0048. MA-01–MA-07 and native SC-08 returns were absent. The original checkout’s unrelated edits were preserved. Current integration uses `codex/maintenance-warranty-completion`; native Supply is now present, while its Warranty receiving bridge remains unimplemented. PPO-015 (#15) remains the parent work package.

The user expressly authorises native implementation of SVC-12.1–SVC-12.5, with AT-19/AT-33 and relevant AT-25 proof. Historical source/policy gates do not prohibit synthetic implementation. Issued Maintenance and Warranty r01 HTML remains unchanged. Their fictional policy and local-storage persistence are not adopted as operational rules.

## Decision

Reuse BP-02's Next.js/TypeScript/PostgreSQL modular monolith, existing shared operations, current company/Site permissions, canonical Equipment, Service intake, Work Order scope, reviewed Service reports and Activities. No dependency, framework, hosting or external integration is introduced.

Add typed agreement, entitlement, plan, occurrence, renewal, warranty and recovery records. Immutable revisions/events retain exact evidence and predecessor identities. Validated JSON snapshots hold versioned terms and evidence; relational keys retain cross-domain identities. Permissions are action-based. Every command rechecks current access before receipt replay, checks the observed version for new work, and commits its audit, receipt and outbox atomically.

Monthly/quarterly generation uses an explicit sourced interval, retained anchor and IANA timezone. A logical occurrence key is plan identity plus original local due date. A reviewed successor applies only to ungenerated dates on or after its effective date. Existing obligations retain their original revision and task identities; defer changes a separate target. Removed or moved Equipment requires an explicit future-maintenance review.

Preparing work creates one canonical owned Service request against an immutable source package. Service retains Work Order authorisation, scheduling and dispatch. An entitlement assessment may be referenced from immutable Work Order coverage; it neither replaces that record nor grants work/billing authority. Completion requires exact reviewed Service task outcomes, not a free-text assertion that a visit finished.

Warranty evidence review, coverage, causation, exact-plan goodwill, work authority, remedy receiving, customer updates/responses and customer resolution remain distinct. Equipment replacement is performed through Equipment commands. Customer resolution can coexist with outstanding supplier recovery. Supplier approval, Finance credit references, unrecovered disposition and physical-return evidence remain separate. Money is integer minor units with explicit currency/tax basis; no exchange or tax policy is inferred.

Native SC-08 exists, but Warranty is not integrated with its return receiving commands. New events identify this boundary as `NotIntegrated` / `SupplyReceivingNotIntegrated`; retained events stay unchanged. Warranty retains claim identity and a replaceable receiving boundary, and can retain externally evidenced return stages without claiming stock custody or creating a Supply Chain transaction. Finance links evidence of an existing synthetic external credit; PPO does not post credits or claim cash recovery.

## Alternatives and constraints

- Reusing Work Order coverage as the agreement master would collapse distinct ownership and history; rejected.
- Porting standalone browser storage would lose shared permission, concurrency and recovery guarantees; rejected.
- A generic entity store or new service/framework would weaken typed relationships and add unnecessary infrastructure; rejected.
- Arbitrary recurrence, date-based warranty adjudication, automatic renewal acceptance and automatic maintenance transfer lack adopted policy; excluded.

## Consequences and review

Migration 0051 must preserve existing rows and receipts, including upgrades across 0026 with estimates. Permission changes require access-review regeneration and cross-domain grant assertions. The live design register, guides and API/data contracts accompany routes. Automated evidence, visual inspection, owner acceptance and deployment remain separate. No live messages, ERP writes or deployment are authorised.

Canonical Equipment replacement review can recognise an exact completed Maintenance replacement result even while its originating Service request remains administratively open. The impact snapshot retains the current report/result, latest plan, latest entitlement and exact Service/goodwill decision. Every open work order and ticket must be covered by that reviewed replacement evidence; unrelated open work remains blocking. No Service record is silently closed. Equipment remains the physical-change authority and marks existing plans ReviewRequired.
