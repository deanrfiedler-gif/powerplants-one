# Shared record composition

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: pending. Consumers: CS-01 and CS-06; each retains its own page acceptance and source authority.

`SharedRecord`, `RecordFactSection` and `RecordSourceState` are exported from `src/components/ui/shared-record.tsx`. They compose existing PageHeader, RecordTabs/RecordPanel, Button, WorklistMenu/Panel and semantic sections. Domain reads, actions and permissions stay in the host. Styling is the scoped record section of `organisations.css`; it uses shared semantic tokens.

## Desktop

Desktop: header and sources meet the workspace edges; the 380 px ruled facts column narrows to 280 px by container query.

The CS-01 desktop tab sequence follows D3: Overview, Sales, Service, Projects, Sites, Accounts and Activity. The existing responsive hook switches the semantic/keyboard order on phones so Sites is fourth, following Q4; this is not a visual-only CSS reorder.

## Mobile

Phone: Overview, Sales, Service and Sites lead the scrolling strip, with remaining tabs reachable by touch or keyboard. The primary contact is selected only from recorded current site/affiliation evidence. Calls/mail open the user's apps. Follow-up remains an explicit My Work handover.

Source states use words. Restricted, unavailable and unconnected sources have no count. Partial source rows retain their basis/read time. Unknown lifecycle is not presented as confirmed open. No amounts are combined across records or currencies. Long identifiers wrap. A denied root read removes the sensitive host and correction form.

## Figma components

Mappings inherited from the catalogue: Components > Record / Field `224:12`, View tab `312:16`, Readiness bar `239:1800`, Check item `239:1799`. Header and page composition: accepted CS-01 frame `1443:2745`. The private file and glyph artwork are not retained; no live Figma call was required.

## Fixtures, handovers and review

[Host state recipes](../organisations-native-fixtures.json) bind the actual application and [browser proofs](../../../../tests/browser/organisations-native.spec.ts). [Implementation](../../../decisions/organisations-figma-implementation.md) records adaptations and [paired evidence](../../../testing/evidence/organisations-native-r01/README.md) separates automated proof from owner review.

Incoming: exact permitted organisation. Outgoing: existing source records, people/sites, stakeholders, account development and My Work. Correct details uses only the existing name-revision command, expected-version comparison and recoverable original operation. Additional correction fields are not inferred.

No owner/device acceptance, deployment or production-readiness claim is recorded.

## CS-06 host binding

Access & readiness opts into `sourcesLabel="Readiness basis"` and `statusPlacement="title"`; defaults preserve CS-01. Domain reads, permissions and commands remain in the host. Scoped CSS supplies 380/300 px facts and the 390/320 phone treatment. Phone tabs are reordered semantically.

The CS-06 host suppresses the second phone navigation bar while retaining the compact header's menu, and supplies its own status summary and sticky actions. Review forms restore opener focus. Its delayed-read fixture keeps subsequent mutations unavailable until the saved record version arrives; this is host behaviour, not a change to the shared record's defaults.

[Deterministic fixture](../../../../tests/helpers/access-readiness-fixture.ts) and [browser states](../../../../tests/browser/access-readiness-native.spec.ts) cover checks, grouped requirements, exact review/acknowledgement, stale refusal, empty, read-only and denied cases. [Current evidence](../../../testing/evidence/access-readiness-native/README.md) records execution separately. PPO - Design, Access & readiness — accepted: `1400:346553`, `1400:354078`, `1400:347071`, `1400:355748`; full mapping is in the [page contract](../pages/route-sites-id-readiness.md). Owner alignment review, including undrawn forms and token differences, remains pending.


## SV-04 appointment host

The accepted Appointment detail composition reuses this API without changing it: title state/readiness chips, source strip, ruled facts, no tabs, and phone bottom actions. At tablet width its facts follow the workspace; phone shows Visit plus a crew/details disclosure. Scoped styles live in `src/scheduling/components/client/appointment-record.css`. Consumer keys are `scope:SV-04` and `route:/service/appointments/[id]`. Synthetic fixture/state examples are in `tests/helpers/appointment-detail-fixture.ts` and `tests/browser/appointment-detail.spec.ts`. The `shared-record-sv04-review` alignment item and [evidence](../../../testing/evidence/appointment-detail-native/README.md) retain gated P4/P5 and data gaps. Owner visual review is pending.
