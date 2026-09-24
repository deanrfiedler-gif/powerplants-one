# Field Work and Quality native programme

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. State: implementation in progress. This is not a completion, acceptance or deployment claim.

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

Runtime: Node 24.21.0, PostgreSQL 16, Playwright 1.63.0. The test databases are disposable `ppo_synthetic_test` clusters on separate loopback ports; no working or production database is used. Local Windows shell policy requires `npm.cmd`. Four reproduced Windows unit failures mean the aggregate `npm run check` cannot be labelled green locally; its component checks and Linux CI are reported separately. Wider offline/report/Equipment/Engineering/browser regression belongs to later affected increments and programme integration, not a claim from FI-05's two new cases.

## Remaining programme

FI-01 durable r05 timer, FI-02 safe offline extensions, FI-03/FI-04 Service inspection consumer/review, FI-06 incidents/actions, FI-07 response refinement and complete regression/visual reconciliation remain to be delivered. Existing sources are reused; no claim that rendering four routes completes the programme. Publication, CI, merge commits and final evidence will be recorded as executed. Azure deployment remains separately authorised and has not been attempted.
