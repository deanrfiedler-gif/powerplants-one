---
document_id: PPO-ES04-DES
title: Estimate Review and Pricing Exceptions design and receiving handover
date: 2026-09-17
owner: Dean Fiedler
status: Authorised standalone design; owner acceptance and runtime integration separate
source_commit: e1b705acc5457dab6fc0b6a2f0c977132cbd2215
versioning: git
---

# ES-04 estimate review and pricing exceptions

Dean authorised the recommended ES-04 HTML and professional detailed Markdown companion. The contribution covers the exact estimate basis, quantity/cost checks, pricing exceptions, findings/corrections, independent review, separate authorised estimate approval and prepared ES-05 handover. It does not adopt real pricing or delegation policy.

- [Interactive HTML r01](../reference/ui/estimate-review/PPO-Estimate-Review-and-Pricing-Exceptions-r01.html)
- [Detailed feature and design report r01](../reference/ui/estimate-review/PPO-Estimate-Review-and-Pricing-Exceptions-Report-r01.md)
- [Source and build](../design/estimate-review/README.md)
- [Verification and visual evidence](../testing/evidence/estimate-review-r01/README.md)

## Inspected authority

Main is `e1b705acc5457dab6fc0b6a2f0c977132cbd2215`, tree `60840d337b7646ee94805edf430cf91e2b10d968`. AGENTS, README, STATUS, naming/ADR-0005, ADR-0003, BP-04, the E1–E6 estimating sequence, r20 board, page register r06, ES-05 r02 and HTML conformance were inspected. STATUS contains dated historical rows; the live branch and PR reads supplied current publication state.

Adjacent open designs were inspected without merging them: Supplier Pricing #222 at `3bdb08cd1b78884eaa740a5434e3da55466626ee`, and Approvals Inbox #223 at `2ca71cb6bda629c98e9142cbc2bae1cfca061ccd`. ES-03's receiving handover explicitly names ES-04 as the next commercial-review boundary. These are reference interfaces, not imported fixture state or accepted runtime dependencies.

## Composition and scope conformance

| Declaration | Treatment |
|---|---|
| Existing scope | ES-04 in r06 page register; EST-03/04/05/07 with EST-02/06/08 context; existing E3 sequence |
| r20 types | Review / comparison; Work queue + persistent detail; supporting register, evidence and bounded correction forms |
| Reused components | Workspace-only header/context/tabs; navy/green tokens and embedded Roboto; restrained cards/pills; comparison; 448 px docked snapshot; native decision forms; responsive labelled rows |
| Incoming | Exact scope/option and submitted estimate; reviewed cost sources and quantity/run references; source completeness and supplied commercial authority |
| Outgoing | Separate revision-bound review, exceptions and estimate approval; one Prepared internal ES-05 handover |
| Departures | Six task-specific views and 320 px queue; authored, visibly fictional threshold/authority example; no new shell or universal approval rules |
| Exclusions | No application route, migration, integration, live policy adoption, customer output, issue, sending, receiving acceptance or deployment |

## Implementation choice and invariants

Reuse the existing standalone HTML/JavaScript/CSS pattern and deterministic Python builder. This keeps the requested artifact portable and the behavioural model independently verifiable. A new framework, server or application route would add unrequested scope. Browser-local storage supports review continuity only; runtime security and concurrency remain server responsibilities under ADR-0003.

Decimal inputs use scaled BigInt arithmetic and an explicitly disclosed half-up line convention. This is a bounded synthetic implementation, not a new operational money policy. Unknowns remain unknown; current submitted and approved contents are immutable; corrections create a successor without inherited review, exception decisions, approval or handover. All unresolved findings require a response and independent acceptance in this bounded example.

The demonstration policy is clearly fictional. Missing pricing rules and approval authority display Not configured and block approval. The source reviewer, estimate reviewer, estimate approver, quotation approver and receiving domain remain separate responsibilities. Static identity controls confer no real permissions.

## Receiving work

E3 runtime integration needs current source/mapping evidence, supplied policy and authority, server capabilities/scope, atomic expected-version commands, original-operation recovery and exact submitted/approved snapshots. ES-05 must independently validate incoming authority and retain its own quotation review/issue semantics. SH-06 links to the exact domain revision and derives completion from its owning service.

All 78 parent IDs, issued references, accepted UI baseline hashes and P01–P12 ordering remain unchanged. Owner acceptance, implementation and deployment are separate outcomes.
