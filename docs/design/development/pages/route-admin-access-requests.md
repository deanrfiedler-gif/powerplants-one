# Access-change requests

Stable entry: `route:/admin/access/requests`. Existing scope AD-01. Owner: Dean Fiedler. Status: Draft; visual and owner review pending.

## Page type and controls

Use r20 Register / worklist with a single-add submission form. Reuse PageHeader, Field, SelectField, Button, ReadState, ErrorNotice, ValidationFields, Status and Stamp plus the existing recoverable command hook. No new shared component export or token. The separate form/record adapts the retained persistent inspector; expose this departure pending owner review.

## Desktop

At 1440 × 960 and 1024 × 768 use current shell spacing, type, card and field tokens. Keep names with exact ERP company keys and site numbers. Proposal fields precede the queue; detail identifies the exact UUID, version, parties, dates and reason. Display Approved with explicit no-effective-access copy. Preserve operation IDs and reasons in saved history. Long UUIDs and capability names wrap; there is no invented human reference.

## Mobile

At 390 × 844 and 320 CSS px stack fields/cards. Keep return and recovery controls visible in flow, preserve labels and keyboard focus, and prevent page-wide overflow. Inputs are UTC and results identify Australia/Brisbane display time. Do not hide grant-scope widening behind colour. Physical device, zoom and screen-reader acceptance remain separate.

## States and authority

Loading or failed reads hide stale content. Permission/working-company command refusals invalidate protected context. Current Workspace read plus propose/approve gates are independent. Requester, reviewer and subject differ. Only a named current reviewer decides once. Dates and current grant absence are rechecked before approval; Return can retain an invalid proposal. Same-tab lost-response recovery preserves the exact command, rechecks current authority and blocks a replacement while uncertain. No offline queue, grant apply or notification exists.

## Sources and handovers

[Working AD-01 HTML](../../access-review/access-review.html), Access changes view; [issued r01](../../../reference/ui/access-review/PPO-Users-Roles-and-Access-Review-r01.html); [request decision](../../../decisions/access-change-requests.md). Incoming: exact local identities, current administrative duties and company/site keys. Outgoing: immutable proposal and independent decision evidence only. Parent IDs NFR-01–NFR-12, CRM-08 and FIN-06 remain unchanged. D-020 stays open.

## Evidence and review

[Execution ledger](../../../testing/evidence/access-requests/README.md). Host fixture: tests/browser/access-requests.spec.ts. Accepted native and mobile mockup images are missing. Functional proof, implementation/reference captures, owner visual approval and deployment are separate. No review fingerprint is assigned by this implementation.
