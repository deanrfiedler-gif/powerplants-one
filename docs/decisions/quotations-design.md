---
document_id: PPO-EST-QUOTATIONS-DESIGN-DEC
date: 2026-10-11
owner: Dean Fiedler
status: Owner-accepted design; quotation-level read, native implementation, shell rollout and UI baseline acceptance separate
source_commit: 453cc6bd4112b435b18278e5eb7154fc68d0ea17
versioning: git
---

# Quotations design — owner decision

On 11 October 2026 Dean chose Quotations (`/estimating/quotes`) as the next page to design in Figma. It reuses the pattern he accepted the same day for [Reviews & approvals](estimate-reviews-design.md). Claude drew the page with synthetic data and with the ES-05, ES-06 and ES-07 rules as the code records them. Dean tried it in Present mode and reported that the record window did not open. Claude corrected the prototype, and Dean confirmed: "It works now". He then accepted the design: "I am happy to proceed based on all of your recommendations." He saved the result as the named Figma version "Quotations — Pipedrive pattern, accepted".

This record retains his decisions, the design reference and its icon-free captures, the conformance declaration, the stage rule, the departures and what remains open.

Scope: the existing Estimating destination `quotations` (route `/estimating/quotes`). It shows quotations across ES-05 release, ES-06 customer response and ES-07 conversion. No parent requirement ID is added or renamed. This is a design decision. It authorises no application code, read model, route change, migration, permission, capability or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design Quotations next | User decision, 11 October 2026 | Dean chose "Quotations (Recommended)" from three Estimating candidates (Quotations, Intake & workload, Cost sources). Today's page is a plain list, so it gains the most, and Reviews & approvals already hands quotation approvals to it |
| Reuse the accepted pattern | Prior user decisions | The [Reviews & approvals decision](estimate-reviews-design.md), section 1: a labelled rail, a flush secondary menu, a full-width grid "that extended all the way to the edges of the container, with individual cells", record windows that "overlap them instead" of condensing the table, fixed checkbox and gear columns, phone list rows and an icons-only phone tab bar |
| Large window for one quotation, small panel for a selection | User question, answered by the design | Dean asked whether the larger snapshot window should slide out when a quotation is clicked, with the smaller one used when several quotations are checked. Both were drawn that way. After the prototype correction (section 7) he confirmed "It works now" |
| Bulk actions limited to open and export | Claude's recommendation, adopted | Approval, issue, distribution and customer responses are each recorded against one exact revision or issue, by separate people. The small panel therefore offers Open in sequence and Export list only. Bulk owner reassignment does not exist in the app and needs a rule first |
| One row per quotation | Claude's recommendation, adopted | "I am happy to proceed based on all of your recommendations." Each row shows the quotation's latest revision. Earlier revisions appear in the record window's History. This needs a quotation-level read (section 5) |
| "My quotations" means quotations you own | Claude's recommendation, adopted | Same words. Approvers and issuers find their work in Reviews & approvals |
| Quotation approvals in both places | Claude's recommendation, adopted | Same words. Here, Awaiting approval is a stage of the quotation list. In Reviews & approvals, it is the approver's queue |
| The other recommendations on the notes card | Claude's recommendations, adopted | Same words. Section 4 lists them as departures Q1–Q9 |
| Returned view | Correction before the named version | Checking the stages against the code after Dean's acceptance found that ES-05 approval can be Returned, and the drawn menu had no view for it. Claude added Returned under Needs attention. Negotiation, which had shared its icon, moved to the Light scale-balanced icon |
| Building the page or the shell | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Quotations — Pipedrive pattern, accepted". The file's link is not recorded in this public repository, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Accepted frames | Page "Quotations (accepted)": desktop `123:41`, desktop with two rows selected `123:220`, phone `123:428`. Its notes card `123:448` lists the scope, rules, handovers, decisions, recommendations and open questions |
| Page components | Quotation grid row `123:493` (Default `123:494`, Hover `123:505`, Selected `123:516`) and header `123:482`; Quotation list row (phone) `123:527`; Quotation snapshot (phone) `123:540` |
| Shared parts | The Shell v2 (proposal) parts listed in the [Reviews & approvals decision](estimate-reviews-design.md), section 2, unchanged. Two new icon components on the Components page: `Icon/solid/file-invoice-dollar` `123:35` for the selected rail item, and `Icon/scale-balanced` `142:11461` for Negotiation |
| Prototype | Flows "Quotations — desktop (proposal)" and "Quotations — phone (proposal)". They use the existing Prototype switches |
| Retained captures | [Quotations design r01](../reference/ui/estimating/quotations-design-r01/README.md): five icon-free PNGs at exact frame size, with hashes. These are the repository reference for this decision |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | The existing destination `quotations` ("Quotations") in the Estimating & quotation rail (`src/shell/navigation.ts`), route `/estimating/quotes`, register entry `route:/estimating/quotes` (related to `scope:ES-05`). It covers ES-05, ES-06 and ES-07 |
| Page type (r20) | Register / worklist, with a record detail window and a multi-select action panel. On the phone: a list with a full-screen record view |
| Reused components | The Reviews & approvals shell and grid parts (v2 / Rail, Rail item, Menu item, Menu heading, Menu edge, Menu strip, More panel, Grid / Header cell, Grid / Cell, Checkbox, Checkbox cell, Row actions cell, Tab item, Tab bar (phone)). Also Shell / Top bar, Shell / Phone header, Quick add, Button, Tag, Brand / Logo, and Font Awesome Light icons named as in `src/components/font-awesome-icons.ts`. Page-specific: the quotation grid row and header, the phone list row and the phone record view |
| Source authority | ES-05: [quotation-release-native.md](quotation-release-native.md) and [quotation-approval-issue-distribution-design.md](quotation-approval-issue-distribution-design.md). ES-06: [quotation-response-native.md](quotation-response-native.md). ES-07: [quotation-conversion-native.md](quotation-conversion-native.md). Labels come from `src/components/quotation-release.tsx`, `quotation-response.tsx`, `quotation-conversion.tsx` and `src/estimating/response/model.ts`. Fixture: synthetic `SYN-QUO` and `SYN-EST` references, customers, people, dates and values |
| Incoming handover | E1 drafts made by the estimate owner; ES-05 release preparations; quotation approval requests, which also appear in Reviews & approvals |
| Outgoing handover | In the record window, "Open release" opens `/estimating/quotes/[id]/release` (ES-05) and "Open response" opens `/estimating/quotes/[id]/response` (ES-06). The "…" menu opens the quotation (`/estimating/quotes/[id]`) and the estimate. Converted quotations link to `/estimating/quotes/[id]/conversion` (ES-07). No decision, issue or send happens in the register or its windows |
| States shown | The register with every derived stage except Returned and Clarification (their views are drawn without rows). The record window for an issued offer with its lifecycle, files and history. A two-row selection with the small panel. The phone list and the phone record view. The More slide-out and the collapsed rail and menu work in the prototype. Loading, error, empty and stale states are not drawn |
| Departures | Section 4 |
| Verification | Section 7 |

## 4. Stage rule and departures

### Stage

Each row shows one Stage, derived from what the code records for the quotation's latest revision. It is a proposed display rule. It adds no state to the database, and states the code does not have (Expired, Withdrawn, Sent, Acknowledged) are not shown.

| Stage | Shown when | Source label |
|---|---|---|
| Draft | An E1 draft revision with no release preparation | "Draft revision n" |
| Awaiting approval | A prepared release revision with no approval decision | "Not approved" |
| Returned | The approval decision is Returned | "Returned for a new preparation" |
| Approved · not issued | Approved, with no issue | "Approval alone does not issue" |
| Held · basis changed | The source, recipient or template changed after preparation | "Changed basis — held" |
| Issued · no response | Issued, with no reported response | "No response recorded" |
| Delivery unknown | The latest distribution outcome is Unknown | "Unknown — hold another attempt" |
| Clarification | The latest reported response is Clarification | "Information-only clarification" |
| Negotiation | The latest reported response is Negotiation | "Material negotiation — return to ES-05" |
| Accepted | The latest reported response is Accepted | "Accepted" |
| Declined | The latest reported response is Declined | "Declined" |
| Converted | An ES-07 execution is recorded | "Converted — original targets retained" |

Attention stages (Held, Returned, Negotiation, Clarification, Delivery unknown) use the warning text colour, Declined is muted, and every stage has words as well as colour. When a quotation is issued and its delivery is unknown, the attention stage is shown.

### Departures

The Reviews & approvals departures D1–D9 apply unchanged: the labelled rail, the collapsible secondary menu, the More slide-out, the full-width grid with fixed columns, overlapping record windows, phone list rows, the phone header, the phone tab bar and the proposal colours. These are the Quotations-specific departures from today's page:

| ID | Departure | Today's page |
|---|---|---|
| Q1 | One row per quotation, with its latest revision and derived stage, across all permitted estimates | One row per revision, from a window of up to 100 recently updated estimates, and labelled "not a complete quotation register" |
| Q2 | Columns: Quotation (reference and revision), Title, Customer, Stage, Value ex GST, Updated (sorted newest first), Owner and Estimate. Value is the customer total in AUD ex GST, with GST not calculated. The internal cost total is never shown. There is no "Valid until" column, because validity is Not configured | Reference, revision, estimate title and output job state |
| Q3 | Secondary menu: All quotations, My quotations (owned by you), a Stage group (Draft, Awaiting approval, Approved, not issued, Issued, Accepted, Declined, Converted) and a Needs attention group (Held, Returned, Negotiation, Clarification, Delivery unknown). Neutral counts appear on open views only | A text filter and older or newer windows |
| Q4 | Record window: summary (customer, site and contact, value, owner, estimate version); the lifecycle of the exact revision (prepared, approved, issued, distribution, customer response, conversion), each with who and when; a rule note; Files and Recipient tabs; History of the revisions. Footer: Open release and Open response | None; each quotation opens its own page |
| Q5 | The small panel for a selection offers Open in sequence and Export list only | None |
| Q6 | Toolbar filters for Customer and Owner, a count and a refresh time | A reference or title filter |
| Q7 | Phone: Quotations is reached through More, so More is the current tab. The five Estimating tabs are unchanged | Labelled phone bar |
| Q8 | The selected rail item uses the Solid file-invoice-dollar icon, and Negotiation uses the Light scale-balanced icon. Both are copied from Dean's Kit into the private file | Not applicable |
| Q9 | Short synthetic references (`SYN-QUO-0087`) match the Reviews & approvals design. The app issues `SYN-PPO-QUO-000001` style numbers | Not applicable |

## 5. Not decided

Later backend decision, 12 October: Dean authorised the [quotation register read and history contract](quotation-register-backend.md), resolving backend current-row, stage precedence, bounded partial/count semantics and all-time scope. This does not adopt new page states or implement the accepted page; the original design and captures below retain their historical meaning.

- **Building the page.** Q1 needs a quotation-level read: the latest revision and derived stage for each permitted quotation. It must report restricted or missing sources as a partial list, never an empty one. The read, its tests and the route change need their own pull requests. Reading still needs `estimating.quote.read` and `estimating.read`. No new capability is proposed.
- **Rolling out the shell.** As for Reviews & approvals, the adopted Shell page and the app stay as built until a shell implementation is planned and recorded.
- **Open questions:**
  - How should the list say it is partial when some quotations cannot be shown?
  - Should Accepted, Declined and Converted be all-time lists, or limited to a period?
  - How should several rows be selected on the phone? The recommendation is the same as for Reviews & approvals: press and hold a row.
  - Should owners be reassigned in bulk? The app cannot reassign a quotation's owner today, and only the estimate owner prepares a release, so this needs a business rule first.
  - Should today's shareable reference or title filter be kept? It is not drawn.
- **Not drawn yet:** loading, error, empty, filtered-empty, partial, denied and stale states; "Output failed" in the Stage cell; the Recipient tab's content; phone selection.

## 6. Consequences

- No application code, read model, route, migration, permission or capability changes. No page, scope or parent requirement ID changes; all 78 parent IDs remain.
- The [Quotations register entry](../design/development/pages/route-estimating-quotes.md) now links this design and its captures. Its visual status stays "Needs review": the app does not yet match the design.
- When the page is built, it is compared with these captures and the Figma frames at the same viewports, following ADR-0053 rule 7.
- A later change to this design receives a new named version and a new capture revision folder; these bytes stay unchanged.

## 7. Verification

- Dean tried the desktop prototype in Present mode. The large record window did not open: while drawing, Claude had made the window visible to take screenshots, which removed the link between its visibility and the `snapshot/open` switch. Claude restored the link in both desktop frames, and Dean confirmed "It works now". A scan of the page found no prototype link to another page.
- The five captures are copies of the accepted frames with every Font Awesome icon swapped for `Icon/placeholder`. A check after the swap found no Font Awesome instance left in any copy. They were exported at scale 1 with the Figma connector, and each image was inspected. The hashes are in the [captures README](../reference/ui/estimating/quotations-design-r01/README.md).
- `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py`, `node scripts/design-baseline-check.mjs` and `npm run studio:check` were run on this change.
- Nothing is built, so there is no application or device evidence. This record implies no visual review of the application and no UI baseline.
