---
title: D-025 S3 synthetic customer delivery backend in progress
date: 2026-10-24
---

Owner: Codex for Dean. [Draft PR #695](https://github.com/deanrfiedler-gif/powerplants-one/pull/695), branch `codex/customer-communications-s3`, claims migration/seed 0121 from main `60a7f7b469ab758e9ee99fd7d5d3910b27f2f2ad`.

Dean's exact approval: “Proceed with D-025 S3 as recommended, using the synthetic carrier/platform catalogue and delay reasons. Recheck main and open claims first, and take it through to a review-ready PR without merging or deploying.” He subsequently authorised “Allow narrow shared-file edits for #695” for the migration registry, demo-upgrade gate and exact-version/seed assertions shared with #688/#690. Other contributors' branches and jobs remain untouched.

The [contract](../contracts/customer-communications.md#s3-native-dispatch-and-delay-notices) and [plan](../superpowers/plans/2026-10-24-customer-communications-s3.md) describe native Moved dispatch drafts, separate customer delivery-role/ETA history, fictional catalogues, exact partial quantities, sent-ETA delay baselines, current-source/sender checks, correction and recovery. No capability, grant or user is added. No live provider, UI, merge or deployment is included.

Local verification so far (Node 24.22.1; maintained pin 24.21.0):

- `npm ci --engine-strict=false`: installed the existing lockfile, zero audit findings; no dependency change.
- `python scripts/check_foundation.py`, `python scripts/check_naming.py`, `python scripts/check_prototype.py`, `python scripts/build_status.py --check`: passed. All 78 parent requirements remain; no generated view is tracked.
- `python -m unittest discover -s scripts -p 'test_documentation*.py'`: 22 passed.
- `python scripts/check_migrations.py --open-prs`: passed after real migration/seed registration; 0119 and 0120 remain other owners' claims.
- `npm run studio:check`, `npm run lint`: passed. Studio review states remain separate from acceptance.
- `$env:NODE_OPTIONS='--max-old-space-size=8192'; npm run typecheck`: passed after explicit row types repaired the new upgrade test. The failed intermediate run reported seven implicit-any callback parameters; no runtime rule changed.
- `node --import tsx --test tests/unit/customer-delivery.test.ts`: four passed.
- On the owned PostgreSQL 16.15 cluster, port 56983, `ppo_synthetic_test`: the initial six S3 database cases, nine existing S2 cases and populated S3 upgrade passed in focused runs. The upgrade preserved every pre-existing table row, with exactly the fourteen new bindings and seed 121 receipt separately asserted. The complete S3 command `node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/customer-delivery.test.ts tests/database/customer-delivery-upgrade.test.ts` subsequently passed all 10 cases. A stronger template-omission case is being rechecked separately.
- The focused calling upgrade exceeded its original 120000ms limit. The identical unmodified test at main `60a7f7b469ab758e9ee99fd7d5d3910b27f2f2ad` also timed out, followed by `ppo.people` missing after the interrupted setup. Both ran `node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/calls-migration.test.ts` against the owned disposable database. No timeout or assertion was weakened. One later combined S3 run also timed out during setup; this is not recorded as a pass.

Full unit/build, broader upgrade, HTTP/browser, final-head CI and actual different-model review remain pending. No review waiver from another PR applies here.

Observed required checks on 24 October 2026 (`strict: false`): Check documentation foundation; CRM desktop and mobile persistence and interaction proof; CRM header and board visual checks; Desktop and mobile browser suite against the compiled application; E1 manual estimate, draft output and restart proof; Email Calendar persisted journey and server permissions; P01–P11 and CRM I1–I2 local application and PostgreSQL proof.

No executed business acceptance, operational carrier/platform approval or production readiness is claimed. #688 (0119) and #690 (0120) remain separately owned; #692 is not an adopted migration-test replacement.

<!-- decision-index -->
The [D-025 dated note](../decisions/customer-communications-d025.md#24-october-2026--s3-synthetic-implementation-authority) records Dean's bounded S3 authority and retains the operational prerequisites.
