# service / incidents / new — working design

<!-- versioning: git; committed history is authoritative -->

Stable entry `route:/service/incidents/new`; scope FI-06. Owner Dean Fiedler. Native implementation; independent visual review pending. r20 page type: **Form / guided workflow**. Route `/service/incidents/new`.

## Purpose and handovers

Capture an exact factual event separately from an inspection defect, corrective Activity, readiness acknowledgement and technical acceptance. Incoming Service/field appointment, work order, Customer/Site, Equipment/configuration, FI-05 and FI-03/FI-04 sources are explicit. Outgoing commands create real owned My Work Activities, restrict current readiness/Start and exact inspection release, and issue an internal scoped outcome. No appointment, customer, project or Finance completion is implied.

## Desktop

At 1440 and 1024 px use the existing padded shell, PageHeader, wrapped cards and paired fields; #main owns the only content scroll. Show exact affected scope, current source state, authority, original reporter and attributable history. Evidence hashes wrap; file links open exact verified bytes. Show words for held/unknown/current/historical status. Use existing 8 px card radius rather than r20's 7 px: declared inherited token adaptation, pending owner review.

## Mobile

At 390 and 320 px stack fields and decisions, preserve 16 px labels/input and 44 px targets. Long source IDs and hashes wrap. No horizontal page overflow or nested scrolling. Keep correction/recovery, evidence audience and closure exclusions available. Verify keyboard completion, guide Escape/focus return and actual browser zoom 200%; emulator evidence does not grant device acceptance.

## Shared controls and recovery

Reuse Button, Field, ErrorNotice, ReadState, native fieldset/select/details and identity-scoped recoverable commands. Draft, unsaved, saving, conflict, failed, uncertain, denied, empty, returned, overdue and historical-output states are separate. Correctable input retains its original expected version; compare current history and explicitly adopt the current version. A pending request retains original operation ID/payload across same-tab reload. A recovered create leads to the saved incident before explicitly starting another report. Refresh denial clears protected data; connection failure labels last-known context and disables new commands. No incident operation is queued offline.

## Proposed reference and adaptations

[Quality r01 HTML](../../../reference/ui/quality-site-assurance/PPO-Quality-Safety-and-Site-Assurance-Workspace-r01.html), Incidents & corrective actions and Review & release, plus its companion report, remains proposed reference material. Exact source/token comparison is in tests/browser/field-incidents.spec.ts. In-flow history/evidence replaces the reference's combined right panel; register, capture and review are actual separate routes. Accepted native desktop/phone mockup images are **missing**. Implementation captures are verification evidence, not baseline adoption. Issued sources are unchanged.

## Verification and guide

Working guide `guide.route-service-incidents-new`; [contract](../../../contracts/field-incidents.md), [acceptance matrix](../../../testing/field-incidents-acceptance.md), [actual evidence](../../../testing/evidence/field-incidents/README.md). Review status and fingerprint stay unset pending actual independent visual acceptance; source presence, functional proof and deployment remain separate.
