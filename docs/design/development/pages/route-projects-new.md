# Create project — design reference

Stable entry: `route:/projects/new`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/projects/new`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

An app page exists here. Its wider workspace scope or newer design still needs refinement; see the linked scope areas below.

1. Search the related register for an existing record before creating another.
2. Complete the information requested by the creation form; keep unknown values explicit.
3. Review the entered context, save through the page action and inspect the resulting record/confirmation.
4. Then continue the wider workflow: Create or accept the bounded project context through permitted controls

## Desktop

Accepted design: the [Project initiation design decision](../../../decisions/project-initiation-figma-design.md) of 31 October 2026 covers the worklist, receiving review, date runway, source check, create project, link decision, return to Sales, start checklist and Set Started, with forty-one icon-free captures in [design r01](../../../reference/ui/projects/project-initiation-design-r01/README.md). Captures 01–16 are desktop and 17 is tablet. The design is not built.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 18–23 in [design r01](../../../reference/ui/projects/project-initiation-design-r01/README.md): the review summary, raising a question and answering one at 390 and 320.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

NAV repair: after a confirmed ordinary Project creation, retain its exact receipt ID, disable the completed form and open that Project. A visible **Open saved project** continuation remains while navigation completes. The saved form is no longer an unsaved draft, so a subsequent React commit must not reinstall its leave guard. Failed/uncertain outcomes retain the draft and existing original-action recovery; Sales create-and-return keeps its independent receiving/binding controls. Fixtures: `tests/browser/projects-gantt.spec.ts`; paired owner/device acceptance remains pending.

## Visual references

- [Project initiation design r01 captures](../../../reference/ui/projects/project-initiation-design-r01/README.md) (accepted Figma design, icon-free)

## Behaviour, handovers and verification

The draft User Guide `guide.page.projects.new` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.


## Native Won receiving (LC-16)

Keep this existing scope and page type. Incoming handover: exact accepted Won Sales event; outgoing: independently created native Project or Service work order and a separately reviewed typed binding. The Deal reads native receiving state and the retained Activity separately. It does not infer delivery completion from acceptance, a link or an Authorised work order.

Reuse shared Button, Field, SelectField, ErrorNotice, recoverable command journal, existing native lookup controls and record guard. Preserve the native Project Gantt and Service scope/readiness layouts. Proposed addition: a scoped Sales-context panel, explicit fixed-version comparison and create-and-return actions. Existing native form buttons remain documented legacy controls; no new theme or navigation system is introduced.

Desktop and phone: wrap reported scope and references; show original Sales revision beside current native state, owner and version. Keep Review, link reason, discard and original-recovery actions visible in normal document flow. A refresh must not silently substitute a reviewed comparison. Denied comparison reads remove its protected content. Unknown Sales site requires an explicit native site choice and does not rewrite the accepted source. New Service intake and work-order creation save independently before link review; existing native scope and authorisation controls remain.

Exact new-state mockup/HTML images are missing. Retained module references above are baseline context. Implementation captures and synthetic checks are recorded in `docs/testing/evidence/won-delivery-continuity/README.md`; they do not grant paired visual, keyboard/200% zoom, physical-device or owner acceptance. Review fingerprints remain unchanged.

## PJ-01/PJ-02 backend continuation — 13 October 2026

The [backend contract](../../../decisions/project-overview-backend.md) joins exact native Sales receiving attribution, saved dates/baselines, phase counts, team, scoped RAID/actions and explained portfolio attention. Existing page types, shared Button/Field/dialog/Gantt controls, routes and scope IDs stay in place. Incoming handovers remain explicit accepted Sales events; outgoing actions remain native schedule, baseline, Activity, RAID and acceptance workflows. No new component or page is implemented here.

Desktop and phone consumers must show the selected versus latest baseline, site timezone, unknown forecast when tasks are undated, historical versus current Sales evidence, named receiving owner, restricted coverage and preview continuation. Counts describe all authorised matches for the displayed filters; page tokens are transient. No current flags is not a health score or completion approval. Keep missing/stale/loading/denied and uncertain native-save states accessible through the existing controls.

The [accepted Project record design](../../../decisions/project-record-page-design.md) and its exact icon-free captures remain the reference for the later page. Exact new API-state desktop/phone captures are missing. [Backend evidence](../../../testing/evidence/project-overview/README.md) does not grant visual, device, guide or owner acceptance. Review fingerprints stay unchanged.
