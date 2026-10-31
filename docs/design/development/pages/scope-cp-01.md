# Portal home, organisation/site selection and access — design reference

Stable entry: `scope:CP-01`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/portal`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement portal home, customer identity, permitted organisation/site selection and safe access recovery.

1. Sign in with the intended customer identity
2. Select only an authorised organisation/site
3. Use the configured recovery route for missing access

## Desktop

Accepted design: the [Portal home and access design decision](../../../decisions/portal-home-access-figma-design.md) of 23 October 2026 covers sign-in (placeholder until D-022), first visit, recovery, Home for one and two sites with Choose a site, a CP1-only Home, Help, Account and access, access changed, and the staff Propose portal access amendment, with twenty-eight icon-free captures in [design r01](../../../reference/ui/customer-portal/portal-home-access-design-r01/README.md). Departures D1–D19 and answers Q1–Q8 are recorded there. The portal uses its own shell (D1–D2), not the application shell described below. Nothing is built.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 15–23 and 27 in [design r01](../../../reference/ui/customer-portal/portal-home-access-design-r01/README.md): sign-in, Home, Choose a site and the account menu at 390 and 320, Help at 390, and seven phone states. The phone header is one 80 px row (D12).

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [Portal home and access design r01 captures](../../../reference/ui/customer-portal/portal-home-access-design-r01/README.md) (accepted Figma design, icon-free)
- [customer-portal-mockup.html](../../../blueprints/customer-portal-mockup.html) (earlier direction)

## Behaviour, handovers and verification

Accepted Figma design: [Portal home and access design r01 captures](../../../reference/ui/customer-portal/portal-home-access-design-r01/README.md) (twenty-eight icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/portal-home-access-figma-design.md). Support (CP-02), the Visits, Projects and Knowledge pages, a multi-organisation consultant, the phone Account and access page, 200% zoom and dark mode are not drawn. D-022, D-024, D-011 and D-012 stay open. Building it is not decided.

The draft User Guide `guide.cp.01` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
