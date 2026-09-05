# P07 — Technician online workflow and capture

**Edition:** r01 · **Date:** 5 September 2026 · **Owner:** Dean Fiedler · **Scope:** personal private synthetic prototype. [Issue #32](https://github.com/deanrfiedler-gif/powerplants-one/issues/32), [PR #33](https://github.com/deanrfiedler-gif/powerplants-one/pull/33), branch `feature/p07-technician-online`. Verification is in progress. Final publication evidence must be read from the externally maintained issue record; this file cannot attest its own final SHA or merge.

## Outcome and exclusions

SC-09 My Jobs and SC-10 Field Job provide current assigned visits, exact authorised task/asset context, applicable issued pack and complete crew acknowledgement/readiness, individual actual start, six typed field forms, private durable synthetic PNGs, immutable successor corrections and persisted completion drafts. [ADR-0012](../decisions/ADR-0012-p07-online-field-evidence.md), the [API-C12–14 amendment](../contracts/service-api.md#p07-implementation-amendment) and [DAT-08 physical amendment](../contracts/service-data-dictionary.md#p07-physical-implementation-amendment) record concrete fields, policies and authority.

Every field screen displays **Synthetic prototype — not for operational use** and **Online workflow preview — offline/report/Finance work incomplete**. Local form state and original-operation retry exist only in the open page. No IndexedDB, service worker, durable offline queue or API-C15 synchronisation is implemented. Completion is a draft supporting command; API-C16/TR-11 submission, report/reviewer/approved-entry/customer-response workflows remain P09. Finance remains P10. There is no hosting, production migration, source integration, stock posting, payroll, payment/billing approval, customer message or fabricated return booking.

Each technician starts only their own attendance. The first sets appointment InProgress and the authoritative actual-start instant; another crew member must use current versions and repeat the full guard. Booking duration and acknowledgement create no labour. Current P06 authority, complete exact issue/hash acknowledgements, scope, assignment/schedule, non-waivable controls, competency and exact original file retrieval are checked inside the shared transaction with resource locks. Snapshot hashes retain the actual actor, controls, exact competency references and received time. Current derived component readiness is never treated as a transferable credential.

After work starts, ordinary future-booking move/reassignment/cancel stays refused. Scope successor or pack withdrawal preserves original evidence and holds further work. Factual capture may record what happened against original attendance, marked ReviewRequired; it grants no renewed work authority. A successor Draft grants no extra work. Customer manually recorded date agreement remains separate from personal pack acknowledgement.

Accepted field entries have Draft review status. Their Captured receipts prove server persistence only. All accepted original payloads and authority remain immutable. Reasoned same-type successors use expected source version and explicit lineage. Actor-wide current-time exclusion allows adjacent exact intervals and refuses overlaps across appointments. A correction atomically changes only the current projection. Materials preserve positive quantity/direction and traceability without approving or posting stock. Uncertain identity and unsuccessful fixes remain history.

Completion drafts retain exact entry identities/versions, own time/material declarations, all task outcomes, actual work, limits, required attachment states, blockers and owned remaining work. Complete cannot conceal unavailable required bytes or unresolved mandatory evidence. Partial/UnableToProceed retain service-owner follow-up using existing Activity/ActivityLink and an explicitly unknown due date. Saving any outcome does not complete attendance, the work order or ticket, issue a report or create a financial disposition.

## Verified P06 dependency

Connected user `deanrfiedler-gif` had current admin/push authority; repository was private with default main. P06 issue #30 was closed completed and PR #31 merged. The [P06 handover](p06-handover.md), [publication record](https://github.com/deanrfiedler-gif/powerplants-one/issues/30#issuecomment-5552360820), actual main commit/tree and corresponding successful main workflows were read before implementation.

| Baseline evidence | Verified identity |
|---|---|
| P06 final branch head | `bec7b33baa834ead74c3b3fc6725ea0594eda54e` |
| P06 merged main | `bab399a6e4468a3e6493594f394691cdfec49c29` |
| P06 final/merged tree | `8315dfadeb0127138fc360897a3d59315014b4c1` |
| Merged-main Application / Documentation | `33973811056` / `33973811022`, success |
| Preserved baseline cases | 7 unit + 96 PostgreSQL + 10 HTTP + 34 browser = 147 |

No newer main commits, P07 implementation issue/branch/PR or unrelated local work existed at the initial check. Scratch was empty. No old database, process or downloaded artifact was assumed. Because authenticated Git transport was unavailable, all 427 baseline blobs were retrieved and verified against their Git blob hashes; the reconstructed baseline tree matched exactly. Local Git commits and GitHub commits can differ in metadata; every published Git tree is compared for exact equality before a non-force branch update. Main is never reset to this baseline.

All original P01–P06 migration and seed bytes, four issued blueprint sources, 78 parent identities and existing evidence directories remain unchanged, including P06's original seven PDFs and 43 inspected pages. Runtime tests generate new fictional packs; no missing old issue is recreated from current sources.

## Runtime, setup and recovery

Node **24.20.0**, npm **11.19.0**, PostgreSQL **16.15**, Next **16.3.4**, React **19.2.8**, TypeScript **6.0.3**, pg **8.23.0**, Playwright **1.63.0** and the pinned P06 Chromium renderer are retained with the original lockfile. No dependency or licence change is required. The local scratch runtime is Node 24.19.0/npm 11.9.0 and has no PostgreSQL or installed application dependencies. Dependency installation there was blocked by automatic network approval review; no bypass or alternate unpinned runtime was used. Python documentation checks execute locally. Actual pinned application, real database, HTTP and browser proof executes in the existing authorised Ubuntu 24.04 disposable GitHub workflow.

```sh
npm ci
npx playwright install --with-deps chromium
# Copy .env.example to ignored .env.local and configure only a disposable loopback PostgreSQL database.
npm run db:migrate
npm run db:seed
npm run db:seed
npm run db:health
npm run check
npm run dev
```

Open `http://127.0.0.1:3000`. The existing launcher rejects production/shared/remote modes. Set `PPO_DOCUMENT_DIRECTORY` to a private absolute directory outside Git, or use the documented home-directory default. P06's write-once adapter uses 0700 directories, 0600 files, exclusive temporary files, fsync, atomic publication and directory sync. It rejects symlinks, traversal and wrong byte/hash/version. P07 writes synthetic field bytes through that same replaceable adapter. It is not a SharePoint implementation or a verified operational backup service.

Migration **0007** is additive to 1–6. It adds personal attendances, typed immutable entries/lineage, attachment states/events, current-time projection, completion roots/revisions/references and owned follow-up links. It extends narrow capability/identity/event enums and replaces only affected appointment guard functions to support real InProgress attendance while preserving future-booking refusal. Seed receipt 7 derives current P07/Activity grants for the two fictional P06 crew. Repeated migration/seed preserves receipts and revoked grants. Reset remains doubly guarded and affects only the explicitly named disposable synthetic database; stored original files are not deleted.

Attachment policy is deliberately bounded: PNG only, 8-bit RGB/RGBA non-interlaced, at most 4 MiB, 4096 pixels per side and 12 million pixels. Signature/chunk CRC/order/size and bounded decompressed scanlines are inspected. Text/EXIF, animation and unsupported media are rejected. General phone JPEG/HEIC support is not claimed. Initiate commits Pending with stable original operation/item/hash; byte transfer writes and verifies before Uploaded; finalise retrieves and validates before Available. Unusable/missing exact bytes are owned Quarantined exceptions. Metadata acceptance alone never means Available.

If storage succeeds but database/audit/receipt/outbox commit fails, retry the original transfer and payload. The adapter returns the original immutable bytes for the same item/version/hash; it neither duplicates accepted evidence nor changes bytes. A page reload may reselect the original named file with the same size/hash to resume a Pending upload. Original HTTP-response loss uses the retained operation/payload in that open page. Leaving with an unsaved form loses it; the interface says so. No deletion/cleanup behaviour is introduced.

Back up and restore PostgreSQL and the private document directory together. Verify original operation receipts, issue/attachment identities, manifests, counts and hashes on recovery. Missing old versions remain exceptions; never regenerate an issued file or silently substitute a photo. CI proves process restart and retrieval from the same durable directory; operational disaster restore, device management and a restore SLA remain unverified.

## Demonstration and scope inventory

Use Coordinator with the established P04/P05/P06 screens to authorise scope, confirm a two-person visit, prepare/check/issue a nine-section pack. Switch separately to Riley (`assigned-technician`, fictional user 10/resource 9) and Morgan (`second-technician`, fictional user 11/resource 2). Each acknowledges the exact issue. Open `/my-jobs`, then the assigned appointment. Starting after only Riley's response must refuse. After both responses and all current controls pass, Riley records their own actual start with context.

Capture Time, Material, Observation, Reading, Checklist and Photo through their explicit forms. Choose the original task/asset where required. Upload a fictional supported PNG through Register, Upload, Verify; Available and actual retrieval verification are displayed separately. History shows original evidence, author and capture/receipt times; correction makes a new version with reason. Completion references current evidence exactly and saves Complete/Partial/UnableToProceed preparation with declarations and remaining ownership.

Synthetic sources remain the P04/P05 scoped customer/site/assets and P06 immutable technical/template fixtures. `tests/helpers/field.ts` creates a minimal navy/green 96×64 two-colour PNG with exact CRC/compression for media tests; it is a fictional byte fixture, not photographic evidence of real work. The two-task component uses existing P04 authority/readiness and P05 scheduling commands for separate inspection and identification tasks/assets; uncertain identity is retained. Synthetic item names SYN-PART-LOT/SYN-PART-SERIAL are explicit traceability cases, not an inventory catalogue.

Capabilities `field.read.own`, `field.start.own`, `field.capture.own`, `field.correct.own`, `field.attachment.own`, `field.completion.own` always combine with current company/site/work-order/appointment/resource-assignment/file scope. Current crew can view permitted visit evidence; correction/upload/finalisation remain actor-owned. Guessed attachment IDs, direct URLs, filenames, metadata and old receipts never bypass scope. DTOs exclude Finance/internal customer/source content. No capability gives 403; missing/out-of-scope with a capability share 404. Errors use controlled application responses, not raw SQL or unrestricted payloads.

## Verification and failed-run record

[Application run 33996669449](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33996669449) passed on source `2e121f43d30fd75820dfd10afac4b02fa58fbe95`, tree `df932023a2a837745496a9b6b8768fd79cde6ff4`; executed PR checkout `51761a6827b13222c3f2075a216c0214b8f530a3` had the same tree. It passed 9 unit + 136 PostgreSQL + 12 HTTP + 38 browser = **195 component cases**, plus fresh migration/reset/restart and build checks. Documentation run 33996669567 passed on that source. Subsequent review refinements and the two-task fixture require final source verification; publication results will be recorded before merge. The 147 preserved P06 cases are a baseline, not a P07 acceptance target.

```sh
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
npm run check
npm run test:db
# With the documented loopback server running:
npm run test:http
npm run test:browser
# Explicitly disposable database only:
PPO_ALLOW_RESET=dispose-synthetic PPO_RESET_DATABASE=ppo_synthetic_test npm run db:reset
```

The workflow performs fresh migration/seed/health, reset refusal without both correct opt-ins, all real PostgreSQL cases including P06 upgrade/repeat seed, then deterministic reset. `scripts/persistence-proof.ts write` persists P01–P07 evidence, the actual PostgreSQL container restarts, and `verify` compares exact P07 start authority, original/corrected quantity/lineage, verified original PNG, completion draft, owned work and receipt. Real HTTP reads verify the same persisted evidence; Playwright runs desktop 1440×1000 and phone 390×844 against actual routes.

| Failed run / source | Observed failure and disposition |
|---|---|
| Application 33995707771 / `49acffa2905530be95efc69b0060bca88197b1e9` | TypeScript rejected union payload access in new capture handling. Explicit discriminant narrowing corrected it. Stopped before DB/browser; no runtime pass claimed. The image lint warning was corrected using the existing Next image component without optimisation proxying. |
| Application 33996124699 / `602a436724ca27efc25e5cfa32a8ec8c190b3392` | Review-copy `.ts` files were incorrectly included by normal TypeScript checking, plus three test callback annotations were missing. Review copies now use `.txt`; executed source and check scope were not weakened. Explicit callback types added. No DB/browser pass claimed. |

Original visual review of the successful run found a saved completion form incorrectly showing Unsaved changes after loading its saved values. The P07 form now distinguishes pristine saved values from later edits, with an explicit browser assertion. Full-page screenshots now scroll to the top before capture so sticky navigation does not overlay labels in the long output. These run-33996669449 originals are intermediate evidence and are not the final visual acceptance set.

The workflow's formatter produces separate review copies using the already pinned Prettier; it does not modify the executed checkout. Original source/tree identity is retained for every run. Failed artifacts are dispositioned, never represented as successful visual proof. Implementation self-review is not independent review or owner acceptance.

## Acceptance boundaries and next task

PT-06's integrated online procedure requires a checked nine-section pack, queued renderer pause/no issue, durable single issue, first-recipient start refusal and successful start only after the complete required acknowledgement set and other controls. The dedicated database and UI scenarios exercise that real boundary. Full status can change only with complete executed evidence. PT-13 initially exercises 90-minute time, 2 EA captured material and reasoned correction with immutable originals; submission/approval/report/handoff checks remain P09. PT-14 initially exercises two task/asset outcomes and owned partial work; completed attendance/reviewer acceptance/return visit/whole-closure procedure remains P09. No fake approvals are introduced. Other PT/AT and all parent completion claims remain unchanged.

P08 is prepared in the detailed [Offline queue and exception recovery starter](p08-starter-prompt.md), requiring live verification of this P07 publication first. It covers bounded durable IndexedDB/service-worker context, original operation/dependency replay, attachment recovery, stale/revoked authority and schema/quota/restart exceptions. P08 is not implemented here. Report/customer responses, Finance, full PP-01 integration/acceptance, operational security/device/restore evidence, hosting, live systems and customer communications remain outside this increment.

## Publication record

Final head/check/review/main-state and normal expected-head merge evidence will be maintained externally on [issue #32](https://github.com/deanrfiedler-gif/powerplants-one/issues/32). Recheck actual PR head, checks/reviews/threads, current main, permissions and applicable rules before merge; accurately record inaccessible rule reads. Do not bypass/change controls. Verify merged main SHA/tree, issue/PR states and both actual main workflows after merge. The external record, not a self-referential SHA embedded here, establishes final publication.
