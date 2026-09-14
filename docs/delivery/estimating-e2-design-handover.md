---
document_id: PPO-010-E2-HO
revision: r02
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Adopted subset reconciled; no E2 runtime implementation
---

# E2 design handover

Start with the [adopted audit package](../decisions/audit-follow-through-policy-package.md) and current [E2 decisions](../decisions/estimating-e2-rules.md). The unchanged [walkthrough](../blueprints/estimating-e2-walkthrough.html) is explicitly historical declared-model design, not the r02 runtime oracle. The [complete design](../blueprints/estimating-e2-design.md), [receiving/preservation contract](../contracts/estimating-e2-design.md) and [worked/acceptance cases](../testing/estimating-e2-acceptance.md) make the next implementation reviewable.

Work item: [E2 design #76](https://github.com/deanrfiedler-gif/powerplants-one/issues/76).

Source baseline: `f8035b5c55251da4da52430adf2f83094feccd6b`. E1 completion remains governed by its [actual publication](https://github.com/deanrfiedler-gif/powerplants-one/pull/49#issuecomment-5562344440). Its 7 September passes are not copied forward as fresh tests of this branch. Current main, relevant shared/E1 contracts, open PRs and the approved-but-unmerged Facility field decision were inspected. No published Quotation Builder package was located; its interface is explicitly proposed here.

## Current adopted subset

Dean adopted E2-D02/D03 and DR-01/02 in the audit follow-through. The r02 documents retain Draft-only exclusive options, immutable answers, owned unknowns and deliberate resnapshot while removing route confirmation before option creation and forced branching after route changes. Effort remains separate. Routing displays Not configured until rules are adopted; this does not block drafting. Equipment uses existing same-site IDs and Allowance is an explicit new-version flag separate from category and quote include/print. The E1 contract now defines schema-1 preservation and schema-2 extension obligations. No employee reviewer or operational authority is fabricated. G02 pricing/approval, G03 broader commitments and G04 operational questionnaires remain unresolved even if this subset is accepted.

## Verification record

The 14 September r02 is contract reconciliation only; no schema, API, parser, output or issued reference is changed. Run documentation checks for this contribution. Historical route fixtures remain unchanged and do not prove adopted route policy. Runtime E2, category/allowance and equipment acceptance remain Not run.

### Historical design verification

Publication: [review PR #78](https://github.com/deanrfiedler-gif/powerplants-one/pull/78). Its maintained description records the final design verification and owner-review state; it does not establish policy adoption.

Initial contribution `9e03779684460606d7a2e052e66f2e6e886853c5`, tree `e26c1eba35f1ee568ae61ba0415c74ad32c5d260`: documentation [34347023133](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34347023133) and design [34347023394](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34347023394), attempt 1, passed. E2's 29 routing fixtures and seven grouped standalone browser procedures passed; eight original screenshots were hash-checked. Executed merge checkout `4fbd60cf478f4003614ff2d108f61804b6ffbb77`, Chromium 153.0.8010.12. Artifact 10102139313: 2,190,190 bytes, SHA-256 `ffcf8853d354873982e65aa2ca7c21a0f9bfe05d9b7c9dec9014b2d093520092`.

Manual inspection covered desktop route/options, 390px options, 320px comparison/unknown/long scope. It identified a dirty label that updated only on blur and a scrolled capture position. The follow-up marks edits immediately, clears newly restored conditional answers, labels the independent Option A scope example explicitly and captures from the top. Existing assertions remain, with checks added for these concrete findings. Final rendered results are recorded in PR #78 after that follow-up completes. A five-row CSV-width correction and the copy-ready instruction length correction are documentation-only.

Local foundation/prototype/naming checks and the model fixtures passed. Local browser installation failed due cache locks and download timeout/502 responses; rendered evidence comes from the pinned GitHub workflow, not a local browser claim. Runtime, database, permission, persistence, customer-output and business acceptance cases in the E2 plan remain **Not run**. The preview makes no external calls, uses fictional data, stores nothing and resets on reload.

## Next implementation boundary

Under the recorded continuing authority, refresh actual main/active reservations and prepare one E2 implementation item. Formalise E1 identities additively; specify legacy command compatibility; implement effort evidence, exclusive options and scoped question/equipment snapshots; reserve future advisory observations for an adopted rule set under current permissions/receipts. Use the acceptance matrix for meaningful constraints, recovery, E1-original preservation and current regression. Do not infer approval from merging design documentation. Specialist formulas, pricing/approval, formal issue/send/acceptance, ERP effects, source imports, offline estimating, migration/cutover, hosting and E3 are outside this design contribution.
