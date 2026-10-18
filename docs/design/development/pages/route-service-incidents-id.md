# service / incidents /  id  — working design

<!-- versioning: git; committed history is authoritative -->

Stable entry `route:/service/incidents/[id]`; scope FI-06. Owner Dean Fiedler. Native implementation; independent visual review pending. r20 page type: **Record detail with Document & evidence workspace and Review / comparison**. Route `/service/incidents/[id]`.

## Purpose and handovers

Capture an exact factual event separately from an inspection defect, corrective Activity, readiness acknowledgement and technical acceptance. Incoming Service/field appointment, work order, Customer/Site, Equipment/configuration, FI-05 and FI-03/FI-04 sources are explicit. Outgoing commands create real owned My Work Activities, restrict current readiness/Start and exact inspection release, and issue an internal scoped outcome. No appointment, customer, project or Finance completion is implied.

## Desktop

Accepted design: the [Incidents and corrective actions design decision](../../../decisions/incidents-figma-design.md) of 18 October 2026, with captures 02–05 in [design r01](../../../reference/ui/quality-site-assurance/incidents-design-r01/README.md).

- **Layout:** the SV-06 record layout (D2): a header with state, reporter and latest event; a "Before closure" bar (hold, assessment, corrective actions, action evidence, incident content, current sources); a summary column with Summary, Affected scope and Visit; tabs Factual report, Triage and review, Actions, Evidence and History.
- **Hold card:** first on the Factual report tab. It names the held scope, says readiness and Start for later visits are held and that attendance, timers and inspection evidence continue. Only closure releases it (D3).
- **Triage:** assessment, priority, accountable owner and due time with a written basis, the report summarised above (D4). Due times show site time and are stored in UTC (Q3). A linked inspection defect is entered here (Q4).
- **Actions and evidence:** each action shows its My Work activity and completion; evidence files show size and hash; a separate person accepts or returns them with a reason (D5).
- **Closure:** the prepared internal outcome, what it keeps (restricted details stay out) and a preview; "Close incident" is the primary action (D6).
- Nothing new is built.

At 1440 and 1024 px use the existing padded shell, PageHeader, wrapped cards and paired fields; #main owns the only content scroll. Show exact affected scope, current source state, authority, original reporter and attributable history. Evidence hashes wrap; file links open exact verified bytes. Show words for held/unknown/current/historical status. Use existing 8 px card radius rather than r20's 7 px: declared inherited token adaptation, pending owner review.

## Mobile

Accepted design: capture 11 in [design r01](../../../reference/ui/quality-site-assurance/incidents-design-r01/README.md), the reporter's phone view of a submitted, held report: Report, Triage, Actions and History tabs, the hold card ("Until closure"), "Your report" with its version, and Open visit and Add evidence.

At 390 and 320 px stack fields and decisions, preserve 16 px labels/input and 44 px targets. Long source IDs and hashes wrap. No horizontal page overflow or nested scrolling. Keep correction/recovery, evidence audience and closure exclusions available. Verify keyboard completion, guide Escape/focus return and actual browser zoom 200%; emulator evidence does not grant device acceptance.

## Shared controls and recovery

Reuse Button, Field, ErrorNotice, ReadState, native fieldset/select/details and identity-scoped recoverable commands. Draft, unsaved, saving, conflict, failed, uncertain, denied, empty, returned, overdue and historical-output states are separate. Correctable input retains its original expected version; compare current history and explicitly adopt the current version. A pending request retains original operation ID/payload across same-tab reload. A recovered create leads to the saved incident before explicitly starting another report. Refresh denial clears protected data; connection failure labels last-known context and disables new commands. No incident operation is queued offline.

## Proposed reference and adaptations

Accepted Figma design: [Incidents and corrective actions design r01 captures](../../../reference/ui/quality-site-assurance/incidents-design-r01/README.md) (twelve icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/incidents-figma-design.md). Images of the Evidence and History tabs in full, correction after a return, reopening, rebinding, adopting a reassigned activity, the tablet record and denied states are still missing.

[Quality r01 HTML](../../../reference/ui/quality-site-assurance/PPO-Quality-Safety-and-Site-Assurance-Workspace-r01.html), Incidents & corrective actions and Review & release, plus its companion report, remains proposed reference material. Exact source/token comparison is in tests/browser/field-incidents.spec.ts. In-flow history/evidence replaces the reference's combined right panel; register, capture and review are actual separate routes. Accepted native desktop/phone mockup images are **missing**. Implementation captures are verification evidence, not baseline adoption. Issued sources are unchanged.

## Verification and guide

Working guide `guide.route-service-incidents-id`; [contract](../../../contracts/field-incidents.md), [acceptance matrix](../../../testing/field-incidents-acceptance.md), [actual evidence](../../../testing/evidence/field-incidents/README.md). Review status and fingerprint stay unset pending actual independent visual acceptance; source presence, functional proof and deployment remain separate.

## Recorded technical inspection — 2 October 2026

Agent inspection of final compiled build `AeYSVMnsm8P5WGqr_9cEb`: [exact register/capture/record/evidence captures at 1440, 1024, 390 and 320 px, actual 200% zoom and reference comparisons](../../../testing/evidence/field-incidents/README.md#inspected-layout-and-exact-output). Labels and hashes wrap, fields reflow and one content scroll owner is measured. This records implementation inspection only. Independent owner, device, screen-reader and visual acceptance remain pending; no review fingerprint is adopted.
