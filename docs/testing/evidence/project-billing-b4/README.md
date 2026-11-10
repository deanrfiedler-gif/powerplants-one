# B4 project-linked work cost evidence — 10 November 2026

Owner: Codex. Implementation: [PR #893](https://github.com/deanrfiedler-gif/powerplants-one/pull/893), continuing Claude’s claim and explicit branch transfer. Scope: billing decision R3; PRJ-01, PRJ-05, FIN-05, FIN-06, SVC-03; TS-01 F-02; AT-18/31/38 remain separate acceptance records.

## Verified starting point

B2 #881 and B3 #883 are merged. B3’s reviewed fix head is `ff3f04572ee624b20f157b5114c0e72e78c27db0`; Claude confirmed all five findings, including bounded post-effect reconciliation, in review 5834959542. The initial integration used main `ceaa98c4595bc404384bc413307a9bfbe2af22cb`; final integration uses `1888cc81d4c99e68836390110a6655e767fa17d5`. The existing B4 draft `1845dfec` was merged with main in a dedicated worktree; no implementation was written in the shared checkout.

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

Implementation commit `bbee5a57e` and conflict-free main integration `8eb2f4865` were validated as follows. [Retained case results](validation.json) include names, counts and source-log digests; repeated targeted runs are not extra coverage.

| Check | Local result |
| --- | --- |
| Integrated `npm run check` | Passed: Studio, full lint, TypeScript, 1,449/1,449 units and production build |
| New B4 database coverage | 16/16 passed; strengthened Approved cancellation and TS-01 public measures rerun; final integrated TS-01 currency/tax assertions passed |
| Compiled HTTP refusal/non-disclosure | 1/1 passed on the initial and final integrated builds; normal application server, helper only in client fixture setup |
| Historical upgrades | quality-upgrade 3/3; finance-upgrade 2/2; project-claim-finance-upgrade 1/1 |
| Existing ProjectClaim Finance and same-name mapping | 8/8 and 7/7 |
| Existing Finance boundaries | All 28 cases passed: 19 completed in the original aggregate run, remaining 9 in a fresh process |
| Existing finance.test.ts | 15/16 passed; the sole OUT-14 PDF-size failure reproduced on unmodified main with the same synthetic-byte renderer |
| Documentation | Foundation, prototype, naming, migration, status, documentation-scope, 44 documentation unit tests and whitespace checks passed |
| Contacts | Deterministic issued-artifact check passed; pinned `src/finance/context.ts`, source pin and artifact are unchanged |

The existing regression selection therefore has **64 passes and one renderer-dependent failure across 65 distinct cases**, including all six historical upgrade proofs. The OUT-14 assertion `bytes.bytes.length > 1000` fails identically on untouched main `1888cc81d`; the helper emits short synthetic bytes. The assertion is unchanged. This is not a green real-renderer suite.

The first aggregate boundary run was stopped after 19 completed cases because repeated resets slowed this environment. Successful cases were preserved, and the remaining nine ran with an exact positive name selector. An unsupported skip-option attempt ran no tests; a negative-selector attempt repeated a few existing cases and was stopped. Neither counts as additional coverage. Local command proofs used a 300-second per-test harness timeout; repository and CI deadlines are unchanged.

Full rendered CI, browser/restart coverage and Claude’s independent review remain outstanding at this evidence commit. PR #893 records the subsequent ready-head CI status and review handover. No merge, deployment, real data, real ERP effect or executed TS-01 acceptance is claimed.
