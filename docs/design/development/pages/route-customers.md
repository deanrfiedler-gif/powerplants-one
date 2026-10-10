# Customer register — design reference

Stable entry: `route:/customers`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/customers`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

An app page exists here. Its wider workspace scope or newer design still needs refinement; see the linked scope areas below.

1. Search for an existing organisation before creating another
2. Confirm contacts and sites belong to the correct organisation
3. Follow linked records to review relationship history

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

- [PPO-Customer-360-Workspace-r01.html](../../../reference/ui/customers/PPO-Customer-360-Workspace-r01.html)

## Behaviour, handovers and verification

The draft User Guide `guide.page.customers` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Bounded read performance

The organisation directory calculates relationship counts after selecting a page for text/reference/status/owner sorts. Numeric count sorts still use counts across the complete permitted population. Search, total rows, permissions, page order and visible counts retain their existing meaning. The focused retained-fixture comparison is in `scripts/quality-directory-proof.ts` and `scripts/quality-customer-browser-proof.ts`; see `docs/testing/evidence/product-quality-next/README.md` for measured results and limits. This query correction grants no visual or production acceptance.

## Directory link loading

The current directory consumer is `CrmDirectory`: CS-01/CS-02 Register/worklist with the existing desktop table and phone cards. Its record names, affiliation/count links, New and local context sections load destinations on activation. Shared shell and Contacts hub view links retain their separate behaviour. Exact hrefs, department context, permission checks and unsaved-work handling are unchanged. See [component contract](../components/crm-directory.md) and `tests/browser/directory-navigation.spec.ts`; source presence and automated proof do not grant visual or device acceptance.

## Shell destination loading — PT-27

ProductNavigation retains the original main prefetch policy on desktop and phone. Both experimental reductions are withdrawn after the retained trials failed to establish a repeatable improvement. The incoming Customers page retains its normal session, current-company checks, directory and saved-view reads; outgoing links retain their exact URLs, permissions, dirty-state guard and Back behaviour. The existing directory record-link activation policy remains separate. The shell host fixture captures prefetch observations without treating a lower request count as performance acceptance.

Desktop keyboard/pointer and phone touch fixtures are in `tests/browser/shell-loading.spec.ts`, `directory-navigation.spec.ts` and `navigation-safety.spec.ts`. The [loading evidence](../../../testing/evidence/pt27-loading/README.md) records source-specific timing and receiving outcomes. Geometry, fonts, labels, icons and accepted reference bytes are unchanged. No new mockup image is needed for this transport-only change; actual captures and existing references remain separate from owner/device/visual acceptance. Existing stale reviews are preserved.
