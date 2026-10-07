# Lead detail — design reference

Stable entry: `route:/sales/leads/[id]`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/sales/leads/{id}`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

This page address exists in the inspected application source. Open it from a running app using an identity with the required access.

1. Confirm the record reference and customer/site context in this record workspace.
2. Use + Lead to capture the enquiry and its source
3. Use Everyone and Filters to narrow the list; review Inbox, Archived, Disqualified and Converted separately
4. Open the lead title or row menu to review, schedule follow-up or perform an available transition
5. Convert a qualified enquiry to its linked deal and retain the original lead history

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

No exact image or HTML reference is linked. Keep this gap visible.

## Behaviour, handovers and verification

The draft User Guide `guide.page.sales.leads.id` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

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
