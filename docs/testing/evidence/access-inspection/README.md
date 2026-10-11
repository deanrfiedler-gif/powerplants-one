# AD-01 native access inspection evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 11 October 2026 (Australia/Brisbane). Branch: codex/ad01-access-review, baseline 0e10459. Scope decision: [native inspection](../../../decisions/access-review-native.md).

## Execution

The read-only increment is implemented in [PR #410](https://github.com/deanrfiedler-gif/powerplants-one/pull/410). Main's PT-27 contribution was integrated at bb834ee; the application change is bounded by the native inspection decision. CI and owner acceptance remain separate from the local results below.

| Proof | Actual result |
|---|---|
| AD-01 PostgreSQL suite | 10 passed, including populated 0077 upgrade, exact new grant, denials, masking and unchanged-row reads |
| Integrated AD-01 / ES-07 disposition / ES-06 response / LC-16 upgrade run | 13 passed; all original rows and exact output bytes retained; one grant/seed receipt added |
| Products upgrade histories | Eight passed, starting at 0025, 0048, 0071, 0072, 0074, 0076, 0077 and 0078, including reserved 0052 installation |
| Retained Estimating and Leads/Projects upgrade proofs | E1-DB10, DR01-DB03 and all three selected combined Leads/Projects installation/upgrade cases passed |
| Populated policy 0050 upgrade | Passed after correcting the old-ledger prefix from 27 to 28 added migrations |
| Native browser | Nine passed: directory/search, exact site allow/deny, stale-result clearing, current denial, no write method, revoked detail clearing, retry and no horizontal overflow at 1440/390/320 px |
| Navigation | 16 focused unit checks passed |
| Working AD-01 design | 107 model groups and 40 browser groups passed; current capability catalogue is 132 |
| Application and repository checks | Final combined application build/typecheck and changed-file lint passed; final studio, foundation, prototype and naming passed |

The final application build and nine browser checks pass at application source 538cfe1. Changed-file lint passes at that source. The 13-test database run exercises the same runtime service/migration and corrected upgrade helper; the subsequent application change only moves the displayed company key before its name. The task-owned local app and PostgreSQL processes were stopped after verification; fixture data is retained outside the repository.

Final studio result: 352 entries, 198 source routes, zero errors, 324 unreviewed entries and 28 stale reviews. All 12 capture hashes verify. Retained [database output](database.txt) and [browser output](browser.txt) accompany the [check summaries](checks.json). Full CI remains pending; a local pass is not represented as CI completion.

The selected E2-workspaces file had no matching test in the first filtered upgrade run; that file-level exit is not claimed as an executed E2 upgrade proof. Full application/upgrade suites run in CI.

The initial focused run passed the ordinary-identity denials, exact company/site explanation, inactivity/expiry, reviewer revocation, working-company narrowing and unchanged-row read checks. Upgrade reset hit the isolated cluster's default lock limit; configured max_locks_per_transaction=512 and restarted that task-owned cluster. Hosted masking fixture initially lacked the hosted-only identity migration; the corrected test installs the actual retained migration before its fictional hosted row. These are setup corrections, not runtime changes.

Initial browser attempts encountered an unready server, a separate request cookie jar and selectors that did not match the shared shell's register heading/Next route announcer. The final tests use the shared identity fixture transport, actual breadcrumbs and scoped error controls. The final working-company refusal also required an explicit Failure type before the combined build passed. These attempts are not counted as passing evidence.

The policy fresh-install check hit the existing ten-second database statement timeout during reset/snapshot. The same timeout reproduced against an unmodified 0e10459 source export in this local environment. The populated policy rerun passed. No application timeout was increased or weakened. Earlier runs also encountered local memory pressure; that observation is not a production performance finding.

CI initially found the ES-07 disposition snapshot still expecting no added grant/seed receipt. The correction preserves every old row, validates the exact new Workspace Systems grant and seed 78 receipt, then compares the full upgraded snapshot through repeat migration/seeding. Related quotation upgrade snapshots use the same bounded assertion. The failing disposition case subsequently passed locally in the 13-test run. Superseded runs on this branch were cancelled so current-head assurance can run; those cancellations are not passes.

## Paired visual inspection

The source-bound [capture manifest](captures.json) identifies the browser, commit, viewport and image hashes. Native directory and SYN Site observer captures are retained at 1440 × 960, 390 × 844 and 320 × 740; the working HTML's same person view was captured at those widths. Native and reference screenshots retain separate filenames and provenance.

Observed differences: the native page uses the current application shell, a separate person route, grant cards and an explicit company/site eligibility form. The reference uses view tabs, grouped grant tables, a matrix and a persistent inspector. Role/team/change/campaign controls from the reference remain outside this increment. These are visible proposed adaptations, not accepted geometry. During inspection the 320-pixel native company select clipped the trailing ERP key; the option now leads with the exact key. No horizontal page overflow was observed in the checked native states.

Desktop: [native directory](native-1440-people.png), [native person](native-1440-person.png), [reference person](reference-1440-person.png).

Phone: [native directory](native-390-people.png), [native person](native-390-person.png), [reference person](reference-390-person.png).

Narrow phone: [native directory](native-320-people.png), [native person](native-320-person.png), [reference person](reference-320-person.png).

The eligibility-result views are retained separately for [desktop](native-1440-explanation.png), [phone](native-390-explanation.png) and [narrow phone](native-320-explanation.png).

## Review boundary

First read-only AD-01 increment. Roles, teams, mutations, campaign attestations and operational D-020 authority remain open. No hosted deployment, independent review, owner acceptance or physical-device/screen-reader review is claimed. Exact synthetic reference/application captures, where retained below, prove only the inspected states.

## CI menu assertion correction — 11 October 2026

PR #410 at `7ef617f` reports a [CRM header/board failure](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38106719213/job/114373694842): the retained shell fixture now includes the AD-01 destination, but its test still expects 28 links and 29 total destinations. Preserve all r17 bytes and geometry assertions; expect 29 links / 30 destinations including Help, and assert the exact Users and access link. The focused retained-r17 shell comparison passes locally after that correction ([raw result](ci-menu-correction.txt), Chrome 155, desktop). This changes test expectations only. The full rerun and other checks remain separate.

## Integrated PR repair — 11 October 2026

Dean authorised repairing and merging the open PRs. CI at `1556f6d` failed the PT-01 matrix because the old assertion required Systems to have zero grants after the new seed explicitly gave it `admin.access.read` ([original failure](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38115560966/job/114399646337)). The actual Service/Finance HTTP denials and no-effect assertions passed before this stale count failed.

The repaired assertion permits only the administrative access family in this fixture, snapshots every Systems grant and requires those exact rows after all denied approvals. It retains all HTTP denial, Service/Finance snapshot, operation-receipt and outbox checks. No runtime permission, seed or migration changes. Current-head CI and local replay results remain separate from the earlier source-bound evidence; independent review and owner acceptance stay open.
