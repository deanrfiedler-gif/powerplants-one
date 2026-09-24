# Field Site readiness — native page contract

Stable entry: route:/my-jobs/site-readiness, scope FI-05. Draft; owner review pending. See the [FI-05 master](scope-fi-05.md) for the page-specific workflow, authority and incoming/outgoing handovers. The bare route lists permitted assigned visits; `appointment_id` selects the exact visit, with `record_id`, `activity` and `facility_ids` restoring explicit review context.

## Desktop

Use the existing shell and shared PageHeader, ReadState, Button, Field and ValidationFields. Retain one scrolling owner. Order the visit/Site context, explicit selection, current source/requirements and personal retained reviews. Links return to CS-06 and the same job. Verify 1440 × 960, 1024 × 768 and 820 px. Shared original-operation controls preserve an uncertain acknowledgement while sources refresh.

## Mobile

Stack the same sections at 390 × 844 and 320 CSS px. Preserve all blockers, labels and 44 px controls. Verify long source text, visible focus, keyboard order and 200% zoom. No page-specific dialog or second shell is introduced. The current increment is online; local form state is not a durable offline save.

## Evidence and boundaries

Source: src/app/(business)/my-jobs/site-readiness/page.tsx. Proposed presentation reference: [Quality/Site Assurance r01](../../../reference/ui/quality-site-assurance/PPO-Quality-Safety-and-Site-Assurance-Workspace-r01.html). Exact source image is missing; do not substitute an unrelated mockup. Native adaptation uses vertically ordered cards within the existing shell, without copying the standalone fixture's release/hold policy. [Programme evidence](../../../delivery/field-quality-native-handover.md) records checks as executed. Source presence, visual review, functional proof, owner/device acceptance and deployment remain separate.
