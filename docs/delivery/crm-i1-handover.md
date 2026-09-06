# BP-03 I1 — Owned opportunity and qualification follow-up

**Revision:** r01 · **Date:** 6 September 2026 · **Owner:** Dean Fiedler · **Status:** In progress; not verified or merged.

Implementation issue [#39](https://github.com/deanrfiedler-gif/powerplants-one/issues/39) is linked to discovery parent [#9](https://github.com/deanrfiedler-gif/powerplants-one/issues/9), which remains open. [ADR-0015](../decisions/ADR-0015-crm-i1-owned-opportunities.md) records the bounded implementation choices. The [external publication record](https://github.com/deanrfiedler-gif/powerplants-one/issues/39#issuecomment-5557831957) owns final identities and actual merged-main results; this file does not claim its own future SHA. [PR #40](https://github.com/deanrfiedler-gif/powerplants-one/pull/40) is the review surface. [I2 starter](crm-i2-starter.md) is preparation only.

Starting main was `ddc1a3cce769e011939e621d8d5f176542f48f8c`, tree `d6d374ec30c620276e402d6a15f5adbc4d25bf02`. [Discovery publication](https://github.com/deanrfiedler-gif/powerplants-one/issues/9#issuecomment-5557062585) was verified. P09 #36 / draft #37 remained active at `9931e3c4501e7aa4d44140066b882b8985ba2a61`; it is not counted as delivered. An independent local clone at that exact main/tree and `feature/crm-i1-owned-opportunities` preserve all unrelated worktrees. Migration 0010/ADR-0015 are reserved after P09 0009/ADR-0014; accepted ordering must be reconciled before merge.

The current implementation adds typed opportunity/config/event persistence, Internal Activity links, three scoped CRM capabilities, guarded create/qualify/next-action commands, current-permission receipts and online responsive screens. No completed implementation, runtime checks or business acceptance is claimed yet. Local Python foundation/prototype/naming checks passed before this in-progress handover; exact local runtime pins are unavailable (Node 24.19.0/npm 11.9.0 versus 24.20.0/11.19.0), so pinned disposable CI is the runtime evidence environment.

Remaining: actual database/HTTP/browser/restart/upgrade/reseed verification, visual inspection, current P09/main reconciliation, complete handover/traceability and I2 starter, review/check assessment, normal expected-head merge and actual merged-main verification. D-013/D-025/full AT-25 and account parity remain unresolved. No operational Pipedrive read expansion/mutation/import, integration, communication, Finance, hosting or access-setting change.

## First disposable CI disposition

Head `2da09aa2f2b5f5e5312a203315aa888e03f2ece0`, tree `3d018bb89e0e771259c5f59a1a25ea8aa1ad921c`: documentation run 34018514075 and CRM design run 34018514058 passed. Application run 34018514060 attempt 1 failed at TypeScript before database/HTTP/browser execution: six implicit-any callbacks resulted from the untyped opportunity context projection. Added an explicit Opportunity row and typed context projection; rerun pending. No runtime acceptance is claimed for this head.

Application run 34019598311 attempt 1, source head `5739e6745622ae76891fbdf5dcfc058013f77982`, tree `f173c8e9cf16a0965b73ebc7e608aa66780dc232`, failed because temporary pinned formatting-review TypeScript copies were generated inside the broad compiler include path. No source-file TypeScript error was reported; no database/HTTP/browser gate ran. Adopted the unchanged-head pinned Prettier 3.9.6 output from artifact 9985047820 (SHA-256 `6bf3f8fec168272d252f78a3aabd36bff42b755519b3ac9c1b340e358f10c7d5`) and removed the temporary workflow step. Compiler configuration and runtime gates remain unchanged. Documentation 34019598302 and CRM design 34019598288 passed.

Application run 34019207722 attempt 1, source head `97d698c68f80a2174f91970b9c420363bfd87f40`, tree `fe04603391d480f40c1227ed012e230815a1574c`, passed lint/type/build, all 9 unit tests, fresh migration/seed and guarded reset. PostgreSQL executed 184 cases: 59 passed, 125 failed. The new all-target visibility SQL reused `co` for both the Opportunity and inner Organisation alias, producing a parse error even in earlier Activity flows. Renamed the inner alias; all-target filtering remains. Four old upgrade assertions expected eight migration rows; changed only those to assert the exact expanded sequence `[1,2,3,4,5,6,7,8,10]`, retaining the old record/byte/hash/revocation assertions. No database acceptance or downstream HTTP/browser/restart proof is claimed for this failed run. Full rerun required.

## Implemented files and contracts under verification

`src/crm/context.ts`, `validation.ts`, `opportunities.ts`, `reads.ts` and `receipt-authority.ts` contain the domain boundary. Three commands reuse the existing shared operation/workspace transaction, registry/reference allocator, audit, receipt and minimal outbox. `src/app/api/v1/crm/` contains thin routes; `src/app/(business)/crm/` and `src/components/crm-screens.tsx`/`crm-state.ts` provide the online worklist/create/detail/qualification/action journey. Canonical Organisation/Person/Site and existing Activity detail/completion screens remain in use.

Migration `0010-crm-opportunities.sql` adds the immutable fictional pipeline/two stages, typed Opportunity and append-only event records, real Opportunity ActivityLink FK and aggregate/context guards. Seed `seed-crm-i1.sql` under receipt 10 adds only configuration and explicit eligible synthetic CRM grants. It creates no opportunities/actions. `scripts/database.ts` selects the actual numeric filename prefix, preserving the reserved 0009 gap while P09 remains unmerged. Old migration/seed bytes and dependency pins are unchanged.

Necessary shared changes are limited to capabilities, Activity target parsing/visibility/labels, field follow-up all-target visibility, current-permission receipt dispatch, canonical RecordLink, navigation and CSS. No existing Activity kind, accepted normalisation/hash or start/complete/cancel rule changes. CRM actions use existing CustomerContact/RelationshipReview kinds and Internal class. No P09 domain contract is replaced. Shared ordering coordination: [P09 comment](https://github.com/deanrfiedler-gif/powerplants-one/pull/37#issuecomment-5557819554).

The [API amendment](../contracts/service-api.md#bp-03-i1-opportunity-implementation-amendment), [dictionary amendment](../contracts/service-data-dictionary.md#bp-03-i1-physical-opportunity-extension), BP-02 and ADR-0015 document exact routes, fields, types, limits, FKs, scopes and recovery. CRM names are BP-03-local; no PP-01 API-C/API-R number or parent requirement is allocated. Broader screen wireframes remain illustrative design, not runtime evidence.

## Reproducible setup and recovery

Use pinned Node 24.20.0, npm 11.19.0 and PostgreSQL 16.15; all existing exact package pins remain. Local scratch is Node 24.19.0/npm 11.9.0, so runtime verification uses disposable CI only. Do not override engines. Create ignored `.env.local` from `.env.example` for an owned loopback database and preserve the existing private document byte directory. The maintained P08/P09 setup governs existing services.

```sh
npm ci
npx playwright install --with-deps chromium
npm run db:migrate
npm run db:seed
npm run db:health
npm run dev
```

Select the synthetic coordinator at `http://127.0.0.1:3000/crm/opportunities`, create against an existing permitted organisation, complete its initial Activity, record qualification, then deliberately plan its successor. Unknown site/contact need explicit reasons. A due-needed action does not receive an invented date. Completion does not change stage. No external worker/send or Pipedrive connection is needed.

For an uncertain save keep the original page open and use **Confirm original save outcome**. This reads `/api/v1/operations/:operation_id` under current authority before retrying only the same original payload. Do not start a replacement intent merely because the response was lost. A stale version retains proposed input; load the current permitted version, compare, then deliberately adopt its version and retry. Unsaved/pending online form memory is not durable offline evidence. Accepted rows/actions/events/audits/receipts persist in PostgreSQL.

Preserve the database and original private bytes on an application problem. Migration is forward-only; a compatible application may be restored without deleting CRM records or rewinding references. No down migration or destructive rollback is supplied. The following reset is only for the expressly disposable `ppo_synthetic_test` database; normal prototype data must be retained:

```sh
PPO_ALLOW_RESET=dispose-synthetic PPO_RESET_DATABASE=ppo_synthetic_test npm run db:reset
```

## Verification procedure and evidence limits

```sh
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
npm run check
npm run test:db
npm run test:http
npm run test:browser
```

HTTP checks require the actual loopback launcher. Browser CI starts its own actual launcher. `tests/database/crm.test.ts` challenges atomic final-write rollback, original hashes/retry, real backend lock waits, competing qualification/action/owner commands, exact terminal outcomes, explicit successor/identification/due semantics, cross-company/person/site isolation, direct FKs/deferred graph, scoped selectors, revoked owners and all-target receipts. `tests/http/crm.test.ts` uses real routes/sessions including accepted-response loss, changed content, strict/body-size errors and revocation. `tests/browser/crm.spec.ts` exercises the UI, reload, retained conflict input, response abort after real commit, original operation lookup, identity clearing, keyboard and responsive/error states. Existing suites remain gates.

The workflow separately runs `scripts/crm-restart-proof.ts write` and `verify`, with actual application/browser process termination and a PostgreSQL container restart between them. The write phase creates an opportunity, completes its first action, qualifies and plans a successor. Verify reads the same opportunity, two actions, exact completed outcome, events and four operation receipts/payload hashes through PostgreSQL and real HTTP, then replays creation and proves one effect. It also records engine, process, source-head, executed checkout/tree, run/attempt and original viewport/hash metadata. This is distinct from screenshots and from P08 offline proof.

Original screenshot verification and exact final-head/merged-main runs remain pending. No real mobile hardware, CRM offline support, full AT-25, owner-accepted parity, independent approval or operational transition is claimed. D-013/D-025 and account licence/pipeline/field/automation/visibility evidence remain open. Unknown account settings do not block this fictional first slice and are never invented from its configuration.

## Next bounded preparation

The broader discovery I2 theme is pipeline and relationship management. Its maintained [next starter](crm-i2-starter.md) deliberately starts with controlled opportunity ownership transfer and explicit linked-action responsibility; it does not bundle board, close/reopen, arbitrary stages, reassociation, separate leads or account-plan builders. I1's fixed owner/context and unchanged Activity lifecycle make that impact boundary concrete. The starter requires verified actual I1 publication and a new invocation before implementation. I2 has not begun.

## Traceability and declared component scope

| CRM case / parent link | I1 component actually subject to verification | Outside I1 |
|---|---|---|
| CA-01 / CRM-01/02, AT-02/25 | Atomic existing-context create, initial Activity, permanent identity/reference, strict input and final-write rollback | Lead conversion and imported identities |
| CA-02 / CRM-02, AT-25 | Competing expected-version qualification/action changes; browser comparison retains safe proposal | Arbitrary stage policy and board drag |
| CA-03 / CRM-03/08, AT-24/25 | Identical replay, changed-content conflict, lost response, current-authority lookup, accepted-main upgrade/reseed and real process restart | Separate lead conversion and source migration |
| CA-04 / CRM-03, AT-25 | Exact completed outcome, no automatic stage movement, explicit next-action-needed and chosen successor | Provider send/sync and automation |
| CA-05 / CRM-01, AT-02/25/30 | Existing UUID/site-party/affiliation boundaries, explicit unknowns and no name merge | Reassociation, stakeholder/role successor and import |
| CA-06 / CRM-08, AT-01/25/34 | Company/site/person scope, Systems/unassigned and revoked users; direct/list/filter/selector/operation access | Operational visibility-policy parity |
| CA-07 / CRM-02/03, AT-25 | Immutable stage-entry basis, due-needed/overdue/terminal/unavailable groups | Forecasting, ageing policy, reopening |
| CA-08 / CRM-03, AT-25/34 | Existing Activity reassignment/completion race, eligible active owner and terminal outcome preservation | Opportunity owner transfer (prepared I2 only) |
| CA-10 / CRM-08, AT-01/25/34 | Every Activity target controls content and current receipt/replay; denied browser identity clears context | CRM files/exports/Finance/service handoff |
| CA-13 / CRM-07, AT-23/25 | Original desktop 1440×1000, phone 390×844, 320px reflow, keyboard/focus/error/conflict/denied/unavailable/loading | Real mobile hardware and offline acceptance |

This table defines scope, not a pass assertion. Exact executed layers/results and final publication are governed by the external record and retained originals. All 78 parent requirement identities, all four issued source byte hashes and existing full AT/PT statuses remain unchanged. CRM I1 is not P13 and does not close PPO-009 / #9.

Application run 34019900073 attempt 1 at source head `6706c3407709b566b4455d1e4ede73952323f9fe`, tree `2261613ccbc0a4e23816300ab9cff3de66f6fd67`, passed lint/type/build, 9 unit, all 186 PostgreSQL cases, fresh migration/seed/reset and existing PostgreSQL persistence proof. HTTP passed 15/16; the new oversized-body test incorrectly expected 413 while the maintained streaming body guard returns 422 `PayloadTooLarge`. Corrected the assertion to the exact status/code and added zero-opportunity-effect proof; the guard and size limit are unchanged. Restart/browser stages after HTTP did not run. A subsequent shared UI extension removes previously loaded Activity content when its command/selector/read is denied, without changing Activity payload/lifecycle/hash semantics; a real DB revocation browser case exercises it.
