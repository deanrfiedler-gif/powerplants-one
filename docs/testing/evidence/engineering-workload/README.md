# Engineering workload backend execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 13 October 2026. Scope: BC-01, EN-01, ENG-01/02/04, AT-01 and PT-01. Source base: main `7e4ef3b8ce28e1976fea621f9de33999c26fbe21`; branch `codex/engineering-workload-backend`.

## Contract and environment

The [read contract](../../../decisions/engineering-workload-backend.md) adds a register API over existing Engineering authority and technical rules. Existing commands and UI are unchanged. The isolated worktree uses pinned repository dependencies and a separate loopback PostgreSQL 16.15 cluster, with only `ppo_synthetic_test`. Private configuration, database files and raw local logs stay outside Git.

## Execution ledger

Verification is in progress. Final results and source hashes will be recorded before PR publication.

- Initial focused database run: five of six tests passed, including 101 native-created packages and complete paging/counts, date/null/tie ordering, inactive recorded owners, context/working-company isolation and injected late scoped-grant revocation. The continuation test correctly received the existing `InvalidData` response but its new assertion incorrectly expected `ValidationFailed`. Corrected the assertion without changing runtime error semantics, assertions on refusal or the 120-second deadline. Its remaining steps require the final replay.
- The initial query-validation unit run passed both cases.
- Private setup: an initial reset command lacked the required disposable-database opt-ins and correctly refused. The test harness supplies both and owns the isolated database. Initial Windows database startup waited on the long-lived server process; the cluster was verified independently and task-only configuration completed. A sampled long commit waited on WALWrite; no application defect, durability relaxation or performance acceptance is inferred.

## Remaining boundary

The accepted Figma page, shell rollout, export, independent/owner review, physical-device acceptance and deployment remain separate. This work provides synthetic backend evidence only. Actual effort, availability and utilisation remain unknown. Engineer filters expose recorded owners, not assignment eligibility. The engineer facet is explicitly bounded to 100 choices; counts cover all authorised matches. The existing browser UI continues using its original list.
