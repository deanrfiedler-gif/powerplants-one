---
document_id: PPO-PD01-DISCOVERY-PROPOSAL
title: Products discovery and supply evidence proposal
date: 2026-10-14
owner: Dean Fiedler
status: Catalogue increment authorised; wider supply proposal and acceptance pending
source_commit: 65141dc
versioning: git
---

# Products discovery and supply evidence proposal

**Layout superseded, 15 October 2026:** Dean accepted the refined [Products design](products-figma-design.md) and the separate [Inventory design](inventory-figma-design.md). Their layouts supersede the frames described below; this proposal's rules, priorities and acceptance criteria stay authoritative, and its retained captures stay unchanged as history.

Dean authorised comparing inFlow with PPO and preparing a prioritised proposal and desktop/mobile mockups. He asked to be told if REA becomes necessary. This contribution delivers that reviewable design package. Dean subsequently requested alignment with the other PPO Figma pages, specifically the general absence of internal module containers; the six mockups have been corrected against the accepted register and record references below. Dean subsequently authorised proceeding with the first catalogue increment. That instruction authorises the bounded implementation below, not visual or business acceptance of the wider supply proposal.

The recommended journey is **find a product → inspect its exact revision → understand stock evidence → open the demand that needs it**. The first delivery should improve the existing catalogue. A following read-only increment can connect the product to Supply Chain once exact identity and permission rules are proved.

## Evidence and comparison

| Evidence | What was established | PPO implication |
|---|---|---|
| Bounded inFlow account observation, 14 October 2026 | The page explicitly said Products (Sample) and “You're viewing sample data”. The product list showed product/category/SKU/on-hand/retail columns and location, type, category, quantity-range and barcode filter controls. Only the visible controls were inspected; filter semantics were not exhaustively tested. | A compact register makes items easier to compare. PPO must retain its Family/Model/Variant, catalogue revision, publication and lifecycle distinctions. |
| Observed search and selection | Searching “Circulating” yielded the sample pump, and opening it retained the search and selected item in a narrow list beside the detail. The initial SKU attempt showed No results. A second bounded walkthrough confirmed the sample exact SKU returns the pump with its category filter active; close and browser Back both retain the filtered result. The reason for the earlier result is not established. | Preserve PPO's existing identity/model/name search and its URL filters. Add a reliable return to the same filtered list and selected record. Do not copy inferred inFlow search rules. |
| Observed sample product overview | Product identity, barcode, description, custom fields, location quantity and commercial information were grouped on one record; Overview, Manufacturing, Product vendors, Order history and Movement history tabs were visible. The Order history tab's headings were observed, not a completed order-history journey. | Keep product identity prominent and group technical, supply and history evidence. PPO's commercial permissions and exact revisions still apply. Manufacturing is conditional BP-01 scope, not implied by this sample. |
| Observed quantity breakdown | The sample modal separately displayed Available, Reserved, On hand, Picked, On order, By manufacture order and In transit. | Adopt explicit labels and drill-down, not an inventory formula. PPO already requires separate stock meanings, location, unit, timestamp and completeness. |
| Official inFlow documentation | Current-stock reporting, quantity breakdown, mobile workflows, purchase receiving and low-stock reorder features are documented. See the source links below. | Receiving/barcode workflows are useful later candidates. A documented feature is not a verified Powerplants operating rule or an observed account workflow. |
| PPO source at `65141dc` | `src/products/reads.ts` already searches reference, UUID, provider/entity key, title, manufacturer, model and variant. It supports kind/state/lifecycle filters, a 100-record bound and permission-scoped reads. Product stock is explicitly `NotConfigured`. | Search is an existing capability. Keep the bound visible; do not present displayed count as the full catalogue total. A populated product-stock panel is new work. |
| PPO source at `65141dc` | `src/products/components/catalogue.tsx` uses cards and retains list filters in the URL; its explicit Back to catalogue link goes to `/products`, without that query. Product detail has exact revision, technical content and retained history. `src/supply/reads.ts` already scopes facts/allocations and keeps readiness evidence distinct. | Refine presentation and return context first. Reuse native Supply Chain authority rather than adding a competing inventory subsystem. |

PPO comparison used the current source and retained native Products/Supply Chain screenshots; a fresh running PPO walkthrough was **not executed during the initial comparison**. Subsequent implementation proof is recorded separately. The dated captures are visual history, not proof of current deployment. The inFlow observation was read-only; no business record was created or changed. No raw account screenshot, private file link or account identifier is included in this repository.

Sources: [inFlow current stock](https://www.inflowinventory.com/support/cloud/current-stock/), [quantity breakdown](https://www.inflowinventory.com/support/cloud/quantity-breakdown/), [mobile guide](https://www.inflowinventory.com/support/cloud/inflow-inventory-mobile-app-full-guide/), [purchase orders and receiving](https://www.inflowinventory.com/support/cloud/how-do-i-create-and-complete-a-purchase-order), [reordering](https://www.inflowinventory.com/support/cloud/is-there-a-way-to-reorder-items-that-are-low-in-stock). PPO authorities: [ADR-0048](ADR-0048-products-native-catalogue.md), [ADR-0049](ADR-0049-native-supply-chain.md), [BP-01 §14](../blueprints/BP-01-master-blueprint.md#14-supply-chain-capability-blueprint) and [BP-08](../blueprints/BP-08-supply-chain.md).

## Priorities and implementation boundary

| Priority | Proposed increment | Value and dependency |
|---|---|---|
| First — A | Compact desktop product register, readable full-width phone rows, existing labelled filters, exact revision context and preserved Back/selection state. | Faster finding and comparison using existing Products reads. Supply column remains Not configured until increment B exists. No new provider, schema, capability or inventory calculation is required for A. |
| First — B | Read-only Stock & demand area on product detail, linked to existing stock/material-readiness records. | Reduces cross-workspace searching. Requires a documented exact mapping from product/company/provider/entity to source item/unit, permission-scoped projection and existing source revision/time/completeness. Missing/ambiguous mapping stays Unknown. Implementation may reveal a required mapping persistence decision; no table or endpoint is pre-authorised by this drawing. |
| Next | Focused receiving and barcode-assisted identification on existing SC-04 receiving workflow, with SC-03 shipment handovers. | Validate actual receiving roles, partial receipts, damage/quarantine, duplicate scans, unit handling and device needs before specifying a write. A scan identifies an item; it cannot itself establish an accepted receipt. |
| Later | Replenishment review and supplier commitments. | Requires agreed demand, stock and procurement policy plus MYOB authority. No automatic reorder formula or external purchase transaction is adopted. |

The smallest implementation PR is **A only**. B should follow as a separately reviewable read contract and UI change, using existing stack and source services. These are proposed implementation boundaries, not an instruction to deploy or begin a migration. MYOB remains the intended ERP authority; SharePoint retains business documents; source integrations remain separate.

## Figma package and conformance

Private file: **PPO - Design**. Page **Products · PD-01** (formerly "Products · PD-01 · discovery proposal"), node `653:38`. The six editable frames use local-library instances and private library icons. Separate evidence copies replace every icon with `Icon/placeholder`; only those copies are exported to this public repository. No existing Figma library, accepted page or issued source snapshot was changed.

| View | Node | Viewport / capture |
|---|---|---|
| Catalogue desktop | `653:46` | [1440 × 900](../reference/ui/products-discovery/alignment-r01/catalogue-1440.png) |
| Product evidence desktop | `654:167` | [1440 × 900](../reference/ui/products-discovery/alignment-r01/product-1440.png) |
| Product evidence tablet | `654:325` | [1024 × 768](../reference/ui/products-discovery/alignment-r01/product-1024.png) |
| Catalogue phone | `657:371` | [390 × 844](../reference/ui/products-discovery/alignment-r01/catalogue-390.png) |
| Product evidence phone | `654:482` | [390 × 844](../reference/ui/products-discovery/alignment-r01/product-390.png) |
| Unlinked product phone | `654:563` | [320 × 844](../reference/ui/products-discovery/alignment-r01/unlinked-320.png) |
| State and handover notes | `657:428` | [State board](../reference/ui/products-discovery/states.png) |

### Alignment with existing PPO pages

Dean's direction is to follow PPO's established page structure and generally avoid internal module containers. The initial drawing used a large heading, module inset and rounded cards; the corrected drawing uses the workspace itself as the surface. The original captures remain unchanged as history, not as the current proposal.

| Inspected private Figma reference | Observed pattern | Applied to Products |
|---|---|---|
| Leads accepted register `190:20513`, page `190:20237` | 1440 × 900; 240px primary rail, 64px top bar, 240px secondary menu; no outer module padding; 60px toolbar and compact 40px grid rows. | Catalogue uses the existing Sales context rail with Products selected. Module destinations and filters sit in the secondary menu. Toolbar and grid meet the workspace edges; no enclosing card or oversized page heading. |
| Lead record `226:208`, page `224:2`; Project overview `345:5185`, page `345:2` | Record heading above a separate details column and tabbed workspace; ruled sections rather than a card around the module. | Product identity and source notice span the workspace. Summary/source details occupy a 340px column at desktop and 290px at tablet. Stock and demand use plain sections and a compact ruled table. Tabs remain visible. |
| Job packs phone list `272:2542`, page `272:2`; Leads phone list `228:809` | Compact, full-width rows separated by rules; search directly below the shell. | Phone catalogue replaces inset rounded cards with full-width labelled rows. Current shared phone header and tab-bar instances are retained. |
| Project phone overview `355:2281`, header `355:2282` | Compact record identity and Back/previous/next controls above the content. | Phone record uses that header pattern, tabs, flat quantity rows and a bottom evidence action. The 320px unlinked view preserves Unknown values. |

Colour/type tokens, current shared controls and the global guide/workspace affordances remain in use. The correction changes this proposal's layout; it does not change the accepted reference pages, the shared library or the running application. It is not a blanket ban on task-specific panels where a reviewed page needs one.

The first catalogue row links to desktop detail; the first phone row links to phone detail; Back links return to the respective mockup. Other controls are illustrative. Scrolling content deliberately continues below the tablet/phone viewport. This is a partial navigation prototype, not a functioning stock application.

**Named version is pending.** Chrome's Figma editor reported that WebGL is unavailable; the connector could create and inspect the design but offers no named-version operation. Under [ADR-0053](ADR-0053-figma-page-design.md), save a named version before relying on this proposal as an implementation baseline. Suggested name: `Products discovery — PPO alignment review — 14 Oct 2026`. Exact captures and hashes are retained in the [evidence index](../reference/ui/products-discovery/README.md); they do not substitute for owner acceptance or the pending named version.

| Required declaration | This proposal |
|---|---|
| Scope identity | Existing PD-01 catalogue/product technical workspace and SC-05 stock/reservations. Handovers to SC-01 material readiness and SC-09 change impacts where applicable. BP-01 parents SCM-01, SCM-02 and SCM-08 are unchanged. Existing Products/Supply Chain contracts remain authoritative. |
| r20 page types | Register / worklist, supporting Record detail and read-only evidence. Desktop compact grid; phone full-width labelled rows. |
| Reuse | Runtime: ProductsFrame, ProductContext, TechnicalContent, shared Button/ButtonLink, Field, SelectField, ReadState/ErrorNotice; existing RegisterTable pattern should be assessed before implementation. Source files remain `src/products/components/*`, `src/components/ui/button.tsx`, `src/components/business-ui.tsx`, `src/supply/components/*` and the shared shell. Figma: PPO text styles/colour/layout variables, Button, Tag, Grid cells/headers, existing expanded/collapsed Sales rail, top bar, phone header/tab bar and Project record header pattern. No new shared component is created by this proposal. |
| Incoming | Exact permitted product and selected catalogue/technical revision. B additionally needs an explicitly established company/provider/item/unit mapping and permitted source observations. The fictional fixture is not a registered source mapping. |
| Outgoing | Native stock evidence or owning material-readiness record. Preserve internal ID, company/entity context and exact source revision; do not open a name-matched or cross-company record. Receiving domain owns subsequent actions. |
| Exceptions | Loading, no matches, unlinked, incomplete/older evidence, unavailable/denied, failed read and changed revision are specified on the state board. Unknown is not zero; no freshness threshold is invented. Existing write/recovery workflows are outside this read-only increment. |
| Proposed departures | Native catalogue cards become a flat desktop grid and full-width phone rows; product detail introduces a stock/demand read area using the accepted record structure. Products stays in the existing Sales navigation context, with module links outside the primary rail. These are proposals, not accepted navigation or page baselines. Preserve complete technical content/attributes/controlled documents even though only their summary is drawn. |
| Responsive contract | 1440 × 900 desktop; 1024 × 768 collapsed rail; 390/320 full-width phone content with 44px buttons and labelled search. Product context/source identity must remain reachable on phone through technical/source evidence, not discarded by implementation. Keyboard, screen-reader, 200% reflow and physical-device proof remain implementation work. |
| Verification | Six corrected screens visually inspected against the accepted references; state-board requirements retained. Tablet header bounds and six catalogue/Back reactions inspected. The authoring screens contain 204 instances and 288 text nodes; all 75 icon instances in the separate capture copies resolve to Icon/placeholder. No functional app or deployment claim is made. Repository checks are recorded in the evidence index. |

## Acceptance criteria for the later implementation

| ID | Testable result |
|---|---|
| PD-DISC-01 | Existing identity/model/name queries and kind/state/lifecycle filters retain their server semantics. Counts identify the 100-record bound; no unverified total is shown. |
| PD-DISC-02 | From a filtered list, open a record and use explicit Back or browser Back. Query, filters and selection return; unrelated company/identity changes clear the prior projection. |
| PD-DISC-03 | Product kind, stable identity, selected catalogue revision, explicit technical revision, publication and lifecycle remain distinguishable. Historical viewing never silently switches to the current revision. |
| PD-DISC-04 | With no verified mapping, a Family, ambiguity, or mismatched company/unit, show Not linked/Not applicable and Unknown as appropriate. Never join on name alone or guess a unit conversion. |
| PD-DISC-05 | A linked observation shows company, warehouse/bin, unit, source time, source revision and completeness. On hand, source available, source reserved, held and evidenced usable remain distinct; no new netting rule is introduced. |
| PD-DISC-06 | Linked demand shows required quantity/date, demand class and its owning record. An incoming coordination allocation is not a reservation or usable material; product stock cannot set job readiness. |
| PD-DISC-07 | Reads enforce both Products and receiving-domain permission scopes. Denied source/demand does not leak identifiers, quantities or counts through summaries, search, history or navigation. |
| PD-DISC-08 | Missing/incomplete/older/failed evidence retains honest labels. Retry preserves context; unknown quantities never render as zero, and a failed read does not display another identity's old data. |
| PD-DISC-09 | 1440, 1024, 390 and 320 layouts preserve content and access to source details, visible focus, labelled controls, 44px phone targets and browser Back. Long IDs and 200% reflow cause no outer horizontal scroll. |
| PD-DISC-10 | Opening stock/demand is read-only and targets the exact permitted native record. No inventory adjustment, reservation, purchase, source refresh or receiving command is sent by this journey. |

These IDs describe the proposed increment and preserve all parent IDs. They are not passed test evidence.

## REA decision

**REA is not needed for this increment and was not installed or run.** Browser observation, vendor documentation and PPO's source answer the relevant design questions. The follow-up sample walkthrough resolved exact-SKU and return-navigation questions; PPO retains its own search contract.

Use [REA](https://github.com/morluto/rea) only if a specific, necessary browser behaviour remains unexplained after normal observation and documentation—for example, a scan/debounce sequence or a particular partial-receipt transition needed for a later design. First state the unresolved question and why it affects PPO. A bounded passive capture of the relevant origin and one synthetic workflow may then help describe request/event shapes. Keep credentials, raw account responses and private captures outside Git. REA cannot reveal inFlow's server source or turn observed behaviour into an approved PPO operating rule.

The first catalogue increment is now authorised. Stock/demand remains proposed. Named version and owner review remain outstanding evidence, not claims implied by implementation.


## Authorised catalogue increment A — 14 October 2026

Dean instructed “Proceed based on your recommendations” after the recommendation to verify the sample journey and implement catalogue discovery/return navigation. Increment A reuses the existing React/Next stack, SecondaryMenuFrame, RegisterTable, Field/SelectField and Button. No new technology or dependency is selected. Reproducing inFlow internals is unnecessary because PPO already has search, permissions and evidence rules. Populated stock/demand panels remain increment B, proposed only.

Private PPO - Design nodes `653:46` and `657:371` were read through design context and screenshots. The named version remains pending for the recorded WebGL reason. Work proceeds under Dean's current instruction with exact retained icon-free captures and this explicit limitation; neither the missing version nor owner acceptance is claimed.

The catalogue is full bleed, with desktop filters in the shared secondary menu and phone/tablet filters in its existing modal. Rows retain kind, catalogue revision, publication, lifecycle and model/variant. They can grow beyond the 40px minimum for model/variant readability; phone lifecycle supplements the drawing's shorter subtitle. Exact technical/source revision stays in the record. The shared shell and public fallback icons remain native. Other Products layouts remain native; Back and revision links retain catalogue context.

Existing API filters remain in the URL. One tab-local return entry holds query, selected ID and scroll, scoped to workspace/actor/working company. Invalid or other-scope entries are discarded. No product payload or commercial values are cached. Direct record links return to the plain catalogue. Storage failure falls back to memory for the current document.

Follow-up sample observation: name and exact SKU searches worked with the category filter; detail retained the adjacent list; close and browser Back retained the filtered catalogue. The quantity modal showed separate on-hand, available, reserved, picked, on-order, manufacture-order and in-transit labels. No mutation or inventory formula was tested. No material unanswered inFlow behaviour blocks A; REA was not installed or run. Later receiving/reservation questions may warrant it.

[Implementation evidence](../testing/evidence/products-discovery/README.md) records checks and limits. PD-DISC-01/02/03/08/09 apply to A's catalogue/record boundary. PD-DISC-04–07/10 remain proposed for B. No migration, grant, business transaction, production integration or deployment is included.
