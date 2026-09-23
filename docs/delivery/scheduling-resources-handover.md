# Scheduling & Resources — implementation handover

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Date:** 24 September 2026 · **Status:** Implementation and verification in progress; owner acceptance and deployment separate.
**Original base:** `ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc` · **Branch:** `feat/scheduling-resources-completion`.

## Refreshed audit

Fetched origin before implementation; it matched the prompt's audited head. During implementation PRs #299 (fertigation held-field placement) and #300 (Projects reconciliation) merged. Reconciled with main `6c5e7c4fcbaf05d712a46989faf2cf7cabb8ba72`, preserving their runtime and shared-register changes. The document-register append conflict retained both programmes. No Scheduling engine or migration changed upstream.

A second open-PR audit found #301 (Estimating), #302 (Equipment), #303 (Sales) and #304 (SV-05 print/source review). They overlap STATUS, guides, registers and some shared component records/fixtures. #302 reserves migration 0045 and #303 reserves 0046; this programme needs neither a migration nor a new capability. Other worktrees remain untouched.

The retained Scheduling r01 HTML and its packaged design/change records were inspected without editing issued bytes. Its unassigned lane was Proposed appointments; current ADR-0039 and the authorised work-order demand implementation supersede that design detail. Field Team remains the accepted technician-centric workflow. Its new resource link continues into PL-02 detail.

## Increments and source authority

| Increment | Delivered application path | Source/command boundary |
|---|---|---|
| S1 / PL-01 | `/schedule`; existing appointment detail | Existing day/week, Plan visit, contact, readiness, crew confirmation and same-tab recovery retained. Resource drill-through and secondary Scheduling navigation; current/proposed request comparison added to the existing decision control |
| S2 / PL-02 | `/service/technicians`, `/service/technicians/[id]` | Published resource/calendar/skill evidence, scoped site eligibility, exceptions/blocks, anonymous busy reservations and permitted appointments; no source editor |
| S3 / PL-04 | `/schedule/changes` | Bounded queue, selected appointment review, exact current/proposed crew/time/travel, existing accept/reject/cancel controls, owned contact consequences/history and links to existing move/contact/cancellation |
| S4 / PL-05 | `/schedule/travel` | Existing schedule read; one local day, per-resource sequence, buffers/reasons, buffered gaps/overlaps and blocks; analytical Earlier/Later order and exact PL-04 handover |
| S5 / PL-03 | `/schedule/capacity` | Repeatable-read Service/Projects/Engineering contribution model; source provenance and own permissions, unknown effort, supply evidence and analytical scenario exclusion |

[Architecture decision](../decisions/scheduling-resources-architecture.md). No migration, dependency, capability, live provider, external transaction, customer message or deployment. All reads retain no-store and existing identity/scope enforcement.

No measured effort exists in these source contracts. Reservation minutes describe scheduled resource occupancy including travel; programme duration and due dates remain dates. Project/Engineering owners are not mapped to technicians or synthetic skills. Certificate/renewal evidence remains Unknown. No utilisation, automatic dispatch, route optimisation or inferred travel speed is introduced.

PL-04 accepts no new command authority. Existing request/appointment versions, resource/calendar/scope guards, atomic crew reservations, operation receipts, outbox and immutable history remain authoritative. Pending requests reserve nothing; accepted changes require current contact and preparation consequences.

## Validation and handover

[Executed evidence](../testing/evidence/scheduling-resources/README.md) is the maintained source of exact results and limitations. Working PL-01–05 and new route contracts, draft guides, component consumer bindings and API/data documentation accompany the implementation. Missing mockups and owner visual review remain explicit; no review fingerprint is copied or accepted.

Before merge, reconcile current main and shared registers, run required checks, inspect native desktop/phone/zoom evidence and report CI conclusions against the exact PR head. The next owner step is review of the concrete PR and native compositions. Deployment requires its separate release instruction.
