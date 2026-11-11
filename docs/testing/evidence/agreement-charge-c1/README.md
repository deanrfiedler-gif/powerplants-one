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

0128 changes functions/indexes/triggers only. Both allocation and agreement-revision guards take the existing workspace row lock. The allocation guard derives the agreement from immutable charge provenance and rejects a competing Held/Consumed charge across revisions; the revision guard refuses removal or changed reserved terms. It neither rewrites rows nor adds grants/seeds. An ambiguous pre-fix duplicate-live history makes migration fail before any new object is committed, preserving its original ledger for explicit reconciliation.

All current-version migration assertions were searched and extended, including the computed from-0025 lengths, policy lists, Products reserved-0052 starting points (including 128), late-Maintenance dependencies 0051/0123/0127/0128, and hosted-demo upgrade count/gate. Prior starting points and original ledger assertions remain. No historical migration bytes are changed.

### Commands and evidence boundary

The sibling M2 setup completed with Node 24.21.0/npm 11.19.0/PostgreSQL 16.15 ready. C1 installed the unchanged lockfile with `npm ci`, copied the disposable local configuration, and sources `/workspace/.ppo-tools/env.sh` in every shell. M2's fresh required-channel probe confirms absent Chrome. Database-mutating suites are serial across worktrees.

```sh
npm run check
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=300000 tests/database/agreement-charge-finance.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=300000 --test-name-pattern='C1-1' tests/database/agreement-charge-upgrade.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=300000 --test-name-pattern='SV08|C1 command-only' tests/database/maintenance-upgrade.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=300000 --test-name-pattern='PD upgrade from (127|128)' tests/database/products-upgrade.test.ts
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=300000 tests/demo/upgrade.test.ts
python3 scripts/build-contacts-design.py --check
```

Focused regressions cover consumed/OutcomeUnknown successors, immutable prior Finance revisions, single exact target recovery, reserved term/removal refusal with no audit/receipt/outbox changes, Returned cross-revision transfer versus concurrent submit, and direct SQL races. Populated-0127 proof retains consumed and unknown targets/holds through upgrade and original recovery. A separate 0127 fixture reproduces the old SQL duplicate and proves atomic migration refusal. The compiled HTTP case now attempts a duplicate through the approved successor while the original outcome is unknown. The restart harness now supersedes and withdraws the source before restarting both actual processes.

Execution results and any corrected failures are recorded below when complete. Earlier successful checks remain historical evidence, not an assertion that they were rerun. Local checks, final-head CI, independent new-migration review/finding confirmation and operational acceptance remain separate. No full TS-01/02, six-monthly scenario execution, real PDF/browser, claim output or live integration is claimed.
