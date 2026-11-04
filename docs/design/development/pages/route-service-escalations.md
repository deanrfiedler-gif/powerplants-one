# Remote diagnosis and escalation — native route

Stable entry: `route:/service/escalations`; parent `scope:SV-08`. Owner: Dean Fiedler. Draft for implementation review; no owner visual acceptance.

## Desktop

The [SV-08 page contract](scope-sv-08.md) is the authoritative desktop/mobile composition, state and handover specification. Accepted captures 01–09 are under `docs/reference/ui/service/escalations-design-r01/`. Inspect register, diagnosing, recorded sending and reply/next-action states at 1440, 1024, 390 and 320 CSS px. Retain shared Service review navigation and one scrolling owner; keep full fault titles, reply advice, native finding links and unsaved entries available on phones.

## Mobile

At 390 and 320 px, retain the full fault title, native finding handover, Reply/Diagnosis/Pack/History tabs and a reachable next-action footer. The form follows the reply before old sending details; secondary equipment facts remain below the task. At 1024 px the shared primary rail can be collapsed, matching the retained tablet reference.

## Behaviour and review

The [record contract](../../../contracts/service-escalations.md) describes required finding/equipment, lifecycle, capability, evidence exclusions/hashes, chase reminder and retry recovery. The [agent decisions](../../../decisions/service-escalations-native.md) explicitly settle the unlinked frame-04 conflict without claiming Dean's acceptance. Shared component consumers are recorded in `../component-bindings/2026-11-01-service-escalations.json`.

Functional tests are in progress. Codex inspected paired application/reference captures at all four widths; differences are in the [comparison ledger](../../../testing/evidence/service-escalations/README.md). Owner acceptance and deployment are not verified. Configuration/history/closed/withdrawn/full pack preview and denied/zoom design images are missing; use the documented shared patterns and record their review separately.

A same-query Refresh keeps existing rows mounted with an accessible busy state. History names actions in plain English using the command labels. If a read fails, hide the rows/counts. The new regression fixtures cover these behaviours; browser execution and visual acceptance remain separate.
