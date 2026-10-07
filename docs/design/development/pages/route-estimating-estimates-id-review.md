# Saved estimate review — native design contract

<!-- versioning: git; committed history is authoritative -->

Stable key: `route:/estimating/estimates/[id]/review`. Scope ES-04. Owner: Dean Fiedler. Draft for visual review; source baseline `6e8b898`.

## Purpose and source

Submit the exact saved estimate, independently review completeness/source prices/technical facts, return findings and review attributable correction. Preserve review history and applicability separately from commercial approval. r20 page type: Review / comparison with Record detail and evidence forms. Reference: [ES-04 r01](../../../reference/ui/estimate-review/PPO-Estimate-Review-and-Pricing-Exceptions-r01.html). Exact native desktop/mobile reference images are unavailable.

## Desktop

At 1440 × 960 and 1024 × 768 retain the PPO shell, one content scroll owner, record title, exact saved-version link, current source panel and review sequence. Three cards show the separate review kinds and original decision provenance. Expand submitted scope/cost evidence without losing entered text. Rationale, correction responses or independent-decision form precede immutable history. Keep unknown outcomes ahead of new commands. Long IDs wrap; no horizontal page overflow.

## Mobile

Cards stack below 900 CSS px. At 390 × 844 and 320 × 700 retain every finding, response and original-operation action. Use shared controls, native labels, visible focus, keyboard disclosures and 44 px targets. Verify 200% zoom separately from viewport emulation. No offline command is offered. Physical devices and screen readers remain unverified.

## Components, handovers and departures

Reuse the `estimate-review` host component, shared Button/ButtonLink, fields, validation, Status and original-command recovery. Existing `est-panel` spacing is bounded legacy reuse; new colours/radii use shared tokens and avoid legacy estimate button overrides. Incoming saved estimates retain their source identities and exact bytes. Outgoing Reviewed evidence does not grant commercial approval, technical release, quote issue or downstream work.

The reference's six views, queue and fictional thresholds remain reference-only. This native increment is an exact record page reached from the saved estimate. The adaptation is proposed for owner review, not an accepted visual baseline. Missing policy is Not configured. Loading, empty, unavailable, owner/reviewer/read-only, stale basis, Returned, Reviewed and unknown-original outcomes are required states.

## Evidence and guide

The draft guide `guide.route-estimating-estimates-id-review` contains prerequisites, tasks, outcomes and recovery. Host fixtures in `tests/browser/estimating-review.spec.ts` use actual scoped synthetic records for all implemented states. See [executed evidence](../../../delivery/estimating-review-handover.md). Source presence, functional proof, visual review, owner acceptance and deployment remain separate. No review fingerprint has been asserted as accepted.

## Inspected synthetic viewport captures

[Desktop reviewed overview](../../../testing/evidence/estimating-review/reviewed-overview-desktop.png) and [320px review basis](../../../testing/evidence/estimating-review/review-basis-320.png) were inspected against native source `8e3d348`; [provenance and limits](../../../testing/evidence/estimating-review/manifest.json). These are runtime captures, not adopted reference designs. Full visual/owner review stays pending.

## NAV contextual navigation

Breadcrumb identity names Estimate review. The loaded exact reference/version/title is retained separately from approval and quotation issue. Parent navigation and source record links retain their distinct purposes.

Desktop uses the existing shell with a 76 px compact or 232 px labelled primary rail. Mobile uses labelled destinations and More > Workspace; Home/search/help remain reachable. Check 320/390/780/781/1199/1200 px where applicable, long labels, visible focus and Escape/return focus. Missing accepted images remain explicit; no new accepted image or review fingerprint is recorded. Functional results and screenshot observations are in the NAV ledger; owner/device review and deployment remain separate.
