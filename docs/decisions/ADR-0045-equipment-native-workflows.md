# ADR-0045 — Native Equipment workflows and retained evidence

<!-- versioning: git; committed history is authoritative -->

Date: 24 September 2026. Owner: Dean Fiedler. Status: implementation decision under the authorised synthetic EQ-01–EQ-09 programme; operational and visual acceptance remain separate.

## Context and choice

Continue the existing TypeScript/Next.js/PostgreSQL modular monolith. Reuse canonical Assets, CS Sites/Facilities and served-area relationships, Inspection instruments, Activities, permission checks, operation receipts, audit/outbox and SH coordination. No new dependency, external service or deployment resource is required.

Equipment owns its configuration/lifecycle and supplier/backup evidence. Typed additive SQL records retain exact references, predecessors, sources, actors and versions. Portfolio records must not become competing Asset, Facility, instrument or task masters. Native UI uses the shared shell, Button, fields, status, RecordTabs, resource reads and original-operation recovery.

Ordinary Site edits remain prohibited. A reviewed lifecycle command must validate both contexts, explicit consequences, child/parent constraints and current versions inside the existing workspace transaction lock. Immutable event evidence must justify every permitted transition. Historical work remains bound to its original location and configuration.

Configuration succession must preserve original `asset_configurations` bytes, including open-ended recorded validity. Additive lineage defines supersession rather than editing those periods. Historical Work Orders continue to reference the exact canonical configuration ID. Current projections must account for the successor separately from the originally asserted interval.

Calibration renewal adds a retained certificate record in `inspection_instruments`. It never updates historical uses. Withdrawal remains an explicit attributable event affecting its declared interval. Backup/recovery evidence names an exact configuration and does not operate a controller. Source-backed support and bulletin decisions do not authorise Service, quotations, Projects or physical replacement.

## Alternatives and constraints

Reusing the standalone HTML's local storage would omit current permission, concurrency and receipt guarantees. Separate Asset/instrument/task stores would duplicate canonical responsibilities. Editing configuration history would reinterpret earlier work. A third-party QR library adds maintenance before a need has been demonstrated; use browser capability detection and permanent manual fallback, with unsupported camera states explicit.

`shared.read`, `shared.edit` and `shared.history.record` express existing context maintenance/evidence duties; reuse only where their scope matches the command. Distinct review authority, if required by a future operational policy, needs its own decision and the complete capability regeneration workflow. No hidden control grants authority.

Traceability: CRM-01/CRM-06, DAT-01–DAT-03, SVC-03/SVC-06/SVC-10, ENG-07, DOC-01/DOC-02, F01/F02/F03/F08 and EQ-01–EQ-09. [Programme handover](../delivery/equipment-native-completion-handover.md).
