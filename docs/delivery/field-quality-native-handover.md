# Field Work and Quality native programme

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. State: implementation in progress. This is not a completion, acceptance or deployment claim.

## FI-03/FI-04 Service increment

Delivery: [PR #334](https://github.com/deanrfiedler-gif/powerplants-one/pull/334). Local technical verification is complete; final-head CI is followed on the PR. Independent acceptance and deployment remain separate. The evidence index preserves original failures, source/build identities, exact restart/output comparisons and inspected desktop/phone/zoom captures.

Started only after Step 6 PR #333 merged into main `feb01e57c1ffdab0a5f8d1a5664ab5144bd37ccd`; all 17 reported checks passed and no relevant blocking permission/data-loss/recovery finding remained. Owner/device/visual/screen-reader and performance findings remain open. Unrelated worktrees and earlier databases/evidence are preserved.

Native `/my-jobs/inspections` and `/service/inspections` consume the shared engine. Service drafts partition by performer and exact procedure/equipment/scope/binding; EN-08 keeps its Engineering host and existing draft contract. Current assigned capture duties remain distinct from named Service-owner review/release. Failed/incomplete submission atomically retains owned defects and RestrictedService Activities. Correction, fresh linked retest and independent acceptance precede closure; Activity completion alone closes nothing.

Migration/seed 0055 adds immutable Service catalogue/retirement/binding/event/output tables, two fictional procedures and a separate fictional pressure instrument. No new capability, grant, user or framework. Installed SQL/seed bytes, reserved 0051/0052 and the retained-root repair remain unchanged. [Decision](../decisions/service-inspections.md), [contract](../contracts/service-inspections.md), [verification](../testing/evidence/service-inspections/README.md).

Controlled internal inspection output retains exact reviewed sources and original bytes, with current applicability separate. It completes no appointment/work order/Project/customer/Finance process. Capture is online only; same-tab original recovery is not an offline inspection protocol. FI-06 has no authoritative incident clearance source. Native captures grant no owner acceptance. Next bounded work is independent walkthrough/acceptance of this journey, followed by a separately decided FI-06 incident contract.

## Execution preflight

Fetched main `0f10b7fb46a8ab512e9b019573ece272cf5920b9`, tree `a5b0624f19205909e67b83b437bc1edb79510f3a`, on 24 September 2026. GitHub reported only unrelated ES-02 PR #314 open. Recent relevant merges include Customer/Site #285/#287, Equipment #302, Engineering #305/#307 and existing EN-08 #270, Scheduling #310, Job Pack #304/#306/#309/#311, Service register #312 and accepted timer #292. Their code is present in this base; historical STATUS wording does not reverse these merges.

The original `docs/field-quality-build-plan` checkout contains uncommitted STATUS/register/planning files and is preserved. Dedicated branch/worktree: `feat/fi05-field-site-readiness`, `tmp/fi05-field-site-readiness`. No unrelated worktree is edited.

Before publication, main advanced to `2173cc64eed54b1e3fb8334495f7cd924206d13f` through ES-02 documentation PR #314. FI-05 was rebased onto it, retaining both status entries and the ES-02 register/instruction updates. It changes no application/test source compared with the baseline. Open PR #315 concerns Scheduling refinements; FI-05 does not replace that work. Implementation commit: `39acd4d` (subsequent evidence changes are documented in Git).

Read repository guidance, current blueprint and Service architecture, FI scope specifications, accepted timer decision/change record/source, proposed Quality report/source, CS contracts/implementation, Equipment and Engineering handovers, shared inspections and P07/P08/P09/Job Pack source. Live schema inspection on an isolated local PostgreSQL 16 cluster confirms migration 0048-era CS snapshots/events, User-bound Resources without a Person link, Service Appointments and shared inspection attempts. No incident master was found in current source.

## FI-05 increment

`/my-jobs/site-readiness?appointment_id=…` consumes CS-06, with an assigned-visit chooser at the bare route and a link from the job. `GET/POST /api/v1/my-jobs/[id]/site-readiness` reads exact permitted sources and records an attributable CS Preparation/Acknowledged pair. Source-edit rights are not granted to technicians. Existing `field.read.own`, `field.capture.own`, `shared.read`, workspace/assignment checks, `sharedOperation`, CS revision records and private receipt recovery are reused.

[Decision and unresolved identity mapping](../decisions/field-readiness-native.md). No migration, capability, grant, dependency, live integration or new readiness master. Exact selected locations/activity, assignment, appointment/schedule/scope and pack are bound; old evidence remains immutable. A review note records escalation needs but sends no message or assigned Activity automatically. Personal induction remains unverified without an authoritative Person mapping. The first increment is online; offline extension is not claimed.

## Verification ledger

- Before application edits: focused Customer readiness, Field and Inspection unit sample **15/15 passed** on unchanged main. Default Windows sandbox initially blocked tsx runtime user lookup; permitted execution outside that sandbox passed.
- Before application edits: existing Customer location database suite **6/6 passed** against an isolated `ppo_synthetic_test` on loopback port 55561. The ordinary `.env.local` points to `ppo_synthetic`; its test guard refused it without reset. No working database was reset.
- Final FI-05 database suite: **2/2 passed**. Exact context/authority, expired/superseded evidence, immutable history, concurrent replay, original receipt, changed source and revocation are covered. No schema/grant assertions change.
- Combined Customer location / FI-05 / P07 database run: **48/50 passed**, with two existing P07 cases timing out at the unchanged 120-second deadline (`start racing move`, `capture late operation_receipts`). Exact focused sequential replay on refreshed unchanged main passed **2/2** (66.5 seconds total); replay on FI-05 passed **2/2** (50.6 seconds total). No assertion/deadline was weakened. The broad run is not retrospectively called 50/50.
- Full units with bounded process concurrency: **418/422 passed**. The four failures are two Windows document-store paths, the recovery-path message and Windows warm-route separators. Exact untouched-main replay of those files returned **3/7 passed with the same four failures**. Their application/test files are unchanged by the newer ES-02 merge. The initial unbounded unit run was interrupted under heavy contention and is not final evidence.
- Full lint, TypeScript and compiled build passed. Final focused lint of the new/changed runtime/test files passed. `studio:sync` registered the route; final `studio:check` and documentation assurance are recorded with the publication evidence. No review fingerprint or owner acceptance is fabricated.
- Final compiled browser run in maintained Chrome 154.0.8037.58: **2/2 passed**, desktop and touch-enabled phone, including lost-response receipt recovery, changed source, identity denial, keyboard order and 44 px action. [Retained source/application evidence](../testing/evidence/field-readiness-native/README.md) and hashed captures cover 1440/1024/820/390/320/720 CSS px; 720 is reflow, not actual browser zoom. Owner visual/device/assistive-technology and actual 200% browser zoom review remain pending.
- Final documentation assurance on reconciled source passed: `check_foundation.py`, `check_prototype.py` (all 78 parent dispositions) and `check_naming.py` (448 records; 7,964 maintained instruction characters). Final `studio:check`: **310 entries / 28 components / 156 routes, zero errors**, with 310 entries unreviewed and 28 component reviews pending. These are documentation integrity results, not owner/business acceptance.
- Exact `npm run check` was also executed after reconciliation: register, full lint and TypeScript passed; units finished **418/422 with the same four reproduced Windows failures**. Its build stage is therefore short-circuited; the separately executed final compiled build passed. No aggregate green result is claimed.

FI-05 is published for review in [PR #316](https://github.com/deanrfiedler-gif/powerplants-one/pull/316). The initial pushed head is `bf0ecb4`; final CI/merge evidence remains to be recorded. A whole-suite fixture audit found that November 19/20 were already reserved by pack browser cases, so the FI05 case now uses dedicated December 8/9 weekdays. The corrected desktop/phone replay passed **2/2** (1.0 minute). This changes no runtime rule or existing assertion; retained original screenshots still identify their actual earlier fixture dates.

Runtime: Node 24.21.0, PostgreSQL 16, Playwright 1.63.0. The test databases are disposable `ppo_synthetic_test` clusters on separate loopback ports; no working or production database is used. Local Windows shell policy requires `npm.cmd`. Four reproduced Windows unit failures mean the aggregate `npm run check` cannot be labelled green locally; its component checks and Linux CI are reported separately. Wider offline/report/Equipment/Engineering/browser regression belongs to later affected increments and programme integration, not a claim from FI-05's two new cases.

## Remaining programme

FI-01 durable r05 timer, FI-02 safe offline extensions, FI-03/FI-04 Service inspection consumer/review, FI-06 incidents/actions, FI-07 response refinement and complete regression/visual reconciliation remain to be delivered. Existing sources are reused; no claim that rendering four routes completes the programme. Publication, CI, merge commits and final evidence will be recorded as executed. Azure deployment remains separately authorised and has not been attempted.

## FI-01/FI-02 consolidation increment — 27 September 2026

FI-05 merged through #316. The preserved field worktree now carries `feat/fi01-fi02-field-timer-offline` above refreshed main `80b2f41` and the repository consolidation PR #320. Migration 0050 adds the durable personal timer and exact event chain without a seed, new capability or business identity type. Closed positive stretches reuse P07 capture and correction lineage; report submission refuses an open timer. The actual arrival is unchanged. Existing P08 storage, private originals and restricted recovery now carry ordered Timer and exact-source FieldReadiness commands.

[Implementation decision](../decisions/field-timer-native.md) and [retained verification](../testing/evidence/field-timer-native/README.md) define the exact boundaries. Final local evidence includes 9/9 database, 12/12 focused units, 4/4 new compiled desktop/phone browser cases, 8/8 affected existing offline/report browser cases, actual application/PostgreSQL/browser restart and 200% Chrome zoom. Full lint/type/build and the design baseline checks passed. No owner review fingerprint is invented. The live guides, page contracts, shared-control consumers, timer host component and API contract accompany the code. Final protected PR evidence is recorded on publication; these local results do not imply deployment or full programme acceptance.

The earlier FI-05 online-only limit is superseded only for explicitly downloaded exact-source readiness acknowledgements. Offline inspection execution, Undo and forgotten-finish resolution are not introduced. FI-03/FI-04 inspection consumers, FI-06 incidents, wider FI-07 refinement and the complete PT-28/PT-30 narrative remain separate work. Physical-device, screen-reader and owner visual review remain open.

The integrated follow-up on `7f36e92` passed both selected desktop/phone service-to-Finance journeys and a same-record application/PostgreSQL restart: 125 receipts, 61 checked tables and 22 exact issued files retained. It also repairs and proves the timer's independent 15-second refresh. See the [follow-up evidence and retained earlier failures](../testing/evidence/field-timer-native/README.md#integrated-service-follow-up). Return proposals are not completed second attendances; full PT-28/PT-30, owner/device review and latest PR CI remain separate.

## Completed service returns — 27 September 2026

The later `codex/service-return-verification` increment completes both synthetic return attendances on those same work orders, after retaining/cancelling the unprepared proposal and creating an explicitly prepared replacement. The second technician's own arrival, timer, original photo and task/site checks lead to a separately reviewed/issued Complete report. Previous reserved responses, Finance reconciliation and exact outputs remain unchanged. The new report inherits no customer response or financial outcome, and the work order remains Authorised.

Saved arrival now immediately refreshes the timer's independently loaded authority; Start no longer waits for the next 15-second poll. The existing guards and polling remain. Page, component and guide contracts record this behaviour without granting review. Clean browser source `f1fa3fb` passed both compiled desktop/phone journeys; clean restart source `83bccf1` preserved 175 receipts, 61 checked tables and 36 exact files through actual application/PostgreSQL restart. [Source, evidence and earlier failures](../testing/evidence/field-timer-native/README.md#completed-service-return-follow-up) remain separately identified. Parent #321's corrected source `a4f7322` passed compiled CI, restart and 200% zoom; full application CI was still running at this checkpoint.

This closes the selected journey's missing second attendance only. Complete PT-28/PT-30, closed-visit wording, independent owner/device/assistive-technology review and performance remediation remain open. No hosted deployment, live integration or production operation is included.
