---
document_id: PPO-LIBRARY-FORMS-PROP
date: 2026-11-10
owner: Dean Fiedler
status: Proposed design drawn in the private Figma file "PPO - Library" on 10 November 2026 at Dean's request; six items in section 6 await Dean's confirmation; every component is Status Proposed until Dean accepts the page; nothing published from the library; no application code, route, migration, permission or deployment; every record shown is synthetic
versioning: git
---

# Forms · Fields and validation in PPO - Library — proposal

**Owner:** Dean Fiedler · **Date:** 10 November 2026 · **Status:** Proposed. Six items in [section 6](#6-to-confirm) await Dean's confirmation; the page awaits acceptance.

After the [Gantt page](library-gantt.md), the last in the order Dean had accepted, Dean asked: "Are there any other features, interactions, etc., that should be included in this Figma file?" The answer named the groups that section 5 of the [design-to-build standard](../standards/design-to-build-standard.md) requires and the library did not yet hold: forms, states, record, phone patterns, and the shell with the page template. It recommended starting with forms. Dean answered: "Proceed however you believe is the most professional." This record covers that page, named "Forms · Fields and validation".

The page brings the accepted [Create forms pattern](create-forms-pattern-figma-design.md) (PPO-CREATE-FORMS-FIGMA-DEC) into the library as shared parts, with the field, choice, date, validation and saving rules every form uses. That pattern stays the authority for the six create forms it draws; this page holds the parts and rules they share.

This record is a **proposal**. Drawing the page does not accept it, publish it or change any module file.

## 1. Sources

| Source | Status of source | Use |
|---|---|---|
| [Create forms pattern](create-forms-pattern-figma-design.md) (PPO-CREATE-FORMS-FIGMA-DEC) and its [retained captures](../reference/ui/create-forms-design-r01/README.md) | Owner-accepted, 1 November 2026 | Search first, keep unknowns explicit, review, save, inspect, continue; one field set for quick add and the full form (D1, D2); check before creating as a prompt (D3, Q2, Q7); Not known yet with a reason (D4, D15, D17, Q4); review before save (D5); saved notice and next step (D6); uncertain save that repeats the original request (D7); phone header, 48 px main action and 16 px inputs (D8); long values wrap (D14); app leave dialog (D16, Q13); the Notice, Match card, Review row and Choice option parts; the loading, failed, empty, stale, saving, not-permitted and leave states |
| [Controls in PPO - Library](library-controls.md) and the accepted Sales forms | Proposed; items confirmed | The 36 px field, label 12 Medium, focus and error treatment, Checkbox, Banner, Dialog, Button, Link, Chip |
| Built application: `src/components/shared-create-form.tsx`, `ErrorNotice`, the lookup comboboxes, `src/components/ui/controls.css`, `src/app/globals.css` (`.field`), `src/app/mobile-layout.css` | Repository; built | 44 px fields and controls (`--ppo-control-height`), 16 px text in phone inputs, an error summary that takes focus and links to each field, lookups as comboboxes with a match count |
| [Grid](library-grid-table-interactions.md), [Time](library-time.md) and [Gantt](library-gantt.md) records | Proposed; items confirmed | Quick editors in registers; the time zone named; the task panel after a drop |
| The accepted Sales file's interaction states page | Accepted, 9 November 2026 | Read only to check for form parts: it draws no field, radio, switch or date picker component, and its notes keep address lookup in the module files |
| WCAG 2.2 AA | Standard | 1.3.1 info and relationships, 1.4.1 use of colour, 2.4.3 focus order, 2.5.8 target size, 3.3.1 error identification, 3.3.2 labels or instructions, 3.3.3 error suggestion |

File links and keys stay outside this public repository (ADR-0050, ADR-0053). The frozen "PPO - Design" file that holds the accepted pattern was not opened; the decision record and its captures were the source.

## 2. Conformance declaration

| Field | Declaration |
|---|---|
| Scope identity | Shared form parts and rules used by every create and edit form; no new route. Each form keeps its host's scope and route, as the Create forms pattern records. No parent requirement ID is added or renamed; all 78 remain |
| Page type (r20) | Form / guided workflow, opened over or from a Register / worklist. Phone: a full-screen form |
| Reused components | Controls / Field, Checkbox, Checkbox field, Button, Link, Icon button, Chip, Banner, Dialog, Menu divider; the Attention, Plus, Spinner and Calendar icons. New in the library, all `Status: Proposed`: the ten Form parts in section 3, Controls / Radio and two chevron icons |
| Incoming handover | Any page that creates or edits a record opens its form from these parts |
| Outgoing handover | The saved record and its next step, as each host page decides |
| Departures | The items in section 6 |

## 3. What was drawn

**Page** "Forms · Fields and validation" `140:37`: components section `140:39`; review board `146:176`.

**Variables and modes added.** "Control size" gains a third mode, Touch, and two typography variables; "PPO layout" gains three form variables and now holds 33. The library holds 118 variables; [`docs/design/library-variables.json`](../design/library-variables.json) is updated.

| Variable | Value | Use |
|---|---|---|
| `control/height` | Touch 44 (Medium 32, Small 28) | Buttons, icon buttons and filter chips in Touch |
| `control/field-height` | Touch 44 (Medium 36, Small 32) | Minimum height of a field; it grows when its value wraps |
| `control/padding-x` | Touch 12 (Medium 12, Small 10) | Left and right padding in Touch |
| `control/text-size` | 13 / 13 / 16 | Text inside a control; 16 px in Touch so a phone does not zoom on focus |
| `control/line-height` | 18 / 18 / 24 | Line height of text inside a control |
| `form/check-width` | 380 | Check and review column beside a full form |
| `form/panel-width` | 680 | Quick-add panel over its host |
| `form/phone-action` | 48 | Main action on a phone form |

**Text styles added:** Text / Control (Roboto Regular, size and line height bound to the two control variables, so it follows the Control size mode) and Text / Section label (11 Medium, capitals, 6% tracking). The library now has eleven text styles.

**Components** (all `Status: Proposed`, in section `140:39`)

| Component | Node | Variants and options |
|---|---|---|
| Form / Section header | `140:40` | One component. Options: Title, Show description, Description |
| Form / Error summary | `140:43` | One component. Options: Message, Show item 2. Exposed: Item 1, Item 2 (Controls / Link) |
| Form / Review row | `140:64` | 3: Value, Unknown, Pending. Options: Label, Value |
| Form / Match card | `140:94` | 2: Default, Chosen. Options: Reason, Title. Exposed: Open, Use |
| Form / Choice | `140:155` | 8: Style (Row, Card) by State (Off, On, Focus, Disabled). Options: Label, Show description, Description |
| Form / Option | `142:85` | 7: Match (Rest, Highlighted, Selected), Not known (Rest, Highlighted), Create (Rest, Highlighted). Options: Label, Meta, Create label |
| Form / Option list | `142:142` | 4: Results, Loading, Failed, Empty |
| Form / Day | `142:155` | 6: Rest, Hover, Today, Selected, Outside, Unavailable. Option: Day |
| Form / Date picker | `142:156` | One component |
| Form / Save bar | `142:353` | 8: Layout (Desktop, Phone) by State (Ready, Disabled, Saving, Uncertain). Exposed: Cancel, Primary |

**Changed on the Controls page** (`46:2031`), all still `Status: Proposed`:
- **Controls / Field** `51:249` now has 24 variants: a Date type (with the Calendar icon) joins Text, Select and Textarea. The asterisk became the requirement in words, with a new Requirement option ("Required" or "Or say why unknown"). The hint (the Helper option) moved from under the input to under the label. The input grows from `control/field-height` when its value wraps, and its text uses Text / Control. The error message wraps to the field's width.
- **Controls / Radio** `137:654` is new: 8 variants, State (Off, On, Disabled, Focus) by Surface (White, Tint), matching Controls / Checkbox.
- **Controls / Banner** `50:240`: the message wraps and the banner grows from 40 px, and a Dismiss option can hide the close button. Single-line banners keep their 40 px.
- The Controls review board's Field and Banner text, its values table and its "Not yet here" list were updated to match, and the Controls section and review board were re-spaced for the taller Field set.

**Icons page:** Icon / Chevron left `141:37` and Icon / Chevron right `141:39`, for the date picker and phone headers. The library holds 24 icons.

**Review board** `146:176`

| Card | Node | Holds |
|---|---|---|
| Page header | `146:177` | Status, owner, date, Dean's request, sources, contents |
| 1 · Anatomy of a form | `146:185` | A full Add deal form with the check and review column and the save bar, nine numbered parts and their legend |
| 2 · Fields | `149:310` | Required in words, hint and error, long values wrapping, disabled and read-only, Touch size; rules |
| 3 · Choosing a value | `149:448` | Search picker, Not known yet with a reason, empty, loading and failed lists, choices, yes or no; rules |
| 4 · Dates and times | `151:490` | Field and picker, no date yet, date or date and time, time zone; rules |
| 5 · Check before creating | `151:705` | A possible duplicate, used instead, no match with review before save; rules |
| 6 · Validation | `151:783` | The error summary and field errors after Save, writing the message; rules |
| 7 · Saving and leaving | `152:748` | Saving, saved with the next step, not sure it saved, refused because something changed, leave with unsaved entries, limited by permission; rules |
| 8 · Sizes and layouts | `152:970` | Quick add, full form and 1024 px as diagrams; a 390 px phone form in Touch size; rules |
| 9 · Do and Don't | `155:929` | Three pairs |
| 10 · Values, sources and items to confirm | `155:1037` | The table in section 5, the items in section 6, where the page is used, what is not here, change log |

The Read me page and the Foundations board were updated: the page index, rules 2 and 4, the variable, style and component lists and the next steps on Read me; the Touch column and two rows in the Control size table, three form rows in the layout table, and two text-style specimens on Foundations.

## 4. Rules drawn

- **One field component.** Text, select, date and long text share one component in six states. The label sits above, in sentence case; placeholder text is an example, never the label.
- **Requirement in words.** "Required", or "Or say why unknown" where a reason may replace the value, sits beside the label; optional fields carry no tag. The form says what the server requires (D13, D17).
- **Hint first, error last.** A hint sits under the label, before the field; an error sits under the field with the Attention icon. Both are tied to the field for screen readers.
- **Long values wrap.** The field grows; a value is never cut off with an ellipsis (D14).
- **Choosing.** Records and long lists use a search picker that lists only permitted records and counts the matches. Five or fewer options show as choices with radios; six to ten use a select; yes or no is a checkbox. Not known yet is a deliberate option that asks why, never a blank or a made-up value (D4, D15). Create and return keeps every entry.
- **Dates.** Day first with the day's name, such as Tue 20 Oct 2026; typed dates such as 20/10/2026 are accepted. The picker starts on Monday, outlines today and is optional. A time row appears only when the value has a time; times are 24-hour and the time zone is named. No date yet is a checkbox, and the review says Date needed.
- **Check before creating.** For organisations, people, leads and deals, a right-hand column lists records that may be the same: why each matched, its title and number, and Open or Use this record. It is a prompt, never a block, and nothing merges (D3, Q2, Q7). With no match it says so honestly.
- **Review before save.** The column, or the sentence above the buttons on quick add and phones, lists what will be saved in plain words, unknowns included (D5).
- **Validation.** Problems are reported on Save, all at once: a summary that counts them and links to each field, which takes focus, and a message under each field. A value that cannot be read, such as a date, is flagged when the person leaves the field. Messages say what to do; nothing entered is lost. The server checks everything again and its refusals use the same fields and words.
- **Saving.** Entries lock while saving and the status is announced. Saved names the record, its number, version, who and when, and offers the next step (D6). If the outcome is unknown, the only action is Confirm original save, which repeats the same request; Cancel is not offered until the outcome is known (D7). A refusal says what changed and keeps every entry.
- **Leaving.** Cancel, Back, closing a panel or leaving the page with unsaved entries opens an app dialog in plain words; closing the tab keeps the browser's prompt (D16, Q13). Esc closes a panel through the same check, except while saving or unsure.
- **Permissions.** Only permitted options are listed; a disabled field says what unlocks it; Save is disabled only when nothing could be saved, and the save bar says why.
- **Sizes.** Quick add is a 680 px panel over its host, only where the accepted page has + (Q1). A full form has the check in a 380 px column; at 1024 px and 200% zoom the check moves above the form. On a phone the form fills the screen in Touch size, Back replaces Cancel, the main action is 48 px and pickers open as sheets (D8, Q3).

## 5. Values and sources

| Part | Value | Source |
|---|---|---|
| Field | Label 12 Medium; input 36 px (Small 32, Touch 44); 6 px corners; 1 px line/control; text in Text / Control, 13/18 or 16/24 in Touch | Sales forms; Touch new (F1) |
| Requirement | "Required" or "Or say why unknown" beside the label, 12 Regular text/secondary; optional fields untagged | Create forms; replaces the asterisk (F2) |
| Hint and error | Hint under the label; error under the field with the Attention icon, wrapping | Create forms; ErrorNotice; new order (F3) |
| Section | Card on surface/canvas, line/soft edge, 8 px corners, 16 px padding and gaps; heading in Text / Section label | Create forms D1 |
| Columns | Two for short values on desktop; one on phones and for long text | Create forms |
| Check column | 380 px (`form/check-width`); stacked above at 1024 px | Create forms D5 |
| Quick add | 680 px panel (`form/panel-width`) over its host | Create forms Q1 |
| Save bar | Sentence, Cancel, main action; phone main action 48 px (`form/phone-action`) | Create forms D5, D8 |
| Search picker | 400 px list; options 36 px (Touch 44); Elevation / Popover; Not known yet and Create | Create forms D4, D15; lookup |
| Error summary | Danger tone and icon, a count, a link per field; focus moves to it | ErrorNotice |
| Saving | Locked entries; Uncertain offers only Confirm original save | Create forms D7 |
| Radio and Choice | 16 px radio matching Checkbox; Choice as Row or Card | New (F4) |
| Date picker | 264 px; 32 px days; Monday first; time row when needed; zone named | New (F5) |
| Banner | The message wraps from 40 px; Dismiss can be turned off | Controls; changed here |

## 6. To confirm

These six items need Dean's decision. Card 10 lists them.

| ID | Item | As drawn | Why it needs a decision |
|---|---|---|---|
| F1 | Field height | 36 px on desktop, as the Sales forms and this library's Controls; 44 px with 16 px text in a new Touch size for phones and touch tablets | The Create forms pattern and the built app use 44 px on desktop too; the Sales forms, accepted later, use 36 px |
| F2 | Requirement in words | "Required" and "Or say why unknown" beside the label replace the asterisk on Controls / Field; optional fields carry no tag | Changes a Controls component drawn earlier, to follow the accepted Create forms pattern |
| F3 | Hint under the label | The hint moves from under the field to under the label; the error stays under the field | Changes Controls / Field; the accepted pattern draws both positions |
| F4 | Radio and Choice | Controls / Radio and Form / Choice; five or fewer options show as choices | New: no accepted page in the library's sources draws a radio, and the accepted Choice option part was not opened |
| F5 | Date picker | Monday first, typing always works, a time row only when the value has a time, the time zone named | New: no accepted page draws a date picker |
| F6 | Save stays available | Save is disabled only when nothing could be saved, and the save bar says why; otherwise pressing it lists what is needed | The accepted pattern draws both a disabled Save (permission) and errors after Save; this states when each applies |

## 7. Not done and open

- **Page acceptance and publishing.** As for the other library pages: the components stay `Status: Proposed` until Dean accepts the page, and the library is not published.
- **Module files unchanged.** The frozen "PPO - Design" file keeps the accepted Create forms page and its local parts (Create / Notice, Match card, Review row). Module pages switch to these parts after acceptance and publishing; the built forms change only through reviewed application work.
- **Not here.** Address lookup (kept in module files, as the Grid record notes); attachments and uploads; rich text; multi-step wizards such as Create estimate; inline editing in registers (Grid page); a switch, a search field, a segmented control and pagination.
- **No proof beyond the design.** No prototype links were set on the Form parts. Focus order, announcements, keyboard behaviour in the picker and the date picker, and touch sizes need the browser proof once code exists.
- **Code.** No application code, component binding, register or page guide changed. The five new variables have no CSS property yet; the built app's `--ppo-control-height` (44 px) matches the Touch value, not Medium.
- **Next in the recommended order.** States, then Record, then Phone patterns, then the shell and page template. The [States page](library-states.md) followed; its item S1 asks whether the uncertain state of Form / Save bar should take the System pages "Outcome unknown" banner and wording instead of Confirm original save.

## 8. Checks

- The components section and every card of the review board were rendered and inspected. Defects found while drawing were fixed: components whose height collapsed after a resize; variants that shared the wrong default text (option labels, review values, save-bar sentences); a radio focus ring clipped by its holder; the Date type losing its options when copied from Select; field errors that did not wrap; banners that cut their message to one line; a column of card 2 clipped by 2 px; badges touching their labels in card 1; and a Foundations table pushed past its card.
- The two earlier pages that use Controls / Field and Banner most, the Gantt task panel (card 6) and the Time planning form (card 6), were rendered after the changes: both show the requirement in words and keep their layout.
- A structural read of the Forms page (1,713 nodes, 338 instances) found, outside instances, no solid fill or stroke without a variable, no text without a text style, no shadow without an effect style, no plain corner radius and no component without a status line. Nine frames named "Text" were renamed. The changed Controls components (Field, Radio, Banner) passed the same read.
- Variables read back from the file: 66 in "PPO colour", 33 in "PPO layout", 11 in "Gantt colour", 3 in "Grid density" and 5 in "Control size" with modes Medium, Small and Touch (118). Text / Control was read back with its size and line height bound to the two variables.
- The Read me texts were read back after their update and the card rendered; the Foundations tables and specimens were rendered.
- Repository checks for this change: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py`, `python3 scripts/check_design_tokens.py`.
