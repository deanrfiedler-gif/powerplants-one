# Incident and corrective-action host

Owner Dean Fiedler. Native host example; independent visual/device/screen-reader acceptance pending.

IncidentScreen composes PageHeader, Button, Field, ErrorNotice, ReadState, native select/fieldset/details and original-command recovery. No shared primitive is forked. Fixtures/state examples are tests/browser/field-incidents.spec.ts and tests/database/field-incidents.test.ts; no isolated renderer is claimed. State coverage: draft, saved, unsaved, saving, failed, conflict, uncertain, returned, overdue, restricted, held, closed, reopened and disconnected.

## Desktop

1440/1024: current scope and authority, wrapped responsive field columns, in-flow history/evidence and one #main content scroll owner. Commands in other sections cannot discard an edited draft. Expected version is explicit; uncertain results use the original operation.

## Mobile

390/320: stacked labelled controls, 16 px readable inputs and 44 px targets; long hashes wrap. Verify keyboard completion, guide focus return and actual Chrome zoom 200%. Responsive screenshots do not count as owner acceptance.

## Boundaries

The incident host uses a bounded 3,000,000-character same-tab journal for PNG/text evidence. Accepted payloads are reduced to receipts; identity changes clear protected views. The proposed Quality incident/release panels are adapted into three native routes; accepted native images are missing. No notification, general attachments or offline workflow engine is introduced.

IncidentActivityHandover is the corresponding Activity-detail consumer: a current server-authorised stable incident link with the completion/closure distinction. Its fixture includes the return journey; this adds no Activity permission.
