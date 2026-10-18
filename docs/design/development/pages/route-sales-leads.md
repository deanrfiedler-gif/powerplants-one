# Leads — design reference

Stable entry: `route:/sales/leads`. Owner: Dean Fiedler. Status: **Owner visual review 9 October 2026: Accept**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/sales/leads`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

This page address exists in the inspected application source. Open it from a running app using an identity with the required access.

1. Use + Lead to capture the enquiry and its source
2. Open a view from the side menu (Inbox, My leads, a status, Overdue, Next action needed, Archived, Disqualified or Converted); use Everyone and Filters to narrow it
3. Open the lead title or row menu to review, schedule follow-up or perform an available transition
4. Convert a qualified enquiry to its linked deal and retain the original lead history

## Desktop

Accepted design (11 October 2026): the [Leads design decision](../../../decisions/leads-design.md), with captures 01–03 in [Leads design r01](../../../reference/ui/crm/leads-design-r01/README.md). It reuses the [Reviews & approvals](../../../decisions/estimate-reviews-design.md) shell and grid with a labelled Sales rail. Since 18 October 2026 the app draws the secondary menu (L1/L2) in place of the icon tabs; the toolbar (L3), the default columns (L4) and the record window (L6) are still the earlier list and Lead modal. See [Side menu built](#side-menu-built--18-october-2026).

- **Layout at 1440 × 900:** the labelled 240 px Sales rail with Leads selected (white tile, Solid crosshairs icon, count) and the rail label "Estimating handovers"; the breadcrumb "Leads" (shell top bar amendment, 16 October 2026) as the page title; a flush 240 px secondary menu; then a 60 px toolbar and a full-bleed grid.
- **Secondary menu:** Inbox and My leads; a Status group (New, Contacting, Nurturing); a Follow-up group (Overdue, Next action needed, from the next-action states); Other views (Archived, Disqualified, Converted). Every view shows a neutral count, which needs a count read. It collapses to a 20 px strip from its right border or the top-bar toggle.
- **Toolbar:** Owner and Source filters, the count with its refresh time, Refresh, a navy "+ Lead" and "…".
- **Grid:** single-line 40 px rows with lines between cells. Default columns: Lead title, Next activity, Next activity due, Organisation, Contact, Status (neutral tag), Lead owner and Date added (sorted, newest first). Lead ID, Next activity owner, Source and Archived stay in the column chooser. The checkbox column and the settings and "…" column stay fixed while the grid scrolls sideways.
- **Wording and colour:** the app's wording. Overdue uses the danger colour with an icon; "Due date needed" and "Next action needed" use the warning colour; "Organisation to confirm" and "Contact to confirm" are muted. Every state has words.
- **Record window:** clicking a row opens it over the grid, never squeezing it, from the secondary menu's right edge, with close, previous and next on that edge. It shows the enquiry, the customer context, the rule note, Activities and Customer context tabs, and History. For the lead owner its footer offers Plan activity and Convert to deal, with Archive, Disqualify and Transfer owner under "…".
- **Selection:** ticking rows shows a selection toolbar and a 360 px panel with Open in sequence and Export list only.

The modal forms (+ Lead, reasons, Transfer owner, Convert to deal) keep the requirements below.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design (11 October 2026): captures 04–05 in [Leads design r01](../../../reference/ui/crm/leads-design-r01/README.md).

- **Header and toolbar at 390 × 844:** the page name "Leads" only, with no breadcrumb. A toolbar holds a view picker ("Inbox") standing in for the secondary menu, the count and a filter icon button.
- **List:** flush list rows about 80 px tall, each showing the title; the organisation and contact with the status tag; and the next activity with its due date, with a chevron. The floating "+" for + Lead stays.
- **Record view:** tapping a row opens a full-screen record view with back, previous and next. The lead is stacked, and Plan activity and Convert to deal are fixed at the bottom for the lead owner.
- **Tab bar:** icons only, the Sales tabs (My Work, Deals, Activities, Contacts, More), each with a hidden accessible label. It stays visible on Leads; no tab is current, because Leads is reached through More. Phone selection of several rows is not designed yet.

The modal forms keep the requirements below.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Accepted Figma design: [Leads design r01 captures](../../../reference/ui/crm/leads-design-r01/README.md) (icon-free PNGs; design compositions, not application captures). Earlier approved references, retained unchanged: the r04 desktop interior `docs/blueprints/crm-leads-desktop-preview.html` (its upload alias `docs/reference/ui/crm/PPO-Leads-Desktop-Container-r01.html`) and the r02 phone reference `docs/blueprints/crm-leads-preview.html`. The accepted design replaces their layout when the page is built. Images of the LC-11, LC-12 and LC-17 states are still missing.

## Behaviour, handovers and verification

The draft User Guide `guide.page.sales.leads` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Lead source continuity (LC-11)

When a site is resolved after lead follow-up, review every original activity. Differently scoped activities keep their original owner, date and source link; record a review plan for each and create a dated RelationshipReview owned by the lead owner on the Deal. Converted Lead and Deal show the retained obligations and their current status. Changed or inaccessible source activities block conversion; an uncertain save is recovered using Confirm original save.

Reuse the existing Lead modal, LookupField, TextArea, native date input, operation recovery and Link controls. The Lead modal retains its documented legacy lead-primary controls. Incoming handover: manual enquiry and original Activities. Outgoing handover: Discovery Deal, compatible Activity identities, and the new owned source-review Activity. No source Activity is reassigned or completed by conversion.

Desktop: keep source summary, owner/status, review plan and required dated action in the modal scroll body with fixed footer. Phone: stack the same comparison at 390 and 320 CSS px; long source summaries wrap, controls stay reachable and review fields remain required. Keyboard focus and original-save recovery must work without losing the comparison.

Retained reference: [Leads desktop container r01](../../../reference/ui/crm/PPO-Leads-Desktop-Container-r01.html). The exact new conversion-review mockup/image is missing; this additive adaptation is proposed for owner review. Synthetic states are in [lead continuity fixtures](../lead-continuity-fixtures.json). No visual review fingerprint or owner acceptance is granted by this change.

## Customer resolution and owned transfer (LC-12)

Manual enquiry capture remains distinct from current customer resolution. Select permitted customer/site/contact identities or use the native shared record form and return. Each shared creation is saved separately; a contact then needs its explicit dated affiliation. A return only preselects the new identity: review and save the Lead resolution with a reason. Earlier selections and captured facts remain retained. Conversion uses the latest saved selection.

The current active Lead owner may transfer accountability to an eligible existing owner after comparing all linked Activities. Keep original Activity owners, due dates, outcomes and links. Show a clear no-recipient state and prevent submission without a valid selection. Recover uncertain saves with the original operation, including after ownership changes. No default permission is added.

Reuse the existing Lead modal, LookupField, TextArea, shared Field/SelectField/ValidationFields, native dates and existing save-recovery hook. The existing legacy lead-primary/secondary and shared capture form layout are retained as explicit exceptions; no new shared component is introduced. Incoming: captured Lead and permitted shared customer records. Outgoing: immutable resolution or owned transfer, then the explicit LC-11 conversion handover. This remains the existing r20 Record workspace/page type and scope.

Desktop: keep captured/current context headings distinct, long record names wrapping, comparison in the scroll body and Save/Confirm original save in the reachable footer. Phone: stack the same required choices and reasons at 390 and 320 CSS px; never conceal missing affiliation, denied recipient or uncertain save. Creation routes remain native full-page forms with an explicit return to the Lead. Keyboard selection is separate from free text.

Exact new resolution/transfer/create-return mockup images are missing. Retained Leads reference: `docs/reference/ui/crm/PPO-Leads-Desktop-Container-r01.html`; shared customer reference: `docs/reference/ui/customers/PPO-Customer-360-Workspace-r01.html`. These additive states are proposed adaptations under the existing scope, pending paired visual and owner review. No fingerprint is adopted. See [customer-context decision](../../../decisions/lead-customer-context.md) and [synthetic state examples](../lead-continuity-fixtures.json).

Local functional checks and limited capture inspection are retained in [LC-12 execution evidence](../../../testing/evidence/lead-context-resolution/README.md). Paired source, owner and physical-device review remain pending.

## LC-17 reviewed follow-up back to Sales

Preserve the existing scope and r20 page type. Incoming context is an owned native Activity from Project delivery, Service/aftercare or Maintenance/renewal. Reuse Button, Field/SelectField, LocalDateTimeField, RecordLink, ErrorNotice, the existing Lead modal, native Deal form and actor-bound command journal. Original Activities, native qualification and receiving acknowledgement remain separate authorities.

From Project Sales context, record a customer need as an Internal CustomerContact Activity with an owner and date. In Activity detail, review existing Sales records, choose Lead or qualified Deal, independently capture through the native form if needed, then return for a fixed comparison and explicit link. A restricted, technical or completed original can create a separate Internal RelationshipReview with reviewed wording and its own date; preserve original restrictions and history. A Lead link can then open native next-action planning with the retained Activity selected. Qualification and the Deal initial action are never inferred. Aftercare receiving still requires its separate confirmed Deal reference.

Desktop: show original native links, current customer/site, Activity version/state/date, selected Sales reference/version and separate source attribution. Refresh cannot advance a frozen comparison. A stale save changes no record; discard and compare again. Unknown creation/link results expose original lookup and exact retry; permission loss clears protected comparisons. Project content remains in the existing dialog to preserve Gantt geometry.

Phone: stack fields and recovery controls, wrap names/references, retain readable labels and reachability of native modal actions. Keep the source context and all required review choices visible at 390/320 px. Preserve Escape/return-focus of the existing Project dialog. New LC-17 state mockups and accepted images are missing; this is a proposed host adaptation pending paired visual, keyboard/zoom, physical-device and owner review. Functional checks are recorded separately in `docs/testing/evidence/sales-followup-continuity/README.md`; no accepted fingerprint is supplied.

## Owner visual review — 9 October 2026

- **Reviewer:** Dean Fiedler. He accepted Claude's proposed verdicts from the phase 00 review boards (navigation canvas version 29).
- **Result:** Accept.
- **Evidence:** [phase 00 review, session 1](../../../testing/evidence/ui-review-phase-00-r01/README.md). Synthetic data; compiled build at `a52cb01`; 1440 × 900 and 390 × 844 headless Chromium, captures for this entry.
- **Findings:** Empty and populated states are both clear. Phone: the warning triangle on a lead has no visible meaning; add a label. Phone empty-state text failed contrast in the empty run.
- **Scope of this record:** visual review of the captured state only. Device, screen-reader, zoom and operational acceptance remain separate. A later source change marks this review stale.

## Counts and follow-up backend — 12 October 2026

The [Leads read contract](../../../decisions/lead-register-backend.md) supplies the count and follow-up API prerequisites for the accepted register. Counts apply the caller's current scope and filters across all matches; unavailable next-activity evidence is explicit. The list adds MyLeads and Overdue/NextActionNeeded filtering while preserving row DTOs. [Backend evidence](../../../testing/evidence/lead-register/README.md) is separate from visual proof. The running page has not been wired to these reads; accepted menu/toolbar/badge presentation and a fresh visual review remain pending. No review fingerprint is promoted.

## Side menu built — 18 October 2026

Dean asked on 18 October 2026 for the rails and secondary menus to match the Figma designs; this builds the Leads side menu that the accepted page draws (Figma `190:20519`, decision L1/L2). [Implementation record](../../../decisions/leads-side-menu-implementation.md).

- **Composition.** The page mounts the shared `SecondaryMenuFrame` (scope `#ppo-leads`) in its Figma presentation. Rows: Inbox and My leads; Status: New, Contacting, Nurturing; Follow-up: Overdue, Next action needed; Other views: Archived, Disqualified, Converted. Each row has the drawn icon and a neutral count. The icon tabs and the hidden View select are removed, and Status leaves the Filters menu because statuses are now views.
- **Reads, not rules.** Each view is an existing read of `GET /api/v1/crm/leads` (`view`, `status` or `follow_up`), and each count is the same-named key of `GET /api/v1/crm/leads/counts` under the toolbar's search, owner and source. Overdue and Next action needed are the [backend's](../../../decisions/lead-register-backend.md) follow-up predicates. When some leads' next activities cannot be read, both follow-up counts show "+" and say how many leads are not counted. No rule, read, migration or capability is added.
- **Desktop requirements.** At 1440 × 900 the menu is 240 px, docked from 1200 px, with rows at y = 8, 50, 92 (heading), 128 … 494, the same as the Figma frame. Collapsing from its right border leaves the 20 px strip, and the choice is kept per person in this browser (`ppo:<workspace>:<actor>:leads:presentation:v1`). From 781 to 1199 px the same menu opens as an overlay from the header's Show menu button. The table stays the one vertical scroll owner and nothing scrolls sideways at 960 or 1024 px.
- **Mobile requirements.** The header's Leads menu button opens the same menu as an overlay with 44 px rows, and the existing view picker in the Leads toolbar now offers the same ten views, grouped. Choosing a view closes the overlay. List rows, the floating + and the tab bar are unchanged.
- **Still the earlier page.** Toolbar (L3), default column order (L4), the grid's wording colours (L5), record window (L6), selection panel (L7), phone list rows (L8) and the rail badge. Loading, empty and failed states of the menu itself are not drawn in Figma: counts appear only once read, and a failed count read leaves the views working with a note.
- **Fixtures.** `tests/unit/leads-menu.test.ts` (view order, mapping to backend reads, address round trip, counts query, partial follow-up counts); "the accepted side menu opens each existing lead read with its full-match count" in `tests/browser/leads.spec.ts` (desktop counts, geometry, views, collapse memory, 1024 px overlay; phone picker and overlay). Owner visual review of the application is pending; the 9 October review stays stale.
