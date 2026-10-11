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
