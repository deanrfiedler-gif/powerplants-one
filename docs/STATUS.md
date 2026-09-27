# Current prototype status

**Updated:** 27 September 2026. **Owner:** Dean Fiedler. **Source checkpoint:** main `80b2f418b90a69d267ac2e65682a5b560a8b4356`, tree `5c9ee19d6af6e12b5cb5bf464338aacba9172059`. Public repository; private synthetic prototype and demo. Code delivery, functional proof, visual review, owner acceptance and deployment are separate facts.

**Naming authority:** [PPO-STD-001](standards/naming-conventions.md) and [ADR-0005](decisions/ADR-0005-project-naming-adoption.md).

## Current work

Current repository-writing session: `codex/pt28-compatible-update-proof`, continuing Dean's instruction to proceed on 27 September. Rehearse an actual local compiled application update from `80b2f41` / schema 0049 to the timer/return candidate / schema 0050, preserving old offline originals, exact receipts and issued pack bytes. Software rollback keeps schema and accepted outcomes; policy publication and full PT-28 remain separate. Execution results will be recorded after the rehearsal.

Dean authorised the [repository consolidation and service-verification decision](decisions/repository-consolidation.md) after the 27 September audit. The [execution ledger](delivery/repository-consolidation.md) records exact evidence and remaining work. Sequence: reconcile delivery records and unfinished migration allocations; complete the existing FI-01/FI-02 timer/offline branch; verify one continuous synthetic planned-service journey and retain performance/acceptance findings.

The original `docs/field-quality-build-plan` checkout and its uncommitted planning/reference edits are preserved. Consolidation uses `codex/repository-consolidation` from current main. Timer/offline continues in `feat/fi01-fi02-field-timer-offline`. No PR was open at preflight; unfinished local branches remain real work, not delivered functionality.

Publication: [baseline PR #320](https://github.com/deanrfiedler-gif/powerplants-one/pull/320) merged as `7451d30` on 27 September. [Timer/offline PR #321](https://github.com/deanrfiedler-gif/powerplants-one/pull/321) targets main. Its corrected source `a4f7322` passed [compiled browser CI](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/36310714597), including actual timer restart and 200% zoom; full application CI was still running at this checkpoint. The earlier two positive-Waiting failures and their clock-boundary correction remain recorded in the [evidence](testing/evidence/field-timer-native/README.md#compiled-ci-timing-correction).

The follow-up branch `codex/service-return-verification` completes the same-work-order return attendance on desktop and phone. Clean browser source `f1fa3fb` passed both journeys; restart source `83bccf1` retained 175 receipts, checked records across 61 tables and 36 exact files after actual application/PostgreSQL restart. The sole runtime change refreshes timer authority immediately after saved arrival. Earlier reserved customer responses and reconciled Finance outputs remain unchanged; the new reports have no inherited response. [Retained follow-up evidence](testing/evidence/field-timer-native/README.md#completed-service-return-follow-up) records source, failures and limits. Full PT-28/PT-30, performance and owner/device obligations remain open. This update deploys nothing.

## Verified repository and demo baseline

| Area | Observed state | Limit |
|---|---|---|
| Required checks | All seven configured protected contexts passed for `80b2f41`. [Application run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/36098609739) includes 434 units and 601 main database cases; [compiled browser run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/36098609686) passed 516 with 79 skips. | Component results do not close parent acceptance. |
| Fresh audit assurance | Foundation, prototype, naming and design-register checks passed; 24 focused units passed; all 78 parent dispositions preserved. | Documentation consistency and selected unit proof only. |
| Latest observed deployment | [Run 36204121972](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/36204121972), 26 September, deployed `80b2f41`. Database gate, selected web readiness/health and anonymous refusal passed; worker configured with the same digest. | Fresh signed-in record/output, actual worker execution, managed PostgreSQL minor and owner/device acceptance were not verified by this audit. Earlier signed-in evidence retains its original source. |
| Design register | 320 entries, 166 source routes, 28 components; no integrity errors. | 320 entry reviews and 28 component reviews pending; inspected captures remain distinct from acceptance. |
| Performance | Latest PT-27 compiled profile: all 16 groups missed the candidate 3-second p95, ranging 3.42–10.03 seconds. | Controlled CI observations, not Azure timing or causal diagnosis; [measurement contract](decisions/ci-performance-profiles.md) retains unchanged boundaries. |
| Complete PP-01 acceptance | P01–P12 implementation and the written PT-22 synthetic recovery procedure are delivered. | Full PT-28/PT-30 and owner/device/accessibility obligations remain open; [P12 handover](delivery/p12-handover.md) and [procedures](testing/prototype-acceptance.md) define the remainder. |

## Delivered source and remaining programme

| Programme | Current source | Next boundary |
|---|---|---|
| Shared platform and development workspace | SH search/views/notifications/review coordination and the Git-backed development workspace are merged. [SH handover](delivery/sh-platform-handover.md), [workspace](design/development/README.md). | Source adapters, canonical teams, guide/visual review and owner acceptance remain scoped separately. |
| Customers and locations | Native CS programme, including Facilities and durable readiness, is merged. [Handover](delivery/cs-native-completion-handover.md). | Operational definitions, live integration and owner/device review. |
| Equipment | EQ-01–09 merged through #302; migration 0045. [Handover](delivery/equipment-native-completion-handover.md). | Owner/device review and operational acceptance. |
| Sales | CR-01–05 native work merged through #303; migration 0046. [Handover](delivery/sales-native-completion-handover.md). | Dependent quotation/agreement sources, policy and owner acceptance. |
| Engineering | EN-01–05 control foundation/pages merged through #305/#307; migration 0047. EN-06/07/08 retain existing native engines. [Handover](delivery/engineering-native-control-handover.md). | Technical authority, family review and owner acceptance remain separate. |
| Estimating | Wizard, Screen Systems, fertigation, workload and cost-source increments are merged. ES-01 design adoption is included in `80b2f41`; cost sources use migration 0048. [Programme](delivery/estimating-programme-handover.md). | Excel import; ES-04–07/09–10; accepted Screen geometry programme; ES-02 outstanding decisions and source obligations. |
| Scheduling | S1–S5 and the #315 refinement are merged. [Handover](delivery/scheduling-resources-handover.md). | Owner/device review and integrated service narrative. |
| Service | Request register I1/I2 and Job Pack I1–I7/final I5 are merged. Selected same-work-order return journeys and persistence are proved on the follow-up branch. [Programme ledger](delivery/service-operations-programme.md), [Job Pack handover](delivery/job-pack-integration-handover.md). | Request record/capture refinements, remaining SV scopes, PT-28 and complete PT-30 prerequisites. ADR-0043 lifecycle proposal remains separate. |
| Field and quality | FI-05 assigned-visit readiness merged in #316. Timer/offline 0050 is in #321; immediate arrival refresh and complete return evidence are on the follow-up branch. [Programme](delivery/field-quality-native-handover.md). | PR integration and owner/device review remain separate. Closed-visit arrival guidance still needs refinement; FI-03/04 inspections and FI-06 incidents remain later work. |
| Supply Chain | SC-01–10 merged through #317; migration 0049. [Handover](delivery/supply-chain-native-handover.md). | Synthetic coordination only; ERP authority, visual/device and business acceptance remain separate. |
| Projects | Existing project/programme/acceptance foundations plus A0 reconciliation are merged. [Programme](delivery/projects-completion-programme.md). | A1–A8 programme remains; PJ-07 controlling r02 source gap remains explicit. |
| Maintenance, Products and Excel import | Unpublished local implementation exists in dedicated branches. | Preserve work; reconcile source, migrations and complete checks before PR publication. No completion or deployment inferred. |
| Finance and external systems | Existing P10 controlled synthetic Finance handoff/reconciliation. | MYOB tenant evidence and live integration remain unproven; SharePoint and CAD authority unchanged. |

## Integration and open obligations

- Preserve applied Supply migration **0049**. Allocate **0050 timer/offline**, **0051 Maintenance/Warranty**, **0052 Products**, reconciling each complete branch against its predecessors. The unpublished Maintenance/Products 0049 proposals must not be applied as merged migrations. Update registry, seed/grant consumers, exact upgrade assertions and hosted upgrade evidence together. See the [decision](decisions/repository-consolidation.md).
- Open issues are retained for their exact remaining obligations. #120/#121 and older delivery records need evidence reconciliation, not automatic reimplementation or blanket closure. #145/#167 retain verification/acceptance boundaries. #160 retains the managed PostgreSQL minor check. Source/policy work in #2/#10/#12/#13/#15/#16/#66/#76 remains separately scoped.
- The master [decision register](decisions/decision-register.csv), current domain decisions and [product-quality plan](delivery/product-quality-plan.md) retain their authority. Unresolved operational policy, CREMS formulas, MYOB evidence, role authority and source gaps must not be inferred from synthetic fixtures.
- The maintained [project instructions](standards/chatgpt-project-instructions.md), [naming standard](standards/naming-conventions.md), [blueprint](blueprints/BP-01-master-blueprint.md) and [development workflow](design/development/README.md) govern implementation. Missing visual review stays visible; no fingerprint is invented.

## Boundaries and history

All interfaces and fixtures remain synthetic. No production integration, operational migration, business transaction or customer communication is authorised by repository delivery. MYOB remains intended ERP authority, SharePoint business-document authority, and native CAD the authoring authority. The application refuses production startup.

All 78 parent IDs and issued reference bytes are preserved. The 24 Core, 25 Partial and 29 Deferred dispositions are scope classifications, not completions. A green check is component evidence; the private demo is not a production-readiness claim.

The full preceding snapshot is preserved unchanged in [STATUS-log.md](STATUS-log.md). Earlier branch, unmerged-PR, migration-number and deployment statements there retain their dates and must not override current source or GitHub evidence. Exact package observations remain in their original handovers.
