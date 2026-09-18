---
document_id: PPO-CS02-R01-PLAN
title: Contacts, Stakeholders & Relationships workspace r01 — design build plan
revision: r01
date: 2026-09-18
owner: Dean Fiedler
status: Proposed. Not yet authorised; §12 decisions are open and §16 questions are unanswered
register_entry: CS-02 · Contact directory and contact detail · P1 · D (dedicated refinement) · Pages — with CS-03 · Stakeholder and relationship view · P1 · N (new design candidate) · Tab · reviewer CRM / site data steward
source_commit: 01b9824a63e468b393265b159fa681f83f6e668c
---

# Contacts, Stakeholders & Relationships workspace r01 — design build plan

## 0. What this plan is

This is a build plan for the next standalone module HTML page in Powerplants One, the **Contacts, Stakeholders & Relationships workspace**, covering page-register entries **CS-02** and **CS-03** in one package.

It follows the delivery shape of the recent packages — AD-01 Users, Roles & Access Review r01; DK-06 Document & Form Template Management r01; DK-03 Output, Issue & Distribution r01; CS-01 Customer 360 r01 — and the package discipline of [PPO-UI-CONFORMANCE](https://github.com/deanrfiedler-gif/powerplants-one/blob/01b9824a63e468b393265b159fa681f83f6e668c/docs/standards/html-module-conformance.md).

Every field, state, rule and command named below is marked as one of:

- **Contract** — exists in a merged migration or in `src/shared/*` / `src/platform/*` and is enforced by the running application.
- **Seed** — exists only as synthetic seed or fixture data. Real in the prototype, not a product rule.
- **Proposed** — a design extension this page would introduce. Requires Dean's decision; never rendered as adopted.

Base for every source claim: `main` at `01b9824a63e468b393265b159fa681f83f6e668c` (18 September 2026, merge of #234). Read in session: migrations `0002-shared-foundation.sql`, `0003-customer-intake.sql`, `0010-crm-opportunities.sql`, `0017-crm-ui-refinements.sql`; `src/shared/commands.ts`; `src/shared/reads.ts`; `src/app/api/v1/people/route.ts`; `src/app/(business)/people/[id]/page.tsx`; `docs/standards/ui-style-specification.md` r08; `docs/standards/html-module-conformance.md` r01; `docs/decisions/ADR-0014-p09-service-reports.md`; `docs/decisions/crm-desktop-mobile-refinements.md`; and the diff of open PR #239.

---

## 1. Purpose and position

### 1.1 The problem this module solves

People are the only shared record in Powerplants One that eight issued designs depend on and none of them owns.

The dependency is not decorative. It is load-bearing in at least five places already merged or issued:

| Dependency | Where it binds | Consequence |
|---|---|---|
| `sites.primary_contact_id` | ADR-0014 (P09 service reports), Contract | "The currently permitted active site primary contact is shown by name and explicitly selected before approval… **If that contact is unavailable, approval is blocked** and return remains available." A contact problem stops a service report. |
| Prepared release recipient | SV-06/SV-07 r01 | "Changed prepared source/template/**recipient** blocks release and retains the attempt." Editing a contact invalidates a prepared customer report. |
| Recipient assignments | ADR-0011 (P06 job packs), Contract | Final issue requires "a complete set of individually identified recipient assignments"; retry rechecks assignments and recipients before issuing. |
| Per-recipient distribution evidence | DK-03 r01 | Prepared, sent, delivered, opened and acknowledged are separate facts held per recipient. |
| `opportunities.primary_person_id` + `contact_unknown_reason` | Migration 0010/0017, Contract | The deal record carries either a contact or a recorded reason there is none. Deals r38 cards and List columns display it. |

Each of those designs currently carries its own synthetic people. Nothing reconciles them, nothing states what a contact record may and may not assert, and nothing shows a coordinator what breaks when a contact changes. Retrofitting a contact model behind eight consumers is materially harder than defining it once now, which is the argument for doing this next rather than later.

There is a second problem, specific to this record type, that the current implementation makes visible:

- **There are two people-reading paths with different capabilities.** `src/crm/directory.ts` serves the CRM Organisations and People directory: name/email/phone/status/deals sorting, `Active`/`Inactive` status filter, an exact `total`, offset paging at 25/50/100, search across name, email, phone and the affiliation JSON, current affiliations with role labels, and saved views. The generic `/api/v1/people` path (`listShared`) is far narrower: it **rejects** `company_id` and `site_id` filters with *"Person scope is derived from authorised affiliations and primary contacts."*, searches `display_name` only, and orders by `ORDER BY r.id` — UUID order. Both are Contract. A module built on the wrong one silently loses sorting and counting.
- **The directory filters on a state nothing can reach.** `directory.ts` renders `CASE WHEN r.active THEN 'Active' ELSE 'Inactive' END` and offers an `Inactive` filter — over a flag no command can set. Contract.
- **An empty contact list is ambiguous.** `customerContext` returns `contacts: []` when the reader lacks company-level `shared.read`, and the same `[]` when the organisation genuinely has no contacts. Contract. The caller cannot distinguish restricted from empty.
- **People have no readable reference.** `register_identity('Person','')` allocates no `display_number`. Contract. Unlike ORG, SITE, AST and TKT, a contact has no `SYN-PPO-` reference to quote.
- **There is no command to change a person.** `src/shared/commands.ts` exports `createPerson` and `addAffiliation` and nothing else for this record type: no update, no deactivate, no end-affiliation, no merge. Contract, verified by reading the whole file.
- **`active` is enforced on read but cannot be written.** `people.active` is set `true` by `createPerson` and no command ever writes it again — yet three runtime paths enforce it: `src/finance/context.ts` selects the site primary contact with `AND u.active`; `src/scheduling/planner.ts` refuses a contact command when `!person.active` or when the recipient is no longer the site primary contact; `src/reports/service.ts` gates the recipient step on `site.primary_contact_id`. Contract.

Those last two points are the sharpest, and they interact with the first table. ADR-0014 blocks report approval when the site primary contact is unavailable, Finance and the planner both refuse an inactive contact — and no command can mark a contact inactive, or correct a misspelt name, or end an affiliation. The workspace must render that honestly rather than drawing an edit button over a command that does not exist.

### 1.2 Requirement traceability

Register parents for the CS family, unchanged: **CRM-01, CRM-04, CRM-06, SVC-06**. This package introduces no new requirement identity and does not disturb the 78 parent requirement IDs.

Register checks carried verbatim into the verification plan (§10):

1. A user can identify the exact addressed site and named on-site location.
2. Changing a name or relationship retains stable identity and historical references.
3. Review the stated page outcome with a normal case, a missing-source case and an interrupted/returned case.

### 1.3 Register evidence and dependency position

| Item | Value |
|---|---|
| CS-02 | Contact directory and contact detail · state **D** (dedicated refinement) · P1 · placement **Pages** · depends: none |
| CS-03 | Stakeholder and relationship view · state **N** (new design candidate) · P1 · placement **Tab** · depends: none |
| Entities | Organisation, Site, Facility, Person |
| Authority | Canonical shared records and site owners |
| Devices | Desktop + field/phone |
| Horticulture | true — site contacts, grower/agronomist roles and on-site authority are in scope |
| Register evidence note | "Shared customer/contact/site routes and forms exist… This family needs coordinated refinement and broader coverage; it is not an untouched module." |

Both items have an empty `depends` list and every neighbouring CS item is already designed (CS-01, CS-04, CS-05, CS-06, CS-08). Nothing blocks this module and nothing else in the CS family waits on it.

**CS-02 is state D, not N.** A contact directory and detail already run at `/people` and `/people/[id]` (`ContextDetail kind="Person"`), served by `/api/v1/people` and `/api/v1/people/[id]`. This is a refinement of a live surface, not a new module. The design must extend what is there and say plainly where it departs.

---

## 2. Governing sources

| Source | Edition / pin | Use |
|---|---|---|
| Shared foundation migration | `db/migrations/0002-shared-foundation.sql` | `people`, `person_company_contexts`, `relationships`, `site_parties`, `sites.primary_contact_id`, identity registration |
| Customer intake migration | `db/migrations/0003-customer-intake.sql` | `activities`, `activity_links`, `tickets.requester_id` / `requester_description` |
| CRM migrations | `0010`, `0017`, `0018` | `opportunities.primary_person_id`, `contact_unknown_reason`, `crm_record_snapshot`, `crm_directory_preferences` |
| Projects migration | `0019-projects-gantt.sql` | `project_tasks.external_owner_id` |
| Shared commands | `src/shared/commands.ts` | `createPerson`, `addAffiliation`, `addSiteParty`, `createSite`, version and scope rules |
| Shared reads | `src/shared/reads.ts` | `visibility("Person")`, Person projection, `listShared` filter refusals, `customerContext`, `siteContext` |
| CRM directory | `src/crm/directory.ts` | Directory columns, permitted sorts, status filter, search concatenation, current-affiliation predicate, deal counts, offset paging, saved views |
| Person context | `src/shared/context.ts` | Affiliation read for one person, ordered by `valid_from` then id |
| Data dictionary | `docs/contracts/service-data-dictionary.md` | "No automatic marketing consent inferred"; "Historical role retained"; "neither is a unique person identity"; "no name-based automatic merge" |
| API contract | `docs/contracts/service-api.md` | POST `/people`: "Initial active=true; no inferred consent or identity deduplication" |
| P09 decision | `docs/decisions/ADR-0014-p09-service-reports.md` | Site primary-contact selection and the approval block |
| CRM refinements decision | `docs/decisions/crm-desktop-mobile-refinements.md` | Accepted Organisations and People directory behaviour; personal view preferences |
| Style specification | `docs/standards/ui-style-specification.md` r08, §5.1, §5.2, §7.1, §7.4 | Bounded scroll, layering, baseline elements, shared token core |
| Conformance | `docs/standards/html-module-conformance.md` r01 | Required declaration table |
| Theme edition | See §12 decision 1 | r20 (current standalone convention) or r22 (introduced by PR #239) |

### 2.1 Conformance declaration (to be reproduced in the report)

| Field | Content |
|---|---|
| Scope identity | CS-02 (D, Pages) and CS-03 (N, Tab), page coverage register r06; parents CRM-01, CRM-04, CRM-06, SVC-06; increment = coordinated contact directory, contact record, stakeholder map, downstream reliance, proposed corrections and visibility explanation |
| Page type | **Register / worklist with persistent inspection** as the primary type; **Record detail** for the contact record; **Review / comparison** supporting the stakeholder and reliance views |
| Reused components | Location context, icon set and choice-menu code from Service Cases r02 / Work Orders r01; register and card patterns from AD-01 r01; inspection panel per the conformance reuse rules; theme edition per §12 decision 1 |
| Source authority | Contract items cite migration or `src/shared` file and the pinned commit; Seed items cite the fixture; Proposed items are labelled in the page itself |
| Incoming handover | Canonical shared records: Organisation, Site, Facility, Person, Relationship, SiteParty. Read under `shared.read` with the derived Person visibility rule |
| Outgoing handover | A named, permitted, currently valid contact for CS-01, CR-01, SV-02/SV-06, FI-07, DK-03 and MA-06/07 to bind — plus, where none exists, an explicit recorded reason. **This module issues nothing, sends nothing and acknowledges nothing** |
| Exceptions and recovery | Restricted-versus-empty, unknown-versus-none, ended affiliation, ambiguous duplicate, contact relied upon downstream, no command available, interrupted proposal, stale local copy |
| Departures | Any departure from the chosen theme edition, and the proposed corrections workflow, named in the report and the decision record |
| Verification | §10 |

---

## 3. Scope boundary

### 3.1 In scope for r01

- A contact directory over the permitted population, with the real derived-visibility rule rendered rather than hidden.
- A contact record: identity, channels, company contexts, affiliations with validity, and version.
- A stakeholder map per organisation: recorded roles, coverage, gaps.
- A reliance view: every place a contact is depended on downstream, and what breaks if they become unavailable.
- Proposed corrections and duplicate resolution, as **proposals with reasons**, simulated, never applied.
- A visibility explanation: why this reader can see this person, traced to the contract rule.
- Six connected views over one record collection, four preview roles, the eight required UI states, and local storage with validated backup, restore, stale-write refusal and reset.

### 3.2 Out of scope for r01

- Any application, API, migration, seed, permission or deployment change.
- Real customer communication of any kind. No send, no distribution, no acknowledgement.
- Marketing consent, subscription management or communication opt-out as adopted policy.
- Contact-level ERP identity. `erp_account_mappings.entity_type` is constrained to `'Customer'` and binds an **organisation**, not a person (Contract). No person-level ERP key is invented.
- Portal accounts and external sign-in (CP1–CP5 remain their own family).
- Any assertion that a contact holds purchasing authority. See §12 decision 4.
- Bulk import, address-book sync, vCard, or copied Pipedrive contacts — explicitly excluded by the accepted CRM refinements decision.

### 3.3 Proposed extensions (labelled in the HTML; decided by Dean in §12)

1. Primary and secondary designation per organisation and per site.
2. Structured communication preference, replacing the free-text `people.contact_preference`.
3. A responsibility taxonomy layered over the free-text `role_label`.
4. Influence and relationship-health indicators for CS-03.
5. A person-to-activity link (`activity_links.object_type` has no `'Person'` value today).
6. Contact correction, deactivation, affiliation-end and duplicate-merge commands.
7. A recorded reason vocabulary for "no contact available".

None of these is rendered as adopted. Each carries a visible **Proposed** marker and appears in the decision record with what adopting it would cost.

---

## 4. Information model the page must present

### 4.1 Person — Contract

`ppo.people` (0002): `id`, `workspace_id`, `version`, `synthetic` (always true), `created_at/by`, `updated_at/by`, `display_name` (1–200), `email` (nullable, regex-checked in both the column constraint and `createPerson`), `phone` (nullable), `active` (default `true`), `contact_preference` (nullable free text).

Registered in `business_identities` as `object_type='Person'` with **no `display_number`**. Delete is refused by `immutable_evidence`.

Projected by `src/shared/reads.ts` as exactly: `id`, `version`, `synthetic`, `updated_at`, `display_name`, `email`, `phone`, `active`, `contact_preference`.

Two consequences the design must honour:

- The Person projection carries **no `can_edit`**, unlike Organisation, Site and Asset. The server tells the client nothing about whether this reader may change this person.
- The Person projection carries **no `company_id`**. A contact is not owned by one company context.

### 4.2 Company context — Contract

`ppo.person_company_contexts(workspace_id, company_id, person_id)`. `createPerson` requires **1–10 explicit company contexts**, deduplicated and sorted, and checks `shared.create` and `shared.read` in every one of them before inserting.

### 4.3 Affiliation — Contract

`ppo.relationships`: `organisation_id`, `person_id`, `role_label` (free text, 1–200), `valid_from` (date, required), `valid_to` (date, nullable, must be after `valid_from`).

A GiST `EXCLUDE` constraint prevents overlapping periods for the same `(organisation, person, role_label)`. The same person may hold two different role labels at one organisation simultaneously; they may not hold the same label twice over an overlapping period.

`addAffiliation` requires `shared.edit` on the organisation's company, requires the person to hold a context row in that company, takes `expected_version` **of the organisation**, and **bumps the organisation's version** on success. The affiliation is therefore concurrency-owned by the organisation record, not by the person. The design must show this, because two coordinators adding affiliations to one organisation will collide.

### 4.4 Site relationships — Contract

- `sites.primary_contact_id` → `person_company_contexts`. One optional primary contact per site. Set at `createSite`; no command updates it afterwards.
- `ppo.site_parties`: organisation-level roles `Operator`, `BillingParty`, `Owner`, with validity periods and an exclusion constraint allowing **one current Operator per site**. `siteContext` computes `is_current` server-side.

Sites carry organisations as parties and one person as primary contact. There is no other person-to-site relationship in the contract.

### 4.5 Derived visibility — Contract, rendered exactly

From `visibility("Person")`:

> A person is visible when the reader holds `shared.read` on **a company in which that person has a context row**, **or** on **a site (company + site scope) where that person is the `primary_contact_id`**.

The second clause is the interesting one: a site-scoped reader — a technician, a site coordinator — sees that site's primary contact without any company-level grant, and sees no other contact of that organisation. The workspace must render this as an explanation, in the AD-01 manner: a step-by-step trace of why this reader can see this person, or why they cannot.

**There is already a correct precedent in the codebase to follow.** `src/projects/service.ts` applies `visibility("Person")` to `project_tasks.external_owner_id` and returns `'Unavailable owner'` with an explicit `owner_unavailable` flag when the reader cannot see that person — rather than returning null and letting the screen read as "no owner". Contract. The contacts workspace adopts that same treatment everywhere, and the report cites it as the existing pattern rather than presenting it as a new idea.

### 4.6 Directory behaviour — Contract, two paths

**CRM directory (`src/crm/directory.ts`) — the surface CS-02 refines.**

- Kinds `organisations` and `people`. People columns: name, organisations, email, phone, preference, status, deals.
- Sortable for people: name (`lower(display_name)`), status, email, phone, deals. **`organisations` and `preference` are displayable but not sortable** — `parseDirectory` refuses them with *"Choose a sortable column."*
- Status filter for people: `''`, `Active`, `Inactive`, derived from `people.active`. The `mine` owner filter is refused for people: *"Owner filtering applies to organisations."*
- Search `q` (≤200 chars, no control characters) matches a concatenation of display name, reference, email, phone, sector, owner name and **the affiliation JSON** — so a search hits organisation names and role labels too.
- `organisations` is **current affiliations only**: `rel.valid_from <= CURRENT_DATE AND (rel.valid_to IS NULL OR rel.valid_to > CURRENT_DATE)`, company-scoped and organisation-visibility-filtered, ordered by organisation name then role label.
- `deals` counts opportunities where `primary_person_id` is this person, under `opportunityVisibility()`.
- Offset paging: `page` ≥ 1, `limit` restricted to exactly 25, 50 or 100. Returns an exact `total`, plus `observed_at` and `kind`.
- Saved views in `crm_directory_preferences`: up to 12 per user and kind, unique names ≤ 60 characters, columns must include `name`, optimistic `expected_version` with a 409 *"Your saved views changed. Reload them before saving again."*

**Generic shared read (`/api/v1/people` → `listShared`) — narrower, and not what the directory uses.**

- Refuses `company_id` and `site_id` filters; searches `display_name` only; `ORDER BY r.id`; page size 1–200, default 50; HMAC-signed cursor bound to a filter fingerprint; envelope reports `completeness: "Partial"` when a next cursor exists.

The design must state which path each view reads, because their capabilities differ and only one of them sorts.

### 4.7 Downstream reliance — Contract

Every current binding of a person, with its owning module:

| Binding | Column / decision | Owner |
|---|---|---|
| Site primary contact | `sites.primary_contact_id` | CS-04 / CS-05 |
| Report approval audience | ADR-0014: active site primary contact, explicitly selected, approval blocked if unavailable; recipient step gated in `src/reports/service.ts` | SV-06 |
| Finance handoff contact | `src/finance/context.ts` selects the primary contact `AND u.active` within the company context | FN family |
| Planner contact command | `src/scheduling/planner.ts` refuses when `!person.active` or the recipient is no longer the site primary contact | SV-04 |
| Deal primary contact | `opportunities.primary_person_id`, or `contact_unknown_reason` | CR-01 |
| Lead contact | `lead_candidates.primary_person_id` (0018) | CRM Leads |
| Ticket requester | `tickets.requester_id`, or `requester_description` free text | SV-01 / SV-02 |
| Project external owner | `project_tasks.external_owner_id` (0019) | PJ family |
| Appointment contacts | `/api/v1/appointments/[id]/contacts` | SV-04 |
| Contact outcome | `ppo.contact_outcomes` (0005) | SV-04 |
| Pack recipient assignment | ADR-0011 | SV-05 |

The reliance view reads these; it does not own or change any of them.

### 4.8 Activity linkage — Contract limit

`activity_links.object_type` is constrained to `('Organisation','Site','Asset','Ticket')`. **There is no `'Person'` value.** Interaction history against a contact cannot be linked today; it can only be derived through the organisation, site, asset or ticket the activity is linked to, and through `activities.kind = 'CustomerContact'` or `'RelationshipReview'`.

The register asks CS-02 for "relevant interaction history". The design must therefore render derived history, labelled as derived, with its derivation stated — not a link that does not exist. Adding `'Person'` to that constraint is Proposed extension 5.

### 4.9 Proposed model (labelled, not adopted)

`ContactDesignation` (Primary/Secondary/None, per organisation and per site), `ResponsibilityClass` over `role_label`, `CommunicationPreference` (structured, with an explicit *not stated* value), `AuthorityBasis` (**Recorded** / **Asserted by us** / **Unknown** — never "has authority"), `RelationshipHealth`, `ContactChangeProposal` (reason, proposer, reviewer, simulated apply), `DuplicateProposal` (candidate set, evidence, proposed survivor, no merge executed).

---

## 5. Actors and preview roles

Four preview roles, selectable in the page, each producing a genuinely different result set — not a cosmetic label:

| Role | Grants (Seed) | What they must see |
|---|---|---|
| Sales coordinator | `shared.read`, `shared.edit`, `shared.create` at Company | Full directory for that company; affiliations; may raise proposals |
| Service coordinator | `shared.read` at Company, `shared.internal.read` | Directory; reliance view; cannot raise organisation-level proposals |
| Site technician | `shared.read` at **Site** only | **Only** the site's primary contact, via §4.5 clause two. Organisation contacts render as *Restricted*, not as empty |
| Finance reviewer | `shared.read`, `shared.finance.read` at Company | Billing-party context; no additional person fields, because the Person projection has none |

The site technician role is the one that proves the visibility rule. If the technician view shows an empty contacts list rather than a restricted one, the build has failed the most important honesty check in this package.

---

## 6. Views — six connected views, one record collection

### 6.1 Directory
Register with attention queues: *Relied upon but no longer affiliated*; *Site primary contact inactive*; *No contact recorded*; *Possible duplicate*; *Affiliation ended, successor unknown*; *Restricted from you*. Built on the CRM directory contract of §4.6: its real sorts, its `Active`/`Inactive` status filter, its exact `total`, its 25/50/100 page sizes and its saved views. Compound filters, attention-first ordering, phone cards behind a collapsed filter toggle. Columns that are displayable but **not** sortable (`organisations`, `preference`) are rendered without a sort affordance rather than with one that would fail. Counts state completeness; an unknown count renders as *unavailable*, never as zero.

### 6.2 Contact record
Fixed context header. Identity, channels, `active`, `contact_preference`, `version`, `updated_at`. Company contexts as chips. Affiliations with validity periods, current/ended/future, and the organisation-version concurrency note. No edit affordance for anything that has no command — instead, *Propose a correction* (§6.5) with the reason the direct action is unavailable.

### 6.3 Stakeholders and relationships (CS-03)
Per organisation: every affiliated person by recorded `role_label`, current and ended; site primary contacts; operator, owner and billing-party organisations from `site_parties`. Coverage gaps: a site with no primary contact; an organisation with no current affiliation; a role held by nobody. **Authority basis is rendered in three values — Recorded, Asserted by us, Unknown — and never as a claim that a person can commit the customer.** The register's own words govern this view: *"distinguish a recorded role from assumed purchasing authority."*

### 6.4 Reliance and obligations
Every downstream binding from §4.7 for the selected contact, with the consequence of unavailability stated per binding and quoted from its owning decision. The worked case: an inactive site primary contact, and the SV-06 report approval that ADR-0014 blocks as a result — shown as a blocked approval in the reliance view, owned by SV-06, not resolvable here.

### 6.5 Proposals and duplicates
Correction proposals (name, email, phone, preference, affiliation end, deactivation) with reason, proposer, independent reviewer, and a **Simulated apply** label on every apply control. Duplicate resolution proposes a survivor with evidence and executes no merge. Interrupted proposal and original-operation recovery are demonstrated. Retained proposal revisions; a changed proposal is a successor and inherits no review.

### 6.6 History and explanation
Version and audit history for the selected person and their affiliations. The visibility explanation of §4.5, traced step by step for the selected preview role. What is derived versus recorded, stated per row.

---

## 7. Interactive features — cross-cutting

Eight reachable UI states (loading, empty, read failed, partial read, denied, saving, saved, conflict) per §7.1 element 3, with a control that cycles them. **Restricted and empty are visually and textually distinct everywhere**, which is this module's signature requirement. Fixed clock. Local storage key `ppo-contacts-r01` with schema validation, backup, restore, reset, stale-write refusal and competing-tab refusal. Scripted assistant bound to the rendered record only, refusing to answer from a stale copy. Synthetic and environment context in the footer.

---

## 8. Fixture data

Four organisations reusing the **existing synthetic population** rather than inventing a new one — Northbank and Willowbank Hort both already appear in issued designs; the exact set must be reconciled with the seed and with CS-01 r01 at Phase 0 and recorded.

Required scenarios:

1. **Normal** — organisation with two current affiliations, a designated site primary contact, and one ended affiliation with a recorded successor.
2. **Blocked** — site primary contact `active = false`; the SV-06 approval consequence rendered and owned elsewhere.
3. **Restricted** — organisation with four contacts that the site-technician role sees as one, with the other three rendered *Restricted*, never *None*.
4. **Ambiguous** — two people with the same `display_name` in different company contexts, plus one genuine duplicate pair within one context; neither merged.
5. **Unknown** — a deal with `contact_unknown_reason` and a ticket with `requester_description` and no `requester_id`; *no contact recorded* distinguished from *contact not permitted to you*.
6. **Partial** — a page of results with `completeness: "Partial"` and an invalidated cursor after a filter change.

People carry **no `SYN-PPO-` reference**, because the contract allocates none. Contacts are identified in fixtures by name plus affiliation plus the organisation's `SYN-PPO-ORG-` reference, and the page states that a UUID is not a user-facing reference. This satisfies §7.1 element 4 without inventing a reference type.

---

## 9. Presentation standard

Per `ui-style-specification.md` §7.1, all seven elements: single `#ppo-contacts` scope container with the local reset; tokens declared on the scope container, reusing the 41 shared names of §7.4 before inventing any; all eight states rendered; fixture data using real references as qualified in §8; viewports 1440×960, 1024×768, 820×800 and 390×844 with no horizontal overflow; a change record; and no shell duplication.

§5.1 bounded scroll: the module fills its supplied slot, never allocates another `100vh`, and gives every flex ancestor `min-height: 0`. §5.2 layering: module content stays in band 0–29; native `<dialog>` with `showModal()` for short decisions.

The three known token divergences (`--surface-hover`, `--line-soft`, `--success-tint`) are not resolved by this package; it adopts one side and records which.

**PR #239 interaction.** #239 introduces theme **r22** (SHA-256 `a305361c…`), takes `ui-baselines.json` to r02 with a new `module_integrations` array, and adds an *Application integration gate* to the conformance standard. That gate governs moving a module **into the application**; this package is a standalone design and does not trigger it. The theme edition does affect the reused-components declaration — see §12 decision 1. I have confirmed r22's existence, hash and register entry from the #239 diff; **I have not inspected its contents.**

---

## 10. Verification plan

| Check | Tool | Pass condition |
|---|---|---|
| Model checks | `scripts/check-contacts-model.mjs --write-evidence` | All named groups pass; evidence JSON bound to the HTML SHA-256 and the fixture manifest hash |
| Contract fidelity | Assertions in the model check | Person projection equals exactly the seven fields in `reads.ts`; `listShared` filter refusals reproduced; UUID ordering reproduced; affiliation overlap refused exactly as the GiST constraint does; `createPerson` company-context rule (1–10, deduped, all checked) reproduced |
| Visibility rule | Model check | Generated table of person × role × company/site cases matches §4.5 for both clauses, including the site-primary-contact-only case and the cross-company case |
| Restricted versus empty | Model check | Every list, count and panel distinguishes restricted, none and unknown, following the `owner_unavailable` precedent in `src/projects/service.ts`. **Zero occurrences of an empty state standing in for a denied one** |
| Command honesty | Model check | No control implies a command that does not exist; every apply carries *Simulated*; no proposal is rendered as applied; `active` is never shown as editable |
| Authority honesty | Model check | No rendered string asserts purchasing authority; `AuthorityBasis` is one of the three permitted values on every stakeholder row |
| Concurrency | Model check | Affiliation actions state the organisation version; a stale version produces the conflict state, not a silent overwrite |
| Register checks | Model check | The three §1.2 checks, each demonstrated with a normal, a missing-source and an interrupted/returned case |
| Eight UI states | Model check | Each reachable and distinct |
| Composition | Model check | Module only; six accessible views; single scope container; token names match source; font hash matches |
| Native rendering | `scripts/check-contacts-browser.mjs` | ≥ 25 groups; zero page or console errors; four declared viewports; 0 px page overflow; 44 px phone targets; keyboard-only completion of a proposal and a duplicate review; dialog focus return |
| Documentation | `check_foundation.py`, `check_prototype.py`, `check_naming.py` | Pass; 78 parents intact; instructions ≤ 8,000 characters |
| Conflict markers | `git --no-pager grep -n -E "^(<<<<<<<\|=======$\|>>>>>>>)" -- docs` | None |
| Whitespace | `git diff --check` | Clean |
| Determinism | Rebuild from a fresh clone | Committed HTML reproduced byte for byte |
| Changed-text confirmation | Read back each edited shared file | The new row text is present in that file — not the revision number, not a downstream artefact, not a count |
| Native visual review | Dean, in a browser | **Not claimable from this environment.** Desktop geometry, top-layer dialogs, physical 320/390 devices, zoom and print remain for Dean |

Target: **at least 45 model groups and 25 native groups.** A floor, not acceptance.

If the pinned Chrome channel is unavailable, record the substitute browser and version and state that it is not evidence for the pinned runtime.

---

## 11. Deliverables and naming

| Deliverable | Path |
|---|---|
| Design HTML | `docs/reference/ui/customers/PPO-Contacts-Stakeholders-and-Relationships-r01.html` |
| Detailed companion report | `docs/reference/ui/customers/PPO-Contacts-Stakeholders-and-Relationships-Report-r01.md` |
| Change record | `docs/reference/ui/customers/PPO-Contacts-Stakeholders-and-Relationships-r01-change-record.md` |
| This plan | `docs/delivery/contacts-stakeholders-build-plan.md` (`PPO-CS02-R01-PLAN`) |
| Maintainable sources | `docs/design/contacts/`: `template.html`, `fonts.css`, `workspace.css`, `model.js`, `workspace.js`, `fixtures.json`, `README.md` |
| Deterministic builder | `scripts/build-contacts-design.py` |
| Model check | `scripts/check-contacts-model.mjs` |
| Native browser check | `scripts/check-contacts-browser.mjs` |
| Focused workflow | `.github/workflows/contacts-design.yml` |
| Decision and receiving handover | `docs/decisions/contacts-stakeholders-design.md` (`PPO-CS02-DES`) |
| Verification evidence | `docs/testing/evidence/contacts-r01/README.md` (`PPO-CS02-VERIFY`) |
| Index row | `docs/reference/ui/README.md` — shared platform pages |
| Register rows | `docs/standards/document-register.csv` — plan, design, HTML, report, change record, verification |
| Status | `docs/STATUS.md` — one dated line plus the Customer locations row (replace, don't append narrative) |
| Branch / PR | `design/contacts-stakeholders-r01` → PR *Design CS-02/CS-03 Contacts, Stakeholders & Relationships r01* |

Register IDs follow the CS-01 pattern (`PPO-CS01-HTML`, `-REPORT`, `-DES`, `-SOURCES`, `-EVIDENCE`) under the `PPO-CS02-` stem, with CS-03 named inside the package rather than given its own stem. §12 decision 2 settles this.

**Push-route note.** The GitHub connector cannot write `.github/workflows/*`; a 403 was observed in an earlier session. Decide the route for the workflow file in Phase 0 — a Claude Code session with workflow scope, or a numbered GitHub Desktop procedure — not at the end.

---

## 12. Decisions required before build

| # | Decision | Recommendation | Consequence of the alternative |
|---|---|---|---|
| 1 | Theme edition | **Closed — no conflict exists.** r22 was inspected on 18 September 2026 (SHA-256 `a305361c…`, matching the register). It is **strictly additive** over r20: zero tokens removed, zero token values changed, 24 added, all component-local aliases over existing brand tokens (`--nca-*` for the Next customer action card, `--ss22-*` for the r22 selection family). Build on the shared core, identical in both, and adopt the r22 selection and menu patterns for the selected directory row and the filter/sort menus | None. The earlier risk — that r22 forked a token value a new module would inherit — was measured and does not exist. The estimate is unchanged |
| 2 | One package or two | **One package covering CS-02 and CS-03**, register stem `PPO-CS02-` | CS-03 is a Tab in the register, on the same records. Two packages duplicate fixtures and split the stakeholder map from the contact record |
| 3 | Correction commands | **Simulate in the HTML**; record a receiving contract for a future runtime increment | Drawing a working edit button over commands that do not exist misstates delivery. Omitting the workflow leaves the *"no way to fix a wrong contact"* problem unanswered |
| 4 | Purchasing authority | **Three values: Recorded, Asserted by us, Unknown. Never a claim of authority** | A "decision maker" flag reads as adopted commercial policy nobody decided, and the register explicitly warns against it |
| 5 | Directory ordering | **Closed — use the CRM directory's real sorts** (name, status, email, phone, deals), and render `organisations` and `preference` without a sort affordance because `parseDirectory` refuses those | An earlier draft of this plan proposed showing UUID order as "current behaviour". That was wrong: it described the generic `listShared` path, not the directory the module refines |
| 6 | Interaction history | **Derived only, labelled, with the derivation stated.** Propose `'Person'` in `activity_links` separately | Rendering a person-linked activity list asserts a constraint value that is not in the contract |
| 7 | Person reference | **No new reference type.** Identify contacts by name, affiliation and the organisation's `SYN-PPO-ORG-` reference | A new `CON` code widens PPO-STD-001, needs a naming-check registration, and gives people a reference the contract does not allocate |
| 8 | Start condition | **Branch after #239 merges**, or from `01b9824a` if #239 stalls more than two days. State at 18 September 2026: head `1f984d21`, 7 commits, 63 files, `mergeable_state: blocked`, not merged | #239 touches the conformance standard, `ui-baselines.json` and the theme index. Branching under it invites a rebase over shared files for no design gain. It does **not** block on the theme question, which decision 1 closed |
| 9 | Build method | **Deterministic Python builder from maintained sources**, as CS-01 and AD-01 use | A hand-assembled 280 KB file cannot be rebuilt byte for byte, and the determinism check loses meaning |

---

## 13. Build sequence

Each phase has an exit criterion. No phase is reported complete on the basis of having been attempted.

| Phase | Work | Exit criterion |
|---|---|---|
| **0. Preflight** | Re-read `main` head and open PRs; confirm #239 state; create the branch; confirm the workflow push route; pin source SHAs (0002, 0003, 0010, 0017, 0018, 0019, `commands.ts`, `reads.ts`, theme edition); reconcile the fixture population with the seed and CS-01 r01 | Branch exists at the recorded base; pins and the fixture population written into the decision-record draft |
| **1. Contract extraction** | Encode the Person projection, `visibility("Person")`, the `listShared` refusals, UUID ordering, cursor fingerprinting, the affiliation exclusion constraint and the `createPerson` context rule in `model.js`; generate the visibility test table | Contract-fidelity and visibility groups pass |
| **2. Proposed model** | Designation, responsibility class, communication preference, authority basis, proposals, duplicates, guards (reason required, independent reviewer, version, idempotency) | Command-honesty and authority-honesty groups pass |
| **3. Fixtures** | Build `fixtures.json` per §8; compute the manifest hash; validate every affiliation against the contract constraints | Fixture validation passes; all six scenarios reachable from the model |
| **4. Shell and layout** | Template, fonts, scoped CSS, view tabs, context strip, inspection panel, phone stacking | Composition groups pass; builder deterministic |
| **5. Views 6.1–6.3** | Directory, Contact record, Stakeholders | View-level groups pass; restricted-versus-empty asserted in each |
| **6. Views 6.4–6.6** | Reliance, Proposals and duplicates, History and explanation; dialogs; interrupted and recovery cases | Scenario groups pass end to end |
| **7. Cross-cutting** | Eight states, storage and fallback, backup/restore validation, fixed clock, assistant, synthetic labelling | All cross-cutting groups pass |
| **8. Native verification** | Browser check at the four viewports; overflow, targets, focus, console; capture screenshots to the evidence folder | ≥ 25 native groups pass with zero errors; captures reviewed and listed as reviewed-by-agent, not accepted |
| **9. Documentation** | Report, change record, decision record and receiving contract, evidence README, index row, register rows, STATUS row, entry links | Three check scripts pass; marker scan clean; **each edited shared file read back and the new text confirmed present** |
| **10. Publication** | Commit; push; open draft PR; merge `main` if it moved; re-run checks | Required checks green on the PR head, recorded by run ID; PR marked ready only then |
| **11. Handover** | Durable handover written to the project; open decisions restated | Handover records actual hashes, run IDs, what was verified and what was not |

---

## 14. Receiving contract for a future runtime increment (recorded, not built)

If Dean later authorises a runtime increment, it needs, at minimum:

- `business_identities.object_type` and `audit_events.object_type` to accept a contact-change proposal type, if proposals become durable.
- Commands: `revisePersonIdentity` (with `expected_version` and before/after audit details, mirroring `renameOrganisation`), `setPersonActive`, `endAffiliation` (writing `valid_to`, respecting the exclusion constraint), `setSitePrimaryContact`, `setContactDesignation`.
- A decision on whether `relationships` gains a designation column or a separate designation table.
- `activity_links.object_type` extended with `'Person'`, if interaction history becomes linked rather than derived.
- A capability decision: whether contact maintenance sits under existing `shared.edit` or gains its own capability. Adding a capability means touching `ck_grants_capability` and interacts with D-020 and AD-01.
- A `can_edit` flag on the Person projection, which it currently lacks.
- Whether a merge command may ever exist, given `immutable_evidence` refuses deletion of `people` and `relationships` rows.

None of this is proposed for adoption here. It is recorded so the design is not mistaken for a delivery plan.

---

## 15. Risks and failure modes

| Risk | Treatment |
|---|---|
| The page implies a contact can be edited | Every unavailable action states why, and proposals are labelled Simulated. Asserted by the command-honesty check |
| Restricted renders as empty | The single most likely honesty failure, because the running API returns `[]` for both. A dedicated check, asserted in every list, count and panel |
| The stakeholder view reads as adopted commercial policy | Three-value authority basis; no decision-maker flag; the report states the register's own warning |
| Fixture population diverges from CS-01 and the seed | Reconciled in Phase 0 and recorded, not assumed |
| #239 lands mid-build and changes the theme index | Decision 8 branches after it; if it stalls, the base is recorded and the theme edition declared |
| Affiliation concurrency is misrepresented | The organisation-version rule is asserted in the model check, not just described |
| The package silently widens to CS-07 | Account development and visit plan is a separate P1 register item and stays out |
| A green check is read as acceptance | Report and STATUS separate design delivery, verification, owner acceptance and application integration, as every prior package does |

---

## 16. Open questions

Five of the six are now answered from the repository. One needs Dean.

| # | Question | Resolution |
|---|---|---|
| 1 | Theme edition | **Closed.** r22 inspected and measured: strictly additive over r20. §12 decision 1 |
| 2 | Communication preference | **Closed by contract.** The data dictionary states *"No automatic marketing consent inferred"* and the API contract *"no inferred consent"*. r01 renders `contact_preference` as the free text it is, with no consent semantics, and a structured preference stays Proposed. Dean's input is optional and only adds value if a real Powerplants practice exists to model |
| 3 | Role vocabulary | **Open — needs Dean.** The seed carries only synthetic placeholders (`SYN site contact`, `SYN supplier liaison`); no real vocabulary exists anywhere in the repository. If Dean has none to give, `role_label` stays free text with a Proposed taxonomy and the fixtures use plausible horticultural roles labelled as fictional |
| 4 | "No contact available" reason | **Closed by precedent.** `opportunities.contact_unknown_reason` and `tickets.requester_description` are both free text. r01 matches them; a reason vocabulary stays Proposed |
| 5 | Site primary contact count | **Closed by contract.** One optional `primary_contact_id` per site, and ADR-0014 depends on exactly one being selected before approval. r01 holds the limit and records it rather than proposing a second contact |
| 6 | Duplicates and merge | **Closed by contract.** The data dictionary says *"no name-based automatic merge"*, the API contract says *"no identity deduplication"*, and `immutable_evidence` refuses deletion of `people` and `relationships`. The answer is a superseded-by pointer with evidence, never a merge |

---

**Status of this plan.** Proposed, not authorised. No repository write has occurred and none will occur on the basis of this document. Nothing here establishes owner acceptance, application integration or production readiness.
