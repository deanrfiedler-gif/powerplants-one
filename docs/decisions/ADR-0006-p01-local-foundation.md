# ADR-0006 — P01 local foundation implementation

**Status:** Selected for authorised P01 implementation; execution evidence recorded separately. **Date:** 5 September 2026. **Related:** P01, BP-02, ADR-0003/0004/0005, D-022/D-023, API-R03/API-C02, DAT-04, PT-01/PT-08/PT-09 components.

## Decision and rationale

Implement the selected TypeScript/Next.js modular monolith with a small relational PostgreSQL core. Use an explicit draft-ticket service rather than implementing triage or work authorisation prematurely. The read and typed draft-save extension use the existing service paths and common envelope. A draft remains New; no work is authorised. Full models, reference allocation, role-scoped DTO families and permission administration remain P02.

The P01 application is **local-only**. This explicit user instruction supersedes BP-02's suggestion to select remote hosting during P01. No remote hosting selection, costed procurement, deployment, shared access or Entra configuration is part of this increment. CI executes ephemeral local processes for tests; it does not publish the application.

The custom development launcher validates explicit local/synthetic/non-production configuration, binds only 127.0.0.1, rejects forwarded/foreign-host/foreign-origin requests and supplies an unpredictable internal gateway marker. API handlers independently require that marker, so running a generic Next server cannot enable the identity adapter. The production startup command rejects unconditionally; `next build` is compilation evidence, not production identity approval. Local HTTP cookies are opaque, HttpOnly and SameSite=Strict; Secure cookies and maintained OIDC are prerequisites for a future separately authorised shared environment. No client role, actor or audit timestamp is accepted as authority.

Four allowlisted local demonstration profiles resolve database users and company-scoped grants. Selecting a profile creates a server session and audit actor and revokes the supplied prior token. Sessions expire after eight hours, a synthetic test parameter. Local profile selection is intentionally not real authentication. It must never be exposed through a proxy/tunnel or on a shared machine configuration. This proof does not establish operational separation of duties.

## Dependency choices

Exact direct versions and resolved transitive integrity hashes are in `package.json` and `package-lock.json`. Node 24.20.0 LTS and npm 11.19.0 are pinned. Next 16.3.4 and React/React DOM 19.2.8 include the current patches identified during implementation. PostgreSQL 16.15 is a supported stable line and includes the August security release. SQL migrations use built-in UUID generation and the `btree_gist` extension; no ORM obscures the exclusion constraints. The `pg` 8.23.0 driver uses parameterised statements and explicit client transactions.

TypeScript 6.0.3 is within the supported range of typescript-eslint 8.69.0; TypeScript 7 is deferred until the selected lint toolchain supports it. ESLint 10.10.0 uses the compatible TypeScript, Next and React Hooks plugins directly. The bundled `eslint-config-next` was tested and rejected because its React/import/accessibility dependencies still use incompatible ESLint APIs. Downgrading to the now unsupported ESLint 9 line was rejected. Browser accessibility assertions supplement this deliberately smaller lint configuration.

Direct application/lint/test packages declare MIT, ISC or Apache-2.0 licences; PostgreSQL uses the PostgreSQL licence. The transitive lockfile also includes LGPL-3.0-or-later native sharp/libvips packages, CC-BY-4.0 caniuse data, and BSD/BlueOak/0BSD entries. The [dependency inventory](../testing/p01-dependencies.json) records exact declarations, including optional platform variants. These binaries retain their upstream notices; no packages or native binaries are copied into this repository. External/corporate service licensing remains unverified. No approved Powerplants logo or contact block was invented. Verdana/system fallback avoids a build-time remote font dependency.

Primary sources checked on 5 September 2026:

- [Node 24.20.0 release](https://nodejs.org/en/blog/release/v24.20.0), [Node releases/support](https://nodejs.org/en/about/previous-releases).
- [Next August security release](https://nextjs.org/blog/august-2026-security-release), [Next support policy](https://nextjs.org/support-policy), [Next data security](https://nextjs.org/docs/app/guides/data-security).
- [React releases](https://github.com/facebook/react/releases), [TypeScript releases](https://github.com/microsoft/TypeScript/releases), [typescript-eslint supported versions](https://typescript-eslint.io/users/dependency-versions/), [ESLint support](https://eslint.org/version-support/).
- [PostgreSQL 16.15 security release](https://www.postgresql.org/about/news/postgresql-186-1711-1615-1519-1424-and-19-beta-3-released-3365/), [range constraints](https://www.postgresql.org/docs/16/rangetypes.html), [PostgreSQL licence](https://www.postgresql.org/about/licence/), [node-postgres transactions](https://node-postgres.com/features/transactions).

## Transaction and reservation boundaries

Same-operation requests serialise using a transaction advisory lock scoped to workspace/actor/operation. Current record scope and edit permission are checked before returning an existing receipt. A canonical hash includes command identity, target, expected version and all normalised fields. Accepted retries return the original receipt before stale-version validation; changed content conflicts. The ticket row lock serialises competing edits. Audit, receipt, version change and outbox entry commit atomically. A database-trigger failure at the final outbox write tests rollback without adding a production fault-injection API.

Audit/receipt content is append-only via database triggers. P01 only stores Ready outbox entries; there is no consumer, lease/retry processor or claim of external effects. A separate `ppo_proof.reservations` table exercises active `tstzrange` non-overlap with `[start,end)` boundaries. It is an experiment, not the P05 planner schema. Crew, travel, working-time, availability, skills, readiness and policy-change rules remain unimplemented.

ERP read/command, document-store and distribution interfaces retain workspace/actor/operation and exact external provider/company/entity/key or document-version context. The stubs explicitly return Unknown/NotProcessed, throw for unimplemented durable document operations, or return Prepared with `delivered=false`. They do not claim MYOB, SharePoint, dispatch or document-issue success. Native CAD authoring is unaffected.

## Minimal data and recovery

Fixtures contain two isolated workspaces, three synthetic company contexts, four users, fixed grants and three draft tickets with known UUIDs and adopted SYN-PPO references. Site and requester identity remain explicitly unresolved and owned by the triage coordinator. No full customer/site/asset model or cross-domain entity scaffold is created.

Migration application is transactional, advisory-locked and checksum-verified. Repeating the seed preserves edited records and evidence. Full synthetic disposal uses two explicit reset flags plus an allowlisted loopback database name; it drops the two PPO schemas and migration receipt, then reapplies the seed. It is not an operational rollback or recovery plan. The extension is left installed to avoid disturbing other dependants. A reset is a new disposable universe, not reuse of a live readable reference.

See the [P01 handover](../delivery/p01-handover.md) for exact commands, execution results, environment constraints, review and next-P02 boundary.
