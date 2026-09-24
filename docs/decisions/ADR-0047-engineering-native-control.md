# ADR-0047 — Native Engineering control records

<!-- versioning: git; committed history is authoritative -->

Status: implementation authorised for the synthetic prototype; proposed application composition, visual review and business authority remain separate. Owner: Dean Fiedler. Date: 24 September 2026.

## Context and evidence

The current task authorises completing EN-01–EN-08 without rebuilding EN-06–EN-08. Starting checkout and fetched origin/main are `ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc`. The only open PR at the initial audit is #299 (fertigation import placement, ADR-0044). Other local Sales, Equipment and Estimating worktrees are untouched. Work is isolated in `tmp/engineering-en01-en05-native`, branch `feat/engineering-en01-en05-native`.

The live tree confirms the supplied audit: EN-01 intake/coordination exists; EN-02 is standalone; EN-03–EN-05 have no native workflow; EN-06, EN-07 and EN-08 exist. Main ends at migration 0044. EN-06 #265/#268, EN-07 #266 and EN-08 #270 are already in this base. Old open-PR wording is historical, not present delivery status.

Sources: [BP-01 section 11](../blueprints/BP-01-master-blueprint.md), [BP-02](../architecture/BP-02-platform-architecture.md), [EN-02 design](engineering-basis-interface-register-design.md), its retained six-view source, and current Engineering module services, tests and handovers. Direct trace: EN-01→ENG-01; EN-02→ENG-02; EN-03→ENG-03; EN-04→ENG-02/ENG-04/ENG-06; EN-05→ENG-04; retained EN-06→ENG-05, EN-07→ENG-06, EN-08→ENG-07.

## Decision

Concurrency refresh: origin/main advanced to `6c5e7c4fcbaf05d712a46989faf2cf7cabb8ba72` (#299/#300), and this worktree was rebased before final verification. Open #302 Equipment and #303 Sales subsequently reserved migrations/ADRs 0045/0046; Engineering uses 0047, with those gaps intentionally absent from this main-based registry. Shared metadata and exact migration assertions must be reconciled in merge order. No code from those unrelated open PRs is included. #301 Estimating and #304 job-pack work are also open and untouched.

Retain TypeScript/Next.js, PostgreSQL and sharedOperation. No framework, dependency, external endpoint or paid service is added. Separate typed Engineering tables hold basis revisions, controlled document identities and revisions, queries, submittals, reviews, findings, issues, distributions and recipient evidence. Requirements, assumptions, constraints, questions, interfaces and calculation references retain distinct typed stable-ID child records inside the versioned basis content; they are not collapsed into notes. Technical decisions are immutable events alongside frozen review content. Stable UUIDs are separate from package-local readable references. Package, company and linked Project/Opportunity scope is inherited through the existing engineeringRow guard on every read and command.

Versioned source snapshots and published references are immutable. A new source version, engineering revision, basis successor, resubmission or issue has its own identity; none inherits a review or acknowledgement. A review binds exact per-document revisions and sources under a server hash. Its findings and outcome are separate records. Issue requires an accepted current review for the identical purpose, and independent issue authority. Sent, delivered and acknowledged are separate evidence events for one exact issue and recipient. Withdrawal never erases earlier facts.

New narrow technical review, issue, distribution and restricted-source capabilities complement engineering.edit. Synthetic policy names fictional users and permitted purposes; a role title supplies no authority. Existing EN-06–EN-08 capabilities and policy are unchanged. New records remain package children; receipts name the existing package with an exact subject/action in the audit rather than creating another global identity family. The receipt path rechecks the command's current duty.

The EN-06 retained-source adapter remains the compatibility boundary for EN-06–EN-08. Native basis/document/issue lineage can publish exact retained references through that boundary; existing synthetic references remain usable. No downstream release, receipt, implementation or completion is inferred.

## Alternatives and consequences

A single generic workflow table would blur document versions, engineering revisions, review and issue; rejected. Independent implementations per page would duplicate authority/recovery and make exact lineage difficult; rejected. Browser-local persistence from EN-02 is suitable only for its retained design; rejected for native business records. The chosen relational model costs additional schema and upgrade assurance but makes identities, relationships and immutable history explicit.

The six EN-02 views retain their source names. New EN-03/EN-05 compositions are proposed PPO register/detail designs with no exact image baseline. Shared Button, existing Engineering dialog/command recovery and shell controls are reused. No new shared control is proposed. Native CAD authorship and dependencies remain outside PPO; references are synthetic metadata, not verified SharePoint or CAD support.

Effort records require explicit source, units and authorisation evidence. No utilisation, productive-hours assumption or employee capacity is derived. Missing effort/availability remains visible. D-002/D-008/D-012/D-019 and receiving-system acceptance remain unresolved for operational use.

## Delivery and recovery

Use coherent foundation, workflow, UI and assurance commits and dependency-ordered PRs if necessary. Additive schema stays in place on code rollback; retain all history and originals. No down migration, deployment, live transactions, messages or access administration is authorised. Verification and outstanding steps belong in the [programme handover](../delivery/engineering-native-control-handover.md).
