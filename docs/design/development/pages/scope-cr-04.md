# Pipeline insights and forecast review — design reference

Stable entry: `scope:CR-04`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/sales/opportunities`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Retain Board/List/Forecast/Archive. Extend analytical review with stage history, ageing, slipped dates, next-action coverage and agreed forecast definitions.

1. Use Board or List to inspect the same permitted worklist
2. Use Forecast to review timing and known values
3. Review Archive separately from active opportunities

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

- [sales-deals-populated.png](../../../testing/evidence/department-navigation/sales-deals-populated.png)
- [ppo-deal-pipeline_r38.html](../../../reference/ui/crm/ppo-deal-pipeline_r38.html)

## Behaviour, handovers and verification

The draft User Guide `guide.cr.04` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Native Sales implementation contract

Review stage history, next-action coverage and close-date movement over the same permitted result page as Deals.

- Board, List, Forecast and Archive preserve their existing controls.
- Pipeline insights expands above the existing worklist.
- Coverage distinguishes known/unknown values and next-action states.
- Deal drill-through links retain the selected worklist URL.

Choose pipeline, company/site, owner, outcome and search filters. Read the observation time, count basis and complete/partial state before interpreting totals.

The denominator is the returned page, not a whole-company forecast. Amounts are unweighted AUD excluding GST; null is not zero. Stage ageing uses recorded entry time. Date movements compare recorded snapshots; positive moves accumulate as slipped days. Missing history stays unknown.

Insights are read-only arithmetic over authorised facts. No probabilities, forecast categories or financial policy are adopted.

Desktop: retain the current shell, Roboto/Verdana and navy/green tokens. Reuse PageHeader, Button, Field, SelectField, RecordTabs and error/status controls. Keep review decisions after the brief, immutable history separate and long reasons wrapping. Inspect at 1440 × 960 and 1024 × 768.

Mobile: stack fields/actions, keep every tab reachable and contain table/history overflow. Inspect at 390 × 844, 320 CSS px and 200% zoom; keyboard focus and recovery state must stay visible.

Loading, empty/filter-empty, partial, failed, denied, read-only, validation, saving, saved, uncertain and source-changed states remain explicit. The guide `guide.cr.04` carries normal and recovery steps.

Retained reference: `docs/reference/ui/crm/ppo-deal-pipeline_r38.html`. Missing mobile reference images are explicitly unprovided. The current shell and server authority govern departures from demonstration HTML. ES-05/06/07, agreements and automatic downstream effects remain unavailable under ADR-0046. Actual paired captures and differences are recorded in `docs/delivery/sales-native-completion-handover.md`; acceptance is pending.
