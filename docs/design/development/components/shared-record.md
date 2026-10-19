# Shared record composition

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: pending. Scope: CS-01 first consumer; no other page is adopted by this implementation.

`SharedRecord`, `RecordFactSection` and `RecordSourceState` are exported from `src/components/ui/shared-record.tsx`. They compose existing PageHeader, RecordTabs/RecordPanel, Button, WorklistMenu/Panel and semantic sections. Domain reads, actions and permissions stay in the host. Styling is the scoped record section of `organisations.css`; it uses shared semantic tokens.

## Desktop

Desktop: header and sources meet the workspace edges; the 380 px ruled facts column narrows to 280 px by container query.

## Mobile

Phone: Overview, Sales, Service and Sites lead the scrolling strip, with remaining tabs reachable by touch or keyboard. The primary contact is selected only from recorded current site/affiliation evidence. Calls/mail open the user's apps. Follow-up remains an explicit My Work handover.

Source states use words. Restricted, unavailable and unconnected sources have no count. Partial source rows retain their basis/read time. Unknown lifecycle is not presented as confirmed open. No amounts are combined across records or currencies. Long identifiers wrap. A denied root read removes the sensitive host and correction form.

## Figma components

Mappings inherited from the catalogue: Components > Record / Field `224:12`, View tab `312:16`, Readiness bar `239:1800`, Check item `239:1799`. Header and page composition: accepted CS-01 frame `1443:2745`. The private file and glyph artwork are not retained; no live Figma call was required.

## Fixtures, handovers and review

[Host state recipes](../organisations-native-fixtures.json) bind the actual application and [browser proofs](../../../../tests/browser/organisations-native.spec.ts). [Implementation](../../../decisions/organisations-figma-implementation.md) records adaptations and [paired evidence](../../../testing/evidence/organisations-native-r01/README.md) separates automated proof from owner review.

Incoming: exact permitted organisation. Outgoing: existing source records, people/sites, stakeholders, account development and My Work. Correct details uses only the existing name-revision command, expected-version comparison and recoverable original operation. Additional correction fields are not inferred.

No owner/device acceptance, deployment or production-readiness claim is recorded.
