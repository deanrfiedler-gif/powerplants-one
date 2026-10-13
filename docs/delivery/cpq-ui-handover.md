# CPQ application and expanded design contract

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Authorised 13 October 2026. Base: merged CPQ main `7e4ef3b`; branch `codex/cpq-figma-ui`. ES-02/ES-03 and EST-02–EST-09 remain the parent scope. Implementation does not grant operational, commercial or visual approval.

## Delivered source

Four native routes: configuration register, Configure & price workbench, rule register and Rules studio. Reuse the application shell, shared buttons/register controls, role checks and receipt recovery. Structured authoring covers dictionary/bindings, typed conditions, bounded formulas/parameters, cost tiers/FX evidence, part scopes, options/structures, decision tables, constraints/capacity, test scenarios and milestone proposals. The configure workbench presents option cards, live server preview, BOM/Why, effective overrides, pricing, comparison, immutable history and exact estimate handover.

Migration 0088 follows the merged Project RAID 0087 and adds working draft identities/history, immutable rule versions/membership and sealed release evidence. Schema 3 is opt-in; schema 1 is retained. Drafts accept incomplete forms, while immutable versions require passing fixtures and decision coverage. Save configuration atomically retains a run and its working draft, or saves an incomplete working draft without a run. Preview never writes. Use in estimate never saves an implicit evaluation. See [API contract](../interfaces/cpq-api.md).

## Source design and adaptations

Private Figma pages 464:2–464:7 and frame IDs are recorded in the [decision](../decisions/cpq-figma-ui.md) and four working page specifications. Design context and rendered frames were inspected in the implementation session. Private artwork and URLs are not copied into the public repository. The local application uses the existing original fallback glyphs when the private Kit is unavailable. Main PR #455 supplies the confirmed named version “CPQ — Configure & price and Rules studio, accepted” and [44 icon-free reference captures](../reference/ui/estimating/cpq-figma-design-r01/README.md); these are linked into every CPQ page record. Complete owner/device acceptance remains pending.

The existing shell keeps its saved navigation preference. Data-dependent names, counts and amounts come from authorised records. Synthetic template prices are explicit fictional fixtures, not operational policy. Native unit prices round to cents before extension; a Figma example with a fractional-cent unit sell can differ by cents. Margin and markup remain distinct. Part scope explicitly controls System/Shared/Configuration output. Milestone proposals retain anchor, signed offset and calendar, with date null; adoption records their frozen run and audit evidence but creates no real schedule or billing obligation.

## Verification and final typography review

Main `d195e67` is integrated, preserving Work orders, Cost sources, Engineering workload and Project RAID by ancestry. Issued RAID migration 0087 is unchanged; the unpublished CPQ design-contract migration moves to 0088. Exact upgrade ledgers and the hosted upgrade gate include both. The RAID proof starts with populated 0087 entries and verifies that CPQ's identity extension preserves their records and evidence.

At source `3468ce6`, CI passed all 781 unit tests, lint, TypeScript and the compiled build. The complete Projects and Products suites passed, including historical upgrades and reserved Products 0052 installed after history 0088. Documentation/naming, design-register and access-review integrity passed. Azure demo assurance [38327485688](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38327485688) passed hosted identity/access upgrades, container build and desktop/phone fixtures. That was assurance, not deployment.

Estimating E1 [38327485813](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38327485813) passed all 137 database cases and the complete browser job: 22 HTTP cases plus 38 focused Estimating, 29 ES-02/shared-shell, 10 specialist and 18 fertigation browser cases. CPQ passed at desktop and phone widths, including 320 px overflow, the 240 px rail, full-height 380 px summary, footer alignment, server formula testing, incomplete draft retention, stale-adjustment review, lost-save-response recovery and exact estimate handover. No assertion deadline or calculation-worker limit was relaxed.

Paired review of its retained desktop/phone captures against Figma frames 16 and 05 exposed inherited negative letter spacing on headings. The final scoped correction restores normal tracking and the 20 px / 26 px dialog title. Option cards also match frame 16 as full-width stacked rows with a 64 px minimum height; configured order and native radio interaction are preserved. The browser assertions and component/fixture contracts cover that correction; verification of the final styled commit and the remaining combined application CI remain pending. The register preserves pending/stale reviews (362 entries, 208 routes and 44 components). No owner/device acceptance or complete visual parity is claimed.

Supplementary local attempts were incomplete under machine memory pressure, including a loading assertion and database/worker timeouts. Temporary review grants were removed and the isolated local test services were stopped. Earlier Windows storage/recovery unit failures reproduced on unchanged `7e4ef3b`; the complete Linux unit suite passes at the source above. Local interruptions are not recorded as passes.

## Deployment and remaining authority

The final state audit also separates active company versions from previously published releases in the register. A newer current draft retains the exact older active row; opening it uses the immutable read-only revision. Both focused database cases passed locally on the isolated synthetic database, covering activation replacement and concurrent draft/active states; TypeScript and register integrity also passed. The desktop/phone journey follows that register link and explicitly returns to the working draft. Final combined CI remains pending.

No hosted deployment is yet verified. The existing Azure demo workflow accepts only `main` and provides check/deploy/upgrade-and-deploy operations. This contribution requires additive database upgrade review and green combined-source CI before that existing path. It adds no service, dependency or seeded user. The explicit operator upgrade adds only CPQ read, author and calculate duties to eligible existing Company A testers, without extending expiry or restoring revoked grants; fresh tester provisioning uses the same three duties. Hosted access administration cannot change grants. Review and publication require separate authorised people and remain unassigned by this upgrade. No release is automatically created, reviewed or activated. MYOB, SharePoint and CAD authority remain unchanged.
