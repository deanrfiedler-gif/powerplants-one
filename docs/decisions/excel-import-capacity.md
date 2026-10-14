---
owner: Dean Fiedler - prototype owner
status: Implementation decision; independent acceptance pending
date: 2026-10-14
---

# Excel import larger-workbook capacity

Dean authorised Step 6 capacity work under PPO-010, BC-04 and XI-03/04/06/07/08. Continue the exact reviewed import, re-import and Draft quotation services in PR #485. Issued workbook bytes and parent requirement IDs remain unchanged.

Three local samples each at 100, 250 and 500 lines support selecting 500 lines and a 1 MiB canonical native costing request, including all explicitly kept lines. The initial 500-line candidate parsed and reviewed in 134–161 ms; these bounded samples do not establish operational throughput. The complete workflow and populated upgrade are measured separately in the execution evidence. Retain 5 MiB compressed / 20 MiB expanded workbook limits, 256 entries, 100,000 XML elements, 1,000 table rows, all parser safeguards and the 100-workbook history bound. These are separate limits: a valid line count alone does not promise acceptance.

Reuse the existing synchronous parser, PostgreSQL transaction, private source adapter, decimal maths and Draft renderer. No new dependency, service, queue, grant or seed. A wider global manual/CPQ contract was rejected because those receiving profiles have separate acceptance. Native public manual and specialist limits remain 100 lines / their existing command sizes. Internal Excel participants explicitly select the larger envelope; there is no client-supplied bypass. A deferred database constraint must require accepted Excel evidence for any estimate above 100 lines. All existing row, arithmetic, lineage and immutable evidence constraints remain.

Record the capacity profile in new review evidence and its hash. Preserve accepted receipts and old review hashes. Widen only the relevant database checks through a new migration, preserving original ledgers, workbooks, quotes and outputs. Prove boundary refusal, retained-line overflow, concurrent and stale commands, rollback, populated upgrades, HTTP transport, exact quotation output and actual application/database restart. Keep database timeouts and original test deadlines.

Larger operational workbooks, native import controls, commercial approval/issue, FX, landed costs, pricing policy, integration and deployment remain separate. Measurements describe this synthetic local environment, not a production throughput commitment.
