# P05 — Planner and controlled changes handover

**Date:** 5 September 2026 · **Owner:** Dean Fiedler · **Scope:** Personal/private synthetic prototype only.
**Publication:** [issue #28](https://github.com/deanrfiedler-gif/powerplants-one/issues/28) · [PR #29](https://github.com/deanrfiedler-gif/powerplants-one/pull/29) · branch `feature/p05-planner-controlled-changes`. Final verification and normal-merge publication are pending in this working draft.

## Outcome and boundary

SC-07/SC-08 now coordinate Proposed, Confirmed and Cancelled appointments separately from service requests/work orders. Typed fictional crew, published calendars/skills/availability, explicit travel reservations, authoritative confirmation, keyboard/drag movement, owned manual/simulated contact and typed change requests/cancellation are implemented. Exact proposal/booking/history, current permission checks, expected versions, atomic audit/receipt/outbox and database non-overlap preserve authority on failures and retries. [ADR-0010](../decisions/ADR-0010-p05-planner-controlled-changes.md), [API](../contracts/service-api.md#p05-implementation-amendment--current-bounded-contract) and [dictionary](../contracts/service-data-dictionary.md#p05-physical-implementation-amendment) contain the bounded decisions and fields.

Booking is not dispatched attendance or customer acknowledgement. Dispatch holds remain true; PreparationRequired/ReviewRequired/CancellationReviewRequired and owned activities honestly represent P06 consequences. No pack/issue/acknowledgement, field capture, offline queue, report, Finance disposition, hosted service, source migration or customer message was implemented. Published source bundles are immutable; no resource/calendar/availability/skill/policy editor exists. Synthetic weekday rules/competencies/travel reasons are not operational approvals. The prepared [P06 task](p06-starter-prompt.md) is not started.

## Verified starting repository

Connected user `deanrfiedler-gif` had admin/push permission; repository remained private. Main started at `2cdc41d91989677430b142cfd6c4a008ba2ac892`, tree `7115a93f4fa40560c2d3df57e97c5e6b97eca201`. P04 issue #26 was closed completed and PR #27 actually merged. Its final head was `2b5e51c4687bd2c1a455df283a2d5e09ef4fc68a`; final and merged trees matched the starting main tree. [P04 publication](https://github.com/deanrfiedler-gif/powerplants-one/issues/26#issuecomment-5550940259) records merged-main documentation run 33958467150 and application run 33958467167 passing (4 unit, 46 PostgreSQL, 6 HTTP, 20 Chromium; 48 original PNGs retained). No later main commits or existing P05 branch/issue/PR were found before issue #28/branch/PR #29 creation.

The earlier local checkout was clean and preserved. An isolated copied checkout was reconciled to the exact signed remote baseline commit; direct GitHub git transport had no credentials, so normal connector Git object/ref publication was used. Every published source tree was checked against the local committed tree. Local and remote commit metadata differ; exact tree equivalence is the content proof. No unrelated work, original source bytes or earlier migration/seed bytes were changed.

## Runtime, installation and recovery

Pinned toolchain remains Node **24.20.0**, npm **11.19.0**, Next.js **16.3.4**, React/ReactDOM **19.2.8**, TypeScript **6.0.3**, pg **8.23.0**, Playwright **1.63.0**, PostgreSQL **16.15**. All direct development dependencies and lockfile versions remain unchanged from P04; see `package.json/package-lock.json` and [dependency inventory](../testing/p01-dependencies.json). No new external service/dependency was introduced. CI uses Ubuntu 24.04 and the pinned actions in `.github/workflows/application.yml`.

Use the P04 loopback setup/environment/launcher instructions; never put real credentials/data into this prototype. The local `npm start` intentionally refuses. With a disposable loopback PostgreSQL database configured in `.env.local`:

```sh
npm ci
npm run db:migrate
npm run db:seed
npm run db:health
npm run check
npm run dev
```

Open the loopback URL printed by the launcher, choose Coordinator and Service planner (`/schedule`, default week starting 21 September 2026). `/service/appointments/:id` exposes exact record IDs, current crew, controls, contact/request history and proposal snapshots. Use site/resource/state filters. For a proposal, record the exact simulated customer agreement, select eligible crew/roles and explicitly enter both travel allowances/reasons, then confirm. A failed attempt retains the original proposal; urgent priority has no bypass. Read-only identities see scoped context; Systems cannot book; Riley's fictional assigned profile can request changes for its current assignment without managing bookings.

For the isolated test database only:

```sh
PPO_ALLOW_RESET=dispose-synthetic PPO_RESET_DATABASE=ppo_synthetic_test npm run db:reset
npm run test:db
npm run test:http
npm run test:browser
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
```

HTTP requires the gateway server; browser suite manages its configured local server. Real process restart proof writes `scripts/persistence-proof.ts write`, restarts the disposable PostgreSQL container and runs `verify`; exact commands are in the workflow. It preserves P01–P05 records, P05 full reservation/evidence and original receipts. A read outage is unknown availability, not zero/free capacity. For an uncertain accepted change, retry the unchanged action or recover `/api/v1/operations/:operation_id` under current authority before submitting a different proposal. Never silently update expected versions and replay.

Migration 0005 and seed receipt 5 are additive and non-destructive. Original P04 rows are snapshotted before adding current state. All old appointment IDs/references and Proposed status remain unchanged. Repeat seed respects prior receipts, edits and revoked grants; reset requires exact destructive-test opt-ins and is never an operational migration. Fixtures include eight fictional resources/two calendars, ten new appointments, one explicitly labelled SQL confirmed two-person fixture, blocked/expired/leave/wrong-site/company/inactive resources, explicit 30-minute fixture buffers, simulated contact, ToolPreparation missing/exception cases and one explicit customer-window case. The policy/evidence horizon ends 1 January 2027; future booking tests need a separately versioned fixture/policy update after that date, never an edit to historical evidence. Historical reads retain expired published policy context.

## Verification and failed-run record

Implementation run [33961656777](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33961656777), source `8df07cb97529f00451fd63250a32e05f1d754e21`, tree `894f711fa8296fc8d48a60c902a33a294626ab7f`, passed **5 unit, 65 PostgreSQL, 8 HTTP and 28 Chromium** cases plus actual PostgreSQL restart. Documentation run 33961656782 passed. Final phone layout/evidence and publication verification are pending. Full PT-08/09/10/26 are not marked Passed. PT-04 overlap is scope versus appointment readiness; PT-26 issued pack/actual labour requires P06/P07, and PT-06 final actual start requires P07. All 30 full PT procedures and all full AT/PP-01 acceptance remain incomplete. No independent reviewer, real-device, screen-reader, load, production security or owner-acceptance claim is made.

| Run / exact source | Actual result and disposition |
|---|---|
| 33959856830 / `d6598b0032a5d2612e52bb2ef113aa11d1b13293` | Static/unit/build and migration passed; seed failed because typed identity mapping omitted ContactOutcome/ScheduleChangeRequest. Added explicit mapping/trigger argument before later runs. |
| 33960761622 / `feeb0d8c41d1b1376cb0e225a32202627948233b` | 5 unit; 62/63 PostgreSQL. Upgrade assertion converted timestamps through JavaScript, losing PostgreSQL microseconds. Replaced with exact database JSONB comparison; original snapshots were correct. |
| 33961084141 / `f51993e61ad4480d50d91e5a1d4a16e590310504` | 5 unit, 63 PostgreSQL, 8 HTTP and actual restart passed; 26/28 Chromium. Contact-save refresh race opened confirmation at old appointment version; server correctly refused. Disabled new actions while refreshing and retained explicit stale review/retry. |
| 33961340102 / `46116d10ef487e55a962c35f430a5d48a178718d` | New hardening run: 61/65 PostgreSQL. Request-seal trigger CASE referenced a nonexistent row field; changed to typed branch statements. Customer-window test selected a no-window fixture; corrected to appointment 10 with an actual window and retained original reservation assertion. |

Local lint/type/unit/build and three maintained Python checks are run as well; this scratch runtime has no local PostgreSQL installation, so real migrations/SQL/HTTP/browser proof runs on the authorised disposable PostgreSQL CI service. Injected business/assignment/reservation/revision/activity/audit/receipt/outbox failures deliberately produce SQL errors and are expected rollback evidence, not unresolved defects.

## Review, publication and next boundary

Before merge recheck exact head/tree, required status/review/thread conditions, private visibility and unchanged main. Record final source, merge SHA/tree and merged-main check results in issue #28's final publication comment to avoid a document claiming its own future commit hash. Main's baseline reported unprotected with no required contexts; detailed branch protection/rules reads were restricted. No setting was changed or bypassed. Final observed review/merge state belongs in the publication record.

P05 is a bounded component increment, not complete PP-01 acceptance or production readiness. P06 is prepared in [p06-starter-prompt.md](p06-starter-prompt.md): nine-section exact job-pack source/template/output, durable issue worker/store, per-assignment acknowledgements, amendment/withdrawal and P05 scheduling/cancellation consequences. P06 must avoid circular dispatch gates and preserve original proposals, reservations, receipts, contact and scope authority. Stop here; no P06 issue or implementation is created.
