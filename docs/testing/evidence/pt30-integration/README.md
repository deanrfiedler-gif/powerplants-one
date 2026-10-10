# PT-30 integrated rehearsal

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 10 October 2026 (Australia/Brisbane). Review: implementation rehearsal and capture inspection; independent and owner observations pending. [Decision](../../../decisions/pt30-integration-rehearsal.md), [readiness and remaining findings](../../pt30-integration-readiness.md), [current owner walkthrough](../../../delivery/field-integrated-owner-walkthrough.md).

## Result and source

All four existing narrative phases pass on integrated application/test source `caecf7bc787eb658a545268e507e35e257adf48f`, build `qE6dn5GfAoZAp53Forj96`. The source joins PT-01 main `8869437`, PT-23 `d0be6b0` and PT-29 `ccd7637`. A read-only history recheck passes at test source `8f2039cc92e3b41d10734c0db206be1500b0b34d`, using the same unchanged application/build. There are zero test retries, skips or page errors. [verification.json](verification.json) preserves source/build, phase counts/durations, result hashes and assurance results. [Source review](integration-review.json) records scope and limitations; final CI and merge outcomes are in the linked PR records, separately from these local observations.

| Phase | Observed outcome |
|---|---|
| Initial | Customer/Site history, authorised scope, controlled booking, exact pack amendments and personal acknowledgements, attributable timer/field evidence, five original offline operations, report reservation and independently reviewed/reconciled synthetic Finance outcome. |
| Saved-point restart | App and PostgreSQL processes stopped; both owned ports closed. The same retained cluster restarted with a different postmaster start time and a new app PID. All 368 compared tables, eight stored files and the migration ledger remain exact. |
| Prepare | Retained Unknown return proposal is cancelled through its owning command; a separate visit is explicitly prepared, scheduled, checked and acknowledged without replacing original attendance or issued evidence. |
| Finish | The second technician owns the completed return attendance and fresh evidence. Prior report/response/Finance facts and all original output hashes remain unchanged. |
| History | Each technician sees the correct own versus other attendance history; original report and Finance outcomes remain exact; the original browser profile retains all five accepted offline originals. |
| Settled history recheck | Adds a no-loading/no-business-error assertion before the next-technician capture. The repeat uses saved records, not a new journey or database reset. |

The initial history image was captured while a secondary panel still showed loading. It remains in the evidence alongside the corrected view; the original API assertions passed. This was a capture-timing refinement, with no runtime or deadline change.

## Preservation and limits

[Before](before-restart-preservation.json) and [after restart](after-restart-preservation.json) record hashes/counts rather than database rows. The comparison deliberately excludes sessions and Session audit events. The actual process boundary is in [restart.json](restart.json). Latest installed migration is 77; 76 registered migrations are installed. A missing reserved number is not silently filled.

[After the return](after-return-preservation.json), the original-outcome mode permits new workflow records while requiring all earlier receipts, sync acceptances, customer responses, Finance/report records, field entries and attendances to remain unchanged. All eight prior stored files remain byte-exact, with three new files. Forty-eight tables have expected additions or workflow changes; this is not a claim that the entire database is unchanged across new work. This is saved-point restart, not backup restore, power-loss durability or an operational recovery-time measurement.

[Entry records](entry-records.json) identify the saved work order, visits, report, Finance handoff and exact outputs. Credentials, browser profiles, row snapshots, original envelopes and raw traces remain in the private task directory outside Git. Original 3 October evidence and its retained environment remain intact.

[Eight representative captures](captures.json) were inspected at their recorded bytes. The closed-own-attendance timeline combines the future synthetic booking with an actual measured minute; the narrow correction control wraps, and the non-attendee view retains generic manual-time guidance. These remain explicit owner/layout observations, not accepted design fingerprints. The offline capture shows the retained job and failed authority read, while queue recovery is proved by assertions below that viewport. The original loading capture is not labelled a completed view.

## Owner handover and remaining work

The [new human worksheet](human-session.json) starts with every H01–H11 observation pending. No participant/device availability, acceptance, business benefit or independent review is inferred from automation. The [readiness record](../../pt30-integration-readiness.md) reconciles the retained PT-13 and PT-18 evidence and later PT-27 profile measurements while preserving all remaining gaps. The authored catalogue and 78 parent IDs are unchanged. PT-30 remains a technical narrative with owner/prerequisite acceptance pending.

## Reproduction

Use the same pinned dependencies, compiled source and a fresh private `ppo_synthetic_test` with matching document directory and separate original/return browser profiles. The current retained instance uses app port 33949 and database port 55949. Run `journey.spec.ts` through `playwright.acceptance.config.ts` with `PPO_ACCEPTANCE_PHASE` set to `initial`, then perform the explicit saved-point restart, then run `prepare`, `finish` and `history`. Each run uses `--reporter=list,json`, a distinct output/result path and its exact `PPO_SOURCE_HEAD`. Supply the environment through Node's private `--env-file`, not a committed file.

Use `scripts/step6-preservation.ts before-restart <private-journey>` before stopping owned processes, then `after-restart <private-journey> before-restart exact` and finally `after-return <private-journey> before-restart originals`. The owner walkthrough retains safe start/resume instructions. Do not reset this completed session to rerun `initial`; its successful checkpoint is deliberately protected.
