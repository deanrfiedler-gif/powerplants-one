# Native Engineering programme handover

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Native implementation delivered in two draft PRs; owner visual/business review and deployment remain separate. Verification results and limits are recorded below.

Starting commit: `ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc` (main and freshly fetched origin/main). Branch: `feat/engineering-en01-en05-native`. Worktree: `tmp/engineering-en01-en05-native`. [Architecture and scope](../decisions/ADR-0047-engineering-native-control.md).

## Audit

The initial audit matched the supplied checkpoint. Main later advanced to `6c5e7c4fcbaf05d712a46989faf2cf7cabb8ba72` through #299/#300; this worktree was rebased onto it. Open #302 Equipment and #303 Sales now reserve migration/ADR numbers 0045/0046, so this unissued Engineering increment uses 0047. Those two gaps are deliberately absent from this main-based registry. Merge order must reconcile the shared registry, upgrade assertions, STATUS and design metadata. Main subsequently advanced to `9e49a57332aacfbb45a43fdd4d17c1d031fc80fb` through Service #304. Both Engineering branches incorporate it and retain its shared documentation changes. Open #301 Estimating remains untouched.

EN-06–EN-08 are native in the base (#265/#268, #266, #270), despite stale development-scope metadata and STATUS wording. EN-02 retains its exact six views: Basis & scope; Requirements; Assumptions & questions; Interfaces; Calculations & sources; Review & handover. EN-03/EN-05 have no exact dedicated visual baseline. Existing EN-02 evidence is 38 model/22 DOM groups, not native application acceptance.

## Delivery increments

The foundation increment contains the shared information model, additive migration/seed, scoped API, authority, immutable evidence, operation recovery and EN-01 workload projections. The dependent application increment contains routes, native forms/inspectors, EN-01 integration, navigation, guides and browser assurance. Review these as a dependency-ordered pair:

| Increment | Branch, worktree, exact source/base |
|---|---|
| [Foundation #305](https://github.com/deanrfiedler-gif/powerplants-one/pull/305) | `feat/engineering-native-control-foundation`; `tmp/engineering-foundation-review`; source `49249e2a06e189aa3693f3f2502bd291b8e459af`; base main `9e49a57332aacfbb45a43fdd4d17c1d031fc80fb`. |
| [Native application #307](https://github.com/deanrfiedler-gif/powerplants-one/pull/307) | `feat/engineering-en01-en05-native`; `tmp/engineering-en01-en05-native`; runtime and capture-test source `04444fb5ae293c55cbb2f164c03bff65c0888687`; base foundation `49249e2a06e189aa3693f3f2502bd291b8e459af`. The final evidence/documentation commit is identified in the PR description and Git history. |

Both worktrees are under the original `C:/Users/Dean.Fiedler/Projects/powerplants-one` repository. The original checkout and other programme worktrees remain untouched. No PR merge or deployment is performed by this task.

| Scope / parent | Delivered implementation |
|---|---|
| EN-01 / ENG-01 | Preserved intake, IDs, Project/Opportunity links and coordination history; accountable deliverables, prerequisite blockers, sourced effort, distinct author/reviewer queues, current-issue filter and native summaries. |
| EN-02 / ENG-02 | Versioned bases, stable typed requirements/inputs/interfaces/calculation references, two-sided confirmation, unknowns, facility applicability, frozen review and returned successors. |
| EN-03 / ENG-03 | Stable controlled document identity; exact native version, engineering revision, configuration, published references/hash and immutable mixed-revision history. |
| EN-04 / ENG-02, ENG-04, ENG-06 | Owned formal queries and answers, required independent disposition, supplier evidence/revision/reviewer, returned resubmissions and optional change links. |
| EN-05 / ENG-04 | Exact frozen submission, configured independent reviewer/issuer, findings and accepted closure, returned review lineage, purpose-bound issue manifest, recipients and separate sent/delivered/acknowledged evidence. |
| EN-06 / ENG-05 | Existing materials/substitution/release/receiving engine retained; consumes exact native source lineage. No purchase. |
| EN-07 / ENG-06 | Existing change-impact/review/verification/receiving engine retained; changed native sources invalidate current use. Acceptance remains separate from implementation. |
| EN-08 / ENG-07 | Existing inspection/commissioning/configuration/as-built/receiving engine retained; no automatic Project/Service closure or warranty/Finance action. |

Primary routes: `/engineering/basis`, `/engineering/drawings`, `/engineering/queries`, `/engineering/reviews`. Package routes under `/engineering/[id]`: basis plus requirements/assumptions/interfaces/sources/review; drawings plus deliverables; queries plus submittals; reviews plus issues. Existing `/engineering`, `/engineering/[id]` and EN-06–EN-08 bookmarks remain.

Migration 0047 creates separate typed basis/document/query/submittal/review/issue/deliverable records, document revisions, findings, review links, authority policies, transmittals, distribution evidence, immutable command events and exact native source/dependency lineage. It does not alter `business_identities`. Seed 47 is deterministic, adds no users and grants only the fictional reviewer/issuer/coordinator narrow technical duties. New capabilities: `engineering.technical.review`, `.issue`, `.distribute`, `.source`. AD-01 grows from 87 to 91; seed/upgrade exact grant and migration assertions are updated. Hosted upgrade remains a reviewed path, not a deployment.

Contract: [native control interface](../interfaces/engineering-native-control.md). Source file version, engineering revision, review outcome, purpose, issue, sent, delivered and acknowledged remain distinct. Changed upstream sources withdraw derived current use transitively while retaining exact historical decisions and acknowledgements.

## Executed baseline

- Node 24.21.0: 41 Engineering unit tests passed, zero failed on the unchanged base.
- Sandbox TypeScript startup initially failed at Windows user-information lookup; the same tests passed outside that sandbox.
- A task-owned PostgreSQL 16.15 cluster at loopback port 55469 holds separate ppo_synthetic and disposable ppo_synthetic_test databases. No other database is changed. Test results below distinguish this Windows host from clean Linux CI.

## Verification evidence

- [Final integrated Engineering Linux CI](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35939156950), source `c5846d9`: **passed**. Aggregate 392/392 unit tests, lint, TypeScript, Studio and build; 36/36 database journeys; 3/3 HTTP contracts; 34 desktop/phone browser cases passed, zero failures and 21 declared skips. This includes retained EN-01 and EN-06–EN-08, native EN-02–EN-05, department navigation, My Work database projections and additive quality upgrade. The later `04444fb` change only prevents inspector-return control shrinkage and adds saved-state captures; its local build/capture result is recorded separately.
- [Foundation Linux CI](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35936122934), source `d9bed11`: full aggregate check passed, including 392/392 unit tests, lint, TypeScript, Studio and production build. Its normal-configuration database run passed 27/27 journeys (native control, retained Engineering and additive quality upgrade), followed by 5/5 retained browser checks. This establishes the native database proof without the earlier local diagnostic timeout override.
- Integrated Linux application run `35937180011`, source `1d5b378`: aggregate 392/392 unit tests, lint, TypeScript, Studio and build passed; 36/36 database journeys and 3/3 HTTP contracts passed. Browser results were 32 passed, 21 intentional skips and two failures: stale navigation expectations and EN-01 mobile heading overflow. Both were corrected at `c5846d9`; this earlier run is not reported as a browser pass.
- Local compiled native plus retained EN-06/EN-07 HTTP contracts: 3 passed, 0 failed. Production build and TypeScript passed at `c5846d9`.
- Local final browser run at `c5846d9`: 12 passed, 0 failed, two intentional duplicate/desktop-only skips. This includes desktop/phone exact operation recovery, loading, server validation, stale saved-content comparison, saving, formal response, independent review, issue, sent/delivered, recipient acknowledgement, retained EN-01 workflows and canonical department rails. The responsive matrix exercises 1440 × 960, 1024 × 768, 390 × 844, 320 × 844 and 720 × 480 reflow. The ignored local runner uses a 30-second assertion wait on this busy Windows host; shipped CI assertions and the application's 10-second database timeout are unchanged.
- The additional capture pass completed three cases; one desktop fixture failed before its journey with a `DependencyUnavailable` response and correlated `DatabaseQueryCancelled` server event. That single case passed on rerun. It is retained as a local limitation, not silently counted as an initial full pass. Source `04444fb` then prevents a long basis title shrinking the inspector return control and retains saved-state captures.
- Final build and TypeScript at `04444fb`: passed. The complete local native capture suite then passed 7/7 executed cases, zero failed, one intentional duplicate-matrix skip. All thirteen retained images are from that clean final run; exact page links are recorded in the four corresponding design contracts and register entries.
- Local aggregate check passed Studio, lint and TypeScript, then stopped at 385/392 unit tests. Four Windows document-store/recovery/path failures were reproduced on untouched main `6c5e7c4`; three process-start timeouts passed in focused reruns on both current main `9e49a57` and the Engineering branch (13/13 tests each). Linux aggregate evidence above is clean.
- Retained EN-01: 5 local database journeys passed; EN-06: 6 passed; EN-07: 5 passed; department navigation: 2 passed, all with normal application configuration. The integrated Linux 36-case run includes all seven My Work journeys and desktop/department navigation.
- The broader local upgrade/My Work run executed 28 tests: 11 passed and 17 failed on PostgreSQL statement cancellation (`57014`), predominantly the shared `ppo.site_timezone()` lookup during fixture seeding. An untouched-current-main comparison at `9e49a57` ran three representative cases: two passed; the combined fresh-seed case reproduced `57014`. This establishes a shared intermittent seed-time limit, not that each of the 17 failures was individually reproduced. No schema, permission or timeout guard was weakened to pass this run. Clean Linux migration/upgrade jobs are the acceptance evidence for those suites.
- Integrated foundation, prototype and naming assurance passed; all 78 parent IDs remain. Studio: 289 entries, 135 routes, 24 components; all 289 reviews remain unrecorded, zero stale reviews. AD-01: 91 capabilities, 107 model groups and 40 browser groups, with the current foundation access-review CI passing. No automated pass grants visual or business approval.

[Inspected implementation captures](../testing/evidence/engineering-native-control/README.md) identify the exact route, state, device, source and remaining gaps. Desktop and narrow layouts use the existing shell and shared controls; EN-03/EN-05 remain proposed compositions. Physical-device and assistive-technology acceptance have not been performed.

## Authority and recovery

Real policy owners, discipline/purpose authority, statutory competence and operational receiving remain unconfigured. The fictional policy proves separation of duties only. SharePoint, native CAD and MYOB ownership are retained; no live endpoint is invented. Effort is retained only with explicit source evidence; actual effort/availability and utilisation are not inferred. EN-03/EN-05 native compositions and every new guide require owner review.

Revert the dependent UI increment first if necessary. Retain the additive schema, historical evidence and original operations on a code rollback; do not delete issued records or run an ad-hoc down migration. Synthetic reset applies only to this task's disposable databases. No production migration, Azure deployment, business transaction, customer message or access administration is authorised.

## Review and next bounded step

Review the foundation first, then the dependent native pages against the retained evidence and exact scope/parent mappings. Confirm real discipline/purpose reviewer and issuer authority, interface-party ownership, distribution/recipient duties and operational source responsibilities before using this as a business control. The fictional policy is test configuration, not an adopted company authority model. Actual effort, availability and utilisation remain ungoverned; owner review must not infer them from planned/source-backed hours.

Owner review covers the new native compositions, guides, narrow-screen density and handover semantics. Merge-order reconciliation must include reserved 0045/0046 work, exact migration/seed/grant assertions and shared design registers. Review current required CI checks before merging; a pending or failed check is not a pass. The next bounded step is dependency-ordered PR review and merge reconciliation, followed by a separately authorised synthetic release rehearsal. Production migration, live integration and deployment are outside this delivery.
