# PJ-06 package verification

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Synthetic contribution in [PR #518](https://github.com/deanrfiedler-gif/powerplants-one/pull/518), based on main `a676fde58d2ee88878bb2f9489912c97f49636b3`. Architecture decision `a87d8e4` precedes implementation. Tested implementation: `ad0e173108236cf3c3d2b8f7a3452e7bd33dc622`. [Contract](../../../contracts/project-specialist-packages.md), [source/runtime fingerprints](source.json), [failure and review evidence](failures-and-review.md).

## Executed local proof

The final implementation uses repository-pinned Node 24.21.0 and npm 11.19.0, installed through the unchanged lockfile. An isolated PostgreSQL 16.15 instance uses loopback 55440 and only `ppo_synthetic_test`; the compiled application uses loopback 3036. Live amended schema and identity/capability guards at migration 0102 were inspected before adding 0103. The existing #500 monitor and its resources remain separate. Credentials, sessions, database data and checkpoints remain outside Git.

| Check | Actual outcome |
| --- | --- |
| Native lifecycle/security and populated upgrades | 8/8 passed, no skips or cancellations, 570104.8389 ms total. Six lifecycle cases plus populated 0025 and 0102 upgrades. Original 120-second case limit retained |
| Reserved Products 0052 after 0103 | 1/1 passed; original records/ledgers and exact added versions retained; repeat migration/seeding inert |
| Compiled HTTP | 1/1 passed; 21496.6943 ms case time. Native receiving, discarded response recovery, concurrent identical command, company isolation and revoked-access refusal |
| Actual PostgreSQL/application restart | Passed; 21 tables retained exactly, accepted package version 3, two original receipts and sessions recovered, zero replayed effects |
| Complete pinned unit suite | 855 executed: 852 passed, 3 failed. All three reproduce on unchanged main with the same pinned runtime; see the retained failure evidence. This is not a green full unit run |
| Lint and TypeScript | Full lint passed, followed by focused lint on the final regression file. Standalone TypeScript passed before the last SQL/test refinements; the final standard build's TypeScript validation passed |
| Standard application build | Passed with Next.js 16.3.4/Turbopack; 77 static pages generated and the new API route compiled. No dependency or build-configuration change |

The native cases prove exact approved commercial/Engineering/Supply references and original units; independent receiving and explicit unresolved context; source drift/withdrawal without rewriting history; scoped detail/history/list/cursors and actor-private receipts; one successor per accepted predecessor; optimistic concurrency and altered retries; direct-write source/content integrity; late-failure transaction rollback; and no downstream source mutation. Populated upgrades preserve original identities, source snapshots, grants/users, migration ledgers and operation evidence, including the 0026 deferred-identity path.

The [restart result](restart-final.json) is backed by [different actual application and PostgreSQL process IDs](restart-processes.json), a changed PostgreSQL postmaster start time, complete before/after table equality and replay through the compiled API using retained sessions. This is a process/database restart, not a connection-pool reconnect. The application was stopped after verification.

The existing access catalogue receives labels for three new default-denied duties; this minimal existing-client change represents the backend permission contract. Generated AD-01 hashes and pinned counts were updated from LF sources. No visual review or UI completion is claimed. Final foundation, naming, Studio and access-model assurance are recorded in `local-validation.json`.

## Reproduction and independent gates

Use the repository-pinned runtime and a private environment file pointing only at the disposable test database. Run the two `tests/database/project-specialist*.test.ts` files serially with the original 120000 ms test limit, then the `PD upgrade from 103` case in `products-upgrade.test.ts`. Build normally, start `scripts/local-server.ts --compiled`, and run `tests/http/project-specialist.test.ts`. Reset with both documented disposal flags while the application is stopped. Run `scripts/prove-project-specialist-restart.ts write <private-absolute-checkpoint>`, actually stop/start both processes, then run `verify`. The [CI workflow](../../../../.github/workflows/project-specialist.yml) retains the same native proof. The complete unit suite was run serially; no case was omitted.

[Independent automated review](https://github.com/deanrfiedler-gif/powerplants-one/pull/518#issuecomment-6192704572) completed cleanly for the implementation commit after three actionable findings were fixed and tested. Actual review threads were then resolved with separate proof and review links. Documentation/evidence-only follow-up commits do not change the tested implementation; latest-head review and CI remain visible on the PR. CI was queued when this evidence was assembled; pending, cancelled or superseded runs are not passes. The optional PT-27 skip is unchanged. Human acceptance, operational approval and deployment are separate and absent.

R1 remains internal package coordination. Verified supplier identity, competence/insurance, exact technical/procurement receiving, work-evidence acceptance, participant transfer, operational policies and UI remain open. The next PJ-06 dependency is a bounded handover contract using the native technical/procurement authorities. This does not close the whole PJ-06 programme or the application's backend ledger. Nothing was merged or deployed.
