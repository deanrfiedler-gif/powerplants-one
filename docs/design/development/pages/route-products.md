# Catalogue and product technical workspace — native design contract

<!-- versioning: git; committed history is authoritative -->

Stable key: `route:/products`. Scope: `PD-01`. Owner: Dean Fiedler. Review: **Needs review**. Source base: `cad98aca42cb233f142029d11601a78d7d4b521e`. Route: `/products`.

## Purpose and r20 page type

Find the exact Family, Model or Variant by UUID, synthetic alias, provider key or model; inspect retained technical and source evidence. Page type: **Register / worklist; supporting Record detail**. This adapts the retained task reference into the current seven-domain shell; it does not adopt a new standalone baseline.

## Desktop

**Accepted design, 15 October 2026:** the [Products design decision](../../../decisions/products-figma-design.md), captures 01, 02 and 09 in [Products design r01](../../../reference/ui/products/products-figma-r01/README.md). Where it differs from the direction below, the accepted design governs: stock and demand move to Inventory, and the catalogue keeps one Availability column with no quantities.

Design direction after the 14 October alignment review: at 1440 × 900, use the established 240px Sales rail, 64px top bar and 240px secondary menu. Products is selected in the primary rail; catalogue destinations and filters belong in the secondary menu. Place the 60px toolbar and 40px grid rows directly within the workspace, without an enclosing card, outer module padding or oversized page heading. Use shared typography, tokens and controls. The authorised catalogue now follows this direction; model/variant rows may grow beyond 40px for readability.

## Mobile

**Accepted design, 15 October 2026:** capture 06 in [Products design r01](../../../reference/ui/products/products-figma-r01/README.md): the page name only in the phone header, a view picker ("Catalogue") with the count and a filter button, and flush 80 px rows showing the product, reference and kind with a publication tag, then the dated availability and the revision. The Sales tab bar stays icon-only.

At 390 × 844, place search below the shared header and show full-width labelled rows separated by rules. Preserve identity, kind, revision and publication, with explicit supply-evidence state. Keep the shared navigation, 44px controls and labelled search. The later implementation must verify 320px and 200% reflow with long values; the current package contains a 320px unlinked record, not a separate 320px catalogue capture. No outer-page horizontal scrolling is permitted.

## Shared controls and states

Catalogue reuses SecondaryMenuFrame and RegisterTable; records retain ProductsFrame, ProductContext, TechnicalContent and Comparison; shared Button, Field, SelectField, ValidationFields, ErrorNotice and ReadState; useUnsavedChanges and useRecoverableCommand. Loading, empty, filtered empty, read only, denied/unavailable, validation, stale, saving, unknown, recovered and success remain distinct. Phone/tablet filters use the shared secondary-menu modal; no new modal API or drag gesture is introduced. The shell's existing information icon exposes the page-specific draft guide.

## Task and handovers

1. Search and apply kind, state or lifecycle filters; the query remains in the URL.
2. Open the exact model/variant and inspect catalogue revision separately from explicit technical/source revision.
3. Inspect attribute units, unresolved clarification owners, controlled document applicability and lifecycle evidence.
4. Choose a retained revision before handing its exact identity to an authorised receiving workspace.

Incoming: exact permitted Product/company/source context. Outgoing: ES-03 source review/refresh, EN-06 Materials, EN-07 Change Impact, EQ-06 Bulletins and EQ-07 Lifecycle as applicable. Published catalogue evidence is not an owning-domain suitability or commercial decision.

## Visual sources, departures and proof

- Accepted Figma design: [Products design r01 captures](../../../reference/ui/products/products-figma-r01/README.md) (icon-free PNGs; not application captures)
- [PPO-Products-Preview-r04.html](../../../reference/ui/products/PPO-Products-Preview-r04.html)

- [Products workflow map](../../../reference/ui/module-workflow-maps/PPO-Products-and-Catalogue-Management-Workflow-Map-r01.html)
- [Native contract](../../../contracts/products-catalogue.md)
- [Evidence index](../../../testing/evidence/products-native/README.md)

Earlier native adaptation: cards, semantic shared controls and stacked comparison replaced standalone-only geometry. The 14 October proposal below refines the Products presentation to the accepted flat Figma patterns; earlier source images remain historical evidence. PD-03 uses native AUD/excluding-tax CostSource evidence; wider design policy remains Not configured. Source images are retained unchanged. Matching native captures and independent visual observations are recorded in the evidence index when inspected; no fingerprint or owner approval is inferred from an automated pass. Native phone images are runtime evidence, not an invented accepted mobile baseline.

## Completion review scope — 7 October 2026

The completion branch preserves the exact selected revision when handing detail to pricing and on reload. Published catalogue basis links to its immutable revision. Internal UUID detail is disclosed on demand while catalogue/technical revision, source basis and lifecycle remain visible. Four named local synthetic identities separate read, author, review and publication. Existing/hosted users gain no Products authority. The [completion evidence](../../../testing/evidence/products-native/README.md) records paired captures and verification; owner baseline, physical-device and screen-reader acceptance remain pending. Catalogue pagination and wider estimating selection are later work.


## Products discovery proposal — 14 October 2026

The [bounded proposal](../../../decisions/products-discovery-proposal.md) compares the inFlow sample discovery pattern with current PPO source. Private **PPO - Design**, page `653:38`, frames `653:46 / 657:371`. [catalogue-1440](../../../reference/ui/products-discovery/alignment-r01/catalogue-1440.png) · [catalogue-390](../../../reference/ui/products-discovery/alignment-r01/catalogue-390.png). The [capture index](../../../reference/ui/products-discovery/README.md) records source identities and hashes; named version and owner acceptance remain pending.

Following Dean's alignment feedback, this proposes a flat desktop catalogue, full-width phone rows, preserved return context, and an exact read-only handover between Products and stock/demand evidence. Existing scope IDs, source authority, permissions and native commands remain intact. The proposed Products layout follows the accepted Leads register and Lead/Project record references; the catalogue now implements authorised increment A. Products stock is currently Not configured; populated panels are fictional proposed states requiring an exact company/provider/item/unit mapping and a scoped read contract. No new stock balance, reservation or readiness calculation is adopted. The state board covers missing/incomplete/older evidence, loading, empty and unavailable reads. Catalogue app/guide and consumer bindings change; accepted fingerprints and deployment remain unchanged.


## Catalogue increment A

Catalogue uses SecondaryMenuFrame and RegisterTable with flat desktop rows and a full-width phone list. Filters use the existing modal menu on phone/tablet; Escape/Close restores the opener. Back to catalogue and browser Back restore query, selected-row focus and scroll within the same user/company. Historical revision links retain this return context; direct record links return to the plain catalogue. The record retains its native technical layout; populated supply panels remain proposed. [Implementation evidence](../../../testing/evidence/products-discovery/README.md) separates runtime checks from named-version, owner and device acceptance.

## Catalogue host contract

The `products-discovery-catalogue` integration in [ui-baselines.json](../../../standards/ui-baselines.json) binds the implemented full-bleed route to the retained alignment capture and compiled discovery proof. The original `products-native-products` contract remains historical; detail/publication/pricing/compatibility/import keep their native contracts. This source binding does not record owner or device acceptance.

## Accepted Figma design — 15 October 2026

Dean accepted the refined Products design with the [Inventory](../../../decisions/inventory-figma-design.md) split ("Proceed with your recommendations"). Desktop at 1440 × 900: the Sales rail with Products selected; a secondary menu holding the workspaces (Catalogue, Publication, Pricing, Compatibility, Import) and quick views (Published, Draft, Lifecycle unknown) without counts; a toolbar with Search products, Kind, Publication and Lifecycle filter buttons, "12 shown · limit 100" and "+ Product"; and a 40 px grid of Product, Reference, Kind, Revision, Publication, Lifecycle and Availability, with Family scrolling and fixed select and settings columns. Selecting a row opens the 360 px snapshot with revision facts, a one-line availability summary and Open product or Open in Inventory. A footnote says the read is bounded and that availability is a dated observation, not job readiness. Page components: Product grid row and header (Figma `692:2116`, `692:2117`).
