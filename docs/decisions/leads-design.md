---
document_id: PPO-CRM-LEADS-DESIGN-DEC
date: 2026-10-11
owner: Dean Fiedler
status: Owner-accepted design; view counts, menu views, rail label, native implementation, shell rollout and UI baseline acceptance separate
source_commit: 40ac5a01439d37a09fcba5a031afa4efab30711d
versioning: git
---

# Leads design — owner decision

On 11 October 2026 Claude reviewed the pages already in Figma: five accepted Estimating pages, and an Engineering workload proposal that another session was drawing. It then offered three candidates for the next page. Dean chose "Leads (Recommended)": the Sales Leads register at `/sales/leads`. This is the first Sales page in Figma, and it is the page his Pipedrive reference screenshots showed (the Leads Inbox).

Claude drew it with synthetic data on the pattern Dean accepted for [Reviews & approvals](estimate-reviews-design.md), using only rules the code records, and listed five recommendations. Dean answered: "Proceed with your recommendations". The design is cited as the named Figma version "Leads — Pipedrive pattern, accepted".

This record retains:
- his decisions;
- the design reference and its icon-free captures;
- the conformance declaration;
- the departures from today's page;
- what remains open.

Scope: the existing Sales destination `leads`: route `/sales/leads`, register entry `route:/sales/leads`, CRM leads including the LC-11, LC-12 and LC-17 additions. No parent requirement ID is added or renamed.

This is a design decision. It authorises no:
- application code or count read;
- label change in the app;
- route change or migration;
- permission or capability;
- deployment.

The page's approved references (the r04 desktop interior and the r02 phone reference) and Dean's 9 October 2026 visual review of the running page are retained unchanged. This design replaces their layout only when it is built.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design Leads next | User decision, 11 October 2026 | Dean chose "Leads (Recommended)" from three candidates: Leads, Specialist configurations and Estimation wizard. Claude gave its reasons: Sales is the default department and had no Figma page; his Pipedrive screenshots were of its Leads Inbox; and the page sets up the Sales rail, side menu and phone bar for later Sales pages. Claude also noted that the current page was accepted on 9 October 2026, so this design would replace that layout |
| Reuse the accepted pattern | Prior user decisions | The [Reviews & approvals decision](estimate-reviews-design.md), section 1: a labelled rail; a flush secondary menu; a full-width grid "that extended all the way to the edges of the container, with individual cells"; record windows that "overlap them instead" of condensing the table; fixed checkbox and gear columns; phone list rows; an icons-only phone tab bar. Also the record window's maximum width: "make the maximum width of the record container working on a scenario when both the primary and secondary menus are open" |
| A count on every view | User decision, 11 October 2026 | "Proceed with your recommendations." Claude recommended showing counts, as Pipedrive and the earlier r01 reference do. The app counts only the page it has loaded ([crm-leads-runtime.md](crm-leads-runtime.md)), so the build needs a count read |
| My leads, the statuses and Follow-up as side-menu views | User decision, 11 October 2026 | Same words. Today they are an owner choice and a status filter. Follow-up uses the app's next-action states |
| Next activity and its due date straight after the title | User decision, 11 October 2026 | Same words. Claude recommended it so that the follow-up queue shows without scrolling sideways, as in Pipedrive's Leads Inbox. People can still reorder columns |
| The rail label "Estimating handovers" | User decision, 11 October 2026 | Same words. The app's label "Sales-to-Estimating handovers" is cut short in the 240 px rail. The page title and the destination id are unchanged |
| The phone tab bar stays visible on Leads | User decision, 11 October 2026 | Same words. The code shows the bar on Leads (`tests/browser/department-navigation.spec.ts`). The sentence in [application-shell-integration.md](application-shell-integration.md) saying the Leads phone page hides it is to be corrected when the page is built |
| The other recommendations on the notes card | Claude's recommendations, adopted | Same words: <ul><li>Overdue in red with an icon and the words.</li><li>"Due date needed" and "Next action needed" in amber.</li><li>An unknown organisation or contact in grey.</li><li>The sample record is a lead the signed-in person owns, so its actions are live.</li><li>A selection offers Open in sequence and Export list only.</li><li>The Sales rail is drawn on this page until the shell build decides how department rails are drawn.</li></ul> |
| Building the page, the count read, the menu views, the label and the shell | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Leads — Pipedrive pattern, accepted". The file's link is not recorded in this public repository, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Accepted frames | Page "Leads (accepted)" `190:20237`: <ul><li>desktop `190:20513`;</li><li>desktop with two rows selected `190:21123`;</li><li>phone `190:21774`.</li></ul>Its notes card `190:21928` lists the scope, rules, handovers, decisions, recommendations, what is still open and what is not drawn |
| Page components | <ul><li>Rail · Sales (proposal) `190:20238` (Expanded `190:20239`, Collapsed `190:20256`)</li><li>Lead grid row `196:23345` (Default `196:23346`, Hover `196:23357`, Selected `196:23368`)</li><li>Lead grid header `196:23379`</li><li>Lead list row (phone) `197:1184`</li><li>Lead snapshot (phone) `197:1201`</li></ul> |
| Shared parts | The Shell v2 (proposal) parts listed in the [Reviews & approvals decision](estimate-reviews-design.md), section 2, unchanged. Twelve icon components were added on the Components page, named as in `src/components/font-awesome-icons.ts`: <ul><li>for the Sales rail and phone bar: heart-pulse, crosshairs, solid/crosshairs, circle-dollar, address-card, cube, chart-line and calendar-day;</li><li>for the views and the record window: box-archive, ban, phone and seedling.</li></ul> |
| Prototype | Flows "Leads — desktop (proposal)" and "Leads — phone (proposal)". They use the existing Prototype switches |
| Retained captures | [Leads design r01](../reference/ui/crm/leads-design-r01/README.md): five icon-free PNGs at exact frame size, with hashes. These are the repository reference for this decision |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | The existing destination `leads` in the Sales rail (`departmentRails.sales` in `src/shell/navigation.ts`), route `/sales/leads` (`src/app/(business)/sales/leads/page.tsx`), register entry `route:/sales/leads`. Capabilities, unchanged: <ul><li>`crm.lead.read` to see leads;</li><li>`crm.lead.create` for + Lead;</li><li>`crm.lead.edit` and `crm.lead.convert`, held by the lead owner only, to change or convert a lead.</li></ul> |
| Page type (r20) | Register / worklist, with a record detail window and a multi-select action panel. On the phone: a list with a full-screen record view. These keep their own types and are not redesigned here: <ul><li>the + Lead form;</li><li>the reason dialogs;</li><li>Transfer owner;</li><li>the Convert to deal review (LC-11).</li></ul> |
| Reused components | <ul><li>The Reviews & approvals shell and grid parts: Rail item, Menu item, Menu heading, Menu edge, Menu strip, More panel, Grid / Header cell, Grid / Cell, Checkbox, Checkbox cell, Row actions cell, Tab item and Tab bar (phone).</li><li>Shell / Top bar, Shell / Phone header, Quick add, Button, Tag and Brand / Logo.</li><li>Font Awesome Light icons named as in `src/components/font-awesome-icons.ts`.</li><li>Page-specific: the Sales rail, the lead grid row and header, the phone list row and the phone record view.</li></ul> |
| Source authority | The leads code, with each file's role:<ul><li>`src/components/leads-workspace.tsx`: views, owner choice, filters, sort, + Lead.</li><li>`src/components/leads-desktop-list.tsx`: columns, wording, row menus.</li><li>`src/crm/leads/reads.ts`: list row, next-action states, `can_edit` and `can_convert`.</li><li>`src/crm/leads/service.ts` and `validation.ts`: transitions, reasons, conversion.</li><li>`src/crm/leads/amendments.ts`: transfer owner.</li><li>`src/crm/leads/context.ts`: only the owner may change a lead.</li></ul>The decisions [crm-leads-runtime.md](crm-leads-runtime.md) and [lead-customer-context.md](lead-customer-context.md), and the [lead-to-delivery continuity contract](../contracts/lead-to-delivery-continuity.md) (LC-11, LC-17). Fixture: synthetic `SYN-PPO-LEAD` references (the format from migration 0018), organisations, people and dates |
| Incoming handover | <ul><li>Manual enquiries captured with + Lead, with their source channel and details.</li><li>Their original activities.</li><li>Reviewed follow-ups sent back to Sales from Projects, Service and Maintenance (LC-17).</li></ul> |
| Outgoing handover | <ul><li>"Convert to deal" opens the existing conversion review (LC-11). It creates a Discovery deal owned by the lead owner, which then appears in Deals.</li><li>"Plan activity" links or creates a customer-contact activity in Activities.</li><li>Resolving the customer (LC-12) uses the shared Organisations, Sites and People records.</li><li>Archive, Disqualify and Transfer owner sit under "…".</li></ul>Nothing is changed from the register or the small panel |
| States shown | <ul><li>The Inbox register, covering:<ul><li>every Inbox status;</li><li>an unknown organisation and an unknown contact;</li><li>Next action needed, Due date needed, Overdue and future due dates.</li></ul></li><li>The record window for a lead the signed-in person owns, with its resolved customer context, activities and history.</li><li>A two-row selection with the small panel.</li><li>The phone list and the phone record view.</li><li>The More slide-out and the collapsed rail and menu, which work in the prototype.</li></ul>Loading, error, empty and stale states are not drawn |
| Departures | Section 4 |
| Verification | Section 7 |

## 4. Departures

The Reviews & approvals departures D1–D9 apply, with one difference in D8. On Leads no phone tab is current: the app marks a tab current only for the bar's own destinations, and Leads is reached through More ([my-work-sales-mobile-r07-integration.md](my-work-sales-mobile-r07-integration.md)).

These are the Leads departures from today's page:

| ID | Departure | Today's page |
|---|---|---|
| L1 | The four views move into the flush side menu, each with a neutral count. The build needs a count read | Icon-only tabs for Inbox, Archived, Disqualified and Converted, with no counts; "N leads" counts the loaded page |
| L2 | Side-menu views, in four groups:<ul><li>Inbox and My leads;</li><li>Status: New, Contacting, Nurturing;</li><li>Follow-up: Overdue, Next action needed, from the app's Overdue, Needed and DueNeeded next-action states;</li><li>Other views: Archived, Disqualified, Converted.</li></ul> | An owner choice (Everyone, My leads) and a Filters menu (search, status, source) |
| L3 | Toolbar: Owner and Source filters, the count with its refresh time, Refresh, a navy "+ Lead" and "…" | Tabs, owner choice, Filters, Sort, "+ Lead" with a caret, and a Leads options menu |
| L4 | Default columns, in order:<ul><li>Lead title</li><li>Next activity</li><li>Next activity due</li><li>Organisation</li><li>Contact</li><li>Status</li><li>Lead owner</li><li>Date added, sorted newest first.</li></ul>Lead ID, Next activity owner, Source and Archived stay available in the column chooser, and Lead title cannot be hidden | Lead title, Organisation, Contact, Status, Lead owner, Next activity, Next activity due, Date added |
| L5 | The app's wording, with colour that never stands alone:<ul><li>Overdue in the danger colour with an icon;</li><li>"Due date needed" and "Next action needed" in the warning colour;</li><li>"Organisation to confirm" and "Contact to confirm" muted;</li><li>status as a neutral tag.</li></ul> | The same wording; status as a pill |
| L6 | Record window, opened by clicking a row:<ul><li>Enquiry: source, source details, owner, date added and requirement.</li><li>Customer context: the organisation and its resolution, the site, and the contact with its captured text.</li><li>The rule note, the Activities and Customer context tabs, and History.</li><li>Footer: Plan activity and Convert to deal, for the lead owner only.</li><li>"…": Archive, Disqualify and Transfer owner.</li></ul> | The lead title opens the Lead modal; the r01 reference used a right-hand drawer |
| L7 | The small panel for a selection offers Open in sequence and Export list only. Leads still change one at a time, by their owner, with a written reason where one is required | "N leads selected · Clear selection", with no actions |
| L8 | Phone: flush list rows showing the title; the organisation and contact with the status tag; and the next activity with its due date. The floating "+" for + Lead stays | Cards with a floating "+" |
| L9 | The labelled Sales rail. Items: Pulse; Leads (selected, Solid crosshairs icon, count); Deals; Activities; Tasks; Sales Inbox; Estimating handovers; Won-deal receiving; Aftercare & renewal; Contacts; Products; More. Insights is omitted while it is unavailable, as the app hides it | The 232 px rail, labelled "Sales-to-Estimating handovers" |
| L10 | The Sales phone bar is icons only: My Work, Deals, Activities, Contacts and More. It stays visible on Leads, with no tab current | Four labelled tabs and More; the same current-tab rule |

## 5. Not decided

- **Building the page.** Each of these needs its own pull request:
  - the count read for each view and for the rail badge;
  - list filters for the Follow-up views and for My leads as a view;
  - the new default column order.

  No new capability is proposed.
- **The label in the app.** The rail label "Estimating handovers" is decided for the design. Changing it in `src/shell/navigation.ts`, as the label or a menu label, along with the guide and the navigation tests, is separate work.
- **Rolling out the shell.** As for Reviews & approvals, the adopted Shell page and the app stay as built until a shell implementation is planned and recorded.
- **Open questions:**
  - When a page is reached through More, should More be marked current, as the Sales briefs design draws it, or should no tab be marked, as the app does and as this design draws it? Claude recommends deciding this once for the whole shell.
  - What should the Leads rail badge count? The design shows the Inbox count. Overdue leads, or leads needing an action, are alternatives.
  - Should the Archived, Disqualified and Converted counts be all-time, or limited to a period?
  - How should several rows be selected on the phone? The recommendation is the same as for Reviews & approvals: press and hold a row, with the actions in a bar at the bottom.
- **Not drawn yet:**
  - loading, empty, filtered no-results, failed read, denied and stale states;
  - a lead someone else owns: the same window without Plan activity or Convert to deal, saying who owns the lead;
  - the Archived, Disqualified and Converted views and their row menus;
  - the + Lead form, the reason dialogs, Transfer owner and the Convert to deal review;
  - the LC-12 resolution and the LC-17 follow-up review;
  - the visible label for the phone warning that the 9 October review asked for;
  - phone selection;
  - the 1024 px and 320 px widths.

## 6. Consequences

- No application code, read model, route, migration, permission or capability changes. No page, scope or parent requirement ID changes; all 78 parent IDs remain.
- The [Leads register entry](../design/development/pages/route-sales-leads.md) now links this design and its captures. Its design reference has changed, so the design register reports Dean's 9 October 2026 review of the running page as Stale. The app has not changed and the review record is retained. A new review is needed after the page is built.
- The approved references `docs/blueprints/crm-leads-desktop-preview.html` (r04) and `docs/blueprints/crm-leads-preview.html` (r02) stay retained unchanged. This design replaces their layout only when it is built.
- When the page is built, it is compared with these captures and the Figma frames at the same viewports, following ADR-0053 rule 7.
- A later change to this design receives a new named version and a new capture revision folder; these bytes stay unchanged.

## 7. Verification

- **Figma checks.** Claude checked every frame with screenshots inside Figma before showing it to Dean, and fixed what they showed:
  - the "+ Lead" icon colour;
  - column widths that cut words short;
  - side-menu and More heading spacing;
  - the selected rail icon's colour;
  - wrapping and icon colours in the record views.

  Claude could not run Present mode through the API.
- **Prototype links.** Cloning the Reviews frames dropped the checkbox, chip and Cancel links between the desktop frames. They were restored to point at this page's frames. Six links inside instances still pointed at the Reviews page and were removed. A final scan found no link leaving this page, and no instance of a Reviews page component.
- **Captures.** The five captures are copies of the accepted frames with every Font Awesome icon swapped for `Icon/placeholder`. A check after the swap found no Font Awesome instance left in any copy. They were exported at scale 1 with the Figma connector, and each image was inspected. The hashes are in the [captures README](../reference/ui/crm/leads-design-r01/README.md).
- **Repository checks.** `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py`, `node scripts/design-baseline-check.mjs` and `npm run studio:check` were run on this change.
- **Limits.** Nothing is built, so there is no application or device evidence. This record implies no visual review of the application and no UI baseline.

## Named version confirmation — 12 October 2026

Dean confirmed in the PR completion session that the named Figma version "Leads — Pipedrive pattern, accepted" has been saved. This resolves the outstanding draft checkpoint in PR #426; implementation and application visual acceptance remain separate.
