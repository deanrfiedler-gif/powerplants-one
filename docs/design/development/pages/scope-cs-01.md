# Customer 360 — native receiving reference

Stable entry: `scope:CS-01`. Scope: **CS-01**. Owner: Dean Fiedler.
Source main: `25170bf83008727f005e36b5603841a7b9359027`. Route: `/customers/[id]`.
Native implementation and adaptations are proposed for owner review; this is not a new accepted visual baseline.

## Purpose and page type

Bring together the current permitted customer context and exact links into owning workspaces.

r20 page type: **Record detail; Overview / dashboard**. Overview, Deals & quotations, Sales orders, Cases & service, Projects, Sites & equipment, Accounts, Activity & documents.

## Desktop

Use the current native PPO shell and padded content composition. Reuse PageHeader, RecordTabs/RecordPanel, Field/SelectField, ReadState, ErrorNotice and the existing command recovery controls. Keep source ownership, unknown/restricted states and exact record links visible. The shared shell retains header, search and global navigation; no standalone demo shell is copied.

The native proposal receives the business views rather than the standalone drawer geometry. The owning page scrolls; horizontal scrolling is confined to the tab strip. Paired retained-source/native inspection and actual viewport evidence are recorded in the CS handover.

## Mobile

Stack fields and record facts; let long names and unknown values wrap. Keep labelled save/recovery controls, visible focus and keyboard-operable tabs. Inspect 430, 390 and 320 CSS px and intermediate 768/1024 layouts. No information or required decision is hidden to make a screenshot fit.

## Sources, handovers and authority

Customer 360 is a projection. CRM, Estimating, Service, Projects and Finance keep their decisions. MYOB orders and a generic SharePoint document library are not connected; unavailable is not zero. Account currencies and alternative estimate populations are never totalled.

Incoming: exact canonical customer/Site/Person and permitted source records. Outgoing: exact source links, owned Activity follow-up and, for surveys, an immutable Reviewed receiving snapshot. Preserve canonical Facilities and their installed-versus-served equipment distinction.

Reference: docs/reference/ui/customers/PPO-Customer-360-Workspace-r01.html

## Verification and acceptance

The detailed page guide is `guide.cs.01`. [CS receiving handover](../../../delivery/cs-native-completion-handover.md) records executed behaviour, visual inspection, source hashes and open business definitions. Owner/device acceptance and deployment remain separate.


## Figma proposal — refined 14 October 2026

The [Customer 360 Figma design record](../../../decisions/customer-360-figma-design.md) adds an editable proposal on page node `554:2`, refined on 14 October after Dean requested alignment with the other PPO pages. Comparison used accepted Leads, Project record and My Work. Reuse the shared navy primary rail, light customer-view menu, global search/header, phone header/bottom tabs, PPO Roboto, colour/layout tokens, icons, Button and Tag. Full account mapping and site-party detail remains in Identity & mappings. The local Summary tile is reference-only, bound to this stable scope in the component catalogue. No native workflow is changed by the drawing.

Current icon-free 1440 × 900 desktop and 390 × 844 phone Overview captures are retained in `docs/reference/ui/customers/customer-360-figma-r02/`, with hashes and all frame IDs in its README; r01 is retained unchanged. Desktop has 240 px primary and secondary navigation, a 64 px top bar, a 960 px content workspace with 24 px gutters, two rows of four 228 × 112 px summary cells, and a 640 × 900 px right-side order snapshot. Phone uses 16 px gutters, compact summary rows, the shared header/bottom tabs and customer-view drawer `591:7839`. Desktop menus and exact partial/stale snapshots have prototype reactions; phone Overview and Sales orders link to each other and open/close their drawer. Other phone views, rail collapse/More and filter/search/customer-switch changes remain specifications.

Missing evidence: named saved Figma version, retained screenshots of every other view/state, native paired comparison, complete phone workflow, browser click-through, keyboard/screen-reader/device acceptance and owner acceptance. None is inferred from the two captures. Existing functional/deployment records and review fingerprints remain unchanged.
