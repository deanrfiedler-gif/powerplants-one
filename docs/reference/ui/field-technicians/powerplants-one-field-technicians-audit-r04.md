# PPO Field Technicians — r04 rendered audit and r05 refinement scope

**Subject** `powerplants-one-field-technicians-r04.html` (429,584 bytes; 1 embedded WOFF 373.7 kB, 20.8 kB CSS, 24.2 kB JS, 5.3 kB static markup)
**Baseline identity** SHA-256 `b4d15630d89f0a74b795b9b2af6b83d9c4874d0e31d7e503f93d386a6555a704` — **identical to the approved r04 baseline** recorded in `docs/decisions/field-technicians-design.md` (approved 10 September 2026). The approved bytes were not modified.
**Audit date** 12 September 2026
**Scope** Full-stack, balanced: information model and state vocabulary, list/filter logic, drawer workflow, traceability into controlled records, UX, accessibility, responsive rendering, design system, code quality, alignment with BP-07 r10 and the approved Job Pack r02 baseline
**Method** Static reading of the decomposed source, then three instrumented Playwright 1.56 / Chromium 1194 runs at 1440 × 960, 1024 × 768, 820 × 800 and 390 × 844. Every quantity below was measured.
**Stored as** `docs/reference/ui/field-technicians/powerplants-one-field-technicians-audit-r04.md`. Successor design: [r05](powerplants-one-field-technicians-r05.html) with its [change record](powerplants-one-field-technicians-r05-change-record.md). The approved r04 remains at `docs/reference/powerplants-one-field-technicians-r04.html`.

---

## 1. Verdict

r04 is the cleanest of the three containers audited so far. Zero console errors, zero horizontal page scroll at any width, zero real-text contrast failures, correct tablist semantics in both the page and the drawer, per-view filter state that survives switching, deliberate backdrop dismissal that ignores drag-outs, return-focus on close, a live-region announcement that says what happened to unsaved notes, and a phone layout that is a designed card grid rather than a squeezed table. The rendered checks that the handover says were "authored, not executed" pass.

What the audit exposes is not rendering — it is what the presentation does *not* define, and the app has already had to invent:

1. **The drawer is a dead end.** Measured: zero links or actions in the drawer beyond its four tabs and two close buttons. No traversal to the work order, appointment, full job pack, equipment record or My Jobs. The Job Pack r02 decision states that the full pack page "continues from a selected job's Job pack drawer section" — that control does not exist in r04. The handover confirms the adapter added "date/site selection" and "links to existing controlled records" with no design reference.
2. **The two approved baselines contradict each other about the same appointment.** `SYN-PPO-APT-000242` / `SYN-PPO-WO-000185` (Morgan Lee, Fernridge, climate controller) is shown here on 10 September 10:00–12:00, *Travelling*, pack *Acknowledged*; in Job Pack r02 the same references are 11 September 09:00–12:00, *Preparation required*, pack *Draft r01 · Not issued*, with a different site contact and a different customer name. Synthetic data is allowed to be fictional; it is not allowed to disagree with itself across two locked presentations that will be integrated against the same records.
3. **The Status column conflates schedule state with readiness.** "Pack to acknowledge" and "Dispatch held" sit in the same column as "In progress" and "Travelling", while a separate Job readiness column already says "Pack acknowledgement due". One record has two columns describing the same fact and one column describing two different facts.
4. **Next action has no owner model.** The text for any job with an issue is the hard-coded string "Confirm sensor collection · Alex Nguyen · by 11:30". Technician actions ("Acknowledge issued pack", "Attend confirmed visit") and coordinator actions share the column with an owner named only when it is a warning.
5. **Coordinator handover is per technician but displayed as if per job.** Riley's "Bring the calibrated EC meter to the afternoon visit" appears under the morning fertigation inspection.

Plus a short list of rendered refinements: the drawer opens focused on the Close icon; "Close details" wraps to three lines at 390 px; "1 need preparation"; the draft-retained message does not update while typing; the attention view offers status filters that can only return empty; the team table shows no current visit for technicians who are on site; the availability clock is the literal `"09:40"`; and no loading, failure, unavailable or empty-day state is designed although BP-07 §2 and the decision record both require them.

**Recommendation:** keep r04 as the approved baseline. Record an **r05 successor** with the bounded scope in §8. Stream A (traversal and cross-baseline fixture coherence) should be settled first because the app already carries an undesigned version of it; Stream B (state vocabulary) is a design decision that changes what the schedule read must supply.

---

## 2. Rendered checks — executed

The handover lists Playwright procedures that were authored but not run. Equivalent checks here:

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | **Desktop** 1440 × 960 and 1024 × 768 | **Pass** | 24 px outer padding; fixed-height workspace with internal scroll; sticky column headers (`position: sticky` verified); six-column tables; three summary metrics; Design preview stamp |
| 2 | **Intermediate** 820 × 800 (container ≤ 900 px) | **Pass** | Table adopts `min-width: 870px` and scrolls inside `#ft-results`; `documentElement.scrollWidth` = 820; summary metrics and stamp hidden as designed |
| 3 | **Phone** 390 × 844 | **Pass with refinements** | `scrollWidth` = `clientWidth` = 390 on all three views; rows become 2-column card grids with `data-label` captions; 44 px controls; drawer becomes full-width (390 × 844) with four 92 × 44 px tabs. Refinements at §5 U3, U7 |
| 4 | **Keyboard and drawer** | **Pass with refinements** | Tab order: view tab → search → two filters → sort → results region → record links. ArrowRight/Left/Home/End switch views and drawer tabs and move focus. Esc, backdrop click and Close details all return focus to the opening record link. Row click opens the drawer; text selection suppresses it. Refinement at §5 U1 |
| 5 | **Filter state** | **Pass** | Search "creekside" + status "In progress" on Visits → 1 row; switch to Technicians → search empty, availability options; switch back → "creekside" / "In progress" / 1 row restored. Technicians → "Riley Bennett" → Visits filtered to 2 rows, person filter focused, context reads "Riley Bennett" |
| 6 | **Escaping** | **Pass** | `<img src=x onerror>` typed into both note fields, drawer closed and reopened: 0 executions, 0 injected elements, value preserved verbatim |
| 7 | **Console** | **Pass** | 0 errors, 0 page errors across all views, drawer tabs and viewports |
| 8 | **Contrast** | **Pass** | 117 text-bearing elements on the desktop visits view; the only sub-4.5:1 result is the `aria-hidden` "ML" avatar (4.49:1), which is decorative |

---

## 3. What is already right

| # | Finding | Evidence |
|---|---|---|
| S1 | **Separation of concerns is stated where it matters** | Drawer foot: "Visit completion, customer acceptance and billing remain separate steps"; notes help: "not submitted and do not complete the visit"; pack note: "Acknowledgement applies to the exact issued revision" |
| S2 | **Identity is shown, not implied** | Drawer reference line carries both `SYN-PPO-WO-…` and `SYN-PPO-APT-…`; both are searchable; both follow the PPO-STD-001 §10 registry |
| S3 | **Per-view filter state** | `viewState` keyed by view; verified round-trip (§2 #5) |
| S4 | **Backdrop dismissal is deliberate** | `pointerdown` outside + `click` outside required; `pointercancel` clears; drag from inside to outside does not close |
| S5 | **Close announces outcome** | `#ft-announcement` reads "Field notes retained in this preview only…" or "Job details closed." on close |
| S6 | **Row click respects text selection** | `window.getSelection().toString()` guard on row and person-row clicks |
| S7 | **Container contract** | `--ppo-field-height` host-supplied height, `container-type: inline-size` with container queries for the workspace, `data-initialised` remount guard, no global chrome |
| S8 | **Sticky headers in a scroll region with `scrollbar-gutter: stable`** | No layout shift when the list overflows |
| S9 | **Empty state gives the permitted next action** | "No matching visits / Try another search or clear the current filters / Clear filters" — and "No visits need preparation" when the attention view is empty without filters |
| S10 | **Output escaping is complete** | Every fixture and user string passes through `esc()`; `aria-label` values included |
| S11 | **Restrained visual system, consistent with Job Pack r02** | Same navy/green/grey, same 24/16 px padding, same tab treatment, 12 px minimum text (11 px only on `aria-hidden` avatars) |

---

## 4. Major findings — model and traceability

### M1 · The drawer has no traversal to controlled records

**Measured:** `#ft-job-dialog :is(a,button):not([role=tab]):not(#ft-close-dialog):not(#ft-done)` → **0 elements**, on every tab, for every job.

The Overview shows the work order and appointment as text only. The Job pack tab shows four check rows and a `<details>` of "Sample references" with no revision identity for the current issue and no way to open the pack. Asset history shows two events with no link to the equipment record. Field notes is a memory-only form with no route to My Jobs.

The decision record's application mapping requires links to "controlled job packs and full visit readiness", "permission-checked equipment links" and "My Jobs for durable field capture". The Job Pack r02 decision requires the full page to open "from the selected job's Job pack section using the canonical permitted pack identity". The handover says the adapter did add these. So the app now carries navigation that no approved presentation defines, and the next design pass will either ratify it blind or contradict it.

**Fix (r05):** define the drawer's actions: a primary "Open job pack rNN" on the Job pack tab (with the current issue revision and its state), "Open work order" and "Open appointment" on Overview, "Open equipment record" on Asset history, "Open in My Jobs" on Field notes. Then reconcile with what the adapter shipped.

### M2 · The approved baselines disagree about `SYN-PPO-APT-000242`

| Field | Field Technicians r04 | Job Pack r02 |
|---|---|---|
| Work order | SYN-PPO-WO-000185 | SYN-PPO-WO-000185 |
| Appointment | SYN-PPO-APT-000242 | SYN-PPO-APT-000242 |
| Technician | Morgan Lee | Morgan Lee |
| Customer | Fernridge **Growers** | Fernridge **Demo** Growers |
| Site contact | Sam Hart · Grower | Taylor Reed · Nursery manager |
| Date | Thursday **10** September 2026 | Friday **11** September 2026 |
| Window | **10:00–12:00** | **09:00–12:00** |
| Visit state | Travelling | Confirmed · Preparation required |
| Pack | **Acknowledged** (issued r02 implied) | **Draft r01 · Not issued** |

Both files are locked with hashes and both are the presentation reference for the same route family. The integration test fixture (21 September, per the handover) sidesteps this, but the two design documents remain the artefacts Dean and reviewers will look at side by side.

**Fix (r05 for this file, or a fixture note in both decisions):** align the shared appointment on date, window, contact, customer name and pack state, or change one file's example to a different appointment. Pick the Job Pack state as canonical: the pack page is the record of pack state.

### M3 · Status conflates appointment state with readiness

Values in the Status column: `In progress`, `Travelling`, `Ready for visit`, `Dispatch held`, `Pack to acknowledge`. The last two are readiness/dispatch outcomes, not schedule states, and the adjacent Job readiness column already says "Pack review required" / "Pack acknowledgement due" for the same rows. BP-07's appointment vocabulary (Proposed/Tentative/Confirmed/InProgress/…) and its readiness outcomes are distinct concepts, and the decision record maps "Status" to "actual InProgress visit counts and resource status" only.

**Fix (r05):** Status = appointment state only. Readiness = readiness outcome plus dispatch component ("Dispatch held · pack review required"). The status filter then filters on one axis.

### M4 · Next action is not modelled

```js
if (j.issue) return { text: "Confirm sensor collection", sub: "Alex Nguyen · by 11:30", warn: true };
```

Any job with an issue gets the sensor text. For the other branches the owner is implied by the verb ("Acknowledge issued pack" = technician; "Complete field checks" = technician) and named only in the warning case. The column mixes coordinator and technician work with no owner axis, in a view whose purpose is coordinator triage.

**Fix (r05):** `{ owner, action, due, source }` derived from the record (issue → coordinator; pack state → technician; appointment state → technician), rendered as "Owner · action · due".

### M5 · Coordinator handover is per technician, rendered per job

`t.handover` is a property of the technician and is rendered in every job drawer for that technician. Verified: Riley's afternoon EC-meter instruction is shown under the 08:00 fertigation inspection. The Technicians table labels it correctly ("Coordinator handover" per person); the drawer does not.

**Fix (r05):** either scope handover to the visit (the useful unit — "for this visit, bring X") or label the drawer block "Handover for Riley Bennett · today" so it is not read as visit-specific.

### M6 · The team table hides the current visit

"Next visit" is `js.find(j => j.start >= "09:40")`. For the two technicians who are *On site* it shows the afternoon visit (13:00, 12:00) and nothing about the visit they are on now. The information exists — two rows in Visits are "In progress" — but the Technicians view cannot show it.

**Fix (r05):** "Current visit" and "Next visit" as separate cells, or one cell with "Now: … · Next: …".

### M7 · Frozen clock and hard-coded zone

`"09:40"` is a string literal in `renderTeam()`; the context bar says "Availability at 09:40 AEST"; the drawer prints `AEST` as a literal. Same class of finding as C4 in the estimating audit and M6 in the Job Pack audit: derive time and zone from the site/schedule read. The decision record already says "explicit Australia/Brisbane display time" — the design should show where that comes from.

### M8 · No loading, failure, unavailable or empty-day state is designed

The decision record: "Loading, failure, invalid dates and incomplete reads show unavailable values. Refresh closes details." BP-07 §2: "an unavailable state states what failed and offers recovery." The presentation defines one empty state (no matches) and nothing for a schedule read that fails, is partial, or returns no visits for the day; nor a date or site selector, both of which the adapter had to add. A coordination screen's failure state is part of its design, not a developer detail.

---

## 5. Moderate findings — rendered UX and accessibility

### U1 · Drawer opens focused on the Close icon

`openJob()` ends with `$("#ft-close-dialog").focus()`. Confirmed on open via link and via row. A screen-reader user is told "Close job details" before hearing the job title; a keyboard user starts three stops away from the Overview tab. Focus the drawer heading (`tabindex="-1"` on `#ft-dialog-title`) or the selected tab.

### U2 · Draft status does not update while typing

`.ft-draft-message` (`role="status"`) is set only when the drawer is rendered. Typed into both fields: message stays empty; reopened: "Draft retained in this preview." A status region that reports the past but not the present.

### U3 · "Close details" wraps to three lines at 390 px

Measured: the `#ft-done` button is **86 × 63 px** (three lines) beside a 251 px footer paragraph. Let the paragraph take the full row above the button on narrow widths, or shorten the label to "Close".

### U4 · Grammar: "1 need preparation"

`js.filter(needsPreparation).length + " need preparation"` → "1 need preparation" for Alex and Morgan. Pluralise.

### U5 · The attention view offers status filters that can only return empty

`syncControls()` populates the status filter from all seven jobs regardless of view. In Needs preparation, three of the five status options ("In progress", "Ready for visit", "Travelling") can only yield "No matching visits" — verified for "In progress". Populate from the view's own row set.

### U6 · Record links are 22 px tall on desktop

`.ft-record-link` renders at **190 × 22 px** (visits) and **80 × 22 px** (technicians). WCAG 2.2 SC 2.5.8 is satisfied only through the "equivalent target" exception because the whole row is clickable; the button itself — the accessible name of the row — is below 24 px. `min-height: 24px` costs nothing.

### U7 · Table semantics on phones

At ≤ 760 px `table { display: block }`, `tbody tr { display: grid }`, `thead` visually hidden. Chromium drops the implicit table/row/cell roles when display is overridden, so the cards are announced as a run of text with `::before` labels. The visual result is good; add explicit `role="table"`, `role="row"`, `role="cell"` (and `role="columnheader"` on the hidden `th`) so the six-column structure survives the reflow.

### U8 · Minor semantics

- `.ft-views` (`role="tablist"`) contains a non-tab `<span class="ft-preview-stamp">`; same fix as the Job Pack (`role="presentation"` or move it out).
- `#ft-results` is `tabindex="0"` at all widths; on phones it no longer scrolls (`overflow: visible`), so the stop is redundant there.
- `.ft-section-title` ("Authorised work scope", "Coordinator handover") are `<div>`s; the drawer's only heading below `<h2>` is the history event `<h3>`. Make section titles `<h3>`.
- `#ft-result-count` is `role="status"` and re-rendered on every keystroke; polite but chatty. Announce on filter commit, or debounce.
- History dates mix `02 Sep 2026` with `21 Jul 2026`; Job Pack r02 uses `4 Sep 2026`. One date format across modules (dd Mon yyyy without leading zero matches the Job Pack).

### U9 · Summary metrics disappear below 900 px container width

`.ft-outlook { display: none }` under both the container query and the phone media query. "Visits today" survives as the tab count; "On site" and "Preparation needed" survive only as the Needs preparation count. Fold "On site" into the context bar rather than dropping it.

---

## 6. Design system and code quality

### D1 · Token coverage

| Measure | Count |
|---|---|
| Declared tokens | 8 (`--navy --green --ink --muted --line --surface --bg --focus`) |
| `--ink` | duplicate of `--navy` (same value, 2 references) |
| Hard-coded hex occurrences outside `:root` | **68** |
| Unique hard-coded values | **54** |
| Brand green references | 4 (view-tab underline, drawer-tab underline, selected-row rule on desktop and on phone) |
| Inline `style=""` in JS templates | 15 |

The three containers now carry three near-identical but non-identical status palettes (`#26746e`, `#3e6f32`, `#316580`, `#80530e` here; `#416d33`, `#346580`, `#80530e` in Job Pack; `#3d692f` in estimating). Same recommendation as before, with more urgency: one semantic token set before any component extraction.

### D2 · Code

24.2 kB single IIFE, 747 lines reformatted; nine module-scope `let` mutables plus `viewState` and `drafts`; whole-list `innerHTML` re-render on every keystroke (fine at 7 rows; the adapter will page). Notes:

- `.ft-status` is declared twice in sequence; the second overrides `white-space: nowrap` → `normal`. Dead rule.
- `.ft-form-actions` is styled but never rendered — the note form has no submit control, which is intended (memory-only) but the CSS says otherwise.
- `nextAction()` and the pack panel contain fixture-specific literals ("r02", the four document references, the sensor text) that read as model output. Mark them as fixture or derive them.
- Browser floor is set by container queries and `100dvh` — Chrome 108 / Safari 16 / Firefox 110; `scrollbar-gutter` is a progressive enhancement (Safari 17.4). Safari 15 does not support container queries; state the floor.
- No print stylesheet. A daily run sheet is the obvious print case for this screen; backlog, not r05.

---

## 7. Where the design could expand

**Day and site selection.** The adapter has them; the design does not. A date stepper with "Today", and the 50-site selector the handover mentions, belong in the context bar.

**Current / next / remaining per technician.** The Technicians view is a roster; a coordinator wants "where is everyone now" — current visit, next visit, remaining count, and travel state between them.

**Dispatch component as a first-class column.** BP-07 P06 derives dispatch from non-waivable controls plus crew responses. A column that says "Dispatch: held · pack review required" replaces both the conflated Status values and the readiness sub-text.

**Owned follow-up in the drawer.** The decision record maps "Field notes and handover" to links to existing owned follow-up records. A "Follow-up" list (owner, due, source record) in the drawer would make the next-action column explainable.

**Multi-day and unassigned demand.** BP-07 §9 describes proposed cards and unassigned demand with earliest/latest windows. The screen is single-day, assigned-only.

**Run sheet print.** Per technician, per day, with pack revision and acknowledgement state.

---

## 8. Proposed r05 scope

**Stream A — traversal and coherence (first)**

| # | Change | Closes |
|---|---|---|
| A1 | Drawer actions: Open job pack rNN (with current issue state), Open work order, Open appointment, Open equipment record, Open in My Jobs; reconcile with the shipped adapter | M1 |
| A2 | Align `SYN-PPO-APT-000242` with Job Pack r02 (date, window, contact, customer, pack state) or use a different example appointment; record which file is canonical for pack state | M2 |
| A3 | Current issue revision and state on the Job pack tab | M1 |

**Stream B — state vocabulary**

| # | Change | Closes |
|---|---|---|
| B1 | Status = appointment state only; readiness/dispatch outcome in its own column; status filter per axis | M3 |
| B2 | Next action as `{owner, action, due}` derived from record state | M4 |
| B3 | Handover scoped to visit, or labelled as per-technician-day | M5 |
| B4 | Current visit + next visit in the Technicians table | M6 |
| B5 | Time and zone from the schedule read; no literal clock | M7 |
| B6 | Designed states: loading, read failed, partial read, no visits today, date/site selector | M8 |

**Stream C — rendered refinements**

| # | Change | Closes |
|---|---|---|
| C1 | Focus drawer heading on open | U1 |
| C2 | Live draft-retained status | U2 |
| C3 | Footer layout at ≤ 760 px so Close details does not wrap | U3 |
| C4 | Pluralisation; per-view status options; 24 px record links | U4, U5, U6 |
| C5 | Explicit table roles on the phone card layout | U7 |
| C6 | `role="presentation"` on the stamp; drop results `tabindex` on phones; `<h3>` section titles; debounced result-count status; one date format | U8 |
| C7 | Keep "On site" in the context bar below 900 px | U9 |

**Stream D — tokens (shared with Job Pack and Estimating)**

| # | Change | Closes |
|---|---|---|
| D1 | One semantic token set across the three containers; remove the 54 hard-coded values and 15 inline styles; drop `--ink` | D1 |

A1/A2 first because the app already carries an undesigned version of A1 and reviewers will read the two baselines side by side. B is a design decision with read-contract implications. C can land as a single presentation-only revision. D is a prerequisite for component extraction and should be scheduled once for all three containers.

---

## 9. Verification statement

**What was done.** SHA-256 computed and matched to the decision record; the file audited is byte-identical to the approved r04. Decomposed into CSS (207 lines), markup and script (747 lines reformatted); all read in full. The decision record, integration handover, BP-07 r10 and the Job Pack r02 baseline (already decomposed for the previous audit) were used as references. Three Playwright 1.56 / Chromium 1194 runs measured console output, overflow, contrast for every text-bearing element on all three views at four viewports, target sizes, tab order, arrow-key handling in both tablists, drawer open/close/return-focus by link, row, Esc, backdrop and Close details, filter state across view switches, person drill-down, empty states, escaping through the note fields, draft retention, mobile card layout and drawer geometry, and the drawer's link inventory. Screenshots at 1440, 820 and 390 px were inspected.

**Every quantity in this report was reproduced.** Interpretations are worded as such.

**What was not done.** No screen-reader testing; no Safari or Firefox; no real device; no test of the shipped `/service/technicians` adapter — this is an audit of the design file only, and statements about what the adapter added are taken from the handover document, not observed. No code changes were made.

**Assumptions.** Job Pack r02 is treated as the authoritative example of pack state for the shared appointment, because the pack page is the record of that state. The decision record's application-mapping table is taken as the current statement of intent for what the drawer must link to.

**Explicitly not certified.** Design and rendered-behaviour audit of an approved preview. Not an accessibility certification, not adapter acceptance, not operational readiness.
