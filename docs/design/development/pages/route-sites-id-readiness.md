# Site access & horticultural readiness — native receiving reference

Stable entry: `route:/sites/[id]/readiness`. Scope: **CS-06**. Owner: Dean Fiedler.
Source main: `25170bf83008727f005e36b5603841a7b9359027`. Route: `/sites/[id]/readiness`.
Native implementation and adaptations are proposed for owner review; this is not a new accepted visual baseline.

## Purpose and page type

Record exact requirements, evidence and work windows, then evaluate and acknowledge a retained visit preparation.

r20 page type: **Planning workspace; Review / comparison**. Overview, Requirements, Visitor / biosecurity / evidence, Work windows, Visit preparation and Review / history.

## Desktop

Accepted design: the [Access & readiness design decision](../../../decisions/access-readiness-figma-design.md) of 18 October 2026, with captures 01–04 (desktop 1440, full length) and 05 (tablet 1024) in [design r01](../../../reference/ui/site-access/access-readiness-design-r01/README.md). Figma page "Access & readiness · CS-06" `1400:346423`: Overview `1400:346553`, Requirements `1400:351900`, Evidence review `1400:353096`, Visit preparation acknowledge with a blocker `1400:353479`, tablet `1400:354078`.

- **Layout:** the accepted record layout opened from a site (D1): a header with the readiness tag, revision, readiness owner, site time zone, "as at" time, record position, Record readiness contact and Check preparation; a bar for the next visit (requirements, work window, inductions, approvals, customer confirmation, work authority); site facts, the readiness record and the visits to prepare on the left; Overview, Requirements, Evidence, Work windows, Visit preparation and History tabs.
- **Overview:** the latest preparation check for the next visit with each unmet requirement and the action that resolves it (D2), and the P4 customer confirmation with its four checks beside it (D3). P4 is one record on the appointment's schedule version, recorded from this page and from the appointment (Q1); P4 is not built.
- **Requirements:** a table grouped by site-wide and area scope with kind, activity and evidence state in words; editing starts a new revision that stays a draft until another editor reviews it (D4).
- **Forms:** evidence review (D5) and acknowledge with a blocker (D6) show the capture and check facts as read-only rows; only the review note or reason is editable (Q2). Acknowledging lists what it does not grant: work authority, booking, resource reservation, pack issue and dispatch. A changed source refuses the save.
- **Tablet:** rail collapsed and a narrower facts column (D7).
- **Shell:** the proposed Conversations action sits left of the information icon.
- Nothing new is built. Work windows need weekdays before real use (Q3); "Recheck required" on the planner and job pack follows P4 (Q4).

Use the current native PPO shell and padded content composition. Reuse PageHeader, RecordTabs/RecordPanel, Field/SelectField, ReadState, ErrorNotice and the existing command recovery controls. Keep source ownership, unknown/restricted states and exact record links visible. The shared shell retains header, search and global navigation; no standalone demo shell is copied.

The native proposal receives the business views rather than the standalone drawer geometry. The owning page scrolls; horizontal scrolling is confined to the tab strip. Paired retained-source/native inspection and actual viewport evidence are recorded in the CS handover.

## Mobile

Accepted design: captures 06 (phone 390), 07 (phone 320) and 08 (two phone states) in [design r01](../../../reference/ui/site-access/access-readiness-design-r01/README.md); Figma `1400:347071`, `1400:355748`, `1400:356261`, `1400:356329`. The check comes first, then the customer confirmation (D7). The footer keeps "…", Record contact and Check again; at 320 px Record contact moves into "…". States: source changed since the check (acknowledgement refused, nothing saved) and no requirements recorded (readiness Unknown).

Stack fields and record facts; let long names and unknown values wrap. Keep labelled save/recovery controls, visible focus and keyboard-operable tabs. Inspect 430, 390 and 320 CSS px and intermediate 768/1024 layouts. No information or required decision is hidden to make a screenshot fit.

## Sources, handovers and authority

Facility type or hierarchy does not imply readiness. Captured evidence is not reviewed evidence; edited or expired evidence does not satisfy an earlier review. No work window means access is unknown. Acknowledgement grants no work authority, booking, resource reservation, pack issue or dispatch clearance.

Incoming: exact canonical customer/Site/Person and permitted source records. Outgoing: exact source links, owned Activity follow-up and, for surveys, an immutable Reviewed receiving snapshot. Preserve canonical Facilities and their installed-versus-served equipment distinction.

Reference: docs/reference/ui/site-access/PPO-Site-Access-and-Horticultural-Readiness-r01.html

## Verification and acceptance

Accepted Figma design: [Access & readiness design r01 captures](../../../reference/ui/site-access/access-readiness-design-r01/README.md) (eight icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/access-readiness-figma-design.md). The named version "Access & readiness — accepted" was saved on 18 October 2026. Images of the Work windows and History tabs, the Record readiness contact form, adding or editing a requirement, evidence or window, the check form, desktop states, and denied and restricted states are still missing.

The detailed page guide is `guide.route-sites-id-readiness`. [CS receiving handover](../../../delivery/cs-native-completion-handover.md) records executed behaviour, visual inspection, source hashes and open business definitions. Owner/device acceptance and deployment remain separate.
