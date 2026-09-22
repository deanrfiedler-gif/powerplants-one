---
document_id: PPO-NAV-ICON-REC
title: Department navigation and icon recommendations
revision: r02
date: 2026-09-22
status: Sales refinements recorded; implementation and visual acceptance pending
prepared_for: Dean Fiedler
source_branch: main
source_commit: ab96e2b83598ba8f80688d2d68e4907a21453793
sales_follow_up_commit: 0c95c5af776c97374997623bd1070d9de480cf82
---

# Powerplants One — department navigation and icon recommendations

## Recommendation

Use one consistent local SVG icon family across seven department workspaces, with outlined default icons and matched filled or selectively filled active variants. The logo continues to open Home, and **More remains fixed at the bottom of every department rail**.

**Sales has nine shortcuts in this exact order:** Pulse, Leads, Deals, Activities, Tasks, Sales Inbox, Contacts, Products, Insights. Pulse is the first page shortcut immediately below the logo. My Work remains available through More in Sales. The other six departments retain My Work first followed by their seven proposed department shortcuts.

The department changes the selection and order of shortcuts. The meaning and drawing of a shared icon stay consistent throughout Powerplants One. Every page remains reachable through a parent destination, a labelled secondary menu, the searchable More menu or a contextual record link.

This revision records the requested Sales refinements and the associated naming and interaction recommendations. **Deals** is the recommended Sales label; **Contacts** groups **People** and **Organisations**. The other department sets remain proposals, with the shared consistency adjustments identified below. This document is a design register, not evidence that the rail, new pages or data changes have been implemented. Enable each shortcut when its destination, user access and landing behaviour are ready.

## Repository evidence and reconciliation

The original r01 inspection covered the default branch `main` at `ab96e2b83598ba8f80688d2d68e4907a21453793`. The Sales follow-up checked the maintained navigation and shell at `0c95c5af776c97374997623bd1070d9de480cf82`; the original full-source evidence remains pinned below. GitHub access was verified. The inspection covered AGENTS.md, README.md, docs/STATUS.md, the working master blueprint, the maintained navigation and shell components, shell styles, the r17 shell decision, module-workspace declarations, package.json and the retained page-coverage audit. A repository tree read identified current native page files. This is a source inspection, not a signed-in live-app review.

- The maintained navigation defines **Sales; Estimating & quotation; Engineering; Projects; Service operations; Supply chain; Finance**. Use the short names in cramped navigation; the full department names in this document identify their scope.
- The desktop `ProductNavigation` currently renders the logo and bottom More control. Adding department shortcuts is the next shell revision, deliberately superseding that part of r17.
- `ShellIcon` and `ProductIcon` already draw local SVGs on a 24 × 24 coordinate grid with a 1.7-unit stroke and rounded joins. `desktop-shell.css` renders 25 px rail icons in 48 × 48 px targets on a 76 px navy rail.
- The current navigation reuses icon identifiers for different destinations, including Sites/Facilities, Engineering/Equipment and several operational work surfaces. Dedicated semantic assignments will make these easier to distinguish.
- Native Sales paths are `/sales/opportunities` and `/sales/leads`. The follow-up navigation already uses **Deals** as the visible label for `/sales/opportunities`. Use Deals consistently in the Sales interface while preserving the existing route and record identifiers. Older r17 documentation still mentions `/crm/...`; the maintained navigation and current route tree take precedence for this recommendation.
- Page coverage is broader than implemented navigation. The retained r04 audit describes 149 briefs across 21 families; these are planning decompositions, not 149 required rail icons or 21 departments. Its delivery classifications are historical and are not treated here as current implementation status.
- The blueprint's wider corporate functions do not establish additional app workspaces. People & Culture, Digital Systems, QHSE and executive reporting should not be presented as newly implemented departments on this evidence. Their relevant existing shared capabilities remain discoverable through More and contextual menus.
- At the original r01 inspection, open PR #275 held the Priva fertigation scoping HTML design. A proposed scoping icon does not establish its runtime integration.

## Icon and interaction standard

| Property | Recommendation |
|---|---|
| Family | Continue PPO's local SVG family with paired outline and active variants. Use Lucide names below as shape references; filled variants may need purpose-designed local paths. |
| Asset ownership | Add semantic icon names to the shared icon component; preserve local rendering and attribution for any copied assets. `lucide-react` is not currently a dependency, and this proposal does not require installing it. |
| Geometry | 24 × 24 viewBox, consistent optical weight, 1.7-unit stroke, rounded ends and joins. Preserve the current 25 px rendered rail size. Review shape balance at its actual displayed size. |
| Rail | Preserve the current 76 px navy rail and 54 px logo. |
| Targets | Preserve 48 × 48 px targets, with at least 44 × 44 px effective pointer/touch area. Never shrink the controls to fit more entries. |
| Default | White or high-contrast neutral outline on the existing navy `#242a37` rail. |
| Hover | Reuse the existing slightly lighter navy `#343c4c` tile; keep geometry unchanged. |
| Selected | Use a purpose-designed filled or selectively filled icon, paired with the proposed pale green `#f0f6ed` tile, dark green `#315e43` glyph and an inset edge/shape cue. Set `aria-current="page"` on the active destination link. Preserve essential internal details with contrasting cut-outs or strokes. Review the treatment against the next shell baseline. |
| Keyboard focus | Preserve the current separate visible focus ring; keyboard focus and active-page state must remain distinguishable, including when the active link is focused. |
| Shape treatment | Simple outlines at rest and matched filled variants when active; retain the same silhouette, dimensions and optical weight. Do not mix unrelated icon families or use emoji, 3D effects, decorative gradients or tiny multi-symbol illustrations. |
| Labels | Give every icon control a plain-English accessible name, a tooltip on hover and keyboard focus, and a visible label in the expanded menu. Hide the decorative SVG from assistive technology when the link or button already supplies its name. An icon alone is not sufficient explanation of an unfamiliar function. |
| Badges | Use only meaningful actionable counts that the current user can access. Never use badges as decoration or as the only warning. |
| Consistency | One shared destination uses one label and one symbol across departments. Symbol reuse is appropriate for the same concept, such as an incoming-work inbox or review queue. |
| Restricted destinations | Derive available links from current server permissions. Navigation presentation creates no access rights. |
| Short desktop height | Keep the logo and bottom More control accessible, and let the middle shortcut group scroll vertically. Preserve the specified order and 48 × 48 px targets; scroll the focused or active shortcut into view. Sales retains all nine destinations in this group. |
| Phones | Carry the same semantic icons into the existing mobile pattern. The Sales phone bar and its Leads exception are current baselines; evaluate changes separately instead of forcing the desktop rail onto phones. |

Active variants must be drawn intentionally. Applying a blanket `fill="currentColor"` to outline SVGs can obscure the heartbeat, calendar grid, envelope flap and other identifying details. Use contrasting internal marks, preserved negative space or selective fill where a solid silhouette would become ambiguous. Apply this state convention to every department. Opening More highlights that control as an open menu and uses `aria-expanded`; it does not change the active destination. The three dots keep their simple appearance.

The Lucide reference names identify shapes, not PPO business identifiers or mandatory import names. Confirm the chosen glyph in the implementation's pinned asset source. Keep business identifiers such as `equipment`, `service-review` and `estimation-wizard` separate from third-party icon naming.

## Reading the department tables

**Rail** means a default page shortcut in the order shown. Sales starts with Pulse directly below the logo; the other six department tables start after My Work. **Secondary** means a labelled departmental or More-menu destination. Role-specific promotion can be considered where stated, but must not silently reorder the specified Sales rail. **Context** means a page reached within the relevant organisation, person, equipment, estimate, project or job; it should retain its parent's active rail item.

Each rail shortcut opens the relevant overview, register, workload or remembered permitted list view. It must not choose an arbitrary organisation, person or record. Child pages retain their record context and a clear way back. A specialist module can still have its own secondary navigation without occupying additional rail slots.

## 1. Sales

Daily priorities, sales relationships and deals.

The following nine page shortcuts appear in this exact top-to-bottom order. There is no separate Customers or My Work icon above or between them. More remains anchored at the bottom, outside the scrolling shortcut group.

| Order / placement | Navigation label | Icon reference | What it should look like | Purpose |
|---|---|---|---|---|
| 1 · Rail | **Pulse** | `HeartPulse` | A clean heart outline with a single ECG-style pulse line running through its centre. Keep the peak and dip clear at 25 px. | The salesperson's landing overview: priorities, follow-ups, upcoming work and items needing attention. |
| 2 · Rail | **Leads** | `Crosshair` | A circular crosshair with four short, balanced horizontal and vertical sight marks and a clear centre. Avoid arrows, a dart or a funnel. | New enquiries, qualification and conversion into deals. |
| 3 · Rail | **Deals** | `CircleDollarSign` | The existing dollar sign centred inside a clean circle. | The deal board, list, forecast and individual deal workspace. |
| 4 · Rail | **Activities** | `CalendarDays` | The existing two-ring calendar with a small, legible grid of dates. | Planned and completed calls, meetings, site visits and sales interactions. |
| 5 · Rail | **Tasks** | `ClipboardCheck` | A portrait clipboard with a short top clip and one prominent tick inside the board. Keep the tick central and uncluttered. | Assigned sales actions, due dates and completion, such as preparing a quote or confirming a lead time. |
| 6 · Rail | **Sales Inbox** | `Mail` | A rectangular envelope with clear diagonal flap lines. | Opens the existing email module and record-linked correspondence available to the user. |
| 7 · Rail | **Contacts** | `IdCard` | A horizontal contact/business card, with a small person silhouette on the left and two or three short detail lines on the right. | A shared entry to both People and Organisations, their contact details and relationships. |
| 8 · Rail | **Products** | `Package` | The existing outlined cube/package with a clear lid seam and separate faces. | The shared product and parts catalogue used in a sale. |
| 9 · Rail | **Insights** | `ChartLine` | Two simple chart axes and a rising or varying line with a few clearly separated points or bends. Use one line-chart metaphor without extra bars. | Pipeline, conversion, forecast and sales-performance analysis. |
| Fixed bottom | **More** | `Ellipsis` | Three equally sized, evenly spaced horizontal dots. | Opens department switching, secondary destinations and shared support functions; identical placement in every department. |
| Secondary · More | **My Work** | `ClipboardList` | A clipboard with three short task lines. | The broader personal work, review and waiting-work overview. Sales does not add it as a tenth primary shortcut. |
| Secondary | **Sales handovers** | `ArrowRightLeft` | Two horizontal arrows pointing in opposite directions. | Sales-to-estimating and won-deal receiving; acceptance remains a separate step. |
| Secondary | **Quotations** | `FileText` | A portrait page with a folded corner and short text lines. | Customer-facing quotation records linked to the deal. |
| Secondary | **Account development** | `Route` | A winding line linking clearly marked waypoints. | Territory visits, account plans and relationship development. |
| Secondary | **Aftercare & renewals** | `HeartHandshake` | A restrained heart enclosing a handshake. | Post-sale follow-up, relationship care and renewal opportunities. |
| Context | **Stakeholders** | `Network` | A central node connected to three smaller nodes. | Decision makers, technical contacts and relationship roles within People and Organisations. |

### Sales page names and boundaries

**Pulse** is the Sales landing overview and daily action feed. It should surface leads awaiting a response, deals without a next step, overdue tasks or activities, upcoming meetings and site visits, quotation follow-ups and blocked work. Cards should open or update the underlying permitted record. Completing a task in Pulse updates the same item shown in Tasks; Pulse must not create a second task system. The Pipedrive reference establishes the intended type of overview, not a requirement to reproduce its layout. The referenced screenshot was not available for inspection, so exact visual parity is not claimed.

**Deals** is the recommended label. Both Deals and Opportunities are professional terms; Deals is shorter and suits this sales workflow. Use Deals in navigation, headings, tooltips, search and actions such as Add deal, and retain Forecast as a view within Deals. The existing navigation already uses Deals, while the route remains `/sales/opportunities`. Do not rename routes, database fields, API contracts or record identifiers solely to change the visible wording.

**Activities** covers sales interactions: calls, meetings, site visits and their outcomes. **Tasks** covers actions to complete, such as preparing a quotation, obtaining a pump curve or confirming a supplier lead time. Tasks may have due dates and appear on a calendar, but scheduling an item must not create a duplicate work record. Define filters and creation defaults so the two destinations remain understandable. A tick on the Tasks icon identifies the function; it does not mean every task is complete.

**Sales Inbox** opens the existing email page module. The label does not imply a new shared mailbox or broader access to colleagues' correspondence. Preserve the current user, mailbox, provider connection and record-linking permissions.

**Contacts** opens a hub with clearly labelled **People** and **Organisations** views and remembers the last permitted view. Use the business-card icon for the hub, a person icon for People and a building icon for Organisations. An organisation can hold multiple relationship roles, including Prospect, Customer, Supplier, Subcontractor and Partner. A business that is both a customer and a supplier is one organisation with both roles, not two records.

Use **Organisations** for the general entity directory and **Customer** for the relevant relationship, filtered view or domain function, such as Finance's Customer accounts. Preserve stable record IDs, external ERP keys, permissions and links among people, organisations, sites, facilities and equipment. The current `/customers` route is an existing implementation input; its presence does not prove it already supports every organisation role. The broader hub and naming change need an explicit data and landing-view design, rather than a blind replacement of every occurrence of Customer.

**Insights** is a primary destination for measures, trends and comparisons. Pulse answers what needs attention today; Insights explains performance over time. Keep forecasting within the deal workspace and provide relevant forecast analysis in Insights without creating conflicting sources of truth.

Keep Sites, Facilities, Equipment and stakeholder relationships reachable through their linked records and More. Sales owns the customer relationship; won-deal acceptance and delivery release remain separate workflow events.

### Sales active-icon drawings

The outline and active drawings must share the same silhouette and alignment. Use the common selected tile and edge cue as well as the glyph change, so the state does not depend on colour alone.

| Destination | Selected appearance |
|---|---|
| Pulse | Fill the heart body; preserve the pulse as a contrasting cut-out or stroke through the centre. |
| Leads | Strengthen the circular ring and fill the small centre; keep all four crosshair marks visible and avoid turning the whole symbol into a disc. |
| Deals | Fill the circle and retain a crisp, contrasting dollar sign. |
| Activities | Selectively fill the calendar body, retaining the binding rings, header division and date grid. |
| Tasks | Fill the clipboard body with a contrasting central tick; retain a recognisable top clip. |
| Sales Inbox | Fill the envelope body and preserve the diagonal flap as a contrasting line or cut-out. |
| Contacts | Fill the card body while retaining the person silhouette and short detail lines in contrast. |
| Products | Selectively fill the cube faces, preserving the lid seam and boundaries between faces. |
| Insights | Selectively fill the area beneath the chart line, keeping the line and axes legible. Avoid a solid rectangular chart block. |

Only one page destination is active at a time. A deal detail page retains Deals, a task detail page retains Tasks, and person or organisation detail pages reached within the Contacts destination retain Contacts. Pulse cards should activate the destination of the record they open. More being open is a separate menu state and does not clear or replace the active page selection. For a page available only through More, show its current state in the labelled menu and page heading rather than falsely selecting a different primary destination.

## 2. Estimating & Quotation

Discovery, configuration, costing and quotation.

| Order / placement | Navigation label | Icon reference | What it should look like | Purpose |
|---|---|---|---|---|
| 1 · Rail | **Intake** | `Inbox` | An open in-tray with a shallow central notch. | Requests received from Sales and the estimating workload. |
| 2 · Rail | **Estimation wizard** | `ListTree` | A short branching list with connected steps. | Guided discovery, scope options, alternatives and revision comparison. |
| 3 · Rail | **Estimates** | `Calculator` | A rounded rectangular calculator with display and keypad. | Estimate records and their cost bases. |
| 4 · Rail | **Specialist configurations** | `SlidersHorizontal` | Three horizontal control tracks with offset handles. | Screen Systems and other configured technical estimating workbenches. |
| 5 · Rail | **Supplier pricing** | `Tags` | Two overlapping price tags, each with a small fixing hole. | Supplier price sources, price books and cost evidence. |
| 6 · Rail | **Quotations** | `FileText` | A folded-corner page with evenly spaced text lines. | Quotation preparation, issued revisions and customer-facing scope. |
| 7 · Rail | **Reviews & approvals** | `BadgeCheck` | A compact scalloped approval badge with a central tick. | Estimate review, pricing exceptions and quotation approval queues. |
| Secondary | **Responses & negotiation** | `MessagesSquare` | Two overlapping rectangular speech bubbles. | Customer responses, negotiated changes and outstanding questions. |
| Secondary | **Item resolution** | `PackageSearch` | A package with a small magnifying glass. | Resolve one-off items and confirm product conversion. |
| Secondary | **Outcome review** | `ChartColumn` | Three upright bars above a horizontal baseline. | Estimate-to-actual comparisons with explicit comparison bases. |
| Secondary | **Reference cases** | `LibraryBig` | A small group of books with one leaning volume. | Previous cases, calibration proposals and estimating reference evidence. |
| Secondary | **Products** | `Package` | A simple cube with a lid seam. | The same product catalogue used by Sales and Supply Chain. |
| Context | **Screen calculator** | `Blinds` | A rectangular screen with horizontal slats and a short hanging cord. | The greenhouse screen tool within Specialist configurations. |
| Context | **Priva fertigation scoping** | `Droplets` | Two clean water-drop outlines. | Water and dosing scope within Specialist configurations. |

The Estimation wizard deserves a permanent direct shortcut because it is a core PPO workflow. Use a structured branching-list symbol, which communicates guided scope decisions. Specialist configurations contains Screen Systems, greenhouse/screen calculations and relevant future climate, water, lighting or automation workbenches. A leaf or supplier logo would not identify this general function reliably. Quotation approval must remain distinct from customer acceptance.

## 3. Engineering & Design Control

Technical definition, review and release.

| Order / placement | Navigation label | Icon reference | What it should look like | Purpose |
|---|---|---|---|---|
| 1 · Rail | **Engineering workload** | `ListTodo` | A vertical list combining tick boxes and short lines. | Engineering packages, assigned deliverables and due work. |
| 2 · Rail | **Design basis & interfaces** | `Network` | One central node linked to several smaller nodes. | Design inputs, system boundaries and interface responsibilities. |
| 3 · Rail | **Drawings** | `Ruler` | A diagonal straight ruler with a few measurement ticks. | Drawing and controlled technical-document registers. |
| 4 · Rail | **Materials & substitutions** | `Layers` | Three clearly separated stacked sheets. | Released material lists, item mapping and substitution review. |
| 5 · Rail | **Change review** | `GitPullRequest` | Two paths with circular endpoints and a joining arrow. | Engineering changes and their technical impact. |
| 6 · Rail | **Technical reviews** | `BadgeCheck` | A compact scalloped approval badge with a central tick. | Technical review, approval, release and transmittal preparation. |
| 7 · Rail | **Commissioning & as-built** | `Gauge` | A semicircular dial with a single pointer. | Commissioning criteria, results, configuration and as-built handover. |
| Secondary | **Technical queries** | `MessagesSquare` | Two overlapping speech bubbles. | Technical questions and supplier submittals. |
| Secondary | **Site surveys** | `ScanSearch` | A four-corner scanning frame with a magnifying glass. | As-found observations, measurements and survey evidence. |
| Secondary | **Equipment** | `Component` | Four diamond-shaped blocks grouped around a centre. | Installed assemblies and equipment context, including machinery and controls. |
| Secondary | **Documents** | `Files` | Two overlapping folded-corner pages. | The shared document register and exact revisions. |
| Context | **Configuration & I/O** | `CircuitBoard` | A rectangular board with connection tracks and small terminals. | Controller configuration and proposed I/O-register access from equipment context. |
| Context | **Sensors & monitoring** | `RadioTower` | A mast with balanced radio-wave arcs. | Sensor groups and monitoring context; wired/wireless is a record attribute. |

The branching Change review symbol represents controlled technical changes, not a developer-only Git screen. Pair it with a label. Commissioning, technical review and site quality remain different destinations. I/O and sensor registers are proposed contextual extensions: their icons do not imply that an operational register or live controller interface already exists.

## 4. Projects & Commercial Delivery

Programme, readiness, changes and acceptance.

| Order / placement | Navigation label | Icon reference | What it should look like | Purpose |
|---|---|---|---|---|
| 1 · Rail | **Projects** | `FolderKanban` | A project folder containing three short vertical work columns. | Project register, portfolio and project overview. |
| 2 · Rail | **Programme** | `ChartNoAxesGantt` | Three staggered horizontal task bars. | Project timelines, dependencies, baselines and forecasts. |
| 3 · Rail | **Delivery readiness** | `ListChecks` | Short checklist rows with clear ticks. | Prerequisites, customer readiness, material constraints and change impact. |
| 4 · Rail | **Risks & issues** | `TriangleAlert` | An outlined triangle with a central exclamation mark. | Risks, assumptions, issues, dependencies and project decisions. |
| 5 · Rail | **Variations & obligations** | `FileDiff` | A folded-corner page containing plus and minus marks. | Contract obligations, notices and proposed commercial changes. |
| 6 · Rail | **Site assurance** | `ShieldCheck` | A simple shield containing a tick. | Inspections, defects, retests and site-quality evidence. |
| 7 · Rail | **Acceptance & closeout** | `Flag` | One flag on a straight pole. | Staged acceptance, outstanding obligations and closeout. |
| Secondary | **Project receiving** | `Inbox` | An open in-tray with a central notch. | Receiving and reviewing an accepted Sales handover. |
| Secondary | **Subcontract packages** | `HardHat` | A hard hat with a clear brim and centre ridge. | Subcontractor and specialist work packages. |
| Secondary | **Stakeholder updates** | `Send` | A clean paper-plane outline. | Preparation and controlled publication of project updates. |
| Secondary | **Resources** | `UsersRound` | Two rounded heads and shoulders. | People, resource demand and capacity; confirmed visits use the shared planner. |
| Secondary | **Project performance** | `ChartColumn` | Three upright bars on one baseline. | Project financial performance and delivery measures. |
| Secondary | **Documents** | `Files` | Two overlapping pages with folded corners. | Project-linked controlled documents and issue history. |

Programme uses staggered Gantt bars to distinguish it from the calendar used for Activities and the calendar-range used for Service scheduling. Projects requests resources; Service retains the confirmed visit schedule. Acceptance is an entry point to evidence and outstanding obligations, not a claim that a project is complete.

## 5. Service Operations

Cases, authorised work, scheduling and field delivery.

| Order / placement | Navigation label | Icon reference | What it should look like | Purpose |
|---|---|---|---|---|
| 1 · Rail | **Service requests** | `Headset` | A headset with two ear cups and a short microphone arm. | Case intake, triage and customer communication. |
| 2 · Rail | **Work orders** | `ClipboardPenLine` | A clipboard with a diagonal pen and short writing line. | Authorised scope, work-order status and coordination. |
| 3 · Rail | **Schedule** | `CalendarRange` | A two-ring calendar with a horizontal date-range mark. | Service demand, crew bookings and appointment coordination. |
| 4 · Rail | **Field team** | `UsersRound` | Two rounded heads and shoulders. | Technician availability, competence and field-team coordination. |
| 5 · Rail | **Job packs** | `FolderOpen` | An open folder with a sloping front flap. | Preparation, checking and issue of visit instructions and evidence. |
| 6 · Rail | **Service review** | `FileCheck2` | A folded-corner document with a tick at its side. | Visit review, controlled reports and customer-response follow-through. |
| 7 · Rail | **Equipment** | `Component` | Four diamond-shaped blocks grouped around a centre. | The shared installed base and equipment service history. |
| Secondary | **My jobs** | `Wrench` | A single diagonal open-ended spanner. | Assigned technician visits and field execution; promote for technician roles. |
| Secondary | **Maintenance** | `CalendarClock` | A calendar with a small clock in one corner. | Maintenance plans, due occurrences and renewal planning. |
| Secondary | **Service agreements** | `Handshake` | Two hands meeting with restrained sleeve outlines. | Agreements, coverage and entitlement assessment. |
| Secondary | **Warranty** | `ShieldQuestionMark` | A shield containing a question mark. | Warranty investigation and customer resolution; the symbol does not imply accepted cover. |
| Secondary | **Remote support** | `MonitorCog` | A monitor with a small settings cog. | Remote diagnosis, OEM escalation and supporting evidence. |
| Secondary | **Findings & follow-up** | `ListTodo` | A vertical list with tick boxes and short lines. | Unresolved findings and accountable follow-up work. |
| Context | **Offline work** | `CloudDownload` | A cloud with a downward arrow. | Downloads, unsent evidence and recovery in the field workspace. |
| Context | **Site access** | `DoorOpen` | An open door in a simple frame. | Access, inductions, biosecurity and crop-sensitive work restrictions. |

This default set serves service coordinators. For technicians, promote My jobs into the first department slot and move lower-use coordination destinations into More. Make Site access, Knowledge and Offline work easy to reach from the selected job. Field execution, coordinator review and customer response remain distinct states.

## 6. Supply Chain Management

Demand, purchasing, stock and fulfilment.

| Order / placement | Navigation label | Icon reference | What it should look like | Purpose |
|---|---|---|---|---|
| 1 · Rail | **Material demand** | `ListOrdered` | Three numbered rows with short horizontal lines. | Job demand, readiness and material requirements. |
| 2 · Rail | **Purchasing** | `ShoppingCart` | A shopping trolley with two round wheels. | Purchase coordination and supplier commitments. |
| 3 · Rail | **Inbound shipments** | `Container` | A long rectangular freight container with vertical ribs. | Inbound consignments, arrival dates and line allocations. |
| 4 · Rail | **Receiving** | `PackageCheck` | A package with a small tick. | Receipt, inspection and quarantine review. |
| 5 · Rail | **Stock & reservations** | `Warehouse` | A broad warehouse outline with a large roller door. | Available stock, reservations and warehouse context. |
| 6 · Rail | **Dispatch & delivery** | `Truck` | A side-view delivery truck with two clear wheels. | Picking, dispatch, customer delivery and proof of delivery. |
| 7 · Rail | **Returns & claims** | `PackageX` | A package with a small cross. | Returns, supplier claims and credit follow-through. |
| Secondary | **Suppliers** | `Factory` | A factory silhouette drawn in outline with a stepped roof. | Supplier records and purchasing relationships. |
| Secondary | **Products** | `Package` | An outlined cube with a lid seam. | The shared product catalogue, compatibility and lifecycle. |
| Secondary | **Supplier pricing** | `Tags` | Two overlapping price tags. | Price books and supplier source maintenance. |
| Secondary | **Service stock custody** | `ArrowLeftRight` | Two straight horizontal arrows pointing in opposite directions. | Warehouse, technician, van and job stock movements and reconciliation. |
| Secondary | **Material changes** | `GitPullRequest` | Two paths with circular endpoints and a joining arrow. | Material-change impact and linked engineering review. |
| Secondary | **Catalogue governance** | `PackageSearch` | A package and magnifying glass. | Product authoring, publication, imports and exception review. |

Use separate shapes for a catalogue product, an inbound container, a receiving check, a warehouse and an outbound truck. This is especially useful when purchasing, receiving and dispatch are open at the same time. Catalogue publication, inventory custody and ERP transactions remain separate operations.

## 7. Finance & Commercial Controls

Operational handoffs, visibility and reconciliation.

| Order / placement | Navigation label | Icon reference | What it should look like | Purpose |
|---|---|---|---|---|
| 1 · Rail | **Finance handoffs** | `Inbox` | An open in-tray with a shallow central notch. | Work submitted to Finance, readiness and handoff follow-through. |
| 2 · Rail | **Customer accounts** | `BookUser` | An account book with a small person outline on its cover. | Account context, applications and customer-account exceptions. |
| 3 · Rail | **Project performance** | `ChartColumn` | Three vertical bars above a baseline. | Project financial performance on defined, sourced measures. |
| 4 · Rail | **Claims & obligations** | `ReceiptText` | A receipt with a serrated lower edge and short text lines. | Milestone claims and commercial obligations. |
| 5 · Rail | **Cash outlook** | `Wallet` | A simple wallet with a small closing flap. | Cash timing and commercial outlook. |
| 6 · Rail | **Reconciliation** | `Scale` | A balanced beam with two clearly separated pans. | Compare operational records, source measures and ERP outcomes. |
| 7 · Rail | **Exceptions** | `CircleAlert` | An outlined circle containing an exclamation mark. | Owned financial exceptions and uncertain outcomes. |
| Secondary | **Credits & adjustments** | `Undo2` | A return arrow bending back to the left. | Review supporting evidence for credits and corrections. |
| Secondary | **Measure definitions** | `BookOpenCheck` | An open book with a small tick. | Approved definitions and the basis of financial measures. |
| Secondary | **Finance insights** | `ChartNoAxesCombined` | An upward line across a small bar group. | Financial reporting and source-trust review. |
| Secondary | **ERP handoff status** | `ArrowRightLeft` | Two arrows indicating exchange in opposite directions. | Adapter outcome, original-operation references and reconciliation. |
| Secondary | **Documents** | `Files` | Two overlapping folded-corner pages. | Evidence supporting handoffs, claims and reconciliation. |

These entries describe operational Finance coordination and visibility. MYOB Acumatica remains the intended ERP authority. A tick, receipt or handoff icon does not mean that an invoice has been posted, a payment received or an external transaction reconciled. The current shared recovery page must not be relabelled as a Finance-only register without an explicit scoped landing view.

## Shared records and supporting functions

Use the following mappings everywhere they appear. Most belong in More, the department secondary menu, or a contextual record menu; the department tables identify the shared shortcuts worth pinning by default.

| Order / placement | Navigation label | Icon reference | What it should look like | Purpose |
|---|---|---|---|---|
| Shared | **My Work** | `ClipboardList` | A clipboard with three short task lines. | First shortcut in the six non-Sales department rails; available through More in Sales. Personal actions, reviews and waiting work. |
| Fixed | **More** | `Ellipsis` | Three equally spaced horizontal dots. | The fixed bottom control for all workspaces, secondary pages and support. |
| Shared | **Contacts** | `IdCard` | A horizontal business card with a person on the left and short detail lines on the right. | The common hub for People and Organisations. |
| Shared | **People** | `UserRound` | A single rounded head and shoulders. | Individual people, contact details and organisation relationships within Contacts. |
| Shared | **Organisations** | `Building2` | Two building outlines with small windows. | The shared entity directory, with customer, supplier and other relationship roles. Customer-specific workflows retain their scope. |
| Shared | **Tasks** | `ClipboardCheck` | A clipboard with one central tick. | Assigned actions and completion; use the same symbol wherever this destination appears. |
| Shared | **Sites** | `MapPin` | A teardrop location pin with a circular centre. | An addressed customer location. |
| Shared | **Facilities & growing areas** | `LandPlot` | A perspective land parcel with short boundary-marker lines. | Greenhouses, tunnels, rooms, sheds, irrigation blocks and fields within a site. |
| Shared | **Equipment** | `Component` | Four diamond-shaped blocks grouped around a centre. | Installed assets and assemblies; usable for machinery as well as controls. |
| Shared | **Products** | `Package` | A cube with a simple lid seam. | Catalogue items; distinct from installed equipment and physical stock. |
| Shared | **Documents** | `Files` | Two overlapping pages with folded corners. | The document register, exact revisions and linked files. |
| Shared | **Knowledge** | `BookOpen` | An open book with a visible centre fold. | Articles, procedures, learning intake and knowledge review. |
| Shared | **Approvals & handovers** | `BadgeCheck` | A compact scalloped approval badge with a central tick. | Cross-module review tasks leading to their domain-owned review screens. |
| Shared | **Reports & insights** | `ChartNoAxesCombined` | A line above a small group of bars. | Management reporting and department performance. |
| Shared | **Quality & site assurance** | `ShieldCheck` | A shield with a central tick. | Inspection, defects, hazards, corrective action and retest evidence. |
| Shared | **Data quality** | `DatabaseSearch` | A database cylinder with a small magnifying glass. | Record-quality findings, duplicates and remediation review. |
| Shared | **Users & access** | `ShieldUser` | A shield containing a small person outline. | Users, roles, teams and access review. |
| Shared | **Integrations & recovery** | `PlugZap` | A plug and a small lightning bolt. | Connection health, mapping, uncertain outcomes and recovery. |
| Shared | **Settings** | `Settings` | A cog with a circular centre. | Shared business and application configuration. |
| Context | **History & audit** | `History` | A clock surrounded by an anticlockwise arrow. | Record changes and attributable audit evidence. |
| Context | **Templates** | `PanelsTopLeft` | A rectangular page frame divided into panels. | Document and form templates, reached through Documents. |
| Context | **Issue & distribution** | `Send` | A clean paper-plane outline. | Controlled output preparation, issue and distribution. |

To keep the new Tasks symbol distinct, this revision proposes `BadgeCheck` for Reviews & approvals, Technical reviews and the shared Approvals & handovers entry. This is a shared icon consistency adjustment; the other departments' order and functional scope are unchanged. The badge identifies a review destination, not the approval status of every record. Supplier and Customer views may filter the same Organisation records while retaining their domain-specific labels.

The logo already provides Home, so a second house icon is unnecessary by default. Keep global Search, Quick add, Page guide, Quick Help, Notifications and the account avatar in their existing header positions. Their established symbols remain magnifying glass, plus, information circle, question-mark circle, bell and the user's avatar respectively. Separate page guidance from general help.

Documents should contain controlled issue/distribution and templates. Knowledge should contain article reading, authoring, review and learning intake. Equipment should contain service history, installed configuration, backups, bulletins and calibration evidence. These remain useful pages without a separate rail entry for each tab or form.

## Department identities for the workspace selector

These identify the department in More or the workspace selector. They are not seven additional shortcuts to show above the active department's rail.

| Department | Identity icon | Intended appearance |
|---|---|---|
| Sales | `BriefcaseBusiness` | A commercial briefcase with a handle and central fastening. |
| Estimating & Quotation | `Calculator` | A calculator with a display and compact keypad. |
| Engineering & Design Control | `DraftingCompass` | An open drawing compass with two clean legs. |
| Projects & Commercial Delivery | `FolderKanban` | A project folder containing work columns. |
| Service Operations | `Wrench` | A single diagonal spanner. |
| Supply Chain Management | `Package` | An outlined shipping cube. |
| Finance & Commercial Controls | `ReceiptText` | A receipt with text lines and a serrated edge. |

## Important distinctions to preserve

| Related concepts | Visual distinction |
|---|---|
| Contacts hub / Person / Organisation / Site / Facility | Business card / person / building / location pin / land parcel. |
| Product / Installed equipment / Stock | Package / grouped component blocks / warehouse. |
| My Work / Tasks / Work order / Review / Service report | Clipboard list / clipboard with tick / clipboard with pen / approval badge / document with tick. |
| Pulse / Insights | Heart with pulse line for daily attention / line chart for performance analysis. |
| Leads / Deals | Crosshair for qualification / dollar sign in a circle for commercial deals. |
| Tasks / Activities | Clipboard with tick for actions to complete / date-grid calendar for calls, meetings and visits. |
| Activities / Service schedule / Project programme / Maintenance | Date-grid calendar / date-range calendar / Gantt bars / calendar with clock. |
| Estimate / Quotation / Supplier pricing | Calculator / text document / price tags. |
| Site assurance / Warranty enquiry | Shield with tick / shield with question mark. |
| Drawing / General documents | Ruler / overlapping pages. |
| Risk or issue / Financial exception | Warning triangle / alert circle. |

Review icons together at 25 px, not only as large catalogue samples. If neighbouring icons appear too similar, simplify the metaphors before adding further tiny decorations. Repeated action symbols such as check, plus or arrow convey a category, not the current status of every record inside it.

## Horticulture and controls-specific guidance

Facilities covers both structures and outdoor growing areas, so the land-parcel symbol is a better general entry point than a greenhouse-only silhouette. A greenhouse, tunnel, propagation house, pack room, irrigation block/field and irrigation shed can have their own labelled type illustrations within their records.

Keep specialist domain symbols within the relevant workbench: `Blinds` for screen configurations; `Droplets` for water/fertigation; `Sun` for lighting; `Thermometer` for climate; `RadioTower` for sensing/monitoring; `CircuitBoard` for configuration and I/O. These are suggested category illustrations, not newly authorised modules. Wired/wireless GroScales, base-station requirements, controller compatibility, sensor type and I/O capacity remain explicit structured data and validation; an icon cannot communicate those technical facts reliably.

## What can be connected to existing routes

The table below records source evidence only. A route's presence does not establish completeness, authorised availability for every user, desktop/mobile acceptance or current Azure deployment.

| Recommended destination | Observed native route | Landing-page treatment |
|---|---|---|
| My Work | `/work` | Existing register/overview entry; in More for Sales and first in the other department rails. |
| Pulse | No dedicated Sales Pulse landing verified | Define the Sales overview and its filters. Existing My Work is a possible shared work source, not evidence that `/work` already provides the requested Pulse page. |
| Deals | `/sales/opportunities` | Existing Sales entry, already labelled Deals in the follow-up navigation. Preserve the URL and internal identifiers. |
| Leads | `/sales/leads` | Existing Sales entry. |
| Activities | `/calendar` | Existing calendar entry; retain the user's local date behaviour and define the Sales interactions view. |
| Tasks | `/work/actions` | Existing My Work actions entry. Define the Sales-scoped task list and its relationship to Activities before treating it as the requested dedicated Tasks experience. |
| Contacts hub | No combined People-and-Organisations landing verified | Define the two views, remembered permitted view and record navigation. Existing People and Customers pages are inputs, not proof of a complete hub. |
| People / Organisations / Sites | `/people`, `/customers`, `/sites` | Existing people, customer and site entries. Reconcile the wider Organisations scope and relationship roles before relabelling the customer directory. Preserve linked records and permissions. |
| Facilities / Equipment | `/facilities`, `/equipment` | Existing shared entries. |
| Sales Inbox | `/email` | Existing email module; retain mailbox permissions and provider connection handling. |
| Products / Insights | No independent Sales landing verified in this inspection | Confirm a permitted catalogue entry and a dedicated Sales analysis view before wiring these primary shortcuts. |
| Estimates / Wizard / Configurations | `/estimating`, `/estimating/discovery`, `/estimating/configurations` | Existing entries; existing-read permissions and scope still govern. |
| Quotation | `/estimating/quotes/[id]` | Record route exists. A top-level Quotations rail shortcut needs a permitted register/chooser or an explicitly agreed existing landing view. |
| Engineering / Materials / Changes | `/engineering`, `/engineering/materials`, `/engineering/changes` | Existing entries; package-specific child routes retain context. |
| Commissioning | `/engineering/commissioning` | Existing register and view routes. |
| Projects | `/projects` | Existing project entry. |
| Programme | `/projects` contains the current project/Gantt workspace | Define a distinct, restorable programme-view destination before displaying two rail links to the same undifferentiated page. Do not invent a query parameter. |
| Acceptance & closeout | `/projects/acceptance` | Existing module entry. |
| Service requests / Work orders | `/service/tickets`, `/service/work-orders` | Existing entries. |
| Schedule / Field team | `/schedule`, `/service/technicians` | Existing entries. |
| Job packs / Service review / My jobs | `/service/packs`, `/service/reports`, `/my-jobs` | Existing entries. |
| Offline work | `/offline/index.html` | Existing dedicated field workspace; retain its environment restrictions and offline authority limits. |
| Finance handoffs | `/finance/handoffs` | Existing Finance entry. |
| Customer account | `/customers/[id]/account` | Record route exists; an Accounts shortcut needs a scoped list or a clear account-selection entry. |
| Exceptions | `/admin` | Shared operational recovery exists. A finance-specific entry needs permission and scope reconciliation. |
| Documents | `/documents/[id]` | Exact-document viewer exists. A general document-register rail link needs a real index, not an arbitrary document. |
| Reviews & handovers | `/work/reviews` | Existing My Work view; broader cross-module review design is separate. |
| Other recommended entries | No independent native landing route verified in this inspection | Add icons to the design register now; introduce live navigation alongside the appropriate working destination. |

## Recommended bounded implementation

1. Issue a new shell/navigation baseline that adds department shortcuts to r17. Record the exact nine-item Sales order, My Work in Sales More, My Work first in the other six departments, and More fixed at the bottom throughout. Retain the existing shell dimensions and review the selected treatment against the r22 selection direction.
2. Create one shared semantic icon map and one department navigation configuration. Provide paired outline and active drawings, including the nine Sales variants above. Use the business-card Contacts hub, People and Organisations distinctions, and the proposed review badge to keep Tasks visually distinct. Avoid copying SVG definitions into each page.
3. Connect existing permitted routes and resolve the remaining landing views. Pulse, the Sales Tasks scope, Contacts hub, Products and Insights need explicit destination contracts. Quotations, Customer accounts, Programme, Documents and Finance exceptions retain their previously identified landing requirements. Do not create placeholder links or invent route parameters to imply readiness.
4. Apply the visible Deals and Sales Inbox labels consistently. Design the Organisations directory and relationship roles while preserving existing identifiers, ERP references, permissions and customer-specific functions. Reuse the underlying work records across Pulse, Tasks and Activities.
5. Use the actual route to identify the destination; preserve the chosen department on shared pages. Opening Contacts while working in Engineering should not reset the rail to Sales. Define restorable scope or view state where multiple destinations share an existing route. Explicit department switching should remain discoverable.
6. Keep child-page matching specific. `/projects/acceptance` selects Acceptance rather than only Projects; engineering materials, changes and commissioning select their own entries. Sales child pages inherit the correct destination as described above. Exactly one destination is current; an open More menu is a separate state.
7. Verify all nine Sales shortcuts in order, selected glyph legibility, actual 25 px appearance, normal and short desktop heights, scrolling, tooltips and separate keyboard focus. Check permission changes, direct links, Back/reload, remembered Contacts view and transitions among shared records. Confirm no duplicate task is created by scheduling or completing work through Pulse. Review the established mobile patterns separately.
8. Record the adopted mappings and actual validation in GitHub through the usual reviewable PR. This document revision makes no application change and claims no build, test, merge or deployment result.

## Sources

The original repository links below remain pinned to the r01 inspection. The two Sales follow-up links pin the subsequent navigation and shell check. The Sales refinement brief supplies the requested ordering and visual direction. Later implementation should recheck the active branch and affected files.

- [Repository guidance](https://github.com/deanrfiedler-gif/powerplants-one/blob/ab96e2b83598ba8f80688d2d68e4907a21453793/AGENTS.md)
- [Project overview](https://github.com/deanrfiedler-gif/powerplants-one/blob/ab96e2b83598ba8f80688d2d68e4907a21453793/README.md)
- [Current status at inspection](https://github.com/deanrfiedler-gif/powerplants-one/blob/ab96e2b83598ba8f80688d2d68e4907a21453793/docs/STATUS.md)
- [Seven workspaces, destinations and route matching](https://github.com/deanrfiedler-gif/powerplants-one/blob/ab96e2b83598ba8f80688d2d68e4907a21453793/src/shell/navigation.ts)
- [Current desktop rail and More menu](https://github.com/deanrfiedler-gif/powerplants-one/blob/ab96e2b83598ba8f80688d2d68e4907a21453793/src/components/product-navigation.tsx)
- [Shell icon geometry](https://github.com/deanrfiedler-gif/powerplants-one/blob/ab96e2b83598ba8f80688d2d68e4907a21453793/src/components/shell-icon.tsx)
- [Shared product icons](https://github.com/deanrfiedler-gif/powerplants-one/blob/ab96e2b83598ba8f80688d2d68e4907a21453793/src/components/product-icons.tsx)
- [Rail dimensions and current colours](https://github.com/deanrfiedler-gif/powerplants-one/blob/ab96e2b83598ba8f80688d2d68e4907a21453793/src/app/desktop-shell.css)
- [Module-workspace declarations](https://github.com/deanrfiedler-gif/powerplants-one/blob/ab96e2b83598ba8f80688d2d68e4907a21453793/src/shell/module-workspaces.ts)
- [Application Shell r17 integration decision](https://github.com/deanrfiedler-gif/powerplants-one/blob/ab96e2b83598ba8f80688d2d68e4907a21453793/docs/decisions/application-shell-integration.md)
- [Working master blueprint and functional boundaries](https://github.com/deanrfiedler-gif/powerplants-one/blob/ab96e2b83598ba8f80688d2d68e4907a21453793/docs/blueprints/BP-01-master-blueprint.md)
- [Retained page-coverage audit r04](https://github.com/deanrfiedler-gif/powerplants-one/blob/ab96e2b83598ba8f80688d2d68e4907a21453793/docs/reference/ui/module-page-register/PPO-HTML-Page-Coverage-Audit-r04.md)
- [Current runtime dependencies](https://github.com/deanrfiedler-gif/powerplants-one/blob/ab96e2b83598ba8f80688d2d68e4907a21453793/package.json)
- [Priva fertigation scoping design PR #275](https://github.com/deanrfiedler-gif/powerplants-one/pull/275) — observed as open during the original r01 inspection; this is historical evidence, not a current status claim.
- [Sales follow-up: maintained labels and destinations](https://github.com/deanrfiedler-gif/powerplants-one/blob/0c95c5af776c97374997623bd1070d9de480cf82/src/shell/navigation.ts) — Deals label, existing routes and shared-work navigation.
- [Sales follow-up: desktop navigation](https://github.com/deanrfiedler-gif/powerplants-one/blob/0c95c5af776c97374997623bd1070d9de480cf82/src/components/product-navigation.tsx) — the new department shortcuts remain a design change to implement.
- [Lucide icon catalogue](https://lucide.dev/icons/) — reference family and configurable size/stroke.
- [Lucide accessibility guidance](https://lucide.dev/how-to/accessibility) — labels, target size, consistent meaning and accessible controls.
- [Heart pulse](https://lucide.dev/icons/heart-pulse), [Crosshair](https://lucide.dev/icons/crosshair) and [ID card](https://lucide.dev/icons/id-card) — outline shape references for Pulse, Leads and Contacts; not a claim that matching filled assets are supplied.
- [Pipedrive Pulse](https://support.pipedrive.com/en/article/pulse-feed), [Activities](https://support.pipedrive.com/en/article/activities) and [People and organisations](https://support.pipedrive.com/en/article/contacts-people-and-organizations) — product references informing the discussion, not PPO implementation requirements or a substitute for the unavailable screenshot.

## Revision record

**r01 — 22 September 2026:** First proposed department icon and placement register. Prepared from the GitHub source inspection above. No application changes. Icon-reference availability is checked separately from owner visual acceptance.

**r02 — 22 September 2026:** Incorporated the Sales refinement brief: Pulse, Leads, Deals, Activities, Tasks, Sales Inbox, Contacts, Products and Insights in the specified order; bottom More in every department; purpose-designed filled active icons and separate focus/menu states. Recorded Deals naming, the People/Organisations hub and relationship roles, Pulse/Activities/Tasks/Insights boundaries, My Work in Sales More, and the corresponding shared rules and route-readiness notes. Proposed an approval badge to distinguish reviews from Tasks. Retained the other six department sets and original source history. Document update only; application implementation and visual acceptance remain pending.
