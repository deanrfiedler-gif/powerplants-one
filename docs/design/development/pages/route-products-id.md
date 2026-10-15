# Exact product technical record — native design contract

<!-- versioning: git; committed history is authoritative -->

Stable key: `route:/products/[id]`. Scope: `PD-01`. Owner: Dean Fiedler. Review: **Needs review**. Source base: `cad98aca42cb233f142029d11601a78d7d4b521e`. Route: `/products/[id]`.

## Purpose and r20 page type

Find the exact Family, Model or Variant by UUID, synthetic alias, provider key or model; inspect retained technical and source evidence. Page type: **Register / worklist; supporting Record detail**. This adapts the retained task reference into the current seven-domain shell; it does not adopt a new standalone baseline.

## Desktop

**Accepted design, 15 October 2026:** the [Products design decision](../../../decisions/products-figma-design.md), captures 03, 04 and 05 in [Products design r01](../../../reference/ui/products/products-figma-r01/README.md). Where it differs from the direction below, the accepted design governs: the record shows a one-line Availability strip that hands over to Inventory, not stock and demand sections.

**Amendment A1, product image, accepted 15 October 2026:** section 8 of the [Products design decision](../../../decisions/products-figma-design.md), captures 03, 04 and 05 in [Products design r02](../../../reference/ui/products/products-figma-r02/README.md). A Product image panel heads the details column above Identity (332 × 233 px at 1440, 249 × 173 px at 1024): the image, View full size, and a caption naming the image source and revision. With no linked image it shows a neutral "No image · None linked to this revision" placeholder, never an image from a similar product, its family or another revision.

Design direction after the 14 October alignment review: at 1440 × 900 and 1024 × 768, use the existing expanded/collapsed Sales rail and shared top bar. Place record identity and a full-width source notice directly above a separate summary/source column (340px desktop; 290px tablet) and a tabbed workspace. Use plain ruled stock and demand sections, without a rounded outer module container or cards within cards. Follow the inspected Lead/Project record structure and preserve exact catalogue/technical revision. The running native record is unchanged; the corrected [Figma proposal](../../../decisions/products-discovery-proposal.md) is not implementation evidence.

## Mobile

**Accepted design, 15 October 2026:** captures 07 and 08 in [Products design r01](../../../reference/ui/products/products-figma-r01/README.md): the compact record header, a status line, Availability rows (source available, reserved, usable Unknown) with the rule note, Product rows, Technical and Revisions tabs, and Documents and Open in Inventory fixed at the bottom. A product not linked to Inventory shows a warning that availability is Unknown and offers Find in Inventory.

**Amendment A1, product image:** captures 07 and 08 in [Products design r02](../../../reference/ui/products/products-figma-r02/README.md). An 80 px image row opens the record body, above the status line, with the image source, revision and "Tap the image to view full size"; capture 08 shows the no-image placeholder at 320 px. The row sits below the header, not beside the name, so the name keeps its width at 320 px.

At 390 × 844 and 320 × 844, use the existing compact record header with Back/previous/next, identity/status and tabs. Show stock as full-width labelled rows; separate source basis and linked demand with rules. Retain Unknown values, source time, company/item/unit context and a 44px evidence action. Technical details remain reachable from their tab. Long identifiers must wrap; keyboard, browser Back, 200% reflow and physical-device verification remain implementation work. No outer-page horizontal scrolling is permitted.

## Shared controls and states

Reuse ProductsFrame, ProductContext, TechnicalContent and Comparison; shared Button, Field, SelectField, ValidationFields, ErrorNotice and ReadState; useUnsavedChanges and useRecoverableCommand. Loading, empty, filtered empty, read only, denied/unavailable, validation, stale, saving, unknown, recovered and success remain distinct. No new modal/drawer or drag gesture is introduced. The shell's existing information icon exposes the page-specific draft guide.

## Task and handovers

1. Search and apply kind, state or lifecycle filters; the query remains in the URL.
2. Open the exact model/variant and inspect catalogue revision separately from explicit technical/source revision.
3. Inspect attribute units, unresolved clarification owners, controlled document applicability and lifecycle evidence.
4. Choose a retained revision before handing its exact identity to an authorised receiving workspace.

Incoming: exact permitted Product/company/source context. Outgoing: ES-03 source review/refresh, EN-06 Materials, EN-07 Change Impact, EQ-06 Bulletins and EQ-07 Lifecycle as applicable. Published catalogue evidence is not an owning-domain suitability or commercial decision.

## Visual sources, departures and proof

- Accepted Figma design: [Products design r01 captures](../../../reference/ui/products/products-figma-r01/README.md) (icon-free PNGs; not application captures)
- Amendment A1, product image: [Products design r02 captures](../../../reference/ui/products/products-figma-r02/README.md) (icon-free PNGs; owner-accepted; not application captures)
- [PPO-Products-Preview-r04.html](../../../reference/ui/products/PPO-Products-Preview-r04.html)

- [Products workflow map](../../../reference/ui/module-workflow-maps/PPO-Products-and-Catalogue-Management-Workflow-Map-r01.html)
- [Native contract](../../../contracts/products-catalogue.md)
- [Evidence index](../../../testing/evidence/products-native/README.md)

Earlier native adaptation: cards, semantic shared controls and stacked comparison replaced standalone-only geometry. The 14 October proposal below refines the Products presentation to the accepted flat Figma patterns; earlier source images remain historical evidence. PD-03 uses native AUD/excluding-tax CostSource evidence; wider design policy remains Not configured. Source images are retained unchanged. Matching native captures and independent visual observations are recorded in the evidence index when inspected; no fingerprint or owner approval is inferred from an automated pass. Native phone images are runtime evidence, not an invented accepted mobile baseline.

## Completion review scope — 7 October 2026

The completion branch preserves the exact selected revision when handing detail to pricing and on reload. Published catalogue basis links to its immutable revision. Internal UUID detail is disclosed on demand while catalogue/technical revision, source basis and lifecycle remain visible. Four named local synthetic identities separate read, author, review and publication. Existing/hosted users gain no Products authority. The [completion evidence](../../../testing/evidence/products-native/README.md) records paired captures and verification; owner baseline, physical-device and screen-reader acceptance remain pending. Catalogue pagination and wider estimating selection are later work.


## Products discovery proposal — 14 October 2026

The [bounded proposal](../../../decisions/products-discovery-proposal.md) compares the inFlow sample discovery pattern with current PPO source. Private **PPO - Design**, page `653:38`, frames `654:167 / 654:325 / 654:482 / 654:563`. [product-1440](../../../reference/ui/products-discovery/alignment-r01/product-1440.png) · [product-1024](../../../reference/ui/products-discovery/alignment-r01/product-1024.png) · [product-390](../../../reference/ui/products-discovery/alignment-r01/product-390.png) · [unlinked-320](../../../reference/ui/products-discovery/alignment-r01/unlinked-320.png). The [capture index](../../../reference/ui/products-discovery/README.md) records source identities and hashes; named version and owner acceptance remain pending.

Following Dean's alignment feedback, this proposes a flat desktop catalogue, full-width phone rows, preserved return context, and an exact read-only handover between Products and stock/demand evidence. Existing scope IDs, source authority, permissions and native commands remain intact. The proposed Products layout follows the accepted Leads register and Lead/Project record references; the catalogue now implements authorised increment A. Products stock is currently Not configured; populated panels are fictional proposed states requiring an exact company/provider/item/unit mapping and a scoped read contract. No new stock balance, reservation or readiness calculation is adopted. The state board covers missing/incomplete/older evidence, loading, empty and unavailable reads. Catalogue app/guide and consumer bindings change; accepted fingerprints and deployment remain unchanged.


## Catalogue increment A

Catalogue uses SecondaryMenuFrame and RegisterTable with flat desktop rows and a full-width phone list. Filters use the existing modal menu on phone/tablet; Escape/Close restores the opener. Back to catalogue and browser Back restore query, selected-row focus and scroll within the same user/company. Historical revision links retain this return context; direct record links return to the plain catalogue. The record retains its native technical layout; populated supply panels remain proposed. [Implementation evidence](../../../testing/evidence/products-discovery/README.md) separates runtime checks from named-version, owner and device acceptance.

## Accepted Figma design — 15 October 2026

Record header: title, publication tag, reference line (reference, kind and family, catalogue and technical revision, company), record position ("2 of 12 in Catalogue"), Open in Inventory and New draft revision. An Availability strip shows the observation time and completeness, source available, source reserved and "Usable: Unknown", with Open in Inventory. A 380 px details column holds Identity, Revision and Source and inventory link. View tabs: Technical, Documents, Revisions, Pricing, Compatibility and Used in. Technical holds a specification table (attribute, value, basis, evidence; an Unresolved attribute names its clarification owner) and controlled documents as metadata only, then a banner that publication does not confirm installation suitability. Revisions lists catalogue revisions with their states and an immutable history. At 1024 × 768 the rail collapses, the secondary action moves off the header and the strip wraps to two rows.
