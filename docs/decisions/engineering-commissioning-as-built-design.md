---
document_id: PPO-EN08-INT
revision: r01
date: 2026-09-20
owner: Dean Fiedler
scope_id: EN-08
principal_requirement: ENG-07
status: Implemented branch in PR #270; 21 September conflict and assurance repair; visual acceptance, business acceptance, technical authority and the accepted UI baseline register remain separate
source_commit: 7a47b2f (EN-07 branch tip this work is stacked on, draft PR #266) with main 5d54c4e merged in; main was 1a69e93 at the planning checkpoint
---

# EN-08 Commissioning Basis & As-Built Release: application integration

**Scope:** page/module EN-08 under principal requirement ENG-07. The two identifiers belong to different registers and are not conflated. **Authority:** on 20 September 2026 Dean supplied Build Plan r02, the accepted desktop mockup r02 and the VS Code build prompt r01, and instructed that the working module be built in the local application, verified and handed over. That instruction covered local implementation, migrations against a synthetic database and verification. It excluded pushing, merging, deploying, contacting anyone, live ERP or SharePoint writes, equipment control and production data. Nothing was pushed under that original instruction. Dean subsequently opened PR #270; the 21 September request to fix that PR authorises the repository repair recorded in section 8.

This is a change to a synthetic prototype. Nothing here is a production claim, a business acceptance, a technical or statutory authority, an operational procedure, an acceptance limit, or evidence that an ERP, SharePoint, CAD, controller, Equipment, Service, Projects or document-distribution integration exists. Every limit, instrument, calibration, person and record in the module is fictional.

## 1. References and what each was used for

| Reference | Location | Used for |
|---|---|---|
| Build Plan r02 (`PPO-EN-08-…-Build-Plan-r02.md`) | Supplied in the conversation; **not in the repository** | Domain boundaries, state dimensions, the visual contract, the scenario pack and checks EN08-01–EN08-60 |
| VS Code build prompt r01 | Supplied in the conversation; **not in the repository** | The executable instruction and its nine sections |
| Desktop mockup r02 (six columns, tinted rectangular tags, spacious inspector, **Resolve redlines**) | Supplied in the conversation as an image; **not in the repository** | Composition, hierarchy and the selected-record presentation only. Written rules governed wherever the raster disagreed (section 5) |
| Theme style board r22 | `docs/reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html` | Tokens, the `.tag` rule, the List profile and control geometry. Its SHA-256 is `a305361c5d937296a8837e751f1a80ac7e6ca7615013705c7ad55ad794957df0`, **byte-identical to the supplied `(3)` upload**, and its blob is `d830d455…`, so the repository copy was used as the verified theme source |
| My Work shell and styles | `src/shell/secondary-menu.tsx`, `src/app/styles/my-work.css` | The menu itself, reused through the primitive EN-06 extracted, not imitated |
| EN-06 and EN-07 server and UI | `src/engineering/materials/`, `src/engineering/changes/`, migrations 0029 and 0030 | Conventions, the retained upstream source adapter, real engineering changes to refer differences to, shared register and inspector rules |
| Field runtime | `src/field/`, migration 0007 | What evidence exists today: appointment-bound entries and PNG attachments, and the byte and PNG validation reused here |
| Document runtime and contract | `src/documents/store.ts`, `src/platform/browser.ts`, `docs/contracts/document-issue-distribution.md` | The exact byte store, the pinned document browser, and the reserved-preparation versus actual-issue distinction |
| Master Blueprint section 11; Coverage Register r06 | `docs/blueprints/BP-01-master-blueprint.md`; `docs/reference/ui/module-page-register/` | ENG-07 obligations, OUT-12 and OUT-13, the EN-05 and FI-04 dependencies |
| Quality/Site Assurance and Equipment designs | `docs/decisions/quality-site-assurance-design.md`, `docs/decisions/equipment-workspace-design.md` | Behavioural references for retained failures, retests and scoped release. Both are browser-only designs: no server inspection engine existed |

The plan, prompt and mockup are not committed. This is a public repository and the precedent of the My Work, EN-06 and EN-07 records is that supplied reports and images are published only when Dean says so. No UI baseline is registered for EN-08 for the same reason.

## 2. Decisions

| # | Decision | Evidence and effect |
|---|---|---|
| D1 | Stack on the EN-07 branch, in an isolated worktree, with `main` merged in | Migration 0030 is EN-07's and is already applied to the shared development database, so 0031 could not be based on `main` alone. EN-08 also refers technical differences to real EN-07 changes. Work was done in `tmp/en08-commissioning` on `feat/en08-commissioning-as-built`. It must merge after EN-07 (draft PR #266) |
| D2 | Migration **0031**, additive | Twenty-four tables (eight `ppo.inspection_*`, sixteen `ppo.commissioning_*`), their guard functions, four shared CHECK constraints widened by the 0020 idiom, typed identity dispatch extended in place inside the `SET CONSTRAINTS ppo.identity_target IMMEDIATE/DEFERRED` pair AGENTS.md requires. One identity type (`CommissioningPackage`), eight outbox kinds, four capabilities. No existing row, trigger, grant or migration byte changes |
| D3 | A **shared inspection core** (`src/inspections`), not a commissioning engine | No reusable server inspection service existed: FI-04, Quality and Equipment are browser designs. The core owns typed hosts, draft and immutable attempts, exact evaluation, evidence, review decisions, defects and retest lineage, and knows nothing about commissioning. Hosts are `ProjectCommissioningScope` and `ServiceAppointment`; a Service host is resolved through the field runtime's own `visibleAppointment`, so assignment and attendance controls are kept. EN-08's screens create project-hosted attempts only; a later FI-03/FI-04 workspace reads and writes the same rows |
| D4 | Existing field evidence is **linked, never copied**; no dummy appointment is ever made | Field entries and attachments are foreign-keyed to appointments and attachments are PNG-only. A field entry is linked by its exact id and revision through `entryContext` (the field runtime's own permission check). Project-hosted files go to the existing exact byte store and through the same size, hash and strict PNG inspection; plain text is the only other accepted type. Anything else is recorded as *Unsupported* and blocks submission |
| D5 | Sources are EN-06's retained upstream snapshots; this module publishes nothing | Procedures, drawing issues and intended configurations are `ppo.material_sources` rows (kinds widened by 0030). A basis stores the snapshot it bound and reads present use at every decision. A successor drawing that incorporates a redline is published by its owner through the synthetic adapter; EN-08 only verifies that it is the successor of the exact marked-up issue |
| D6 | A referred difference names a **real EN-07 change** | `change_id` on defects, differences and redlines is a foreign key to `ppo.engineering_changes`, validated against the same Engineering package. The referral is shown as a request: a difference *with change review* blocks reconciliation until it is dispositioned again. No fake *Open change review* link exists |
| D7 | Six static routes with the Engineering package as context | `/engineering/commissioning[/basis\|results\|configuration\|releases\|handovers]?package=<uuid>&record=<uuid>` and `/engineering/commissioning/packages/:id`. Static segments take precedence over `/engineering/[id]`. The Engineering package id, the commissioning package id, the Project and the display reference stay different identities. The API keeps EN-06/EN-07's shape: `/api/v1/engineering/:id/commissioning/*` |
| D8 | Separate state dimensions; the workflow is derived | Basis approval, check evaluation, evidence review, current applicability, reconciliation, release, receiving and obligations are each read from their own rows. No *Ready* flag and no selectable package status exists. `model.ts` derives workflow, the register cells and the next requirement; the same functions decide screen labels, server refusals and unit tests |
| D9 | Exact decimal evaluation under a stored rule version | Readings are kept as entered, as text; comparison is integer arithmetic at twelve places with declared inclusive or exclusive bounds, accepted precision and approved conversions only. A missing criterion, an unknown condition or a unit with no approved conversion is *Unable to assess*, never a pass. Each evaluation stores `inspection-rules-1` beside it |
| D10 | One unresolved defect per host and check, by constraint | A partial unique index, not a disabled button. A repeated failure and a repeated command land on the same defect; it closes only on a fresh passing result of its own check whose evidence was accepted, enforced by trigger, and closes nothing else |
| D11 | Authority is capability **and** versioned policy; independence is also a database fact | `engineering.edit` prepares and never approves. `engineering.commissioning.capture/review/issue/receive` are separate, and `ppo.commissioning_policies` must name the same person per duty. Where the policy requires independence, CHECKs and triggers refuse a self-approval, self-review, self-reconciliation or self-receipt. Company B has no policy and shows *Authority not configured* |
| D12 | OUT-12 and OUT-13 as a bounded module on existing primitives | `outputs.ts` reuses the pinned document browser, exact byte store, hash and canonical JSON. The two families are deliberately **not** added to `supportedTemplateDefinition`'s version-2 source list, which would change every seeded OUT-09/10/14 template hash. Bytes are rendered and stored once under the reserved output identity *before* the issue transaction; the transaction rechecks authority, versions, gates, source applicability and the stored hashes, then records output, release, audit and receipt together. `prepared_at` and `issued_at` are different columns with different meanings. A trigger refuses an issued release without its issued output |
| D13 | Receiving through a labelled synthetic receiver | Service, Equipment and Projects have no receiving runtime. One request identity per release, destination and recipient; corrections are new submissions under it; the receiver decides the exact manifest and the sender cannot. The fixture can be told to answer *Unknown* or *Unavailable* so that outcome-unknown and original-operation recovery can be shown; every such outcome is labelled synthetic. Accepting writes nothing to the installed base, Service or Projects |
| D14 | One owned My Work action per defect, read where it lives | A defect creates one `TechnicalFollowUp` activity linked to the package's Site through the activities module's own authorise and insert functions, and EN-08 shows that activity's live status. It is not copied and not auto-completed. A new activity link type for commissioning packages was **not** added: it needs coordinated changes in nine places of My Work and was out of proportion here |
| D15 | A task-owned PostgreSQL cluster | The shared development database's ledger still holds 0030's first checksum, so the official runner refuses there and earlier sessions left that ledger write to Dean. Rather than touch it, a private PostgreSQL 16 cluster was initialised under the worktree's ignored `tmp/` on 127.0.0.1:55438 with `ppo_synthetic` and `ppo_synthetic_test`, inside the application's own configuration rules. Migrations 0001–0031 and every seed ran through the official runner from empty, and the database suites ran locally for the first time |
| D16 | Package-local synthetic references | `SYN-EN08-nnn`, `RL-nnn`, `DEF-nnn` and `AB-nnn` are aliases. PPO-STD-001 catalogues no reference type for them, so none is invented and no `SYN-PPO` counter is consumed |
| D17 | A partial candidate is judged by its own complete rule set | While a partial candidate is live, coverage, open defects and returned attempts are read for the scope it names; what it holds back stays listed with its reason and owner. Scope is what the command names item by item, never a filter, page or visible row. A shared interface that joins released and held-back items and is not assessed independent blocks the release |
| D18 | Menu: My Work's primitive, first use collapsed, own key | `ppo.commissioning.layout.v1:<workspace>:<actor>` holds menu state, optional columns and the last Engineering package used. My Work's, EN-06's and EN-07's keys and defaults are untouched; an overlay never changes the desktop preference |
| D19 | The r22 status tag, verbatim | `.cm-tag` is r22's `.tag` rule (3×8 padding, 5px corners, 12px/500, 13px outline icon at 1.7 stroke) with the five r22 tone pairs. EN-07's filled discs and triangles were not reused. One typed map per condition; ordinary next steps are plain text; *Not requested* is neutral with an empty ring, never a tick |
| D20 | Hosted demonstration reviewed, not changed | `scripts/demo-upgrade.ts` carries a written review for 0031. Seed 31 replays there (it is above 17): one unselectable synthetic user, duties for fictional profiles only, one policy row and four calibration fixtures. Invited testers get no commissioning duty, so a hosted package cannot be tested, approved or released. Nothing was deployed |

## 3. Routes

| Destination | Address | API |
|---|---|---|
| Commissioning register | `/engineering/commissioning` | `GET/POST …/commissioning` (register; create, coordinate, scope, rescope, check, assess, archive) |
| Test basis & criteria | `/engineering/commissioning/basis` | `…/commissioning/basis` (create, save, submit, approve, return) |
| Results & retests | `/engineering/commissioning/results` | `…/commissioning/results` (open, save, evidence, remove_evidence, submit, review, clarify, defect, correct); `…/results/evidence` for file bytes |
| Installed configuration & redlines | `/engineering/commissioning/configuration` | `…/commissioning/configuration` (snapshot, item, dispose, submit, reconcile, redline, redline_decide, redline_verify, association, association_review, backup, backup_verify) |
| Review & as-built release | `/engineering/commissioning/releases` | `…/commissioning/releases` (draft, save, submit, approve, return, prepare, issue, withdraw) |
| Handover & history | `/engineering/commissioning/handovers` | `…/commissioning/handovers` (obligation, obligation_state, request, resubmit, reconcile, decide, cancel); `…/commissioning/history` |
| Full record | `/engineering/commissioning/packages/:id` (sections `#basis` `#results` `#configuration` `#release` `#handover` `#history`) | `GET /api/v1/engineering/commissioning/records/:id` |
| Files | — | `GET …/commissioning/files?kind=output\|evidence\|preview\|export` |

`…` is `/api/v1/engineering/:engineeringPackageId`. Every route runs the same local-request, identity, scope and duty checks; files are re-verified against their recorded hashes on every download and are never cached.

## 4. What is synthetic, and its limits

| Boundary | What stands in for it | What it never claims |
|---|---|---|
| EN-02/03/05 procedures, drawings, intended configuration | EN-06's `SyntheticUpstreamFixture` retained snapshots | That a source is current beyond the last recorded check; that a newer file is an approved successor |
| Source currentness | A recorded check row with its own time and adapter; a named assessor's evidenced manual assessment where the adapter cannot establish it | That opening a page verified anything |
| Instruments and calibration | Four fictional records from `SyntheticCalibrationFixture`, with fixed dates so that valid-then-expired-today and retrospectively-withdrawn always hold | Any real instrument, certificate or laboratory |
| Acceptance limits | Fictional values, labelled *Fictional limit* beside capture, criteria and outputs | Any site or manufacturer threshold |
| Equipment, Service, Projects receiving | `SyntheticReceiverFixture` requests decided by fictional receivers | An installed-base change, a Service acceptance of record, a Project stage, a customer acceptance, a warranty start, a booking or a commercial closure |
| Distribution | Exact local bytes and a manifest | That anything was emailed, uploaded, delivered, opened or acknowledged |
| Controllers and backups | Reference metadata and three separately evidenced facts | Any controller contact, backup content, credential or restore |
| Offline capture | None | Commissioning capture is online only; save states are the shared command hook's |
| Competence, independence, hold and witness authority | A fictional versioned policy | D-019. Real authority, qualifications and exception rules are operational inputs |

## 5. Departures from the plan or mockup

| # | Departure | Reason |
|---|---|---|
| X1 | The redline in the review fixture is **RL-001**, not RL-017 | References are allocated from persisted rows. Sixteen fabricated redlines to reach a number would be invented history |
| X2 | The inspector shows *02 · Evidence accepted · tested 19 Sep 2026* | The tested time is what the performer recorded. The acceptance time is the server's and is the day the fixture was built; it is shown in the results view and is never set by a client |
| X3 | The source check shows its real recorded time, not 20 Sep 2026 3:40 pm | The plan says the mockup's timestamp is an example. The time beside the indicator is always a check row's |
| X4 | Fixture due dates are the build day plus 2 to 5 days | They equal the mockup's 22–25 Sep 2026 when built on 20 Sep 2026 and do not turn the whole register overdue a week later |
| X5 | No selection checkboxes | The plan makes them unnecessary without a safe batch action; none exists |
| X6 | Evidence files are PNG or plain text only | Those are the types the existing validation can actually inspect |
| X7 | Equipment receiving records an outcome; it does not write canonical configuration | No validated installed-base authority exists (plan section 21) |
| X8 | No My Work link type for commissioning packages | D14 |
| X9 | No phone mockup was supplied or approved | Phone reflow was built and checked against the written contract only |
| X10 | The *Test basis* value lives in the inspector, the detail and an optional column | The accepted six-column layout |

## 6. Verification performed

See `docs/testing/evidence/engineering-commissioning-local-r01/README.md` (PPO-EN08-EVD) for commands, counts and limits.

## 7. Open items for Dean

See `docs/delivery/engineering-commissioning-as-built-handover.md` (PPO-EN08-HO), section 6.

## 8. PR #270 conflict and assurance repair, 21 September 2026

At inspection, GitHub reported head `f8d2b3dc28d33a69d8b02a367e2e7b01eab9f730` as `CONFLICTING` with `main`; it had no check runs. This was a merge block, not an observed failed EN-08 CI assertion. Main `b4806af` includes the owner-requested EN-06 refined register from PR #268.

The repair merges that main without changing its EN-06 grid composition. EN-07 and EN-08 retain the flex composition their markup uses in `engineering-review-base.css`; header rules are scoped to the owning workspace, and the EN-06 grouped breadcrumb remains intact. EN-08's phone inspector starts below the shared 64 px header, keeping the close control reachable. The new browser regression exercises all six EN-08 destinations with real synthetic server commands and independent fixture identities, plus flush register edges and actual phone close/menu/focus interactions.

Three bounded repairs already present on the newer EN-07 branch are carried forward: `00cd6f4` orders source links consistently before preview/payload hashing, with its permutation regression; `b3c7908` makes the in-process prerequisite helper return the actual route's non-creation status; and `78a8acb` waits for the streamed home redirect's identity boundary before the unchanged CRM heading assertions. Existing stored receipts, command namespaces, migrations, seed definitions, capabilities, output templates and issued files are unchanged by this repair.

[Repair evidence](../testing/evidence/engineering-commissioning-local-r01/pr270-repair-2026-09-21/README.md) records actual commands, successes, failures and the unchanged-main comparison. The original whole-module EN08-01–EN08-60 acceptance matrix, full HTTP/restart procedures, physical devices, owner visual/business acceptance and hosted deployment are not asserted by this repair.

## 9. Initial CRM identity readiness follow-up, 21 September 2026

After `9dcf224`, the owner supplied the first desktop CRM journey's actual CI failure in run `35558631792` / job `106207066774`: the identity region stayed busy beyond a default 5-second assertion. The surrounding database group passed all three tests; 14 browser cases passed, including warm-up. Both CRM identity helpers now use their existing 15-second UI-action budget for that initial asynchronous readiness check. The full CA-01/04/13 journey delays the real initial session response by 6.5 seconds to retain a deterministic regression on desktop and phone. Identity selection and all subsequent domain assertions remain unchanged.

The [follow-up evidence](../testing/evidence/engineering-commissioning-local-r01/pr270-identity-2026-09-21/README.md) distinguishes the reproduced original failure, all 30 CRM browser checks passing locally, static/documentation checks and pending new-head CI. This is a test-only repair and changes no EN-08 runtime, authority, migration, receipt or issued file.
