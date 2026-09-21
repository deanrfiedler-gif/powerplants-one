---
document_id: PPO-ES08-HANDOVER
revision: r01
date: 2026-09-21
owner: Dean Fiedler
status: Implemented and verified in synthetic scope; owner acceptance pending
---

# ES-08 native Specialist Configuration Workbench

Dean requested execution of the two issued r02 documents. Their normative bodies
are identical. Scope is Screen Systems, EST-06/E5, CRE-13–CRE-17, EA-16/17,
AT-04/28, G06 and D-009; no parent requirement is renamed or closed by this work.
[Architecture and precision ledger](../decisions/ADR-0034-es08-specialist-workbench.md).
Branch `feat/es08-specialist-workbench` integrates ES-02 prerequisite `ce1920c`;
the original implementation and historical evidence started on `ea57344`.
The [field contract](es08-field-contract.csv) records types/technical limits; these
are defensive computation bounds, not approved engineering ranges. The authored
[golden fixture manifest](../../tests/fixtures/es08-golden-r01.json) pins Appendix E.

| Package | Delivered work |
|---|---|
| S01 | Source inventories, exact contracts, authority/writer reconciliation and ADR |
| S02 | Migration/seed 0040, durable raw drafts, immutable runs and resolved sets, scoped APIs |
| S03 | Exact rational engine, 64 fields, five extra screens, 143 positions, 101 catalogue entries, 14 manual allowances, six gates, 12 parameters |
| S04 | Register/create and six native views, shared shell, four accessible schematic diagrams, independent pricing lanes |
| S05 | Configuration and estimate B/C/N comparisons, contribution lineage in every estimate writer, atomic synthetic receiving, source rebase/copy/archive and reload recovery |
| S06 | Unit/database/HTTP/browser/upgrade and independent design-source verification; final result table is maintained below |

## Review and demonstration

Use only the disposable `ppo_synthetic_test` database. The fixture command
`node --env-file=.env.local --import tsx scripts/es08-fixture.ts` installs the named
synthetic example if absent; its explicit `reset` argument destroys only that
disposable database. No production connections or raw workbook prices are used.
Run the existing local server, select the coordinator demonstration identity and
open `/estimating/configurations/e5080000-0000-4000-8000-000000000005/configure`.

1. Inspect Configure, Parts & working, Pricing, Compare & save, Definition review
   and Run history. Parts can show all 143 rows and open source/working inspectors.
2. Change bays from 12 to 13. All fourteen manual allowances retain values but
   require review. Review each displayed value, then save an immutable review run.
3. In Compare & save expand native AUD rates, explicitly choose the authored
   synthetic proposal, review estimate changes and apply. The new estimate version
   retains the unrelated manual line and links each contribution to the exact run.
4. Edit or delete a contributed line through ordinary estimate save, then return
   to the configuration and save a further reviewed run. Review receiving and
   choose Keep current / Keep omitted / Restore explicitly. Cancel changes
   nothing. A stale target version requires a renewed comparison.
5. Inspect historical runs and export exact synthetic review evidence. Saving a
   draft/run does not select discovery, change costs or update existing quotations.
6. For the deterministic lost-response demonstration, run the compiled browser
   scenario with `npx playwright test --config=playwright.es08.config.ts --grep "reload recovery"`.
   It drops the response after acceptance and also before
   acceptance, reloads with only the minimal operation pointer, then checks the
   original receipt or explicitly resolves the original. The first preserves the
   accepted version; the second permanently closes the unaccepted original before
   another save. It uses and resets only the disposable synthetic database.

Internal UUID and `SYN-PPO-CFG-<UUID>` display references are distinct. Creation
binds a saved alternative/discovery and explicit FacilityScope or defined system
coverage. Existing ES-02 Text/Zones facts are context, not inferred screen dimensions.
Rebase makes a new source binding/draft; copy into another alternative gets a new
identity and no cost ownership. Archived history remains available when permitted.

## Verification checkpoint

Environment: Windows, Node 24.21.0, npm 11.19.0, Python 3.14.7, PostgreSQL 16.15,
Chrome 153.0.8010.53 and Playwright 1.63.0. No new dependency or external service.
Implementation starts at `9ecab79`; final application commit `df93ff4` also fixes
phone-menu closure, stale background refresh after an accepted save and receiving
error visibility. The browser regression deliberately holds the resource refresh
until receiving review has used the accepted version. Final verification commit
`b421c7c` only changes browser synchronization after that application build.
[Draft PR #273](https://github.com/deanrfiedler-gif/powerplants-one/pull/273)
is stacked on [ES-02 #272](https://github.com/deanrfiedler-gif/powerplants-one/pull/272).
The [evidence record](../testing/evidence/es08-native-r01/README.md) pins commands,
file fingerprints, curated screenshots and exact CI provenance.

| Check | Executed result / limit |
|---|---|
| `npm run build`, TypeScript, lint | Passed; final application built at `df93ff4`; browser synchronization verified at `b421c7c` |
| Specialist unit | 16 passed: authored Appendix E, exact rounding boundaries, 28 historical scenarios, three explicit decimal differences and incompatible inheritance refusal |
| Specialist database | All 15 cases passed. Initial local full run: 13/14; a seed timezone timeout passed in targeted rerun. Later CI: all 15 in the complete 70-case Estimating suite passed |
| Cross-0026 upgrade | Passed locally and in the 70-case CI suite; exact earlier estimates, quotations, hashes, receipts and grants preserved |
| Direct HTTP | 2/2 specialist cases passed locally against the compiled server; valid >64 KiB bodies, raw/multibyte oversize, existing 64 KiB boundary, scope, tampering, exact receiver and shared receipts |
| Compiled browser | At `b421c7c`, all 10 desktop/touch-phone scenarios passed across runs: 9/10 in the full run, then 1/1 phone receiving rerun after a timezone-seed timeout before assertions. Covers six views/design/responsive/diagrams, manual receiving/deletion, accepted/unaccepted reload, unborn-create/read-only/revocation, delayed refresh and out-of-order preview |
| Full compiled browser CI | 244 passed, 37 skipped at `b421c7c`, including all ten specialist cases in one run and both desktop journeys that timed out in separate development-server jobs |
| Final integrated Estimating CI | Run 35592341601 passed at `74ecac4`: 177 unit, 70 database, seven HTTP, restart proof, 13 E1 browser project checks (including warm-up), 29 ES-02 and ten ES-08 browser cases |
| Retained r03 source | 41 model groups and 35 native browser groups passed; issued files unchanged |
| Foundation / naming | Passed; 78 parent requirements retained; maintained instructions 7,969 characters |
| Full unit | Linux CI 177/177 passed. Earlier Windows run 171/175; four path failures reproduced on unmodified main `8ed8b0c` |
| Hosted-demo upgrade preparation | CI run 35590275615 passed at `b421c7c`; no hosted deployment performed |

[Initial Estimating CI run 35586327777](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35586327777)
passed lint/typecheck/build, all 177 unit and all 70 database cases at `9ecab79`.
It then stopped at a test expecting HTTP 413 instead of the existing platform's
422 PayloadTooLarge contract. That expectation is corrected in `37c6c7d`; the
local two-case HTTP rerun passed. Oversize requests use separate connections in
the proof because the server cancels an oversized request stream. This does not
change runtime transport semantics. Current PR checks identify later complete runs.

[Compiled application CI run 35590275717](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35590275717)
passed 244 cases (37 intentional skips), including all ten ES-08 desktop/phone cases.
[Estimating CI run 35590275776](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35590275776)
passed 177 unit, 70 database, seven direct HTTP cases and the three-process/two-database-
restart proof at `b421c7c`. Its later development-server browser stage passed 12/13;
the remaining case timed out after five seconds while still showing Loading. The
same case passed in the compiled suite in 2.1 seconds. Workflow-only `74ecac4` makes
that stage use the already-built application through the existing compiled config;
assertions and timeouts are unchanged. No application or browser source changed. The
[final Estimating run 35592341601](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35592341601)
passed every stage at `74ecac4`. The Engineering development-server job also passed
on its unchanged retry; the broad P01–P11 application/database job was still running
when this handover was prepared and is not represented as a completed pass.

The four Windows baseline failures are two document-store ExactDocumentUnavailable
cases, one recovery UnsafeRecoveryDirectory case and one warm-route path assertion.
They are not ES-08 passes. Browser locator/formatting failures were corrected against
actual control labels, native three-decimal quantities and rendered text. Verification
also fixed route placement, repeat manual-retention comparison, phone navigation,
accepted-version refresh races and compact error/empty-warning presentation; these
were implementation findings, not source approval.

## Remaining decisions

Engineering ranges/branches, motor mapping, source catalogue conflicts, stock-unit
conversion, installation/productivity and operational commercial policy remain
unapproved. The receiver is restricted to `SYN-ES08-RECEIVE-01`; general operational
receiving remains blocked. This build adds no ERP endpoint, procurement release,
customer output, production transaction, deployment or owner acceptance.

## Derived verification index

All ES08-T IDs below derive from EST-06/E5, CRE-13–CRE-17, EA-16/17, AT-04/28,
G06 and D-009. The index locates implementation evidence; executed results are
reported in the verification table, not inferred from a test label. U = specialist
unit file; D = specialist database plus relevant existing E2 regressions; H =
specialist HTTP; B = compiled specialist browser; R = code/source/visual review.

| ID | Area | Evidence and bounded interpretation |
|---|---|---|
| ES08-T01 | Scope and source | R — ADR-0034; current ES-02 prerequisite retained |
| ES08-T02 | Native shell | B |
| ES08-T03 | Header/menu | B |
| ES08-T04 | Responsive/accessibility | B — 320/390/960/1024/1280/1440/1920 CSS widths; 960 is 200%-equivalent reflow, not a claimed assistive-technology audit |
| ES08-T05 | Scoped navigation | D / H |
| ES08-T06 | Source context | D / H |
| ES08-T07 | Field completeness | U / B |
| ES08-T08 | Input provenance | U — Source context inherited; incompatible Text/Zones numeric mapping is refused |
| ES08-T09 | Exact lookup | U |
| ES08-T10 | Rounding order | U |
| ES08-T11 | Physical geometry | U |
| ES08-T12 | Drive identities | U — Separate source keys retained; historical scenarios exercise branch identity |
| ES08-T13 | Pipe changes | U |
| ES08-T14 | Source gaps | U — Findings remain review-required; tests do not close source gaps |
| ES08-T15 | Invalid arithmetic | U |
| ES08-T16 | Parts registry | U / B |
| ES08-T17 | Part conflicts | U |
| ES08-T18 | Manual quantities | U / D |
| ES08-T19 | Manual review invalidation | U / B |
| ES08-T20 | Gate semantics | U |
| ES08-T21 | Parameters | U |
| ES08-T22 | Historical parity | U — 28 scenarios; three exact decimal corrections in ADR, no blanket parity |
| ES08-T23 | Pricing unknowns | U / B |
| ES08-T24 | Money policy | U |
| ES08-T25 | Immutable evidence | D — Immutable database snapshots; future catalogue publishing is outside this bundle |
| ES08-T26 | Durable draft | D / B |
| ES08-T27 | Preview authority | D / H |
| ES08-T28 | Run atomicity | D |
| ES08-T29 | Configuration rerun | U / B |
| ES08-T30 | Resolved totals | U — Resolved pricing uses chosen lines and withholds unresolved totals; generic choice arithmetic has authored expected totals |
| ES08-T31 | Cancel | D / B |
| ES08-T32 | Definition successor | U — Exact bundle mismatch is refused; incompatible SKU/unit retention tested; no bundle publishing UI |
| ES08-T33 | Copy/archive | D |
| ES08-T34 | Estimate separation | D / B |
| ES08-T35 | Receiving eligibility | D / H |
| ES08-T36 | Exact cost basis | D |
| ES08-T37 | Line capacity | D |
| ES08-T38 | Precision/units | U / D — Exact native three-decimal constraint; this manifest supports factor-one calculation units only |
| ES08-T39 | Receiving money fields | H |
| ES08-T40 | Target manual edits | U / B |
| ES08-T41 | Contribution ownership | D |
| ES08-T42 | Retained removal | U / D — Dedicated retained-removal/reappearance database proof |
| ES08-T43 | Ordinary estimate save | D |
| ES08-T44 | Adoption transaction | D |
| ES08-T45 | Concurrent adoption | D |
| ES08-T46 | Idempotency | D / H |
| ES08-T47 | Unknown outcome | B |
| ES08-T48 | Permission loss | D / B |
| ES08-T49 | Locked contexts | D — Shared current owner/whole-group Draft checks; existing E2 regression exercises locked-state guard |
| ES08-T50 | Redaction | H — Only sanitized source metadata and authored synthetic AUD 1/2 rates; no raw private source copied |
| ES08-T51 | Snapshot export | H / B |
| ES08-T52 | Freshness/races | B — Late calculation response and deliberately delayed post-save resource refresh |
| ES08-T53 | Bounds | U / H |
| ES08-T54 | Upgrade/replay | D — Migration 0040 (earlier branch slots 0031/0033); all exact registry consumers updated; cross-0026 estimate upgrade |
| ES08-T55 | Visual evidence | B |
| ES08-T56 | Handover accuracy | R — This handover and pinned evidence manifest; owner acceptance remains separate |
| ES08-T57 | Transport contract | H |
| ES08-T58 | Identity and receipt dispatch | D / H |
| ES08-T59 | Accepted-source authorization | D / H — Exact accepted draft/run/resolved/estimate authorization follows original audit references |
| ES08-T60 | Replay and lock order | D — Original receipt replay precedes current mutable-state gates after current authorization |
| ES08-T61 | Raw incomplete drafts | H / B |
| ES08-T62 | Validation and hashes | U |
| ES08-T63 | Deleted contribution | U / D / B |
| ES08-T64 | Unchanged money/new provenance | D |
| ES08-T65 | Immutable resolved sets | D / H |
| ES08-T66 | Lineage integrity | D |
| ES08-T67 | All estimate writers | D |
| ES08-T68 | Identity/unit override conflict | U |
| ES08-T69 | Source rebase | D — Service integration proves same-alternative rebase and cross-alternative copy; browser dialog authoring is not separately automated |
| ES08-T70 | Synthetic eligibility manifest | H — Server-owned exact fixture/profile/hash; client flags cannot establish eligibility |
| ES08-T71 | Action/state contract | B |
| ES08-T72 | Recovery after reload | B |
| ES08-T73 | Recovery-not-found ambiguity | D |
| ES08-T74 | Downstream quote separation | D — Earlier quote remains pinned; unchanged customer-safe projection excludes specialist internals |
| ES08-T75 | Safe output and cache | H / B — No-store API/export; print re-fetches exact authorized run; existing service-worker network-only API policy reused |
| ES08-T76 | Hand-derived geometry | U |
| ES08-T77 | Rounding boundary pack | U |
| ES08-T78 | Native receiving example | U / D — Authored Appendix E money literals plus real contribution/deletion database and browser flows |
| ES08-T79 | Envelope/security boundaries | U / H |
| ES08-T80 | Date-stable complete fixtures | D / B — Fixtures cover valid/changed/conflict/deletion/rebase/recovery/revocation; historical rate date and relative quote dates |

Evidence files: [unit](../../tests/unit/specialist.test.ts), [database](../../tests/database/specialist.test.ts), [HTTP](../../tests/http/specialist.test.ts), [browser](../../tests/browser/specialist-workbench.spec.ts), [independent design comparator](../../tests/helpers/es08-design.ts).

## PR #273 conflict repair

On 21 September, the published ES-02 base advanced to `c0ced54`. This branch
integrates that head, including EN-07/EN-08 migrations 0030/0031 and ES-02 0032.
The unmerged ES-08 migration is renamed to 0033 with identical normalized SQL
bytes; its immutable policy/definition seed is registered at 33. All exact
migration/seed lists and the reviewed hosted-demo upgrade gate follow that order.
The Engineering seeds and their grant/user assertions are retained.

Shared secondary-menu selectors now cover every contributing module. The
automerged header/navigation and shared operation receipt dispatch were reviewed
against both parents. No issued reference, prior evidence log or executable
fingerprint is relabelled as evidence of this integration.

Fresh local verification used the combined `cf00c22` + `c0ced54` application
and the conflict resolutions above, with the same pinned Windows runtime as the
original proof. All checks passed:

- TypeScript, lint and the compiled application build.
- [54 focused unit tests](../testing/evidence/es08-native-r01/pr273-unit.txt):
  `node --import tsx --test tests/unit/specialist*.test.ts tests/unit/estimating*.test.ts tests/unit/migration*.test.ts tests/unit/my-work-fixture.test.ts`.
- [79 database/upgrade tests](../testing/evidence/es08-native-r01/pr273-database.txt):
  `node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/estimating.test.ts tests/database/estimating-workspaces.test.ts tests/database/estimating-discovery-context.test.ts tests/database/estimating-configuration.test.ts tests/database/specialist.test.ts tests/database/leads-projects-integration.test.ts tests/demo/upgrade.test.ts`.
  This includes all 15 specialist cases, estimates present across migration 0026,
  exact registry/seed replay, retained grants and the hosted-upgrade rollback proof.
- [10 compiled desktop/touch-phone browser tests](../testing/evidence/es08-native-r01/pr273-browser.txt):
  `npx playwright test --config=playwright.es08.config.ts --output verification-evidence/pr273-es08 --reporter=list`.
  All five scenarios passed on both projects in one run (3.6 minutes).
- Foundation and naming assurance; all 78 parent requirements and the
  7,969-character maintained instructions remain intact.

The new logs retain actual output with LF and trailing-whitespace normalization;
the original evidence manifest and logs remain unchanged. Database checks use
only the disposable `ppo_synthetic_test` target. No development ledger rewrite,
hosted migration or deployment is performed. Published-head CI remains a separate
check; the earlier CI results above are not evidence for this merge.

## PR #273 CI repair

[Email Calendar run 35600720314](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35600720314)
failed on `ccdd192`: its first desktop journey checked identity readiness for
five seconds while the initial session GET remained pending. The mobile journey
and the other desktop case passed. The Estimating, compiled-browser, hosted-demo
and Engineering jobs passed on that same head.

ES-02 advanced to `ce1920c`, incorporating the existing main repair (`c7101c1`,
`8c96ebb`) and PJ-09. The test now waits for the actual session response within
the existing fifteen-second action budget, checks 401 and private/no-store, and
retains the original five-second DOM assertion. Its 6.5-second delayed-response
regression is retained unchanged. No application identity behavior is changed.

The integration preserves issued migrations 0032–0038, ES-02 0039/ADR-0035 and
ES-08 ADR-0034. Specialist SQL moves unchanged to 0040; its seed uses version 40.
All exact registry/seed assertions, the hosted upgrade gate, both module routes,
receipt authority and the distinct shared/baseline menu presentations are kept.
The original verification logs and source fingerprints remain historical.

Fresh local verification passed in `tmp/es08-pr273-ci`, combining `ccdd192`
and `ce1920c` with the resolutions above. The separate loopback PostgreSQL 16
cluster contained only the disposable `ppo_synthetic_test` database.

- TypeScript, full lint, production build, foundation and naming checks passed;
  maintained instructions are 7,941 characters and all 78 parent IDs are retained.
- [59 focused unit cases](../testing/evidence/es08-native-r01/ci-repair-unit.txt):
  specialist, Estimating, migration registry and PJ-09 suites.
- [30 migration/specialist cases](../testing/evidence/es08-native-r01/ci-repair-upgrades.txt):
  all 15 ES-08 cases plus exact registry/seed and retained-original upgrade proofs.
  Command uses `--test-name-pattern='upgrade|migration|repeat|ES08'` over
  estimating, estimating-workspaces, estimating-configuration, specialist,
  leads-projects-integration, field, finance-upgrade, offline, packs, planner and
  reports database suites, with concurrency 1 and the existing 120-second deadline.
- [Nine Email Calendar/hosted-demo database cases](../testing/evidence/es08-native-r01/ci-repair-email-demo.txt),
  including current upgrade, grant preservation and late-failure rollback.
- [Four Email Calendar browser cases](../testing/evidence/es08-native-r01/ci-repair-email-browser.txt)
  passed desktop and phone, including the delayed-session regression. The ignored
  local copy changes only its relative helper import and loopback origin from
  port 3000 to 3019; this equivalence was checked. It uses the
  compiled application without a dev warm-up. Published CI retains the repository
  test and ordinary development-server workflow unchanged.
- [All ten ES-08 compiled browser cases](../testing/evidence/es08-native-r01/ci-repair-specialist-browser.txt)
  passed together in 2.8 minutes, through `playwright.es08.config.ts` on port 3018.
  Shared layout, receiving, reload recovery, permissions and stale previews pass
  on desktop and touch phone.

The new logs retain actual output with LF/trailing-whitespace normalization.
No earlier evidence is rewritten. No other checkout, development ledger or
hosted database is changed. Published-head CI results are tracked on PR #273;
these local results do not claim completion of those jobs.

The P11 focused quality job in [run 35600720445](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35600720445)
also reached its thirty-minute limit while assertions were still passing. Its
three development warm-ups each took 4.9 minutes over 347 routes. The three
focused browser stages now reuse the build already checked in that job via the
existing compiled configuration. Tests, individual timeouts, the job deadline,
fixture resets and evidence collection remain unchanged.


### My Work clock follow-up, 22 September 2026

Published `9af25b5` passed [Email Calendar](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35605295868)
and [P11 focused quality/access](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35605295637/job/106350783371),
the latter in 9 minutes 41 seconds under the unchanged thirty-minute deadline.
However, [Estimating](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35605295773)
and the [full compiled suite](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35605295683)
hit the My Work fixture's explicit near-midnight refusal at 23:30–23:39 Brisbane.
Those failures happened before UI assertions; the rest of the full compiled
suite passed. The manual fixture requires four future anchors on the same day
with twenty minutes of journey headroom, which cannot be guaranteed at midnight.

Both My Work browser suites now start their own compiled loopback server on
port 3027 (`PPO_MY_WORK_TEST_PORT` can select another). The worker chooses 08:40
Brisbane two calendar days ahead, passes that exact instant to its server and
seeds against it. A test-only preload fixes the single My Work observation-clock
SELECT and JavaScript Date after the first My Work read; browser Date agrees.
The future snapshot includes real database creation timestamps in the Deals
worklist. Data reads, commands, permissions, PostgreSQL write/audit timestamps,
browser timers and assertion deadlines remain real. The preload refuses all
databases except `ppo_synthetic_test`, and ordinary application startup never
loads it. The manual scenario and its honest late-day refusal stay unchanged.
Both suites assert the server's observation instant before creating records.

- [20 desktop/phone cases passed](../testing/evidence/es08-native-r01/ci-repair-my-work-browser.txt)
  in one 1.4-minute run around Brisbane midnight on 21–22 September. The twenty
  existing opposite-viewport exclusions remain. Local configuration derives
  both projects from `playwright.config.ts`, selects `my-work(-mobile)?`, removes
  the unrelated warm-up dependency/server and uses the tests' own compiled server.
  Command: `npx playwright test --config=tmp/my-work-ci.config.ts --reporter=list`.
- [Ten date-rule/fixture unit cases passed](../testing/evidence/es08-native-r01/ci-repair-my-work-unit.txt),
  including 23:21, the failed CI's 23:36:43, 23:59:59 and 00:00:01. They check
  snapshot inclusion, four distinct future anchors on one Brisbane day and
  unchanged 20/45/60-minute appointment durations.
- TypeScript and focused lint pass. A direct startup check confirms that the
  preload refuses `ppo_synthetic` before server startup. Foundation and naming
  assurance pass; all 78 parent IDs remain present.

These logs are new evidence. The application build and issued evidence are
unchanged by this test-harness follow-up. Published-head CI is a separate check.


ES-02 advanced to `39d6528` while this follow-up was published. Its additional
manual-fixture guard reserves the thirty-minute same-day meeting reschedule and
refuses scenarios after 22:55. The merge preserves that guard, its exhaustive
late-evening regression and its issued evidence alongside the controlled browser
clock. The two repairs are complementary: the manual fixture stays honest and
the browser proofs have a complete scenario at every wall-clock time.


The final combined tree passes [all twenty desktop/phone cases](../testing/evidence/es08-native-r01/base39d-my-work-browser.txt)
in one run and [eleven date-rule cases](../testing/evidence/es08-native-r01/base39d-my-work-unit.txt),
plus TypeScript and focused lint. The test server starts only when a page is
needed, so opposite-viewport exclusions do not start it. Its startup allowance
matches the repository's existing 120 seconds; application assertion deadlines
remain unchanged. Startup errors retain bounded diagnostic output, and the
worker terminates its own server. Earlier logs remain unchanged.
