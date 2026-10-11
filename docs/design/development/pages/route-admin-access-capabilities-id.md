# Capability grants

Stable entry: `route:/admin/access/capabilities/[id]`. Scope: AD-01. Owner: Dean Fiedler. Status: Draft; owner visual review pending.

## Purpose and page type

Read-only capability inspection using current Workspace admin.access.read authority with the working company cleared. Register / worklist and Record detail from r20. Filter Grant scope and Grant state; return to page one after applying filters. Show at most 50 stable-ordered grant cards with person, scope, exact company ERP key/site number and validity dates. Opening a person carries the capability and matching scope into the explanation form but does not run a check. Inactive identity takes precedence over grant dates.

## Desktop

Reuse the application shell, PageHeader, Field/SelectField, Button, ReadState, Status and Stamp. At 1440 × 960 and 1024 × 768 use the existing record-grid/cards; wrap long keys. Keep company ERP keys and site numbers next to names. Retain a visible route back to the catalogue or people directory. The retained AD-01 design combines capabilities and proposed roles/teams in a work queue with a persistent inspector; separate native routes/cards are a proposed adaptation, not an accepted replacement.

## Mobile

At 390 × 844 and 320 CSS px stack cards and labelled fields. No permission matrix or page-wide horizontal overflow. Preserve every scope/date fact, empty state and navigation control. Long capability keys wrap, key-first company text remains readable and shared focus/target styles apply. Check keyboard order, 200% zoom and device behaviour separately.

## States and recovery

Loading hides prior records. Read failure offers Retry; permission loss or selected working company hides prior details. Empty filters are distinct from unavailable data and from an unassigned capability. Hosted names/provider identifiers remain masked; email.connect is clearly hosted-demo-only. Current grants do not imply authentication, record access, assignments or domain approval. Refresh rechecks current authority. No write command exists.

## Sources and handovers

Existing [working AD-01 HTML](../../access-review/access-review.html), capabilities view; original [issued r01](../../../reference/ui/access-review/PPO-Users-Roles-and-Access-Review-r01.html). [Native decision](../../../decisions/access-review-native.md). Incoming: canonical capability keys and real workspace grant rows. Outgoing: person inspection with selected capability/company/site, followed by an explicit fresh eligibility check. No role/team membership is inferred.

## Evidence and open review

[Execution ledger](../../../testing/evidence/access-capabilities/README.md) records 16 database checks, 15 native browser checks and twelve source-bound native/reference captures at 1440/390/320 px, with explicit observed adaptations. Accepted native mockup images are missing. Owner visual review, physical-device, zoom and screen-reader acceptance remain pending. No review fingerprint is assigned by implementation and no deployment is claimed.


## Local review API boundary

The [attestation contract](../../../decisions/access-review-attestations.md) introduces `admin.access.review.attest` (137 current capability keys) and immutable local single-grant Keep records. The broad retained `admin.access.review` remains proposed campaign authority; it is not inferred from a lead label. No native attestation form or new page/layout is delivered. Existing roster counts/person links are still read-only. Shared component implementations, fixtures and consumer bindings are unchanged. Native review images are missing; existing historical captures and pending owner review remain separate. API/upgrade evidence: [execution ledger](../../../testing/evidence/access-review-attestations/README.md).
