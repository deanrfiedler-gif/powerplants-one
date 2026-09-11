---
document_id: PPO-010-E2-DEC
revision: r01
date: 2026-09-09
owner: Dean Fiedler - prototype owner
status: Design authorised; synthetic rule adoption pending
source_commit: f8035b5c55251da4da52430adf2f83094feccd6b
---

# E2 routing, alternatives and scoped questions — decision package

Dean's “Proceed” invokes the previously proposed **E2 design and rules package before implementation**. The outcome is a reviewable workflow, concrete policy tables, screen walkthrough and synthetic examples. It does not adopt the candidate business rules by implication. E1's [completed verification publication](https://github.com/deanrfiedler-gif/powerplants-one/pull/49#issuecomment-5562344440) is the dependency record; its historical passing commit is not a fresh test result for current main.

Delivery item: [E2 design #76](https://github.com/deanrfiedler-gif/powerplants-one/issues/76). This package is local to PPO-010 / [issue #10](https://github.com/deanrfiedler-gif/powerplants-one/issues/10), BP-04 E2 and existing EST-01/02/03, with preservation obligations for EST-08. It changes no master parent IDs, P01–P12 order, operational policy or acceptance status. D-009/D-010 and source gaps G02/G03/G04 remain open beyond this bounded candidate. No new technology, migration or ADR sequence slot is needed for design.

## Review the three proposed decisions

| Decision | Concrete recommendation for the synthetic prototype | Material consequence | State |
|---|---|---|---|
| E2-D01 / G02 | Adopt `SYN-E2-ROUTE-r01`: evaluate in order; unresolved decisive information stops route confirmation. Engineering, project management or unsettled scope lead to Full. Defined supply and fully classified service lead to Express. Require known prepayment for the service category. No route override in E2. | A service enquiry with unknown prepayment remains Needs clarification. This intentionally differs from the guide's Service Order fallback. There are no value, margin or discount thresholds. | Proposed |
| E2-D02 / G03 | Adopt `SYN-E2-OPTIONS-r01`: one selected option per opportunity workspace; saved revisions immutable; alternatives and selection may change while all commercial records are Draft. Any later commitment or unrecognised state holds workspace changes. | An exact draft quotation does not permanently prevent comparing alternatives. Its source and bytes never follow the new selection. Additive options, approvals and customer commitments remain outside E2. | Proposed |
| E2-D03 / G04 | Adopt `SYN-E2-QUESTIONS-r01`: existing Site/Facility IDs, three bounded work-system tags and the ten questions below. Save incomplete discovery with owned unknowns; require applicable mandatory answers to be confirmed before using a new snapshot as a manual-estimate basis. | Estimators can retain partial work. Scope/definition changes require a visible comparison and a new snapshot; old answers remain history. No configurator or Facility taxonomy is introduced. | Proposed |

Review [the design](../blueprints/estimating-e2-design.md), [receiving contract](../contracts/estimating-e2-design.md), [worked cases](../testing/estimating-e2-acceptance.md) and [interactive walkthrough](../blueprints/estimating-e2-walkthrough.html). Adoption should name these three policies and revision r01, or identify specific changes. Only then can the bounded runtime implementation proceed; this package asks for review of actual rules, not another approval of the discovery task.

## Evidence and adjacent work

| Evidence | What it supports | What it does not establish |
|---|---|---|
| [BP-04 section 4](../blueprints/BP-04-estimating-quotation.md#4-routing-and-scope), CRE-01/02 and guide p46 as assessed in the unchanged [evidence register](../blueprints/estimating-evidence.md) | Documented first-match routing, Full/Express entry and inherited route context. | Current tenant configuration, operational adoption or exact behaviour for every missing input. The original guide was not newly re-audited in this task. |
| BP-04 sections 5–6, CRE-03/04 and guide pp89–90 | Distinct commercial identities and broad branch locks, including draft quotations. | Authority to copy those locks unchanged. E2-D02 explicitly proposes a narrower Draft-only exploration rule. |
| BP-04 section 8 and CRE-05/06 | Published definitions, scoped questions and retained incompatible history. | Executable questionnaire definitions, Screen Systems formulas or production ranges. The ten questions and limits in this package are fictional policy candidates. |
| [E1 contract](../contracts/estimating-e1.md) at the source commit above | Immutable Estimate/Quote revisions, exact output and current relationship/receipt access. | General structured facilities, multi-option persistence or E2 acceptance. |
| [Facility r02 decision in PR #68](https://github.com/deanrfiedler-gif/powerplants-one/blob/ff90b8fcbff13a8b285d023fb2688d845358e567/docs/decisions/facility-field-proposal.md) | Dean already adopted separate structure/use/crop fields and explicit unknowns. Existing shared Facility IDs precede that extension. | Merged Facility field implementation. E2 uses the existing identity/name/site/parent subset and does not duplicate or re-approve FAC-D01–03. |
| Current main and open PR inventory inspected 9 September | E1 and shared UI contracts are available; other CRM/demo/assistant work is in separate branches. | A published Quotation Builder design was not found in this checkout or the open PR inventory. E2 specifies a proposed exact-source interface without claiming unseen builder choices were agreed. |

The separately discussed templates-first Quotation Builder is an adjacent receiving design. E2 supplies scoped facts and provenance; the builder owns customer narrative sections, terms/templates and optional later AI review. No real quotation, customer terms or pricing is copied into this synthetic package. E2 neither implements AI nor changes the earlier authority for that separate work.

## Delivery boundary

The design branch and review PR contain documentation and a standalone in-memory demonstration. They do not change `src/`, `db/`, migrations, grants, runtime tests or deployed code. Reviewable publication is within the requested repository work. Policy acceptance, runtime implementation, operational issue/send/acceptance, ERP effects, source import, migration, hosting and E3 remain outside this contribution.
