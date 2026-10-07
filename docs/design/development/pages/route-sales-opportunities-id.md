# Opportunity detail — design reference

Stable entry: `route:/sales/opportunities/[id]`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/sales/opportunities/{id}`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

An app page exists here. Its wider workspace scope or newer design still needs refinement; see the linked scope areas below.

1. Confirm the record reference and customer/site context in this record workspace.
2. Open the deal and confirm customer/site scope
3. Review activities, estimating and documents together
4. Maintain the next action and record stage changes through available controls

## Desktop

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [PPO-Deal-Workspace-r01.html](../../../reference/ui/crm/PPO-Deal-Workspace-r01.html)

## Behaviour, handovers and verification

The draft User Guide `guide.page.sales.opportunities.id` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Native Sales implementation contract

Maintain one opportunity with source-owned customer context, accountable next action, commercial evidence and linked handovers.

- Overview: deal information, next action and linked Sales workflows.
- Scope & sites: customer, location, contact, qualification and scope.
- Activities and Tasks: existing shared work, with its independent owners.
- Estimates & quotations, Correspondence, Documents and History: source records and evidence.

Open a permitted opportunity from Deals. Current ownership and opportunity edit permission govern edits. Activities, email, estimates and documents keep their own visibility rules.

Unknown values remain unknown. Deal value is unweighted AUD excluding GST. Stage and Won/Lost are separate. Correspondence is a filtered, mailbox-owned source projection.

Deal Workspace links to handover records without duplicating their write controls. Won does not imply conversion, delivery or revenue.

Desktop: retain the current shell, Roboto/Verdana and navy/green tokens. Reuse PageHeader, Button, Field, SelectField, RecordTabs and error/status controls. Keep review decisions after the brief, immutable history separate and long reasons wrapping. Inspect at 1440 × 960 and 1024 × 768.

Mobile: stack fields/actions, keep every tab reachable and contain table/history overflow. Inspect at 390 × 844, 320 CSS px and 200% zoom; keyboard focus and recovery state must stay visible.

Loading, empty/filter-empty, partial, failed, denied, read-only, validation, saving, saved, uncertain and source-changed states remain explicit. The guide `guide.page.sales.opportunities.id` carries normal and recovery steps.

Retained reference: `docs/reference/ui/crm/PPO-Deal-Workspace-r01.html`. Missing mobile reference images are explicitly unprovided. The current shell and server authority govern departures from demonstration HTML. The earlier ADR-0046 boundary is historical: native ES-05/06/07 now supplies release, response and Supply conversion. Agreements and automatic downstream effects remain unavailable. Actual paired captures and differences are recorded in `docs/delivery/sales-native-completion-handover.md`; acceptance is pending.

## Lead source continuity (LC-11)

When a site is resolved after lead follow-up, review every original activity. Differently scoped activities keep their original owner, date and source link; record a review plan for each and create a dated RelationshipReview owned by the lead owner on the Deal. Converted Lead and Deal show the retained obligations and their current status. Changed or inaccessible source activities block conversion; an uncertain save is recovered using Confirm original save.

Reuse the existing Lead modal, LookupField, TextArea, native date input, operation recovery and Link controls. The Lead modal retains its documented legacy lead-primary controls. Incoming handover: manual enquiry and original Activities. Outgoing handover: Discovery Deal, compatible Activity identities, and the new owned source-review Activity. No source Activity is reassigned or completed by conversion.

Desktop: keep source summary, owner/status, review plan and required dated action in the modal scroll body with fixed footer. Phone: stack the same comparison at 390 and 320 CSS px; long source summaries wrap, controls stay reachable and review fields remain required. Keyboard focus and original-save recovery must work without losing the comparison.

Retained reference: [Leads desktop container r01](../../../reference/ui/crm/PPO-Leads-Desktop-Container-r01.html). The exact new conversion-review mockup/image is missing; this additive adaptation is proposed for owner review. Synthetic states are in [lead continuity fixtures](../lead-continuity-fixtures.json). No visual review fingerprint or owner acceptance is granted by this change.

## Exact commercial evidence in Deals (LC-14)

Keep CR-01 and its r20 record workspace page type. Incoming: all permitted native estimate alternatives and exact quotation revisions. Outgoing: the existing ES-05 release, ES-06 reported-response and ES-07 receiving/target/history routes. Reuse Button, ErrorNotice, Stamp, native details disclosure, shared tokens and the existing CRM panel (retained host exception). No native command or lifecycle is copied into Sales.

Every permitted alternative contributes its own quotation revisions to Estimates & quotations and Documents. Label Draft and Release separately, preserve the estimate/option and output state, and open exact native evidence on request. An issued event, current source check, staff-recorded response and native Supply conversion are independent facts. A current correction replaces the displayed latest response while native history retains its predecessor. Unavailable or restricted evidence must never read as not issued/not converted. A denied refresh removes previously displayed evidence and offers an explicit permitted retry. Reading evidence never records Won or authorises Project/Service delivery.

Desktop: use labelled revision cards, a stable option/estimate link and separate issue, response and conversion sections. Phone: stack cards and wrap long held-source/response text at 390 and 320 CSS px; keep native history and retry controls reachable without horizontal page scrolling. Native summary controls must be keyboard reachable. Existing exact source HTML/images above remain the retained references; exact new-state mockup images are missing. This additive host adaptation awaits paired visual and owner acceptance; no accepted fingerprint is assigned.

## Explicit outcome evidence (LC-15)

Retain CR-01 and the r20 record workspace with its existing outcome dialog. Incoming handover: permitted native quotation issue/response and the current Deal; outgoing: the exact outcome event, immutable evidence and existing Won handover due. Reuse Field, SelectField, Button, ValidationFields, ErrorNotice, shared tokens and the existing dialog/footer (retained host exception). The proposed adaptation requires an explicit native or separate evidence choice; it does not infer Won.

Show current native facts and the frozen reviewed comparison separately. Background refresh cannot replace the submitted source. Denied refresh hides prior native facts; uncertain save locks replacement and exposes original recovery. History distinguishes recorded response, latest report, changed native issue, separate evidence and historical narrative outcomes. Desktop keeps review before the save footer. At 390/320 CSS px, stack selectors and narrative, wrap long text and keep review/discard/recovery reachable; verify keyboard focus and 200% zoom separately.

Host states are in lead-continuity-fixtures.json and tests/browser/outcome-sources.spec.ts. Retain the exact HTML references above; no exact new-state mockup image is available. Functional proof does not assign an accepted fingerprint. Paired visual, owner, physical-device and screen-reader acceptance remain pending.


## Native Won receiving (LC-16)

Keep this existing scope and page type. Incoming handover: exact accepted Won Sales event; outgoing: independently created native Project or Service work order and a separately reviewed typed binding. The Deal reads native receiving state and the retained Activity separately. It does not infer delivery completion from acceptance, a link or an Authorised work order.

Reuse shared Button, Field, SelectField, ErrorNotice, recoverable command journal, existing native lookup controls and record guard. Preserve the native Project Gantt and Service scope/readiness layouts. Proposed addition: a scoped Sales-context panel, explicit fixed-version comparison and create-and-return actions. Existing native form buttons remain documented legacy controls; no new theme or navigation system is introduced.

Desktop and phone: wrap reported scope and references; show original Sales revision beside current native state, owner and version. Keep Review, link reason, discard and original-recovery actions visible in normal document flow. A refresh must not silently substitute a reviewed comparison. Denied comparison reads remove its protected content. Unknown Sales site requires an explicit native site choice and does not rewrite the accepted source. New Service intake and work-order creation save independently before link review; existing native scope and authorisation controls remain.

Exact new-state mockup/HTML images are missing. Retained module references above are baseline context. Implementation captures and synthetic checks are recorded in `docs/testing/evidence/won-delivery-continuity/README.md`; they do not grant paired visual, keyboard/200% zoom, physical-device or owner acceptance. Review fingerprints remain unchanged.

## LC-17 reviewed follow-up back to Sales

Preserve the existing scope and r20 page type. Incoming context is an owned native Activity from Project delivery, Service/aftercare or Maintenance/renewal. Reuse Button, Field/SelectField, LocalDateTimeField, RecordLink, ErrorNotice, the existing Lead modal, native Deal form and actor-bound command journal. Original Activities, native qualification and receiving acknowledgement remain separate authorities.

From Project Sales context, record a customer need as an Internal CustomerContact Activity with an owner and date. In Activity detail, review existing Sales records, choose Lead or qualified Deal, independently capture through the native form if needed, then return for a fixed comparison and explicit link. A restricted, technical or completed original can create a separate Internal RelationshipReview with reviewed wording and its own date; preserve original restrictions and history. A Lead link can then open native next-action planning with the retained Activity selected. Qualification and the Deal initial action are never inferred. Aftercare receiving still requires its separate confirmed Deal reference.

Desktop: show original native links, current customer/site, Activity version/state/date, selected Sales reference/version and separate source attribution. Refresh cannot advance a frozen comparison. A stale save changes no record; discard and compare again. Unknown creation/link results expose original lookup and exact retry; permission loss clears protected comparisons. Project content remains in the existing dialog to preserve Gantt geometry.

Phone: stack fields and recovery controls, wrap names/references, retain readable labels and reachability of native modal actions. Keep the source context and all required review choices visible at 390/320 px. Preserve Escape/return-focus of the existing Project dialog. New LC-17 state mockups and accepted images are missing; this is a proposed host adaptation pending paired visual, keyboard/zoom, physical-device and owner review. Functional checks are recorded separately in `docs/testing/evidence/sales-followup-continuity/README.md`; no accepted fingerprint is supplied.

## NAV contextual navigation

Deal sections use validated section URL state, retaining all existing query/filter context and owned source actions. Reload and Back restore the selected section; invalid sections fall back to Overview.

Desktop uses the existing shell with a 76 px compact or 232 px labelled primary rail. Mobile uses labelled destinations and More > Workspace; Home/search/help remain reachable. Check 320/390/780/781/1199/1200 px where applicable, long labels, visible focus and Escape/return focus. Missing accepted images remain explicit; no new accepted image or review fingerprint is recorded. Functional results and screenshot observations are in the NAV ledger; owner/device review and deployment remain separate.
