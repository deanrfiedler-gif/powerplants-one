---
document_id: PPO-AD01-RPT
title: Users, Roles, Teams & Access Review r01 — detailed design report
revision: r01
date: 2026-09-17
owner: Dean Fiedler
status: Proposed standalone design; owner acceptance, D-020 decisions and application integration separate
source_commit: efd4d4e33f5fc4ef2a4605455ed8d4c66e0ddc39
html_sha256: a15ecb01ff596e5eaa9cc784977ab103fe664de6258ac41c66aaed58397d6363
---

# Users, Roles, Teams & Access Review r01 — detailed design report

## 1. Summary

AD-01 is the first screen in Powerplants One that shows **who holds which permission, for which company or site, from when to when, and why**. It explains any access decision with the server's own rule, proposes access changes through an independent review, and records periodic access reviews.

**It enforces nothing.** The server remains the only authority, and the page says so on every view.

What this package delivers:

- **The page:** [interactive HTML](PPO-Users-Roles-and-Access-Review-r01.html) with six views, five preview roles and eight UI states.
- **Tooling:** maintainable [source](../../../design/access-review/README.md), a deterministic builder, and model and native browser checks.
- **Records:** this report, a [change record](PPO-Users-Roles-and-Access-Review-r01-change-record.md), a [decision and receiving handover](../../../decisions/users-roles-access-review-design.md) and [verification evidence](../../../testing/evidence/access-review-r01/README.md).
- **Build plan:** built from [PPO-AD01-R01-PLAN](../../../delivery/users-roles-access-review-build-plan.md).

Every element is marked by evidence class:

- **Contract** — exists in merged migrations or `src/platform/*` and is enforced by the application.
- **Seed** — exists only in synthetic seed or hosted-setup data.
- **Proposed** — a design extension, labelled *Proposed* in the page.

## 2. Traceability and conformance

| Field | This package |
|---|---|
| Scope identity | **AD-01** Users, roles, teams and access review (coverage register r06, P1, reviewer Platform / data owner). Parents NFR-01–NFR-12, CRM-08, FIN-06. No new scope, domain or requirement identity |
| Page type | Primary **Work queue + persistent detail**. Supporting types: **Register / worklist** (People, capabilities), **Record detail** (Person access), **Review / comparison** (request before/after, bundle revisions, access reviews), **Form / guided workflow** (request form) |
| Reused components | r20 page title, context strip, tabs, named state badges, metric tiles (queues), register/cards, 292 px supporting column, action row, native `<dialog>` decisions, 448 px right-side inspection panel |
| Source authority | Contract / Seed / Proposed on every element; source hashes in §3 |
| Incoming handover | Identity from its issuer (`PPO-LocalSynthetic` or hosted `PPO-EntraDemo`); companies and sites from shared records; grants from seed, setup script or an applied request |
| Outgoing handover | A reviewed access-change proposal and review attestations. Applying a grant is simulated, because no server command exists (§14) |
| Exceptions and recovery | Normal · hosted identity source unavailable (partial) · loading · read failed · empty · denied view · inactive identity with grants · expired tester · failed save · lost response · conflict from another session · damaged stored session · tampered backup |
| Departures | All proposed entities (§6.3) and the `ACR` reference code are labelled in the page. Build-time corrections to the plan are in §12 |
| Verification | 107 model groups and 40 native browser groups passed (§13). Native visual and device acceptance is reserved for Dean |

**Primary acceptance anchors:**
- **NFR-01**, server authorisation: the §5 evaluation and explanation.
- **NFR-02**, attributable audit: the proposed access events with actor, time, reason, before/after and operation.
- **NFR-05**, degraded operation: the partial and failed states.
- **NFR-08**, accessible workflows: keyboard, dialogs and reflow.
- **NFR-09**, duplicate and conflicting commands: idempotent apply and version conflict.

**Governing open decision:** D-020 (identity, permissions, privacy and external access); its closure evidence is a role/action/data matrix and security review. Also open: D-012 and D-021 (retention and review targets).

## 3. Pinned sources

All sources were read on `main` at `efd4d4e33f5fc4ef2a4605455ed8d4c66e0ddc39`.

| Source | SHA-256 | What it fixed |
|---|---|---|
| `src/platform/permissions.ts` | `a589022f8fdfaf109a58b3ad97f4856bbad472fa2e2b94803e50ea9b4402bcfc` | 61-value `Capability` union; `hasPermission` / `scopeSql` evaluation |
| `src/platform/identity.ts` | `c72b65af9e949988707d076d196f5343f44fe2b6d7953fa319c34dd54ad2f707` | Issuers; 8-hour local sessions; `active` required on every resolution; session-selection audit |
| `db/migrations/0001-foundation.sql` | `6817290d78e6493a8b266ddfdef1c5a2806683516e9f397c5c6fa3a8d8e1aaf4` | `users`, `permission_grants`, `sessions`, append-only `audit_events`, `operation_receipts` |
| `db/migrations/0002-shared-foundation.sql` | `9f817da163dc168b61fe363665f1b1bc3308e75ddb44aa71fac96e99a1225bdb` | Grant `id`, `scope_type`, `scope_id`, `site_id`, `ck_grants_scope`, `uq_grants_scope`, site foreign key |
| `db/demo/0001-identity.sql` | `c1c83927c964e364216c5188173b5b86dbed3341cbd9b16b98d71b08ebd0bf8a` | `demo_testers` |
| `scripts/demo-database.ts` | `9dc127224dedff3cbf8e11500de2d9df6a50c72a24464ec4a3b5677b1a62dbc1` | 24 tester capabilities at Company A; at most five testers; expiry within 14 days; removed testers made inactive |
| `scripts/demo-runtime.ts` | `0d7278cbc1c52b72295d47cd8fdc24b7ac099a4912ebec341c9fec3df20581fd` | Hosted runtime has no write access to users, grants or testers |
| `db/seed.sql` and domain seeds | `seed.sql` `3a5460878e57f6d803affee8ff10a09f1888d2167a78755c9af12a09769c5b81` | Workspace, companies SYN-A/SYN-B, three sites, synthetic user identifiers |
| `src/finance/service.ts` | `59008367e1f1b8c320471d3c5c551f4fff7236139c46e44bac793bc021d3df58` | Runtime separations used for SoD warnings |
| r20 theme board | `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617` | Presentation authority; fonts reused through My Work r01 (`57b4aafb…4bef`) |

## 4. Views as built

The frame is: page title; synthetic context strip (fixed clock **17 September 2026, 10:00 AEST**, preview role, save status); authority statement; six tabs (arrow, Home and End keys supported); an optional toolbar; the main column plus a 292 px supporting column; a 448 px inspection panel on demand. Below 1,150 px the supporting column moves under the main column. Below 600 px tables become labelled cards and every control is at least 44 px high.

### 4.1 People

- **Queue tiles** (filters, not states), each with its count for the preview scope:

  | Tile | Fixture count |
  |---|---|
  | Inactive with current grants | 1 |
  | Hosted tester expiring or expired (≤ 3 days) | 2 |
  | Grants ending within 14 days (display window, not a policy) | 2 |
  | Workspace-wide grants | 1 |
  | Restricted access holders | 5 |
  | Separation-of-duties warnings (held, or in a submitted/approved request) | 1 |
  | Pending changes | 3 |

- **Search** covers name, subject, UUID, capability keys and scope names.
- **Filters:** issuer, status, company, capability family. **Sort:** attention first, or name.
- **Register columns:** person (masked subject), issuer, status, current scopes, current grant count by family, attention tags, sessions, and an Open action.
- **Selection:** a filter that hides the selected person clears the selection and says so.
- **Why a register, not a grid:** a person × capability grid would be unreadable and would hide scope and validity.

### 4.2 Person access

- **Identity block:** UUID, issuer, masked subject, synthetic, active, inactive-since, and tester expiry and enabled status.
- **Inactive identities** get two separate notes: *Server access: refused* and *Offline device content: may persist*.
- **Grants** are grouped by family. Each row shows:
  - capability label and key;
  - scope type and scope;
  - valid from and valid to, with time (AEST);
  - state (Current, Future or Expired);
  - provenance;
  - Details and Explain actions.
- **Effective access matrix:**
  - rows are families (families with grants by default, all 13 on request);
  - columns are SYN-A company-level, SYN-B company-level and each of the three sites;
  - each cell shows *allowed / total* and is marked where access arrives through a workspace grant;
  - a cell opens the panel with each capability's result and a *Why?* trace.
- **Supporting column:**
  - teams (Proposed);
  - matching role bundles (derived, strongest match first);
  - separation-of-duties warnings;
  - sessions (count and latest expiry; tokens are never shown);
  - open requests.
- **Request change** appears only for administrators and team leads, and only for an active, local identity that is not the viewer.

### 4.3 Roles, teams & capabilities

- **Capabilities:** all 61, with label, key, family, read or change, flags (own records only, restricted, hosted demo only, in tester set) and current-holder count. The count links to People, filtered to that capability.
- **Role bundles (Proposed):** list and detail showing family, revisions, capabilities, allowed scopes, matching holders, and a *Compare r01 → r02* panel with added and removed capabilities and holders to review. The badge reads *Proposed — not adopted (D-020)*. **There is no Adopt action.**
- **Teams (Proposed):** lead, purpose and dated membership. The banner reads *Teams grant no access*.
- **Supporting column:** separation-of-duties pairs with source references, and the four proposed administrative capabilities, labelled as outside the contract.

### 4.4 Access changes (Proposed workflow)

- **Request list** filtered as open, all, or by state.
- **Request detail:**
  - reference (proposed `ACR` type code);
  - affected person, requester, reviewer, effective time, version, reason;
  - origin (when created by a review), decision, applied time;
  - operations in plain language;
  - warnings;
  - a before/after table, with changes marked by icon and text as well as colour;
  - history timeline.
- **Actions** follow the rules in §8.
- **Guided form:**
  - affected person, which is fixed once a request exists;
  - reviewer, filtered to approvers other than you and the affected person;
  - effective date, not in the past;
  - one to ten operations: add a capability; change an end date; change a scope; revoke;
  - reason, 10–500 characters.
- **Form behaviour:** changing an operation's type, scope or company re-renders only that form and keeps what has been typed. Cancelling a changed form asks before discarding it.

### 4.5 Access reviews (Proposed workflow)

- **Campaign list and detail:** scope, reviewer, due date, progress, completed time, *Review cadence: not agreed (D-020)* and *Evidence retention: not agreed (D-012 / D-021)*.
- **Per-grant decisions:** Keep, Change, Revoke or Unable to confirm. Unable to confirm needs a reason and an owner.
- **Change and Revoke** create a **draft request for the access administrator** and change no grant.
- **Completion** is disabled until every item is decided; afterwards the review is read-only.
- **Exports:** evidence as JSON and CSV. The CSV carries a synthetic banner, and cells that could be read as formulas are neutralised.

### 4.6 History & explanation

- **Explain access:** choose a person, capability and target record (or no specific record). The step trace appears immediately, and can be opened in the panel.
- **Access history:**
  - timeline filterable by person and event type;
  - application audit events (Session) are tagged *Application audit*;
  - proposed workflow events are tagged *Proposed event*;
  - user deactivation from seed data is tagged *Not recorded*, with no actor.
- **No invented history:** no past audit row is fabricated for any seeded grant.

## 5. Evaluation rule (Contract)

`evaluate(person, capability, company?, site?)` reproduces `hasPermission` and `scopeSql`. It returns a result and a trace:

1. **Identity is active.** Otherwise refused: the server refuses the session itself.
2. **A grant exists for that exact capability.**
3. **The grant is within its validity window:** `valid_from ≤ now`, and `valid_to` is null or later than now.
4. **The scope covers the target:**
   - with no company, any scope passes;
   - a Workspace grant always passes;
   - a Company grant needs the same company;
   - a Site grant needs the same company and site. A site grant never covers a company-level record, because a null site is never equal.
5. **Own records** (for `.own` capabilities): reported as *Not reproduced*, because the owning module applies it.

Two consequences are rendered explicitly:
- **Workspace scope reaches every company**, including SYN-B.
- **A capability check without a company passes on any grant.** The page describes this as "capability held anywhere; record access still checked per record". It is recorded as an observation for D-020, not a defect.

## 6. Information model

### 6.1 Contract

**User:** `id`, `workspace_id`, `issuer`, `subject_id`, `display_name`, `active`, `synthetic`.

**Grant:** `id`, `user_id`, `capability`, `scope_type`, `scope_id`, `company_id`, `site_id`, `valid_from`, `valid_to`. The rules enforced in the model and on restore are:
- the scope shape (`ck_grants_scope`);
- the site belongs to its company;
- one grant per person, capability and scope, **including expired grants** (`uq_grants_scope`);
- the end is after the start.

**Hosted tester:** `tenant_id`, `object_id`, `enabled`, `expires_at`.

**Sessions:** count and latest expiry only.

**Audit:** only `Session` events are application audit today. `ck_audit_object_type` has no `User`, `PermissionGrant` or `AccessReview` value.

### 6.2 Seed

- **Workspace:** `10000000-…-0001`.
- **Companies:** SYN-A and SYN-B. Both have the display name *SYN Greenhouse Demonstration*; the page always shows the ERP key beside the name.
- **Sites:** SYN Q01 Demonstration Site and SYN V01 Previous Site (both SYN-A), and SYN Company B Site.
- **People:** nine seeded user identifiers and display names.

Grants on seeded identities are an **illustrative fixture subset, not the full seed grant set**, and carry provenance *Fixture*.

### 6.3 Proposed

| Entity | Rules as built |
|---|---|
| Role bundle | Name, family (business use, approval or integration), revisions (Proposed or Draft), capabilities, allowed scopes. Derived matching only; never adopted; comparing revisions lists holders and changes no grant |
| Team | Lead, purpose, dated members. **No authority** |
| Access change request | Reference `SYN-PPO-ACR-NNNNNN` (type code not in PPO-STD-001 §10.2); states Draft → Submitted → Approved or Returned → Effective, or Withdrawn; version; operation list; reason; reviewer; decision; history; origin |
| Access review | Scope label, reviewer, due date (fixture date, not a cadence), items with a grant snapshot and decision, state In progress or Complete, version |
| Separation-of-duties pair | Finance prepare + review (the runtime refuses a review by the handoff owner); Finance process + reconcile (the runtime refuses reconciliation by the processing owner). Warning only. **No pack pair**, because the runtime does not separate pack check and issue |
| Administrative capabilities | `admin.access.read`, `.propose`, `.approve`, `.review`. Used only by preview roles; outside the 61-value contract |
| Access event | Type, object, actor, time, reason, operation, outcome, before/after grant lists. Append-only in the model |

## 7. Preview roles

| Role (person) | Sees | Can | Cannot |
|---|---|---|---|
| Access administrator (SYN Access administrator) | Everyone | Draft, submit, edit or withdraw requests; simulated apply after approval | Decide requests; change own access; change hosted testers or inactive identities |
| Access approver (SYN Platform data owner) | Everyone | Decide requests where named reviewer; record reviews assigned to them | Raise requests; decide own request or a change to own access; apply |
| Team lead (SYN Service team lead) | Current team members and self; own requests; own reviews | Draft and submit requests for team members; record own reviews | See other teams; decide; apply |
| Auditor (SYN Access auditor) | Everyone, read-only | Explain, filter, export evidence | Any change |
| Ordinary user (SYN Site observer) | Self only; own events | People, Person access, Catalogue, History | Open Access changes or Access reviews (Denied state) |

Roles are local previews and are labelled *not security*.

## 8. Workflow rules (Proposed)

| Command | Guards |
|---|---|
| Save request | Proposing role. Affected person visible to you, local issuer, active and not you. Reviewer holds approval and is independent. Effective date not in the past and a real calendar date. One to ten operations, each valid (below). Reason 10–500 characters. Edit only as Draft or Returned, by the requester or an administrator, at the current request version. Editing a Returned request reopens it as Draft and records that |
| Operation: add | Capability in the contract. `email.connect` only for hosted identities. Valid scope. No existing grant at the same person, capability and scope, even an expired one ("change its validity instead"). No duplicate within the request. End after the effective time |
| Operation: validity | Subject's own grant. End after the grant's start, or no end |
| Operation: scope | Valid new scope, not a duplicate, grant not expired |
| Operation: revoke | Current grant only (a future grant must change validity). Implemented as ending the grant at the effective time; **the row is retained** |
| Submit | Draft only; requester or administrator; reviewer chosen and independent; operations re-validated; warnings recorded |
| Decide | Approval role; named reviewer; not requester; not the affected person; not the reviewer who recommended it in an access review; current version; Approve or Return; reason required |
| Apply (simulated) | Administrator only; Approved only; not own access; identity still active; operations re-validated; confirmation checkbox. Records before/after and a proposed event |
| Withdraw | Draft, Submitted or Returned; requester or administrator; reason required |
| Attest | Review role; assigned reviewer; review in progress; current review version; item undecided; not own access; reason required; owner required for Unable to confirm. Change or Revoke creates a draft request routed to the administrator, recording the attester, who is then excluded as its reviewer |
| Complete review | Assigned reviewer; every item decided; current version |

**Every command:**
- carries an operation ID;
- checks the workspace version;
- runs on a copy, so a refusal changes nothing.

An identical retry returns the original result. Reusing an operation ID with different content is refused.

## 9. How counts are calculated

- **Current grants:** grants in the Current state against the fixed clock.
- **Queues:** evaluated per visible person, as listed in §4.1.
- **Matrix cells:** the number of capabilities in the family allowed by §5 for that company and site.
- **Bundle match:** current capabilities held anywhere, compared with the bundle's Proposed revision. Shown when at least half match.
- **Review progress:** decided items over total items.

## 10. Fixtures

**Fixture manifest SHA-256** (canonical JSON of the seed state): `13d0e64db11afa36104a55be883c5c605947b84bc3a9471acbeaa36a57ede37d`.

### 10.1 People

| Person | Issuer | Demonstrates |
|---|---|---|
| SYN Coordinator | Local | Company A service grants; expired `crm.opportunity.read`; matches *Service coordinator* r01 except `service.readiness.assess` |
| SYN Site observer | Local | Site grant at Q01 (from SYN-PPO-ACR-000001); refused at V01 and for company-level records |
| SYN Workspace observer | Local | Workspace `shared.read` reaching SYN-B; widening queue |
| SYN Company B coordinator | Local | Isolation from Company A |
| SYN Riley Technician | Local | `.own` field grants ending 25 September; team member |
| SYN Finance context reviewer / reviewer / processor / reconciler | Local | Restricted access and separations across four people; the pending request would breach one |
| SYN Finance reviewer (future) | Local | Company B `finance.read` starting 1 October |
| SYN Access administrator, Platform data owner, Service team lead, Access auditor | Local, design-only | Preview-role actors; no business grants |
| SYN Deputy platform data owner | Local, design-only | Proposed approval holder who is not a preview role; the independent reviewer for review-originated requests |
| SYN Former coordinator | Local, design-only | Inactive with current grants; deactivation *Not recorded* |
| SYN Demo tester 5d0000 | Hosted | 24 tester grants at Company A ending at expiry in two days; masked |
| SYN Demo tester 5d0001 | Hosted | Expired and disabled; identity source unavailable in the partial scenario |

### 10.2 Requests and reviews

| Record | State | Demonstrates |
|---|---|---|
| SYN-PPO-ACR-000001 | Effective | Normal site-limited add |
| SYN-PPO-ACR-000002 | Submitted | SoD and restricted warnings |
| SYN-PPO-ACR-000003 | Returned | Recorded return reason |
| SYN-PPO-ACR-000004 | Draft (team lead) | Interrupted draft and conflict demonstration |
| Company A restricted access | In progress | Nine items: three Keep, one Unable to confirm |
| Service team access | Complete | Read-only; exportable |

## 11. States and recovery

| State | How reached | Behaviour |
|---|---|---|
| Loading | Preview options | Placeholder bars; no counts |
| Read failed | Preview options | No counts; *not an all-clear*; Retry |
| Partial | Preview options | Local identities complete; hosted status, sessions and tester queue shown as unknown (—) |
| Empty | Preview options | *Check your scope before assuming nobody has access* |
| Denied | Ordinary user on Changes or Reviews | Role explanation |
| Saving | *Slow* next save | Status reads *Saving…* |
| Saved / session only | Normal | Status reads *Saved in this browser*, or *Session only* when storage is unavailable |
| Conflict | *Another session saves first*, or a storage event from another tab | Nothing overwritten; form entries kept; *Reload latest version* |
| Failed save | *Fails* next save | Nothing saved; entries kept |
| Outcome unknown | *Response lost* next save | Banner; *Recover original operation* re-sends the same operation and confirms no duplicate |
| Damaged stored session | Malformed storage | Stored text preserved and downloadable; explicit reset |
| Restore | Preview options | Validated. Refuses an unknown capability, invalid scope, reversed validity, duplicate grant, self-decided request, email.connect on a local identity, or a completed review with undecided items. Confirmation required |

The scripted assistant answers four source-scoped prompts (person summary, grants ending soon, current explanation, draft reason). It has no submit action.

## 12. Departures from the build plan and corrections

| Plan statement | As built | Reason |
|---|---|---|
| SoD pairs include pack check/issue | **Removed.** Only the two Finance separations | `src/documents/packs.ts` has no checker/issuer actor separation; `src/finance/service.ts` does for both Finance pairs |
| Fixtures reuse the Willowbank organisation and sites | Seeded workspace, SYN-A/SYN-B and the three seeded sites | Grants reference seeded scope identifiers; this makes the explanation faithful to the running model |
| Fixed clock 16 September | 17 September 2026, 10:00 AEST | Build date |
| A request *refused at submit* as a fixture | Self-approval and other refusals are demonstrated interactively and in checks; no refused record is stored | A refused command writes nothing, so a stored "refused" record would misrepresent the rule |
| Change requests start as proposed by an admin | The team lead can also propose for current team members | Plan §5 gave team leads *request changes for own team* |
| Access-review Change/Revoke | Creates a draft routed to the access administrator, with no reviewer chosen | Keeps the reviewing approver from becoming the requester. Following owner decision 5 (§15), the attesting approver is also excluded as the request's reviewer, and a deputy approver fixture was added |
| Plan filed under `docs/reference/ui/access-review/` | Filed at `docs/delivery/users-roles-access-review-build-plan.md` | Matches the DK-03 package convention |
| Browser group target ≥ 30 | 40 | — |
| Model group target ≥ 55 | 107 | Includes 16 evaluation cases and 9 restore refusals |

## 13. Verification summary

| Check | Result |
|---|---|
| Deterministic build | Rebuild reproduces HTML SHA-256 `a15ecb01…6363` and the generated capability file |
| Model | **107 groups passed** ([result](../../../testing/evidence/access-review-r01/model-results.json)) |
| Native browser | **40 groups passed**, zero page or console errors, on **substitute Chromium 141.0.7390.37** with Node 22.22.2 and Playwright 1.63.0. This is **not** the pinned Chrome channel or Node 24.21.0; the focused workflow provides that evidence |
| Viewports | 1440, 1024, 820, 390 and 320 px for all six views: no page overflow; no visible content or toolbar button under 44 px high at 390 and 320 px |
| Visual inspection | Captures reviewed by the builder (§ evidence record). Defects found and fixed are listed in the change record |
| Documentation | Foundation, prototype and naming checks, and the conflict-marker scan (see evidence record) |
| Not verified | Pinned-runtime result (pending workflow); native desktop and device review, zoom, print and screen-reader behaviour (Dean) |

## 14. Receiving contract (recorded, not authorised)

1. **Migration:**
   - add `User`, `PermissionGrant` and `AccessReview` to `ck_audit_object_type`;
   - add `access_change_requests` and `access_reviews` tables with version, operation ID and independent-reviewer constraints;
   - add `admin.access.*` to the capability list, then to `Capability`;
   - update the migration registry and the dependent test lists named in `AGENTS.md`.
2. **Commands:**
   - submit, decide and record-attestation commands;
   - an idempotent, version-checked `applyAccessChange` that writes grants and audit in one transaction.
3. **Server guards:** requester ≠ reviewer ≠ affected person. The hosted runtime keeps grant writes revoked unless a separately reviewed change alters that.
4. **Tests:**
   - positive and negative roles;
   - cross-company;
   - site scope;
   - inactive;
   - expired;
   - duplicate retry;
   - concurrent decision;
   - audit reconstruction.
5. **Closure:** the D-020 role/action/data matrix and security review remain required before operational use.

## 15. Limitations and owner decisions

- **No enforcement:** the page does not authenticate, authorise or change any real or hosted access.
- **Proposed wording:** capability labels are proposed design copy; keys are authoritative.
- **Fixture grants:** grants on seeded identities are a subset chosen for demonstration.

**Owner decisions, 17 September 2026.** Dean delegated the five open questions ("proceed however you believe is the most professional"). They were decided as follows for this prototype design; none closes D-020:

1. **Build plan §12 decisions 1–10** are confirmed as built, with the corrections in §12.
2. **Approval role title:** *Access approver* is the functional role name. *Platform / data owner* is the proposed accountable holder of that role (the register's reviewer role), not the role's name. Keeping them separate lets another person hold the role, as the deputy approver shows.
3. **`ACR` reference type:** registration is **deferred**. PPO-STD-001 r04 is an adopted, revision-controlled standard, and a design contribution should not amend it. The code stays labelled *proposed type code*. It should be registered in one r05 amendment when a runtime increment actually allocates access-change references; the unregistered `DOC` code recorded by Job Pack r03 should be considered in the same amendment.
4. **Hosted testers stay in the public design.** Tester expiry is a real operating control worth showing. Every tenant and object identifier is fictional, and display is masked.
5. **Independence of review recommendations:** the approver who attests Change or Revoke **may not** decide the resulting request. This is now enforced in the model and page:
   - the attester is recorded on the request;
   - the attester is excluded from the reviewer choice;
   - saving, submitting or deciding with the attester as reviewer is refused;
   - restore refuses such a record.

   A design-only *SYN Deputy platform data owner* provides the independent approver.
