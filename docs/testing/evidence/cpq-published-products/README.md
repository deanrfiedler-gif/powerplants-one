# CPQ published Products execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Source: isolated `codex/cpq-published-products` from main `b100680`; 14 October 2026. [Decision](../../../decisions/cpq-published-products.md), [API](../../../interfaces/cpq-api.md). Synthetic backend only. Local execution, CI, independent review, operational acceptance and deployment are separate.

## Verification in progress

Final results will be recorded here before PR handover. The earlier unfinished schema-2 worktree was inspected and left unchanged; relevant checks/tests were adapted to current main. PR #489 remained open at inspection and supplies no required dependency. No migration, seed, capability, runtime dependency or issued reference is changed.

The first local attempts identified setup issues: the primary worktree dependency cache lacked current locked packages, and the newly created PostgreSQL database inherited Windows encoding. This isolated worktree received `npm ci`; only its own disposable database was recreated as UTF-8. Those attempts are not passes or application regressions.

## Limits

Schema 2 retains schema-1 calculation/input features; schema-3 design plus Product binding is not implemented. Conditional relationship evidence retains its technical owner and conditions, without automated application suitability or operational approval. Availability/lead time remain Unknown. Authored prices stay under existing CPQ contracts. No new UI/Figma work, live integration, stock commitment, commercial transaction, merge or deployment.
