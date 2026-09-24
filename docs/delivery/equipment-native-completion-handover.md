# Equipment and installed base native completion

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Implemented; synthetic verification and publication recorded below. Owner acceptance and deployment not claimed.

The current request explicitly authorises EQ-01–EQ-09 implementation and publication. The supplied older build plan is supporting context: its statements that SH and CS are still concurrent are superseded by the executed prompt and refreshed repository evidence.

## Receiving audit — 24 September 2026

Starting `origin/main`: `ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc`; tree `e41585bcb65e3a5ca2c5ba4950f01b0a1c730909`. Fetch/prune completed. GitHub reported no open PRs. The latest registered migration is 0044. PRs #283–#287 are merged; later merges include the Service request read model (#298), design-register corrections (#297), and the Service refinement decision (#294).

Dedicated branch: `feat/equipment-installed-base-completion`. Worktree: `powerplants-one/tmp/equipment-installed-base-completion`, following the existing in-workspace convention. Main was clean. Other worktrees were inventoried and left untouched, including dirty CS comparison/CI worktrees. External worktree status was unavailable to the sandbox owing to Git ownership checks; no cleanliness claim is made for those checkouts.

The documented loopback synthetic PostgreSQL cluster was stopped and was started using its existing PostgreSQL installation. The live schema was inspected read-only. Tests must use `ppo_synthetic_test`; no production or external connection is authorised.

| EQ | Existing native capability | Missing capability | Reused owner | Native work required |
|---|---|---|---|---|
| EQ-01 | Shared Asset list/detail, identity correction and context | Equipment register/workspace and detailed filters | Asset, CS Site/Facility, canonical served links | Native register, contextual record views |
| EQ-02 | Shared reference/serial lookup primitives | Dedicated manual/camera journey and outcomes | Asset identity, CS readiness | Read-only scan, physical comparison, owning-workflow links |
| EQ-03 | Immutable configurations, exact Service bindings | Controlled successor and impact history | AssetConfiguration | Additive lineage; preserve historical snapshots |
| EQ-04 | Location-event chain, explicit prohibition on ordinary Site moves | Governed move/correction/replacement/retirement | Asset, Site, Facility, Service | Reviewed transactional transitions with consequences |
| EQ-05 | Permission-filtered technical history and source-owned Service/documents | Unified Equipment projection | Service, Inspection, Documents, Activities | Exact attribution and historical location |
| EQ-06 | Shared Activities and SH review coordination | Bulletin sources, candidate matching and per-Asset decisions | Equipment decisions; SH projection | Retained source revisions, disposition and closure evidence |
| EQ-07 | Asset physical lifecycle | Source-backed support portfolio | Equipment supplier evidence | Unknown-aware support review; no automatic replacement |
| EQ-08 | Engineering commissioning backup records | Installed-base backup/recovery workflow | Asset configuration, Documents, Engineering | Retained compatibility/recovery evidence; no restore execution |
| EQ-09 | Inspection instruments, permanent calibrations and exact use snapshots | Equipment register and maintenance of evidence | Shared Inspection core | Additive measurement/certificate fields and renewal/withdrawal |

## Delivery and verification

This programme record identifies implemented routes, executed command and migration evidence, inspected viewports and publication checkpoints. Issued Equipment HTML and all parent requirement IDs remain unchanged.

## Implemented receiving

| Scope | Native route and delivery |
|---|---|
| EQ-01 | `/equipment`, `/equipment/[id]`: permission-scoped URL-restorable register, exact counts, physical and served context, canonical identity correction and source-owned views. |
| EQ-02 | `/equipment/lookup`: read-only QR/manual lookup, browser capability/denial/failure, ambiguous/private/moved/removed outcomes and transient physical comparison before Inspection handover. |
| EQ-03 | Configuration tab: impact preview, retained proposal, exact successor details and explicit apply/reject. Prior configuration bytes and references remain immutable. |
| EQ-04 | Lifecycle tab: reviewed relocation/location correction, separate-identity replacement and retirement with relationship/open-Service guards. |
| EQ-05 | Documents & service tab: permitted Service, field, Inspection, document, Activity, technical and lifecycle sources with event-time context and explicit unavailable/partial sources. |
| EQ-06 | `/equipment/bulletins`: exact source revision, candidate matching, Asset-level decisions, canonical owned follow-up and evidence-based closure. |
| EQ-07 | `/equipment/lifecycle`: source-backed support portfolio, explicit Unknown, retained notices and no automatic physical/business transition. |
| EQ-08 | `/equipment/backups`: exact configuration evidence, staged review/test/independent verification and EN-08 source reuse. No controller restore. |
| EQ-09 | `/equipment/instruments`: existing Inspection master, additive measurement/certificate fields, renewal lineage, retrospective withdrawal and exact at-use snapshots/readings. |

Seven route containers bind to the shared module shell. The nine stable scope guides and seven route entries/specifications retain provenance and scope IDs. Actual Button, fields, RecordTabs, validation and ReadState consumers are registered; no new shared component family is claimed. Native adaptations remain proposed pending owner visual acceptance. The issued Equipment r02 and theme r22 bytes are unchanged.

Migration 0045 adds typed Equipment change, backup, bulletin, support and calibration-event evidence; additive configuration succession; reviewed physical transitions; and stable historical Asset references. It flushes deferred identity events before business identity ALTERs and restores deferral. All documented exact migration/version/count consumers are updated. It adds no seed, capability, grant, dependency or provider.

Server authority reuses `shared.read` and `shared.edit`, current company/Site checks, original-operation recovery, the workspace transaction lock, audit and outbox. Each projected Inspection, Service, Document and Activity source also applies its owning authority. Engineering/Inspection performer and reviewer duties remain unchanged. SH Reviews projects Equipment obligations; canonical Activities provide My Work and notifications. SH Asset search remains canonical; register filters are URL-restorable, without a private saved-view store.

Source code: `src/equipment/`, `src/components/equipment-*.tsx`, `/api/v1/equipment/*`. The [API contract](../contracts/equipment-api.md) defines read/command/recovery boundaries. [ADR-0045](../decisions/ADR-0045-equipment-native-workflows.md) records alternatives and scope. ADR-0044 was already taken by concurrent PR #299; the Equipment decision was renumbered before publication.

## Verification and retained evidence

The [evidence index](../testing/evidence/equipment-native/README.md) and manifest distinguish actual execution, inspected captures, source references and owner acceptance. The maintained tests are `tests/database/equipment.test.ts`, `tests/database/equipment-journey.test.ts`, `tests/http/equipment.test.ts`, `tests/browser/equipment.spec.ts` and `scripts/equipment-restart-proof.ts`. The existing intake and integrated quality browser checks were adapted to the Documents & service tab and exact retained source text.

| Check | Executed result and boundary |
|---|---|
| `npm run lint`, `npm run typecheck`, `npm run build` | Passed. The final production build `vI00E-ErsiyjacwG81FJH` contains the phone-header correction and all seven native routes at application checkpoint `cad07b4`. Type checking and focused lint passed again after that correction. |
| `npm run test:unit` | Linux CI at `3413c65`: **385 passed, zero failed**. Windows: 379 passed, four platform failures; the same four were reproduced on unchanged starting main and current main `9e49a57`. No assertion was weakened. |
| `npm run test:db` | [CI run 35927321649, database job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35927321649/job/107405386970), `3413c65`: **559 passed, zero failed/cancelled**. Includes all ten Equipment cases, the F01/F08/F02 journey and retained CS/Facility, Inspection, Engineering, Service, Document and SH regressions. |
| Migration, seed and upgrade | The same full database execution includes fresh setup, migration 0045, repeat seed and the Equipment upgrade from 0025 with existing estimates through the deferred-identity boundary. No prior migration bytes or seed grants were changed. |
| `node --import tsx --test tests/http/equipment.test.ts` | **One integrated case passed**, including private-cache/origin boundaries, direct scope denial, concurrent identical apply, original receipt recovery, changed-payload refusal and SH/EN receiving. Local final execution used the dedicated synthetic cluster and the isolated Site-02 fixture. |
| Native browser checks | **38 Equipment cases passed; ten duplicate matrix/reference/keyboard cases intentionally skipped.** The combined 54-case Equipment/intake run passed 42, failed two intake cases and skipped ten. Both intake failures reused a customer fixture name from an earlier run; a unique name per run retained the exact single-customer retry assertion, and the focused desktop/phone rerun passed 2/2. All six intake cases therefore have successful execution across these runs; the original run is not relabelled green. All seven route-guide mappings and focus returns passed on desktop and phone. |
| Real application/PostgreSQL restart | **Passed.** The application process changed from 36132 to 13952; PostgreSQL start time changed from `2026-09-24 06:56:53.171562+10` to `2026-09-24 08:01:10.250498+10`. Exact Asset, configuration, succession, change and receipt data retained SHA-256 `ca6867c5e315ca6f41b0290d4dcd5404e0f26a06a9c6af9eca404e101e90fc62`; original HTTP operation replay remained identical. See the retained verification JSON. |
| Design/document assurance | Final publication reruns of `npm run studio:check`, `python scripts/check_foundation.py`, `python scripts/check_prototype.py` and `python scripts/check_naming.py` passed. Reconciled register: 278 entries, 124 routes, 25 components; no integrity errors. Foundation preserves all 78 parent requirements; naming checks 426 document records. Review fingerprints remain unset and owner review stays pending. |

### Integrated quality and authority

The real F01 → F08 → F02 command journey proves exact physical context, independent CS readiness/basis review, failed readings and owned defects, a fresh partial retest with the unrelated guard defect still open, and exact result review. Expiry today preserves a historically valid reading; expired-at-use evidence blocks the guarded submission; renewal does not repair an earlier invalid reading; retrospective withdrawal changes the current assessment without editing the original certificate snapshot. Unsupported units remain `UnableToAssess` under the existing Inspection contract.

Negative tests cover wrong workspace/company/Site, private or unavailable records, direct commands, current permission loss, stale Asset/configuration/source versions, conflicting proposals, identical retries, changed operation payloads, missing evidence, unsafe parent/served relationships and open Service consequences. Bulletin candidates never constitute final applicability. Closure needs a current definitive decision for every candidate/previously reviewed Asset and completed follow-up for affected equipment. Backup recording, review, procedure review, test and independent verification remain separate; a changed configuration makes the historical backup basis explicit. Support evidence never changes physical Asset state.

### Findings corrected and failed-run disposition

- Retained tab drafts originally repeated field IDs. Equipment field wrappers now provide unique label targets while retaining canonical validation names; panels load once when first visited and drafts survive tab changes.
- The timeline preserves original technical-history source-system/source-ID attribution and retains unsuccessful fixes and unresolved findings. The canonical Create follow-up link carries Asset/company/Site context to My Work.
- Configuration successor numbers advance beyond all historical revisions, including an expired gap. A retained calibration can have only one successor; a competing renewal is refused.
- Calendar DATE projections preserve their literal dates in the Australian runtime. Publication, support, installation, commissioning and warranty dates are not accidentally shifted through UTC conversion.
- Browser selectors now address the exact accessible dropdown and the selected Configuration panel. Reference captures and keyboard behaviour are separate checks with unchanged deadlines. The phone containment rule follows the existing native CS approach and prevents the legacy identity-strip grid from spilling utility controls over Equipment evidence.
- The first broad CI run passed 556/557 database cases; its journey failure omitted an existing readiness access-window precondition. The corrected full run passed 559/559. Its later HTTP stage passed 41 cases, failed one shared Site count and cancelled three files; the Equipment fixture was moved to Site 02, preserving the existing assertion. That failed job is not an overall pass.
- The first browser CI failures exposed the repeated IDs, old timeline navigation and an incorrect assumption that exact serial matching excludes unknown-serial candidates. Those defects/assumptions were corrected. Local later timeouts remain failed executions, not silently relabelled passes; exact successful reruns are separately identified.
- Repeated local intake runs exposed fixed customer names in the retained-draft test. Each run now uses a unique name while both retries retain the same operation ID and the original exactly-one-customer assertion; both desktop and phone reruns passed.
- Local fixture preparation replayed the registered synthetic seeds outside the application seed deadline after the existing timezone-view query timed out. The subsequent nine prepared-database behaviour groups and journey passed, but that preparation is **not** fresh migration/seed assurance. The complete Linux run above supplies that evidence. Application connection, statement and test deadlines were not relaxed.
- The Windows-only document-store, private recovery-path and route-separator failures were reproduced on untouched main. The Linux unit suite passed. No production readiness claim follows from either environment.

## Reconciliation and publication

PR [#302](https://github.com/deanrfiedler-gif/powerplants-one/pull/302) publishes `feat/equipment-installed-base-completion`. Reviewable commits separate domain/API/migration (`1ebf6f9`), native UI/register (`6e905e7`), retained drafts/lineage corrections (`9f96ab9`), exact calendar facts (`3413c65`), isolated fixtures (`022c6e5`), canonical follow-up/identity context (`3e320e7`), test evidence (`e588cc0`) and phone-header/guide proof (`cad07b4`). The final published head and required-check state are recorded on the PR; documentation commits do not imply a new business review.

Main advanced first to `6c5e7c4` through #299/#300 and then to `9e49a57` through Service I4 #304. Merges `1cc52bc` and `87d96b4` preserve both contributions. Conflicts in STATUS, the decision index and document register were reconciled; automatic guide/component/register merges were inspected and checked. Equipment remains migration/ADR 0045. At the later refresh, open #303 reserves 0046 and #305 reserves 0047; #306 adds Service sections and #307 adds Engineering receiving. Their unmerged implementations were inspected for collision, not copied. No deployed environment is changed.

The final fetch still resolves main to `9e49a57332aacfbb45a43fdd4d17c1d031fc80fb`. New stacked #308 introduces an independent Estimating migration also numbered 0045 and explicitly records the pending Equipment/Engineering/Sales reconciliation. This is an unmerged branch collision, not a collision in this branch or current main: integrating that later branch must renumber its migration and all dependent version/grant assertions together, then repeat upgrade proof. New #309 is Service presentation work; #310 adds Scheduling surfaces without a migration. These open-PR facts are merge-order information and do not authorise merging their code here.

The dedicated Equipment worktree and loopback PostgreSQL 16.15 cluster (`ppo_synthetic_test`, port 55485) were isolated from other tasks. No unrelated worktree or server was reset, cleaned, stashed or switched. Issued Equipment r02, shell r17 and theme r22 sources remain unchanged. Contacts source pins were reviewed; the generated issued Contacts HTML remained byte-identical.

## Delivery, acceptance and limits

All EQ-01–EQ-09 workflows in the delivery matrix are implemented. Functional verification is bounded to the recorded synthetic data, runtime and tests. Native captures are implementation self-review, not a replacement accepted design baseline. The seven global information controls resolve their registered draft route articles; the nine scope guides remain available in Design & Development. Query-specific/released operational help follows the existing HELP review contract.

Owner/device and assistive-technology acceptance, operational review duties and business definitions, authentic supplier/calibration/recovery evidence, live integrations and deployment remain open. Camera denial/capability/manual fallback are automated browser checks; a physical device camera has not been accepted. The effective 200% check uses a 720 × 480 CSS viewport corresponding to a 1440 × 960 display, not an assertion that every device/browser zoom combination was tested.

**Implemented**, **verified**, **owner accepted**, **deployed** and **production ready** remain separate. This programme does not merge the PR, deploy, execute controller restores, perform business transactions or send customer communications. MYOB, SharePoint and source-owned Service/Engineering/Inspection responsibilities remain intact.
