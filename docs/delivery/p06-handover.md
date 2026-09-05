# P06 — Job-pack generation, issue and acknowledgement

**Edition:** r01 · **Date:** 5 September 2026 · **Owner:** Dean Fiedler · **Scope:** personal private synthetic prototype. Implementation is under [issue #30](https://github.com/deanrfiedler-gif/powerplants-one/issues/30) / [PR #31](https://github.com/deanrfiedler-gif/powerplants-one/pull/31), branch `feature/p06-job-pack-issue`. Verification/publication is recorded below; this document cannot prove its own final commit or merge.

## Outcome and boundaries

SC-06/SC-14 now support nine-section job-pack preparation, return/check, exact source/template snapshot, durable output jobs, controlled issue, individual crew acknowledgement and amendment/withdrawal. DAT-07 and minimum DAT-11 implement OUT-09, API-C08–11, TR-04–07 and EVT-04/05. [ADR-0011](../decisions/ADR-0011-p06-controlled-job-packs.md) records the renderer, durability, authority, timestamp and audience choices. The [API amendment](../contracts/service-api.md#p06-implementation-amendment) and [dictionary amendment](../contracts/service-data-dictionary.md#p06-physical-implementation-amendment) are the concrete contract.

Preparing/checking/issuing a pack does not require an existing pack acknowledgement. Confirmed appointments still reserve the full typed crew. Current scope and authorised scope remain distinct; a successor Draft grants no extra-work authority. Current P04 authorisation, competency, access, isolation and shutdown evidence remain mandatory. Tool-preparation exceptions waive none of those controls. P05 customer Confirmed contact is a manual date agreement, not a pack response.

An issue requires a checked snapshot, persisted render intent, durable verified bytes and final recheck of scope, schedule, assignments, recipients, permissions and policy. Queued/202/Running/Durable/Failed are not Issued. Each current crew assignment receives an immutable task. Only its own server-derived actor can acknowledge its exact issue/hash. Both fictional crew members must respond before the P06 dispatch component becomes ready. Opening/downloading, recording simulated sending, customer contact or a lead's response cannot substitute.

Amendment/withdrawal and confirmed P05 moves/cancellation preserve old files and response history, immediately hold dispatch and create real owned contact/review Activities. Activities use P03's explicit outcome workflow, a Site link, the service owner and an unknown due date requiring resolution; they send no message. P05's booking/contact follow-up remains separate. A replacement crew requires current assignment recipients and fresh acknowledgement. Cancelled appointments refuse actual work through the existing marker contract. P07 actual start/capture does not exist; PT-06's final start step remains its integrated dependency. There is no field labour, offline queue, completion, customer report or Finance implementation in P06.

## Verified P05 dependency

Connected user was `deanrfiedler-gif`; repository was private, default main, with admin/push permissions. P05 issue #28 was closed completed and PR #29 was merged. The [P05 handover](p05-handover.md) and its [publication record](https://github.com/deanrfiedler-gif/powerplants-one/issues/28#issuecomment-5551471867) were read and independently checked through GitHub API reads:

| Evidence | Exact identity |
|---|---|
| P05 final PR head | `0d3f814b3706d08544056afff53c01390ad3e3bc` |
| P05 final and merged tree | `0ed1b88568712a3149e1bc381ad0526f2e2f8be0` |
| P05 merged main | `0bdf0873c5145c1be466c97e0dbb4de17ed14b3b` |
| Merged-main Application / Documentation | `33965191563` / `33965191587`, both success on that exact main |

There were no later main commits, duplicate P06 issue/PR/branch or unrelated dirty changes at baseline. The existing clean P05 checkout was preserved. Work uses an isolated checkout. Because local git transport is unavailable, reviewed local Git trees are published through Git object APIs and verified equal to remote trees before a non-force branch update. Local and GitHub commit IDs differ because commit metadata differs; tree equality establishes file identity. Original source snapshots, all 78 parent IDs and existing P01–P05 migrations/seeds remain unchanged. No visibility, membership, access, branch rule or paid-service setting is changed.

## Exact runtime, setup and recovery

Node **24.20.0**, npm **11.19.0**, PostgreSQL **16.15**, Next **16.3.4**, React **19.2.8**, TypeScript **6.0.3**, pg **8.23.0**, Playwright / @playwright/test **1.63.0**, Chromium **153.0.8010.12**, Playwright build **1243**. `package-lock.json` pins transitive dependencies; all prior versions are preserved. Playwright becomes an explicit runtime dependency under Apache-2.0; official support/licence references and alternatives are in ADR-0011. Chromium includes its own third-party notices. Ubuntu 24.04 is the executed environment; renderer documentation supports Windows 11, but no Windows filesystem/ACL or desktop installation proof is claimed.

Use the existing local-only setup in [P04 commands](p04-handover.md#versions-and-exact-commands), then:

```sh
npm ci
npx playwright install --with-deps chromium
# Configure the ignored .env.local from .env.example with a disposable loopback PostgreSQL role.
npm run db:migrate
npm run db:seed
npm run db:seed
npm run db:health
npm run check
npm run dev
```

Open `http://127.0.0.1:3000`. Production/shared/remote startup is refused. Configure `PPO_DOCUMENT_DIRECTORY` as a private absolute directory outside the repository; default is `.ppo-synthetic-documents` under the local user's home. POSIX directories must be mode 0700 and files are created 0600. Symlink, traversal, byte/hash mismatch and unavailable exact versions refuse retrieval. Local filesystem durability uses exclusive temp files, fsync, atomic write-once publication and directory sync. This is a replaceable synthetic adapter, not a verified SharePoint implementation. The P01 stub adapter tests remain intact; P06 runtime uses `LocalSyntheticDocumentStore`.

Migration **0006** is additive to 0001–0005. It replaces the old unconditional appointment dispatch-hold constraint with a real issue/assignment/acknowledgement guard and preserves old appointment bytes on upgrade. New seed receipt **6** adds only fictional document sources/template/policy, current grants derived from existing authority and Morgan's distinct recipient/resource. Repeat seed respects accepted receipts and revoked grants, and never silently restores a missing historical file as latest. Existing P04 small immutable text evidence stays in PostgreSQL exactly. Reset is only for disposable synthetic test data, with the existing exact double opt-in; storage originals are not erased by database reset.

Select Coordinator, open a confirmed appointment and Prepare job pack, or use `/service/packs`. Choose exact technical/history records and fill all nine sections, then save and review the semantic HTML. Return requires a reason; check freezes the exact source. Queue issue, then use Process or recover original output, or run `npm run documents:worker` (bounded five pending jobs per invocation). The worker is not automatically installed as a daemon. Failed jobs retain a recovery owner, attempts and safe code; explicit retry reuses the original durable bundle. StaleSource is terminal for that revision: prepare/check a successor after resolving the source. No file deletion/garbage collector is enabled.

Use Riley (`assigned-technician`) and Morgan (`second-technician`) with their actual matching resources to acknowledge independently. The earlier unassigned-technician and Systems profiles do not gain pack authority. Display names are fictional. `SYN-PPO-PACK-000001-job-pack-r01.pdf` is derived from the allocated PACK reference and integer revision; UUID/provider/item/version/SHA-256 remain identity. Revision changes never replace bytes. The file contains a reserved issue timestamp and issue UUID, explicitly conditional on application release; actual `issued_at` is persisted only by finalisation and shown by the application. Reservation time is not proof of Issued.

Back up PostgreSQL and the private document directory together. Restore both and verify saved manifests, original operation receipts, byte counts and SHA-256 before issuing anything new. No arbitrary retention period, legal hold, operational restore SLA or hosted backup is invented. CI proves process restart and retrieval from the same durable directory; disaster/remote restore remains a later integrated obligation. Missing original bytes remain an owned exception. Do not regenerate an old issue merely to recover a lost file.

## Source and permission inventory

Template `c1000000-0000-4000-8000-000000000001`, version 1, is an immutable definition/hash plus explicit renderer version. Technical sources are `c2000000-0000-4000-8000-000000000001` and `...000002`; `...000003` is a RestrictedFinance exclusion canary. Exact fictional content/hash/version appears in `src/documents/fixtures.ts`, `db/seed-p06.sql` and every issued source manifest. The selected history, P04 evidence, scope, policy, schedule/assignment snapshots and template are frozen in each revision. No source upload/editor or historical version substitution endpoint exists.

Capabilities are `pack.read`, `pack.prepare`, `pack.check`, `pack.issue`, `pack.acknowledge`, combined with current workspace/company/site, work-order and appointment scope. Technicians additionally require current assignment and exact issue recipient scope. DTOs select only service-audience content, including source titles and attachment metadata; Finance/internal source records, balances and account plans are excluded before rendering. Draft previews, generated attempts, issued HTML/PDF/manifests and original receipts independently recheck permissions. No capability returns 403; permitted capability with missing or out-of-scope record returns the same 404. Unlisted fields and fake actor/state/delivery inputs fail validation. Files use private/no-store and restrictive CSP/nosniff headers.

## Verification record

All three maintained Python checks, npm check, real PostgreSQL upgrade/repeat-seed/reset/restart, HTTP routes and desktop/phone Chromium suites are required on the final source. Local scratch cannot run PostgreSQL or browser sockets; actual database/HTTP/browser evidence comes from the authorised disposable GitHub CI service. The complete [Application run 33970856208](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33970856208) and [Documentation run 33970856161](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33970856161) passed on source `ec1a48a811f0eba7de7532a7ab5d692141e7bb3c`, tree `c3ebd0c8f4c8d1fae6990367fab93f433f4ac0ae`. Application checkout was PR merge `9efcb765f94e3ca07bf7646f1e91bdef3af9623d`, verified to have that same tree. Subsequent exact-source checks, final PR and merged-main results are in the publication record. No full PT/AT status is promoted.

| Executed component gate | Result |
|---|---|
| `check_foundation.py`, `check_prototype.py`, `check_naming.py` | All three passed; 4 issued source hashes, 78 parent identities, 29 decisions, 38 AT scenarios, 16 backlog records, 30 full PT definitions retained; 24 Core / 25 Partial / 29 Deferred remain scope classifications. |
| `npm run check` | ESLint, TypeScript, 7 unit cases and production bundle build passed; production startup remains refused. |
| Real PostgreSQL | 96 cases passed (65 earlier + 31 P06); fresh migration, P05 upgrade, repeated non-destructive seed, guarded reset and database process restart passed. |
| Actual HTTP | 10 cases passed, including exact persisted issue after PostgreSQL restart and scoped source/file/receipt routes. |
| Chromium desktop / phone | 34 cases passed at 1440×1000 and 390×844, locale en-AU; both independent crew responses, uncertain-response retry and exact retained withdrawal bytes executed. |

The total is **147 component cases**, plus documentation/static/build/lifecycle gates. Repeat runs do not increase the case count. Tests remain in `tests/database/packs.test.ts`, `tests/http/packs.test.ts` and `tests/browser/packs.spec.ts` alongside all earlier suites. The complete executable order, pinned Actions and disposable PostgreSQL service are in `.github/workflows/application.yml` and `.github/workflows/documentation.yml`.

```sh
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
npm run check
npm run test:db
# Start the loopback application with npm run dev in a separate terminal.
npm run test:http
# Browser configuration starts its own loopback server when needed.
npm run test:browser
# Destructive only to the explicitly named disposable synthetic database:
PPO_ALLOW_RESET=dispose-synthetic PPO_RESET_DATABASE=ppo_synthetic_test npm run db:reset
```

The workflow executes `node --env-file=.env.local --import tsx scripts/persistence-proof.ts write`, restarts the disposable PostgreSQL container and executes the same script with `verify`. It retains original file/hash/issue/recipient evidence across the restart. It also challenges reset without opt-ins and with a mismatched database name.

| Procedure component | Verified P06 evidence; incomplete boundary |
|---|---|
| PT-06 | Durable queued intent, one issue, two distinct assignment acknowledgements and current component guard, including first-response hold; final actual-start step is absent until P07. |
| PT-07 | Material revision hold, checked successor issue, old-issue refusal, current recipient responses and original output retrieval; no full-procedure acceptance claim. |
| PT-18 | Stable source identity after rename, missing original version refusal, exact old issue retrieval and audience/metadata/file/receipt traversal challenges; reports, Finance and integrated source-provider steps remain absent. |
| PT-23 | Current template v2/source/assignment/permission changes during rendering; storage failure and six late SQL finalisation failures (issue, recipient, distribution, audit, receipt, outbox); same-operation original-bundle reconciliation; multi-page inspection. Later OUT report/Finance and integration steps remain absent. |

Additional challenges cover concurrent worker/issue/acknowledgement, changed operation reuse, stale check, same-404 cross-company traversal, revoked receipt/Activity access, immediate hold and owned follow-up for P05 move/cancellation and P04 scope successor, rollback of all owned-follow-up rows, and direct forged dispatch clearance. Published P05 competency bundles refuse mutation; current non-waivable policy and recipient-access refusals are preserved.

| Failed run | Observed failure and disposition |
|---|---|
| [33967359191](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33967359191), source `2e1870f42168546518290c3ccb6b2c20049c0d53` | Static/unit/build/migration passed; repeated workspace directory creation failed EEXIST. Private recursive mkdir preserves mode checks and write-once file semantics. |
| [33967654188](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33967654188), `4b19e8237759bb86b1b23005db853c52f9444b49` | 84/85 PostgreSQL; second valid acknowledgement met the old P04 unconditional hold constraint. Replaced only that obsolete boundary assertion with a real database pack/crew response guard and forged-clearance refusal. |
| [33967998661](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33967998661), `c6832a6f324fb706d00e7538c2b74b3522bee07f` | 7 unit, 86 PostgreSQL, 9 HTTP and restart passed; 30/34 browser. Source checkbox text included availability text; alert locator also matched Next's announcer. Use the actual checkbox accessible name and scoped business alert; no business gate was weakened. Long output cases passed. |
| [33969662455](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33969662455), `bfb298f4fa0c581657f9fd9a71eff35f77980012` | 93/94 PostgreSQL; new challenge attempted to mutate an immutable P05 skill bundle. Preserve that refusal, then challenge current recipient access revocation instead. All six late database-finalisation rollback cases passed. |
| [33970069533](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33970069533), `f8c0e238be23caaede5e17ec52d01dee5545be92` | Migration validation found the new owned-follow-up composite FK needed a matching workspace/event unique key. Added that key in the unreleased additive 0006 migration; no earlier migration or source bytes changed. |

## Original output and visual review

The [evidence index](../testing/evidence/p06/README.md) and [file manifest](../testing/evidence/p06/manifest.json) identify every selected original by source/executed SHA, tree, workflow/artifact, path, byte count and SHA-256. The retained `P06-output-evidence.zip` is **9,141,721 bytes**, SHA-256 `b86b38532f32d05c9a82b79769ef53e050212803f91494fa5e3355e7d3cf5605`. It contains 57 source/output evidence files: 7 original PDFs, 7 original HTML files, 9 source/output manifests, 32 original screenshots and 2 exact fictional source text files, plus its index/manifest. Output bytes stay outside Git.

Self-review inspected **all 43 pages of the seven retained PDF originals**: two four-page standard outputs, three seven-page long outputs (including the explicitly never-issued long customer/site/24-asset renderer fixture), and two seven-page outputs preserved from earlier run 33967998661. A4 dimensions, text extraction, tags and outline were checked. Every page was rendered with Poppler and visually inspected for readable body text, identity, page count, wrapping, clipping and overlap. No blocking page defect remained. Tags/outline are evidence of requested structure, not PDF/UA or screen-reader conformance.

The 28 primary desktop/phone screenshots were inspected, with full-height reading strips for standard and long HTML. Two original `P06-document-manifest.png` captures were found to duplicate the workbench because navigation had not settled; they are retained and explicitly rejected as SC-14 evidence. The test now waits for the exact document URL, heading and loaded applicability before capture, and also captures withdrawn document status. [Application 33972180297](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33972180297) and [Documentation 33972180317](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33972180317) passed all 147 cases/gates on source `de7d2928dea3daa960ef844f6e3035c8b54b6c65`, tree `abb639050ffce8689a386af2fd67aee95d3d485e`; executed merge `b00f615ba0ef88c92edecdf95e169d66b8311340` has that same tree. Its four original current/withdrawn SC-14 screenshots were manually inspected on desktop and phone and retained with their source manifests. Primary PDF originals were not replaced by that rerun.

Self-review also found that linked contact Activities needed their own current permission check before projection into a pack; `visibleActivity` now applies that check and revoked Activity access is challenged. [Application 33971589543](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33971589543) / [Documentation 33971589619](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/33971589619) passed all 147 cases/gates on source `04386eb2fd6d3e71f94039a69d13fabbd7a5f5f8`, tree `8a2c227b09d165cbd2d7eb15e22d0139aa58defc`; executed merge `a3e646e09acf947aa938849fa41d3f88f39f4796` has that same tree. This fix is also included in the corrected capture run.

Inspection-only derivative failures were resolved from unchanged originals: one Poppler PNG was truncated and was re-rendered; one initial reading crop omitted left-edge text and was corrected. Original ZIP/PDF/PNG hashes remained unchanged. No visual editing or regeneration replaced selected issued files. CI artifacts expire after 14 days; the separately retained evidence ZIP and repository manifest preserve the reviewable selected originals beyond that CI retention window.

## Review, publication and P07

Final exact head/tree, checks, review/thread/rule reads, normal merge and exact merged-main checks belong in the [final publication record](https://github.com/deanrfiedler-gif/powerplants-one/issues/30#issuecomment-5552360820). This avoids circular self-SHA claims. A successful component run is not independent review, owner acceptance or production readiness. All thirty full PT procedures and all full AT/PP-01 acceptance remain incomplete. PT-06/07/18/23 are component obligations; PT-18/23 report/Finance steps remain P09/P10 and integrated dependencies.

The prepared next increment is [P07 — Technician online workflow and capture](p07-starter-prompt.md). No P07 implementation issue, field entry, actual start, hosting, production migration, live ERP/SharePoint or customer communication is created by this increment. Stop after verified P06 publication and the prepared P07 brief.
