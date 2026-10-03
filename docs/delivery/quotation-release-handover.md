# Synthetic quotation release implementation handover

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. 3 October 2026. Implemented on `codex/quotation-release`, [PR #340](https://github.com/deanrfiedler-gif/powerplants-one/pull/340), stacked on [ES-04 PR #338](https://github.com/deanrfiedler-gif/powerplants-one/pull/338). This document records actual source and proof separately from owner acceptance, merge and deployment.

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

## Next boundary

ES-06 must record the exact issue, permitted selection and attributable customer-response/correction facts without transferring acceptance. Material negotiation requires an explicit ES-05 successor. ES-07 then separates handover sending, receiving, item/target-line review and idempotent downstream creation. Neither Excel import nor specialist expansion is a prerequisite for the initial manual journey.
