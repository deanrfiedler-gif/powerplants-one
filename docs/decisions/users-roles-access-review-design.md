---
document_id: PPO-AD01-DES
title: Users, Roles, Teams and Access Review design and receiving handover
date: 2026-09-17
owner: Dean Fiedler
status: Standalone design delivered against the authorised build plan; owner acceptance, D-020 decisions and application integration separate
source_commit: efd4d4e33f5fc4ef2a4605455ed8d4c66e0ddc39
versioning: git
---

# AD-01 — Users, Roles, Teams & Access Review

On 17 September 2026, Dean authorised building the AD-01 module from [PPO-AD01-R01-PLAN](../delivery/users-roles-access-review-build-plan.md) ("proceed however you believe is the most professional"). The recommendations in plan §12 were adopted as the working decisions below. They are reversible and remain open for Dean's confirmation.

This package delivers:
- the standalone workspace and its [detailed report](../reference/ui/access-review/PPO-Users-Roles-and-Access-Review-Report-r01.md);
- a [change record](../reference/ui/access-review/PPO-Users-Roles-and-Access-Review-r01-change-record.md);
- [maintainable source](../design/access-review/README.md) with a deterministic builder;
- model and native browser checks and [verification evidence](../testing/evidence/access-review-r01/README.md);
- this decision and receiving record.

The package retains the following, and creates no new module, domain or requirement identity:
- AD-01 from the r06 page register;
- the 14 parent identities (NFR-01–NFR-12, CRM-08, FIN-06);
- the open decision D-020;
- the running permission contract.

## Deliverable

The [HTML](../reference/ui/access-review/PPO-Users-Roles-and-Access-Review-r01.html) (SHA-256 `a15ecb01ff596e5eaa9cc784977ab103fe664de6258ac41c66aaed58397d6363`) provides six views:
- **People** — a register with seven attention queues;
- **Person access** — identity, grants and an effective-access matrix with a step-by-step explanation;
- **Roles, teams & capabilities** — the 61 contract capabilities, proposed bundles and teams, and separation-of-duties pairs;
- **Access changes** — a proposed request, independent review and simulated-apply workflow;
- **Access reviews** — proposed attestation campaigns with evidence export;
- **History & explanation** — the audit that exists today, proposed access events, and a deterministic "why can / why can't" trace.

## Working decisions adopted

| # | Decision | As built |
|---|---|---|
| 1 | What a role is | A **proposed bundle** that would expand into individual grants. The server keeps checking grants only; bundles are never marked adopted |
| 2 | Team authority | **None in r01.** Teams route reviews and scope the team-lead preview |
| 3 | Grant change command | **Simulated apply** in the page, labelled on every use. The runtime command is receiving work (below) |
| 4 | Administrative capabilities | `admin.access.read/propose/approve/review` are shown as **Proposed**, outside the 61-value contract; a model check proves they appear in no migration |
| 5 | Separation-of-duties pairs | **Warnings only**, limited to the two separations the runtime enforces in `src/finance/service.ts` (handoff owner cannot review; processing owner cannot reconcile). The planned pack check/issue pair was **removed**: `src/documents/packs.ts` has no such actor separation |
| 6 | Review cadence and retention | Rendered as **Not agreed (D-020 / D-012 / D-021)**; no period is shown anywhere |
| 7 | Hosted testers | **Read-only and masked**; the fixture mirrors the setup script (24 capabilities, Company A, ending at tester expiry). Provisioning stays with the owner-run script |
| 8 | Reference type `ACR` | `SYN-PPO-ACR-` is used in fixtures and labelled *proposed type code*. PPO-STD-001 §10.2 is **not** amended; registration is deferred (owner decision 3 below) |
| 9 | Build method | A deterministic builder that **generates** the capability list from `src/platform/permissions.ts` and the tester set from `scripts/demo-database.ts`, with the source hashes embedded |
| 10 | Start condition | Branched from `main` at `efd4d4e3`; shared-file rows are additive |

## Owner decisions, 17 September 2026

Dean delegated the five questions left open by the first build ("proceed however you believe is the most professional"). They are decided as follows for this prototype design. D-020 remains open.

| # | Question | Decision | Reason |
|---|---|---|---|
| 1 | Plan §12 decisions 1–10 | **Confirmed as built**, with the corrections in report §12 | They keep the design faithful to the running grant model and avoid adopting policy |
| 2 | Approval role title | **Access approver** is the role; *Platform / data owner* is its proposed accountable holder | A capability role should not be named after one organisational title; a deputy can hold it |
| 3 | Register `ACR` in PPO-STD-001 | **Deferred** to one r05 amendment when a runtime increment allocates access-change references, together with the unregistered `DOC` code noted by Job Pack r03 | PPO-STD-001 r04 is adopted and revision-controlled; a design PR should not amend it, and the standard itself requires an explicit dictionary amendment |
| 4 | Hosted testers in the public design | **Keep**, masked, with fictional tenant and object identifiers | Tester expiry is a real operating control; nothing real is disclosed |
| 5 | May the approver who attested Change or Revoke decide the resulting request? | **No.** Enforced in the model and page; a design-only deputy approver provides the independent reviewer | Recommendation and decision by the same person defeats the independence the review exists to provide |

## Source and design choices

| Area | Decision |
|---|---|
| Exact repository source | `main` at `efd4d4e33f5fc4ef2a4605455ed8d4c66e0ddc39`. Pinned source hashes are listed in report §3 |
| Visual type | r20 Work queue + persistent detail. Supporting types: Register / worklist, Record detail, Review / comparison and a guided form |
| Reuse | r20 token core and embedded Roboto, byte-identical to My Work r01 and checked by the model. 292 px supporting column; 448 px inspection panel |
| Evaluation | One implementation of the `hasPermission` / `scopeSql` rule, used by the matrix, the explanation and the checks. The model check asserts that the rule's SQL text is still present in `permissions.ts` |
| Fixtures | The seeded workspace, SYN-A/SYN-B companies, three sites and user identifiers, so explanations resolve against the running seed. Design-only identities are labelled. The companies share a display name, which demonstrates why the ERP key must be shown |
| Honesty | Seeded grants and user deactivation carry **no fabricated audit history**. Only session selection is shown as application audit |
| Alternatives | A person × capability tick grid was rejected: 61 columns hide scope and validity and invite bulk changes without reasons. A single "role" field on the user was rejected: it would misstate the running model and pre-empt D-020 |

## Incoming and outgoing handovers

Incoming:
- identity from its issuer (`PPO-LocalSynthetic` or the hosted `PPO-EntraDemo` track);
- company and site context from shared records;
- the running capability contract.

Outgoing:
- a reviewed grant-change proposal with before/after evidence;
- review attestations with their reasons.

Neither changes real or hosted access. SH-06 would route the review tasks. CP-01 (portal access) depends on this design, but external identities stay outside it (BP-01: external parties never reuse an internal role).

## Receiving plan for application integration (recorded, not authorised)

1. **Migration:**
   - add `User`, `PermissionGrant` and `AccessReview` to `ck_audit_object_type`;
   - add change-request and review tables with version, operation ID and reviewer constraints;
   - add the `admin.access.*` capabilities.

   Follow the repository's migration-registry rules: a migration changes the applied-version assertions in several database and demo suites.
2. **Commands:** submit, decide, apply and attest:
   - apply is idempotent, version-checked, and writes grants and audit in one transaction;
   - requester ≠ reviewer ≠ affected person, and review attester ≠ reviewer of the resulting request, enforced **on the server**.
3. **Hosted demo:** the runtime role keeps grant writes revoked unless a deliberate, reviewed change alters that. Tester provisioning remains an operator action.
4. **Read model:** first increment read-only — people, grants and explanation over the existing tables — before any command.
5. **Tests:**
   - positive and negative role tests;
   - cross-company, site-scope, inactive and expired cases;
   - duplicate retry and concurrent decision;
   - audit reconstruction (NFR-01, NFR-02, NFR-09).
6. **Closure:** a D-020 role/action/data matrix and security review remain required before any operational use.

## Integrity and limits

The model refuses the following:
- self-change, self-approval and self-application;
- a reviewer who is not independent;
- a change to a hosted tester or an inactive identity;
- an unknown capability, or `email.connect` on a local identity;
- an invalid scope, or a duplicate of any existing grant (including an expired one);
- an end before start, or a past effective date;
- a missing or overlong reason;
- a stale request, review or workspace version;
- reuse of an operation ID with different content;
- completion of a review with undecided items;
- the approver who recommended a change in a review being named as, or acting as, the reviewer of the resulting request.

Browser storage is a demonstration convention, not a transaction or security mechanism. Preview roles are not authentication.

## Acceptance and publication boundary

This contribution contains standalone design code and documentation only. It changes no runtime route, dependency, migration, seed, provider, deployment or access configuration.

The following remain separate outcomes:
- owner design acceptance;
- the D-020 decisions;
- native device, zoom, print and screen-reader review;
- pinned-runtime CI evidence;
- application implementation, merge and deployment.
