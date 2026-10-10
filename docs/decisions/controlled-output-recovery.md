# Controlled output generation and recovery

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Decision date: 10 October 2026. Review: independent and owner acceptance pending.

## Authorised scope

Dean authorised PT-23 after PT-01: complete the integrated controlled-document tests, fix failures and prepare a reviewable pull request alongside Claude's UI work. This session owns `codex/pt23-output-recovery`, isolated from `origin/main` at `e5a94730025cf7a1ad4c1d0b1450532f591dba32`. PT-01 remains a separate contribution in PR #386. This work does not merge, deploy, contact customers or connect a live document/ERP provider.

PT-23 implements the selected AT-36 assurance for OUT-09 technician job packs, OUT-10 customer Service reports and OUT-14 restricted Finance evidence. It preserves the parent scope and identifiers in BP-01, the [written procedure](../testing/prototype-acceptance.md#pt-23--template-change-long-output-and-storage-failure), [document contract](../contracts/document-issue-distribution.md) and [Finance contract](../contracts/finance-handoff.md). MYOB remains the intended ERP authority and SharePoint the intended business-document authority. Local synthetic adapters do not establish provider behaviour.

## Required behaviour

- A queued or durably stored render is not an issued document. Source, supported template, authority and exact stored bytes must still pass before the final issue transaction commits.
- Storage failure leaves no issue. Failure inside finalisation must roll back the issue, presentation/recipient effects, business state, audit, receipt and outbox together.
- An unchanged retry recovers the original render intent, reserved issue identity and durable bundle. Competing and late retries must not generate another output or duplicate its effects.
- A source or template change observed during generation retains the failed original for review. Restoring a renderer file is not a new review decision.
- Issued version-1 bytes, manifests and receipts remain exact after selection of installed version 2. No old output is regenerated.
- Long output checks cover every selected family and both supported templates. Confidentiality checks inspect the actual HTML and extracted PDF text. Page images support separate visual inspection; automated geometry alone is not visual or owner approval.

## Verification design

The database matrix uses the existing real domain commands, PostgreSQL transactions, Chrome renderer and private synthetic document store. Fault hooks stop storage or change a guarded source after generation. A targeted database trigger raises inside finalisation after issue-side writes, proving rollback rather than merely stopping before the transaction.

The long-output journey prepares and checks a pack, issues it, records each technician's acknowledgement, captures personal work, obtains a Service review, issues the report and separately reviews/processes/reconciles synthetic Finance evidence. It includes long names, 24 findings, eight material records and nine Finance allocations. A separate unissued twenty-asset render fixture challenges table pagination without inventing authorised work or Finance sources. Output manifests identify that boundary explicitly.

No new runtime technology, dependency, service, migration, grant or UI surface is selected. Existing supported template definitions and issued reference snapshots remain unchanged. The PDF inspection script uses the already available local PDF-review tools; they are not application dependencies or a new CI requirement.

Actual failures, corrections, commands, source hashes and page-review results are in the [evidence record](../testing/evidence/controlled-output-recovery/README.md). Technical proof, independent review, owner observations, production readiness, merge and deployment remain separate.
