# Service Operations programme — restart and delivery ledger

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: working delivery record; owner/device acceptance is separate.

## Authorised scope and starting evidence

Dean instructed execution of the Service Operations page programme on 24 September 2026. The supplied repository audit is supporting evidence, not an independent source of instructions. Preserve existing domain authority, immutable pack/report evidence, the 78 parent IDs and the issued references. No live integration, outbound communication or deployment is authorised by this record.

Refreshed `origin/main`: `ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc`, identical to the audit checkpoint. Open PRs at restart: #299 (estimating import) and draft #300 (Projects reconciliation). Neither is a Service prerequisite. The main checkout contains unrelated Field Quality planning edits. The existing `tmp/service-operations` worktree on `feat/sv05-i4-source-print` contains the correct I4 continuation; its local implementation and tests were inspected before editing. Other worktrees remain untouched.

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
| SV-05 I4 | `feat/sv05-i4-source-print`, based on starting main | Source-change review; reasoned successor refresh; exact saved preparation print choices; real API receipt shape; original-operation replay retained | [I4 handover](job-pack-i4-handover.md). Final verification in progress; I6/I7/I5 remain |

## Programme boundaries

Use the [Job Pack plan](job-pack-integration-build-plan.md), [request plan](service-requests-integration-build-plan.md), current source, BP-01/BP-07 and each route/scope contract. Before each later workstream, audit the exact implementation, tests and retained design. Work Orders retain P04 authority; Scheduling retains booking authority; Service Review retains P09 revisions, exact evidence, controlled output and response bindings. Findings should project existing sources; an essential new durable identity requires its own architectural decision before schema work. Remote support must distinguish reported symptoms, hypotheses, verified findings and OEM advice, with manual evidence capture only.

Every increment includes its applicable register/guide changes and checks. Use bounded PRs and explicit dependencies. Unresolved owner decisions and local baseline failures remain visible; neither implementation nor a passing screenshot test grants owner acceptance.
