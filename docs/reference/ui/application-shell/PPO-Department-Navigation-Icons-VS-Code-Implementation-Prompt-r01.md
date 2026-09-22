---
document_id: PPO-NAV-ICONS-VSCODE-PROMPT
title: Department navigation icons — VS Code implementation prompt
revision: r01
date: 2026-09-22
prepared_for: Dean Fiedler
repository: deanrfiedler-gif/powerplants-one
source_register: PPO-Department-Navigation-Icon-Register-r02.md
scope: Shared application navigation, semantic icons, active states and existing destination integration
---

# Powerplants One — department navigation icons

## How to use this document

Open the `powerplants-one` repository in Visual Studio Code. Attach this Markdown document to a new coding-agent chat and ask the agent to execute it. The department mappings, icon descriptions and route notes are embedded below, so the prompt can be used on its own. The companion `PPO-Department-Navigation-Icon-Register-r02.md` can also be attached for the full design rationale. If you have the accepted PPO theme board available, attach it as a visual reference; its absence should not prevent implementation against the maintained application styles.

Everything from “Implementation instruction” onwards is addressed to the coding agent. This document authorises the implementation work described below. Its creation is not evidence that application code has already changed.

## Implementation instruction

You are working as the frontend engineer responsible for Powerplants One's shared application shell. Implement the department-specific navigation icons defined in this document in the actual Next.js/TypeScript application, using its existing components, routing, permissions and design system.

Carry the work through discovery, code changes, focused validation and a reviewable handover. Start with a brief implementation plan and then execute it. Do not stop after an audit, a proposal, a sample component or a standalone HTML mockup. Make routine implementation decisions from repository evidence and continue without repeatedly asking for confirmation. If a real dependency blocks one destination, complete the independent navigation work and report that precise dependency.

The outcome should be a coherent department rail on every page that uses the shared desktop shell. Each department has its own ordered shortcuts. Shared destinations use consistent symbols. The current destination has a recognisable filled or selectively filled icon. More remains fixed at the bottom in every department.

### 1. Establish the current implementation before editing

Read `AGENTS.md`, any applicable nested instructions, `README.md`, `docs/STATUS.md`, the package scripts and the maintained shell/navigation decisions. Check the current branch, commit and working tree. Preserve the user's uncommitted changes and concurrent work; use a focused branch or isolated worktree where appropriate under repository practice. Do not reset, overwrite or stash unrelated changes merely to make the task easier.

Inspect the actual current implementations of the following known files, resolving renamed or moved files with `rg` where necessary:

| Known source location | What to establish |
|---|---|
| `src/shell/navigation.ts` | Destination identifiers, labels, paths, route matching, permissions and shared navigation data. |
| `src/components/product-navigation.tsx` | Desktop rail, logo, More, expanded navigation and department selection. |
| `src/components/shell-icon.tsx` | Existing semantic icon API, SVG geometry and callers. |
| `src/components/product-icons.tsx` | Other shared icon definitions and opportunities to reuse the same geometry. |
| `src/app/desktop-shell.css` | Actual rail dimensions, spacing, colours, hover/focus rules and responsive layout. |
| `src/shell/module-workspaces.ts` | Department identity, workspace context and default landing behaviour. |
| `docs/decisions/application-shell-integration.md` | r17 baseline and later amendments affecting the shell. |
| Current app layouts, route files and navigation tests | Which pages use the shell, special layouts, authenticated access and regression coverage. |
| Maintained theme assets and accepted Sales board implementation | The visual baseline to preserve, including panel boundaries and toolbar styling. |

The design register's original inspection was at `ab96e2b83598ba8f80688d2d68e4907a21453793`; its Sales follow-up was at `0c95c5af776c97374997623bd1070d9de480cf82`. These are historical evidence, not instructions to check out either commit. Work from the user's current branch and reconcile any newer changes.

The older r17 decision removed department shortcuts. This user request deliberately introduces the next navigation revision and supersedes that one design choice. Preserve the other accepted shell decisions. Record the amendment through the repository's normal documentation process; do not treat the old no-shortcuts wording as a reason to leave this task unfinished.

Inventory the seven actual workspaces, current routes, existing icon assets, permission handling and desktop/mobile shell variants. Do not infer runtime page readiness from a design brief, HTML prototype or page register alone.

### 2. Required scope and completion rules

Implement all of the following:

1. A shared semantic icon system with outline and active variants for every enabled rail destination.
2. Data-driven rail configurations for all seven departments using the exact orders in Appendix A.
3. Consistent icon assignments in related More entries and existing secondary/context navigation, using Appendix B. Context entries remain contextual; they do not automatically become global shortcuts.
4. Active-route selection, department retention on shared pages, and working bottom More behaviour.
5. The Sales naming and Contacts grouping requirements below wherever the existing application can support them faithfully.
6. Keyboard, tooltip, focus, permission and short-height behaviour.
7. Focused functional and visual validation, plus an honest destination coverage record.

The implementation includes small landing adapters, view selectors or overview compositions that expose existing functional modules, data and permission rules. It does not require inventing unbuilt business modules, a new task store, an email service, an analytics engine or a new organisation schema simply to make every icon clickable.

Classify each proposed destination using the current checkout:

| Readiness | Required action |
|---|---|
| Working destination exists | Connect the real route and its permitted landing view. |
| Existing capability needs a small landing/view adapter | Implement the adapter, its route/view contract, navigation behaviour and relevant checks within this change. Reuse existing data and services. |
| Only a record route exists | Find an existing index/chooser or implement a small one using existing authorised list capabilities. Never select an arbitrary record as the rail landing. |
| Necessary business capability is absent | Complete the icon and configuration definition, mark the destination unavailable in the implementation coverage record, and omit its live link. Keep working on the other destinations. |
| Current user lacks permission | Apply the existing access policy, ordinarily omitting the destination. Do not expose restricted records or counts through tooltips, badges or menus. |

Keep the full intended ordering in the canonical configuration. Readiness and permission filtering must preserve the relative order of remaining items. Do not insert substitute shortcuts, move Sales My Work back to the top, or use arbitrary dashboard links to fill gaps. A design/test fixture may show the complete set using an explicit synthetic readiness context; that must not leak fake links into the running app.

Do not render `href="#"`, dead buttons, unimplemented URLs or “coming soon” pages as successful navigation. A legitimate email connection screen or a real empty register is a working destination; a placeholder pretending the feature exists is not.

“Complete Sales rail” means all nine requested destinations have working, authorised landing experiences. If any remain unavailable, describe the delivered state as the shared icon/navigation rollout with named destination dependencies, and state exactly what is missing. Do not claim that nine assets or nine configuration entries alone prove nine completed pages.

### 3. Department ordering and placement

Use the full department names in documentation and their maintained short names where navigation space requires it. Do not create extra departments for People & Culture, QHSE, Digital Systems or executive reporting.

Sales has these nine page shortcuts immediately below the logo, in this exact order:

1. Pulse
2. Leads
3. Deals
4. Activities
5. Tasks
6. Sales Inbox
7. Contacts
8. Products
9. Insights

Sales My Work belongs in More. Do not add separate Customers or Organisations icons to the Sales rail. Contacts is the entry point for People and Organisations. Preserve the product logo as the Home link.

For the other six departments, My Work appears first, followed by the seven departmental entries in Appendix A. More is the fixed bottom control in all seven. The full normal-height target is nine Sales shortcuts plus More, and eight page shortcuts plus More in each other department.

Retain any already-supported Service technician role configuration. The register allows My jobs to become the first department-specific shortcut for technicians while lower-use coordinator links move into More. This does not replace My Work's position in non-Sales departments or permit arbitrary Sales reordering. Do not invent a new role system for this task.

On shared pages, display the selected department's rail. Do not render a separate independent rail inside each module. Do not place department identity icons above the page shortcuts; those symbols belong in department selection.

### 4. Icon design and active state

Continue PPO's local SVG approach unless inspection shows an established, compatible shared abstraction already in use. Lucide names in the appendices identify the intended shapes; they are not mandatory package imports or domain identifiers. Check availability in the pinned asset source before use. Preserve attribution for copied artwork. Do not install a second icon library solely for this change when the required shapes can fit the maintained local component.

Use one source of icon geometry across the rail and related navigation. If two existing icon components must remain for compatibility, make them share the relevant definitions rather than maintaining divergent drawings. Do not alter an existing globally reused glyph identifier to a different meaning without checking its callers. Add specific semantic keys where different destinations currently share an unsuitable symbol.

Provide a typed interface for state selection consistent with the codebase, such as an `active` or `variant` input. Default behaviour must preserve existing callers. Use explicit icon mappings with exhaustive handling; avoid deriving asset names from labels or silently substituting a generic square for a missing icon.

| Property | Required direction |
|---|---|
| SVG geometry | 24 × 24 viewBox; 1.7-unit outline stroke with rounded caps/joins, unless a newer accepted local baseline is evidenced. |
| Rendered size | 25 px rail icons, optically balanced at actual size. |
| Rail and logo | Preserve the known 76 px rail and 54 px logo, reconciling any newer accepted baseline explicitly. |
| Targets | 48 × 48 px targets, with at least 44 × 44 px effective pointer area. |
| Resting state | Clear white or high-contrast neutral outline on navy `#242a37`. |
| Hover | Existing lighter navy `#343c4c` tile; stable geometry with no layout jump. |
| Active destination | Deliberate filled or selectively filled glyph, dark green `#315e43` on pale green `#f0f6ed`, plus the register's inset edge/shape cue. Reuse tokens rather than scattering literal colours. |
| Focus | Separate visible keyboard focus ring; visible even when the destination is also active. |
| More open | A distinct open-menu treatment. Keep the three dots recognisable and the page's active state intact. |

The active variant is a real drawing change, not only a background colour change. Do not apply blanket `fill="currentColor"` to stroke icons: that can cover internal details. Use intentional closed shapes, selective fill, contrasting strokes or cut-outs. Keep silhouette, alignment and bounding box stable when state changes.

Implement the nine Sales active variants exactly as described in Appendix C. Provide paired variants for every primary icon in Appendix A, even where a landing page is not ready; readiness governs live links, not completeness of the icon catalogue. Apply the same design principles to all other department icons: a filled clipboard retains its lines; a calculator retains its display/keypad; a calendar retains its bindings and dates; a badge retains its tick; a package retains its seams; open line-based symbols use selective fill without becoming blobs. Reuse one state pair whenever the same symbol represents the same destination.

Retain the visual distinctions among Tasks (`ClipboardCheck`), My Work (`ClipboardList`), Work orders (`ClipboardPenLine`), approvals (`BadgeCheck`) and Service review (`FileCheck2`). Implement the register's review-badge adjustment consistently in Estimating, Engineering and shared Approvals & handovers.

Use a simple professional appearance: no emoji, bitmap icons, decorative gradients, novelty illustrations or tiny added symbols. Use actual vector assets rather than generated raster artwork.

### 5. Sales page labels and module boundaries

**Pulse:** The salesperson's landing overview and daily priorities. If a compatible overview already exists, connect it; otherwise compose a bounded Sales view only where the necessary existing data/services support it. Relevant content includes leads awaiting a reply, deals with no next step, overdue tasks/activities, upcoming visits/meetings, quotation follow-up and blocked work. Every card must link to the underlying permitted record. Reuse task/action identity and completion handlers. Do not relabel a generic page Pulse if it does not deliver this experience, and do not fabricate counts. The referenced Pipedrive screenshot was unavailable when the register was prepared; exact screenshot matching is not required.

**Leads:** Use the crosshair. Preserve lead qualification and conversion behaviour. Do not use a funnel for the rail icon.

**Deals:** Use Deals in relevant Sales navigation, page headings, breadcrumbs, accessible names and creation wording such as Add deal. Preserve the dollar-in-circle icon. Preserve `/sales/opportunities`, internal identifiers, database fields and API contracts unless an independently required change is already part of current repository work. Do not carry out a blind global replacement of “opportunity” in technical code or historical documents. Board/List/Forecast, pipeline settings, cards and the accepted Sales board layout must continue working.

**Activities:** Keep the date-grid calendar for calls, meetings, site visits and their outcomes. Confirm how the current calendar represents Sales activities and preserve local date/time behaviour.

**Tasks:** Use the clipboard with a central tick for assigned actions such as preparing a quotation, obtaining a pump curve or confirming a lead time. Reuse the existing action model. A due date or calendar placement must not create a duplicate task. If the dedicated Sales view is missing but the existing action list supports it, implement a real scoped view. A tick in the navigation icon is a category symbol, not a claim that all work is complete.

**Sales Inbox:** Use an envelope and connect the existing email module. Keep mailbox permissions, connected-provider state, connection flow and record links intact. The new label does not establish a shared mailbox or change provider access.

**Contacts:** Use the horizontal business-card icon. Provide People and Organisations views, remembering the last permitted view through the application's established mechanism. A small hub around existing authorised lists is in scope. Keep people, organisations, sites, facilities and equipment relationships intact. A person detail route and an organisation detail route accessed within this destination should both select Contacts in Sales.

Use Organisations for the general entity directory. Customer, Supplier, Prospect, Subcontractor and Partner are relationship roles; the same organisation may have several. Before widening a customer-only register, verify the current data model, APIs and permissions support that scope. Do not claim customer-only data is a complete Organisations directory. If the capability is missing, document the specific model/API dependency rather than creating duplicate entities or silently changing business semantics.

Preserve Customer accounts and customer-specific Finance or service contexts. Supplier views may remain labelled Suppliers. Keep stable IDs, ERP keys and existing deep links; an icon rollout does not authorise data migration or global customer-to-organisation schema replacement.

**Products:** Keep the cube/package and use the permitted shared catalogue. Products, installed Equipment and physical Stock retain different symbols and destinations.

**Insights:** Use the line chart for Sales performance, pipeline, conversion and forecast analysis. Connect an existing compatible analysis view if available. Do not invent KPIs or build a new analytics engine to satisfy the icon. Pulse is daily attention; Insights is performance over time.

### 6. Shared navigation configuration and route matching

Extend the existing navigation model instead of creating an unrelated second menu system. Keep business destination IDs separate from human labels and icon asset names. A destination definition should make its label, semantic icon, department placement, readiness, access rule, landing behaviour and active-match rule explicit using the repository's conventions.

Use one authoritative destination catalogue and ordered department compositions where the current architecture permits. Do not duplicate paths, labels and permission checks across the rail, More and each module. Keep shared entries such as Products, Contacts, Documents, Equipment and My Work consistent.

Reconcile the historical route notes in Appendix D against the current route tree. Establish a small coverage matrix with destination, department, actual route/view, icon, access source, readiness, active parent and validation evidence. It is implementation documentation, not user-facing technical copy.

Route selection must satisfy these rules:

1. Match the actual pathname and supported view state, not a last-clicked icon variable.
2. Prefer specific destinations over broad parents. `/projects/acceptance` selects Acceptance & closeout; `/engineering/materials`, `/engineering/changes` and `/engineering/commissioning` select their corresponding entries.
3. Match child paths using route boundaries. Do not use a loose substring match that confuses similarly named destinations.
4. Deal record pages inherit Deals. Task details inherit Tasks when opened in that destination. People and organisation details inherit Contacts in the Sales workspace. Existing record breadcrumbs and return links keep their context.
5. If two entries share a path, they must open genuinely different, restorable supported views. For example, Projects and Programme cannot be two names for the same undifferentiated `/projects` landing. Implement the view contract on both ends if a bounded adapter is needed; do not append a query parameter that the page ignores.
6. At most one rail destination is current. On a rail-represented page, exactly its corresponding shortcut is current. A More-only page can have no selected primary shortcut; its labelled menu entry and page heading identify the current destination. Do not select an unrelated icon to force a highlight.
7. Opening More does not change the current page or selected icon. Navigating from More then updates the correct destination.
8. Direct links, reload, browser Back/Forward and opening a link in a new tab reproduce the appropriate destination and view. Query/hash changes that are irrelevant to destination identity must not clear selection.
9. For a shared page entered without department context, use the existing valid user preference or a documented, deterministic permitted default. Do not infer Sales merely because the path begins with `/customers` or `/people`.
10. Preserve the chosen department when navigating to shared pages from that workspace. Explicit department switching updates the rail and selects a sensible permitted landing; retain a compatible shared page where the established application behaviour supports it.

Do not introduce hydration flicker or mismatches by reading browser-only preferences during server rendering. Use the existing persistence/state pattern and scope any new preference appropriately to the user. Respect permission changes and logout; stale saved views must not reopen inaccessible destinations.

### 7. Permissions, More and secondary destinations

Use the application's existing server-backed access rules. Hiding an icon is not authorisation; destination loaders and actions retain their checks. Do not expose all pages merely because the repository is a synthetic prototype.

Keep More as three horizontal dots at the rail bottom in every workspace. Preserve existing workspace selection, search/discovery, global tools and support functions. Integrate the new icon assignments without discarding current functional menu items. Avoid duplicate rows for the same destination caused by appending a second catalogue.

Supply the current department's secondary destinations and relevant shared functions through the existing More/secondary patterns. Context-only entries require appropriate record context; do not turn a record-specific action into a context-free global link. Appendix B contains the corresponding icon assignments.

Do not add an extra Home icon when the logo already opens Home. Retain global Search, Quick add, Page guide, Quick Help, Notifications and the account avatar in their existing header positions. Page guide and general help remain separate functions.

Badges are optional and must reuse existing trustworthy actionable counts. Do not add mock counts or perform a new request per icon solely for decoration. The initial rollout can omit badges.

### 8. Layout, responsive behaviour and accessibility

Use the shared shell so all relevant module pages receive the rail without duplicated wrappers. Verify no nested rail, extra outer card, new page gutter or horizontal overflow is introduced. Preserve the accepted Sales board/theme styling and current typography; use existing tokens and Roboto/Verdana conventions where already established. This request does not call for green primary action buttons or toolbar redesign.

Build the rail as a bounded vertical layout with the logo above, a scrolling middle shortcut group, and More below. Keep logo and More accessible when height is constrained. Preserve order and target size. Scroll the focused or newly active item into view only when needed, without unexpectedly moving the main page. Ensure popovers and tooltips are not clipped by the shortcut scroller.

Keep the established mobile navigation, including any Sales Leads-specific baseline. Shared icon definitions and correct active state may flow into existing mobile controls, but do not squeeze the desktop rail onto phones or replace the phone information architecture. Dedicated offline/field layouts retain their existing navigation and operational boundaries. Likewise, standalone tools and public/authentication pages without the shared app shell should not gain a new rail.

Use normal navigation links for destinations and a button for More. Retain appropriate navigation landmarks. Label every icon control with a clear accessible name matching the destination. When the control provides the name, mark the SVG decorative. Tooltips must appear on hover and keyboard focus and must not be the only accessible label. Do not rely solely on the browser `title` attribute.

Set `aria-current="page"` on the selected destination link according to the application's navigation convention. More uses `aria-expanded` and the correct controlled popup relationship. Preserve the existing popup semantics; do not assign ARIA menu roles without implementing their keyboard behaviour. Support Escape and restore focus to More after dismissal. Avoid keyboard traps, hidden focus targets and positive `tabindex` hacks.

Check contrast in resting, hover, selected and focused states. State must be recognisable from shape/background/edge and not only colour. Support browser zoom and reduced-motion preferences. Keep active/focus transitions stable and restrained.

### 9. Implementation sequence

Proceed in this order, adapting file boundaries to the actual codebase:

1. Record the current baseline and destination-readiness findings; identify relevant shell tests and capture representative before views where practical.
2. Extend the shared semantic icon catalogue, including intentional outline/active pairs, and preserve compatibility for unrelated callers.
3. Add or update the seven department compositions, shared icon mappings and reliable destination matching.
4. Integrate the shared desktop rail, fixed More and scrolling middle group. Apply Sales labels and scoped existing-module adapters where supported.
5. Validate navigation, access, active state and representative visual states. Fix defects introduced by the change.
6. Update the maintained navigation decision/status and destination coverage evidence. Deliver the implementation and reviewable handover.

Keep work focused on this change. Do not refactor whole module interiors, redesign the Deals board, replace the shell framework, regenerate dependency lockfiles without cause, or bundle unrelated bug fixes. A genuine pre-existing blocker should be documented with its effect on validation.

### 10. Validation and evidence

Use the repository's existing test tools and package scripts. Inspect them before selecting commands; do not invent script names. Run the relevant TypeScript/lint/build gates required by the project and targeted automated tests for changed behaviour. Do not weaken checks, delete useful assertions or broadly refresh visual baselines to make failures disappear.

Add focused regression coverage where needed for this central navigation change. Tests should assert user-visible behaviour and independent expected mappings rather than just iterate over the implementation configuration and declare it correct.

| Area | Minimum evidence |
|---|---|
| All departments | Each of the seven configurations has the intended labels, icon keys and order; shared My Work/More placement is correct. |
| Sales | The full intended sequence is Pulse, Leads, Deals, Activities, Tasks, Sales Inbox, Contacts, Products, Insights. Runtime omissions are explained by verified readiness or access, not accidental filtering. |
| SVG states | Every enabled primary destination has valid default and active drawings, stable dimensions and no missing-icon fallback. |
| Active route | Direct load, child records, specific route precedence and supported view state choose the correct destination with no double selection. |
| Shared pages | Engineering or Service can enter shared records without silently switching to Sales; valid context survives reload and Back/Forward. |
| More | Fixed bottom placement, keyboard opening/dismissal, focus return and unchanged page selection while open. |
| Access | A restricted fixture omits unavailable links/counts, and direct navigation retains server access checks. An empty permitted set does not break the shell. |
| Names and records | Deals wording is consistent in affected Sales UI; stable opportunity routes remain valid; Customer-specific functions retain correct labels/scope. |
| Contacts adapters, if changed | People/Organisations selection, remembered permitted view and record links work with the actual supported model. |
| Work adapters, if changed | Pulse/Tasks/Activities reuse record identity; completing or scheduling an item does not create duplicate work. |
| Existing app | The Sales board's toolbar/cards, email connection handling and representative module interiors remain functional. |
| Responsive | Normal/short desktop, keyboard focus, zoom and the current mobile patterns remain usable without clipping. |

Where browser tools are available, run the app and inspect it. Prefer the repository's local Playwright/Chromium workflow; use a cloud browser only if available and needed. Do not claim visual acceptance from source inspection alone. If browser execution is genuinely blocked, complete the available checks and state the blocker and remaining visual checks.

Capture evidence in the repository's established location, including:

- A normal desktop view for each department showing its actual enabled rail.
- Sales active states for at least Pulse, Leads, Tasks, Contacts and Insights where those pages are available; use a clearly identified component/test fixture for unready destination artwork.
- A short desktop view showing the middle group scrolling with More anchored below.
- A keyboard focus plus active state and an open More menu.
- A representative mobile view confirming the existing navigation pattern remains intact.

Useful desktop sizes are 1440 × 900 and 1280 × 600; include a large desktop if the existing test suite uses one. Check a representative phone near 390 × 844 and browser zoom at 200%. Treat these as coverage examples and adapt to the app's actual breakpoints. Inspect screenshots at the real rendered icon size, not only magnified SVG samples.

An all-icons fixture is useful for inspecting outline/active pairs together. Reuse an existing story, test harness or component-preview mechanism if available; do not expose a new public production design-gallery page solely for this task.

### 11. Documentation and delivery

Update the maintained shell/navigation decision with the new department shortcuts and the r17 exception. Update the relevant project status and document register only as required by current repository conventions. Keep existing history and unrelated entries intact. Record actual implementation results, not a copied checklist marked complete.

Produce a concise coverage record for every primary destination across the seven departments. Record real route/view, readiness, permissions source, icon pair, active-parent rule and validation result. List missing landing pages or business dependencies individually, including what would make each ready. Secondary/context entries can be grouped by existing module when their mapping and reachability are clear.

Keep code reviewable under the repository's branch/commit conventions. Follow any existing authorisation in the VS Code session for commits, pushes or draft PRs. Prepare a clear change summary and PR-ready description where appropriate. This task does not require a production merge or deployment; do not claim either occurred unless it actually did under the user's instructions. Do not stop the coding work to request publication approval.

Your final response should give:

1. What was implemented and the departments/pages it covers.
2. The main changed files and any bounded adapters added.
3. Actual validation commands/results and screenshot/evidence locations.
4. A destination coverage summary distinguishing wired pages from any named dependencies.
5. Exact local run/open instructions based on the current project scripts, plus branch/commit/PR details if created.
6. Any remaining material limitation that prevents full acceptance.

Begin with repository inspection, then implement and verify the change. Do not ask whether to start.

## Appendix A — primary department icon mappings

These tables are transcribed from the current r02 register. Numbers in each department table identify that department's shortcuts. Sales begins immediately below the logo. For the other six departments, prepend My Work (`ClipboardList`) before the seven numbered entries. Append the fixed bottom More control (`Ellipsis`) in every workspace. The logo remains Home.

These mappings define the intended complete configuration. Apply the readiness and access rules in Section 2 to live links without changing the relative order.

### 1. Sales

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

### 2. Estimating & Quotation

| Order / placement | Navigation label | Icon reference | What it should look like | Purpose |
|---|---|---|---|---|
| 1 · Rail | **Intake** | `Inbox` | An open in-tray with a shallow central notch. | Requests received from Sales and the estimating workload. |
| 2 · Rail | **Estimation wizard** | `ListTree` | A short branching list with connected steps. | Guided discovery, scope options, alternatives and revision comparison. |
| 3 · Rail | **Estimates** | `Calculator` | A rounded rectangular calculator with display and keypad. | Estimate records and their cost bases. |
| 4 · Rail | **Specialist configurations** | `SlidersHorizontal` | Three horizontal control tracks with offset handles. | Screen Systems and other configured technical estimating workbenches. |
| 5 · Rail | **Supplier pricing** | `Tags` | Two overlapping price tags, each with a small fixing hole. | Supplier price sources, price books and cost evidence. |
| 6 · Rail | **Quotations** | `FileText` | A folded-corner page with evenly spaced text lines. | Quotation preparation, issued revisions and customer-facing scope. |
| 7 · Rail | **Reviews & approvals** | `BadgeCheck` | A compact scalloped approval badge with a central tick. | Estimate review, pricing exceptions and quotation approval queues. |

### 3. Engineering & Design Control

| Order / placement | Navigation label | Icon reference | What it should look like | Purpose |
|---|---|---|---|---|
| 1 · Rail | **Engineering workload** | `ListTodo` | A vertical list combining tick boxes and short lines. | Engineering packages, assigned deliverables and due work. |
| 2 · Rail | **Design basis & interfaces** | `Network` | One central node linked to several smaller nodes. | Design inputs, system boundaries and interface responsibilities. |
| 3 · Rail | **Drawings** | `Ruler` | A diagonal straight ruler with a few measurement ticks. | Drawing and controlled technical-document registers. |
| 4 · Rail | **Materials & substitutions** | `Layers` | Three clearly separated stacked sheets. | Released material lists, item mapping and substitution review. |
| 5 · Rail | **Change review** | `GitPullRequest` | Two paths with circular endpoints and a joining arrow. | Engineering changes and their technical impact. |
| 6 · Rail | **Technical reviews** | `BadgeCheck` | A compact scalloped approval badge with a central tick. | Technical review, approval, release and transmittal preparation. |
| 7 · Rail | **Commissioning & as-built** | `Gauge` | A semicircular dial with a single pointer. | Commissioning criteria, results, configuration and as-built handover. |

### 4. Projects & Commercial Delivery

| Order / placement | Navigation label | Icon reference | What it should look like | Purpose |
|---|---|---|---|---|
| 1 · Rail | **Projects** | `FolderKanban` | A project folder containing three short vertical work columns. | Project register, portfolio and project overview. |
| 2 · Rail | **Programme** | `ChartNoAxesGantt` | Three staggered horizontal task bars. | Project timelines, dependencies, baselines and forecasts. |
| 3 · Rail | **Delivery readiness** | `ListChecks` | Short checklist rows with clear ticks. | Prerequisites, customer readiness, material constraints and change impact. |
| 4 · Rail | **Risks & issues** | `TriangleAlert` | An outlined triangle with a central exclamation mark. | Risks, assumptions, issues, dependencies and project decisions. |
| 5 · Rail | **Variations & obligations** | `FileDiff` | A folded-corner page containing plus and minus marks. | Contract obligations, notices and proposed commercial changes. |
| 6 · Rail | **Site assurance** | `ShieldCheck` | A simple shield containing a tick. | Inspections, defects, retests and site-quality evidence. |
| 7 · Rail | **Acceptance & closeout** | `Flag` | One flag on a straight pole. | Staged acceptance, outstanding obligations and closeout. |

### 5. Service Operations

| Order / placement | Navigation label | Icon reference | What it should look like | Purpose |
|---|---|---|---|---|
| 1 · Rail | **Service requests** | `Headset` | A headset with two ear cups and a short microphone arm. | Case intake, triage and customer communication. |
| 2 · Rail | **Work orders** | `ClipboardPenLine` | A clipboard with a diagonal pen and short writing line. | Authorised scope, work-order status and coordination. |
| 3 · Rail | **Schedule** | `CalendarRange` | A two-ring calendar with a horizontal date-range mark. | Service demand, crew bookings and appointment coordination. |
| 4 · Rail | **Field team** | `UsersRound` | Two rounded heads and shoulders. | Technician availability, competence and field-team coordination. |
| 5 · Rail | **Job packs** | `FolderOpen` | An open folder with a sloping front flap. | Preparation, checking and issue of visit instructions and evidence. |
| 6 · Rail | **Service review** | `FileCheck2` | A folded-corner document with a tick at its side. | Visit review, controlled reports and customer-response follow-through. |
| 7 · Rail | **Equipment** | `Component` | Four diamond-shaped blocks grouped around a centre. | The shared installed base and equipment service history. |

### 6. Supply Chain Management

| Order / placement | Navigation label | Icon reference | What it should look like | Purpose |
|---|---|---|---|---|
| 1 · Rail | **Material demand** | `ListOrdered` | Three numbered rows with short horizontal lines. | Job demand, readiness and material requirements. |
| 2 · Rail | **Purchasing** | `ShoppingCart` | A shopping trolley with two round wheels. | Purchase coordination and supplier commitments. |
| 3 · Rail | **Inbound shipments** | `Container` | A long rectangular freight container with vertical ribs. | Inbound consignments, arrival dates and line allocations. |
| 4 · Rail | **Receiving** | `PackageCheck` | A package with a small tick. | Receipt, inspection and quarantine review. |
| 5 · Rail | **Stock & reservations** | `Warehouse` | A broad warehouse outline with a large roller door. | Available stock, reservations and warehouse context. |
| 6 · Rail | **Dispatch & delivery** | `Truck` | A side-view delivery truck with two clear wheels. | Picking, dispatch, customer delivery and proof of delivery. |
| 7 · Rail | **Returns & claims** | `PackageX` | A package with a small cross. | Returns, supplier claims and credit follow-through. |

### 7. Finance & Commercial Controls

| Order / placement | Navigation label | Icon reference | What it should look like | Purpose |
|---|---|---|---|---|
| 1 · Rail | **Finance handoffs** | `Inbox` | An open in-tray with a shallow central notch. | Work submitted to Finance, readiness and handoff follow-through. |
| 2 · Rail | **Customer accounts** | `BookUser` | An account book with a small person outline on its cover. | Account context, applications and customer-account exceptions. |
| 3 · Rail | **Project performance** | `ChartColumn` | Three vertical bars above a baseline. | Project financial performance on defined, sourced measures. |
| 4 · Rail | **Claims & obligations** | `ReceiptText` | A receipt with a serrated lower edge and short text lines. | Milestone claims and commercial obligations. |
| 5 · Rail | **Cash outlook** | `Wallet` | A simple wallet with a small closing flap. | Cash timing and commercial outlook. |
| 6 · Rail | **Reconciliation** | `Scale` | A balanced beam with two clearly separated pans. | Compare operational records, source measures and ERP outcomes. |
| 7 · Rail | **Exceptions** | `CircleAlert` | An outlined circle containing an exclamation mark. | Owned financial exceptions and uncertain outcomes. |

## Appendix B — secondary, contextual and shared mappings

Use these assignments in existing departmental menus, More and record navigation as indicated. Secondary means a labelled departmental or More destination. Context means an entry within the relevant record or workbench. Neither placement automatically adds a primary rail icon. Apply the same readiness and permission rules as the primary rail.

### 1. Sales

| Order / placement | Navigation label | Icon reference | What it should look like | Purpose |
|---|---|---|---|---|
| Secondary · More | **My Work** | `ClipboardList` | A clipboard with three short task lines. | The broader personal work, review and waiting-work overview. Sales does not add it as a tenth primary shortcut. |
| Secondary | **Sales handovers** | `ArrowRightLeft` | Two horizontal arrows pointing in opposite directions. | Sales-to-estimating and won-deal receiving; acceptance remains a separate step. |
| Secondary | **Quotations** | `FileText` | A portrait page with a folded corner and short text lines. | Customer-facing quotation records linked to the deal. |
| Secondary | **Account development** | `Route` | A winding line linking clearly marked waypoints. | Territory visits, account plans and relationship development. |
| Secondary | **Aftercare & renewals** | `HeartHandshake` | A restrained heart enclosing a handshake. | Post-sale follow-up, relationship care and renewal opportunities. |
| Context | **Stakeholders** | `Network` | A central node connected to three smaller nodes. | Decision makers, technical contacts and relationship roles within People and Organisations. |

### 2. Estimating & Quotation

| Order / placement | Navigation label | Icon reference | What it should look like | Purpose |
|---|---|---|---|---|
| Secondary | **Responses & negotiation** | `MessagesSquare` | Two overlapping rectangular speech bubbles. | Customer responses, negotiated changes and outstanding questions. |
| Secondary | **Item resolution** | `PackageSearch` | A package with a small magnifying glass. | Resolve one-off items and confirm product conversion. |
| Secondary | **Outcome review** | `ChartColumn` | Three upright bars above a horizontal baseline. | Estimate-to-actual comparisons with explicit comparison bases. |
| Secondary | **Reference cases** | `LibraryBig` | A small group of books with one leaning volume. | Previous cases, calibration proposals and estimating reference evidence. |
| Secondary | **Products** | `Package` | A simple cube with a lid seam. | The same product catalogue used by Sales and Supply Chain. |
| Context | **Screen calculator** | `Blinds` | A rectangular screen with horizontal slats and a short hanging cord. | The greenhouse screen tool within Specialist configurations. |
| Context | **Priva fertigation scoping** | `Droplets` | Two clean water-drop outlines. | Water and dosing scope within Specialist configurations. |

### 3. Engineering & Design Control

| Order / placement | Navigation label | Icon reference | What it should look like | Purpose |
|---|---|---|---|---|
| Secondary | **Technical queries** | `MessagesSquare` | Two overlapping speech bubbles. | Technical questions and supplier submittals. |
| Secondary | **Site surveys** | `ScanSearch` | A four-corner scanning frame with a magnifying glass. | As-found observations, measurements and survey evidence. |
| Secondary | **Equipment** | `Component` | Four diamond-shaped blocks grouped around a centre. | Installed assemblies and equipment context, including machinery and controls. |
| Secondary | **Documents** | `Files` | Two overlapping folded-corner pages. | The shared document register and exact revisions. |
| Context | **Configuration & I/O** | `CircuitBoard` | A rectangular board with connection tracks and small terminals. | Controller configuration and proposed I/O-register access from equipment context. |
| Context | **Sensors & monitoring** | `RadioTower` | A mast with balanced radio-wave arcs. | Sensor groups and monitoring context; wired/wireless is a record attribute. |

### 4. Projects & Commercial Delivery

| Order / placement | Navigation label | Icon reference | What it should look like | Purpose |
|---|---|---|---|---|
| Secondary | **Project receiving** | `Inbox` | An open in-tray with a central notch. | Receiving and reviewing an accepted Sales handover. |
| Secondary | **Subcontract packages** | `HardHat` | A hard hat with a clear brim and centre ridge. | Subcontractor and specialist work packages. |
| Secondary | **Stakeholder updates** | `Send` | A clean paper-plane outline. | Preparation and controlled publication of project updates. |
| Secondary | **Resources** | `UsersRound` | Two rounded heads and shoulders. | People, resource demand and capacity; confirmed visits use the shared planner. |
| Secondary | **Project performance** | `ChartColumn` | Three upright bars on one baseline. | Project financial performance and delivery measures. |
| Secondary | **Documents** | `Files` | Two overlapping pages with folded corners. | Project-linked controlled documents and issue history. |

### 5. Service Operations

| Order / placement | Navigation label | Icon reference | What it should look like | Purpose |
|---|---|---|---|---|
| Secondary | **My jobs** | `Wrench` | A single diagonal open-ended spanner. | Assigned technician visits and field execution; promote for technician roles. |
| Secondary | **Maintenance** | `CalendarClock` | A calendar with a small clock in one corner. | Maintenance plans, due occurrences and renewal planning. |
| Secondary | **Service agreements** | `Handshake` | Two hands meeting with restrained sleeve outlines. | Agreements, coverage and entitlement assessment. |
| Secondary | **Warranty** | `ShieldQuestionMark` | A shield containing a question mark. | Warranty investigation and customer resolution; the symbol does not imply accepted cover. |
| Secondary | **Remote support** | `MonitorCog` | A monitor with a small settings cog. | Remote diagnosis, OEM escalation and supporting evidence. |
| Secondary | **Findings & follow-up** | `ListTodo` | A vertical list with tick boxes and short lines. | Unresolved findings and accountable follow-up work. |
| Context | **Offline work** | `CloudDownload` | A cloud with a downward arrow. | Downloads, unsent evidence and recovery in the field workspace. |
| Context | **Site access** | `DoorOpen` | An open door in a simple frame. | Access, inductions, biosecurity and crop-sensitive work restrictions. |

### 6. Supply Chain Management

| Order / placement | Navigation label | Icon reference | What it should look like | Purpose |
|---|---|---|---|---|
| Secondary | **Suppliers** | `Factory` | A factory silhouette drawn in outline with a stepped roof. | Supplier records and purchasing relationships. |
| Secondary | **Products** | `Package` | An outlined cube with a lid seam. | The shared product catalogue, compatibility and lifecycle. |
| Secondary | **Supplier pricing** | `Tags` | Two overlapping price tags. | Price books and supplier source maintenance. |
| Secondary | **Service stock custody** | `ArrowLeftRight` | Two straight horizontal arrows pointing in opposite directions. | Warehouse, technician, van and job stock movements and reconciliation. |
| Secondary | **Material changes** | `GitPullRequest` | Two paths with circular endpoints and a joining arrow. | Material-change impact and linked engineering review. |
| Secondary | **Catalogue governance** | `PackageSearch` | A package and magnifying glass. | Product authoring, publication, imports and exception review. |

### 7. Finance & Commercial Controls

| Order / placement | Navigation label | Icon reference | What it should look like | Purpose |
|---|---|---|---|---|
| Secondary | **Credits & adjustments** | `Undo2` | A return arrow bending back to the left. | Review supporting evidence for credits and corrections. |
| Secondary | **Measure definitions** | `BookOpenCheck` | An open book with a small tick. | Approved definitions and the basis of financial measures. |
| Secondary | **Finance insights** | `ChartNoAxesCombined` | An upward line across a small bar group. | Financial reporting and source-trust review. |
| Secondary | **ERP handoff status** | `ArrowRightLeft` | Two arrows indicating exchange in opposite directions. | Adapter outcome, original-operation references and reconciliation. |
| Secondary | **Documents** | `Files` | Two overlapping folded-corner pages. | Evidence supporting handoffs, claims and reconciliation. |

### Shared records and supporting functions

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

Use the same shared destination icon across departments. The Contacts hub uses `IdCard`; People uses `UserRound`; Organisations uses `Building2`. Keep the review/approval badge separate from the Tasks clipboard tick. Customer accounts remains a scoped Finance destination.

Facilities covers structures and outdoor growing areas: greenhouses, tunnels, propagation houses, pack rooms, irrigation blocks/fields and irrigation sheds. The general navigation symbol is a land parcel, not a greenhouse-only silhouette. Equipment retains the component symbol and remains distinct from catalogue Products and warehouse Stock.

Specialist illustrations stay within their workbenches: `Blinds` for screens, `Droplets` for water/fertigation, `Sun` for lighting, `Thermometer` for climate, `RadioTower` for sensing and `CircuitBoard` for configuration/I/O. These illustrations do not create new modules or replace technical data such as wired/wireless GroScales, base-station requirements or controller compatibility.

### Department identities for the selector

These identify the workspaces in the existing selector or More. They do not add seven more shortcuts to the rail.

| Department | Identity icon | Intended appearance |
|---|---|---|
| Sales | `BriefcaseBusiness` | A commercial briefcase with a handle and central fastening. |
| Estimating & Quotation | `Calculator` | A calculator with a display and compact keypad. |
| Engineering & Design Control | `DraftingCompass` | An open drawing compass with two clean legs. |
| Projects & Commercial Delivery | `FolderKanban` | A project folder containing work columns. |
| Service Operations | `Wrench` | A single diagonal spanner. |
| Supply Chain Management | `Package` | An outlined shipping cube. |
| Finance & Commercial Controls | `ReceiptText` | A receipt with text lines and a serrated edge. |

### Visual distinctions to preserve

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

## Appendix C — Sales filled active-icon specifications

Keep these drawings aligned with their outline counterparts and use the shared selected tile and separate keyboard-focus ring. More is an open-menu control; it does not become a tenth selected Sales page.

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

## Appendix D — historical route evidence to reconcile

The following route notes are copied from r02 to help discovery. They describe the source inspection behind that register, not a fresh audit of the branch open in VS Code. Confirm each path, actual functionality, access rule and landing experience before wiring it. “No landing verified” means inspect the current code; it is not an instruction to skip a page that has since been implemented.

For missing routes, follow Section 2: reuse or implement a small adapter when the existing capability supports it, otherwise record the specific dependency and omit the live link. Do not use a route's existence alone as acceptance evidence.

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

## Source and revision record

Source: **PPO-Department-Navigation-Icon-Register-r02.md**, read in full on 22 September 2026. The embedded department mappings, descriptions, shared assignments, Sales active states and historical route notes preserve that register's content. The implementation instructions add execution, integration and validation requirements for this coding task.

Repository: [deanrfiedler-gif/powerplants-one](https://github.com/deanrfiedler-gif/powerplants-one). Shape references: [Lucide icon catalogue](https://lucide.dev/icons/). Inspect the project's pinned sources and current code before importing assets or choosing implementation details.

**r01 — 22 September 2026:** Initial detailed VS Code implementation prompt for the seven department rails and shared navigation, based on icon register r02. This prompt does not assert that code has been implemented, tested, merged or deployed.

**End of implementation instruction.**
