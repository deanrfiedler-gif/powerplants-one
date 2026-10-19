# Connected inbox and record-linking review — design reference

Stable entry: `scope:EC-01`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/email`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Extend the synthetic inbox/record-linking journey into a provider-connected inbox with supported thread/privacy/recovery behaviour.

1. Read the message in its correct mailbox context
2. Link only the relevant permitted business record
3. Create an explicit follow-up when work is required

## Desktop

Accepted design: the [Emails design decision](../../../decisions/emails-figma-design.md) of 19 October 2026 covers the mailbox (`/email`) and the email thread (`/email/[id]`) at desktop, tablet and phone, with 22 icon-free captures in [design r01](../../../reference/ui/email-calendar/emails-design-r01/README.md). Departures D1–D8 and answers Q1–Q5 are recorded there: a three-pane mailbox with folders, views and linked-record filters, thread rows that show linked records or the link status, a reading pane with a Linked to card, suggest-then-select linking with reasons, a right-hand link panel across leads, deals, projects, service requests, work orders, organisations, people and sites, private-by-default sharing of one message on one record, and the mailbox status in the side menu. Sending stays an EC-04 proposal (Q1). Nothing new is built; the built synthetic page remains. Amendment A1, accepted the same day, adds sent email tracking (an eye with words on every sent email, a details popover or sheet, and a switch in the composer); its five captures are in [Amendment A1 captures (r02)](../../../reference/ui/email-calendar/emails-design-r02/README.md).

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 08–15 and 22 in [design r01](../../../reference/ui/email-calendar/emails-design-r01/README.md): the slim Email header without the global phone header (D8, Q5), the inbox at 390 and 320, the folder and filter sheets, the thread at 390 and 320 with a link strip and a floating Reply, the link sheet with suggestions and with search results, and three phone states.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [powerplants-one-email-r04.html](../../../reference/ui/email-calendar/powerplants-one-email-r04.html)

## Behaviour, handovers and verification

Accepted Figma design: [Emails design r01 captures](../../../reference/ui/email-calendar/emails-design-r01/README.md) (22 icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/emails-figma-design.md). Drafts, templates, the mailbox settings page, the composer at tablet and phone width, phone 320 states and 200% zoom are not drawn. The named Figma version waits for Dean's explicit yes.

The draft User Guide `guide.ec.01` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
