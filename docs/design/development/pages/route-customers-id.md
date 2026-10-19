# Customer 360 — native receiving reference

Stable entry: `route:/customers/[id]`. Scope: **CS-01**. Owner: Dean Fiedler.
Source main: `25170bf83008727f005e36b5603841a7b9359027`. Route: `/customers/[id]`.
Native implementation and adaptations are proposed for owner review; this is not a new accepted visual baseline.

## Current CS-01 implementation — 19 October 2026

[Accepted D1–D7 / Q1–Q4](../../../decisions/organisations-figma-design.md) and [implementation/adaptations](../../../decisions/organisations-figma-implementation.md) govern the current native build. Earlier proposal sections below remain provenance, not the current target. No issued reference or parent requirement ID changes.

Register: authorised one-snapshot rows/counts/owners, signed pagination, Status/owner/search/views in the URL, shared grid on desktop and rows on phones, snapshot and legacy saved-view commands. Open service is Unknown because no combined closure read is established. Organisation row selection never enters the URL. Numeric site/area links retain the exact organisation handover.

Record: shared identity/source/facts layout, seven URL-retained tabs, type and status filters, exact source handovers and sticky phone follow-up. Current site roles are separate from historical relationships. Source limitations, unavailable/partial/denied states and finance restrictions stay explicit. Correct details uses only the existing display-name revision; stale and uncertain writes keep the original operation.

Create: Organisation, Owner and source, Notes, and Check before creating; actual company/owner selectors and duplicate-name read, optional legal name/sector/notes using the existing create command. Notes keep Internal visibility. A Lead selection returns for explicit LC-12 review/save. Other shared-create variants retain their workflows.

Desktop checks: 1440 × 900/1234, 1280 × 900 and 1024 × 900. Phone: 390 × 844 and 320 × 844. Exact source captures 01–10 are listed in [r01](../../../reference/ui/customers/organisations-design-r01/README.md). Additional snapshot, denied, correction and form-recovery states use established shared patterns; no additional accepted image exists for them. [Host state recipes](../organisations-native-fixtures.json) and [native evidence](../../../testing/evidence/organisations-native-r01/README.md) retain the verification limits.

Guides remain Draft. Source presence, local proof, visual review, baseline acceptance and deployment remain separate.

## Purpose and page type

Bring together the current permitted customer context and exact links into owning workspaces.

r20 page type: **Record detail; Overview / dashboard**. Overview, Sales, Service, Projects, Sites, Accounts and Activity (D3/D5); phone puts Sites fourth (Q4).

## Desktop

Accepted design: the [Organisations design decision](../../../decisions/organisations-figma-design.md) of 18 October 2026, with captures 02–04 in [design r01](../../../reference/ui/customers/organisations-design-r01/README.md) (Figma `1443:2745`, `1445:381060`, `1449:381169`). The record uses the accepted record layout with a "Sources for this customer" bar (D3), open work by source and owned follow-ups (D4), seven tabs (D5) and a Sales tab with type chips and a Status filter (D6). Create follow-up is the primary action (Q1). The shared record composition above now implements that design, with its documented source adaptations.

Use the current native PPO shell with the full-bleed shared record interior and its own content gutters. Reuse PageHeader, RecordTabs/RecordPanel, Field/SelectField, ReadState, ErrorNotice and the existing command recovery controls. Keep source ownership, unknown/restricted states and exact record links visible. The shared shell retains header, search and global navigation; no standalone demo shell is copied.

The native proposal receives the business views rather than the standalone drawer geometry. The owning page scrolls; horizontal scrolling is confined to the tab strip. Paired retained-source/native inspection and actual viewport evidence are recorded in the CS handover.

The maintained [record-tabs catalogue](../components/tabs.md) includes a Customer 360 state with the eight native labels. It exercises the actual shared keyboard and panel controls; source queries and URL restoration remain owning-page behaviour.

## Mobile

Accepted design: captures 08–10 in [design r01](../../../reference/ui/customers/organisations-design-r01/README.md): Customer 360 at 390 and 320, and the state where Service could not be read.

Stack fields and record facts; let long names and unknown values wrap. Keep labelled save/recovery controls, visible focus and keyboard-operable tabs. Inspect 430, 390 and 320 CSS px and intermediate 768/1024 layouts. No information or required decision is hidden to make a screenshot fit.

## Sources, handovers and authority

Customer 360 is a projection. CRM, Estimating, Service, Projects and Finance keep their decisions. MYOB orders and a generic SharePoint document library are not connected; unavailable is not zero. Account currencies and alternative estimate populations are never totalled.

Incoming: exact canonical customer/Site/Person and permitted source records. Outgoing: exact source links, owned Activity follow-up and, for surveys, an immutable Reviewed receiving snapshot. Preserve canonical Facilities and their installed-versus-served equipment distinction.

Reference: docs/reference/ui/customers/PPO-Customer-360-Workspace-r01.html

## Verification and acceptance

Accepted Figma design: [Organisations design r01 captures](../../../reference/ui/customers/organisations-design-r01/README.md) and its [decision](../../../decisions/organisations-figma-design.md). The Service, Projects, Sites, Accounts and Activity tabs at full size and the Accounts tab for a Finance user are not drawn.

PT-27 moves the existing DuplicateCandidates panel to `src/components/duplicate-candidates.tsx` so CustomerWorkspace no longer imports unrelated context screens. Its query, self-exclusion, exact links, loading/retry and no-auto-merge explanation remain unchanged. CS-01 remains Record detail; Overview / dashboard, with the same incoming directory and outgoing identity handovers. The [directory/receiving host contract](../components/crm-directory.md) binds P03's same-name fixture and the controlled ten-user receiving timings. Desktop/phone captures and functional checks remain distinct from owner/device approval; no new accepted image is available.

The detailed page guide is `guide.page.customers.id`. [CS receiving handover](../../../delivery/cs-native-completion-handover.md) records executed behaviour, visual inspection, source hashes and open business definitions. Owner/device acceptance and deployment remain separate.

PT-27 refined execution: [source-bound timing and captures](../../../testing/evidence/pt27-loading/direct-directory-refined/README.md) pass all 320 directory loads and 80 actual record openings. Initial script bytes fall 6.91%; cold targets and visual/owner/device review remain open. This evidence changes no accepted reference or review fingerprint.

## Figma register handover — proposed 14 October 2026

The Customers register now has a separate editable Figma entry screen. Its exact canonical rows/cards open Willowbank or Rothwell Customer 360; the profile header shows Back to customers, while Change customer and the Customers rail/breadcrumb return to the originating register example. A prototype-only variable retains the demonstrated search/filter/sort frame with scroll reset disabled. This changes no native receiving behaviour or runtime persistence.

The [r03 manifest](../../../reference/ui/customers/customer-360-figma-r03/README.md) retains 1440 × 900 desktop captures of both customers and 390 × 844 phone register evidence. The [Customers contract](route-customers.md) and [CS-01 contract](scope-cs-01.md) define the common shell, profile identity and source ownership. The Rothwell phone was inspected but has no retained r03 PNG. Named Figma version, paired native comparison and owner/device acceptance remain pending.

All table-bearing customer views now follow the accepted Leads Grid header/cell treatment recorded in the [r04 manifest](../../../reference/ui/customers/customer-360-figma-r04/README.md). The source-rich rows retain their metadata through explicit taller-row adaptations; shared runtime controls and source ownership remain unchanged.
