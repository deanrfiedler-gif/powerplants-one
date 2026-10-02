# FI-07 exact response host

Owner: Dean Fiedler. Host example; visual review pending. Stable component field-customer-response. Existing Service reports and detail routes; no isolated demonstration identity. The actual fixture and states live in tests/browser/reports.spec.ts and tests/database/field-customer-response.test.ts.

Reuse ExactReportPresentation, shared Button, ReadState, ErrorNotice, Stamp and useRecoverableCommand. Exact HTML is rendered with scripts/forms/navigation sandboxed and measured in the same-origin frame without changing its bytes. The frame expands into the shell's single content scroll; long hashes wrap. Response fields use explicit labels and no default acceptance. New response/recovery actions use shared Button variants; legacy review/issue controls remain a scoped exception. No global token changes.

## Desktop

At 1440/1024 desktop widths, present the original attendance/scope, exact content and separate response subject before saving. On presentation open focus the heading; Return returns to its opener. Failed validation retains input and focuses the error. Pending original operation prevents replacement capture; actual server receipt determines saved state. Guidance preserves unsaved input.

## Mobile

At 390/320 phone widths and actual 200% zoom, wrap identifiers, stack fields and expand exact evidence into the same content scroll owner. Retain the same choices and explicit save/recovery controls.

Retained [Service Review & Reports r02](../../../reference/ui/service-review/PPO-Service-Review-and-Reports-Workspace-r02.html) and [theme r20](../../../reference/ui/theme-style-board/powerplants-one-theme-style-board-r20.html) are proposed references. Native uses in-flow retained evidence/history and both P09 presentation kinds, explicit attendance acknowledgement and original-command recovery. No accepted native FI-07 image exists.

[Decision](../../../decisions/field-customer-response.md), [acceptance](../../../testing/field-customer-response-acceptance.md), [executed evidence](../../../testing/evidence/field-customer-response/README.md). Owner, physical-device, screen-reader and independent visual acceptance remain pending.
