# ADR-0049 — Native Maintenance and Warranty workflows

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: implementation decision under the owner's 24 September 2026 repository instruction; business and visual acceptance pending.

## Context and authority

Fetched main `0f10b7fb46a8ab512e9b019573ece272cf5920b9` contains Equipment migration 0045, Sales 0046, Engineering 0047 and cost sources 0048. MA-01–MA-07 and native Supply Chain SC-08 returns remain absent. Issue #15 remains open; open PR #314 concerns ES-02 documentation. The starting checkout `docs/field-quality-build-plan` at `ca006fb1` has unrelated documentation edits. They are preserved; this work uses `feat/maintenance-warranty-native` in an isolated worktree.

The user expressly authorises native implementation of SVC-12.1–SVC-12.5, with AT-19/AT-33 and relevant AT-25 proof. Historical source/policy gates do not prohibit synthetic implementation. Issued Maintenance and Warranty r01 HTML remains unchanged. Their fictional policy and local-storage persistence are not adopted as operational rules.

## Decision

Reuse BP-02's Next.js/TypeScript/PostgreSQL modular monolith, existing shared operations, current company/Site permissions, canonical Equipment, Service intake, Work Order scope, reviewed Service reports and Activities. No dependency, framework, hosting or external integration is introduced.

Add typed agreement, entitlement, plan, occurrence, renewal, warranty and recovery records. Immutable revisions/events retain exact evidence and predecessor identities. Validated JSON snapshots hold versioned terms and evidence; relational keys retain cross-domain identities. Permissions are action-based. Every command rechecks current access before receipt replay, checks the observed version for new work, and commits its audit, receipt and outbox atomically.

Monthly/quarterly generation uses an explicit sourced interval, retained anchor and IANA timezone. A logical occurrence key is plan identity plus original local due date. A reviewed successor applies only to ungenerated dates on or after its effective date. Existing obligations retain their original revision and task identities; defer changes a separate target. Removed or moved Equipment requires an explicit future-maintenance review.

Preparing work creates one canonical owned Service request against an immutable source package. Service retains Work Order authorisation, scheduling and dispatch. An entitlement assessment may be referenced from immutable Work Order coverage; it neither replaces that record nor grants work/billing authority. Completion requires exact reviewed Service task outcomes, not a free-text assertion that a visit finished.

Warranty evidence review, coverage, causation, exact-plan goodwill, work authority, remedy receiving, customer updates/responses and customer resolution remain distinct. Equipment replacement is performed through Equipment commands. Customer resolution can coexist with outstanding supplier recovery. Supplier approval, Finance credit references, unrecovered disposition and physical-return evidence remain separate. Money is integer minor units with explicit currency/tax basis; no exchange or tax policy is inferred.

Native SC-08 is unavailable. Warranty retains claim identity and a replaceable receiving boundary, and can retain externally evidenced return stages without claiming stock custody or creating a Supply Chain transaction. Finance links evidence of an existing synthetic external credit; PPO does not post credits or claim cash recovery.

## Alternatives and constraints

- Reusing Work Order coverage as the agreement master would collapse distinct ownership and history; rejected.
- Porting standalone browser storage would lose shared permission, concurrency and recovery guarantees; rejected.
- A generic entity store or new service/framework would weaken typed relationships and add unnecessary infrastructure; rejected.
- Arbitrary recurrence, date-based warranty adjudication, automatic renewal acceptance and automatic maintenance transfer lack adopted policy; excluded.

## Consequences and review

Migration 0049 must preserve existing rows and receipts, including upgrades across 0026 with estimates. Permission changes require access-review regeneration and cross-domain grant assertions. The live design register, guides and API/data contracts accompany routes. Automated evidence, visual inspection, owner acceptance and deployment remain separate. No live messages, ERP writes or deployment are authorised.

Canonical Equipment replacement review can recognise an exact completed Maintenance replacement result even while its originating Service request remains administratively open. The impact snapshot retains the current report/result, latest plan, latest entitlement and exact Service/goodwill decision. Every open work order and ticket must be covered by that reviewed replacement evidence; unrelated open work remains blocking. No Service record is silently closed. Equipment remains the physical-change authority and marks existing plans ReviewRequired.
