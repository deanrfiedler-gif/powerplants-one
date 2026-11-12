# Agreement charge C1 backend evidence

[PPO-MAINTENANCE-TS02-DEC](../../../decisions/maintenance-service-ts02-decisions.md) C, [PR #905](https://github.com/deanrfiedler-gif/powerplants-one/pull/905). One-level stack on M2 #904 sequences Finance source/contract edits; B3 is merged. No merge, deployment or live data action is implied.

## Scope and provenance

Migration 0127 was reserved and pushed before writing it. The normal reservation command could not enumerate open PRs because shell `gh` GraphQL returned Forbidden. The GitHub connector enumerated all four open PRs (897, 902, 904, 905) and every changed filename; none claimed a migration. The existing reservation module then ran with that observed empty remote-claim set, creating `db/reservations/0127.md`. The implementation removes its reservation. The tracked reservation/checker scripts were not changed to bypass a check.

The optional exact schedule preserves old agreement payload/hash bytes. New charge-bearing revisions require independent Finance approval. Immutable projected charges and exact source/account snapshots feed the existing Finance holds, review, processing, unknown-result lookup and reconciliation. SQL guards preserve the old WorkOrder/ProjectClaim branches and enforce a disjoint source/hold shape. No new seed, capability, grant, dependency or customer output.

All new money/date fixtures are synthetic. AUD 4,800.00 annual advance and AUD 1,200.25 later charge are independent expected values; no tax or FX is calculated. Tests grant explicit test-only maintenance source read to the preparer/processor, not a product seed or operational delegation. A user lacking that existing source authority cannot use or retrieve agreement claims.

## Executed verification

Results are recorded after final execution. Five focused database cases cover exact source/target cents, returned holds/revised transfer, duplicate/concurrent claims, safe cancellation, unknown-outcome protection, historical lookup/reconciliation after withdrawal, original-operation recovery, due/approval/currentness, cross-agreement refusal, direct SQL source guards, source revocation and queue exclusion. Unit cases cover default dates, absent historical schedules and invalid money/identity/date/policy inputs.

The first focused run passed three cases and found two fixture/assertion defects: a replay assertion compared the transport `replayed` flag rather than the unchanged receipt, and a reused fixture inserted an existing test-only grant twice. Both were corrected; no production behavior changed for those findings. The complete five-case corrected run passed.

Cloud setup for M2 supplied Node 24.21.0/npm 11.19.0/PostgreSQL 16.15. C1 uses the same configured tools and separate worktree, with database suites sequenced after M2. Chrome is absent, confirmed by the M2 browser probe. Document-producing ProjectClaim/upgrade fixtures explicitly use `project-claims-synthetic-renderer.mjs` only on disposable `ppo_synthetic_test`; these are command/persistence proofs, not real PDF evidence. The new C1 focused cases need no renderer; the helper was loaded during that run but no agreement output was rendered.

Full CI, independent Claude review, native UI/output, complete TS-01/02 acceptance, operational agreement/rate/tax authority and real ERP remain separate. No actual MYOB document type or number is claimed.

## Historical upgrade and tooling follow-up

The first broader upgrade run passed the new populated-0126 case, the existing populated-0125 case and all eight B3 database scenarios. Its two Maintenance reconstruction cases failed because the fixture attempted to install C1 0127 before the intentionally absent Maintenance 0051. The fixture now defers both dependent migrations 0123/0127, preserves the complete prior ledger and expects exactly 0051/0123/0127 on installation. No migration is skipped in an actual upgrade. The corrected SV08 case and a separate command-only all-row preservation/receipt/idempotency case pass unmocked. The original rendered-output proof keeps its unchanged `pdf.length > 1000` assertion; the short synthetic-byte helper cannot satisfy it. Its baseline comparison and the real-renderer CI boundary are recorded below.

The first compiled build could not resolve Next.js through a shared `node_modules` symlink outside Turbopack's root. Installing the unchanged lockfile into this worktree fixed the environment; the production build then passed. One premature repeat was refused by Next's build lock while that build was still running; no lock was removed. The final sequential build passed on the final application source. Lint, TypeScript, Studio coverage and all 1,452 unit tests passed; this is not reported as a single green initial `npm run check`, whose first build attempt failed on the symlink.

## Final local results

- Studio, lint, final TypeScript and **1,452 unit tests passed**; final production build passed with local installed dependencies.
- **20 selected database cases passed**: five new C1 lifecycle/authority/SQL cases, one new populated-0126 upgrade, eight existing B3 cases, one existing populated-0125 upgrade, three P11 quality upgrades and two corrected late-Maintenance cases. The historical source/output fixtures use the explicit synthetic renderer boundary above; the two final late-Maintenance cases run unmocked without rendering.
- **7/7 existing demo-upgrade cases passed unmocked**, preserving saved CRM/mailbox/session/grant/checksum histories, CRLF ledger compatibility and transactional rollback. No hosted demo was accessed or changed.
- **1/1 compiled HTTP case passed without renderer substitution**, using the ordinary compiled application server: existing Finance create/read/submit/review/process/lookup routes, exact AUD 4,800.00 source amount, original receipt replay, queue visibility and negative cases. The server loads no test module mocks.
- Foundation, prototype, naming, migration numbering, status-source and documentation-scope checks passed; **44 documentation tests passed**. Final source/whitespace checks and CI/review are tracked on the PR.

Full real-renderer database/browser suites remain unrun locally because Chrome is absent. The existing rendered late-Maintenance proof fails its unchanged >1,000-byte PDF assertion under the explicitly short synthetic renderer helper. The independent unmodified-main control is recorded below. This failure is not counted as a passing rendered suite or as evidence against business behavior.

Independent Claude review and full final-head/merged-tree CI are outstanding. C1 must retarget to main after M2 merges; agents do not merge. No full TS-01/02, device/visual, operational financial policy, real MYOB or SharePoint acceptance is claimed.

Unmodified-main control: detached clean main `9926da5fa9a3b60fbc22843d25ddea1af4830bf5` reproduced the same `assert.ok(bytes.pdf.length > 1000)` failure with the same optional synthetic renderer. The C1 branch reaches that same unchanged assertion after its reconstructed-history fix. The separate unmocked command-only late-installation proof passes and does not claim to verify PDF size or layout. No assertion or renderer bytes were relaxed.

## Continuation validation — 11 November 2026

This session resumes the released #904/#905 claims at M2 `6b26031e0` and C1 `3ffb1cd77`, against main `9926da5fa`. Both remain draft and unmerged; #897 belongs to another workstream. Three implemented Codex contributions are open, so this batch fixes and validates existing C1 rather than opening another build. No runtime implementation, migration history, grant, seed or fee policy changes in this follow-up.

### Attributable CI fix

[Contacts job 130201651306](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/42922816685/job/130201651306) failed before browser execution because its Finance context pin was stale. `python3 scripts/build-contacts-design.py --check` reproduced the failure. Main/M2's `src/finance/context.ts` SHA-256 is `92f937346437b460bcfc0fdf9a4fe16d07c5a5cd80b98d003c2b98b2d029300a`; C1's is `b94d7c9d79b31c39b15781944dd8bb45f54f9fb02bc946163e5f5d2ab6ef6602`. After reading the complete diff, Contacts binding bd-04 and the active-person/company-context model assertions, the working pin is refreshed. The WorkOrder audience query and `SourceAudienceChanged` refusal are unchanged. Issued HTML, historical manifests and visual acceptance are preserved. Deterministic build and all **103 Contacts model groups pass**.

### Fresh environment and commands

The setup command was `PPO_TOOLS_DIR=/workspace/work/.ppo-tools PPO_DOCUMENT_DIRECTORY=/workspace/work/.ppo-tools/synthetic-documents bash scripts/cloud-setup.sh`, in the isolated C1 worktree. It succeeded with Node 24.21.0, npm 11.19.0 and disposable PostgreSQL 16.15. Every new test shell sources `/workspace/work/.ppo-tools/env.sh`. The setup reports browser unavailable; `npm run browser:check` independently fails because `/opt/google/chrome/chrome` is absent. The system Chromium is not substituted for the repository's reviewed Chrome channel. No real PDF/browser claim follows.

Executed unmocked commands:

```sh
npm run check
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/agreement-charge-finance.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 --test-name-pattern='SV08|C1 command-only' tests/database/maintenance-upgrade.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/demo/upgrade.test.ts
python3 scripts/build-contacts-design.py --check
node scripts/check-contacts-model.mjs
npm run typecheck
npx --no-install eslint tests/helpers/agreement-charge-restart.ts tests/database/agreement-charge-finance.test.ts
npx --no-install prettier --check tests/helpers/agreement-charge-restart.ts tests/database/agreement-charge-finance.test.ts
```

- `npm run check` passes: Studio, full lint, TypeScript, **1,452 units**, production build. Final helper edits also receive the focused lint/format/type checks above; application source is unchanged.
- **9/9 C1 database cases pass unmocked**, including four added recovery cases. Injected late audit, receipt and outbox failures leave the entire Finance/audit/receipt/outbox snapshot unchanged; exact retries reserve one whole entitlement. A local outcome failure after the simulator accepts preserves one exact AUD 4,800.00 target, refuses fresh dispatch and recovers it through original lookup to one Consumed hold.
- **2/2 selected late-Maintenance upgrades and 7/7 demo upgrades pass unmocked**, preserving exact prior rows/ledgers and exercising rollback. The renderer-dependent late-Maintenance case is excluded explicitly by the positive name selector; it is not counted as executed. No hosted demo was accessed.
- Foundation/prototype/naming/migration/status/documentation checks and **44 documentation unit tests** pass. Documentation-scope is checked again after the final commits. Raw focused results and restart verification are retained beside this chapter; the private checkpoint with the synthetic record graph stays outside Git.

Initial failure: the first nine-case run passed eight and failed the new accepted-target test because it expected `readFinance().targets` to expose a target before an outcome existed. The reader intentionally joins targets through recorded outcomes. The test now checks the independently committed simulator row directly, asserts that the ordinary read still hides it, then verifies original lookup/reconciliation. The complete nine-case rerun passes. No production behavior or assertion about rendered output was relaxed.

### Compiled HTTP and actual restart

The ordinary compiled-server HTTP case passes **1/1 without renderer substitution**, following a fresh `db:reset`. A separate clean reset starts the new two-phase proof. Its write phase uses native agreement setup and ordinary HTTP commands to create, submit, independently approve and dispatch one exact charge with AcceptedThenTimeout, then withdraw the agreement. The verify phase runs after actual app/PostgreSQL restarts. Six original HTTP receipts and their operation lookups replay exactly; new use of the withdrawn agreement and cancellation of the unknown effect are refused; original lookup and reconciliation produce one Matched AUD 4,800.00 target, one processing attempt and one Consumed hold. The two recovery commands replay without mutation.

Actual command sequence (all local, unmocked):

```sh
PPO_ALLOW_RESET=dispose-synthetic PPO_RESET_DATABASE=ppo_synthetic_test npm run db:reset
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/http/agreement-charge-finance.test.ts
PPO_ALLOW_RESET=dispose-synthetic PPO_RESET_DATABASE=ppo_synthetic_test npm run db:reset
PPO_RESTART_SERVER_PID=9966 node --env-file=.env.local --import tsx tests/helpers/agreement-charge-restart.ts write /workspace/work/c1-restart
PPO_RESTART_SERVER_PID=9966 node --env-file=.env.local --import tsx tests/helpers/agreement-charge-restart.ts verify /workspace/work/c1-restart
# Expected refusal: no application restart has occurred. Check this exact assertion.
# Verify /proc/9966/cmdline is this owned compiled server, then send SIGTERM.
env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock restart ppo-postgres
# Restart the same compiled application with the ordinary local launcher:
node --env-file=.env.local --import tsx scripts/local-server.ts --compiled
# In the next shell (server PID recorded by the launcher):
PPO_RESTART_SERVER_PID=10431 node --env-file=.env.local --import tsx tests/helpers/agreement-charge-restart.ts verify /workspace/work/c1-restart
```

[Machine-readable restart verification](continuation-restart.json) retains both process identities, the unchanged compiled build ID, different `pg_postmaster_start_time()` values, graph hashes and exact result counts. The no-restart negative control refuses as intended. [HTTP result](continuation-http.txt), [database cases](continuation-database.txt), [late upgrades](continuation-late-upgrade.txt), [demo upgrades](continuation-demo-upgrade.txt), [Contacts model](continuation-contacts.txt) and [log digests](continuation-log-digests.json) distinguish this session from earlier checkpoints. No session credentials or full private checkpoint are committed.

The first actual-restart attempt recovered all six receipts but failed the whole-audit snapshot assertion because fresh local sign-ins legitimately append Session audit rows. The final harness first compares the complete saved graph and migration ledger before sign-in, then verifies preservation of every old audit row and exactly five new Accepted Session rows for the five named test profiles. It then requires the entire source/Finance/audit/receipt/outbox graph to remain unchanged across replay and refused effects. A fresh reset/write/restart/verify cycle passes; this correction excludes no Finance audit evidence and changes no production behavior.

### Delivery gates

At the incoming C1 head, Application assurance's workflow summary was successful but its database/HTTP/runtime jobs were **skipped because the PR is draft**. This is not full CI validation. Contacts was the attributable failing job; other workflow results are observed separately on GitHub. Updated-head CI and Claude's one independent defect review remain separate gates. C1 stays on M2 until Dean merges M2, then needs retargeting and current-main validation. Complete TS-01/02, real rendered suites, customer output, operating pricing/tax/accounting authority and deployment remain unclaimed.

## C1-1 independent review correction — 11 November 2026

Claude's [review of 7d0a2254f](https://github.com/deanrfiedler-gif/powerplants-one/pull/905#pullrequestreview-5851548128) identifies duplicate billing after a title-only successor. This session [claimed the correction](https://github.com/deanrfiedler-gif/powerplants-one/pull/905#issuecomment-6783153124) after the prior DONE. Current main `2d9a8ff24` is integrated; M2 remains unmerged and C1 remains one level stacked. #897 stays untouched. Incoming Contacts rerun passed; Application assurance had only Change scope executed, with all runtime jobs skipped while draft.

The corrected conservation key is workspace + agreement + charge UUID. Revision remains immutable provenance. Submission checks every revision, revised pre-effect Drafts atomically transfer retained UUID holds, and successors must preserve every Held/Consumed charge's date, amount, currency and tax basis. The application returns `AgreementChargeReserved` for a forbidden amendment. The clarification implements the existing no-double-claim rule; it defines no correction/reversal, pricing, tax or ERP policy.

### Additive migration and historical assurance

0127 is byte-for-byte unchanged. 0128 was reserved in `a6d8647b5`, pushed with current main in `bb60c525c`, before writing SQL. The normal `--reserve` command failed because shell `gh` GraphQL is Forbidden. Connected GitHub enumeration found seven open PRs (#897/#902/#904/#905/#906/#907/#911); complete changed-filename reads found only this PR's 0127, no other migration/reservation. The unchanged reservation module ran with that observed claim set. The reservation is removed by its implementing change.

0128 changes functions/indexes/triggers only. Both allocation and agreement-revision guards take the existing workspace row lock. The SQL guards also perform a logical no-op write of the workspace id: stored values stay unchanged, while an older concurrent repeatable-read snapshot must abort with PostgreSQL 40001 instead of missing a newly committed hold. The allocation guard derives the agreement from immutable charge provenance and rejects a competing Held/Consumed charge across revisions; the revision guard refuses removal or changed reserved terms. It neither rewrites rows nor adds grants/seeds. An ambiguous pre-fix duplicate-live history makes migration fail before any new object is committed, preserving its original ledger for explicit reconciliation.

All current-version migration assertions were searched and extended, including the computed from-0025 lengths, policy lists, Products reserved-0052 starting points (including 128), late-Maintenance dependencies 0051/0123/0127/0128, and hosted-demo upgrade count/gate. Prior starting points and original ledger assertions remain. No historical migration bytes are changed.

### Commands and evidence boundary

The sibling M2 setup completed with Node 24.21.0/npm 11.19.0/PostgreSQL 16.15 ready. C1 installed the unchanged lockfile with `npm ci`, copied the disposable local configuration, and sources `/workspace/.ppo-tools/env.sh` in every shell. M2's fresh required-channel probe confirms absent Chrome. Database-mutating suites are serial across worktrees.

```sh
npm run check
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=300000 tests/database/agreement-charge-finance.test.ts
# Corrected fixture/assertion rerun:
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=300000 --test-name-pattern='C1-1 (Accepted|Returned)' tests/database/agreement-charge-finance.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=300000 --test-name-pattern='C1-1' tests/database/agreement-charge-upgrade.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=300000 --test-name-pattern='SV08|C1 command-only' tests/database/maintenance-upgrade.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=300000 --test-name-pattern='PD upgrade from (127|128)' tests/database/products-upgrade.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=300000 tests/demo/upgrade.test.ts
python3 scripts/build-contacts-design.py --check
```

Focused regressions cover consumed/OutcomeUnknown successors, immutable prior Finance revisions, single exact target recovery, reserved term/removal refusal with no audit/receipt/outbox changes, Returned cross-revision transfer versus concurrent submit, and direct SQL races. Populated-0127 proof retains consumed and unknown targets/holds through upgrade and original recovery. A separate 0127 fixture reproduces the old SQL duplicate and proves atomic migration refusal. The compiled HTTP case now attempts a duplicate through the approved successor while the original outcome is unknown. The restart harness now supersedes and withdraws the source before restarting both actual processes.

The first focused run passed 11/14 cases. Two new recovery cases correctly reached Reconciled but asserted Processed; the new Returned-transfer fixture incorrectly sent the create-only body id to the revise route. Those assertions/payloads were corrected to the existing contract. The corrected three-case rerun passed 3/3, including the competing submission. No runtime guard was changed for these test failures. All 14 cases are therefore covered across the initial and corrective runs, not a claimed single green initial run. The populated/duplicate 0127 upgrades both passed. Further delivery results are recorded below. Earlier successful checks remain historical evidence, not an assertion that they were rerun. Local checks, final-head CI, independent new-migration review/finding confirmation and operational acceptance remain separate. No full TS-01/02, six-monthly scenario execution, real PDF/browser, claim output or live integration is claimed.

Application validation: `npm run check` passed Studio, full lint, TypeScript, 1,452 units and build. That build began before the parent M2 merge; inspection of the emitted Finance chunk showed the older default query. After the conflict-free parent integration, `npm run build` was rerun and passed; the emitted JavaScript now contains the authorised-scope equality and approved_at guard. Final test/helper edits pass focused ESLint and Prettier checks. The Contacts artifact remains deterministic and 103/103 model groups pass. No pin update was needed for this correction.

Final source review added a repeatable-read challenge. The initial row-lock-only 0128 guard allowed the second insertion from an older snapshot (the test rolled that insertion back). The correction fences the existing workspace row with a logical no-op write; it preserves every stored workspace field and makes the stale writer abort with 40001. This changes no historical 0127 bytes. The complete 15-case C1 suite, both 0127 upgrades and compiled HTTP are rerun against the corrected 0128 before the final restart proof. Earlier results are retained separately, including the failing snapshot control.

### Final correction results

- **15/15 final C1 database cases pass**, including late transaction rollback, accepted-effect recovery, permissions/stale source/exact cents, Returned hold transfer, default-isolation SQL race and the older repeatable-read snapshot refusal. [Final results](review-database-final.txt), [initial fixture failures](review-database-initial.txt), [corrected fixtures](review-fixtures-corrected.txt) and [snapshot negative control](review-snapshot-before.txt).
- **2/2 final 0127 upgrade cases pass**: exact populated consumed/unknown history and original recovery; old duplicate reproduction and atomic refusal. [Results](review-upgrade-final.txt). The selected **2 late-Maintenance**, **2 reserved-Products 127/128**, and **7 demo-upgrade** cases passed before the snapshot-only guard refinement; they were not rerun afterward and are not represented as final-guard executions. [Maintenance](review-late-upgrade.txt), [Products](review-products-upgrade.txt), [demo](review-demo-upgrade.txt). The **1 populated-0126 upgrade** also passed before that refinement with the explicitly opted-in synthetic renderer for its inherited ProjectClaim fixture; it is command/data preservation evidence, not a real PDF. [Result](review-126-upgrade.txt).
- **1/1 final compiled HTTP case passes**, including a title-only successor, independent approval, duplicate refusal and original unknown-outcome lookup. The server loads no renderer mocks. [Result](review-http-final.txt).
- **Actual app/PostgreSQL restart passes** on the final guard, after source supersession and withdrawal: six original HTTP receipts, exactly five new sign-in audit rows, two replay-safe recovery commands, one exact AUD 4,800.00 target, one attempt, one Consumed hold and Matched reconciliation. The same build ID spans different app process identities and different database postmaster times. [Machine-readable result](review-restart.json). [No-restart control](review-no-restart.txt) correctly refuses before any command replay.
- Full application check: **1,452 unit tests**, Studio/lint/TypeScript and build passed; final build rerun includes the merged M2 query. Final test/helper type/lint/format checks passed. Contacts: deterministic artifact, **103/103 groups**. Foundation/prototype/naming/migration/status checks and **44 documentation tests** passed; current-main integration and final documentation-scope checks follow the evidence commit. [Log digests](review-log-digests.json).

Additional actual commands (each shell sources `/workspace/.ppo-tools/env.sh`):

```sh
# Historical 0126 proof; only this extra upgrade uses synthetic document bytes:
PPO_B2_SYNTHETIC_RENDERER=command-proof-only node --env-file=.env.local --experimental-test-module-mocks --import tsx --import ./tests/helpers/project-claims-synthetic-renderer.mjs --test --test-concurrency=1 --test-timeout=300000 --test-name-pattern='C1 populated 0126' tests/database/agreement-charge-upgrade.test.ts
npm run build
PPO_ALLOW_RESET=dispose-synthetic PPO_RESET_DATABASE=ppo_synthetic_test npm run db:reset
node --env-file=.env.local --import tsx scripts/local-server.ts --compiled
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=300000 tests/http/agreement-charge-finance.test.ts
PPO_ALLOW_RESET=dispose-synthetic PPO_RESET_DATABASE=ppo_synthetic_test npm run db:reset
PPO_RESTART_SERVER_PID=16042 node --env-file=.env.local --import tsx tests/helpers/agreement-charge-restart.ts write /workspace/work/c1-review-restart-final
PPO_RESTART_SERVER_PID=16042 node --env-file=.env.local --import tsx tests/helpers/agreement-charge-restart.ts verify /workspace/work/c1-review-restart-final
# Expected refusal: actual app restart has not occurred. Verify this assertion, PID cmdline and cwd before stopping the owned server.
kill -TERM 16042
env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock restart ppo-postgres
node --env-file=.env.local --import tsx scripts/local-server.ts --compiled
PPO_RESTART_SERVER_PID=17529 node --env-file=.env.local --import tsx tests/helpers/agreement-charge-restart.ts verify /workspace/work/c1-review-restart-final
```

Main advanced to `935e5776f866bd2459efba6e3852057afc99614e` through #911's two Service design documentation files, with no runtime/migration changes. C1 integrates it before final push. M2 was marked ready externally during this session at unchanged `e8f9124cd`; that state is preserved, with replacement full CI queued/pending and earlier superseded cancellations distinguished from a successful run. C1 stays draft and stacked; its final-head CI, independent review of new migration 0128/C1-1 and Dean's M2 merge remain outstanding. Retarget C1 after M2 merges and verify the resulting main-based contribution. No full scenarios or operational acceptance is implied.

## Remaining review findings C1-2–C1-4 — 11 November 2026

Claude's [review at c58b2c94](https://github.com/deanrfiedler-gif/powerplants-one/pull/905#pullrequestreview-5852407753) confirms C1-1 and independently reviews 0128, but finds a lossy native amendment/approval bypass, ambiguous later-start renewal wording and a restart-harness false positive. Dean instructed the next step after checking merge readiness. This continuation [claimed those findings](https://github.com/deanrfiedler-gif/powerplants-one/pull/905#issuecomment-6787092009) and [recorded the bounded choices](https://github.com/deanrfiedler-gif/powerplants-one/pull/905#issuecomment-6787113512). M2 is now merged; C1 was already retargeted to `main` and marked ready externally. Main `a65ac3f4a9a675f68c47567d8070a098b4f31b3f` is integrated without conflicts. The ready state is preserved, not treated as merge or business acceptance. Other active branches are untouched.

### Corrections

- **C1-2:** after any charged revision, a successor must explicitly carry a schedule. Complete omission before reservation returns `InvalidData`; existing Held/Consumed refusal remains `AgreementChargeReserved`. A legacy chain of schedule-less successors still requires an independent Finance reviewer with `finance.review` at every current and historically charged site. The native form cannot carry the schedule, so successor preparation is withheld with a clear unavailable notice; uncharged agreements retain their form. No charge editor, schedule-removal policy, grant or migration is introduced. The owning page contract, existing guide paragraphs and component consumer binding record the limitation.
- **C1-3:** the existing fail-closed date and reserved-term rules remain. Contracts now state that every reserved due date must remain inside the successor term. The supported renewal pattern retains the original effective start and extends the end; a separate later-start term excluding those dates uses a new agreement. A new fee has a new UUID. The regression consumes the original charge, proves both invalid later-start alternatives refuse without effects, and approves the supported extension with one original target/Consumed hold retained. No historical-date exemption, pricing authority or automatic renewal fee is added.
- **C1-4:** the helper verifies the compiled PID's checkout and actual socket ownership: `/proc/<pid>/fd` socket inode must match the LISTEN entry for the configured IPv4 loopback port. Verification also requires the old PID to be absent, the same build ID, changed PostgreSQL postmaster identity, and the same proven listener through recovery. It fails closed if those facts cannot be read. A compiled decoy on port 3001 cannot validate HTTP served on port 3000.

0127 and 0128 remain byte-for-byte unchanged from `c58b2c94`. Approval changes use existing duties and immutable source history; historical schemas without schedules still work. Original receipts and the existing Finance holds, audit and recovery paths remain in use.

### Fresh validation

The earlier successful cloud setup is reused; every Node shell sources `/workspace/.ppo-tools/env.sh`. Only disposable `ppo_synthetic_test` is used. No renderer mock is loaded in these new C1 tests.

- `npm run check` passes Studio, lint, TypeScript, **1,452 unit tests** and production build. A final `npm run build` passes after the six narrow agreement-guide paragraph edits, so the compiled HTTP/restart proof includes them. Final build ID: `lBlhGgAqS6Soj74WnNyr0`.
- **18/18 complete C1 database cases pass**: the original fifteen plus three new correction cases. [Raw result](remaining-review-database.txt). The first focused run passed two cases and failed the legacy-approval assertion because it expected `Forbidden`; the authority layer correctly returned `RecordUnavailable`. That exact expected code was corrected, with no runtime change, and the focused 3/3 and complete 18/18 reruns pass. [Initial failure](remaining-review-initial.txt).
- **2/2 selected 0127 upgrade cases pass**, including preserved history/recovery and duplicate-history refusal. [Result](remaining-review-upgrades.txt). **3/3 existing MA01/MA02/MA05 compatibility cases pass**, covering uncharged agreement identity/approval, source successors and renewal ownership. [Result](remaining-review-maintenance.txt). Earlier full migration/Products/demo evidence remains historical; unchanged migrations do not justify repeating every earlier proof.
- **1/1 ordinary compiled HTTP case passes**, now also refusing a lossy schedule omission before exercising the existing claim/recovery pipeline. [Result](remaining-review-http.txt).
- Contacts artifact remains deterministic; **103 model groups pass**. Focused ESLint/format checks, Studio after the binding changes, foundation/prototype/naming/migration/status/scope checks and **44 documentation tests** pass. [Local log digests](remaining-review-log-digests.json) distinguish those executions.
- Required Chrome is still absent at `/opt/google/chrome/chrome`; the fresh `npm run browser:check` fails. The new desktop/mobile form-boundary case is discoverable (**11 cases including warm-up** in that file's two projects), but is not executed locally. Final-head Chrome CI and visual acceptance are separate. No full TS-01/TS-02 or real PDF evidence is claimed.

Actual check commands:

```sh
npm run check
npm run build
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=300000 tests/database/agreement-charge-review.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=300000 tests/database/agreement-charge-finance.test.ts tests/database/agreement-charge-review.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=300000 --test-name-pattern='C1-1' tests/database/agreement-charge-upgrade.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=300000 --test-name-pattern='MA01|MA02 a later|MA05' tests/database/maintenance.test.ts
npx --no-install eslint src/maintenance/agreements.ts src/components/maintenance-record-actions.tsx tests/database/agreement-charge-review.test.ts tests/helpers/agreement-charge-restart.ts tests/http/agreement-charge-finance.test.ts tests/browser/maintenance.spec.ts
npx --no-install prettier --check src/maintenance/agreements.ts tests/helpers/agreement-charge-restart.ts tests/database/agreement-charge-review.test.ts tests/http/agreement-charge-finance.test.ts
npm run studio:check
python3 scripts/build-contacts-design.py --check
node scripts/check-contacts-model.mjs
npm run browser:check
npx --no-install playwright test tests/browser/maintenance.spec.ts --list
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
python3 scripts/check_migrations.py
python3 -m unittest discover -s scripts -p 'test_documentation*.py'
python3 scripts/build_status.py --check
python3 scripts/check_documentation_scope.py --base origin/main --head HEAD
```

### Actual restart and negative controls

A private Python subprocess orchestration (`/workspace/work/c1-r2-restart-run.py`) owns each server PID, waits for `/login`, records each child result, and uses `terminate()`/`wait()` on only its own server children. It executes the commands below serially and stops every child in `finally`. Its logs and full checkpoint remain private; the bounded [verification result](remaining-review-restart.json) is retained here.

```sh
PPO_ALLOW_RESET=dispose-synthetic PPO_RESET_DATABASE=ppo_synthetic_test npm run db:reset
node --env-file=.env.local --import tsx scripts/local-server.ts --compiled
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=300000 tests/http/agreement-charge-finance.test.ts
PPO_ALLOW_RESET=dispose-synthetic PPO_RESET_DATABASE=ppo_synthetic_test npm run db:reset
PPO_RESTART_SERVER_PID=34832 node --env-file=.env.local --import tsx tests/helpers/agreement-charge-restart.ts write /workspace/work/c1-r2-restart
PPO_RESTART_SERVER_PID=34832 node --env-file=.env.local --import tsx tests/helpers/agreement-charge-restart.ts verify /workspace/work/c1-r2-restart
# Expected no-application-restart refusal, before replay.
PPO_PORT=3001 node --env-file=.env.local --import tsx scripts/local-server.ts --compiled
env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock restart ppo-postgres
PPO_RESTART_SERVER_PID=34947 node --env-file=.env.local --import tsx tests/helpers/agreement-charge-restart.ts verify /workspace/work/c1-r2-restart
# Expected listener-ownership refusal; original PID 34832 is still serving :3000.
# The orchestration terminates/waits for decoy 34947 and original 34832, then:
env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock restart ppo-postgres
node --env-file=.env.local --import tsx scripts/local-server.ts --compiled
PPO_RESTART_SERVER_PID=35333 node --env-file=.env.local --import tsx tests/helpers/agreement-charge-restart.ts verify /workspace/work/c1-r2-restart
```

The [no-restart control](remaining-review-no-restart.txt) and [decoy control](remaining-review-decoy.txt) both fail at their intended assertions before recovery mutations. The genuine cycle passes after source supersession and withdrawal: six inert original receipts, exactly five fresh Accepted Session audit rows, two replay-safe recovery commands, one AUD 4,800.00 target, one processing attempt, one Consumed hold and Matched reconciliation. The same build spans different actual listener PIDs and different postmaster times; the old PID is absent. All owned servers are stopped. Final-head CI and Claude's confirmation of C1-2/C1-3/C1-4 remain outstanding at handover; no merge, deployment or operational acceptance.

## CI follow-up — 12 November 2026

At `330b76292cf5ce2daa72393328d6eebfcc95140f`, 21 of the 23 PR workflow summaries succeeded. Two failed: [Application assurance](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/42961817026) and [Azure demo preparation](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/42961817024). The [claim](https://github.com/deanrfiedler-gif/powerplants-one/pull/905#issuecomment-6812133136) and [disposition](https://github.com/deanrfiedler-gif/powerplants-one/pull/905#issuecomment-6812215937) bound this continuation. Main remains `a65ac3f4a9a675f68c47567d8070a098b4f31b3f`; other active workstreams are untouched.

- Application's ordinary desktop browser-2 job passed 401 cases, skipped 16 and failed the planner controlled-move case at `planner.spec.ts:388`: no dialog after `dragTo`. Its aggregate failed because that job failed. All database shards, HTTP and Finance jobs passed. The same controlled-move case passed in the compiled desktop and mobile jobs. This does not establish the original failure's cause. A failed-jobs retry was requested at the unchanged head; no planner code or assertion was changed.
- Azure demo passed five cases and failed its first desktop planner assertion at `ui.spec.ts:63`. The [retained failure screenshot](ci-demo-timeout.png) shows the week planner rendered after the assertion timed out. Configuration inspection independently reproduced a missing dependency: `playwright.demo.config.ts` inherits `warm-up`, but its `testDir: tests/demo` hides `tests/browser/warm-up.setup.ts`. Before the correction, discovery listed only six UI cases and selecting warm-up reported no tests. Pinning that dependency's directory restores the existing route-compilation warm-up before both browser projects. All six UI cases, their assertions and deadlines remain unchanged. The exact timeout cause still needs a successful corrected CI execution; the configuration defect is directly demonstrated.
- [Compiled browser assurance](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/42961816733) actually executed all four browser groups. In particular, C1-2 passed on desktop and mobile; this supersedes the earlier lack of executed C1-2 browser evidence at that historical head. The retained group's separate broad-browser step was skipped because the four groups own it, not because the PR was a draft. [Selected job log lines and failure disposition](ci-failure-triage.json) retain the distinction.

Local commands source `/workspace/.ppo-tools/env.sh`. An initial discovery without the local environment file refused synthetic identity, as intended; the corrected command below established the six-case baseline and then the [seven-case discovery](ci-demo-discovery.txt). Fresh `npm run browser:check` still refuses because `/opt/google/chrome/chrome` is absent. Local browser execution is left to CI under the repository cloud-setup rule; no alternative browser, synthetic rendering or increased timeout is used.

```sh
node --env-file=.env.local node_modules/playwright/cli.js test --config=playwright.demo.config.ts --list
node --env-file=.env.local node_modules/playwright/cli.js test --config=playwright.demo.config.ts --project=warm-up --list
npm run browser:check
npm run check
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
python3 scripts/check_migrations.py
python3 scripts/build_status.py --check
python3 -m unittest discover -s scripts -p 'test_documentation*.py'
python3 scripts/check_documentation_scope.py --base origin/main --head HEAD
```

Local `npm run check` passed Studio, lint, TypeScript, all 1,452 unit tests and the production build. Foundation, prototype, naming, migration and status checks passed, as did all 44 documentation tests. The corrected warm-up-only discovery lists exactly one setup case. Fresh database/HTTP/restart proofs were not repeated because no runtime or migration changed; their executed incoming-head CI and prior local evidence remain separately identified. The final PR handover records documentation-scope and final-head CI state. Publishing the correction supersedes the still-running incoming-head drag retry under existing workflow concurrency; no passing retry result is claimed. The replacement final-head browser-2 run must resolve that signal.

This correction changes only demo test configuration and delivery evidence; application code, migrations, Finance rules and scheduling policy are unchanged. C1-2/C1-3/C1-4 confirmation by Claude remains outstanding. No full TS-01/TS-02, operational acceptance, merge or deployment is claimed.
