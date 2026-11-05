---
document_id: PPO-SHELL-CONCEPT-PROTOTYPE-DEC
title: Shell concept clickable trial
date: 2026-11-05
owner: Dean Fiedler
status: Desktop rail and header branding adopted. Wider prototype review and application implementation pending
source_commit: aeaaad5a8e13f5c9549b9763a8150413b1769ab9
versioning: git
---

# Shell concept clickable trial

Dean approved the recommendation to retain the navy rail, grouped flyout, command palette and snapshot, resolve the four high-priority audit findings, and build a clickable Sales plus demanding Service or Engineering workflow. His instruction was: "Proceed with your recommendation below." Service was selected because its scope-specific readiness, explicit authorisation and scheduling handover exercise more than ordinary record navigation.

This records a trial in the private Figma file **PPO - Shell concept**, page **Shell concept Acumatica trial** (`0:1`). Dean subsequently adopted the desktop logo and wordmark treatment, right divider, rail-footer control and active-workspace styling recorded below; this does not accept every trial screen, adopt a complete replacement application shell or supersede accepted module designs. All records, evidence, people and outcomes used for the trial are synthetic. File links and artwork are excluded from this public repository.

Dean subsequently requested: "Refine the phone navigation, information density and dialogs in Figma, then walk through the Sales and Service workflows and report any remaining issues." The second pass below records that work and its observed limits.

## Four findings resolved in the trial

| Finding | Drawn and connected behaviour |
|---|---|
| Snapshot content ran beneath its footer | A bounded, clipped body scrolls independently; its header and footer remain outside that scroll area. The original H snapshot body `21:7470` was corrected as well as the trial frames. |
| Preview and bulk selection shared one visual state | Clicking the Sunline deal name opens a blue-outlined preview with an empty checkbox. The checkbox separately creates a green checked row and a count/action bar. Clear selection retains the preview. |
| Only one desktop size, with no panel coexistence rule | Explicit 1440, 1280, 1024, 390 and 320 px compositions. The trial reserves at least 720 px for a docked main workspace; below 1200 px the snapshot overlays it. Below 768 px the trial uses a compact header and full-screen record/review views. Opening a preview from a pinned menu temporarily hides the menu; closing restores it. Laptop/tablet close returns preserve their viewport. |
| Save, recovery and Undo meanings were unclear | A predefined field edit walks Saving to Saved and supports Undo of that draft edit. Separate fixtures show failed-save retry, offline draft and newer-version resolution. Issue and send requires a named confirmation and ends at Queued, not delivered. The issued record has no success-toast Undo. |

The 768 px breakpoint and 72 px rail are trial geometry, not an amendment to the application's existing 780/781 px boundary and 76/232 px rails. Phone fixtures demonstrate the journey rather than the full accepted phone header/register control set. Reconcile those departures with the [phone header amendment](phone-header-amendment.md) and [phone register patterns](phone-register-patterns-amendment.md) before adoption.

## Reference and conformance

New section `64:8003`: **Shell refinement · clickable Sales + Service · 5 Nov 2026**. Start at `70:24595`; current rules are on `77:24568`. The original A-I concept frames remain available for comparison. Original save-related notes R10/Q6 were reconciled with the trial rules.

| Concern | Scope and handover |
|---|---|
| Shell | Existing `system:shell`, SH-01/SH-02; shared application frame around task interiors. No new parent requirement ID. |
| Sales | Existing Deals and Quotation destinations. r20 Register / list and Record / detail compositions. Register to preview to full record; command palette to Riverbend record to quotation. Issue/distribution authority remains with ES-05; the prototype performs no real issue or send. |
| Service | Existing `SV-03`, requirement SVC-02, `route:/service/work-orders` and `route:/service/work-orders/[id]`. r20 Register / list, Record / detail and short confirmation compositions. Follows the scope/readiness distinction in the [work order record decision](work-order-record-page-design.md). |
| Service incoming/outgoing | Synthetic request SYN-PPO-TKT-000103 and equipment SYN-PPO-EQ-000017 inform WO-000041 scope r02. Review evidence SYN-EVID-000041, record the criterion outcome, explicitly authorise r02, then hand off unassigned demand to Schedule. Authorisation is not an appointment, dispatch or permission grant. |
| Reuse | Existing concept Top bar `6:575`, collapsed rail `6:669`, expanded rail `6:786`, Sales flyout `8:370`, collapsed panel `8:396`, Deals content `8:1041`, Quotation content `9:1037`, docked menu `10:736`; existing colour variables and Roboto. Local trial buttons `65:14921`, `65:14924`, `65:14927` are instances throughout new content. Compact deal-row component `88:24907` has customer, scope, value/stage and next-activity text properties. |
| Departures | The concept's existing outline icons are retained as trial artwork. They are not the production Font Awesome mapping. Simplified Service cards, phone controls and compact register rows are proposed compositions. No component baseline or accepted reference bytes change. |

## Frame locator

| Journey | Nodes in this file |
|---|---|
| Sales browse, preview, checked, flyout, pinned, search | `64:8004`, `64:8876`, `64:9834`, `64:10792`, `64:11851`, `64:12742` |
| Full deal records and quotation | Sunline `73:23552`; Riverbend `73:24455`; quotation `64:13774`; preview from pinned `68:21512` |
| Draft edit/recovery | Edit `67:16108`; saving `67:16804`; saved `67:17485`; failure `67:18170`; offline `67:18855`; conflict `67:19540`; newer saved value `72:22866` |
| Issue and send | Confirmation `67:20239`; queued `67:20937`; issued record, delivery pending `75:23903` |
| Service | Register `66:14918`; blocked `66:15834`; evidence review `66:16754`; ready `66:17674`; confirmation `66:18594`; authorised `66:19514`; Schedule handover `66:20434` |
| Responsive desktop | 1280 x 720 preview `70:22386`, list `80:24568`; 1024 x 768 preview `70:23474`, list `80:24951`; 720 x 450 composition `70:24563` represents the space available at 200% on a 1440 x 900 viewport |
| Phone starts | 390 x 844 Sales `68:22469`, work order `68:22501`; short 320 x 568 Sales `68:22569`, work order `68:22601`. Each connects through review, ready, confirmation and authorised states. |
| Phone owning lists | At 390: blocked `89:24936`, ready `89:24953`, authorised `89:24970`; at 320: blocked `89:25176`, ready `89:25193`, authorised `89:25210`. |
| Phone record actions | At 390: blocked `89:25009`, ready `89:25042`, authorised `89:25075`, deal `89:25108`; at 320: blocked `89:25249`, ready `89:25282`, authorised `89:25315`, deal `89:25348`. |
| Phone confirmation / Schedule | Confirmation: 390 `73:25360`, 320 `73:25429`. Schedule unassigned work: 390 `89:24987`, 320 `89:25227`. |

## Phone and dialog refinement

- A list has one Menu entry. A record retains Back, its reference and More; More opens a separate record-actions sheet with workspace navigation, return to the owning list and Close actions. The duplicated bottom More controls were removed. Unsupported workspace buttons were removed from this bounded trial menu.
- Six compact deal rows retain customer, scope, amount/stage and next activity, including a text-labelled overdue activity. All six fit in the 390 x 844 view; the short 320 x 568 view scrolls. Scrollable record content sits above the fixed primary action. Authored phone action instances are at least 44 x 44 px.
- Service Back returns to a blocked, ready or authorised owning-list fixture matching the record. The authorised primary action opens Schedule unassigned work; returning from Schedule retains the authorised list fixture. No appointment is created.
- Four desktop dialogs fit their content. After the final visual pass, Service confirmation is 600 x 359, delivery edit 640 x 307, conflict resolution 640 x 359 and issue/send 640 x 379. Their scrims cover the whole shell. Cancel and Escape use the invoking history. The delivery action row is horizontal and its instruction explicitly describes Apply. Phone authorisation uses a fitted bottom sheet with visible consequences, Cancel and Confirm r02 at both sizes.

## Second-pass walkthrough

The following was exercised in the Figma player on 5 November 2026, separately from structural inspection. These observations prove fixed prototype transitions, not application behaviour.

| Journey | Observed result |
|---|---|
| Phone Sales at 320 x 568 | Deals to Sunline record, More to record actions, Open menu, Back to actions, Escape to the same record, then Back to the deal list. The menu return and dismissal retained context. |
| Phone Service at 320 x 568 | Menu to work-order list, blocked record, exact-scope evidence review, Record Pass, ready, authorisation confirmation, Cancel back to ready, confirmation again, authorised, Schedule unassigned work, then authorised work-order list. No cropped primary action or confirmation content was observed. |
| Desktop Sales draft | Delivery dialog to Saving to Saved; the displayed week became 8 December. Undo restored 1 December. The final smaller dialog and aligned action row were checked in the player. |
| Desktop Sales issue | Escape from issue confirmation returned to its invoking quotation. The saved 8 December path proceeded through confirmation to Issued / queued, with no delivery claim. |
| Visual inspection | Revised 390 and 320 deal lists, short work-order view, phone confirmation, desktop Service confirmation, delivery, conflict and issue dialogs were inspected. The conflict dialog comparison choices remain distinct. |

## Final visual-consistency pass

Dean requested a final pass on dialogs, phone typography and spacing, and consistency across Sales and Service. The following rules were applied to the existing editable trial on 5 November 2026; its source nodes, 66-screen scope and 461 destination actions are retained.

| Concern | Final trial treatment |
|---|---|
| Desktop dialogs | 24 px outer padding, 24/32 Roboto Medium titles, 13/20 reference text and 14/20 body/action text. A soft top rule separates the footer; actions align right, the primary is rightmost and Cancel precedes it. All controls are 44 px high. Conflict resolution places Keep reviewing, Use saved value and Keep draft in one contained footer. |
| Shared trial buttons | Existing primary/secondary/quiet components `65:14921`, `65:14924`, `65:14927` use 14/20 labels and 6 px corners. Phone instances retain 44 px height; inherited compact desktop controls retain their existing density. |
| Phone typography | 20/28 page and sheet titles; 16/24 section/status headings; 14/20 body and action labels; 13/18 supporting metadata. Record references use 14/20 in the compact header. Compact deal rows use 15/20 customer names and 13/18 supporting lines, replacing the prior 12 px details. |
| Phone spacing | 16 px content gutters, 12 px card padding and 8 px card corners. Record sections use a 12 px gap; compact deal rows retain an 8 px inter-row gap and 4 px line gap. Fixed bottom actions align to the content gutter. Sheet tops use 12 px corners and square bottom edges. |
| Status semantics | Blocked uses the existing warning tokens; ready to authorise uses information tokens; authorised uses success tokens. Sales qualification uses neutral tokens. Text labels remain explicit. Desktop and phone Service summaries share the same distinction. |

Final screenshot review covered all four desktop dialogs; 390 and 320 Sales lists; short-phone Sales and Service records; blocked/authorised Service states; the phone confirmation, record-actions sheet and Service list. The first render exposed unresolved cached token colours in some status panels and a two-pixel conflict-footer overflow. Both were corrected and the affected screens recaptured. The final inspected compositions have no material remaining visual inconsistency or clipped action.

The structural check found no horizontal text overflow in phone vertical containers and no phone action instance below 44 x 44 px. All text remains Roboto. The six sampled text/background token pairs measure 5.33:1 to 14.37:1, including warning, information, success and neutral status text. This is a bounded colour check, not a complete accessibility audit. The trial remains editable, with 4,252 text nodes and 2,138 instances across the 66 screens; the only image fills are 32 reused 32 x 32 logos.

The earlier player walkthrough remains the interaction evidence; this final pass changed typography, spacing, colours and footer grouping, then rechecked the graph. It does not claim a new full player or real-device test. Visual consistency is ready for owner sign-off on the represented examples. The following functional, coverage and adoption matters still prevent complete shared-shell sign-off.

## Adopted desktop logo and rail-footer direction

Dean adopted the recommendation to remove the top-left rail display control, align the Powerplants symbol with the navigation icons, and place expand/collapse in the rail itself. His instruction was: "My preference is to adopt your proposal for the desktop shell." The MYOB screenshots informed this decision; they are reference material, not a requirement to reproduce that product's navigation or visual styling.

The clickable trial now uses these specific desktop rules:

- The 36 px Powerplants symbol has its centre at x=36, aligned with the main navigation icons and footer arrow in both rail widths. The wordmark follows it in the header; the top-left toggle is removed.
- Settings and the rail display control occupy a fixed footer below an independently scrolling workspace list. A subdued divider separates the display control from Settings. The control remains 8 px above the screen bottom, including the 720 px and 768 px high studies.
- A right chevron expands the compact rail; a left chevron and **Collapse navigation** label collapse the expanded rail. Targets are 64 x 44 and 224 x 44 px respectively. Tooltip copy is **Expand navigation** / **Collapse navigation**; reference text is supplied, but interactive hover rendering and accessible semantics require application proof.
- The prototype contains 31 matching compact/expanded desktop pairs. Toggling retains the current screen and fixed record state; onward desktop links retain the chosen width. This is navigation between authored fixtures, not a persisted application preference. The 32 phone layouts and their Menu controls are unchanged.
- Expanded Service content fits the narrower workspace. Expanded Sales preview and pinned-menu layouts use a 140 px local search, compact action spacing and wrapped filter controls to keep the primary action reachable. The original concept masters remain available for comparison.

The trial reuses and derives local components from the original assets: aligned top bar `126:24992`, compact rail `126:25061`, expanded rail `126:25155`, and compact-toolbar Deals content `141:40800`. Representative pairs are Sales browse `64:8004` / `64:14455`, Sales preview `64:8876` / `128:25168`, authorised Service `66:19514` / `128:33226`, laptop register `80:24568` / `128:44771`, and tablet register `80:24951` / `128:45079`. Rule card `77:24568` records the decision and application limits.

Source inspection found 96 reachable screens, 759 destination actions and no dangling targets. All 62 desktop states passed the x=36 logo/icon/arrow alignment, 44 px target-height, fixed-bottom and reciprocal-toggle checks. The 32 phone geometry/text signatures were unchanged. Screenshot review caught and corrected fixed-width Service content and compact Sales toolbar clipping. Player evidence for this refinement is recorded separately from these source checks.

In the player, Sales browse expanded through the footer, opened the Sunline preview while retaining the expanded rail, then collapsed with that preview still open. The authorised Service record expanded without losing r02 authorisation, opened Schedule with the rail still expanded, then collapsed while retaining the unassigned-demand handover. These are representative fixture transitions, not arbitrary application-state tests. The compact pinned-menu study omits the redundant Board/Grid switch; its grid, primary action and filters remain visible. Expanded Service register headings and action columns share the same widths.

This is adoption of the specific desktop arrangement. Rail dimensions, breakpoints, the rest of the trial, implementation, device/accessibility proof and whole-shell acceptance remain separate. No runtime shell, deployment, accepted reference bytes or review fingerprint changed.

## Adopted desktop active workspace

Dean requested the phone navigation's lighter selection surface and green accent on the desktop rail, with the accent on the left. He directed the recommended treatment to proceed. The reference phone style is independently traceable: `src/app/styles/figma-shell.css` uses the slate rail hover value and an inset 3 px green top edge for the phone current page. The desktop concept uses the same slate (`#343C4C`) and brand green (`#62BB46`) on its navy rail (`#242A37`).

Both trial rail components (`126:25061`, `126:25155`) and all 62 desktop states use a square selection band, a 3 px inside left edge, and a white icon and Medium label. The green stripe starts at x=0 and the slate fill reaches the opposite rail edge. The band measures 72 x 56 px when compact and 240 x 40 px when expanded. Internal spacing keeps the icon centre at x=36. It identifies the current **workspace**; the nested current page retains its smaller indented marker. The new local surface variable is `surface/rail-active`. This changes the desktop **concept** from the earlier white tile; issued references and the runtime desktop CSS remain intact.

The editable state reference `156:41012` shows Default, Hover, Active, Focus and Active + focus at both widths. Hover has a quieter slate surface with no green edge. The 2 px white focus outline sits inside the row, leaving the green outer edge visible when the active workspace has focus. These are visual states; the reference does not demonstrate live hover, focus order or keyboard operation.

All 31 compact and 31 expanded desktop states have exactly one active workspace. Each band starts at x=0 and ends at the rail width, with square corners and a 3 px green stripe. The workspace identity, icon and label positions, and fixed footer position matched the preceding frames. Renders of both Sales rails and the expanded Service rail confirm the flush edges. All desktop prototype reaction signatures and the 32 phone geometry/text/fill signatures were unchanged. Actual-size renders covered the compact rail, expanded Sales screen and state reference; the expanded Service screen was also inspected. Measured token contrast is 11.07:1 for white on active slate, 4.60:1 for green on active slate, and 5.96:1 for green on surrounding navy. These are sampled pairs, not full accessibility acceptance.

## Desktop search alignment and branding study

Dean requested that global search start inside the workspace to the right of the expanded rail. The shared trial header (`126:24992`) reserves a 240 px brand area in both rail states. At 1440 px, search starts at x=264, aligned with the Sales breadcrumb and Deals heading. The 1280 and 1024 px examples use their 16 px page margin and start at x=256. The field fills available space up to 480 px. In the 1024 px headers it measures 383 px, leaves a 16 px gap before the utilities and shows the product name beside the symbol. The 48 px header height and x=36 symbol centre apply in all three sizes.

Dean approved the 36 px symbol, 18 px Roboto Medium wordmark on a 24 px line, and a divider on the right edge only. The 1 px white divider at 20% opacity meets the expanded rail edge. The editable comparison (`170:41052`) preserves the previous 32 px symbol and 14 px wordmark beside the adopted header. All 62 desktop frames passed checks for brand dimensions, divider placement, search and utility clearance, and existing prototype links.

## Expanded right rail examples

Dean requested examples of the right-side rail and the information it could contain. The private **Right rail · Sales and Service examples** section (`184:42764`) contains two desktop prototype flows and an overview (`190:47941`). This is a design proposal for two synthetic records, separate from the earlier 96-screen trial.

The original 40 px rail offers Snapshot, Activity, Files and Conversations. In the earlier 400 px deal panel, Conversations extends beyond the tab viewport. The examples place the same four icons above equal-width labels across the panel. The active tab has a tinted background, stronger label and 3 px green top edge. The record ID, name and status stay above the tabs. The panel body has its own scroll area. At 1440 px, the expanded 240 px left rail and 400 px right panel leave 800 px for the record workspace.

| Panel | Sales · Sunline deal SYN-OPP-000309 | Service · Riverbend work order SYN-PPO-WO-000041 |
| --- | --- | --- |
| Snapshot | A$92,750 deal value, qualification stage, owner, contact and next site visit | Authorised scope r02, request, equipment, receipt and pending visit |
| Activity | Upcoming visit, emailed proposal, budget call and deal creation | Scope authorisation, saved revision, equipment verification and triage |
| Files | Proposal, site brief and access sketch with SharePoint metadata | Scope PDF, equipment photo and evidence required at handback |
| Conversations | Two example threads on access and FY27 budget | Two example threads on scheduling and completion evidence |

Sales starts collapsed at `184:42765` and opens Snapshot at `184:43703`. Service starts collapsed at `184:47355` and opens Snapshot at `184:47597`. The chevrons open Snapshot. Each shortcut opens its category directly. Tabs switch within the same record. Collapse and Escape restore the corresponding collapsed example. The left rail links the two example workspaces. On Service, the scope and authorisation cards stack when docked so the receipt can be reached by scrolling the record body.

Source validation found all ten screens reachable and all 73 expected destinations saved. Checks covered record identity, panel bounds, tab text containment, selected state and return targets. Rendered examples covered both records. The file listings, history entries and thread excerpts illustrate possible contents. Reading documents, sending messages, permission handling and narrow-screen behaviour require separate work.

## Remaining issues

1. **Prototype state continuity:** re-entering Service from the shared workspace menu starts the blocked example again. Local record/list/Schedule returns preserve the relevant fixture, but cross-workspace persistence is not implemented. The shared issue-confirmation background and issued result use the saved 8 December example even when opened from the original 1 December quote or the separate 15 December recovery fixture. Cancellation returns correctly, but arbitrary state combinations are not a valid end-to-end proof. Use stateful fixtures before broader usability testing.
2. **Phone coverage and accepted shell rules:** phone Sales currently ends at deal inspection. Phone quotation authoring, filtering, the complete search/notification/account controls, other workspaces and visit booking are not represented. Only the named journey controls are connected; other deal rows are context examples. Reconcile the proposed menu/header and compact-list compositions with the accepted phone amendments before adoption.
3. **Implementation and accessibility proof:** real touch devices, software-keyboard occlusion, long or translated content, focus order/trapping/return, screen-reader semantics and actual browser zoom remain untested. The 320 x 568 frame strengthens the short-viewport study but does not replace these checks.

## Evidence and limits

- The pre-rail visual pass contained 66 reachable screens and 461 destination actions; the adopted desktop arrangement extends this to 96 screens and 759 actions with no dangling target. No connected phone action instance measured below 44 x 44 px; all text uses Roboto. Five named flow starts cover the guide, Sales, Service and both phone widths. The screens use editable native Figma nodes and reuse the Powerplants logo artwork. The initial pass contained 50 screens and 427 destination actions.
- Visual inspection covered the guide, preview, bulk selection, Service register/readiness/review/confirmation, quote edit and recovery, issue confirmation, issued state, laptop/tablet and phone compositions. Text-container overlap and Service icon fills found in the first pass were corrected and recaptured.
- The Figma player was used for representative clicks, separately from graph inspection. This is prototype navigation proof only. Keyboard reactions are authored for command search, Escape, result selection and confirmation cancellation; keyboard focus order, trapping and screen-reader semantics are not proven by the Figma graph.
- Forms use predefined example values; fields are not arbitrary live inputs. Search uses a fixed Riverbend query. Some inherited toolbar, filter, tab and utility controls are contextual drawings, outside the linked trial. The Start guide identifies the supported journeys.
- The 720 x 450 frame is a layout study, not an executed browser-zoom accessibility test. Physical phones, touch keyboard occlusion, all real permissions, persistence, concurrent edits, delivery receipts and operational rules remain to be tested in an application implementation.
- No retained PNG package or named accepted Figma version is issued in this contribution. Private visual evidence remains in the source file and review session. No new review fingerprint, baseline acceptance or deployment is claimed.

Dean adopted the desktop header branding and right divider, rail-footer arrangement and active-workspace treatment. The wider trial's represented layouts remain subject to owner review. Resolve state continuity and phone coverage before treating this as a complete usability prototype; reconcile accepted shell rules and verify the implementation before complete shared-shell adoption. Whole-shell acceptance and production readiness remain unclaimed.
