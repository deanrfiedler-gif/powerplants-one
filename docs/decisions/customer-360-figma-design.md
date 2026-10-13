# Customer 360 Figma design

Owner: Dean Fiedler. Status: **Proposed; owner review pending**. Created 13 October 2026.
Scope: **CS-01**; parents **CRM-01, CRM-04, CRM-06, SVC-06** remain unchanged.

Dean requested an editable Customer 360 page in the existing private PPO - Design Figma file, using the issued Customer 360 HTML and report as reference. The supplied node was the accepted Leads page. A separate **Customer 360 (proposal)** page, node `554:2`, preserves that work.

## Composition and authority

r20 page types: **Record detail / Overview dashboard**, supported by registers and persistent record inspection. The design is a module interior for the shared application shell. It reuses existing PPO colour/layout variables, Roboto text styles, Button and Tag components. The local Summary tile component (`555:161360`) is proposed and reference-only; it does not extend the adopted runtime library.

The proposed departure compacts the Overview identity card and moves full legal-account and site-party detail into Identity & mappings, bringing commitments and attention earlier. Text labels carry navigation and action meaning; no licensed icon artwork appears in the retained captures.

The eight desktop views are Overview, Deals & quotations, Sales orders, Cases & service, Projects, Sites & equipment, Accounts, and Activity & documents. Additional frames show full identity, a permitted account-manager example, partial/stale order snapshots, and phone Overview/Sales orders. The [capture manifest](../reference/ui/customers/customer-360-figma-r01/README.md) records exact nodes, dimensions and hashes.

Incoming: canonical customer and permitted exact source records, confirmed ERP company/account mappings and observation evidence. Outgoing: customer context and handovers to CRM, Estimating, Service, Projects, location/equipment, Finance and document owners. ES-07 owns conversion reconciliation; AD-04/AD-05 own source health and mapping. Customer 360 gains no ERP, communication or document-authoring authority.

All fixtures retain the issued 16 September 2026 scenario date. Unknown quantities, incomplete extraction, restricted Finance, accepted quotations with unknown conversion, source-reported holds, distinct completion facts and installed-versus-served relationships remain explicit. MYOB remains intended ERP authority; SharePoint remains intended document authority.

## Verification and limits

Agent visual inspection covered the desktop compositions, phone Overview and exact partial/stale snapshots. Auto-layout/text sizing defects found during composition were corrected. Read-back found Roboto throughout, no image-filled nodes in the design, editable text/frames/instances and no horizontal overflow in unclipped layout containers. The first prototype attempts were rejected for self-navigation and unsupported manual overlay positioning; the final 111 explicit links were written successfully. Prototype read-back confirmed navigation and overlay reactions. This is structural evidence, not a browser click-through or physical-device acceptance claim.

The prototype supports desktop tabs, register navigation and two exact right-side order snapshots. Phone Overview and Sales orders link to each other; other phone tabs remain visual specifications. Search, filters, customer changes, notes and source-module actions are not working application behaviour. Summary links open their owning register; automatic filter application is not implemented.

**Named Figma version: pending.** The connector used here cannot save a named version. Under ADR-0053, this proposal must not be relied on as an accepted baseline until its named version and owner decision are recorded. The private file URL is deliberately excluded from Git.

No runtime code, route, migration, permission, fixture seed, external integration, deployment or accepted baseline changes. Existing native delivery and review records retain their meanings. Repository assurance results are recorded in the pull request; they do not grant acceptance.

