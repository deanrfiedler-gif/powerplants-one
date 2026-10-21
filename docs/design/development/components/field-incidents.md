# Incident and corrective-action host

Owner Dean Fiedler. Native host example; independent visual/device/screen-reader acceptance pending.

IncidentScreen, IncidentRegister and IncidentVisitMenu compose the shared register, secondary menu, record layout, mounted tabs, menus, modal, fields and original-command recovery. No shared primitive is forked. Presentation fixtures are tests/helpers/incident-design-fixture.ts and tests/browser/incidents-design.spec.ts; persisted commands remain in tests/browser/field-incidents.spec.ts and tests/database/field-incidents.test.ts. No isolated catalogue renderer is claimed. State coverage: draft, saved, unsaved, saving, failed, conflict, uncertain, denied, empty, returned, overdue, restricted, held, accepted, closed, reopened and disconnected.

## Figma components

**Status:** Partial · **Location:** Incidents and corrective actions > page parts `1355:2926`, in "PPO - Design".

Grid header `1348:4353` and row `1348:4367` compose shared grid cells. Accepted page `1348:2972`, named version **Incidents and corrective actions — accepted**, notes `1355:2930`. The mapping in `../components.json` records source presence, not owner visual alignment. No new global main component is claimed.

## Desktop

1440: full-bleed register, compact toolbar/grid and counted views, ruled record context and mounted tabs. At 1024 the secondary menu overlays. Records own their bounded content scroll. Commands in other sections cannot discard an edited draft. Facts, reviews and evidence decisions retain their original expected version; uncertain results use the original operation.

## Mobile

390/320: shared compact phone header, stacked labelled controls, 16 px inputs and 44 px targets; long hashes wrap. Classification wraps two by two at 320. Submit uses the shared modal as a bottom sheet; disconnected saves are disabled. Phone register scrolling stays inside its grid. Physical device, screen-reader and actual 200% browser-zoom acceptance remain pending.

## Boundaries

The incident host uses a bounded 3,000,000-character same-tab journal for PNG/text evidence. Accepted payloads reduce to receipts; identity changes and denial clear protected views. Accepted frames and unchanged icon-free captures are named in the page contracts. [Implementation decisions](../../../decisions/incidents-figma-build.md) record Source reference retention, one-file acceptance, incident-level return, the unissued outcome summary and saved-draft-before-evidence flow. Owner review of these adaptations remains pending. No notification, general attachments or offline workflow engine is introduced.

IncidentActivityHandover is the corresponding Activity-detail consumer: a current server-authorised stable incident link with the completion/closure distinction. Its fixture includes the return journey; this adds no Activity permission.

IncidentVisitMenu is the My jobs, Field Job and Appointment-detail handover. It loads current permitted exact reporting targets when opened; it grants no reporting authority itself.
