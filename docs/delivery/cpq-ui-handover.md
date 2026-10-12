# CPQ application and expanded design contract

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Authorised 13 October 2026. Base: merged CPQ main `7e4ef3b`; branch `codex/cpq-figma-ui`. ES-02/ES-03 and EST-02–EST-09 remain the parent scope. Implementation does not grant operational, commercial or visual approval.

## Delivered source

Four native routes: configuration register, Configure & price workbench, rule register and Rules studio. Reuse the application shell, shared buttons/register controls, role checks and receipt recovery. Structured authoring covers dictionary/bindings, typed conditions, bounded formulas/parameters, cost tiers/FX evidence, part scopes, options/structures, decision tables, constraints/capacity, test scenarios and milestone proposals. The configure workbench presents option cards, live server preview, BOM/Why, effective overrides, pricing, comparison, immutable history and exact estimate handover.

Migration 0087 adds working draft identities/history, immutable rule versions/membership and sealed release evidence. Schema 3 is opt-in; schema 1 is retained. Drafts accept incomplete forms, while immutable versions require passing fixtures and decision coverage. Save configuration atomically retains a run and its working draft, or saves an incomplete working draft without a run. Preview never writes. Use in estimate never saves an implicit evaluation. See [API contract](../interfaces/cpq-api.md).

## Source design and adaptations

Private Figma pages 464:2–464:7 and frame IDs are recorded in the [decision](../decisions/cpq-figma-ui.md) and four working page specifications. Design context and rendered frames were inspected in the implementation session. Private artwork and URLs are not copied into the public repository. The local application uses the existing original fallback glyphs when the private Kit is unavailable. Main PR #455 supplies the confirmed named version “CPQ — Configure & price and Rules studio, accepted” and [44 icon-free reference captures](../reference/ui/estimating/cpq-figma-design-r01/README.md); these are linked into every CPQ page record. Complete owner/device acceptance remains pending.

The existing shell keeps its saved navigation preference. Data-dependent names, counts and amounts come from authorised records. Synthetic template prices are explicit fictional fixtures, not operational policy. Native unit prices round to cents before extension; a Figma example with a fractional-cent unit sell can differ by cents. Margin and markup remain distinct. Part scope explicitly controls System/Shared/Configuration output. Milestone proposals retain anchor, signed offset and calendar, with date null; adoption records their frozen run and audit evidence but creates no real schedule or billing obligation.

## Validation in progress

Focused CPQ and navigation verification passes: 30 unit tests. All nine expanded CPQ database cases passed together in CI run 38315998630. Its E1 database job passed 131 of 132 cases; the only failure was an exact migration-ledger expectation in the catalogue upgrade, corrected to include 0087 and sort version numbers independently of the snapshot's JSON ordering. The broader unit run exposed two navigation expectations, now corrected and passing, and three Windows document-storage/recovery failures. Those three failures reproduce on unchanged main at `7e4ef3b` in an isolated baseline checkout. They are not attributed to this change.

Lint, type checking, foundation assurance, naming assurance and design-register integrity have passed during implementation. The register reports 362 entries, 208 routes and 44 components, retaining pending/stale reviews. Desktop and mobile save/explain/reopen/adopt and rule-test journeys passed before final visual refinements. The latest mobile reload proof passes; the desktop development-server rerun timed out while loading. The compiled application build passes. Final compiled browser checks retain the same assertion deadline and are in progress. A local rerun failed during fixture setup with the existing five-second calculation limit and a database connection timeout, before UI assertions; these limits were not relaxed. Updated CI follows the scoped Needs review locator correction and shared module registration. Historical upgrade checks pass from migration 0010 and populated 0025, plus reserved Products 0052 installed after history 0087. Final layout inspection corrected mobile readiness wrapping and rule-picker spacing. No owner acceptance or complete visual parity is claimed from these checks.

## Deployment and remaining authority

No hosted deployment is yet verified. The existing Azure demo workflow accepts only `main` and provides check/deploy/upgrade-and-deploy operations. This contribution requires additive database upgrade review and green combined-source CI before that existing path. It adds no service, dependency, seeded user or CPQ grant. Existing access administration must assign the five CPQ duties independently; migration does not grant hosted users access. MYOB, SharePoint and CAD authority remain unchanged.
