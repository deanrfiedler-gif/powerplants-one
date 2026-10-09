# Activity detail — design reference

Stable entry: `route:/work/[id]`. Owner: Dean Fiedler. Status: **Owner visual review 9 October 2026: Refine**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/work/{id}`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

This page address exists in the inspected application source. Open it from a running app using an identity with the required access.

1. Confirm the record reference and customer/site context in this record workspace.
2. Choose Overview, My actions, Reviews & handovers, Blocked & waiting or Team queue
3. Narrow the list to the relevant owner and work
4. Open the activity and record an outcome when completing it

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

- [PPO-My-Work-and-Action-Centre-r01.html](../../../reference/ui/my-work/PPO-My-Work-and-Action-Centre-r01.html)

## Behaviour, handovers and verification

The draft User Guide `guide.page.work.id` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Scheduling Step 4 integration

Preserve this entry's scope ID and page type. Reuse shared fields, Button, ReadState/ErrorNotice and existing appointment/planner controls. Incoming handovers: exact published selection, immutable impact, retained booking pin and owned Activity. Outgoing handovers: controlled appointment/resolution receipt and refreshed readiness; customer, pack, Finance and issued documents retain their separate authority.

Desktop must show the impact reason, responsible owner, source publication and permitted next action. Booking preparation follows the proposed interval and publication head, including future policies; stale saves retain entries and need fresh review. Completing an Activity or acknowledging a pack cannot clear the policy hold. Later source changes restore it. The appointment's online resolution disclosure requires controlled change/cancellation/replacement and fresh evaluation. Uncertain responses retry the original unchanged.

At 390/320 px, stack fields/actions, wrap exact identifiers and keep hold/recovery text readable without horizontal overflow. Retain keyboard alternatives to drag and native disclosure/label semantics. Delayed offline Start is rechecked on reconnect and may remain ReviewRequired with original evidence retained. Publication and resolution are online only. No Step 4 issued mockup is available; the existing retained HTML remains the source reference. Additional content is a proposed visual departure pending owner review. Functional evidence: `docs/testing/evidence/scheduling-policy-enforcement/README.md`; captures and source checks do not grant visual/device/owner acceptance.

## FI-06 corrective handover

An incident-owned Activity provides Return to incident and corrective evidence from its stored association when current incident access permits it. Activity completion remains separate from evidence acceptance, incident closure and hold release. No restricted instruction or evidence is copied into the Activity. The native link uses the existing record layout at desktop/phone widths; retain keyboard focus and wrap the explanatory text. Compiled fixture: tests/browser/field-incidents.spec.ts. Independent review remains pending.

## FI-07 receiving handover

A permitted report follow-up exposes Return to original service report and response. Existing Activity owner/due update and owner completion commands retain history; completing contact does not rewrite a customer response or close an incident/defect. The reverse link independently checks current report scope. See the FI-07 contract and evidence.

## LC-17 reviewed follow-up back to Sales

Preserve the existing scope and r20 page type. Incoming context is an owned native Activity from Project delivery, Service/aftercare or Maintenance/renewal. Reuse Button, Field/SelectField, LocalDateTimeField, RecordLink, ErrorNotice, the existing Lead modal, native Deal form and actor-bound command journal. Original Activities, native qualification and receiving acknowledgement remain separate authorities.

From Project Sales context, record a customer need as an Internal CustomerContact Activity with an owner and date. In Activity detail, review existing Sales records, choose Lead or qualified Deal, independently capture through the native form if needed, then return for a fixed comparison and explicit link. A restricted, technical or completed original can create a separate Internal RelationshipReview with reviewed wording and its own date; preserve original restrictions and history. A Lead link can then open native next-action planning with the retained Activity selected. Qualification and the Deal initial action are never inferred. Aftercare receiving still requires its separate confirmed Deal reference.

Desktop: show original native links, current customer/site, Activity version/state/date, selected Sales reference/version and separate source attribution. Refresh cannot advance a frozen comparison. A stale save changes no record; discard and compare again. Unknown creation/link results expose original lookup and exact retry; permission loss clears protected comparisons. Project content remains in the existing dialog to preserve Gantt geometry.

Phone: stack fields and recovery controls, wrap names/references, retain readable labels and reachability of native modal actions. Keep the source context and all required review choices visible at 390/320 px. Preserve Escape/return-focus of the existing Project dialog. New LC-17 state mockups and accepted images are missing; this is a proposed host adaptation pending paired visual, keyboard/zoom, physical-device and owner review. Functional checks are recorded separately in `docs/testing/evidence/sales-followup-continuity/README.md`; no accepted fingerprint is supplied.

## NAV contextual navigation

A loaded permitted Activity can return to the exact Acceptance stage and obligation fragment through bounded returnTo. Missing/denied targets do not expose the original identity.

Desktop uses the existing shell with a 76 px compact or 232 px labelled primary rail. Mobile uses labelled destinations and More > Workspace; Home/search/help remain reachable. Check 320/390/780/781/1199/1200 px where applicable, long labels, visible focus and Escape/return focus. Missing accepted images remain explicit; no new accepted image or review fingerprint is recorded. Functional results and screenshot observations are in the NAV ledger; owner/device review and deployment remain separate.

## Owner visual review — 9 October 2026

- **Reviewer:** Dean Fiedler. He accepted Claude's proposed verdicts from the phase 00 review boards (navigation canvas version 29).
- **Result:** Refine.
- **Evidence:** [phase 00 review, session 1](../../../testing/evidence/ui-review-phase-00-r01/README.md). Synthetic data; compiled build at `a52cb01`; 1440 × 900 and 390 × 844 headless Chromium, captures for this entry.
- **Findings:** S8 and S6. An overdue activity does not say it is overdue. Linked records show as raw numbers first, names second.
- **Scope of this record:** visual review of the captured state only. Device, screen-reader, zoom and operational acceptance remain separate. A later source change marks this review stale.
