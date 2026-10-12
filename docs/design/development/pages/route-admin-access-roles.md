# Proposed role bundles

Stable entry: `route:/admin/access/roles`. Scope: AD-01. Owner: Dean Fiedler. Status: Draft; owner visual review pending.

## Purpose and page type

Inspect seven retained business/approval role proposals, including exact source revisions and capability lists. Use r20 Register / worklist for the catalogue and Record detail for the person comparison. Require current Workspace admin.access.read and a cleared reviewer working company. D-020 remains open. Display source r01/r02 as retained proposal issues; the live page and master have stable names.

## Desktop

Reuse the current shell, PageHeader, Button, ReadState, Status and Stamp, with SelectField on the comparison. At 1440 × 960 and 1024 × 768 use the shared card grid, spacing, typography and focus styles. The catalogue uses native details to reveal each capability list; its Draft delta stays visible. Comparison fields precede exact result context and labelled per-capability cards. Keep company ERP keys/site numbers beside names. Separate routes/cards replace the retained persistent inspector as a proposed adaptation, pending owner acceptance.

## Mobile

At 390 × 844 and 320 CSS px stack cards and fields, wrap long capability keys, preserve full status text and retain visible return links. No page-wide horizontal overflow or permission matrix. Use labelled native selects and details summaries, shared targets and visible focus. Verify actual device, keyboard, zoom and screen reader separately.

## States and recovery

Proposed/Draft never means adopted. Inactive, future, expired, unrelated-company and unrelated-site grants cannot match the selected scope. Any form change clears results; explicit Compare current grants repeats current server checks. Loading or errors hide prior results. Denied/working-company responses clear person context. Retry after those refusals reloads context; it cannot restore access. Hosted names are masked and authentication validity remains separate. No write control exists.

## Sources and handovers

[Working AD-01 HTML](../../access-review/access-review.html), role catalogue and person bundle comparison; [issued r01](../../../reference/ui/access-review/PPO-Users-Roles-and-Access-Review-r01.html); [native decision](../../../decisions/access-review-native.md). Seven retained business/approval proposals come from docs/design/access-review/model.js; the operator-managed hosted tester set is excluded. Incoming: exact proposal revision, actual person, company/site and current grants. Outgoing: capability holder inspection or explicit fresh Person access explanation. No role membership or team is inferred.

## Evidence and open review

[Execution ledger](../../../testing/evidence/access-roles/README.md) separates functional proof, implementation captures and reference observations. Accepted native mockup images are missing. Owner/device/zoom/screen-reader acceptance and deployment remain pending. No review fingerprint is assigned by implementation.


## Proposed team inspection continuation

The existing card catalogue includes the exact Service coordination and Finance handoff proposals from the retained model, at its fixed 17 September 2026 example clock. Show the proposed lead and a keyboard-operable Example roster disclosure. Preserve source names and date text, alongside separately labelled current local identity names and active/inactive state. Do not infer live membership or authority. Design-only and unavailable local identities have no person link; hosted identities never resolve behind retained IDs. Exact current local links hand over to independently checked Person access.

This small existing-page refinement uses ADR-0053 rule 6. The same r20 Register / worklist, grid, disclosure, shared Button/ReadState, target sizes and wrap rules apply at 1440/390/320 widths. No new layout, page, shared export or Figma design is adopted. Loading/error/refusal hides both role and team cards; Refresh proposals rechecks current inspection authority. The retained design's team-lead preview and routing remain unimplemented. Persisted memberships, campaigns and D-020 remain open.

[Team contract](../../../decisions/access-team-inspection.md) and [execution ledger](../../../testing/evidence/access-teams/README.md) preserve source/proof boundaries. Accepted native images are still missing; implementation captures are observations only, with no owner review fingerprint assigned.

Implementation observations at `17c4827`: [desktop section](../../../testing/evidence/access-teams/native-1440-teams.png), [390 px proposal](../../../testing/evidence/access-teams/native-390-teams.png), [390 px identity links](../../../testing/evidence/access-teams/native-390-finance.png), [320 px proposal](../../../testing/evidence/access-teams/native-320-teams.png) and [320 px identity links](../../../testing/evidence/access-teams/native-320-finance.png). Compare [retained desktop Teams](../../../testing/evidence/access-teams/reference-1440-teams.png) and phone references in the ledger. Icons are capture-only square placeholders. Phones require scrolling and retain the existing truncated shell title; no page-wide overflow was observed. These are source-bound observations, not accepted mockups or owner review.

## Saved local team record inspection — 11 October 2026

The [local team contract](../../../decisions/access-local-teams.md) adds immutable local records and initial rosters. `/admin/access/roles#saved-local-teams` reuses record-grid/card styles, Button, ReadState and Stamp. Retained team examples remain separately labelled. Incoming data is the local team API; outgoing inspection is the exact original roster and audit-linked creation history. There is no native creation/editing form or membership-derived authority.

At desktop widths, use the existing card grid. At 390/320 px, stack cards and wrap UUIDs, names, purpose and reason using `narrative`. Keyboard Enter/Space opens/closes the selected roster; pagination and Refresh saved teams are shared buttons. Collection loading and unavailable reads hide saved cards; detail loading hides the previous roster while retaining the opener and its focus; denied inspection clears the protected catalogue. Identity activity is current, while the roster is the immutable initial record. No source join/expiry dates are copied into it.

Host fixtures live in `tests/browser/access-local-teams.spec.ts`; exact-record/concurrency/rollback and upgrade fixtures live in `tests/database/access-local-teams.test.ts`. Evidence and source-bound desktop/phone captures: `docs/testing/evidence/access-local-teams/README.md`. This is a small existing-page refinement under ADR-0053 rule 6. An accepted native Figma image is missing; the retained AD-01 HTML is a workflow reference, not visual acceptance of this addition. Owner, screen-reader and physical-device acceptance remain open; no review fingerprint is granted.

Actual implementation review: [six source-bound captures and observations](../../../testing/evidence/access-local-teams/review.md), source `039df64`, 1440/390/320 widths. No horizontal document overflow observed. Existing phone-title truncation, card height and vertical scrolling remain explicit limits; owner acceptance is still pending.

Fresh roster details replace cached lead/creator labels on the selected card; closing retains the newer snapshot. Collection refresh/paging clears it. `access-local-teams.spec.ts` includes a distinct presentation fixture for this state; it does not claim a server identity change.
