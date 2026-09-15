---
document_id: PPO-012-READINESS-CR-R02
revision: r02
date: 2026-09-15
owner: Dean Fiedler
status: Built and component-checked; native visual acceptance pending
source_commit: bc1dcf21490dda37979227f5fc13224183853d5a
---

# Projects — Delivery Readiness & Change Control · r02 change record

**Deliverable** [`PPO-Project-Delivery-Readiness-and-Change-Control-r02.html`](PPO-Project-Delivery-Readiness-and-Change-Control-r02.html) · 247,414 bytes · SHA-256 `fce055ba5c2f750751ad5eceb33a930e0edd5881b177ec218829abdd95c66741`
**Predecessor** r01 · SHA-256 `a830eebb34ed44292a0906b878c9965746e7e1e8f0c870c77820cf5cd79e841b` · retained unchanged. `roboto.css` (SHA-256 `825d7119…3f099d7`) is byte-identical in r02.
**Date** 15 September 2026
**Basis** [r01 audit](PPO-Project-Delivery-Readiness-and-Change-Control-audit-r01.md). Every change traces to a finding; nothing was changed for its own sake.
**Built from** `docs/design/projects-delivery-readiness/` with `node scripts/build-project-delivery-readiness.mjs --issue=r02`. The working HTML and the r02 issue are identical bytes.

## 1. What changed, by audit finding

| Audit | Change in r02 | Where |
|---|---|---|
| **A1** revision | Meta description and `ppo-design-revision`, header pill, footer, page guide and export designation all read r02. | `template.html`, `workspace.js`, `model.js` |
| **A2** references | Change reviews are `SYN-PPO-CHG-024001` / `-024002`; actions are `SYN-PPO-ACT-024001` / `-024002`; the generators use the same prefixes. **CHG is a proposed type code**, added on the same basis as `SYN-PPO-DOC` in the Job Pack r03 record; it is not in the PPO-STD-001 registry and no server allocation is implied. `VAR` was not used because the page treats the customer variation as a separate, unrecorded value. The page guide states this. | `model.js`, `workspace.js`, DOM check |
| **A3** origin leak | `originLabel()` resolves an action's origin to the prerequisite title or the change title. "Submission / revision 1" becomes "Request r01". | Actions register and detail |
| **B4** dates | A fixed three-letter month table replaces `toLocaleDateString`; every formatted date now reads `16 Sep 2026`. Invalid input still returns "Date not recorded". | `model.js` `formats.date` |
| **B5** money | `money()` renders `$1,200.00 AUD ex GST` with `en-AU` grouping; applied to the Commercial context, the source snapshot, the review print/export and the scripted Assistant answer. The restricted-role export check still passes because the values are absent, not reformatted. | `workspace.js` |
| **B6** revisions | Record revisions are labelled "Record r01"; where a source carries a document revision it leads: "Drawing r03 · Record r01", "Pack r02 · Record r01", "Work order r01 · Record r01". Source chips read "· record r01". | `sourceCell`, Evidence table, `sourceChip`, snapshot revision list |
| **B7 / B8 / B9** | Milestone tile: `21 · Sep 2026 / Pump arrival baseline · supplier promise`. "1 event". Register sub-labels carry a reference (`SYN-DRW-041 · drawing r03`, `SYN-PPO-APT-024001`, …) or are omitted; the group row already names the category. | Overview, Evidence & history, Readiness |
| **C10** Gantt | Eight-key legend: Planned forecast · In progress · At risk · Dependency conflict · Forecast milestone · Confirmed Service visit · Proposed dates · Today. Today line is 1 px dashed `#438946` with a pale green date label hung from the header edge. Connector colour `#b95445`; it remains 1 px because CSS borders cannot express the 1.5 px 3/2 dash — a residual, stated difference. | `workspace.css`, `gantt()` |
| **C11** Assistant | Prompt text leads, arrow trails (`flex-direction:row-reverse`). The absence of a free-text composer is unchanged and is a scripted-review limit. | `.prompt-list` |
| **C12** | Fit/Week/Month renders only in Gantt mode; Today remains because it also switches to Gantt. | `programme()` |
| **D13** tabs | `syncTabs()` sets `data-overflow="start end"` on the tab strip and keeps the active tab in view without moving the page; a mask fade shows the hidden direction. | `workspace.js`, `.tabs[data-overflow]` |
| **D14** impact table | Below 700 px content width the impact table becomes labelled cards (Current position / Proposed effect / Required response) instead of a hidden horizontal scroll. | `.impact-table` container rule |
| **D15** | Not changed. The phone project strip is left as an option for a later revision. | — |

## 2. Build and check changes

- `scripts/build-project-delivery-readiness.mjs` requires `--issue=rNN` to write an issue file and refuses a bare `--issue`, so a received issue cannot be silently rewritten.
- `scripts/check-project-delivery-readiness-dom.mjs` reads the working HTML by default and honours `PPO_REVIEW_HTML` for a specific issue; its action selector uses the new reference.
- One defect was introduced and caught during the build: `sourceChip(id,rev)` shadowed the new `rev()` helper, which threw inside the Changes render and left the previous view on screen with only a toast. The DOM suite failed on "Captured comparison"; the helper is now `revLabel()`. Chromium had not reported it because the error was caught by the action handler.

## 3. Verification

| Check | Result |
|---|---|
| Synthetic model checks | 11 groups passed on the r02 sources |
| DOM simulation (jsdom, no native rendering) | 15 groups passed on the assembled r02 HTML; no console errors |
| Headless Chromium, 1440×960 and 390×844 | All six views, Snapshot, Assistant, Page guide, captured comparison and drawing snapshot rendered; zero page or console errors; the strings `Sept `, `DEMO-`, `AUD 1200`, `component-line` and `1 events` are absent; the phone tab strip reports `data-overflow`; focus returns to the capture control after a capture |
| Assembly | Working file and r02 issue identical; r01 bytes unchanged; three embedded font faces; no external runtime request |

Native device, 200% zoom, screen-reader and printed-pagination acceptance remain outstanding, as for r01. Headless Chromium captures are inspection evidence, not owner acceptance.

## 4. Open choices for the owner

1. Confirm `CHG` as a proposed type code or direct a different code; either is a one-line change in `model.js`.
2. Decide whether the phone project strip (D15) should collapse to a single scope row in r03.
3. Native visual acceptance at 1440 / 1024 / 820 / 390 / 320 px and 200% zoom before the design is adopted.
