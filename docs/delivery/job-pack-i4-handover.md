# Job Pack — source changes and saved preparation printing

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Scope: SV-05 / SC-06; SVC-03, SVC-06, OUT-09, API-C08–C11. Build basis: `ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc`. Review: implementation for PR review; owner acceptance and deployment remain open.

## Result

I4 continues the [authorised integration plan](job-pack-integration-build-plan.md). The revision timeline and current-version card were delivered in I2 and are reused. A source-change notice now exposes the server's advisory version drift, an issued pack's review flag or a stale render result. Review changed sources opens Preparation and keeps unsaved entries. Refresh saved sources opens the reason dialog, including when the nine notes are unchanged. Saving creates the existing immutable successor through `packs/:id/amend`.

Print preview opens a choice over the saved revision. With unsaved entries, Print saved draft retains them; Save and print first records the reason and saves a successor. A successful flat `OperationReceipt` is required before offering a print link, and the subsequent read must contain that saved revision. A later coordinator save cannot move the print link to a newer revision. Refusal retains the entries; a lost response replays the original request bytes. An unissued successor can be previewed while the prior exact issue remains separately available.

The local draft inspected at restart incorrectly expected `{ receipt: ... }` from the HTTP route. `commandRoute` returns the receipt directly. This is corrected and covered by an unmocked step in the existing P06 journey, in addition to deterministic presentation cases.

No server command, migration, snapshot, digest, template, OUT-09 renderer or issue/acknowledgement authority changes. The accepted r03 notice/dialog treatment is reused. The source notice occupies the active view's centre column, with long values wrapping on phones. The native dialog retains keyboard focus trapping and return.

## Verification ledger

- Starting-code baseline: development register, lint, typecheck and pack-view unit tests passed. The full unit run had pre-existing failures involving Windows private-path/launcher assumptions; it is not reported as a pass.
- An initial full pack database attempt on unchanged main used a shortened Windows temporary path and failed fixture storage/setup. The run was stopped after reproduction. The canonical path is used for subsequent verification; no store guard is relaxed.
- A separate PostgreSQL instance holds only this task's `ppo_synthetic` and `ppo_synthetic_test`. The first fixture seeds exceeded the normal 10-second query timeout. A one-off setup command uses 60 seconds; the application timeout stays unchanged.
- Changed-file lint, typecheck, production build, studio register (273 entries, 119 routes, zero errors), foundation, naming and prototype checks passed.
- Compiled I4 and existing r03 conformance: **17 passed, five deliberate duplicate mobile-project skips**. Retained [captures and inspection](../testing/evidence/job-pack-i4/README.md) identify the actual source and limits.
- Real P06 browser suite: **five passed, one desktop long-output timeout**. Both desktop and phone main journeys include save-and-print and passed. An isolated retry without resetting encountered the booking left by the timeout, so it is not a clean regression result; clean-fixture rerun remains open.
- HTTP negative access case passed. The full traversal requires `/tmp/ppo-p06-restart.json` from the database pipeline, absent locally; this second case is not a pass.
- Focused unchanged-main database verification with the canonical store path still failed four cases on the normal 10-second statement timeout. No application timeout or store guard was weakened.
- Auth-dependent browser attempts against the failed initial seed are setup failures, not application proof.
- Desktop/phone owner review, physical devices, production readiness and deployment: **not claimed**.

## Remaining Job Pack work

Continue I6 (pure byte-equivalent formatter and scoped structured section view), I7 (D7–D10 presentation/read-model refinements), then I5 (entry links, final print/conformance proof, cleanup and integration record). The [programme ledger](service-operations-programme.md) retains SV-01–SV-08 separately.
