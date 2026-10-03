# Service Operations programme — restart and delivery ledger

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: working delivery record; owner/device acceptance is separate.

## Current acceptance checkpoint — 3 October 2026

PR [#337](https://github.com/deanrfiedler-gif/powerplants-one/pull/337) is merged as `6e8b898aeb150b0a4b42c3087605556a057986ad` at `2026-10-03T03:45:54Z`; all 18 final-head checks passed on `41c6f2c909947e93608a2850198b374de671f1e4`. FI-03/04 #334, FI-06 #335, FI-07 #336 and Scheduling Step 6 #333 are also merged. Dated pending/next-increment statements elsewhere in this handover retain their original checkpoints and are superseded for current integration by this paragraph. Post-merge checks are recorded separately in the [current execution ledger](../testing/evidence/field-integrated-acceptance/README.md).

The [acceptance/prerequisite ledger](../testing/field-integrated-acceptance-ledger.md) maps every written PT to its exact source, evidence scope, remaining obligation and owner. Step 6's bounded written PT-28 pass is retained; full PT-30/PP-01, PT-27 findings and actual independent/owner acceptance remain open. The [current-build owner session](field-integrated-owner-walkthrough.md) and [benefit instrument](../testing/field-benefit-measurement.md) are prepared separately from technical execution. No merge or deployment of this acceptance increment is authorised or performed.


## Authorised scope and starting evidence

Dean instructed execution of the Service Operations page programme on 24 September 2026. The supplied repository audit is supporting evidence, not an independent source of instructions. Preserve existing domain authority, immutable pack/report evidence, the 78 parent IDs and the issued references. No live integration, outbound communication or deployment is authorised by this record.

Refreshed `origin/main`: `ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc`, identical to the audit checkpoint. Open PRs at restart: #299 (estimating import) and draft #300 (Projects reconciliation). Neither is a Service prerequisite. The main checkout contains unrelated Field Quality planning edits. The existing `tmp/service-operations` worktree on `feat/sv05-i4-source-print` contains the correct I4 continuation; its local implementation and tests were inspected before editing. Other worktrees remain untouched.

A second fetch before I6 found main at `6c5e7c4fcbaf05d712a46989faf2cf7cabb8ba72`: #299 and #300 had merged. The inspected delta is estimating/Projects and shared documentation/register work, with no Service implementation. I6 is explicitly stacked on I4 (`899dd6e`); later integration must retain those unrelated records.

I4 #304 subsequently merged as `9e49a57332aacfbb45a43fdd4d17c1d031fc80fb` with all 18 checks successful, including standard database, HTTP and compiled browser suites. I6 was reconciled with that main before publication. This supersedes the initial local test limits as the release regression signal; those local observations remain recorded honestly.

## Reconciled programme

| Scope | Starting source state | Next bounded work |
|---|---|---|
| SV-01 | Native read model I1 merged in #298; request routes exist | I2 native register, I4 advisory matching, I5 conformance |
| SV-02 | Current three-state record exists | Shared I3 native record |
| SV-03 | P04 register/create/detail and commands exist | Current-source integration plan, then refine |
| SV-04 | Scheduling-backed appointment detail exists | Coverage matrix and permitted refinements |
| SV-05 | I1 #256, I2 #257 and I3 #288 merged | I4 → I6 → I7 → I5 |
| SV-06 | P09 review/report routes and controlled outputs exist | Native queue/record integration |
| SV-07 | No dedicated `/service/findings` route | Scoped projection over authoritative follow-ups |
| SV-08 | No dedicated `/service/escalations` route or exact accepted HTML | Domain audit and bounded contract/design before implementation |

ADR-0043 remains **Proposed, not accepted**. SV-01/SV-02 must retain New, NeedsInformation and Triaged. No lifecycle migration, new lifecycle command or capability is authorised through that proposal. Continue independent scopes. A route's existence, functional proof, visual review, owner acceptance and deployment are separate facts.

## Delivery ledger

| Increment | Branch / dependency | Implementation | Verification / remaining |
|---|---|---|---|
| SV-05 I4 | `feat/sv05-i4-source-print`, based on starting main | Source-change review; reasoned successor refresh; exact saved preparation print choices; real API receipt shape; original-operation replay retained | [I4 handover](job-pack-i4-handover.md). Compiled conformance 17 passed / five deliberate skips; real main journeys passed on desktop/phone; remaining local test limits recorded. [PR #304](https://github.com/deanrfiedler-gif/powerplants-one/pull/304); I6/I7/I5 remain |

I6 on `feat/sv05-i6-structured-sections` is a stack after I4. It adds the adopted pure formatter, permission-scoped projection, exact-text proof/fallback and structured saved sections. Six unit cases, three focused database cases, a pre-I6-created revision Check and 22 compiled browser cases pass; six browser skips avoid duplicate width coverage. [I6 handover](job-pack-i6-handover.md) records the environment and acceptance limits. I7 and I5 remain.

I7 continues on `feat/sv05-i7-presentation`, stacked on I6 PR #306, using the existing Service worktree and locked tooling. [I7 handover](job-pack-i7-handover.md) records the adopted title, readiness and staff history refinements. I5 remains the final Job Pack increment.

## Programme boundaries

Use the [Job Pack plan](job-pack-integration-build-plan.md), [request plan](service-requests-integration-build-plan.md), current source, BP-01/BP-07 and each route/scope contract. Before each later workstream, audit the exact implementation, tests and retained design. Work Orders retain P04 authority; Scheduling retains booking authority; Service Review retains P09 revisions, exact evidence, controlled output and response bindings. Findings should project existing sources; an essential new durable identity requires its own architectural decision before schema work. Remote support must distinguish reported symptoms, hypotheses, verified findings and OEM advice, with manual evidence capture only.

Every increment includes its applicable register/guide changes and checks. Use bounded PRs and explicit dependencies. Unresolved owner decisions and local baseline failures remain visible; neither implementation nor a passing screenshot test grants owner acceptance.

I5 continues on `feat/sv05-i5-integration` after I7 PR #309. The refreshed main remains `9e49a57`; concurrent Sales, Equipment, Engineering and Estimating PRs are independent. [Final Job Pack handover](job-pack-integration-handover.md) records implementation and verification without closing the remaining SV-01–SV-08 workstreams.
