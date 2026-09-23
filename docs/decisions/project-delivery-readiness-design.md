---
document_id: PPO-012-READINESS-DES
date: 2026-09-15
owner: Dean Fiedler
status: Authorised standalone design for review; native visual review and application integration pending
source_commit: bc1dcf21490dda37979227f5fc13224183853d5a
versioning: git
---

# Projects — Delivery Readiness & Change Control

The [r01 interactive HTML](../reference/ui/projects/PPO-Project-Delivery-Readiness-and-Change-Control-r01.html) implements the authorised six-view workspace from the [preserved build plan](../reference/ui/projects/PPO-Project-Delivery-Readiness-and-Change-Control-Plan-r01.md). It answers three questions: what is stopping delivery, what a proposed change affects, and who needs to decide or act next.

This is a standalone design contribution under [issue #12](https://github.com/deanrfiedler-gif/powerplants-one/issues/12), with receiving dependencies on [Engineering #11](https://github.com/deanrfiedler-gif/powerplants-one/issues/11) and [Supply #13](https://github.com/deanrfiedler-gif/powerplants-one/issues/13). It changes no application route, database, dependency pin, hosted service or business adapter. It is not an accepted application baseline. Existing UI baselines and all issued predecessor designs remain unchanged.

## Basis and architecture decision

The user authorised this build on 15 September 2026 and supplied the plan and r20 style board. Main was checked before the build and before handover: `bc1dcf21490dda37979227f5fc13224183853d5a`, tree `7602fe7590137749ae9b0df29cada58eb44d04a9`.

Retain the repository's standalone HTML/CSS/JavaScript approach for this review. A small synthetic model separates rules from view rendering; a deterministic assembly script embeds that model, the UI, CSS and three Roboto faces. This meets the requested portable HTML constraint without a new framework, runtime install or integration. A framework application and durable services are deferred to separately scoped receiving implementation. The [source and rebuild instructions](../design/projects-delivery-readiness/README.md) identify the stable working file and frozen issue procedure.

The governing contracts are [BP-06](../blueprints/BP-06-projects-commercial-delivery.md), [Projects Gantt integration](projects-gantt-integration.md), [J1 reconciliation](../delivery/projects-j1-reconciliation.md), [Supply readiness](../contracts/supply-chain-readiness.md), [Engineering integration](engineering-r02-integration.md) and [F05/F06/F08](../requirements/product-quality-register.md). Parent scope remains PRJ-02/03/04/05, SVC-03/05, ENG-06, SCM-08, FIN-03 and NFR-01/09. No parent is closed by this design.

## Visual application of r20

The supplied r20 files `(3)` and `(4)` are byte-identical: SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`. They were read locally and preserved. Only three embedded Roboto font faces were extracted (63,632 characters before separators); the 16 MB board is not copied into the review.

| r20 rule | Authored behaviour |
|---|---|
| Module beneath a shared shell | Removable preview context header; compact project, customer/site, work-package, affected-area, coordinator and source-time strip; six tabs. No duplicated global left navigation. |
| White working surfaces over light grey | `#f5f6f8` workspace, white cards/registers, `#242a37` selection/actions, `#62bb46` tab underline, restrained labelled warning/danger states. |
| Typography and density | Embedded Roboto 400/500/700; 24 px page context, 20 px record heading, 18 px sections, 14 px controls/body and 12 px metadata; 24/16 px outer spacing. |
| Controls and choice cards | 6 px controls; native selection and keyboard behaviour, with 14 px picker surfaces on browsers supporting `base-select`; platform-native fallback otherwise. |
| Side panels | Square-edged 448 px Snapshot, 480 px Assistant; Page guide and Demo controls share the position. Only one panel opens. Dock when at least 440 px remains for content; otherwise use a modal overlay with inactive background and a focus loop. |
| Focused decisions | 10 px native dialog; exact local effect and owners; source inspection can suspend and resume entered response text. |
| Programme | Matched Gantt/List model, current/proposed dates, labelled confirmed bookings, 20 px task bars and 13 px milestones, dependency warnings in writing; no automatic cascade. |
| Responsive composition | Container-based two-column comparison at 820 px, queue/detail at 700 px, phone register/action cards, phone List default and full-width panels; 44 px principal phone controls. |

These are authored rules, not a claim of native visual acceptance. The preview browser denied local HTTP and file access. Screenshots, actual 200% zoom, native focus, printed pagination and physical-device checks remain outstanding in the [verification record](../testing/project-delivery-readiness-review.md).

## Connected workspace behaviour

| View | Implemented review behaviour |
|---|---|
| Overview | Four summary cells open matching registers/views; prioritised attention, next dates, source coverage and customer shutdown context. No overall readiness percentage. |
| Readiness | Six prerequisite categories, text/state/category/owner/attention filters, collapsible groups, keyboard/pointer column widths, exact source snapshots and owned clarification. Full-scope assessment stays independent of display filters. |
| Programme | Shared Gantt/List tasks and undated handover, Fit/Week/Month/Today, current/proposed comparison, FS/SS and weekend explanations, manual date form. Service appointments remain independent. |
| Changes | Queue/detail, retained proposal edits, linked-source validation, immutable captured comparisons, three investigated response options, role-owned specialist responses, reasoned returns, guarded request confirmation and retained review history. |
| Actions | Clarification completion with outcome, reasoned reassignment, receiving acceptance/return/refusal, same-identity resubmission and original receipt recovery. Completion never clears a readiness blocker by itself. |
| Evidence & history | Current/superseded source revisions, before/after history, exact captured comparison inspection, role-visible review download/print and retained internal notes. |

Proposal edits invalidate prior proposal reviews; a source revision invalidates only reviews that depend on that source, while every execution confirmation still requires a current full comparison. A current forecast update accepted within the same request set can be recognised by its sibling receiving requests; an arbitrary manual forecast revision is a changed basis. Missing sources, missing reviews, unsupported staging and unassessed alternative compatibility block execution requests. Clarification remains available while investigating.

Fail-before-acceptance creates no requests. Lost-response-after-acceptance records one receipt and requires recovery of that original result. Repeated confirmation of a captured comparison returns its original request set. These receipts exist in page-session memory only; they are not evidence of database/HTTP idempotency.

Assistant responses are scripted from the selected source. Stop/retry, contextual unknowns, source stamps, editable notes and explicit reviewed local application are implemented. No AI provider or external action is connected. Commercial source text, values, subtotals, specialist comments and commercial-source notes are hidden from the Delivery viewer and other restricted roles, including the generated review content. All underlying data is synthetic; a static role switch is not secure access control.

## Synthetic fixture and identity

The customer/location r03 fixture supplies Willowbank Horticulture, the Nursery & propagation site and pump `SYN-PPO-AST-000501`. Its exact UUID is `33000000-0000-4000-8000-000000000501`; it is installed in Irrigation Shed 01 (`…000406`) and serves Greenhouse 01, Tunnel 01 and Propagation House 01 (`…000401/402/403`). Those service relationships do not prove independent isolation or hydraulic capacity.

New fixture project `SYN-PPO-PRJ-024001` has an original 21 September 2026 pump promise, a revised 5 October promise, a 23–25 September installation forecast and appointment `SYN-PPO-APT-024001` confirmed for 28 September. The separate valve shipment has demand 10 EA (project 6, Service 4), receipt 8, quarantine 3, usable 5, usable allocations 3/2 and unmet demand 3/2. Known fictional commercial lines are AUD 480 freight plus AUD 720 remobilisation, ex GST; other effects and customer variation remain unknown.

The September shutdown agreement is **new project-specific synthetic evidence**, beyond the customer workspace's earlier missing-window record. It does not retrospectively alter that original source. The optional successful-response scenario adds a 6–9 October agreement, crew availability/competency evidence and preparation-owner successor pack r03; it retains the original agreement, pack r02 and its acknowledgement. The site's timezone remains `Australia/Melbourne` (AEST on the fixed demonstration date, 15 September); October display uses dates and the site timezone rather than inventing an October AEST timestamp.

New review/action UUIDs use the separate `44000000…` synthetic namespace. `DEMO-CHG-024001` and `DEMO-ACT-024001` are local demonstration labels, not new entries in the PPO business-reference type catalogue or server-allocated references. No ledger counter is implemented. The second project, `SYN-PPO-PRJ-024002`, demonstrates partial survey evidence with no assessed blockers; its zero blocker count is not Ready.

## Suggested first review

1. Open the HTML in a modern browser. Start with **Review next blocker**, inspect the pump source and then open its change review.
2. In **Changes**, capture the proposed 6–8 October installation / 9 October visit comparison. Inspect the current versus proposed dates and all affected items.
3. Use **Demo controls** to choose Engineering, Supply, Service and Commercial in turn. Record a reasoned response in each role; switch back to Coordinator.
4. Choose **Review follow-up requests**, check owners/dates/effects and create the three local requests. The booking has not moved.
5. As Service, return the scheduling request with a reason. As Coordinator, add compatible October evidence, refresh the comparison and obtain a renewed Service response. Resubmit the original scheduling request with its correction reason.
6. As Service, accept that resubmitted request. Only then does the synthetic visit change to 9 October. Inspect the original 28 September source and returned submission in history.
7. Separately try source advance after preview, missing source, fail-before-acceptance and response-lost-after-acceptance. Export an earlier comparison and repeat as Delivery viewer.

## Review and receiving limits

Eleven model groups and fifteen DOM simulation groups passed on the issued source. Those checks cover the central return/resubmission journey, quantities, source races, duplicate prevention, role visibility, escaping and panel-mode rules. They do not render a native browser. No fresh browser captures are supplied, and no earlier repository capture is reused as evidence for this page.

Native desktop/phone/320 px/200% zoom review is still required before visual adoption. Actual API permissions, durable receipts, concurrency, restarts, source adapters, operational technical review, real calendars, stock posting, document issue, customer communication and financial authority remain separate receiving work. No recurring monitor, automation, customer portal publication or deployment is included.
