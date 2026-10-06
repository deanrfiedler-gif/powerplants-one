# Compatible offline application update evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 27 September 2026. Status: local synthetic PT-28 application/schema component passed; complete PT-28 and owner acceptance remain open. [Decision](../../../decisions/repository-consolidation.md#next-bounded-acceptance-increment--27-september-2026), [written procedure](../../prototype-acceptance.md#pt-28--schema-policy-and-application-update), [P12 handover](../../../delivery/p12-handover.md).

## Releases and environment

The old clean application is `80b2f418b90a69d267ac2e65682a5b560a8b4356`, compiled build `L_m47dGe9yw5BVXtZuFM8`, with schema 0049. The candidate clean checkout is `2faa3bebab399a1fa9975fe4d604d07edc1c7fa1`, using compiled build `prLqj_WN7yBXfyQzCjMz2` and the existing additive migration 0050. Its runtime is unchanged from the tested return-visit branch; this increment adds a proof script and documentation, not application functionality. The source, database and public trees, dependency lock hash, offline worker and module hashes are recorded independently in [prepared](prepared.json), [updated](verified.json) and [rollback](rollback.json) evidence. Identical dependency locks do not imply identical application builds.

Preparation used harness `81ca7a7`; the final update and rollback used harness `2faa3be`. The [manifest](manifest.json) pins the harness and all 15 retained artifacts. Both application checkouts were clean when executed. Node 24.21.0, PostgreSQL 16.15, Playwright 1.63.0 and Chrome 154.0.8037.58 ran on Windows. The persistent browser used a 390×844 CSS viewport and UTC; this is desktop Chromium at phone width, not a physical or touch-device result. Database `ppo_synthetic_test` was isolated on loopback port 55462; both compiled applications used the same loopback origin on port 3000.

## Observed result

The old application prepares a fictional appointment/pack through existing permission-checked HTTP commands, then captures the actual provisional start, observation and original PNG chain through its offline UI. Six operations are accepted by the old server while their responses are deliberately lost before local receipt commit. A further observation is captured through the old UI without submission. One explicitly unsupported schema-2 fixture is added using the existing hash/owner-checked store writer; the normal UI does not emit this fixture. All eight originals and local PNG bytes remain exact.

After closing the application and browser, a private pre-update database archive and exact copies of five document files and 234 profile files were retained outside Git. [Archive hashes](archive.json) record that limited checkpoint; it was not restored and does not repeat PT-22's full isolated-recovery procedure. The [existing recovery runbook](../../../delivery/p12-recovery-runbook.md) retains its separate contract.

Only migration 0050 was applied, retaining the preceding 48 migration records/checksums through version 0049. No database reset, restore or reseed occurred between preparation, update and rollback. The same PostgreSQL system identifier is checked privately. Both worker transitions exercise ordinary installation and waiting: an open field page continues to read its original cached module; leaving the final controlled page allows normal activation before closing/reopening the browser. No skipWaiting, cache deletion, registration removal, IndexedDB clearing or original rewriting is used.

The new application recovered all **six exact earlier receipts**, accepted the **one previously unsent supported original exactly once**, and retained the **unsupported original** as ReviewRequired / PayloadVersionUnsupported. A repeated explicit send left seven server acceptances, one attendance and three captured entries; no report, completion draft or job closure was fabricated. The original PNG and all three issued pack outputs (HTML/PDF/manifest) retained their exact hashes. Original IDs, payload hashes, dependencies and receipts were not regenerated.

The old compiled application was then restarted against the upgraded schema 0050. Its ordinary worker update/activation returned the old shell. Repeated original recovery retained the same seven acceptances, exact receipts, attendance, field-entry hash, eight local originals, original PNG and pack files. It created no additional accepted operation. This is a rollback check for the exercised old commands only; no schema downgrade or database restore was performed. It does not prove that old software understands newly created Timer/FieldReadiness commands or any external Finance outcome.

[Prepare](prepare.txt), [update](verify.txt) and [rollback](rollback.txt) passed. The retained old/new/rollback screenshots were inspected for the seven saved outcomes and unsupported original; they show actual different status labels in the old and new shells. No independent visual, physical-device, assistive-technology or owner review is granted by these captures. Raw original payloads, browser profiles, cookies, recovery capabilities, environment files, archives and server logs remain private.

Proof lint and TypeScript checks passed. Final foundation, prototype and naming assurance passed, preserving all 78 parent dispositions. Design-register integrity passed with 320 entries, 166 routes and 29 components; its 320 entry and 29 component reviews remain pending. Full application/database suites were not repeated locally for this proof-only increment; their exact source results remain on the parent pull requests. No aggregate local application-check pass is implied.

## Earlier findings and corrections

- The initial baseline build rejected a shared dependency junction outside its compilation root. A fresh clean baseline with its own locked dependencies built successfully through the normal build command. No application source or compiler choice was changed to bypass that check.
- The first update reached worker activation but returned 503 ExactDocumentUnavailable for pack bytes. The configured store was inside the candidate checkout; its existing safety guard correctly refused it. Exact files were copied and compared at a private location outside both checkouts. The harness now refuses an inside-checkout store before launching either release. The [original failure](earlier-storage-refusal.txt) remains retained.
- The fixture was returned to its old shell through normal worker update and client closure while retaining the same database, profile, originals and files; [recovery log](fixture-shell-recovery.txt). Immediate Chromium closure/reopening could resume the old client before activation settled. The final harness leaves the controlled field page, waits for normal activation, then closes/reopens the browser and checks the actual served module hash. No force-activation or weakened original assertions were added. Final update and rollback both passed after this correction.

## Repeating the bounded rehearsal

Use fresh clean baseline/candidate checkouts, matching locked dependencies and two completed builds. Keep the private document directory outside **both** checkouts, and use a dedicated profile/evidence directory and guarded disposable database. Prepare the old schema/seed once. The proof does not reset databases, run migrations, change policies or manage backups itself.

From the candidate checkout with its private local test configuration loaded:

```text
node --env-file=.env.local --import tsx scripts/offline-update-proof.ts prepare <old-checkout> <private-proof-directory>
# With the old application/browser stopped, retain a private checkpoint and
# follow the existing recovery instructions. Apply only the candidate migration:
node --env-file=.env.local --import tsx scripts/database.ts migrate
node --env-file=.env.local --import tsx scripts/offline-update-proof.ts verify <candidate-checkout> <same-private-proof-directory>
node --env-file=.env.local --import tsx scripts/offline-update-proof.ts rollback <old-checkout> <same-private-proof-directory>
```

Each phase launches and stops its own compiled application and persistent browser and refuses an occupied port. Keep the candidate source and saved originals stable between phases. Inspect release/store/identity failures before retrying; do not clear originals to make a run pass. Publish only the small review directory and checked hashes, never its private sibling.

## Remaining acceptance boundary

PT-28 still requires controlled scheduling-policy publication and affected future-booking review tasks, without silent reassignment/reissue or changes to historical evidence. Source inspection found immutable seed policies and pinned booking versions, but no publication command. That needs its own bounded authority, exact-version review, impact preview, conflict/retry and permission proof; direct SQL fixture edits are not publication evidence. No operational rule values, publisher grants or migration number are selected here.

Template publication, new-command rollback compatibility, external-outcome preservation and complete PT-28 are not established by this rehearsal. PT-30 prerequisites, PT-27 candidate misses and owner/device acceptance remain separately open. Nothing was deployed to the hosted demo or any production system.
