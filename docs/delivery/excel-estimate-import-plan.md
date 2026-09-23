---
document_id: PPO-010-EXCEL-PLAN
date: 2026-09-15
owner: Dean Fiedler - prototype owner
status: Bounded implementation plan; runtime not started
source_commit: dcabfec1b5cde1c2cf220359e6cf1c63408512d6
versioning: git
---

# Excel estimate import implementation plan

## Position in delivery

This feature belongs to PPO-010 / BP-04 cost-source work, alongside E3. It does not create P13 or renumber E1–E6. A synthetic upload-to-draft slice can reuse E1 and verified E2 without adopting the later operational FX/landed-cost/approval policies. Formal quote issue remains E4; specialist native configuration remains E5; receiving handover remains E6. [Existing delivery sequence](estimating-implementation-plan.md).

Dean's current instruction authorises the design package. The next implementation task should invoke the bounded pilot below against actual current main, preserving concurrent work. No migration number, parser dependency, operational policy or paid service is reserved now.

## Ordered increments

| Step | Concrete deliverable | Dependencies and completion |
|---|---|---|
| 1. Template validation | Compare the standard tables with representative redacted workbooks; close field/precision/unit gaps; verify formula protection and recalculation in Excel. | Delivered workbook/assessment; actual examples and r19 theme source if its later changes affect the page. Record compatibility matrix, never silently infer unknown formulas. |
| 2. Read and review | Bounded upload/parser, current context resolution, line issues, source-row inspection and exact decimal reconciliation. | Actual E1/E2 receiving contracts; implementation ADR selecting a reviewed parser and limits. No estimate creation until whole-file validation. |
| 3. Controlled draft commit | Durable original workbook, immutable provenance/section sidecars, current-authority atomic new estimate/version and original-operation recovery. | Step 2; source-storage contract; additive migration with current registry/test lists reconciled; no grant changes. |
| 4. Revised workbook | Stable line mapping, full change comparison, explicit treatment of removals and PPO-only lines, successor history. | Step 3; concurrency/replay tests and unchanged original estimate/output evidence. |
| 5. Verified quotation continuation | Exact saved version to current Draft quotation with include/print reconciliation and internal-data exclusion. | Existing Draft output contract; server/DB/HTTP/browser/restart proof. E4 issue/approval remains outside this pilot. |
| 6. Capacity and richer sources | Profile and extend line/command limits, then individually specified FX, landed costs, pricing, mappings or options. | Representative large cases; E3 policy decisions; measured tests and separate bounded authorisation. Do not bypass the initial 100-line limit by splitting one estimate into silent fragments. |

Steps 2–5 may form one reviewable pilot issue/branch if small enough; split by dependency if review size warrants. No bulk speculative issues are created by this plan.

## Proposed first implementation task

Implement the [r01 import specification](../contracts/excel-estimate-import.md) for the supplied synthetic workbook, one permitted current Complete E2 option and one exact estimate version. Reuse current category schema, math, permission checks, receiving services, document adapter and receipts. Add durable import/source/section records as required. Treat quote include/print as a proposal for the exact resulting Draft, never a direct mutation of an older quotation. Deliver source parsing, review, atomic commit, re-import and original-operation recovery with no live integration.

Before coding, verify current branch/head and read AGENTS, README, STATUS, the exact cost-basis receiver, current migrations and applicable tests. Inventory existing import work to avoid duplication. Choose parser, retention/staging behaviour, section identity and expected-version lock strategy in the implementation ADR. Keep old schemas/commands/receipts intact. No migration slot or specific package version is asserted here.

Test XI-01–XI-08 from the specification, including parser errors, blank/zero, rounding, wrong context, permission revocation, ignored/hidden rows, concurrency, lost responses, source-store failures, exact originals, quote-safe projections and actual process restarts. Run the repository foundation/prototype/naming checks plus required application gates. Review the original desktop/mobile screenshots and evidence; publish a dedicated PR with actual source/main results and a durable handover.

## Design review checklist

- Estimator can follow inputs → calculation → export without duplicating specialist work.
- Source/file/line identities stay separate from user-friendly labels and row positions.
- One source workbook cannot falsely select a different customer/site/option.
- Original Excel values remain distinguishable after a reviewed adjustment.
- Every discrepancy is explainable; grand-total agreement cannot conceal line differences.
- Import, estimate review, quotation review, issue and customer acceptance stay distinct.
- Status text is truthful during reading, partial failure, saving and unknown result.
- The implementation can recover a source file and receipt without exposing inaccessible costs.
- Large-project capabilities have their own measured bounds and policy dependencies.

The current preview's in-memory receipts demonstrate interaction intent only. They are not evidence of atomic database saving, restart recovery or server permissions.
