# B4 project-linked work cost evidence — 10 November 2026

Owner: Codex. Implementation: [PR #893](https://github.com/deanrfiedler-gif/powerplants-one/pull/893), continuing Claude’s claim and explicit branch transfer. Scope: billing decision R3; PRJ-01, PRJ-05, FIN-05, FIN-06, SVC-03; TS-01 F-02; AT-18/31/38 remain separate acceptance records.

## Verified starting point

B2 #881 and B3 #883 are merged. B3’s reviewed fix head is `ff3f04572ee624b20f157b5114c0e72e78c27db0`; Claude confirmed all five findings, including bounded post-effect reconciliation, in review 5834959542. Current main at branch integration was `ceaa98c4595bc404384bc413307a9bfbe2af22cb`. The existing B4 draft `1845dfec` was merged with main in a dedicated worktree; no implementation was written in the shared checkout.

B3 Application assurance [run 42730198494](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/42730198494) is successful. Its latest database-3 job `129594485114` passed controlled renderer installation, static/unit/build checks and the real PostgreSQL suite. The returned final-head workflow runs were successful. The obsolete installation failure required no new retry, and no successful job was rerun. The workflow query for the main merge SHA returned no runs; this is not a claim of fresh post-merge main CI or merged-tree assurance.

## Implementation and proof boundaries

- Live schema-tolerant WorkOrder link checks run after Finance authorisation and under the existing workspace command lock at submit, approval and begin processing. All non-NonBillable dispositions are refused; Closed projects remain linked. No project details are fetched or disclosed.
- Backend sources expose allocation defaults; draft save/revision supplies the contract reason when omitted for linked work. Explicit reason changes preserve disposition enforcement. No UI consumes this new default in this PR.
- The guard is deliberately separate from `currentRevision`, so AwaitingERP dispatch, original-operation lookup, post-effect reconciliation/corrections and ProjectClaim behavior remain unchanged.
- `finance-project-work.test.ts` uses B1’s real link command before attendance starts. Explicit test-only `SET LOCAL session_replication_role = replica` transactions simulate historical link changes and Closed state only where B1 correctly forbids changing a started work order. They are not application escape hatches or native-closeout evidence. The tests challenge Labour/parts, revised Returned Drafts, each boundary with changing links, Closed projects, unresolved dispositions, reason defaults, safe Return/Cancel, unknown-effect recovery and unlinked F-06.
- `finance-project-ts01.test.ts` uses the same linked field graph and the native commercial/schedule/evidence/Finance commands for M1–M4 and V-01, exactly $135,090.00 ex GST. It uses native acceptance stage and project closeout, then reconciles the already processed claim. Existing acceptance fixture sources and recipient relationships are synthetic. B2 completion authority comes from reviewed Library evidence; this component does not assert that B2 has native milestone/acceptance-stage selectors. The full TS-01 procedure closes the acceptance stage before claiming M4, and keeps the project Active through claim dispatch. It asserts no-posting field reconciliation, exact claim amounts/identity, consumed entitlements and unavailable billed/cash/receivable measures.
- This connected Finance component is a bounded 90-minute/2-part fixture, not the scenario’s 116 hours, three visits, full upstream quotation contents, complete browser journey or business acceptance. Claim UI and claim OUT-14, retentions, progress claims, schedule-of-rates/cost-plus, reversals and real ERP remain outside this increment.
- The compiled HTTP test checks status, code, exact generic message and absence of project identifiers for a Finance actor without project read. It runs exclusively because its fixture uses the deterministic field appointment.

The acceptance CSV remains unchanged: it enumerates AT acceptance IDs, not TS step IDs. TS-01 retains its own procedure and run log, with links to AT-18/31/38; no new acceptance result is inferred. The Stage 10 procedure uses the existing B1 Link a work order control or typed create API, not an unimplemented Raise field work button.

## Execution

Cloud setup succeeded with Node 24.21.0, npm 11.19.0 and disposable PostgreSQL 16.15. `npm run browser:check` was attempted and failed because `/opt/google/chrome/chrome` is absent. Database command proofs explicitly load the existing `project-claims-synthetic-renderer.mjs`; its bytes are not rendered PDF evidence and the application server does not load it.

Reproduction for the command-only database proofs (source the successful cloud setup environment first):

```sh
PPO_B2_SYNTHETIC_RENDERER=command-proof-only node --env-file=.env.local \
  --experimental-test-module-mocks --import tsx \
  --import ./tests/helpers/project-claims-synthetic-renderer.mjs \
  --test --test-reporter=tap --test-concurrency=1 --test-timeout=300000 \
  tests/database/finance-project-work.test.ts \
  tests/database/finance-project-ts01.test.ts
```

Validation is in progress; final results and retained summaries will be recorded before handover. Full rendered CI and Claude’s independent review are outstanding. No merge, deployment, real data, real ERP effect or executed TS-01 acceptance is claimed.
