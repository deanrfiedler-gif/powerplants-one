---
document_id: PPO-SVC-WO-RECORD-DESIGN-DEC
date: 2026-10-12
owner: Dean Fiedler
status: Owner-accepted design; record-read and history-read additions, native implementation, shell rollout and UI baseline acceptance separate
source_commit: 4a286d388fad17a3d443718eb25c87bf0bcac346
versioning: git
---

# Work order record page design — owner decision

On 12 October 2026 Dean asked: "What is the next UI page that we should build in Figma?" Claude recommended the work order record page for three reasons:
- Dean had named it as next when he accepted the lead record page.
- The accepted Work orders register sends people to it with "Open work order", and the Job pack design links back to it.
- It is the second record type on the shared record layout, so it tests whether that layout is really shared, which the [lead record page decision](lead-record-page-design.md) left open.

Dean answered "Proceed with your recommendation". Claude drew the page with synthetic data and with the P04 rules as the code records them. Dean then accepted it: "Proceed with your recommendations". The design reference is the named Figma version "Work order record page — shared record layout, accepted".

This record retains:
- his decisions;
- the design reference and its icon-free captures;
- the conformance declaration;
- the display rules and the departures from today's page;
- two corrections to earlier designs found while drawing;
- what remains open.

Scope: the existing route `/service/work-orders/[id]`, register entry `route:/service/work-orders/[id]` ("Work order detail"), scope `SV-03`, requirement SVC-02. No parent requirement ID is added or renamed.

This is a design decision. It authorises none of the following:
- application code or new reads;
- a route change or migration;
- a permission or capability;
- deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the work order record page next | User decision, 12 October 2026 | "What is the next UI page that we should build in Figma?", then "Proceed with your recommendation" after Claude recommended this page for the reasons above. The Job pack design was waiting for review at the time and is locked in separately |
| Accept the design and its recommendations | User decision, 12 October 2026 | "Proceed with your recommendations". Every recommendation on the notes card (R1–R12 below) is adopted, and each open question takes its recommended answer (Q1–Q6 below) |
| R1 The shared record layout, unchanged | Claude's recommendation, adopted | The one-row header, the readiness bar, the 380 px details column that scrolls on its own and the main column, all from the lead record page. The shared components are used as they are |
| R2 View tabs for a record with sub-pages | Claude's recommendation, adopted | A record with sub-pages gets view tabs at the top of the main column (Authorisation, Scope rNN, Visits, Evidence, History), not the secondary menu, so the details column stays. A document with contents, such as the job pack, keeps the secondary menu |
| R3 "Ready to authorise" bar | Claude's recommendation, adopted | Six checks drawn from the code's blockers (section 4) |
| R4 The Authorisation tab leads | Claude's recommendation, adopted | A decision card lists each blocker in the code's words with the action that clears it. Below it are the five Authorisation criteria with outcome, reason, who, when and the reviewed evidence |
| R5 One primary header action | Claude's recommendation, adopted | Chosen by state and permission (section 4). "Authorise rNN" opens a confirmation that names the exact revision, readiness, linked requests, coverage and evidence, and asks for a reason |
| R6 Review in a side panel | Claude's recommendation, adopted | "Review a readiness criterion" opens a side panel over the main column, so the blockers stay in view. Permitted exception is offered only where the policy allows it |
| R7 Edit in the Scope tab | Claude's recommendation, adopted | The scope editor opens in the Scope tab with a fixed save bar. Every field, hint and limit is today's |
| R8 Evidence tab | Claude's recommendation, adopted | Every document reference on the order, with source, version, content hash and where it is used |
| R9 History | Claude's recommendation, adopted | Grouped by day and filtered by Scope, Readiness, Requests, Visits and Authorisation, with counts |
| R10 Phone | Claude's recommendation, adopted | Details, Authorisation, Scope and Visits tabs. Evidence and History open from Details. The footer keeps "…", Edit scope and the main action, and "…" opens an action sheet |
| R11 Two new shared parts | Claude's recommendation, adopted | Record / View tab and a wide Record / Criterion row. The criterion row should merge with Job pack / Criterion row, which has the same outcomes at 288 px |
| R12 Default tab by state | Claude's recommendation, adopted | The page opens on the tab that holds the next step: Authorisation while a draft or a successor is pending, Visits once the current scope is authorised |
| Q1 A reason when authorising | Resolved by "Proceed" | Yes. `authoriseWorkOrder` already records a reason; today's button sends fixed text |
| Q2 Naming who can authorise | Resolved by "Proceed" | No. It would need a new read of the people who hold the capability |
| Q3 Review form placement | Resolved by "Proceed" | A side panel, not inline under the criterion as today |
| Q4 Default tab | Resolved by "Proceed" | By state (R12) |
| Q5 Record position | Resolved by "Proceed" | "4 of 12" follows the register view and sort, as for the job pack |
| Q6 The next record page | Resolved by "Proceed" | The service request page, `/service/tickets/[id]`, which feeds work orders |
| Two corrections to earlier designs | Claude's recommendations, adopted | Section 5 |
| Building the page, the reads and the shell | Not decided | Section 6 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO — Design" in Dean's Figma team, at the named version "Work order record page — shared record layout, accepted". The file's link is not recorded in this public repository, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Accepted frames | Page "Work order record page · SV-03" `312:2` (formerly "Work order record page (accepted)"; renamed on 25 October 2026 by the [Figma file audit](../design/figma-file-audit/figma-file-audit-2026-10-24.md), R1): <ul><li>SYN-PPO-WO-000041: Authorisation `315:2094`, Scope r01 `316:639`, Visits with none proposed `318:1001`, Evidence `318:1769`, History `318:2514`, the review side panel `319:2118` and the scope editor `327:45008`;</li><li>SYN-PPO-WO-000042, ready to authorise, with the Authorise dialog `320:2567`;</li><li>SYN-PPO-WO-000040, authorised r02 with successor r03 in draft, Visits `321:2930`;</li><li>the register entry `323:10427`, whose "Open work order" leads to the record page;</li><li>the states section `327:31344`;</li><li>phone list `326:54385`, Details `325:4093`, Authorisation `326:53619`, Scope r01 `326:53942` and the action sheet `326:54183`.</li></ul>Its notes card `329:5432` lists the scope, rules, recommendations, departures, corrections, what is not drawn and the prototype |
| Components | <ul><li>Proposed shared: Record / View tab `312:16` (Default `312:4`, Selected `312:10`); Record / Criterion row `312:92` (Pass `312:17`, Blocked `312:32`, Unknown `312:47`, Not applicable `312:62`, Permitted exception `312:77`).</li><li>Page components: Work order record / Blocker row `312:93`; Work order record / Details column `314:5519`, used by every desktop view of SYN-PPO-WO-000041 so the views cannot drift.</li><li>Reused unchanged: Record / Header, Readiness bar, Check item, Banner, Field, Section heading, History item and Filter chip from the lead record page.</li></ul> |
| Prototype | Flows "Work order record — desktop (proposal)" from the register entry and "Work order record — phone (proposal)" from the phone list. Tabs switch views, Review opens the side panel, Edit scope opens the editor, "…" opens the actions menu (`recordmenu/open`) and the breadcrumb returns to the register |
| Retained captures | [Work order record page design r01](../reference/ui/service/work-order-record-page-design-r01/README.md): eleven icon-free PNGs at exact frame size, with hashes. These are the repository reference for this decision |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | The existing route `/service/work-orders/[id]` (`src/app/(business)/service/work-orders/[id]/page.tsx`, which renders `WorkOrderDetail` in `src/components/work-order-screens.tsx`), register entry `route:/service/work-orders/[id]`, scope `scope:SV-03`, requirement SVC-02. Capabilities, unchanged: `service.work_order.read` to see the order, `service.work_order.edit` to edit the scope and propose visits, `service.readiness.assess` to review criteria and `service.scope.authorise` to authorise |
| Page type (r20) | Record / evidence workspace, with a side panel for readiness review and a confirmation dialog for authorisation. On the phone: one record page with tabs. The Propose a visit form, the successor scope form, the coverage and authority-evidence editors and the LC-16 Sales sources panel keep their current types and are not redesigned here |
| Reused components | <ul><li>The accepted Service shell from the [Work orders decision](work-orders-design.md): Rail · Service, Shell / Top bar, the More panel and the phone list.</li><li>The shared record parts from the [lead record page decision](lead-record-page-design.md), listed in section 2 above.</li><li>Button, Tag and Font Awesome Light icons named as in `src/components/font-awesome-icons.ts`.</li><li>New: the components in section 2.</li></ul> |
| Source authority | <ul><li>[ADR-0009](ADR-0009-p04-work-scope-readiness.md) and the P04 seed (`db/seed-p04.sql`): the criteria, their stages and which allow an exception or Not applicable.</li><li>`src/service/work-orders.ts`: `blockers()`, `saveWorkScope` (a draft is saved in place; a successor needs a reason), `proposeVisit` (against the current scope), `readWorkOrder` (`scope_review_required`) and `authoriseWorkOrder`.</li><li>`src/service/work-scope-validation.ts`: coverage positions, readiness outcomes and task types.</li><li>Labels from `src/components/work-order-screens.tsx`, `src/service/components/client/scope-view.client.tsx` and `src/field/visit-guidance.ts`.</li><li>The [Job pack decision](job-pack-design.md) for the pack link, and [PL-01](pl01-unassigned-demand.md) for unassigned demand.</li></ul>Fixture: synthetic `SYN-PPO-WO`, `SYN-PPO-TKT`, `SYN-PPO-EQ`, `SYN-PPO-APT` and `SYN-PPO-PACK` references, customers, sites, people and dates |
| Incoming handover | The Work orders register (a row, or "Open work order" in the record window), My Work, an appointment or job pack ("Open work order"), a service request and global search |
| Outgoing handover | Linked requests (`/service/tickets/[id]`), equipment (`/equipment/[id]`), appointments (`/service/appointments/[id]`), job packs, and the customer and site records. Authorised orders without an active visit reach Schedule as unassigned demand. Coverage never decides billing, warranty or supplier recovery; Finance review stays separate |
| States shown | <ul><li>A draft blocked at work authorisation, in every view.</li><li>Ready to authorise, in the authoriser's view with the dialog.</li><li>Authorised with a successor in draft and a visit needing scope review.</li><li>Six states: scope needed; ready to authorise in the Service owner's view; authorised with no visit; read only; a newer saved version while editing; a refresh that failed after an earlier read.</li><li>The phone list, three tabs and the action sheet.</li></ul>Loading, denied and phone states other than these are not drawn |
| Departures | Section 4 |
| Verification | Section 8 |

## 4. Display rules and departures

### The readiness bar

"Ready to authorise" shows six checks. Each one stands for blockers the code already raises, so the bar adds no rule.

| Check | Covers these blockers in `blockers()` |
|---|---|
| Requests triaged · n of n | Link a triaged service request; every linked request must be Triaged |
| Scope | A saved scope with a summary, exclusions, the account and Finance route, and tasks with completion requirements; shutdown conditions for an intervention; the Service owner's current authority |
| Equipment | Each task's equipment is identified, or limited to a reviewed identification plan; a configuration must be verified |
| Coverage route | A coverage assessment, and the Unknown or Disputed limit to bounded inspection or identification |
| Authority evidence | Exact authority evidence for the scope |
| Criteria cleared · n of 5 | Site access, Site and biosecurity controls, Required competencies reviewed, Mandatory isolation and Shutdown authority, each Pass, Permitted exception or Not applicable. Expired or stale evidence reads Unknown |

For a successor, the bar reads "Ready to authorise r03". A changed scope shows its criteria as not cleared ("scope changed").

### The header action

| State | Main action | Shown to |
|---|---|---|
| No scope saved | Write the scope | People who can edit |
| Draft with blockers | Review readiness; Edit scope as the second button | People who can assess and edit |
| Draft or successor with no blockers | Authorise rNN | People who can authorise. Others see Edit scope only |
| Authorised, with no visit | Propose a visit; Create successor scope as the second button | People who can edit |
| Read only | None; "…" keeps Copy link | Everyone else who can read the order |

### Departures from today's page

| ID | Departure | Today |
|---|---|---|
| W1 | The accepted Service shell and the shared record layout | A page header over stacked panels |
| W2 | Panels become view tabs (R2) | Linked requests, work authorisation, current scope, readiness, planned visits and scope revision history in one scroll |
| W3 | The blockers become a decision card with the action that clears each one | A bulleted blocker list |
| W4 | Authorise asks for confirmation and a reason | One button that sends fixed reason text |
| W5 | Readiness review in a side panel | An inline disclosure form |
| W6 | Successor, read-only, stale-save and refresh-failure states use Record / Banner | A callout, and the shared error and retained-read notices |
| W7 | Visits show their job pack and a "Scope review required" tag | Visit articles with a callout |
| W8 | New reads: Created, Updated and Next visit in the summary, the Evidence list, the history read with day groups and counts, and the record position | Not shown |

The LC-16 Sales sources panel is not drawn. It would sit in the details column as "Won-deal source".

## 5. Corrections to earlier designs

Claude found two errors while drawing. Dean adopted both corrections with "Proceed with your recommendations".

- **Work orders register, Next visit.** The [Work orders decision](work-orders-design.md) says a Draft has no next visit because "no visit can be planned for it". The code allows a visit to be proposed against the current scope at any time (`proposeVisit`). Such a visit reads "Scope review required" until it was proposed on the authorised, current scope at the same version (`readWorkOrder`). The register's rule is corrected in that record. Its captures show no draft with a visit, so they stay unchanged.
- **Lead record page, weekdays.** The history headings on the accepted lead record page named the wrong weekdays: 3, 4, 5 and 6 October 2026 are Saturday, Sunday, Monday and Tuesday, not Friday to Monday. The 36 headings are corrected in Figma and included in this decision's named version. The [lead captures r01](../reference/ui/crm/lead-record-page-design-r01/README.md) keep the earlier text. A lead capture revision r02 is recommended. A scan of every other accepted page found no wrong weekday.

## 6. Not decided

- **Building the page.** The view tabs, the decision card, the side panel, the dialog and the new reads (section 4, W8) need their own decisions and pull requests. Today's read returns the order, its scopes with readiness, its visits, linked requests, blockers and actions, but not the creation and update times, an evidence list, a history or the record position.
- **The authorisation reason.** The command already takes one. Asking for it in the interface is part of building the page.
- **Rolling out the shell.** As for the registers, the shell parts are decided separately for every page.
- **Not drawn yet:**
  - loading and denied states (an order outside your access reads as not found);
  - the coverage and authority-evidence editors expanded;
  - the successor scope form with its reason;
  - the Propose a visit form;
  - the phone Visits tab;
  - the Sales sources panel;
  - comparing two scope revisions;
  - phones at 320 px.

## 7. Consequences

- No application code, route, migration, permission or capability changes. No page, scope or parent requirement ID changes; all 78 parent IDs remain.
- The [work order detail register entry](../design/development/pages/route-service-work-orders-id.md) now links this design and its captures. Its visual status stays "Needs review": the app does not yet match the design.
- The shared record layout now has two record types. Record / View tab and Record / Criterion row join the shared parts proposed for the other record pages.
- When the page is built, it is compared with these captures and the Figma frames at the same viewports, following ADR-0053 rule 7.
- A later change to this design receives a new named version and a new capture revision folder; these bytes stay unchanged.

## 8. Verification

- Claude checked every frame with screenshots taken inside Figma.
- An audit of the page found no overlapping frames and no prototype link to another page. Links that cloned frames carried to the Work orders page were removed; the rail's component interactions were kept.
- A contrast check used the same token pairs as the lead record page, whose lowest pair is grey text on the light-grey panels at 4.62:1. The amber status text is used only on white and on the warning tint.
- Claude cannot run Present mode through the connector, so the click-through was not exercised by Claude.
- The eleven captures are copies of the accepted frames, made on the "Captures (icon-free)" page, with every Font Awesome icon swapped for `Icon/placeholder`: 906 icons in all. A check after the swap found none left. They were exported at scale 1 with the Figma connector, downloaded directly into the captures folder, and inspected. The hashes are in the [captures README](../reference/ui/service/work-order-record-page-design-r01/README.md).
- `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py`, `node scripts/design-baseline-check.mjs` and `npm run studio:check` were run on this change.
- Nothing is built, so there is no application or device evidence. This record implies no visual review of the application and no UI baseline.
