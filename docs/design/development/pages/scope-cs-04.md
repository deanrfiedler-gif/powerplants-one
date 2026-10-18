# Site workspace — native receiving reference

Stable entry: `scope:CS-04`. Scope: **CS-04**. Owner: Dean Fiedler.
Source main: `25170bf83008727f005e36b5603841a7b9359027`. Route: `/sites/[id]`.
Native implementation and adaptations are proposed for owner review; this is not a new accepted visual baseline.

## Purpose and page type

Maintain canonical Site context and navigate its Facilities, equipment, readiness and as-found evidence.

r20 page type: **Record detail**. Details and Facilities & areas, with links to Access & readiness and Surveys & as-found briefs.

## Desktop

Accepted design: the [Sites design decision](../../../decisions/sites-figma-design.md) of 18 October 2026, with captures 01 (desktop 1440 × 900) and 04 (tablet 1024) in [design r01](../../../reference/ui/sites/sites-design-r01/README.md).

- **Register:** a grid, one row per site (D1). Columns: Site, Customer, Location, Site readiness, Biosecurity, Areas, Equipment, Next visit, Primary contact and Time zone. The toolbar has Customer and Readiness filters and the count with its "as at" time; search uses the top bar.
- **Views:** Sites is a shared record opened from More; the rail shows Service with More selected. The side menu lists Organisations and People, then All sites (default), Readiness to confirm, Biosecurity unknown and Address to review, then Facilities & growing areas, Site surveys & as-found and Equipment (D2).
- **Site numbers:** every site shows its `SYN-SITE-…` number (Q3).
- **Shell:** the proposed Conversations action sits left of the information icon.
- Nothing new is built.

Accepted design: the [Sites design decision](../../../decisions/sites-figma-design.md) of 18 October 2026, with captures 02–03 in [design r01](../../../reference/ui/sites/sites-design-r01/README.md).

- **Layout:** the accepted record layout (D3): a header with the site number, customer, location, primary contact, site time zone, record position, Access & readiness and Start service request (Q1); a "Before the next visit" bar (address, access, biosecurity, contact, readiness for the next visit, delivery basis); site facts, access and biosecurity and the next visit on the left; Overview, Facilities & areas, Equipment, Work and visits and History tabs.
- **Readiness:** when the next visit needs readiness confirmed, the overview says why and links to Access & readiness (CS-06, `/sites/[id]/readiness`). Readiness is never confirmed on this page (D4).
- **Open work:** permitted appointments, work orders, follow-ups and surveys at the site.
- **Maps:** an address handoff to external maps only, with the warning to confirm the arrival point; no embedded map (Q2).
- **Equipment:** a table grouped by facility with "Installed in" and "Serves" as separate columns and identity status in words (D5).
- Nothing new is built.

Use the current native PPO shell and padded content composition. Reuse PageHeader, RecordTabs/RecordPanel, Field/SelectField, ReadState, ErrorNotice and the existing command recovery controls. Keep source ownership, unknown/restricted states and exact record links visible. The shared shell retains header, search and global navigation; no standalone demo shell is copied.

The native proposal receives the business views rather than the standalone drawer geometry. The owning page scrolls; horizontal scrolling is confined to the tab strip. Paired retained-source/native inspection and actual viewport evidence are recorded in the CS handover.

## Mobile

Accepted design: captures 05 and 08 in [design r01](../../../reference/ui/sites/sites-design-r01/README.md). List rows with the site name, customer and location, the next visit date or "None booked", and one status line with an icon. The view and customer filters, the count and the "as at" time stay above the list. Sites is reached from More. Three states: loading, no matching sites with Clear the search, and could not load with no list or counts.

Accepted design: captures 06–07 in [design r01](../../../reference/ui/sites/sites-design-r01/README.md). Readiness comes first, then access and biosecurity "before you go": address with Maps, gate code, footbath and the primary contact with Call (D6). The footer at 390 px holds "…", Readiness and Service request; at 320 px it keeps Service request and moves Readiness into "…".

Stack fields and record facts; let long names and unknown values wrap. Keep labelled save/recovery controls, visible focus and keyboard-operable tabs. Inspect 430, 390 and 320 CSS px and intermediate 768/1024 layouts. No information or required decision is hidden to make a screenshot fit.

## Sources, handovers and authority

No duplicated Facility form is embedded. Equipment installation and areas it serves remain distinct. Delivery instructions are not separately verified. Access context does not establish Site readiness or work authority.

Incoming: exact canonical customer/Site/Person and permitted source records. Outgoing: exact source links, owned Activity follow-up and, for surveys, an immutable Reviewed receiving snapshot. Preserve canonical Facilities and their installed-versus-served equipment distinction.

Reference: docs/reference/ui/customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html

## Verification and acceptance

Accepted Figma design: [Sites design r01 captures](../../../reference/ui/sites/sites-design-r01/README.md) (eight icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/sites-figma-design.md). The named version "Sites — accepted" is not saved yet. Images of the other Sites views, the Facilities & areas, Work and visits and History tabs, editing and creating a site, desktop register states, the tablet site workspace, and denied and restricted states are still missing.

The detailed page guide is `guide.cs.04`. [CS receiving handover](../../../delivery/cs-native-completion-handover.md) records executed behaviour, visual inspection, source hashes and open business definitions. Owner/device acceptance and deployment remain separate.
