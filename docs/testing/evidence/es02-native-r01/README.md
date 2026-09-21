---
document_id: PPO-ES02-EVD
revision: r01
date: 2026-09-21
owner: Dean Fiedler
status: Local and CI synthetic verification passed; owner acceptance separate
---

# ES-02 native verification record

See the [handover and T01–T70 evidence index](../../../delivery/es02-estimation-wizard-handover.md).
The source manifest records byte fingerprints for executable changes and immutable
input references; the draft PR's required Estimating job identifies the exact tested
commit. Local working tree started at `0b3669c`, then advanced to `8ed8b0c` after
#271 merged with an identical application tree. All data here is synthetic.

## Required CI result

[Estimating assurance run 35573783287](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35573783287)
passed at `3252407fe8616f12127a8700e25c82e6c49c11d7`: 161 units, 54 database
cases, 5 direct HTTP cases, 13 existing E1 browser cases and all 29 compiled ES-02 /
shared browser cases. Three application processes and three distinct PostgreSQL
start times prove two actual database restarts. [Retained run metadata](ci/run-35573783287.json)
and [final restart proof](ci/es02-verify.json) preserve the source, process identities
and unchanged HTML/PDF hashes. The later harness-only correction obtains the active
browser origin instead of assuming port 3012; an independent port-3014 native check
passed. The detailed conformance spec runs in the desktop project, includes seven
viewport widths and complements the existing mobile discovery and Engineering cases.
Current PR checks are on [draft PR #272](https://github.com/deanrfiedler-gif/powerplants-one/pull/272).

The same Estimating checks passed at `06dde4a` in
[run 35575246743](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35575246743).
[Full compiled browser CI](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35575246777)
passed 234 cases with 37 skips. The later cost-pagination authority fix is separate
from those results: [pagination-review.json](pagination-review.json) records its
exact source fingerprints, a failing-before / passing-after denial regression and
ten passing configuration database cases. Original manifests/captures remain tied
to their recorded source; latest PR checks verify the later server read.

## Executed local checks

| Proof | Result / limit |
|---|---|
| New configuration unit cases | 11 pass, including both exact whole-envelope UTF-8 edges and copied graph comparison. |
| Full unit suite | 157/161; four Windows/path failures reproduced in an unmodified current-main checkout. |
| PostgreSQL regression | 54/54 pass across Estimating, workspaces, context and configuration; complete run recorded in `database.txt`. Includes forward upgrade/reseed and direct constraint/authority/race cases. |
| Direct HTTP | 5 pass against owned compiled loopback server; native create/receipt/summary/history/compare/evidence plus exact costing and HTML/PDF recovery. |
| Earlier compiled browser regression | 27 pass; the desktop project intentionally skipped the Engineering phone case. |
| Final expanded compiled regression | 28/29 passed; one broad Columns selector matched two retained DOM controls. The corrected native case passes separately in `capture-final.txt`; CI runs the complete corrected suite. |
| Additional desktop/mobile proof | 9 pass, including actual Engineering phone containment and column preferences. |
| Final wizard proof | 5 pass, including delayed preview, maximum scope and archived read-only costs. |
| Static/documentation | Build, typecheck, lint, foundation and naming checks pass as recorded. Foundation is documentation assurance, not business acceptance. |
| Real app/PostgreSQL restarts | Required CI run passed all three phases. Local write-only phase also passed on owned port 3019; the local database was not restarted. |

The four main-baseline failures are `document-store.test.ts` (2),
`recovery.test.ts` (1), and `warm-routes.test.ts` (1); baseline logs remain retained.
The main baseline is `8ed8b0c5dadad9a48d972a9bff39b6953ad4e55b`.

## Native visual and performance evidence

Native PNGs cover the specified Northbank fixture and seven widths; additional
captures show a maximum 20-area/40-system scope and archived read-only saved costs.
The source comparison loads both issued r03 HTML and r22 independently, checks
their hashes, matches tokens and measures shared shell geometry. More aligns by
its **right** edge, not its left. No generated mockup image was supplied. Native
owner visual/accessibility acceptance and a new accepted baseline are not claimed.

`maximum.json` records actual byte counts and timings, including main read,
preview, save and exact comparison. This is one local Windows/Node 24.21/Chrome
153/PostgreSQL 16.15 sample, not a production SLA. The fixture tests maximum area
and system cardinalities together, with 40 facts; the 65,536-byte request budget
also limits all other collection combinations.

## Failed checkpoints retained

The first configuration migration run found a JSONB operator-precedence error,
corrected before the passing database tests. The full initial PostgreSQL regression
had one wrong expected error-code assertion (the shared mapping returns
InvalidRelationship), then its corrected cases passed. First browser attempts
omitted local sign-in, used an old review-region selector and measured More's left
edge incorrectly; those test setup/measurement assumptions were corrected. A
native review also found a History wrapper that let the breadcrumb change despite
canceling the navigation; guarding before Next receives the mutation fixed it.
The cross-document Back test was corrected to inspect the real native beforeunload
warning. Selected-editor/filter lifetime was corrected by retaining mounted step
editors. The final Columns test targets the accessible Systems region after retained
navigation, rather than any matching DOM control. Logs/screenshots retained under `failed/` are not passing evidence.

Automatic approval review rejected isolated local PostgreSQL creation/restart with
“blocked by policy” and no further reason. The task did not restart another local
workspace's database. Existing CI owns a disposable container and now exercises
ES-02 alongside the original E1/E2 three-process, two-database-restart proof.

No trace archives, cookies, credentials or raw operational exports are committed.

Text logs normalise line endings and trailing whitespace. Source and screenshot
bytes are fingerprinted separately; no failed result is relabelled as passing.

## Integration after the fully green checkpoint

Commit `ea57344` passed all 17 checks, including [full Application assurance](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35578429880): 464 database, 32 HTTP and 234 browser cases, in addition to the retained domain/restart proofs. New main `f977bf8` then required a reviewed merge: EN-07/EN-08 own 0030/0031, so the unmerged ES-02 SQL moves unchanged to 0032. Original source/artifact manifests remain historical; the [handover](../../../delivery/es02-estimation-wizard-handover.md) records reconciliation and the PR identifies fresh combined-source results.
