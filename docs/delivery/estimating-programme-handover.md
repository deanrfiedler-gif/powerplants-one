# Native Estimating and Quotation programme

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Implementation authorised by the 24 September 2026 programme prompt. Review, business acceptance and deployment remain separate.

## Refreshed starting point

GitHub access and `git fetch --all --prune` succeeded on 24 September 2026. Local `main` and `origin/main` were `ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc`; the main working tree was clean. The dedicated worktree is `tmp/estimating-intake-wizard-refinement`, branch `feat/estimating-intake-wizard-refinement`.

Open PR #299 (`claude/ecstatic-lamport-1n1eoh`, inspected head `89f948c74a70435cd1d986030f2a061dab79ae1b`) owns fertigation held-import placement and ADR-0044. Shared conflict points are STATUS, guides and the document register. It changes neither the Estimating intake nor Screen Systems geometry. Existing equipment and Sales completion worktrees start at the same main; their work is not overwritten. No active ES-08 implementation worktree or PR was found. PR #296's retained repair worktree is historical documentation work.

| Scope | Actual main | Programme dependency |
|---|---|---|
| ES-01 | `/estimating` lists saved estimates only | First increment: authorised read model joining canonical opportunity, current discovery and saved estimates; no invented intake acceptance |
| ES-02 | PR #272, merge `460cf0b`, delivered five steps, multiple areas/systems, exact revisions, immutable copy lineage, read-only saved costs and guarded navigation | Preserve delivered r04 behaviour; refine only demonstrated gaps |
| ES-03 / Excel import | Manual cost-basis services exist; native source/import destinations absent | Versioned synthetic sources, safe workbook parser, reviewed successor |
| ES-04 | Native formal review absent | Exact estimate findings and configured-authority boundary |
| ES-05 / ES-06 | E1 exact immutable Draft output only | Extend existing quote aggregate; separate approval, issue, distribution and exact response |
| ES-07 | Native conversion absent | Accepted exact issue plus independently received handover; synthetic reconciliation |
| ES-08 | PR #273 merge `6cd1831`; geometry audit #278; accepted board #296 merge `4f2af84` is documentation only | WP-G00 reconciliation, then accepted drawing changes; no concurrent implementation found |
| ES-09 / ES-10 | Design/reference packages only | Service A1 exact comparison, then reviewed reference evidence |

The migration registry ends at 0044. No migration number is reserved. Current internal estimating capabilities are `estimating.read` and `estimating.edit`; quotation has separate read/prepare capabilities. No operational approval capability is inferred.

## Intake and workload increment

Traceability: PPO-010, EST-01/02/03/04, ES-01/02, ADR-0027 and ADR-0035. Retain BP-02's existing TypeScript/PostgreSQL/read-route authority and native shell; no new technology, dependency, command, capability, migration or seed is needed for this read-only increment.

Sales' current `opportunity_handovers_due` is a post-Won obligation, not an accepted Estimating request. The workload must not relabel it as acceptance. Canonical opportunity need, customer and source version remain linked; current discovery owns estimating ownership and readiness. Response dates, allocation/return commands and priority policy have no current intake contract and remain explicitly unavailable. Existing manual costs stay accessible and discovery changes do not recost them.

This increment does not complete the eleven-page programme; the dependency table remains open. A second refresh still found main at `ca006fb1`; PR #300 adds Projects A0 documentation reconciliation alongside #299. Neither owns ES-08. The original working directory is now being used for unrelated Field/Quality documentation; this task edits only its dedicated worktree.

### Verification and review evidence

Executed on Windows with Node 24.21.0, npm 11.19.0, Playwright 1.63.0, Chrome 154.0.8037.58 and an isolated loopback PostgreSQL 16 `ppo_synthetic_test` database:

- Workload unit and department-navigation tests: 7 passed. Full unit suite: 381 passed, 4 failed. The same four failures reproduce against unchanged main runtime/tests: two document-store private-directory assertions, recovery-directory classification and Windows route-path separators. No test or storage guard was weakened.
- Focused workload database suite: 3 passed; exact canonical relationships, saved-version identity, scoped access, independent capability revocation and read-only receipts covered. An initial reset failed in the existing timezone seed under its 10-second statement limit; an unchanged rerun passed.
- Direct workload HTTP: 1 passed, covering no-store reads, strict filters, unsupported mutation, denied profile and company scope.
- Final compiled workload browser run: 4 passed across desktop and phone. Covers readiness/search/history/reload, exact discovery entry, retained saved-estimate register, guide focus return, 320 px and 200% CSS enlargement, and failed/revoked reads. Extra filters use a native disclosure; a scoped shell correction removes the phone overlap; available-width container rules stack enlarged cards. [Actual inspected captures and exact source/build manifest](../testing/evidence/estimating-native-workload/README.md) retain the result without claiming owner acceptance.
- The changed seven-department navigation assertion passed locally, as did nine other desktop cases. The first Sales Tasks read timed out once and passed unchanged on a focused rerun. The suite intentionally skips its eleven mobile-project entries because it sets its own explicit phone/reflow viewports.
- Build, typecheck and lint passed. `studio:sync` discovered zero routes; `studio:check` passed (273 entries, 24 component records, 19 runnable examples; reviews remain pending). Foundation, prototype and naming checks passed, preserving all 78 parent requirements.

The earlier local rerun encountered a compiled-server startup timeout before tests executed; the original 120-second deadline remains intact. At pushed head `f929312`, [Estimating CI](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35919319365) passed all 385 Linux units, 89 database and 12 HTTP cases, restart proofs, 17 E1/workload browsers, 29 ES-02/shared regression cases, 10 ES-08 cases and 14 fertigation browsers. Both broader browser jobs passed 354 cases and failed only an outdated rail label/order assertion; that assertion is corrected here. Final-commit CI remains required before merge.

Draft [PR #301](https://github.com/deanrfiedler-gif/powerplants-one/pull/301) carries this first increment. Exact ES-01 design imagery remains unavailable; no paired-source baseline, owner review, physical-device/browser-UI zoom acceptance, merge or deployment is inferred. The separate cost-source increment is in progress; the full programme remains open.

### Current-main integration

Rebased the workload increment onto fetched main `6c5e7c4fcbaf05d712a46989faf2cf7cabb8ba72` (merged Projects A0 #300 and fertigation placement #299). Preserved the Projects status and document-register additions and both families' guide/page updates. Main still ends at migration 0044; this increment adds none. Earlier capture source hashes remain the evidence for their actual build, not a claim of fresh visual acceptance after rebase. Final published-head CI remains required.

## ES-01 design adoption

On 25 September 2026 Dean delegated the decisions on the ES-01 design board's proposals P1–P9 and questions O1–O2. They were decided and implemented on the integration head `7fb30f5`; decisions, adjustments and findings are in the [design board record](../decisions/es01-design-board.md).

- **Read model:** `readEstimatingWorkload` adds `counts` per readiness state. The field is additive and read-only, computed in the same snapshot over permitted candidates matched by search and owner, before the readiness view. No migration, capability, seed or write is added.
- **Page:** the page becomes a register with section tabs, inline owner and sort, readiness segments with counts, and a persistent 448 px detail panel from 1360 CSS px. Below that a `WorklistPanel` drawer is used, and at 760 px of register width and below, cards with the detail inline. Saved estimates becomes a table with AUD saved sell excluding tax and Not estimated for unpriced scope. The states stay distinct. `Status` gains an optional `tone` override.
- **Findings:** B1–B5 are fixed on this page. B6, a shared segmented-control hover conflict, is recorded and worked around locally only.
- **Unchanged:** intake acceptance, allocation, return commands, priority policy and the Unknown required response date.

### Verification

Run locally on Node 22.22.2 with bundled Chromium 141 against disposable PostgreSQL 16.13. The pinned Node 24.21.0 and Chrome channel are unavailable here.
- **Passed:** 434 units; 4 workload database cases, including the new counts case; 1 workload HTTP case; 5 workload browser cases, with 1 desktop-only case skipped on mobile by design; the component catalogue browser cases.
- **Failed, environmental:** four E1 browser cases, at draft-quote output only, because the pinned Chrome document renderer cannot launch here. This change touches no render or quote code.
- **Evidence:** captures, axe-core results and hashes are in the [adoption evidence](../testing/evidence/estimating-workload-design-adoption/README.md).

Pull-request CI remains the authority for the full suites. Owner visual and device review is pending, and no UI baseline entry, deployment or business acceptance is claimed.
