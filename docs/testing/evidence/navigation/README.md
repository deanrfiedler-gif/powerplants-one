# Navigation verification ledger

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Review:** Pending. Functional proof is separate from owner/device acceptance, CI and deployment.

Source baseline and actual remote default `main`: `4f883d145b18876840c5ce5522059c95448dc086`. Candidate branch: `codex/nav-implementation`. The original user checkout at `95c0887` and its unrelated worktrees were preserved. The supplied NAV-01 report, inventory, static JSON and 34-scenario CSV were read; NAV-01 itself executed no browser acceptance. Current route/discovery and execution ledgers accompany this file. The accompanying records identify actual candidate commits and results.

Environment: Windows, Node 24.21.0, npm 11.19.0, Playwright 1.63.0, stable Chrome 154.0.8037.98 accepted by the checkout's runtime guard. A task-owned loopback PostgreSQL 16 cluster on port 5548 uses only `ppo_synthetic_test`; existing user databases are untouched. Private configuration, document storage, traces and original full logs are outside Git under the task's private evidence directory. No schema migration or seed is added; this private database was initialized from the existing registry. No dependency, deployment or business transaction is added. Fixture helpers create bounded synthetic domain records without resetting the database or changing grants.

## Revalidation

Remote main equals the audited commit, so none of F01–F18 was already fixed there. The original root checkout predates that main and was not used for implementation. There are still 199 `page.tsx` files including five CRM aliases, and 196 development-register route entries. The shell adds one destination for the existing Technical queries module; its retained unavailable placeholders remain unavailable. Source assertions never stand in for scope checks or browser results.

F01 and F02 were reproduced through rendered links with saved synthetic fixtures: Survey opened nonexistent `/assets/{id}`, and Acceptance opened nonexistent `/activities/{id}`. After the canonical helper correction, N01/N02 passed on both desktop and mobile (4 tests). Initial fixture mistakes and missing readiness waits were corrected before those reproductions; they are not application regressions.

The first requested development-server core run exhausted the existing 15-minute warm-up deadline. Its 46 scenarios **did not run**. No application failure or host-only cause is inferred from that timeout. The supported compiled configuration retains the same two projects, warm-up dependency, stable Chrome and assertion deadlines; its actual results are recorded below.

The full unit run's three existing Windows failures were reproduced on unmodified audited main in a second isolated checkout: two `document-store.test.ts` cases (`ExactDocumentUnavailable`) and the `recovery.test.ts` unsafe-directory error-message assertion. Navigation contract failures from the first candidate run were fixed by updating the intentional destination/start/date contracts and rerunning focused checks. None of the three unchanged failures is silently counted as a pass.

A proposed combined-role fixture briefly copied three existing grants in this disposable database; it was removed immediately. Before/after queries confirm Coordinator has zero Finance/shared-Finance grants. The committed helpers change no grants. Existing roles separately prove Finance source navigation and source Report review; there is no approved seeded combined Report/Finance persona. Its rendered conditional branch remains explicitly unverified.

## Acceptance and limits

See `scenario-results.csv` for N01–N34, fixture/role, actual result and evidence. A partial scenario is not full acceptance. Direct URLs and domain readers remain authoritative; discovery may advertise a capability combination but cannot establish compatible per-record scope. Physical touch, actual browser zoom, screen readers, expired hosted Microsoft sessions and deployed-device acceptance require their own evidence. Reduced viewports are labelled reflow, never actual zoom.

Safe server-bound login return is deferred by the [NAV decision](../../../decisions/navigation-consolidation.md); arbitrary return URLs remain refused. Universal estimate/quotation record-search adapters, ERP order creation and a native Installation module remain outside this navigation contribution. Missing fixtures and unrun end-to-end branches are named in the execution ledger rather than described as passing. Issued references and review fingerprints are unchanged.

## Execution checkpoints

Application checkpoint: `f1f04ba12c49003398652917b16d9c47e45edf8a`. [Runs](runs.json) and bounded [result excerpts](results/) retain actual older source commits; they are not described as final-head reruns. The CSV contains 6 PASS, 27 PARTIAL and 1 DEFERRED scenarios; each partial row names its unexecuted criteria. No missing fixture is counted as a pass.

The initial inspection database check hit PostgreSQL `53200` (shared lock memory); the identical suite reproduced this on unmodified audited main. Only the task-owned cluster was raised to `max_locks_per_transaction=256`; the scoped inspection check then passed. That existing suite resets `ppo_synthetic_test`; this reset was confined to port 5548 and subsequent bounded fixtures were regenerated. A later Finance fixture initially collided with an InProgress appointment left by that suite; a clean reset of this disposable database restored its expected fixture. No user/shared database was reset.

Full-unit result: 622/625 passed; the three Windows failures are unchanged baseline failures (two exact document-store cases and one recovery error-message assertion). The initial dev warm-up timed out; 46 browser scenarios did not run there. Compiled warm-up completion only primes routes: its 200/401/404 statuses are not operational acceptance. Core had an outdated Lead-heading test assertion; the corrected alias test passed in both projects in the module run. Later exact-account proof found hidden ancestor links; the final hierarchy control repairs that source defect.

Required lint, TypeScript, build, browser runtime, studio, foundation, naming and prototype checks are recorded separately. No database migration is required. The broad full database/HTTP suites and all 199 rendered route/conditional branches were not run as part of this navigation session. CI, owner/device acceptance, merge and deployment remain pending.

| Check | Actual result |
|---|---|
| `npm run lint`, `npm run typecheck`, `npm run build`, `npm run browser:check` | Passed at application checkpoint `f1f04ba`; offline generated outputs unchanged. |
| `npm run test:unit` | 625 tests: 622 passed, three baseline Windows failures. All navigation, Home, capability policy, contextual URL and gateway cases passed. |
| Required department/shell/search suites, plus N14/N29/layout, compiled configuration | 27 passed / 12 explicit viewport-owner skips at `f1f04ba`; no assertion failures. The original development-server warm-up timeout remains separately recorded. |
| Focused Customer/Equipment/Finance/Inspection/Report/Supply/offline identity/CRM alias suites | 17 passed at `4086dad`, including warm-up and both configured projects. |
| Populated expanded-rail, reflow, offline and timer recovery suites | 16 passed / three explicit mobile geometry skips at `0c9d138`. |
| Blank operational More entries and all five SH platform scenarios | 13 passed at `6e6e91a`, including warm-up and both projects. |
| Commercial Discovery/Won receiving/quote conversion | Exact passing cases retained at `43e1e81`; that run also had five later-repaired failures and two skips. It is not represented as a wholly passing run. |
| Scoped Inspection database check | One passed at `6e6e91a`; baseline lock-limit failure and private environment repair retained. |
| Quotation/Finance navigation readers | Two passed at `6284b34`; exact scoped source/revision assertions. |
| `npm run studio:check` | 350 entries, 39 components, 196 routes; zero errors, 350 unreviewed, zero stale reviews. No owner acceptance. |
| Foundation / naming / prototype | Passed documentation assurance; 78 parent IDs and 22 issued references retained. Prototype was checked earlier with no PP-01 package changes. |

The final exact-account run exposed hidden desktop ancestors. A native Page hierarchy disclosure repairs this defect and passed desktop/mobile with denied-identity clearing and Escape focus return. Its actual captures were inspected and are linked in the screenshot review. All capability and schema source files remain unchanged.
