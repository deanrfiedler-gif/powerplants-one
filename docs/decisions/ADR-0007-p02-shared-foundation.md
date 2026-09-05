# ADR-0007 — P02 shared data foundation

**Date:** 5 September 2026 · **Status:** Selected within Dean's authorised P02 increment; execution and merge evidence in the [handover](../delivery/p02-handover.md). **Related:** P02, DAT-01–DAT-03, CRM-01/06, BP-02/BP-07, API-R01/R02/R09/C01, PPO-STD-001, PT-01/02/03 components.

## Decision and alternatives

Extend the P01 TypeScript/Next.js/PostgreSQL modular monolith and its server sessions, grants, transaction, audit, operation receipt and outbox. Keep every runtime/dependency pin and lockfile unchanged. No new framework, service, ORM or identity provider is needed. A new generic entity store, duplicate command framework and microservices would obscure the existing typed transactional boundary.

Add typed organisations, people, person/company visibility contexts, affiliations, sites, effective site parties, facilities, assets, account mappings, configuration snapshots, location events and attributed history. The `business_identities` registry holds only identity/type/reference; typed tables retain all business content. Deferred database checks ensure a registry row has its typed target. Accepted identities cannot be deleted, relabelled, transferred between types or reused.

Organisation and Site have an explicit **operational visibility company** in P02. This is a permission boundary, not a debtor account or assertion of legal ownership. An organisation may have several effective source mappings within that context; no mapping is automatically created with an organisation. Cross-company organisation/site sharing and identity consolidation are deferred. They will require an explicit grant/junction migration rather than changing an existing company's identity in place. Person identities are workspace-wide and have explicit company contexts; affiliations do not duplicate people. An affiliation can only link a person authorised in that company context.

## References, source provenance and upgrade

Migration 0002 preserves migration 0001's bytes/checksum and all P01 tickets, grants, audit rows, receipts and outbox content. A connection UUID is introduced without casting the P01 text key: the exact old key is retained in `companies.legacy_erp_connection_key` and `erp_connections.external_connection_key`. Existing distinct workspace/provider/key tuples receive one connection UUID. Fresh fixture connections have deterministic UUIDs; an upgraded database retains its migration-assigned UUIDs. The semantic tuple is identical; UUID equality across separate database universes is not claimed.

Adopt every existing P01 ticket reference into the permanent registry and initialise each TKT counter from the greatest accepted suffix. ORG/SITE/AST/TKT counters use workspace/type/`SYN-PPO`, atomic PostgreSQL upsert, immutable identity registration and database uniqueness. Explicit fixture numbers advance counters with `greatest`, never rewind them. Required references are assigned by the database trigger before an accepted insert. Client commands cannot supply them. Failed transactions can roll back an unaccepted allocation; accepted numbers are permanent. Gaps are permitted. No row count, annual reset or external key conversion is used. Person/Facility/relationship/event references remain UUID-only.

`db/seed-p01.sql` preserves the original P01 seed for upgrade tests. Current `db/seed.sql` fills missing deterministic fixtures once, guarded by a transactional seed receipt. Repeat seed performs no business/grant writes and does not revive revoked grants, overwrite edits or reset counters. An explicit full disposable reset creates a new synthetic database universe. It is not ordinary reseeding or operational recovery.

## Integrity and history

Composite foreign keys enforce workspace/company and relevant same-site relationships. Date ranges are finite and positive, with half-open intervals. One Operator may occupy a site's instant; Owner and BillingParty allow several distinct organisations but no duplicate overlapping same-party role. Affiliation duplicates, active exact-source mapping overlaps and configuration interval overlaps are rejected. Same names and duplicate serial candidates remain separate identities.

Organisation, Facility, Asset and predecessor cycles are checked under a workspace row lock. Shared mutations acquire that lock before graph reads; trigger checks cover direct SQL changes. This intentionally serialises a workspace's shared writes for the small prototype. A scalable finer-grained lock strategy is deferred until there is measured contention; independent workspaces remain independent. Exclusion/FK/unique constraints provide additional database enforcement.

Asset configuration and location records and HistoryRecord content are append-only. Location chains must agree with the current asset site. P02 blocks asset/facility site reassignment; it does not expose the later reviewed move-impact workflow. The fixtures include a complete historical move chain and finite/successor configuration intervals. Publishing a successor to an already open configuration interval requires a later explicit revision/supersession migration and command; do not edit the snapshot to get around its protection.

History stores original occurrence time, historical author label, source key, confidence, captured site/operator labels and identity uncertainty separately from the server actor and capture time. An imported historical author need not be a current User. Backdated records do not automatically inherit today's asset identity conclusion: unknown historical state is null unless a known synthetic fixture supplies it. Renaming an organisation or verifying an asset never rewrites captured history. This is historical context evidence, not a completed report/visit model.

## Permissions and API boundaries

Extend the existing grant table with explicit Workspace/Company/Site scope and typed foreign keys. Assignment is deliberately not an enabled scope value. The synthetic Technician has no business grants until actual assignment records and checks exist. Systems still has no default business authority. Site observer is a diagnostic profile with an explicit site read grant, not a claim that technician assignment access has been implemented.

Implemented capabilities: `shared.read`, `shared.create`, `shared.edit`, `shared.internal.read`, `shared.finance.read`, `shared.history.record`; existing `service.ticket.read/edit` remain company-scoped. No permission administration API or live roles are added. A capability and applicable record scope are both required. Source-account verification and business approval remain separate future permissions.

Scoped DTOs filter direct reads, lists, filters, pagination and nested relationships. Site-scoped reads do not inherit other-company person affiliations, account identifiers, internal notes, Finance notes or previous-site history. Location events require access to both sides of the move. RestrictedService/CustomerApproved history still needs site access; Internal/RestrictedFinance history requires its extra capability. P02 has no customer-facing output or portal. Account mapping state is distinct from keys; exact keys require a company-level internal/source or Finance grant. No balances, margins or ledger totals are exposed.

Collections use bounded pages, UUID ordering and signed opaque cursors bound to actor/workspace/resource/filters/page size. Process restart invalidates these cursors; clients must start a fresh read. Creation accepts a stable client UUID but derives actor/workspace/audit time from the server. Typed updates require expected versions. Replay checks current permission before returning the immutable original receipt. Same operation/different normalised content fails. Business changes, relationships, evidence and outbox commit together. `/operations/:id` is actor-scoped and rechecks current target/mutation authority.

## Deliberate deferrals and migration consequences

- Activity/follow-up records and SC-01–SC-04 business screens are P03. The unresolved OEM query fixture explicitly says its owned activity is not yet implemented.
- Controlled DocumentReference verification, evidence upload, configuration approval and ERP account verification are deferred. P02 mappings are Proposed; a database constraint prohibits Verified. No fixture pretends that a nonexistent document is verification evidence. The later verification migration must introduce a typed evidence FK, reviewer and review instant before removing that restriction.
- Booking-stage address/access/contact validation, work authorisation, appointments, packs, reports, Finance, workers and offline queues are outside P02. Address/coordinates are typed persistence fields; booking-stage form/command support is deferred. There is no synthetic-to-operational conversion.
- Full asset moves, prior-identity reconstruction from source revisions, relationship correction workflows, lifecycle transitions and cross-company identity consolidation need later typed commands/migrations. P02 provides required data relationships, immutable snapshots and deliberate refusal paths, not those workflows.

These are bounded physical implementation decisions under the ordered P02 brief and current user instruction. The dictionary's broad final paragraph does not expand P02 to every PP-01 record. No parent requirement or full PT case is declared complete.

## Technical sources

Checked on 5 September 2026: [PostgreSQL 16 constraints](https://www.postgresql.org/docs/16/ddl-constraints.html), [transaction isolation](https://www.postgresql.org/docs/16/transaction-iso.html), [explicit locking](https://www.postgresql.org/docs/16/explicit-locking.html). Foreign keys, uniqueness and exclusion constraints provide declarative cross-row integrity; the hierarchy's additional lock/trigger strategy is this application's decision and is tested separately. Prior supported dependency selection is retained from ADR-0006; no dependency change needs new lockfile resolution.
