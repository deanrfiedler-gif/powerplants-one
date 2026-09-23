---
document_id: PPO-AD01-R01-PLAN
title: Users, Roles, Teams & Access Review workspace r01 — design build plan
date: 2026-09-17
owner: Dean Fiedler
status: Authorised by Dean on 17 September 2026 ("proceed however you believe is the most professional"); built as AD-01 r01. Corrections found during the build are recorded in the companion report §12, not by rewriting this plan
register_entry: AD-01 · Users, roles, teams and access review · P1 · N (new design candidate) · reviewer Platform / data owner
source_commit: 81b0d401edc1c2ea31e5440c3416befe335219e3
versioning: git
---

# Users, Roles, Teams & Access Review workspace — design build plan

## 0. What this plan is

This is a build plan for the next standalone module HTML page in Powerplants One, the **Users, Roles, Teams & Access Review workspace**, coverage register entry **AD-01**.

It follows the delivery shape of the most recent packages:
- My Work r01;
- Quality & Site Assurance r01;
- Supplier Pricing r01;
- ES-10 Reference Cases r01.

It also follows the package discipline of [PPO-UI-CONFORMANCE](https://github.com/deanrfiedler-gif/powerplants-one/blob/81b0d401edc1c2ea31e5440c3416befe335219e3/docs/standards/html-module-conformance.md), which is now on `main`.

Every field, state, command and rule named below is marked as one of:

- **Contract** — exists in a merged migration or in `src/platform/*`, and is enforced by the running application.
- **Seed** — exists only as synthetic seed or hosted-demo setup data. It is real in the prototype but is not a product rule.
- **Proposed** — a design extension this page would introduce. It requires Dean's decision and is labelled as such in the HTML.

Nothing in this plan authorises any of the following:
- a real identity-provider change, an Entra write or a tenant setting;
- a grant to a real person;
- adoption of departmental roles;
- a review cadence or a separation-of-duties policy;
- any change to the hosted demo's access.

It plans a synthetic design artefact for review.

---

## 1. Purpose and position

### 1.1 The problem this module solves

Powerplants One enforces authority on the server. Every read and command checks a **permission grant**, and that check is the most consequential control in the prototype. Yet **no screen shows who holds which grant, for which company or site, from when to when, or why.** Specifically:

- Grants are created only by seed scripts and the owner-run hosted setup script.
- The hosted runtime database role has `INSERT`, `UPDATE` and `DELETE` on `users`, `permission_grants` and `demo_testers` **revoked** (`scripts/demo-runtime.ts`).
- Grant and user changes are **not audit events**. The `ck_audit_object_type` constraint covers Ticket, Session and business records, but has no `User` or `PermissionGrant` value.

Every module designed this week assumes authority it cannot show:

| Module | Assumed authority AD-01 must make visible |
|---|---|
| SH-06 Approvals & handover inbox (#223) | Who may approve which domain decision, and the routing of the review task itself |
| DK-03 Output, issue & distribution (#229) | Internal recipient audiences; restricted-Finance visibility |
| DK-06 Template management (#231) | Who may approve and publish a template |
| SH-02 My Work (merged design) | "Team" views over owned work |
| CS-01 Customer 360 (merged design) | "Server-enforced Finance visibility", listed as outstanding |
| P10 Finance handoff (runtime) | Separate prepare, review, process and reconcile authority |

This module gives the prototype one place where authority is visible, explainable, changeable under review and periodically re-confirmed. It also states plainly that **the page does not enforce anything; the server does.**

### 1.2 Requirement traceability

The coverage register assigns 14 parents to AD-01.

| Parent | Requirement (BP-01) | Where it lands in this page |
|---|---|---|
| **NFR-01** | Enforce identity and action/record-level authorisation on the server | §4.4 evaluation rule; §6.3 effective access; §6.6 explanation |
| **NFR-02** | Preserve attributable audit for material changes and approvals | §4.8 proposed access events; §6.6 history |
| NFR-03 | Protect credentials in transit, storage and device caches | §4.7 sessions and devices; no secrets rendered (§9) |
| NFR-04 | Agreed response times | Out of scope; the register loads a bounded fixture only |
| **NFR-05** | Useful degraded operation, visible outages | Identity source unavailable; partial read; unknown last sign-in (§8) |
| NFR-06 | Recovery and data-loss objectives | Interrupted change and restore of review evidence (§6.4, §7) |
| NFR-07 | Preserve offline input; resolve synchronisation safely | Revocation versus offline device caches (§4.7) |
| **NFR-08** | Accessible complete workflows | §7 keyboard, dialogs, reflow; §10 native checks |
| **NFR-09** | Prevent duplicate or conflicting commands | Idempotent grant change; version conflict on concurrent edit (§4.6) |
| NFR-10 | Retention, export and deletion policies | Access-evidence retention shown as *not agreed (D-012/D-021)* |
| **NFR-11** | Monitoring, alerts and diagnostics including access events | Access queues and history (§6.1, §6.6) |
| NFR-12 | Maintainable releases and data portability | Validated export of review evidence (§7) |
| CRM-08 | Pipedrive parity and migration evidence | Permission-parity row only; no Pipedrive data (§3.2) |
| FIN-06 | Failed, partial or outdated data never shown as verified | Restricted-Finance access rows and read-failure states |

The four parents in bold are the primary acceptance anchors. Supporting BP-01 text:
- **§ Security (line 1425):** roles for business use, approval, administration and integration are defined separately, and permissions cover previews, search, exports, notifications and portal data, not only menu visibility.
- **line 1429:** deactivation, role change and device loss need controlled revocation, and offline limits must be disclosed rather than represented as instant revocation.
- **line 1458:** external customers and subcontractors are outside Wave A and never reuse an internal role.

Governing open decision: **D-020 Identity, permissions, privacy and external access** (Open). Its closure evidence is a *role/action/data matrix and security review*, and this module is the design surface for that matrix. D-012 and D-021 (retention and review targets) are also open.

### 1.3 Register evidence and dependency position

AD-01 is classed **N — new design candidate**. The register's evidence note: `/admin` and `/admin/recovery/:id` provide bounded exception recovery and *are not a full access/configuration/integration console*.

This was verified at `81b0d401`:
- `src/app/(business)/admin/` holds `page.tsx` and `recovery/` only.
- No access page exists in `docs/reference/ui/`, in `docs/design/`, or in any of the 13 open PRs (file lists of #227 inspected; the other titles checked).

AD-01 has **no dependencies**. CP-01, the customer portal access page, depends on it.

---

## 2. Governing sources

| Source | What it fixes for this design |
|---|---|
| [Migration 0001 — foundation](https://github.com/deanrfiedler-gif/powerplants-one/blob/81b0d401edc1c2ea31e5440c3416befe335219e3/db/migrations/0001-foundation.sql) | `workspaces`, `companies`, `users` (issuer, subject, `active`, `synthetic`), `permission_grants`, `sessions` (hashed token, expiry), `operation_receipts`, append-only `audit_events` |
| [Migration 0002 — shared foundation](https://github.com/deanrfiedler-gif/powerplants-one/blob/81b0d401edc1c2ea31e5440c3416befe335219e3/db/migrations/0002-shared-foundation.sql) | Grant `id`, `scope_type` ∈ Workspace · Company · Site, `scope_id`, `site_id`, `ck_grants_scope`, `uq_grants_scope`, site foreign key |
| Migrations 0003–0024 | Capability list extended per domain; `ck_ticket_scope` dropped in 0003; audit object types extended (Opportunity, Lead) |
| [Hosted demo track `db/demo/0001-identity.sql`](https://github.com/deanrfiedler-gif/powerplants-one/blob/81b0d401edc1c2ea31e5440c3416befe335219e3/db/demo/0001-identity.sql) | `demo_testers` (tenant, Entra object ID, `enabled`, `expires_at`), `demo_login_attempts`; `email.connect` added by demo 0002 |
| [`src/platform/permissions.ts`](https://github.com/deanrfiedler-gif/powerplants-one/blob/81b0d401edc1c2ea31e5440c3416befe335219e3/src/platform/permissions.ts) | The 61-value `Capability` type; `hasPermission`, `requireCapability` and `scopeSql`, which define the effective-access evaluation (§4.4) |
| [`src/platform/identity.ts`](https://github.com/deanrfiedler-gif/powerplants-one/blob/81b0d401edc1c2ea31e5440c3416befe335219e3/src/platform/identity.ts) | Issuers `PPO-LocalSynthetic` and `PPO-EntraDemo`; 8-hour local sessions; `active` required on every resolution; session selection audited |
| [`scripts/demo-database.ts`](https://github.com/deanrfiedler-gif/powerplants-one/blob/81b0d401edc1c2ea31e5440c3416befe335219e3/scripts/demo-database.ts), `demo-runtime.ts` | Hosted tester rules: at most five, distinct, UTC expiry within 14 days; fixed demo capability set; runtime write revocation |
| [`db/seed.sql`](https://github.com/deanrfiedler-gif/powerplants-one/blob/81b0d401edc1c2ea31e5440c3416befe335219e3/db/seed.sql) and domain seeds | The synthetic identities (SYN Coordinator, Site observer, Workspace observer, Company B coordinator, Finance roles, Technicians) reused as fixtures |
| [BP-01 §NFR and §Security](https://github.com/deanrfiedler-gif/powerplants-one/blob/81b0d401edc1c2ea31e5440c3416befe335219e3/docs/blueprints/BP-01-master-blueprint.md) | NFR-01–12; separated role families; revocation and offline limits; external-party exclusion |
| [Decision register](https://github.com/deanrfiedler-gif/powerplants-one/blob/81b0d401edc1c2ea31e5440c3416befe335219e3/docs/decisions/decision-register.csv), [decisions and evidence](https://github.com/deanrfiedler-gif/powerplants-one/blob/81b0d401edc1c2ea31e5440c3416befe335219e3/docs/prototype/decisions-and-evidence.md) | D-020 open, with proposed treatment "server capability/scope design; local-only demo identity"; D-012, D-021 open. *Proposed roles are not assigned staff* |
| [PPO-UI-CONFORMANCE](https://github.com/deanrfiedler-gif/powerplants-one/blob/81b0d401edc1c2ea31e5440c3416befe335219e3/docs/standards/html-module-conformance.md) | Nine-field package declaration; r20 page-type catalogue |
| [Shared UI style specification](https://github.com/deanrfiedler-gif/powerplants-one/blob/81b0d401edc1c2ea31e5440c3416befe335219e3/docs/standards/ui-style-specification.md) | Required baseline elements, token core, declared viewports, change record |
| [r20 theme board](https://github.com/deanrfiedler-gif/powerplants-one/blob/81b0d401edc1c2ea31e5440c3416befe335219e3/docs/reference/ui/theme-style-board/powerplants-one-theme-style-board-r20.html) | Presentation authority. SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`, recomputed on `main` for this plan |
| Coverage register r06, AD-01 | Scope, P1, reviewer role, three suggested checks, parents |
| My Work r01 (`docs/design/my-work/`) | Current delivery shape: deterministic builder, embedded Roboto, local roles, storage, backup, fixed clock, scripted assistant, model and native browser checks, evidence JSON |

### 2.1 Conformance declaration

| Field | This package |
|---|---|
| Scope identity | **AD-01 Users, roles, teams and access review**; coverage register r06; parents NFR-01–12, CRM-08, FIN-06 |
| Page type | Primary **Work queue + persistent detail**. Supporting types: **Register / worklist** (people, grants), **Record detail** (person access), **Review / comparison** (before/after grant change, review campaign), **Form / guided workflow** (change request) |
| Reused components | r20 page title, context strip, scoped tabs, named state badges, metric tiles, register/cards, 292 px supporting column, action footer, native decision dialogs, 448 px right-side inspection panel (grant detail, explanation trace) |
| Source authority | Contract / Seed / Proposed marking on every element; theme hash and fixture manifest hash retained |
| Incoming handover | Identity from its issuer (local synthetic or hosted Entra demo); business context (companies, sites) from shared records |
| Outgoing handover | A reviewed grant-change proposal and review attestations. Applying a grant stays a server command that **does not exist yet** (§12, decision 3) |
| Exceptions and recovery | Normal · identity source unavailable · deactivated user with live grants · expired tester · interrupted change · concurrent edit conflict · self-approval refused · separation-of-duties warning · denied read |
| Departures | Roles, teams, change requests, review campaigns and access events are all **Proposed** (§4.9). Each is labelled in the HTML |
| Verification | §10. Model and native browser checks, three documentation checks, marker scan, hash-bound evidence; native visual and device review reserved for Dean |

---

## 3. Scope boundary

### 3.1 In scope for r01

- **People register:** identity status, issuer, activity, grant counts by domain, scopes, attention queues, filters, sort and selection.
- **Person access workspace:**
  - identity block;
  - current, future and expired grants;
  - an **effective access matrix** computed from grants by the §4.4 rule;
  - session and device notes;
  - team and role membership (proposed).
- **Capability and role catalogue:**
  - all 61 contract capabilities, grouped by domain;
  - proposed role bundles expanding to grants;
  - proposed teams;
  - proposed separation-of-duties pairs, shown as warnings.
- **Grant change workflow (proposed):**
  - propose add, change validity, change scope or revoke;
  - reason required;
  - independent reviewer;
  - before/after comparison;
  - effective date;
  - idempotent retry and version conflict.
- **Access review campaign (proposed):** reviewer attests Keep, Change or Revoke per grant, with evidence, outstanding items and a completion summary.
- **Access history and explanation:**
  - the audit record that exists today (session selection);
  - the proposed access events;
  - a deterministic **"why can / why can't"** explanation for a chosen person, capability and record.
- **Standard module features:**
  - eight rendered UI states;
  - five local preview roles;
  - local storage with validated backup and restore;
  - fixed clock;
  - scripted, source-scoped assistant;
  - contract-exact checks and hash-bound evidence.

### 3.2 Out of scope for r01

| Excluded | Owner |
|---|---|
| Real Entra or identity-provider administration: user creation, groups, conditional access, MFA, licences | Company identity systems (BP-01 line 471) |
| HR and workforce records: employment, availability, competencies, certification expiry | Workforce systems; scheduling reads competence separately (DAT-06) |
| Customer or subcontractor external identities | **CP-01** portal access; BP-01 line 1458 |
| Business policy publication: approval thresholds, routing rules | **AD-02** |
| Integration credentials, connector health | **AD-04**; **AD-05** for mappings |
| Pipedrive or Smartsheet permission migration | **AD-06**. AD-01 shows one parity note only |
| The decision content of domain approvals | Owning domain modules and **SH-06** |
| Adopting departmental roles or assigning named staff | Dean / D-020 |
| Implementing a grant-change command, audit types or migrations | A separate runtime increment (§12) |

### 3.3 Proposed extensions (labelled in the HTML; decided by Dean in §12)

1. **Role bundle.** A named, versioned set of capabilities that *expands to individual grants* at a chosen scope. The grant remains the only authority the server checks.
2. **Team.** A named group of users with a lead, used for work visibility and review routing. **In r01 a team carries no authority** (decision 2).
3. **Grant change request.** Draft → Submitted → Approved or Returned → Effective, or Withdrawn.
4. **Access review campaign.** A scoped set of grants, a reviewer and per-grant attestations.
5. **Access events.** `User` and `PermissionGrant` audit object types for the changes above.
6. **Separation-of-duties pairs.** Warnings only; no policy adopted.
7. **Administrative capabilities.** `admin.access.read`, `admin.access.propose`, `admin.access.approve`, `admin.access.review` — clearly labelled *not in the capability contract*.

---

## 4. Information model the page must present

### 4.1 Workspace and company — Contract

| Field | Rule |
|---|---|
| `workspaces.id`, `display_name` | `synthetic` CHECK true |
| `companies.id`, `display_name`, `erp_connection_id`, `erp_company_id` | `provider='Synthetic'`; unique per workspace and ERP key. The page shows the ERP company key beside the name so company context is never ambiguous |

### 4.2 User identity — Contract

| Field | Rule | Page treatment |
|---|---|---|
| `id` | UUID identity | Shown in the identity block; never replaced by name |
| `issuer` | `PPO-LocalSynthetic` (CHECK in 0001); `PPO-EntraDemo` in the hosted track | Badge: *Local synthetic* or *Hosted demo (Entra)* |
| `subject_id` | Unique with issuer | Shown for local profiles. For hosted testers only a **masked** object ID (first 8 characters) is shown |
| `display_name` | Label, not identity | Two users with the same display name are shown as distinct rows |
| `active` | Checked on every session resolution and permission query | *Inactive* means the server refuses the identity immediately, whatever grants remain |
| `synthetic` | CHECK true | Page banner |

Hosted tester row (**Contract**, demo track), `demo_testers`:
- `tenant_id`;
- `object_id`;
- `enabled`;
- `expires_at`, which must be a UTC time within 14 days of setup;
- at most five testers, and they must be distinct.

The page renders expiry as a countdown in whole days and treats an expired tester as a queue item. Tester provisioning stays an owner-run script; **the page never offers to extend a tester.**

### 4.3 Permission grant — Contract

| Field | Rule |
|---|---|
| `id` | UUID (added in 0002) |
| `user_id`, `workspace_id` | Composite foreign key to users |
| `capability` | One of the 61 values in `Capability`. The database CHECK list is extended per migration; `email.connect` exists only in the hosted track |
| `scope_type` | Workspace · Company · Site |
| `scope_id`, `company_id`, `site_id` | `ck_grants_scope`: Workspace ⇒ scope is the workspace, no company or site; Company ⇒ company set, no site; Site ⇒ company and site set, site belongs to company |
| `valid_from`, `valid_to` | `valid_to` null or later than `valid_from` |
| Uniqueness | `(workspace, user, capability, scope_type, scope_id)`. The same capability can be held at several scopes, which is why the page lists grants rather than a tick-box grid |

Grant validity states are **derived** by the page against the fixed clock:
- **Future** — `valid_from` is after now;
- **Current**;
- **Expired** — `valid_to` is at or before now.

Expired grants are retained and shown, never hidden.

### 4.4 Effective access evaluation — Contract, rendered exactly

`hasPermission(capability, company?, site?)` is true only when all of these hold:

1. The user exists in the workspace and `active` is true.
2. A grant exists for that exact capability.
3. `valid_from ≤ now`, and `valid_to` is null or later than now.
4. The scope matches:
   - no company requested → any scope passes;
   - Workspace scope → passes for all companies and sites;
   - Company scope → the company must match;
   - Site scope → the company and the site must both match.

Record-level reads apply the same rule through `scopeSql` against each record's company and site.

The page implements this rule once, in `model.js`, and uses it for the effective-access matrix, the explanation trace and the checks. Two consequences must be visible, not merely true:

- **Scopes widen upward, never downward.** A Site grant never authorises another site or company-level records without a site. A Workspace grant authorises every company, including a second company.
- **`requireCapability` without a company argument passes on any grant of that capability.** The page explains this as "capability held somewhere; record access still checked per record". It must not be presented as a defect or a fix; it is recorded as an observation for D-020 review.

The page does not reinterpret the rule and does not add deny rules.

### 4.5 Capability catalogue — Contract

There are 61 capabilities in 13 families:

| Family | Count | Family | Count |
|---|---|---|---|
| shared | 6 | pack | 5 |
| service | 6 | field (own) | 6 |
| activity | 2 | report | 4 |
| schedule | 4 | finance | 7 |
| crm | 8 | estimating | 4 |
| email | 3 | project | 3 |
| engineering | 3 | | |

Each capability row shows:
- its family and a plain-English label (**Proposed** wording);
- whether it reads or changes data;
- whether it is `.own`-limited (field capabilities apply only to the holder's assignments);
- whether it touches restricted data (`shared.finance.read`, `shared.internal.read`, `finance.*`).

The label text is design copy. The capability key is shown alongside it and is authoritative.

### 4.6 Sessions and command integrity — Contract

- **Sessions:** a hashed token only, an actor and an expiry. Local sessions last eight hours. The page shows *Active sessions: count and latest expiry*, **never a token or hash**.
- **Profile selection:** the local profile choice writes an `audit_events` row with object type `Session` and reason *Local synthetic identity selected*.
- **Operation receipts** (`UNIQUE(workspace, actor, operation_id)`) give idempotent commands. The proposed change request reuses this pattern: an identical retry returns the original result, and a changed payload under the same operation ID is refused.
- **Proposed optimistic concurrency** on change requests (`version`): a stale edit produces a *Conflict* state showing both versions.

### 4.7 Revocation and devices — Contract behaviour, disclosed limits

Setting `active=false` causes the next request with any session to fail with 401, because resolution requires `active`. **Cached content already on an offline device is not recalled.** The P08 owner-bound IndexedDB design isolates it by owner but cannot erase an unreachable device.

The person workspace therefore shows two separate lines:
- **Server access:** refused from `<time>`;
- **Offline device content:** may persist until the device reconnects or is recovered — not instant revocation (BP-01 line 1429).

### 4.8 Audit — Contract today, Proposed extension

| Fact | Today | Page treatment |
|---|---|---|
| Profile/session selection | `audit_events` object type `Session` | Shown as real history |
| User created, deactivated | **Not audited**; seed or script only | History row: *No application audit exists for this change; source: seed/setup script* |
| Grant added, changed, revoked | **Not audited** | Same, plus the proposed `PermissionGrant` event |
| Review attestation | Does not exist | Proposed `AccessReview` event |

Each proposed event carries actor, time, reason, before/after, operation ID and outcome. This meets the NFR-02 test: *reconstruct actor, time, source/version, reason and outcome.* The history view **never fabricates** past audit rows for seeded grants; their provenance reads *Seed (`db/seed.sql`)*.

### 4.9 Proposed model

| Entity | Fields | Rules |
|---|---|---|
| `RoleBundle` | id, name, revision, purpose, family (business use · approval · administration · integration), capability list, allowed scope types, state (Draft · Proposed · Retired) | Never Adopted in r01. Revision changes do not silently change holders: a new revision lists affected grants for review. Families kept separate per BP-01 line 1425 |
| `Team` | id, name, lead user, members with dates, purpose | No authority in r01; used for My Work team views and review routing |
| `GrantChangeRequest` | id, `SYN-PPO-ACR-000001` reference (**Proposed** type; requires a PPO-STD-001 addition), requester, subject user, operations (add / change validity / change scope / revoke), reason, requested effective time, reviewer, decision, decision reason, state, version, operation ID | Reviewer ≠ requester ≠ subject. The subject cannot approve their own access. Returned requires a reason. Effective only after approval **and** a separate apply step, which is simulated |
| `AccessReview` | id, scope (company / site / capability family / team), reviewer, due date (fixture date, **no cadence**), items, state | Attestation per grant: Keep · Change (creates a linked request) · Revoke (creates a linked request) · Unable to confirm (reason, owner). Completing requires every item decided |
| `SoDPair` | capability A, capability B, rationale, source | **Warning only.** Initial pairs drawn from runtime separations already in ADR-0016 (finance prepare/review, process/reconcile) and the pack check/issue split. No other pair is invented |
| `AccessEvent` | as §4.8 | Append-only in the local model |

---

## 5. Actors and preview roles

These preview roles are **local demonstrations of intended behaviour, not security**. Each mirrors a *proposed* administrative capability (§3.3, item 7).

| Preview role | Can | Cannot |
|---|---|---|
| **Access administrator** | View all people and grants; draft and submit change requests; simulate apply after approval; start a review campaign | Approve own request; change own access; view hosted tester object IDs unmasked |
| **Access approver** (platform/data owner) | Everything the administrator can read; approve or return requests with a reason | Submit and approve the same request; approve a change to own access |
| **Team lead** | See own team's members and their grants; complete reviews assigned to them; request changes for own team | See other teams' restricted-Finance grants; approve |
| **Auditor** (read-only) | Everything read-only, including history and explanation traces; export evidence | Any change |
| **Ordinary user** | See **their own** access, validity, sessions and an explanation of their own access | See anyone else; request changes for others |

Every preview role action runs through the same local permission function, so the checks prove the separation behaviour exists in the model.

---

## 6. Views — six connected views, one record collection

The layout is the r20 workspace frame: page title and context strip; scoped tabs; main column; 292 px supporting column; 448 px inspection panel on demand; action footer. Phone widths stack the supporting column under the main column and render registers as cards.

### 6.1 People (register with attention queues)

**Context strip:** workspace; the fixed-clock time *17 September 2026, 10:00 AEST*; the environment badge *Synthetic prototype*; the preview role.

**Queue tiles.** Tiles are filters, not states.

| Queue | Rule |
|---|---|
| Inactive with current grants | `active=false` and a grant is Current |
| Hosted tester expiring ≤ 3 days / expired | `demo_testers.expires_at` |
| Grants expiring ≤ 14 days | `valid_to` within 14 days (**display window only**, not a policy) |
| Workspace-wide grants | `scope_type='Workspace'` |
| Restricted access holders | Any `finance.*`, `shared.finance.read` or `shared.internal.read` |
| SoD warnings | Holder of both capabilities in a proposed pair at overlapping scope |
| Pending change requests / reviews due | Proposed entities |

**Columns:**
- Person (display name, masked subject);
- Issuer;
- Status (Active, Inactive, Tester expired);
- Companies and sites in scope;
- Grants by family (counts);
- Restricted flag;
- Latest session expiry;
- Open requests.

**Behaviour:**
- **Search:** name, subject, capability key, company, site.
- **Filters:** issuer, status, company, site, capability family, restricted, queue.
- **Sort:** attention first, then name.
- **Selection** opens the person workspace. A filter that hides the selected row clears the selection.

**Presentation decision:** a register, **not** a matrix grid of everyone × every capability. A 61-column grid is unreadable, hides scope and invites bulk ticking without reasons.

### 6.2 Person access

**Main column:**

1. **Identity block:** UUID, issuer, subject (masked where hosted), active, synthetic, tester expiry.
2. **Grants table:**
   - columns: capability key and label; family; scope type and name; valid from; valid to; state (Future, Current, Expired); provenance (Seed or Change request reference);
   - grouped by family and collapsible;
   - per-row action *Request change* (role permitting).
3. **Effective access matrix:**
   - rows are capability families;
   - columns are the companies and sites in the fixture;
   - each cell shows Allowed, Not allowed or *Allowed via Workspace grant*;
   - selecting a cell opens the explanation trace in the 448 px panel.

**Supporting column:**
- teams (proposed);
- role bundles the grants currently match (**derived**: "grants match bundle *Service coordinator* r01 except 2");
- sessions summary;
- the revocation and offline-device disclosure (§4.7);
- open requests and reviews for this person.

**Empty state:** *No grants — this identity can sign in but cannot read any business record.*

### 6.3 Roles, teams and capabilities (catalogue)

**Three sub-tabs:**

- **Capabilities:** all 61, with family, label, read/change, `.own`, restricted, and "holders" count linked back to the People view filtered.
- **Role bundles (Proposed):**
  - bundle detail with capability list, allowed scopes, family and revision history;
  - holders who fully or partially match;
  - *Compare revisions* shows added and removed capabilities and the affected holders.
  - No *Adopt* action exists; the state badge reads **Proposed — not adopted (D-020)**.
- **Teams (Proposed):** members with dates, lead, purpose, and the banner *Teams grant no access in this design.*

A **Separation-of-duties** panel lists the proposed pairs, their source and current warnings.

Fixture bundles, each derived **only** from capabilities the seeded identities already use:
- Service coordinator;
- Technician;
- Pack checker;
- Pack issuer;
- Finance preparer;
- Finance reviewer;
- Finance processor;
- Finance reconciler;
- Sales;
- Estimator;
- Read-only observer.

Each carries *Proposed; assigns no employee.*

### 6.4 Changes (grant change requests)

**Queue** of requests by state: Draft, Submitted, Returned, Approved (awaiting apply), Effective, Withdrawn.

**Request form** (guided, native controls, no drag):

1. Subject person.
2. Operations: one or more rows. Each is add a capability or bundle at a scope; change validity; change scope; or revoke.
3. Effective time.
4. Reason (required, 10–500 characters).
5. Reviewer, chosen from people holding the proposed approver capability, excluding the requester and the subject.

**Pre-submit checks, shown inline:**
- scope validity against `ck_grants_scope`;
- duplicate grant (`uq_grants_scope`);
- `valid_to > valid_from`;
- SoD warning;
- widening to Workspace scope warning;
- restricted-capability warning;
- an unknown capability is refused.

**Review screen:**
- before/after grants table with added, removed and changed rows highlighted **by text and icon, not colour alone**;
- the effective-access matrix difference;
- decision dialog: Approve or Return, reason required for Return.

**Apply step (simulated):**
- labelled *Simulated apply — no server command exists (decision 3)*;
- writes the proposed access event;
- a second identical apply returns the original result (idempotency demonstration).

**Conflict demonstration:** two local editors change the same draft; the second save shows *Conflict* with both versions and a choose-and-reapply path.

### 6.5 Reviews (access review campaigns)

**Campaign list:** scope, reviewer, due date (fixture), progress, state.

**Campaign detail:** grants in scope, grouped by person. Each row offers:
- Keep;
- Change (opens a prefilled change request, linked);
- Revoke (as Change);
- Unable to confirm (reason and owner required).

**Supporting column:**
- *Review cadence: not agreed (D-020)*;
- *Evidence retention: not agreed (D-012/D-021)*.

**Completion:**
- The campaign completes only when every item is decided.
- The summary counts decisions and linked requests.
- An export of the attestation evidence is offered (§7).

**Interrupted case:** a campaign half-completed before reload resumes exactly where it stopped, from local storage.

### 6.6 History and explanation

**History:**
- a timeline filterable by person, actor, event type and date;
- real `Session` audit rows, proposed access events and provenance-only rows for seeded grants;
- each row has actor, time, reason, before/after and operation ID where they exist, and *Not recorded* where they do not.

**Explain access** (deterministic):
- **Inputs:** person, capability, and a target record (company and site from the fixture records: a ticket, a site, a work order, a finance handoff).
- **Output:** a step trace mirroring §4.4, with each step marked Pass or Fail:
  - user active;
  - grant exists;
  - validity window;
  - scope match;
  - record company and site.
- **Result:**
  - *Allowed by grant <id>*, or
  - *Not allowed: no current grant for this capability at Site Northbank* (for example).
- **Suggested next action** (role permitting): *Request change*, prefilled. It never auto-grants.

**Copy:** *This explanation reproduces the server rule in the prototype. The server remains the authority; an explanation is not permission.*

---

## 7. Interactive features — cross-cutting

| Feature | Behaviour | Basis |
|---|---|---|
| Idempotent apply | Identical retry returns the original result; changed payload under the same operation ID refused | Contract receipts pattern |
| Version conflict | Stale save shows both versions; nothing is silently overwritten | Proposed, NFR-09 |
| Self-authorisation guard | Requester ≠ reviewer ≠ subject; refused with reason | Proposed |
| Immutability made visible | Effective changes and attestations have no edit control, and state why | Audit append-only trigger pattern |
| Eight UI states | Loading · Empty · Read failed · Partial read (e.g. hosted tester source unavailable) · Denied · Saving · Saved · Conflict | Style spec §7.1 |
| Keyboard and accessibility | No drag; native `<dialog>` with `showModal()`, Escape and focus return; native tabs; matrix cells are buttons with text states; 44 px phone targets; status never colour-only | Style spec §5; NFR-08 |
| Local storage | Key `ppo-access-review-r01`; session-only fallback message; explicit reset | My Work pattern |
| Backup / restore | Validated JSON. Refused without replacing current data: unknown capability; invalid scope combination; `valid_to ≤ valid_from`; self-approved request; duplicate grant. Restore requires confirmation | My Work pattern |
| Evidence export | Review attestation CSV and JSON with campaign ID, fixture hash and synthetic banner; no tokens or unmasked hosted IDs | NFR-12 |
| Fixed clock | 17 September 2026 10:00 AEST (`Australia/Brisbane`, UTC+10, no daylight saving); stored times ISO 8601 UTC | My Work pattern |
| Scripted assistant | Source-scoped and inspectable. Scripts: summarise this person's access; explain why a cell is Allowed; list grants expiring in the display window; draft a change-request reason. **Cannot** submit, approve or apply | My Work pattern; AI-03 principle |
| Synthetic labelling | *Synthetic prototype — no real people or access* on the page and in every export | STD-001 §11.1 |

---

## 8. Fixture data

**Workspace:** synthetic workspace `10000000-…-0001`.

**Companies:**
- Company A (`20000000-…-0001`);
- Company B (`20000000-…-0002`).

**Sites:** the addressed Willowbank sites already used by Customers r03 and Work Orders r01, so explanations resolve against records that recur across modules. All references are `SYN-PPO-…`.

**People**, reusing seeded UUIDs and display names where they exist:

| Person | Issuer | Scenario demonstrated |
|---|---|---|
| SYN Coordinator | Local | **Normal case.** Company A grants across service, schedule and pack; matches the *Service coordinator* bundle except one capability |
| SYN Site observer | Local | Site-scoped read. Explanation: allowed at own site, **not allowed** at the second site or for a company-level ticket |
| SYN Workspace observer | Local | Workspace scope. Explanation: allowed for **Company B** records; widening warning |
| SYN Company B coordinator | Local | Cross-company isolation: nothing at Company A |
| SYN Technician (assignment unavailable) | Local | `.own` field capabilities; explanation shows the assignment condition |
| SYN Finance preparer / reviewer / processor / reconciler | Local | Restricted access; separation shown satisfied across four people |
| SYN Finance context reviewer | Local | **SoD warning:** fixture adds `finance.review` alongside `finance.prepare` as a *pending change request*, so the warning appears at review, not as an existing breach |
| SYN Former coordinator | Local | **Inactive with current grants**, queue item; server refusal versus offline disclosure |
| SYN Hosted tester 1 | Hosted demo | Expires in 2 days; masked object ID; fixed demo capability set |
| SYN Hosted tester 2 | Hosted demo | **Expired**; *Identity source: unavailable — last known 15 September 2026*, **missing-source case** |

**Change requests:**

| Reference | State | Demonstrates |
|---|---|---|
| `SYN-PPO-ACR-000001` | Effective | Normal add |
| `SYN-PPO-ACR-000002` | Submitted | SoD warning |
| `SYN-PPO-ACR-000003` | Returned | Reason required |
| `SYN-PPO-ACR-000004` | Draft | **Interrupted case**; resumes after reload; conflict demonstration |
| `SYN-PPO-ACR-000005` | Refused at submit | Self-approval |

**Review campaigns:**
- Company A restricted access: half complete, one *Unable to confirm*;
- Service team: complete, with export.

**Fixture manifest:** a canonical JSON with its SHA-256 recorded in the report and the evidence. No fixture enters a database seed or migration.

---

## 9. Presentation standard

- **Theme:** r20 tokens, embedded Roboto (Verdana fallback), navy and green, shared choice menus, dialog treatment. Font bytes and combined SHA-256 declared in the change record.
- **Module only:** no rail, masthead, logo, login or global navigation.
- **Scope container:** `#ppo-access-review` with the token block and local reset of `globals.css` elements on the container.
- **Token core:** reuse shared names; declare which known divergences are adopted in the change record.
- **Inspection surface:** 448 px right panel for grant detail and explanation traces. Centred dialogs are reserved for decisions, reasons and confirmations.
- **Viewports:** 1440×960, 1024×768, 820×800, 390×844, with 320 px CSS treatment. No horizontal page overflow; the matrix scrolls within its own labelled region with sticky row headers.
- **Plain language:** capability keys are shown in monospace **beside** labels, never instead of them. No implementation jargon in labels (for example *Allowed at this site*, not *scope_type=Site match*); keys appear in the trace.
- **Privacy:** no tokens, hashes of tokens, unmasked hosted object IDs, email addresses or phone numbers.
- **Conventions:** Australian English; dd Month yyyy in prose; ISO 8601 in filenames and exports. No money in this module, so no AUD or GST is shown.

---

## 10. Verification plan

| Check | Tool | Pass condition |
|---|---|---|
| Model checks | `scripts/check-access-review-model.mjs --write-evidence` | All named groups pass; evidence JSON bound to the HTML SHA-256 and the fixture manifest hash |
| Contract fidelity | Assertions in the model check | Capability list equals the `Capability` union parsed from `src/platform/permissions.ts` at the pinned commit (61), with `email.connect` marked hosted-only. Scope combinations match `ck_grants_scope`. Evaluation matches §4.4 for a generated table of person × capability × company/site cases, including inactive, future, expired, Workspace, Company, Site and cross-company |
| Honesty assertions | Model check | No seeded grant shows a fabricated audit row; no review cadence or retention period rendered; *Simulated apply* label present on every apply; bundles never *Adopted*; teams grant nothing; hosted IDs masked |
| Role boundaries | Model check | Administrator cannot approve own request; approver cannot approve a change to own access; team lead sees only own team; auditor cannot change; ordinary user sees only self |
| Workflow integrity | Model check | Idempotent apply; conflict detection; returned needs reason; campaign cannot complete with undecided items; invalid backups refused without data loss |
| Eight UI states | Model check | Each reachable and distinct |
| Composition | Model check | Only the module; six accessible views; single scope container; token names match source; font hash matches |
| Native rendering and interaction | `scripts/check-access-review-browser.mjs` | ≥ 30 groups; zero page or console errors; declared viewports; 0 px page overflow; 44 px phone targets; keyboard-only completion of a change request and a review item; dialog focus return |
| Documentation | `check_foundation.py`, `check_prototype.py`, `check_naming.py` | Pass; 78 parents intact; instructions ≤ 8,000 characters |
| Conflict markers | `git --no-pager grep -n -E "^(<<<<<<<\|=======$\|>>>>>>>)" -- docs` | None |
| Whitespace | `git diff --check` | Clean |
| Determinism | Rebuild from a fresh clone | Committed HTML reproduced byte for byte |
| Changed-text confirmation | Read back each edited shared file (`STATUS.md`, register CSV, UI README) | The new row text is present |
| Native visual review | Dean, in a browser | **Not claimable from this environment.** Desktop geometry, top-layer dialogs, physical 320/390 devices, zoom and print remain for Dean |

Target: **at least 55 model groups and 30 native groups.** This is a floor, not acceptance.

If the pinned Chrome channel is unavailable, record the substitute browser and version, and state that it is not evidence for the pinned runtime.

---

## 11. Deliverables and naming

| Deliverable | Path |
|---|---|
| Design HTML | `docs/reference/ui/access-review/PPO-Users-Roles-and-Access-Review-r01.html` |
| Detailed companion report | `docs/reference/ui/access-review/PPO-Users-Roles-and-Access-Review-Report-r01.md` |
| Change record | `docs/reference/ui/access-review/PPO-Users-Roles-and-Access-Review-r01-change-record.md` |
| This plan | `docs/delivery/users-roles-access-review-build-plan.md` |
| Maintainable sources | `docs/design/access-review/`: `template.html`, `fonts.css`, `workspace.css`, `capabilities.js` (generated from the pinned union), `model.js`, `workspace.js`, `fixtures.json`, `README.md` |
| Deterministic builder | `scripts/build-access-review.py` |
| Model check | `scripts/check-access-review-model.mjs` |
| Native browser check | `scripts/check-access-review-browser.mjs` |
| Focused workflow | `.github/workflows/access-review-design.yml` |
| Decision and receiving handover | `docs/decisions/access-review-design.md` (`PPO-AD01-DES`) |
| Verification evidence | `docs/testing/evidence/access-review-r01/README.md` (`PPO-AD01-VERIFY`) |
| Index row | `docs/reference/ui/README.md` — shared platform pages |
| Register rows | `docs/standards/document-register.csv` — plan, design, HTML, report, change record, verification |
| Status | `docs/STATUS.md` — one dated line plus the Shared platform row, Design-only column (replace, don't append narrative) |
| Branch / PR | `design/users-roles-access-review-r01` → PR *Design AD-01 Users, Roles, Teams & Access Review r01* |

The PR description states:
- sources and pinned commit, and hashes;
- checks run and their actual results, and what is not verified;
- **no application, migration, seed, deployment or access change**;
- that publication is not approval.

**Push-route note.** The GitHub connector cannot write `.github/workflows/*` (a 403 was observed in an earlier session). The workflow file must be committed through a git session with workflow scope, or handed to Dean as a numbered GitHub Desktop procedure. This will be decided in Phase 0, not discovered at the end.

---

## 12. Decisions required before build

| # | Decision | Recommendation | Consequence of the alternative |
|---|---|---|---|
| 1 | What a "role" is | **A proposed bundle that expands to individual grants.** The server keeps checking grants only | Making roles an authority layer would require a new evaluation rule, and the design would misrepresent the running model |
| 2 | Do teams carry authority? | **No, in r01.** Teams route reviews and power team views | Team-inherited access is harder to review and explain, and would pre-empt D-020 |
| 3 | Grant change command | **Simulate apply in the HTML**; record a receiving contract for a future runtime increment (`User`/`PermissionGrant` audit types, change-request table, admin capabilities) | Designing as if the command exists would overstate delivery; omitting the workflow leaves NFR-02 unanswered |
| 4 | Administrative capabilities | **Show `admin.access.*` as Proposed**, visibly outside the 61-value contract | Reusing an existing capability would imply authority nobody granted |
| 5 | Separation-of-duties pairs | **Warnings only, limited to runtime-evidenced separations** (finance four-way; pack check/issue) | Inventing pairs creates unsourced policy |
| 6 | Review cadence and evidence retention | **Render *not agreed (D-020 / D-012 / D-021)*** | An invented quarterly cadence would read as adopted policy |
| 7 | Hosted tester presentation | **Read-only, masked, expiry shown; provisioning stays the owner script** | Offering extend or add in the page contradicts the runtime write revocation and the 14-day rule |
| 8 | New reference type `ACR` | **Use `SYN-PPO-ACR-` in fixtures and propose the PPO-STD-001 addition in the decision record** (naming check must pass) | Reusing another type code confuses registers; if `check_naming.py` rejects an unregistered code, fall back to UUID-only display and record why |
| 9 | Build method | **Deterministic builder plus a generated capability list parsed from the pinned source** | A hand-typed list drifts from `permissions.ts` and the contract-fidelity check loses meaning |
| 10 | Start condition | **Branch now from `81b0d401`.** Merge `main` before marking ready; reconcile shared rows by addition | Waiting for 13 open PRs delays a dependency-free module for no design reason |

---

## 13. Build sequence

Each phase has an exit criterion. No phase is reported complete on the basis of having been attempted.

| Phase | Work | Exit criterion |
|---|---|---|
| **0. Preflight** | Re-read `main` head and open PRs; create the branch; confirm the push route for the workflow file; pin source SHAs (0001, 0002, `permissions.ts`, `identity.ts`, seeds, theme r20) | Branch exists at the recorded base; pins written into the decision record draft |
| **1. Contract extraction** | Generate `capabilities.js` from the pinned union (61 + hosted `email.connect` flag); encode `ck_grants_scope`, `uq_grants_scope` and the §4.4 evaluation in `model.js`; write the generated evaluation test table | Model unit groups for contract fidelity pass |
| **2. Proposed model** | Bundles, teams, change requests, reviews, SoD pairs, access events, guards (self-approval, reason, version, idempotency) | Workflow-integrity and role-boundary groups pass |
| **3. Fixtures** | Build `fixtures.json` per §8; compute manifest hash; validate every grant against the contract rules | Fixture validation passes; every §8 scenario reachable from the model |
| **4. Shell and layout** | Template, fonts, scoped CSS, tabs, context strip, supporting column, inspection panel, action footer, phone stacking | Composition groups pass; builder deterministic |
| **5. Views 6.1–6.3** | People, Person access (with matrix and trace), Catalogue | View-level model groups pass; keyboard reachability confirmed in the native check |
| **6. Views 6.4–6.6** | Changes, Reviews, History and Explain; dialogs; conflict and interrupted-case demonstrations | Workflow scenarios pass end-to-end in model and browser |
| **7. Cross-cutting** | Eight states, storage and fallback, backup/restore validation, evidence export, fixed clock, scripted assistant, synthetic labelling | All cross-cutting groups pass |
| **8. Native verification** | Browser check at declared viewports; overflow, targets, focus, console; capture screenshots to the evidence folder | ≥ 30 native groups pass with zero errors; captures reviewed by me and listed as reviewed-by-agent, not accepted |
| **9. Documentation** | Report, change record, decision record and receiving contract, evidence README, index row, register rows, STATUS row, entry links | Three check scripts pass; marker scan clean; each edited shared file read back and the new text confirmed present |
| **10. Publication** | Commit; push; open draft PR with the template; merge `main` into the branch if it moved; re-run checks | Required checks green on the PR head, recorded by run ID; PR marked ready only then |
| **11. Handover** | Durable handover (`claude_ad01-users-roles-access-review-r01-build-handover.md`): outcome, SHAs, results, limits, open decisions, next step | Handover lists what is verified, what is not, and Dean's review items |

---

## 14. Receiving contract for a future runtime increment (recorded, not built)

This is recorded so the design does not strand. None of it is authorised by this package.

1. **Migration:** add `User`, `PermissionGrant` and `AccessReview` to `ck_audit_object_type`; add `access_change_requests` and `access_reviews` tables with version, operation ID and reviewer constraints; add `admin.access.*` capabilities.
2. **Commands:**
   - `submitAccessChange`;
   - `decideAccessChange`;
   - `applyAccessChange`, which is idempotent, version-checked and applies grants plus audit in one transaction;
   - `recordReviewAttestation`.
3. **Guards:** requester ≠ reviewer ≠ subject, enforced **on the server**; the hosted runtime role keeps grant writes revoked unless a deliberate, reviewed change alters that.
4. **Tests:**
   - positive and negative role tests;
   - cross-company;
   - site-scope;
   - inactive;
   - expired;
   - duplicate retry;
   - concurrent decision;
   - audit reconstruction (NFR-01, NFR-02, NFR-09).
5. **Closure:** a D-020 role/action/data matrix and security review remain required before any operational use.

---

## 15. Risks and failure modes

| Risk | Effect | Mitigation in this design |
|---|---|---|
| The page is read as the enforcement point | False confidence; client-side "security" | Repeated statement that the server decides; explanation labelled a reproduction |
| Proposed roles read as adopted departmental roles | Implied staffing or policy decisions | *Proposed — not adopted (D-020)* badge; no named employees; no Adopt control |
| Capability list drifts from code | Stale or wrong catalogue | Generated from pinned source; contract-fidelity check |
| Fabricated history for seeded grants | Misleading audit evidence | Provenance-only rows; honesty assertions |
| Instant-revocation claim | Offline data exposure understated | Separate server and device lines (§4.7) |
| Hosted identifiers exposed in a public repository | Privacy leak | Synthetic fixture IDs only, masked display, privacy check |
| Matrix overwhelms users | Poor usability, bulk mistakes | Family rows × fixture scopes only; per-cell explanation; no bulk tick |
| Queue conflicts on shared files with 13 open PRs | Rebase churn | Additive rows; merge `main` before ready; read back each shared file |
| Workflow file cannot be pushed via connector | Missing focused CI | Push route decided in Phase 0 |

---

## 16. Open questions for Dean

1. Confirm decisions 1–10 in §12. They are all reversible, but they shape every view.
2. Should the proposed review-routing role be titled **Platform / data owner** (the register's reviewer role) or **Access approver**?
3. Is `ACR` acceptable as a proposed reference type code, or do you prefer another?
4. Should the hosted demo testers appear at all in a public design, even masked? The recommendation is yes, masked and synthetic, because expiry is a real operating control. The alternative is local identities only.
