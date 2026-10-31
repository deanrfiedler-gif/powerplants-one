# Communication draft, approval and delivery review — design reference

Stable entry: `scope:EC-04`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/email/drafts`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement communication drafting, review, exact attachments, delivery status and history.

1. Prepare the message and verify recipient scope
2. Review exact attachment revisions and any required approval
3. Track actual sending and delivery outcomes separately

## Desktop

Accepted design: the [Customer messages design decision](../../../decisions/customer-messages-figma-design.md) of 22 October 2026 covers the outbound queue for customer notices at desktop, tablet and phone, with 28 icon-free captures in [design r01](../../../reference/ui/email-calendar/customer-messages-design-r01/README.md). Departures D1–D8 and answers Q1–Q4 are recorded there: a Customer messages group in the Email side menu (proposed route `/email/customer-messages`, D1), a register of messages with plain states, a snapshot with the recipient, the source facts and the exact email, Confirm and send through a dialog that names the sender, a second person to approve M4, held, outcome-unknown and failed follow-ups without a resend, and the class switches. Nothing new is built; the S2 API remains the only implementation.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 13–21 in [design r01](../../../reference/ui/email-calendar/customer-messages-design-r01/README.md): the compact phone header (D8, since adopted for every phone page), the To send and Needs follow-up lists at 390 and 320, the message with one full-width Confirm and send in a sticky bar, and the confirm, view and filter sheets.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Accepted Figma design: [Customer messages design r01 captures](../../../reference/ui/email-calendar/customer-messages-design-r01/README.md) (28 icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/customer-messages-figma-design.md). No HTML reference exists.

## Behaviour, handovers and verification

Accepted Figma design: see the [decision](../../../decisions/customer-messages-figma-design.md). SMS, M3 visit confirmations, correction messages, template publishing, My Work follow-up cards, phone records for M4 and follow-up messages, phone states and 200% zoom are not drawn. The named Figma version "Customer messages — accepted" was saved on 22 October 2026.

The draft User Guide `guide.ec.04` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.


## S3 backend consumer contract — 24 October 2026

[D-025 S3](../../../contracts/customer-communications.md#s3-native-dispatch-and-delay-notices) supplies native dispatch/delay drafts and versioned customer delivery evidence in PR #695. The source API exposes exact movement/outstanding quantities, fictional carrier/platform/tracking fields, the named contact, explicit customer ETA, immutable message-source hashes and sent-baseline evidence. Native commands use Demand versions and actor-private original-operation recovery; a sender still confirms the fixed CUS-EMAIL content.

Future controls must distinguish source evidence from email content and explicit customer ETA from supplier dates. Show SourceChanged, SenderUnauthorised and PriorOutcomeUnknown as held follow-up states; restoring a grant or editing a source does not send a held message. Withdrawal, source correction/reconciliation, fresh preparation and named confirmation are separate actions. The tracking URL is fictional. No new visible surface, accepted screenshot, UI wiring, visual review, business acceptance or deployment is claimed by this backend work.
