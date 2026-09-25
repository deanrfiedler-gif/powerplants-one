# Scheduling & Resources — implementation handover

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Date:** 24 September 2026 · **Status:** S1–S5 merged in PR #310; follow-up refinement for review; local verification and its baseline limits recorded separately from owner acceptance and deployment.
**Original base:** `ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc` · **Branch:** `feat/scheduling-resources-completion`.

## Post-merge refinement

The refreshed remote on 24 September is `0f10b7fb46a8ab512e9b019573ece272cf5920b9`. S1–S5 merged in #310 (`3040387`), followed by #312/#313 fertigation work. The sole open PR at refresh, #314, records an ES-02 design board and overlaps shared living documentation/register files; it adds no Scheduling source or migration. Current migration registry ends at 0048. This follow-up allocates none.

Fresh worktree `tmp/scheduling-resources-refinement` / branch `feat/scheduling-resources-refinement` corrects continuing calendar closures, travel closure warnings, terminal follow-up classification and lost date/site/timezone/filter/selection context. All five existing workspaces and the booking engine are retained. Field Team's accepted r05 successor is correctly distinguished from its retained r04 predecessor in the living contracts. The root's uncommitted field-quality work and all existing worktrees remain untouched.

[Refinement evidence](../testing/evidence/scheduling-refinement/README.md) records only checks actually executed for this follow-up. The original evidence below remains historical. Required CI, owner visual/device review, operational definitions and deployment are separate.

Runtime/refinement tests are committed as `1bce81239a6ba0982201985ba9b40061c9f2f50c`. One full scheduling database run passed 34/34; existing browser regressions passed 36/36 plus warm-up, and the final new desktop/phone run passed 10/10 after correcting a test selector. The required unit run passed 422/426; all four Windows failures reproduced on untouched current main. The separate build and documentation checks passed. The evidence manifest retains 48 original captures, 42 inspected, including actual 200% Chrome zoom. No owner approval or deployment is inferred.

## Original programme audit (historical)

Fetched origin before implementation; it matched the prompt's audited head. During implementation PRs #299 (fertigation held-field placement) and #300 (Projects reconciliation) merged. Reconciled with main `6c5e7c4fcbaf05d712a46989faf2cf7cabb8ba72`, preserving their runtime and shared-register changes. The document-register append conflict retained both programmes. No Scheduling engine or migration changed upstream.

A second open-PR audit found #301 (Estimating), #302 (Equipment), #303 (Sales) and #304 (SV-05 print/source review). Before publication, #304 merged and was preserved by reconciling main `9e49a57332aacfbb45a43fdd4d17c1d031fc80fb`; its changes are confined to Job Pack runtime and shared documentation. New Estimating cost-source work also appeared. Concurrent programmes overlap STATUS, guides, registers, shared component records/fixtures and migration allocations; this programme needs neither a migration nor a new capability. Other worktrees remain untouched. These observations are bounded to the refresh, not reservations on behalf of those programmes.

The final open-PR inspection covered #301, #302, #303 and new #305–#308. Engineering #305 also touches `src/engineering/service.ts`; #307 touches the layout import, and Equipment #302 touches component examples/fixtures. All seven overlap shared living documentation. At that observation, #302 and #308 each named a 0045 migration, #303 named 0046 and #305 named 0047; they need their own merge-time reconciliation. Scheduling allocates no migration and does not incorporate unmerged domain changes.

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

The next owner step is review of the concrete PR and native compositions, alongside the exact check results in the evidence record. All working visual review records and guides remain pending/Draft; captures do not grant acceptance. Required PR checks must be considered before merge. Deployment requires its separate release instruction.
