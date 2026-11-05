# Engineering workload — design reference

Stable entry: `route:/engineering`. Owner: Dean Fiedler. Application destination: `/engineering`.
Status: **Implementation under validation; application visual review and owner acceptance pending**.
Parent trace: ENG-01–ENG-04, EN-01. Existing package identity, native technical authority and issued references are retained.

## Purpose and task

Find permitted Engineering packages, distinguish owned coordination from author/reviewer work, identify missing prerequisites and follow an exact package into its native records. Coordination status never approves or releases technical content. Actual effort, availability and utilisation remain unknown.

## Desktop

The authority is the [accepted Engineering workload decision](../../../decisions/engineering-workload-design.md), accepted page 184:1047 and desktop 184:1048, with the later shared shell/top-bar amendments. Historical “proposal” component names do not change that acceptance. [Retained captures 01–03](../../../reference/ui/engineering/engineering-workload-design-r01/README.md) are design evidence, not application acceptance.

- The Engineering rail and flush 240 px secondary menu surround a compact toolbar and the shared register table. The page opts into shared styles with `data-ppo-workspace="shared"`; no shared CSS page-ID list is extended.
- Views are All packages, My work, Author actions, Reviews assigned to me and Released. Separate controls intersect coordination status and Needs attention. Neutral menu counts cover the full permitted matching set before the selected view/status; the toolbar count describes that selected intersection.
- New request reuses the native intake dialog, scoped context/assignment options and original-operation recovery. Search, Engineer and Discipline are filters. Engineer choices are **recorded owners**, including explicitly labelled inactive people; they are not assignment recommendations.
- The 40 px grid retains Reference, Work package, Customer, Status, Required by, Engineer, Next action, Action due, Deliverables, Discipline and Project or opportunity. Checkbox and row-action columns remain fixed. Columns can be hidden or resized, including with the keyboard. Server sorting supports Required by, Reference, Work package, Action due and Last updated; date nulls are last in both directions.
- Opening a row overlays a right-aligned snapshot, capped at 960 px. Summary, next action/blocker, design brief and exact-package links sit beside Deliverables, Queries, Reviews & issues and coordination history. Open package retains the existing full record route; Update coordination retains its native version/reason checks.
- Selected current-page rows appear in a 360 px panel. When paging is needed, its shared footer remains below the panel; a single-page result has no paging footer. CSV and Open in sequence recheck the permitted register source first. Neither action changes a package or releases content.

At 1024 px the shared menu can collapse and the toolbar wraps when necessary. The grid keeps its column widths and scrolls internally. A window never compresses the grid.

## Mobile

The current shared phone header supplies the title, view/menu access, count, filters and conversations; it supersedes the earlier header composition in capture 04. The Engineering bottom bar has five icon buttons with accessible names: My Work, Engineering workload, Drawings, Technical reviews and More.

- Flush rows show title/date, reference/status and customer/recorded engineer. New request uses the floating primary action. Missing dates and inactive owners remain explicit.
- A row opens a full-screen stacked snapshot with a back control, the full package reference, Previous, Next and More (including Refresh). Open package and Update coordination remain reachable at the bottom.
- At 390 and 320 px the list, filter sheet and snapshot must stay within the viewport. The compact header provides Select packages; selection mode exposes checkboxes and a selected-count button opening the shared sheet. No permanent toolbar or count row sits below the phone header. Refresh is available in Filter and on return to the page. At 320 px snapshot sequence controls move into More, preserving the reference and 44 px header targets. This is an implementation adaptation for the accepted design's unresolved phone-selection interaction; it requires owner review.
- Inputs retain readable phone text sizing. Long context and technical facts wrap; the grid is replaced by the list.

## Read basis, states and handovers

`GET /api/v1/engineering/register` supplies page rows, complete matching counts, recorded-owner choices, observation date/time, completeness, a source version and a source-bound continuation. Ordering and pagination stay on the server. A changed filter starts at page one. A rejected continuation automatically clears incompatible selection/sequence state and starts a fresh first page with a visible notice.

Loading or a failed refresh removes unconfirmed rows, counts and owner choices. Denied access, filtered-empty and empty queues have explicit messages and retry/clear controls. A source change before CSV or sequence navigation prevents that handover and asks for selection again. Selection is limited to the displayed page and source; it never silently expands to unloaded results.

Package detail and native technical control are separate permitted reads. A failed or mismatched technical read leaves the permitted package summary available but withholds technical counts/records and offers refresh. Restricted sources are excluded. Technical registers fail explicitly beyond their native bound; coordination history identifies its latest-100 limit. No absent technical record is presented as a complete global zero.

My work follows package ownership. Author actions follows the native authored-work predicate. Assigned reviews require a submitted review assigned to this reader. Released requires a current exact formal issue. Needs attention uses overdue package/action dates, recorded blockers or missing deliverable prerequisite evidence. The three coordination states do not replace any technical rule.

Incoming handovers preserve permitted Project/Opportunity/customer/site context. Outgoing links carry the exact package into EN-02–EN-08 and the existing full package page. Destination reads independently enforce their authority. CSV contains only revalidated selected package facts, quotes text safely and does not claim to export technical evidence or a complete filtered result.

## Shared components and keyboard

Reuse shared shell/secondary menu, semantic tokens, Button/ButtonLink, register table/chips/footer/empty state, worklist choices/menus/sheets, record tabs/panels, native intake/coordination forms, read/error feedback and unsaved-change navigation. The [consumer binding](../component-bindings/2026-11-01-engineering-workload.md) records page-specific states and remaining alignment work.

Tab and Shift+Tab reach labelled controls. Enter/Space activates row links and checkboxes. Left/Right resizes a focused column handle and Home restores its default width. Escape closes a supported window and returns focus to the opener. Pending or uncertain writes prevent closing/navigation until the original operation is recovered. Notes survive tab changes; dirty coordination requires an explicit discard decision.

## Guide, evidence and review

The [Engineering guide](../../../guides/pages/guide.page.engineering.md) describes this register and the retained full package page. A rewritten guide remains InReview and is not treated as published.

The [execution ledger](../../../testing/evidence/engineering-workload/README.md) keeps functional proof, application/reference comparison, independent review, owner acceptance and deployment separate. Capture and inspect 1440 × 900, 1024 × 768, 390 × 844 and 320 × 844. Missing-date sorting, all native queues, counts beyond a page, stale continuation, inactive owners, source restrictions and exact-package handovers are required functional proof. Passing checks or captured images never grant visual acceptance.

## Revalidation and navigation

Returning to the window checks the current permitted register source in the background. An unchanged source preserves the current page, selection, sequence and keyboard location. A source rejection/change or denied scope clears incompatible selection and restarts at page one. A temporary failed recheck labels the last confirmed facts and retains selection for a guarded retry. Snapshot drafts remain mounted until the user refreshes or leaves.

Browser Back changes the open package without discarding the current page; a real filter change resets it. Search uses a local text draft and a 250 ms read debounce. Opening an unselected row uses the current page sequence rather than claiming an invalid selected sequence.

A confirmed native write changes the source: the UI announces the successful save, restarts the register at page one and requires a fresh selection. It does not silently bind an old selection to new results, even after the user's own save. This deliberately preserves the source-bound continuation contract.

The rail badge is the unfiltered permitted Author actions count from the same native register endpoint (limit one); the secondary menu counts continue to describe the active filtered register. Neither count is assignment eligibility or release authority.

## Create forms pattern — 1 November 2026

Dean accepted the [Create forms pattern](../../../decisions/create-forms-pattern-figma-design.md) (PPO-CREATE-FORMS-FIGMA-DEC) with the words "Accept recommendations". For this entry it draws **New engineering request**. The New request dialog is the only form. Its wording stays "What needs engineering?", and recovery says Retry original request. [Captures](../../../reference/ui/create-forms-design-r01/README.md) are designs, not application captures. The native page isn't changed; a build needs its own request. Source presence, visual review, functional proof and deployment stay separate, and no review fingerprint is supplied.
