# PR #270 conflict and assurance repair

21 September 2026. EN-08 / ENG-07; retained EN-07 / ENG-06 dependency. This is local component evidence, not the whole EN08-01–EN08-60 acceptance matrix or deployed proof.

GitHub head `f8d2b3dc28d33a69d8b02a367e2e7b01eab9f730` had `CONFLICTING` mergeability and no check runs. The repair merges main `b4806afeb0ded1931b844a997621e2e300f7c7b6`, preserving its EN-06 grid and EN-08's existing flex composition. It also carries the bounded EN-07 fixes from `00cd6f4`, `b3c7908` and `78a8acb`, and exposes the phone inspector close control below the fixed header.

## Environment and executed checks

Windows; Node 24.21.0, npm 11.19.0, PostgreSQL 16.15, Playwright 1.63.0, Chrome 153.0.8010.53. Checkout `C:/Users/Dean.Fiedler/Projects/powerplants-one-en08-fix`. Compiled build `bWAvG0d04icozgWqwkxIC` on task-owned loopback port 3013. Only disposable `ppo_synthetic_test` on port 55440 was used; the user's development database and running review applications were left alone.

- `npm ci`, whole-project `npm run typecheck`, `npm run lint`, and `npm run build`: passed. Build retains the existing dynamic-filesystem tracing warning in `src/reports/template.ts`; it was not suppressed.
- EN-07 policy/preview, EN-08 policy and shared inspection units: 34 passed.
- Full `npm run test:unit`: 180 passed, four failed. The same four failures reproduce in an unmodified main `b4806af` checkout: two document-store private-path tests, recovery private-path handling, and Windows path separators in warm-route enumeration. See [full run](unit.txt) and [main comparison](baseline-unit.txt). No test expectation or platform safety rule was weakened.
- `npm run db:migrate` and `npm run db:seed`: passed, upgrading the owned test cluster from 0030 to 0031. No migration or seed source was edited.
- `node --env-file=.env.local --import tsx --test --test-concurrency=1 tests/database/engineering-changes.test.ts`: initially 4 passed / 1 failed (helper reported 201 for the route that returns 200); after carrying `b3c7908`, all 5 passed in 148.2 seconds. Includes scenario/reseed preservation, permissions, source changes, conflicting confirmations, original-operation replay, independent receiving, retained failures and guarded closure. The suite's reset hooks affect only its disposable test database.
- AD-01 regenerated on LF source bytes with no tracked output change; its model check passed 107 groups. The initial Windows-generated CRLF HTML failed the embedded-font byte check; LF normalization of generated files restored the exact committed bytes without changing source or expectations.
- Foundation and naming checks: passed, including the repair decision/status/evidence files ([foundation](foundation-final.txt), [naming](naming-final.txt)).

## Browser execution and original failures

The first local browser run overlapped the database suite's reset hooks by mistake: 3 passed, 8 failed, 9 platform-specific skips. The resulting missing records/identity responses invalidate that run as application evidence. Its [original log](engineering-browser.txt) is retained. The database suite completed, then only the task-owned compiled listener was restarted before a sequential browser rerun. The immediate restart attempt ran before the compiled listener became ready (11 connection-refused failures, 9 platform skips); its [startup-race log](engineering-browser-final.txt) is also retained. The next run began after the local-session endpoint answered. No assertion timeout, forced click or retry was added to conceal those failures.

The ready, sequential compiled Engineering run passed **11 tests with 9 intentional platform-specific skips in 2.7 minutes**: EN-06 five, EN-07 four, EN-08 two. [Complete log](engineering-browser-ready.txt). Both [1920 px desktop](commissioning-desktop.png) and [390 px phone](commissioning-mobile.png) captures were visually inspected. EN-08's test verifies all six routes, a 220 px menu, 480 px desktop inspector, flush table edges, no page overflow, and real close/menu/Escape/focus-return interactions. This proves bounded composition and interaction, not independent approval against the full original mockup. The retained browser tests are copied to ignored `tmp/en08-ci-tests` only to use loopback port 3013 and the correct relative helper imports; checked-in assertions are unchanged.

The compiled shared CRM/home header check also passed on desktop and phone: **2 tests in 13.8 seconds** ([log](shared-browser.txt)).

My Work desktop/phone and shared-shell regressions passed **26 tests with 20 intentional platform-specific skips in 1.1 minutes** ([log](work-browser.txt)). Across the three final compiled runs: **39 passed, 29 platform-specific skips, no failures**.

## Limits

No full HTTP suite, full database catalogue, database-restart proof, physical-device test, independent owner acceptance or hosted deployment was performed for this bounded repair. The new EN-08 regression uses the existing synthetic scenario builder through ordinary APIs and includes exact local issue/receiving fixture commands; it does not establish live Service, Equipment, Projects, SharePoint, ERP or customer delivery.
