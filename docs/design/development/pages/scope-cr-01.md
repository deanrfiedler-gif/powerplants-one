# Opportunity detail and internal work — design reference

Stable entry: `scope:CR-01`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/sales/opportunities`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Extend the existing opportunity-detail route into the full Deal Workspace: scope, estimating, tasks, conversations, documents and contacts.

1. Open the deal and confirm customer/site scope
2. Review activities, estimating and documents together
3. Maintain the next action and record stage changes through available controls

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

The draft User Guide `guide.cr.01` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

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

Loading, empty/filter-empty, partial, failed, denied, read-only, validation, saving, saved, uncertain and source-changed states remain explicit. The guide `guide.cr.01` carries normal and recovery steps.

Retained reference: `docs/reference/ui/crm/PPO-Deal-Workspace-r01.html`. Missing mobile reference images are explicitly unprovided. The current shell and server authority govern departures from demonstration HTML. ES-05/06/07, agreements and automatic downstream effects remain unavailable under ADR-0046. Actual paired captures and differences are recorded in `docs/delivery/sales-native-completion-handover.md`; acceptance is pending.

Paired review refinement: the Overview begins with Next customer action and Customer objective in the existing two-column detail grid, stacking on phones. Deal information and linked receiving workflows follow. Transfer/outcome controls share one wrapping row; no authority changes.

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
