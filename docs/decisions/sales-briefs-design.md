---
document_id: PPO-EST-SALES-BRIEFS-DESIGN-DEC
date: 2026-10-11
owner: Dean Fiedler
status: Owner-accepted design; destination label change, native implementation, shell rollout and UI baseline acceptance separate
source_commit: 611123bd2417e844ad07a0ef6c83b84c0191f6cd
versioning: git
---

# Sales briefs design — owner decision

On 11 October 2026 Claude reviewed the four pages already designed in Figma and offered three candidates for the next one. Dean chose "Estimating Intake (Recommended)": the receiving queue at `/estimating/intake`, where Estimating receives the briefs that Sales submits. Today that page is a stack of plain cards with no filters, counts or record window. Claude drew it with synthetic data on the pattern Dean accepted for [Reviews & approvals](estimate-reviews-design.md), using only the CR-02 rules the code records. Dean then answered: "Proceed with your recommendations, rename it Sales briefs". He saved the result as the named Figma version "Sales briefs — Pipedrive pattern, accepted".

This record retains his decisions, the design reference and its icon-free captures, the conformance declaration, the state rule, the departures and what remains open.

Scope: the existing Estimating destination `intake` (route `/estimating/intake`, scope CR-02, receiving side). The design labels it Sales briefs; the app still labels it Intake. No parent requirement ID is added or renamed. This is a design decision. It authorises no application code, label change in the app, read model, route change, migration, permission, capability or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the receiving queue next | User decision, 11 October 2026 | Dean chose "Estimating Intake (Recommended)" from three candidates (Estimating Intake, Estimation wizard, Service requests), offered after Claude reviewed Reviews & approvals, Quotations, Intake & workload and Cost sources in Figma. The page is the weakest in its department. Its `HandoverList` component also draws the two Sales handover lists, so the pattern can carry over to them |
| Reuse the accepted pattern | Prior user decisions | The [Reviews & approvals decision](estimate-reviews-design.md), section 1: a labelled rail, a flush secondary menu, a full-width grid "that extended all the way to the edges of the container, with individual cells", record windows that "overlap them instead" of condensing the table, fixed checkbox and gear columns, phone list rows and an icons-only phone tab bar. Also the record window's maximum width: "make the maximum width of the record container working on a scenario when both the primary and secondary menus are open" |
| Rename the destination to Sales briefs | User decision, 11 October 2026 | "Proceed with your recommendations, rename it Sales briefs." Claude had pointed out that "Intake & workload" and "Intake" sit side by side in the rail and are easy to confuse, and suggested "Sales briefs". The destination id `intake` and the route stay as they are |
| Receiving decisions stay on the brief page | Claude's recommendation, adopted | Same words. Clarify, Resolve, Return and Accept are each recorded against one exact submitted revision by its receiving owner, as review decisions are on Reviews & approvals (D10). The small panel offers Open in sequence and Export list only |
| The other recommendations on the notes card | Claude's recommendations, adopted | Same words. "Awaiting my decision" means assigned to me and Submitted or Clarification answered. Source changed is the only warning colour, and Returned is muted. The record window opens on Clarification. The page says "briefs" rather than "handovers". The synthetic opportunities match the Intake & workload design. Section 4 lists them as departures S1–S9 |
| Rail count for Sales briefs | Open question | Claude asked whether Sales briefs should show a count of briefs awaiting my decision, as Reviews & approvals does, without making a recommendation. Dean's answer did not address it. None is drawn (section 5) |
| Building the page, the label or the shell | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Sales briefs — Pipedrive pattern, accepted". The file's link is not recorded in this public repository, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Accepted frames | Page "Sales briefs (accepted)" `152:1122`: desktop `152:1123`, desktop with two rows selected `152:1302`, phone `152:1510`. Its notes card `152:1530` lists the scope, rules, handovers, decisions, recommendations, open questions and what is not drawn |
| Page components | Sales brief grid row `152:1564` (Default `152:1565`, Hover `152:1576`, Selected `152:1587`) and header `152:1598`; Sales brief list row (phone) `152:1609`; Sales brief snapshot (phone) `152:1622` |
| Shared parts | The Shell v2 (proposal) parts listed in the [Reviews & approvals decision](estimate-reviews-design.md), section 2, unchanged. One new icon component on the Components page: `Icon/solid/inbox` `152:1117`, for the selected rail item. The rename is an override on this page; the shared v2 / Rail component and the other pages still show "Intake" |
| Prototype | Flows "Sales briefs — desktop (proposal)" and "Sales briefs — phone (proposal)". They use the existing Prototype switches |
| Retained captures | [Sales briefs design r01](../reference/ui/estimating/sales-briefs-design-r01/README.md): five icon-free PNGs at exact frame size, with hashes. These are the repository reference for this decision |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | The existing destination `intake` in the Estimating & quotation rail (`src/shell/navigation.ts`), route `/estimating/intake`, register entry `route:/estimating/intake`, parent scope CR-02. The [navigation decision](navigation-consolidation.md) keeps it separate from Intake & workload (`/estimating`) and from the Sales preparation list `/sales/handoffs/estimating` |
| Page type (r20) | Register / worklist, with a record detail window and a multi-select action panel. On the phone: a list with a full-screen record view. The brief page (`/sales/handoffs/estimating/[id]`) keeps its record workspace type and is not redesigned here |
| Reused components | The Reviews & approvals shell and grid parts (v2 / Rail, Rail item, Menu item, Menu heading, Menu edge, Menu strip, More panel, Grid / Header cell, Grid / Cell, Checkbox, Checkbox cell, Row actions cell, Tab item, Tab bar (phone)). Also Shell / Top bar, Shell / Phone header, Quick add, Button, Tag, Brand / Logo, and Font Awesome Light icons named as in `src/components/font-awesome-icons.ts`. Page-specific: the Sales brief grid row and header, the phone list row and the phone record view |
| Source authority | CR-02 as implemented: `src/sales/handover-model.ts` (content, submission readiness), `src/sales/handover-service.ts` (receiving list, receiver capability `estimating.edit`, the Save, Submit, Clarify, Answer, Resolve, Return, Accept and Successor rules, the source fingerprint), `src/components/sales-handover.tsx` (labels) and `src/components/sales-estimating-link.tsx` (LC-13). The [native completion handover](../delivery/sales-native-completion-handover.md) and the `route:/estimating/intake` register entry. Fixture: synthetic `SYN-PPO-OPP` references, customers, people and dates |
| Incoming handover | Sales briefs submitted from `/sales/handoffs/estimating`, each with its exact revision, evidence (draft quote or service document revisions) and source fingerprint; Sales answers to clarification questions |
| Outgoing handover | In the record window, "Open brief" opens `/sales/handoffs/estimating/[id]`, where Clarify, Resolve, Return and Accept are recorded, and "Open opportunity" opens `/sales/opportunities/[id]`. After acceptance, the brief page links the brief to an estimating workspace or creates Discovery (LC-13), which then appears in Intake & workload. Nothing is decided in the register or its windows |
| States shown | The register with every receiving state, including a brief whose source changed and one owned by another receiver. The record window for a brief with an answered clarification, its frozen content and history. A two-row selection with the small panel. The phone list and the phone record view. The More slide-out and the collapsed rail and menu work in the prototype. Loading, error, empty and stale states are not drawn |
| Departures | Section 4 |
| Verification | Section 7 |

## 4. State rule and departures

### State

Each row shows the brief at its latest submitted revision, as the receiving read already returns it. A later Sales draft never replaces that revision, and drafts never appear in the queue. The State column adds no state to the database.

| State | Shown when | Source |
|---|---|---|
| Submitted | The submitted revision is open for a receiving decision | `Submitted` |
| Clarification requested | The receiving owner asked a question; Sales has not answered | `ClarificationRequested` |
| Clarification answered | Sales answered; the receiving owner has not resolved the answer | `ClarificationAnswered` |
| Returned | The revision was returned with an owned follow-up, or Sales has since started a successor without this revision being accepted | `Returned`, and the receiving read's mapping |
| Accepted | An Accept event exists for the submitted revision | `Accepted` |
| … · source changed | Added to an open state when the current source fingerprint differs from the submitted one ("Source changed; renewed review required"). Accept is refused until the brief is returned for a corrected successor | `source_changed` |

Source changed uses the warning text colour, Returned is muted, and every state has words as well as colour. "Awaiting my decision" lists briefs whose receiving owner is me and whose state is Submitted or Clarification answered. "Assigned to me" lists every brief whose receiving owner is me.

### Departures

The Reviews & approvals departures D1–D9 apply unchanged: the labelled rail, the collapsible secondary menu, the More slide-out, the full-width grid with fixed columns, overlapping record windows, phone list rows, the phone header, the phone tab bar and the proposal colours. These are the Sales briefs departures from today's page:

| ID | Departure | Today's page |
|---|---|---|
| S1 | The destination is labelled Sales briefs in the rail, the breadcrumb and the phone header. The id `intake` and route `/estimating/intake` are unchanged | "Intake" in the rail; the page title "Estimating Intake" |
| S2 | A full-width grid, one row per brief. Columns: Opportunity (reference and revision), Title, Customer, State (icon and words), Updated (sorted newest first, as the receiving read orders it), Requested ("Date needed" when Sales gave a reason instead of a date), Receiving owner and Sales owner | A stack of cards with title, state, revision, scope, requested date and receiving owner |
| S3 | Secondary menu: All briefs, Awaiting my decision and Assigned to me; a State group (Submitted, Clarification requested, Clarification answered, Returned, Accepted); an Attention group (Source changed). Neutral counts appear on open views only | None |
| S4 | Toolbar filters for Customer and Receiving owner, the count and its refresh time | The line "n permitted handovers · Complete · As at …" |
| S5 | Record window: summary (customer and location, receiving and Sales owners, requested date or its reason, next Sales action, submission time); the frozen brief (problem, included scope, exclusions); a rule note; Clarification and Evidence tabs; History. Footer: Open opportunity and Open brief | None; each brief opens the brief page |
| S6 | The small panel for a selection offers Open in sequence and Export list only | None |
| S7 | The boundary sentence ("Save, submission and receiver acceptance are separate. Acceptance creates no estimate, order, Project, work order or booking.") becomes the rule note in the record window and the small panel | A paragraph above the cards |
| S8 | Phone: flush list rows showing title and update, reference and customer, state and requested date. Sales briefs is reached through More, so More is the current tab. The five Estimating tabs are unchanged | Labelled phone bar; cards |
| S9 | The selected rail item uses the Solid inbox icon, copied from the cached Kit shapes into the private file | Not applicable |

## 5. Not decided

- **Building the page.** The grid needs the receiving read to return its rows with the columns above, the counts per view and the customer and receiving-owner filters. Reading keeps the receiver capability `estimating.edit` for each brief's company and site. No new capability is proposed.
- **The label in the app.** "Sales briefs" is decided for the design. Changing the app's rail label, the page title, the guide `guide.route-estimating-intake` and the navigation tests is separate work. The shared v2 / Rail component in Figma and the other Estimating pages still show "Intake" until the shell parts are updated.
- **Rolling out the shell.** As for Reviews & approvals, the adopted Shell page and the app stay as built until a shell implementation is planned and recorded.
- **Open questions:**
  - Should Sales briefs show a rail count of briefs awaiting my decision, as Reviews & approvals does? Claude's recommendation is to decide rail counts once for the whole shell rather than page by page.
  - Should briefs assigned to other receivers be listed in All briefs? Today every permitted receiver sees them, read only.
  - Should accepted briefs show whether they are linked to an estimating workspace yet (LC-13)? That needs a new list-level read.
  - How should an Accepted brief whose source later changes appear in the list?
  - Should Returned and Accepted be all-time lists, or limited to a period?
  - How should several rows be selected on the phone? The recommendation is the same as for Reviews & approvals: press and hold a row.
- **Not drawn yet:** loading, empty ("No permitted handovers in this queue"), filtered no-results, failed read with Retry, denied or revoked access and stale states; the brief page and its decision forms; the Evidence tab's content; the accepted-brief link (LC-13); phone selection; the 1024 px and 320 px widths.

## 6. Consequences

- No application code, read model, route, migration, permission or capability changes. No page, scope or parent requirement ID changes; all 78 parent IDs remain.
- The [Estimating Intake register entry](../design/development/pages/route-estimating-intake.md) now links this design and its captures. Its visual status stays "Needs review": the app does not yet match the design.
- When the page is built, it is compared with these captures and the Figma frames at the same viewports, following ADR-0053 rule 7.
- A later change to this design receives a new named version and a new capture revision folder; these bytes stay unchanged.

## 7. Verification

- Claude checked every frame with screenshots inside Figma before showing it to Dean, and fixed what they showed: a cut-off state label, the selected rail icon's colour, the bulk toolbar labels and selection card text. Claude could not run Present mode through the API. Cloning the Reviews frames had carried prototype links to the Reviews page; a scan found them, and each was pointed at this page's frames or removed where Figma does not allow it (from a component, or to the same frame). A final scan found no instance of a Reviews page component on this page.
- The five captures are copies of the accepted frames with every Font Awesome icon swapped for `Icon/placeholder`. A check after the swap found no Font Awesome instance left in any copy. They were exported at scale 1 with the Figma connector, and each image was inspected. The hashes are in the [captures README](../reference/ui/estimating/sales-briefs-design-r01/README.md).
- `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py`, `node scripts/design-baseline-check.mjs` and `npm run studio:check` were run on this change.
- Nothing is built, so there is no application or device evidence. This record implies no visual review of the application and no UI baseline.
