# Native Engineering control interface

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: synthetic implementation; authority and owner acceptance remain separate.
Decision: [ADR-0047](../decisions/ADR-0047-engineering-native-control.md).
Trace: EN-01 → ENG-01; EN-02 → ENG-02; EN-03 → ENG-03; EN-04 → ENG-02/ENG-04/ENG-06; EN-05 → ENG-04.

## Package-scoped API

GET /api/v1/engineering/{package_uuid}/control returns permitted typed records, immutable document revisions, sources, source lineage, findings, recipient evidence, current policy availability, scoped people/facilities, basis readiness and observed time. Optional record_id must resolve inside that permitted package. Unknown query keys are refused. The current prototype bounds each typed register to 500 records and fails explicitly beyond that limit; it never reports a truncated list as complete.

POST at the same path uses schema_version 1, operation_id UUID, kind, action, id, expected_version where applicable, and reason. Exact action fields are validated by src/engineering/control/validation.ts. A new accepted operation returns 201; an identical original replay returns 200 with its original receipt. Changed payload, package or action under the same actor's operation ID returns 409. Validation is 422, inaccessible records 404, absent duty 403, stale record/source 409.

Record kinds are basis, document, query, submittal, review, issue and deliverable. Typed basis children retain stable IDs and distinct requirement/input/interface/calculation structures inside the versioned basis snapshot. Review and issue content is constructed on the server, never supplied as a client-generated manifest.

## Decisions and evidence

Draft saves require engineering.edit. Assigned review, issue, distribution and restricted source access have separate capabilities and versioned synthetic policy. Policy matches current person, company/site, discipline and purpose. A configured independent reviewer cannot be a contributor; independent issue excludes contributors and reviewer. Named interface parties confirm their own exact inputs. Findings retain separate owner response and reviewer closure.

Document UUID, native file version, engineering revision and published output hash differ. Review retains one exact revision per selected document, basis, submittals, sources, contributors, purpose, policy and hash. Issue retains that exact submission and named recipients under a distinct manifest/hash. Sent, Delivered and Acknowledged require separate immutable evidence; only the exact recipient acknowledges. Withdrawal retains history.

Receipt recovery at /api/v1/operations/{operation_id} rechecks current package access, command duty/policy and source visibility. An inaccessible/missing receipt does not establish whether an earlier command committed. Client recovery retains and retries the original operation unchanged.

## EN-06–EN-08 compatibility

The existing material_sources adapter remains the boundary. Native sources retain the established synthetic adapter label, with engineering_source_lineage identifying the exact native basis, document revision or issue. engineering_source_dependencies records immutable upstream dependencies. An upstream change withdraws current use of derived sources through material_source_changes; history and acknowledgements survive. Existing EN-06/EN-07/EN-08 source checks detect that condition without replacing their review/release engines. Older synthetic references remain usable.

The adapter keeps its 20,000-character retained-source boundary and fails explicitly if a new source manifest is larger; split the technical scope. SharePoint remains intended business-document authority. Native CAD authorship, file dependencies and relocation stay outside PPO. No live endpoints or external messages are introduced.

## Operations and assurance

Commands use the existing workspace transaction, optimistic versions, immutable event, audit, outbox and receipt conventions. Child records retain package context; receipts name EngineeringPackage and the audit identifies the exact child/action. EngineeringControlSaved is a retained synthetic outbox event, not an external transaction.

Database-only direct writes are additionally constrained by package/source foreign keys, immutable submitted content, exact review-to-issue checks, lifecycle transitions, immutable distribution evidence and accepted findings. Code rollback should retain this additive schema and all evidence; do not drop tables to revert a UI release.

See [programme handover](../delivery/engineering-native-control-handover.md) for executed tests, limitations, source/base commits and remaining owner review.
