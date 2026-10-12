---
document_id: PPO-PJ-OVERVIEW-BACKEND-EVIDENCE
date: 2026-10-13
owner: Dean Fiedler
status: Synthetic backend verification passed; independent review and acceptance separate
versioning: git
---

# Projects receiving and overview backend execution evidence

Authority and definitions: [PJ-01/PJ-02 contract](../../../decisions/project-overview-backend.md). [PR #461](https://github.com/deanrfiedler-gif/powerplants-one/pull/461) is a dependent contribution on `codex/projects-overview-backend`. It retains original PJ-04 head `9b87786ff27b19a1c007876beea5a50b783889f4` and updated parent #458 head `0213e8dce94d94f5beadf344189c95447a79a706` by ancestry. The [execution ledger](execution.json) pins runtime/tests/workflow to source `ef2c280811df1bfe4960ef8f07d59b0645e581b6` and records normalised LF hashes. Subsequent evidence-only edits do not change that tested code.

The [complete Projects CI run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38320022294) passed on that source. It used Ubuntu 24.04, pinned Node 24.21.0/npm 11.19.0 and PostgreSQL 16.15. Local verification used Windows and the same pinned runtime/database versions, a private loopback cluster on port 56417 and disposable `ppo_synthetic_test`. Credentials and command logs remain outside Git. No operational data or external system was used.

## Actual verification

| Check | Result |
|---|---|
| New date, timezone and transitive-successor units | 2 passed locally; included in passing current-source CI unit run |
| Scoped database suite | 31 passed in CI: five new overview/receiving cases plus existing schedule, baseline, RAID, native Sales receiving and shell regressions |
| Corrected native receiving regression | Passed locally: stale version refusal, exact replay/attribution, commercial source drift, successor history and source revocation |
| Compiled HTTP | 4 passed in fresh current-source CI: two new receiving/overview and two existing RAID/Activity cases |
| Real PostgreSQL/application-process restart | Passed locally and in CI; exact overview, portfolio, Sales acceptance, schedule, RAID history and original receipts retained |
| Existing React layout and desktop/phone journeys | 5 layout and 5 journey tests passed in CI; this is retained existing-page regression evidence, not implementation/review of a new Project page |
| Type, lint, units, production build and design register | Passed in current-source CI |
| Foundation and naming | Foundation passed in CI on the tested source; final local naming passed with no errors. Duplicate local foundation scan stopped under host load without a result; final-document CI remains separate |
| Added PJ-09 closed-project assertions | Local setup hit the existing connection timeout before assertions; the broad application database CI remains separate |

## Failures and corrections

The first local five-case run passed three cases and failed two: the new all-table preservation helper opened 16 connections concurrently and hit the existing 3-second connection timeout; the new receiving fixture omitted the dated follow-up required by native Sales submission. The helper now compares the same full rows sequentially on one connection, and the fixture supplies a dated native Activity.

The first CI database run at `766b802` passed 30 of 31 cases. The remaining new test incorrectly expected Activity completion to change the accepted commercial source hash. The corrected test proves completion leaves that hash unchanged, then uses a native structured Opportunity scope edit to prove source drift while preserving the original acceptance. An incorrect HTTP task-save expectation was also corrected to the endpoint's existing 200 response. The final clean CI run passes. No assertion, timeout or business rule was relaxed.

Subsequent local runs encountered cold connection and statement timeouts during setup. Unmodified main `c3ff5b90d0730f55583b6ee73f9d1af4a449695e`, exported separately, reproduced `Connection terminated due to connection timeout` after 3,014 ms on a read-only `SELECT 1` with the same private environment. Database/configuration source is identical to main. The local PJ-09 attempt stopped in its reset hook with the same error and is not claimed passed. An incidental read during schema reset is not application verification.

The local compiled HTTP attempt was not a final-source proof: the earlier build lacked the last variance reason, and `db:seed` correctly skipped already-applied seeds, leaving the deliberate permission revocation in place. Both cases failed in that setup. The CI workflow already rebuilds current source and resets the disposable database before HTTP; its passing result is the compiled API evidence. These local failures remain visible rather than being relabelled successful.

The [foundation CI check](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38320022313/job/115045615672) passed on the pinned source. The final local naming check passed (zero errors; 7,995 project-instruction characters). A duplicate final local foundation scan made no result available under host load and was stopped; it is not recorded as passed. Final-document CI remains separate.

## Remaining boundaries

No page, shell or shared component is changed. Accepted Figma implementation, related-domain summaries, full merged history/record position, operational calendars/actuals, owner/device review and deployment remain open. All scope IDs, issued references, parent IDs and review fingerprints remain unchanged. No new schema, seed, grant, capability, service or dependency is introduced. Source presence and synthetic functional proof do not establish business acceptance or full PRJ-01-08 completion. Independent PR review, broader cross-module CI, merge and deployment remain separate.
