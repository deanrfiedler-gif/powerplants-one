# Sales briefs — design contract

<!-- versioning: git; committed history is authoritative -->

Stable entry: `route:/estimating/intake`. Owner: Dean Fiedler. Review: pending. Parent scope: CR-02. Navigation ID: `intake`. Route: `/estimating/intake`. Page type: r20 register / worklist with a submitted-brief snapshot and selection panel.

## Purpose and boundaries

Receive the latest submitted Sales brief revision. Sales preparation remains at `/sales/handoffs/estimating`; Intake & workload remains at `/estimating`. The queue records no receiving decision. Clarify, Answer, Resolve, Return and Accept remain on the native brief record, with current permissions, expected versions and original-operation recovery.

The [accepted design decision](../../../decisions/sales-briefs-design.md) and [five retained icon-free captures](../../../reference/ui/estimating/sales-briefs-design-r01/README.md) are the source: named version “Sales briefs — Pipedrive pattern, accepted”; page `152:1122`, desktop `152:1123`, selection `152:1302`, phone `152:1510`, notes `152:1530`. Historical “proposal” frame names do not downgrade the documented acceptance. The [Reviews & approvals pattern](../../../decisions/estimate-reviews-design.md), [top bar amendment](../../../decisions/shell-top-bar-amendment.md) and [phone header amendment](../../../decisions/phone-header-amendment.md) govern the shared shell. Design acceptance is separate from application acceptance.

## Receiving population and API

`GET /api/v1/sales/handovers/receiving` supplies rows, counts, customer and receiver choices, paging, completeness and observation time in one repeatable-read transaction. It projects every permitted handover's latest Submit event, its frozen content, source hash and revision, and the last receiving-state event in that revision. Draft-only records are absent. A successor draft never replaces submitted content, receiver, state, dates or update time. A prior revision's receiver is the actor of its immutable Return/Accept event; native successor creation requires that terminal outcome. Sales owner at submission is the Submit actor, because the native preparation command authorizes only that Opportunity's owner. Participant and customer/site display names remain current authorised labels. The next Sales action follows the submitted activity ID and shows its current authorised summary, owner and due date; native handover events do not freeze those activity fields. Submitted narrative, requested date/date reason and source IDs remain frozen.

The existing `estimating.edit` capability is checked at each brief's actual company/site, alongside native Opportunity, related evidence and historical-source visibility. Current working company also applies. Other receivers' permitted briefs remain visible; visibility never grants receiving authority. Hidden records contribute no rows, counts or facets, and denied direct reads are indistinguishable from missing records.

Search (reference, submitted title, customer and owner names), customer and receiving-owner filters apply before every view count and before paging. Facets come from the same full permitted submitted population. All briefs, Awaiting my decision, Assigned to me, five receiving-state views and Source changed share that basis. Counts are never inferred from a visible page. Default page size 50, maximum 100; newest receiving update first, stable ID tie-break. Later pages require the supplied basis token; source, state, identity, access or filter changes invalidate comparison and require a fresh first page.

`GET /api/v1/sales/handovers/receiving/[id]?revision=N&token=...` rechecks the exact snapshot. CSV uses the list endpoint's `selection=id:token,...` query (1–100 distinct selected rows). The server reauthorizes and compares every selected row before returning list fields; no partial export. Spreadsheet formula prefixes are escaped. CSV contains the exact brief link and no full narrative or hidden records.

## Receiving semantics

| View or state | Rule |
|---|---|
| All briefs | Every permitted latest submitted revision, including Returned and Accepted |
| Awaiting my decision | Receiving owner is the current actor; Submitted or Clarification answered, including source-changed briefs |
| Assigned to me | Every submitted receiving state owned by the current actor |
| Submitted | Submitted or resolved answer; available for native receiver review |
| Clarification requested | Receiver asked; Sales has not answered |
| Clarification answered | Sales answered; receiver must resolve the answer before acceptance |
| Returned | Terminal return and its owned follow-up; retained through a draft successor |
| Accepted | Exact acceptance retained through a draft successor; not estimating or quotation approval |
| Source changed | Current fingerprint differs for an open submitted revision; renewed review required |

Source changed is warning text with words and an icon. The native Accept command still refuses it; return for a corrected successor and review that submission. A terminal revision retains its outcome; its snapshot separately reports later source movement. Returned is muted. Terminal views remain all-time, consistent with the existing receiving read. No rail badge is introduced: no subsequently adopted Sales briefs badge rule was found.

## Desktop

Use `SecondaryMenuFrame` with `data-ppo-workspace="shared"`, shared tokens, controls and `RegisterTable`. The page has a labelled 240 px primary rail, a flush 240 px secondary menu, a 60 px toolbar and 40 px grid rows. The menu has no repeated title. Customer and Receiving owner filters, result count/as-at, Refresh and More occupy the toolbar. Search is available from More. The menu collapses using the shared edge/strip and becomes an overlay below the shared docked breakpoint.

Columns: Opportunity reference and submitted revision, Title, Customer, State, Updated, Requested, Receiving owner and Sales owner at submission. Checkbox and row-action/settings columns stay fixed during horizontal scroll. Titles/customers truncate in the grid and appear in full in the snapshot; column settings can hide optional columns. The page owns no document scroll.

A row opens a large overlapping snapshot aligned with the content edge. At 1440 px the brief column is 440 px; the remaining area holds Clarification (initial tab), Evidence and immutable revision History. Show submitted problem, outcome, included scope, exclusions, assumptions, unknowns, date or reason, source references, next Sales action, owners and submission time. Source drift is separate from frozen content. Exact Open opportunity and Open brief links form the footer.

Selecting rows replaces the toolbar and opens a 360 px side panel without shrinking the grid. Open in sequence orders selected rows by oldest receiving update, then ID. Export list rechecks selected current-page revisions. Selection does not accept, return, resolve, assign or create anything.

## Mobile

The shared compact 56 px header replaces the earlier two-row capture header: current view and count, search, Conversations and Filter; search and filter combine at 320 px. Choose view opens the shared sheet; search/filter opens the shared panel. Pull down refreshes the list; Refresh remains available in the filter panel. No duplicate toolbar sits below the header.

Rows are approximately 80 px at 390 px. At 320 px the state/date line wraps and rows grow to preserve readable state text. Tapping opens a full-screen snapshot with back, position, previous/next and More, a sticky two-link footer, and no visible tab bar. More keeps Open menu and permitted Conversations reachable; previous/next move there at 320 px. Desktop tabs and history stack below the brief and remain reachable by scrolling.

Press and hold selects a row; Select briefs in the filter panel is the explicit keyboard/touch alternative. Labelled checkboxes, Review selection, Clear selection, sequence and export remain available on phone. Escape closes dialogs/popovers and returns focus. Enter opens a focused title, Space toggles selection, and shared tabs support keyboard navigation. The 320 px contract contains all horizontal scrolling within the desktop grid; long phone content wraps. Online read authority is not offline authority.

## Read states and recovery

Loading has no inferred totals. An empty permitted queue differs from filtered no-results. Partial source reads label counts as lower bounds and retain a retry. Failed or denied reads clear earlier rows, counts, selection and snapshots. A changed page basis gives an explicit stale state and refreshes from the first page. Snapshot revision/token mismatch hides the earlier snapshot and its links until a fresh exact read succeeds. A late export response after a changed population or unmount is discarded. Export refusal clears selection and asks for fresh review.

Queue polling permits one read in flight, so a response slower than the refresh interval can still complete. Explicit refresh and changed query/identity discard older results; the two existing Sales handover list reads use the same guard. Native record reads/commands and the remaining useCrmResource consumers retain their current default.

The queue does not alter native uncertain-save recovery. After following Open brief, Check original result / Retry exact original and the existing expected-version guards still apply. If the linked revision is historical because Sales started or submitted a successor, the native detail shows that frozen submission without receiving controls; reviewing the current brief is a separate explicit link.

## LC-13 and review

Acceptance creates no Discovery, estimate, quotation, order, Project, work order or booking. Continue on the brief through LC-13's explicit reviewed link to an existing or separately created native estimating workspace. The adopted reviewed creation journey can also explicitly include the exact accepted Sales event; it remains separate from acceptance. Discovery answers and costing are independently authored. This queue does not add link state or link commands.

[Application evidence](../../../testing/evidence/sales-briefs-queue/README.md) records actual functional checks, inspected captures at 1440/1024/390/320, differences and limits. Missing accepted drawings for 1024/320, loading/error/partial/stale, phone selection and Evidence use the bounded adaptations above. Component bindings and fixture states are in [the CR-02 consumer note](../component-bindings/2026-10-31-sales-briefs-queue.md). Visual inspection, owner acceptance, exact-head independent review, merge and deployment remain separate; no review fingerprint is asserted.
