# Customer 360 Figma design

Owner: Dean Fiedler. Status: **Proposed; owner review pending**. Created 13 October 2026; refined 14 October 2026.
Scope: **CS-01**; parents **CRM-01, CRM-04, CRM-06, SVC-06** remain unchanged.

Dean requested an editable Customer 360 page in the existing private PPO - Design Figma file, using the issued Customer 360 HTML and report as reference. The supplied node was the accepted Leads page. A separate **Customer 360 (proposal)** page, node `554:2`, preserves that work.

## Composition and authority

r20 page types: **Record detail / Overview dashboard**, supported by registers and persistent record inspection. Following Dean's 14 October request, the design includes the complete shared application shell. The previous module-interior treatment omitted the navigation and did not align with the other PPO pages. This user direction authorises the refinement; the historical HTML's shell boundary is source context, not a prohibition on the requested Figma composition.

Visual comparison used accepted Leads (`190:20513`), Project record Overview (`345:5185`) and My Work (`404:3`, phone `404:181`). The refined desktop uses their 1440 × 900 viewport, a 240 px navy primary rail, 240 px light customer-view menu, shared 64 px top bar, and 960 px customer workspace. The customer header remains visible above the scrolling content. The Overview has two compact rows of four summaries, an eleven-item commitments list and a relationship/source-freshness column. Phone uses the shared header, bottom tabs, compact summary rows and a customer-view drawer.

Reused assets: Brand / Logo; Shell / Top bar and Phone header; v2 Rail item, Menu item and Menu heading; existing phone tab components; Button, Tag and Icon components; PPO colour/layout variables and Roboto text styles. No shared library main component or token was changed. The page-local Summary tile (`555:161360`) was refined in place and remains proposed and reference-only; it does not extend the adopted runtime library.

The proposed departure moves full legal-account and site-party detail into Identity & mappings and uses the accepted shell's secondary menu in place of the earlier horizontal customer tabs. Counts keep their source population and permission meaning. Text accompanies icons; the private design retains PPO artwork, while every icon in retained captures is replaced with the existing placeholder shape.

The eight desktop views are Overview, Deals & quotations, Sales orders, Cases & service, Projects, Sites & equipment, Accounts, and Activity & documents. Additional frames show full identity, a permitted account-manager example, partial/stale order snapshots, phone Overview/Sales orders, and the phone view drawer. Existing top-level frame IDs are retained. The current [r02 capture manifest](../reference/ui/customers/customer-360-figma-r02/README.md) records exact nodes, dimensions and hashes. The [r01 captures](../reference/ui/customers/customer-360-figma-r01/README.md) remain unchanged as history.

Incoming: canonical customer and permitted exact source records, confirmed ERP company/account mappings and observation evidence. Outgoing: customer context and handovers to CRM, Estimating, Service, Projects, location/equipment, Finance and document owners. ES-07 owns conversion reconciliation; AD-04/AD-05 own source health and mapping. Customer 360 gains no ERP, communication or document-authoring authority.

All fixtures retain the issued 16 September 2026 scenario date. Unknown quantities, incomplete extraction, restricted Finance, accepted quotations with unknown conversion, source-reported holds, distinct completion facts and installed-versus-served relationships remain explicit. MYOB remains intended ERP authority; SharePoint remains intended document authority.

## Verification and limits

Agent visual comparison covered all ten desktop views/role examples, both phone pages, the phone drawer and the partial-order snapshot. Summary text wrapping and a transparent phone-list surface were corrected. Structural read-back covered all seventeen screen/panel/overlay frames: no horizontal overflow in unclipped auto-layout containers; editable text, frames and component instances throughout. Each desktop contains one 46 px brand-logo image; no screen is a flattened image. Snapshot panels and interactive overlay wrappers were resized to the 900 px desktop height. Prototype read-back confirms navigation and overlay reactions. This is structural evidence, not a browser click-through or physical-device acceptance claim.

The prototype supports desktop section-menu navigation, summary/record navigation and two exact right-side order snapshots. Phone Overview and Sales orders link to each other and open/close the customer-view drawer. Other phone destinations, primary-rail collapse/More, search, filters, customer changes, notes and source-module actions remain visual specifications. Summary links open their owning register; automatic filter application is not implemented.

**Named Figma version: pending.** The connector used here cannot save a named version. Under ADR-0053, this proposal must not be relied on as an accepted baseline until its named version and owner decision are recorded. The private file URL is deliberately excluded from Git.

No runtime code, route, migration, permission, fixture seed, external integration, deployment or accepted baseline changes. Existing native delivery and review records retain their meanings. Repository assurance results are recorded in the pull request; they do not grant acceptance.
