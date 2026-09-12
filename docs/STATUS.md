# Current prototype status

**Updated:** 12 September 2026 · **Owner:** Dean Fiedler · **Repository:** `deanrfiedler-gif/powerplants-one`, **public** visibility, default branch `main` · **Baseline commit:** `6dc9fda` (merge of PR #124) · **Naming:** [PPO-STD-001](standards/naming-conventions.md) / [ADR-0005](decisions/ADR-0005-project-naming-adoption.md)

This file is a snapshot of the current state, kept short enough to read in one sitting. It is not the evidence record: exact verification, run IDs, hashes and publication results remain in each package's handover, decision record and authoritative external record. The chronological entries that previously lived here are retained unchanged in [STATUS-log.md](STATUS-log.md). Update this file by replacing rows, not by appending narrative.

## 1. Stage in one paragraph

Powerplants One is Dean's personal synthetic prototype of a seven-domain operations platform. The PP-01 planned-service journey (P01–P11) is implemented and merged; P12 (recovery, restore and owner demonstration) is prepared only, so **PP-01 is not complete**. Bounded slices of CRM, Estimating, Projects and Email/Calendar are merged alongside it. A private Azure demo runs the current `main`. MYOB Acumatica, SharePoint, Pipedrive, Smartsheet and native CAD retain their operational roles; every external interface in the application is a simulated adapter. Company ownership, production approval and external write authority are not implied by anything below.

## 2. Baseline, verification and hosting

| Item | State | Evidence |
|---|---|---|
| `main` head | `6dc9fda` (merge of PR #124, 11 September 2026 23:20 AEST); 18 pull requests merged on 11 September | [Commits](https://github.com/deanrfiedler-gif/powerplants-one/commits/main/) |
| Full Application assurance | **Red on `main` since `3efe6e1` (PR #108).** On post-#108 heads the Engineering intake job, the compiled suite and the full proof fail; the other twelve checks pass. Last verified green head: `2b3f508` (PR #79, run 34581733682, 1 h 26 m). | [#125](https://github.com/deanrfiedler-gif/powerplants-one/issues/125) · [Run 34581733682](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34581733682) |
| Compiled application browser assurance | Live since PR #115 (`62b8652`). Six clean runs on non-defective heads (12 min 8 s first run); **red on post-#108 heads** for the same Engineering browser cases as the full proof. Acceptance count met; the replace-or-continue decision waits for `main` to be green again. | [Run 34558038706](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34558038706) · [Decision](decisions/ci-compiled-browser-suite.md) |
| Focused workflows on `main` | Documentation, CRM refinements, Estimating E1, Email/Calendar journey, CRM Leads, Projects Gantt, demo and Azure preparation checks run on every push. PR #118 restored the Documentation check after PR #80 took the copy-ready instructions to 8,001 characters (limit 8,000; now 7,872). | Actions history |
| Documentation checks | `check_foundation`, `check_prototype`, `check_naming` pass at `6dc9fda` (78 parents, 29 decisions, 30 PT procedures, 12 packages, 124 document records) | Local run, 12 September 2026 |
| Hosted Azure demo | **Deployed from `cb358405`** (now 14 merges behind `main`) by manual run 34526927716 (`upgrade-and-deploy`, 10 September 2026 20:31 UTC, owner-confirmed). Database upgraded in place to migration 19 with records and invitations retained; `/healthz` returned 200 and anonymous CRM API access returned 401. **Pending (deferred by owner):** sign-in on the new image, then a saved Leads record, Gantt schedule and Finance draft confirmed after reload; a fresh `upgrade-and-deploy` to carry the 11 September merges. | [Run 34526927716](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34526927716) · [Runbook](delivery/azure-private-demo.md) · [Upgrade decision](decisions/azure-existing-demo-upgrade.md) |
| Branch protection | **Not enabled — now the highest-priority owner action.** Four merges in three days went past a red or unfinished check (#110, #80, #111/#97, and #108 three minutes after its last commit with its own workflow red); #108 left `main` red. Require at least Documentation assurance and Application assurance on `main`; add the compiled suite when `main` is green again. | Repository settings (owner) |
| Browser-suite stalls | Root cause: cold dev-server route compilation inside 5 s assertion windows (#113). Warm-up merged (#114, `d42c9f4`); compiled suite merged (#115, `62b8652`). Acceptance in progress: warm-up needs three consecutive green full runs, compiled suite five; no first-desktop-pass stall observed since. | [#113](https://github.com/deanrfiedler-gif/powerplants-one/issues/113) · [Warm-up](decisions/ci-browser-warm-up.md) · [Compiled suite](decisions/ci-compiled-browser-suite.md) |
| Migrations | 0001–0020 registered (0020 Engineering intake applied by PR #108); 0016 reserved for the Assistant branch. Separate hosted-only track `db/demo` proposed by PR #117 (0001 identity applied; 0002 Gmail connection not applied to the hosted database) | `scripts/migration-registry.ts` |

## 3. Domain state

"Merged" means on `main` with its package's recorded component evidence. No row implies independent review, owner acceptance of a business outcome, or production readiness.

| Domain | Merged on `main` | On a branch / PR | Design only | Not started |
|---|---|---|---|---|
| Service Operations (PP-01) | P01–P11: intake, work orders, scope/readiness, planner and reservations, job packs and acknowledgement, online and offline field capture, review and reports, Travel per [ADR-0018](decisions/ADR-0018-p11-travel-and-integrated-quality.md); Field Technicians r04 (#97, `79de842`, with the drawer focus-return fix). [P11 handover](delivery/p11-handover.md) | — | Job Pack r02 adopted (#104) | P12 — [starter](delivery/p12-starter-prompt.md) prepared only |
<<<<<<< HEAD
| CRM | I1 opportunities, I2 Board/List, r08 shell, r11 board polish, mobile journey, manual Leads with qualified-deal conversion (migration 0018), Email & Calendar persisted journey (migration 0015). Approved scope: [CRM report r02](decisions/crm-approved-scope.md) | Five-stage board review fixture — PR #122 (draft) | Opportunity handover contract (#55); Assistant design adopted (#65); Facility fields (#68); [pipeline stage model](decisions/crm-pipeline-stage-model.md) (#124) | Parity beyond Enquiry → Qualified / Open; owner transfer; PPO-009 (#9) |
| Estimating & Quotation | E1 manual estimate and exact draft quotation (migration 0012). [E1 handover](delivery/estimating-e1-handover.md) | — | E2 routing adopted (#78); quotation builder adopted (#77); guided wizard adopted (#79, `5542239`): [design](blueprints/estimating-wizard-design.md), [preview](blueprints/estimating-wizard-mockup.html), [decision](decisions/estimating-wizard-pilot.md) — design only; E1 runtime remains manual | E3–E6; real CREMS formulas and thresholds (D-009/D-010, #10) |
| Engineering & Design Control | Engineering r02 intake, history and scoped persistence (#108, `3efe6e1`, migration 0020, shell module live). **Merged with its own workflow red; its browser spec fails on `main` — see #125.** | — | r02 accepted | BP-05 remaining scope (#11) |
=======
| CRM | I1 opportunities, I2 Board/List, r08 shell, r11 board polish, mobile journey, manual Leads with qualified-deal conversion (migration 0018), Email & Calendar persisted journey (migration 0015). Approved scope: [CRM report r02](decisions/crm-approved-scope.md) | — | Opportunity handover contract (#55); Assistant design adopted (#65; #67 implementation closed stale, migration 0016 still reserved); Facility fields and mobile acceptance preparation (#68) | Parity beyond Enquiry → Qualified / Open; owner transfer; PPO-009 (#9) |
| Estimating & Quotation | E1 manual estimate and exact draft quotation (migration 0012). [E1 handover](delivery/estimating-e1-handover.md) | — | E2 routing adopted (#78); quotation builder adopted (#77); guided wizard adopted (#79, `5542239`): [design](blueprints/estimating-wizard-design.md), [preview](blueprints/estimating-wizard-mockup.html), [decision](decisions/estimating-wizard-pilot.md) — design only; E1 runtime remains manual; five container propositions proposed for review, nothing adopted: [decision](decisions/estimating-container-propositions.md), [study](blueprints/estimating-wizard-container-design.md) — prospective design for scope #79 defers | E3–E6; real CREMS formulas and thresholds (D-009/D-010, #10) |
| Engineering & Design Control | Nothing | Engineering r02 intake — PR #108 (draft, migration 0020; rebased on current `main`; shell component-review expectation corrected; leads, Email/Calendar and its own job still red pending their logs) | r02 accepted (decision on the PR branch only) | BP-05 scope (#11) |
>>>>>>> docs(estimating): propose five estimating container propositions with a design study
| Projects & Commercial Delivery | Gantt r10 register, manual multi-year schedules (migration 0019). [Handover](delivery/projects-gantt-integration.md) | — | r02 interactive review published (#81) | J1–J5 acceptance; Smartsheet transition (#12) |
| Supply Chain Management | Nothing | — | — | PPO-013 (#13) |
| Finance & Commercial Controls | P10 handoffs, allocations, synthetic targets, reconciliation, restricted OUT-14; stale-context guard on handoff screens (#111, `2988dde`). [P10 handover](delivery/p10-handover.md) | — | — | Real Finance definitions (D-017); MYOB evidence (#2) |
| Shared platform | Workspace/identity/grants/audit/receipts/outbox, desktop shell r05, login r02, Entra sign-in for the hosted demo; private demo package defined (#60); repository housekeeping record (#80) | Gmail connection schema and hosted migration track — PR #117 (ADR-0021 proposed on that branch); green except the three checks inherited from #108 | Customer portal CP1–CP5 (#50/#51) | Gmail OAuth routes, sync worker, message display, purge and negative-authorisation tests |

## 4. Open work and dispositions

| Group | Items | Next action |
|---|---|---|
<<<<<<< HEAD
| Feature integration | #117 Gmail connection schema (hosted track 0002) | Land the schema and operator changes before any Google configuration; merge only when `main` is green again and its full and compiled runs pass |
| Design adoption (docs) | #122 five-stage CRM board review fixture (draft) | Refresh and merge on green once `main` is green |
| Merged 11 September | #111, #97, #112, #114, #115, #104, #78, #60, #116, #80, #81, #68, #65, #77, #118, #119, #79, #123, #108, #124 | — |
=======
| Feature integration | #108 Engineering r02 (draft, migration 0020) | Fix from its three short job logs (leads, Email/Calendar, own job); merge only on green full and compiled runs; keep human-gated |
| Design adoption (docs) | PPO-010-CONTAINER-DEC — five estimating propositions (rule provenance, price binding, invariant placement, unknown amounts, money representation) | Decide each proposition on its merits; adoption of any one would widen the increment authorised under #79 and require the contract or policy changes the record lists. Nothing is superseded |
| Merged 11 September | #111 Finance guard, #97 Field Technicians r04, #112 STATUS snapshot, #114 route warm-up, #115 compiled suite, #104 Job Pack r02, #78 E2 routing, #60 demo package, #116 STATUS note, #80 housekeeping, #81 Projects r02 review, #68 Facility fields, #65 Assistant design, #77 quotation builder, #118 instructions length, #119 STATUS refresh, #79 guided wizard design | — |
>>>>>>> docs(estimating): propose five estimating container propositions with a design study
| Closed as superseded | #58, #82, #63, #67 and the automated CI-fix set #71 #74 #87 #93–#96 #98–#102 | — |
| Issues | **#125 `main` red after #108** — needs the Engineering job's browser failure block; #113 CI stall class — acceptance counts met, closing deferred until `main` is green; #85 closed against #86; #54 P11 authoritative record; PPO-002/009/010/011/012/013/015/016 remain discovery records | — |

Shared conflict points for any rebase: `docs/STATUS.md`, `docs/standards/document-register.csv`, `docs/standards/chatgpt-project-instructions.md` (8,000-character limit), `tests/browser/quality-states.spec.ts`. Any PR that adds a migration must reconcile against 0020 and the reserved 0016 in `scripts/migration-registry.ts`.

## 5. Decision state

D-003 is resolved for this personal prototype (Powerplants One, PPO, independent naming). D-004/D-022/D-029 are partially resolved; the other 25 master decisions remain open. [Current evidence treatment](prototype/decisions-and-evidence.md) separates useful design detail from operational closure evidence. The ADR sequence runs ADR-0001–0018 and ADR-0020; ADR-0019 was never allocated. Dean owns prototype decisions; proposed department roles assign no employees and establish no corporate sponsorship.

## 6. Boundaries that still hold

- Synthetic data and adapters only. No live MYOB, SharePoint, Pipedrive, Smartsheet or CAD integration, migration, customer communication or ERP posting exists.
- The hosted demo is a private tester environment with individual Entra sign-in, not a production service. Production startup is refused by the application.
- All 78 parent requirement IDs, issued baseline bytes and the P01–P12 order are preserved. Scope dispositions (24 Core, 25 Partial, 29 Deferred) are classifications, not completions.
- Full PT procedure status is recorded only when every written precondition and step has been executed; component counts in handovers are not parent-case passes.

## 7. Where to look next

| Question | Document |
|---|---|
| What is the selected first journey and its contracts? | [PP-01 package](prototype/README.md) |
| What is the ordered build and what is done? | [Implementation plan](delivery/prototype-implementation-plan.md) |
| What is the architecture and its limits? | [BP-02](architecture/BP-02-platform-architecture.md), [ADR-0003](decisions/ADR-0003-prototype-architecture.md) |
| What are the seven domains and 78 parents? | [BP-01 master blueprint](blueprints/BP-01-master-blueprint.md) |
| Which decisions exist? | [Decision control](decisions/README.md) |
| How do I run and verify locally? | README and the [P11 handover](delivery/p11-handover.md) |
| What happened before 11 September 2026? | [STATUS-log.md](STATUS-log.md) |
