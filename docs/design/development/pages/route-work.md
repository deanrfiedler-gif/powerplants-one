# My Work · Overview — design reference

Stable entry: `route:/work`. Owner: Dean Fiedler. Status: **Owner visual review 9 October 2026: Refine**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/work`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

This page address exists in the inspected application source. Open it from a running app using an identity with the required access.

1. Confirm the active identity and workspace
2. Review overdue work before future commitments
3. Open the underlying record to understand the next action

## Desktop

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

Accepted design (12 October 2026): the [My Work page decision](../../../decisions/my-work-page-design.md), with capture 01 in [My Work page design r01](../../../reference/ui/my-work/my-work-page-design-r01/README.md). The first application increment is authorised on 13 October and described below; other My Work screens remain a separate implementation increment.

- **Layout at 1440 × 900:** the department rail with My Work selected; the breadcrumb "My Work" (shell top bar amendment, 16 October 2026); the flush secondary menu with the six views and their counts, then Pinned views. Toolbar: View: Today's focus, owner, Filters, "updated hh:mm AEST", refresh, + Activity and "…" (Refresh now, Save or manage views…, Customise overview, Open calendar, Full activity form). The greeting and the department chip are removed.
- **Summary strip:** Overdue, Due today, Waiting on others and No next activity, flush under the toolbar; each cell opens its view, and an unread count shows "—", never zero.
- **Main column:** My activities (overdue and today, eight at most) in one-line rows: a done ring that opens Record outcome, the type icon, the title with the full width, the linked-record tag and context, timing and "…" (Reschedule or Set date, Open activity page). Then the Date needed and Reviews notices.
- **Side column:** Today's weather (proposed; shown only when a provider is connected), Today's schedule, Waiting on others and Needs a next activity, all with one heading pattern (title, count, link).

## Mobile

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

NAV repair: the overview header reads **My Work** and marks it current, without a redundant hidden Overview crumb. Subviews retain their identity and Page hierarchy disclosure. The Sales phone bar keeps five labelled cells and scoped Activities on the current local day; personal agenda links retain their separate meaning. The existing native phone fixture checks header geometry and the source-backed overview. [Screenshot inspection](../../../testing/evidence/pr366-pr367-repair/screenshot-review.md) records an actual 390 px synthetic read; it does not grant owner, device or zoom acceptance. No new issued mockup is available.

Accepted design (12 October 2026): capture 09 in [My Work page design r01](../../../reference/ui/my-work/my-work-page-design-r01/README.md).

- **At 390 × 844:** the page name only in the header; the weather row and its site warning when a provider is connected; Quick actions Emails, Leads and Tasks with their names (Map and Insights hidden until they exist); Needs attention; This week; Today; Waiting on others. Flush lists, the icon-only tab bar with My Work current and the floating Create button.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [PPO-My-Work-and-Action-Centre-r01.html](../../../reference/ui/my-work/PPO-My-Work-and-Action-Centre-r01.html)
- Accepted Figma design: [My Work page design r01 captures](../../../reference/ui/my-work/my-work-page-design-r01/README.md) (icon-free PNGs; design compositions, not application captures). The earlier references above stay as historical design records.

## Behaviour, handovers and verification

The draft User Guide `guide.page.work` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## SH continuation

Retain the existing desktop/phone My Work structure. Review and notification counts now follow shared source projections and qualify unavailable or bounded data. Personal view editing retains existing IDs and supports explicit criteria updates; team sharing remains Not configured. See [SH handover](../../../delivery/sh-platform-handover.md) and [verification](../../../testing/evidence/sh-platform/README.md). Merged shell controls require fresh integration review; no fingerprint or approval is added.

## Scheduling Step 4 integration

Preserve this entry's scope ID and page type. Reuse shared fields, Button, ReadState/ErrorNotice and existing appointment/planner controls. Incoming handovers: exact published selection, immutable impact, retained booking pin and owned Activity. Outgoing handovers: controlled appointment/resolution receipt and refreshed readiness; customer, pack, Finance and issued documents retain their separate authority.

Desktop must show the impact reason, responsible owner, source publication and permitted next action. Booking preparation follows the proposed interval and publication head, including future policies; stale saves retain entries and need fresh review. Completing an Activity or acknowledging a pack cannot clear the policy hold. Later source changes restore it. The appointment's online resolution disclosure requires controlled change/cancellation/replacement and fresh evaluation. Uncertain responses retry the original unchanged.

At 390/320 px, stack fields/actions, wrap exact identifiers and keep hold/recovery text readable without horizontal overflow. Retain keyboard alternatives to drag and native disclosure/label semantics. Delayed offline Start is rechecked on reconnect and may remain ReviewRequired with original evidence retained. Publication and resolution are online only. No Step 4 issued mockup is available; the existing retained HTML remains the source reference. Additional content is a proposed visual departure pending owner review. Functional evidence: `docs/testing/evidence/scheduling-policy-enforcement/README.md`; captures and source checks do not grant visual/device/owner acceptance.

## Owner visual review — 9 October 2026

- **Reviewer:** Dean Fiedler. He accepted Claude's proposed verdicts from the phase 00 review boards (navigation canvas version 29).
- **Result:** Refine.
- **Evidence:** [phase 00 review, session 1](../../../testing/evidence/ui-review-phase-00-r01/README.md). Synthetic data; compiled build at `a52cb01`; 1440 × 900 and 390 × 844 headless Chromium, captures for this entry.
- **Findings:** Desktop: activity titles wrap to three lines because the Complete and Reschedule buttons take the row width; give the title column priority. The count badge in 'Needs a next activity' drops to its own line, unlike the other cards. Phone: the 'Weather is not connected' card takes prime space for a feature that is not configured; hide it until connected. Phone: the five quick actions are icons without labels. S3.
- **Scope of this record:** visual review of the captured state only. Device, screen-reader, zoom and operational acceptance remain separate. A later source change marks this review stale.

## Refinement batch 2 — 9 October 2026

Built from the accepted canvas proposal ([decision](../../../decisions/ui-build-sequence.md#owner-decisions-9-october-2026)).

- **One date format (S6):**
  - row times are 24-hour;
  - dates carry the year;
  - an overdue row keeps its date beside the count ("35 days overdue · due 4 Sep 2026");
  - the heading date reads "Fri 9 Oct 2026";
  - the schedule says "Times in AEST (UTC+10)";
  - the footer reads "Updated 9 Oct 2026, 17:19 AEST".
- **Count badges:** they stay on the same line as their panel heading.
- **Phone:**
  - the weather card is hidden until a weather provider is connected;
  - the five quick actions show their names under the icons;
  - the agenda header carries the year ("5–11 Oct 2026").
- **Page guide (S9):** the information icon opens the My Work guide (`src/activities/work-guide.ts`). It stays a draft until Dean reviews it in the running app.
- **Review state:** the 9 October review is stale until Dean looks at the built page again.

## Figma application increment — 13 October 2026

The [implementation decision](../../../decisions/figma-ui-implementation.md) records the exact inspected Shell v2 and My Work source frames, SH-01/SH-02 scope, r20 Overview / dashboard type, shared components and source-command handovers. The [execution ledger](../../../testing/evidence/figma-ui/README.md) separates compiled functional proof, visual comparison and remaining owner/device review.

Desktop: 240 px labelled / 76 px compact rail; preserve the saved identity preference. The My Work secondary menu is 240 px, with a 20 px collapsed edge. At 1440 × 900, content starts at x=480; toolbar 60 px, summary 64 px, content gutters 24 px and side column 320 px. Narrower interiors stack side cards. Source-backed compact activity rows use a done ring for Record outcome and an actions menu for rescheduling. The page title and freshness no longer occupy a greeting block.

Phone: 390 × 844 and 320 px containment; current page heading, Emails/Leads/Tasks with labels, flush attention and agenda lists, accessible icon-only 64 px navigation and reachable Create. Unconfigured weather remains hidden. Preserve full details, unknown counts, permission checks, focus return and draft protection. Shared tokens come from the existing theme and the explicit Shell v2 palette in `src/app/styles/figma-shell.css`; overview rules are scoped in `src/app/styles/my-work-figma.css`.

Reuse the real application shell, SecondaryMenuFrame, ProductIcon/Icon, Menu and the existing Activity dialogs; no parallel renderer or new isolated fixture is claimed. The `figma-my-work-overview` host fixture and alignment item are in components.json and navigation-fixtures.json. Exact icon-free source images: `PPO-My-Work-01-Desktop-Overview-r01.png` and `PPO-My-Work-09-Phone-Overview-Actions-Activity-r01.png` in the retained My Work page-design capture set. Public standalone Shell v2 images are not supplied; the private inspected Figma frame and accepted module captures are the available reference. Runtime identity/guidance controls, unavailable counters and conditional weather are explicit adaptations. Other module interiors, My Work grids and detail/outcome overlay compositions still require their own implementation. Existing owner review fingerprints are preserved and stale; this edit grants no review.
