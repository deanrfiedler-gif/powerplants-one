# P08 — Offline queue and exception recovery handover

**Owner:** Dean Fiedler · **Scope:** personal private synthetic prototype · **Status:** implemented; exact-head verification and merged-main publication are governed by the external record below.

[Issue #34](https://github.com/deanrfiedler-gif/powerplants-one/issues/34) · [PR #35](https://github.com/deanrfiedler-gif/powerplants-one/pull/35) · [External publication record](https://github.com/deanrfiedler-gif/powerplants-one/issues/34#issuecomment-5556131594) · [ADR-0013](../decisions/ADR-0013-p08-offline-recovery.md) · [P09 starter](p09-starter-prompt.md).

## Authority and verified starting dependency

The user authorised only P08 implementation, one issue/branch/PR, additive local PostgreSQL migration, synthetic fixtures, necessary checks, normal expected-head merge after applicable checks/review, merged-main verification and P09 preparation. Hosting, production migration, real ERP/SharePoint, customer communications, paid changes, access/rules changes and P09–P12 implementation are excluded.

Connected GitHub user `deanrfiedler-gif` had actual admin/push permission to the private repository. Main started at `4c4e4c7dbea85ffff9f5126c1023b5129ca9b343`, tree `0ecfd736170c4c94359459e0f38eb321b59e8016`. P07 issue #32 was completed and PR #33 normally merged from expected head `b3405a973e3bc1800fc785548416d2b3f2e5ecb1`. Head checks `101395893877` / `101395894013` and exact merged-main application/documentation runs `34000880797` / `34000880682` succeeded. The authoritative [external P07 publication](https://github.com/deanrfiedler-gif/powerplants-one/issues/32#issuecomment-5555401391) was read; no incomplete P07 publication dependency was found. No existing P08 issue/branch/PR was found before creating #34, `feature/p08-offline-recovery` and #35. A separate clean local checkout preserved the unrelated original scratch checkout. Final live identities belong in the external publication record, never a purported self-SHA in this file.

## Delivered behaviour and boundaries

The existing online `/my-jobs` workflow remains. Its offline entry opens `/offline/index.html`, a dedicated keyboard/phone field workspace with navy/green synthetic styling. Download up to two currently permitted assigned jobs with exact issued HTML, task/asset/history context and an explicit last-verified time. The service worker caches only public shell assets under `/offline/`; private context and evidence are owner-bound IndexedDB records. The browser network indicator is a hint. Cached readiness, issue bytes and old receipts confer no current authority.

The technician can save personal pack acknowledgement and provisional start intents, six strictly typed evidence kinds, exact bounded PNGs, linked corrections and completion drafts. Server acceptance uses the original P07 commands, current permissions, full current crew acknowledgement and P04/P05/P06 non-waivable guards. No one starts or acknowledges for another. Customer date agreement stays separate. Started visits retain ordinary future move/cancel refusal. Scope successor Draft and tool preparation confer no extra work authority.

Completion remains a technician draft with exact entry versions, personal declarations, required available-photo dependencies, task outcomes and owned remaining work. Partial or unsuccessful work remains explicit; return visits still need the existing separately authorised P04/P05 proposal/booking commands. There is no report submission/review, approved entry set, customer response, Finance processing, automatic breaks/payroll/stock/tax/rate/warranty inference or premature attendance/order/ticket closure. PP-01 remains incomplete.

## Exact persistence, operation and dependency decisions

See the [physical dictionary](../contracts/service-data-dictionary.md#p08-physical-implementation-amendment) and [API-C15 contract](../contracts/service-api.md#p08-implementation-amendment) for exact stores, fields, limits, errors and permissions.

IndexedDB `PPO-offline-field` version 2 has `meta`, `contexts`, `operations`, `evidence`, `bytes`, `status` and `leases`. Version 1 has the same first six stores; version 2 adds the recoverable sender lease without rewriting pending envelopes or Blobs. Every save awaits strict transaction completion. Unsaved changes remain page memory; a local metadata/Blob commit and a later receipt commit are separate facts. Quota, abort, unavailable IndexedDB, blocked upgrades, incompatible future database/payload versions and detected partial eviction have explicit failures/recovery instructions. No memory fallback claims persistence. Complete browser/user deletion cannot be reversed by this prototype. A persistent-storage request is not a durability guarantee.

One immutable original envelope records schema/operation ID, actor/workspace/job, exact assignment/schedule/scope/issue versions and hashes, target, dependency IDs, optional predecessor operation and unmodified payload. The canonical SHA-256 covers that entire original. The existing P07 normalised-domain hash remains separately authoritative for its original receipt; it is not overwritten. A declared provisional-start reference resolves to the accepted attendance inside processing while the original envelope remains exact. Corrections/new meaning require a new operation and explicit predecessor/target lineage.

One explicit send claims a durable 30-second per-owner lease and sends at most 20 originals/6 MiB. There is no background loop. A lost sender or expired lease is recoverable; server locking/receipts are the final effect-deduplication boundary. Stable topological ordering handles parent operations before children and preserves independent sibling outcomes. A failed upload cannot undo an accepted start or sibling capture, and unavailable required photo bytes prevent a draft claiming complete evidence. Network hints and bounded backoff timestamps do not prove connectivity or acceptance.

The request-local AsyncLocalStorage hook runs inside the existing operation/workspace transaction locks after current authorisation. Original envelope acceptance, domain facts, audit, receipt and outbox commit together. Lost accepted responses recover the same receipt and no duplicate capture, attendance, correction, file, Activity or draft. Read recovery always reapplies current permissions. Raw SQL constraints, typed domain validation, actor-wide time overlap exclusion, immutable originals and P06 private write-once storage remain active.

## Permission and exception recovery

Download creates an immutable random recovery grant bound to the original active actor, one exact appointment/authority snapshot and the recorded service owner. It expires after seven days under the explicit synthetic policy; the browser context/owner verification horizon is 24 hours. These are prototype parameters, not operational retention promises.

When normal field access is revoked, the original active actor with a valid prior token can explicitly preserve an original evidence envelope and exact PNG into a restricted case and owned TechnicalFollowUp Activity. Start/acknowledgement intents cannot use this route. It grants no normal job, file or historical operation-receipt access. An already accepted normal original cannot be copied into recovery to create a duplicate. Inactive identity, expired session/token, missing capability or mismatched authority leaves evidence locally owned for supervised recovery/export.

The original actor can read only case ID, original operation/hash, restricted receipt/time, current disposition and `normal_acceptance=false`. The recorded service owner needs current scoped `service.work_order.edit`, `activity.edit` and `activity.read` to inspect the original envelope/bytes or append RetainedForReview/ClarificationRequired. No reassignment, acceptance promotion or closure is implied. Factual P07 capture whose original attendance still permits normal access but whose current pack/scope needs review is retained with its original receipt, explicit ReviewRequired authority and owned follow-up.

Identity selection/sign-out durably locks offline views before session mutation and broadcasts to other tabs. Switching requires online verification and only exposes that actor's cached context, filenames, images, originals and receipts. Unsent evidence is retained; it is not invisibly deleted. Expired cached context cannot be used for new intents; original-owner export and narrowly authorised recovery remain explicit. Browser-local retention is not an operational encryption, remote-wipe or lost-device security claim.

Normal acceptance and restricted recovery are mutually exclusive for one original under the same operation/workspace transaction locks. Once preserved into restricted recovery, replay returns RecoveryDispositionRequired without a normal receipt; changed reuse conflicts. A competing normal acceptance either wins once and blocks recovery as AlreadyAccepted, or recovery wins once and blocks normal acceptance. Neither path creates a second capture or follow-up. Direct online P07 commands also refuse the held original after current authorisation; the schema-7 upgrade path remains compatible. The browser does not offer recovery on an actively Sending row. The online service-owner disposition form reuses an unchanged operation while its page remains open; changed disposition/note gets a new operation. It is not an offline disposition queue or a browser-restart persistence claim.

## Attachment consistency

The P07 PNG policy remains exact: 4 MiB, 4096 pixels per side, 12 million pixels; non-interlaced 8-bit RGB/RGBA with signature/chunk/CRC/inflate/scanline validation and unsupported/animated/metadata formats refused. Local initiation, byte transfer, finalisation and Photo/Checklist references retain distinct operations and dependencies. Blobs and their original transfer metadata commit atomically locally. Metadata alone is never usable server storage.

The existing private adapter retains immutable provider/item/version/hash/size. Storage success followed by database failure reuses the original storage operation/hash; retries cannot substitute bytes. Wrong hash, interrupted/missing bytes and unavailable finalisation remain explicit. There is no orphan deletion, garbage collector, issue regeneration or deletion of referenced evidence. Recovery storage uses the original upload operation as its write-once item identity, verifies retrieval and commits its separate case/receipt only afterward.

## Runtime setup and recovery

Exact unchanged pins: Node **24.20.0**, npm **11.19.0**, PostgreSQL **16.15**, Next **16.3.4**, React **19.2.8**, pg **8.23.0**, Playwright **1.63.0**, TypeScript **6.0.3**. Other exact direct pins and licences remain in the [dependency inventory](../testing/p01-dependencies.json) and lockfile; no P08 package was added. TypeScript already present generates the static modules and a content-hashed service-worker cache identity. Generated output is ignored, deterministic and rebuilt before local startup/build. Updates wait for existing field clients to close; neither activation nor install deletes IndexedDB originals.

Use the existing loopback-only launcher and private document-storage directory described in [P07 setup](p07-handover.md#runtime-setup-and-recovery). Never publish this synthetic identity adapter. Use `.env.example` placeholders to create ignored `.env.local`, with an owned loopback PostgreSQL instance and a private durable byte directory outside Git.

```sh
npm ci
npx playwright install --with-deps chromium
npm run db:migrate
npm run db:seed
npm run db:health
npm run dev
```

Open `http://127.0.0.1:3000`; select a synthetic identity. Prepare/check/issue a pack, record customer date agreement separately and have each crew member acknowledge their exact issue. Download assigned context before disconnecting. Offline shell route is `http://127.0.0.1:3000/offline/index.html`. Use explicit Save and Send next batch / retry originals. Preserve uncertain originals; a new operation is not an appropriate substitute for recovering an unknown prior outcome.

Migration `0008-offline-recovery.sql` is additive over P07. Migrations/fixtures 0001–0007 and all issued reference bytes are unchanged. Repeat migration/seed remains non-destructive; P08 adds no grant-restoring seed. Preserve PostgreSQL and the private byte directory together. Application rollback does not delete accepted originals or restore old authority; use a compatible application against the expanded schema. Do not roll back by destructive SQL.

Use a separate disposable database named `ppo_synthetic_test` for destructive test reset. The configured database name must match both guards:

```sh
PPO_ALLOW_RESET=dispose-synthetic PPO_RESET_DATABASE=ppo_synthetic_test npm run db:reset
```

A missing/wrong guard refuses. Never use this command for operational data. For local storage trouble, keep unsaved form content open, resolve storage and retry the same save; after a committed save, keep original IDs and recover receipts. For a blocked upgrade close other PPO field tabs. For expired ownership reconnect as the original actor. For unsupported originals export for supervised recovery; do not edit their hashes or silently delete the browser database. Export acknowledgement proves only creation of the download, not that a backup has been retained.

## Verification and execution limits

Run the complete maintained checks with the exact environment above:

```sh
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
npm run check
npm run test:db
npm run test:http
npm run test:browser
```

`test:http` requires the actual running launcher; the browser suite starts its own launcher in CI. The authorised disposable [Application assurance workflow](../../.github/workflows/application.yml) provisions exact PostgreSQL, fresh migrations, repeat seed, guarded reset, P07 upgrade, real HTTP and Chromium. `scripts/persistence-proof.ts` retains earlier process-restart proof. `scripts/offline-restart-proof.ts write`, `accept`, `verify` run separate actual application/browser processes with PostgreSQL container restart between phases; its private browser profile is temporary and is not an uploaded artifact.

Local runtime was Node 24.19.0/npm 11.9.0 and PostgreSQL was unavailable. `npm ci` refused the engine mismatch. No pins or checks were weakened to use that environment. Application/database/browser evidence is therefore CI evidence, separately identified from local Python repository checks. The complete maintained suite contains **236 cases: 9 unit, 160 PostgreSQL, 13 HTTP and 54 Chromium (desktop/phone)**. Before the additional recovery/acceptance race case, run `34005733392` passed 234/235 (all non-browser gates and 53/54 browser cases); its one download-precondition failure is dispositioned below. The [external publication record](https://github.com/deanrfiedler-gif/powerplants-one/issues/34#issuecomment-5556131594) records the actual final-head and exact merged-main all-gate outcomes before P08 can be treated as published. Earlier runs never substitute for that final check. All three local Python checks pass: four issued sources, 78 unchanged parent IDs/dispositions, 29 decisions, 38 AT definitions and 30 PT definitions remain. No full status is promoted.

The CI job budget expands from 30 to 40 minutes to retain all earlier checks while adding real offline process-restart and browser/storage scenarios; no test is skipped or relaxed. Individual database test timeout is explicitly two minutes.

Full PT-11/PT-12/PT-24/PT-28 are not promoted by isolated component checks. PT-11's exact combined two-job/time/photo/restart/quota sequence, PT-12's single 100-entry-plus-attachment lost-response sequence, PT-24's full combined changed-scope/reassignment procedure and PT-28's later scheduling-policy publication/rollback steps must each be evaluated as written. Existing full statuses, including executed P07 PT-06, remain unchanged. Implementation self-review, independent review, owner acceptance and production readiness are separate claims.

## Failed-run dispositions and original evidence

| Run | Observed result | Exact disposition |
|---|---|---|
| 34003141922 | Lint rejected unused `_hash` bindings | Explicitly consume destructured hash variables. No runtime proof from this run. |
| 34003393047 | Review-format helper assumed a baseline commit available in a shallow checkout | Use tracked selected paths; review copies run separately after static checks with `always()`. No runtime proof from this run. |
| 34004451299 | 9 unit, 154 PostgreSQL, 13 HTTP and all three actual offline process-restart phases passed; 45/52 browser cases passed | Retained second-download/empty-week fixes; put shell-update notices in a separate status region so they cannot overwrite save evidence, and supply the required capture context in the new Time-conflict fixture. Real strict validation was retained. |
| 34004021911 | 9 unit, 154 PostgreSQL and 13 HTTP cases passed; 40/44 browser cases passed | Two second-download preconditions raced an unchanged prior notice; now wait for both committed contexts and show explicit download-in-progress. Two P05 empty-week fixtures collided with new P08 dates; move only the empty period to 2027-02-01, retaining the exact empty/error/keyboard assertions. Original failures retained. |
| 34003532547 | Static/type/unit passed; Next build could not resolve browser `.js` source imports | Use extensionless TypeScript source imports; add `.js` only in generated browser modules. No database/browser proof from this run. |
| 34005653711 | 9 unit, 159 PostgreSQL, 13 HTTP, all process-restart phases and 51/54 browser cases passed | The two Time fixtures still lacked required capture context; corrected without changing validation. The first cold download exceeded the generic five-second assertion while two real requests succeeded (2,192 ms context + 2,764 ms exact HTML). Wait for the bounded download to finish, then retain the original save confirmation, committed-context and form assertions. No performance acceptance is claimed. |
| 34005733392 | 9 unit, 159 PostgreSQL, 13 HTTP, all process-restart phases and 53/54 browser cases passed | Only the same first cold-download precondition remained. Explicitly await the disabled download control returning to its completed state (three requests, each bounded to 15 seconds), then require the actual durable-save message and one committed context. A completed request alone is never treated as a local save. |
| 34007547992 | Lint passed; type checking rejected a redundant status assertion in the new recovery/acceptance race test | Remove the redundant assertion before the discriminated-union branch. A rejected send still throws and fails; exact outcome, receipt, record and follow-up assertions remain. No runtime evidence is claimed from this run. |

The [maintained evidence record](../testing/evidence/p08/README.md) links preserved original review/failure files and per-file hash/provenance. Final successful-head and merged-main original media are identified by the external publication record after visual inspection. Pinned Prettier review copies from run 34005733392 were applied to the next source and the temporary helper/step removed. Those review copies were separate from the executed checkout and must not be confused with source or screenshots. The final UI also bounds exact-HTML download to 15 seconds and preserves the unload warning if another form remains unsaved after one form saves; unsaved form memory is never claimed durable. Failed screenshots are retained with their rejection/fix, not silently replaced. Visual evidence supplements original receipts, HTTP retrieval and PostgreSQL facts.

## Review, publication and next bounded work

Implementation self-review covered permission-before-receipt recovery, transaction and byte boundaries, immutable hashes/lineage, owner isolation, causal partial failure, migration/seed preservation and honest local/server state. No independent reviewer or owner acceptance is claimed. CONTRIBUTING permits the authorised sole-developer workflow without fabricating a second reviewer. Live reads showed main `protected=false`; branch-protection read returned 403 Resource not accessible by integration, rulesets returned 403 with the private-plan limitation, and the effective branch-rules URL was rejected by the connector allowlist. These are inaccessible reads, not claims that every rule was inspected. No control was changed. Normal GitHub merge remains the enforcement point.

Before merge: re-read current main, actual PR head, checks, review state/threads, permissions and applicable rules. Record inaccessible rule reads accurately; modify no controls. Normal merge uses the expected head. Verify exact merged main/tree, PR/issue states and actual merged-main workflows, then update the [external publication record](https://github.com/deanrfiedler-gif/powerplants-one/issues/34#issuecomment-5556131594). Do not infer merged-main success from PR runs or place a circular self-SHA claim in this handover.

[P09's maintained starter](p09-starter-prompt.md) requires verified P08 publication first. It prepares review/report/customer-response boundaries while preserving Finance as P10. P09 implementation has not begun. Hosting, live integrations, production migration and customer communications remain unauthorised.
