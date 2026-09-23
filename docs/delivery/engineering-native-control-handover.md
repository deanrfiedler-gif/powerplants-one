# Native Engineering programme handover

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Implementation and verification in progress; no visual, business or deployment acceptance.

Starting commit: `ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc` (main and freshly fetched origin/main). Branch: `feat/engineering-en01-en05-native`. Worktree: `tmp/engineering-en01-en05-native`. [Architecture and scope](../decisions/ADR-0047-engineering-native-control.md).

## Audit

The initial audit matched the supplied checkpoint. Main later advanced to `6c5e7c4fcbaf05d712a46989faf2cf7cabb8ba72` through #299/#300; this worktree was rebased onto it. Open #302 Equipment and #303 Sales now reserve migration/ADR numbers 0045/0046, so this unissued Engineering increment uses 0047. Those two gaps are deliberately absent from this main-based registry. Merge order must reconcile the shared registry, upgrade assertions, STATUS and design metadata. Open #301 Estimating and #304 job-pack work are also untouched.

EN-06–EN-08 are native in the base (#265/#268, #266, #270), despite stale development-scope metadata and STATUS wording. EN-02 retains its exact six views: Basis & scope; Requirements; Assumptions & questions; Interfaces; Calculations & sources; Review & handover. EN-03/EN-05 have no exact dedicated visual baseline. Existing EN-02 evidence is 38 model/22 DOM groups, not native application acceptance.

## Delivery increments

The foundation increment contains the shared information model, additive migration/seed, scoped API, authority, immutable evidence, operation recovery and EN-01 workload projections. The dependent application increment contains routes, native forms/inspectors, EN-01 integration, navigation, guides and browser assurance. Review these as a dependency-ordered pair. No merge or deployment is performed by this task.

| Scope / parent | Foundation and dependent application scope |
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
- A task-owned PostgreSQL 16.15 cluster at loopback port 55469 holds separate ppo_synthetic and disposable ppo_synthetic_test databases. No other database is changed. Database regression run is in progress; results will be recorded after diagnosis.

## Verification in progress

- New pure domain tests: 7 passed on the initial implementation. Expanded migration-0047 database journeys: 6 passed, 0 failed, covering scope, source restriction/revocation, site boundaries, immutable review/issue, mixed revisions, findings/successors, formal answers, supplier disposition, author/reviewer workload and source invalidation.
- The six database journeys used an ignored diagnostic harness with a 120-second statement timeout. The shipped application retains its 10-second timeout. Earlier unchanged-base EN07-A48 also timed out in `ppo.site_timezone()` on this Windows host. Diagnostic correctness evidence is not default-timeout performance acceptance.
- Compiled HTTP native contract: 1 passed, 0 failed with normal application configuration, including private reads, input/origin guards, exact replay, changed replay and company/role denial.
- Full lint passed. A production build including TypeScript passed; another build is running after browser corrections. The 392-test unit run passed 388 and failed 4; document-store, recovery-path and route-path failures are being reproduced against an untouched current-main worktree.
- Existing EN-01: 5 database journeys passed with the normal application timeout. Existing EN-06: 6 database journeys passed with the normal application timeout. EN-07, navigation and My Work regression diagnosis remains in progress; no blanket regression pass is claimed.
- Foundation and prototype documentation assurance passed, preserving all 78 parent requirements. Studio coverage passed with 289 entries, 135 source routes, 24 components and no integrity errors; all unreviewed states remain visible. Naming/access-review checks are being rerun after final wording and capability regeneration.
- Initial compiled browser run found an inspector focus-return defect and two test locator ambiguities. The product focus restoration and shared Button reset conflict are corrected; the full desktop/mobile journeys must pass on the rebuilt application before completion. Initial layout captures exercised 1440×960, 1024×768, 390×844, 320×844 and 720×480 reflow, but do not establish visual acceptance.

## Authority and recovery

Real policy owners, discipline/purpose authority, statutory competence and operational receiving remain unconfigured. The fictional policy proves separation of duties only. SharePoint, native CAD and MYOB ownership are retained; no live endpoint is invented. Effort is retained only with explicit source evidence; actual effort/availability and utilisation are not inferred. EN-03/EN-05 native compositions and every new guide require owner review.

Revert the dependent UI increment first if necessary. Retain the additive schema, historical evidence and original operations on a code rollback; do not delete issued records or run an ad-hoc down migration. Synthetic reset applies only to this task's disposable databases. No production migration, Azure deployment, business transaction, customer message or access administration is authorised.

## Remaining verification and handover

Finish the rebuilt browser journeys and visual inspection, compare baseline failures, complete affected upgrade/access checks and the aggregate check, then record exact commit/PR and evidence links. Prepare reviewable foundation and application PRs; retain merge-order reconciliation as a visible gate. No completion claim is made while these items remain.
