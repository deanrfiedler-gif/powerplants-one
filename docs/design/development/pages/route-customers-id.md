# Customer 360 — native receiving reference

Stable entry: `route:/customers/[id]`. Scope: **CS-01**. Owner: Dean Fiedler.
Source main: `25170bf83008727f005e36b5603841a7b9359027`. Route: `/customers/[id]`.
Native implementation and adaptations are proposed for owner review; this is not a new accepted visual baseline.

## Purpose and page type

Bring together the current permitted customer context and exact links into owning workspaces.

r20 page type: **Record detail; Overview / dashboard**. Overview, Deals & quotations, Sales orders, Cases & service, Projects, Sites & equipment, Accounts, Activity & documents.

## Desktop

Use the current native PPO shell and padded content composition. Reuse PageHeader, RecordTabs/RecordPanel, Field/SelectField, ReadState, ErrorNotice and the existing command recovery controls. Keep source ownership, unknown/restricted states and exact record links visible. The shared shell retains header, search and global navigation; no standalone demo shell is copied.

The native proposal receives the business views rather than the standalone drawer geometry. The owning page scrolls; horizontal scrolling is confined to the tab strip. Paired retained-source/native inspection and actual viewport evidence are recorded in the CS handover.

The maintained [record-tabs catalogue](../components/tabs.md) includes a Customer 360 state with the eight native labels. It exercises the actual shared keyboard and panel controls; source queries and URL restoration remain owning-page behaviour.

## Mobile

Stack fields and record facts; let long names and unknown values wrap. Keep labelled save/recovery controls, visible focus and keyboard-operable tabs. Inspect 430, 390 and 320 CSS px and intermediate 768/1024 layouts. No information or required decision is hidden to make a screenshot fit.

## Sources, handovers and authority

Customer 360 is a projection. CRM, Estimating, Service, Projects and Finance keep their decisions. MYOB orders and a generic SharePoint document library are not connected; unavailable is not zero. Account currencies and alternative estimate populations are never totalled.

Incoming: exact canonical customer/Site/Person and permitted source records. Outgoing: exact source links, owned Activity follow-up and, for surveys, an immutable Reviewed receiving snapshot. Preserve canonical Facilities and their installed-versus-served equipment distinction.

Reference: docs/reference/ui/customers/PPO-Customer-360-Workspace-r01.html

## Verification and acceptance

PT-27 moves the existing DuplicateCandidates panel to `src/components/duplicate-candidates.tsx` so CustomerWorkspace no longer imports unrelated context screens. Its query, self-exclusion, exact links, loading/retry and no-auto-merge explanation remain unchanged. CS-01 remains Record detail; Overview / dashboard, with the same incoming directory and outgoing identity handovers. The [directory/receiving host contract](../components/crm-directory.md) binds P03's same-name fixture and the controlled ten-user receiving timings. Desktop/phone captures and functional checks remain distinct from owner/device approval; no new accepted image is available.

The detailed page guide is `guide.page.customers.id`. [CS receiving handover](../../../delivery/cs-native-completion-handover.md) records executed behaviour, visual inspection, source hashes and open business definitions. Owner/device acceptance and deployment remain separate.
