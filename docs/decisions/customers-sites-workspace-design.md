# Customers, Sites & Growing Areas Workspace

<!-- versioning: git; committed history is authoritative -->

**Date:** 15 September 2026 · **Owner:** Dean Fiedler · **State:** Authorised standalone workspace refinement, delivered for review. Native visual/device acceptance and application integration remain pending.

[Current r03 HTML](../reference/ui/customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html) · [Map extension](customers-sites-maps-r03.md) · [Detailed r02 audit](customers-sites-workspace-audit-r02.md) · [98 model/DOM results](../testing/evidence/customers-sites-workspace-r03.json) · [Retained r01 HTML](../reference/ui/customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r01.html).

## Authority and revision

The user first authorised the recommended Customers, Sites & Growing Areas Workspace, starting with CS-04 and CS-05 and including one organisation, two addressed sites, all six horticultural examples, shared equipment relationships, visit requirements and sourced assistance. R01 was published in draft PR #193 at `0e5f26d0757a3c2ed21f4871227e70c41c1e0b35`.

The next instruction requests an audit for gaps, improvements and professionalism, repository/theme alignment using the attached r20 board, and explicitly **only the workspace, without the left navigation rail or app shell**. R02 implements that request and preserves the r01 reference unchanged. The [audit](customers-sites-workspace-audit-r02.md) records 18 addressed findings and the remaining expansion boundaries.

R03 adds the subsequently authorised Google Maps links, directions, address copying and optional site-arrival/facility pins. The [map extension](customers-sites-maps-r03.md) records the exact behaviour and verification. R02 is preserved at `d09a5b3400f1c4e930e5a8abf657ecc8726aebf4`.

Source checkpoint: main `64574208ca604fee381e45c1b7db1b2b03c1dc8b`, tree `ec43a7ca4373ff233bb58632f34a7f6b3d0f7a1f`. Naming/SharePoint #190 is merged; Equipment r02 #192, Excel import #191 and MYOB handbook #194 remain separate at the inspected checkpoint. Existing organisation/site context and Facility identity commands are acknowledged; this HTML is not a claim that its richer fields are persisted by the current application.

Publication reconciliation: PR #193 subsequently advanced to `1896638a94d0419ca866221afabc114e9d85828a`, including preceding repair and Equipment r02 work. R03 is layered on that head and preserves its changes. The source checkpoint above identifies the original design basis; it does not describe every inherited change as unmerged or newly verified by this HTML package.

## Included workspace

| Local view | Register mapping | Scope |
|---|---|---|
| Customer | CS-01 / CS-02 | Organisation context, relevant contacts, separate site-party meanings and scoped site/facility/equipment counts. |
| Sites | CS-04 | Two addressed sites, timezone, contacts, telephone, access/delivery/visit information, site-source successors and history; map links, directions, address copying and optional arrival points. |
| Facilities & areas | CS-05 | Filtered collapsible hierarchy, stable visible references, indicative site plan, detail/forms, optional same-site parent, taxonomy/use/crop, dimensions, on-site position, optional map pin and readable history. |
| Equipment links | CS-05 / EQ-03 | One equipment identity, fixed installation location, separately editable same-site served relationships, source and history. |
| Visit requirements | CS-06 | Biosecurity, induction, crop access and shutdown information, explicit scope, owners/review dates, exact sources, new requirements and reviewed scope amendments. |
| Contextual Assistant | Cross-cutting | Scripted summary, missing-information review and source-inclusive visit draft for the exact selected site/area. |

The demonstration remains **Willowbank Horticulture** with Nursery & propagation and Field production sites. Nine facilities/areas cover Greenhouse, Tunnel, Propagation House, Pack Room, Irrigation Block/Field and Irrigation Shed, plus nested Propagation Bay A. All identities, addresses, people, email addresses and records are synthetic.

Pump `SYN-PPO-AST-000501` is installed in Irrigation Shed 01 and initially serves Greenhouse 01, Tunnel 01 and Propagation House 01. It is one Asset with three service relationships. Served facilities can also be non-growing support facilities. Structural containment is not an irrigation control-group relationship. Installation moves and equipment lifecycle changes remain Equipment receiving work.

## Retained business controls

[BP-03](../blueprints/BP-03-crm.md), the [shared data dictionary](../contracts/service-data-dictionary.md) and [FAC-D01–03](facility-field-proposal.md) retain authority. Organisation-to-site context follows SiteParty; Facility does not copy an organisation owner. Operator, owner and billing party remain distinct; neither hierarchy nor a relationship grants billing or access authority.

Facility structure, use and crop remain separate. Other/Unknown require their approved description/reason. Conditional counts and positive m² retain their limits. Blank optional values remain Not recorded, never zero. Site is fixed in a facility edit; self-parent, cycles and cross-site parent/served relationships are rejected. Duplicate names keep distinct UUID/reference identities.

Type/use changes show the exact values becoming inapplicable, require a reason and explicit confirmation, and clear them with before/after history. Cancel changes nothing. Switching back does not recover hidden old values automatically. Equipment relationships are preserved and their applicability review is called out when structure/use changes.

Approximate length, width, maximum height and measurement source/date remain optional **design extensions** to the approved footprint field. They do not calculate footprint or certify design suitability. Parent/child footprints are not totalled. The site-plan rectangles remain indicative starter positions; new/nested/unmapped records stay accessible in the hierarchy. Survey/GIS capture remains CS-08.

Readiness status evaluates source-review information against a chosen visit date. Current source is not induction completion, crop-entry permission, shutdown approval, dispatch or attendance. A Not applicable rationale also requires a current review basis. Site-wide requirements apply generally; explicit area records do not propagate to relatives. New requirements and category/scope changes retain exact source metadata and history, with explicit review of changed applicability.

## R20 presentation and interaction

The supplied `powerplants-one-theme-style-board-r20(2).html` was inspected directly. SHA-256: `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`. The Intake profile was selected for this data/form workspace: 41 source-profile tokens plus shared type/geometry entries produce 47 resolved keys. Three source Roboto faces are embedded. Different source-module palettes are not averaged.

R03 retains one workspace heading, organisation/site context and five horizontal local tabs. It removes global navigation, logo masthead, breadcrumb and identity/status strips. Primary actions use white on navy; green marks current context. Choice cards preserve 14 px corners, 7 px inset, shared shadows, measured height, above/below placement and viewport clamping. Cards are 7 px, controls 6 px and focused decisions 10 px. The support column is 292 px before stacking on narrower layouts.

Record inspection and Assistant occupy one modeless dock without squeezing the workspace. Forms, source reading and explicit decisions remain focused dialogs. Choice cards stay in their owning dialog context. Filtered-out selections close their inspection; duplicate names are distinguished by visible references. Tabs and dropdowns have labelled keyboard behaviour, error summaries link to exact controls and history starts with human-readable field changes.

No native screenshot, browser layout, screen-reader, zoom, touch or physical-device acceptance is asserted. The board itself identifies its newer composition patterns as proposed references. The user's workspace-only requirement controls omission of the generic application frame.

## Local data and assistance

Explicit saves retain a validated synthetic state in browser storage when available. R03 uses its own key and can read an existing valid r02 or r01 example without rewriting either original key. Malformed history, source dates, IDs, versions and altered original source content are rejected. A detected changed-tab generation refuses overwrite and retains the proposal. Storage failures are labelled session-only with export recovery.

Backup restoration validates a bounded JSON file, previews record/history counts, requires explicit replacement confirmation and rechecks the storage basis. Invalid, cancelled or stale restores leave current data unchanged. This does not implement server permissions, atomic multi-user concurrency or original-operation receipts. Those remain approved application receiving contracts.

Assistant is a deterministic local demonstration. Its scope follows the selected site/area, and source snapshots include current requirement fields plus the exact supporting note. Changed data marks the draft stale and blocks regeneration/copy/download until refreshed. Paragraphs, list items and sources remain readable in exported text. No external AI call, communication, booking, approval or operational action occurs.

The Nursery-only read-only scenario scopes presentation and disables edits/backups. Embedded data remains inspectable; this is not a security boundary, server role or offline-authority grant.

## Site maps and arrival context

Site address links and directions use ordinary Google Maps URLs. Visitor, delivery and service entrances are optional records separate from the physical address. Only confirmed points can be selected for directions; point edits and removal retain sources/history. An optional facility pin identifies an internal location and does not replace the arrival gate. All starter points remain blank and fictional addresses are labelled. [R03 map contract](customers-sites-maps-r03.md) details validation, copying fallback, evidence, storage continuity and integration boundaries.

## Verification and delivery

[Check script](../../scripts/check-customers-sites-design-r03.mjs) runs **98 model/DOM-emulation groups**, retaining the 72 r02 groups and adding 26 map-extension groups. The optional jsdom 27.0.1 module remains outside application dependencies:

```sh
PPO_DESIGN_JSDOM_MODULE=/absolute/path/to/jsdom/lib/api.js node scripts/check-customers-sites-design-r03.mjs
```

Use `--write-evidence` to record the exact HTML hash and group results. Native dialog/show/scrolling and menu rectangles are simulated; file validation/restoration runs through FileReader in DOM emulation. The environment's earlier browser URL security rejection was not bypassed. Native clipboard/download, rendering, screen-reader and device acceptance remain open.

The original [r01 check](../../scripts/check-customers-sites-design.mjs), [r01 evidence](../testing/evidence/customers-sites-workspace-r01.json) and HTML are retained. R01 and r02 reference HTML and evidence are unchanged. The r03 package adds no framework, application package, runtime route, database migration, provider adapter, deployment or operational data. Master FAC-A/MC-A/AT/PT cases are not passed by these design checks.

Next: review rendered r03, including native Maps handoff, on an authorised desktop/phone surface, then extend CS-08 survey capture. Broader customer/site lifecycle, effective party changes, SharePoint evidence, runtime Facility persistence and exact receiving links into Equipment/Estimating/Projects/Service remain separate work. Service Agreements & Maintenance follows as the next substantial module.
