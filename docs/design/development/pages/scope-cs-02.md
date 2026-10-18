# Contact directory and detail — native receiving reference

Stable entry: `scope:CS-02`. Scope: **CS-02**. Owner: Dean Fiedler.
Source main: `25170bf83008727f005e36b5603841a7b9359027`. Route: `/people/[id]`.
Native implementation and adaptations are proposed for owner review; this is not a new accepted visual baseline.

## Purpose and page type

Find a canonical Person and maintain accurate contact information without inventing customer authority or consent.

r20 page type: **Register / worklist; Record detail**. Identity & channels, Relationships, Downstream reliance and Correction history. The Contacts directory continues to switch between People and Organisations.

## Desktop

Accepted design: the [People design decision](../../../decisions/people-figma-design.md) of 18 October 2026 covers the directory (`/people`, the People view of `/contacts`) and the contact record (`/people/[id]`), with nine icon-free captures in [design r01](../../../reference/ui/customers/people-design-r01/README.md). Departures D1–D6 and answers Q1–Q3 are recorded there. Nothing new is built.

Use the current native PPO shell and padded content composition. Reuse PageHeader, RecordTabs/RecordPanel, Field/SelectField, ReadState, ErrorNotice and the existing command recovery controls. Keep source ownership, unknown/restricted states and exact record links visible. The shared shell retains header, search and global navigation; no standalone demo shell is copied.

The native proposal receives the business views rather than the standalone drawer geometry. The owning page scrolls; horizontal scrolling is confined to the tab strip. Paired retained-source/native inspection and actual viewport evidence are recorded in the CS handover.

## Mobile

Stack fields and record facts; let long names and unknown values wrap. Keep labelled save/recovery controls, visible focus and keyboard-operable tabs. Inspect 430, 390 and 320 CSS px and intermediate 768/1024 layouts. No information or required decision is hidden to make a screenshot fit.

## Sources, handovers and authority

Person has no invented display reference, structured role taxonomy or purchasing authority. Interaction history is explicitly derived from permitted linked workflows because Activities do not link directly to Person. Restricted contacts and affiliations are not presented as absent.

Incoming: exact canonical customer/Site/Person and permitted source records. Outgoing: exact source links, owned Activity follow-up and, for surveys, an immutable Reviewed receiving snapshot. Preserve canonical Facilities and their installed-versus-served equipment distinction.

Reference: docs/reference/ui/customers/PPO-Contacts-Stakeholders-and-Relationships-r01.html

## Verification and acceptance

Accepted Figma design: [People design r01 captures](../../../reference/ui/customers/people-design-r01/README.md) (nine icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/people-figma-design.md). The Notices and History tabs at full size, ending an affiliation, creating a person, restricted-affiliation and denied states are not drawn.

The detailed page guide is `guide.cs.02`. [CS receiving handover](../../../delivery/cs-native-completion-handover.md) records executed behaviour, visual inspection, source hashes and open business definitions. Owner/device acceptance and deployment remain separate.
