# Current prototype status

**Updated:** 11 September 2026 · **Owner:** Dean Fiedler · **Repository:** `deanrfiedler-gif/powerplants-one`, **public** visibility, default branch `main` · **Baseline commit:** `cb358405fd1837d70f92774fdf4db9e4dbe485e5` · **Naming:** [PPO-STD-001](standards/naming-conventions.md) / [ADR-0005](decisions/ADR-0005-project-naming-adoption.md)

This file is a snapshot of the current state, kept short enough to read in one sitting. It is not the evidence record: exact verification, run IDs, hashes and publication results remain in each package's handover, decision record and authoritative external record. The chronological entries that previously lived here are retained unchanged in [STATUS-log.md](STATUS-log.md). Update this file by replacing rows, not by appending narrative.

## 1. Stage in one paragraph

Powerplants One is Dean's personal synthetic prototype of a seven-domain operations platform. The PP-01 planned-service journey (P01–P11) is implemented and merged; P12 (recovery, restore and owner demonstration) is prepared only, so **PP-01 is not complete**. Bounded slices of CRM, Estimating, Projects and Email/Calendar are merged alongside it. A private Azure demo runs the current `main`. MYOB Acumatica, SharePoint, Pipedrive, Smartsheet and native CAD retain their operational roles; every external interface in the application is a simulated adapter. Company ownership, production approval and external write authority are not implied by anything below.

## 2. Baseline, verification and hosting

| Item | State | Evidence |
|---|---|---|
| `main` head | `cb358405` (merge of PR #110, 10 September 2026) | [Commits](https://github.com/deanrfiedler-gif/powerplants-one/commits/main/) |
| Full Application assurance | Last completed run **passed** on `355c015` (run 34487144248, 1 h 9 m, 9 evidence artifacts). Run 34525656699 on `cb358405` was in progress when this snapshot was written; `cb358405` differs from `355c015` only in the Azure operator Python code. | [Run 34487144248](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34487144248) · [Run 34525656699](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34525656699) |
| Focused workflows on `main` | Documentation, CRM refinements, Estimating E1, Email/Calendar journey, CRM Leads, Azure preparation checks all passed on `cb358405` | Actions history for the merge commit |
| Documentation checks | `check_foundation`, `check_prototype`, `check_naming` pass at `cb358405` (78 parents, 29 decisions, 30 PT procedures, 12 packages, 109 document records) | Local run, 11 September 2026 |
| Hosted Azure demo | **Deployed from `cb358405`** by manual run 34526927716 (`upgrade-and-deploy`, 10 September 2026 20:31 UTC, owner-confirmed). Database upgraded in place to migration 19 with records and invitations retained; `/healthz` returned 200 and anonymous CRM API access returned 401. **Pending:** owner sign-in on the new image, then a saved Leads record, Gantt schedule and Finance draft confirmed after reload. | [Run 34526927716](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34526927716) · [Runbook](delivery/azure-private-demo.md) · [Upgrade decision](decisions/azure-existing-demo-upgrade.md) |
| Branch protection | Not enabled. Checks are advisory; PR #110 merged while its full job was still running. | Repository settings |
| Browser-suite stalls | Two desktop-only first-pass stalls on 10 September (runs 34534398231, 34536514657) traced to cold dev-server route compilation inside 5 s assertion windows. Harness warm-up proposed; deadlines unchanged. A separate compiled-application browser workflow is proposed as an additional signal; the identity guard is unchanged. | [Warm-up](decisions/ci-browser-warm-up.md) · [Compiled suite](decisions/ci-compiled-browser-suite.md) |
| Migrations | 0001–0019 registered; 0016 reserved for the Assistant branch; 0020 proposed by PR #108 | `scripts/migration-registry.ts` |

## 3. Domain state

"Merged" means on `main` with its package's recorded component evidence. No row implies independent review, owner acceptance of a business outcome, or production readiness.

| Domain | Merged on `main` | On a branch / PR | Design only | Not started |
|---|---|---|---|---|
| Service Operations (PP-01) | P01–P11: intake, work orders, scope/readiness, planner and reservations, job packs and acknowledgement, online and offline field capture, review and reports, Travel per [ADR-0018](decisions/ADR-0018-p11-travel-and-integrated-quality.md). [P11 handover](delivery/p11-handover.md) | Field Technicians r04 — PR #97 (draft, needs rebase; only the full P01–P11 job failed) | Job Pack r02 — PR #104 (docs adoption) | P12 — [starter](delivery/p12-starter-prompt.md) prepared only |
| CRM | I1 opportunities, I2 Board/List, r08 shell, r11 board polish, mobile journey, manual Leads with qualified-deal conversion (migration 0018), Email & Calendar persisted journey (migration 0015). Approved scope: [CRM report r02](decisions/crm-approved-scope.md) | — | Opportunity handover contract (#55); Assistant AI1 (#65 design, #67 stale implementation, reserved migration 0016) | Parity beyond Enquiry → Qualified / Open; owner transfer; PPO-009 (#9) |
| Estimating & Quotation | E1 manual estimate and exact draft quotation (migration 0012). [E1 handover](delivery/estimating-e1-handover.md) | — | E2 routing (#78), guided wizard (#79), quotation builder (#77) | E3–E6; real CREMS formulas and thresholds (D-009/D-010, #10) |
| Engineering & Design Control | Nothing | Engineering r02 intake — PR #108 (draft, migration 0020, its own workflow and four others failing; not ready) | r02 accepted (decision on the PR branch only) | BP-05 scope (#11) |
| Projects & Commercial Delivery | Gantt r10 register, manual multi-year schedules (migration 0019). [Handover](delivery/projects-gantt-integration.md) | — | r02 interactive review (#81) | J1–J5 acceptance; Smartsheet transition (#12) |
| Supply Chain Management | Nothing | — | — | PPO-013 (#13) |
| Finance & Commercial Controls | P10 handoffs, allocations, synthetic targets, reconciliation, restricted OUT-14. [P10 handover](delivery/p10-handover.md) | Stale-context guard for Finance handoff screens — [PR #111](https://github.com/deanrfiedler-gif/powerplants-one/pull/111) (re-applied from superseded draft #63; awaiting pinned-toolchain CI) | — | Real Finance definitions (D-017); MYOB evidence (#2) |
| Shared platform | Workspace/identity/grants/audit/receipts/outbox, desktop shell r05, login r02, Entra sign-in for the hosted demo | — | Customer portal CP1–CP5 (#50/#51) | — |

## 4. Open work and dispositions

| Group | Items | Next action |
|---|---|---|
| Feature integration | #111 Finance guard; #97 Field Technicians; #108 Engineering | Merge #111 after full CI is green on its head; rebase #97 after it lands; repair #108 on its branch until its own job passes, then rebase |
| Design adoption (docs) | #104 Job Pack r02; #81 Projects r02; #78 E2; #77 quotation builder; #79 wizard; #68 facility fields; #60 demo package; #80 housekeeping | Rebase each on current `main`; expect conflicts in `docs/STATUS.md` and `docs/standards/document-register.csv` |
| Superseded | #58 (→ #59), #82 (→ #88), #63 (→ #111), #67 (stale; branch retained), Copilot CI-fix set #71 #74 #87 #93 #94 #95 #96 #98 #99 #100 #101 #102 (full job now passes on `main`) | Closed with a one-line disposition on each |
| Issues | #85 closed against merged PR #86; #54 P11 remains the authoritative publication record; PPO-002/009/010/011/012/013/015/016 remain discovery records | — |

Shared conflict points for any rebase: `docs/STATUS.md`, `docs/standards/document-register.csv`, `tests/browser/quality-states.spec.ts`. Any PR that adds a migration must reconcile against 0019 and the reserved 0016 in `scripts/migration-registry.ts`.

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
