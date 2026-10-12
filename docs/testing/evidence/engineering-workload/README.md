# Engineering workload backend execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 13 October 2026. Scope: BC-01, EN-01, ENG-01/02/04, AT-01 and PT-01. Source base: main `7e4ef3b8ce28e1976fea621f9de33999c26fbe21`; branch `codex/engineering-workload-backend`.

## Contract and environment

The [read contract](../../../decisions/engineering-workload-backend.md) adds a register API over existing Engineering authority and technical rules. Existing commands and UI are unchanged. The isolated worktree uses pinned repository dependencies and a separate loopback PostgreSQL 16.15 cluster, with only `ppo_synthetic_test`. Private configuration, database files and raw local logs stay outside Git.

## Execution ledger

The final runtime is commit `3dfa98dd7bd10275434c4473dee88ec37613a3be`. The corrected HTTP test and exact normalised source hashes are retained in [execution.json](execution.json); subsequent documentation updates do not alter that runtime or compiled build.

| Check | Executed outcome |
|---|---|
| Focused and retained database tests | 17/17 pass: six register scenarios, six extended technical-control scenarios and five existing Engineering command/persistence cases. Includes native release/revision invalidation, hidden technical sources and independent site scope |
| Compiled authenticated HTTP | 2/2 pass: native Project/package creation, sorting/counts, coordination/replay, stale continuation, exact detail/list compatibility, no-store, denied/malformed reads and unsupported writes |
| Query validation units | 2/2 pass |
| Full build and TypeScript | Pass, including the new compiled route and separate no-emit check |
| ESLint | Full repository pass; corrected HTTP test separately passes |
| Foundation, prototype and naming assurance | Pass; all 78 parent IDs preserved |
| Design register | Pass: 358 entries, no integrity errors, 330 unreviewed and 28 stale reviews retained |

No browser layout changes were made. Local full unrelated unit/database/browser suites were not rerun; the Engineering CI workflow now explicitly includes the new database and compiled HTTP cases.

## Initial results and setup dispositions

- Initial focused database run: five of six tests passed, including 101 native-created packages and complete paging/counts, date/null/tie ordering, inactive recorded owners, context/working-company isolation and injected late scoped-grant revocation. The continuation test correctly received the existing `InvalidData` response but its new assertion incorrectly expected `ValidationFailed`. Corrected the assertion without changing runtime error semantics, assertions on refusal or the 120-second deadline. All remaining continuation steps passed in the final complete replay above.
- The initial compiled HTTP run passed its refusal case but the new journey assertion expected 200 for an initial coordination command. The unchanged native route uses the default command response: 201 initially, 200 on replay. Corrected only the assertion; the final complete two-case run passes against the unchanged compiled runtime. The initial query-validation unit run passed both cases.
- Private setup: an initial reset command lacked the required disposable-database opt-ins and correctly refused. The test harness supplies both and owns the isolated database. Initial Windows database startup waited on the long-lived server process; the cluster was verified independently and task-only configuration completed. A sampled long commit waited on WALWrite; no application defect, durability relaxation or performance acceptance is inferred.

## Remaining boundary

The accepted Figma page, shell rollout, export, independent/owner review, physical-device acceptance and deployment remain separate. This work provides synthetic backend evidence only. Actual effort, availability and utilisation remain unknown. Engineer filters expose recorded owners, not assignment eligibility. The engineer facet is explicitly bounded to 100 choices; counts cover all authorised matches. The existing browser UI continues using its original list.

## Publication

[PR #457](https://github.com/deanrfiedler-gif/powerplants-one/pull/457) carries the implementation and this evidence. Initial-head CI was running without a reported failure at the evidence checkpoint; final-head CI and independent review are separate. No merge or deployment is claimed.
