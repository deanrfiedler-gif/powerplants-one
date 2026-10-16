# PJ-06 specialist package coordination

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Decision: 15 October 2026. Status: user-authorised synthetic backend increment; verification and independent review recorded separately.

Dean explicitly authorised PJ-06 implementation while the existing monitor owns #500. This contribution starts from main `a676fde58d2ee88878bb2f9489912c97f49636b3`, with PJ-05 integrated. Open PRs #500–516 and existing worktrees were inspected; none owns PJ-06. The branch is `codex/pj06-specialist-packages`. No dependency on #500 is needed. Parent PRJ-04/PRJ-05, SCM-03 and AT-38 remain intact.

## Decision and persistence

Implement internal specialist package briefs and explicit receiving of an exact submitted brief. Reuse the existing TypeScript/PostgreSQL monolith, Project visibility, approved PJ-05 basis, native Engineering and Supply read authority, shared Project Activities, workspace locking and original-operation receipts. An additive migration creates immutable package identities and sequential events. Each event retains complete content and the exact source snapshot; receiving never edits the submission. No framework, dependency, sender or external adapter is added.

Separate default-denied read, prepare and receive duties. Only the Project coordinator creates a package; its recorded owner or coordinator prepares later revisions. The designated internal receiver must differ from every author/submitter. An Accepted brief is immutable; correction creates an explicitly linked successor. This is acceptance of an internal coordination brief, not subcontract award, procurement approval, technical release, competence certification, delivery completion or a Service booking.

An approved commercial basis is mandatory. Optional exact Engineering package and Project-origin Supply demand references remain references to their source services. They are not substitutes for technical release or purchase-order approval. If missing, each needs an explicit unresolved-context reason. Source drift blocks new submissions/acceptance; original receipts and authorised history survive. No source-owned record is changed. Dates are explicitly entered objectives; no contractual deadline, lead time, quantity conversion, rate or monetary total is calculated.

## Alternatives

Extending RAID or commercial obligations would conflate their existing lifecycles with exact package receiving. Copying Engineering releases or Supply purchasing decisions into a new approval store would duplicate authority. A full subcontract-management service would introduce unsupported procurement/payment and operational policies. A bounded native package aggregate preserves those authorities and provides the missing PJ-06 foundation.

The [contract](../contracts/project-specialist-packages.md) defines API and persistence limits. Competence/insurance verification, exact technical release and procurement acceptance handovers, work-evidence acceptance, supplier identity integration, reassignment and UI remain subsequent bounded increments. Their absence is explicit; the whole PJ-06 programme is not declared complete.
