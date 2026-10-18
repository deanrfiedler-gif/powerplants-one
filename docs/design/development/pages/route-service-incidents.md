# service / incidents — working design

<!-- versioning: git; committed history is authoritative -->

Stable entry `route:/service/incidents`; scope FI-06. Owner Dean Fiedler. Native implementation; independent visual review pending. r20 page type: **Register / worklist**. Route `/service/incidents`.

## Purpose and handovers

Capture an exact factual event separately from an inspection defect, corrective Activity, readiness acknowledgement and technical acceptance. Incoming Service/field appointment, work order, Customer/Site, Equipment/configuration, FI-05 and FI-03/FI-04 sources are explicit. Outgoing commands create real owned My Work Activities, restrict current readiness/Start and exact inspection release, and issue an internal scoped outcome. No appointment, customer, project or Finance completion is implied.

## Desktop

Accepted design: the [Incidents and corrective actions design decision](../../../decisions/incidents-figma-design.md) of 18 October 2026, with captures 01 (desktop 1440 × 900) and 07 (tablet 1024) in [design r01](../../../reference/ui/quality-site-assurance/incidents-design-r01/README.md).

- **Register:** a grid, one row per incident (D1). Columns: Incident, Summary, Classification, State, Hold, Priority, Actions, Reported, Reporter and Site. The toolbar keeps Reporter, Site, and the count with its read time.
- **Views:** All incidents; Triage (Awaiting triage, In review, Clarification or returned, On hold); Follow-through (Holding work, Actions open, Ready to close, Closed), in the side menu (D1).
- **Holds:** a submitted report holds its exact scope until closure, so every open incident shows "Scope held". Triage does not release it.
- **Shell:** the proposed Conversations action sits left of the information icon; the shared shell change is still open.
- Nothing new is built.

At 1440 and 1024 px use the existing padded shell, PageHeader, wrapped cards and paired fields; #main owns the only content scroll. Show exact affected scope, current source state, authority, original reporter and attributable history. Evidence hashes wrap; file links open exact verified bytes. Show words for held/unknown/current/historical status. Use existing 8 px card radius rather than r20's 7 px: declared inherited token adaptation, pending owner review.

## Mobile

Accepted design: no phone register is drawn; the tablet register at 1024 is capture 07 in [design r01](../../../reference/ui/quality-site-assurance/incidents-design-r01/README.md), with the side menu collapsed.

At 390 and 320 px stack fields and decisions, preserve 16 px labels/input and 44 px targets. Long source IDs and hashes wrap. No horizontal page overflow or nested scrolling. Keep correction/recovery, evidence audience and closure exclusions available. Verify keyboard completion, guide Escape/focus return and actual browser zoom 200%; emulator evidence does not grant device acceptance.

## Shared controls and recovery

Reuse Button, Field, ErrorNotice, ReadState, native fieldset/select/details and identity-scoped recoverable commands. Draft, unsaved, saving, conflict, failed, uncertain, denied, empty, returned, overdue and historical-output states are separate. Correctable input retains its original expected version; compare current history and explicitly adopt the current version. A pending request retains original operation ID/payload across same-tab reload. A recovered create leads to the saved incident before explicitly starting another report. Refresh denial clears protected data; connection failure labels last-known context and disables new commands. No incident operation is queued offline.

## Proposed reference and adaptations

Accepted Figma design: [Incidents and corrective actions design r01 captures](../../../reference/ui/quality-site-assurance/incidents-design-r01/README.md) (twelve icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/incidents-figma-design.md). Images of a phone register, register states and hover states are still missing.

[Quality r01 HTML](../../../reference/ui/quality-site-assurance/PPO-Quality-Safety-and-Site-Assurance-Workspace-r01.html), Incidents & corrective actions and Review & release, plus its companion report, remains proposed reference material. Exact source/token comparison is in tests/browser/field-incidents.spec.ts. In-flow history/evidence replaces the reference's combined right panel; register, capture and review are actual separate routes. Accepted native desktop/phone mockup images are **missing**. Implementation captures are verification evidence, not baseline adoption. Issued sources are unchanged.

## Verification and guide

Working guide `guide.route-service-incidents`; [contract](../../../contracts/field-incidents.md), [acceptance matrix](../../../testing/field-incidents-acceptance.md), [actual evidence](../../../testing/evidence/field-incidents/README.md). Review status and fingerprint stay unset pending actual independent visual acceptance; source presence, functional proof and deployment remain separate.

## Recorded technical inspection — 2 October 2026

Agent inspection of final compiled build `AeYSVMnsm8P5WGqr_9cEb`: [exact register/capture/record/evidence captures at 1440, 1024, 390 and 320 px, actual 200% zoom and reference comparisons](../../../testing/evidence/field-incidents/README.md#inspected-layout-and-exact-output). Labels and hashes wrap, fields reflow and one content scroll owner is measured. This records implementation inspection only. Independent owner, device, screen-reader and visual acceptance remain pending; no review fingerprint is adopted.

## NAV contextual navigation

Incidents and actions is a permitted Service destination; exact incident/source and original recovery remain.

Desktop uses the existing shell with a 76 px compact or 232 px labelled primary rail. Mobile uses labelled destinations and More > Workspace; Home/search/help remain reachable. Check 320/390/780/781/1199/1200 px where applicable, long labels, visible focus and Escape/return focus. Missing accepted images remain explicit; no new accepted image or review fingerprint is recorded. Functional results and screenshot observations are in the NAV ledger; owner/device review and deployment remain separate.
