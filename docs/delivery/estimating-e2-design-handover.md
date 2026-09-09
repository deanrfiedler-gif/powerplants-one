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

Publication: [review PR #78](https://github.com/deanrfiedler-gif/powerplants-one/pull/78). Its maintained description records the final design verification and owner-review state; it does not establish policy adoption.

Initial contribution `9e03779684460606d7a2e052e66f2e6e886853c5`, tree `e26c1eba35f1ee568ae61ba0415c74ad32c5d260`: documentation [34347023133](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34347023133) and design [34347023394](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34347023394), attempt 1, passed. E2's 29 routing fixtures and seven grouped standalone browser procedures passed; eight original screenshots were hash-checked. Executed merge checkout `4fbd60cf478f4003614ff2d108f61804b6ffbb77`, Chromium 153.0.8010.12. Artifact 10102139313: 2,190,190 bytes, SHA-256 `ffcf8853d354873982e65aa2ca7c21a0f9bfe05d9b7c9dec9014b2d093520092`.

Manual inspection covered desktop route/options, 390px options, 320px comparison/unknown/long scope. It identified a dirty label that updated only on blur and a scrolled capture position. The follow-up marks edits immediately, clears newly restored conditional answers, labels the independent Option A scope example explicitly and captures from the top. Existing assertions remain, with checks added for these concrete findings. Final rendered results are recorded in PR #78 after that follow-up completes. A five-row CSV-width correction and the copy-ready instruction length correction are documentation-only.

Local foundation/prototype/naming checks and the model fixtures passed. Local browser installation failed due cache locks and download timeout/502 responses; rendered evidence comes from the pinned GitHub workflow, not a local browser claim. Runtime, database, permission, persistence, customer-output and business acceptance cases in the E2 plan remain **Not run**. The preview makes no external calls, uses fictional data, stores nothing and resets on reload.

## Next implementation boundary

After concrete policy adoption, refresh actual main/active reservations and prepare one E2 implementation item. Formalise E1 identities additively; specify legacy command compatibility; implement route snapshots, exclusive options and scoped question snapshots under current permissions/receipts. Use the acceptance matrix for meaningful constraints, recovery, E1-original preservation and current regression. Do not infer approval from merging design documentation. Specialist formulas, pricing/approval, formal issue/send/acceptance, ERP effects, source imports, offline estimating, migration/cutover, hosting and E3 are outside this design contribution.
