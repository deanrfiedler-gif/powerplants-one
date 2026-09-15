# Customers, Sites & Growing Areas — map links and arrival points

**Revision:** r03 · **Date:** 15 September 2026 · **Owner:** Dean Fiedler · **State:** Authorised standalone HTML extension, delivered for review.

[Workspace r03](../reference/ui/customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html) · [Current design handover](customers-sites-workspace-design.md) · [98 model/DOM check results](../testing/evidence/customers-sites-workspace-r03.json) · [Retained r02 audit](customers-sites-workspace-audit-r02.md).

## Decision and source basis

The user authorised the recommendation to link site addresses to Google Maps, provide directions and address copying, and distinguish physical addresses from optional visitor, delivery and service arrival points. Optional facility coordinates identify an internal structure or growing area without creating another street address.

The extension builds on PR #193 r02 commit `d09a5b3400f1c4e930e5a8abf657ecc8726aebf4`, checked against main `64574208ca604fee381e45c1b7db1b2b03c1dc8b`. It follows the current [CRM blueprint](../blueprints/BP-03-crm.md), [approved Facility decisions](facility-field-proposal.md), and supplied r20 Intake theme. R01, r02 and their evidence remain unchanged. It retains the user's workspace-only composition.

[Google's Maps URL documentation](https://developers.google.com/maps/documentation/urls/get-started), inspected 15 September 2026, supports cross-platform search and directions links without an API key. Links use the required `api=1`, standard URL parameter encoding and the documented 2,048-character limit. No map SDK or new technology dependency is introduced.

Before publication, the review branch advanced to `1896638a94d0419ca866221afabc114e9d85828a` (tree `a900fc147dc70059365f09b8328715dc2d601990`), reconciling preceding repair work. R03 was applied on top of that exact head. The newer Equipment r02, quality-adoption, runtime-repair and documentation changes were preserved; only the Customers workspace status row was updated when resolving the shared STATUS conflict. These inherited changes retain their own evidence and are not claimed as verified by the map checks.

## Delivered behaviour

| Surface | R03 behaviour |
|---|---|
| Customer / site cards | Open in Google Maps and Copy address are independent controls outside the site-selection button. Each uses that card's site, even when another site is selected. |
| Site workspace and details | Map action beside the physical address. Directions show their destination explicitly. The default is Physical address; confirmed arrival points can be selected separately. |
| Arrival points | One optional point each for Visitor entrance, Delivery gate and Service access. Each has a fixed purpose identity, editable name, decimal coordinates, status, responsible site contact, check date, access notes and dated source evidence. |
| Unconfirmed point | Can be inspected with View proposed pin. It is excluded from directions destinations. |
| Confirmation | Requires valid coordinates, a check date, source evidence and explicit review of the exact coordinates. Editing either coordinate clears confirmation and its check date in the draft. |
| Facility detail | Optional independently sourced pin, with a link to site arrival points. Facility pins offer map inspection; they are not substituted for an arrival gate or added to site directions choices. |
| Point changes | Save retains the original address, site identity, physical hierarchy and equipment relationships. Each change adds a source and readable before/after history to the exact site or facility record. |
| Point removal | Requires a reason and an exact-point confirmation. Cancel retains the saved point and open proposal. Removal keeps the earlier source/history; a removed selected destination falls back visibly to Physical address. |
| Copy address | Copies the complete physical address. Unavailable or refused clipboard access opens selectable text; failure is not reported as success. |
| Visit brief | Retains the selected site's address, arrival points, selected facility pin, source bodies and generated map URLs in an inspectable snapshot. Unconfirmed points have no directions URL. |
| Local continuity | R03 uses its own storage key. It can read a valid r02 or r01 example without rewriting the earlier key; backups retain optional map metadata and sources. |

Map controls use existing r20 navy actions, Roboto, 6 px controls, 7 px cards and the shared positioned choice-card implementation. Destination selection stays in the local site workspace; no rail, global header or embedded map is added.

## Integrity and horticultural boundaries

- Organisation, addressed Site, Facility and Equipment remain distinct. A pump retains one identity and its installed/served-area relationships.
- Addresses remain editable site information; points are separate coordinate records. Address amendments regenerate address links but do not silently relocate independent entrance or facility pins.
- Coordinates accept signed decimal degrees with up to seven decimal places, latitude −90 to 90 and longitude −180 to 180. Both values are required when recording a point; blank optional points remain unrecorded. Zero is a valid coordinate, never a default.
- Point purposes cannot be duplicated on one site. Contacts and sources must belong to the same site; malformed coordinate, status, source and check-date records are rejected during retained-data validation.
- Links are built from a fixed Google Maps HTTPS origin. The entered address is encoded as a parameter, never treated as an executable URL or hostname. Overlength links are not emitted; the address can still be copied.
- Only deliberate link activation opens Google Maps. There is no automatic geocoding, map request, device-location capture, embedded SDK, API key or route calculation in PPO. Directions omit the origin, letting Google Maps determine or request it; links request a driving route without automatically starting navigation.
- All starter addresses remain fictional and every optional point starts blank. No coordinates are invented from the illustrative site-plan rectangles. UI confirmation records a reviewed example; it is not independent survey or real-world destination verification.
- Farm entrances, turning areas, vehicle height limits and current access instructions remain separate information. A driving route does not establish heavy-vehicle suitability, biosecurity clearance or permission to enter a growing area.

## Verification and remaining acceptance

The [check script](../../scripts/check-customers-sites-design-r03.mjs) passes **98 model/DOM-emulation groups**, comprising the 72 retained workspace checks and 26 map-extension groups. It checks exact address encoding, fixed origins, URL limits, coordinate boundaries, card link semantics, default and selected destinations, all three arrival purposes, confirmation/reset/cancel, site switching, source/history preservation, copy success/fallback/refusal, facility separation, visit-brief snapshots, invalid retained data, point removal and r02 storage continuity.

The source theme profile, embedded fonts and workspace-only composition remain covered. The output hash and named results are retained in the evidence file. Test coordinates are synthetic inputs and no destination is opened or verified through these checks.

Native dialogs, menu geometry and clipboard are simulated under optional jsdom 27.0.1 outside application dependencies. Actual Google Maps app handoff, browser/device rendering, native focus, clipboard and downloads remain unverified. The earlier native local-HTML preview rejection is respected; no alternate URL, renderer or hosting bypass was used.

This delivers the HTML design extension, not database fields, shared commands, map-provider integration or production acceptance. CS-08 survey capture, richer site lifecycle, more than one gate per arrival purpose, surveyed geometry and operational receiving integrations remain separate work.
