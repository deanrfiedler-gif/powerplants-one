---
document_id: PPO-EST-REVIEWS-DESIGN-DEC
date: 2026-10-11
owner: Dean Fiedler
status: Owner-accepted design; native implementation, shell rollout and UI baseline acceptance separate
source_commit: 469b26660b54c7e954e2805943fbf36eba49d69b
versioning: git
---

# Reviews & approvals design — owner decision

On 11 October 2026 Dean designed, in Figma, the page for the reserved Estimating slot `estimate-reviews` (Reviews & approvals). He took the menus, register and record windows from the patterns of the Pipedrive CRM he uses, and refined them over several rounds. He then asked for a final polish "before we lock in the design", and saved the result as the named Figma version "Reviews & approvals — Pipedrive pattern, accepted". This record retains his decisions, the design reference and its icon-free captures, the conformance declaration, the departures from the adopted shell, and what remains open.

Scope: the `estimate-reviews` slot in Estimating & quotation, showing ES-04 estimate reviews and ES-05 quotation approvals. No parent requirement ID is added or renamed. This is a design decision. It authorises no application code, route, migration, permission, capability or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the page in Figma | User decision, 11 October 2026 | [ADR-0053](ADR-0053-figma-page-design.md) |
| Menus follow Pipedrive's pattern | User direction, 11 October 2026 | "I think I prefer the design that Pipedrive uses in their CRM app", with screenshots of his own Pipedrive account: a labelled primary rail; a flush secondary menu that collapses to a strip, whose right border turns blue on hover and collapses it when clicked; and a More slide-out the same size as the secondary menu |
| Registers as full-width grids | User direction, 11 October 2026 | A table "that extended all the way to the edges of the container, with individual cells" |
| Record windows overlap the table | User direction, 11 October 2026 | A small window for actions such as bulk edits and a larger one for the record; "neither of these windows condense tables, they overlap them instead" |
| Selected rail item, body lines, rail collapse | User decisions, 11 October 2026 | The adopted white tile for the selected rail item ("I don't like to use the lime green colour against the dark navy background"); keep the lines between body cells; the rail collapses to icons; "For anything else, just proceed however you believe is the most professional". He then asked to keep the rail's existing collapse control unchanged |
| Fixed first and last columns | User decision, 11 October 2026 | The checkbox and gear columns "must not move when the user scrolls horizontally through the table" |
| Large window position | User decision, 11 October 2026 | Its left edge aligns with the right edge of the secondary menu; the small window is unchanged |
| Phone list rows | User decision, 11 October 2026 | He first asked for the grid on the phone. Claude recommended flush list rows and drew both side by side; Dean chose the rows: "That version is much better" |
| Phone header and tab bar | User decisions, 11 October 2026 | No breadcrumb trail on the phone. Icons only in the tab bar ("Icons alone will be enough"), styled like the app's own phone bar: the active tab has a lighter background and a green line along its top. A fifth tab is allowed ("You can add another icon … as there is enough room") |
| Final polish and acceptance | User decision, 11 October 2026 | "I really like that design. Now give both the desktop and mobile version a final polish … before we lock in the design." Dean then saved the named version |
| Claude's recommendations, adopted under "proceed however you believe is the most professional" | Adopted design | The large window leaves part of the secondary menu visible. The collapse control stays under the logo. Badges are neutral counts. Reviews & approvals is the fifth phone tab. The bulk actions are Open in sequence and Export list only. The polish items in section 4 |
| Building the page or the shell | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, at the named version "Reviews & approvals — Pipedrive pattern, accepted". The file's link is not recorded in this public repository, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Accepted frames | Page "Reviews & approvals (proposal)": desktop `77:635`, desktop with two rows selected `81:1002`, phone `104:1803`. Its notes card `82:1333` lists the decisions, rules, handovers and open questions |
| Page components | Review grid row `75:678` and header `75:679`; Review list row (phone) `104:1786`; Review snapshot (phone) `104:1654` |
| Proposed shared components | Page "Shell v2 (proposal)": v2 / Rail `84:197`, Rail item `73:29`, Menu item `73:46`, Menu heading `73:48`, Menu edge `73:54`, Menu strip `73:63`, More panel `79:51`, Grid / Header cell `74:13`, Grid / Cell `74:40`, Checkbox `74:47`, Checkbox cell `74:48`, Row actions cell `74:50`, Tab item `107:148`, Tab bar (phone) `107:149` |
| Retained captures | [Reviews & approvals design r01](../reference/ui/estimating/reviews-approvals-design-r01/README.md): seven icon-free PNGs at exact frame size, with hashes. These are the repository reference for this decision |
| Earlier versions | The first proposal (a rounded register card with summary tiles, and boxed phone cards) and a phone grid were removed from the page after the decision. They remain in the file's version history |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | The reserved slot `estimate-reviews` ("Reviews & approvals") in the Estimating & quotation rail, which `src/shell/navigation.ts` lists as unavailable. The [navigation decision](navigation-architecture-board.md) gives the slot its own estimate review queue; My Work reviews are not a substitute. No route exists yet |
| Page type (r20) | Register / worklist, with a record detail window and a multi-select action panel. On the phone: a list with a full-screen record view |
| Reused components | Shell / Top bar, Button, Tag, Brand / Logo, Font Awesome Light icons named as in `src/components/font-awesome-icons.ts` (ADR-0050), and the My Work colour and type tokens. New, proposed as shared: the v2 rail, secondary-menu items, headings, edge and strip, the More slide-out, the grid cells and checkbox, and the phone tab bar. Page-specific: the review grid row and header, the phone list row and the phone record view |
| Source authority | ES-04 rules ([estimating-review-native.md](estimating-review-native.md)): three review kinds (Completeness, Technical, Source & price); each review checks one exact saved version; decisions are Reviewed or Returned with findings; unchanged parts keep their earlier decision; the author, owner and submitter cannot review their own estimate; commercial approval is not configured. ES-05 quotation approval is a separate step ([quotation-approval-issue-distribution-design.md](quotation-approval-issue-distribution-design.md)). Fixture: synthetic `SYN-EST` and `SYN-QUO` references, people, dates and values |
| Incoming handover | ES-04 review submissions and ES-05 quotation approval requests |
| Outgoing handover | In the record window, "Open review" opens the existing estimate review page (`/estimating/estimates/[id]/review`) and "Open estimate" opens the estimate. Quotation rows open the ES-05 approval view. No review decision is taken in the register or the windows |
| States shown | The register; a returned review with findings; your own estimate, which you cannot review ("Your estimate"); carried-forward decisions in the record window; a two-row selection; the More slide-out; collapsed rail and secondary menu. Loading, error, empty and stale states are not drawn yet |
| Departures | Section 4 |
| Verification | Section 6 |

## 4. Departures

These depart from the adopted Shell page (built from `main@ed3ccb8`) or the first proposal. They are accepted for this page's desktop (1440 px) and phone (390 px) compositions.

| ID | Departure | Adopted or earlier behaviour |
|---|---|---|
| D1 | A labelled 240 px navy rail with the department name under the logo, neutral count badges and More straight after the list. It still collapses to 76 px icons with the existing control. The selected item keeps the white tile with a navy Solid icon | A 232 px labelled or 76 px collapsed rail with More at the bottom |
| D2 | A flush secondary menu with caps section headings and counts, and no heading. It collapses to a 20 px strip: hover its right border to turn it blue, then click; click the strip to expand. The top-bar toggle does the same, for keyboard and touch users | Shell / Menu with a heading, opened and closed from the top bar only |
| D3 | More slides out over the secondary menu at exactly its size, and closes on any outside click or a choice | A static More panel |
| D4 | The register is a full-width grid: header and body cells with lines, single-line 40 px rows, a fixed checkbox column on the left, a fixed settings and "…" column on the right, and a sort marker on the sorted column. The breadcrumb is the page title, and the summary tiles become counts in the secondary menu | A rounded register card under a page title and summary tiles |
| D5 | Record windows overlap the register. The large one starts at the secondary menu's right edge and follows it when the menus collapse. It has close, previous and next on its edge, the record on the left, and Findings, Files and History on the right. The small 360 px panel serves a multi-row selection | The planned shared right-hand panel (ADR-0051 design kit, group 2) |
| D6 | Phone: flush list rows about 80 px tall, showing title, value, reference, review kind, status and waiting time. Tapping a row opens a full-screen record view | Boxed cards about 194 px tall |
| D7 | Phone header: the page name only. The Design and build and Page guide buttons are hidden on the phone; Page guide moves to the account menu | Page name squeezed by four buttons |
| D8 | Phone tab bar: icons only, five equal tabs. The active tab uses the app's own treatment (a `#343c4c` cell with a 3 px green top line, from `mobile-layout.css`) with a white icon. Each tab keeps its name as its accessible name, read by screen readers and shown on long-press. Reviews & approvals is added as the fifth Estimating tab | Four labelled tabs |
| D9 | Five proposal colours give the tints exact values: `proposal/menu-selected` `#e3e8ee`, `proposal/row-selected` `#eff2f6`, `proposal/rail-text` `#e0e1e3`, `proposal/rail-muted` `#acaeb3` and `proposal/rail-badge` `#474c57` | No equivalent tokens |
| D10 | Bulk actions are limited to Open in sequence and Export list. Decisions stay one review at a time, as ES-04 requires | Not designed |

## 5. Not decided

- **Building the page.** The route, data, permission and capability need their own decision and pull requests. The navigation coverage ledger still says "No capability invented".
- **Rolling out the shell.** D1–D3 and D8 change the shell for every page. The adopted Shell page and the app stay as built until a shell implementation is planned and recorded. The grid in D4 should change the shared register table (built in PR #400) once, not page by page.
- **Open questions:**
  - Who may see the queue, and through which permission?
  - Should a service level turn waiting items red?
  - Should people without a review duty see those reviews?
  - Should quotation approvals stay here as a menu view, or move to their own page?
  - How should several rows be selected on the phone? The recommendation is to press and hold a row, with the actions in a bar at the bottom.
- **Not drawn yet:** loading, error, empty and stale states.

## 6. Verification

- The seven captures are copies of the accepted frames with every Font Awesome icon swapped for `Icon/placeholder`. A check after the swap found no Font Awesome instance left in any copy. They were exported at scale 1 with the Figma connector, and each image was inspected; the hashes are in the [captures README](../reference/ui/estimating/reviews-approvals-design-r01/README.md). This is the first use of ADR-0053 rule 3.
- The prototype interactions (menu collapse and strip, record windows, selection, More, rail collapse and phone record view) were built with Figma's prototype switches. Claude could not run Present mode through the API. Dean reviewed the design in Figma.
- `python3 scripts/check_naming.py` and `python3 scripts/check_foundation.py` were run on this change.
- Nothing is built, so there is no application or device evidence. This record implies no visual review of the application and no UI baseline.

## 7. Consequences

- No application code, route, migration, permission or capability changes. No page, scope or parent requirement ID changes; all 78 parent IDs remain.
- When the page is built, it is compared with these captures and the Figma frames at the same viewports, following ADR-0053 rule 7.
- A later change to this design receives a new named version and a new capture revision folder; these bytes stay unchanged.


## Implementation record — 24 October 2026

The accepted register is implemented at `/estimating/reviews`, matching the existing planned ES-04 scope path, and activates the reserved `estimate-reviews` navigation ID. The [queue decision](estimating-review-queue.md) records current-window counts, exact snapshot/native handovers, source restrictions and phone selection adaptations. The [working page contract](../design/development/pages/route-estimating-reviews.md) retains review status separately from implementation. Additional workflow frames marked review pending are not accepted by this implementation.
