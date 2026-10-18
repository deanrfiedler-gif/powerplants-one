# Remote diagnosis and OEM escalation — design reference

Stable entry: `scope:SV-08`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/service/escalations`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement remote diagnosis and OEM escalation with exact configuration, attempted troubleshooting, response evidence and owned next actions.

1. Record diagnostics already attempted and their results
2. Prepare the relevant configuration/evidence for escalation
3. Review the response and own the next authorised action

## Desktop

Accepted design: the [Remote diagnosis and escalation design decision](../../../decisions/escalations-figma-design.md) of 18 October 2026, with captures 01–04 (desktop 1440 × 900) and 05 (tablet 1024) in [design r01](../../../reference/ui/service/escalations-design-r01/README.md). No route, read model or service exists yet; this design defines the build.

- **Place:** Escalations sits beside Findings in the Service review workspace. The side menu gains an Escalations group (Open cases, Diagnosing, Waiting on manufacturer, Reply to act on), and History splits into Closed findings and Closed cases (D2).
- **Register:** one row per case with Case, Fault, State, Owner and Next step; Owner and Manufacturer filters; the count with its read time. States are always in words: Diagnosing, Waiting on manufacturer, Reply to act on, Closed, or withdrawn (D1).
- **Case record:** its own number, SYN-PPO-ESC-…, linked to its finding and equipment (D3). A readiness bar ("Before sending", then "Before closing"), a details column with the equipment's warranty end (Q4), and tabs Diagnosis, Configuration, Evidence pack, Correspondence and History.
- **Diagnosis and configuration:** each diagnostic tried with who, when and the result. Controller settings are captured read-only, because they belong to the grower (D4).
- **Evidence pack:** HTML and PDF with hashes, reviewed before it can be recorded as sent. Customer contact details and prices are always left out (D5).
- **Record as sent:** PPO sends nothing. A named person sends the pack from their own mailbox or the manufacturer's portal, then records who, how, when, the manufacturer's reference and when a reply is expected ([D-025](../../../decisions/customer-communications-d025.md), [ADR-0058](../../../decisions/ADR-0058-outbound-customer-email.md); D6). The reply-expected date drives a chase reminder in My Work, with no automatic message (Q2).
- **Reply to act on:** the reply is recorded as received, with its attachments. Create finding and next action turns the advice into owned work in My Work; settings changes still need the grower's approval. Closing the case does not close the finding (D7).
- **Who:** Service coordinators and senior technicians open and record cases; the sender is always a named person (Q1). Manufacturers and their support routes come from a maintained list taken from equipment records (Q3).
- **Shell:** the proposed Conversations action sits left of the information icon.
- Nothing is built.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 06–09 in [design r01](../../../reference/ui/service/escalations-design-r01/README.md). The list shows the fault, case number and manufacturer, the state and owner, and a note (Not sent, the sent date, or Replied); "chase today" shows the reminder. The case opens on the Reply tab, with Diagnosis, Pack and History beside it; the next action shows its owner, the finding created with it and "Customer details · left out". Create next action stays in the footer at 390 and 320 px. Three states: loading, no open cases with Show closed cases, and could not load with no list or counts. The phone Diagnosis tab and denied access are not drawn, and the phone header cuts the case title short, so the build has to settle how the full title is shown.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Accepted Figma design: [Remote diagnosis and escalation design r01 captures](../../../reference/ui/service/escalations-design-r01/README.md) (nine icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/escalations-figma-design.md). The page sits beside SV-07 Findings, recorded in the [Findings design decision](../../../decisions/findings-figma-design.md) and the [SV-07 page notes](scope-sv-07.md). No HTML reference exists. Images of the Configuration, Evidence pack and History tabs in full, withdrawing a case, a closed case, the pack preview, the phone Diagnosis tab, denied access and 200% zoom are still missing.

No exact image or HTML reference is linked. Keep this gap visible.

## Behaviour, handovers and verification

The draft User Guide `guide.sv.08` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
