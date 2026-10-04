# Synthetic quotation release implementation handover

**Current reconciliation, 4 October 2026:** ES-04 #338, ES-05 #340, ES-06 #341 and ES-07 #342 are merged. Refreshed main is `a32b3b53c45bdc74061f3612c15d71c0544504d8`; #342 final head `2edcf91dab9245c4ead866920463ce902fabe267` passed all 25 checks, including 580 units and 727 PostgreSQL cases across both mandatory isolated shards. Earlier pre-merge statements retain their dated checkpoint meaning. The current [completed-conversion disposition decision](../decisions/quotation-disposition-native.md) adds explicit retention, continuing holds and eligible native Forecast quantity revision. Operational policy, owner acceptance and deployment remain separate.


**Current reconciliation, 3 October 2026:** ES-04 #338 and ES-05 #340 are merged in refreshed main `ab4acd687f6a4911ebc5f3f1bd8f09d5ff1e1547`; all 24 final ES-05 checks passed. Historical pre-merge wording below is superseded. [ES-06 contribution](quotation-response-handover.md) adds exact staff-recorded responses, immutable correction and controlled negotiation, with separate ES-07 review preparation. Receiving/item conversion remains next.


<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. 3 October 2026. Implemented on `codex/quotation-release`, [PR #340](https://github.com/deanrfiedler-gif/powerplants-one/pull/340), based on merged [ES-04 PR #338](https://github.com/deanrfiedler-gif/powerplants-one/pull/338) (main `48b2abd`, merged independently on 3 October). This document records actual source and proof separately from owner acceptance, merge and deployment.

## Implemented boundary

The [decision](../decisions/quotation-release-native.md) records the user's delegated synthetic choices and the reason to reuse the current quotation aggregate, identities and renderer. The [contract](../contracts/quotation-release.md) describes current source/recipient/output binding, distinct duties and original-command recovery. The native route is `/estimating/quotes/[id]/release`.

The source preserves all earlier saved estimates, E1 Drafts and exact output; 0059 adds immutable subordinate release bindings/events and named local fixtures. Existing file and render paths recheck captured recipient authority. No live provider, operative commercial terms, customer response or downstream conversion is supplied by this increment.

## Execution ledger

Runtime source `ea67777b35fa5cd347da45fc2b3ef33d612ec4bd`; subsequent evidence edits change no runtime source. [Reproduction, original captures and exact build/source manifest](../testing/evidence/quotation-release/README.md).

| Check | Actual local result |
|---|---|
| New PostgreSQL suite | **10/10 pass together** in the final run, covering exact issue, independent duties, concurrent commands, late rollback, interrupted rendering, successor issues, original recipient revocation and populated 0058 upgrade |
| Cross-module / hosted upgrades | **25 distinct cases pass**: 17 initial passes plus eight passing reruns/additional cases. Required ledger/grant consumers, old E1/discovery bytes, hosted grants, CRLF historical checksums and rollback are covered |
| Compiled HTTP | **6/6 pass**, including E1/ES-04 regressions and the full bounded ES-05 path |
| Compiled desktop/mobile | **25/25 pass**, then **7/7 final ES-05/warm-up replays pass** after capture readiness was strengthened |
| Actual app/PostgreSQL restart | **Pass**: 23 stored rows, four exact original-command replays and four original Draft/release HTML/PDF files unchanged |
| Unit | **571 pass / 4 fail**; all four Windows failures reproduce on pristine main `6e8b898` with unchanged assertions |
| Static/build | Final build/type check and lint pass; foundation/prototype/naming/studio pass. AD-01: **107 model / 40 browser groups pass**, 111 capabilities |

The populated 0058→0059 proof retains every original estimate/review/quote/job/evidence row, prior ledger checksum, grant and original Draft HTML/PDF. It checks exactly thirteen new grants and two local identities. Repeat seed preserves revoked approval; hosted upgrades confer no new quotation approval/issue/distribution duty on hosted users.

Failed-run dispositions are retained in the evidence README. New test SQL/context fixtures and two omitted exact registry expectations were corrected; none were blamed on main. The four baseline failures concern Windows private-path classification and route separators; no storage protection or assertion was weakened. The initial screenshot caught loading; final captures wait for the actual saved page load.

Codex inspected original desktop, phone and 320px views. This is not accepted paired-reference, owner, physical-device, screen-reader or 200% browser-zoom evidence. Register/component reviews remain pending. CI status is separately visible on the PR; a local pass does not claim current-head CI completion.

The baseline checkout, unfinished Excel parser/worktree, all other unfinished contributions, original issued references and retained private restart evidence are preserved. Main was refreshed again at `6e8b898`; open Field Work #339 has no competing migration allocation. No merge, deployment, live integration, communication or operational transaction occurred.

## FI07 populated-upgrade follow-up

PR #338's reported database failure exposed a missing FI07-07 expectation for grants and later migrations. This stacked contribution includes the parent repair and extends the same strict proof through 0059: all original grants/users and business evidence survive unchanged; exactly eighteen combined seed-58/59 grants and the two complete local quotation user rows are added; migration additions are `[57, 58, 59]` and seed additions `[58, 59]`. A second migration/seed run preserves the first run's grants, users and ledgers exactly. Original report response/receipt replay and issued HTML/PDF hashes remain checked.

The focused FI07-07 case passes locally against the task-owned resettable database. This is additional evidence to the nine passing customer-response cases on the repaired parent; it is not a claim that the full child database suite has rerun. The fix changes test expectations and documentation only. The existing restart databases and issued originals remain preserved. Fresh final-head CI is still required.

## Scheduling successor focus integration

The parent repair `b00dab0` fixes a delayed-head focus race also reproduced on unchanged main. [Original failure, source hashes and complete 18-case parent proof](../testing/evidence/scheduling-successor-focus/README.md) are retained with the implementation and live guide/component records. After integrating it as `bec9340`, this ES-05 checkout also passed a fresh production build (including TypeScript), studio integrity and both compiled desktop/mobile delayed-head focus cases. Parent and child Scheduling implementation/test bytes match. This focused follow-up changes no quotation command, migration, grant or issued output. Fresh final-head CI remains separate.

## Retained assurance repair after run 37112227931

The failed head `69e0ffa` passed quotation-specific assurance and the standalone compiled browser check. Its primary browser lane passed 549 cases and failed desktop CR05 before its saved review finished loading; the original context and subsequent screenshot retain both states. An unchanged-main compiled control passed normally and reproduced the same assertion failure when its real review response was delayed six seconds. The corrected test awaits that original exact-record response before retaining all UI assertions. This is a test readiness correction, not a changed commercial workflow.

The database job reached its 90-minute limit with 703 cases passed and no assertion failure; it did not complete. The full suite now uses two native Node shards, each serial against its own disposable database. Both remain mandatory under the existing aggregate, with unchanged individual and job deadlines. Local full-suite selection is unchanged. [Decision, measured comparison and alternatives](../decisions/ci-retained-suite-isolation.md#es-05-full-database-suite-budget) and [repair verification](../testing/evidence/quotation-assurance-repair/README.md) keep the failed original separate from corrected-source proof.

## Next boundary

ES-06 must record the exact issue, permitted selection and attributable customer-response/correction facts without transferring acceptance. Material negotiation requires an explicit ES-05 successor. ES-07 then separates handover sending, receiving, item/target-line review and idempotent downstream creation. Neither Excel import nor specialist expansion is a prerequisite for the initial manual journey.
