# PPO Field Technicians — design r05 change record

**Deliverable** `powerplants-one-field-technicians-r05.html` · 459,515 bytes · SHA-256 `72e80f59b9ad08860e0c00ab8e531c47af0cabc40b40210b8ed0142414761af9`
**Predecessor** Approved r04 · SHA-256 `b4d15630d89f0a74b795b9b2af6b83d9c4874d0e31d7e503f93d386a6555a704` · retained unchanged. The embedded Roboto WOFF and its OFL licence comment are byte-identical in r05.
**Revision note** The request named the successor "r04"; r04 is the approved baseline audited on 12 September, so this successor is **r05**, as the audit and the decision record anticipate.
**Date** 12 September 2026
**Basis** [Field Technicians r04 audit](powerplants-one-field-technicians-audit-r04.md) §8 (Streams A–D) and the cross-baseline alignment with Job Pack r03 ([change record](../job-pack/powerplants-one-job-pack-r03-change-record.md) §3.4).
**Status** Accepted by Dean Fiedler on 12 September 2026 as the r04 successor (see [decision](../../../decisions/field-technicians-design.md)). Not application code; the `/service/technicians` adapter, its reads and permissions are untouched. The decision record's "accepted presentation" list is preserved: padding, palette, typography, three views, six-column tables, phone cards, right-side drawer with four tabs, keyboard tab navigation, native modal behaviour.
**Stored as** `docs/reference/ui/field-technicians/powerplants-one-field-technicians-r05.html` and this record; the approved r04 stays at `docs/reference/powerplants-one-field-technicians-r04.html`.

---

## 1. What changed, by audit finding

| Audit | Change in r05 | Where |
|---|---|---|
| **M1** drawer dead end | Six route links across the four tabs: *Open work order WO rNN* and *Open appointment* (Overview); *Open job pack rNN / Open draft rNN* (primary) and *Full readiness* (Job pack); *Open equipment record* (Asset history); *Open in My Jobs* (primary, Field notes). Links carry the app route and, in this preview, show a toast naming it rather than navigating. | `routeLink()`, `openJob()` |
| **M2** baselines disagree on APT-000242 | Aligned to Job Pack r03: Friday 11 September 2026, 09:00–12:00, Fernridge **Demo** Growers · Propagation house, contact Taylor Reed · Nursery manager, pack **Draft r01 · not issued** (readiness 4 of 6), dispatch held, equipment `SYN-PPO-AST-000031`, pack `SYN-PPO-PACK-000185`. All seven visits now sit on the same sample day; the schedule read is stamped 08:40 AEST so the 09:00 visit is legitimately not yet dispatched. The second Fernridge visit uses the same customer name. | fixtures |
| **M3** status conflates schedule and readiness | *Visit status* shows appointment state only (Confirmed / In progress, from BP-07's vocabulary); a new *Readiness and dispatch* column shows the pack state with revision (acknowledged / issued · acknowledgement due / draft · not issued / review required) and the dispatch component (cleared / held · first reason, +n). Filters follow the two axes: *Visit status* and a new *Readiness* filter (cleared / held / acknowledgement due). | `packSummary()`, `renderVisits()` |
| **M4** next action has no owner | `nextAction()` returns `{owner, action, due}` derived from record state: issue → coordinator; pack not issued → coordinator; issued not acknowledged → technician; in progress → technician (progress as due); confirmed → technician (window). The column shows an owner label above the action; the drawer callout repeats it. | `nextAction()` |
| **M5** handover per technician shown per job | Each visit carries its own *Handover for this visit*; the technician's note is a separate *Day note for {name}* block in the drawer and the *Day handover* column in the Technicians table. | fixtures, `openJob()`, `renderTeam()` |
| **M6** current visit hidden | Technicians table gains a *Now* column (in-progress visit with progress, or "No visit in progress" / "Travelling") beside *Next visit*; visit counts read "2 visits · all prepared" or "1 visit · 1 needs preparation". | `renderTeam()` |
| **M7** frozen clock and zone literal | `schedule.asAt` and `schedule.timeZone` come from the read; the context bar shows "read 08:40 AEST"; the zone label, drawer times and dates are formatted through `Intl` from that record. No `"09:40"` or `"AEST"` literal remains in the script. | `schedule`, `zoneLabel()`, `fmt*()` |
| **M8** no designed states | Context bar gains a date stepper (previous / formatted date button opening the picker / next / Today) and a site selector; designed states for **loading**, **read failed** (no rows, no counts, retry), **partial read** (banner, counts marked †, footer "(partial read)") and **no visits scheduled** for a day or site. A footer *Preview read state* control demonstrates them. Counts show "—" and tab labels say "count unavailable" whenever the read is not complete. | `render()`, `renderCounts()` |
| **U1** drawer focus | Opens on the drawer heading (`tabindex="-1"`), not the Close icon. | `openJob()` |
| **U2** draft status not live | Updates on input: "Draft retained in this preview (not submitted)." | input handler |
| **U3** Close wraps at 390 px | Footer wraps: paragraph full width, button full width (353 × 44 px measured). Label shortened to "Close". | CSS |
| **U4** grammar / filters / targets | "1 needs preparation"; status options built from the rows the view can show (Needs preparation offers only *Confirmed*); record links 24 px minimum. | `plural()`, `syncControls()`, CSS |
| **U5** table semantics on phones | Explicit `role="table" / rowgroup / row / columnheader / cell` so the structure survives `display:block` reflow. | `renderVisits()`, `renderTeam()` |
| **U6** minor semantics | `role="presentation"` on the stamp; results region is a Tab stop only where it scrolls (removed at phone width); section titles are `<h3>`; result count announced through a debounced live region; one date format (`21 Jul 2026`, no leading zero) matching Job Pack r03. | markup, `scrollStop()`, `fmtDate()` |
| **U7** metrics lost below 900 px | "· 2 visits in progress · 3 need preparation" appears in the context bar when the header metrics are hidden. | `#ft-context-metrics` |
| **D1** tokens | 43 semantic tokens shared in name and value with Job Pack r03 (surfaces, lines, success / warning / danger / info / progress / neutral); 12 unique hard-coded values remain (shadows with alpha, two avatar tints, scrollbar colours, hover). Inline styles reduced from 15 to 12 `colgroup` widths. `--ink` kept as an alias of `--navy` for parity with Job Pack. | CSS |

Also: the fourth technician is renamed **Sam Okoro** (`SYN-PPO-PER-000003`). In r04 "Alex Nguyen" was both the electrical technician and the coordinator named in the sensor issue and in Job Pack r02/r03; the double role made the owned next action ("Alex Nguyen · Technician · Acknowledge issued pack") read as self-acknowledgement. Alex Nguyen remains the service coordinator. Technicians and equipment now carry `SYN-PPO-PER` / `SYN-PPO-AST` references; history entries cite their `SYN-PPO-RPT` / `SYN-PPO-TKT` origin.

## 2. Verification performed on the delivered file

Playwright 1.56 / Chromium 1194, same procedures as the r04 audit: 0 console / page errors on all three views at 1440 × 960, 1024 × 768, 820 × 800 and 390 × 844; `scrollWidth` = `clientWidth` at 390 px; 0 WCAG AA contrast failures (129 text-bearing elements on the desktop visits view; the r04 avatar borderline is resolved); minimum interactive target 24 px on desktop, 44 px on phones (the only smaller element is the visually-hidden date input behind the date button); drawer opens focused on its heading and offers six route links; Esc returns focus to the opening link; escaping held under `<img onerror>` in the note fields; status column shows appointment states only; Needs preparation offers only the statuses it contains; readiness filter *held* → 3 rows, *acknowledgement due* → 1 row; previous day → "No visits scheduled for 10 Sep 2026" with counts 0; Today → 7 rows; site filter Fernridge → 2 rows; read failed → "—" counts and "Counts unavailable"; partial → † counts and banner; retry → loading → ready with focus on the results region.

Not done: screen-reader, Safari/Firefox, physical device. `showPicker()` needs Chrome 99 / Safari 16; older browsers fall back to focusing the date input.

## 3. Decisions recorded with acceptance (12 September 2026)

1. **r05 accepted as the successor baseline.** Reconcile the shipped `/service/technicians` adapter's links and date/site controls with §1 (M1, M8).
2. **Pack reference derivation.** r05 derives `SYN-PPO-PACK-nnnnnn` from the work-order number so APT-000242 resolves to the Job Pack fixture (`…PACK-000185`). In the app the pack identity comes from the record; this is fixture convenience only.
3. **Readiness filter axis.** *Dispatch cleared / held / acknowledgement due* is a presentation of the P06 dispatch component and crew responses; confirm those are the values the schedule read will expose.
4. **Technician rename.** Sam Okoro replaces the technician "Alex Nguyen" for fixture coherence; no other document references the r04 technician by name.

## 4. Deliberately unchanged

Three views and their counts; six-column desktop tables and phone cards; drawer geometry and four tabs; memory-only notes with reload reset; per-view filter state; backdrop dismissal rules; no issued document, acknowledgement, dispatch or navigation is created in the preview.
