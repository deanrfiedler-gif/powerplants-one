# Customer message record — working page contract

<!-- versioning: git; committed history is authoritative -->

Stable scope: `scope:EC-04`. Owner: Dean Fiedler. Application: `/email/customer-messages` and `/email/customer-messages/[id]`. Source design: owner accepted 22 October 2026, named version "Customer messages — accepted". Application visual review: **Needs review**; no review fingerprint is assigned.

## Purpose and task

Review the exact customer-safe message prepared by native Supply (M1/M2), then confirm as a named authorised sender, withdraw before hand-over, or reconcile an unknown simulated outcome. No provider, mailbox or customer is contacted. Parent CRM-03, DOC-05, OUT-17, TR-03, PRJ-07, SCM-07, SCM-08, SVC-05 and NFR-11 remain unchanged; AT-25/AT-36 acceptance is separate.

## Desktop

Follow [accepted D1–D8/Q1–Q4](../../../decisions/customer-messages-figma-design.md) and [28 retained captures](../../../reference/ui/email-calendar/customer-messages-design-r01/README.md). At 1440 use the existing Sales Inbox rail, 240 px Email side menu, compact register toolbar and shared RegisterTable. The snapshot replaces the list content with recipient/source facts left and the exact message/review card right. Full record uses that same layout. At 1024 the shared secondary menu collapses; the rail retains its current shared state (expanded in the recorded capture), a recorded difference from the accepted icon rail; the grid retains horizontally scrollable columns. No page IDs are added to shared CSS lists; SecondaryMenuFrame opts in with `data-ppo-workspace="shared"`.

Message, Class, State, Customer, To, Source, Prepared and Owner use bound facts. To send includes Prepared; Needs follow-up includes Held/Failed/OutcomeUnknown. All messages includes terminal states. Counts, search, class/customer/date filters cover the disclosed 200-candidate read window only. Source access is checked for every returned row. No M3/M4 examples are fabricated.

## Mobile

At 390 and 320 use the shared compact header with Choose view and combined search/filter behaviour. The list becomes labelled rows; exact records stack flush sections. The main confirmation/reconcile control is full-width and at least 48 px in a fixed action bar above phone navigation. Confirmation and filter dialogs become sheets with white bodies and grey headings. More exposes withdrawal separately; no resend is offered. Longer source/time/hash facts wrap rather than clip. Keyboard, focus return and 200% zoom need explicit evidence.

## Shared components and states

Reuse SecondaryMenuFrame, shared phone header, Button/ButtonLink, RegisterTable/Chip/Footer/Empty, WorklistPanel and ErrorNotice/useResource. The dedicated [consumer binding](../component-bindings/2026-10-31-customer-messages.md) records fixtures, states and unresolved alignment. Loading or failed reads expose no stale actions/counts; denied sources are unavailable. Confirmation restates recipient, subject, exact content check, template and signed-in sender. M1–M3 note is optional; Reviewed approval note, withdrawal/reconciliation and switch reasons are required. Native command checks remain authoritative.

Held/Failed retain prepared content dimmed with follow-up primary. OutcomeUnknown offers Check Sent Items only. Uncertain saves retain the original operation across reloads within this tab and offer Check original result; they never generate a second operation. Switches are Off/Synthetic only and versioned. Restoring a grant or switching on does not resend a held message.

## Visual references

Desktop: captures 01–04 and 06–11; tablet: 12; phone: 13–21; refusal/read states: 22–28. The images are retained design compositions, not application evidence. No HTML reference exists. Phone follow-up records, classes and 200% zoom are not drawn; their adaptations remain unaccepted.

## Behaviour, handovers and verification

The [API contract](../../../contracts/customer-communications.md#ec-04-customer-messages-page) owns duties, versions, source rules and recovery. Demand handovers use material readiness, people use their existing records, follow-ups use `/work/[id]`. Template management is unbuilt on the integrated base: show the retained template version/hash and unavailable handover. No guessed work-order relation, line counts, template publisher or mailbox status is displayed.

Guides `guide.ec.04` and both route guides describe the same actual workflow and stay Draft. [Execution and comparison evidence](../../../testing/evidence/customer-messages/README.md) separates functional proof, inspected visual comparison, unresolved design differences, owner acceptance and deployment. No accepted visual review or production readiness is claimed.
