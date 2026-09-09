# Current prototype status

**Updated:** 9 September 2026 · **Owner:** Dean Fiedler · **Repository:** personal/public · **Inspected main:** `f8035b5c55251da4da52430adf2f83094feccd6b`.

Powerplants One is a synthetic prototype covering seven domains. Public source visibility is separate from private demo access. Merged implementation, passing checks, deployed source and business acceptance are distinct.

## Current delivery position

| Workstream | Position at this checkpoint | Evidence and next action |
|---|---|---|
| Service foundation P01–P10 | Bounded implementations are merged; full PP-01 acceptance is incomplete. | [Implementation plan](delivery/prototype-implementation-plan.md), [P10 handover](delivery/p10-handover.md). Preserve existing source-specific publication evidence. |
| P11 integrated quality | Implementation and subsequent mobile repairs are in main. Issue #54 and repair PR #63 remain open; complete publication/acceptance is not inferred from a merge. | [P11 handover](delivery/p11-handover.md), [issue #54 publication](https://github.com/deanrfiedler-gif/powerplants-one/issues/54#issuecomment-5567364667). Reconcile remaining repairs and failed-run dispositions. |
| P12 recovery and owner demonstration | Prepared only. | [P12 starter](delivery/p12-starter-prompt.md). Its stated P11 dependency and separate invocation remain. |
| CRM I1/I2 and mobile | I1/I2 and mobile PR #61 are merged. #61 merged at `fab85c568f8b72dfe19c7ef1dd6195ba1f340d14`; its three merged-main workflows passed. Broader CRM parity and owner acceptance remain open. | [Mobile handover](delivery/mobile-crm-handover.md), [PR #61](https://github.com/deanrfiedler-gif/powerplants-one/pull/61), [merged-main Application run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34283234478). |
| Manual estimating E1 | Bounded implementation is merged; current-main E1 assurance passed. E2 rules design is open in PR #78; no E2 runtime is claimed. | [E1 handover](delivery/estimating-e1-handover.md), [E2 starter](delivery/estimating-e2-starter.md), [E2 design PR #78](https://github.com/deanrfiedler-gif/powerplants-one/pull/78), [current-main E1 run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34310303868). Full BP-04/rule evidence and acceptance remain open. |
| CRM, Email/Calendar and Azure demo integration | Draft PR #73 contains the exact heads of #64, #69 and #72. All eight workflows passed at `93828dd898b55af8b8d2361983a8f554160d369d`; integration is not merged. | [PR #73](https://github.com/deanrfiedler-gif/powerplants-one/pull/73), [passing Application run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34336965713). Complete its review and record actual deployed source separately. |
| r11 CRM polish | Draft PR #75 is active and targets #73's integration branch. Latest inspected head: `8aa6c01f1b839c02b70fd4ba7b0c1176db9b65a2`. | [PR #75](https://github.com/deanrfiedler-gif/powerplants-one/pull/75). Preserve ongoing UI work and its own visual/runtime verification. |
| Quotation Builder and estimating wizard | Template-first Quotation Builder #77 and wizard pilot #79 are open design contributions; no implementation or merge is claimed here. | [PR #77](https://github.com/deanrfiedler-gif/powerplants-one/pull/77), [PR #79](https://github.com/deanrfiedler-gif/powerplants-one/pull/79). Follow their design review and synthetic evidence. |
| Assistant, Facility, Projects and portal | Assistant #65/#67 and Facility #68 remain open. BP-06 Projects and portal designs are in main; J1/CP1 runtime readiness remains separate. | [Housekeeping PR dispositions](delivery/repository-housekeeping.md), [Projects handover](delivery/projects-discovery-handover.md), [portal handover](delivery/customer-portal-handover.md). Retain unique work and decisions. |

## Current-main checks and demo boundary

On inspected main, [Documentation assurance](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34310303972), E1 assurance and the [read-only Azure connection check](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34310429878) passed. The Azure connection is therefore verified, superseding earlier pending connection notes.

[Application assurance 34310303883](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34310303883) failed one diagnostic replay job: `quality-states.spec.ts` reported `apiRequestContext.fetch: socket hang up`. The other four jobs, including the full application/PostgreSQL job, passed. Current main is not described as wholly green. The eight passing workflows on #73 are evidence for that PR head, not for main.

Main contains the local synthetic runtime and read-only Azure connection workflow. The separate [demo integration record](https://github.com/deanrfiedler-gif/powerplants-one/pull/73) records owner-run provisioning, an existing image digest and subsequent operator fixes. This checkpoint does not independently verify the currently running cloud image, Microsoft sign-in or device acceptance. Updating source documentation does not deploy the application or change tester access.

## Scope and decisions retained

- Follow adopted **PPO-STD-001** and [ADR-0005](decisions/ADR-0005-project-naming-adoption.md). Preserve all 78 parent requirement IDs, seven domains, source bytes and P01–P12 ordering. Older private-prototype wording in issued sources and historical decisions records their original context.
- MYOB remains the intended ERP authority; SharePoint owns business documents; native CAD retains authoring responsibilities. No operational migration or source-system cutover follows from prototype delivery.
- P11's approved whole-minute Travel is NonBillable/no-posting under [ADR-0018](decisions/ADR-0018-p11-travel-and-integrated-quality.md); Labour treatment and original Finance/output history remain separate.
- PPO-009 CRM is distinct from P09 Service review. Full account parity, owner transfer policies, Facility acceptance and six-stage sales behaviour must follow their own current contracts.
- Performance candidate targets, real-device/screen-reader review, owner acceptance and full PT-30/P12 proof are not promoted to complete by this status refresh.

## Maintenance and historical evidence

[Repository housekeeping](delivery/repository-housekeeping.md) records the authorised documentation cleanup, 27 completed merged-branch retirements and open-PR dispositions. CI optimisation and runtime changes remain separate work.

The [exact previous STATUS](https://github.com/deanrfiedler-gif/powerplants-one/blob/f8035b5c55251da4da52430adf2f83094feccd6b/docs/STATUS.md) preserves all earlier chronological observations and links. Read it as history, including superseded unmerged/pending statements. Detailed failure evidence remains in the existing P11 and mobile handovers; the [prototype decision/evidence treatment](prototype/decisions-and-evidence.md) retains the distinction between prototype choices and operational closure.
