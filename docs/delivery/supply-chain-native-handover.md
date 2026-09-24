# Native Supply Chain implementation handover

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: implementation and verification in progress on `feature/supply-chain-native`; no merge, deployment or owner acceptance claimed.

## Baseline and scope

Fetched main: `0f10b7fb46a8ab512e9b019573ece272cf5920b9`. Tree: `a5b0624f19205909e67b83b437bc1edb79510f3a`. GitHub initially had only PR #314 (ES-02 design board) open. It overlaps shared status/design/document registers, not Supply Chain runtime. Recent merged native Customer, Equipment, Sales, Engineering and Scheduling work was inspected. Issue [#13 / PPO-013](https://github.com/deanrfiedler-gif/powerplants-one/issues/13) remains the broad package; no production transaction or customer communication was authorised.

The original local checkout contains unrelated uncommitted Field/Quality work. This contribution uses an isolated worktree and leaves those changes intact. Another local session was running Field database tests and a build. Supply verification therefore uses a disposable loopback PostgreSQL instance on port 5549 with the required database name `ppo_synthetic_test`, and application port 3059. Neither the other session's processes nor its database were reset.

## Implementation

[BP-08](../blueprints/BP-08-supply-chain.md) and [ADR-0049](../decisions/ADR-0049-native-supply-chain.md) describe the closed native domain, ten routes and seven rail mappings. Migration 0049 adds UUID identities, scoped demand/supply/return/custody aggregates, exact decimal allocations, immutable facts/revisions, durable image references and six narrowly named Supply capabilities. Seed 49 reuses existing fictional identities; it does not add hosted access or reinstate revoked grants. The existing Finance visibility/reconciliation capabilities protect credit observations.

The ten page-specific guides are available through the global information icon. Current development register entries retain source provenance and Draft review status. SC-10 has a new native design contract because it had no exact historical image/HTML. SC-08 retains the historical warning about its unpublished authoring package and conflicting HTML hashes; native tests are new evidence only.

## Verification record

Targeted database verification: **10/10 passed**, including actual Field consumption and custody reconciliation, restart recovery, scope, replay/conflict, Project split-shipment/quarantine, concurrent allocations, fulfilment/outstanding, return remedy versus recovery, restricted credits, original external-operation reconciliation, unchanged confirmed Service appointment and exact durable PNG access. Later browser-driven refinements are undergoing the final regression run.

Full unit suite: **426/430 passed**. Four Windows filesystem/path failures in `document-store.test.ts` (two), `recovery.test.ts` and `warm-routes.test.ts` reproduce on unchanged main `2173cc64eed54b1e3fb8334495f7cd924206d13f` (3/7 passed, the same four failures). Supply HTTP contract passed. Lint, TypeScript, application build, foundation, prototype and the 107-group access-review model check passed before the final browser refinements. Naming identified the 8,000-character project-instruction limit; the copy has been shortened for final recheck.

Mobile verification has passed receipt/correction/focus return, pick/stage/partial POD and original-operation recovery after a lost accepted response. The full 56-case, four-width run is in progress. A reused dialog initially lacked host-scoped styling, and refresh removed the focus-return target; both were fixed within the Supply host. A prior local run was interrupted by a multi-hour runner suspension; its elapsed-time failures are not counted as successful verification. The broad database run and clean reruns are pending.

The first sandboxed Node/tsx attempts failed before loading tests with `uv_os_get_passwd ENOMEM`. Unsandboxed local runs loaded and executed normally. This is recorded as a local tool failure, not an application regression. Next's first worktree launch could not resolve its package inside the new checkout; installing the existing locked dependencies locally is environment setup, not a dependency change.

Pending checks: final lint/typecheck/database/HTTP/build, all-route responsive browser captures, design/register/naming assurance, migration/reseed/upgrade preservation and final Git diff review. No test pass or screenshot has been used to mark a design review accepted.

Main was reconciled with the ES-02 design-board merge at `2173cc64eed54b1e3fb8334495f7cd924206d13f`, tree `c7d9f5402c8d09dc6d37df0cb7d81ecd0d507276`. PRs #315 (Scheduling refinement) and #316 (FI-05) were audited; they have no migration collision but overlap shared status/register/receipt files. Their unrelated work is preserved. Review increments: `d75377f` persistence/API; `420fd5e` native workspaces/guides; `8b74caa` verification; `3bb510c` working documentation.

## Traceability and boundaries

SCM-01–SCM-08 and SVC-09; IF-11–IF-16; D-005/D-006/D-015/D-017; AT-16/AT-29/AT-31. Allocation and custody constraints are local synthetic coordination rules, not MYOB transaction semantics. Manual origin/release/quotation/warranty references are explicitly evidence where verified receiving contracts are absent. Scheduling owns actual proposed intervals/crew and document owners own reissue. Supply Chain creates an owned review Activity and leaves current downstream records untouched.

Open source/business policy: live ERP mappings and authority, observation-age thresholds, unit conversion dictionary, reservation policy, commercial visibility adoption, customer acknowledgement medium, partial-dispatch policy, source shipment semantics and credit/financial definitions. Unsupported source commands remain Not configured. No automatic netting, loss calculation, invoice, payment, stock posting, installation, booking or customer communication is implied.
