# Scheduling saved-record disclosure repair

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. 6 October 2026. PL-04 / PP-01. Bounded CI repair accompanying SYN-ES07-08; source, functional proof, visual review and owner acceptance remain separate.

## Failure and unchanged-main comparison

PR #351 head `5da55c407b2ae8c3db636fb2fbd21bd84f1facb0` [retained compiled job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37410298685/job/112097008756) passed seventeen Scheduling cases and failed the original mobile publication-recovery journey at its unchanged 120-second test deadline. It waited for the exact saved publication link after selecting Publications. The [original capture](original-ci-failure.png) shows Reopen saved records closed. The later timer and policy restart steps remain separate results, not substitutes for the failed browser case.

The affected component and original test are byte-identical to refreshed main `61babd1a073d0163e87069a033e56ce74d5e5773`. A separate checkout compiled unchanged main with the same locked dependencies. Only a diagnostic test was added; a new disposable PostgreSQL cluster at port 5677 isolates its fixture. The test opens the summary and selects Publications in one browser turn, before the native queued `toggle` notification can bubble. The new record-type read correctly unmounts protected evidence but loses the unrecorded open state. Main fails the existing five-second visibility assertion: the loaded selector is present but hidden. [Baseline capture](unchanged-main-failure.png); [exact hashes and results](manifest.json).

This demonstrates an ordering that produces the observed symptom. The original CI artifact does not establish native-event timing. No baseline pass, assertion relaxation, deadline increase or passing retry is claimed. The first baseline build preparation rejected an out-of-root dependency junction; the successful comparison used a clean checkout and a fresh locked install. Retained application/restart databases were not reset or repurposed.

## Small native UI repair

The summary records explicit open/close intent synchronously on activation and prevents the competing default toggle. The controlled native details element uses that state when the permitted list returns. Pointer and native keyboard activation remain available. Current-read loading, denied/error handling and identity changes still unmount protected evidence; only the disclosure preference survives a list reread. No Scheduling command, permission, source, receipt, migration or publication policy changes.

The focused regression retains the exact saved publication link after record-type selection and refresh, checks keyboard close/open and opens the saved publication. The original eighteen journeys remain unchanged. Page guidance, guide, component state/consumer contract and pending alignment record are maintained together. No accepted policy-editor mockup or review fingerprint is invented.

Candidate build and all twenty retained Scheduling cases pass together (10.1 minutes): the original eighteen journeys and both new desktop/mobile ordering regressions, with unchanged assertions and deadlines. Lint and studio integrity pass. The assistant inspected [desktop](desktop-open.png) and [phone](mobile-open.png) captures: the disclosure remains open with the selected record type and a visible keyboard focus ring. The desktop capture includes the exact publication link; the phone link is below the captured viewport and its visibility/opening are separately asserted by the executable journey. These are bounded observations, not approved-mockup, device or owner acceptance. Final-head CI remains required and is recorded separately on PR #351.
