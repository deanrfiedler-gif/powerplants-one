# Field Site readiness — native page contract

Stable entry: route:/my-jobs/site-readiness, scope FI-05. Draft; owner review pending. See the [FI-05 master](scope-fi-05.md) for the page-specific workflow, authority and incoming/outgoing handovers. The bare route lists permitted assigned visits; `appointment_id` selects the exact visit, with `record_id`, `activity` and `facility_ids` restoring explicit review context.

## Desktop

Use the existing shell and shared PageHeader, ReadState, Button, Field and ValidationFields. Retain one scrolling owner. Order the visit/Site context, explicit selection, current source/requirements and personal retained reviews. Links return to CS-06 and the same job. Verify 1440 × 960, 1024 × 768 and 820 px. Shared original-operation controls preserve an uncertain acknowledgement while sources refresh.

## Mobile

Stack the same sections at 390 × 844 and 320 CSS px. Preserve all blockers, labels and 44 px controls. Verify long source text, visible focus, keyboard order and 200% zoom. No page-specific dialog or second shell is introduced. The current increment is online; local form state is not a durable offline save.

## Evidence and boundaries

Source: src/app/(business)/my-jobs/site-readiness/page.tsx. Proposed presentation reference: [Quality/Site Assurance r01](../../../reference/ui/quality-site-assurance/PPO-Quality-Safety-and-Site-Assurance-Workspace-r01.html). [Hashed exact reference/native captures](../../../testing/evidence/field-readiness-native/README.md) retain the implementation agent's comparison. Native adaptation uses vertically ordered cards within the existing shell, without copying the standalone fixture's release/hold policy. [Programme evidence](../../../delivery/field-quality-native-handover.md) records checks as executed. Actual 200% browser zoom and physical-device acceptance remain pending. Source presence, visual review, functional proof, owner/device acceptance and deployment remain separate.

## NAV contextual navigation

Field site readiness has a specific breadcrumb. Hosted offline recovery explains unavailability; local originals retain their existing supported offline routes.

Desktop uses the existing shell with a 76 px compact or 232 px labelled primary rail. Mobile uses labelled destinations and More > Workspace; Home/search/help remain reachable. Check 320/390/780/781/1199/1200 px where applicable, long labels, visible focus and Escape/return focus. Missing accepted images remain explicit; no new accepted image or review fingerprint is recorded. Functional results and screenshot observations are in the NAV ledger; owner/device review and deployment remain separate.

## Owner visual review — 9 October 2026

- **Reviewer:** Dean Fiedler. He accepted Claude's proposed verdicts from the phase 00 review boards (navigation canvas version 29).
- **Result:** Accept with minor fixes.
- **Evidence:** [phase 00 review, session 1](../../../testing/evidence/ui-review-phase-00-r01/README.md). Synthetic data; compiled build at `a52cb01`; 1440 × 900 and 390 × 844 headless Chromium, captures for this entry.
- **Findings:** The header says 'Field site readiness' (truncated); the page says 'Site readiness'. S4 back link.
- **Scope of this record:** visual review of the captured state only. Device, screen-reader, zoom and operational acceptance remain separate. A later source change marks this review stale.
