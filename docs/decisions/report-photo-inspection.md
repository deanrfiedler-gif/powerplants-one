# Submitted photo inspection in Service review

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Direction: 8 October 2026. Implementation verification in progress; owner/device acceptance pending.

Dean authorised continuing the bounded quality work and proceeding to its next step. The [quality increment](product-direction-quality.md), published in [draft PR #370](https://github.com/deanrfiedler-gif/powerplants-one/pull/370), proved the large offline submission reaches Service review with exact photo references. It also confirmed that the reviewer has no photo-inspection action. This implements the evidence-inspection task already described by the [Service review workspace](service-review-reports-workspace-design.md), within SV-06. It adopts no CREMS parity requirement.

## Actor, outcome and boundary

The current permitted Service review owner can inspect the original PNG for a Photo entry of an exact submitted report revision. A general report reader, technician assignment, Systems identity or old owner does not grant this inspection permission. The existing field-photo endpoint remains technician-scoped. Customer presentations and report issue/rendering are unchanged; inspecting a photo does not approve an entry, issue a report, record a response or distribute an image.

The endpoint explicitly requires report ID, revision ID and attachment ID. It checks the existing report.review/report.read scope and current Service owner, revision membership, immutable snapshot hash, matching original Photo entry references, attendance/author/appointment binding, RestrictedService access, Available state, PNG type, version, byte count and SHA-256. Original bytes are retrieved through the existing protected store and inspected as bounded PNG. Current authority and binding are read again after storage retrieval. There is no latest-photo or latest-revision fallback.

Exact historical revisions remain retrievable by the current scoped reviewer, including after a successor changes the photo. The first UI increment offers inspection only inside the current Submitted review form. Historical inspection navigation is separate future work. Available attachment identity/access/state is immutable under the existing database trigger; this increment neither bypasses that trigger nor adds a grant, migration, capability or storage provider.

## User interaction and recovery

Inspect submitted photo opens an inline image on demand; there is no automatic fetch of every report photo. Hide submitted photo removes it. Loading, refusal, changed bytes and retry are explicit. The existing caption describes the image; the figure identifies the report revision. The image fits the page on desktop and phone, and the shared button supports keyboard operation and visible focus.

The browser independently checks the response hash and byte count against the selected snapshot. It aborts pending retrieval and revokes the temporary image URL when hidden, refreshed, unmounted or replaced by different identity/report/revision/attachment content. An unsuccessful report refresh suppresses inspection while retaining surrounding review wording. Retry cannot reuse a previously displayed image. Images are not placed in local storage, IndexedDB or the offline queue. Responses are private/no-store with a fixed PNG type and nosniff policy.

## Verification and acceptance

Meaningful proof covers exact bytes, real peer-report and historical-revision substitution, unrelated identities, current owner/grant/actor changes, revocation during storage retrieval, missing/corrupt originals, attachment immutability and unchanged report/review/receipt state. Desktop and phone proof covers on-demand inspection, refusal/retry, byte mismatch, retained entry decision/reason, refresh, URL cleanup and identity change. Injected browser failures are distinguished from real server permission checks.

The [execution record](../testing/evidence/report-photo-inspection/README.md) retains actual results and source identities. The [working page specification](../design/development/pages/route-service-reports-id.md), guide and component catalogue are updated without assigning review fingerprints. Synthetic execution and automated source review do not grant owner visual, physical-device, screen-reader or operational acceptance. No merge or deployment is included.
