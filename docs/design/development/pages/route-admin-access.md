# Users and access

Stable entry: `route:/admin/access`. Scope: AD-01. Owner: Dean Fiedler. Status: Draft; owner visual review pending.

## Purpose and authority

Inspect current workspace identities and grants using an active Workspace admin.access.read grant. Clear the working company before workspace inspection. Native read-only increment; no provisioning, role/team membership, changes, attestation or invented grant history.

## Desktop

Accepted design: the [Users and access design decision](../../../decisions/users-and-access-figma-design.md) of 19 October 2026 draws this register as a grid of identities with current, scheduled and expired grant counts, scope reach, local teams, open requests and last grant change, under one Administration side menu (D1, D2). Captures 01 and 09 in [design r01](../../../reference/ui/access-review/users-and-access-design-r01/README.md). Nothing new is built; the native page described below remains the built page.

Use the application shell, PageHeader, native record cards, Field/SelectField, ReadState, Status and shared Button. At 1440 × 960 and 1024 × 768, keep clear identity, grant scope and validity; wrap long capability keys and show exact ERP company keys beside same-name companies. The directory searches literal name text, filters active/inactive and pages in groups of 50. The person route is the proposed native adaptation of the reference's persistent inspector.

## Mobile

Accepted design: captures 10 and 13 in [design r01](../../../reference/ui/access-review/users-and-access-design-r01/README.md): the Active list with the adopted compact header, and five phone states, including inspection not permitted and working company selected.

At 390 × 844 and 320 px, stack labelled grant cards and controls. Keep company key, site number, validity and eligibility result available without a wide permission matrix. Shared controls retain focus indicators, 16 px inputs and phone targets. Verify no horizontal page overflow, keyboard order and readable long keys.

## States and recovery

Loading hides prior records; error offers the existing retry; denied or expired authority clears the data. Empty/filtered-empty has explicit copy. Hosted names and subject identifiers remain masked. Explain checks the server at submit time; changing any input clears the old explanation. Refresh reads current authority again. A positive grant result does not approve business actions or verify hosted authentication.

## Sources and handovers

Existing reference: [AD-01 working HTML](../../access-review/access-review.html); original [issued r01](../../../reference/ui/access-review/PPO-Users-Roles-and-Access-Review-r01.html). Native scope [decision](../../../decisions/access-review-native.md). Incoming: users, exact grants and company/site keys; outgoing: current grant eligibility only. Draft guide is linked in the live register.

## Evidence and open review

Accepted Figma design: [Users and access design r01 captures](../../../reference/ui/access-review/users-and-access-design-r01/README.md) (thirteen icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/users-and-access-figma-design.md). The list read needs grant counts by state, scope reach, teams and open requests (Q1). Building it is not decided; the native page remains the built page.

[Execution ledger](../../../testing/evidence/access-inspection/README.md). The execution ledger links source-bound native and reference captures at 1440/390/320 px and records the observed layout differences. These are implementation/reference evidence, not accepted mockups. Owner, physical-device, keyboard/zoom and screen-reader review remain open; accepted native images are still missing. No review fingerprint is set by implementation.

## Capability catalogue continuation

Browse the capability catalogue from people/person access to inspect permissions across the workspace. Holder links carry the capability and matching company/site into the person form; they never imply a positive result. Submit a fresh eligibility check. See the [catalogue contract](route-admin-access-capabilities.md), [holder contract](route-admin-access-capabilities-id.md) and [execution ledger](../../../testing/evidence/access-capabilities/README.md). Existing review records remain unchanged.

The [CPQ live implementation](../../../decisions/cpq-figma-ui.md) extends the generated hosted tester fixture from 31 to 34 duties with cpq.read, cpq.author and cpq.calculate. Company A scope and invitation expiry remain explicit. Review and publish remain absent; the catalogue is inspection, not a hosted grant-changing command. This derived-reference update grants no new visual acceptance.

## Proposed-role continuation

Users and access links to the seven proposed bundles; Person access links to the exact company/site comparison. See the [role comparison contract](route-admin-access-id-roles.md) and [evidence](../../../testing/evidence/access-roles/README.md). This implements inspection only; teams, assignments, access-changing commands and campaigns remain open. Existing captures retain their original source and do not establish review of the new links.

## Request and independent-review continuation

Local synthetic single-add proposals can be submitted and independently decided from [Access-change requests](route-admin-access-requests.md). Approved remains ineffective: apply, teams and campaigns remain open. Existing captures retain their original source; no acceptance of the new handover is inferred.
