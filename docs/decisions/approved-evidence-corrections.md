# Approved time and material correction proof

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Recorded 10 October 2026 (Australia/Brisbane). Status: authorised synthetic regression work; independent review and owner acceptance remain separate.

Dean authorised reconciliation of backend PRs #379/#380 and the next PT-13 correction proof alongside UI work in Claude. This contribution uses isolated branch `codex/approved-evidence-corrections`, starting at main `8d3b5093b8561ef2c75374621be9143ae49aadd4`. It leaves UI pages, shared controls, design reviews and other checkouts unchanged.

The existing [PT-13 / AT-12 procedure](../testing/prototype-acceptance.md#pt-13--timematerial-correction-and-review), [BP-07 TR-12 / SR-10](../blueprints/BP-07-service-operations.md) and [Finance correction contract](../contracts/finance-handoff.md#6-line-mapping-and-correction) require immutable approved originals, reasoned successors and renewed downstream review. Relevant parents include SVC-08, SVC-09, SVC-10, FIN-03, FIN-06 and NFR-02; no parent disposition changes.

Two complete synthetic command journeys start with the authored 90-minute Labour interval and 2 EA consumed material. Service approves their exact versions; Finance separately allocates 60 billable / 30 non-billable minutes and 2 EA. One case remains approved before processing; the other completes synthetic processing and reconciliation. Each opens an explicit factual correction cycle, records 75-minute / 3 EA successors and independently reviews/issues their new Service report.

The changed quantities are test inputs, not operational billing rules. Before any processing, the successor handoff requires explicit new allocations (45 billable / 30 non-billable minutes and 3 EA) and fresh Finance approval. After processing, the original allocation, outcome and target stay intact; only a linked correction request is recorded. No local command claims to reverse a ledger or authorise a second charge.

The work adds regression evidence using existing technology and commands. Live schema inspection, failed test-driver attempts and successful execution are recorded in the [evidence ledger](../testing/evidence/approved-evidence-corrections/README.md). Repository publication, current-head CI, independent technical review, owner/device observation and production readiness remain separate. There is no live ERP action, deployment, customer communication, schema/grant change or new UI workflow.
