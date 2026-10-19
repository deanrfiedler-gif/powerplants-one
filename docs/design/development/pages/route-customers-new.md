# Create customer / shared record — design reference

Stable entry: `route:/customers/new`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/customers/new`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Current CS-01 implementation — 19 October 2026

[Accepted D1–D7 / Q1–Q4](../../../decisions/organisations-figma-design.md) and [implementation/adaptations](../../../decisions/organisations-figma-implementation.md) govern the current native build. Earlier proposal sections below remain provenance, not the current target. No issued reference or parent requirement ID changes.

Register: authorised one-snapshot rows/counts/owners, signed pagination, Status/owner/search/views in the URL, shared grid on desktop and rows on phones, snapshot and legacy saved-view commands. Open service is Unknown because no combined closure read is established. Organisation row selection never enters the URL. Numeric site/area links retain the exact organisation handover.

Record: shared identity/source/facts layout, seven URL-retained tabs, type and status filters, exact source handovers and sticky phone follow-up. Current site roles are separate from historical relationships. Source limitations, unavailable/partial/denied states and finance restrictions stay explicit. Correct details uses only the existing display-name revision; stale and uncertain writes keep the original operation.

Create: Organisation, Owner and source, Notes, and Check before creating; actual company/owner selectors and duplicate-name read, optional legal name/sector/notes using the existing create command. Notes keep Internal visibility. A Lead selection returns for explicit LC-12 review/save. Other shared-create variants retain their workflows.

Desktop checks: 1440 × 900/1234, 1280 × 900 and 1024 × 900. Phone: 390 × 844 and 320 × 844. Exact source captures 01–10 are listed in [r01](../../../reference/ui/customers/organisations-design-r01/README.md). Additional snapshot, denied, correction and form-recovery states use established shared patterns; no additional accepted image exists for them. [Host state recipes](../organisations-native-fixtures.json) and [native evidence](../../../testing/evidence/organisations-native-r01/README.md) retain the verification limits.

Guides remain Draft. Source presence, local proof, visual review, baseline acceptance and deployment remain separate.

## Purpose and task

An app page exists here. Its wider workspace scope or newer design still needs refinement; see the linked scope areas below.

1. Search the related register for an existing record before creating another.
2. Complete the information requested by the creation form; keep unknown values explicit.
3. Review the entered context, save through the page action and inspect the resulting record/confirmation.
4. Then continue the wider workflow: Follow linked records to review relationship history

## Desktop

Accepted design: the [Organisations design decision](../../../decisions/organisations-figma-design.md) of 18 October 2026, with capture 05 in [design r01](../../../reference/ui/customers/organisations-design-r01/README.md) (Figma `1445:381483`). The form follows the accepted Facilities create form (D7): Organisation, Owner and source, and Notes, with a "Check before creating" column that lists similar names in permitted companies and offers "Use this record". The check is a prompt, never a block, and nothing is merged automatically. The organisation variant now implements that composition; other shared-create variants retain their existing layouts.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Not drawn in the accepted design: Create organisation at tablet and phone ([design r01](../../../reference/ui/customers/organisations-design-r01/README.md)).

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [PPO-Customer-360-Workspace-r01.html](../../../reference/ui/customers/PPO-Customer-360-Workspace-r01.html)

## Behaviour, handovers and verification

Accepted Figma design: [Organisations design r01 captures](../../../reference/ui/customers/organisations-design-r01/README.md) and its [decision](../../../decisions/organisations-figma-design.md). The create form at tablet and phone is not drawn.

The draft User Guide `guide.page.customers.new` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Customer resolution and owned transfer (LC-12)

Manual enquiry capture remains distinct from current customer resolution. Select permitted customer/site/contact identities or use the native shared record form and return. Each shared creation is saved separately; a contact then needs its explicit dated affiliation. A return only preselects the new identity: review and save the Lead resolution with a reason. Earlier selections and captured facts remain retained. Conversion uses the latest saved selection.

The current active Lead owner may transfer accountability to an eligible existing owner after comparing all linked Activities. Keep original Activity owners, due dates, outcomes and links. Show a clear no-recipient state and prevent submission without a valid selection. Recover uncertain saves with the original operation, including after ownership changes. No default permission is added.

Reuse the existing Lead modal, LookupField, TextArea, shared Field/SelectField/ValidationFields, native dates and existing save-recovery hook. The existing legacy lead-primary/secondary and shared capture form layout are retained as explicit exceptions; no new shared component is introduced. Incoming: captured Lead and permitted shared customer records. Outgoing: immutable resolution or owned transfer, then the explicit LC-11 conversion handover. This remains the existing r20 Record workspace/page type and scope.

Desktop: keep captured/current context headings distinct, long record names wrapping, comparison in the scroll body and Save/Confirm original save in the reachable footer. Phone: stack the same required choices and reasons at 390 and 320 CSS px; never conceal missing affiliation, denied recipient or uncertain save. Creation routes remain native full-page forms with an explicit return to the Lead. Keyboard selection is separate from free text.

Exact new resolution/transfer/create-return mockup images are missing. Retained Leads reference: `docs/reference/ui/crm/PPO-Leads-Desktop-Container-r01.html`; shared customer reference: `docs/reference/ui/customers/PPO-Customer-360-Workspace-r01.html`. These additive states are proposed adaptations under the existing scope, pending paired visual and owner review. No fingerprint is adopted. See [customer-context decision](../../../decisions/lead-customer-context.md) and [synthetic state examples](../lead-continuity-fixtures.json).

Local functional checks and limited capture inspection are retained in [LC-12 execution evidence](../../../testing/evidence/lead-context-resolution/README.md). Paired source, owner and physical-device review remain pending.

## Leave protection (F42) — 16 October 2026

Typing into this form and then following the rail (phone bar), a header link, a header search result or browser Back asks before the entries are discarded. Cancel keeps the page and the typed values; OK leaves. A clean form leaves without asking, and a saved record opens without a prompt. The form registers the shared `useUnsavedChanges` guard through `useCreateDraft` (state `create-leave-guard` in [fields](../components/fields.md)). Fixture: `tests/browser/navigation-safety.spec.ts` (F42) at desktop and phone widths. Source: live-app UX audit finding F42, principle 11. No layout, control or copy change; owner review of the native prompt wording is pending.

Every record kind on this route is covered. The lead return (`?lead=`) keeps its existing command guard.
