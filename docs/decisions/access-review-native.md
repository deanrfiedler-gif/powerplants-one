# AD-01 native access inspection

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: implementation decision under Dean's 11 October 2026 instruction to proceed with the outstanding module work; visual and owner acceptance pending.

The next adopted build item is AD-01. Implement the read-only first increment in the [receiving plan](users-roles-access-review-design.md), using the existing Next.js, PostgreSQL, opaque session, grant and shared-control stack. A separate identity provider, copied browser permission engine and role-name authority were considered and rejected: the existing grant checks remain authoritative.

## Boundary

Add people and exact grant inspection at `/admin/access`, with a person detail and a capability/company/site explanation. Require an active, current **Workspace** `admin.access.read` grant on every API read. Company or Site grants cannot inspect workspace identities. Require the reviewer to clear their working-company selection before this workspace-wide view; no company selection silently widens.

Migration 0078 extends only the existing capability constraint. Seed 78 adds one explicit Workspace read grant to the existing local synthetic Systems identity; it adds no user and grants no hosted identity access. Hosted issuer/subject identifiers and names are masked. Read inspection does not evaluate hosted invitation/session validity: explain that separate authentication gate explicitly.

Explanation uses the server's current `hasPermission` rule, the subject's saved working company and actual current grant validity. It explains grant eligibility, not domain approval: ownership, independent duties, record state, source visibility and active authentication may still refuse a command. Read requests never update grants, identity, review history or sessions.

Role bundles, canonical teams, access-change commands, independent approvals and attestation campaigns remain subsequent AD-01 increments. No fabricated role membership, audit events or simulated apply is exposed as native functionality. D-020 remains unresolved for operational policy. Preserve NFR-01–NFR-12, CRM-08 and FIN-06.

## Design and handovers

Use the retained [AD-01 design](../design/access-review/access-review.html) as the existing page reference, under ADR-0051. This increment implements its People/person access task with native register and record pages, shared PageHeader, Field/SelectField, ReadState, Status and Button controls. The separate person route instead of the reference's persistent inspector is a proposed native adaptation, pending paired visual review. No new board or accepted design is claimed.

Incoming: current workspace identities, grants and exact company/site keys. Outgoing: an inspection explanation only. The existing identity selector changes the synthetic viewing actor; this page does not provision identities or alter grants.

## Verification required

Prove denied identities, non-Workspace and expired grants, cross-workspace isolation, inactive subjects, same-name company keys, site restrictions, future/expired grants, working-company narrowing and masked hosted identities. Prove unchanged user/grant rows after reads, upgrade preservation and reseed idempotency. Keep desktop/phone functional evidence, reference comparison, independent review, owner acceptance and deployment separate.

## Capability catalogue continuation — 11 October 2026

Dean's instruction to proceed with the next task continues AD-01 with the capability catalogue from the retained design. Add `/admin/access/capabilities` and `/admin/access/capabilities/[id]`: search capability keys/descriptions, filter by domain, inspect recorded/current grant counts, then filter holders by scope and grant state. The existing Workspace inspection gate and working-company refusal apply before and after both reads. There is no migration, new capability, seed or grant change.

Native display metadata must cover the server's `Capability` union exactly through an exhaustive TypeScript record. Copy the retained plain-English descriptions as display guidance; neither labels nor domain grouping grant authority. Proposed `admin.access.propose`, `admin.access.approve` and `admin.access.review` remain excluded. `email.connect` remains visible and explicitly hosted-demo-only even when the local workspace has no grants. Zero grants must not remove a capability from the catalogue.

Counts describe grant rows, not unique people or effective business access. Current means an active identity with a started, unexpired grant; inactive identity takes precedence over dates, matching person inspection. Holder pages retain exact company ERP keys, site numbers, dates and hosted masking, use stable ordering and return at most 50 grants plus a next-page indication. Reads use one database statement time for validity comparisons. Refresh rechecks permission and hides retained data on failure.

Opening a holder preselects the capability and any matching company/site on Person access. The page validates the incoming selection against its visible company/site choices; a deep link does not run or carry a positive explanation. The user submits a fresh server check. Workspace grants require a company choice for that separate eligibility check.

The r20 page types remain Register / worklist and Record detail. Reuse PageHeader, Field/SelectField, ReadState, Status, Stamp and Button, with native stacked grant cards. The retained design combines capabilities with proposed bundles/teams and a persistent inspector; these separate native routes are a proposed adaptation pending paired review. Incoming: canonical capability keys and current workspace grants. Outgoing: person inspection with selected context. Roles, teams, commands and campaigns remain subsequent work; D-020 is unchanged. Evidence: [catalogue execution record](../testing/evidence/access-capabilities/README.md).

## Proposed-role comparison continuation — 11 October 2026

Dean's next-task instruction continues the retained role catalogue with seven business/approval proposals and selected-person comparison. Use the existing Next.js/PostgreSQL/shared-control stack; no new technology or authority layer is introduced. A role table/assignment layer and matching capabilities held anywhere were considered and rejected for this increment: bundles remain source proposals, while the existing server grant rule checks the requested company/site.

Preserve the exact bundle IDs, r01 Proposed sets and Service coordinator r02 Draft (adds pack.check) from docs/design/access-review/model.js. The retained source labels are historical issue identifiers, not a revision scheme for the living master. A unit proof compares all seven definitions against that source and the capability contract. Exclude the hosted tester set because provisioning remains operator-owned; the UI explains this boundary. Do not infer team membership, adopted policy, deactivation workflows or role assignments.

Add /admin/access/roles and /admin/access/[id]/roles with GET-only APIs. Require current Workspace admin.access.read and no reviewer working company on catalogue/context/comparison reads. The comparison validates exact bundle/revision, workspace person, company and matching site; it uses current hasPermission for each proposed capability within the subject's saved working-company context. Workspace grants can qualify; Company and Site grants must match the requested context. Inactive identities and future/expired grants cannot match. Proposed grant scopes are design guidance, not a new permission rule. The result covers only that proposal; missing capabilities do not recommend granting access. Authentication, assignment, business-state, source visibility and independent approvals remain separate. Hosted identity names/keys stay masked.

Changing any selector clears the result. A read error hides prior results; denied/working-company responses hide person and form context. Retry after those refusals reloads context and requires an explicit new comparison. Per-capability links preselect Person access and still require a fresh eligibility check. No migration, seed, grant/identity/session/audit write, dependency, hosted configuration or deployment change.

Use r20 Register / worklist and Record detail, existing PageHeader, SelectField, Button, ReadState, Status and Stamp. Separate card pages adapt the retained role catalogue and inspector; owner visual acceptance is pending. Incoming: exact retained proposal and actual scoped grants. Outgoing: capability holder inspection and fresh person explanation. Preserve NFR-01–NFR-12, CRM-08, FIN-06 and the unresolved operational D-020 matrix. Teams, controlled access changes/independent approval and review campaigns remain subsequent work.
