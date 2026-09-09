# Repository housekeeping

**Date:** 9 September 2026 · **Revision:** r01 · **Owner:** Dean Fiedler · **Scope:** documentation and revalidated merged-branch retirement.

Dean requested a repository audit, then instructed “Proceed” on the recommendation to prepare a small documentation housekeeping PR followed by retiring verified merged branches. This maintenance record preserves the concrete scope and outcome; it does not authorise unrelated merges, runtime changes or deployment.

## Source and changes

Inspected main: `f8035b5c55251da4da52430adf2f83094feccd6b`, tree `524de59ff42ef1fb8e364ab16b1c88c5b0b72f24`. GitHub reports the repository as public. Main and this contribution retain the local synthetic runtime; the private hosted demo is a separate access and source-publication concern.

- Replace the chronological STATUS narrative with a dated current-state table and links to the exact earlier STATUS and existing handovers.
- Correct current public/private wording in README, AGENTS, CONTRIBUTING and the copy-ready project instructions. Preserve historical ADRs, adopted naming wording and issued source snapshots.
- Record merged mobile PR #61, successful Azure connection verification, the still-failed current-main diagnostic job and the separately passing #73 integration head.
- Refresh the documentation index and affected register records. No source, SQL, fixtures, dependencies, tests or workflow bytes change.
- Retired only the exact 27 branch tips below after live remote revalidation and confirming their commits remain ancestors of main. Active and unique branches remain.

## Validation and publication

The contribution passed foundation (four issued sources, all 78 requirements and 1,358 local links), prototype (all 78 parent dispositions), naming (93 document records; copy-ready instructions 7,937 characters) and whitespace checks locally. [PR #80](https://github.com/deanrfiedler-gif/powerplants-one/pull/80) records the published source and CI outcomes. Initial publication `786a06b543ebfdd0a741d8bd36732ac1adc3b069` passed [Documentation assurance](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34347528430). The final retirement-record update receives its own check; initial-head results are not substitutes. No new application-test result is inferred from a documentation edit.

**Branch retirement outcome:** complete. All 27 listed refs were deleted on 9 September 2026. Final remote verification at `2026-09-09T11:58:35.257887+00:00` found none of those refs, no unrelated branch missing, unchanged main and all 27 saved commits still ancestors of main. 21 remote branches remained, including this housekeeping branch and concurrent new design work. No PRs were closed as superseded.

## Branch preservation and retirement method

The first audit found 44 remote branches including main, 27 main-merged candidates and 13 open PRs. During continuation, Quotation Builder #77, estimating E2 design #78 and wizard pilot #79 also appeared, and #75 advanced; all are preserved. Counts describe dated observations, not ongoing invariants.

The 27 candidate tips are full ancestors of inspected main. Their full commit IDs and commit links below preserve recoverability through main after branch removal. A scan of maintained tracked Markdown, CSV, JSON, HTML and YAML found no blob/tree/commits links targeting those branch names. External discussion links have not been exhaustively rewritten; these commit links remain the recovery map for historical branch URLs.

Remote tips were re-read and compared with the preserved SHA list before each retirement group; ancestry was checked against unchanged main. The connected GitHub actions have no ref-deletion operation and local Git has no authenticated push, so retirement used the signed-in GitHub branch UI. Each uniquely named row had to show zero commits ahead before deletion; GitHub then displayed Deleted/Restore. This UI route does not supply a client-side expected-tip lease. A final remote-head comparison and commit-ancestry check establish the outcome. This changes ref names only; it neither deletes commit history nor shrinks repository content.

| Retired branch | Preserved commit |
|---|---|
| `design/bp06-projects-foundation` | [52f0ab1fef609701ab9b4fd8bfbfb650a1c24bea](https://github.com/deanrfiedler-gif/powerplants-one/commit/52f0ab1fef609701ab9b4fd8bfbfb650a1c24bea) |
| `design/email-calendar-prototype` | [ee5aa5f79176b0d6be692157ce0d450b72a5cae9](https://github.com/deanrfiedler-gif/powerplants-one/commit/ee5aa5f79176b0d6be692157ce0d450b72a5cae9) |
| `docs/bp04-estimating-discovery` | [a6e4550d12dd8130805a4cd096f67d8e41362f1f](https://github.com/deanrfiedler-gif/powerplants-one/commit/a6e4550d12dd8130805a4cd096f67d8e41362f1f) |
| `docs/crm-opportunity-handover-contract` | [6f8194ecba8174e6e1cd601b2567ea203cb13839](https://github.com/deanrfiedler-gif/powerplants-one/commit/6f8194ecba8174e6e1cd601b2567ea203cb13839) |
| `docs/crm-ui-audit-revision` | [91b84d20f03b756ec42d7de80425ef0804403308](https://github.com/deanrfiedler-gif/powerplants-one/commit/91b84d20f03b756ec42d7de80425ef0804403308) |
| `docs/customer-portal-design` | [ded48d3533223e5e56e5622bfa9e91af6a9be47b](https://github.com/deanrfiedler-gif/powerplants-one/commit/ded48d3533223e5e56e5622bfa9e91af6a9be47b) |
| `docs/naming-standard` | [26859d26a422fbbd2bcf057e0710983eca41f1d9](https://github.com/deanrfiedler-gif/powerplants-one/commit/26859d26a422fbbd2bcf057e0710983eca41f1d9) |
| `docs/ppo-009-crm-discovery` | [a567523e2384b5f9642620c66c019b3ff4e3a2e5](https://github.com/deanrfiedler-gif/powerplants-one/commit/a567523e2384b5f9642620c66c019b3ff4e3a2e5) |
| `docs/ppo-ui-crm-design-handover` | [337b6d5d1a594efbe0d88bfd12dbb676a1c60ec1](https://github.com/deanrfiedler-gif/powerplants-one/commit/337b6d5d1a594efbe0d88bfd12dbb676a1c60ec1) |
| `docs/prototype-definition-architecture` | [d02710f464bb98a4274ad837db12274ed5a4074f](https://github.com/deanrfiedler-gif/powerplants-one/commit/d02710f464bb98a4274ad837db12274ed5a4074f) |
| `feature/crm-i1-owned-opportunities` | [2aa8d44bfd1dc82057a5427a20007d7d2408b890](https://github.com/deanrfiedler-gif/powerplants-one/commit/2aa8d44bfd1dc82057a5427a20007d7d2408b890) |
| `feature/crm-i2-scoped-board-grid` | [16b53bb4b4fb4cae66a51cdaee4d8940919c8099](https://github.com/deanrfiedler-gif/powerplants-one/commit/16b53bb4b4fb4cae66a51cdaee4d8940919c8099) |
| `feature/estimating-e1-manual-draft` | [87a01ea1aab6b4dc0e66b193a0b6e2a579739907](https://github.com/deanrfiedler-gif/powerplants-one/commit/87a01ea1aab6b4dc0e66b193a0b6e2a579739907) |
| `feature/mobile-crm-journey` | [77942d01fa8805f9f659c82c037688c1f061a14e](https://github.com/deanrfiedler-gif/powerplants-one/commit/77942d01fa8805f9f659c82c037688c1f061a14e) |
| `feature/p01-foundation` | [0b4c432fc3597b6598f66620091fbc2347a60389](https://github.com/deanrfiedler-gif/powerplants-one/commit/0b4c432fc3597b6598f66620091fbc2347a60389) |
| `feature/p02-shared-foundation` | [bcc81adaae3e86e3239468d55bb781e80ecedf2b](https://github.com/deanrfiedler-gif/powerplants-one/commit/bcc81adaae3e86e3239468d55bb781e80ecedf2b) |
| `feature/p03-customer-intake` | [abaa118fb6780c5ab43edbc530bb9cf281034007](https://github.com/deanrfiedler-gif/powerplants-one/commit/abaa118fb6780c5ab43edbc530bb9cf281034007) |
| `feature/p04-work-scope-readiness` | [2b5e51c4687bd2c1a455df283a2d5e09ef4fc68a](https://github.com/deanrfiedler-gif/powerplants-one/commit/2b5e51c4687bd2c1a455df283a2d5e09ef4fc68a) |
| `feature/p05-planner-controlled-changes` | [0d3f814b3706d08544056afff53c01390ad3e3bc](https://github.com/deanrfiedler-gif/powerplants-one/commit/0d3f814b3706d08544056afff53c01390ad3e3bc) |
| `feature/p06-job-pack-issue` | [bec7b33baa834ead74c3b3fc6725ea0594eda54e](https://github.com/deanrfiedler-gif/powerplants-one/commit/bec7b33baa834ead74c3b3fc6725ea0594eda54e) |
| `feature/p07-technician-online` | [b3405a973e3bc1800fc785548416d2b3f2e5ecb1](https://github.com/deanrfiedler-gif/powerplants-one/commit/b3405a973e3bc1800fc785548416d2b3f2e5ecb1) |
| `feature/p08-offline-recovery` | [0451b5a0a8b638d53d2d4fe87adda434e0b8f423](https://github.com/deanrfiedler-gif/powerplants-one/commit/0451b5a0a8b638d53d2d4fe87adda434e0b8f423) |
| `feature/p09-service-review-reports` | [e23001ca62e162d0bb804f552d3371ff62a47003](https://github.com/deanrfiedler-gif/powerplants-one/commit/e23001ca62e162d0bb804f552d3371ff62a47003) |
| `feature/p10-finance-handoff` | [216102e39969aa7480bcc11898b7fe03a6d6a671](https://github.com/deanrfiedler-gif/powerplants-one/commit/216102e39969aa7480bcc11898b7fe03a6d6a671) |
| `feature/shared-ui-crm-r08` | [75d69d5820a9a0a61a616a6ae92187b05317489b](https://github.com/deanrfiedler-gif/powerplants-one/commit/75d69d5820a9a0a61a616a6ae92187b05317489b) |
| `fix/i2-merged-main-proof` | [60ad9cf15673fd98a30aaf19d271909b9d4cf78c](https://github.com/deanrfiedler-gif/powerplants-one/commit/60ad9cf15673fd98a30aaf19d271909b9d4cf78c) |
| `infra/azure-demo-connection` | [115c60220be34051e79eae22956a1e2ef869e2f4](https://github.com/deanrfiedler-gif/powerplants-one/commit/115c60220be34051e79eae22956a1e2ef869e2f4) |

## Open-work dispositions

These are review dispositions, not approval to close or merge the PRs.

| Work | Disposition |
|---|---|
| #64 Email/Calendar, #69 CRM, #72 Azure | Exact heads are ancestors of #73 at `93828dd898b55af8b8d2361983a8f554160d369d`. Resolve through that accepted integration before retiring their branches. |
| #73 integration | All eight current-head workflows passed, including [Application assurance](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34336965713). Draft/unmerged; review, publication and deployed-source evidence remain its own workstream. |
| #75 r11 polish | Active; targets #73's branch and has advanced since the audit. Preserve it and its UI evidence. |
| #77 Quotation Builder / #78 E2 design / #79 wizard | New design contributions; preserve unchanged. |
| #63 P11 repair / issue #54 | Retain unresolved Finance recovery, test and handover differences. A main merge elsewhere does not establish complete P11 publication. |
| #71 retry / #74 CA-13 assertion | Retain pending semantic review. #73 already addresses CA-13 with a different assertion, making #74 a possible later supersession candidate. |
| #65 assistant design / #67 runtime | Three design files are byte-identical in #67, but #65 is not a commit ancestor. Preserve index/register differences and migration 0016 before consolidation. |
| #68 Facility preparation | PR #61 has merged; refresh that prerequisite while retaining approved Facility decisions and incomplete acceptance. |
| #58 shared UI design / #60 demo planning | Preserve unique design/planning/evidence before a later supersession decision. |
| `copilot/research-people-directory-ui` | Ancestor of #69 and #73, but not main; preserve until integration is accepted. |
| `docs/prototype-foundation` / `diagnostics/load-dependency-60ca8038` | Non-ancestor commits require a distinct content/history review; excluded from retirement. |

The original open issue set (#2, #9, #10, #11, #12, #13, #15, #16, #54, #66) includes unfinished discovery, operational evidence and acceptance. This maintenance work does not bulk-close it.

## Later maintenance

CI optimisation remains a separate reviewed change: five Application jobs repeat static/unit/build assurance, E1 repeats static/unit checks, and these workflows run for prose-only PRs. Preserve all distinct behavioural/restart/permission coverage when sharing setup or classifying changed files. Exclude main and explicitly retained diagnostic runs from any future obsolete-PR-run cancellation rule. No check has been disabled or waived here.

Preserve issued sources, migrations, licences and accepted images. The audit found no generated build clutter; approximately 72% of tracked bytes are retained test evidence. Future evidence retention can be simplified without altering accepted bytes or rewriting history. Large screen components and CSS merit incremental maintenance alongside their next functional changes, after active CRM branches are reconciled.

At audit, main was unprotected and repository rulesets were empty. This records the observed enforcement boundary; it does not change access or branch settings.
