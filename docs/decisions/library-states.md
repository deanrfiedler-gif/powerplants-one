---
document_id: PPO-LIBRARY-STATES-PROP
date: 2026-11-10
owner: Dean Fiedler
status: Proposed design drawn in the private Figma file "PPO - Library" on 10 November 2026 at Dean's request; the five items in section 6 were confirmed by Dean on 11 November 2026, S2 and S4 with refinements; every component is Status Proposed until Dean accepts the page; nothing published from the library; no application code, route, migration, permission or deployment; every record shown is synthetic
versioning: git
---

# States · Loading, empty and errors in PPO - Library — proposal

**Owner:** Dean Fiedler · **Date:** 10 November 2026 · **Status:** Proposed. The five items in [section 6](#6-confirmed--11-november-2026) were confirmed by Dean on 11 November 2026. The page itself awaits acceptance.

After the [Forms page](library-forms.md), Dean answered for the second time: "Proceed however you believe is the most professional." States came next in the recommended order of the groups that section 5 of the [design-to-build standard](../standards/design-to-build-standard.md) requires and the library did not yet hold. This record covers that page, named "States · Loading, empty and errors".

The page gives every page one way to say what it is doing and what it knows: loading, empty, could not load, unavailable, not refreshed, incomplete, offline, a changed session, and a save whose outcome is unknown. It brings the accepted [System pages](system-pages-figma-design.md) parts into the library and adds the states the Time, Gantt and Forms pages had each drawn for themselves.

This record is a **proposal**. Drawing the page does not accept it, publish it or change any module file.

## 1. Sources

| Source | Status of source | Use |
|---|---|---|
| [System pages](system-pages-figma-design.md) (PPO-SYSTEM-PAGES-FIGMA-DEC) and its [retained captures](../reference/ui/application-shell/system-pages-design-r01/README.md) | Owner-accepted, 1 November 2026 | The message panel for page unavailable, workspace access denied, error and could not start, with a support reference and Copy (D5, D6, D11); one Outcome unknown banner with six states and the actions Check the outcome and Retry the same action (D7, D13, Q5); the offline and back-online banner (D8); inline notices for unavailable, could not load and loading; loading the workspace; session changed in another tab; unavailable never separating missing from no access (Q4); no Request access button (Q7); who to ask (Q8) |
| [PT-29](../testing/prototype-acceptance.md#pt-29--honest-empty-error-and-partial-states) and NFR-05 in the [master blueprint](../blueprints/BP-01-master-blueprint.md) | Planned acceptance; requirement | No records differs from could not load; errors offer recovery without stack traces or secrets; failed saves keep safe input; nothing unsupported appears successful; unavailable or partial data without false success |
| The [ReadState component](../design/development/components/read-state.md) | Repository; built | Loading, empty, filtered empty, denied, conflict, stale retained data and unknown write outcomes as distinct states |
| [Time](library-time.md), [Gantt](library-gantt.md) and [Forms](library-forms.md) records | Proposed | Placeholders while loading and the last good read with its time (Time); loading with counts withheld, a dash for a source that could not be read and view only (Gantt, PJ-03 PS12 and PS13); saving, saved and the uncertain save on forms (Forms) |
| [ADR-0013](ADR-0013-p08-offline-recovery.md) | Accepted | The field workspace keeps its own offline queue; no automatic retry after an unknown outcome |
| WCAG 2.2 AA | Standard | 1.4.1 use of colour, 2.3.3 animation from interactions, 2.4.3 focus order, 4.1.3 status messages |

File links and keys stay outside this public repository (ADR-0050, ADR-0053). The frozen "PPO - Design" file that holds the accepted System pages parts was not opened; the decision record and its captures were the source.

## 2. Conformance declaration

| Field | Declaration |
|---|---|
| Scope identity | Shared state parts for every page and the shell; no new route. System pages keeps `system:shell`, `route:/login` and `route:/`. No parent requirement ID is added or renamed; all 78 remain |
| Page type (r20) | Any page type: these parts sit inside it, or replace its content when the whole page cannot show |
| Reused components | Controls / Button, Link, Chip and Banner; Form / Review row and Save bar; the Info, Locked, Attention, Spinner, Saved, Plus and Filter icons. New in the library, all `Status: Proposed`: the six parts in section 3 |
| Incoming handover | Any read or save in progress, failed, refused, unanswered or offline |
| Outgoing handover | Home, Try again (a read), Check the outcome and Retry the same action (a save), Reload permitted view; access changes stay with Users and access (AD-01) |
| Departures | The items in section 6 |

## 3. What was drawn

**Page** "States · Loading, empty and errors" `162:37`: components section `162:41`; review board `165:115`.

**Variable added** to "PPO layout", which now holds 34: `state/panel-width` 560, the full-page message panel. The library holds 119 variables; [`docs/design/library-variables.json`](../design/library-variables.json) is updated.

**Text styles added:** Text / 28 Medium (Roboto Medium 28/36, the heading of a full-page message) and Text / Reference (Roboto Mono 12/16, support references and operation numbers). The library now has thirteen text styles.

**Components** (all `Status: Proposed`, in section `162:41`)

| Component | Node | Variants |
|---|---|---|
| State / Message panel | `162:135` | 6: Loading, Unavailable, No access, Error, Session changed, Could not start |
| State / Outcome banner | `162:219` | 6: Unknown, Checking, No receipt yet, Can't check, Saved, Not saved |
| State / Connection banner | `162:238` | 2: Offline, Back online |
| State / Inline notice | `163:139` | 5: Unavailable, Could not load, Loading, Not refreshed, Incomplete |
| State / Empty | `163:167` | 3: No records, No matches, All done |
| State / Placeholder | `163:172` | 4: Line, Short line, Block, Circle |

**Review board** `165:115`

| Card | Node | Holds |
|---|---|---|
| Page header | `165:116` | Status, owner, date, Dean's request, sources, contents |
| 1 · Choosing the state | `165:124` | Fourteen situations, the part each uses, what it says and its source |
| 2 · Loading | `165:263` | Opening the workspace; a register loading with placeholders and its count withheld; rules |
| 3 · Empty | `165:373` | Nothing yet, filtered to nothing, all done; rules |
| 4 · Could not load, not refreshed, incomplete | `166:144` | The page could not load; one part could not load; a refresh failed; a source is missing; rules |
| 5 · Access | `166:264` | A page that cannot be shown; a workspace not permitted; a part that cannot be shown; view only; rules |
| 6 · Outcome unknown | `166:347` | The six banner states; forms today and external sends; rules |
| 7 · Connection and session | `166:480` | Offline and back; session changed; could not start; where sign-in pages live; rules |
| 8 · Do and Don't | `167:373` | Three pairs |
| 9 · Values, sources and items to confirm | `167:453` | The table in section 5, the items in section 6, where the page is used, what is not here, change log |

The Read me page and the Foundations board were updated: the page index, rules 2 and 4, the variable, style and component lists and the next steps on Read me; a row in the layout table, two text-style specimens and the text-styles card title on Foundations.

## 4. Rules drawn

- **Choose by situation.** Card 1 maps fourteen situations to the part each uses. Every state carries words as well as colour.
- **Loading.** Only opening the workspace shows a message. Inside a page, the frame, headers, labels and actions are drawn for real and placeholders stand where values will be. Placeholders appear only once a read has taken longer than about 300 ms, so a fast read never flickers (S2). Counts, totals and badges wait for the read; 0 appears only after a successful read. "Loading…" is announced once; placeholders are hidden from screen readers and do not move.
- **Empty.** Empty is a successful read with nothing in it, never a failure. No records says what will appear and offers the first action; No matches names the filters that are on and offers Clear filters; All done says when the next thing is due. An icon, a heading, one sentence and at most one action; no illustration.
- **Could not load.** The message panel only when nothing on the page can show; otherwise an inline notice where the failing part would be. The last confirmed result stays. Try again repeats the read and never a save. A support reference when one exists; never stack traces, error codes or internal names.
- **Not refreshed.** The last good read stays, labelled "Shown as at" its time, with Try again. When that time is not today, the label names the day as well, such as "Shown as at Mon 9 Nov, 16:20" (S4). A failed refresh changes nothing.
- **Incomplete.** A value that could not be read is a dash, never a guess or zero; totals leave it out and the list says it may be incomplete.
- **Access.** Unavailable is the same for a missing record and one the person cannot see, for a page and for a part. A workspace not permitted names only the workspace and who to ask; there is no Request access button. View only says so once and names who can make the change. Nothing on these pages grants access.
- **Outcome unknown.** One banner for a save whose reply was lost: it shows the operation, holds new changes, and offers Check the outcome and Retry the same action, which replays the same request so nothing is created twice. It resolves to Saved or Not saved. PPO checks by itself only by reading, never by retrying. External sends whose local save is confirmed keep their own wording and have no Retry.
- **Connection and session.** Offline names the page, says what was read earlier may be out of date and that nothing can be saved; back online says PPO is reading again and nothing entered was lost. The field workspace keeps its own queue. A session change in another tab clears what was shown and unsaved forms, then reloads what is permitted. If the application cannot start, only the message, the reference and Try again show.

## 5. Values and sources

| Part | Value | Source |
|---|---|---|
| Message panel | 560 px (`state/panel-width`), 32 px padding, 40 px icon tile; heading in Text / 28 Medium; a support reference in Text / Reference with Copy; one or two actions; focus moves to the heading | System pages |
| Outcome banner | Full width; warning, neutral, success or danger surface with its icon; the operation in Text / Reference; Check the outcome and Retry the same action | System pages D7, D13, Q5 |
| Connection banner | Full width under the top bar or phone header; surface/hover; Info icon | System pages D8 |
| Inline notice | The state in words on a chip, a title and a sentence; Try again where it helps; line/soft rule below | System pages; Not refreshed and Incomplete new (S4, S5) |
| Empty | 440 px, centred: 32 px icon, 14 Medium heading, one sentence, at most one action | ReadState; new (S3) |
| Placeholder | surface/hover shapes: 12 px lines, blocks, 24 px circles; static; shown only after a read has taken about 300 ms | Time and Gantt pages; new (S2) |
| Not refreshed | "Shown as at 16:20" today; "Shown as at Mon 9 Nov, 16:20" on an earlier day | Time page; day new (S4) |
| Counts | Withheld while loading; 0 only after a successful read; incomplete totals say so | PT-29; NFR-05 |
| Announcements | Loading announced once; banners and notices announced when they appear; placeholders hidden from screen readers | System pages; WCAG 4.1.3 |

## 6. Confirmed — 11 November 2026

Asked for a recommendation on each open item, the answer recommended confirming all five as drawn, with refinements to S2 and S4. On 11 November 2026 Dean answered: "Confirm all sixteen as recommended, with the refinements" (these five, the five Gantt items and the six Forms items). Confirming S1 changes the Forms page: Form / Save bar's uncertain state takes the Outcome banner and its two actions ([Forms record](library-forms.md), section 4).

| ID | Item | Confirmed as drawn | Why it needed a decision |
|---|---|---|---|
| S1 | One outcome wording, forms included | Form / Save bar's uncertain state takes the Outcome banner and its two actions, replacing Confirm original save | System pages Q5 adopted one wording for every surface and listed Organisations' "Confirm original save" among the headings it replaces; the Create forms pattern, accepted the same day, kept the form's own wording (D7) |
| S2 | Placeholders inside pages | The frame, labels and actions are drawn and placeholders stand in for values; counts wait; the message panel only while the workspace opens. **Refinement:** placeholders appear only once a read has taken longer than about 300 ms, so a fast read never flickers | System pages draws only the workspace message; the Time and Gantt pages draw placeholders. This makes the split a shared rule |
| S3 | Plain empty states | An icon, a heading, one sentence and at most one action; no illustration | New: no accepted page sets an empty-state pattern |
| S4 | Not refreshed | The last good read stays, "Shown as at" its time, with Try again. **Refinement:** when that time is not today the label names the day too, such as "Shown as at Mon 9 Nov, 16:20" | Drawn on the Time page; new as a shared part |
| S5 | Incomplete | A dash in place of a value that could not be read, a note, and totals that leave it out | Gantt PS13 and NFR-05 cover it; new as a shared part |

## 7. Not done and open

- **Page acceptance and publishing.** As for the other library pages: the components stay `Status: Proposed` until Dean accepts the page, and the library is not published.
- **Module files unchanged.** The frozen "PPO - Design" file keeps the accepted System pages and its parts. Module pages switch to these parts after acceptance and publishing; the built pages change only through reviewed application work, as the System pages decision's build needs list.
- **Figma not yet changed.** The Figma file still shows the drawing from before 11 November 2026. On 11 November 2026 the Figma connection refused further edits because the account's daily limit for tool calls was reached (200 a day on a Professional Full seat). The following are made once it allows:
  - card 9 and the page header list the confirmed items;
  - card 2 and Placeholder's description gain the 300 ms rule (S2);
  - the Not refreshed notice and card 4 gain the day (S4);
  - Form / Save bar's Uncertain variants on the Forms page take the Outcome banner and its two actions (S1).
- **Not here.** Sign-in, session expired and signed out (System pages and the login template); Toast (Controls); the field workspace's offline queue (ADR-0013); Request access (System pages D4, outside the baseline); an unknown-outcomes indicator and reference lookup (System pages ideas I5 and I6).
- **No proof beyond the design.** No prototype links were set. Announcements, focus on the message heading and reduced-motion behaviour need the browser proof once code exists.
- **Code.** No application code, component binding, register or page guide changed. `state/panel-width` has no CSS property yet.
- **Next in the recommended order.** Record, then Phone patterns, then the shell and page template.

## 8. Checks

- The components section and every card of the review board were rendered and inspected; no defect needed a fix after the first render.
- A structural read of the States page (1,135 nodes, 165 instances) found, outside instances, no solid fill or stroke without a variable, no text without a text style, no shadow without an effect style, no plain corner radius, no layer named as a default and no component set without a status line.
- Variables read back from the file: 66 in "PPO colour", 34 in "PPO layout", 11 in "Gantt colour", 3 in "Grid density" and 5 in "Control size" (119). Roboto Mono was confirmed available before Text / Reference was made.
- The Read me texts were read back after their update; the Foundations text-styles card was rendered.
- Repository checks for this change: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py`, `python3 scripts/check_design_tokens.py`.
