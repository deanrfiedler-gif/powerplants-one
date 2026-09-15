---
document_id: PPO-012-READINESS-AUDIT-R01
revision: r01
date: 2026-09-15
owner: Dean Fiedler
status: Audit complete; 15 findings carried into r02
source_commit: bc1dcf21490dda37979227f5fc13224183853d5a
---

# Projects — Delivery Readiness & Change Control · r01 audit

**Subject** [`PPO-Project-Delivery-Readiness-and-Change-Control-r01.html`](PPO-Project-Delivery-Readiness-and-Change-Control-r01.html) · 243,576 bytes · SHA-256 `a830eebb34ed44292a0906b878c9965746e7e1e8f0c870c77820cf5cd79e841b`
**Reference** Powerplants One theme and style board r20, SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617` (read in source; its composition, colour, typography, geometry, Gantt, overlay and feedback-state chapters were the comparison basis).
**Date** 15 September 2026
**Method** Headless Chromium 1440×960 and 390×844 captures of all six views, the Snapshot, Assistant and Page guide panels, Demo controls, a captured comparison and the response/request dialogs; decomposed CSS and both inline scripts read statically. Zero console errors in any render. This is the first native-browser inspection of this HTML; the r01 verification record had none.
**Outcome** Fifteen findings, all deterministic. Each is addressed in the [r02 change record](PPO-Project-Delivery-Readiness-and-Change-Control-r02-change-record.md).

## 1. Verdict

r01 is a strong file. The six-view structure, the current/proposed comparison, the explicit unknowns, the state vocabulary and the evidence discipline are all above the standard of the earlier module designs. Theme alignment is largely right: navy primary actions, green section-tab rule, 6/10/14 px radii, square-cornered 448/480 px docks, `#F5F6F8` canvas, 292 px support column, 264 px queue.

What stops it reading as fully professional is a small set of consistency defects that a careful reviewer meets on the first screen: two spellings of the same month, two reference schemes, an internal identifier in a business column and one revision label used for two different things.

## 2. Verified as correct — no change

Composition rules 01–06 from r20; docked-panel exclusivity with focus return; the six-step change progress; the current/proposed comparison grid; the *Incomplete estimate* and *Reviews required* pills; "Due date not recorded" and "Unknown · not included in subtotal" as explicit non-zero values; the A4 print stylesheet; reduced-motion handling; the skip link; 44 px principal controls and 16 px inputs on phones; keyboard tabset navigation (Arrow/Home/End).

## 3. Findings

### A. Integrity and identity

| # | Finding | Evidence |
|---|---|---|
| A1 | Revision label inconsistent with the received filename. `ppo-design-revision`, the description meta, the model header comment, the header pill and the footer all read r01 while the file supplied for audit was named r02. The supplied bytes are identical to the branch r01, so the file is r01. | `<meta name="ppo-design-revision" content="r01">`; pill "Interactive review · r01" |
| A2 | Two reference schemes on one page. Project, appointment, pack, work order and asset use `SYN-PPO-…`; change reviews and actions use `DEMO-CHG-…` / `DEMO-ACT-…`. The r01 design record explains the choice, but the project instruction requires SYN-PPO synthetic references and the visible inconsistency undermines the synthetic marker. | Changes queue, Actions register, page guide |
| A3 | Implementation identifiers in business copy. The Actions register and action detail show `component-line` and `access-line` as the originating record. | `a.changeId\|\|a.origin` rendered unresolved |

### B. Data presentation

| # | Finding | Evidence |
|---|---|---|
| B4 | "Sept" beside "Sep". `toLocaleDateString('en-AU',{month:'short'})` returns "Sept" and "June" in Chromium, so formatted dates read "16 Sept 2026" next to fixture strings "21 Sep 2026". Worst in the comparison grid: "21 Sep 2026" above "23 Sept 2026 – 25 Sept 2026". The r20 rule is "30 Sep 2026". | Overview, Readiness, Programme headers, Changes |
| B5 | Money without a thousands separator and in a form the theme does not use: "AUD 1200.00 ex GST". The r20 specimen is "$127,500.50 AUD ex GST". | Commercial context, print, Assistant answer |
| B6 | One revision label for two revisions. Every source shows "r01" (the evidence record revision) while the drawing text says r03 and the pack r02; a reader takes r01 as the document revision. | Readiness source column, Evidence table, source chips, snapshot history |
| B7 | Milestone tile repeats the month: "21 Sep" then "Sep 2026 · pump arrival baseline". | Overview |
| B8 | "1 events". | Evidence & history |
| B9 | Grouped register rows repeat their group category as the sub-label ("Engineering" under the Engineering group) where a reference would carry information. | Readiness |

### C. Theme divergence

| # | Finding | r20 rule |
|---|---|---|
| C10 | Gantt legend merges "Conflict / at risk" and omits milestone, in-progress and complete keys; the today line is solid teal with no date label; the conflict connector is `#bd4c40`. | "A risk warning and a dependency violation are different conditions"; today is a 1 px dashed `#438946` line with a pale green date label; conflict link `#B95445` 1.5 px 3/2 dash |
| C11 | Assistant prompt buttons render arrow-left / text-right with a void between. The scripted Assistant has no composer; acceptable for a review, but it should be stated. | Controls chapter: text leads, icon trails |
| C12 | The Fit/Week/Month segment stays visible in List mode where it has no effect. | Planning layout: controls belong to their active view |

### D. Responsive

| # | Finding | Evidence |
|---|---|---|
| D13 | Phone tabs overflow silently; "Evidence & history" is off-screen with no cue. | 390 px capture |
| D14 | The impact-preview table on phones shows only "Affected item / Current position"; the proposed effect and required response are hidden in a horizontal scroll with no cue. | 390 px Changes capture |
| D15 | The phone project strip consumes about 250 px before the tabs (two stacked full-width selects). | 390 px captures; left as an option in r02 |

## 4. Not verified in this audit

Keyboard operation of the `base-select` choice cards, 200% zoom, short-height viewports, screen-reader announcements and printed pagination were not exercised. Native device acceptance remains outstanding, as the r01 verification record already states.
