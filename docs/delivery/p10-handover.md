# P10 — Finance handoff and account simulation handover

**State: implementation and verification in progress. This is not a completed P10 publication or P11 readiness claim.**

User authority explicitly covers bounded P10 implementation, local dependencies, additive migrations/fixtures, tests, documentation, commits, PR and normal checked merge, followed by P11 starter preparation only. Work is tracked in [issue #45](https://github.com/deanrfiedler-gif/powerplants-one/issues/45) and [draft PR #48](https://github.com/deanrfiedler-gif/powerplants-one/pull/48), branch `feature/p10-finance-handoff`, [ADR-0016](../decisions/ADR-0016-p10-finance-handoff.md). No live financial operation, customer distribution, hosting or P11/P12 implementation is authorised.

## Verified prerequisite and newer main

P09's completed authoritative [external publication](https://github.com/deanrfiedler-gif/powerplants-one/issues/36#issuecomment-5557392390) records final head `e23001ca62e162d0bb804f552d3371ff62a47003`, source tree `a9bcdabd3851ca72e0295bae66e1b461d2178945`, actual merged main `17f1505e2708663e7d2948f2c6bafc57a409085e`, final application/documentation runs `34027767595` / `34027767598` and actual-main runs `34030548850` / `34030548848`. Those exact runs and closed issue #36 / merged PR #37 were verified before implementation. Original evidence and review limits remain linked there and in the [P09 handover](p09-handover.md).

P10 began from current main `c3ac9b2ab9c09308f620a5b451a337eb75fe6390`, tree `163e4a9e7dcda9b067a67ed63299afd04d20e0b1`, preserving CRM I1's [completed publication](https://github.com/deanrfiedler-gif/powerplants-one/issues/39#issuecomment-5557831957) and its 329 unique maintained cases. Estimating discovery PR #44 subsequently merged to `94289a20fc609e47af647b29ca8170557da312bb`, tree `3964dac1259f8c8442bd74e1d35334d512c3c938`; all 24 changed files were incorporated byte-for-byte after reading its newer decision. Its Wave B/E1 proposals do not expand P10. Parallel CRM I2 remains separate and must be rechecked before merge.

## Current physical boundary

Migration 0011 is additive after CRM 0010; all 0001–0010 migration/seed bytes remain unchanged. The existing ERP `Verified` prohibition is preserved. Independently specified `finance_accounts` hold `SyntheticVerified` context tied to an exact Proposed mapping/version/snapshot; these are not live ERP account verifications. No earlier-stage handoff is fabricated by the seed.

Finance reads exact immutable P09 `report_reviews` decisions and `report_entry_refs` versions. Original field-entry Draft flags and quantities remain unchanged. Incomplete personal time/material declarations, changed source/authority/document dependencies, unsupported quantities and missing original bytes block Finance readiness. Full quantities from each selected report must be allocated, including non-billable portions. Exact six-place integer-scaled arithmetic never introduces floating-point rounding, tax, price, currency conversion, stock movement or operational warranty policy.

Draft/ReadyForReview/Returned/Approved/AwaitingERP/OutcomeUnknown/ReconciliationRequired/Reconciled/Cancelled remain distinct. A controlled claim fixes original correlation, target line IDs, input hash and processor. The simulator commits its effect separately from outcome recording. Original lookup fences a missing result against a late effect; accepted originals are not replayed. Source changes preserve allocation/target history and require review or a linked correction request.

## Verification ledger — unfinished

- Exact local Node 24.20.0/npm 11.19.0 were installed and locked dependencies installed without engine changes. Local lint, typecheck, 14 unit cases and build passed for the first implementation checkpoint. Local PostgreSQL installation is blocked by OS group restrictions; real database/HTTP/browser/restart gates use authorised disposable PostgreSQL 16.15 CI.
- First candidate head `0fb78109aac009c28e638d714cc3b85d4e6a346a`, tree `ba4e53c36d96b1f0db572b632cb157c0546fe90b`: [documentation run 34060433011](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34060433011) passed. [Application run 34060433027](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34060433027), job `101559868329`, attempt 1, passed static/build, migration/seed/reset, retained P09 real restart gates and four focused P09 browser repeats. Database result: 250 cases, 236 passed, 14 new Finance cases failed; all 234 retained database cases passed. Subsequent HTTP/browser gates were not executed by that failed run.
- The 14 failures shared one cause: the first Finance dependency comparison omitted P09's exact reviewed audience tuple. The fix adds current active company-scoped recipient ID/name/version to the same exact guard; it does not relax the source check. A separate implementation review found and fixed the source-invalidation outbox's missing receipt link. Both fixes passed the 16 focused Finance cases on head f92d59c32000d54ec1fcbc45755ceb9e0656b2e8, application run 34062330824 / job 101564933630; the completed result is recorded below.
- Existing migration completion assertions now include additive 0011. P09's obsolete `Not implemented — P10` label/assertions now say `Separate Finance authority required`, retaining the no-Finance-leakage boundary. No prior test case was removed.

Full PT-17/PT-19/PT-20/PT-21 execution, affected dependency portions of other PT procedures, original desktop/phone/PDF inspection, remaining negative and restart gates, independent-review availability, final-head review/checks and actual merged-main publication are outstanding. No full PT/AT, owner acceptance, independent review or production-readiness claim is made here.

- Expanded boundary checkpoint `749a3b4f1c8717fec95a6341f2bb511ddc35cb25`, tree `6b46073c50e9330f7e82b9fb456ac1aaeef7a0c8`: documentation run `34062836201` passed. Application run `34062836223`, job `101566330513`, attempt 1 passed static/build and 35 of 36 focused Finance cases. The upgrade test incorrectly read a private storage manifest from the intentionally restricted report DTO and failed before the upgrade assertion. It now loads the original manifest directly from the database for byte verification. No application guard or old assertion was weakened. Restart and subsequent gates were skipped in this run.

- Head `f92d59c32000d54ec1fcbc45755ceb9e0656b2e8` completed all 250 database cases, all retained restart/focused P09 gates up to HTTP, and 17 retained HTTP cases in run `34062330824`. Two new Finance HTTP cases failed because the static route wrapper dereferenced absent path parameters. The wrapper now uses the existing shared-route empty-parameter fallback; original Finance guards remain intact. Later offline/CRM/browser gates were skipped. Artifact `9998231695` retains 201 original files, 16,658,597 ZIP bytes, SHA-256 `0ca83283d94013812bfb47fa5e0f2ff0918c326c2293ba93db137936e1ddb56b`; it is failed-run evidence, not completed P10 acceptance.

- Checkpoint `d8bc283de6a6c5989964995ebc7339cf3c8660ee`, tree `508fc9caa9f963621c769f7487b7c3333587dd7b`: documentation run `34063387558` passed. Application run `34063387646`, job `101567814943`, attempt 1 passed static/build and all 38 focused Finance database cases, including the real P09 upgrade and original issued bytes. The Finance restart prerequisite then encountered the same static HTTP parameter bug, corrected in the next head. Subsequent gates were skipped.
- Checkpoint `2bd94d9d635e18843cc3e6bf2107879669f468c7`, tree `0cdf425814cebebec9e0d2cf7bfaad35412dc3be`: documentation run `34063768891` passed. Application run `34063768853`, job `101568841652`, attempt 1 passed static/build and all 38 focused Finance database cases. Its ten new browser cases failed: two Service prerequisites used weekend dates outside the published calendar; four selectors used exact label text that included nested select options; four dependent cases lacked their prerequisite reconciled source. Fixtures now use unoccupied published weekdays and Finance selects expose explicit accessible labels. Calendar, source and Finance guards are unchanged. Original failed artifact `9998384010` has 4,844,391 ZIP bytes, SHA-256 `ba1e66f82be8f6573de1bab3fd79ff1c7a1364b9203e21ca1c8213dac36b4f32`. Raw Playwright traces are excluded from the durable evidence set and all later artifact paths; original PNGs remain available. This failed run is not full browser or PT acceptance.

- Checkpoint `aed4af03f46a4668811a854d80989efc8906e04f`, tree `732f41be475d06cbcced9c3a44cafa26a581b73c`: documentation run `34064306109` passed. Application run `34064306111`, job `101570269727`, attempt 1 passed static/build and all 41 focused Finance database cases. Both account arithmetic/completeness journeys and both queue state/keyboard journeys passed (four browser cases). The review/correction journey reached Returned on desktop and phone, then an exact textarea label included its prefilled initial text; four dependent cases had no reconciled source. Explicit textarea labels correct the selector boundary. Original artifact `9998558311` has 8,588,160 ZIP bytes, SHA-256 `ba770e9ba6bf34567388e5a2bdf709248ee6904218dd7f0767e6a65382db3227`. The next checkpoint also fixes successful original-save recovery navigation and current-value claims after account HTTP refresh failure, with the existing UI journeys exercising both. All subsequent gates remain required; no full P10 pass is claimed by this run.

## Source, quantity and transition rules

Every Finance revision identifies one legal company/customer/site/work order, one immutable synthetic account context, currency, mode, exact report/review/issue IDs, entry IDs/versions/root identities/hashes, current Finance definition/policy version, treatment basis and remaining-work basis. Source rechecks use the exact P09 review projection and private original report/PNG bytes. Personal attendance acceptance, a report customer response, a historic Draft flag and a quantity are separate facts. The source's work order may remain Authorised; P10 does not introduce closure.

Supported source quantities are exact whole MIN from recorded Labour intervals and positive EA/other captured material units with Consumed or Returned direction. Original Travel/Break/Waiting/Other time kinds have no assigned Finance basis and are blocked without reclassification. Fractional-minute source durations are blocked rather than rounded. Quantity commands use positive decimal strings with up to twelve whole digits and six fractional digits; conservation uses integer scaling. Direction is retained independently of magnitude; a Returned material capture never silently becomes a stock return or credit. Unsupported directions and unknown declarations remain blockers.

| Action / physical state | Exact rule and retained evidence |
|---|---|
| Create → Draft | Server-owned actor and immutable company/customer/account context; 1–20 exact issued reports and 1–200 explicit allocation lines; original source quantities preserved. Draft may be incomplete but every line has a reason and positive quantity. |
| Revise Draft/Returned → successor Draft | Expected aggregate version, same immutable context, no possible effect; prior revisions/reasons retained; Held reservations released atomically before replacement. |
| Submit Draft → ReadyForReview | Current source, definition and policy checked; every selected reviewed entry is fully dispositioned; reserve all quantity under the same workspace transaction. Competing root allocations cannot exceed the reviewed quantity. |
| Review → Approved/Returned | Exact current Finance revision/hash, separate reviewer from preparer, current authority. Pending/WarrantyReview/GoodwillReview cannot be Approved. Return preserves precise reason and original revision. |
| Return Approved → Returned | Allowed only before a possible effect. Original Approved review remains; the explicit return event records why approval is no longer actionable. |
| Claim Approved → AwaitingERP | One current processor, original correlation/input hash, approved revision/review and stable target-line identities. Competing claims do not create a second attempt. |
| Dispatch → OutcomeUnknown / ReconciliationRequired / Approved | One controlled synthetic action. AcceptedThenTimeout records Unknown without exposing internal target evidence. Accepted or partial target evidence requires reconciliation. Evidenced NotProcessed with billable work permits a new controlled claim using the original correlation/content; all-no-posting work proceeds to reconciliation. |
| Original lookup | Resolves only the original attempt. An absent result becomes a durable NotProcessed fence against late dispatch. A stored target survives failure of the local outcome transaction. Blind replay after possible acceptance is refused. |
| Reconcile → Reconciled | A separate reconciler compares exact original target kind/status/company/customer/account/currency, hash, direction, quantity, unit, target IDs and source allocation map; independently justified no-posting dispositions are explicit. Partial/mismatched outcomes stay open. |
| Cancel → Cancelled | Only before possible/accepted target effect; release Held quantity, retain originals and reason. |
| Service successor | Unprocessed readiness becomes Returned; a claim becomes OutcomeUnknown; previously processed/reconciled evidence requires reconciliation. Original targets/allocations are retained. Linked Investigate/CorrectionRequested/ReversalRequested decisions do not execute an accounting correction or reversal. |

F-06 retains 90 captured/reviewed MIN: 60 Billable and 30 NonBillable; 2 EA is separately Billable. The synthetic target carries 60 MIN and 2 EA with exact source-allocation links. The 30 MIN is explicit no-posting evidence and becomes Consumed with the processed/reconciled disposition. A target quantity of 60 is not mislabelled as an unexplained loss of 30. Grouping combines only the same unit and direction inside the same handoff/account/company/currency. No treatment, rates, prices, tax, exchange, tolerance, payroll, stock movement or warranty entitlement is inferred.

## Authority, modes and account observations

`finance.read` and `shared.finance.read` constrain handoff reads and every underlying work/account projection. Separate `finance.prepare`, `finance.review`, `finance.process`, `finance.reconcile`, `finance.issue` and `finance.account.read` grants control commands. The preparer owns revision/cancellation; processing is bound to the claimed actor; review and reconciliation retain separation checks. All mutation actors come from the existing server-backed synthetic session. Current grants and record scope are evaluated before original receipts, render recovery, issue bytes, queue metadata or account history are returned. Revoked authority never gains access through recovery. Systems and Service ownership confer no Finance authority.

SyntheticManual is the default fictional manual observation mode. SyntheticApi enables only the maintained F-07 local simulator and explicit Accepted/AcceptedThenTimeout/NotProcessed/Partial fixtures; it has no configurable live endpoint. Provider `PPO-SyntheticTarget-v1` emits `SyntheticServiceCharge` UUID identities, not MYOB numbers. Actual Manual/VerifiedApi modes remain rejected. Finance outbox recovery and output work retain their original identity/hash and current actor scope; no external notification is delivered.

Account F-01 preserves original invoice 1100.00, effective applied payment 400.00, applied credit 100.00 and supplied remaining balance 600.00 AUD. F-02 adds 200.00 unapplied cash separately. F-03 records the payment reversal and remaining 1000.00 with original lineage. F-04 has one of two declared pages and one of three records; the current account total is Unavailable. Failed extraction has no current value. F-05 commitments remain Not defined / Not comparable. Each immutable run retains source/as-at, observed time, cutoff, exact extraction scope, company/customer/account/currency, expected/received counts/pages and statuses. Filtering displayed rows never calculates an account balance. Last-good observations remain visibly historical when refresh or current mapping verification fails. Both current balance and unapplied cash become unavailable/unknown after a failed HTTP refresh; the prior observation is not silently presented as current.

## Original OUT-14 and recovery

The bounded OUT-14 issue is available after exact reconciliation. It records source/review/reconciliation/template/policy and rendering identities, reserved issue ID/preparation time, immutable bundle/HTML/PDF bytes, hashes/sizes/manifest/provider version and a separate actual release event. It includes the allocation and original target/no-posting basis with customer distribution disabled. The current Finance audience is checked again after rendering/storage. A changed source/template, revoked actor or missing/wrong-hash original byte blocks release or access.

The existing private document adapter is extended. A stored bundle is located by its original operation before rendering is considered. Storage-success/database-failure recovery reuses the same bytes, prepared time and reserved issue ID; it neither regenerates the report nor copies signatures. Leases are two minutes, bounded to five render attempts. The worker supports existing P06/P09 originals and Finance through `npm run documents:worker`; an individual permitted job can be recovered from the Finance detail. Customer distribution, email, SMS and calendar invitations remain disabled.

## Exact setup and verification commands

Use the repository's current pins, currently Node 24.20.0, npm 11.19.0, PostgreSQL 16.15, Next.js 16.3.4, React 19.2.8, TypeScript 6.0.3 and Playwright 1.63.0. Follow the existing [local configuration and recovery instructions](p08-handover.md#runtime-setup-and-recovery). The ignored local configuration must identify the permitted loopback synthetic database and private storage; never copy credentials or private profiles into review evidence.

```sh
npm ci
npx playwright install --with-deps chromium
npm run db:migrate
npm run db:seed
npm run db:health
npm run dev
```

Open `http://127.0.0.1:3000/finance/handoffs` and select the Finance preparer, reviewer, processor or reconciler identity for that duty. Complete the real issued Service prerequisite first; seed does not fabricate a handoff. The account fixture view is reached from the Finance queue. `npm start` intentionally refuses production startup.

```sh
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
npm run check
npm run test:db
npm run test:http
npm run test:browser
```

Database/HTTP/browser checks require the named disposable `ppo_synthetic_test` configuration and real app/Chromium processes. The full [application workflow](../../.github/workflows/application.yml) is the executable environment/run order, including guarded reset, all retained P09/offline/CRM process restarts and P10's four `scripts/finance-restart-proof.ts` phases. Its PostgreSQL container is restarted between write/accept/reconcile/verify; each phase starts a fresh application and persistent browser process. Local static checks and disposable CI results are reported separately.

Migration 0011 and `db/seed-p10.sql` are additive; all prior migration/seed bytes remain unchanged. Fresh setup applies all eleven migrations. The upgrade proof first creates actual P09 issued records on migration 0009, then applies 0010/0011 and repeats seed, comparing original rows (including attendance/audit/receipts/outbox) and private media/report bytes exactly. Repeat seed preserves existing observations and revoked grants. Guarded reset remains explicitly limited to the disposable synthetic database; it is not an upgrade or production migration.

## Additional implementation review findings

The original screenshot review found checkbox controls inheriting full-width shared input styling; Finance now keeps checkboxes beside their labels. The phone account table retains contained horizontal scrolling with explicit guidance and an additional original capture of the remaining/status/reversal columns. Review also found that the initial time projection could relabel Travel/Break/Waiting/Other as Labour. The minimum F-06 guard now refuses those unassigned time bases while retaining original category/seconds/Draft history; four parameterised database cases exercise the refusal. Neither a payroll treatment nor a new billing policy was invented.

Commit `08a64c6c77899178750d4b8062379886c98f9ec4`, tree `ff5d83ce4bf6ff01ea05c4e35b49a40692b60c89`, was published to the branch ref, but GitHub's PR snapshot and workflow collection had not advanced from the preceding candidate at the last read. It has no claimed CI result. Subsequent candidate verification must use its actual reflected PR head, not infer success from this ref update.

## Review and unresolved operational decisions

The implementation review covers the actual SQL guards and transaction/receipt/outbox boundaries, source revision invalidation, controlled effect/lookup fence, current Finance permissions and byte adapter recovery. It is implementation self-review, not an independent reviewer or owner acceptance. Final PR requested/required reviews and unresolved threads must still be read before merge; inaccessible rules must be reported accurately without bypass.

D-005/D-006/D-017/D-024 remain operationally open: actual MYOB configuration, supported API/manual evidence and ownership; SharePoint/audience/retention; accepted financial definitions, warranty/goodwill and billability treatment; price/tax/currency, accounting mapping/tolerance and correction/reversal authority; real identities, device/connectivity, support and recovery. Synthetic F-01–F-07 demonstrate the bounded contract only. P11 integrated quality and P12 restore/delivery/owner demonstration remain separately authorised work.
