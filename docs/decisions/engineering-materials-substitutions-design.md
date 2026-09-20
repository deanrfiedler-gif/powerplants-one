---
document_id: PPO-EN06-INT
revision: r01
date: 2026-09-20
owner: Dean Fiedler
status: Implemented and open as draft PR #265 for owner review and CI; visual acceptance, business acceptance, technical authority (D-002/D-019) and the accepted UI baseline register remain separate
source_commit: 99c32aed5032393b7658713cca53aa4c1a2ab2dd
---

# EN-06 Released Materials & Substitutions: application integration

**Scope:** EN-06, parent **ENG-05**, related ENG-02/03/04/06/07, SCM-01/03/04/08, DOC-01/02; acceptance boundaries AT-15 and AT-37 are preserved and none is claimed. **Authority:** on 20 September 2026 Dean supplied build plan r02, the VS Code build prompt r01 and desktop mockup r04, and instructed that EN-06 be built in the existing local application, verified and handed over on the local server. The instruction covers implementation, an additive migration, the local synthetic seed path and local verification. It did not cover deployment, publication, a push or a pull request, and none was made under it. Later the same day Dean authorised the push: `main` at `1a69e93` was merged in, the branch was pushed and draft PR #265 was opened. Nothing was merged or deployed.

This is a change to a synthetic prototype. Nothing here is a production claim, a business acceptance, a closure of D-002, D-008 or D-019, or evidence of a connected MYOB, SharePoint, CAD, supplier or Supply Chain system. A technical release recorded here is never permission to spend, order, reserve, receive, install or commission.

## 1. References and what each was used for

| Reference | Location | Used for |
|---|---|---|
| Build plan r02 | [Working plan](../delivery/engineering-materials-substitutions-build-plan.md), byte-identical to the supplied file (SHA-256 `d6f25857…9e9f239`) | Scope, data and authority rules, journeys, acceptance labels EN06-A01–A46 |
| VS Code build prompt r01 | Supplied in the conversation; **not in the repository** (SHA-256 `cb3b3c2e…57fb00ed`) | Delivery order and the required handover |
| Desktop mockup r04 (one PNG) | Supplied in Downloads; **not in the repository**, kept with the local evidence (SHA-256 `f905f730…5ffa9a`) | Composition and information placement. Inspected as an image; it is not a data authority |
| `collapsible-menu.png` | Supplied in the conversation | Confirms the menu is My Work's; the code was the implementation reference |
| Theme style board r22 | `docs/reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html` (SHA-256 `a305361c…4957df0`) | D23 register treatment and tokens, already declared by `my-work.css`; no second palette was added |
| Current application | `src/`, `db/` at `99c32aed` | Every route, permission, command and convention named below |

Source order when references disagreed, as the plan sets it: Dean's explicit UI instructions; plan r02's data, authority and audit rules; the actual My Work menu and shared shell; mockup r04; r22 profiles.

## 2. Decisions

| # | Decision | Evidence and effect |
|---|---|---|
| E1 | **The menu is My Work's menu, shared, not copied.** | The dock, overlay, header trigger, edge handle and focus return moved unchanged into `src/shell/secondary-menu.tsx`; `MyWorkShell` was refactored onto it and renders the same DOM, ids and classes. EN-06 mounts the same primitive. The generic rule groups of `my-work.css` name both scope ids through `:is()`, which keeps id specificity, so My Work's cascade is unchanged. My Work's 10 desktop and 10 phone journeys pass on it |
| E2 | **EN-06 owns its own presentation preference.** | Key `ppo.materials.layout.v1:<workspace>:<actor>`, default collapsed, never reads or writes My Work's key. It holds the menu choice and hidden columns only |
| E3 | **No breadcrumb slot is invented.** | `HeaderContent` still has `menu`, `search`, `account`. The existing title resolver in `ProductHeader` gains one branch for the materials routes. No other route's header changes |
| E4 | **A line is a stable identity with a content revision and hash.** | The hash covers technical content only (requirement, product, quantity, unit, sources, dependency, kit role, scope flag, item and unit binding). Next action, its owner and dates are outside it, so chasing an action never invalidates a decision while any technical change always does. Substitution decisions and releases bind the exact hash |
| E5 | **The item and unit binding lives on the line.** | A changed binding is changed technical content and moves the line to its next content revision, which is what plan section 9 requires of an earlier acceptance |
| E6 | **Authority needs a capability and a policy entry, and both must agree.** | Four new capabilities: `engineering.material.review`, `.release`, `.receive`, `.source`. `engineering.edit` is none of them. `ppo.material_policies` is a versioned fictional policy naming actors per role, discipline and purpose. No row answers "Authority not configured"; nothing falls back to permissive |
| E7 | **Independence is checked against everyone involved, in the service and again in the database.** | Whoever prepared a set, authored or changed its lines, or proposed an alternate inside it cannot review or release it. CHECK constraints independently refuse a self-decided alternate, a self-reviewed set, a preparer-authorised set and a preparer-decided payload |
| E8 | **A source's permitted purpose is never a field of a material command.** | Sources are retained snapshots observed through a synthetic upstream adapter operated under `engineering.material.source` (the two existing coordinators). A procurement release reads the purpose from the retained source. The coordination-only basis stays a negative fixture beside a separately authored procurement-capable one |
| E9 | **Review, authorise and issue are three operations; issue is answered before anything else is assessed.** | A repeated issue returns `AlreadyIssued` with the original operation id. The manifest is frozen at prepare; the database refuses any later change to it, any un-issue and any delete |
| E10 | **Technical-release accounting is conserved in the database too.** | A deferred trigger refuses active issued entitlements above a line's requirement. A successor names the release it replaces; the predecessor is marked superseded in the same transaction and stops counting |
| E11 | **Receiving is whole-payload, by the named receiver only.** | No second partial-acceptance ledger exists. A returned payload is immutable; correction is a new revision with a readable difference. Procurement-ready receiving needs a Project, a procurement release, verified bindings, resolved quantities, no open commercial decision, and separately evidenced Approved demand |
| E12 | **A changed source or a withdrawn release rewrites nothing.** | It appends a change, marks current use for reassessment (derived at read time from the frozen manifest) and raises one owned follow-up naming the lines, releases and receiving outcomes affected. Its text states that nothing was recalled, cancelled or reversed |
| E13 | **Scenario data is built through the application, not seeded as rows.** | This is the repository's precedent (`scripts/my-work-scenario.ts`). Seed 29 adds only fictional profiles, grants and the policy. `scripts/engineering-materials-scenario.ts` builds the r04 scenario as the people who would do each step, and a rerun is a replay |
| E14 | **Three command outcomes are told apart on screen.** | Saved (only after the server confirms), failed with no effect (entries kept), and unknown, which can only be resolved by recovering the original operation. Issue and receiving carry a labelled synthetic fault that discards the reply to exercise it |

## 3. Routes

| Destination | Route | API |
|---|---|---|
| Entry and resume | `/engineering/materials` | `GET engineering/materials` |
| Materials register | `/engineering/[id]/materials` | `GET`, `POST` `…/materials`; `…/materials/lines`; `…/materials/people`; `…/materials/export` |
| Item & unit mapping | `…/materials/mapping` | `GET …/mapping`; bindings saved through `…/lines` |
| Substitution review | `…/materials/substitutions` | `GET`, `POST` |
| Review & release | `…/materials/releases` | `GET` (with a server preview), `POST` |
| Supply handover | `…/materials/handover` | `GET`, `POST` |
| Changes & history | `…/materials/history` | `GET …/history`; `GET`, `POST` `…/sources`; `POST …/impacts` |

`[id]` is the Engineering package UUID. `/engineering` and `/engineering/[id]` are unchanged apart from a Materials link in the workspace heading and in the package drawer. Original-operation recovery uses the existing `GET operations/[id]`, which now dispatches the seven material record types through a check of present scope and the same duty the command needed.

## 4. Persistence (migration 0029, additive)

`material_sets`, `material_sources`, `material_source_changes`, `material_lines`, `material_substitutions`, `material_policies`, `material_releases`, `material_release_lines`, `material_handovers`, `material_impacts`, `material_events`. Seven are registered business identities so that operation receipts can name them. Four shared CHECK constraints (`ck_identities_type`, `ck_audit_object_type`, `ck_outbox_kind`, `ck_grants_capability`) are widened by the 0020 idiom, and `identity_has_typed_record()` is extended in place. No existing row, trigger or issued migration byte changes. Because the runner applies every pending migration in one transaction, 0029 first settles the deferred `identity_target` checks that 0026's backfill leaves pending and restores deferral after its ALTERs; without that, PostgreSQL refuses to alter `ppo.business_identities` on any database upgraded across both. CI found this on the draft PR, after 0029 had been applied locally; the correction changes the file's bytes, not the schema.

Quantities are `numeric(18,6)` handled as exact decimal strings on integer arithmetic; six fractional places are a fixture convention, not an ERP claim. A conversion is a rational of whole numbers with its evidence; a missing one is NULL and unresolved, never 1:1; a part-filled whole pack needs a recorded overage decision.

Seed 29 adds six `PPO-LocalSynthetic` profiles, their Company A grants, the source-adapter capability for the two coordinators and the Company A policy. **Company B deliberately has no policy.**

| Profile | Fictional person | Duty |
|---|---|---|
| `materials-author` | SYN Alex Lee | Engineering author |
| `materials-engineer` | SYN Sam Jordan | Engineering author; proposes the alternates |
| `materials-reviewer` | SYN Casey Reviewer | Independent technical reviewer |
| `materials-release` | SYN Drew Release authority | Authorises and issues; withdraws current use |
| `materials-supply` | SYN Robin Supply coordinator | Receives or returns the exact payload |
| `materials-viewer` | SYN Quinn Materials viewer | Reads; restricted source bytes and recipient details are withheld |
| `coordinator` (existing) | SYN Coordinator | Synthetic upstream adapter; verifies item bindings; commercial decisions (`project.edit`) |

These are fictional responsibility profiles. They allocate no employee and define no corporate authority.

## 5. Departures from mockup r04

| # | Departure | Reason |
|---|---|---|
| D1 | The menu is 220px, not the mockup's approximate 240px, so "Substitution review" wraps beside its badge | Plan section 3 and 6.2: My Work's measured source geometry governs |
| D2 | Names read "SYN Alex Lee", "SYN Willowbank Horticulture" | Every synthetic record in this repository carries the SYN marker |
| D3 | The comparison shows "Evidence needed" where the mockup shows "Review needed" | The plan fixes four results; text resolves image ambiguity |
| D4 | Dates read "22 Sept 2026" | The application's existing `en-AU` formatting, as in the Engineering workspace |
| D5 | The inspector also shows readiness reasons, design quantity, areas served and the dependency group | Plan sections 6.5 and 7 require physical location and areas served to be kept apart, and a disabled or held state to carry its reason |
| D6 | The material set shows a chooser | The demonstration package has two sets: A, and the coordination-only negative fixture B |
| D7 | With the menu hidden, the header appends the destination and lets the module name truncate | Plan section 6.1: the destination must stay identifiable; the full path remains in the title attribute and the page heading |
| D8 | Columns are shown, hidden or widened from the Columns menu; there is no drag resize | A keyboard-accessible sizing control was built; pointer drag resize was not |

## 6. What this increment does not do

Live MYOB, SharePoint, CAD, supplier or Supply Chain integration; ERP item creation; prices; purchasing, stock, receipt or financial posting; customer or supplier messages; controlled external distribution (DK-03); the full EN-07, EN-08 or PD-04 processes; generic BOM import; Service-linked packages. An Opportunity package can be prepared and inspected and is refused procurement-ready receiving. The hosted demo is unchanged: invited testers gain no material duty, which `scripts/demo-upgrade.ts` records in its "Reviewed for 0029" note.

Kit parent and child lines are enforced by the rules and the database and are covered by unit tests, but the line form does not yet offer a kit parent chooser, so a kit is not creatable from the screen. Substitution impacts are shown and retained but are entered through the API, not the form.

## 7. Verification

Recorded with commands, results and limits in the [local evidence record](../testing/evidence/engineering-materials-local-r01/README.md). All EN06-Axx labels are task-local; none is a parent acceptance pass.
