# Incident and corrective-action record — working design

<!-- versioning: git; committed history is authoritative -->

Stable entry `scope:FI-06`; scope FI-06. Owner Dean Fiedler. Native implementation; independent visual review pending. r20 page type: **Register / worklist**. Route `/service/incidents`.

## Accepted source and implementation

Source: **PPO - Design**, page `1348:2972`, named version **Incidents and corrective actions — accepted**. Dean's D1–D7 and Q1–Q4 acceptance is in [the design decision](../../../decisions/incidents-figma-design.md). Live notes `1355:2930` and the file index were inspected. [Icon-free retained captures](../../../reference/ui/quality-site-assurance/incidents-design-r01/README.md) are unchanged design evidence; they are not application screenshots.

| View | Live node | Retained capture |
|---|---|---|
| Desktop register | `1348:3008` | 01 |
| Submitted, scope held | `1348:3253` | 02 |
| Triage | `1348:3382` | 03 |
| Accepting evidence | `1348:3516` | 04 |
| Ready to close | `1348:4410` | 05 |
| Report form, saved draft | `1348:3653` | 06 |
| Tablet register | `1348:3756` | 07 |
| Phone report, 390 / 320 px | `1348:3985`, `1354:3721` | 08, 09 |
| Submit sheet | `1354:3275` | 10 |
| Reporter view held | `1348:4149` | 11 |
| Not connected / uncertain submit | `1354:3435`, `1354:3571` | 12 |

Page parts `1355:2926` include grid header `1348:4353` and row `1348:4367`. Layout and variables come from live frames; generated code is reference only. Runtime icons use the existing Font Awesome mapping; no Pro artwork is retained here.

## Purpose and handovers

FI-06 remains factual incident reporting and independent corrective-action review. Incoming: assigned visit/Appointment detail, exact task and equipment, site, work order and current FI-05/FI-03/FI-04 restrictions. Outgoing: owned My Work activities, original evidence, current readiness/Start restrictions and the internal scoped outcome. A completed activity or passing inspection does not release this incident's hold. Closure does not complete a visit, work order, customer, project or Finance workflow.

## Desktop

The existing routes use the full-bleed shared shell. The register composes `SecondaryMenuFrame` and `RegisterTable`: compact toolbar, semantic rows, Reporter/Site filters and matching counted views, with horizontally scrollable columns and fixed selection/settings cells. Views are All incidents; Awaiting triage, In review, Clarification or returned, On hold; Holding work, Actions open, Ready to close and Closed. Counts and as-at cover the same permission-checked latest-200-candidate window. They do not establish complete global totals or command authority. At 1024 px the secondary menu is an overlay; it docks from 1200 px.

Records reuse `SharedRecord`, its ruled Summary/Affected scope/Visit column and readiness bar, and mounted `RecordTabs`/`RecordPanel`. The hold card leads Factual report. Triage summarises the source report and records assessment, priority, accountable owner, site-local due time and basis. Review decisions and corrective-work controls remain available in their disclosed section. Actions link to My Work and display exact evidence size/hash and independent acceptance. Evidence and History retain original files/events. The accepted state shows an unissued internal outcome summary before the existing close command.

Report fields group what/where, factual observations, immediate response, retained Source reference, restricted details and reason. Source reference is deliberately retained as required provenance. Four classification choices remain independent of assessment. Occurrence and due values display in site time and submit UTC through `LocalDateTimeField`. New reports enter from the visit's More menu with an explicit scope; a multi-target visit offers labelled choices. The unsaved form must save before appending files; saved drafts expose Evidence.

## Mobile

Use the existing compact phone header. At 390 px the report is one vertically scrolling form with sticky Save draft/Submit report controls; at 320 px classification wraps two by two. Labels and exact hashes wrap; inputs use 16 px text and controls at least 44 px. Record tabs retain edited input and provide keyboard navigation. Submit opens the shared native modal as a bottom sheet on phones, states the hold until closure, identifies restricted readership and explains retained corrections. Escape/cancel restores focus. The reporter record keeps the factual hold and original report readable, with Open visit and Add evidence.

The phone register has no accepted frame: retain the semantic grid in its own bounded horizontal scroller and use the shared header/menu/filter controls. No phone-specific business behaviour is invented. Dialog content can scroll when needed without horizontal page overflow. Physical device, screen-reader and 200% browser-zoom acceptance remain pending unless explicitly evidenced.

## States and recovery

`ReadState` distinguishes loading, unavailable/denied and empty results. Denial removes protected data. A failed read of a loaded record labels last-known context and disables writes. Draft has no hold; submission holds its exact scope; Returned and Clarification required preserve originals; Accepted remains held until close. Closed outputs can become historical without changing their original bytes.

Unsaved facts, review basis and evidence decisions retain their expected version across tab changes and newer reads. Conflict requires comparison and explicit current-version adoption. Not connected disables save/submit and keeps last-saved time on a saved draft; no incident command is queued offline. An uncertain submission offers Check original receipt and Recover the original, preserving the operation ID and payload through the existing bounded same-tab journal. A recovered create opens its saved incident; it cannot silently create another one. File limits remain PNG 2 MiB and UTF-8 text 64 KiB.

## Adaptations and unresolved design

[Implementation decisions](../../../decisions/incidents-figma-build.md) record all departures: Source reference retained; actual display number or stable ID; one exact acceptance file per action; incident-level return; summary preview with HTML/PDF generated only on close; persisted draft before evidence; only currently available visit context; current shared phone header and no Conversations action. These preserve existing authority and do not grant business approval.

Images remain missing for a phone register, full Evidence/History, returned correction, reopening, rebinding, reassignment, tablet record, loading, empty and denied views. Their existing controls use shared patterns. Further visual direction for these views and owner review of the stated adaptations remain open. No new migration, capability, dependency, ERP endpoint or closure policy is part of this page.

## Components, guide and verification

Reused: `SecondaryMenuFrame`, `RegisterTable`/`RegisterChip`/`RegisterEmpty`/`RegisterSortHeader`, `SharedRecord`/`RecordFactSection`, `RecordTabs`/`RecordPanel`, `WorklistChoice`/`WorklistMenu`/`WorklistPanel`, `Button`/`ButtonLink`, `Field`, `LocalDateTimeField`, `ReadState`, `ErrorNotice`, `ProductIcon`, `RecordIdentity`, `usePhoneHeader`, `useUnsavedChanges` and `useRecoverableCommand`. FI-06's visit-menu and section helpers are domain compositions, not new shared primitives. Tokens and reusable controls retain their original owners.

See [build evidence](../../../testing/evidence/fi06-figma-build/README.md), [original persisted evidence](../../../testing/evidence/field-incidents/README.md), [contract](../../../contracts/field-incidents.md) and [acceptance matrix](../../../testing/field-incidents-acceptance.md). The working guides describe the real controls in Australian English. Owner visual review is **pending**, with reviewer/date/fingerprint unset. Source presence, functional proof, design acceptance and deployment are separate.

## Recorded technical inspection — 2 October 2026

Agent inspection of final compiled build `AeYSVMnsm8P5WGqr_9cEb`: [exact register/capture/record/evidence captures at 1440, 1024, 390 and 320 px, actual 200% zoom and reference comparisons](../../../testing/evidence/field-incidents/README.md#inspected-layout-and-exact-output). Labels and hashes wrap, fields reflow and one content scroll owner is measured. This records implementation inspection only. Independent owner, device, screen-reader and visual acceptance remain pending; no review fingerprint is adopted.
