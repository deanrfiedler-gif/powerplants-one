# Contact directory and detail — native receiving reference

Stable entry: `route:/people/[id]`. Scope: **CS-02**. Owner: Dean Fiedler.
Source main: `25170bf83008727f005e36b5603841a7b9359027`. Route: `/people/[id]`.
Native implementation and adaptations are proposed for owner review; this is not a new accepted visual baseline.

## Purpose and page type

Find a canonical Person and maintain accurate contact information without inventing customer authority or consent.

r20 page type: **Register / worklist; Record detail**. Identity & channels, Relationships, Downstream reliance and Correction history. The Contacts directory continues to switch between People and Organisations.

## Desktop

Accepted design: the [People design decision](../../../decisions/people-figma-design.md) of 18 October 2026, with captures 02–04 (desktop) in [design r01](../../../reference/ui/customers/people-design-r01/README.md). Figma page "People · CS-02" `1395:150275`: Overview full length `1395:150562`, Relationships `1396:175528`, Correct details `1396:354723`.

- **Layout:** the accepted shared record layout with a "Before you rely on this contact" bar (phone, email, preference, current affiliation, notice exceptions, authority not recorded), identity, current affiliation and site roles on the left, and Overview, Relationships, Relied on by, Notices and History tabs (D3).
- **Reliance:** the overview lists what relies on the person, from permitted links only, each with its consequence in words; never called an interaction log (D4).
- **Notice preferences:** M1–M4 per class with the basis (named recipient when nothing is recorded, otherwise Allowed or Do not notify with who, when and why). Changing one sends nothing (D5, D-025).
- **Correct details:** the primary action (Q1); one form with a required reason that names the changed values and the relying records before saving (D6). Inactivating a site primary contact is allowed with a warning (Q3). The role stays recorded free text (Q2).
- Nothing new is built; the tabbed contact workspace below remains the built page.

Use the current native PPO shell and padded content composition. Reuse PageHeader, RecordTabs/RecordPanel, Field/SelectField, ReadState, ErrorNotice and the existing command recovery controls. Keep source ownership, unknown/restricted states and exact record links visible. The shared shell retains header, search and global navigation; no standalone demo shell is copied.

The native proposal receives the business views rather than the standalone drawer geometry. The owning page scrolls; horizontal scrolling is confined to the tab strip. Paired retained-source/native inspection and actual viewport evidence are recorded in the CS handover.

## Mobile

Accepted design: captures 07, 08 and 09 in [design r01](../../../reference/ui/customers/people-design-r01/README.md) (`1395:151108`, `1396:355861`, view only `1396:355987`). A compact header, Overview, Relations, Notices and History tabs, a Contact card whose phone and email open the user's own apps, Relied on by, and Correct details as the sticky primary action. In view only, correction history is shown only to people who can correct the contact.

Stack fields and record facts; let long names and unknown values wrap. Keep labelled save/recovery controls, visible focus and keyboard-operable tabs. Inspect 430, 390 and 320 CSS px and intermediate 768/1024 layouts. No information or required decision is hidden to make a screenshot fit.

## Sources, handovers and authority

Person has no invented display reference, structured role taxonomy or purchasing authority. Interaction history is explicitly derived from permitted linked workflows because Activities do not link directly to Person. Restricted contacts and affiliations are not presented as absent.

Incoming: exact canonical customer/Site/Person and permitted source records. Outgoing: exact source links, owned Activity follow-up and, for surveys, an immutable Reviewed receiving snapshot. Preserve canonical Facilities and their installed-versus-served equipment distinction.

Reference: docs/reference/ui/customers/PPO-Contacts-Stakeholders-and-Relationships-r01.html

## Verification and acceptance

Accepted Figma design: [People design r01 captures](../../../reference/ui/customers/people-design-r01/README.md) (nine icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/people-figma-design.md). The Notices and History tabs at full size, ending an affiliation, creating a person, restricted-affiliation and denied states are not drawn.

The detailed page guide is `guide.page.people.id`. [CS receiving handover](../../../delivery/cs-native-completion-handover.md) records executed behaviour, visual inspection, source hashes and open business definitions. Owner/device acceptance and deployment remain separate.

The shared shell's `nav-current-page-reload` fixture also consumes this record: an unsaved correction survives approved same-record search, a later edit and cancelled native reload on desktop/phone. No UI correction is posted. See [current-page correction evidence](../../../testing/evidence/navigation-current-page/README.md); the existing stable route and scope are retained.
