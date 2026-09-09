---
document_id: PPO-010-E2-HO
revision: r01
date: 2026-09-09
owner: Dean Fiedler - prototype owner
status: Design package prepared; policy review pending; no E2 runtime implementation
---

# E2 design handover

Start with the [three proposed decisions](../decisions/estimating-e2-rules.md#review-the-three-proposed-decisions), then open the [walkthrough](../blueprints/estimating-e2-walkthrough.html). The [complete design](../blueprints/estimating-e2-design.md), [receiving/preservation contract](../contracts/estimating-e2-design.md) and [worked/acceptance cases](../testing/estimating-e2-acceptance.md) make the next implementation reviewable.

Work item: [E2 design #76](https://github.com/deanrfiedler-gif/powerplants-one/issues/76).

Source baseline: `f8035b5c55251da4da52430adf2f83094feccd6b`. E1 completion remains governed by its [actual publication](https://github.com/deanrfiedler-gif/powerplants-one/pull/49#issuecomment-5562344440). Its 7 September passes are not copied forward as fresh tests of this branch. Current main, relevant shared/E1 contracts, open PRs and the approved-but-unmerged Facility field decision were inspected. No published Quotation Builder package was located; its interface is explicitly proposed here.

## Review outcome required

Dean can adopt E2-D01, E2-D02 and E2-D03 for the named r01 synthetic policies, or identify a change. The decisions specifically cover stopping unknown prepayment, allowing alternatives while exact quotations are Draft, and retaining incomplete scoped discovery with confirmation before manual estimating. No employee reviewer or operational authority is fabricated. G02 pricing/approval, G03 broader commitments and G04 operational questionnaires remain unresolved even if this subset is accepted.

## Verification record

Validation is recorded after the targeted checks and visual inspection complete. Runtime, database, permission, persistence, customer-output and business acceptance cases in the E2 plan remain **Not run**. The preview makes no external calls, uses fictional data, stores nothing and resets on reload.

## Next implementation boundary

After concrete policy adoption, refresh actual main/active reservations and prepare one E2 implementation item. Formalise E1 identities additively; specify legacy command compatibility; implement route snapshots, exclusive options and scoped question snapshots under current permissions/receipts. Use the acceptance matrix for meaningful constraints, recovery, E1-original preservation and current regression. Do not infer approval from merging design documentation. Specialist formulas, pricing/approval, formal issue/send/acceptance, ERP effects, source imports, offline estimating, migration/cutover, hosting and E3 are outside this design contribution.
