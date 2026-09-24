# Field Work and Quality native programme

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. State: implementation in progress. This is not a completion, acceptance or deployment claim.

## Execution preflight

Fetched main `0f10b7fb46a8ab512e9b019573ece272cf5920b9`, tree `a5b0624f19205909e67b83b437bc1edb79510f3a`, on 24 September 2026. GitHub reported only unrelated ES-02 PR #314 open. Recent relevant merges include Customer/Site #285/#287, Equipment #302, Engineering #305/#307 and existing EN-08 #270, Scheduling #310, Job Pack #304/#306/#309/#311, Service register #312 and accepted timer #292. Their code is present in this base; historical STATUS wording does not reverse these merges.

The original `docs/field-quality-build-plan` checkout contains uncommitted STATUS/register/planning files and is preserved. Dedicated branch/worktree: `feat/fi05-field-site-readiness`, `tmp/fi05-field-site-readiness`. No unrelated worktree is edited.

Read repository guidance, current blueprint and Service architecture, FI scope specifications, accepted timer decision/change record/source, proposed Quality report/source, CS contracts/implementation, Equipment and Engineering handovers, shared inspections and P07/P08/P09/Job Pack source. Live schema inspection on an isolated local PostgreSQL 16 cluster confirms migration 0048-era CS snapshots/events, User-bound Resources without a Person link, Service Appointments and shared inspection attempts. No incident master was found in current source.

## FI-05 increment

`/my-jobs/site-readiness?appointment_id=…` consumes CS-06, with an assigned-visit chooser at the bare route and a link from the job. `GET/POST /api/v1/my-jobs/[id]/site-readiness` reads exact permitted sources and records an attributable CS Preparation/Acknowledged pair. Source-edit rights are not granted to technicians. Existing `field.read.own`, `field.capture.own`, `shared.read`, workspace/assignment checks, `sharedOperation`, CS revision records and private receipt recovery are reused.

[Decision and unresolved identity mapping](../decisions/field-readiness-native.md). No migration, capability, grant, dependency, live integration or new readiness master. Exact selected locations/activity, assignment, appointment/schedule/scope and pack are bound; old evidence remains immutable. A review note records escalation needs but sends no message or assigned Activity automatically. Personal induction remains unverified without an authoritative Person mapping. The first increment is online; offline extension is not claimed.

## Verification ledger

- Before application edits: focused Customer readiness, Field and Inspection unit sample **15/15 passed** on unchanged main. Default Windows sandbox initially blocked tsx runtime user lookup; permitted execution outside that sandbox passed.
- Before application edits: existing Customer location database suite **6/6 passed** against an isolated `ppo_synthetic_test` on loopback port 55561. The ordinary `.env.local` points to `ppo_synthetic`; its test guard refused it without reset. No working database was reset.
- New FI-05 database tests, application checks, documentation assurance and browser/visual evidence: in progress. Failed intermediate runs remain distinct from final verification.

## Remaining programme

FI-01 durable r05 timer, FI-02 safe offline extensions, FI-03/FI-04 Service inspection consumer/review, FI-06 incidents/actions, FI-07 response refinement and complete regression/visual reconciliation remain to be delivered. Existing sources are reused; no claim that rendering four routes completes the programme. Publication, CI, merge commits and final evidence will be recorded as executed. Azure deployment remains separately authorised and has not been attempted.
