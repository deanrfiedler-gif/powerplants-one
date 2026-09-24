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

Retained reference: `docs/reference/ui/crm/PPO-Deal-Workspace-r01.html`. Missing mobile reference images are explicitly unprovided. The current shell and server authority govern departures from demonstration HTML. ES-05/06/07, agreements and automatic downstream effects remain unavailable under ADR-0046. Actual paired captures and differences are recorded in `docs/delivery/sales-native-completion-handover.md`; acceptance is pending.
