---
document_id: PPO-EN06-INT
date: 2026-09-20
owner: Dean Fiedler
status: Implemented and merged to main as PR #265 (5d54c4e) on 20 September 2026; visual acceptance, business acceptance, technical authority (D-002/D-019) and the accepted UI baseline register remain separate
source_commit: 99c32aed5032393b7658713cca53aa4c1a2ab2dd
versioning: git
---

# EN-06 Released Materials & Substitutions: application integration

**Scope:** EN-06, parent **ENG-05**, related ENG-02/03/04/06/07, SCM-01/03/04/08, DOC-01/02; acceptance boundaries AT-15 and AT-37 are preserved and none is claimed. **Authority:** on 20 September 2026 Dean supplied build plan r02, the VS Code build prompt r01 and desktop mockup r04, and instructed that EN-06 be built in the existing local application, verified and handed over on the local server. The instruction covers implementation, an additive migration, the local synthetic seed path and local verification. It did not cover deployment, publication, a push or a pull request, and none was made under it. Later the same day Dean authorised the push: `main` at `1a69e93` was merged in, the branch was pushed and draft PR #265 was opened. Dean merged it to `main` the same day as `5d54c4e`, after its CI passed. Nothing is deployed.

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
| Entry | `/engineering/materials` opens the workspace itself: the package last opened in this browser when it is still permitted, otherwise the first permitted package with a material set. `?choose=1` shows the searchable list, which the context row's package control offers as "Choose another package…" | `GET engineering/materials` |
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
| D1 | The menu is 220px, not the mockup's approximate 240px. "Substitution review" stays on one line beside its badge, by an 8px gap inside EN-06's own menu | Plan section 3 and 6.2: My Work's measured source geometry governs; the label was 2px short of fitting |
| D2 | Names read "SYN Alex Lee", "SYN Willowbank Horticulture" | Every synthetic record in this repository carries the SYN marker |
| D3 | The comparison shows "Evidence needed" where the mockup shows "Review needed" | The plan fixes four results; text resolves image ambiguity |
| D4 | Dates read "22 Sept 2026" | The application's existing `en-AU` formatting, as in the Engineering workspace |
| D5 | Readiness reasons, design quantity, areas served, the dependency group, the design basis and the correct and remove actions sit behind "View material details" in the inspector | Plan sections 6.5 and 7 require them; the refined image keeps the first view to its summary and names that link |
| D6 | The material set shows a chooser | The demonstration package has two sets: A, and the coordination-only negative fixture B |
| D7 | With the menu hidden, the header appends the destination only where the whole of it fits (about 1,820px and wider); the module name is never cut short for it | Plan section 6.1 asks for the destination to stay identifiable, and the owner's review found the truncated module name wrong. The full path remains in the title attribute and the page heading |
| D8 | Columns are shown, hidden or widened from the Columns menu; there is no drag resize | A keyboard-accessible sizing control was built; pointer drag resize was not |

### 5.1 Owner review and the refined register, 20 September 2026

Dean opened `/engineering/materials`, found a package list where the mockup shows the workspace, and supplied a refined desktop image of the register. Two things followed, on branch `fix/en06-refined-register`.

**The entry route opens the workspace.** The package is changed from the context row, as the image shows; the list remains for an explicit choice, for an identity with nothing to open, and for a failed read.

**The register follows the refined image where it differs from r04:** a two-row context (package, customer and site; then the material set with the two page actions, the first now "Add material requirement"); the attention notice as one line above the table; item mapping and line readiness as chips, a check only for a completed positive state and a warning only where someone must act; one text line per row with the alternate's state beneath it ("Substitution proposed"); "Rev" in the drawing column; left-aligned quantities; column rules through the body and a muted header; "Sort: Line number"; no technical-release and supply-handover strip under the table; the footer sentence "Technical release does not authorise purchasing."; an inspector that stands beside the context rows and is ordered Specified → proposed, Compatibility evidence, Next action with "Review due" and "Material required-by", Source basis with "Selected sources current" and the time it was checked, and Release & handover with technical acceptance, material release and supply handover kept apart; and a two-part breadcrumb at the shell's own 14px.

**Not taken from the refined image:** its fictional line content ("Solenoid valve assembly", "PE distribution tubing", "Jordan Woods", a "Source changed" line 070 and an accepted alternate on line 060). The scenario is still the plan's fixture table, built through the API under stable operation ids; changing it means a new scenario and new expectations in four suites, and is left for the owner to ask for. D2, D3, D4, D6 and D8 stand. The menu still defaults to collapsed, as the build prompt requires, although both images show it open.

## 6. What this increment does not do

Live MYOB, SharePoint, CAD, supplier or Supply Chain integration; ERP item creation; prices; purchasing, stock, receipt or financial posting; customer or supplier messages; controlled external distribution (DK-03); the full EN-07, EN-08 or PD-04 processes; generic BOM import; Service-linked packages. An Opportunity package can be prepared and inspected and is refused procurement-ready receiving. The hosted demo is unchanged: invited testers gain no material duty, which `scripts/demo-upgrade.ts` records in its "Reviewed for 0029" note.

Kit parent and child lines are enforced by the rules and the database and are covered by unit tests, but the line form does not yet offer a kit parent chooser, so a kit is not creatable from the screen. Substitution impacts are shown and retained but are entered through the API, not the form.

## 7. Verification

Recorded with commands, results and limits in the [local evidence record](../testing/evidence/engineering-materials-local-r01/README.md). All EN06-Axx labels are task-local; none is a parent acceptance pass.
