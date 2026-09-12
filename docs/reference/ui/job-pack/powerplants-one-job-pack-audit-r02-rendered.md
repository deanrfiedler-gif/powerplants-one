# PPO Job Pack — r02 rendered audit and r03 refinement scope

**Subject** `powerplants-one-job-pack-r02.html` (446,869 bytes; 1 embedded WOFF 373.7 kB, 22.6 kB CSS, 36.5 kB JS, 13.8 kB static markup)
**Baseline identity** SHA-256 `fe2ded4a0cd9813c06e666499cc9842691e73c95be9b9e18f2aae9bf59c262fd` — **identical to the approved design baseline** recorded in `docs/decisions/job-pack-design.md` (approved 10 September 2026, work item #103). The approved bytes were not modified.
**Audit date** 12 September 2026
**Scope** Full-stack, balanced: workflow and state model, readiness and validation logic, traceability, UX, accessibility, responsive and print rendering, design system, code quality, alignment with BP-07 r10 §8 and PPO-STD-001 r03
**Method** Static reading of the decomposed source, then three instrumented Playwright 1.56 / Chromium 1194 runs against the file at 1440 × 960, 1024 × 768 and 390 × 844, plus A4 PDF generation. Every quantity below was measured, not estimated.
**Stored as** `docs/reference/ui/job-pack/powerplants-one-job-pack-audit-r02-rendered.md` — the rendered-verification companion to the original [audit r02](powerplants-one-job-pack-audit-r02.md). Successor design: [r03](powerplants-one-job-pack-r03.html) with its [change record](powerplants-one-job-pack-r03-change-record.md).

---

## 1. Verdict

r02 holds up in the browser. The four rendered acceptance checks that the original audit could not execute — desktop, narrow viewport, keyboard/dialogs, A4 print — all pass structurally: no console or page errors, no horizontal page scroll at 390 px, no output-escaping failures, correct tab semantics, correct dialog return-focus, and a four-page A4 print that includes all nine sections with the draft/readiness status line. The design decision to lock r02 as the presentation baseline is sound and nothing here reopens it.

What the browser did expose is a set of refinements that were invisible to the Node VM checks, and three structural gaps that will matter at integration:

1. **The revision history records a stale reason.** The "Preparation / change reason" field persists across saves, so two consecutive saves for different edits recorded the identical reason text. For a page whose purpose is traceable preparation, this is the finding that matters most.
2. **Readiness is binary; BP-07 §8 is not.** The specification gives every criterion the outcomes Unknown / Pass / Blocked / PermittedException / NotApplicable, with policy version and blocking stage, and explicitly permits "a documented non-critical tool collection plan before dispatch". The preview hard-blocks review submission on an unavailable probe with no route to record an evidenced exception.
3. **Section-level provenance has no as-at.** Every section carries a source tag ("From work order and schedule") but none says which version or timestamp of that source it reflects; the only version shown anywhere is "Linked to scope r01" in a rail that is removed on mobile and in print. BP-07 §8 requires issue to record current scope/appointment versions and the source manifest.

Plus a handful of rendered defects that should be fixed in a successor: the contents rail cannot select section 08 (scroll-spy threshold), confirmation dialogs open focused on the Close icon, the print status line reads "DRAFT r01 · DRAFT", a subheading orphans at the foot of print page 3, event timestamps use a different format from the seeded events, and on a phone there is no unsaved-changes signal on the Job pack view.

**Recommendation:** keep r02 as the approved baseline. Record an **r03 successor** with the bounded scope in §8, preserving the r02 bytes and hash per the decision record. Streams A and B (traceability, readiness outcomes) should be settled as design decisions before integration work applies the presentation to the P06 pack workbench, because they change what the server must supply, not just what the page shows.

---

## 2. Deferred acceptance checks — executed

The original audit listed four checks it could not run. Results:

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | **Desktop** 1440 × 960 and intermediate 1024 × 768 | **Pass** | Outer margins, header wrap, three-column layout and readiness column render as designed; at 1024 px the rail correctly drops to a two-column row under the pack. One cosmetic note (§5 U8) |
| 2 | **Narrow viewport** 390 × 844 | **Pass** | `documentElement.scrollWidth` = `clientWidth` = 390 on all three views; the tools table (460 px min-width) is the only element wider than the viewport and it scrolls inside its own `role="region"` wrapper; all controls and both sticky action buttons reachable; error-link focus lands 317 px above the sticky bar |
| 3 | **Keyboard and dialogs** | **Pass with refinements** | Tab order sensible; ArrowRight/ArrowLeft/Home/End move between tabs and switch panels; Esc and backdrop click close dialogs; focus returns to the triggering button (`View equipment record`, document title) and falls back to the active tab when the trigger has become disabled; validation link moves focus to the exact control; visible focus ring on every stop. Refinements at §5 U2, U3 |
| 4 | **A4 print** — incomplete draft and unsaved changes | **Pass with refinements** | 4 pages A4, all 9 sections, status line and readiness summary present, `UNSAVED ENTRIES EXCLUDED` appended when dirty, print from the Preparation view correctly prints the Pack panel; badges, checkboxes and table headers render. Refinements at §5 P1–P4 |

Additional checks not in the original list: **0** console errors and **0** page errors across all views, dialogs and viewports; **1** WCAG AA contrast failure across all views and viewports — the current contents-rail number at desktop and 1024 px (§5 U6) — out of 219 text-bearing elements measured on the desktop pack view alone; output escaping held under `<img onerror>` injection into all eight text fields (0 executions, 0 injected elements, textarea values preserved verbatim).

---

## 3. What is already right

Stated so it does not get changed by accident.

| # | Finding | Evidence |
|---|---|---|
| S1 | **Separation of preparation, review, issue, acknowledgement, dispatch and work authority is explicit and consistent** | Pack record card, review dialog copy, Site controls note, Completion note and print status all state that readiness grants no authority; "Review requested" locks the fieldset and reads "r01 has not been issued" |
| S2 | **Validation and readiness agree** | With errors empty, all six readiness rows are `ok`; JP-06 from the prior audit holds — a blank change reason is both a readiness failure and a submission blocker |
| S3 | **Saved-draft vs unsaved-entry semantics are honest** | Checklist and print describe the saved draft and say so; submission validates the live form; print with unsaved entries offers Save-and-print / Print-saved / Cancel |
| S4 | **Escaping holds everywhere user text is rendered** | `escape()` applied on pack sections, form re-render, revision events and error messages; `notify()` uses `textContent` |
| S5 | **Focus management is deliberate** | `dialogReturn` with disabled/hidden fallback; `#form-errors` is `tabindex="-1"` and focused on failed submit; section anchors are `tabindex="-1"` targets; `scroll-margin-block` keeps focused fields clear of the sticky bar (measured: not occluded at either width) |
| S6 | **Real tab semantics** | `role="tablist"` / `tab` / `tabpanel`, `aria-selected`, roving `tabindex`, arrow-key handling — better than the estimating container's `aria-pressed` buttons |
| S7 | **Mobile is a designed layout, not a squeezed one** | 16 px type, 44 px controls, single-column info grids, jump select replacing the rail, table region with keyboard focus |
| S8 | **Print is designed** | `@page A4 15mm`, `break-inside: avoid` on grid cells, rows, documents and history items, `thead` repeat, orphans/widows 3, chrome suppressed |
| S9 | **Timezone handling is explicit** | Visit window shows "AEST (UTC+10)"; event timestamps are generated in `Australia/Brisbane` |
| S10 | **Synthetic marking is prominent** | SYN- references, "Fictional example" on the phone number and address, "Design r02 · Fictional records" foot, `noindex,nofollow`, per-dialog disclaimers |
| S11 | **Restrained visual system consistent with the approved Field Technicians direction** | Navy primary, green active-tab indicator, white bordered panels on pale grey, 12 px minimum text (11 px only on `aria-hidden` avatars) |

---

## 4. Major findings — traceability and model alignment

### M1 · The change reason is stale on every save after the first

`saveDraft()` records an event whose detail is `saved.changeReason.trim()`. The field is an ordinary persistent textarea seeded with "Initial job-pack preparation for the scheduled controls inspection." and nothing clears or re-requests it.

**Reproduced:** saved once with the access confirmation added, then again with the tool notes edited, without touching the reason field. Both events in Revision history read:

```
Draft preparation saved
Initial job-pack preparation for the scheduled controls inspection.
12 Sept, 11:56 am AEST · Preview session
```

Two different changes, one identical reason, no field-level delta. The help text says "This explanation is retained with the preparation event" — it is, but it is the wrong explanation. The pattern trains coordinators to leave the reason alone, which is worse than not asking.

**Fix (r03):** make the reason a per-event input — clear it after a successful save, or move it into a save/submit confirmation step. Record what changed alongside why (field names or section numbers at minimum; before/after for the short fields). This is the same class of gap as M8 in the estimating audit and should be closed the same way before either container is ported.

### M2 · Readiness outcomes are binary; the specification's exception path is missing

`readiness()` returns `ok: true|false` for six checks. BP-07 §8: criteria have outcomes **Unknown, Pass, Blocked, PermittedException, NotApplicable**, each identifying its policy version, blocking stage and whether exceptions are allowed; "PP-01 synthetic policies allow a documented non-critical tool collection plan before dispatch".

**Reproduced:** `Reference temperature probe = Unavailable` → submission error "Tools prepared: Reference probe unavailable — arrange an alternative." There is no field in which to arrange or record an alternative; the only way past the gate is to select "Collected" for an instrument that is not collected.

The decision record already says the six-item client checklist cannot replace server readiness. Agreed — but the *presentation* of readiness needs the outcome vocabulary, because the coordinator has to see and enter an evidenced exception somewhere, and the reviewer has to see that one was taken. Site access and controls remain non-overridable (the specification is explicit); tools are the criterion that needs the third state.

**Fix (r03):** present readiness rows with outcome, policy reference and "exception permitted" flag; for the tool criterion add an evidenced exception entry (what, who approved, plan) that satisfies review without pretending the instrument was collected.

### M3 · No source as-at on any section

Each section's source tag names its origin but not its version or timestamp. The only version anywhere is `Linked to scope r01` in the contents-rail foot, which is `display:none` at ≤ 760 px and in print. Section 01 shows the appointment reference but not its version; section 04 shows configuration r03 (good) but no register as-at; section 06 shows document revisions (good).

BP-07 §8: "Issue records exact rendered object/hash, source manifest, current scope/appointment versions, template version and recipient assignments" and "every confirmed date/time/crew change creates a pack review requirement". A coordinator reading section 01 cannot tell whether the visit window shown is the current appointment version.

**Fix (r03):** extend the source tag to `From work order WO r01 · appointment v3 · as at 10 Sep 2026 14:18`, and surface a "source changed since draft" state in the notice bar — that is the presentation of TR-07's review requirement, and it is absent.

### M4 · Two of six readiness checks are structurally always true

- "Scope and visit linked" is hard-coded `ok: true`.
- "Completion requirements" tests that evidence items 0 and 1 are selected — both are rendered as `disabled` + `checked` and cannot be changed, so the check cannot fail.

"4 of 6 preparation checks complete" therefore means 2 of the 4 checks that can vary. Separately, the review dialog hard-codes `"6 of 6 complete"` and `renderPrintSummary()` uses the literal `6 -`. The numbers are correct today because the rows are fixed, but the count inflates apparent progress and the literals will drift the first time a criterion is added.

**Fix (r03):** show linked-source facts as context rows without a tick, count only assessable criteria, and derive every count from `readiness().length`.

### M5 · The originating reported issue can be dropped from the pack silently

History entries are optional checkboxes with no validation. Deselecting `h1` — the 4 September alarm report that is the reason for this diagnostic visit — produces "No history selected for this draft." with no readiness impact. Documents distinguish required from optional; history does not.

**Fix (r03):** mark history entries linked to the work order's originating ticket as required, with the same per-item error pattern as documents.

### M6 · Event timestamps do not match the seeded event format, and carry no actor

`now()` produces `12 Sept, 11:56 am AEST · Preview session`; the seeded events read `10 Sep 2026 · 14:20 AEST · Alex Nguyen`. Four differences in one line: no year, 12-hour vs 24-hour, `Sept` vs `Sep` (en-AU ICU), comma vs middle dot — and the actor is "Preview session" rather than the coordinator shown as "Prepared by". Also the zone label `AEST` is a string literal next to a Brisbane-fixed formatter; a site outside Queensland would be mislabelled.

**Fix (r03):** one formatter for all events (`dd Mon yyyy · HH:mm ZONE · actor`), zone from the site record, actor from the session.

### M7 · Reference formats do not follow the SYN-PPO registry

`SYN-PPO-PACK-000185`, `SYN-PPO-WO-000185` and `SYN-PPO-APT-000242` follow PPO-STD-001 §10.1–10.2 (`SYN-PPO-<TYPE>-<SEQUENCE>`). The remaining references do not: `SYN-CC03-CONFIG`, `SYN-PH-CTRL`, `SYN-FG-SITE` (documents), `SYN-INST-014` (instrument), `SYN-CC03-026` (used as the serial number). The equipment CC-03 has a registry code available (`SYN-PPO-AST-nnnnnn`); controlled documents and instruments have no registered type code.

This is fictional data, but the approved page is the presentation baseline that integration will copy. Either the references should be corrected to the registry at r03, or the registry needs a decision on document and instrument reference types (document identity probably belongs to SharePoint with revision separate, per BP-02). Also: the standard requires synthetic outputs to state **"Synthetic example — not for operational use"** (§11.1); the print status line says `DESIGN PREVIEW · FICTIONAL RECORDS`, which is honest but not the standard wording.

---

## 5. Moderate findings — rendered UX, accessibility, print

### U1 · The contents rail cannot select section 08

The scroll-spy selects the last section whose top is ≤ 100 px. At 1440 × 960 the page's maximum scroll leaves section 08 at **136 px** from the top, so it can never satisfy the threshold.

**Reproduced:** click `07` → current = 07 (top 24 px). Click `08` → page scrolls to its maximum (2872 px), the scroll handler runs, **current reverts to 07**. Click `09` → current = 09, but only because the page could not scroll and no scroll event fired. Section 09 is therefore selectable and section 08 is not, which reads as a glitch.

**Fix:** when `scrollY` is at maximum, select the last section; or select the section occupying the largest share of the viewport rather than the last one past a fixed line.

### U2 · Dialogs open focused on the Close icon

No `autofocus`; `showModal()` focuses the first focusable descendant, which is the icon-only close button in the dialog heading. Confirmed for the equipment record dialog and the **"Submit draft r01 for review"** confirmation — a keyboard or screen-reader user submitting the pack is placed on "Close details" and must tab past Cancel to reach Submit.

**Fix:** `autofocus` the primary action on confirmation dialogs; focus the heading (`tabindex="-1"`) on information dialogs.

### U3 · The Pack view has no unsaved-changes signal on a phone

`.tab-trailing` (which carries "Unsaved preparation changes") is `display:none` at ≤ 760 px. Edited a field, switched to Job pack at 390 px: **zero** visible elements containing "unsaved". The sticky bar in Preparation still says "Unsaved changes", but the coordinator is now looking at a pack that does not reflect their edits with nothing telling them so. `beforeunload` guards reload, not misreading.

**Fix:** move the indicator into the status badge row or the notice bar on narrow widths rather than hiding it.

### U4 · Submit is at the bottom of the pack on phones and intermediate widths

At 390 px the "Submit for review" button sits at **6,254 px of 6,937 px** (90 % of the page); at 1024 px the rail also drops below all nine sections. The notice bar at the top offers "Complete preparation" while items are pending, but when preparation is complete it offers only "Review preparation" — no submit. The primary next action is furthest from the primary status.

**Fix:** when readiness is complete, make the notice bar's action "Submit for review"; consider a compact readiness summary in the notice at narrow widths.

### U5 · Print status line duplicates the state

`renderPrintSummary()` builds `DRAFT r01 · ${state.toUpperCase()} · NOT ISSUED`, which in the draft state renders **`DRAFT r01 · DRAFT · NOT ISSUED`**. Correct in the review state (`… · REVIEW REQUESTED · …`).

### U6 · One contrast failure on the current contents-rail row

`.nav-number` on the `aria-current` row: `#667181` on `#ebefe9` = **4.25:1** (needs 4.5:1, 12 px/400). Every other text element passes on all three views (219 elements measured on the desktop pack view). The label of the disabled "Previous controls-area sketch" option is 3.78:1; it is the text of an inactive control, which WCAG exempts, but it is also the only explanation of why the sketch cannot be selected, so it is worth lifting.

### U7 · Minor semantics

- `#page-tabs` (`role="tablist"`) contains a non-tab `<span class="tab-trailing">`; give it `role="presentation"` or move it outside the tablist.
- Both tabpanels are `tabindex="0"` although they contain focusable content; this adds a redundant Tab stop (observed as stop 4 in the tab sequence). APG only recommends the panel be focusable when it has no focusable children.
- History items use `<h4>` directly under the section `<h2>` (h3 skipped) in the pack view.
- The "Job pack **9**" count has no accessible explanation, unlike "Preparation **2**" which has an `aria-label`.
- `#toast` receives its text while `hidden` and is then revealed; some AT does not announce a `role="status"` region whose content changed while it was not in the tree. Reveal first, or keep the region present and swap text only.
- Validation message "Customer arrangements is required." names the readiness label, not the field label "Arrival and customer arrangements"; same for "Escalation instructions" vs "Escalation and remaining-work instructions".

### U8 · Intermediate width: the crew card stretches to the readiness card's height

At 1024 px the two-column rail uses default `align-items: stretch`; the Crew acknowledgement card is stretched to **523 px** (matching the readiness card) around **122 px** of content. `align-items: start` on the rail at that breakpoint.

### U9 · Contents-rail context is lost on phones

At ≤ 760 px the rail's nav, the pending-section warning markers and the foot ("Linked to scope r01 · Visit 11 Sep 2026 · All visit times in AEST") are all removed; the jump select carries no warning markers; "Prepared by" is also hidden. The scope revision and timezone note have no other home on a phone. Fold the foot into the pack subtitle and prefix pending options in the jump select ("07 · Parts, tools and readiness ⚠").

### P1 · Orphaned subheading at the foot of print page 3

"Collection and preparation instructions" (a `<p class="subheading">`) prints as the last line of page 3 with its body on page 4. `break-after: avoid` is applied to `.section-head` only. Apply it to `.subheading` too.

### P2 · Page 2 ends with roughly a quarter of the page blank

Section 05 starts on page 3 although its heading and first history item would fit; the combination of `break-after: avoid` on the heading and `break-inside: avoid` on the first item is pushing the pair. Acceptable, but worth a look after P1.

### P3 · Pages 2–4 carry no pack identity

Only page 1 has the reference line, title and status. A page separated from the set has nothing that identifies the pack, revision or draft status. PPO-STD-001 §11.1 requires the pack reference, revision and status to appear inside the document; BP-07 §8 requires issue to record the exact rendered object. Add a repeating print header (`position: fixed` block in `@media print`, or `@page` margin boxes where supported) carrying `SYN-PPO-PACK-000185 · Draft r01 · Not issued · page n`.

### P4 · Print drops per-section provenance and the preparer

`.source-tag` and `.heading-right` are hidden in print. The printed pack therefore says nothing about where each section's content came from or who prepared it. Provenance is more valuable on paper than on screen, not less.

---

## 6. Design system and code quality

### D1 · Token coverage

| Measure | Count |
|---|---|
| Declared tokens | 8 (`--navy --green --muted --line --paper --surface --warn --focus`) |
| Tokens never referenced | **2** (`--surface`, `--warn`) — `th` background and the "Held" colour are hard-coded instead |
| `var()` references | 57 |
| Hard-coded hex occurrences outside `:root` | **79** |
| Unique hard-coded values | **64** |
| `#242a37` (navy) as a literal | 3 |
| Brand green `--green` references | **2** (active tab underline, current rail row) |
| Inline `style=""` attributes | 16 in JS templates, 9 in static markup |

The same pattern as the estimating container: a competent grey/navy palette with amber, green and blue status clusters (`#80530e/#fff2d9`, `#416d33/#edf5e9`, `#346580/#e9f2f8`) that are not tokens and not shared. Both containers should draw from one semantic token set before either is componentised — this is cheapest now.

### D2 · Code

36.5 kB single IIFE, 1,007 lines reformatted; module-scope mutable state (`saved`, `state`, `dirty`, `activeView`, `events`); whole-section `innerHTML` re-render; dirty detection by `JSON.stringify` equality. All appropriate for a design preview and none of it should be ported as-is — the decision record already says so. Specific notes:

- Browser floor is set by `100dvh`, `<dialog>` and `structuredClone` — Chrome 108 / Safari 15.4 / Firefox 101. Fine for an internal app; state it.
- `#ppo-job-pack [hidden]{display:none!important}` vs print `#ppo-job-pack #panel-pack{display:block!important}` resolves by specificity (2,0,0 beats 1,1,0) — verified the Pack panel prints from the Preparation view, but this is fragile and deserves a comment or an explicit print class.
- `focusJump()` calls `selectSection()` and then the scroll handler immediately overrides it (U1). Two owners for one piece of state.
- The `history` and `documents` fixture arrays mix content with presentation copy; at integration these become permission-filtered reads.

---

## 7. Where the design could expand

Backlog observations, not r03 scope.

**Pack lifecycle after review.** The preview stops at "Review requested". The screen has no presentation for Checked, Issued rNN, Superseded, Withdrawn, or a successor Draft r02 alongside an issued r01 (TR-07). The Revision history tab is the natural home and currently shows only preparation events.

**Acknowledgement per recipient.** The Crew acknowledgement card shows one technician and "Not yet requested". TR-06 binds each technician to an exact issue; the card should be a list with per-person state (Requested / Opened / Acknowledged / Declined) against the issue revision.

**Dispatch component.** "Dispatch: Held" is a static value. BP-07 P06 defines a derived dispatch component from non-waivable controls plus crew responses; the Pack record card is where its constituents should be listed.

**Source-change review requirement.** When the appointment, scope or crew changes after the draft, the pack needs a "review required" state with the change category (M3). Nothing in the notice bar vocabulary covers it.

**Not-applicable sections.** BP-07 §8: each section "is present or carries an allowed not-applicable/exception outcome with assessor and evidence". A parts-free inspection currently prints "No replacement parts are included" as prose; a formal N/A outcome with assessor would satisfy the specification.

**Field-level change history.** Events are prose; a reviewer cannot see what changed between saves (M1).

**Document resolution states.** The disabled "superseded" sketch demonstrates one state; integration needs Unavailable, Superseded, Permission-restricted and Retrieval-failed, each with the permitted next action.

---

## 8. Proposed r03 scope

Bounded, ordered by dependency. Everything here traces to a finding above. r02 bytes and hash are preserved; r03 records its rationale as a successor per the decision record.

**Stream A — traceability (do first)**

| # | Change | Closes |
|---|---|---|
| A1 | Per-event change reason (cleared after save or captured in the save/submit step); record changed fields with the event | M1 |
| A2 | Single event formatter `dd Mon yyyy · HH:mm ZONE · actor`; zone from site; actor from session | M6 |
| A3 | Source as-at and version on every section source tag; "source changed since draft" notice state | M3 |

**Stream B — readiness model**

| # | Change | Closes |
|---|---|---|
| B1 | Readiness rows show outcome (Pass / Blocked / PermittedException / NotApplicable), policy ref and exception-permitted flag | M2 |
| B2 | Evidenced exception entry for the tool criterion; site access and controls remain non-overridable | M2 |
| B3 | Linked-source facts shown as context, not counted; counts derived, no `6` literals | M4 |
| B4 | Required history entries (originating ticket) with per-item errors | M5 |

**Stream C — rendered defects and accessibility**

| # | Change | Closes |
|---|---|---|
| C1 | Scroll-spy: select last section at max scroll or by viewport share | U1 |
| C2 | `autofocus` primary action on confirmation dialogs; heading focus on information dialogs | U2 |
| C3 | Unsaved indicator visible on the Pack view at narrow widths | U3 |
| C4 | Notice-bar action becomes "Submit for review" when complete | U4 |
| C5 | Fix `DRAFT r01 · DRAFT` | U5 |
| C6 | Current-row `.nav-number` inherits navy; lift unavailable-option text | U6 |
| C7 | `role="presentation"` on `.tab-trailing`; drop `tabindex` from tabpanels; h3 for history items; label the "9" count; toast reveal order; field-label map for errors | U7 |
| C8 | `align-items:start` on the two-column rail; jump-select warning markers; scope/timezone note on phones | U8, U9 |

**Stream D — print**

| # | Change | Closes |
|---|---|---|
| D1 | `break-after: avoid` on `.subheading` | P1, P2 |
| D2 | Repeating print header with pack reference, revision, status and page number | P3 |
| D3 | Print source tags and preparer | P4 |
| D4 | Standard synthetic wording "Synthetic example — not for operational use" | M7 |

**Stream E — naming and tokens (integration prerequisites)**

| # | Change | Closes |
|---|---|---|
| E1 | Correct fixture references to the SYN-PPO registry, or record a registry decision for document and instrument references | M7 |
| E2 | Shared semantic token set with the estimating container; remove 64 hard-coded values and 25 inline styles | D1 |

Streams A and B are design decisions with server implications and should be settled in the decision record before integration. C and D are presentation-only and can land together as r03. E1 is a naming decision; E2 should precede any component extraction from either container.

---

## 9. Verification statement

**What was done.** The uploaded file's SHA-256 was computed and matched to the hash recorded in `docs/decisions/job-pack-design.md`; the file audited is byte-identical to the approved baseline. The file was decomposed into CSS, markup and script; the script (1,007 lines reformatted) and CSS (248 lines, 1,389 reformatted) were read in full. BP-07 r10 §8 and the P06–P08 amendments, the job-pack design decision, the original r02 audit and PPO-STD-001 §5–7 and §10–11 were read from `main` at `386d9a7` and used as the reference for alignment findings. Three instrumented Playwright 1.56 / Chromium 1194 runs measured console output, overflow, contrast (every text-bearing element, three views, three viewports), target sizes, tab order, tab-key handling, dialog open/close/return-focus, validation flow, error-link focus and occlusion, state transitions (Draft → Review requested → Draft), event text and timestamps, output escaping, reset, scroll-spy selection, mobile visibility of indicators and rail content, and print media emulation with A4 PDF output (page count, pagination, status lines). Screenshots at 1440, 1024 and 390 px and the rendered PDF pages were inspected.

**Every quantity in this report was reproduced.** Where a statement is an interpretation it is worded as such.

**What was not done.** No screen-reader testing (NVDA/JAWS/VoiceOver). No Firefox or Safari — `<dialog>`, `100dvh`, `structuredClone` and sticky positioning warrant a Safari pass before field use. No physical device or real touch input. No test of browser-native print dialog headers/footers (the PDF was generated by Chromium with the page's own `@page` margins; browser-added URL/title headers were not exercised). No code changes were made; the r02 file is untouched.

**Assumptions.** The page was audited standalone as a design preview, as the decision record directs. BP-07 r10 is taken as the governing specification for readiness outcomes and issue evidence. The SYN-PPO registry in PPO-STD-001 §10.2 is treated as the intended format for synthetic references in approved presentation baselines.

**Explicitly not certified.** This is a design and rendered-behaviour audit of an approved preview. It is not a statement that the P06 pack workbench implements any of it, not an accessibility certification, and not operational or production readiness.
