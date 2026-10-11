# Compare proposed role bundle

Stable entry: `route:/admin/access/[id]/roles`. Scope: AD-01. Owner: Dean Fiedler. Status: Draft; owner visual review pending.

## Purpose and page type

Compare one proposed bundle revision with one person's current grants at a selected company or site. Use r20 Register / worklist for the catalogue and Record detail for the person comparison. Require current Workspace admin.access.read and a cleared reviewer working company. D-020 remains open. Display source r01/r02 as retained proposal issues; the live page and master have stable names.

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
