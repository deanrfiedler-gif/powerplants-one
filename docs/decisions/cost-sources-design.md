---
document_id: PPO-EST-COST-SOURCES-DESIGN-DEC
date: 2026-10-11
owner: Dean Fiedler
status: Owner-accepted design; read additions, native implementation, shell rollout and UI baseline acceptance separate
source_commit: 611123bd2417e844ad07a0ef6c83b84c0191f6cd
versioning: git
---

# Cost sources design — owner decision

On 11 October 2026 Dean chose Cost sources (`/estimating/cost-sources`, ES-03) as the next page to design in Figma. Quotations and Intake & workload were being drawn in other sessions at the same time. The page reuses the pattern he accepted the same day for [Reviews & approvals](estimate-reviews-design.md). Claude drew it with synthetic data and with the ES-03 rules as the code records them.

Dean asked whether Claude was satisfied with the design. Claude named three flaws: the price and expiry columns sat off-screen, Quick add covered the last phone row, and two evidence references wrapped. Dean replied "Proceed with your recommendations." After the fixes Dean asked again. Claude recommended locking the design in, and asked him to try Present mode first. Dean then saved the named Figma version: "I have saved it as Cost sources — Pipedrive pattern, accepted".

This record retains his decisions, the design reference and its icon-free captures, the conformance declaration, the display rules, the departures and what remains open.

Scope: the existing Estimating destination `pricing` ("Cost sources", route `/estimating/cost-sources`), showing ES-03 cost sources and their evidence review. No parent requirement ID is added or renamed. This is a design decision. It authorises no application code, read change, route change, migration, permission, capability or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design Cost sources next | User decision, 11 October 2026 | Dean chose "Cost sources (Recommended)" from three candidates (Cost sources, Specialist configurations, Service requests). Claude's reasons: Cost sources is a true register that the app shows as padded cards, so it fits the accepted grid worst today; its rules map cleanly onto the pattern; and it does not overlap the Quotations and Intake & workload sessions |
| Reuse the accepted pattern | Prior user decisions | The [Reviews & approvals decision](estimate-reviews-design.md), section 1: the white selected rail tile, lines between body cells, the rail collapsing to icons, fixed checkbox and gear columns, record windows that overlap the table, phone list rows, no breadcrumb on the phone and an icons-only phone tab bar |
| Fixes before locking in | User decision, 11 October 2026 | "Proceed with your recommendations.", answering Claude's three flaws. Claude moved State, Supplier expiry, Tier 1 cost and Updated into view, added a phone frame scrolled to the end, and shortened the synthetic evidence references and two titles |
| Acceptance | User decision, 11 October 2026 | "I have saved it as Cost sources — Pipedrive pattern, accepted". No Present-mode result was reported |
| Recommendations on the notes card | Adopted with the accepted design | Claude's recommendations were on the page's notes card when Dean saved the named version. Section 4 lists them as departures C1–C9 |
| Building the page or the shell | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Cost sources — Pipedrive pattern, accepted". The file's link is not recorded in this public repository, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Accepted frames | Page "Cost sources · ES-03" `133:2366` (formerly "Cost sources (accepted)"; renamed on 25 October 2026 by the [Figma file audit](../design/figma-file-audit/figma-file-audit-2026-10-24.md), R1): desktop `133:2538`, desktop with two rows selected `135:11736`, phone `133:2925`, phone with the list scrolled to the end `150:3620`. Its notes card `133:2945` lists the scope, rules, changes, parts, handovers, decisions, recommendations, open questions and what is not drawn |
| Page components | Source grid row `133:2367` (Default `133:2368`, Hover `133:2379`, Selected `133:2390`) and header `133:2401`; Source list row (phone) `133:2412`; Source snapshot (phone) `133:2425` |
| Shared parts | The Shell v2 (proposal) parts listed in the [Reviews & approvals decision](estimate-reviews-design.md), section 2, unchanged. One new icon component on the Components page: `Icon/solid/tags` `133:2309`, for the selected rail item |
| Prototype | Flows "Cost sources — desktop (proposal)" and "Cost sources — phone (proposal)". They use the existing Prototype switches |
| Retained captures | [Cost sources design r01](../reference/ui/estimating/cost-sources-design-r01/README.md): five icon-free PNGs at exact frame size, with hashes. These are the repository reference for this decision |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | The existing destination `pricing` ("Cost sources") in the Estimating & quotation rail (`src/shell/navigation.ts`), route `/estimating/cost-sources`, register entry `route:/estimating/cost-sources` (`scope:ES-03`, page-register order 049) |
| Page type (r20) | Register / worklist, with a record detail window and a multi-select action panel. On the phone: a list with a full-screen record view |
| Reused components | The Reviews & approvals shell and grid parts (v2 / Rail, Rail item, Menu item, Menu heading, Menu edge, Menu strip, More panel, Grid / Header cell, Grid / Cell, Checkbox, Checkbox cell, Row actions cell, Tab item, Tab bar (phone)). Also Shell / Top bar, Shell / Phone header, Quick add, Button, Tag, Brand / Logo, and Font Awesome Light icons named as in `src/components/font-awesome-icons.ts`. Page-specific: the source grid row and header, the phone list row and the phone record view. The toolbar search box is drawn on the page and is not a component |
| Source authority | ES-03: [the native contract](../contracts/estimating-cost-sources.md), [the native decision](estimating-cost-sources-native.md) and [the supplier-pricing design](supplier-pricing-cost-sources-design.md). The read model is `src/estimating/sources/reads.ts`, the submit, review and revise guards are in `commands.ts`, and the tier and validity rule is in `price.ts`. Labels come from `src/components/cost-sources.tsx`. Fixture: synthetic `SYN-SRC` references, "SYN …" suppliers, people, dates and costs |
| Incoming handover | Authored synthetic evidence from the new-source form (`/estimating/cost-sources/new`) and the successor form on the source page; submissions by source owners; decisions by independent reviewers who hold the source-review duty |
| Outgoing handover | In the record window, "Open source" opens `/estimating/cost-sources/[id]`, and "Review evidence" opens the same page at its review step, where the decision and its reason are recorded. "Used in" lists the estimate versions bound to the revision and opens `/estimating/estimates/[id]/sources` for a deliberate cost comparison. No decision, revision or cost refresh happens in the register or its windows |
| States shown | The register with all five states, your own submission, Unknown expiry and past expiry. The record window for a submitted source awaiting your review, with its tiers, changes from the previous revision and history. A two-row selection with the small panel. The phone list at rest and scrolled to the end, and the phone record view. The More slide-out and the collapsed rail and menu work in the prototype. Loading, error, empty and stale states are not drawn |
| Departures | Section 4 |
| Verification | Section 7 |

## 4. Display rules and departures

### Display rules

Each rule displays what the code records. It adds no state to the database and no rule the code does not have.

| Column or view | Shown as | Source |
|---|---|---|
| State | The five recorded states: Draft, Submitted, Reviewed, Returned, Rejected. A Submitted source reads "Awaiting review", or "Your submission" with a lock when you own the source or authored its current revision, because you cannot review it. Returned reads "Returned for changes" in the warning text colour; Rejected is muted. Every state has words as well as an icon | `readCostSource` `can_review`; the `IndependentSourceReviewerRequired` guard |
| Supplier expiry | The recorded validity end. A blank end reads "Unknown" with a warning icon, never as open-ended validity. A date before today has a warning icon. There is no "expiring soon" threshold | The contract: "Unknown expiry yields an explicit warning, not perpetual validity" |
| Tier 1 cost | The unit cost of the tier with the lowest minimum quantity, in AUD excluding tax. All tiers are in the record window, with the rule that an estimate line uses the tier with the highest minimum quantity not above its quantity, and that units must match exactly | `sourcePrice` in `price.ts` |
| Updated | The source's last update, newest first | `listCostSources` orders by `updated_at` |
| Menu views and counts | All sources; Awaiting my review (submitted sources you can review); My sources (sources you own); a State group with the five states; a Validity group with Expiry unknown and Past expiry. Counts are neutral, and the rail badge is the Awaiting my review count | The state filter and the review guard |

### Departures

The Reviews & approvals departures D1–D9 apply unchanged: the labelled rail, the collapsible secondary menu, the More slide-out, the full-width grid with fixed columns, overlapping record windows, phone list rows, the phone header, the phone tab bar and the proposal colours. These are the Cost-sources-specific departures from today's page:

| ID | Departure | Today's page |
|---|---|---|
| C1 | The register becomes the grid. Source (reference and revision), Title, State, Supplier expiry, Tier 1 cost and Updated are in view at 1440 with the menu open; Supplier, Item, Unit and Effective scroll in from the right | One padded card per source, showing reference, revision, state, title, supplier, item, unit, effective date, expiry and the number of reviewed revisions |
| C2 | Secondary menu views with counts (section 4, Display rules) replace the state dropdown | A search box, a state dropdown and Apply filters |
| C3 | Toolbar: a primary "New source" button, the literal search "Search source, supplier or item", a Supplier filter by label, the count "8 sources · AUD, excluding tax", Refresh and "…" | A page header with "New synthetic source", the filter form and workflow links |
| C4 | Record window. On the left: the title, reference and revision, a Synthetic tag and the state; the source facts (supplier and external key, item and unit, effective and expiry dates, evidence reference and source date, author); the quantity tiers; and a rule note. On the right: tabs for Changes from the previous revision, Evidence and Used in, and the History of revisions and decisions. Footer: Open source and Review evidence | Each source opens its own page |
| C5 | The rule note replaces the boundary panel: a review checks one revision's evidence; it approves no estimate or quotation; no estimate changes until someone compares costs and saves a new version; currency and unit conversion are not configured | A boundary panel on each page |
| C6 | The small panel for a selection offers Open in sequence and Export list only. Each evidence decision is one revision, by an independent reviewer, with a reason | None |
| C7 | Phone: flush list rows (title and tier 1 cost; reference, revision and supplier; state and expiry), a full-screen record view with Open source and Review evidence fixed at the bottom, and More as the current tab, because Cost sources is reached through More. Source review is desk work, so it gets no tab of its own | Stacked cards |
| C8 | The selected rail item uses the Solid tags icon, copied from Dean's Kit into the private file | Not applicable |
| C9 | Short synthetic references (`SYN-SRC-0021`, `SYN-PL-DRV-10`). In the app the author types a local synthetic reference; `SYN-SRC-nnnn` is only a fixture convention | Not applicable |

## 5. Not decided

- **Building the page.** `listCostSources` already returns most columns: reference, revision, state, title, supplier, item, unit, effective date, expiry and last update. Tier 1 cost, the owner and the current revision's author (for "Your submission", Awaiting my review and My sources) and the menu counts need additions to the read. The read returns the latest 100 permitted sources, so the counts must either cover every permitted source or say that they cover only that window. The read change, its tests and the page need their own pull requests. Reading still needs `estimating.read` and `shared.read`, and review still needs `estimating.source.review`. No new capability is proposed.
- **Rolling out the shell.** As for Reviews & approvals, the adopted Shell page and the app stay as built until a shell implementation is planned and recorded.
- **Open questions:**
  - Should sources awaiting your review also appear in Reviews & approvals, which today covers ES-04 reviews and ES-05 approvals only?
  - Should a source past its expiry, or with Unknown expiry, do more than warn? Today the pricing date must sit inside the recorded dates.
  - The supplier is a free label with an optional external key. Should the Supplier filter use the label until a supplier identity exists?
  - Should people who work across more than one company get a Company column or filter?
  - When the current revision is a draft, should the grid also show the latest reviewed revision (for example "r4 draft · r3 reviewed")?
  - How should several rows be selected on the phone? The recommendation is the same as for Reviews & approvals: press and hold a row.
- **Not drawn yet:** loading, error, empty ("No cost sources yet"), filtered-empty, denied or revoked read, stale revision, pending save and "Outcome unknown" recovery; the new-source and successor forms; the review decision form; the Evidence and Used in tab contents; phone selection. Every row opens the same sample record.

## 6. Consequences

- No application code, read model, route, migration, permission or capability changes. No page, scope or parent requirement ID changes; all 78 parent IDs remain.
- The [Cost sources register entry](../design/development/pages/route-estimating-cost-sources.md) now links this design and its captures. Its visual status stays "Needs review": the app does not yet match the design.
- When the page is built, it is compared with these captures and the Figma frames at the same viewports, following ADR-0053 rule 7.
- A later change to this design receives a new named version and a new capture revision folder; these bytes stay unchanged.

## 7. Verification

- Claude checked each frame and page component with screenshots taken inside the Figma write tool, using temporary copies wherever a hidden window had to be shown, so that no window lost its link to its prototype switch. The checks led to wider Supplier, State and expiry columns, a navy selected-rail icon and a white icon on the primary button, as well as the three fixes in section 1.
- Claude could not run Present mode through the API. Claude asked Dean to try it before saving the named version; no result was reported.
- After the named version was saved, an audit of the page's prototype links found two leftovers from cloning: one header checkbox in the desktop frame still linked to the Reviews & approvals page, and the scrolled phone frame had a duplicate flow. Both were corrected in the file, and the page was renamed "Cost sources (accepted)". Neither change alters any pixel, so the named version, the corrected file and the captures show the same design. The audit also confirmed that the record windows, panels, menus and More slide-outs in all four frames are still linked to their switches, and that no prototype link leaves the page.
- The five captures are copies of the accepted frames with every Font Awesome icon swapped for `Icon/placeholder`. The first pass left nine icons nested inside the phone record view; a second pass replaced them, and a final check found no Font Awesome instance left in any copy. They were exported at scale 1 with the Figma connector, and each image was inspected. The hashes are in the [captures README](../reference/ui/estimating/cost-sources-design-r01/README.md).
- `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py`, `node scripts/design-baseline-check.mjs` and `npm run studio:check` were run on this change and reported no errors.
- Nothing is built, so there is no application or device evidence. This record implies no visual review of the application and no UI baseline.
