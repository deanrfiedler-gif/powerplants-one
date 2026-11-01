# Engineering workload and deliverables — design reference

Stable entry: `scope:EN-01`. Owner: Dean Fiedler. Application destination: `/engineering`.
Status: **Implementation under validation; visual review and owner acceptance pending**.
Parent trace: ENG-01–ENG-04. No parent ID is changed.

## Purpose and task

Coordinate permitted Engineering packages and follow accountable deliverables, author actions, assigned reviews and current exact formal issues. Package coordination cannot approve or release technical content. Actual effort, availability and utilisation remain unknown.

## Desktop

The [route contract](route-engineering.md) is the authoritative composition and interaction specification for the accepted rail, secondary menu, compact toolbar, shared grid, overlapping snapshot and selected-package panel. It names every native queue, filter, column, server sort and exact-package handover. [Accepted captures 01–03](../../../reference/ui/engineering/engineering-workload-design-r01/README.md) replace the r02 composition for this register; the issued r02 source and full package route remain unchanged.

## Mobile

The route contract applies the shared phone header and Engineering's five-icon navigation to the flush list and full-screen snapshot. It requires 390 and 320 px reflow and keyboard proof. Phone selection uses an explicit Select control and shared selection sheet; this adaptation remains for owner review.

## Shared components and states

The [consumer binding](../component-bindings/2026-11-01-engineering-workload.md) records shared shell, table, controls and feedback reuse. Loading, empty, filtered-empty, denied, partial technical read, changed source, refresh, error and native uncertain-save recovery are required states. Published technical authority and permission checks are retained.

## Visual references

- [Engineering workload accepted design decision](../../../decisions/engineering-workload-design.md), page 184:1047, desktop 184:1048, selected rows 189:23728, phone 184:1435.
- [Five retained design captures](../../../reference/ui/engineering/engineering-workload-design-r01/README.md).
- [Earlier issued Engineering r02](../../../reference/ui/engineering/PPO-Engineering-Container-r02.html), retained unchanged.

## Behaviour, handovers and verification

`GET /api/v1/engineering/register` supplies the common permitted basis for rows, full matching counts and recorded-owner choices. Sorting and paging stay on the server. A source-bound continuation cannot combine incompatible pages; selection, CSV and sequence navigation retain the exact displayed query/source. Inactive recorded owners stay filterable without becoming assignable.

The [BC-01 contract](../../../decisions/engineering-workload-backend.md) and [native technical interface](../../../interfaces/engineering-native-control.md) define queue membership, source restrictions and release authority. Package detail and technical reads are reconciled before showing combined facts. Incoming Project/Opportunity context and outgoing EN-02–EN-08 package IDs are preserved.

The [Engineering guide](../../../guides/pages/guide.page.engineering.md) covers this route and the retained full package workflow. Its review/publication status is independent. The [execution ledger](../../../testing/evidence/engineering-workload/README.md) records checks and visual comparisons separately from owner acceptance and deployment. No review fingerprint is assigned by implementation.
