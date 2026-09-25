# Native Supply Chain implementation handover

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Native SC-01–SC-10 implementation and focused verification are delivered in [PR #317](https://github.com/deanrfiedler-gif/powerplants-one/pull/317), branch `feature/supply-chain-native`. Broader CI is tracked per commit on that PR. Merge, deployment, owner acceptance and production readiness remain separate and are not claimed.

## Baseline and scope

Fetched main: `0f10b7fb46a8ab512e9b019573ece272cf5920b9`. Tree: `a5b0624f19205909e67b83b437bc1edb79510f3a`. GitHub initially had only PR #314 (ES-02 design board) open. It overlaps shared status/design/document registers, not Supply Chain runtime. Recent merged native Customer, Equipment, Sales, Engineering and Scheduling work was inspected. Issue [#13 / PPO-013](https://github.com/deanrfiedler-gif/powerplants-one/issues/13) remains the broad package; no production transaction or customer communication was authorised.

The original local checkout contains unrelated uncommitted Field/Quality work. This contribution uses an isolated worktree and leaves those changes intact. Other local sessions were running Field and Finance checks. Supply verification therefore uses disposable loopback PostgreSQL instances on ports 5549 (database tests) and 5550 (browser/process restart), both named `ppo_synthetic_test`, and application port 3059. Other sessions' processes and databases were not reset.

## Implementation

[BP-08](../blueprints/BP-08-supply-chain.md) and [ADR-0049](../decisions/ADR-0049-native-supply-chain.md) describe the closed native domain, ten routes and seven rail mappings. Migration 0049 adds UUID identities, scoped demand/supply/return/custody aggregates, exact decimal allocations, immutable facts/revisions, durable image references and six narrowly named Supply capabilities. Seed 49 reuses existing fictional identities; it does not add hosted access or reinstate revoked grants. The existing Finance visibility/reconciliation capabilities protect credit observations.

The ten page-specific guides are available through the global information icon. Current development register entries retain source provenance and Draft review status. SC-10 has a new native design contract because it had no exact historical image/HTML. SC-08 retains the historical warning about its unpublished authoring package and conflicting HTML hashes; native tests are new evidence only.

## Verification record

| Command / evidence | Executed result |
|---|---|
| `npm run test:unit` | 426/430 passed on Windows. The same four filesystem/path failures reproduce on untouched main `2173cc64eed54b1e3fb8334495f7cd924206d13f` (3/7 passed): two document-store cases, recovery-directory guard and warm-route path assertion. |
| `node --import tsx --test tests/unit/supply.test.ts tests/unit/department-navigation.test.ts tests/unit/shell-navigation.test.ts` | 17/17 passed, including all eight Supply units. |
| `node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=180000 tests/database/supply.test.ts tests/database/supply-custody.test.ts` | 11/11 passed: exact arithmetic/conservation, concurrent allocation, scope, replay, corrections, restricted credits, six cross-domain scenarios, durable PNG, reseed and upgrade preservation. Includes direct-SQL and API refusal of reductions below retained receipt/return quantities. |
| `node --env-file=.env.supply-browser --import tsx --test tests/http/supply.test.ts` | Passed against the compiled application: authorised/denied scope, invalid/stale commands, duplicate original, changed-content refusal, Partial and Unknown evidence, Not configured source command and original-operation recovery. |
| `npx playwright test --config=playwright.supply.config.ts` | 60/60 passed against the compiled application at 1440 × 960, 1024 × 768, 390 × 844 and 320 × 844. All ten routes; six Returns views; mobile receipt/correction, pick/stage/partial POD, focus, Back/reload, denied/read-only access, stale proposal review and lost accepted response recovery. |
| Department navigation browser regression | 1/1 passed against the compiled application, traversing all seven departments and the newly available Supply rail. |
| CRM affected race/upgrade/output cases | Both previously interrupted races passed. Exact pre-transfer upgrade preservation passed on a clean rerun. E1 output/owner preservation passed. A 10-second schema-drop statement timeout occurred on an earlier local upgrade attempt; the clean rerun passed. |
| `scripts/supply-restart-proof.ts write` / `verify` | Passed across an actual PostgreSQL restart and compiled application restart. The script asserts changed PostgreSQL start time, identical record/revision/fact/photo/audit/receipt/outbox hash, exact PNG bytes, original receipt through HTTP, and replay without another effect. CI runs the same proof around its existing PostgreSQL restart. |
| `npm run lint`; `npm run typecheck`; `npm run build` | Passed. Compiled build `10gJ-npmZg83l88QcfFvc`, UI source `6305a2cc5b844444dad30d3369c73788b45b2d15`, tree `ce8f71f2665016c25169bdc32602f1acf7a40fd8`. Final quantity guard/test source `ecf2f576a8f26fecb651e63dce38d85b9bab56d5`, tree `f4e0ba9e92e8efcdd188c98da002a962d50a3893`; compiled UI unchanged. |
| `npm run studio:sync`; `npm run studio:check` | Passed: 319 entries, 165 source routes, 28 component records, no integrity errors; reviews remain pending. |
| `python scripts/check_foundation.py`; `python scripts/check_prototype.py`; `python scripts/check_naming.py`; `node scripts/check-access-review-model.mjs`; `git diff --check` | Passed. All 78 parent IDs and issued reference bytes retained; project instructions are within the 8,000-character limit; access-review model has 107 groups. |
| `npm run test:db`; `npm run test:http`; broad browser suites | Full Linux CI runs through the normal PR workflows; use the PR's per-commit checks and final verification comment for completed aggregate results. The original local broad database run was suspended for hours and stopped in favour of clean focused reruns and full CI. It is not claimed as a full local pass. Local port 3000 belongs to another session; older HTTP suites hard-code that port, so the full HTTP suite runs in isolated CI. |

The [evidence index](../testing/evidence/supply-chain-native/README.md) contains 75 hashed captures, retained result logs and explicit source/native design differences. Browser inspection corrected missing host-scoped modal styling, focus loss after save and mobile detail below a long list. Native mobile selection now replaces the list with detail and an explicit Back control. No capture or test pass grants owner acceptance or an accepted design fingerprint.

The first sandboxed Node/tsx attempts failed before loading tests with `uv_os_get_passwd ENOMEM`. Unsandboxed local runs loaded and executed normally. This is recorded as a local tool failure, not an application regression. Next's first worktree launch could not resolve its package inside the new checkout; installing the existing locked dependencies locally is environment setup, not a dependency change.

The seeded identity compatibility proofs retain exact comparisons and allow only the three authored seed-49 identities; no previous identity or counter is relaxed. Shell compatibility proofs now expect the native Supply landing and eight links including My Work. The new quantity guard closes an identified revision loophole instead of allowing a smaller parent quantity to contradict retained physical evidence.

Main was reconciled with the ES-02 design-board merge at `2173cc64eed54b1e3fb8334495f7cd924206d13f`, tree `c7d9f5402c8d09dc6d37df0cb7d81ecd0d507276`. PRs #315 (Scheduling refinement) and #316 (FI-05) were audited; they have no migration collision but overlap shared status/register/receipt files. Their unrelated work is preserved. Review increments: `d75377f` persistence/API; `420fd5e` native workspaces/guides; `8b74caa` verification; `3bb510c` working documentation.

Follow-through: `116f210` browser/correctness refinements; `55d795d` exact seed/shell expectations; `6305a2c` mobile detail navigation and stale-review proof; `ecf2f57` retained physical quantity guards. The PR records the final evidence/CI-proof commit and its complete check set.

## Traceability and boundaries

### PR integration repair, 25 September 2026

Dean authorised fixing and merging the open PRs. The first E1 CI run on #317 failed because the retained shell-preview test still expected `/work?department=supply`; the native Supply landing is `/supply/material-readiness`. The test now checks that route and retains the reload, workspace selection and cross-module navigation assertions. Current main's FI-05 receipt authority, component consumers, guides and page records are reconciled alongside Supply's entries. Neither domain loses its authority checks or review status. Final branch CI and merge evidence remain in PR #317; this repair does not grant design acceptance or deploy the application.

SCM-01–SCM-08 and SVC-09; IF-11–IF-16; D-005/D-006/D-015/D-017; AT-16/AT-29/AT-31. Allocation and custody constraints are local synthetic coordination rules, not MYOB transaction semantics. Manual origin/release/quotation/warranty references are explicitly evidence where verified receiving contracts are absent. Scheduling owns actual proposed intervals/crew and document owners own reissue. Supply Chain creates an owned review Activity and leaves current downstream records untouched.

Open source/business policy: live ERP mappings and authority, observation-age thresholds, unit conversion dictionary, reservation policy, commercial visibility adoption, customer acknowledgement medium, partial-dispatch policy, source shipment semantics and credit/financial definitions. Unsupported source commands remain Not configured. No automatic netting, loss calculation, invoice, payment, stock posting, installation, booking or customer communication is implied.
