---
document_id: PPO-SHELL-CONCEPT-PROTOTYPE-DEC
title: Shell concept clickable trial
date: 2026-11-05
owner: Dean Fiedler
status: User-authorised concept refinement; prototype delivered; owner review and application adoption pending
source_commit: aeaaad5a8e13f5c9549b9763a8150413b1769ab9
versioning: git
---

# Shell concept clickable trial

Dean approved the recommendation to retain the navy rail, grouped flyout, command palette and snapshot, resolve the four high-priority audit findings, and build a clickable Sales plus demanding Service or Engineering workflow. His instruction was: "Proceed with your recommendation below." Service was selected because its scope-specific readiness, explicit authorisation and scheduling handover exercise more than ordinary record navigation.

This records a trial in the private Figma file **PPO - Shell concept**, page **Shell concept Acumatica trial** (`0:1`). It does not adopt a replacement application shell or supersede accepted module designs. All records, evidence, people and outcomes used for the trial are synthetic. File links and artwork are excluded from this public repository.

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
| Reuse | Existing concept Top bar `6:575`, collapsed rail `6:669`, expanded rail `6:786`, Sales flyout `8:370`, collapsed panel `8:396`, Deals content `8:1041`, Quotation content `9:1037`, docked menu `10:736`; existing colour variables and Roboto. Local trial buttons `65:14921`, `65:14924`, `65:14927` are instances throughout new content. |
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
| Phone starts | 390 x 844 Sales `68:22469`, work order `68:22501`; 320 x 844 Sales `68:22569`, work order `68:22601`. Each connects through review, ready, confirmation and authorised states. |

## Evidence and limits

- Structural inspection: all 50 named trial screens reachable from Start; 427 destination actions; zero dangling targets. Five named flow starts cover the guide, Sales, Service and both phone widths. The screens remain editable native Figma nodes; image fills are only the reused 32 x 32 logo instances.
- Visual inspection covered the guide, preview, bulk selection, Service register/readiness/review/confirmation, quote edit and recovery, issue confirmation, issued state, laptop/tablet and phone compositions. Text-container overlap and Service icon fills found in the first pass were corrected and recaptured.
- The Figma player was used for representative clicks, separately from graph inspection. This is prototype navigation proof only. Keyboard reactions are authored for command search, Escape, result selection and confirmation cancellation; keyboard focus order, trapping and screen-reader semantics are not proven by the Figma graph.
- Forms use predefined example values; fields are not arbitrary live inputs. Search uses a fixed Riverbend query. Some inherited toolbar, filter, tab and utility controls are contextual drawings, outside the linked trial. The Start guide identifies the supported journeys.
- The 720 x 450 frame is a layout study, not an executed browser-zoom accessibility test. Physical phones, touch keyboard occlusion, all real permissions, persistence, concurrent edits, delivery receipts and operational rules remain to be tested in an application implementation.
- No retained PNG package or named accepted Figma version is issued in this contribution. Private visual evidence remains in the source file and review session. No new review fingerprint, baseline acceptance or deployment is claimed.

Next review: follow the Sales selection/preview path and the full Service authorisation path, then judge the compact layouts and recovery wording. Adopt or revise the trial before requesting a shared-shell implementation.
