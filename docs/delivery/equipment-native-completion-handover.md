# Equipment and installed base native completion

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Implementation in progress; owner acceptance and deployment not claimed.

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

This is the continuing programme record. Implemented routes, commands, migration evidence, reviewed viewports and exact publication results will be recorded here as they are completed. An authored test is not an executed result. Issued Equipment HTML and all parent requirement IDs remain unchanged.

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

## Verification ledger (continuing)

- Production build completed twice, including TypeScript, static page generation and all routes. Later format-only changes retain the same behaviour; final evidence will name the tested head.
- Equipment database groups passed 9/9 before the final integration test was added; later broad local runs encountered seed/connection timeouts and are not claimed as passes.
- `npm run lint` passed; focused lint after final changes is recorded separately.
- `npm run test:unit`: 379 passed, four failed on Windows. The same four failures were reproduced in an untouched `ca006fb` worktree: two private document-store tests, private recovery-path test and Windows route-source separators. No assertion was weakened.
- `npm run studio:check`, `python scripts/check_foundation.py`, `python scripts/check_prototype.py` and `python scripts/check_naming.py` passed before the final documentation additions; final reruns remain recorded separately.
- Two previously failing focused Estimating cases passed in isolation. E2 formalisation and E1 current-main upgrade proofs passed; another upgrade encountered a seed statement timeout.
- Full integrated F01/F08/F02, dedicated HTTP/browser and complete affected regression results are pending. Authored tests are not executed evidence.

### Continued execution and reconciliation

PR [#302](https://github.com/deanrfiedler-gif/powerplants-one/pull/302) publishes the programme. Main advanced to `6c5e7c4` through #299 and #300 during verification. Merge `1cc52bc` retains the fertigation import changes and Projects reconciliation, including both additions to STATUS, the decision index and document register. The automated register merge was checked. Open #303 reserves migration/ADR 0046; #304 adds no migration, and neither unmerged implementation was copied.

The real F01 → F08 → F02 command journey passed against prepared synthetic fixtures. It proves exact physical context, independent readiness/basis review, failed readings and owned defects, a fresh partial retest with the unrelated guard defect still open, historical calibration validity, failed submission on expired evidence, renewal without retrospective repair and a later withdrawal without editing the original use snapshot. An unsupported unit is retained as `UnableToAssess` under the existing Inspection contract, rather than being treated as a pass or inventing a new submission policy.

Nine focused Equipment behaviour groups passed against the same prepared database, including expired configuration history with monotonically increasing revisions and refusal of a second successor for one calibration. The separate fresh migration/seed/upgrade test remains a CI obligation. Fixture preparation replayed registered synthetic seed SQL outside the application seed deadline; this is not a passed seed/reset test. The HTTP suite passed one integrated case covering current authority, exact receipts, concurrent identical apply, stale proposals, timeline and SH/Engineering receiving.

Browser findings were corrected: retained tab drafts now have distinct control IDs while preserving canonical validation fields; unopened tab forms load when first visited; original technical-history source-system attribution is visible; the existing Service/Finance browser journey opens the Documents & service tab. The Contacts contract pin was reviewed against its old source and unchanged main; its generated issued HTML is byte-identical. The local demo camera response policy permits same-origin requests because SPA navigation retains the initial document policy. User action and browser permission remain required.

`9f96ab9` compiled successfully, including TypeScript and static generation. The reconciled register passed with 278 entries, 124 source routes and no integrity errors; review state remains unreviewed. PR checks at `1cc52bc` passed Contacts, register, design integrity and documentation but exposed the new restart script using Playwright's `ok()` idiom on native Fetch; the corrected script uses the boolean `ok`. Those failed checks are not represented as passes. Final browser/restart and fresh-head CI results are recorded below when completed.

The machine was running other PPO work during this verification. A separate loopback PostgreSQL 16.15 cluster on port 55485 with database `ppo_synthetic_test` was created for Equipment. Seed failures include the existing `site_timezone` lookup over `pg_timezone_names`; application connection and statement deadlines remain unchanged. Unchanged main also reproduced a connection timeout. The broad interrupted run is retained only as diagnostic evidence. No other worktree or server was reset or cleaned.

## Publication and acceptance

Pre-publication refresh still found main `ca006fb`; open PRs #299, #300 and #301 contain no new migration. Their shared documentation/shell touches were inspected; no unmerged contribution was copied. The programme uses reviewable domain/API, native/UI/register and evidence/handover commits. Publication is in progress.

Implemented, verified, owner accepted, deployed and production ready remain separate. Physical camera/device and assistive-technology acceptance, operational review duties/definitions, supplier evidence and live providers remain outside synthetic code assurance. No deployment, merge, customer communication or business transaction is authorised by this programme.
