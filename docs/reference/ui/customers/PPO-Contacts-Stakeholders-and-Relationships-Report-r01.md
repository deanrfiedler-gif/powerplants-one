---
document_id: PPO-CS02-REPORT
title: Contacts, Stakeholders and Relationships design report
revision: r01
date: 2026-09-18
owner: Dean Fiedler
status: Proposed CS-02 / CS-03 design and detailed companion report; owner acceptance and application integration remain separate
source_commit: 01b9824a63e468b393265b159fa681f83f6e668c
---

# CS-02 / CS-03 — Contacts, Stakeholders & Relationships design report

**Design HTML:** [`PPO-Contacts-Stakeholders-and-Relationships-r01.html`](PPO-Contacts-Stakeholders-and-Relationships-r01.html) · SHA-256 `cd5f0be8e9000bcec683e44d806fd9e2a6147efc2cee4f72ca2554eea2287d40` · 253,388 bytes, one self-contained file with no external request.

**Built from:** [`docs/design/contacts/`](../../../design/contacts/README.md) by `scripts/build-contacts-design.py`, deterministically, on any platform.

**Base:** `main` at `01b9824a63e468b393265b159fa681f83f6e668c`. PR #239 had not merged when this branch was taken, so the fallback base permitted by build-plan decision 8 applies. #239 merged during the build and `origin/main` `be219114` was merged into this branch; see §9.

---

## 1. What this module is

Six connected views over one synthetic contact collection, covering page-register entries **CS-02** (contact directory and contact detail, state D, Pages) and **CS-03** (stakeholder and relationship view, state N, Tab) in one package.

It answers four questions the current implementation cannot:

1. **Who is the named contact, and what may their record actually assert?**
2. **Why can this reader see them — or why can they not?**
3. **What depends on them downstream, and what breaks if they become unavailable?**
4. **What can be done when the record is wrong and no command exists to fix it?**

The module reads. It issues nothing, sends nothing and acknowledges nothing.

### 1.1 Conformance declaration

| Field | Content |
|---|---|
| Scope identity | CS-02 (D, Pages) and CS-03 (N, Tab), page coverage register r06; parents CRM-01, CRM-04, CRM-06, SVC-06; increment = coordinated contact directory, contact record, stakeholder map, downstream reliance, proposed corrections and visibility explanation |
| Page type | Register / worklist with persistent inspection as the primary type; Record detail for the contact record; Review / comparison for the stakeholder and reliance views |
| Reused components | r20 shared token core reused by name from AD-01 r01; `fonts.css` byte-identical to `docs/design/my-work/fonts.css`; the Customer 360 line-icon set; theme r22’s complete `--ss22-*` selection family with the board’s own values, pinned by content at SHA-256 `a305361c…`. See §9 |
| Source authority | Contract items cite a migration or `src/shared` file and the pinned commit; Seed items cite the fixture; Proposed items are labelled in the page itself |
| Incoming handover | Canonical shared records: Organisation, Site, Facility, Person, Relationship, SiteParty, read under `shared.read` with the derived Person visibility rule |
| Outgoing handover | A named, permitted, currently valid contact for CS-01, CR-01, SV-02/SV-06, FI-07, DK-03 and MA-06/07 to bind — and, where none exists, an explicit recorded reason. **This module issues nothing, sends nothing and acknowledges nothing** |
| Exceptions and recovery | Restricted-versus-empty, unknown-versus-none, ended affiliation, ambiguous duplicate, contact relied upon downstream, no command available, interrupted proposal, stale local copy |
| Departures | Recorded in §9 and in the [decision record](../../../decisions/contacts-stakeholders-design.md) |
| Verification | §10 |

---

## 2. The problem, stated from the contract

People are the only shared record that several issued designs depend on and none of them owns. Five load-bearing dependencies already exist in merged code:

| Dependency | Contract location | Consequence |
|---|---|---|
| `sites.primary_contact_id` | `db/migrations/0002`, ADR-0014, `src/reports/service.ts` | "The currently permitted active site primary contact is shown by name and explicitly selected before approval… If that contact is unavailable, approval is blocked and return remains available." |
| Finance handoff audience | `src/finance/context.ts` | Selects the site primary contact `AND u.active` inside the company context; a changed audience blocks with `SourceAudienceChanged` |
| Planner contact command | `src/scheduling/planner.ts` | Refuses when `!person.active` or when the recipient is no longer the site primary contact |
| `opportunities.primary_person_id` | `db/migrations/0010` / `0017` | A trigger refuses the deal unless the person holds a **current** affiliation: `Contact affiliation required` |
| `project_tasks.external_owner_id` | `db/migrations/0019` | A trigger requires `pe.active` **and** a current affiliation: `Current external affiliation required` |

Four further facts, all verified by reading the sources at the pinned commit, shape every decision in this design:

- **There is no command to change a person.** `src/shared/commands.ts` exports `createPerson` and `addAffiliation` for this record type and nothing else — no update, no deactivate, no end-affiliation, no merge.
- **`people.active` is enforced on read but cannot be written.** It is set `true` by `createPerson` and never written again, yet Finance, the planner and the project-task trigger all enforce it.
- **An empty contact list is ambiguous.** `customerContext` returns `contacts: []` when the reader lacks company-level `shared.read`, and the same `[]` when the organisation genuinely has none.
- **People have no readable reference.** `register_identity('Person','')` allocates no `display_number`, and `reference_counters.record_type` admits only `ORG`, `SITE`, `AST` and `TKT`.

Those four facts interact. ADR-0014 blocks a report approval when the site primary contact is unavailable; Finance and the planner refuse an inactive contact; and no command can mark a contact inactive, correct a misspelt name, or end an affiliation. **This design renders that honestly rather than drawing an edit button over a command that does not exist.**

---

## 3. The information model, as rendered

### 3.1 Person — Contract

`ppo.people`: `id`, `workspace_id`, `version`, `synthetic` (always true), `created_at/by`, `updated_at/by`, `display_name` (1–200), `email` (nullable, regex-checked in both the column constraint and `createPerson`), `phone` (nullable), `active` (default `true`), `contact_preference` (nullable free text).

`src/shared/reads.ts` projects exactly nine fields: `id`, `version`, `synthetic`, `updated_at`, `display_name`, `email`, `phone`, `active`, `contact_preference`.

Two consequences the page renders explicitly:

- The Person projection carries **no `can_edit`**, unlike Organisation, Site and Asset. The server tells the client nothing about whether this reader may change this person.
- The Person projection carries **no `company_id`**. A contact is not owned by one company context.

> **Correction to the build plan.** Plan §10 describes the Person projection as "the seven fields in `reads.ts`". The plan's own §4.1 enumerates nine, and nine is what `reads.ts` returns: four from `base` plus five Person-specific. The check asserts nine, derived from the source rather than from either statement.

### 3.2 Affiliation — Contract

`ppo.relationships` holds `organisation_id`, `person_id`, `role_label` (free text, 1–200), `valid_from` (required) and `valid_to` (nullable, must be after `valid_from`). A GiST `EXCLUDE` constraint prevents overlapping periods for the same `(organisation, person, role_label)`. The same person may hold two different role labels at one organisation simultaneously; they may not hold the same label twice over an overlapping period.

**Affiliation concurrency belongs to the organisation, not the person.** `addAffiliation` requires `shared.edit` on the organisation's company, takes `expected_version` **of the organisation**, and **bumps the organisation's version** on success. The contact record states this against every affiliation, with the live organisation version, because two coordinators adding affiliations to one organisation will collide.

### 3.3 Derived visibility — Contract, rendered exactly

From `visibility("Person")`:

> A person is visible when the reader holds `shared.read` on **a company in which that person has a context row**, **or** on **a site (company + site scope) where that person is the `primary_contact_id`**.

The first clause calls `scopeSql(pc.company_id)`, whose site argument defaults to `NULL::uuid`. A **Site**-scoped grant requires `g.site_id = <site>` and therefore **can never satisfy clause 1**. A site-scoped reader passes only through clause 2, and sees exactly one contact per site they hold.

Because `sites.primary_contact_id` has a foreign key into `person_company_contexts`, every primary contact necessarily holds a context row in that site's company. Clause 2 therefore adds reach **only** for site-scoped readers. The History & explanation view traces both clauses step by step for the selected preview role, marks which passed and which failed, and quotes the SQL.

### 3.4 Interaction history — Contract limit

`activity_links.object_type` is constrained to `('Organisation','Site','Asset','Ticket')`. **There is no `'Person'` value.** Interaction history against a contact is therefore rendered as **derived**, with the derivation stated per row — "activity linked to the site where this person is the primary contact", "activity linked to a case whose `requester_id` is this person" — never as a person link that does not exist.

---

## 4. The six views

| View | What it does |
|---|---|
| **Directory** (CS-02) | The permitted population, built on the CRM directory contract in `src/crm/directory.ts`: its real sorts (name, status, email, phone, deals), its `Active`/`Inactive` status filter, its exact `total`, its 25/50/100 page sizes, its saved views, and its search across name, email, phone and the affiliation JSON. `organisations` and `preference` are displayed **without a sort affordance**, because `parseDirectory` refuses them with *"Choose a sortable column."* Six attention queues sit above the register. |
| **Contact record** (CS-02) | Identity, channels, `active`, `contact_preference`, `version`, `updated_at`, company contexts as chips, affiliations with validity and the organisation-version concurrency note. No edit affordance for anything that has no command — instead *Propose a correction*, with the reason the direct action is unavailable. |
| **Stakeholders** (CS-03) | Per organisation: every affiliated person by recorded `role_label`, current and ended; site primary contacts; operator, owner and billing-party organisations from `site_parties`; and coverage gaps. Authority basis is rendered in three values and never as a claim that a person can commit the customer. |
| **Reliance** (CS-03) | Every downstream binding for the selected contact, with the consequence of unavailability quoted from its owning decision, and the owning module named. The worked case is an inactive site primary contact and the SV-06 approval that ADR-0014 blocks as a result — shown as blocked, owned by SV-06, and **not resolvable here**. |
| **Proposals & duplicates** | Correction proposals with reason, proposer, independent reviewer and a **Simulated** label on every apply. Duplicate resolution proposes a survivor with evidence and executes no merge. Interrupted and returned cases are demonstrated; a changed proposal is a successor and inherits no review. |
| **History & explanation** | Version and audit history for the selected person and their affiliations, separating what the application actually records from what is **not recorded**; the visibility explanation traced step by step; and derived interaction history with its derivation stated. |

### 4.1 The four preview roles produce genuinely different results

| Role | Grants (Seed) | Sees |
|---|---|---|
| Sales coordinator | `shared.read`, `shared.edit`, `shared.create` at Company | 9 of 10 contacts; may raise proposals |
| Service coordinator | `shared.read`, `shared.internal.read` at Company | 9 of 10; cannot raise proposals — no `shared.edit` |
| **Site technician** | `shared.read` at **Site** only | **1 of 10.** The other nine render *Restricted*, never *None* |
| Finance reviewer | `shared.read`, `shared.finance.read` at Company | 9 of 10, plus the finance-held reliance binding the others see as restricted |

The site technician is the role that proves the rule. Willowbank Horticulture has four contacts; the technician sees one and three render as *Restricted contact* with their recorded role still shown, because the affiliation exists even where the person is withheld.

---

## 5. The signature requirement: restricted is never empty

This is the single most likely honesty failure in this record type, because the running API returns `[]` for both cases. The module answers it with a four-value presence vocabulary, used by every list, count and panel:

| Value | Rendered as | Means |
|---|---|---|
| `present` | *n shown · m restricted* | Records this reader is permitted to see |
| `restricted` | *Restricted from you* | Records exist. Your grants do not reach them. **This is not an empty list** |
| `none` | *None recorded* | No record of this kind exists. **This is not a permission problem** |
| `unknown` | *Unavailable* | The count could not be established. **It is not zero** |

This follows an existing precedent rather than inventing one: `src/projects/service.ts` already returns `'Unavailable owner'` with an explicit `owner_unavailable` flag when the reader cannot see a task's external owner, instead of returning null and letting the screen read as "no owner". The report cites that precedent; the page cites it too.

The model check asserts, for every role × every organisation × every person, that a restricted count never reports `none`, that a genuinely empty collection reports `none`, and that a withheld reliance row carries no subject and says *"Your grants do not reach it"*.

---

## 6. Command honesty

No control implies a command that does not exist. Every apply carries a visible **Simulated** label, and a simulation changes no record — the check asserts the fixture is byte-identical before and after an apply, and that the subject keeps its version.

| Proposed action | Why there is no direct control |
|---|---|
| Correct the recorded name | No command updates `people.display_name`. `renameOrganisation` is the nearest existing precedent, for a different record type |
| Correct email / phone / preference | No command updates those columns |
| Mark the contact inactive | `people.active` is set `true` by `createPerson` and never written again, yet Finance, the planner and project tasks all enforce it |
| End an affiliation | No command writes `relationships.valid_to`. The GiST exclusion constraint would still govern any replacement period |
| Merge duplicates | `immutable_evidence` refuses deletion of `people` and `relationships`; the data dictionary says *"no name-based automatic merge"*; the API contract says *"no identity deduplication"* |

Guards enforced in the model and asserted by the check: a reason of at least ten characters; a named **independent** reviewer who is not the proposer; an `expected_version` that refuses a stale subject; explicit confirmation before a simulation; idempotency, so repeating an apply creates no duplicate; and a successor proposal that inherits no review.

Duplicate resolution produces a **superseded-by pointer with evidence**, never a merge and never a delete. The pointer is never marked applied, and restore validation refuses a state in which it is.

---

## 7. Authority honesty

Authority basis is one of exactly three values on every stakeholder row:

- **Recorded** — `ppo.relationships` holds this role label over this period. That is a recorded role, not an authority to commit.
- **Asserted by us** — someone in Powerplants has stated it; nothing external confirms it.
- **Unknown** — the affiliation has ended, or has not started, and nothing records who holds the role now.

There is no decision-maker flag anywhere in this package. The check bans a list of authority-asserting phrases from the rendered page, permitting only a short, explicit set of sentences that **deny** the claim, each of which is asserted present.

---

## 8. Fixture data

Four organisations, five sites, ten people, ten affiliations and fourteen downstream bindings. The population **reuses CS-01 r01** — Willowbank Horticulture (`SYN-PPO-ORG-000101`), Rothwell Glasshouse Group (`SYN-PPO-ORG-000102`), and sites `SYN-PPO-SITE-000201`, `-000202` and `-000211` — extended with Hadley Pastoral Trust, Marchmont Produce Group in a second company, and a site with no primary contact. Company identifiers are the application seed's own.

> **Correction to the build plan.** Plan §8 describes "Northbank and Willowbank Hort" as organisations already appearing in issued designs. Willowbank Horticulture is an organisation in CS-01 r01. **Northbank is not an organisation**: it is part of a site name, `Rothwell Glasshouse — Northbank`, belonging to Rothwell Glasshouse Group. The reconciliation the plan required at Phase 0 found this, and the fixture uses the real CS-01 identities rather than the plan's description of them.
>
> CS-01 r01 contains **no customer contacts at all** — `Priya Raman` and `Alex Moreau` are our own staff, as relationship and service owners. Every contact in this package is therefore new, which is the point of the module.

The six required scenarios, all reachable and all asserted:

1. **Normal** — Rothwell: two current affiliations, a designated site primary contact, and an ended affiliation.
2. **Blocked** — Curtis Lane, primary contact of Willowbank Field Production, `active = false`; the SV-06 approval consequence rendered and owned elsewhere.
3. **Restricted** — Willowbank's four contacts seen as one by the site technician, with three rendered *Restricted*, never *None*.
4. **Ambiguous** — two **Marion Espie** records in different company contexts (not duplicates, and never offered for merge), plus a genuine **Jonas Reddick** duplicate pair within one context. Neither is merged.
5. **Unknown** — a deal carrying `contact_unknown_reason` and a case carrying `requester_description` with no `requester_id`; *no contact recorded* distinguished from *contact not permitted to you*.
6. **Partial** — a page reporting `completeness: "Partial"` with a next cursor.

People carry **no `SYN-PPO-` reference**, because the contract allocates none. Contacts are identified by name, affiliation and the organisation's `SYN-PPO-ORG-` reference, and the page states that a UUID is not a user-facing reference.

Role labels are plausible horticultural roles and are explicitly fictional. **No role vocabulary exists anywhere in the repository**: the application seed carries only `SYN site contact` and `SYN supplier liaison`. This remains build-plan open question 3, and is the one question still needing Dean.

---

## 9. Presentation standard and departures

All seven elements of `ui-style-specification.md` §7.1: a single `#ppo-contacts` scope container with a local reset; tokens declared on the scope container, not on `:root`, reusing the shared core by name before inventing any; all eight states rendered and reachable; fixture data using real references as qualified in §8; the four declared viewports with zero horizontal overflow; a change record; and no shell duplication.

§5.1 bounded scroll: only the scope container states a viewport height, every flex ancestor carries `min-height: 0`, and the register owns its own `overflow: auto`. §5.2 layering: module content stays in band 0–29 and short decisions use a native `<dialog>` with `showModal()`.

The three known token divergences are not resolved by this package. It adopts the **Field Technicians r05** side — `--surface-hover: #f0f2f5`, `--line-soft: #e9ecf1`, `--success-tint: #f3f7f1` — and the stylesheet records that choice in a comment.

### The theme edition — resolved during the build

Build-plan decision 1 records theme **r22** as measured and strictly additive over r20, introduced by PR #239, and instructs this module to adopt r22's selection family and menu patterns.

When this branch was taken, **#239 had not merged**, and the r22 board was not in the repository: the theme-board directory ended at r20, and the merged AD-03 package pinned an r22 file that did not exist, so its own build check silently skipped that assertion. The design was therefore built on the shared token core alone, and the departure was recorded as needing Dean.

**#239 merged during this work.** `origin/main` `be219114` was merged into this branch, the r22 board arrived, and decision 1's claim is now measurable — so it was measured rather than taken on trust:

| Claim | Measured |
|---|---|
| r22 board SHA-256 `a305361c…` | **`a305361c5d937296a8837e751f1a80ac7e6ca7615013705c7ad55ad794957df0`** — matches the plan and the AD-03 pin |
| Zero tokens removed | **0 removed** (103 names in r20, 127 in r22) |
| Zero token values changed | **0 changed** |
| 24 added, all component-local aliases | **24 added**, every one `--nca-*` or `--ss22-*` |

Decision 1 is correct in every particular. The module therefore adopts the r22 selection family properly rather than approximating it: the whole `--ss22-*` family is declared on the scope container with the board's own values, the selected directory row uses r22's **ring** treatment, the view tabs use its **tabs** treatment, the attention queues use ring, and the filter group uses **recessed**. `--line-strong`, `--text-secondary`, `--control-border` and `--focus` are reused by name from the board rather than invented, as §7.4 requires. A green marker is retained on the selected row and tab so selection is never carried by colour alone.

Every `--ss22-*` value either aliases a token this module already declares or is a shadow built from the brand navy `rgba(36,42,55,…)`, so the family introduces no new colour. Two model-check groups assert all of this, comparing the two boards directly; the builder now pins the r22 board by content and refuses to run if it changes.

The r22 board also carries `--surface-hover: #f0f2f5`, `--line-soft: #e9ecf1` and `--success-tint: #f3f7f1` — the Field Technicians r05 side of the three known divergences, which is the side this package had already adopted. That is measured by the check, not asserted here. The divergences remain formally unresolved; resolving them means reissuing the losing baseline, which is out of scope.

---

## 10. Verification

| Check | Result |
|---|---|
| `python scripts/build-contacts-design.py --check` | Verified byte for byte |
| `node scripts/check-contacts-model.mjs --write-evidence` | **102 groups, 102 passed, 0 failed** (plan floor 45) |
| `node scripts/check-contacts-browser.mjs` | **60 groups, 60 passed, 0 failed** (plan floor 25), on the pinned Chrome channel |
| Page, console and request errors | **Zero** |
| Horizontal overflow at 1440×960, 1024×768, 820×800, 390×844 | **0 px on every view at every viewport** |
| Phone targets | No interactive target under 44 px at 390 px width |
| Keyboard-only completion | A correction proposal and a duplicate resolution, both completed with the keyboard alone; dialog and panel focus return confirmed |
| `python scripts/check_foundation.py` | Passed, 0 errors, 3,400 local links checked |
| `python scripts/check_prototype.py` | Passed, 0 errors |
| `python scripts/check_naming.py` | Passed, 0 errors; copy-ready instructions 7,971 of 8,000 characters |
| Conflict-marker scan over `docs` | No output |
| `git diff --check` | No output |
| Determinism | Rebuild reproduces the committed HTML byte for byte |

### 10.1 Defects the checks found, and what was changed

Five defects were found during verification and fixed before this issue. They are recorded because a check that finds nothing has not been tested:

1. **`simulateApply` reached its state gate before its idempotency guard**, so a repeated apply was refused rather than reporting itself as already simulated. The guard now runs first.
2. **A simulated save failure was masked** because the transient `saving` status overwrote the configured outcome before the write was attempted.
3. **A failed or refused dialog submission left the raised proposal in state.** The submit handler now snapshots the record collection and restores it on any error, so a failed save changes nothing while entered values are kept.
4. **`<label for>` on two toolbar buttons overrode their accessible names**, so they were announced as "Saved views" and "Local workspace" rather than by their own text.
5. **Phone targets below 44 px**: the record-opening name button (26 px) and the pagination controls (38 px) at 390 px width.

### 10.2 Defects the owner's visual review found

Two defects survived every automated check and were found by Dean opening the page. Both are fixed, and both now have checks that fail when they return:

6. **No icon-only control rendered its icon.** The template ships four static `data-icon` placeholders — the page-guide button, the Assistant and Preview options buttons, and the two close controls — and **nothing in the controller ever painted them**. The guide button rendered as a blank white square; the close controls were empty boxes carrying only an `aria-label`. Screen-reader users were unaffected; everyone else got a button with nothing in it. One of the four also named `spark`, which does not exist in the Customer 360 icon set at all. The controller now paints the placeholders at startup, the template names only icons that exist, and three new groups assert it — one model group checking every placeholder name resolves and is painted, two browser groups checking the header and both close controls render an `svg`.
7. **Only the selected row had column rules.** The r22 *ring* treatment was applied as a `box-shadow` on each `<td>` rather than on the `<tr>`, so every cell drew its own 2 px halo and the adjacent halos read as column separators. The selected row was therefore the only row in a seven-column register whose columns could be tracked — an accident that looked deliberate. The halo and lift now sit on the row, the navy boundary is drawn by the edge cells, and **column rules are drawn on every row**, which is the improvement the accident had revealed. A model group asserts the cells carry no halo of their own, and a browser group reads the computed styles to confirm the ring is on the row.

### 10.3 What is not verified

- **Native visual review is partially done.** Dean opened the page and found the two defects in §10.2. Physical 320/390 devices, zoom, print and top-layer dialog rendering on real hardware remain **not claimable from this environment**; screenshots were captured and reviewed by the agent that took them, which is not owner acceptance.
- **The focused workflow has not executed.** `contacts-design.yml` is committed but this branch has not been pushed, so no CI run exists.
- **Owner acceptance, application integration and production readiness.** A passing check is component evidence. Publication is not approval.

---

## 11. Receiving contract for a future runtime increment (recorded, not built)

Recorded in the [decision record](../../../decisions/contacts-stakeholders-design.md) and reproduced here in summary. If Dean later authorises a runtime increment it needs, at minimum: `revisePersonIdentity`, `setPersonActive`, `endAffiliation`, `setSitePrimaryContact` and `setContactDesignation`; audit and identity object types for a contact-change proposal, if proposals become durable; a decision on whether `relationships` gains a designation column or a separate table; `'Person'` in `activity_links.object_type`, if interaction history becomes linked rather than derived; a capability decision, which would touch `ck_grants_capability` and interacts with D-020 and AD-01; a `can_edit` flag on the Person projection, which it currently lacks; and a decision on whether a merge command may ever exist, given `immutable_evidence`.

None of this is proposed for adoption here.

---

## 12. Open questions

Five of the six build-plan questions were answered from the repository and are recorded in the decision record. **One needs Dean:**

> **Role vocabulary.** `role_label` is free text, 1–200 characters, and no vocabulary exists anywhere in the repository — the seed carries only `SYN site contact` and `SYN supplier liaison`. The fixtures use plausible horticultural roles labelled as fictional, and a responsibility taxonomy stays Proposed. If Dean has a real Powerplants vocabulary, it belongs in a later revision.

**The theme edition is no longer open.** It was briefly a departure, because #239 had not merged when this branch was taken. #239 merged during the build, the r22 board was measured against r20, decision 1 was confirmed correct in every particular, and the r22 selection family is adopted with the board’s own values. See §9.

---

**Status.** Proposed design, delivered against the build plan. This document establishes no owner acceptance, no application integration and no production readiness. No application, API, migration, seed, permission or deployment change is made or proposed for adoption by this package.
